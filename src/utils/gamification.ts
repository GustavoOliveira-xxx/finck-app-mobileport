import { NivelDef, ConquistaDef } from '../types';

export const REGRAS_XP = {
  novaEntrada: 25,
  novaSaida: 10,
  novaMeta: 15,
  metaConcluida: 50,
  perfilCompleto: 30,
  primeiroAcesso: 5,
  analiseConsultada: 5,
  relatorioGerado: 10,
  streakDiario: 10,
};

export const REGRAS_NIVEIS: NivelDef[] = [
  { nivel: 1, xpNecessario: 0, nome: 'CK Newbie 🆕' },
  { nivel: 2, xpNecessario: 100, nome: 'Conscious Planner 📝' },
  { nivel: 3, xpNecessario: 300, nome: 'Financial Thinker 💡' },
  { nivel: 4, xpNecessario: 600, nome: "Stark's Investor 🚀" },
  { nivel: 5, xpNecessario: 1000, nome: 'Economy "Knowledgist" 📚' },
  { nivel: 6, xpNecessario: 1500, nome: 'Norman Osborn 🕷️' },
  { nivel: 7, xpNecessario: 2100, nome: 'Golden Seeker 🏆' },
  { nivel: 8, xpNecessario: 2800, nome: "Fisk's Counter ⚖️" },
  { nivel: 9, xpNecessario: 3600, nome: 'Fantastic Richards 🔬' },
  { nivel: 10, xpNecessario: 4500, nome: 'The Miner ⛏️' },
  { nivel: 11, xpNecessario: 5500, nome: 'The Philanthropist 🤝' },
  { nivel: 12, xpNecessario: 6600, nome: 'Wealth Keeper 💰' },
  { nivel: 13, xpNecessario: 7800, nome: 'The Future Guardian 🛡️' },
  { nivel: 14, xpNecessario: 9100, nome: 'Wilson Fisk 👑' },
  { nivel: 15, xpNecessario: 10500, nome: 'Lex Luthor 🦅' },
  { nivel: 16, xpNecessario: 12000, nome: "CK's Bruce Wayne 🦇" },
  { nivel: 17, xpNecessario: 13600, nome: 'Tony Stark 🤖' },
  { nivel: 18, xpNecessario: 15300, nome: "EconomisT'Challa 🐆" },
  { nivel: 19, xpNecessario: 17100, nome: 'The Future Doctor Doom 🎭' },
  { nivel: 20, xpNecessario: 19000, nome: 'THE TRUE CK ZEMO ⚔️' },
];

export const CONQUISTAS: Record<string, ConquistaDef> = {
  primeira_entrada: { id: 'primeira_entrada', nome: 'Primeiro Dinheiro Registrado', descricao: 'Cadastre sua primeira entrada', icone: '💰' },
  primeira_saida: { id: 'primeira_saida', nome: 'Primeiro Gasto Registrado', descricao: 'Cadastre sua primeira saída', icone: '💸' },
  primeira_meta: { id: 'primeira_meta', nome: 'Definindo Objetivos', descricao: 'Crie sua primeira meta', icone: '🎯' },
  meta_concluida: { id: 'meta_concluida', nome: 'Missão Cumprida', descricao: 'Conclua sua primeira meta', icone: '✅' },
  perfil_completo: { id: 'perfil_completo', nome: 'Identidade Definida', descricao: 'Complete todos os dados do perfil', icone: '👤' },
  streak_7dias: { id: 'streak_7dias', nome: 'Economista por 7 Dias', descricao: 'Use o app por 7 dias consecutivos', icone: '🔥' },
  saldo_positivo: { id: 'saldo_positivo', nome: 'Saldo Positivo Mês a Mês', descricao: 'Mantenha saldo positivo por 1 mês', icone: '📈' },
  mestre_financas: { id: 'mestre_financas', nome: 'Mestre das Finanças', descricao: 'Alcance o nível 10', icone: '🏅' },
};

export function calcularNivelPorXP(xp: number): NivelDef {
  let atual = REGRAS_NIVEIS[0];
  for (let i = REGRAS_NIVEIS.length - 1; i >= 0; i--) {
    if (xp >= REGRAS_NIVEIS[i].xpNecessario) {
      atual = REGRAS_NIVEIS[i];
      break;
    }
  }
  return atual;
}

export function getProgressoNivel(xp: number, nivelAtual: number) {
  const proximo = REGRAS_NIVEIS.find(n => n.nivel === nivelAtual + 1);
  const atualDados = REGRAS_NIVEIS.find(n => n.nivel === nivelAtual) || REGRAS_NIVEIS[0];
  if (!proximo) {
    return { percentual: 100, xpNoNivel: xp - atualDados.xpNecessario, totalNecessario: 0, proximo: null };
  }
  const totalNecessario = proximo.xpNecessario - atualDados.xpNecessario;
  const xpNoNivel = xp - atualDados.xpNecessario;
  const percentual = Math.min(100, Math.round((xpNoNivel / totalNecessario) * 100));
  return { percentual, xpNoNivel, totalNecessario, proximo };
}
