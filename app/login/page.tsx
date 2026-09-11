'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Smartphone, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { setSession, clearSession } from '@/lib/auth';

type Etapa = 0 | 1 | 2 | 3;
type Metodo = 'chave' | 'codigo_unico';

function LoginCard() {
  const router = useRouter();
  const inputIdentificadorRef = useRef<HTMLInputElement>(null);
  const inputCodigoRef = useRef<HTMLInputElement>(null);

  const [etapa, setEtapa] = useState<Etapa>(0);
  const [metodo, setMetodo] = useState<Metodo>('chave');

  const [identificador, setIdentificador] = useState('');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);

  // Ao carregar a tela de login, sempre limpa qualquer sessão anterior
  useEffect(() => {
    clearSession();
  }, []);

  const triggerShake = (mensagem?: string) => {
    setShaking(true);
    if (mensagem) setErro(mensagem);
    setTimeout(() => setShaking(false), 450);
  };

  // Foco automático nos campos conforme a etapa avança
  useEffect(() => {
    if (etapa === 1 || etapa === 2) {
      setTimeout(() => {
        inputIdentificadorRef.current?.focus();
      }, 50);
    } else if (etapa === 3) {
      setTimeout(() => {
        inputCodigoRef.current?.focus();
      }, 50);
    }
  }, [etapa]);

  // Transição automática entre Etapa 1 e Etapa 2 ao digitar
  const handleIdentificadorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIdentificador(val);
    setErro(null);

    if (val.trim().length > 0) {
      setEtapa(2);
    } else {
      setEtapa(1);
    }
  };

  // Escolha do método (avança para Etapa 3)
  const handleEscolherMetodo = (m: Metodo) => {
    setMetodo(m);
    setCodigo('');
    setErro(null);
    setEtapa(3);
  };

  // Voltar etapas progressivas
  const handleVoltar = () => {
    setErro(null);
    if (etapa === 3) {
      setCodigo('');
      setEtapa(2);
    } else if (etapa === 2 || etapa === 1) {
      setIdentificador('');
      setCodigo('');
      setEtapa(0);
    }
  };

  // Submissão da Etapa 3
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;

    setErro(null);
    const inputLimpo = identificador.trim();
    const codigoLimpo = codigo.trim();

    if (codigoLimpo.length !== 6 && !codigoLimpo.toUpperCase().startsWith('RDO')) {
      triggerShake('Digite o código de 6 dígitos.');
      return;
    }

    setLoading(true);

    // 1. Bypass Oficial Demo: 123456 ou RDO*
    const isDemo =
      codigoLimpo === '123456' ||
      codigoLimpo.toUpperCase().startsWith('RDO');

    if (isDemo) {
      setSession({
        usuario_id: 'demo-usuario-123456',
        nome: inputLimpo || 'Engenheiro de Campo — RDO',
        trecho_id: 'trecho-01',
        trecho_nome: 'Pacote 15 e 19',
        pacote: '15 e 19',
        cargo: 'Responsável Técnico',
      });
      router.push('/menu');
      return;
    }

    // 2. Validação no Supabase na tabela demo_rdo_usuarios
    try {
      const isEmail = inputLimpo.includes('@');
      let query = supabase
        .from('demo_rdo_usuarios')
        .select('*')
        .eq('chave_acesso', codigoLimpo)
        .eq('ativo', true);

      if (isEmail) {
        query = query.eq('email', inputLimpo.toLowerCase());
      } else if (inputLimpo) {
        const cleanDigits = inputLimpo.replace(/\D/g, '');
        if (cleanDigits.length >= 8) {
          query = query.ilike('telefone', `%${cleanDigits}%`);
        } else {
          query = query.ilike('nome', `%${inputLimpo}%`);
        }
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        setLoading(false);
        triggerShake('Código inválido');
        return;
      }

      setSession({
        usuario_id: data.id || data.usuario_id || 'user-rdo',
        nome: data.nome || inputLimpo,
        trecho_id: data.trecho_id || 'trecho-01',
        trecho_nome: data.trecho_nome || 'Pacote 15 e 19',
        pacote: data.pacote || '15 e 19',
        cargo: data.cargo || 'Encarregado de Obra',
      });

      router.push('/menu');
    } catch (err) {
      console.error('[handleSubmit error]', err);
      setLoading(false);
      triggerShake('Código inválido');
    }
  };

  return (
    <div
      style={{
        width: 'calc(100% - 48px)',
        maxWidth: '380px',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
      className={`bg-white rounded-none border border-[#E2E2DC] px-6 py-8 shadow-none select-none ${
        shaking ? 'animate-shake' : ''
      }`}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CABEÇALHO DO CARD (FIXO)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="text-center">
        <span className="text-[28px] font-bold text-[#111111] leading-none tracking-tight">
          m<span className="text-[#F5A623]">.</span>
        </span>
      </div>

      <div className="text-center mt-4">
        <h1 className="text-[18px] font-semibold text-[#111111] leading-tight tracking-[-0.3px]">
          Acesso
        </h1>
        <p className="text-[13px] font-normal text-[#9CA3AF] mt-1">
          Informe seu telefone cadastrado
        </p>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ETAPA 0 — ESTADO INICIAL
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {etapa === 0 && (
        <div className="mt-8 animate-in fade-in-0 duration-200">
          <button
            type="button"
            onClick={() => setEtapa(1)}
            className="w-full h-[52px] bg-[#111111] hover:bg-black active:opacity-85 text-white text-[15px] font-semibold rounded-none transition-opacity cursor-pointer flex items-center justify-center"
          >
            Entrar
          </button>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ETAPA 1 & ETAPA 2 — CAMPO IDENTIFICADOR
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {(etapa === 1 || etapa === 2) && (
        <div className="mt-6 space-y-5 animate-in fade-in-0 duration-200">
          <div>
            <label className="block text-[12px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2">
              Telefone ou e-mail
            </label>
            <input
              ref={inputIdentificadorRef}
              type="text"
              value={identificador}
              onChange={handleIdentificadorChange}
              placeholder="+55 (11) 9XXXX-XXXX"
              className="w-full h-[48px] bg-white border border-[#E2E2DC] rounded-none px-4 py-3.5 text-[15px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#111111] focus:outline-none transition-colors"
            />
          </div>

          {erro && (
            <p className="text-[12px] text-[#DC2626] font-medium text-center">
              {erro}
            </p>
          )}

          {/* ETAPA 1: Botão Entrar desabilitado antes de digitar */}
          {etapa === 1 && (
            <button
              type="button"
              disabled
              className="w-full h-[52px] bg-[#111111] text-white text-[15px] font-semibold rounded-none opacity-40 cursor-not-allowed flex items-center justify-center"
            >
              Entrar
            </button>
          )}

          {/* ETAPA 2: Dois botões de método ao digitar */}
          {etapa === 2 && (
            <div className="flex gap-2 animate-in fade-in-0 duration-200">
              <button
                type="button"
                onClick={() => handleEscolherMetodo('chave')}
                className="flex-1 h-[52px] bg-white border border-[#E2E2DC] hover:border-[#111111] rounded-none inline-flex items-center justify-center gap-2 hover:bg-[#F7F7F5] transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-[#111111]" />
                <span className="text-[13px] font-medium text-[#111111]">
                  Entrar com chave
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleEscolherMetodo('codigo_unico')}
                className="flex-1 h-[52px] bg-white border border-[#E2E2DC] hover:border-[#111111] rounded-none inline-flex items-center justify-center gap-2 hover:bg-[#F7F7F5] transition-colors cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-[#111111]" />
                <span className="text-[13px] font-medium text-[#111111]">
                  Código único
                </span>
              </button>
            </div>
          )}

          {/* Link Voltar → Volta para etapa 0 */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleVoltar}
              className="text-[12px] text-[#9CA3AF] hover:text-[#111111] transition-colors cursor-pointer"
            >
              ← Voltar
            </button>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ETAPA 3 — CAMPO CÓDIGO 6 DÍGITOS
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {etapa === 3 && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5 animate-in fade-in-0 duration-200"
        >
          {metodo === 'codigo_unico' && identificador.trim() ? (
            <div className="text-center">
              <p className="text-[13px] text-[#6B7280]">
                Enviamos um código para
              </p>
              <p className="text-[13px] font-medium text-[#111111] mt-0.5 truncate">
                {identificador}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[13px] text-[#9CA3AF] truncate">
                {identificador}
              </p>
            </div>
          )}

          {/* Campo de Código 6 Dígitos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] block">
                {metodo === 'chave'
                  ? 'CÓDIGO DE ACESSO'
                  : 'CÓDIGO RECEBIDO'}
              </label>
              <span className="text-[12px] text-[#9CA3AF]">
                Demo: 123456
              </span>
            </div>

            <input
              ref={inputCodigoRef}
              type={metodo === 'chave' ? 'password' : 'text'}
              maxLength={6}
              value={codigo}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setCodigo(val);
                setErro(null);
              }}
              placeholder={metodo === 'chave' ? '••••••' : '000000'}
              className={`w-full h-[48px] bg-white border border-[#E2E2DC] rounded-none px-4 text-[16px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#111111] focus:outline-none transition-colors ${
                metodo === 'chave'
                  ? 'tracking-[6px]'
                  : 'tracking-[8px] text-center'
              }`}
            />

            {erro && (
              <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 text-center">
                {erro}
              </p>
            )}
          </div>

          {/* Botão Entrar / Confirmar (ativo somente com 6 dígitos) */}
          <button
            type="submit"
            disabled={codigo.length !== 6 || loading}
            className={`w-full h-[52px] bg-[#111111] text-white text-[15px] font-semibold rounded-none transition-all flex items-center justify-center gap-2 ${
              codigo.length === 6 && !loading
                ? 'hover:bg-black active:opacity-85 cursor-pointer opacity-100'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {metodo === 'chave' ? 'Entrando...' : 'Confirmando...'}
                </span>
              </>
            ) : metodo === 'chave' ? (
              'Entrar'
            ) : (
              'Confirmar'
            )}
          </button>

          {/* Link Voltar → Volta para Etapa 2 */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleVoltar}
              className="text-[12px] text-[#9CA3AF] hover:text-[#111111] transition-colors cursor-pointer"
            >
              ← Voltar
            </button>
          </div>
        </form>
      )}

      {/* Link de Ajuda */}
      <div className="text-center mt-6 pt-4 border-t border-[#E2E2DC]">
        <a
          href="https://wa.me/5511952137598"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] text-[#6B7280] hover:text-[#111111] transition-colors"
        >
          Problemas com o acesso? Fale com o suporte
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] relative overflow-hidden">
      <Suspense
        fallback={
          <div
            style={{
              width: 'calc(100% - 48px)',
              maxWidth: '380px',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            className="h-[220px] bg-white rounded-[16px] border border-[#E5E5E3] p-7 animate-pulse"
          />
        }
      >
        <LoginCard />
      </Suspense>
    </div>
  );
}
