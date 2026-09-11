import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-[#111111] hover:bg-black active:opacity-85 text-white font-semibold rounded-none transition-opacity disabled:opacity-40 shadow-none',
      secondary: 'bg-white border border-[#111111] hover:bg-[#F7F7F5] active:opacity-85 text-[#111111] font-semibold rounded-none transition-opacity disabled:opacity-40 shadow-none',
      danger: 'bg-[#DC2626] hover:bg-red-700 active:opacity-85 text-white font-semibold rounded-none transition-opacity disabled:opacity-40 shadow-none',
      outline: 'bg-white border border-[#E2E2DC] text-[#111111] hover:border-[#111111] active:opacity-85 rounded-none font-medium transition-colors disabled:opacity-40 shadow-none',
      ghost: 'bg-transparent text-[#6B7280] hover:text-[#111111] hover:bg-[#EFEFED] rounded-none transition-colors disabled:opacity-40',
    };

    const sizes = {
      sm: 'px-4 py-2 text-[13px] h-[40px]',
      md: 'px-6 py-3 text-[15px] h-[52px]',
      lg: 'px-6 py-3 text-[15px] h-[52px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
