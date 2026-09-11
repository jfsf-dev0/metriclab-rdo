'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RDOSession, RDORegistro } from '@/types/rdo';
import { getSession, clearSession } from '@/lib/auth';
import { ChevronRight, ChevronDown } from 'lucide-react';

export default function MenuPage() {
  const router = useRouter();
  const [session, setSession] = useState<RDOSession | null>(null);
  const [hojeRDO, setHojeRDO] = useState<RDORegistro | null>(null);
  const [openItem, setOpenItem] = useState<'ocorrencia' | 'rdo' | null>(null);

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
  const pacoteLabel = session.pacote === 'lote19' ? 'Lote 19' : 'Lote 15';

  const toggleItem = (item: 'ocorrencia' | 'rdo') => {
    setOpenItem((prev) => (prev === item ? null : item));
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between">
      {/* Header: logo | "RDO" center | "Lote [X]" + Sair */}
      <header className="h-[52px] bg-[#F7F7F5] border-b border-[#E5E5E3] px-6 flex items-center justify-between">
        <span className="text-[20px] font-bold text-[#111111] leading-none">
          m<span className="text-[#F5A623]">.</span>
        </span>
        <span className="text-[16px] font-normal text-[#111111]">
          RDO
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-normal text-[#9B9B9B]">
            {pacoteLabel}
          </span>
          <button
            onClick={() => {
              clearSession();
              router.replace('/login');
            }}
            className="text-[12px] font-medium text-[#6B6B6B] hover:text-[#111111] transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Padding 24px */}
      <div className="flex-1 max-w-md w-full mx-auto p-6">
        {/* Info plana (sem card) */}
        <div>
          <h2 className="text-[20px] font-normal leading-none text-[#111111] mb-1">
            {session.nome} — {session.cargo || 'Encarregado'}
          </h2>
          <p className="text-[16px] font-normal text-[#6B6B6B] leading-[1.5]">
            {session.trecho_nome}
          </p>
          <p className="text-[13px] font-normal text-[#9B9B9B] mt-0.5">
            {capitalize(hojeFormatado)}
          </p>
        </div>

        <div className="w-full border-b border-[#E5E5E3] my-8" />

        {/* AÇÕES — eyebrow */}
        <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
          AÇÕES
        </span>

        {/* Lista accordion */}
        <div>
          {/* ITEM 1: Registrar Ocorrência */}
          <div className="border-b border-[#E5E5E3]">
            <div
              onClick={() => toggleItem('ocorrencia')}
              className="py-5 flex items-center justify-between cursor-pointer select-none transition-colors"
            >
              <span className="text-[20px] font-normal leading-none text-[#111111]">
                Registrar Ocorrência
              </span>
              {openItem === 'ocorrencia' ? (
                <ChevronDown className="w-5 h-5 text-[#C4C4C2]" />
              ) : (
                <ChevronRight className="w-5 h-5 text-[#C4C4C2]" />
              )}
            </div>

            {openItem === 'ocorrencia' && (
              <div className="bg-white p-4 mb-4 rounded-none">
                <p className="text-[16px] font-normal leading-[1.5] text-[#6B6B6B]">
                  Acidentes, quase-acidentes e intercorrências.
                </p>
                <div className="h-4" />
                <button
                  onClick={() => router.push('/ocorrencia')}
                  className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
                >
                  Abrir formulário
                </button>
              </div>
            )}
          </div>

          {/* ITEM 2: Relatório Diário de Obra */}
          <div className="border-b border-[#E5E5E3]">
            <div
              onClick={() => toggleItem('rdo')}
              className="py-5 flex items-center justify-between cursor-pointer select-none transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-normal leading-none text-[#111111]">
                  Relatório Diário de Obra
                </span>
                {hojeRDO && (
                  <span className="text-[11px] font-medium text-[#9B9B9B]">
                    · Enviado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {openItem === 'rdo' ? (
                  <ChevronDown className="w-5 h-5 text-[#C4C4C2]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[#C4C4C2]" />
                )}
              </div>
            </div>

            {openItem === 'rdo' && (
              <div className="bg-white p-4 mb-4 rounded-none">
                <p className="text-[16px] font-normal leading-[1.5] text-[#6B6B6B]">
                  {hojeRDO
                    ? 'Registro do dia enviado com sucesso.'
                    : 'Registro das atividades do dia.'}
                </p>
                <div className="h-4" />
                {hojeRDO ? (
                  <button
                    onClick={() => router.push(`/rdo/${hojeRDO.id}`)}
                    className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    Ver RDO de hoje
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/rdo/novo')}
                    className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    Iniciar RDO
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3]">
        MetricLab · Pacote 15 e 19
      </footer>
    </main>
  );
}
