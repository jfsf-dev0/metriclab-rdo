'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { RDORegistro, EquipeMembro, MaquinaCheck } from '@/types/rdo';
import {
  Calendar,
  CloudSun,
  Users,
  Truck,
  Camera,
  MapPin,
  CheckCircle2,
  FileText,
  PenTool,
  Clock,
} from 'lucide-react';

export default function VisualizarRDOPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [rdo, setRdo] = useState<RDORegistro | null>(null);
  const [loading, setLoading] = useState(true);
  const [usuarioNome, setUsuarioNome] = useState('');
  const [trechoNome, setTrechoNome] = useState('');

  useEffect(() => {
    if (!id) return;

    supabase
      .from('demo_rdo_registros')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setRdo(data as RDORegistro);
          // Buscar usuário e trecho
          if (data.usuario_id) {
            supabase
              .from('demo_rdo_usuarios')
              .select('nome, trecho_nome')
              .eq('id', data.usuario_id)
              .single()
              .then(({ data: uData }) => {
                if (uData) {
                  setUsuarioNome(uData.nome);
                  setTrechoNome(uData.trecho_nome || '');
                }
              });
          }
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <HeaderMobile showBack={true} backHref="/menu" title="Visualizar RDO" />
        <div className="flex-1 flex items-center justify-center p-8 text-sm text-gray-500">
          Carregando dados do relatório...
        </div>
      </div>
    );
  }

  if (!rdo) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <HeaderMobile showBack={true} backHref="/menu" title="Visualizar RDO" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <p className="text-gray-500 text-sm">Relatório Diário de Obra não encontrado.</p>
          <Button onClick={() => router.push('/menu')}>Voltar ao Menu</Button>
        </div>
      </div>
    );
  }

  const statusBadge =
    rdo.status === 'aprovado'
      ? { label: 'Aprovado', variant: 'green' as const }
      : rdo.status === 'enviado'
      ? { label: 'Enviado', variant: 'blue' as const }
      : { label: 'Rascunho', variant: 'amber' as const };

  const equipeArr: EquipeMembro[] = Array.isArray(rdo.equipe) ? rdo.equipe : [];
  const maquinasArr: MaquinaCheck[] = Array.isArray(rdo.maquinas) ? rdo.maquinas : [];
  const fotosArr: string[] = Array.isArray(rdo.fotos) ? rdo.fotos : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <HeaderMobile
        showBack={true}
        backHref="/menu"
        title={`RDO — ${rdo.data}`}
        rightBadge={statusBadge.label}
        rightBadgeVariant={statusBadge.variant}
      />

      <main className="p-5 flex-1 space-y-6 pb-12">
        {/* Card Cabeçalho */}
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              {trechoNome || 'Trecho da Obra'}
            </span>
            <Badge variant="blue" className="uppercase text-[10px]">
              Turno {rdo.turno}
            </Badge>
          </div>
          <div className="text-sm font-bold text-gray-900">
            Encarregado: {usuarioNome || 'Operador'}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{rdo.data}</span>
            </div>
            <div className="flex items-center gap-1">
              <CloudSun className="w-3.5 h-3.5 text-blue-600" />
              <span>{rdo.clima_condicao || 'Estável'} ({rdo.clima_temperatura || 26}°C)</span>
            </div>
          </div>
        </Card>

        {/* Atividades Executadas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Atividades do Dia</span>
          </div>
          <Card className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {rdo.atividades || 'Nenhuma atividade descrita.'}
          </Card>
        </div>

        {/* Equipe Registrada */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Equipe Registrada</span>
            </div>
            <span className="text-blue-600 font-semibold">{equipeArr.length}</span>
          </div>

          <div className="space-y-2">
            {equipeArr.map((m, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-gray-900 block">{m.nome}</span>
                  <span className="text-gray-500">{m.funcao}</span>
                </div>
                <Badge variant="green" className="text-[10px]">
                  Presente
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Máquinas */}
        {maquinasArr.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Equipamentos Verificados</span>
              </div>
              <span className="text-blue-600 font-semibold">{maquinasArr.length}</span>
            </div>

            <div className="space-y-2">
              {maquinasArr.map((mq, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-900 capitalize block">
                      Status: {mq.status}
                    </span>
                    {mq.observacao && (
                      <span className="text-gray-500 italic">Obs: {mq.observacao}</span>
                    )}
                  </div>
                  <Badge
                    variant={
                      mq.status === 'operando'
                        ? 'green'
                        : mq.status === 'parada'
                        ? 'amber'
                        : mq.status === 'manutencao'
                        ? 'red'
                        : 'gray'
                    }
                    className="capitalize text-[10px]"
                  >
                    {mq.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fotos */}
        {fotosArr.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Registro Fotográfico ({fotosArr.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {fotosArr.map((url, idx) => (
                <div
                  key={idx}
                  className="aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                >
                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assinatura Digital */}
        {rdo.assinatura_url && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
              <PenTool className="w-4 h-4 text-blue-600" />
              <span>Assinatura Digital</span>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col items-center">
              <img
                src={rdo.assinatura_url}
                alt="Assinatura do Encarregado"
                className="max-h-28 object-contain"
              />
              <span className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">
                Assinado digitalmente via PWA MetricLab
              </span>
            </div>
          </div>
        )}

        {/* GPS */}
        {rdo.geolat && rdo.geolng && (
          <div className="flex items-center justify-between p-3.5 bg-green-50 border border-green-200 rounded-2xl text-xs text-green-800 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-700" />
              <span className="font-semibold">Georreferenciado:</span>
            </div>
            <span className="font-mono text-[11px]">
              {rdo.geolat}, {rdo.geolng}
            </span>
          </div>
        )}

        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push('/menu')}
          className="w-full py-4 font-bold rounded-xl"
        >
          Voltar ao Menu Principal
        </Button>
      </main>
    </div>
  );
}
