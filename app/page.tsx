'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
      // Ignora erro de parsing
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between items-center px-6 py-10 select-none pb-safe">
      {/* [topo] Logo "m." centralizado */}
      <div className="w-full flex justify-center pt-4">
        <span
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#111111',
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}
        >
          m<span style={{ color: '#F5A623' }}>.</span>
        </span>
      </div>

      {/* [centro] */}
      <div className="flex flex-col items-center justify-center text-center my-auto px-4 w-full max-w-sm">
        <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
          Proposta
        </span>
        <div className="h-2" />
        <h1
          className="text-[72px] font-medium text-[#111111] tracking-[-1.2px] leading-none"
          style={{ fontFamily: 'var(--font-inter), sans-serif' }}
        >
          Pacote 15 e 19
        </h1>
        <div className="h-3" />
        <p className="text-[15px] font-normal text-[#6B6B6B] leading-[1.5]">
          Relatório Diário de Obra
        </p>
      </div>

      {/* [base] + [rodapé] */}
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="w-full border-b border-[#E5E5E3] mb-6" />
        <div className="w-full mb-6">
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
          >
            Entrar
          </Button>
        </div>
        <footer className="text-[11px] text-[#9B9B9B] text-center">
          MetricLab Inteligência Operacional
        </footer>
      </div>
    </main>
  );
}
