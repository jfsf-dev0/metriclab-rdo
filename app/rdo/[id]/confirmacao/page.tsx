'use client';
import React from 'react';
import Link from 'next/link';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { Button } from '@/components/ui/button';

export default function ConfirmacaoPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between">
      <HeaderMobile showBack={false} title="Confirmação" />

      <main className="p-6 flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <div className="text-left">
          <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
            ENVIADO
          </span>
          <div className="h-2" />
          <h1 className="text-[24px] font-medium text-[#111111] tracking-[-0.5px] leading-[1.2]">
            Relatório registrado com sucesso.
          </h1>
          <div className="h-2" />
          <p className="text-[15px] font-normal text-[#6B6B6B] leading-[1.5]">
            Supervisor notificado.
          </p>

          <div className="border-b border-[#E5E5E3] my-8" />

          {/* Lista flat confirmações */}
          <div className="divide-y divide-[#E5E5E3] mb-10">
            <div className="py-3 text-[14px] text-[#111111]">
              Sistema registrado
            </div>
            <div className="py-3 text-[14px] text-[#111111]">
              Supervisor notificado
            </div>
            <div className="py-3 text-[14px] text-[#111111]">
              Dados disponíveis no painel
            </div>
          </div>

          <Link href="/menu" className="w-full block">
            <Button
              className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
            >
              Voltar ao menu
            </Button>
          </Link>
        </div>
      </main>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3] bg-[#F7F7F5] pb-safe">
        MetricLab · Consórcio Pacote 15 e 19
      </footer>
    </div>
  );
}
