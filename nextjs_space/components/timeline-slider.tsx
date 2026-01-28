'use client';

import { Calendar, TrendingUp } from 'lucide-react';

interface TimelineSliderProps {
  minYear: number;
  maxYear: number;
  currentYear: number;
  onChange: (year: number) => void;
}

export default function TimelineSlider({
  minYear,
  maxYear,
  currentYear,
  onChange,
}: TimelineSliderProps) {
  const progress = ((currentYear - minYear) / (maxYear - minYear)) * 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        Linha do Tempo
      </h3>

      <div className="flex justify-between items-center">
        <span className="text-3xl font-bold text-blue-600">{currentYear}</span>
        <span className="flex items-center gap-1 text-sm text-slate-500">
          <TrendingUp className="w-4 h-4" />
          Progressão Clínica
        </span>
      </div>

      <div className="relative pt-2">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min={minYear}
          max={maxYear}
          step={0.01}
          value={currentYear}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex justify-between text-sm text-slate-500">
        <span>{minYear}</span>
        <span>{maxYear}</span>
      </div>
    </div>
  );
}
