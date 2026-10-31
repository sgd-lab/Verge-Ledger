import React from 'react';
import { Undo2, Check, X, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateSegmentLength } from '@verge-ledger/core';

export interface DrawingToolbarProps {
  isDrawing: boolean;
  vertexCount: number;
  runningLengthM: number;
  onStartDrawing: () => void;
  onStartAtGps: () => void;
  onUndoPoint: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onSwitchToManualEntry?: () => void;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  isDrawing,
  vertexCount,
  runningLengthM,
  onStartDrawing,
  onStartAtGps,
  onUndoPoint,
  onComplete,
  onCancel,
  onSwitchToManualEntry,
}) => {
  const validation = validateSegmentLength(runningLengthM);
  const isValidLength = validation.valid && vertexCount >= 2;

  return (
    <div
      className="absolute top-3 left-3 right-3 md:right-auto md:w-96 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-3 space-y-2"
      role="toolbar"
      aria-label="Map drawing tools"
    >
      {!isDrawing ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onStartDrawing}
            className="flex-1 min-h-[44px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-sm text-sm flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Draw Verge Segment
          </button>
          <button
            type="button"
            onClick={onStartAtGps}
            className="flex-1 min-h-[44px] px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-md shadow-sm text-sm flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <MapPin className="w-4 h-4" aria-hidden="true" />
            Start at My Location
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700">
            <span>Points: {vertexCount}</span>
            <span className="font-semibold text-sm">
              Length:{' '}
              {runningLengthM < 100 ? runningLengthM.toFixed(1) : Math.round(runningLengthM)} m
            </span>
          </div>

          {/* Validation Status Badge */}
          <div
            className={`text-xs px-2 py-1 rounded flex items-center gap-1.5 ${
              isValidLength
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {isValidLength ? (
              <>
                <CheckCircle2
                  className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                  aria-hidden="true"
                />
                <span>Ready to save ({runningLengthM.toFixed(1)} m)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                <span>{validation.error || 'Click map to place next vertex (min 2 points)'}</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onUndoPoint}
              disabled={vertexCount === 0}
              aria-label="Undo last point (Ctrl+Z)"
              className="min-h-[44px] min-w-[44px] p-2 text-slate-700 hover:bg-slate-100 disabled:opacity-40 rounded border border-slate-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <Undo2 className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onComplete}
              disabled={!isValidLength}
              className="flex-1 min-h-[44px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-medium rounded text-sm flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              Complete Segment
            </button>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel drawing (Escape)"
              className="min-h-[44px] min-w-[44px] p-2 text-rose-700 hover:bg-rose-50 rounded border border-rose-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Accessible Non-Map Coordinate Fallback (ACC-1) */}
      {onSwitchToManualEntry && (
        <div className="text-center pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={onSwitchToManualEntry}
            className="text-xs text-slate-500 hover:text-emerald-700 underline focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
          >
            Unable to use map? Enter coordinates manually
          </button>
        </div>
      )}
    </div>
  );
};
