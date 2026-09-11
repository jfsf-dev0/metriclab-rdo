import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  flat?: boolean;
}

export function Card({ className, flat = false, children, ...props }: CardProps) {
  if (flat) {
    return (
      <div
        className={cn('bg-transparent border-b border-[#E2E2DC] py-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white border border-[#E2E2DC] rounded-none p-4 shadow-none transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
