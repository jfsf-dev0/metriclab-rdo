'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [nome, setNome] = useState('');
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !chaveAcesso.trim()) {
      showToast('Preencha seu nome e chave de acesso.', 'warning');
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
        showToast('Nome ou chave inválidos', 'error');
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

      showToast(`Bem-vindo, ${user.nome}!`, 'success');
      router.push('/menu');
    } catch {
      showToast('Erro ao validar acesso. Tente novamente.', 'error');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between p-6 select-none relative pb-safe">
      <div className="w-full max-w-sm mx-auto my-auto py-6">
        {/* Logo "m." topo centralizado */}
        <div className="flex justify-center">
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

        <div className="h-12" />

        {/* Heading + Subtitle */}
        <div className="text-left">
          <h1 className="text-[28px] font-medium text-[#111111] tracking-[-0.5px] leading-[1.1]">
            Acesso ao RDO
          </h1>
          <p className="text-[15px] font-normal text-[#6B6B6B] mt-1.5 leading-[1.5]">
            Use as credenciais enviadas pelo supervisor
          </p>
        </div>

        <div className="h-10" />

        <form onSubmit={handleLogin}>
          <Input
            id="nome"
            label="SEU NOME"
            type="text"
            placeholder="Ex: Carlos Encarregado"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
            required
          />

          <div className="h-8" />

          <Input
            id="chave"
            label="CHAVE DE ACESSO"
            type="password"
            placeholder="••••••"
            value={chaveAcesso}
            onChange={(e) => setChaveAcesso(e.target.value)}
            autoComplete="current-password"
            required
          />

          <div className="h-10" />

          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
          >
            Entrar
          </Button>
        </form>

        <div className="h-4" />

        <p className="text-[11px] font-normal text-[#9B9B9B] text-center">
          MetricLab · Consórcio Pacote 15 e 19
        </p>
      </div>

      <footer className="w-full text-center py-2 text-[11px] text-[#9B9B9B]">
        MetricLab Inteligência Operacional
      </footer>
    </main>
  );
}
