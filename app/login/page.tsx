'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MetricLabLogo } from '@/components/brand/MetricLabLogo';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { supabase } from '@/lib/supabase';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

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

      // Salva no localStorage e no Cookie para o middleware
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

  const setDemoUser = (nomeDemo: string, chaveDemo: string) => {
    setNome(nomeDemo);
    setChaveAcesso(chaveDemo);
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between p-4 sm:p-6 select-none relative pb-safe">
      <div className="w-full max-w-sm mx-auto my-auto py-6">
        {/* Logo MetricLab pequeno acima do card */}
        <div className="flex justify-center mb-6">
          <MetricLabLogo size="md" showText={true} />
        </div>

        {/* Card central */}
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mx-4 space-y-6">
          <div className="text-center mb-6 space-y-1">
            <h1 className="text-xl font-bold text-gray-900">Acesso ao RDO</h1>
            <p className="text-gray-500 text-sm">
              Use as credenciais enviadas pelo supervisor
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              id="nome"
              label="Seu nome"
              type="text"
              placeholder="Ex: Carlos Encarregado"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              autoComplete="name"
              required
            />

            <Input
              id="chave"
              label="Chave de acesso"
              type="password"
              placeholder="••••••"
              value={chaveAcesso}
              onChange={(e) => setChaveAcesso(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl px-6 py-3 min-h-[48px] w-full transition-all duration-200 shadow-sm mt-2 flex items-center justify-center gap-2"
            >
              <span>Entrar</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Texto auxiliar: text-gray-400 text-xs */}
          <p className="text-gray-400 text-xs text-center pt-2">
            Credenciais enviadas via WhatsApp
          </p>

          {/* Quick Demo Access Pills */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Acesso Rápido Demo:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoUser('Carlos Encarregado', 'RDO001')}
                className="text-left text-xs p-2 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors border border-gray-200"
              >
                <div className="font-bold truncate text-gray-900">Carlos (Lote 15)</div>
                <div className="text-[11px] text-gray-500">Chave: RDO001</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('Paulo Supervisor', 'RDO002')}
                className="text-left text-xs p-2 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors border border-gray-200"
              >
                <div className="font-bold truncate text-gray-900">Paulo (Lote 15)</div>
                <div className="text-[11px] text-gray-500">Chave: RDO002</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('Marcos Silva', 'RDO003')}
                className="text-left text-xs p-2 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors border border-gray-200"
              >
                <div className="font-bold truncate text-gray-900">Marcos (Lote 19)</div>
                <div className="text-[11px] text-gray-500">Chave: RDO003</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('João Ferreira', 'RDO004')}
                className="text-left text-xs p-2 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors border border-gray-200"
              >
                <div className="font-bold truncate text-gray-900">João (Lote 19)</div>
                <div className="text-[11px] text-gray-500">Chave: RDO004</div>
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-2 text-xs text-gray-400">
        MetricLab • Inteligência Operacional
      </footer>
    </main>
  );
}
