'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { useDesktopBlock } from '@/hooks/useDesktopBlock';

export default function ConfirmacaoPage() {
  useDesktopBlock();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const hojeFormatado = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between p-4 font-sans">
      <main className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto space-y-6">
        {/* Ícone Minimalista e Identidade */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-[#111111] text-white flex items-center justify-center rounded-[8px] mb-4">
            <Check className="w-6 h-6 stroke-[2]" />
          </div>

          <h1 className="text-[18px] font-semibold text-[#111111] tracking-[-0.3px]">
            RDO enviado com sucesso
          </h1>
          <p className="text-[14px] text-[#9CA3AF] mt-1">
            As informações foram sincronizadas e registradas com sucesso.
          </p>
        </div>

        {/* Resumo das Informações Principais em Grid 2 Colunas */}
        <div className="bg-white border border-[#E2E2DC] p-4 rounded-[12px] grid grid-cols-2 gap-4">
          <div>
            <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-0.5">
              TRECHO
            </span>
            <p className="text-[14px] font-medium text-[#111111]">
              Pacote 15 e 19
            </p>
          </div>

          <div>
            <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-0.5">
              DATA
            </span>
            <p className="text-[14px] font-medium text-[#111111]">
              {hojeFormatado}
            </p>
          </div>

          <div>
            <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-0.5">
              STATUS
            </span>
            <p className="text-[14px] font-medium text-[#111111]">
              Enviado
            </p>
          </div>

          <div>
            <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-0.5">
              AUDITORIA
            </span>
            <p className="text-[14px] font-medium text-[#111111]">
              Assinatura digital
            </p>
          </div>
        </div>

        {/* Dois Botões de Ação */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => router.push(`/rdo/${id}`)}
            className="w-full h-[52px] bg-[#111111] hover:bg-black text-white text-[15px] font-semibold rounded-[8px] transition-colors flex items-center justify-center cursor-pointer"
          >
            Ver RDO
          </button>

          <button
            type="button"
            onClick={() => router.push('/menu')}
            className="w-full h-[52px] bg-white border border-[#111111] hover:bg-[#F7F7F5] text-[#111111] text-[15px] font-semibold rounded-[8px] transition-colors flex items-center justify-center cursor-pointer"
          >
            Voltar ao início
          </button>
        </div>
      </main>

      <footer className="w-full text-center py-4 text-[12px] text-[#9CA3AF] border-t border-[#E2E2DC] bg-[#F7F7F5]">
        MetricLab · Consórcio Pacote 15 e 19
      </footer>
    </div>
  );
}
