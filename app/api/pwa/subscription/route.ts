import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://keadkoqnvabhyxbrfjax.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYWRrb3FudmFiaHl4YnJmamF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNDgxMTEsImV4cCI6MjEwMjkyNDExMX0.aVyEH0S75-Ef1jBHU3j1EfnN9zospWeQMLGVkreZq-o';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, endpoint, keys, contrato_id } = body;

    if (!endpoint || !keys) {
      return NextResponse.json(
        { error: 'Parâmetros endpoint e keys são obrigatórios' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('pwa_subscriptions')
      .upsert(
        {
          user_id: user_id || null,
          endpoint,
          keys,
          contrato_id: contrato_id || 'LOTE15',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      )
      .select();

    if (error) {
      console.warn('[API/PWA/Subscription] Supabase error (tabela em criação/migration):', error.message);
      return NextResponse.json({
        success: true,
        warning: error.message,
        subscription: { endpoint, user_id, contrato_id },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[API/PWA/Subscription] Erro inesperado:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro ao processar assinatura PWA' },
      { status: 500 }
    );
  }
}
