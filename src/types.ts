export type TipoTransacao = 'entrada' | 'saida';

export interface Transacao {
  id: string;
  valor: number;
  descricao: string;
  data: string;
  tipo: TipoTransacao;
  metaId?: string;
}

export type TipoMeta = 'simples' | 'cdb';

export interface Meta {
  id: string;
  nome: string;
  valorTotal: number;
  valorAtual: number;
  dataLimite: string;
  tipo: TipoMeta;
  taxa?: number;
  dataCriacao: string;
}

export interface Perfil {
  nome: string;
  email: string;
  senha?: string;
  profissao?: string;
  renda?: number;
  formatoMoeda?: string;
  formatoData?: string;
}

export interface ConquistaItem {
  desbloqueadaEm?: string;
}

export interface ConquistaDef {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
}

export interface NivelDef {
  nivel: number;
  xpNecessario: number;
  nome: string;
}

export interface GamificacaoState {
  xp: number;
  nivel: number;
  conquistas: Record<string, ConquistaItem>;
  historico: Array<{ data: string; valor: number; motivo: string }>;
  ultimoAcesso: string | null;
  streakDias: number;
}

export interface AvisoToast {
  texto: string;
  tipo: 'sucesso' | 'erro' | 'info';
}

export type TabName = 'Início' | 'Análises' | 'Metas' | 'Relatórios' | 'XP' | 'Perfil';
