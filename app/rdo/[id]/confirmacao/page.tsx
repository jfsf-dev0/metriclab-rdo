'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import {
  CheckCircle2,
  MapPin,
  Calendar,
  CloudSun,
  Users,
  Truck,
  Camera,
  PenTool,
  ArrowRight,
} from 'lucide-react';

export default function ConfirmacaoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [rdo, setRdo] = useState<any>(null);
  const [trechoNome, setTrechoNome] = useState('');
  const [superiorNome, setSuperiorNome] = useState('Eng. Supervisor');

  useEffect(() => {
    if (!id) return;

    supabase
      .from('demo_rdo_registros')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setRdo(data);
          if (data.trecho_id) {
            supabase
              .from('demo_lote15_trechos')
              .select('nome, superior_nome')
              .eq('id', data.trecho_id)
              .single()
              .then(({ data: trechoData }) => {
                if (trechoData) {
                  setTrechoNome(trechoData.nome);
                  if (trechoData.superior_nome) {
                    setSuperiorNome(trechoData.superior_nome);
                  }
                }
              });
          }
        }
      });
  }, [id]);

  const totalEquipe = rdo?.equipe?.length || 0;
  const totalMaquinas = rdo?.maquinas?.length || 0;
  const totalFotos = rdo?.fotos?.length || 0;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <HeaderMobile showBack={false} title="Confirmação" />

      <main className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-6 max-w-sm mx-auto">
        {/* Ícone verde animado */}
        <div className="animate-in zoom-in-50 duration-500 ease-out">
          <div className="w-20 h-20 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center text-green-600 shadow-lg shadow-green-600/10">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Título & Subtítulo */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            RDO Enviado!
          </h2>
          <p className="text-gray-500 text-sm font-medium">
            Seu supervisor foi notificado via WhatsApp
          </p>
        </div>

        {/* Card Resumo Final */}
        <Card className="w-full bg-gray-50 border-gray-200 p-4 text-left space-y-2.5 text-xs text-gray-700 shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="font-bold text-gray-900 truncate">
              {trechoNome || 'Trecho da Obra'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              {rdo?.data || 'Hoje'} • Turno {rdo?.turno ? rdo.turno.toUpperCase() : 'MANHÃ'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CloudSun className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              {rdo?.clima_condicao || 'Tempo estável'} ({rdo?.clima_temperatura || 27}°C)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{totalEquipe} colaborador{totalEquipe !== 1 ? 'es' : ''} registrado(s)</span>
          </div>

          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{totalMaquinas} máquina{totalMaquinas !== 1 ? 's' : ''} verificada(s)</span>
          </div>

          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{totalFotos} foto{totalFotos !== 1 ? 's' : ''} anexada(s)</span>
          </div>

          <div className="flex items-center gap-2 text-green-700 font-semibold pt-1 border-t border-gray-200">
            <PenTool className="w-3.5 h-3.5" />
            <span>Assinado digitalmente</span>
            <span className="text-gray-400">•</span>
            <MapPin className="w-3.5 h-3.5" />
            <span>Georreferenciado</span>
          </div>
        </Card>

        {/* Linha do Tempo de Notificações */}
        <div className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-left space-y-3 shadow-sm">
          <div className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
            Status da Transmissão
          </div>

          <div className="space-y-2.5 text-xs text-gray-700">
            <div className="flex items-center gap-2 text-green-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>RDO registrado no sistema</span>
            </div>

            <div className="flex items-center gap-2 text-green-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Supervisor {superiorNome} notificado via WhatsApp</span>
            </div>

            <div className="flex items-center gap-2 text-green-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Dados disponíveis no painel em tempo real</span>
            </div>
          </div>
        </div>

        {/* Botão Voltar ao Menu */}
        <Link href="/menu" className="w-full pt-2">
          <Button
            size="lg"
            className="w-full py-4 text-base font-bold shadow-md shadow-blue-500/20 rounded-xl flex items-center justify-center gap-2"
          >
            <span>Voltar ao Menu</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </main>
    </div>
  );
}
