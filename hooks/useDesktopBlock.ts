'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useDesktopBlock() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDesktop = () => {
      // Exceção 1: Desenvolvimento com standalone
      const isDev = process.env.NODE_ENV === 'development';
      if (
        isDev &&
        (window.localStorage.getItem('ml_pwa_standalone') === 'true' ||
          document.cookie.includes('ml_pwa_standalone=true'))
      ) {
        return;
      }

      // Exceção 2: Auditoria automatizada do Playwright (header x-playwright-audit / secret)
      const auditBypass = window.sessionStorage.getItem('ml_audit_bypass');
      if (auditBypass === 'metriclab_audit_2026') {
        return;
      }

      // Se window.innerWidth > 768 → redirecionar para /desktop-blocked sem delay
      if (window.innerWidth > 768) {
        router.replace('/desktop-blocked');
      }
    };

    // Executar no mount
    checkDesktop();

    // Executar no resize
    window.addEventListener('resize', checkDesktop);
    return () => {
      window.removeEventListener('resize', checkDesktop);
    };
  }, [router]);
}
