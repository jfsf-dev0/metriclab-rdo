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
      primary: 'bg-[#111111] hover:bg-black active:bg-[#222222] text-white font-medium rounded-[6px] transition-colors disabled:opacity-40',
      secondary: 'bg-transparent hover:bg-[#EFEFED] text-[#111111] font-normal transition-colors disabled:opacity-40',
      danger: 'bg-[#111111] hover:bg-black text-white font-medium rounded-[6px] transition-colors disabled:opacity-40',
      outline: 'bg-transparent border border-[#E5E5E3] text-[#111111] hover:bg-[#EFEFED] rounded-[6px] font-medium transition-colors disabled:opacity-40',
      ghost: 'bg-transparent text-[#6B6B6B] hover:text-[#111111] hover:bg-[#EFEFED] rounded-[6px] transition-colors disabled:opacity-40',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-[13px] min-h-[36px]',
      md: 'px-6 py-3 text-[14px] min-h-[48px]',
      lg: 'px-6 py-3 text-[15px] min-h-[48px]',
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
