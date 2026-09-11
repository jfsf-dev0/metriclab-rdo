'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, ClipboardList, AlertTriangle, WifiOff, Copy, Check, QrCode } from 'lucide-react';
import QRCodeLib from 'qrcode';

export default function DesktopBlockedPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const targetUrl = 'https://rdo.metriclab.com.br';

  // Se o usuário estiver no modo PWA instalado (standalone) ou for dispositivo móvel, redireciona
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
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent) ||
        (navigator as any).userAgentData?.mobile;

      if (isMobile) {
        router.replace('/login');
        return;
      }

      // Gera QR code real de alta definição para https://rdo.metriclab.com.br
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
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F0F0F0] flex flex-col font-sans">
      {/* Header Desktop Superior */}
      <header className="w-full bg-white border-b border-[#E5E5E3] px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-[24px] tracking-tight">
            <span className="text-[#111111]">m</span>
            <span className="text-[#F5A623]">.</span>
          </span>
          <div className="h-4 w-px bg-[#E5E5E3]" />
          <div className="flex items-baseline gap-2">
            <span className="text-[14px] font-bold text-[#111111] tracking-tight">
              Relatório Diário de Obra
            </span>
            <span className="text-[12px] text-[#9B9B9B] hidden sm:inline">
              Consórcio Pacote 15 e 19
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#F7F7F7] border border-[#E5E5E3] px-3 py-1 rounded-full text-[12px] font-medium text-[#6B6B6B]">
          <Smartphone className="w-3.5 h-3.5 text-[#111111]" />
          <span>Acesso Exclusivo Mobile</span>
        </div>
      </header>

      {/* Conteúdo Principal em Tela Completa */}
      <main className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Coluna da Esquerda: Mensagem e Recursos de Campo */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="inline-flex items-center gap-2 bg-white border border-[#E5E5E3] px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider text-[#111111] uppercase self-start mb-4">
              <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
              Dispositivo Não Suportado
            </div>

            <h1 className="text-[28px] sm:text-[34px] font-bold text-[#111111] leading-[1.2] tracking-tight">
              Este sistema é exclusivo para acesso mobile. Acesse pelo seu celular.
            </h1>

            <p className="text-[15px] text-[#6B6B6B] leading-relaxed mt-4">
              Para assegurar o registro em tempo real de equipes, clima, evolução das frentes de serviço e ocorrências diretamente no canteiro, a aplicação opera exclusivamente em smartphones.
            </p>

            {/* Grid de Funcionalidades de Campo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
              <div className="bg-white border border-[#E5E5E3] rounded-[14px] p-4 flex flex-col">
                <div className="w-8 h-8 rounded-[8px] bg-[#F7F7F7] border border-[#E5E5E3] flex items-center justify-center mb-3">
                  <ClipboardList className="w-4 h-4 text-[#111111]" />
                </div>
                <h3 className="text-[13px] font-bold text-[#111111]">Lançamento Diário</h3>
                <p className="text-[11.5px] text-[#6B6B6B] mt-1 leading-snug">
                  Controle de equipes, maquinários e frentes de obra.
                </p>
              </div>

              <div className="bg-white border border-[#E5E5E3] rounded-[14px] p-4 flex flex-col">
                <div className="w-8 h-8 rounded-[8px] bg-[#F7F7F7] border border-[#E5E5E3] flex items-center justify-center mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#111111]" />
                </div>
                <h3 className="text-[13px] font-bold text-[#111111]">Ocorrências</h3>
                <p className="text-[11.5px] text-[#6B6B6B] mt-1 leading-snug">
                  Apontamento imediato de interferências e paralisações.
                </p>
              </div>

              <div className="bg-white border border-[#E5E5E3] rounded-[14px] p-4 flex flex-col">
                <div className="w-8 h-8 rounded-[8px] bg-[#F7F7F7] border border-[#E5E5E3] flex items-center justify-center mb-3">
                  <WifiOff className="w-4 h-4 text-[#111111]" />
                </div>
                <h3 className="text-[13px] font-bold text-[#111111]">Modo Offline</h3>
                <p className="text-[11.5px] text-[#6B6B6B] mt-1 leading-snug">
                  Lançamento completo mesmo em trechos sem sinal.
                </p>
              </div>
            </div>

            {/* Ação Auxiliar: Copiar Link */}
            <div className="mt-8 pt-6 border-t border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[12.5px] text-[#6B6B6B]">
                Envie o link para o seu WhatsApp ou abra direto no navegador mobile:
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F7F7F7] border border-[#E5E5E3] text-[#111111] text-[12.5px] font-semibold px-4 py-2 rounded-[8px] transition-colors shrink-0 shadow-none"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#6B6B6B]" />
                    <span>Copiar Link do App</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Coluna da Direita: Card com QR Code Real */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[20px] border border-[#E5E5E3] p-8 text-center shadow-none flex flex-col items-center">
              <div className="w-10 h-10 rounded-[10px] bg-[#F7F7F7] border border-[#E5E5E3] flex items-center justify-center mb-3">
                <QrCode className="w-5 h-5 text-[#111111]" />
              </div>

              <h2 className="text-[18px] font-bold text-[#111111] tracking-tight">
                Abra pelo Smartphone
              </h2>
              <p className="text-[13px] text-[#6B6B6B] mt-1">
                Aponte a câmera do seu celular para o QR Code abaixo:
              </p>

              {/* Moldura e Renderização do QR Code Real */}
              <div className="w-64 h-64 my-6 bg-white border border-[#E5E5E3] rounded-[16px] p-3.5 flex items-center justify-center shadow-sm">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code de acesso para rdo.metriclab.com.br"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  /* Fallback SVG vetorial real para rdo.metriclab.com.br */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 31 31"
                    shapeRendering="crispEdges"
                    className="w-full h-full"
                  >
                    <path fill="#ffffff" d="M0 0h31v31H0z" />
                    <path
                      stroke="#111111"
                      d="M1 1.5h7m1 0h2m1 0h5m2 0h3m1 0h7M1 2.5h1m5 0h1m1 0h1m2 0h3m2 0h1m3 0h1m1 0h1m5 0h1M1 3.5h1m1 0h3m1 0h1m2 0h2m1 0h1m3 0h1m1 0h1m1 0h1m1 0h1m1 0h3m1 0h1M1 4.5h1m1 0h3m1 0h1m1 0h3m3 0h2m1 0h1m1 0h1m2 0h1m1 0h3m1 0h1M1 5.5h1m1 0h3m1 0h1m3 0h1m1 0h1m1 0h1m1 0h1m2 0h2m1 0h1m1 0h3m1 0h1M1 6.5h1m5 0h1m2 0h2m1 0h2m1 0h5m2 0h1m5 0h1M1 7.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M9 8.5h1m2 0h2m2 0h6M1 9.5h1m1 0h2m1 0h3m3 0h3m1 0h1m1 0h3m2 0h1m2 0h1m1 0h2M2 10.5h1m5 0h3m3 0h3m1 0h8m3 0h1M2 11.5h1m2 0h5m1 0h1m1 0h2m2 0h3m2 0h4m1 0h2M1 12.5h3m1 0h1m5 0h3m3 0h1m1 0h2m1 0h4m3 0h1M1 13.5h5m1 0h2m1 0h1m4 0h2m1 0h2m6 0h2M1 14.5h1m2 0h3m4 0h1m1 0h1m1 0h1m1 0h1m2 0h1m2 0h2m2 0h3M7 15.5h1m3 0h2m1 0h1m1 0h5m1 0h4m1 0h3M3 16.5h2m1 0h1m1 0h4m3 0h1m1 0h1m1 0h1m1 0h1m2 0h1m3 0h1M7 17.5h4m2 0h1m1 0h3m1 0h4m1 0h3m1 0h1M2 18.5h2m8 0h1m2 0h1m1 0h1m3 0h2m1 0h1m1 0h3M1 19.5h1m2 0h2m1 0h2m3 0h8m1 0h1m3 0h1m1 0h1M3 20.5h1m2 0h1m2 0h3m2 0h2m2 0h1m1 0h2m5 0h1M2 21.5h1m4 0h2m2 0h1m1 0h3m1 0h11M9 22.5h1m3 0h1m2 0h2m3 0h1m3 0h5M1 23.5h7m1 0h1m1 0h3m1 0h2m3 0h2m1 0h1m1 0h2m1 0h1M1 24.5h1m5 0h1m1 0h1m2 0h1m1 0h3m4 0h1m3 0h2m2 0h1M1 25.5h1m1 0h3m1 0h1m2 0h4m3 0h1m1 0h1m1 0h5m1 0h1m1 0h1M1 26.5h1m1 0h3m1 0h1m1 0h1m3 0h2m5 0h3m1 0h3m1 0h1M1 27.5h1m1 0h3m1 0h1m1 0h2m4 0h1m2 0h5m1 0h1m2 0h1m1 0h1M1 28.5h1m5 0h1m2 0h1m1 0h1m2 0h2m1 0h2m1 0h2m3 0h1m1 0h1M1 29.5h7m1 0h1m1 0h2m5 0h4m1 0h2m1 0h1m1 0h1"
                    />
                  </svg>
                )}
              </div>

              {/* Endereço web direto */}
              <div className="bg-[#F7F7F7] border border-[#E5E5E3] rounded-[8px] px-3.5 py-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[12px] font-mono text-[#111111] font-medium">
                  rdo.metriclab.com.br
                </span>
              </div>

              <p className="text-[11px] text-[#9B9B9B] mt-4 leading-normal">
                Compatível com câmeras nativas de iOS e Android
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Desktop Inferior */}
      <footer className="w-full bg-white border-t border-[#E5E5E3] py-4 px-6 text-center text-[12px] text-[#9B9B9B]">
        MetricLab Engenharia · Consórcio Lote 15 e 19 · Plataforma Operacional de Campo
      </footer>
    </div>
  );
}
