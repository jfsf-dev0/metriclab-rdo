'use client';
import React from 'react';
import Link from 'next/link';

export default function ConfirmacaoPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between p-6">
      <main className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <div className="text-left">
          <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
            ENVIADO
          </span>
          <div className="h-2" />
          <h1 className="text-[20px] font-normal text-[#111111] leading-[1.0]">
            Relatório registrado.
          </h1>
          <div className="h-2" />
          <p className="text-[16px] font-normal text-[#6B6B6B] leading-[1.5]">
            Supervisor notificado via WhatsApp.
          </p>

          <div className="border-b border-[#E5E5E3] my-6" />

          {/* Lista flat confirmações */}
          <div className="divide-y divide-[#E5E5E3]">
            <div className="py-3 text-[16px] text-[#111111]">
              Sistema registrado
            </div>
            <div className="py-3 text-[16px] text-[#111111]">
              Supervisor notificado
            </div>
            <div className="py-3 text-[16px] text-[#111111]">
              Dados disponíveis no painel
            </div>
          </div>

          <div className="border-b border-[#E5E5E3] mb-8" />

          <Link href="/menu" className="w-full block">
            <button
              type="button"
              className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px] flex items-center justify-center transition-opacity hover:opacity-90"
            >
              Voltar ao menu
            </button>
          </Link>
        </div>
      </main>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3] bg-[#F7F7F5] pb-safe">
        MetricLab · Consórcio Pacote 15 e 19
      </footer>
    </div>
  );
}
