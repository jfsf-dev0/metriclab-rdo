'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { supabase } from '@/lib/supabase';
import { RDOSession, RDORegistro } from '@/types/rdo';
import { ChevronRight } from 'lucide-react';

export default function MenuPage() {
  const router = useRouter();
  const [session, setSession] = useState<RDOSession | null>(null);
  const [hojeRDO, setHojeRDO] = useState<RDORegistro | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('ml_rdo_session');
    if (!raw) {
      router.replace('/login');
      return;
    }

    try {
      const parsed: RDOSession = JSON.parse(raw);
      setSession(parsed);

      const hoje = new Date().toISOString().split('T')[0];
      supabase
        .from('demo_rdo_registros')
        .select('*')
        .eq('usuario_id', parsed.usuario_id)
        .eq('data', hoje)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setHojeRDO(data[0] as RDORegistro);
          }
        });
    } catch {
      router.replace('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('ml_rdo_session');
    document.cookie = 'ml_rdo_session=; path=/; max-age=0';
    router.replace('/login');
  };

  if (!session) {
    return null;
  }

  const hojeFormatado = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const pacoteLabel = session.pacote === 'lote19' ? 'Lote 19' : 'Lote 15';

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between">
      {/* Header: logo + "Olá, [Nome]" + badge "Lote 15" */}
      <HeaderMobile
        greeting={`Olá, ${session.nome.split(' ')[0]}`}
        rightBadge={pacoteLabel}
      />

      <div className="py-6 flex-1 max-w-md w-full mx-auto px-5">
        {/* Card info — border-bottom 1px hairline apenas */}
        <div className="border-b border-[#E5E5E3] pb-4">
          <h2 className="text-[15px] font-medium text-[#111111]">
            {session.nome} — {session.cargo || 'Encarregado'}
          </h2>
          <p className="text-[13px] text-[#9B9B9B] mt-1">
            {session.trecho_nome}
          </p>
          <p className="text-[13px] text-[#9B9B9B] mt-0.5">
            {capitalize(hojeFormatado)}
          </p>
        </div>

        <div className="h-8" />

        {/* Eyebrow: AÇÕES */}
        <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
          AÇÕES
        </span>

        {/* Dois itens de lista (SEM CARD COM BORDAS COLORIDAS) */}
        <div className="divide-y divide-[#E5E5E3]">
          {/* [Ocorrência] */}
          <Link href="/ocorrencia" className="block">
            <div className="py-5 flex items-center justify-between gap-4 hover:bg-[#EFEFED] -mx-5 px-5 transition-colors cursor-pointer">
              <div>
                <div className="text-[15px] font-medium text-[#111111]">
                  Registrar Ocorrência
                </div>
                <div className="text-[13px] text-[#9B9B9B] mt-0.5">
                  Acidentes, quase-acidentes e intercorrências
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#C4C4C2] shrink-0" />
            </div>
          </Link>

          {/* [RDO] */}
          <Link
            href={hojeRDO ? `/rdo/${hojeRDO.id}` : '/rdo/novo'}
            className="block"
          >
            <div className="py-5 flex items-center justify-between gap-4 hover:bg-[#EFEFED] -mx-5 px-5 transition-colors cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-medium text-[#111111]">
                    Relatório Diário de Obra
                  </span>
                  {hojeRDO && (
                    <span className="text-[11px] font-medium text-[#9B9B9B]">
                      · Enviado
                    </span>
                  )}
                </div>
                <div className="text-[13px] text-[#9B9B9B] mt-0.5">
                  {hojeRDO
                    ? 'Registro do dia enviado com sucesso'
                    : 'Registro das atividades do dia'}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#C4C4C2] shrink-0" />
            </div>
          </Link>
        </div>
      </div>

      <footer className="p-4 flex justify-between items-center text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3] bg-[#F7F7F5] pb-safe">
        <span>MetricLab Inteligência Operacional</span>
        <button
          onClick={handleLogout}
          className="text-[#9B9B9B] hover:text-[#111111] transition-colors bg-transparent border-none p-0 cursor-pointer"
        >
          Sair
        </button>
      </footer>
    </main>
  );
}
