'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MetricLabLogo } from '@/components/brand/MetricLabLogo';
import { cn } from '@/lib/utils';

interface HeaderMobileProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  backHref?: string;
  rightBadge?: string;
  greeting?: string;
  className?: string;
}

export function HeaderMobile({
  title,
  showBack = false,
  onBack,
  backHref,
  rightBadge,
  greeting,
  className,
}: HeaderMobileProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 h-[56px] w-full bg-white border-b border-[#E2E2DC] px-4 flex items-center justify-between select-none',
        className
      )}
    >
      <div className="flex items-center gap-1 min-w-[44px] min-h-[44px]">
        {showBack ? (
          <button
            onClick={handleBack}
            className="min-w-[44px] min-h-[44px] -ml-2 text-[14px] font-medium text-[#111111] hover:text-black cursor-pointer bg-transparent border-none p-0 flex items-center justify-center gap-1"
            aria-label="Voltar"
          >
            ← Voltar
          </button>
        ) : (
          <Link href="/menu" className="flex items-center">
            <MetricLabLogo size="sm" showText={true} />
          </Link>
        )}
      </div>

      {title && (
        <div className="flex-1 text-center px-2">
          <h1 className="text-[18px] font-semibold text-[#111111] truncate tracking-[-0.3px]">
            {title}
          </h1>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 min-w-[44px] min-h-[44px] text-[#111111]">
        {greeting && (
          <span className="text-[13px] text-[#9CA3AF] font-normal">
            {greeting}
          </span>
        )}
        {rightBadge && (
          <span className="bg-white border border-[#E2E2DC] rounded-none px-2 py-0.5 text-[12px] font-medium tracking-[0.04em] text-[#6B7280]">
            {rightBadge}
          </span>
        )}
      </div>
    </header>
  );
}
