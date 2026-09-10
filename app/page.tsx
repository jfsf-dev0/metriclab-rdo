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
    <main
      className="min-h-screen bg-[#F0F0F0] text-[#111111] flex flex-col justify-between items-center select-none"
      style={{ padding: '80px 32px 48px' }}
    >
      {/* TOPO */}
      <div className="w-full flex justify-center items-center">
        <span className="text-[36px] font-bold text-[#111111] leading-none tracking-tight">
          m<span className="text-[#F5A623]">.</span>
        </span>
      </div>

      {/* CENTRO */}
      <div className="w-full max-w-[380px] flex flex-col items-center justify-center text-center my-auto">
        <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
          PROPOSTA
        </span>
        <h1 className="text-[72px] font-medium text-[#111111] tracking-[-1.5px] leading-none mt-2">
          Pacote 15 e 19
        </h1>
        <p className="text-[16px] font-normal text-[#6B6B6B] mt-2">
          Relatório Diário de Obra
        </p>
      </div>

      {/* BASE */}
      <div className="w-full max-w-[380px] flex flex-col items-center">
        <div className="w-full h-px bg-[#E5E5E3] mb-6" />
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-lg transition-colors flex items-center justify-center cursor-pointer"
        >
          Entrar
        </button>
        <p className="text-[11px] text-[#C4C4C2] text-center mt-4">
          MetricLab Inteligência Operacional
        </p>
      </div>
    </main>
  );
}
