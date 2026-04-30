/**
 * @file demo-banner.tsx
 * @purpose Banner displayed in demo mode to indicate non-production state
 * @usedBy MainLayout
 * @deps useDemo context
 * @exports DemoBanner
 * @sideEffects None
 */

// frontend/components/demo-banner.tsx
'use client';

import { useDemo } from '@/lib/demo/context';
import { X, Search } from 'lucide-react';

export function DemoBanner() {
  const { isDemo, exitDemo } = useDemo();

  if (!isDemo) return null;

  return (
    <div className="relative z-[100] flex items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-sm font-medium text-amber-950">
      <span>
        <Search className="h-4 w-4 inline mr-1" />
        Mode Demo — Data yang ditampilkan adalah simulasi
      </span>
      <button
        onClick={exitDemo}
        className="inline-flex items-center gap-1 rounded-md bg-amber-500/50 px-2.5 py-1 text-xs font-semibold hover:bg-amber-500/80 transition-colors"
      >
        Keluar Demo
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
