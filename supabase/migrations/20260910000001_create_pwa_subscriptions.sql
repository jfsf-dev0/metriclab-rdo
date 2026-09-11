-- Tabela para registrar assinaturas de Web Push dos PWAs (RFP: PWA-MOBILE-FEATURES-01)
CREATE TABLE IF NOT EXISTS public.pwa_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  endpoint text UNIQUE NOT NULL,
  keys jsonb NOT NULL,
  contrato_id text DEFAULT 'LOTE15',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pwa_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política de acesso permissiva para upsert anônimo e autenticado no contexto dos PWAs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pwa_subscriptions' AND policyname = 'pwa_subscriptions_allow_all'
  ) THEN
    CREATE POLICY pwa_subscriptions_allow_all ON public.pwa_subscriptions
      FOR ALL
      TO anon, authenticated, service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
