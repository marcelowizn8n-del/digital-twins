'use client';

import { ChevronDown, User, Activity, Heart, Droplets } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  sex: string;
  birthYear: number;
  records: Array<{
    year: number;
    diseaseCodes: string[];
    notes?: string | null;
  }>;
}

interface PatientSelectorProps {
  patients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (id: string) => void;
}

const diseaseLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  E11: { label: 'Diabetes Tipo 2', icon: <Droplets className="w-4 h-4" />, color: 'bg-amber-100 text-amber-800' },
  I10: { label: 'Hipertensão', icon: <Activity className="w-4 h-4" />, color: 'bg-red-100 text-red-800' },
  I25: { label: 'Doença Cardíaca', icon: <Heart className="w-4 h-4" />, color: 'bg-purple-100 text-purple-800' },
};

export default function PatientSelector({
  patients,
  selectedPatientId,
  onSelectPatient,
}: PatientSelectorProps) {
  const currentYear = new Date().getFullYear();
  const selectedPatient = patients?.find((p) => p?.id === selectedPatientId);
  const latestRecord = selectedPatient?.records?.[selectedPatient?.records?.length - 1];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <User className="w-5 h-5 text-blue-600" />
        Selecionar Paciente
      </h3>

      <div className="relative">
        <select
          value={selectedPatientId ?? ''}
          onChange={(e) => onSelectPatient(e.target.value)}
          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 pr-10 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="">Escolha um paciente...</option>
          {(patients ?? []).map((patient) => (
            <option key={patient?.id} value={patient?.id}>
              {patient?.name} ({patient?.sex === 'M' ? 'Masculino' : 'Feminino'}, {currentYear - (patient?.birthYear ?? 0)} anos)
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      </div>

      {selectedPatient && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Idade</span>
            <span className="font-semibold text-slate-800">
              {currentYear - (selectedPatient?.birthYear ?? 0)} anos
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Sexo</span>
            <span className="font-semibold text-slate-800">
              {selectedPatient?.sex === 'M' ? 'Masculino' : 'Feminino'}
            </span>
          </div>
          
          {(latestRecord?.diseaseCodes?.length ?? 0) > 0 && (
            <div className="pt-2">
              <span className="text-sm text-slate-500 block mb-2">Condições Atuais</span>
              <div className="flex flex-wrap gap-2">
                {(latestRecord?.diseaseCodes ?? []).map((code) => {
                  const disease = diseaseLabels[code];
                  return disease ? (
                    <span
                      key={code}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${disease.color}`}
                    >
                      {disease.icon}
                      {disease.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
