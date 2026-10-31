import React from 'react';
import { Calculator } from 'lucide-react';

export function SimulatorPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="h-6 w-6 text-emerald-700" aria-hidden="true" />
          <span>Which Cut Should We Drop? Scenario Simulator</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Model annual mowing regimes, fuel reductions, cost savings, and biodiversity trajectory
          while enforcing visibility safety locks.
        </p>
      </div>
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-3">
        <p className="text-slate-600">
          Simulator ready. Configure verge mileage and annual cut passes to project savings.
        </p>
      </div>
    </div>
  );
}
