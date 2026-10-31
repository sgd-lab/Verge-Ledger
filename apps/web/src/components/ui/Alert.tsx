import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  ...props
}: AlertProps): React.ReactElement {
  const configs = {
    info: {
      role: 'status',
      icon: <Info className="h-5 w-5 text-blue-700 flex-shrink-0" aria-hidden="true" />,
      styles: 'bg-blue-50 border-blue-200 text-blue-900',
    },
    success: {
      role: 'status',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-700 flex-shrink-0" aria-hidden="true" />,
      styles: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    },
    warning: {
      role: 'alert',
      icon: <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0" aria-hidden="true" />,
      styles: 'bg-amber-50 border-amber-200 text-amber-950',
    },
    error: {
      role: 'alert',
      icon: <AlertCircle className="h-5 w-5 text-red-700 flex-shrink-0" aria-hidden="true" />,
      styles: 'bg-red-50 border-red-200 text-red-950',
    },
  };

  const config = configs[variant];

  return (
    <div
      role={config.role}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border text-sm',
        config.styles,
        className,
      )}
      {...props}
    >
      {config.icon}
      <div className="flex-1 space-y-1">
        {title && <h4 className="font-semibold">{title}</h4>}
        <div>{children}</div>
      </div>
    </div>
  );
}
