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
            className="block text-[12px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full bg-white border border-[#E2E2DC] rounded-[8px] h-[48px] px-4 py-3.5 text-[15px] text-[#111111] placeholder:text-[#9CA3AF] transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-[12px] text-[#DC2626] mt-1.5">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
