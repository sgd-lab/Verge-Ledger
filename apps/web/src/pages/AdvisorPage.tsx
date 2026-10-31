import React from 'react';
import { Sprout } from 'lucide-react';

export function AdvisorPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sprout className="h-6 w-6 text-emerald-700" aria-hidden="true" />
          <span>Cut-Timing Advisor (verge-advice-v1)</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Evidence-backed mowing regimes balancing botanical seed-set, safety sightlines, and
          invertebrate shelter.
        </p>
      </div>
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-3">
        <p className="text-slate-600">
          Select a surveyed verge segment to view recommended mowing windows and safety overlays.
        </p>
      </div>
    </div>
  );
}
