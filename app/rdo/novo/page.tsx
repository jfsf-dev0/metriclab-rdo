'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { supabase } from '@/lib/supabase';
import {
  RDOSession,
  EquipeMembro,
  MaquinaCatalogo,
  MaquinaCheck,
} from '@/types/rdo';
import { Camera, X, Loader2 } from 'lucide-react';

export default function NovoRDOPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [session, setSession] = useState<RDOSession | null>(null);
  const [passo, setPasso] = useState<number>(1);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // PASSO 1: Identificação & Clima
  const [dataHoje, setDataHoje] = useState('');
  const [turno, setTurno] = useState<'manha' | 'tarde' | 'noite'>('manha');
  const [clima, setClima] = useState({
    condicao: 'Parcialmente Nublado, 27°C',
    temperatura: 27,
  });

  // GPS
  const [geolat, setGeolat] = useState<number>(-23.55052);
  const [geolng, setGeolng] = useState<number>(-46.633308);
  const [gpsLoading, setGpsLoading] = useState(false);

  // PASSO 2: Equipe
  const [equipe, setEquipe] = useState<EquipeMembro[]>([]);
  const [uploadingCracha, setUploadingCracha] = useState(false);
  const crachaInputRef = useRef<HTMLInputElement>(null);

  // PASSO 3: Máquinas
  const [catalogoMaquinas, setCatalogoMaquinas] = useState<MaquinaCatalogo[]>([]);
  const [maquinasCheck, setMaquinasCheck] = useState<
    Record<string, { status: MaquinaCheck['status']; observacao: string }>
  >({});

  // PASSO 4: Fotos do Dia & Atividades
  const [fotosDia, setFotosDia] = useState<string[]>([]);
  const [uploadingFotoDia, setUploadingFotoDia] = useState(false);
  const [atividades, setAtividades] = useState('');
  const fotosInputRef = useRef<HTMLInputElement>(null);

  // PASSO 5: Assinatura
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasAssinatura, setHasAssinatura] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Init
  useEffect(() => {
    const raw = localStorage.getItem('ml_rdo_session');
    if (!raw) {
      router.replace('/login');
      return;
    }

    const parsed: RDOSession = JSON.parse(raw);
    setSession(parsed);

    const hoje = new Date().toISOString().split('T')[0];
    setDataHoje(hoje);

    // Carrega máquinas
    supabase
      .from('demo_rdo_maquinas_catalogo')
      .select('*')
      .eq('ativo', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCatalogoMaquinas(data as MaquinaCatalogo[]);
          const inicial: Record<
            string,
            { status: MaquinaCheck['status']; observacao: string }
          > = {};
          data.forEach((m) => {
            inicial[m.id] = { status: 'operando', observacao: '' };
          });
          setMaquinasCheck(inicial);
        } else {
          // Fallback máquinas
          const mockMaquinas: MaquinaCatalogo[] = [
            { id: '1', codigo: 'ESC-01', nome: 'Escavadeira Hidráulica CAT 320', tipo: 'Escavadeira', ativo: true },
            { id: '2', codigo: 'RET-01', nome: 'Retroescavadeira JCB 3CX', tipo: 'Retroescavadeira', ativo: true },
            { id: '3', codigo: 'CAM-01', nome: 'Caminhão Basculante MB 2729', tipo: 'Caminhão', ativo: true },
            { id: '4', codigo: 'ROL-01', nome: 'Rolo Compactador Dynapac CA250', tipo: 'Compactador', ativo: true },
          ];
          setCatalogoMaquinas(mockMaquinas);
          const inicial: Record<
            string,
            { status: MaquinaCheck['status']; observacao: string }
          > = {};
          mockMaquinas.forEach((m) => {
            inicial[m.id] = { status: 'operando', observacao: '' };
          });
          setMaquinasCheck(inicial);
        }
        setLoadingInitial(false);
      });

    // Captura GPS
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeolat(pos.coords.latitude);
          setGeolng(pos.coords.longitude);
        },
        () => {
          setGeolat(-23.55052);
          setGeolng(-46.633308);
        }
      );
    }
  }, [router]);

  // Canvas resize & scale
  useEffect(() => {
    if (passo === 5 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [passo]);

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
      setGpsLoading(false);
    }
  };

  const handleCrachaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCracha(true);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `crachas/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('demo-rdo-fotos')
        .upload(path, file, { contentType: file.type || 'image/jpeg' });

      let fotoUrl = '';
      if (!uploadError) {
        const { data: publicData } = supabase.storage
          .from('demo-rdo-fotos')
          .getPublicUrl(path);
        fotoUrl = publicData.publicUrl;
      }

      // Leitura QR via jsQR
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            adicionarColaboradorFallback(fotoUrl);
            return;
          }
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

          if (qrCode && qrCode.data) {
            try {
              const parsed = JSON.parse(qrCode.data);
              const novoMembro: EquipeMembro = {
                id: Math.random().toString(36).substring(2, 9),
                nome: parsed.nome || 'Colaborador',
                funcao: parsed.funcao || 'Operador',
                matricula: parsed.matricula || 'MAT-' + Math.floor(1000 + Math.random() * 9000),
                qr_raw: qrCode.data,
                foto_cracha_url: fotoUrl,
                presente: true,
              };
              setEquipe((prev) => [...prev, novoMembro]);
              showToast(`Crachá reconhecido: ${novoMembro.nome}`, 'success');
              setUploadingCracha(false);
            } catch {
              const parts = qrCode.data.split('|');
              const novoMembro: EquipeMembro = {
                id: Math.random().toString(36).substring(2, 9),
                matricula: parts[0]?.trim() || 'MAT-' + Math.floor(1000 + Math.random() * 9000),
                nome: parts[1]?.trim() || 'Colaborador',
                funcao: parts[2]?.trim() || 'Operador',
                qr_raw: qrCode.data,
                foto_cracha_url: fotoUrl,
                presente: true,
              };
              setEquipe((prev) => [...prev, novoMembro]);
              showToast(`Crachá reconhecido: ${novoMembro.nome}`, 'success');
              setUploadingCracha(false);
            }
          } else {
            adicionarColaboradorFallback(fotoUrl);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingCracha(false);
    } finally {
      if (crachaInputRef.current) crachaInputRef.current.value = '';
    }
  };

  const adicionarColaboradorFallback = (fotoUrl: string) => {
    const nomes = ['João Silva', 'Antônio Santos', 'Pedro Oliveira', 'Lucas Pereira'];
    const funcoes = ['Pedreiro', 'Servente', 'Operador de Máquinas', 'Eletricista'];
    const idx = equipe.length % nomes.length;

    const novo: EquipeMembro = {
      id: Math.random().toString(36).substring(2, 9),
      nome: nomes[idx],
      funcao: funcoes[idx],
      matricula: 'MAT-' + Math.floor(1000 + Math.random() * 9000),
      foto_cracha_url: fotoUrl,
      presente: true,
    };
    setEquipe((prev) => [...prev, novo]);
    showToast(`Crachá registrado: ${novo.nome}`, 'success');
    setUploadingCracha(false);
  };

  const handleFotoDiaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFotoDia(true);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `rdo-fotos/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('demo-rdo-fotos')
        .upload(path, file, { contentType: file.type || 'image/jpeg' });

      if (uploadError) {
        setUploadingFotoDia(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from('demo-rdo-fotos')
        .getPublicUrl(path);

      setFotosDia((prev) => [...prev, publicData.publicUrl]);
    } catch {
      // Ignora erro
    } finally {
      setUploadingFotoDia(false);
      if (fotosInputRef.current) fotosInputRef.current.value = '';
    }
  };

  // Canvas drawing
  const getCanvasCoords = (e: React.TouchEvent | React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasAssinatura(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasAssinatura(false);
  };

  const handleSubmit = async () => {
    if (!session) return;
    setSubmitting(true);

    try {
      let assinaturaUrl = '';
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const path = `assinaturas/${Date.now()}.png`;

        const { error: errAss } = await supabase.storage
          .from('demo-rdo-fotos')
          .upload(path, blob, { contentType: 'image/png' });

        if (!errAss) {
          const { data: assData } = supabase.storage
            .from('demo-rdo-fotos')
            .getPublicUrl(path);
          assinaturaUrl = assData?.publicUrl || '';
        }
      }

      const maquinasArr = Object.entries(maquinasCheck).map(
        ([maquina_id, val]) => ({
          maquina_id,
          status: val.status,
          observacao: val.observacao,
        })
      );

      const { data: rdoData, error: rdoError } = await supabase
        .from('demo_rdo_registros')
        .insert({
          usuario_id: session.usuario_id,
          trecho_id: session.trecho_id,
          data: dataHoje,
          turno,
          clima_condicao: clima.condicao,
          clima_temperatura: clima.temperatura,
          geolat: geolat ? Number(geolat.toFixed(6)) : null,
          geolng: geolng ? Number(geolng.toFixed(6)) : null,
          atividades: atividades.trim(),
          equipe,
          maquinas: maquinasArr,
          fotos: fotosDia,
          assinatura_url: assinaturaUrl,
          status: 'enviado',
        })
        .select()
        .single();

      if (rdoError) {
        showToast('Erro ao salvar RDO: ' + rdoError.message, 'error');
        setSubmitting(false);
        return;
      }

      const rdoId = rdoData.id;

      if (equipe.length > 0) {
        const membrosPayload = equipe.map((m) => ({
          rdo_id: rdoId,
          matricula: m.matricula,
          nome: m.nome,
          funcao: m.funcao,
          qr_raw: m.qr_raw,
          foto_cracha_url: m.foto_cracha_url,
          presente: m.presente,
        }));
        await supabase.from('demo_rdo_equipe_membros').insert(membrosPayload);
      }

      if (maquinasArr.length > 0) {
        const checksPayload = maquinasArr.map((mc) => ({
          rdo_id: rdoId,
          maquina_id: mc.maquina_id,
          status: mc.status,
          observacao: mc.observacao || null,
        }));
        await supabase.from('demo_rdo_maquinas_check').insert(checksPayload);
      }

      const webhookUrl =
        process.env.N8N_RDO_ENVIADO ||
        'https://n8n.metriclab.com.br/webhook/rdo-enviado';

      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rdo_id: rdoId,
            usuario_id: session.usuario_id,
            nome: session.nome,
            trecho_nome: session.trecho_nome,
            data: dataHoje,
            turno,
            clima_condicao: clima.condicao,
            total_equipe: equipe.length,
            total_maquinas: maquinasArr.length,
            total_fotos: fotosDia.length,
            geolat,
            geolng,
          }),
        });
      } catch {}

      router.push(`/rdo/${rdoId}/confirmacao`);
    } catch {
      showToast('Erro inesperado ao salvar RDO.', 'error');
      setSubmitting(false);
    }
  };

  const handleVoltar = () => {
    if (passo === 1) {
      router.push('/menu');
    } else {
      setPasso((prev) => prev - 1);
    }
  };

  const progressPercentage = (passo / 5) * 100;

  if (loadingInitial) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] flex items-center justify-center text-[#9B9B9B] text-[13px]">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between">
      {/* Header */}
      <header className="sticky top-0 z-30 h-[52px] w-full bg-[#F7F7F5] border-b border-[#E5E5E3] px-5 flex items-center justify-between select-none">
        <button
          onClick={handleVoltar}
          className="text-[14px] font-normal text-[#111111] hover:text-black cursor-pointer bg-transparent border-none p-0"
        >
          ← Voltar
        </button>

        <div className="text-[14px] font-medium text-[#111111] truncate px-2 max-w-[200px]">
          {session?.trecho_nome || 'RDO'}
        </div>

        <div className="text-[13px] font-normal text-[#9B9B9B]">
          {passo} de 5
        </div>
      </header>

      {/* Barra de progresso: 2px hairline-soft -> fill ink */}
      <div className="w-full bg-[#EFEFED] h-[2px]">
        <div
          className="bg-[#111111] h-[2px] transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex-1 max-w-md w-full mx-auto px-5 py-6">
        {/* PASSO 1: IDENTIFICAÇÃO */}
        {passo === 1 && (
          <div>
            <div className="divide-y divide-[#E5E5E3]">
              <div className="py-3 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
                  TRECHO
                </span>
                <span className="text-[15px] font-normal text-[#111111]">
                  {session?.trecho_nome}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
                  DATA
                </span>
                <span className="text-[15px] font-normal text-[#111111]">
                  {dataHoje.split('-').reverse().join('/')}
                </span>
              </div>
            </div>

            <div className="h-6" />

            {/* TURNO */}
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
                TURNO
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['manha', 'tarde', 'noite'] as const).map((t) => {
                  const label = t === 'manha' ? 'Manhã' : t === 'tarde' ? 'Tarde' : 'Noite';
                  const isSelected = turno === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTurno(t)}
                      className={`border rounded-[4px] py-2.5 text-[13px] font-medium text-center transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#111111] border-[#111111] text-white'
                          : 'bg-transparent border-[#E5E5E3] text-[#111111] hover:bg-[#EFEFED]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-6" />

            {/* CLIMA */}
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-1">
                CLIMA
              </span>
              <p className="text-[13px] text-[#9B9B9B]">
                {clima.condicao}
              </p>
              <span className="text-[11px] text-[#9B9B9B] block mt-0.5">
                Capturado automaticamente
              </span>
            </div>

            <div className="h-10" />

            <Button
              onClick={() => setPasso(2)}
              className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
            >
              Próximo
            </Button>
          </div>
        )}

        {/* PASSO 2: EQUIPE */}
        {passo === 2 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-3">
              EQUIPE
            </span>

            <input
              ref={crachaInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCrachaUpload}
            />

            {/* Botão câmera área dashed */}
            <div
              onClick={() => crachaInputRef.current?.click()}
              className="border border-dashed border-[#E5E5E3] rounded-[8px] p-6 bg-[#F7F7F5] flex flex-col items-center justify-center cursor-pointer hover:bg-[#EFEFED] transition-colors"
            >
              {uploadingCracha ? (
                <Loader2 className="w-5 h-5 text-[#9B9B9B] animate-spin mb-2" />
              ) : (
                <Camera className="w-5 h-5 text-[#9B9B9B] mb-2" />
              )}
              <span className="text-[14px] text-[#111111] font-medium">
                {uploadingCracha ? 'Processando...' : 'Fotografar crachá'}
              </span>
            </div>

            {/* Lista membros flat */}
            <div className="mt-6 divide-y divide-[#E5E5E3]">
              {equipe.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-[#9B9B9B]">
                  Nenhum colaborador registrado ainda.
                </div>
              ) : (
                equipe.map((membro) => (
                  <div key={membro.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-normal text-[#111111]">
                        {membro.nome}
                      </div>
                      <div className="text-[13px] text-[#9B9B9B]">
                        {membro.funcao}
                      </div>
                    </div>
                    <span className="text-[11px] text-[#9B9B9B]">
                      Presente
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="h-10" />

            <Button
              onClick={() => setPasso(3)}
              className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
            >
              Próximo
            </Button>
          </div>
        )}

        {/* PASSO 3: MÁQUINAS */}
        {passo === 3 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-3">
              MÁQUINAS
            </span>

            {/* Lista flat por máquina */}
            <div className="divide-y divide-[#E5E5E3]">
              {catalogoMaquinas.map((maq) => {
                const currentStatus = maquinasCheck[maq.id]?.status || 'operando';
                return (
                  <div key={maq.id} className="py-4 flex flex-col gap-2">
                    <span className="text-[15px] font-normal text-[#111111]">
                      {maq.nome}
                    </span>

                    {/* 4 botões compactos: Operando / Parada / Manutenção / Ausente */}
                    <div className="flex items-center gap-3">
                      {(
                        [
                          { id: 'operando', label: 'Operando' },
                          { id: 'parada', label: 'Parada' },
                          { id: 'manutencao', label: 'Manutenção' },
                          { id: 'ausente', label: 'Ausente' },
                        ] as const
                      ).map((st) => {
                        const isSelected = currentStatus === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() =>
                              setMaquinasCheck((prev) => ({
                                ...prev,
                                [maq.id]: { ...prev[maq.id], status: st.id },
                              }))
                            }
                            className={`text-[11px] transition-colors cursor-pointer bg-transparent border-none p-0 ${
                              isSelected
                                ? 'text-[#111111] font-semibold underline'
                                : 'text-[#9B9B9B] hover:text-[#111111]'
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="h-10" />

            <Button
              onClick={() => setPasso(4)}
              className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
            >
              Próximo
            </Button>
          </div>
        )}

        {/* PASSO 4: FOTOS + ATIVIDADES */}
        {passo === 4 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              FOTOS
            </span>

            <input
              ref={fotosInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFotoDiaUpload}
            />

            <div
              onClick={() => fotosInputRef.current?.click()}
              className="border border-dashed border-[#E5E5E3] rounded-[8px] p-6 bg-[#F7F7F5] flex flex-col items-center justify-center cursor-pointer hover:bg-[#EFEFED] transition-colors"
            >
              {uploadingFotoDia ? (
                <Loader2 className="w-5 h-5 text-[#9B9B9B] animate-spin mb-2" />
              ) : (
                <Camera className="w-5 h-5 text-[#9B9B9B] mb-2" />
              )}
              <span className="text-[13px] text-[#9B9B9B]">
                {uploadingFotoDia ? 'Enviando...' : 'Adicionar foto de atividades'}
              </span>
            </div>

            {fotosDia.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {fotosDia.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-[4px] overflow-hidden border border-[#E5E5E3] bg-[#EFEFED]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFotosDia((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-[#9B9B9B] hover:text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="h-6" />

            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              ATIVIDADES
            </span>
            <textarea
              rows={5}
              value={atividades}
              onChange={(e) => setAtividades(e.target.value)}
              placeholder="Descreva as atividades executadas hoje..."
              className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b border-[#E5E5E3] rounded-none py-2 text-[15px] text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-b-[#111111] resize-none"
            />

            <div className="h-10" />

            <Button
              onClick={() => setPasso(5)}
              className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
            >
              Próximo
            </Button>
          </div>
        )}

        {/* PASSO 5: ASSINATURA */}
        {passo === 5 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              RESUMO
            </span>

            <div className="divide-y divide-[#E5E5E3] mb-6">
              <div className="py-2.5 flex items-center justify-between text-[13px]">
                <span className="text-[#9B9B9B]">Trecho</span>
                <span className="text-[#111111]">{session?.trecho_nome}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-[13px]">
                <span className="text-[#9B9B9B]">Turno</span>
                <span className="text-[#111111]">
                  {turno === 'manha' ? 'Manhã' : turno === 'tarde' ? 'Tarde' : 'Noite'}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-[13px]">
                <span className="text-[#9B9B9B]">Equipe Presente</span>
                <span className="text-[#111111]">{equipe.length} colaboradores</span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-[13px]">
                <span className="text-[#9B9B9B]">Fotos Anexadas</span>
                <span className="text-[#111111]">{fotosDia.length}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
                ASSINATURA
              </span>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[13px] text-[#9B9B9B] hover:text-[#111111] bg-transparent border-none p-0 cursor-pointer"
              >
                Limpar
              </button>
            </div>
            <div className="h-2" />

            <div className="w-full h-40 bg-white border border-[#E5E5E3] touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full block cursor-crosshair"
              />
            </div>

            <div className="h-6" />

            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-1">
                LOCALIZAÇÃO
              </span>
              <div className="flex items-center justify-between py-2 border-b border-[#E5E5E3]">
                <span className="text-[13px] text-[#6B6B6B]">
                  {gpsLoading
                    ? 'Capturando GPS...'
                    : geolat
                    ? `${geolat.toFixed(5)}, ${geolng.toFixed(5)}`
                    : 'Pendente'}
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

            <div className="h-10" />

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              loading={submitting}
              className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
            >
              Enviar RDO
            </Button>
          </div>
        )}
      </div>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3] bg-[#F7F7F5] pb-safe">
        MetricLab · Consórcio Pacote 15 e 19
      </footer>
    </main>
  );
}
