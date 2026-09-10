'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { RDORegistro, EquipeMembro, MaquinaCheck } from '@/types/rdo';

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
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center text-[#9B9B9B] text-[13px]">
        Carregando dados do relatório...
      </div>
    );
  }

  if (!rdo) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-between">
        <HeaderMobile showBack={true} backHref="/menu" title="Visualizar RDO" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <p className="text-[#6B6B6B] text-[14px]">Relatório Diário de Obra não encontrado.</p>
          <Button onClick={() => router.push('/menu')}>Voltar ao Menu</Button>
        </div>
      </div>
    );
  }

  const equipeArr: EquipeMembro[] = Array.isArray(rdo.equipe) ? rdo.equipe : [];
  const maquinasArr: MaquinaCheck[] = Array.isArray(rdo.maquinas) ? rdo.maquinas : [];
  const fotosArr: string[] = Array.isArray(rdo.fotos) ? rdo.fotos : [];

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between">
      <HeaderMobile
        showBack={true}
        backHref="/menu"
        title={`RDO — ${rdo.data}`}
        rightBadge={rdo.status === 'enviado' ? 'Enviado' : 'Registrado'}
      />

      <main className="p-6 flex-1 max-w-md w-full mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="border-b border-[#E5E5E3] pb-4">
          <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-1">
            {trechoNome || 'Trecho da Obra'} · Turno {rdo.turno}
          </span>
          <h2 className="text-[15px] font-medium text-[#111111]">
            Encarregado: {usuarioNome || 'Operador'}
          </h2>
          <p className="text-[13px] text-[#9B9B9B] mt-0.5">
            {rdo.data} · {rdo.clima_condicao || 'Estável'}
          </p>
        </div>

        {/* Atividades */}
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
            ATIVIDADES DO DIA
          </span>
          <p className="text-[14px] text-[#111111] leading-relaxed whitespace-pre-wrap">
            {rdo.atividades || 'Nenhuma atividade descrita.'}
          </p>
        </div>

        {/* Equipe */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
              EQUIPE REGISTRADA
            </span>
            <span className="text-[11px] text-[#9B9B9B]">{equipeArr.length}</span>
          </div>

          <div className="divide-y divide-[#E5E5E3]">
            {equipeArr.map((m, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-[13px]">
                <div>
                  <span className="text-[#111111] block">{m.nome}</span>
                  <span className="text-[#9B9B9B]">{m.funcao}</span>
                </div>
                <span className="text-[11px] text-[#9B9B9B]">Presente</span>
              </div>
            ))}
          </div>
        </div>

        {/* Máquinas */}
        {maquinasArr.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
                MÁQUINAS
              </span>
              <span className="text-[11px] text-[#9B9B9B]">{maquinasArr.length}</span>
            </div>

            <div className="divide-y divide-[#E5E5E3]">
              {maquinasArr.map((mq, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-[13px]">
                  <span className="text-[#111111] capitalize">{mq.status}</span>
                  {mq.observacao && (
                    <span className="text-[#9B9B9B]">{mq.observacao}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fotos */}
        {fotosArr.length > 0 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              FOTOS
            </span>
            <div className="grid grid-cols-3 gap-2">
              {fotosArr.map((url, i) => (
                <div key={i} className="aspect-square rounded-[4px] overflow-hidden border border-[#E5E5E3] bg-[#EFEFED]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3] bg-[#F7F7F5] pb-safe">
        MetricLab · Consórcio Pacote 15 e 19
      </footer>
    </div>
  );
}
