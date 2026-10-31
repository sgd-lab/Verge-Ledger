import React from 'react';
import { HardDrive, CheckCircle2, RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import type { SyncState } from '../hooks/useSyncStatus';

export interface SyncStatusBadgeProps {
  state: SyncState;
  lastSyncedAt?: string | null;
  className?: string;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ state, className = '' }) => {
  const configs: Record<
    SyncState,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    'local-only': {
      label: 'Local Only',
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300',
      icon: <HardDrive className="w-3.5 h-3.5 mr-1.5 text-slate-600" aria-hidden="true" />,
    },
    synced: {
      label: 'Synced',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" aria-hidden="true" />,
    },
    syncing: {
      label: 'Syncing...',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-300',
      icon: (
        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-blue-600" aria-hidden="true" />
      ),
    },
    offline: {
      label: 'Offline Mode',
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-amber-300',
      icon: <WifiOff className="w-3.5 h-3.5 mr-1.5 text-amber-600" aria-hidden="true" />,
    },
    error: {
      label: 'Sync Error',
      bg: 'bg-red-50',
      text: 'text-red-900',
      border: 'border-red-300',
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-red-600" aria-hidden="true" />,
    },
  };

  const config = configs[state];

  return (
    <div
      role="status"
      aria-label={`Storage synchronization status: ${config.label}`}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};
