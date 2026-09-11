'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RDOSession, RDORegistro } from '@/types/rdo';
import { getSession, clearSession } from '@/lib/auth';
import { MetricLabLogo } from '@/components/brand/MetricLabLogo';
import { ChevronRight } from 'lucide-react';
import { useDesktopBlock } from '@/hooks/useDesktopBlock';

export default function MenuPage() {
  useDesktopBlock();
  const router = useRouter();
  const [session, setSession] = useState<RDOSession | null>(null);
  const [hojeRDO, setHojeRDO] = useState<RDORegistro | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }

    const currentSession: RDOSession = {
      usuario_id: s.usuario_id,
      nome: s.nome,
      trecho_id: s.trecho_id || null,
      trecho_nome: s.trecho_nome || 'Pacote 15 e 19',
      pacote: (s.pacote as any) || 'lote15',
      cargo: s.cargo || 'Encarregado',
    };
    setSession(currentSession);

    const hoje = new Date().toISOString().split('T')[0];
    supabase
      .from('demo_rdo_registros')
      .select('*')
      .eq('usuario_id', s.usuario_id)
      .eq('data', hoje)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setHojeRDO(data[0] as RDORegistro);
        }
      });
  }, [router]);

  if (!session) return null;

  const hojeFormatado = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const handleLogout = () => {
    clearSession();
    router.replace('/login');
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between font-sans">
      {/* Header Mobile: 56px, bg white, border #E2E2DC */}
      <header className="h-[56px] w-full bg-white border-b border-[#E2E2DC] px-4 flex items-center justify-between select-none">
        <div className="flex items-center">
          <MetricLabLogo size="sm" showText={true} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
            {session.trecho_nome || 'Pacote 15 e 19'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[13px] font-medium text-[#111111] hover:underline cursor-pointer min-h-[44px] flex items-center px-1"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex-1 max-w-md w-full mx-auto p-4 space-y-6">
        {/* Identificação do Usuário e Trecho */}
        <div className="pt-2">
          <h1 className="text-[18px] font-semibold text-[#111111] tracking-[-0.3px]">
            {session.nome}
          </h1>
          <p className="text-[13px] font-normal text-[#9CA3AF] mt-0.5">
            {session.cargo || 'Encarregado'} · {session.trecho_nome || 'Pacote 15 e 19'}
          </p>
        </div>

        {/* Card de Resumo do Dia */}
        <div className="bg-white border border-[#E2E2DC] rounded-none p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
              Resumo do Dia
            </span>
            {hojeRDO ? (
              <span className="bg-[#111111] text-white text-[12px] font-medium px-2.5 py-1 rounded-none">
                Enviado
              </span>
            ) : (
              <span className="border border-[#111111] text-[#111111] bg-white text-[12px] font-medium px-2.5 py-1 rounded-none">
                Em andamento
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-[15px] font-medium text-[#111111]">
              {capitalize(hojeFormatado)}
            </div>
            <div className="text-[13px] text-[#6B7280]">
              Clima: Manhã Bom · Tarde Nublado
            </div>
          </div>

          {hojeRDO ? (
            <div className="pt-2 border-t border-[#E2E2DC] flex items-center justify-between text-[13px]">
              <span className="text-[#6B7280]">RDO registrado</span>
              <button
                type="button"
                onClick={() => router.push(`/rdo/${hojeRDO.id}`)}
                className="font-medium text-[#111111] underline cursor-pointer"
              >
                Visualizar
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-[#E2E2DC] text-[13px] text-[#9CA3AF]">
              Nenhum relatório finalizado hoje para este trecho.
            </div>
          )}
        </div>

        {/* Seção de Ações em Cards Largos */}
        <div className="space-y-3">
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] block">
            Ações
          </span>

          {/* Card 1: Novo RDO */}
          <button
            type="button"
            onClick={() => router.push('/rdo/novo')}
            className="w-full text-left bg-white border border-[#E2E2DC] hover:border-[#111111] rounded-none p-4 flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="space-y-0.5 pr-2">
              <div className="text-[15px] font-semibold text-[#111111]">
                Novo RDO
              </div>
              <div className="text-[13px] text-[#9CA3AF] leading-snug">
                Lançar efetivo, clima, equipamentos, atividades e fotos
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#111111] shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Card 2: Histórico */}
          <button
            type="button"
            onClick={() =>
              router.push(
                hojeRDO
                  ? `/rdo/${hojeRDO.id}`
                  : '/rdo/9dcae9a4-53fb-44d8-b3bc-6bca9c169cec'
              )
            }
            className="w-full text-left bg-white border border-[#E2E2DC] hover:border-[#111111] rounded-none p-4 flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="space-y-0.5 pr-2">
              <div className="text-[15px] font-semibold text-[#111111]">
                Histórico
              </div>
              <div className="text-[13px] text-[#9CA3AF] leading-snug">
                Consultar relatórios diários de obra registrados
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#111111] shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Card 3: Registrar Ocorrência */}
          <button
            type="button"
            onClick={() => router.push('/ocorrencia')}
            className="w-full text-left bg-white border border-[#E2E2DC] hover:border-[#111111] rounded-none p-4 flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="space-y-0.5 pr-2">
              <div className="text-[15px] font-semibold text-[#111111]">
                Registrar Ocorrência
              </div>
              <div className="text-[13px] text-[#9CA3AF] leading-snug">
                Apontar acidentes, paralisações e interferências no trecho
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#111111] shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Rodapé Minimalista */}
      <footer className="w-full text-center py-4 text-[12px] text-[#9CA3AF] border-t border-[#E2E2DC]">
        MetricLab · Pacote 15 e 19
      </footer>
    </main>
  );
}
