# **CONTINUAÇÃO DO PROJETO DIGITAL TWINS – SEQUÊNCIA DE MELHORIAS**

## **OBJETIVO DESTA ETAPA**

Dar sequência à implementação das melhorias no sistema Digital Twins a partir do ponto em que já:

* Atualizamos o `prisma/schema.prisma` com os campos metabólicos.  
* Criamos o stub da rota `/api/predict-metabolic-syndrome-risk`.  
* Criamos um componente simples de risco (`MetabolicRiskMini`) integrado à tela principal.

Agora quero:

1. Evoluir o backend de predição (preparar terreno para o modelo real).  
2. Implementar a API de simulação de impacto de mudanças de estilo de vida.  
3. Refinar o `clinical-mapper` para usar os novos campos.  
4. Implementar o heatmap abdominal (`MetabolicRiskHeat`) no 3D.  
5. Substituir o painel simples por um painel mais completo de risco.  
6. Criar a base para o dashboard de performance do modelo (mesmo que ainda com dados dummy).

Abaixo estão as instruções e códigos para você seguir.

---

## **1\. EVOLUIR A ROTA DE PREDIÇÃO PARA UM CONTRATO FINAL**

### **1.1. Ajustar a rota `/api/predict-metabolic-syndrome-risk` para o contrato final**

Manter a lógica de heurística por enquanto, mas já devolver a estrutura de resposta que será usada mais adiante com o modelo real.

Atualizar `app/api/predict-metabolic-syndrome-risk/route.ts` para algo como:

ts  
Copiar  
import { NextRequest, NextResponse } from 'next/server';  
import { prisma } from '@/lib/prisma';

type PredictRequest \= {  
  patientId: string;  
  indexRecordId: string;  
  featuresOverride?: Record\<string, any\>;  
};

export async function POST(req: NextRequest) {  
  try {  
    const body \= (await req.json()) as PredictRequest;

    const record \= await prisma.clinicalRecord.findUnique({  
      where: { id: body.indexRecordId },  
      include: { patient: true },  
    });

    if (\!record) {  
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });  
    }

    const features \= buildFeaturesFromRecord(record, body.featuresOverride ?? {});  
    const riskProbability \= simpleRiskHeuristic(features);

    const response \= {  
      riskProbability,  
      timeHorizonMonths: 12,  
      modelVersion: 'ms-risk-stub-v1',  
      calibrationMetrics: {  
        brierScore: 0.07,  
        rocAuc: 0.84,  
        prAuc: 0.30,  
      },  
      explanation: {  
        topFactors: buildStubTopFactors(features),  
      },  
    };

    await logPrediction({  
      patientId: body.patientId,  
      recordId: body.indexRecordId,  
      modelVersion: response.modelVersion,  
      inputFeatures: features,  
      prediction: riskProbability,  
      context: 'clinical\_review',  
    });

    return NextResponse.json(response);  
  } catch (e) {  
    console.error(e);  
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });  
  }  
}

function buildFeaturesFromRecord(record: any, overrides: Record\<string, any\>) {  
  const patient \= record.patient;  
  const nowYear \= new Date().getFullYear();  
  const birthYear \= patient?.birthDate ? new Date(patient.birthDate).getFullYear() : nowYear \- 50;

  const bmi \= record.bmi ?? record.weightKg / ((record.heightCm / 100) \*\* 2);

  return {  
    age: nowYear \- birthYear,  
    sex: patient?.sex ?? 'M',  
    bmi,  
    waistCm: record.waistCm,  
    systolicBp: record.systolicBp,  
    diastolicBp: record.diastolicBp,  
    triglyceridesMgDl: record.triglyceridesMgDl,  
    hdlMgDl: record.hdlMgDl,  
    fastingGlucoseMgDl: record.fastingGlucoseMgDl,  
    physicalActivityLevel: record.physicalActivityLevel ?? 'inactive',  
    isOnAntihypertensive: record.isOnAntihypertensive ?? false,  
    isOnAntidiabetic: record.isOnAntidiabetic ?? false,  
    isOnLipidLowering: record.isOnLipidLowering ?? false,  
    ...overrides,  
  };  
}

function simpleRiskHeuristic(f: any): number {  
  let score \= 0;

  if (f.waistCm && f.sex \=== 'M' && f.waistCm \> 94) score \+= 1;  
  if (f.waistCm && f.sex \=== 'F' && f.waistCm \> 80) score \+= 1;  
  if (f.triglyceridesMgDl && f.triglyceridesMgDl \>= 150) score \+= 1;  
  if (f.hdlMgDl && f.sex \=== 'M' && f.hdlMgDl \< 40) score \+= 1;  
  if (f.hdlMgDl && f.sex \=== 'F' && f.hdlMgDl \< 50) score \+= 1;  
  if (f.systolicBp && f.systolicBp \>= 130) score \+= 1;  
  if (f.fastingGlucoseMgDl && f.fastingGlucoseMgDl \>= 100) score \+= 1;

  if (score \=== 0) return 0.05;  
  if (score \=== 1) return 0.12;  
  if (score \=== 2) return 0.2;  
  if (score \=== 3) return 0.35;  
  if (score \=== 4) return 0.5;  
  return 0.65;  
}

function buildStubTopFactors(f: any) {  
  const factors: any\[\] \= \[\];

  if (f.waistCm) {  
    factors.push({  
      feature: 'waistCm',  
      direction: f.waistCm \> (f.sex \=== 'M' ? 94 : 80) ? 'increase' : 'decrease',

