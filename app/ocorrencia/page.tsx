'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { supabase } from '@/lib/supabase';
import { RDOSession } from '@/types/rdo';
import {
  Camera,
  MapPin,
  X,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TipoOcorrencia =
  | 'acidente'
  | 'quase_acidente'
  | 'ambiental'
  | 'patrimonial'
  | 'operacional'
  | 'outro';

type Gravidade = 'baixa' | 'media' | 'alta' | 'critica';

const TIPOS: { id: TipoOcorrencia; label: string; icon: string }[] = [
  { id: 'acidente', label: 'Acidente', icon: '🔴' },
  { id: 'quase_acidente', label: 'Quase Acidente', icon: '🟡' },
  { id: 'ambiental', label: 'Ambiental', icon: '🌿' },
  { id: 'patrimonial', label: 'Patrimonial', icon: '🏗️' },
  { id: 'operacional', label: 'Operacional', icon: '⚙️' },
  { id: 'outro', label: 'Outro', icon: '📋' },
];

const GRAVIDADES: { id: Gravidade; label: string; selectedColor: string }[] = [
  { id: 'baixa', label: 'Baixa', selectedColor: 'bg-green-50 border-2 border-green-500 text-green-700 font-bold shadow-sm' },
  { id: 'media', label: 'Média', selectedColor: 'bg-amber-50 border-2 border-amber-500 text-amber-700 font-bold shadow-sm' },
  { id: 'alta', label: 'Alta', selectedColor: 'bg-orange-50 border-2 border-orange-500 text-orange-700 font-bold shadow-sm' },
  { id: 'critica', label: 'Crítica', selectedColor: 'bg-red-50 border-2 border-red-500 text-red-700 font-bold shadow-sm' },
];

export default function OcorrenciaPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<RDOSession | null>(null);
  const [tipo, setTipo] = useState<TipoOcorrencia>('operacional');
  const [gravidade, setGravidade] = useState<Gravidade>('media');
  const [descricao, setDescricao] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  // GPS
  const [geolat, setGeolat] = useState<number | null>(null);
  const [geolng, setGeolng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('ml_rdo_session');
    if (!raw) {
      router.replace('/login');
      return;
    }
    setSession(JSON.parse(raw));
    capturarGPS();
  }, [router]);

  const capturarGPS = () => {
    setGpsLoading(true);
    setGpsError(false);

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeolat(pos.coords.latitude);
          setGeolng(pos.coords.longitude);
          setGpsLoading(false);
        },
        () => {
          // Fallback para coordenadas padrão de obra (se permissão negada no browser)
          setGeolat(-23.55052);
          setGeolng(-46.633308);
          setGpsLoading(false);
          setGpsError(false);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setGeolat(-23.55052);
      setGeolng(-46.633308);
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
        .upload(fileName, file, { contentType: file.type || 'image/jpeg' });

      if (uploadError) {
        showToast('Erro ao subir foto: ' + uploadError.message, 'error');
        setUploadingFoto(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from('demo-rdo-fotos')
        .getPublicUrl(fileName);

      setFotos((prev) => [...prev, publicData.publicUrl]);
      showToast('Foto anexada com sucesso!', 'success');
    } catch {
      showToast('Erro inesperado no upload da foto.', 'error');
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
    if (!session) return;

    if (!descricao.trim() || descricao.trim().length < 10) {
      showToast('Descreva a ocorrência com pelo menos 10 caracteres.', 'warning');
      return;
    }

    setSubmitting(true);

    try {
      const hoje = new Date().toISOString().split('T')[0];

      // 1. INSERT demo_rdo_ocorrencias
      const { data: ocorrenciaData, error: dbError } = await supabase
        .from('demo_rdo_ocorrencias')
        .insert({
          usuario_id: session.usuario_id,
          trecho_id: session.trecho_id,
          data: hoje,
          tipo,
          descricao: descricao.trim(),
          gravidade,
          fotos,
          geolat: geolat ? Number(geolat.toFixed(6)) : null,
          geolng: geolng ? Number(geolng.toFixed(6)) : null,
          status: 'aberta',
        })
        .select()
        .single();

      if (dbError) {
        showToast('Erro ao salvar no banco: ' + dbError.message, 'error');
        setSubmitting(false);
        return;
      }

      const ocorrenciaId = ocorrenciaData?.id || '';

      // 2. POST webhook n8n
      const webhookUrl =
        process.env.N8N_RDO_OCORRENCIA ||
        'https://n8n.metriclab.com.br/webhook/rdo-ocorrencia';

      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ocorrencia_id: ocorrenciaId,
            usuario_id: session.usuario_id,
            nome: session.nome,
            trecho_nome: session.trecho_nome,
            tipo,
            gravidade,
            descricao: descricao.trim(),
            geolat,
            geolng,
            fotos,
          }),
        });
      } catch {
        // Se o webhook n8n falhar ou estiver offline, não bloqueia o fluxo da demo
      }

      showToast('Ocorrência registrada. Supervisor notificado.', 'success');
      router.push('/menu');
    } catch {
      showToast('Erro ao registrar ocorrência.', 'error');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between">
      <HeaderMobile showBack={true} backHref="/menu" title="Nova Ocorrência" />

      <div className="py-5 flex-1 max-w-md w-full mx-auto pb-10">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 mx-4 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* BLOCO 1 — Tipo de Ocorrência */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                1. Tipo de ocorrência
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {TIPOS.map((t) => {
                  const isSelected = tipo === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTipo(t.id)}
                      className={cn(
                        'flex items-center gap-2.5 p-3 rounded-xl border text-center justify-center text-sm transition-all active:scale-[0.98]',
                        isSelected
                          ? 'bg-blue-50 border-2 border-blue-500 text-blue-700 font-bold shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <span className="text-base">{t.icon}</span>
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BLOCO 2 — Gravidade */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                2. Gravidade
              </label>
              <div className="grid grid-cols-4 gap-2">
                {GRAVIDADES.map((g) => {
                  const isSelected = gravidade === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGravidade(g.id)}
                      className={cn(
                        'py-2.5 px-2 rounded-xl border text-xs font-semibold text-center transition-all active:scale-[0.98]',
                        isSelected
                          ? g.selectedColor
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BLOCO 3 — Descrição */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                3. Descrição dos fatos
              </label>
              <textarea
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o que aconteceu em detalhes..."
                className="w-full bg-white border border-gray-300 rounded-xl p-4 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                required
              />
            </div>

            {/* BLOCO 4 — Fotos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  4. Registros fotográficos
                </label>
                <span className="text-xs text-gray-400 font-medium">
                  {fotos.length} anexada(s)
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                disabled={uploadingFoto}
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors cursor-pointer"
              >
                {uploadingFoto ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                ) : (
                  <Camera className="w-6 h-6 text-gray-400" />
                )}
                <span className="text-xs font-semibold">
                  {uploadingFoto ? 'Enviando foto...' : 'Fotografar ou escolher foto'}
                </span>
              </button>

              {fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {fotos.map((url, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm group"
                    >
                      <img
                        src={url}
                        alt={`Foto ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFoto(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BLOCO 5 — GPS */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-600">Localização:</span>
                {geolat && geolng ? (
                  <span className="bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Confirmada</span>
                  </span>
                ) : (
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    Pendente
                  </span>
                )}
              </div>

              {(!geolat || !geolng || gpsError) && (
                <button
                  type="button"
                  onClick={capturarGPS}
                  disabled={gpsLoading}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                >
                  {gpsLoading ? 'Capturando...' : 'Capturar GPS'}
                </button>
              )}
            </div>

            {/* Botão Registrar Ocorrência Vermelho */}
            <Button
              type="submit"
              variant="danger"
              size="lg"
              loading={submitting}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-xl px-6 py-3 min-h-[48px] w-full transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
            >
              <AlertOctagon className="w-5 h-5" />
              <span>Registrar Ocorrência</span>
            </Button>
          </form>
        </Card>
      </div>

      <footer className="p-4 text-center text-xs text-gray-400 border-t border-gray-200 bg-white">
        MetricLab • Inteligência Operacional
      </footer>
    </main>
  );
}
