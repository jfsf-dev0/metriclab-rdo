import React from 'react';
import { cn } from '@/lib/utils';

interface MetricLabLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function MetricLabLogo({
  className,
  size = 'md',
  showText = true,
}: MetricLabLogoProps) {
  const markSizes = {
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-8 h-8 text-sm rounded-xl',
    lg: 'w-12 h-12 text-xl rounded-2xl',
    xl: 'w-16 h-16 text-2xl rounded-2xl',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <div
        className={cn(
          'bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30 transition-transform',
          markSizes[size]
        )}
      >
        <span className="leading-none flex items-baseline">
          m<span className="text-[#FFC028] font-black">.</span>
        </span>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span
            className={cn(
              'font-extrabold tracking-wider text-gray-900 uppercase leading-none font-sans',
              textSizes[size]
            )}
          >
            Metric<span className="text-blue-600">Lab</span>
          </span>
        </div>
      )}
    </div>
  );
}
