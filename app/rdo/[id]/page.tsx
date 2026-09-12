'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { supabase } from '@/lib/supabase';
import { RDORegistro, EquipeMembro, MaquinaCheck } from '@/types/rdo';
import { useDesktopBlock } from '@/hooks/useDesktopBlock';

export default function VisualizarRDOPage() {
  useDesktopBlock();
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
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center text-[#9CA3AF] text-[13px] font-sans">
        Carregando dados do relatório...
      </div>
    );
  }

  if (!rdo) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-between font-sans">
        <HeaderMobile showBack={true} backHref="/menu" title="Visualizar RDO" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <p className="text-[#6B7280] text-[15px]">Relatório Diário de Obra não encontrado.</p>
          <button
            type="button"
            onClick={() => router.push('/menu')}
            className="w-full max-w-xs h-[52px] bg-[#111111] text-white text-[15px] font-semibold rounded-[8px] cursor-pointer"
          >
            Voltar ao Menu
          </button>
        </div>
      </div>
    );
  }

  const equipeArr: EquipeMembro[] = Array.isArray(rdo.equipe) ? rdo.equipe : [];
  const maquinasArr: MaquinaCheck[] = Array.isArray(rdo.maquinas) ? rdo.maquinas : [];
  const fotosArr: string[] = Array.isArray(rdo.fotos) ? rdo.fotos : [];

  const dataFormatada = rdo.data
    ? new Date(rdo.data + 'T00:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between font-sans">
      <HeaderMobile
        showBack={true}
        backHref="/menu"
        title={`RDO · ${dataFormatada || rdo.data}`}
        rightBadge={rdo.status === 'enviado' ? 'Enviado' : 'Registrado'}
      />

      <main className="p-4 flex-1 max-w-md w-full mx-auto space-y-6">
        {/* Status em Destaque no Topo */}
        <div className="bg-white border border-[#E2E2DC] p-4 rounded-[12px] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
              STATUS DO RELATÓRIO
            </span>
            <span className="bg-[#111111] text-white text-[12px] font-medium px-2.5 py-1 rounded-[4px]">
              {rdo.status === 'enviado' ? 'Enviado' : 'Registrado'}
            </span>
          </div>
          <div>
            <h2 className="text-[18px] font-semibold text-[#111111] tracking-[-0.3px]">
              {trechoNome || 'Pacote 15 e 19'}
            </h2>
            <p className="text-[13px] text-[#9CA3AF] mt-0.5">
              Encarregado: {usuarioNome || 'Operador'} · Turno: {rdo.turno || 'Integral'}
            </p>
          </div>
        </div>

        {/* Seção 1: Clima */}
        <div className="bg-white border border-[#E2E2DC] p-4 rounded-[12px] space-y-2">
          <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
            CONDIÇÕES CLIMÁTICAS
          </span>
          <p className="text-[15px] text-[#111111]">
            {rdo.clima_condicao || 'Parcialmente Nublado'}
          </p>
          <p className="text-[13px] text-[#9CA3AF]">
            Temperatura: {rdo.clima_temperatura || 26}°C · Umidade: {rdo.clima_umidade || 65}% · Vento: {rdo.clima_vento || 10} km/h
          </p>
        </div>

        {/* Seção 2: Atividades do Dia */}
        <div className="bg-white border border-[#E2E2DC] p-4 rounded-[12px] space-y-2">
          <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
            ATIVIDADES EXECUTADAS
          </span>
          <p className="text-[15px] text-[#111111] leading-relaxed whitespace-pre-wrap">
            {rdo.atividades || 'Nenhuma atividade descrita.'}
          </p>
        </div>

        {/* Seção 3: Efetivo */}
        <div className="bg-white border border-[#E2E2DC] p-4 rounded-[12px] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
              EFETIVO REGISTRADO
            </span>
            <span className="text-[12px] font-medium text-[#6B7280]">
              {equipeArr.length} colaboradores
            </span>
          </div>

          <div className="divide-y divide-[#E2E2DC] border-t border-[#E2E2DC]">
            {equipeArr.map((m, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium text-[#111111]">{m.nome}</p>
                  <p className="text-[12px] text-[#9CA3AF]">{m.funcao}</p>
                </div>
                <span className="bg-[#F7F7F5] border border-[#E2E2DC] text-[#6B7280] text-[12px] font-medium px-2 py-0.5 rounded-[4px]">
                  Presente
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Seção 4: Equipamentos */}
        {maquinasArr.length > 0 && (
          <div className="bg-white border border-[#E2E2DC] p-4 rounded-[12px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                EQUIPAMENTOS
              </span>
              <span className="text-[12px] font-medium text-[#6B7280]">
                {maquinasArr.length} unidades
              </span>
            </div>

            <div className="divide-y divide-[#E2E2DC] border-t border-[#E2E2DC]">
              {maquinasArr.map((mq, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-[14px]">
                  <div>
                    <span className="text-[#111111] font-medium capitalize block">{mq.status}</span>
                    {mq.observacao && (
                      <span className="text-[12px] text-[#9CA3AF] block">{mq.observacao}</span>
                    )}
                  </div>
                  <span className="text-[12px] text-[#6B7280] uppercase">
                    {mq.status === 'operando' ? 'Ativo' : 'Parado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção 5: Fotos */}
        {fotosArr.length > 0 && (
          <div className="bg-white border border-[#E2E2DC] p-4 rounded-[12px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                REGISTROS FOTOGRÁFICOS
              </span>
              <span className="text-[12px] font-medium text-[#6B7280]">
                {fotosArr.length} fotos
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {fotosArr.map((url, i) => (
                <div key={i} className="aspect-square rounded-[8px] overflow-hidden border border-[#E2E2DC] bg-[#F7F7F5]">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Rodapé Minimalista */}
      <footer className="w-full text-center py-4 text-[12px] text-[#9CA3AF] border-t border-[#E2E2DC] bg-[#F7F7F5]">
        MetricLab · Consórcio Pacote 15 e 19
      </footer>
    </div>
  );
}
