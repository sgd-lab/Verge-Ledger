import React, { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, id, required, options, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const hintId = `${selectId}-hint`;
    const errorId = `${selectId}-error`;

    const describedBy =
      [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-semibold text-slate-800">
            {label}
            {required && (
              <span aria-hidden="true" className="text-red-600 ml-1">
                *
              </span>
            )}
          </label>
        )}
        {hint && (
          <p id={hintId} className="text-xs text-slate-600">
            {hint}
          </p>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(
              'w-full h-11 px-3.5 pr-10 py-2 text-sm rounded-md bg-white border appearance-none transition-colors',
              'border-slate-400 text-slate-900',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:border-emerald-700 focus-visible:ring-offset-1',
              error && 'border-red-600 focus-visible:ring-red-600 focus-visible:border-red-600',
              className,
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none"
            aria-hidden="true"
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';
