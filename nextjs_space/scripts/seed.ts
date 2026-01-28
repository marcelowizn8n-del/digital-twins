import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.clinicalRecord.deleteMany();
  await prisma.patient.deleteMany();

  // Patient 1: Pedro Magro - Paciente magro e saudável (REFERÊNCIA)
  const pedro = await prisma.patient.create({
    data: {
      name: 'Pedro Magro',
      sex: 'M',
      birthYear: 1990,
      records: {
        create: [
          {
            year: 2022,
            heightCm: 178,
            weightKg: 68,
            diseaseCodes: [],
            notes: 'Atleta amador - excelente condição física'
          },
          {
            year: 2023,
            heightCm: 178,
            weightKg: 69,
            diseaseCodes: [],
            notes: 'Mantém rotina de exercícios'
          },
          {
            year: 2024,
            heightCm: 178,
            weightKg: 70,
            diseaseCodes: [],
            notes: 'Saudável - sem condições crônicas'
          }
        ]
      }
    }
  });

  // Patient 2: Roberto Obeso - Obesidade severa + todas as condições
  const roberto = await prisma.patient.create({
    data: {
      name: 'Roberto Obeso',
      sex: 'M',
      birthYear: 1970,
      records: {
        create: [
          {
            year: 2019,
            heightCm: 172,
            weightKg: 95,
            diseaseCodes: [],
            notes: 'Obesidade grau I'
          },
          {
            year: 2020,
            heightCm: 172,
            weightKg: 102,
            diseaseCodes: ['E11'],
            notes: 'Diabetes diagnosticado - obesidade grau II'
          },
          {
            year: 2021,
            heightCm: 172,
            weightKg: 108,
            diseaseCodes: ['E11', 'I10'],
            notes: 'Hipertensão diagnosticada'
          },
          {
            year: 2022,
            heightCm: 172,
            weightKg: 115,
            diseaseCodes: ['E11', 'I10'],
            notes: 'Obesidade grau III - indicação bariátrica'
          },
          {
            year: 2023,
            heightCm: 172,
            weightKg: 120,
            diseaseCodes: ['E11', 'I10', 'I25'],
            notes: 'Doença cardíaca - angina de esforço'
          },
          {
            year: 2024,
            heightCm: 172,
            weightKg: 125,
            diseaseCodes: ['E11', 'I10', 'I25'],
            notes: 'IMC 42.3 - obesidade mórbida com comorbidades'
          }
        ]
      }
    }
  });

  // Patient 3: Ana Transformação - Caso de perda de peso dramática
  const ana = await prisma.patient.create({
    data: {
      name: 'Ana Transformação',
      sex: 'F',
      birthYear: 1985,
      records: {
        create: [
          {
            year: 2019,
            heightCm: 165,
            weightKg: 98,
            diseaseCodes: ['E11', 'I10'],
            notes: 'Obesidade + diabetes + hipertensão'
          },
          {
            year: 2020,
            heightCm: 165,
            weightKg: 95,
            diseaseCodes: ['E11', 'I10'],
            notes: 'Iniciou programa de emagrecimento'
          },
          {
            year: 2021,
            heightCm: 165,
            weightKg: 85,
            diseaseCodes: ['E11'],
            notes: 'Hipertensão controlada sem medicação'
          },
          {
            year: 2022,
            heightCm: 165,
            weightKg: 75,
            diseaseCodes: ['E11'],
            notes: 'Diabetes em remissão parcial'
          },
          {
            year: 2023,
            heightCm: 165,
            weightKg: 68,
            diseaseCodes: [],
            notes: 'Todas as condições em remissão!'
          },
          {
            year: 2024,
            heightCm: 165,
            weightKg: 65,
            diseaseCodes: [],
            notes: 'Peso ideal mantido - saudável'
          }
        ]
      }
    }
  });

  // Patient 4: Carlos Moderado - Caso intermediário típico
  const carlos = await prisma.patient.create({
    data: {
      name: 'Carlos Moderado',
      sex: 'M',
      birthYear: 1975,
      records: {
        create: [
          {
            year: 2019,
            heightCm: 175,
            weightKg: 78,
            diseaseCodes: [],
            notes: 'Leve sobrepeso'
          },
          {
            year: 2020,
            heightCm: 175,
            weightKg: 82,
            diseaseCodes: [],
            notes: 'Ganho de peso na pandemia'
          },
          {
            year: 2021,
            heightCm: 175,
            weightKg: 86,
            diseaseCodes: [],
            notes: 'Pré-diabetes identificado'
          },
          {
            year: 2022,
            heightCm: 175,
            weightKg: 88,
            diseaseCodes: ['E11'],
            notes: 'Diabetes Tipo 2 confirmado'
          },
          {
            year: 2023,
            heightCm: 175,
            weightKg: 91,
            diseaseCodes: ['E11'],
            notes: 'Tratamento com metformina'
          },
          {
            year: 2024,
            heightCm: 175,
            weightKg: 94,
            diseaseCodes: ['E11', 'I10'],
            notes: 'Hipertensão desenvolvida'
          }
        ]
      }
    }
  });

  // Patient 5: Lucia Cardíaca - Foco em doença cardíaca
  const lucia = await prisma.patient.create({
    data: {
      name: 'Lucia Cardíaca',
      sex: 'F',
      birthYear: 1960,
      records: {
        create: [
          {
            year: 2021,
            heightCm: 160,
            weightKg: 72,
            diseaseCodes: ['I10'],
            notes: 'Hipertensão há 10 anos'
          },
          {
            year: 2022,
            heightCm: 160,
            weightKg: 74,
            diseaseCodes: ['I10'],
            notes: 'ECG com alterações leves'
          },
          {
            year: 2023,
            heightCm: 160,
            weightKg: 76,
            diseaseCodes: ['I10', 'I25'],
            notes: 'Infarto - 2 stents colocados'
          },
          {
            year: 2024,
            heightCm: 160,
            weightKg: 78,
            diseaseCodes: ['I10', 'I25'],
            notes: 'Reabilitação cardíaca em andamento'
          }
        ]
      }
    }
  });

  console.log('Seeded patients:', { 
    pedro: pedro.id, 
    roberto: roberto.id, 
    ana: ana.id, 
    carlos: carlos.id,
    lucia: lucia.id
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
