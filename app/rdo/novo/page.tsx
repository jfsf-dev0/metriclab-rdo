'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { supabase } from '@/lib/supabase';
import {
  RDOSession,
  EquipeMembro,
  MaquinaCatalogo,
  MaquinaCheck,
} from '@/types/rdo';
import {
  CloudSun,
  Camera,
  QrCode,
  CheckCircle2,
  Trash2,
  MapPin,
  X,
  Plus,
  RefreshCw,
  Send,
  AlertCircle,
  Truck,
  Wrench,
  PauseCircle,
  MinusCircle,
  Check,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    condicao: 'Ensolarado / Poucas Nuvens',
    temperatura: 28,
    umidade: 62,
    vento: 14,
    capturado: true,
  });
  const [loadingClima, setLoadingClima] = useState(false);

  // GPS
  const [geolat, setGeolat] = useState<number>(-23.55052);
  const [geolng, setGeolng] = useState<number>(-46.633308);
  const [gpsCapturado, setGpsCapturado] = useState(false);

  // PASSO 2: Equipe
  const [equipe, setEquipe] = useState<EquipeMembro[]>([]);
  const [uploadingCracha, setUploadingCracha] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCrachaUrl, setManualCrachaUrl] = useState('');
  const [manualNome, setManualNome] = useState('');
  const [manualFuncao, setManualFuncao] = useState('');
  const [manualMatricula, setManualMatricula] = useState('');
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

    // Carregar máquinas do catálogo
    supabase
      .from('demo_rdo_maquinas_catalogo')
      .select('*')
      .eq('ativo', true)
      .then(({ data }) => {
        if (data) setCatalogoMaquinas(data);
      });

    // Captura inicial de GPS e Clima
    capturarGPSClima();
    setLoadingInitial(false);
  }, [router]);

  const capturarGPSClima = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGeolat(lat);
          setGeolng(lng);
          setGpsCapturado(true);
          buscarClima(lat, lng);
        },
        () => {
          setGpsCapturado(true);
          buscarClima(-23.55052, -46.633308);
        },
        { timeout: 8000 }
      );
    } else {
      setGpsCapturado(true);
    }
  };

  const buscarClima = async (lat: number, lon: number) => {
    setLoadingClima(true);
    const key = process.env.OPENWEATHER_KEY;
    if (key) {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=pt_br`
        );
        if (res.ok) {
          const data = await res.json();
          setClima({
            condicao: data.weather[0]?.description || 'Céu Limpo',
            temperatura: Math.round(data.main?.temp || 26),
            umidade: Math.round(data.main?.humidity || 60),
            vento: Math.round((data.wind?.speed || 3) * 3.6),
            capturado: true,
          });
          setLoadingClima(false);
          return;
        }
      } catch {
        // Fallback
      }
    }

    // Clima automático demonstrativo
    setClima({
      condicao: 'Parcialmente Nublado',
      temperatura: 27,
      umidade: 64,
      vento: 12,
      capturado: true,
    });
    setLoadingClima(false);
  };

  // Processar foto de crachá e QR Code
  const handleCrachaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingCracha(true);
    const file = files[0];

    try {
      // 1. Upload foto crachá para Storage
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `crachas/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('demo-rdo-fotos')
        .upload(fileName, file, { contentType: file.type || 'image/jpeg' });

      let fotoUrl = '';
      if (!uploadError) {
        const { data: publicData } = supabase.storage
          .from('demo-rdo-fotos')
          .getPublicUrl(fileName);
        fotoUrl = publicData.publicUrl;
      }

      // 2. Leitura de QR Code via jsQR
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            abrirManual(fotoUrl);
            return;
          }
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

          if (qrCode && qrCode.data) {
            try {
              // Tenta decodificar JSON
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
              // Se não for JSON, pode ser "matricula|nome|funcao"
              const parts = qrCode.data.split('|');
              if (parts.length >= 2) {
                const novoMembro: EquipeMembro = {
                  id: Math.random().toString(36).substring(2, 9),
                  matricula: parts[0]?.trim(),
                  nome: parts[1]?.trim() || 'Colaborador',
                  funcao: parts[2]?.trim() || 'Operador',
                  qr_raw: qrCode.data,
                  foto_cracha_url: fotoUrl,
                  presente: true,
                };
                setEquipe((prev) => [...prev, novoMembro]);
                showToast(`Crachá reconhecido: ${novoMembro.nome}`, 'success');
                setUploadingCracha(false);
              } else {
                abrirManual(fotoUrl, qrCode.data);
              }
            }
          } else {
            abrirManual(fotoUrl);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      showToast('Erro ao processar crachá.', 'error');
      setUploadingCracha(false);
    } finally {
      if (crachaInputRef.current) crachaInputRef.current.value = '';
    }
  };

  const abrirManual = (fotoUrl: string, qrRaw = '') => {
    setManualCrachaUrl(fotoUrl);
    setManualMatricula(qrRaw || 'MAT-' + Math.floor(1000 + Math.random() * 9000));
    setManualNome('');
    setManualFuncao('');
    setShowManualModal(true);
    setUploadingCracha(false);
  };

  const salvarManual = () => {
    if (!manualNome.trim() || !manualFuncao.trim()) {
      showToast('Preencha o nome e a função do colaborador.', 'warning');
      return;
    }
    const novo: EquipeMembro = {
      id: Math.random().toString(36).substring(2, 9),
      nome: manualNome.trim(),
      funcao: manualFuncao.trim(),
      matricula: manualMatricula.trim(),
      foto_cracha_url: manualCrachaUrl,
      presente: true,
    };
    setEquipe((prev) => [...prev, novo]);
    setShowManualModal(false);
    showToast(`Colaborador adicionado: ${novo.nome}`, 'success');
  };

  const adicionarExemploEquipe = (nome: string, funcao: string) => {
    const novo: EquipeMembro = {
      id: Math.random().toString(36).substring(2, 9),
      nome,
      funcao,
      matricula: 'MAT-' + Math.floor(1000 + Math.random() * 9000),
      presente: true,
    };
    setEquipe((prev) => [...prev, novo]);
    showToast(`${nome} adicionado(a)!`, 'success');
  };

  // Upload Foto do Dia
  const handleFotoDia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !session) return;

    setUploadingFotoDia(true);
    try {
      const file = files[0];
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `rdos/${dataHoje}/${session.usuario_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      const { error } = await supabase.storage
        .from('demo-rdo-fotos')
        .upload(fileName, file, { contentType: file.type || 'image/jpeg' });

      if (error) {
        showToast('Erro no upload: ' + error.message, 'error');
        setUploadingFotoDia(false);
        return;
      }

      const { data } = supabase.storage
        .from('demo-rdo-fotos')
        .getPublicUrl(fileName);

      setFotosDia((prev) => [...prev, data.publicUrl]);
      showToast('Foto do dia anexada!', 'success');
    } catch {
      showToast('Erro ao anexar foto.', 'error');
    } finally {
      setUploadingFotoDia(false);
      if (fotosInputRef.current) fotosInputRef.current.value = '';
    }
  };

  // Canvas Assinatura
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasAssinatura(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const limparAssinatura = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasAssinatura(false);
  };

  // Finalizar e Enviar RDO
  const handleEnviarRDO = async () => {
    if (!session) return;
    if (!hasAssinatura) {
      showToast('Por favor, assine no campo abaixo com o dedo.', 'warning');
      return;
    }

    setSubmitting(true);

    try {
      const canvas = canvasRef.current;
      let assinaturaUrl = '';

      // 1. Upload Assinatura
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const rdoIdTemp = crypto.randomUUID();
        const sigPath = `assinaturas/${rdoIdTemp}.png`;

        const { error: sigError } = await supabase.storage
          .from('demo-rdo-fotos')
          .upload(sigPath, blob, { contentType: 'image/png', upsert: true });

        if (!sigError) {
          const { data: sigData } = supabase.storage
            .from('demo-rdo-fotos')
            .getPublicUrl(sigPath);
          assinaturaUrl = sigData.publicUrl;
        }
      }

      // Máquinas com status selecionado
      const maquinasArr: MaquinaCheck[] = Object.entries(maquinasCheck).map(
        ([maquina_id, val]) => ({
          maquina_id,
          status: val.status,
          observacao: val.observacao || undefined,
        })
      );

      // 2. INSERT demo_rdo_registros
      const { data: rdoData, error: rdoError } = await supabase
        .from('demo_rdo_registros')
        .insert({
          usuario_id: session.usuario_id,
          trecho_id: session.trecho_id,
          data: dataHoje,
          turno,
          clima_condicao: clima.condicao,
          clima_temperatura: clima.temperatura,
          clima_umidade: clima.umidade,
          clima_vento: clima.vento,
          clima_capturado_em: new Date().toISOString(),
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

      // 3. INSERT demo_rdo_equipe_membros
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

      // 4. INSERT demo_rdo_maquinas_check
      if (maquinasArr.length > 0) {
        const checksPayload = maquinasArr.map((mc) => ({
          rdo_id: rdoId,
          maquina_id: mc.maquina_id,
          status: mc.status,
          observacao: mc.observacao || null,
        }));
        await supabase.from('demo_rdo_maquinas_check').insert(checksPayload);
      }

      // 5. POST webhook n8n
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
      } catch {
        // Falha no webhook não interrompe
      }

      router.push(`/rdo/${rdoId}/confirmacao`);
    } catch {
      showToast('Erro inesperado ao enviar o RDO.', 'error');
      setSubmitting(false);
    }
  };

  if (loadingInitial || !session) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Header Fixo */}
      <HeaderMobile
        showBack={true}
        onBack={() => {
          if (passo > 1) setPasso(passo - 1);
          else router.push('/menu');
        }}
        title={`RDO — ${dataHoje}`}
        rightBadge={`Passo ${passo} de 5`}
        rightBadgeVariant="blue"
      />

      {/* Barra Linear de Progresso */}
      <div className="w-full bg-gray-100 h-1.5">
        <div
          className="bg-blue-600 h-1.5 transition-all duration-300"
          style={{ width: `${(passo / 5) * 100}%` }}
        />
      </div>

      <main className="p-5 flex-1 space-y-6 pb-12">
        {/* =================================================== */}
        {/* PASSO 1 — Identificação & Clima                     */}
        {/* =================================================== */}
        {passo === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Identificação da Obra</h2>
              <p className="text-xs text-gray-500 mt-1">
                Informações automáticas do trecho e do clima
              </p>
            </div>

            <Card className="bg-gray-50 border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  📋
                </div>
                <div>
                  <div className="text-[11px] uppercase font-bold text-gray-400">Trecho Vinculado</div>
                  <div className="text-sm font-bold text-gray-900">{session.trecho_nome}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  📅
                </div>
                <div>
                  <div className="text-[11px] uppercase font-bold text-gray-400">Data de Registro</div>
                  <div className="text-sm font-bold text-gray-900">{dataHoje}</div>
                </div>
              </div>
            </Card>

            {/* Turno */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                🕐 Turno de Trabalho *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['manha', 'tarde', 'noite'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTurno(t)}
                    className={cn(
                      'py-3 rounded-xl border text-sm font-bold capitalize transition-all active:scale-95',
                      turno === t
                        ? 'border-2 border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {t === 'manha' ? 'Manhã' : t === 'tarde' ? 'Tarde' : 'Noite'}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Clima */}
            <Card className="p-5 border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Condições Climáticas
                </span>
                <Badge variant="blue" className="flex items-center gap-1">
                  <CloudSun className="w-3.5 h-3.5 text-blue-600" />
                  <span>Clima automático</span>
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500">Temperatura</div>
                  <div className="text-lg font-black text-gray-900 mt-0.5">{clima.temperatura}°C</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500">Umidade</div>
                  <div className="text-lg font-black text-gray-900 mt-0.5">{clima.umidade}%</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500">Vento</div>
                  <div className="text-lg font-black text-gray-900 mt-0.5">{clima.vento} km/h</div>
                </div>
              </div>

              <div className="text-xs text-gray-600 text-center font-medium pt-1">
                Condição: <strong className="text-gray-900">{clima.condicao}</strong>
              </div>
            </Card>

            <Button
              size="lg"
              onClick={() => setPasso(2)}
              className="w-full py-4 text-base font-bold shadow-md shadow-blue-500/20"
            >
              Próximo: Equipe
            </Button>
          </div>
        )}

        {/* =================================================== */}
        {/* PASSO 2 — Equipe (QR Code do crachá)                 */}
        {/* =================================================== */}
        {passo === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Registrar Equipe</h2>
              <p className="text-xs text-gray-500 mt-1">
                Fotografe o crachá de cada colaborador para leitura do QR Code
              </p>
            </div>

            <input
              ref={crachaInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCrachaFile}
              className="hidden"
            />

            {/* Botão Principal Fotografar Crachá */}
            <button
              type="button"
              disabled={uploadingCracha}
              onClick={() => crachaInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-gray-50/50 hover:bg-blue-50/30 transition-all active:scale-[0.99]"
            >
              {uploadingCracha ? (
                <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <QrCode className="w-9 h-9 text-gray-400" />
                </div>
              )}
              <div className="text-center">
                <span className="text-sm font-bold text-gray-700 block">
                  {uploadingCracha ? 'Processando crachá...' : 'Fotografar Crachá'}
                </span>
                <span className="text-xs text-gray-400">
                  Câmera com foco automático no QR Code
                </span>
              </div>
            </button>

            {/* Atalhos Rápidos Demo */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-gray-500 font-semibold">
                <span>Ou adicione membros da equipe demo:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => adicionarExemploEquipe('Antônio Santos', 'Operador de Escavadeira')}
                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-blue-400 hover:text-blue-600 active:scale-95 font-medium transition-colors"
                >
                  + Antônio (Op. Escavadeira)
                </button>
                <button
                  type="button"
                  onClick={() => adicionarExemploEquipe('Sebastião Costa', 'Motorista de Basculante')}
                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-blue-400 hover:text-blue-600 active:scale-95 font-medium transition-colors"
                >
                  + Sebastião (Motorista)
                </button>
                <button
                  type="button"
                  onClick={() => adicionarExemploEquipe('Raimundo Nonato', 'Ajudante Geral')}
                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-blue-400 hover:text-blue-600 active:scale-95 font-medium transition-colors"
                >
                  + Raimundo (Ajudante)
                </button>
              </div>
            </div>

            {/* Lista de Membros Adicionados */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-600">
                <span>Colaboradores Presentes</span>
                <span className="text-blue-600">{equipe.length} registrado(s)</span>
              </div>

              {equipe.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 border border-dashed rounded-xl">
                  Nenhum colaborador adicionado ainda. Fotografe um crachá ou use os atalhos acima.
                </div>
              ) : (
                <div className="space-y-2">
                  {equipe.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {m.foto_cracha_url ? (
                          <img
                            src={m.foto_cracha_url}
                            alt={m.nome}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {m.nome.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-gray-900">{m.nome}</div>
                          <div className="text-xs text-gray-500 font-medium">
                            {m.funcao} {m.matricula && `• ${m.matricula}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="green" className="text-[10px]">
                          Presente
                        </Badge>
                        <button
                          type="button"
                          onClick={() => setEquipe((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Manual Fallback */}
            {showManualModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-sm bg-white p-6 space-y-4">
                  <h3 className="text-base font-bold text-gray-900">
                    Dados do Colaborador
                  </h3>
                  <p className="text-xs text-gray-500">
                    O QR code não pôde ser lido automaticamente. Preencha os dados abaixo:
                  </p>
                  <Input
                    label="Nome Completo *"
                    value={manualNome}
                    onChange={(e) => setManualNome(e.target.value)}
                    placeholder="Ex: João da Silva"
                  />
                  <Input
                    label="Função *"
                    value={manualFuncao}
                    onChange={(e) => setManualFuncao(e.target.value)}
                    placeholder="Ex: Operador de Rolo"
                  />
                  <Input
                    label="Matrícula"
                    value={manualMatricula}
                    onChange={(e) => setManualMatricula(e.target.value)}
                    placeholder="Ex: MAT-1020"
                  />
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowManualModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button className="flex-1" onClick={salvarManual}>
                      Confirmar
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            <Button
              size="lg"
              disabled={equipe.length === 0}
              onClick={() => setPasso(3)}
              className="w-full py-4 text-base font-bold shadow-md shadow-blue-500/20"
            >
              Próximo: Máquinas ({equipe.length} colaborador{equipe.length > 1 ? 'es' : ''})
            </Button>
          </div>
        )}

        {/* =================================================== */}
        {/* PASSO 3 — Checklist de Máquinas                     */}
        {/* =================================================== */}
        {passo === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Checklist de Máquinas</h2>
              <p className="text-xs text-gray-500 mt-1">
                Informe o status operacional de cada equipamento do trecho
              </p>
            </div>

            <div className="space-y-3">
              {catalogoMaquinas.map((maq) => {
                const current = maquinasCheck[maq.id];
                const status = current?.status;

                const setStatus = (st: MaquinaCheck['status']) => {
                  setMaquinasCheck((prev) => ({
                    ...prev,
                    [maq.id]: {
                      status: prev[maq.id]?.status === st ? undefined! : st,
                      observacao: prev[maq.id]?.observacao || '',
                    },
                  }));
                };

                const setObs = (obs: string) => {
                  setMaquinasCheck((prev) => ({
                    ...prev,
                    [maq.id]: {
                      ...prev[maq.id],
                      observacao: obs,
                    },
                  }));
                };

                return (
                  <Card key={maq.id} className="p-4 border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                          <Truck className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{maq.nome}</div>
                          <div className="text-xs text-gray-400 font-medium">{maq.codigo}</div>
                        </div>
                      </div>
                    </div>

                    {/* 4 Botões Status em Linha */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {/* Operando */}
                      <button
                        type="button"
                        onClick={() => setStatus('operando')}
                        className={cn(
                          'h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 border',
                          status === 'operando'
                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        )}
                      >
                        <span>✅</span>
                        <span className="hidden sm:inline">Operando</span>
                      </button>

                      {/* Parada */}
                      <button
                        type="button"
                        onClick={() => setStatus('parada')}
                        className={cn(
                          'h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 border',
                          status === 'parada'
                            ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        )}
                      >
                        <span>⏸️</span>
                        <span className="hidden sm:inline">Parada</span>
                      </button>

                      {/* Manutenção */}
                      <button
                        type="button"
                        onClick={() => setStatus('manutencao')}
                        className={cn(
                          'h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 border',
                          status === 'manutencao'
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        )}
                      >
                        <span>🔧</span>
                        <span className="hidden sm:inline">Manut.</span>
                      </button>

                      {/* Ausente */}
                      <button
                        type="button"
                        onClick={() => setStatus('ausente')}
                        className={cn(
                          'h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 border',
                          status === 'ausente'
                            ? 'bg-gray-600 text-white border-gray-600 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        )}
                      >
                        <span>➖</span>
                        <span className="hidden sm:inline">Ausente</span>
                      </button>
                    </div>

                    {/* Observação se Parada ou Manutenção */}
                    {(status === 'parada' || status === 'manutencao') && (
                      <div className="pt-2 animate-in fade-in duration-150">
                        <input
                          type="text"
                          placeholder={`Motivo da ${status === 'parada' ? 'parada' : 'manutenção'}...`}
                          value={current?.observacao || ''}
                          onChange={(e) => setObs(e.target.value)}
                          className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            <Button
              size="lg"
              onClick={() => setPasso(4)}
              className="w-full py-4 text-base font-bold shadow-md shadow-blue-500/20"
            >
              Próximo: Fotos do Dia
            </Button>
          </div>
        )}

        {/* =================================================== */}
        {/* PASSO 4 — Fotos do Dia & Atividades                 */}
        {/* =================================================== */}
        {passo === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Registro Fotográfico</h2>
              <p className="text-xs text-gray-500 mt-1">
                Fotografe as frentes de serviço e o andamento das atividades
              </p>
            </div>

            <input
              ref={fotosInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFotoDia}
              className="hidden"
            />

            {/* Botão Câmera Dashed Border */}
            <button
              type="button"
              disabled={uploadingFotoDia}
              onClick={() => fotosInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-gray-50/50 hover:bg-blue-50/30 transition-all active:scale-[0.99]"
            >
              {uploadingFotoDia ? (
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-blue-600" />
              )}
              <span className="text-sm font-bold text-gray-700">
                {uploadingFotoDia ? 'Enviando foto...' : 'Adicionar foto do dia'}
              </span>
              <span className="text-xs text-gray-400">
                Mínimo de 1 foto obrigatória
              </span>
            </button>

            {/* Grid 2 colunas com previews */}
            {fotosDia.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {fotosDia.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-sm group"
                  >
                    <img
                      src={url}
                      alt={`Foto do dia ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFotosDia((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Textarea Atividades */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Descreva as atividades executadas hoje *
              </label>
              <textarea
                rows={5}
                value={atividades}
                onChange={(e) => setAtividades(e.target.value)}
                placeholder="Ex: Concretagem da laje do bloco A, escavação para fundação do bloco B, terraplenagem do km 14 ao 16..."
                className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                required
              />
            </div>

            <Button
              size="lg"
              disabled={fotosDia.length === 0 || !atividades.trim()}
              onClick={() => setPasso(5)}
              className="w-full py-4 text-base font-bold shadow-md shadow-blue-500/20"
            >
              Próximo: Assinatura e Envio
            </Button>
          </div>
        )}

        {/* =================================================== */}
        {/* PASSO 5 — Assinatura & Envio                         */}
        {/* =================================================== */}
        {passo === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Assinatura do Encarregado</h2>
              <p className="text-xs text-gray-500 mt-1">
                Revise o resumo e assine digitalmente para transmitir o relatório
              </p>
            </div>

            {/* Card Resumo */}
            <Card className="bg-gray-50 border-gray-200 p-5 space-y-2.5 text-xs text-gray-700">
              <div className="flex justify-between font-medium">
                <span className="text-gray-500">Trecho:</span>
                <span className="font-bold text-gray-900">{session.trecho_nome}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-500">Data & Turno:</span>
                <span className="font-bold text-gray-900">{dataHoje} • {turno.toUpperCase()}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-500">Clima:</span>
                <span className="font-bold text-gray-900">{clima.condicao} ({clima.temperatura}°C)</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-500">Equipe Presente:</span>
                <span className="font-bold text-blue-700">{equipe.length} colaboradores</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-500">Máquinas Verificadas:</span>
                <span className="font-bold text-blue-700">
                  {Object.values(maquinasCheck).filter((m) => m.status).length} equipamentos
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-500">Fotos Anexadas:</span>
                <span className="font-bold text-blue-700">{fotosDia.length} fotos</span>
              </div>
            </Card>

            {/* Canvas Assinatura */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Assine com o dedo *
                </label>
                {hasAssinatura && (
                  <button
                    type="button"
                    onClick={limparAssinatura}
                    className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-inner touch-none">
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[180px] cursor-crosshair bg-white"
                />
              </div>
            </div>

            {/* GPS Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-700">Georreferenciamento:</span>
              </div>
              <Badge variant="green" className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Localização confirmada</span>
              </Badge>
            </div>

            {/* Botão Enviar RDO */}
            <Button
              size="lg"
              loading={submitting}
              disabled={!hasAssinatura || submitting}
              onClick={handleEnviarRDO}
              className="w-full py-4 text-base font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span>Enviar RDO</span>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
