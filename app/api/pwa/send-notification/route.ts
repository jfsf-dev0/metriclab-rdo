import { NextResponse, type NextRequest } from 'next/server';

const N8N_PUSH_WEBHOOK_URL =
  process.env.N8N_PUSH_WEBHOOK_URL ||
  'https://n8n.metriclab.com.br/webhook/pwa-push-notification';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { title, body, data, source, user_id, contrato_id } = payload;

    if (!title) {
      return NextResponse.json(
        { error: 'Título da notificação é obrigatório' },
        { status: 400 }
      );
    }

    const n8nPayload = {
      event: 'pwa.notification.send',
      title,
      body: body || '',
      data: data || {},
      source: source || 'pwa-rdo',
      user_id: user_id || null,
      contrato_id: contrato_id || 'LOTE15',
      timestamp: new Date().toISOString(),
    };

    let n8nDispatched = false;
    let n8nStatus = 0;

    try {
      const n8nResponse = await fetch(N8N_PUSH_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MetricLab-PWA-RDO/1.0',
        },
        body: JSON.stringify(n8nPayload),
      });
      n8nStatus = n8nResponse.status;
      n8nDispatched = n8nResponse.ok;
    } catch (n8nErr) {
      console.warn('[API/PWA/SendNotification] N8N webhook trigger warning:', n8nErr);
    }

    return NextResponse.json({
      success: true,
      n8nDispatched,
      n8nStatus,
      payload: n8nPayload,
    });
  } catch (err: any) {
    console.error('[API/PWA/SendNotification] Erro geral:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro ao processar envio de notificação' },
      { status: 500 }
    );
  }
}
