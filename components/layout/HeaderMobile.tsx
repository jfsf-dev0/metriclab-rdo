'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MetricLabLogo } from '@/components/brand/MetricLabLogo';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HeaderMobileProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  backHref?: string;
  rightBadge?: string;
  rightBadgeVariant?: 'blue' | 'green' | 'amber' | 'red' | 'gray';
  greeting?: string;
  className?: string;
}

export function HeaderMobile({
  title,
  showBack = false,
  onBack,
  backHref,
  rightBadge,
  rightBadgeVariant = 'blue',
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
        'sticky top-0 z-40 h-14 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 select-none',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-[70px]">
        {showBack ? (
          <button
            onClick={handleBack}
            className="p-1.5 -ml-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 active:scale-95 transition-all flex items-center gap-1 text-xs"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium hidden xs:inline">Voltar</span>
          </button>
        ) : (
          <Link href="/menu" className="flex items-center">
            <MetricLabLogo size="sm" showText={true} />
          </Link>
        )}
      </div>

      {title && (
        <div className="flex-1 text-center px-2">
          <h1 className="text-sm font-bold text-gray-900 truncate">
            {title}
          </h1>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 min-w-[70px]">
        {greeting && (
          <span className="text-xs text-gray-600 font-medium hidden sm:inline">
            {greeting}
          </span>
        )}
        {rightBadge && (
          <Badge variant={rightBadgeVariant}>
            {rightBadge}
          </Badge>
        )}
      </div>
    </header>
  );
}
