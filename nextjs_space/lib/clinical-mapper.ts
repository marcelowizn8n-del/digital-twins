// ClinicalToBodyMapper - Evidence-based clinical parameter calculation
// FIDELIDADE AOS DADOS: Mapeia dados reais do paciente para morph targets

export interface PatientInput {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: 'M' | 'F';
  diseaseCodes: string[];
  // Dados opcionais para maior fidelidade
  waistCm?: number;
  physicalActivityLevel?: string;
}

export interface MorphTargets {
  Weight: number;
  AbdomenGirth: number;
  MuscleMass: number;
  Posture: number;
  DiabetesEffect: number;
  HeartDiseaseEffect: number;
  HypertensionEffect: number;
}

export class ClinicalToBodyMapper {
  // Ranges baseados em dados epidemiológicos reais
  // IMC
  private static readonly BMI_MIN = 18.5;   // Limite inferior saudável
  private static readonly BMI_MAX = 60;     // Calibração: 1.0 no modelo representa Obesidade Extrema (IMC 60)

  // Circunferência abdominal (cm) - valores de referência OMS
  private static readonly WAIST_MIN_M = 70;   // Homem magro
  private static readonly WAIST_MAX_M = 160;  // Calibração: 1.0 representa 160cm
  private static readonly WAIST_MIN_F = 60;   // Mulher magra
  private static readonly WAIST_MAX_F = 150;  // Calibração: 1.0 representa 150cm

  // Normaliza valor para 0-1 com base no range
  private static normalize(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  // Clamp value to 0-1 range
  private static clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  static calculate(input: PatientInput): MorphTargets {
    const heightM = input.heightCm / 100;
    const bmi = input.weightKg / (heightM * heightM);

    // === WEIGHT: BMI Tiered Morphing ===
    // Refined logic for visual accuracy:
    // Tier 1 (BMI < 25): Linear sensitivity (Show every kg)
    // Tier 2 (BMI 25-35): Power Curve (Focus on abdominal accumulation)
    // Tier 3 (BMI > 35): Logarithmic Saturation (Model limits)

    let weightModifier = 0;

    if (bmi < 25) {
      // Linear mapping for normal weight to show nuances
      weightModifier = this.normalize(bmi, 15, 25) * 0.3; // Maps 15-25 to 0.0-0.3
    } else if (bmi < 35) {
      // Overweight/Obese I: Accelerated abdominal gain
      // Maps 25-35 to 0.3-0.7
      const t = this.normalize(bmi, 25, 35);
      weightModifier = 0.3 + (Math.pow(t, 0.8) * 0.4);
    } else {
      // Obese II/III: Saturation
      // Maps 35-60 to 0.7-1.0
      const t = this.normalize(bmi, 35, 60);
      weightModifier = 0.7 + (Math.log10(1 + t * 9) / 1) * 0.3; // Log curve
    }

    // === ABDOMEN: Uses REAL Waist or Estimated ===
    let abdomenModifier: number;
    if (input.waistCm) {
      const waistMin = input.sex === 'M' ? this.WAIST_MIN_M : this.WAIST_MIN_F;
      const waistMax = input.sex === 'M' ? this.WAIST_MAX_M : this.WAIST_MAX_F;

      const normalizedWaist = this.normalize(input.waistCm, waistMin, waistMax);

      // Cintura reage mais rápido que o peso geral em SM
      abdomenModifier = Math.pow(normalizedWaist, 0.7);

      // BOOST para Síndrome Metabólica Central (barriga de chopp)
      // Se BMI < 30 mas Cintura alta -> Enfatizar barriga
      if (bmi < 30 && normalizedWaist > 0.5) {
        abdomenModifier *= 1.2;
      }
    } else {
      // Estimativa baseada em BMI se sem cintura
      abdomenModifier = weightModifier * 0.9;
    }

    // === MUSCLE MASS: Baseado em atividade física (Ajustado pelo BMI) ===
    let muscleModifier = 0.25;
    if (input.physicalActivityLevel) {
      switch (input.physicalActivityLevel) {
        case 'sedentary': muscleModifier = 0.1; break;
        case 'light': muscleModifier = 0.2; break;
        case 'moderate': muscleModifier = 0.35; break;
        case 'active': muscleModifier = 0.55; break;
        case 'very_active': muscleModifier = 0.75; break;
      }
    }
    // Efeito de "esconder" músculo sob gordura (visualmente)
    muscleModifier = muscleModifier * (1 - Math.min(0.5, normalizedBMI * 0.5));

    // === POSTURE: Baseado na idade ===
    let postureModifier = 0;
    if (input.age > 45) {
      postureModifier = Math.min(0.4, (input.age - 45) / 100);
    }

    // === EFEITOS DE DOENÇAS (sutis) ===
    let diabetesEffect = 0;
    let heartDiseaseEffect = 0;
    let hypertensionEffect = 0;

    for (const code of input.diseaseCodes) {
      switch (code) {
        case 'E11': // Diabetes Type 2
          diabetesEffect = 0.4;
          abdomenModifier = Math.min(1, abdomenModifier + 0.1);
          weightModifier = Math.min(1, weightModifier + 0.05);
          break;
        case 'I10': // Hipertensão
          hypertensionEffect = 0.35;
          weightModifier = Math.min(1, weightModifier + 0.04);
          break;
        case 'I25': // Doença cardíaca
          heartDiseaseEffect = 0.4;
          postureModifier = Math.min(1, postureModifier + 0.15);
          muscleModifier = Math.max(0, muscleModifier - 0.08);
          break;
      }
    }

    // === RESULTADO FINAL ===
    // Aplicar limite de segurança para evitar que o modelo "quebre" nas costuras (pescoço, pulsos, cintura)
    // Modelos modulares tendem a separar vértices se os morph targets passarem de 0.8 ou 0.9
    const SAFETY_CAP = 0.85;

    return {
      Weight: this.clamp(weightModifier * SAFETY_CAP), // Limita a 85% para evitar gaps
      AbdomenGirth: this.clamp(abdomenModifier * SAFETY_CAP),
      MuscleMass: this.clamp(muscleModifier), // Músculo geralmente deforma menos, pode manter
      Posture: this.clamp(postureModifier),
      DiabetesEffect: diabetesEffect,
      HeartDiseaseEffect: heartDiseaseEffect,
      HypertensionEffect: hypertensionEffect,
    };
  }

  // Interpolate between two morph target states
  static interpolate(start: MorphTargets, end: MorphTargets, t: number): MorphTargets {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    return {
      Weight: lerp(start.Weight, end.Weight, t),
      AbdomenGirth: lerp(start.AbdomenGirth, end.AbdomenGirth, t),
      MuscleMass: lerp(start.MuscleMass, end.MuscleMass, t),
      Posture: lerp(start.Posture, end.Posture, t),
      DiabetesEffect: lerp(start.DiabetesEffect, end.DiabetesEffect, t),
      HeartDiseaseEffect: lerp(start.HeartDiseaseEffect, end.HeartDiseaseEffect, t),
      HypertensionEffect: lerp(start.HypertensionEffect, end.HypertensionEffect, t),
    };
  }
}
