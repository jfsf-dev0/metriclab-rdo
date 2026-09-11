'use strict';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RDOSession } from '@/types/rdo';
import { getSession } from '@/lib/auth';
import { Camera, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';

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

export default function OcorrenciaPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<RDOSession | null>(null);
  const [tipo, setTipo] = useState<TipoOcorrencia>('Operacional');
  const [gravidade, setGravidade] = useState<Gravidade>('Média');
  const [descricao, setDescricao] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const [geolat, setGeolat] = useState<number | null>(null);
  const [geolng, setGeolng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

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
    capturarGPS();
  }, [router]);

  const capturarGPS = () => {
    setGpsLoading(true);

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeolat(Number(pos.coords.latitude.toFixed(4)));
          setGeolng(Number(pos.coords.longitude.toFixed(4)));
          setGpsLoading(false);
        },
        () => {
          setGeolat(-23.5505);
          setGeolng(-46.6333);
          setGpsLoading(false);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setGeolat(-23.5505);
      setGeolng(-46.6333);
      setGpsLoading(false);
    }
  };

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
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      setErro('Descreva o que aconteceu na ocorrência.');
      return;
    }

    if (!session) return;
    setSubmitting(true);
    setErro(null);

    const gravidadeApi =
      gravidade === 'Crítica'
        ? 'critica'
        : gravidade === 'Média'
        ? 'media'
        : (gravidade.toLowerCase() as any);

    const tipoApi = tipo.toLowerCase().replace(/ /g, '_');

    try {
      const { error: insertError } = await supabase
        .from('demo_rdo_ocorrencias')
        .insert({
          usuario_id: session.usuario_id,
          trecho_id: session.trecho_id || 'd301f2ac-0a56-43f1-8f24-5d5d67683935',
          data: new Date().toISOString().split('T')[0],
          tipo: tipoApi,
          descricao: descricao.trim(),
          gravidade: gravidadeApi,
          fotos,
          geolat,
          geolng,
          status: 'aberta',
        });

      if (insertError) throw insertError;

      // Webhook
      try {
        fetch('https://n8n.metriclab.com.br/webhook/rdo-ocorrencia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario_nome: session.nome,
            trecho_nome: session.trecho_nome,
            tipo,
            gravidade,
            descricao,
            fotos,
            geolat,
            geolng,
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
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between">
      {/* Header: "← Voltar" | "Nova Ocorrência" */}
      <header className="h-[52px] bg-[#F7F7F5] border-b border-[#E5E5E3] px-6 flex items-center justify-between">
        <button
          onClick={() => router.push('/menu')}
          className="text-[14px] text-[#111111] hover:underline"
        >
          ← Voltar
        </button>
        <span className="text-[16px] font-normal text-[#111111]">
          Nova Ocorrência
        </span>
        <div className="w-12" />
      </header>

      {/* Padding 24px */}
      <div className="flex-1 max-w-md w-full mx-auto p-6">
        {erro && (
          <div className="mb-6 text-[13px] text-[#111111] border-b border-[#111111] pb-2">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* TIPO DE OCORRÊNCIA — eyebrow */}
          <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
            TIPO DE OCORRÊNCIA
          </span>

          <div className="divide-y divide-[#E5E5E3] border-t border-[#E5E5E3]">
            {TIPOS.map((t) => {
              const isSelected = tipo === t;
              return (
                <div
                  key={t}
                  onClick={() => setTipo(t)}
                  className="py-3.5 flex items-center justify-between cursor-pointer select-none"
                >
                  <span
                    className={`text-[20px] ${
                      isSelected ? 'font-medium text-[#111111]' : 'font-normal text-[#111111]'
                    }`}
                  >
                    {t}
                  </span>
                  {isSelected ? (
                    <ChevronDown className="w-5 h-5 text-[#111111]" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[#C4C4C2]" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-full border-b border-[#E5E5E3] my-8" />

          {/* GRAVIDADE — eyebrow */}
          <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-3">
            GRAVIDADE
          </span>

          <div className="grid grid-cols-4 gap-2">
            {GRAVIDADES.map((g) => {
              const active = gravidade === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGravidade(g)}
                  className={`py-2 text-[14px] font-normal rounded-[4px] border transition-colors ${
                    active
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'border-[#E5E5E3] text-[#111111]'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>

          <div className="w-full border-b border-[#E5E5E3] my-8" />

          {/* DESCRIÇÃO — eyebrow */}
          <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
            DESCRIÇÃO
          </span>
          <textarea
            rows={5}
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o que aconteceu..."
            className="w-full bg-transparent border-0 border-b border-[#E5E5E3] focus:border-[#111111] py-3 text-[16px] text-[#111111] placeholder:text-[#9B9B9B] outline-none rounded-none resize-none transition-colors"
          />

          <div className="w-full border-b border-[#E5E5E3] my-8" />

          {/* FOTOS — eyebrow */}
          <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-3">
            FOTOS
          </span>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-[#E5E5E3] rounded-none py-10 px-6 bg-[#F7F7F5] flex flex-col items-center justify-center cursor-pointer hover:border-[#111111] transition-colors mb-3"
          >
            {uploadingFoto ? (
              <Loader2 className="w-5 h-5 text-[#9B9B9B] animate-spin mb-2" />
            ) : (
              <Camera className="w-5 h-5 text-[#9B9B9B] mb-2" />
            )}
            <span className="text-[14px] font-normal text-[#6B6B6B]">
              {uploadingFoto ? 'Enviando...' : 'Adicionar foto'}
            </span>
          </div>

          {fotos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {fotos.map((f, idx) => (
                <div
                  key={idx}
                  className="relative aspect-video bg-[#EFEFED] rounded-[4px] overflow-hidden border border-[#E5E5E3]"
                >
                  <img
                    src={f}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFoto(idx)}
                    className="absolute top-1 right-1 bg-black/60 text-[#9B9B9B] hover:text-white text-[12px] w-6 h-6 rounded-full flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="w-full border-b border-[#E5E5E3] my-8" />

          {/* LOCALIZAÇÃO — eyebrow */}
          <div className="mb-10">
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              LOCALIZAÇÃO
            </span>
            {gpsLoading ? (
              <p className="text-[13px] font-normal text-[#9B9B9B]">
                Capturando GPS...
              </p>
            ) : geolat && geolng ? (
              <p className="text-[13px] font-normal text-[#9B9B9B]">
                Lat: {geolat} · Lng: {geolng}
              </p>
            ) : (
              <button
                type="button"
                onClick={capturarGPS}
                className="text-[14px] text-[#111111] hover:underline"
              >
                Capturar localização
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-[#111111] hover:bg-black disabled:opacity-40 text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
          >
            {submitting ? 'Registrando...' : 'Registrar Ocorrência'}
          </button>
        </form>
      </div>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3]">
        MetricLab · Pacote 15 e 19
      </footer>
    </main>
  );
}
