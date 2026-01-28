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
    
    // Base modifiers from BMI
    let weightModifier = normalizedBMI;
    let abdomenModifier = normalizedBMI * 0.8;
    let muscleModifier = 0.5; // Baseline muscle mass
    let postureModifier = Math.min(0.5, (input.age - 30) / 80); // Age-based posture
    
    // Disease-specific effects
    let diabetesEffect = 0;
    let heartDiseaseEffect = 0;
    let hypertensionEffect = 0;

    // Apply disease modifiers per clinical mapping rules
    for (const code of input.diseaseCodes) {
      switch (code) {
        case 'E11': // Diabetes Type 2
          weightModifier += 0.12;
          abdomenModifier += 0.18;
          diabetesEffect = 1;
          break;
        case 'I10': // Hypertension
          weightModifier += 0.08;
          abdomenModifier += 0.10; // waist/abdomen correlation
          muscleModifier -= 0.05;
          hypertensionEffect = 1;
          break;
        case 'I25': // Heart Disease
          weightModifier += 0.15;
          postureModifier += 0.3;
          heartDiseaseEffect = 1;
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
