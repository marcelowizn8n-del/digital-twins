import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.clinicalRecord.deleteMany();
  await prisma.patient.deleteMany();

  // Patient 1: João Silva - Progressão para Diabetes
  const joao = await prisma.patient.create({
    data: {
      name: 'João Silva',
      sex: 'M',
      birthYear: 1981,
      records: {
        create: [
          {
            year: 2019,
            heightCm: 175,
            weightKg: 72,
            diseaseCodes: [],
            notes: 'Check-up anual - saudável'
          },
          {
            year: 2020,
            heightCm: 175,
            weightKg: 74,
            diseaseCodes: [],
            notes: 'Leve ganho de peso durante pandemia'
          },
          {
            year: 2021,
            heightCm: 175,
            weightKg: 77,
            diseaseCodes: [],
            notes: 'Pré-diabetes identificado'
          },
          {
            year: 2022,
            heightCm: 175,
            weightKg: 80,
            diseaseCodes: [],
            notes: 'Orientação dietética iniciada'
          },
          {
            year: 2023,
            heightCm: 175,
            weightKg: 83,
            diseaseCodes: ['E11'],
            notes: 'Diagnóstico de Diabetes Tipo 2'
          },
          {
            year: 2024,
            heightCm: 175,
            weightKg: 86,
            diseaseCodes: ['E11'],
            notes: 'Tratamento com metformina'
          }
        ]
      }
    }
  });

  // Patient 2: Maria Santos - Hipertensão + Doença Cardíaca
  const maria = await prisma.patient.create({
    data: {
      name: 'Maria Santos',
      sex: 'F',
      birthYear: 1968,
      records: {
        create: [
          {
            year: 2019,
            heightCm: 162,
            weightKg: 65,
            diseaseCodes: [],
            notes: 'Saudável, pressão normal'
          },
          {
            year: 2020,
            heightCm: 162,
            weightKg: 68,
            diseaseCodes: [],
            notes: 'Pressão limítrofe 135/85'
          },
          {
            year: 2021,
            heightCm: 162,
            weightKg: 70,
            diseaseCodes: ['I10'],
            notes: 'Diagnóstico de hipertensão'
          },
          {
            year: 2022,
            heightCm: 162,
            weightKg: 73,
            diseaseCodes: ['I10'],
            notes: 'Tratamento com anti-hipertensivo'
          },
          {
            year: 2023,
            heightCm: 162,
            weightKg: 76,
            diseaseCodes: ['I10'],
            notes: 'Ecocardiograma com alterações leves'
          },
          {
            year: 2024,
            heightCm: 162,
            weightKg: 79,
            diseaseCodes: ['I10', 'I25'],
            notes: 'Doença cardíaca isquêmica diagnosticada'
          }
        ]
      }
    }
  });

  // Patient 3: Carlos Oliveira - Múltiplas condições
  const carlos = await prisma.patient.create({
    data: {
      name: 'Carlos Oliveira',
      sex: 'M',
      birthYear: 1964,
      records: {
        create: [
          {
            year: 2019,
            heightCm: 170,
            weightKg: 82,
            diseaseCodes: ['E11'],
            notes: 'Diabetes pré-existente, controlado'
          },
          {
            year: 2020,
            heightCm: 170,
            weightKg: 85,
            diseaseCodes: ['E11'],
            notes: 'Ganho de peso, glicemia elevada'
          },
          {
            year: 2021,
            heightCm: 170,
            weightKg: 88,
            diseaseCodes: ['E11', 'I10'],
            notes: 'Hipertensão diagnosticada'
          },
          {
            year: 2022,
            heightCm: 170,
            weightKg: 91,
            diseaseCodes: ['E11', 'I10'],
            notes: 'Dificuldade no controle glicemico'
          },
          {
            year: 2023,
            heightCm: 170,
            weightKg: 94,
            diseaseCodes: ['E11', 'I10'],
            notes: 'Iniciado insulina'
          },
          {
            year: 2024,
            heightCm: 170,
            weightKg: 98,
            diseaseCodes: ['E11', 'I10', 'I25'],
            notes: 'Doença cardíaca - stent colocado'
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
