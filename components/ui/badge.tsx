import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'azul' | 'verde' | 'amarelo' | 'vermelho';
  className?: string;
}

export function Badge({ children, variant = 'blue', className }: BadgeProps) {
  const styles = {
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    azul: 'bg-blue-50 text-blue-700 border border-blue-200',
    green: 'bg-green-50 text-green-700 border border-green-200',
    verde: 'bg-green-50 text-green-700 border border-green-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    amarelo: 'bg-amber-50 text-amber-700 border border-amber-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
    vermelho: 'bg-red-50 text-red-700 border border-red-200',
    gray: 'bg-gray-100 text-gray-700 border border-gray-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
