'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface PwaInstallBannerProps {
  appName?: string;
  description?: string;
}

export function PwaInstallBanner({
  appName = 'Relatório Diário de Obra (RDO)',
  description = 'Instale na tela inicial para apontamentos rápidos em canteiro e modo offline.',
}: PwaInstallBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Verifica se já foi instalado (standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Verifica se já foi dispensado no localStorage
    const isDismissed = localStorage.getItem('ml_pwa_install_banner_dismissed') === 'true';
    if (isDismissed) return;

    // Verifica se o acesso é mobile
    const userAgent = navigator.userAgent || '';
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent) ||
      (window as any).navigator?.maxTouchPoints > 1;

    if (!isMobile) return;

    // Captura o evento nativo beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Suporte para iOS Safari
    const isIos = /iPhone|iPad|iPod/i.test(userAgent);
    if (isIos && !isStandalone && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('ml_pwa_install_banner_dismissed', 'true');
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('Para instalar: toque no botão Compartilhar do Safari e selecione "Adicionar à Tela de Início".');
      localStorage.setItem('ml_pwa_install_banner_dismissed', 'true');
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('ml_pwa_install_banner_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-[14px] p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          {/* Logo / Ícone */}
          <div className="w-10 h-10 rounded-[8px] bg-[#F0F0F0] border border-[#E5E5E3] flex items-center justify-center shrink-0">
            <span className="font-bold text-[18px] tracking-tight">
              <span className="text-[#111111]">m</span>
              <span className="text-[#F5A623]">.</span>
            </span>
          </div>

          {/* Textos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-[14px] font-semibold text-[#111111] leading-tight">
                {appName}
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-[4px] bg-[#F0F0F0] text-[#6B6B6B]">
                PWA
              </span>
            </div>
            <p className="text-[12px] text-[#6B6B6B] mt-1 leading-snug">
              {description}
            </p>
          </div>

          {/* Botão Fechar */}
          <button
            type="button"
            onClick={handleDismiss}
            className="text-[#9B9B9B] hover:text-[#111111] p-1 transition-colors"
            aria-label="Dispensar banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2 mt-3.5 pt-3 border-t border-[#E5E5E3]">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-[12.5px] font-medium text-[#6B6B6B] hover:text-[#111111] px-3 py-1.5 transition-colors"
          >
            Agora não
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="bg-[#111111] hover:bg-[#222222] text-white text-[12.5px] font-semibold px-4 py-1.5 rounded-[6px] transition-colors flex items-center gap-1.5 shadow-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
