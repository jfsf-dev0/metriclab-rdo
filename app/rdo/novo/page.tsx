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
import { Camera, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';

export default function NovoRDOPage() {
  const router = useRouter();

  const [session, setSession] = useState<RDOSession | null>(null);
  const [passo, setPasso] = useState<number>(1);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // PASSO 1: Identificação & Clima
  const [turno, setTurno] = useState<'manha' | 'tarde' | 'noite'>('manha');
  const [geolat, setGeolat] = useState<number>(-23.5505);
  const [geolng, setGeolng] = useState<number>(-46.6333);

  // PASSO 2: Equipe
  const [equipe, setEquipe] = useState<EquipeMembro[]>([
    { nome: 'Carlos Eduardo', funcao: 'Operador de Escavadeira', presente: true },
    { nome: 'Roberto Alves', funcao: 'Motorista Basculante', presente: true },
    { nome: 'Marcos Vinicius', funcao: 'Ajudante Especializado', presente: true },
  ]);
  const [openMembroIdx, setOpenMembroIdx] = useState<number | null>(null);
  const [uploadingCracha, setUploadingCracha] = useState(false);
  const crachaInputRef = useRef<HTMLInputElement>(null);

  // PASSO 3: Máquinas
  const [catalogoMaquinas, setCatalogoMaquinas] = useState<MaquinaCatalogo[]>([]);
  const [maquinasCheck, setMaquinasCheck] = useState<
    Record<string, { status: MaquinaCheck['status']; observacao: string }>
  >({});
  const [openMaquinaId, setOpenMaquinaId] = useState<string | null>(null);

  // PASSO 4: Fotos & Atividades
  const [fotosDia, setFotosDia] = useState<string[]>([]);
  const [uploadingFotoDia, setUploadingFotoDia] = useState(false);
  const [atividades, setAtividades] = useState('');
  const fotosInputRef = useRef<HTMLInputElement>(null);

  // PASSO 5: Assinatura
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasAssinatura, setHasAssinatura] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('ml_rdo_session');
    if (!raw) {
      router.replace('/login');
      return;
    }

    const parsed: RDOSession = JSON.parse(raw);
    setSession(parsed);

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

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeolat(Number(pos.coords.latitude.toFixed(4)));
          setGeolng(Number(pos.coords.longitude.toFixed(4)));
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, [router]);

  // Canvas
  useEffect(() => {
    if (passo === 5 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.strokeStyle = '#1e3a5f';
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

      const { data: newRdo, error: insertError } = await supabase
        .from('demo_rdo_registros')
        .insert({
          usuario_id: session!.usuario_id,
          trecho_id: session!.trecho_id || 'd301f2ac-0a56-43f1-8f24-5d5d67683935',
          data: new Date().toISOString().split('T')[0],
          turno,
          clima_condicao: 'Parcialmente Nublado',
          clima_temperatura: 27,
          clima_umidade: 60,
          clima_vento: 12,
          geolat,
          geolng,
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
            equipe_qtd: equipe.length,
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

  const hojeFormatado = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between">
      {/* Header: "← Voltar" | "RDO [data]" | "[passo] de 5" */}
      <header className="h-[52px] bg-[#F7F7F5] border-b border-[#E5E5E3] px-6 flex items-center justify-between">
        <button
          onClick={() => {
            if (passo > 1) setPasso((prev) => prev - 1);
            else router.push('/menu');
          }}
          className="text-[14px] text-[#111111] hover:underline"
        >
          ← Voltar
        </button>
        <span className="text-[16px] font-normal text-[#111111]">
          RDO {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
        </span>
        <span className="text-[13px] font-normal text-[#9B9B9B]">
          {passo} de 5
        </span>
      </header>

      {/* Barra progresso 2px ink */}
      <div className="w-full h-[2px] bg-[#EFEFED]">
        <div
          className="h-full bg-[#111111] transition-all duration-500 rounded-none"
          style={{ width: `${(passo / 5) * 100}%` }}
        />
      </div>

      {/* Padding 24px */}
      <div className="flex-1 max-w-md w-full mx-auto p-6">
        {erro && (
          <div className="mb-6 text-[13px] text-[#111111] border-b border-[#111111] pb-2">
            {erro}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 1: IDENTIFICAÇÃO & CLIMA
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 1 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              IDENTIFICAÇÃO
            </span>

            {/* Lista flat */}
            <div className="divide-y divide-[#E5E5E3] border-t border-[#E5E5E3] mb-6">
              <div className="py-4">
                <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-1">
                  TRECHO
                </span>
                <p className="text-[20px] font-normal leading-none text-[#111111]">
                  {session.trecho_nome || 'Trecho 01 — Acesso Norte'}
                </p>
              </div>

              <div className="py-4">
                <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-1">
                  DATA
                </span>
                <p className="text-[20px] font-normal leading-none text-[#111111] capitalize">
                  {hojeFormatado}
                </p>
              </div>
            </div>

            {/* TURNO */}
            <div className="mb-6">
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-3">
                TURNO
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['manha', 'tarde', 'noite'] as const).map((t) => {
                  const label = t === 'manha' ? 'Manhã' : t === 'tarde' ? 'Tarde' : 'Noite';
                  const active = turno === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTurno(t)}
                      className={`py-2 text-[14px] font-normal rounded-[4px] border transition-colors ${
                        active
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'border-[#E5E5E3] text-[#111111]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CLIMA */}
            <div className="mb-10">
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-1">
                CLIMA
              </span>
              <p className="text-[16px] font-normal text-[#6B6B6B]">
                Parcialmente Nublado, 27°C
              </p>
              <span className="text-[11px] font-normal text-[#9B9B9B]">
                Capturado via GPS
              </span>
            </div>

            <button
              onClick={() => setPasso(2)}
              className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
            >
              Próximo
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 2: EQUIPE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 2 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-4">
              EQUIPE
            </span>

            <input
              type="file"
              accept="image/*"
              ref={crachaInputRef}
              onChange={handleCrachaFile}
              className="hidden"
            />

            {/* Área câmera crachá */}
            <div
              onClick={() => crachaInputRef.current?.click()}
              className="border border-dashed border-[#E5E5E3] rounded-none py-8 px-6 bg-[#F7F7F5] flex flex-col items-center justify-center cursor-pointer hover:border-[#111111] transition-colors mb-6"
            >
              {uploadingCracha ? (
                <Loader2 className="w-5 h-5 text-[#9B9B9B] animate-spin mb-2" />
              ) : (
                <Camera className="w-5 h-5 text-[#9B9B9B] mb-2" />
              )}
              <span className="text-[14px] font-normal text-[#6B6B6B]">
                {uploadingCracha ? 'Processando QR code...' : 'Fotografar crachá'}
              </span>
            </div>

            {/* Lista membros accordion */}
            <div className="divide-y divide-[#E5E5E3] border-t border-[#E5E5E3] mb-10">
              {equipe.map((m, idx) => {
                const isOpen = openMembroIdx === idx;
                return (
                  <div key={idx} className="border-b border-[#E5E5E3]">
                    <div
                      onClick={() => setOpenMembroIdx(isOpen ? null : idx)}
                      className="py-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <span className="text-[20px] font-normal leading-none text-[#111111]">
                        {m.nome}
                      </span>
                      <span className="text-[13px] font-normal text-[#9B9B9B]">
                        {m.funcao}
                      </span>
                    </div>

                    {isOpen && (
                      <div className="bg-white p-4 mb-4 flex items-center justify-between">
                        <span className="text-[16px] text-[#6B6B6B]">
                          {m.funcao} · Presente
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEquipe((prev) => prev.filter((_, i) => i !== idx));
                            setOpenMembroIdx(null);
                          }}
                          className="text-[13px] text-[#9B9B9B] hover:text-[#111111]"
                        >
                          × Remover
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setPasso(3)}
              className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
            >
              Próximo
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 3: MÁQUINAS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 3 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-4">
              MÁQUINAS
            </span>

            {/* Lista accordion por máquina */}
            <div className="divide-y divide-[#E5E5E3] border-t border-[#E5E5E3] mb-10">
              {catalogoMaquinas.map((maq) => {
                const check = maquinasCheck[maq.id] || { status: 'operando', observacao: '' };
                const isOpen = openMaquinaId === maq.id;
                const statusLabel =
                  check.status === 'operando'
                    ? 'Operando'
                    : check.status === 'parada'
                    ? 'Parada'
                    : check.status === 'manutencao'
                    ? 'Manutenção'
                    : 'Ausente';

                return (
                  <div key={maq.id} className="border-b border-[#E5E5E3]">
                    <div
                      onClick={() => setOpenMaquinaId(isOpen ? null : maq.id)}
                      className="py-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <span className="text-[20px] font-normal leading-none text-[#111111] truncate pr-4">
                        {maq.nome}
                      </span>
                      <span className="text-[13px] font-normal text-[#6B6B6B] shrink-0">
                        {statusLabel}
                      </span>
                    </div>

                    {isOpen && (
                      <div className="bg-white p-4 mb-4">
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {(['operando', 'parada', 'manutencao', 'ausente'] as const).map((st) => {
                            const lbl =
                              st === 'operando'
                                ? 'Operando'
                                : st === 'parada'
                                ? 'Parada'
                                : st === 'manutencao'
                                ? 'Manutenção'
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
                                className={`py-1.5 px-2 text-[13px] font-normal rounded-[4px] border transition-colors ${
                                  active
                                    ? 'bg-[#111111] text-white border-[#111111]'
                                    : 'border-[#E5E5E3] text-[#111111]'
                                }`}
                              >
                                {lbl}
                              </button>
                            );
                          })}
                        </div>

                        {(check.status === 'parada' || check.status === 'manutencao') && (
                          <div className="flex flex-col mt-2">
                            <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] mb-[4px]">
                              OBSERVAÇÃO
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
                              placeholder="Motivo..."
                              className="w-full bg-transparent border-0 border-b border-[#E5E5E3] focus:border-[#111111] py-2 text-[15px] text-[#111111] placeholder:text-[#9B9B9B] outline-none rounded-none transition-colors"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setPasso(4)}
              className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
            >
              Próximo
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 4: FOTOS & ATIVIDADES
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 4 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-3">
              FOTOS
            </span>

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
              className="border border-dashed border-[#E5E5E3] rounded-none py-10 px-6 bg-[#F7F7F5] flex flex-col items-center justify-center cursor-pointer hover:border-[#111111] transition-colors mb-4"
            >
              {uploadingFotoDia ? (
                <Loader2 className="w-5 h-5 text-[#9B9B9B] animate-spin mb-2" />
              ) : (
                <Camera className="w-5 h-5 text-[#9B9B9B] mb-2" />
              )}
              <span className="text-[14px] font-normal text-[#6B6B6B]">
                {uploadingFotoDia ? 'Enviando fotos...' : 'Adicionar fotos do dia'}
              </span>
            </div>

            {fotosDia.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {fotosDia.map((f, idx) => (
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
                      onClick={() => setFotosDia((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-black/60 text-[#9B9B9B] hover:text-white text-[12px] w-6 h-6 rounded-full flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="w-full border-b border-[#E5E5E3] my-6" />

            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              ATIVIDADES DO DIA
            </span>
            <textarea
              rows={5}
              required
              value={atividades}
              onChange={(e) => setAtividades(e.target.value)}
              placeholder="Descreva as atividades executadas hoje..."
              className="w-full bg-transparent border-0 border-b border-[#E5E5E3] focus:border-[#111111] py-3 text-[16px] text-[#111111] placeholder:text-[#9B9B9B] outline-none rounded-none resize-none transition-colors mb-10"
            />

            <button
              onClick={() => setPasso(5)}
              className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
            >
              Próximo
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 5: ASSINATURA, GPS & RESUMO
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 5 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
                ASSINATURA
              </span>
              {hasAssinatura && (
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[13px] text-[#9B9B9B] hover:text-[#111111]"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Canvas */}
            <div className="border border-[#E5E5E3] rounded-none bg-white h-[180px] w-full overflow-hidden relative mb-8">
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
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[13px] text-[#C4C4C2]">
                  Assine com o dedo ou mouse
                </div>
              )}
            </div>

            <div className="w-full border-b border-[#E5E5E3] mb-8" />

            {/* LOCALIZAÇÃO */}
            <div className="mb-8">
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-1">
                LOCALIZAÇÃO
              </span>
              <p className="text-[13px] text-[#9B9B9B]">
                Lat: {geolat} · Lng: {geolng}
              </p>
            </div>

            <div className="w-full border-b border-[#E5E5E3] mb-8" />

            {/* RESUMO */}
            <div className="mb-10">
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-3">
                RESUMO
              </span>
              <div className="space-y-1 text-[16px] text-[#6B6B6B]">
                <p>{session.trecho_nome || 'Trecho 01 — Acesso Norte'}</p>
                <p>
                  {turno === 'manha' ? 'Manhã' : turno === 'tarde' ? 'Tarde' : 'Noite'} ·{' '}
                  {equipe.length} colaboradores
                </p>
                <p>
                  {catalogoMaquinas.length} máquinas · {fotosDia.length} fotos
                </p>
              </div>
            </div>

            <button
              disabled={!hasAssinatura || submitting}
              onClick={handleSubmitRDO}
              className="w-full h-12 bg-[#111111] hover:bg-black disabled:opacity-40 text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
            >
              {submitting ? 'Gravando RDO...' : 'Enviar RDO'}
            </button>
          </div>
        )}
      </div>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3]">
        MetricLab · Pacote 15 e 19
      </footer>
    </main>
  );
}
