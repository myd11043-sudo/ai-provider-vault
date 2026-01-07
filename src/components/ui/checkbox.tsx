'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label htmlFor={checkboxId} className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          id={checkboxId}
          checked={checked}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            'h-4 w-4 shrink-0 rounded-sm border border-zinc-900 shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 peer-checked:bg-zinc-900 peer-checked:text-zinc-50 dark:border-zinc-50 dark:peer-checked:bg-zinc-50 dark:peer-checked:text-zinc-900 flex items-center justify-center',
            className
          )}
        >
          {checked && (
            <Check className="h-3 w-3" />
          )}
        </div>
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
