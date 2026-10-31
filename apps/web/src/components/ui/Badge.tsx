import React from 'react';
import {
  Leaf,
  Sparkles,
  Search,
  Database,
  CheckCircle,
  RefreshCw,
  WifiOff,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type BadgeVariant =
  | 'tier-ordinary'
  | 'tier-promising'
  | 'tier-expert'
  | 'status-local'
  | 'status-synced'
  | 'status-syncing'
  | 'status-offline'
  | 'status-error'
  | 'demo';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  customText?: string;
}

export function Badge({
  variant,
  customText,
  className,
  ...props
}: BadgeProps): React.ReactElement {
  const configs: Record<BadgeVariant, { label: string; icon: React.ReactNode; styles: string }> = {
    'tier-ordinary': {
      label: 'Ordinary verge',
      icon: <Leaf className="h-3.5 w-3.5" aria-hidden="true" />,
      styles: 'bg-slate-100 text-slate-800 border-slate-300',
    },
    'tier-promising': {
      label: 'Promising verge',
      icon: <Sparkles className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />,
      styles: 'bg-amber-100 text-amber-950 border-amber-300 font-semibold',
    },
    'tier-expert': {
      label: 'Refer for expert review',
      icon: <Search className="h-3.5 w-3.5 text-purple-700" aria-hidden="true" />,
      styles: 'bg-purple-100 text-purple-950 border-purple-300 font-semibold',
    },
    'status-local': {
      label: 'Local Only',
      icon: <Database className="h-3.5 w-3.5" aria-hidden="true" />,
      styles: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    'status-synced': {
      label: 'Synced',
      icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />,
      styles: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    },
    'status-syncing': {
      label: 'Syncing...',
      icon: <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-700" aria-hidden="true" />,
      styles: 'bg-blue-50 text-blue-900 border-blue-300',
    },
    'status-offline': {
      label: 'Offline',
      icon: <WifiOff className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />,
      styles: 'bg-amber-50 text-amber-900 border-amber-300',
    },
    'status-error': {
      label: 'Sync Error',
      icon: <AlertTriangle className="h-3.5 w-3.5 text-red-700" aria-hidden="true" />,
      styles: 'bg-red-50 text-red-900 border-red-300',
    },
    demo: {
      label: 'DEMO DATA',
      icon: <AlertOctagon className="h-3.5 w-3.5 text-rose-700" aria-hidden="true" />,
      styles: 'bg-rose-100 text-rose-950 border-rose-300 font-bold tracking-wide',
    },
  };

  const config = configs[variant];
  const label = customText || config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border',
        config.styles,
        className,
      )}
      {...props}
    >
      {config.icon}
      <span>{label}</span>
    </span>
  );
}
