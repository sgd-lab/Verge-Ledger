import React, { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, required, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;

    const describedBy =
      [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-slate-800">
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
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            'w-full h-11 px-3.5 py-2 text-sm rounded-md bg-white border transition-colors',
            'border-slate-400 text-slate-900 placeholder:text-slate-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:border-emerald-700 focus-visible:ring-offset-1',
            error && 'border-red-600 focus-visible:ring-red-600 focus-visible:border-red-600',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
