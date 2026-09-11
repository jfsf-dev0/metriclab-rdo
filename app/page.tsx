'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Auto transition to /login after 2.8s if not tapped
    const timer = setTimeout(() => {
      router.push('/login');
    }, 2800);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main
      onClick={() => router.push('/login')}
      className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 select-none cursor-pointer transition-opacity duration-300 animate-in fade-in-0"
    >
      <div className="flex flex-col items-center text-center">
        {/* Logo central "m." Inter 700, 48px, #111111, ponto em #F5A623 */}
        <div className="leading-none tracking-tight">
          <span className="text-[48px] font-bold text-[#111111]">
            m<span className="text-[#F5A623]">.</span>
          </span>
        </div>

        {/* Subtítulo: Inter 400, 14px, cor #9CA3AF */}
        <p className="text-[14px] font-normal text-[#9CA3AF] mt-3 tracking-[-0.2px]">
          Relatório Diário de Obra · Pacote 15 e 19
        </p>
      </div>
    </main>
  );
}
