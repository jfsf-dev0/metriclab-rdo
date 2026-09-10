import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  flat?: boolean;
}

export function Card({ className, flat = false, children, ...props }: CardProps) {
  if (flat) {
    return (
      <div
        className={cn('bg-transparent border-b border-[#E5E5E3] py-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-[#FFFFFF] border border-[#E5E5E3] rounded-[8px] p-5 shadow-none transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
