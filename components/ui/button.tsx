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
      primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm font-semibold transition-all duration-200',
      secondary: 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-200',
      danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold shadow-sm transition-all duration-200',
      outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all duration-200',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 active:scale-[0.98] transition-all duration-200',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[36px]',
      md: 'px-6 py-3 text-sm min-h-[48px] rounded-xl font-semibold',
      lg: 'px-6 py-3 text-base min-h-[48px] rounded-xl font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
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
