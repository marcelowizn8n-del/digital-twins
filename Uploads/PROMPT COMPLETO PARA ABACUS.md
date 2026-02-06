# **PROMPT COMPLETO PARA ABACUS.AI \- EVOLUÇÃO DIGITAL TWINS**

---

## **🎯 CONTEXTO DO PROJETO**

Sou Marcelo e estou desenvolvendo o **Digital Twins**, um sistema de visualização médica 3D que cria representações corporais de pacientes para acompanhamento clínico. O sistema atual (README.md anexo) usa Three.js \+ Next.js e mapeia dados clínicos básicos em morph targets 3D de avatares.

Analisei um artigo científico do Hospital Albert Einstein (PIIS0168822722008610.pdf anexo) sobre predição de síndrome metabólica usando machine learning e identifiquei oportunidades de evolução significativas.

**Objetivo**: Implementar uma camada de inteligência preditiva e causal no Digital Twins para transformá-lo de ferramenta de visualização em plataforma de suporte à decisão clínica e engajamento do paciente.

---

## **📊 DECISÕES TÉCNICAS CONFIRMADAS**

### **1\. DADOS DE TREINAMENTO**

✅ **Usar dados sintéticos** baseados na Tabela 1 do artigo (distribuições realistas)

**Distribuições para geração sintética** (baseadas no artigo):

| Variável | Mediana (IQR) | Distribuição |
| ----- | ----- | ----- |
| **Cintura** (cm) \- Homens | 92 (87-99) | Normal truncada \[70-130\] |
| **Cintura** (cm) \- Mulheres | 79 (73-85) | Normal truncada \[60-110\] |
| **PA Sistólica** (mmHg) | 114 (110-120) | Normal truncada \[90-180\] |
| **PA Diastólica** (mmHg) | 76 (70-80) | Normal truncada \[60-110\] |
| **Triglicerídeos** (mg/dL) | 97 (73-130) | Log-normal \[30-500\] |
| **HDL** (mg/dL) \- Homens | 47 (42-55) | Normal truncada \[25-90\] |
| **HDL** (mg/dL) \- Mulheres | 60 (51-70) | Normal truncada \[30-100\] |
| **Glicemia jejum** (mg/dL) | 85 (80-91) | Normal truncada \[60-200\] |
| **IMC** (kg/m²) | 25.4 (23.4-27.5) | Normal truncada \[18-45\] |
| **GGT** (U/L) | 25 (18-36) | Log-normal \[5-200\] |

**Requisitos para geração**:

* Mínimo de **5.000 pares de visitas sintéticas** (70% treino, 15% validação, 15% teste)  
* Correlações entre variáveis (ex: IMC alto → cintura alta, triglicérides alto)  
* 8.4% de prevalência de síndrome metabólica (conforme artigo)  
* Intervalo entre visitas: 8-24 meses (média 12 meses)  
* Distribuição por sexo: 74.5% masculino, 25.5% feminino (conforme artigo)

### **2\. VISUALIZAÇÃO 3D DO RISCO**

✅ **Implementar heatmap abdominal** (`MetabolicRiskHeat`)

**Especificações técnicas**:

// Novo morph target no clinical-mapper.ts const metabolicRiskHeat \= riskProbability \* 0.6; // 0-1 scale // riskProbability vem da API de predição // Parâmetros visuais (Three.js) \- Overlay de cor vermelha/laranja na região abdominal \- Opacidade: 0.2-0.4 (sutil, não estigmatizante) \- Gradiente radial: centro do abdômen → periférico \- Intensidade proporcional ao risco de MS (0% \= transparente, 100% \= opacidade 0.4)

**Controle no UI**:

* Toggle "Mostrar Risco Metabólico" (desativado por padrão)  
* Legenda visual: "Verde (baixo) → Amarelo (moderado) → Laranja (alto)"

### **3\. VALIDAÇÃO MÉDICA**

✅ **Há equipe clínica disponível para revisão pré-deploy**

**Processo de validação**:

1. Revisão técnica: Métricas de performance (AUC-ROC, Brier score)  
2. Revisão clínica: Interpretação dos fatores de risco (SHAP)  
3. Teste de usabilidade: Médicos testam interface de simulação  
4. Aprovação final: Disclaimers e limitações do modelo

---

## **🏗️ ENTREGAS DETALHADAS**

### **FASE 1: MVP PREDITIVO (2-3 semanas)**

#### **1.1. EXPANSÃO DO SCHEMA PRISMA**

