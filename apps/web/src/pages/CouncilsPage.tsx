import React from 'react';
import { Landmark } from 'lucide-react';

export function CouncilsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Landmark className="h-6 w-6 text-emerald-700" aria-hidden="true" />
          <span>English Highway Authorities & Council Registry</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Search parish, district, and county policies, contractor schedules, and statutory inquiry
          contacts.
        </p>
      </div>
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-3">
        <p className="text-slate-600">
          Council registry database loaded. Browse authorities or draft a statutory EIR inquiry.
        </p>
      </div>
    </div>
  );
}
