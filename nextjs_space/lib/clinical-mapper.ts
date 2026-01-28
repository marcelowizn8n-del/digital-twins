// ClinicalToBodyMapper - Evidence-based clinical parameter calculation

export interface PatientInput {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: 'M' | 'F';
  diseaseCodes: string[];
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
  private static readonly BMI_MIN = 18;  // IMC mínimo saudável
  private static readonly BMI_MAX = 45;  // IMC de obesidade mórbida

  // Calculate BMI and normalize to 0-1 scale
  private static calculateNormalizedBMI(heightCm: number, weightKg: number): number {
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    // Clamp and normalize to 0-1
    const clamped = Math.max(this.BMI_MIN, Math.min(this.BMI_MAX, bmi));
    return (clamped - this.BMI_MIN) / (this.BMI_MAX - this.BMI_MIN);
  }

  // Clamp value to 0-1 range
  private static clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  static calculate(input: PatientInput): MorphTargets {
    const normalizedBMI = this.calculateNormalizedBMI(input.heightCm, input.weightKg);
    
    // Base modifiers from BMI - valores aumentados para variação visível
    // normalizedBMI vai de 0 (IMC 18) a 1 (IMC 45)
    let weightModifier = normalizedBMI * 0.7;  // Max 0.7 só do IMC
    let abdomenModifier = normalizedBMI * 0.8; // Abdômen responde mais ao peso
    let muscleModifier = 0.4 - (normalizedBMI * 0.2); // Menos músculo com mais peso
    let postureModifier = Math.min(0.4, (input.age - 25) / 100); // Age-based posture
    
    // Disease-specific effects - valores aumentados para serem visíveis
    let diabetesEffect = 0;
    let heartDiseaseEffect = 0;
    let hypertensionEffect = 0;

    // Apply disease modifiers per clinical mapping rules
    for (const code of input.diseaseCodes) {
      switch (code) {
        case 'E11': // Diabetes Type 2 - acúmulo abdominal característico
          weightModifier += 0.08;
          abdomenModifier += 0.15;  // Diabetes causa mais gordura visceral
          diabetesEffect = 0.5;
          break;
        case 'I10': // Hypertension - edema leve
          weightModifier += 0.05;
          abdomenModifier += 0.06;
          muscleModifier -= 0.05;
          hypertensionEffect = 0.4;
          break;
        case 'I25': // Heart Disease - postura afetada
          weightModifier += 0.06;
          postureModifier += 0.15;  // Postura mais curvada
          heartDiseaseEffect = 0.5;
          break;
      }
    }

    return {
      Weight: this.clamp(weightModifier),
      AbdomenGirth: this.clamp(abdomenModifier),
      MuscleMass: this.clamp(muscleModifier),
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
