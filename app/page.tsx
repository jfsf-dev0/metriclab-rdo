'use strict';
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ml_rdo_session');
      if (saved) {
        const session = JSON.parse(saved);
        if (session && session.usuario_id) {
          router.replace('/menu');
          return;
        }
      }
    } catch {
      // silencioso
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between items-center select-none">
      {/* [topo 20%] */}
      <div className="w-full flex justify-center items-center pt-12" style={{ height: '20vh' }}>
        <span className="text-[36px] font-bold text-[#111111] leading-none tracking-tight">
          m<span className="text-[#F5A623]">.</span>
        </span>
      </div>

      {/* [centro 50%] */}
      <div
        className="w-full max-w-md px-6 flex flex-col items-center justify-center text-center"
        style={{ height: '50vh' }}
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] mb-2">
          PROPOSTA
        </span>
        <h1 className="text-[72px] font-medium text-[#111111] tracking-[-1.2px] leading-none mb-3">
          Pacote 15 e 19
        </h1>
        <p className="text-[16px] font-normal text-[#6B6B6B] leading-[1.5]">
          Relatório Diário de Obra
        </p>
      </div>

      {/* [base 30%] + [rodapé] */}
      <div
        className="w-full max-w-md px-6 flex flex-col justify-end pb-8"
        style={{ height: '30vh' }}
      >
        <div className="w-full border-b border-[#E5E5E3] mb-6" />
        <button
          onClick={() => router.push('/login')}
          className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors mb-6 flex items-center justify-center cursor-pointer"
        >
          Entrar
        </button>
        <p className="text-[11px] text-[#9B9B9B] text-center">
          MetricLab Inteligência Operacional
        </p>
      </div>
    </main>
  );
}
