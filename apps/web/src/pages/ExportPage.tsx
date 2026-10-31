import React from 'react';
import { Download } from 'lucide-react';

export function ExportPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Download className="h-6 w-6 text-emerald-700" aria-hidden="true" />
          <span>Evidence Pack & Data Export</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Export surveyed verge data as RFC 7946 GeoJSON, CSV, or generate a single-page printable
          Evidence Pack for council meetings.
        </p>
      </div>
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-3">
        <p className="text-slate-600">
          Export options available for all local workspace verges and observations.
        </p>
      </div>
    </div>
  );
}
