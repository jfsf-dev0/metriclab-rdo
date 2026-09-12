export interface RDOUsuario {
  id: string;
  nome: string;
  chave_acesso: string;
  trecho_id?: string | null;
  trecho_nome?: string | null;
  pacote: 'lote15' | 'lote19' | string;
  cargo?: string | null;
  ativo: boolean;
}

export interface RDOSession {
  usuario_id: string;
  nome: string;
  trecho_id?: string | null;
  trecho_nome: string;
  pacote: 'lote15' | 'lote19' | string;
  cargo: string;
}

export interface EquipeMembro {
  id?: string;
  matricula?: string;
  nome: string;
  funcao: string;
  qr_raw?: string;
  foto_cracha_url?: string;
  presente: boolean;
}

export interface MaquinaCatalogo {
  id: string;
  nome: string;
  tipo?: string | null;
  codigo?: string | null;
  ativo: boolean;
}

export interface MaquinaCheck {
  maquina_id: string;
  status: 'operando' | 'parada' | 'manutencao' | 'ausente';
  observacao?: string;
}

export interface RDORegistro {
  id?: string;
  usuario_id: string;
  trecho_id?: string | null;
  data: string;
  turno: 'manha' | 'tarde' | 'noite';
  clima_condicao?: string;
  clima_temperatura?: number;
  clima_umidade?: number;
  clima_vento?: number;
  clima_capturado_em?: string;
  geolat?: number;
  geolng?: number;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  geolocated_at?: string;
  atividades?: string;
  equipe?: EquipeMembro[];
  maquinas?: MaquinaCheck[];
  fotos?: string[];
  assinatura_url?: string;
  status?: 'rascunho' | 'enviado' | 'aprovado';
  created_at?: string;
  updated_at?: string;
}

export interface RDOOcorrencia {
  id?: string;
  usuario_id: string;
  trecho_id?: string | null;
  data: string;
  tipo: 'acidente' | 'quase_acidente' | 'ambiental' | 'patrimonial' | 'operacional' | 'outro';
  descricao: string;
  gravidade: 'baixa' | 'media' | 'alta' | 'critica';
  fotos?: string[];
  geolat?: number;
  geolng?: number;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  geolocated_at?: string;
  status?: 'aberta' | 'em_analise' | 'encerrada';
  created_at?: string;
}
