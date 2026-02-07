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
  // Bioimpedance Data (0-100 scale for %)
  bioImpedanceFat?: number;      // Body Fat %
  bioImpedanceMuscle?: number;   // Muscle Mass % or kg (We'll treat as % if > 20, else kg and convert)
  bioImpedanceVisceral?: number; // Visceral Fat Rating (1-59)
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
    // IMC 18.5 = 0%, IMC 60 = 100%
    const normalizedBMI = this.normalize(bmi, this.BMI_MIN, this.BMI_MAX);

    // === WEIGHT: BMI vs Bioimpedance ===
    let weightModifier = 0;

    if (input.bioImpedanceFat !== undefined && input.bioImpedanceFat > 0) {
      // PRECISÃO: Usar % de Gordura Real
      // Homens: Essencial 2-5%, Atleta 6-13%, Fitness 14-17%, Médio 18-24%, Obeso 25%+
      // Mulheres: Essencial 10-13%, Atleta 14-20%, Fitness 21-24%, Médio 25-31%, Obeso 32%+

      const fat = input.bioImpedanceFat;
      let targetFatMin = 10;
      let targetFatMax = 50; // 50% de gordura é muito alto (obesidade mórbida)

      if (input.sex === 'M') {
        targetFatMin = 5;
        targetFatMax = 40;
      } else {
        targetFatMin = 15;
        targetFatMax = 50;
      }

      weightModifier = this.normalize(fat, targetFatMin, targetFatMax);

    } else {
      // FALLBACK: Usar BMI
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
    }

    // === ABDOMEN: Visceral Fat vs Waist vs BMI ===
    let abdomenModifier: number;

    if (input.bioImpedanceVisceral !== undefined && input.bioImpedanceVisceral > 0) {
      // PRECISÃO MÁXIMA: Gordura Visceral (Rating 1-59)
      // 1-12: Saudável
      // 13-59: Excessivo (Barriga proeminente)

      const visceral = input.bioImpedanceVisceral;
      // Normalizar: 1 (min) a 20 (muito alto)
      // Mapear 1-10 -> 0.0 - 0.4 (barriga liza/normal)
      // Mapear 10-20 -> 0.4 - 1.0 (barriga globosa)

      if (visceral <= 10) {
        abdomenModifier = this.normalize(visceral, 1, 10) * 0.4;
      } else {
        abdomenModifier = 0.4 + this.normalize(visceral, 10, 25) * 0.6;
      }

    } else if (input.waistCm) {
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

    // === MUSCLE MASS: Bioimpedance vs Activity ===
    let muscleModifier = 0.25;

    if (input.bioImpedanceMuscle !== undefined && input.bioImpedanceMuscle > 0) {
      // PRECISÃO: Massa Muscular
      // Pode vir em % ou KG. Tentar inferir.
      let musclePercent = input.bioImpedanceMuscle;

      // Se for > 60 provavelmente é KG (assumindo pessoa média), mas em % seria impossível para a maioria.
      // Vamos assumir que se for > 55 é KG e converter para % aproximada
      if (musclePercent > 55) {
        musclePercent = (input.bioImpedanceMuscle / input.weightKg) * 100;
      }

      // Homem: 30-40% Normal, 40-50% Alto, 50%+ Atleta
      // Mulher: 25-30% Normal, 30-35% Alto, 35%+ Atleta
      let minMus = 30, maxMus = 50;
      if (input.sex === 'F') { minMus = 25; maxMus = 40; }

      muscleModifier = this.normalize(musclePercent, minMus, maxMus);

    } else if (input.physicalActivityLevel) {
      switch (input.physicalActivityLevel) {
        case 'sedentary': muscleModifier = 0.1; break;
        case 'light': muscleModifier = 0.2; break;
        case 'moderate': muscleModifier = 0.35; break;
        case 'active': muscleModifier = 0.55; break;
        case 'very_active': muscleModifier = 0.75; break;
      }
      // Efeito de "esconder" músculo sob gordura (visualmente)
      muscleModifier = muscleModifier * (1 - Math.min(0.5, normalizedBMI * 0.5));
    } else {
      // Default fallback
      muscleModifier = 0.25 * (1 - Math.min(0.5, normalizedBMI * 0.5));
    }


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
          // Se não usou bioimpedância, ajustar estimativas
          if (!input.bioImpedanceVisceral) abdomenModifier = Math.min(1, abdomenModifier + 0.1);
          if (!input.bioImpedanceFat) weightModifier = Math.min(1, weightModifier + 0.05);
          break;
        case 'I10': // Hipertensão
          hypertensionEffect = 0.35;
          if (!input.bioImpedanceFat) weightModifier = Math.min(1, weightModifier + 0.04);
          break;
        case 'I25': // Doença cardíaca
          heartDiseaseEffect = 0.4;
          postureModifier = Math.min(1, postureModifier + 0.15);
          if (!input.bioImpedanceMuscle) muscleModifier = Math.max(0, muscleModifier - 0.08);
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
