'use strict';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import { supabase } from '@/lib/supabase';
import {
  RDOSession,
  EquipeMembro,
  MaquinaCatalogo,
  MaquinaCheck,
} from '@/types/rdo';
import { getSession } from '@/lib/auth';
import { Camera, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { useDesktopBlock } from '@/hooks/useDesktopBlock';
import { useGeolocation } from '@/hooks/useGeolocation';

export default function NovoRDOPage() {
  useDesktopBlock();
  const router = useRouter();

  const [session, setSession] = useState<RDOSession | null>(null);
  const [passo, setPasso] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // PASSO 1: Identificação & Clima
  const [turno, setTurno] = useState<'manha' | 'tarde' | 'noite'>('manha');
  const [climaManha, setClimaManha] = useState<'bom' | 'nublado' | 'chuva'>('bom');
  const [climaTarde, setClimaTarde] = useState<'bom' | 'nublado' | 'chuva'>('nublado');
  const { latitude, longitude, accuracy, error: geoError, loading: geoLoading } = useGeolocation();

  // PASSO 2: Efetivo (Categorias com inputs de quantidade + membros)
  const [efetivoCategorias, setEfetivoCategorias] = useState<Record<string, number>>({
    'Encarregados': 1,
    'Operadores de Máquinas': 2,
    'Motoristas': 2,
    'Ajudantes / Serventes': 4,
    'Técnicos de Segurança': 1,
  });
  const [equipe, setEquipe] = useState<EquipeMembro[]>([
    { nome: 'Carlos Eduardo', funcao: 'Operador de Escavadeira', presente: true },
    { nome: 'Roberto Alves', funcao: 'Motorista Basculante', presente: true },
    { nome: 'Marcos Vinicius', funcao: 'Ajudante Especializado', presente: true },
  ]);
  const [uploadingCracha, setUploadingCracha] = useState(false);
  const crachaInputRef = useRef<HTMLInputElement>(null);

  // PASSO 3: Equipamentos
  const [catalogoMaquinas, setCatalogoMaquinas] = useState<MaquinaCatalogo[]>([]);
  const [maquinasCheck, setMaquinasCheck] = useState<
    Record<string, { status: MaquinaCheck['status']; observacao: string }>
  >({});

  // PASSO 4: Atividades & Fotos
  const [atividades, setAtividades] = useState('');
  const [fotosDia, setFotosDia] = useState<string[]>([]);
  const [uploadingFotoDia, setUploadingFotoDia] = useState(false);
  const fotosInputRef = useRef<HTMLInputElement>(null);

  // PASSO 5: Assinatura
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasAssinatura, setHasAssinatura] = useState(false);
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

    supabase
      .from('demo_rdo_maquinas_catalogo')
      .select('*')
      .eq('ativo', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCatalogoMaquinas(data as MaquinaCatalogo[]);
          const inicial: Record<string, { status: MaquinaCheck['status']; observacao: string }> = {};
          data.forEach((m) => {
            inicial[m.id] = { status: 'operando', observacao: '' };
          });
          setMaquinasCheck(inicial);
        } else {
          const mock: MaquinaCatalogo[] = [
            { id: '1', codigo: 'ESC-01', nome: 'Escavadeira Hidráulica CAT 320', tipo: 'Escavadeira', ativo: true },
            { id: '2', codigo: 'RET-01', nome: 'Retroescavadeira JCB 3CX', tipo: 'Retroescavadeira', ativo: true },
            { id: '3', codigo: 'CAM-01', nome: 'Caminhão Basculante MB 2729', tipo: 'Caminhão', ativo: true },
            { id: '4', codigo: 'ROL-01', nome: 'Rolo Compactador Dynapac CA250', tipo: 'Compactador', ativo: true },
          ];
          setCatalogoMaquinas(mock);
          const inicial: Record<string, { status: MaquinaCheck['status']; observacao: string }> = {};
          mock.forEach((m) => {
            inicial[m.id] = { status: 'operando', observacao: '' };
          });
          setMaquinasCheck(inicial);
        }
        setLoadingInitial(false);
      });
  }, [router]);

  // Setup canvas
  useEffect(() => {
    if (passo === 5 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [passo]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasAssinatura(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasAssinatura(false);
  };

  const handleCrachaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingCracha(true);
    const file = files[0];

    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, img.width, img.height);
            const imgData = ctx.getImageData(0, 0, img.width, img.height);
            const qr = jsQR(imgData.data, imgData.width, imgData.height);

            if (qr && qr.data) {
              try {
                const parsed = JSON.parse(qr.data);
                setEquipe((prev) => [
                  ...prev,
                  {
                    nome: parsed.nome || 'Colaborador QR',
                    funcao: parsed.funcao || 'Operacional',
                    matricula: parsed.matricula || 'MAT-QR',
                    presente: true,
                  },
                ]);
              } catch {
                setEquipe((prev) => [
                  ...prev,
                  { nome: qr.data, funcao: 'Operacional', presente: true },
                ]);
              }
            } else {
              setEquipe((prev) => [
                ...prev,
                {
                  nome: `Colaborador ${prev.length + 1}`,
                  funcao: 'Operacional',
                  presente: true,
                },
              ]);
            }
          }
          setUploadingCracha(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingCracha(false);
    }
  };

  const handleFotosDiaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFotoDia(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `rdo_fotos/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('demo-rdo-fotos')
          .upload(fileName, file, { contentType: file.type });

        if (upErr) {
          const reader = new FileReader();
          reader.onload = (re) => {
            if (re.target?.result) {
              setFotosDia((prev) => [...prev, re.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        } else {
          const { data } = supabase.storage
            .from('demo-rdo-fotos')
            .getPublicUrl(fileName);
          setFotosDia((prev) => [...prev, data.publicUrl]);
        }
      }
    } finally {
      setUploadingFotoDia(false);
      if (fotosInputRef.current) fotosInputRef.current.value = '';
    }
  };

  const handleSubmitRDO = async () => {
    if (!hasAssinatura) {
      setErro('Assinatura digital é obrigatória.');
      return;
    }

    setSubmitting(true);
    setErro(null);

    try {
      let assinaturaUrl = '';
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const path = `assinaturas/rdo_${Date.now()}.png`;

        const { error: upErr } = await supabase.storage
          .from('demo-rdo-fotos')
          .upload(path, blob, { contentType: 'image/png' });

        if (!upErr) {
          const { data: assData } = supabase.storage
            .from('demo-rdo-fotos')
            .getPublicUrl(path);
          assinaturaUrl = assData?.publicUrl || '';
        } else {
          assinaturaUrl = dataUrl;
        }
      }

      const maquinasPayload = Object.entries(maquinasCheck).map(([mId, check]) => ({
        maquina_id: mId,
        status: check.status,
        observacao: check.observacao || null,
      }));

      const totalEfetivo = Object.values(efetivoCategorias).reduce((a, b) => a + b, 0);
      const climaDescricao = `Manhã: ${climaManha} · Tarde: ${climaTarde}`;

      const { data: newRdo, error: insertError } = await supabase
        .from('demo_rdo_registros')
        .insert({
          usuario_id: session!.usuario_id,
          trecho_id: session!.trecho_id || 'd301f2ac-0a56-43f1-8f24-5d5d67683935',
          data: new Date().toISOString().split('T')[0],
          turno,
          clima_condicao: climaDescricao,
          clima_temperatura: 26,
          clima_umidade: 65,
          clima_vento: 10,
          geolat: latitude,
          geolng: longitude,
          latitude,
          longitude,
          accuracy,
          geolocated_at: new Date().toISOString(),
          atividades: atividades.trim() || 'Atividades regulares de terraplenagem e drenagem.',
          equipe,
          maquinas: maquinasPayload,
          fotos: fotosDia,
          assinatura_url: assinaturaUrl || null,
          status: 'enviado',
        })
        .select()
        .single();

      if (insertError || !newRdo) throw insertError || new Error('Falha ao gravar RDO');

      // Webhook
      try {
        fetch('https://n8n.metriclab.com.br/webhook/rdo-enviado', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rdo_id: newRdo.id,
            usuario_nome: session?.nome,
            trecho_nome: session?.trecho_nome,
            turno,
            equipe_qtd: totalEfetivo,
            maquinas_qtd: maquinasPayload.length,
            fotos_qtd: fotosDia.length,
          }),
        });
      } catch (_) {}

      router.push(`/rdo/${newRdo.id}/confirmacao`);
    } catch (err: any) {
      console.error(err);
      setErro(err.message || 'Erro ao enviar RDO.');
      setSubmitting(false);
    }
  };

  if (loadingInitial || !session) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#9B9B9B]" />
      </div>
    );
  }

  const stepTitles: Record<number, string> = {
    1: 'Identificação & Clima',
    2: 'Efetivo da Obra',
    3: 'Equipamentos',
    4: 'Atividades & Fotos',
    5: 'Assinatura & Envio',
  };

  const hojeFormatado = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between font-sans">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BARRA DE PROGRESSO MULTI-STEP (2PX)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="w-full h-[2px] bg-[#E2E2DC] sticky top-0 z-30">
        <div
          className="h-full bg-[#111111] transition-all duration-300 rounded-none"
          style={{ width: `${(passo / 5) * 100}%` }}
        />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HEADER UNIFICADO (56PX)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="h-[56px] bg-white border-b border-[#E2E2DC] px-4 flex items-center justify-between sticky top-[2px] z-20 select-none">
        <button
          type="button"
          onClick={() => {
            if (passo > 1) setPasso((prev) => (prev - 1) as any);
            else router.push('/menu');
          }}
          className="min-w-[44px] min-h-[44px] flex items-center text-[14px] font-medium text-[#111111] hover:opacity-80 transition-opacity"
        >
          ← Voltar
        </button>
        <h1 className="text-[18px] font-semibold text-[#111111] tracking-[-0.3px] truncate px-2">
          {stepTitles[passo]}
        </h1>
        <div className="min-w-[44px] min-h-[44px]" />
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CONTEÚDO DO FORMULÁRIO (ESPAÇAMENTO 24PX)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 max-w-md w-full mx-auto px-4 py-6 pb-32 space-y-6">
        {erro && (
          <div className="p-4 bg-white border border-[#DC2626] text-[13px] text-[#DC2626]">
            {erro}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 1: IDENTIFICAÇÃO & CLIMA
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 1 && (
          <div className="space-y-6">
            {/* Trecho e Data */}
            <div className="space-y-4 bg-white border border-[#E2E2DC] p-4 rounded-none">
              <div>
                <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-1">
                  TRECHO ATIVO
                </span>
                <p className="text-[15px] font-semibold text-[#111111]">
                  {session.trecho_nome || 'Pacote 15 e 19'}
                </p>
              </div>
              <div className="border-t border-[#E2E2DC] pt-3">
                <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-1">
                  DATA DO RELATÓRIO
                </span>
                <p className="text-[15px] text-[#111111]">
                  {capitalize(hojeFormatado)}
                </p>
              </div>
            </div>

            {/* Turno */}
            <div>
              <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                TURNO DE TRABALHO
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['manha', 'tarde', 'noite'] as const).map((t) => {
                  const label = t === 'manha' ? 'Manhã' : t === 'tarde' ? 'Tarde' : 'Noite';
                  const active = turno === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTurno(t)}
                      className={`h-[44px] text-[14px] font-medium rounded-none border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-[#111111] border-[#E2E2DC]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clima Manhã */}
            <div>
              <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                CLIMA — PERÍODO DA MANHÃ
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['bom', 'nublado', 'chuva'] as const).map((c) => {
                  const label = c === 'bom' ? 'Bom' : c === 'nublado' ? 'Nublado' : 'Chuva';
                  const active = climaManha === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setClimaManha(c)}
                      className={`h-[44px] text-[14px] font-medium rounded-none border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-[#111111] border-[#E2E2DC]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clima Tarde */}
            <div>
              <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                CLIMA — PERÍODO DA TARDE
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['bom', 'nublado', 'chuva'] as const).map((c) => {
                  const label = c === 'bom' ? 'Bom' : c === 'nublado' ? 'Nublado' : 'Chuva';
                  const active = climaTarde === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setClimaTarde(c)}
                      className={`h-[44px] text-[14px] font-medium rounded-none border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-[#111111] border-[#E2E2DC]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 2: EFETIVO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 2 && (
          <div className="space-y-6">
            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-3">
                QUANTIDADE POR CATEGORIA
              </span>
              <div className="space-y-3">
                {Object.entries(efetivoCategorias).map(([cat, qtd]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between bg-white border border-[#E2E2DC] p-3 rounded-none"
                  >
                    <span className="text-[14px] font-medium text-[#111111]">
                      {cat}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEfetivoCategorias((prev) => ({
                            ...prev,
                            [cat]: Math.max(0, (prev[cat] || 0) - 1),
                          }))
                        }
                        className="w-[36px] h-[36px] bg-[#F7F7F5] border border-[#E2E2DC] text-[16px] font-bold flex items-center justify-center cursor-pointer hover:bg-[#E2E2DC] rounded-none"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={qtd}
                        onChange={(e) =>
                          setEfetivoCategorias((prev) => ({
                            ...prev,
                            [cat]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-[48px] h-[36px] text-center bg-white border border-[#E2E2DC] rounded-none text-[15px] font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEfetivoCategorias((prev) => ({
                            ...prev,
                            [cat]: (prev[cat] || 0) + 1,
                          }))
                        }
                        className="w-[36px] h-[36px] bg-[#F7F7F5] border border-[#E2E2DC] text-[16px] font-bold flex items-center justify-center cursor-pointer hover:bg-[#E2E2DC] rounded-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leitura de Crachá */}
            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                COLABORADORES NOMINAIS
              </span>

              <input
                type="file"
                accept="image/*"
                ref={crachaInputRef}
                onChange={handleCrachaFile}
                className="hidden"
              />

              <div
                onClick={() => crachaInputRef.current?.click()}
                className="border border-dashed border-[#E2E2DC] rounded-none p-5 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-[#111111] transition-colors mb-3"
              >
                {uploadingCracha ? (
                  <Loader2 className="w-5 h-5 text-[#6B7280] animate-spin mb-2" />
                ) : (
                  <Camera className="w-5 h-5 text-[#6B7280] mb-2 stroke-[1.5]" />
                )}
                <span className="text-[13px] font-medium text-[#6B7280]">
                  {uploadingCracha ? 'Processando QR Code...' : 'Escanear QR Code de crachá'}
                </span>
              </div>

              <div className="divide-y divide-[#E2E2DC] border border-[#E2E2DC] bg-white">
                {equipe.map((m, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium text-[#111111]">{m.nome}</p>
                      <p className="text-[12px] text-[#9CA3AF]">{m.funcao}</p>
                    </div>
                    <span className="bg-[#F7F7F5] border border-[#E2E2DC] text-[#6B7280] text-[12px] font-medium px-2 py-0.5 rounded-none">
                      Presente
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 3: EQUIPAMENTOS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 3 && (
          <div className="space-y-4">
            <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
              STATUS DOS EQUIPAMENTOS
            </span>

            <div className="space-y-4">
              {catalogoMaquinas.map((maq) => {
                const check = maquinasCheck[maq.id] || { status: 'operando', observacao: '' };
                return (
                  <div
                    key={maq.id}
                    className="bg-white border border-[#E2E2DC] p-4 rounded-none space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[15px] font-semibold text-[#111111]">
                          {maq.nome}
                        </div>
                        <div className="text-[13px] text-[#9CA3AF]">
                          {maq.codigo || maq.tipo}
                        </div>
                      </div>
                    </div>

                    {/* Botões planos de seleção */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['operando', 'parada', 'manutencao', 'ausente'] as const).map((st) => {
                        const lbl =
                          st === 'operando'
                            ? 'Operando'
                            : st === 'parada'
                            ? 'Parada'
                            : st === 'manutencao'
                            ? 'Manut.'
                            : 'Ausente';
                        const active = check.status === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              setMaquinasCheck((prev) => ({
                                ...prev,
                                [maq.id]: { ...check, status: st },
                              }))
                            }
                            className={`h-[38px] text-[12px] font-medium rounded-none border transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#111111] text-white border-[#111111]'
                                : 'bg-white text-[#111111] border-[#E2E2DC]'
                            }`}
                          >
                            {lbl}
                          </button>
                        );
                      })}
                    </div>

                    {(check.status === 'parada' || check.status === 'manutencao') && (
                      <div className="pt-2">
                        <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-1">
                          OBSERVAÇÃO / MOTIVO
                        </label>
                        <input
                          type="text"
                          value={check.observacao}
                          onChange={(e) =>
                            setMaquinasCheck((prev) => ({
                              ...prev,
                              [maq.id]: { ...check, observacao: e.target.value },
                            }))
                          }
                          placeholder="Informe o motivo da paralisação ou serviço"
                          className="w-full h-[48px] px-3 bg-white border border-[#E2E2DC] rounded-none text-[14px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#111111] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 4: ATIVIDADES & FOTOS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 4 && (
          <div className="space-y-6">
            {/* Textarea de Atividades */}
            <div>
              <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                ATIVIDADES EXECUTADAS NO DIA *
              </label>
              <textarea
                rows={5}
                required
                value={atividades}
                onChange={(e) => setAtividades(e.target.value)}
                placeholder="Descreva detalhadamente os serviços executados pelas equipes hoje..."
                className="w-full p-4 bg-white border border-[#E2E2DC] rounded-none text-[15px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#111111] focus:outline-none resize-none transition-colors"
              />
            </div>

            {/* Upload de fotos idêntico à Vistoria */}
            <div>
              <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                FOTOS DO DIA
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                ref={fotosInputRef}
                onChange={handleFotosDiaFile}
                className="hidden"
              />

              <div
                onClick={() => fotosInputRef.current?.click()}
                className="border border-dashed border-[#E2E2DC] rounded-none p-6 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-[#111111] transition-colors mb-3"
              >
                {uploadingFotoDia ? (
                  <Loader2 className="w-5 h-5 text-[#6B7280] animate-spin mb-2" />
                ) : (
                  <Camera className="w-5 h-5 text-[#6B7280] mb-2 stroke-[1.5]" />
                )}
                <span className="text-[13px] font-medium text-[#6B7280]">
                  {uploadingFotoDia ? 'Enviando fotos...' : 'Clique para adicionar fotos do canteiro'}
                </span>
              </div>

              {fotosDia.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {fotosDia.map((f, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square bg-[#F7F7F5] border border-[#E2E2DC] rounded-none overflow-hidden"
                    >
                      <img
                        src={f}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFotosDia((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-black/70 text-white text-[12px] w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-black"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 5: ASSINATURA, GPS & RESUMO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 5 && (
          <div className="space-y-6">
            {/* Assinatura */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                  ASSINATURA DIGITAL DO RESPONSÁVEL *
                </label>
                {hasAssinatura && (
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[12px] text-[#DC2626] hover:underline cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="border border-[#E2E2DC] bg-white h-[180px] w-full rounded-none relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full touch-none cursor-crosshair"
                />
                {!hasAssinatura && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[13px] text-[#9CA3AF]">
                    Assine com o dedo ou mouse
                  </div>
                )}
              </div>
            </div>

            {/* Localização GPS */}
            <div className="bg-white border border-[#E2E2DC] p-4 rounded-none">
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-1">
                LOCALIZAÇÃO GEOREFERENCIADA
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

            {/* Resumo */}
            <div className="bg-white border border-[#E2E2DC] p-4 rounded-none space-y-2">
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                RESUMO ANTES DO ENVIO
              </span>
              <div className="text-[14px] text-[#111111] space-y-1">
                <p><span className="text-[#6B7280]">Trecho:</span> {session.trecho_nome || 'Pacote 15 e 19'}</p>
                <p><span className="text-[#6B7280]">Turno:</span> {turno === 'manha' ? 'Manhã' : turno === 'tarde' ? 'Tarde' : 'Noite'}</p>
                <p><span className="text-[#6B7280]">Efetivo total:</span> {Object.values(efetivoCategorias).reduce((a, b) => a + b, 0)} trabalhadores</p>
                <p><span className="text-[#6B7280]">Equipamentos:</span> {catalogoMaquinas.length} máquinas mapeadas</p>
                <p><span className="text-[#6B7280]">Fotos registradas:</span> {fotosDia.length} imagens</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BOTÃO FIXO NO RODAPÉ (52PX)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#F7F7F5] border-t border-[#E2E2DC] z-30">
        <div className="max-w-md mx-auto">
          {passo < 5 && (
            <button
              type="button"
              onClick={() => setPasso((prev) => (prev + 1) as any)}
              className="w-full h-[52px] bg-[#111111] hover:bg-black active:opacity-85 text-white text-[15px] font-semibold rounded-none transition-opacity flex items-center justify-center cursor-pointer"
            >
              Próximo
            </button>
          )}

          {passo === 5 && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitRDO}
              className="w-full h-[52px] bg-[#111111] hover:bg-black active:opacity-85 text-white text-[15px] font-semibold rounded-none transition-opacity flex items-center justify-center cursor-pointer disabled:opacity-40"
            >
              {submitting ? 'Gravando RDO...' : 'Enviar RDO'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
