'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone } from 'lucide-react';

export default function DesktopBlockedPage() {
  const router = useRouter();

  // Se o usuário estiver no modo PWA instalado (standalone), desbloqueia e redireciona
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone;

      if (isStandalone) {
        document.cookie = 'ml_pwa_standalone=true; path=/; max-age=31536000; SameSite=Lax';
        router.replace('/menu');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-[#F0F0F0] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-white rounded-[16px] border border-[#E5E5E3] p-8 text-center shadow-none">
        {/* Logo m. */}
        <div className="mb-2">
          <span className="font-bold text-[32px] tracking-tight font-sans">
            <span className="text-[#111111]">m</span>
            <span className="text-[#F5A623]">.</span>
          </span>
        </div>

        {/* Título & Subtítulo */}
        <h1 className="text-[20px] font-bold text-[#111111] tracking-tight mt-1">
          Relatório Diário de Obra
        </h1>
        <p className="text-[13px] text-[#9B9B9B] mt-0.5">
          RDO · Consórcio Lote 15 & 19
        </p>

        {/* Divisor */}
        <div className="h-px bg-[#E5E5E3] w-full my-6" />

        {/* Mensagem Principal Requerida */}
        <div className="bg-[#F7F7F7] border border-[#E5E5E3] rounded-[10px] p-4 text-left mb-6">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-[#111111] leading-snug">
                Este sistema é exclusivo para acesso mobile. Acesse pelo seu celular.
              </p>
              <p className="text-[12px] text-[#6B6B6B] mt-1.5 leading-relaxed">
                Os lançamentos diários de efetivo, clima, equipamentos e ocorrências em canteiro são feitos pelo celular.
              </p>
            </div>
          </div>
        </div>

        {/* QR Code para Acesso Rápido */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="w-36 h-36 bg-white border border-[#E5E5E3] rounded-[12px] p-2 flex items-center justify-center">
            {/* QR code vetorial SVG elegante para https://rdo.metriclab.com.br */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#111111]" fill="currentColor">
              <rect x="10" y="10" width="24" height="24" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
              <rect x="17" y="17" width="10" height="10" rx="1" />
              <rect x="66" y="10" width="24" height="24" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
              <rect x="73" y="17" width="10" height="10" rx="1" />
              <rect x="10" y="66" width="24" height="24" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
              <rect x="17" y="73" width="10" height="10" rx="1" />
              <rect x="42" y="14" width="6" height="6" />
              <rect x="52" y="14" width="6" height="6" />
              <rect x="42" y="24" width="6" height="6" />
              <rect x="52" y="24" width="6" height="6" />
              <rect x="14" y="44" width="6" height="6" />
              <rect x="24" y="44" width="6" height="6" />
              <rect x="44" y="44" width="12" height="12" rx="2" fill="#F5A623" />
              <rect x="64" y="44" width="6" height="6" />
              <rect x="76" y="44" width="8" height="6" />
              <rect x="42" y="66" width="6" height="6" />
              <rect x="52" y="66" width="6" height="6" />
              <rect x="66" y="66" width="6" height="6" />
              <rect x="76" y="66" width="6" height="6" />
              <rect x="42" y="76" width="6" height="6" />
              <rect x="66" y="76" width="6" height="6" />
              <rect x="76" y="76" width="14" height="6" />
              <rect x="42" y="86" width="16" height="4" />
            </svg>
          </div>
          <p className="text-[11.5px] text-[#9B9B9B] mt-2.5">
            Aponte a câmera do celular para abrir
          </p>
          <span className="text-[11px] font-mono text-[#6B6B6B] mt-0.5">
            rdo.metriclab.com.br
          </span>
        </div>

        {/* Rodapé Informativo */}
        <div className="border-t border-[#E5E5E3] pt-4 mt-6">
          <p className="text-[11px] text-[#9B9B9B] leading-relaxed">
            Se você instalou o app como PWA no seu computador, abra-o pela janela do aplicativo instalado para liberar o acesso.
          </p>
        </div>
      </div>
    </div>
  );
}