model ClinicalRecord { id String @id @default(cuid()) patientId String year Int visitDate DateTime? // Granularidade melhor que "ano" // DADOS EXISTENTES heightCm Float weightKg Float diseaseCodes String\[\] notes String? // NOVOS CAMPOS \- Componentes da Síndrome Metabólica waistCm Float? // Circunferência abdominal systolicBp Float? // Pressão sistólica diastolicBp Float? // Pressão diastólica triglyceridesMgDl Float? // Triglicerídeos hdlMgDl Float? // HDL ldlMgDl Float? // LDL totalCholesterolMgDl Float? // Colesterol total fastingGlucoseMgDl Float? // Glicemia jejum // NOVOS CAMPOS \- Medicamentos isOnAntihypertensive Boolean? @default(false) isOnAntidiabetic Boolean? @default(false) isOnLipidLowering Boolean? @default(false) // NOVOS CAMPOS \- Estilo de Vida physicalActivityLevel String? // 'inactive'|'low'|'moderate'|'high' smokingStatus String? // 'never'|'previous'|'current' auditScore Int? // Álcool (0-40) bdiScore Int? // Depressão (0-63) // NOVOS CAMPOS \- Marcadores Hepáticos astUL Float? // AST altUL Float? // ALT ggtUL Float? // GGT // CAMPO DERIVADO hasMetabolicSyndrome Boolean? // Calculado: 3 de 5 critérios // CAMPO DE AUDITORIA bmi Float? // Cache do IMC patient Patient @relation(fields: \[patientId\], references: \[id\]) createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }

**Ação**:

* \[ \] Criar migration `20260204_add_metabolic_fields.sql`  
* \[ \] Atualizar `scripts/seed.ts` com dados sintéticos para 5 pacientes demo  
* \[ \] Criar script `scripts/generate_synthetic_data.py` para gerar 5.000 pares

**Script de geração sintética** (pseudocódigo Python):

import numpy as np import pandas as pd from scipy.stats import truncnorm def generate\_synthetic\_patients(n\_pairs=5000): \# Distribuições baseadas na Tabela 1 do artigo sex \= np.random.choice(\['M', 'F'\], n\_pairs, p=\[0.745, 0.255\]) age \= np.random.normal(51, 10, n\_pairs).clip(25, 80\) \# Cintura (correlacionada com IMC) bmi \= truncnorm(-2, 6, loc=25.4, scale=4).rvs(n\_pairs) waist\_male \= bmi \* 3.5 \+ np.random.normal(0, 5, n\_pairs) waist\_female \= bmi \* 3 \+ np.random.normal(0, 4, n\_pairs) waist \= np.where(sex \== 'M', waist\_male, waist\_female).clip(60, 130\) \# PA (correlacionada com idade e IMC) systolic \= 100 \+ age \* 0.3 \+ bmi \* 0.5 \+ np.random.normal(0, 10, n\_pairs) diastolic \= 60 \+ age \* 0.2 \+ bmi \* 0.3 \+ np.random.normal(0, 8, n\_pairs) \# Lipídios (log-normal) triglycerides \= np.random.lognormal(4.5, 0.4, n\_pairs).clip(30, 500\) hdl\_male \= np.random.normal(47, 10, n\_pairs).clip(25, 90\) hdl\_female \= np.random.normal(60, 12, n\_pairs).clip(30, 100\) hdl \= np.where(sex \== 'M', hdl\_male, hdl\_female) \# Glicemia (correlacionada com IMC) glucose \= 70 \+ bmi \* 0.8 \+ np.random.normal(0, 8, n\_pairs).clip(60, 200\) \# Calcular MS (3 de 5 critérios) criteria \= \[ waist \> np.where(sex \== 'M', 94, 80), triglycerides \>= 150, hdl \< np.where(sex \== 'M', 40, 50), systolic \>= 130 | diastolic \>= 85, glucose \>= 100 \] has\_ms \= sum(criteria) \>= 3 return pd.DataFrame({...})

---

#### **1.2. API DE PREDIÇÃO DE RISCO**

**Backend Python (FastAPI)**:

\# app/ml/predict\_ms\_risk.py from fastapi import FastAPI, HTTPException from pydantic import BaseModel import lightgbm as lgb import numpy as np import shap app \= FastAPI() \# Carregar modelo treinado model \= lgb.Booster(model\_file='models/ms\_risk\_lgbm\_v1.txt') explainer \= shap.TreeExplainer(model) class PredictionRequest(BaseModel): patientId: str indexRecordId: str featuresOverride: dict \= {} class PredictionResponse(BaseModel): riskProbability: float timeHorizonMonths: int modelVersion: str calibrationMetrics: dict explanation: dict @app.post("/predict-metabolic-syndrome-risk", response\_model=PredictionResponse) async def predict\_ms\_risk(request: PredictionRequest): try: \# 1\. Buscar dados do paciente no banco features \= fetch\_patient\_features(request.indexRecordId) \# 2\. Aplicar overrides (para simulação) features.update(request.featuresOverride) \# 3\. Preprocessar (z-score, dummy vars) X \= preprocess\_features(features) \# 4\. Predição risk\_prob \= model.predict(X)\[0\] \# 5\. SHAP explanation shap\_values \= explainer.shap\_values(X) top\_factors \= get\_top\_shap\_factors(shap\_values, features, n=10) return PredictionResponse( riskProbability=float(risk\_prob), timeHorizonMonths=12, modelVersion="ms-risk-lgbm-v1", calibrationMetrics={ "brierScore": 0.065, "rocAuc": 0.858, "prAuc": 0.336 }, explanation={ "topFactors": top\_factors } ) except Exception as e: raise HTTPException(status\_code=500, detail=str(e)) def get\_top\_shap\_factors(shap\_values, features, n=10): \# Retorna top N features por impacto absoluto importance \= np.abs(shap\_values\[0\]) top\_indices \= np.argsort(importance)\[-n:\]\[::-1\] return \[ { "feature": feature\_names\[i\], "direction": "increase" if shap\_values\[0\]\[i\] \> 0 else "decrease", "impact": "high" if importance\[i\] \> 0.05 else "medium" if importance\[i\] \> 0.02 else "low", "shapValue": float(shap\_values\[0\]\[i\]) } for i in top\_indices \]

**Integração Next.js** (`app/api/predict-metabolic-syndrome-risk/route.ts`):

import { NextRequest, NextResponse } from 'next/server'; export async function POST(request: NextRequest) { try { const body \= await request.json(); // Proxy para FastAPI const response \= await fetch('http://ml-service:8000/predict-metabolic-syndrome-risk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), }); if (\!response.ok) { throw new Error(\`ML service error: ${response.statusText}\`); } const data \= await response.json(); // Log para auditoria await logPrediction({ timestamp: new Date(), patientId: body.patientId, prediction: data.riskProbability, modelVersion: data.modelVersion, userId: request.headers.get('user-id'), // Médico }); return NextResponse.json(data); } catch (error) { return NextResponse.json( { error: 'Failed to predict MS risk' }, { status: 500 } ); } }

**Requisitos de Performance**:

* \[ \] Latência \< 2s (p95)  
* \[ \] AUC-ROC \> 0.84  
* \[ \] Brier score \< 0.07  
* \[ \] Cache de predições (Redis) para mesmos inputs

---

#### **1.3. PAINEL DE RISCO METABÓLICO (FRONTEND)**

**Novo componente** (`components/metabolic-risk-panel.tsx`):

'use client'; import { useEffect, useState } from 'react'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; import { Badge } from '@/components/ui/badge'; import { Progress } from '@/components/ui/progress'; import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'; import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'; interface MetabolicRiskPanelProps { patientId: string; recordId: string; clinicalData: ClinicalRecord; } export function MetabolicRiskPanel({ patientId, recordId, clinicalData }: MetabolicRiskPanelProps) { const \[riskData, setRiskData\] \= useState\<any\>(null); const \[loading, setLoading\] \= useState(true); useEffect(() \=\> { async function fetchRisk() { const response \= await fetch('/api/predict-metabolic-syndrome-risk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, indexRecordId: recordId }), }); const data \= await response.json(); setRiskData(data); setLoading(false); } fetchRisk(); }, \[patientId, recordId\]); if (loading) return \<div\>Calculando risco...\</div\>; const riskPercent \= (riskData.riskProbability \* 100).toFixed(1); const riskLevel \= getRiskLevel(riskData.riskProbability); return ( \<Card className="w-full"\> \<CardHeader\> \<CardTitle className="flex items-center gap-2"\> \<AlertCircle className="h-5 w-5" /\> Risco de Síndrome Metabólica \</CardTitle\> \</CardHeader\> \<CardContent className="space-y-4"\> {/\* Gauge de Risco \*/} \<div className="flex flex-col items-center"\> \<div className="relative w-32 h-32"\> \<svg viewBox="0 0 100 100" className="transform \-rotate-90"\> \<circle cx="50" cy="50" r="45" fill="none" stroke="\#e5e7eb" strokeWidth="10" /\> \<circle cx="50" cy="50" r="45" fill="none" stroke={riskLevel.color} strokeWidth="10" strokeDasharray={\`${riskData.riskProbability \* 283} 283\`} strokeLinecap="round" /\> \</svg\> \<div className="absolute inset-0 flex items-center justify-center"\> \<span className="text-3xl font-bold"\>{riskPercent}%\</span\> \</div\> \</div\> \<p className="text-sm text-muted-foreground mt-2"\>em 12 meses\</p\> \<Badge variant={riskLevel.variant} className="mt-2"\> {riskLevel.label} \</Badge\> \</div\> {/\* Componentes da SM \*/} \<div className="space-y-2"\> \<h4 className="text-sm font-semibold"\>Componentes Alterados:\</h4\> \<div className="grid grid-cols-2 gap-2"\> \<MSComponent label="Cintura" value={clinicalData.waistCm} unit="cm" cutoff={clinicalData.sex \=== 'M' ? 94 : 80} isAbove={clinicalData.waistCm \> (clinicalData.sex \=== 'M' ? 94 : 80)} /\> \<MSComponent label="PA Sistólica" value={clinicalData.systolicBp} unit="mmHg" cutoff={130} isAbove={clinicalData.systolicBp \>= 130} /\> \<MSComponent label="Triglicerídeos" value={clinicalData.triglyceridesMgDl} unit="mg/dL" cutoff={150} isAbove={clinicalData.triglyceridesMgDl \>= 150} /\> \<MSComponent label="HDL" value={clinicalData.hdlMgDl} unit="mg/dL" cutoff={clinicalData.sex \=== 'M' ? 40 : 50} isAbove={false} isBelow={clinicalData.hdlMgDl \< (clinicalData.sex \=== 'M' ? 40 : 50)} /\> \<MSComponent label="Glicemia" value={clinicalData.fastingGlucoseMgDl} unit="mg/dL" cutoff={100} isAbove={clinicalData.fastingGlucoseMgDl \>= 100} /\> \</div\> \</div\> {/\* Fatores de Risco (SHAP) \*/} \<Accordion type="single" collapsible\> \<AccordionItem value="factors"\> \<AccordionTrigger\>Por que este risco?\</AccordionTrigger\> \<AccordionContent\> \<div className="space-y-2"\> {riskData.explanation.topFactors.slice(0, 5).map((factor: any) \=\> ( \<div key={factor.feature} className="flex items-center gap-2"\> {factor.direction \=== 'increase' ? ( \<TrendingUp className="h-4 w-4 text-red-500" /\> ) : ( \<TrendingDown className="h-4 w-4 text-green-500" /\> )} \<span className="text-sm flex-1"\>{formatFeatureName(factor.feature)}\</span\> \<Badge variant={factor.impact \=== 'high' ? 'destructive' : 'secondary'}\> {factor.impact} \</Badge\> \</div\> ))} \</div\> \</AccordionContent\> \</AccordionItem\> \</Accordion\> {/\* Disclaimer \*/} \<div className="text-xs text-muted-foreground bg-muted p-2 rounded"\> \<p\> Modelo: {riskData.modelVersion} | AUC-ROC: {riskData.calibrationMetrics.rocAuc.toFixed(3)} \</p\> \<p className="mt-1"\> Este sistema é para fins educacionais. Sempre consulte um médico. \</p\> \</div\> \</CardContent\> \</Card\> ); } function MSComponent({ label, value, unit, cutoff, isAbove, isBelow }: any) { const isAltered \= isAbove || isBelow; return ( \<div className={\`p-2 rounded border ${isAltered ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}\`}\> \<div className="text-xs font-semibold"\>{label}\</div\> \<div className="text-sm"\> {value?.toFixed(1)} {unit} {isAltered && '⚠️'} \</div\> \<div className="text-xs text-muted-foreground"\> Corte: {isBelow ? '\<' : '≥'} {cutoff} {unit} \</div\> \</div\> ); } function getRiskLevel(probability: number) { if (probability \< 0.1) return { label: 'Baixo', color: '\#10b981', variant: 'success' }; if (probability \< 0.2) return { label: 'Moderado', color: '\#f59e0b', variant: 'warning' }; return { label: 'Alto', color: '\#ef4444', variant: 'destructive' }; } function formatFeatureName(feature: string): string { const map: Record\<string, string\> \= { waistCm: 'Circunferência abdominal', bmi: 'IMC', age: 'Idade', triglyceridesMgDl: 'Triglicerídeos', hdlMgDl: 'HDL-colesterol', // ... adicionar todos }; return map\[feature\] || feature; }

**Integração no `digital-twins-app.tsx`**:

// Adicionar após o painel de métricas \<MetabolicRiskPanel patientId={selectedPatient.id} recordId={currentRecord.id} clinicalData={currentRecord} /\>

---

### **FASE 2: SIMULAÇÃO CAUSAL (2 semanas)**

#### **2.1. API DE SIMULAÇÃO CATE**

**Backend Python**:

\# app/ml/simulate\_lifestyle\_impact.py from causalml.inference.meta import BaseSLearner from lightgbm import LGBMRegressor import numpy as np class LifestyleSimulator: def \_\_init\_\_(self, model\_path): self.base\_model \= LGBMRegressor() self.s\_learner \= BaseSLearner(learner=self.base\_model) \# Treinar S-learner com dados históricos def estimate\_cate(self, features, treatment): """ treatment: dict com {'deltaBmiPercent': \-5, 'deltaPhysicalActivity': \+1} """ \# Criar features com e sem tratamento X\_control \= features.copy() X\_treated \= features.copy() if 'deltaBmiPercent' in treatment: X\_treated\['bmi'\] \*= (1 \+ treatment\['deltaBmiPercent'\] / 100\) X\_treated\['weightKg'\] \*= (1 \+ treatment\['deltaBmiPercent'\] / 100\) X\_treated\['waistCm'\] \*= (1 \+ treatment\['deltaBmiPercent'\] / 100 \* 0.8) if 'deltaPhysicalActivity' in treatment: activity\_map \= {'inactive': 0, 'low': 1, 'moderate': 2, 'high': 3} current\_level \= activity\_map\[X\_control\['physicalActivityLevel'\]\] new\_level \= min(3, current\_level \+ treatment\['deltaPhysicalActivity'\]) X\_treated\['physicalActivityLevel'\] \= list(activity\_map.keys())\[new\_level\] \# Predição p0 \= self.base\_model.predict(preprocess(X\_control))\[0\] p1 \= self.base\_model.predict(preprocess(X\_treated))\[0\] cate \= p1 \- p0 \# Bootstrap para IC 95% cate\_bootstrap \= \[\] for \_ in range(1000): \# Resample e recalcular cate\_bootstrap.append(...) ci\_lower \= np.percentile(cate\_bootstrap, 2.5) ci\_upper \= np.percentile(cate\_bootstrap, 97.5) return { "baselineRisk": float(p0), "scenarioRisk": float(p1), "absoluteRiskReduction": float(cate), "confidenceInterval95": \[float(ci\_lower), float(ci\_upper)\], "relativeRiskReduction": float(cate / p0) if p0 \> 0 else 0 } @app.post("/simulate-lifestyle-impact") async def simulate\_impact(request: SimulationRequest): simulator \= LifestyleSimulator('models/cate\_model.pkl') features \= fetch\_patient\_features(request.indexRecordId) result \= simulator.estimate\_cate(features, request.scenario) \# Gerar mensagem descritiva result\["interventionSummary"\] \= generate\_summary(request.scenario, result) return result def generate\_summary(scenario, result): parts \= \[\] if 'deltaWeightPercent' in scenario: parts.append(f"reduzir {abs(scenario\['deltaWeightPercent'\])}% do peso") if 'deltaPhysicalActivity' in scenario: parts.append(f"aumentar {scenario\['deltaPhysicalActivity'\]} nível(is) de atividade física") intervention \= " e ".join(parts) reduction \= abs(result\['absoluteRiskReduction'\] \* 100\) return f"Ao {intervention}, o risco de síndrome metabólica reduz em {reduction:.1f} pontos percentuais."

---

#### **2.2. PAINEL "E SE?" COM RISCO**

**Atualizar `timeline-slider.tsx`**:

'use client'; import { useState } from 'react'; import { Slider } from '@/components/ui/slider'; import { Label } from '@/components/ui/label'; import { Button } from '@/components/ui/button'; import { Card } from '@/components/ui/card'; import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; export function WhatIfSimulation({ patientId, currentRecord }: any) { const \[weightDelta, setWeightDelta\] \= useState(0); const \[activityDelta, setActivityDelta\] \= useState(0); const \[simulationResult, setSimulationResult\] \= useState\<any\>(null); const \[loading, setLoading\] \= useState(false); const handleSimulate \= async () \=\> { setLoading(true); const response \= await fetch('/api/simulate-lifestyle-impact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, indexRecordId: currentRecord.id, scenario: { deltaWeightPercent: weightDelta, deltaPhysicalActivityLevel: activityDelta, }, }), }); const data \= await response.json(); setSimulationResult(data); setLoading(false); }; return ( \<Card className="p-4 space-y-4"\> \<h3 className="text-lg font-semibold"\>Simulação "E Se?"\</h3\> {/\* Slider de Peso \*/} \<div className="space-y-2"\> \<Label\>Mudança de Peso: {weightDelta \> 0 ? '+' : ''}{weightDelta}%\</Label\> \<Slider value={\[weightDelta\]} onValueChange={(v) \=\> setWeightDelta(v\[0\])} min={-20} max={20} step={1} className="w-full" /\> \<p className="text-xs text-muted-foreground"\> Peso atual: {currentRecord.weightKg}kg → Novo peso: {(currentRecord.weightKg \* (1 \+ weightDelta / 100)).toFixed(1)}kg \</p\> \</div\> {/\* Seletor de Atividade Física \*/} \<div className="space-y-2"\> \<Label\>Nível de Atividade Física\</Label\> \<Select value={activityDelta.toString()} onValueChange={(v) \=\> setActivityDelta(parseInt(v))}\> \<SelectTrigger\> \<SelectValue /\> \</SelectTrigger\> \<SelectContent\> \<SelectItem value="-1"\>Reduzir 1 nível\</SelectItem\> \<SelectItem value="0"\>Manter atual\</SelectItem\> \<SelectItem value="1"\>Aumentar 1 nível\</SelectItem\> \<SelectItem value="2"\>Aumentar 2 níveis\</SelectItem\> \</SelectContent\> \</Select\> \<p className="text-xs text-muted-foreground"\> Atual: {currentRecord.physicalActivityLevel || 'Não informado'} \</p\> \</div\> \<Button onClick={handleSimulate} disabled={loading} className="w-full"\> {loading ? 'Simulando...' : 'Simular Impacto'} \</Button\> {/\* Resultado \*/} {simulationResult && ( \<div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-2"\> \<h4 className="font-semibold text-blue-900"\>Resultado da Simulação\</h4\> \<div className="grid grid-cols-2 gap-4 text-sm"\> \<div\> \<p className="text-muted-foreground"\>Risco Atual\</p\> \<p className="text-2xl font-bold"\>{(simulationResult.baselineRisk \* 100).toFixed(1)}%\</p\> \</div\> \<div\> \<p className="text-muted-foreground"\>Risco Simulado\</p\> \<p className="text-2xl font-bold text-green-600"\> {(simulationResult.scenarioRisk \* 100).toFixed(1)}% \</p\> \</div\> \</div\> \<div className="pt-2 border-t"\> \<p className="text-sm font-semibold text-green-700"\> Redução: {Math.abs(simulationResult.absoluteRiskReduction \* 100).toFixed(1)} pontos percentuais \</p\> \<p className="text-xs text-muted-foreground mt-1"\> IC 95%: \[{(simulationResult.confidenceInterval95\[0\] \* 100).toFixed(1)}%; {(simulationResult.confidenceInterval95\[1\] \* 100).toFixed(1)}%\] \</p\> \</div\> \<p className="text-sm italic"\>{simulationResult.interventionSummary}\</p\> \</div\> )} \</Card\> ); }

---

### **FASE 3: REFINAMENTO E GOVERNANÇA (1-2 semanas)**

#### **3.1. CLINICAL MAPPER REFINADO**

// lib/clinical-mapper.ts (REFATORADO) export function calculateMorphTargets(record: ClinicalRecord): MorphTargets { const { heightCm, weightKg, waistCm, triglyceridesMgDl, hdlMgDl, fastingGlucoseMgDl, systolicBp, isOnAntidiabetic, isOnAntihypertensive } \= record; // IMC const bmi \= weightKg / Math.pow(heightCm / 100, 2); const normalizedBMI \= (bmi \- 18\) / (45 \- 18); // GORDURA CENTRAL vs PERIFÉRICA (baseado em cintura e triglicérides) const centralFat \= waistCm ? (waistCm \- 80\) / 40 : normalizedBMI \* 0.5; const peripheralFat \= normalizedBMI \* 0.6; const triglyceridesEffect \= triglyceridesMgDl && triglyceridesMgDl \> 150 ? 0.2 : 0; const abdomenModifier \= Math.max(0, Math.min(1, centralFat \* 0.6 \+ triglyceridesEffect)); const weightModifier \= Math.max(0, Math.min(1, peripheralFat \* 0.3)); // EFEITOS DE DOENÇAS BASEADOS EM PARÂMETROS REAIS const diabetesEffect \= fastingGlucoseMgDl ? Math.max(0, Math.min(1, ((fastingGlucoseMgDl \- 100\) / 100\) \* 0.5 \+ (isOnAntidiabetic ? 0.3 : 0))) : record.diseaseCodes.includes('E11') ? 0.3 : 0; const hypertensionEffect \= systolicBp ? Math.max(0, Math.min(1, Math.max(0, (systolicBp \- 130\) / 40\) \* 0.4 \+ (isOnAntihypertensive ? 0.2 : 0))) : record.diseaseCodes.includes('I10') ? 0.25 : 0; const heartDiseaseEffect \= record.diseaseCodes.includes('I25') ? 0.2 : 0; // MASSA MUSCULAR (inversamente proporcional ao HDL baixo) const muscleMass \= hdlMgDl ? Math.max(0, Math.min(1, 0.5 \- (hdlMgDl \< 50 ? 0.2 : 0))) : 0.5; // POSTURA (afetada por idade e hipertensão) const age \= new Date().getFullYear() \- new Date(record.patient.birthDate).getFullYear(); const postureEffect \= Math.max(0, Math.min(1, (age \- 40\) / 40 \* 0.3 \+ hypertensionEffect \* 0.2)); // HEATMAP DE RISCO METABÓLICO (se disponível) const metabolicRiskHeat \= record.metabolicRiskProbability ? Math.max(0, Math.min(1, record.metabolicRiskProbability \* 0.6)) : 0; return { Weight: weightModifier, AbdomenGirth: abdomenModifier, MuscleMass: muscleMass, Posture: postureEffect, DiabetesEffect: diabetesEffect, HypertensionEffect: hypertensionEffect, HeartDiseaseEffect: heartDiseaseEffect, MetabolicRiskHeat: metabolicRiskHeat, // NOVO }; }

**Implementação do Heatmap no Three.js** (`components/three-viewer.tsx`):

// Adicionar shader material para overlay de risco const riskOverlayMaterial \= new THREE.ShaderMaterial({ uniforms: { riskIntensity: { value: morphTargets.MetabolicRiskHeat }, }, vertexShader: \` varying vec3 vPosition; void main() { vPosition \= position; gl\_Position \= projectionMatrix \* modelViewMatrix \* vec4(position, 1.0); } \`, fragmentShader: \` uniform float riskIntensity; varying vec3 vPosition; void main() { // Gradiente radial na região abdominal (y entre \-0.2 e 0.2, z entre \-0.1 e 0.3) float abdominalDistance \= length(vec2(vPosition.x, vPosition.z \- 0.1)); float gradient \= smoothstep(0.3, 0.0, abdominalDistance); vec3 riskColor \= mix(vec3(1.0, 0.8, 0.0), vec3(1.0, 0.2, 0.0), riskIntensity); float opacity \= riskIntensity \* gradient \* 0.4; gl\_FragColor \= vec4(riskColor, opacity); } \`, transparent: true, depthWrite: false, }); // Aplicar ao mesh do abdômen const abdomenMesh \= scene.getObjectByName('Abdomen'); if (abdomenMesh && morphTargets.MetabolicRiskHeat \> 0\) { const overlay \= abdomenMesh.clone(); overlay.material \= riskOverlayMaterial; scene.add(overlay); }

---

#### **3.2. DASHBOARD DE PERFORMANCE**

**Nova página** (`app/admin/model-performance/page.tsx`):

'use client'; import { useEffect, useState } from 'react'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; import dynamic from 'next/dynamic'; const Plot \= dynamic(() \=\> import('react-plotly.js'), { ssr: false }); export default function ModelPerformancePage() { const \[metrics, setMetrics\] \= useState\<any\>(null); useEffect(() \=\> { fetch('/api/admin/model-metrics').then(r \=\> r.json()).then(setMetrics); }, \[\]); if (\!metrics) return \<div\>Carregando métricas...\</div\>; return ( \<div className="container mx-auto p-6 space-y-6"\> \<h1 className="text-3xl font-bold"\>Performance do Modelo de Predição\</h1\> \<div className="grid grid-cols-3 gap-4"\> \<Card\> \<CardHeader\> \<CardTitle\>AUC-ROC\</CardTitle\> \</CardHeader\> \<CardContent\> \<p className="text-4xl font-bold"\>{metrics.rocAuc.toFixed(3)}\</p\> \<p className="text-sm text-muted-foreground"\>Discriminação\</p\> \</CardContent\> \</Card\> \<Card\> \<CardHeader\> \<CardTitle\>Brier Score\</CardTitle\> \</CardHeader\> \<CardContent\> \<p className="text-4xl font-bold"\>{metrics.brierScore.toFixed(3)}\</p\> \<p className="text-sm text-muted-foreground"\>Calibração\</p\> \</CardContent\> \</Card\> \<Card\> \<CardHeader\> \<CardTitle\>PR-AUC\</CardTitle\> \</CardHeader\> \<CardContent\> \<p className="text-4xl font-bold"\>{metrics.prAuc.toFixed(3)}\</p\> \<p className="text-sm text-muted-foreground"\>Precisão-Recall\</p\> \</CardContent\> \</Card\> \</div\> \<Tabs defaultValue="roc"\> \<TabsList\> \<TabsTrigger value="roc"\>Curva ROC\</TabsTrigger\> \<TabsTrigger value="calibration"\>Calibração\</TabsTrigger\> \<TabsTrigger value="subgroups"\>Subgrupos\</TabsTrigger\> \</TabsList\> \<TabsContent value="roc"\> \<Card\> \<CardContent className="pt-6"\> \<Plot data={\[ { x: metrics.rocCurve.fpr, y: metrics.rocCurve.tpr, type: 'scatter', mode: 'lines', name: 'ROC Curve', }, { x: \[0, 1\], y: \[0, 1\], type: 'scatter', mode: 'lines', name: 'Random', line: { dash: 'dash' }, }, \]} layout={{ title: 'Receiver Operating Characteristic', xaxis: { title: 'False Positive Rate' }, yaxis: { title: 'True Positive Rate' }, }} /\> \</CardContent\> \</Card\> \</TabsContent\> \<TabsContent value="calibration"\> \<Card\> \<CardContent className="pt-6"\> \<Plot data={\[ { x: metrics.calibrationCurve.predicted, y: metrics.calibrationCurve.observed, type: 'scatter', mode: 'markers', name: 'Calibration', }, { x: \[0, 1\], y: \[0, 1\], type: 'scatter', mode: 'lines', name: 'Perfect Calibration', line: { dash: 'dash' }, }, \]} layout={{ title: 'Calibration Plot', xaxis: { title: 'Predicted Probability' }, yaxis: { title: 'Observed Frequency' }, }} /\> \</CardContent\> \</Card\> \</TabsContent\> \<TabsContent value="subgroups"\> \<Card\> \<CardContent className="pt-6"\> \<table className="w-full"\> \<thead\> \<tr\> \<th\>Subgrupo\</th\> \<th\>AUC-ROC\</th\> \<th\>Brier Score\</th\> \<th\>N\</th\> \</tr\> \</thead\> \<tbody\> {metrics.subgroups.map((sg: any) \=\> ( \<tr key={sg.name}\> \<td\>{sg.name}\</td\> \<td\>{sg.rocAuc.toFixed(3)}\</td\> \<td\>{sg.brierScore.toFixed(3)}\</td\> \<td\>{sg.count}\</td\> \</tr\> ))} \</tbody\> \</table\> \</CardContent\> \</Card\> \</TabsContent\> \</Tabs\> \</div\> ); }

---

#### **3.3. LOGGING E AUDITORIA**

**Novo modelo Prisma**:

model PredictionLog { id String @id @default(cuid()) timestamp DateTime @default(now()) patientId String recordId String modelVersion String inputFeatures Json prediction Float userId String? // Médico que solicitou context String // 'clinical\_review' | 'patient\_engagement' | 'simulation' @@index(\[patientId, timestamp\]) @@index(\[modelVersion\]) }

**Implementação no endpoint**:

async function logPrediction(data: any) { await prisma.predictionLog.create({ data: { timestamp: new Date(), patientId: data.patientId, recordId: data.recordId, modelVersion: data.modelVersion, inputFeatures: data.features, prediction: data.prediction, userId: data.userId, context: data.context, }, }); }

---

## **📋 CHECKLIST DE VALIDAÇÃO**

### **Técnico**

* \[ \] Modelo LightGBM com AUC-ROC \> 0.84  
* \[ \] Brier score \< 0.07  
* \[ \] API de predição responde em \< 2s (p95)  
* \[ \] API de simulação retorna CATE com IC 95%  
* \[ \] Clinical mapper usa ≥8 variáveis clínicas  
* \[ \] Frontend renderiza painel de risco sem lag  
* \[ \] Heatmap abdominal funcional (toggle on/off)  
* \[ \] Testes unitários para clinical-mapper  
* \[ \] Testes de integração para APIs

### **Clínico**

* \[ \] Médico entende top 3 fatores de risco em \< 30s  
* \[ \] Paciente simula 3 cenários e compara  
* \[ \] Disclaimers claros sobre limitações  
* \[ \] Validação de métricas por equipe clínica

### **Dados**

* \[ \] 5.000 pares de visitas sintéticas geradas  
* \[ \] Distribuições aderentes à Tabela 1 do artigo  
* \[ \] Seed com dados realistas para 5 pacientes demo  
* \[ \] Correlações entre variáveis preservadas

---

## **🚀 PRÓXIMOS PASSOS**

1. **Confirmar recebimento** deste prompt e esclarecer dúvidas  
2. **Iniciar Fase 1** (MVP Preditivo):  
   * Gerar dados sintéticos  
   * Treinar modelo LightGBM  
   * Implementar API de predição  
   * Criar painel de risco no frontend  
3. **Review técnico** após Fase 1 antes de prosseguir  
4. **Validação clínica** com equipe médica  
5. **Deploy em staging** para testes  
6. **Validação externa** (outras populações)

---

**Estou pronto para começar\! Aguardo confirmação para iniciar a implementação da Fase 1\.**

