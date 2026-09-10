'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { supabase } from '@/lib/supabase';
import { RDOSession } from '@/types/rdo';
import { Camera, X, Loader2 } from 'lucide-react';

type TipoOcorrencia =
  | 'acidente'
  | 'quase_acidente'
  | 'ambiental'
  | 'patrimonial'
  | 'operacional'
  | 'outro';

type Gravidade = 'baixa' | 'media' | 'alta' | 'critica';

const TIPOS: { id: TipoOcorrencia; label: string }[] = [
  { id: 'acidente', label: 'Acidente' },
  { id: 'quase_acidente', label: 'Quase Acidente' },
  { id: 'ambiental', label: 'Ambiental' },
  { id: 'patrimonial', label: 'Patrimonial' },
  { id: 'operacional', label: 'Operacional' },
  { id: 'outro', label: 'Outro' },
];

const GRAVIDADES: { id: Gravidade; label: string }[] = [
  { id: 'baixa', label: 'Baixa' },
  { id: 'media', label: 'Média' },
  { id: 'alta', label: 'Alta' },
  { id: 'critica', label: 'Crítica' },
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

  const [geolat, setGeolat] = useState<number | null>(null);
  const [geolng, setGeolng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

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

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeolat(pos.coords.latitude);
          setGeolng(pos.coords.longitude);
          setGpsLoading(false);
        },
        () => {
          setGeolat(-23.55052);
          setGeolng(-46.633308);
          setGpsLoading(false);
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
        showToast('Erro ao carregar foto.', 'error');
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

      const webhookUrl =
        process.env.N8N_RDO_OCORRENCIA ||
        'https://n8n.metriclab.com.br/webhook/rdo-ocorrencia';

      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ocorrencia_id: ocorrenciaId,
            usuario_nome: session.nome,
            trecho_nome: session.trecho_nome,
            tipo,
            gravidade,
            descricao,
            fotos,
            geolat,
            geolng,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.warn('Webhook n8n falhou silenciosamente:', e);
      }

      showToast('Ocorrência registrada com sucesso!', 'success');
      router.push('/menu');
    } catch {
      showToast('Erro ao processar solicitação.', 'error');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between">
      {/* Header: "← Voltar" + "Nova Ocorrência" */}
      <HeaderMobile
        title="Nova Ocorrência"
        showBack={true}
        onBack={() => router.push('/menu')}
      />

      <div className="flex-1 max-w-md w-full mx-auto px-5 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TIPO — eyebrow + grid 2x3 sem emoji */}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              TIPO
            </span>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map((item) => {
                const isSelected = tipo === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTipo(item.id)}
                    className={`border rounded-[4px] px-4 py-3 text-[14px] text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#111111] bg-[#EFEFED] text-[#111111] font-medium'
                        : 'border-[#E5E5E3] bg-transparent text-[#111111] hover:bg-[#EFEFED]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GRAVIDADE — eyebrow + 4 botões em linha sem cores */}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              GRAVIDADE
            </span>
            <div className="grid grid-cols-4 gap-2">
              {GRAVIDADES.map((item) => {
                const isSelected = gravidade === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGravidade(item.id)}
                    className={`border rounded-[4px] py-2 text-[13px] font-medium text-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#111111] border-[#111111] text-white'
                        : 'bg-transparent border-[#E5E5E3] text-[#111111] hover:bg-[#EFEFED]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESCRIÇÃO — eyebrow + textarea underline 5 linhas */}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              DESCRIÇÃO
            </span>
            <textarea
              rows={5}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva detalhadamente o ocorrido..."
              className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b border-[#E5E5E3] rounded-none py-2 text-[15px] text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-b-[#111111] resize-none"
              required
            />
          </div>

          {/* FOTOS — eyebrow + área câmera dashed border */}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              FOTOS
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#E5E5E3] rounded-[8px] p-6 bg-[#F7F7F5] flex flex-col items-center justify-center cursor-pointer hover:bg-[#EFEFED] transition-colors"
            >
              {uploadingFoto ? (
                <Loader2 className="w-5 h-5 text-[#9B9B9B] animate-spin mb-2" />
              ) : (
                <Camera className="w-5 h-5 text-[#9B9B9B] mb-2" />
              )}
              <span className="text-[13px] text-[#9B9B9B]">
                {uploadingFoto ? 'Carregando foto...' : 'Adicionar foto de evidência'}
              </span>
            </div>

            {fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {fotos.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-[4px] overflow-hidden border border-[#E5E5E3] bg-[#EFEFED]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Evidência ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveFoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-[#9B9B9B] hover:text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LOCALIZAÇÃO — eyebrow + status em texto simples */}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              LOCALIZAÇÃO
            </span>
            <div className="flex items-center justify-between py-2 border-b border-[#E5E5E3]">
              <span className="text-[13px] text-[#6B6B6B]">
                {gpsLoading
                  ? 'Obtendo coordenadas...'
                  : geolat
                  ? `${geolat.toFixed(5)}, ${geolng?.toFixed(5)}`
                  : 'GPS pendente'}
              </span>
              <button
                type="button"
                onClick={capturarGPS}
                className="text-[13px] text-[#111111] underline cursor-pointer bg-transparent border-none p-0"
              >
                {geolat ? 'Atualizar' : 'Capturar'}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting}
              loading={submitting}
              className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
            >
              Registrar Ocorrência
            </Button>
          </div>
        </form>
      </div>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3] bg-[#F7F7F5] pb-safe">
        MetricLab · Consórcio Pacote 15 e 19
      </footer>
    </main>
  );
}
