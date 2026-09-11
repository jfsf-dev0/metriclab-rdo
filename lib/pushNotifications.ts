import { supabase } from './supabase';

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BE0UmSp5Nc6HbzejOCxvpmTrbnbposGi9-qt8WYK3Qa3ScJf5BJI2gif7tM1sceXj6TM3PlYD_F1yJcu85Eqo5M';

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.error('[PWA] Service Worker registration failed:', err);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('[PWA] Notification permission request error:', err);
    return 'denied';
  }
}

export async function subscribeUserToPush(
  userId?: string,
  contratoId: string = 'LOTE15'
): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource;
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    const subJson = subscription.toJSON();
    const payload = {
      user_id: userId || 'rdo-user',
      endpoint: subJson.endpoint,
      keys: subJson.keys,
      contrato_id: contratoId,
    };

    // Salvar via API endpoint do PWA
    try {
      await fetch('/api/pwa/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('[PWA] Falha ao enviar para /api/pwa/subscription:', e);
    }

    // Salvar diretamente no Supabase cliente como redundância
    try {
      await supabase.from('pwa_subscriptions').upsert(
        {
          user_id: payload.user_id,
          endpoint: payload.endpoint,
          keys: payload.keys,
          contrato_id: payload.contrato_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );
    } catch {
      // Tabela pode ter RLS ou estar sendo criada via migration
    }

    return subscription;
  } catch (err) {
    console.error('[PWA] Erro ao assinar notificações push:', err);
    return null;
  }
}

/**
 * Função reutilizável para disparo de notificação
 * Integrada com Service Worker local e N8N via Webhook
 */
export async function sendNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Se estiver no browser e tiver permissão, exibe via Service Worker local
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: data || { url: '/menu' },
          vibrate: [100, 50, 100],
        } as any);
      } catch (swErr) {
        console.warn('[PWA] Falha ao disparar notificação local SW:', swErr);
      }
    }

    // 2. Dispara via endpoint de backend (N8N webhook e broadcast)
    const response = await fetch('/api/pwa/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        body,
        data,
        source: 'pwa-rdo',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      return { success: false, error: errJson.error || 'Erro na resposta do servidor' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[PWA] Erro em sendNotification:', err);
    return { success: false, error: err?.message || 'Erro ao enviar notificação' };
  }
}
