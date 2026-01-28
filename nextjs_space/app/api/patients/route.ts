export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ClinicalToBodyMapper, MorphTargets } from '@/lib/clinical-mapper';

interface ClinicalRecord {
  id: string;
  year: number;
  heightCm: number;
  weightKg: number;
  diseaseCodes: string[];
  notes: string | null;
  morphTargets?: MorphTargets;
}

interface Patient {
  id: string;
  name: string;
  sex: string;
  birthYear: number;
  records: ClinicalRecord[];
}

export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        records: {
          orderBy: { year: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Calculate morph targets for each record
    const patientsWithMorphs: Patient[] = patients.map((patient: Patient) => ({
      ...patient,
      records: patient.records.map((record: ClinicalRecord) => {
        const currentYear = new Date().getFullYear();
        const age = currentYear - patient.birthYear;
        const morphTargets = ClinicalToBodyMapper.calculate({
          heightCm: record.heightCm,
          weightKg: record.weightKg,
          age,
          sex: patient.sex as 'M' | 'F',
          diseaseCodes: record.diseaseCodes,
        });
        return { ...record, morphTargets };
      }),
    }));

    return NextResponse.json({ success: true, patients: patientsWithMorphs });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}
