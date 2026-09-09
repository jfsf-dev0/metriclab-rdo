'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { RDOSession, RDORegistro } from '@/types/rdo';
import {
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  LogOut,
} from 'lucide-react';

export default function MenuPage() {
  const router = useRouter();
  const [session, setSession] = useState<RDOSession | null>(null);
  const [hojeRDO, setHojeRDO] = useState<RDORegistro | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('ml_rdo_session');
    if (!raw) {
      router.replace('/login');
      return;
    }

    try {
      const parsed: RDOSession = JSON.parse(raw);
      setSession(parsed);

      // Checa se já existe RDO do dia para este usuário
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
          setLoading(false);
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
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between">
      {/* Header Fixo: logo + "Olá, [Nome]" + badge pacote bg-blue-50 text-blue-700 */}
      <HeaderMobile
        greeting={`Olá, ${session.nome.split(' ')[0]}`}
        rightBadge={pacoteLabel}
        rightBadgeVariant="blue"
      />

      {/* Main Content */}
      <div className="py-5 flex-1 max-w-md w-full mx-auto">
        {/* Card info encarregado */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mx-4 mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">
                {session.nome}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {session.cargo || 'Encarregado'} • {pacoteLabel}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 grid grid-cols-1 gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-semibold text-gray-800 truncate">
                {session.trecho_nome}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500">{capitalize(hojeFormatado)}</span>
            </div>
          </div>
        </div>

        {/* Botoes Grandes de Acao */}
        <div className="pt-1">
          {/* BOTÃO 1 — Registrar Ocorrência */}
          <Link href="/ocorrencia" className="block group">
            <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 mx-4 mb-3 shadow-sm hover:border-amber-400 hover:shadow-md transition-all active:scale-[0.99] cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-7 h-7 text-amber-500" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Registrar Ocorrência
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  Acidentes, quase-acidentes e intercorrências
                </p>
              </div>
            </div>
          </Link>

          {/* BOTÃO 2 — Fazer RDO */}
          <Link
            href={hojeRDO ? `/rdo/${hojeRDO.id}` : '/rdo/novo'}
            className="block group"
          >
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 mx-4 mb-3 shadow-sm hover:border-blue-400 hover:shadow-md transition-all active:scale-[0.99] cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-7 h-7 text-blue-600" />
                </div>
                {hojeRDO ? (
                  <span className="bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 text-xs font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span>Enviado hoje</span>
                  </span>
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                )}
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Relatório Diário de Obra
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  {hojeRDO
                    ? 'Toque para visualizar os detalhes do RDO de hoje'
                    : 'Registro das atividades do dia'}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Rodapé com logout */}
      <footer className="p-4 flex justify-between items-center text-xs text-gray-400 border-t border-gray-200 bg-white">
        <span>MetricLab Inteligência Operacional</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 font-medium py-1 px-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </footer>
    </main>
  );
}
