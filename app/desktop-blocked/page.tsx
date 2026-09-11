'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check } from 'lucide-react';
import QRCodeLib from 'qrcode';

export default function DesktopBlockedPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const targetUrl = 'https://rdo.metriclab.com.br';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.cookie.includes('ml_pwa_standalone=true');

      if (isStandalone) {
        document.cookie = 'ml_pwa_standalone=true; path=/; max-age=31536000; SameSite=Lax';
        router.replace('/login');
        return;
      }

      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(
          navigator.userAgent
        ) || (navigator as any).userAgentData?.mobile;

      if (isMobile) {
        router.replace('/login');
        return;
      }

      // Generate clean QR code
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

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#F7F7F5] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="max-w-[340px] w-full flex flex-col items-center">
        {/* Logo "m." no topo */}
        <div className="leading-none tracking-tight mb-6">
          <span className="text-[32px] font-bold text-[#111111]">
            m<span className="text-[#F5A623]">.</span>
          </span>
        </div>

        {/* Título: Inter 600, 18px, cor #111111 */}
        <h1 className="text-[18px] font-semibold text-[#111111] tracking-[-0.3px]">
          Acesso exclusivo mobile
        </h1>

        {/* Mensagem: Inter 400, 14px, cor #9CA3AF, max-width 320px */}
        <p className="text-[14px] font-normal text-[#9CA3AF] mt-2 mb-8 max-w-[320px] leading-relaxed">
          Esta ferramenta foi desenhada para uso em campo no smartphone.
        </p>

        {/* QR Code gerado dinamicamente: 160x160px, borda 1px #E2E2DC, sem raio */}
        <div className="w-[160px] h-[160px] bg-white border border-[#E2E2DC] rounded-none p-2 flex items-center justify-center shadow-none mb-6">
          {qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt="QR Code de acesso mobile"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-[#F7F7F5] flex items-center justify-center text-[12px] text-[#9CA3AF]">
              Carregando...
            </div>
          )}
        </div>

        {/* URL em texto mono 12px com botão de copiar discreto */}
        <div className="inline-flex items-center gap-2 bg-white border border-[#E2E2DC] rounded-none px-3 py-2">
          <span className="text-[12px] font-mono text-[#111111]">
            rdo.metriclab.com.br
          </span>
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copiar link"
            className="text-[#6B7280] hover:text-[#111111] p-0.5 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#111111]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
