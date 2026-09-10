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
  if (size === 'lg' || size === 'xl') {
    return (
      <div className={cn('inline-flex flex-col items-center justify-center select-none', className)}>
        <span
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#111111',
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}
        >
          m<span style={{ color: '#F5A623' }}>.</span>
        </span>
        {showText && (
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#111111',
              letterSpacing: '0.2px',
              marginTop: '4px',
            }}
          >
            MetricLab
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5 select-none', className)}>
      <span
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#111111',
          letterSpacing: '-0.5px',
          lineHeight: 1,
        }}
      >
        m<span style={{ color: '#F5A623' }}>.</span>
      </span>
      {showText && (
        <span
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#111111',
            letterSpacing: '0.2px',
          }}
        >
          MetricLab
        </span>
      )}
    </div>
  );
}
