'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type OpcaoAcesso = 'chave' | 'magic';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [opcao, setOpcao] = useState<OpcaoAcesso>('chave');
  const [nome, setNome] = useState('');
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [magicEnviado, setMagicEnviado] = useState(false);

  // Escutar login por magic link via Supabase Auth
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const sessionData = {
          usuario_id: session.user.id,
          nome: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Encarregado RDO',
          trecho_id: 'trecho-15-19',
          trecho_nome: 'Pacote 15 e 19',
          pacote: '15 e 19',
          cargo: 'Supervisor / Gestão',
        };
        localStorage.setItem('ml_rdo_session', JSON.stringify(sessionData));
        document.cookie = `ml_rdo_session=${encodeURIComponent(
          JSON.stringify(sessionData)
        )}; path=/; max-age=604800; SameSite=Lax`;
        router.push('/menu');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // OPÇÃO 1 — Entrar com nome e chave
  const handleSubmitChave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const nomeLimpo = nome.trim();
    const chaveLimpa = chaveAcesso.trim();

    if (!nomeLimpo || !chaveLimpa) {
      setErro('Preencha seu nome e chave de acesso.');
      return;
    }

    setLoading(true);

    const isDemoCode = chaveLimpa.toUpperCase().startsWith('RDO') || chaveLimpa === '123456';

    try {
      const { data, error } = await supabase
        .from('demo_rdo_usuarios')
        .select('*')
        .ilike('nome', `%${nomeLimpo}%`)
        .eq('chave_acesso', chaveLimpa)
        .eq('ativo', true)
        .limit(1);

      if (data && data.length > 0) {
        const user = data[0];
        const sessionData = {
          usuario_id: user.id,
          nome: user.nome,
          trecho_id: user.trecho_id,
          trecho_nome: user.trecho_nome || 'Trecho Geral',
          pacote: user.pacote,
          cargo: user.cargo || 'Encarregado',
        };

        localStorage.setItem('ml_rdo_session', JSON.stringify(sessionData));
        document.cookie = `ml_rdo_session=${encodeURIComponent(
          JSON.stringify(sessionData)
        )}; path=/; max-age=604800; SameSite=Lax`;

        router.push('/menu');
        return;
      }

      // Fallback demo caso seja chave no padrão RDO001, RDO002 etc ou 123456
      if (isDemoCode) {
        const sessionData = {
          usuario_id: `demo-${chaveLimpa}`,
          nome: nomeLimpo,
          trecho_id: 'trecho-15-19',
          trecho_nome: 'Pacote 15 e 19',
          pacote: '15 e 19',
          cargo: 'Encarregado de Obra',
        };

        localStorage.setItem('ml_rdo_session', JSON.stringify(sessionData));
        document.cookie = `ml_rdo_session=${encodeURIComponent(
          JSON.stringify(sessionData)
        )}; path=/; max-age=604800; SameSite=Lax`;

        router.push('/menu');
        return;
      }

      setErro('Nome ou chave de acesso inválidos.');
      setLoading(false);
    } catch (err: any) {
      if (isDemoCode) {
        const sessionData = {
          usuario_id: `demo-${chaveLimpa}`,
          nome: nomeLimpo,
          trecho_id: 'trecho-15-19',
          trecho_nome: 'Pacote 15 e 19',
          pacote: '15 e 19',
          cargo: 'Encarregado de Obra',
        };

        localStorage.setItem('ml_rdo_session', JSON.stringify(sessionData));
        document.cookie = `ml_rdo_session=${encodeURIComponent(
          JSON.stringify(sessionData)
        )}; path=/; max-age=604800; SameSite=Lax`;

        router.push('/menu');
        return;
      }

      console.error('Erro ao validar acesso:', err);
      setErro('Erro ao validar acesso. Tente novamente.');
      setLoading(false);
    }
  };

  // OPÇÃO 2 — Link Mágico
  const handleSubmitMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErro('Digite um e-mail válido.');
      return;
    }

    setLoading(true);

    // Simulação para demo@metriclab.com.br
    if (cleanEmail === 'demo@metriclab.com.br') {
      setTimeout(() => {
        const sessionData = {
          usuario_id: 'demo-magic-user',
          nome: 'Demo MetricLab',
          trecho_id: 'trecho-15-19',
          trecho_nome: 'Pacote 15 e 19',
          pacote: '15 e 19',
          cargo: 'Supervisor / Gestão',
        };

        localStorage.setItem('ml_rdo_session', JSON.stringify(sessionData));
        document.cookie = `ml_rdo_session=${encodeURIComponent(
          JSON.stringify(sessionData)
        )}; path=/; max-age=604800; SameSite=Lax`;

        router.push('/menu');
      }, 500);
      return;
    }

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${origin}/menu`,
        },
      });

      if (error) {
        console.error('[signInWithOtp]', error.message);
        setErro('Não foi possível enviar o link mágico agora. Tente novamente.');
        setLoading(false);
        return;
      }

      setMagicEnviado(true);
      setLoading(false);
    } catch (err: any) {
      console.error('[handleSubmitMagicLink]', err);
      setErro('Erro de conexão ao solicitar link mágico.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[360px]">
      {/* Opções de Acesso Lado a Lado (estilo gestão Google/Microsoft) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            setOpcao('chave');
            setErro(null);
          }}
          className={`h-11 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition-all select-none cursor-pointer ${
            opcao === 'chave'
              ? 'border-[#1A202C] bg-white text-[#1A202C] shadow-xs ring-1 ring-[#1A202C]'
              : 'border-[#E2E8F0] bg-white/70 text-[#718096] hover:bg-white hover:text-[#1A202C] shadow-2xs'
          }`}
        >
          <KeyRound className="size-4" />
          <span>Nome e chave</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setOpcao('magic');
            setErro(null);
          }}
          className={`h-11 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition-all select-none cursor-pointer ${
            opcao === 'magic'
              ? 'border-[#1A202C] bg-white text-[#1A202C] shadow-xs ring-1 ring-[#1A202C]'
              : 'border-[#E2E8F0] bg-white/70 text-[#718096] hover:bg-white hover:text-[#1A202C] shadow-2xs'
          }`}
        >
          <Sparkles className="size-4 text-[#FFC028]" />
          <span>Link mágico</span>
        </button>
      </div>

      {/* Divisor */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-[#E2E8F0]" />
        <span className="text-xs text-[#718096]">
          {opcao === 'chave' ? 'credenciais de campo' : 'acesso sem senha'}
        </span>
        <div className="flex-1 h-px bg-[#E2E8F0]" />
      </div>

      {/* Erro */}
      {erro && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium text-center">
          {erro}
        </div>
      )}

      {/* OPÇÃO 1: FORMULÁRIO COM CAMPOS UNDERLINE */}
      {opcao === 'chave' && (
        <form onSubmit={handleSubmitChave} className="space-y-6 animate-in fade-in-0 duration-200">
          {/* Campo Nome */}
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#718096] mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setErro(null);
              }}
              placeholder="Ex: Carlos Eduardo"
              autoFocus
              className="w-full bg-transparent border-0 border-b border-[#CBD5E0] focus:border-[#1A202C] py-2.5 text-base text-[#1A202C] placeholder:text-[#A0AEC0] outline-none rounded-none transition-colors"
            />
          </div>

          {/* Campo Chave de Acesso / Código */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#718096]">
                Código de acesso
              </label>
              <span className="text-[10px] text-[#718096]">Ex: RDO001, 123456</span>
            </div>
            <input
              type="text"
              required
              value={chaveAcesso}
              onChange={(e) => {
                setChaveAcesso(e.target.value);
                setErro(null);
              }}
              placeholder="RDO001, RDO002..."
              className="w-full bg-transparent border-0 border-b border-[#CBD5E0] focus:border-[#1A202C] py-2.5 text-base text-[#1A202C] placeholder:text-[#A0AEC0] outline-none rounded-none transition-colors"
            />
          </div>

          {/* Botão Confirmar */}
          <button
            type="submit"
            disabled={loading || !nome.trim() || !chaveAcesso.trim()}
            className="w-full h-11 rounded-lg bg-[#1C1C1C] text-white text-sm font-semibold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Entrando...
              </>
            ) : (
              'Confirmar →'
            )}
          </button>
        </form>
      )}

      {/* OPÇÃO 2: LINK MÁGICO */}
      {opcao === 'magic' && (
        <div className="space-y-6 animate-in fade-in-0 duration-200">
          {magicEnviado ? (
            <div className="p-4 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs text-center space-y-3">
              <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A202C]">Link mágico enviado!</p>
                <p className="text-xs text-[#718096] mt-1">
                  Enviamos as instruções para <strong>{email}</strong>. Abra o link no seu dispositivo para acessar o RDO.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMagicEnviado(false)}
                className="text-xs text-[#0061B7] hover:underline font-medium"
              >
                Tentar outro e-mail
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitMagicLink} className="space-y-6">
              {/* Campo Email Underline */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#718096]">
                    Seu e-mail corporativo
                  </label>
                  <span className="text-[10px] text-[#718096]">Demo: demo@metriclab.com.br</span>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErro(null);
                  }}
                  placeholder="seu@email.com"
                  autoFocus
                  className="w-full bg-transparent border-0 border-b border-[#CBD5E0] focus:border-[#1A202C] py-2.5 text-base text-[#1A202C] placeholder:text-[#A0AEC0] outline-none rounded-none transition-colors"
                />
              </div>

              {/* Botão Enviar Link Mágico */}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full h-11 rounded-lg bg-[#1C1C1C] text-white text-sm font-semibold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Enviando link...
                  </>
                ) : (
                  'Enviar link mágico →'
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Texto Abaixo */}
      <p className="text-[11px] text-[#718096] text-center mt-5 select-none">
        Acesso via WhatsApp disponível em campo
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-4 py-12 select-none">
      {/* Logo m. exato do gestão */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="text-4xl font-black tracking-tighter text-[#1A202C] select-none">
          m<span style={{ color: '#FFC028' }}>.</span>
        </div>
        <div className="text-center">
          <h1 className="text-[28px] sm:text-[32px] font-bold text-[#1A202C] tracking-tight leading-tight">
            Relatório Diário de Obra
          </h1>
          <p className="text-[14px] text-[#718096] font-normal mt-1.5">
            Pacote 15 e 19
          </p>
        </div>
      </div>

      {/* Card / Formulário */}
      <Suspense
        fallback={
          <div className="h-64 w-full max-w-[360px] rounded-2xl bg-white/60 p-8 shadow-2xs animate-pulse" />
        }
      >
        <LoginContent />
      </Suspense>

      {/* Rodapé padrão gestão */}
      <div className="mt-10 flex flex-col items-center gap-2 text-xs text-[#718096]">
        <div className="flex items-center gap-2">
          <a
            href="https://metriclab.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline"
            style={{ color: '#FFC028' }}
          >
            MetricLab
          </a>
          <span>·</span>
          <span>Pacote 15 e 19</span>
        </div>
      </div>
    </main>
  );
}
