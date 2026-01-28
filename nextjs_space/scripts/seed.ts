import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.clinicalRecord.deleteMany();
  await prisma.patient.deleteMany();

  // Patient 1: João Silva - Diabetes progression
  const joao = await prisma.patient.create({
    data: {
      name: 'João Silva',
      sex: 'M',
      birthYear: 1981,
      records: {
        create: [
          {
            year: 2023,
            heightCm: 175,
            weightKg: 78,
            diseaseCodes: [],
            notes: 'Baseline healthy state'
          },
          {
            year: 2024,
            heightCm: 175,
            weightKg: 85,
            diseaseCodes: ['E11'],
            notes: 'Diagnosed with Type 2 Diabetes'
          }
        ]
      }
    }
  });

  // Patient 2: Maria Santos - Hypertension + Heart Disease
  const maria = await prisma.patient.create({
    data: {
      name: 'Maria Santos',
      sex: 'F',
      birthYear: 1968,
      records: {
        create: [
          {
            year: 2023,
            heightCm: 162,
            weightKg: 72,
            diseaseCodes: ['I10'],
            notes: 'Hypertension diagnosed'
          },
          {
            year: 2024,
            heightCm: 162,
            weightKg: 79,
            diseaseCodes: ['I10', 'I25'],
            notes: 'Heart disease developed'
          }
        ]
      }
    }
  });

  // Patient 3: Carlos Oliveira - Multiple conditions
  const carlos = await prisma.patient.create({
    data: {
      name: 'Carlos Oliveira',
      sex: 'M',
      birthYear: 1964,
      records: {
        create: [
          {
            year: 2023,
            heightCm: 170,
            weightKg: 88,
            diseaseCodes: ['E11'],
            notes: 'Pre-existing diabetes'
          },
          {
            year: 2024,
            heightCm: 170,
            weightKg: 96,
            diseaseCodes: ['E11', 'I10', 'I25'],
            notes: 'Multiple conditions developed'
          }
        ]
      }
    }
  });

  console.log('Seeded patients:', { joao: joao.id, maria: maria.id, carlos: carlos.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
