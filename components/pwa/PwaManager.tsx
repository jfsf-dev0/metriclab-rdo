'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import {
  registerServiceWorker,
  isPushSupported,
  requestNotificationPermission,
  subscribeUserToPush,
} from '@/lib/pushNotifications';
import { PwaInstallBanner } from './PwaInstallBanner';

export function PwaManager() {
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Registra o Service Worker
    registerServiceWorker();

    // 2. Detecta display-mode: standalone e grava cookie
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      document.cookie = 'ml_pwa_standalone=true; path=/; max-age=31536000; SameSite=Lax';
    }

    // 3. Solicitação de notificação no primeiro acesso
    if (isPushSupported() && Notification.permission === 'default') {
      const alreadyRequested = localStorage.getItem('ml_pwa_notification_requested') === 'true';
      if (!alreadyRequested) {
        const timer = setTimeout(() => {
          setShowNotificationPrompt(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleEnableNotifications = async () => {
    localStorage.setItem('ml_pwa_notification_requested', 'true');
    setShowNotificationPrompt(false);

    try {
      const perm = await requestNotificationPermission();
      if (perm === 'granted') {
        let userId = 'encarregado-lote15';
        try {
          const session = localStorage.getItem('ml_rdo_session');
          if (session) {
            const parsed = JSON.parse(session);
            if (parsed.usuario_id || parsed.nome || parsed.id) {
              userId = parsed.usuario_id || parsed.id || parsed.nome;
            }
          }
        } catch {
          // fallback
        }

        await subscribeUserToPush(userId, 'LOTE15');
      }
    } catch (err) {
      console.error('[PWA] Falha ao habilitar notificações:', err);
    }
  };

  const handleDismissNotifications = () => {
    localStorage.setItem('ml_pwa_notification_requested', 'true');
    setShowNotificationPrompt(false);
  };

  return (
    <>
      {/* Banner de Permissão de Notificações no Primeiro Acesso */}
      {showNotificationPrompt && (
        <div className="fixed top-3 left-3 right-3 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-[14px] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[#F0F0F0] border border-[#E5E5E3] flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-[#111111]" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-[13.5px] font-semibold text-[#111111] leading-snug">
                  Ativar notificações de obra
                </h4>
                <p className="text-[12px] text-[#6B6B6B] mt-0.5 leading-relaxed">
                  Receba avisos imediatos de aprovação de RDO, alertas de clima e solicitações de ocorrências.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDismissNotifications}
                className="text-[#9B9B9B] hover:text-[#111111] p-1 transition-colors"
                aria-label="Dispensar aviso de notificações"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-[#E5E5E3]">
              <button
                type="button"
                onClick={handleDismissNotifications}
                className="text-[12px] font-medium text-[#6B6B6B] hover:text-[#111111] px-3 py-1.5 transition-colors"
              >
                Depois
              </button>
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="bg-[#111111] hover:bg-[#222222] text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-[6px] transition-colors shadow-none"
              >
                Ativar notificações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Instalação na Tela Inicial */}
      <PwaInstallBanner
        appName="Relatório Diário de Obra (RDO)"
        description="Adicione à tela inicial para lançamentos rápidos de campo e apontamentos offline."
      />
    </>
  );
}
