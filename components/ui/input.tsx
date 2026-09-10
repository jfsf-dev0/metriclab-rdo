import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px] mb-2"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b border-[#E5E5E3] rounded-none py-3 text-[15px] text-[#111111] placeholder:text-[#9B9B9B] transition-colors focus:outline-none focus:border-b-[#111111] disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'border-b-[#111111]',
            className
          )}
          {...props}
        />
        {error && <p className="text-[12px] text-[#111111] mt-1.5">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
