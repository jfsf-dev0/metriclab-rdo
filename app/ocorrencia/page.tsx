'use strict';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RDOSession } from '@/types/rdo';
import { getSession } from '@/lib/auth';
import { Camera, Loader2 } from 'lucide-react';

type TipoOcorrencia =
  | 'Acidente'
  | 'Quase Acidente'
  | 'Ambiental'
  | 'Patrimonial'
  | 'Operacional'
  | 'Outro';

type Gravidade = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

const TIPOS: TipoOcorrencia[] = [
  'Acidente',
  'Quase Acidente',
  'Ambiental',
  'Patrimonial',
  'Operacional',
  'Outro',
];

const GRAVIDADES: Gravidade[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

import { useDesktopBlock } from '@/hooks/useDesktopBlock';
import { useGeolocation } from '@/hooks/useGeolocation';

export default function OcorrenciaPage() {
  useDesktopBlock();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<RDOSession | null>(null);
  const [tipo, setTipo] = useState<TipoOcorrencia>('Operacional');
  const [gravidade, setGravidade] = useState<Gravidade>('Média');
  const [descricao, setDescricao] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const { latitude, longitude, accuracy, error: geoError, loading: geoLoading } = useGeolocation();

  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    const currentSession: RDOSession = {
      usuario_id: s.usuario_id,
      nome: s.nome,
      trecho_id: s.trecho_id || null,
      trecho_nome: s.trecho_nome || 'Pacote 15 e 19',
      pacote: (s.pacote as any) || 'lote15',
      cargo: s.cargo || 'Encarregado',
    };
    setSession(currentSession);
  }, [router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFoto(true);

    try {
      const file = files[0];
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `ocorrencias/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('demo-rdo-fotos')
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) {
        const reader = new FileReader();
        reader.onload = (re) => {
          if (re.target?.result) {
            setFotos((prev) => [...prev, re.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const { data } = supabase.storage
          .from('demo-rdo-fotos')
          .getPublicUrl(fileName);
        setFotos((prev) => [...prev, data.publicUrl]);
      }
    } catch {
      // ignore
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFoto = (idx: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      setErro('Informe a descrição da ocorrência.');
      return;
    }

    setSubmitting(true);
    setErro(null);

    try {
      const { data: newOc, error: ocError } = await supabase
        .from('demo_rdo_ocorrencias')
        .insert({
          usuario_id: session?.usuario_id,
          trecho_id: session?.trecho_id || 'd301f2ac-0a56-43f1-8f24-5d5d67683935',
          data: new Date().toISOString().split('T')[0],
          tipo,
          gravidade,
          descricao: descricao.trim(),
          fotos,
          geolat: latitude,
          geolng: longitude,
          latitude,
          longitude,
          accuracy,
          geolocated_at: new Date().toISOString(),
          resolvido: false,
        })
        .select()
        .single();

      if (ocError) throw ocError;

      // Webhook notification
      try {
        fetch('https://n8n.metriclab.com.br/webhook/ocorrencia-registrada', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ocorrencia_id: newOc?.id,
            usuario_nome: session?.nome,
            trecho_nome: session?.trecho_nome,
            tipo,
            gravidade,
            descricao,
            fotos_qtd: fotos.length,
          }),
        });
      } catch (_) {}

      router.push('/menu');
    } catch (err: any) {
      setErro(err.message || 'Erro ao registrar ocorrência.');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between font-sans">
      {/* Header Mobile: 56px, bg white, border #E2E2DC */}
      <header className="h-[56px] bg-white border-b border-[#E2E2DC] px-4 flex items-center justify-between sticky top-0 z-20 select-none">
        <button
          type="button"
          onClick={() => router.push('/menu')}
          className="min-w-[44px] min-h-[44px] flex items-center text-[14px] font-medium text-[#111111] hover:opacity-80 transition-opacity"
        >
          ← Voltar
        </button>
        <h1 className="text-[18px] font-semibold text-[#111111] tracking-[-0.3px] truncate px-2">
          Nova Ocorrência
        </h1>
        <div className="min-w-[44px] min-h-[44px]" />
      </header>

      {/* Conteúdo do Formulário */}
      <div className="flex-1 max-w-md w-full mx-auto px-4 py-6 pb-32 space-y-6">
        {erro && (
          <div className="p-4 bg-white border border-[#DC2626] text-[13px] text-[#DC2626]">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Ocorrência */}
          <div>
            <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
              TIPO DE OCORRÊNCIA
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map((t) => {
                const active = tipo === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`h-[44px] px-3 text-[14px] font-medium rounded-[8px] border transition-colors cursor-pointer text-left flex items-center justify-between ${
                      active
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-white text-[#111111] border-[#E2E2DC]'
                    }`}
                  >
                    <span>{t}</span>
                    {active && <span className="text-[12px]">●</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gravidade */}
          <div>
            <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
              GRAVIDADE
            </label>
            <div className="grid grid-cols-4 gap-2">
              {GRAVIDADES.map((g) => {
                const active = gravidade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGravidade(g)}
                    className={`h-[44px] text-[13px] font-medium rounded-[8px] border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-white text-[#111111] border-[#E2E2DC]'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
              DESCRIÇÃO DOS FATOS *
            </label>
            <textarea
              rows={5}
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Relate detalhadamente o ocorrido, pessoas envolvidas e ações preliminares tomadas..."
              className="w-full p-4 bg-white border border-[#E2E2DC] rounded-[8px] text-[15px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none transition-all"
            />
          </div>

          {/* Fotos */}
          <div>
            <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
              REGISTROS FOTOGRÁFICOS
            </label>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#E2E2DC] rounded-[12px] p-6 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-[#111111] transition-colors mb-3"
            >
              {uploadingFoto ? (
                <Loader2 className="w-5 h-5 text-[#6B7280] animate-spin mb-2" />
              ) : (
                <Camera className="w-5 h-5 text-[#6B7280] mb-2 stroke-[1.5]" />
              )}
              <span className="text-[13px] font-medium text-[#6B7280]">
                {uploadingFoto ? 'Enviando...' : 'Fotografar ou anexar evidências'}
              </span>
            </div>

            {fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((f, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square bg-[#F7F7F5] border border-[#E2E2DC] rounded-[8px] overflow-hidden"
                  >
                    <img
                      src={f}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFoto(idx)}
                      className="absolute top-1 right-1 bg-black/70 text-white text-[12px] w-5 h-5 rounded-full flex items-center justify-center cursor-pointer hover:bg-black"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Localização */}
          <div className="bg-white border border-[#E2E2DC] p-4 rounded-[12px]">
            <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-1">
              LOCALIZAÇÃO DA OCORRÊNCIA
            </span>
            {geoLoading ? (
              <p className="text-[12px] font-normal text-[#9CA3AF]">
                Obtendo localização...
              </p>
            ) : geoError !== null ? (
              <p className="text-[12px] font-normal text-[#DC2626]">
                Localização indisponível — verifique as permissões do celular
              </p>
            ) : (
              <p className="text-[12px] font-normal text-[#6B7280]">
                Localização capturada
              </p>
            )}
          </div>

          {/* Botão Fixo no Rodapé */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#F7F7F5] border-t border-[#E2E2DC] z-30">
            <div className="max-w-md mx-auto">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-[52px] bg-[#111111] hover:bg-black active:opacity-85 text-white text-[15px] font-semibold rounded-[8px] transition-opacity flex items-center justify-center cursor-pointer disabled:opacity-40"
              >
                {submitting ? 'Registrando ocorrência...' : 'Registrar Ocorrência'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
