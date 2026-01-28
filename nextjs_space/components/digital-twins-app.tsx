'use client';

import { useState, useEffect, useMemo } from 'react';
import PatientSelector from './patient-selector';
import TimelineSlider from './timeline-slider';
import MorphStatsPanel from './morph-stats-panel';
import ViewerLoader from './viewer-loader';
import { ClinicalToBodyMapper, MorphTargets } from '@/lib/clinical-mapper';
import { Loader2, AlertCircle } from 'lucide-react';

interface ClinicalRecord {
  id: string;
  year: number;
  heightCm: number;
  weightKg: number;
  diseaseCodes: string[];
  notes?: string | null;
  morphTargets: MorphTargets;
}

interface Patient {
  id: string;
  name: string;
  sex: string;
  birthYear: number;
  records: ClinicalRecord[];
}

const defaultMorphTargets: MorphTargets = {
  Weight: 0.3,
  AbdomenGirth: 0.2,
  MuscleMass: 0.5,
  Posture: 0.1,
  DiabetesEffect: 0,
  HeartDiseaseEffect: 0,
  HypertensionEffect: 0,
};

export default function DigitalTwinsApp() {
  const [mounted, setMounted] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(2023);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch('/api/patients');
        const data = await res.json();
        if (data?.success && data?.patients) {
          setPatients(data.patients);
          if (data.patients.length > 0) {
            setSelectedPatientId(data.patients[0].id);
          }
        } else {
          setError('Falha ao carregar pacientes');
        }
      } catch (err) {
        setError('Erro de conexão com o servidor');
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  const selectedPatient = useMemo(
    () => patients?.find((p) => p?.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  const { minYear, maxYear } = useMemo(() => {
    const records = selectedPatient?.records ?? [];
    if (records.length === 0) return { minYear: 2023, maxYear: 2024 };
    const years = records.map((r) => r?.year ?? 2023);
    return { minYear: Math.min(...years), maxYear: Math.max(...years) };
  }, [selectedPatient]);

  useEffect(() => {
    if (selectedPatient?.records?.[0]) {
      setCurrentYear(selectedPatient.records[0].year);
    }
  }, [selectedPatientId, selectedPatient]);

  const { interpolatedMorphTargets, previousMorphTargets } = useMemo(() => {
    const records = selectedPatient?.records ?? [];
    if (records.length === 0) {
      return { interpolatedMorphTargets: defaultMorphTargets, previousMorphTargets: undefined };
    }

    if (records.length === 1) {
      return {
        interpolatedMorphTargets: records[0]?.morphTargets ?? defaultMorphTargets,
        previousMorphTargets: undefined,
      };
    }

    let startRecord = records[0];
    let endRecord = records[records.length - 1];

    for (let i = 0; i < records.length - 1; i++) {
      if (records[i]?.year <= currentYear && records[i + 1]?.year >= currentYear) {
        startRecord = records[i];
        endRecord = records[i + 1];
        break;
      }
    }

    const startYear = startRecord?.year ?? minYear;
    const endYear = endRecord?.year ?? maxYear;
    const t = endYear === startYear ? 0 : (currentYear - startYear) / (endYear - startYear);

    const interpolated = ClinicalToBodyMapper.interpolate(
      startRecord?.morphTargets ?? defaultMorphTargets,
      endRecord?.morphTargets ?? defaultMorphTargets,
      Math.max(0, Math.min(1, t))
    );

    return {
      interpolatedMorphTargets: interpolated,
      previousMorphTargets: startRecord?.morphTargets,
    };
  }, [selectedPatient, currentYear, minYear, maxYear]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-600">Carregando dados dos pacientes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4 p-8 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-slate-800 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6">
        <PatientSelector
          patients={patients}
          selectedPatientId={selectedPatientId}
          onSelectPatient={setSelectedPatientId}
        />
        <TimelineSlider
          minYear={minYear}
          maxYear={maxYear}
          currentYear={currentYear}
          onChange={setCurrentYear}
        />
      </div>

      <div className="lg:col-span-1 h-[500px] lg:h-auto">
        <ViewerLoader morphTargets={interpolatedMorphTargets} />
      </div>

      <div>
        <MorphStatsPanel
          morphTargets={interpolatedMorphTargets}
          previousTargets={previousMorphTargets}
        />
      </div>
    </div>
  );
}
