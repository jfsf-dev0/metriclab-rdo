import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-2xl shadow-sm p-4 hover:border-gray-300 hover:shadow-md transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
