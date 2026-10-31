import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (typeof dialog.showModal === 'function') {
        if (!dialog.open) {
          dialog.showModal();
        }
      } else {
        dialog.setAttribute('open', '');
      }
    } else {
      if (typeof dialog.close === 'function') {
        if (dialog.open) {
          dialog.close();
        }
      } else {
        dialog.removeAttribute('open');
      }
    }
  }, [isOpen]);

  // Handle native Escape key
  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onClose();
  };

  // Safe light dismiss (outside click check)
  const isOutside = (e: React.PointerEvent<HTMLDialogElement>, el: HTMLDialogElement) => {
    const r = el.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    if (dialogRef.current) {
      pressedOutsideRef.current = isOutside(e, dialogRef.current);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    if (pressedOutsideRef.current && dialogRef.current && isOutside(e, dialogRef.current)) {
      onClose();
    }
    pressedOutsideRef.current = false;
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
      className={cn(
        'backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm',
        'p-0 rounded-xl shadow-2xl border border-slate-200 bg-white text-slate-900',
        'w-full max-w-lg m-auto overflow-hidden',
        className,
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h2 id="dialog-title" className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            {description && (
              <p id="dialog-description" className="text-sm text-slate-600 mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}
