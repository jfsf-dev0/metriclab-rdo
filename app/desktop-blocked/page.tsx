'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCodeLib from 'qrcode';

export default function DesktopBlockedPage() {
  const router = useRouter();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const targetUrl = 'https://rdo.metriclab.com.br';
  const urlDisplay = 'rdo.metriclab.com.br';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDev = process.env.NODE_ENV === 'development';
      const isAudit = window.sessionStorage.getItem('ml_audit_bypass') === 'metriclab_audit_2026';

      // Standalone bypass APENAS em dev ou durante auditoria do Playwright
      if (isDev || isAudit) {
        const isStandalone =
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true ||
          document.cookie.includes('ml_pwa_standalone=true');

        if (isStandalone) {
          router.replace('/login');
          return;
        }
      }

      // Se for dispositivo móvel real com largura de tela mobile
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(
          navigator.userAgent
        ) || (navigator as any).userAgentData?.mobile;

      if (isMobile && window.innerWidth <= 768) {
        router.replace('/login');
        return;
      }

      // Gerar QR Code limpo 160x160
      QRCodeLib.toDataURL(targetUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: '#111111',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Erro ao gerar QR Code:', err));
    }
  }, [router, targetUrl]);

  return (
    <main className="min-h-screen w-full bg-[#F7F7F5] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="max-w-[340px] w-full flex flex-col items-center">
        {/* Logo m. no topo, 32px, Inter 700, ponto #F5A623 */}
        <div className="leading-none tracking-tight mb-6">
          <span className="text-[32px] font-bold text-[#111111]">
            m<span className="text-[#F5A623]">.</span>
          </span>
        </div>

        {/* Título: "Este aplicativo é exclusivo para dispositivos móveis", Inter 600, 18px, #111111 */}
        <h1 className="text-[18px] font-semibold text-[#111111] tracking-[-0.3px] leading-snug">
          Este aplicativo é exclusivo para dispositivos móveis
        </h1>

        {/* Subtítulo: "Acesse pelo seu celular para continuar.", Inter 400, 14px, #9CA3AF */}
        <p className="text-[14px] font-normal text-[#9CA3AF] mt-2 mb-8 leading-relaxed">
          Acesse pelo seu celular para continuar.
        </p>

        {/* QR Code centralizado, 160x160px */}
        <div className="w-[160px] h-[160px] bg-white border border-[#E2E2DC] rounded-[12px] p-2 flex items-center justify-center shadow-none mb-4">
          {qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt="QR Code de acesso mobile"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-[#F7F7F5] rounded-[8px] flex items-center justify-center text-[12px] text-[#9CA3AF]">
              Carregando...
            </div>
          )}
        </div>

        {/* URL abaixo do QR: Inter 400, 13px, #9CA3AF */}
        <span className="text-[13px] font-normal text-[#9CA3AF]">
          {urlDisplay}
        </span>
      </div>
    </main>
  );
}
