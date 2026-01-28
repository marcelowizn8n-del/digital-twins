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
  private static readonly BMI_MIN = 15;
  private static readonly BMI_MAX = 40;

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
    
    // Base modifiers from BMI - valores mais sutis (max ~0.3)
    let weightModifier = normalizedBMI * 0.4;
    let abdomenModifier = normalizedBMI * 0.35;
    let muscleModifier = 0.3; // Baseline muscle mass
    let postureModifier = Math.min(0.25, (input.age - 30) / 160); // Age-based posture (mais sutil)
    
    // Disease-specific effects - valores reduzidos para visualização realista
    let diabetesEffect = 0;
    let heartDiseaseEffect = 0;
    let hypertensionEffect = 0;

    // Apply disease modifiers per clinical mapping rules (valores mais sutis)
    for (const code of input.diseaseCodes) {
      switch (code) {
        case 'E11': // Diabetes Type 2
          weightModifier += 0.05;
          abdomenModifier += 0.08;
          diabetesEffect = 0.3; // Reduzido de 1.0 para 0.3
          break;
        case 'I10': // Hypertension
          weightModifier += 0.03;
          abdomenModifier += 0.04;
          muscleModifier -= 0.02;
          hypertensionEffect = 0.2; // Reduzido de 1.0 para 0.2
          break;
        case 'I25': // Heart Disease
          weightModifier += 0.05;
          postureModifier += 0.1;
          heartDiseaseEffect = 0.25; // Reduzido de 1.0 para 0.25
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
