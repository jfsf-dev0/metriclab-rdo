'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Smartphone, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Estado = 'inicial' | 'chave' | 'codigo_unico';

function LoginContent() {
  const router = useRouter();

  const [estado, setEstado] = useState<Estado>('inicial');
  const [nome, setNome] = useState('');
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);

  const triggerShake = (mensagem?: string) => {
    setShaking(true);
    if (mensagem) setErro(mensagem);
    setTimeout(() => setShaking(false), 450);
  };

  const handleVoltar = () => {
    setEstado('inicial');
    setChaveAcesso('');
    setCodigoOtp('');
    setErro(null);
  };

  const saveSession = (sessionData: {
    usuario_id: string;
    nome: string;
    trecho_id: string;
    trecho_nome: string;
    pacote: string;
    cargo: string;
  }) => {
    localStorage.setItem('ml_rdo_session', JSON.stringify(sessionData));
    document.cookie = `ml_rdo_session=${encodeURIComponent(
      JSON.stringify(sessionData)
    )}; path=/; max-age=604800; SameSite=Lax`;
  };

  // ESTADO 2A: Validação com Nome e Chave
  const handleEntrarComChave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErro(null);

    const nomeLimpo = nome.trim();
    const chaveLimpa = chaveAcesso.trim();

    if (!nomeLimpo) {
      triggerShake('Informe seu nome completo.');
      return;
    }

    if (!chaveLimpa) {
      triggerShake('Informe a chave de acesso.');
      return;
    }

    setLoading(true);

    const isDemo =
      chaveLimpa === '123456' ||
      chaveLimpa.toUpperCase().startsWith('RDO');

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
        saveSession({
          usuario_id: user.id,
          nome: user.nome,
          trecho_id: user.trecho_id,
          trecho_nome: user.trecho_nome || 'Trecho Geral',
          pacote: user.pacote || '15 e 19',
          cargo: user.cargo || 'Encarregado',
        });
        router.push('/menu');
        return;
      }

      // Bypass Demo caso chave seja 123456 ou comece com RDO
      if (isDemo) {
        saveSession({
          usuario_id: `demo-${chaveLimpa}`,
          nome: nomeLimpo,
          trecho_id: 'trecho-15-19',
          trecho_nome: 'Pacote 15 e 19',
          pacote: '15 e 19',
          cargo: 'Encarregado de Obra',
        });
        router.push('/menu');
        return;
      }

      setLoading(false);
      triggerShake('Chave inválida');
    } catch (err) {
      console.error('[handleEntrarComChave]', err);
      if (isDemo) {
        saveSession({
          usuario_id: `demo-${chaveLimpa}`,
          nome: nomeLimpo,
          trecho_id: 'trecho-15-19',
          trecho_nome: 'Pacote 15 e 19',
          pacote: '15 e 19',
          cargo: 'Encarregado de Obra',
        });
        router.push('/menu');
        return;
      }
      setLoading(false);
      triggerShake('Chave inválida');
    }
  };

  // ESTADO 2B: Validação com Código Único (Demo 123456)
  const handleConfirmarCodigoUnico = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErro(null);

    const nomeLimpo = nome.trim();
    const codigoLimpo = codigoOtp.trim();

    if (!codigoLimpo) {
      triggerShake('Digite o código recebido.');
      return;
    }

    setLoading(true);

    // Aceita 123456 para qualquer input
    if (codigoLimpo === '123456') {
      saveSession({
        usuario_id: 'demo-otp-user',
        nome: nomeLimpo || 'Encarregado Demo',
        trecho_id: 'trecho-15-19',
        trecho_nome: 'Pacote 15 e 19',
        pacote: '15 e 19',
        cargo: 'Encarregado de Obra',
      });
      router.push('/menu');
      return;
    }

    // Busca se existe chave correspondente no banco
    try {
      const { data } = await supabase
        .from('demo_rdo_usuarios')
        .select('*')
        .eq('chave_acesso', codigoLimpo)
        .eq('ativo', true)
        .limit(1);

      if (data && data.length > 0) {
        const user = data[0];
        saveSession({
          usuario_id: user.id,
          nome: user.nome,
          trecho_id: user.trecho_id,
          trecho_nome: user.trecho_nome || 'Trecho Geral',
          pacote: user.pacote || '15 e 19',
          cargo: user.cargo || 'Encarregado',
        });
        router.push('/menu');
        return;
      }

      setLoading(false);
      triggerShake('Código inválido');
    } catch (err) {
      console.error('[handleConfirmarCodigoUnico]', err);
      setLoading(false);
      triggerShake('Código inválido');
    }
  };

  return (
    <div
      className={`w-full max-w-[380px] bg-white rounded-[12px] border border-[#E5E5E3] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out ${
        shaking ? 'animate-shake' : ''
      }`}
    >
      {/* Logo */}
      <div className="text-center">
        <span className="text-[28px] font-bold text-[#111111] leading-none tracking-tight select-none">
          m<span className="text-[#F5A623]">.</span>
        </span>
      </div>

      {/* Título e Subtítulo */}
      <div className="text-center mt-4">
        <h1 className="text-[22px] font-bold text-[#111111] leading-tight">
          Relatório Diário de Obra
        </h1>
        <p className="text-[13px] font-normal text-[#9B9B9B] mt-1">
          Pacote 15 e 19
        </p>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ESTADO 1 — INICIAL
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {estado === 'inicial' && (
        <div className="mt-6 space-y-5 animate-in fade-in-0 duration-200">
          <div>
            <input
              type="text"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setErro(null);
              }}
              placeholder="Seu nome completo"
              autoFocus
              className="w-full border-0 border-b border-[#E5E5E3] bg-transparent py-2.5 text-[15px] text-[#111111] placeholder:text-[#9B9B9B] focus:border-[#111111] focus:outline-none transition-colors"
            />
          </div>

          {erro && (
            <p className="text-[12px] text-[#dc2626] font-medium text-center">
              {erro}
            </p>
          )}

          {/* Dois botões lado a lado */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEstado('chave');
                setErro(null);
              }}
              className="flex-1 h-[44px] bg-white border border-[#E5E5E3] rounded-[8px] inline-flex items-center justify-center gap-2 hover:bg-[#F9F9F8] transition-colors cursor-pointer select-none"
            >
              <Lock className="w-4 h-4 text-[#111111]" />
              <span className="text-[13px] font-medium text-[#111111]">
                Entrar com chave
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEstado('codigo_unico');
                setErro(null);
              }}
              className="flex-1 h-[44px] bg-white border border-[#E5E5E3] rounded-[8px] inline-flex items-center justify-center gap-2 hover:bg-[#F9F9F8] transition-colors cursor-pointer select-none"
            >
              <Smartphone className="w-4 h-4 text-[#111111]" />
              <span className="text-[13px] font-medium text-[#111111]">
                Código único
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E5E5E3]" />
            <span className="text-[12px] text-[#9B9B9B]">ou</span>
            <div className="flex-1 h-px bg-[#E5E5E3]" />
          </div>

          {/* Botão Entrar preto full-width */}
          <button
            type="button"
            onClick={() => {
              setEstado('chave');
              setErro(null);
            }}
            className="w-full h-[44px] bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center"
          >
            Entrar
          </button>

          {/* Rodapé Demo */}
          <p className="text-[11px] text-[#C4C4C2] text-center mt-4">
            Demo: use o código 123456 ou RDO001
          </p>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ESTADO 2A — ENTRAR COM CHAVE
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {estado === 'chave' && (
        <form
          onSubmit={handleEntrarComChave}
          className="mt-6 space-y-5 animate-in fade-in-0 duration-200"
        >
          {/* Mantém campo nome */}
          <div>
            <input
              type="text"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setErro(null);
              }}
              placeholder="Seu nome completo"
              className="w-full border-0 border-b border-[#E5E5E3] bg-transparent py-2.5 text-[15px] text-[#111111] placeholder:text-[#9B9B9B] focus:border-[#111111] focus:outline-none transition-colors"
            />
          </div>

          {/* Novo campo: Chave de Acesso */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block">
                CHAVE DE ACESSO (EX: RDO001)
              </label>
              <span className="text-[10px] text-[#C4C4C2]">
                Demo: 123456 ou RDO001
              </span>
            </div>
            <input
              type="password"
              maxLength={10}
              value={chaveAcesso}
              onChange={(e) => {
                setChaveAcesso(e.target.value);
                setErro(null);
              }}
              placeholder="••••••"
              autoFocus
              className="w-full border-0 border-b border-[#E5E5E3] bg-transparent py-2 text-[15px] text-[#111111] tracking-[4px] placeholder:text-[#9B9B9B] focus:border-[#111111] focus:outline-none transition-colors"
            />
            {erro && (
              <p className="text-[12px] text-[#dc2626] font-medium mt-1.5">
                {erro}
              </p>
            )}
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[44px] bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              'Entrar'
            )}
          </button>

          {/* Link Voltar */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleVoltar}
              className="text-[12px] text-[#9B9B9B] hover:text-[#111111] transition-colors cursor-pointer"
            >
              ← Voltar
            </button>
          </div>
        </form>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ESTADO 2B — CÓDIGO ÚNICO
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {estado === 'codigo_unico' && (
        <form
          onSubmit={handleConfirmarCodigoUnico}
          className="mt-6 space-y-5 animate-in fade-in-0 duration-200"
        >
          {nome.trim() ? (
            <div className="text-center">
              <p className="text-[13px] text-[#6B6B6B]">
                Enviamos um código para
              </p>
              <p className="text-[13px] font-medium text-[#111111] mt-0.5 truncate">
                {nome}
              </p>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErro(null);
                }}
                placeholder="Seu nome completo"
                className="w-full border-0 border-b border-[#E5E5E3] bg-transparent py-2.5 text-[15px] text-[#111111] placeholder:text-[#9B9B9B] focus:border-[#111111] focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Campo Código Recebido */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block">
                CÓDIGO RECEBIDO
              </label>
              <span className="text-[10px] text-[#C4C4C2]">
                Demo: use o código 123456
              </span>
            </div>
            <input
              type="text"
              maxLength={6}
              value={codigoOtp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setCodigoOtp(val);
                setErro(null);
              }}
              placeholder="000000"
              autoFocus
              className="w-full border-0 border-b border-[#E5E5E3] bg-transparent py-2 text-[15px] text-[#111111] tracking-[6px] placeholder:text-[#C4C4C2] focus:border-[#111111] focus:outline-none transition-colors text-center"
            />
            {erro && (
              <p className="text-[12px] text-[#dc2626] font-medium mt-1.5 text-center">
                {erro}
              </p>
            )}
          </div>

          {/* Botão Confirmar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[44px] bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirmando...</span>
              </>
            ) : (
              'Confirmar'
            )}
          </button>

          {/* Link Voltar */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleVoltar}
              className="text-[12px] text-[#9B9B9B] hover:text-[#111111] transition-colors cursor-pointer"
            >
              ← Voltar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-[380px] h-[340px] bg-white rounded-[12px] border border-[#E5E5E3] p-8 animate-pulse" />
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}
