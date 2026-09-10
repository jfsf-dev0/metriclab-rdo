'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nome.trim() || !chaveAcesso.trim()) {
      setErro('Preencha seu nome e chave de acesso.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('demo_rdo_usuarios')
        .select('*')
        .ilike('nome', `%${nome.trim()}%`)
        .eq('chave_acesso', chaveAcesso.trim())
        .eq('ativo', true)
        .limit(1);

      if (error || !data || data.length === 0) {
        setErro('Nome ou chave de acesso inválidos.');
        setLoading(false);
        return;
      }

      const user = data[0];
      const sessionData = {
        usuario_id: user.id,
        nome: user.nome,
        trecho_id: user.trecho_id,
        trecho_nome: user.trecho_nome || 'Trecho Geral',
        pacote: user.pacote,
        cargo: user.cargo || 'Encarregado',
      };

      localStorage.setItem('ml_rdo_session', JSON.stringify(sessionData));
      document.cookie = `ml_rdo_session=${encodeURIComponent(
        JSON.stringify(sessionData)
      )}; path=/; max-age=604800; SameSite=Lax`;

      router.push('/menu');
    } catch {
      setErro('Erro ao validar acesso. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] p-6 flex flex-col justify-center max-w-md mx-auto select-none">
      {/* "m." centralizado 28px */}
      <div className="flex justify-center mb-12">
        <span className="text-[28px] font-bold text-[#111111] leading-none tracking-tight">
          m<span className="text-[#F5A623]">.</span>
        </span>
      </div>

      {/* Título & Subtítulo */}
      <div className="mb-10">
        <h1 className="text-[20px] font-normal leading-none text-[#111111] mb-1">
          Acesso ao RDO
        </h1>
        <p className="text-[16px] font-normal leading-[1.5] text-[#6B6B6B]">
          Credenciais enviadas pelo supervisor.
        </p>
      </div>

      {erro && (
        <div className="mb-6 text-[13px] text-[#111111] border-b border-[#111111] pb-2 font-normal">
          {erro}
        </div>
      )}

      <form onSubmit={handleLogin}>
        {/* Label NOME + Input underline */}
        <div className="mb-8 flex flex-col">
          <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] mb-[6px]">
            NOME COMPLETO
          </label>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Carlos Eduardo"
            className="w-full bg-transparent border-0 border-b border-[#E5E5E3] focus:border-[#111111] py-3 text-[16px] text-[#111111] placeholder:text-[#9B9B9B] outline-none rounded-none transition-colors"
          />
        </div>

        {/* Label CHAVE DE ACESSO + Input underline */}
        <div className="mb-10 flex flex-col">
          <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] mb-[6px]">
            CHAVE DE ACESSO
          </label>
          <input
            type="password"
            required
            value={chaveAcesso}
            onChange={(e) => setChaveAcesso(e.target.value)}
            placeholder="••••••"
            className="w-full bg-transparent border-0 border-b border-[#E5E5E3] focus:border-[#111111] py-3 text-[16px] text-[#111111] placeholder:text-[#9B9B9B] outline-none rounded-none transition-colors"
          />
        </div>

        {/* Botão Entrar preto */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center disabled:opacity-50 cursor-pointer mb-4"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-[11px] text-[#9B9B9B] text-center">
        MetricLab · Pacote 15 e 19
      </p>
    </main>
  );
}
