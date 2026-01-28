'use client';

import { useState, useEffect, ComponentType } from 'react';
import { MorphTargets } from '@/lib/clinical-mapper';
import { Loader2 } from 'lucide-react';

interface ViewerLoaderProps {
  morphTargets: MorphTargets;
}

function LoadingPlaceholder() {
  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-slate-500">Carregando visualizador 3D...</p>
      </div>
    </div>
  );
}

export default function ViewerLoader({ morphTargets }: ViewerLoaderProps) {
  const [ThreeViewer, setThreeViewer] = useState<ComponentType<{ morphTargets: MorphTargets }> | null>(null);

  useEffect(() => {
    // Only import on client side
    import('./three-viewer').then((mod) => {
      setThreeViewer(() => mod.default);
    });
  }, []);

  if (!ThreeViewer) {
    return <LoadingPlaceholder />;
  }

  return <ThreeViewer morphTargets={morphTargets} />;
}
