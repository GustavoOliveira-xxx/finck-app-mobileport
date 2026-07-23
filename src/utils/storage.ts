import { Perfil, Transacao, Meta, GamificacaoState } from '../types';

export const STORAGE_KEYS = {
  PERFIL: 'finckPerfil',
  TRANSACOES: 'finckTransacoes',
  METAS: 'finckMetas',
  GAMIFICACAO: 'finck_gamificacao',
};

export function carregarItem<T>(chave: string, valorPadrao: T): T {
  try {
    const item = localStorage.getItem(chave);
    if (item) return JSON.parse(item);
  } catch (e) {
    console.error(`Erro ao carregar ${chave}:`, e);
  }
  return valorPadrao;
}

export function salvarItem<T>(chave: string, valor: T): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (e) {
    console.error(`Erro ao salvar ${chave}:`, e);
  }
}

export function removerItens(chaves: string[]): void {
  try {
    chaves.forEach(c => localStorage.removeItem(c));
  } catch (e) {
    console.error('Erro ao remover itens:', e);
  }
}
