import React from 'react';
import { Compass } from 'lucide-react';

export function SurveyPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Compass className="h-6 w-6 text-emerald-700" aria-hidden="true" />
          <span>Five-Minute Road Verge Survey</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Record segment geometry, botanical indicators, and sward structure. Works completely
          offline.
        </p>
      </div>
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-3">
        <p className="text-slate-600">
          Survey workflow active. Select a segment on the map or enter coordinates to begin.
        </p>
      </div>
    </div>
  );
}
