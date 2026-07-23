import React from 'react';
import { GamificacaoState } from '../types';
import { Header } from './Header';
import {
  REGRAS_NIVEIS,
  CONQUISTAS,
  calcularNivelPorXP,
  getProgressoNivel,
} from '../utils/gamification';

interface GamificacaoScreenProps {
  gamificacao: GamificacaoState;
  onSair?: () => void;
}

export const GamificacaoScreen: React.FC<GamificacaoScreenProps> = ({ gamificacao, onSair }) => {
  const infoNivel = calcularNivelPorXP(gamificacao.xp);
  const progresso = getProgressoNivel(gamificacao.xp, infoNivel.nivel);

  const regrasXPLista = [
    ['+25 XP', 'Ao cadastrar uma Entrada'],
    ['+10 XP', 'Ao registrar uma Saída'],
    ['+15 XP', 'Ao criar uma Meta'],
    ['+50 XP', 'Ao concluir uma Meta'],
    ['+30 XP', 'Ao completar seu perfil'],
    ['+10 XP', 'Ao gerar um Relatório'],
    ['+5 XP', 'Ao consultar Análises'],
    ['+10 XP', 'Ao usar o app em dias consecutivos'],
  ];

  return (
    <div className="space-y-5 pb-12">
      <Header
        subtitulo="Controle Financeiro Inteligente"
        badge={`⭐ Nível ${infoNivel.nivel}`}
        onSair={onSair}
      />

      <div className="bg-[#1c1626] border border-white/15 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center gap-5 glow-yellow">
        <div className="w-20 h-20 rounded-full bg-[#fec800] text-[#08070b] flex items-center justify-center font-black text-3xl shadow-xl shrink-0">
          {infoNivel.nivel}
        </div>
        <div className="flex-1 text-center sm:text-left w-full space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-[#fec800]">{infoNivel.nome}</h2>
          <p className="text-xs text-[#9b93a8]">
            {progresso.proximo
              ? `${progresso.xpNoNivel} de ${progresso.totalNecessario} XP para o próximo nível`
              : 'Nível máximo alcançado! 🏆'}
          </p>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#fec800] h-full rounded-full transition-all duration-500"
              style={{ width: `${progresso.percentual}%` }}
            />
          </div>
          <div className="flex items-center justify-around pt-2 text-xs">
            <div>
              <p className="text-[#9b93a8]">Total Acumulado</p>
              <p className="font-bold text-[#fec800] text-sm mt-0.5">{gamificacao.xp} XP</p>
            </div>
            <div>
              <p className="text-[#9b93a8]">Próximo Nível</p>
              <p className="font-bold text-[#fec800] text-sm mt-0.5">
                {progresso.proximo ? `${progresso.proximo.xpNecessario} XP` : 'MAX'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-3">✨ Como ganhar XP</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {regrasXPLista.map(([xp, desc], i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs sm:text-sm"
            >
              <span className="font-bold text-[#1fd18f] min-w-[55px]">{xp}</span>
              <span className="text-white/90">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-3">🏅 Conquistas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Object.entries(CONQUISTAS).map(([id, c]) => {
            const desbloqueada = !!gamificacao.conquistas[id];
            return (
              <div
                key={id}
                className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                  desbloqueada
                    ? 'bg-white/5 border-[#fec800]/40 glow-yellow'
                    : 'bg-white/5 border-white/5 opacity-40'
                }`}
              >
                <span className="text-3xl mb-1.5">{desbloqueada ? c.icone : '🔒'}</span>
                <p className="font-bold text-xs text-white leading-tight">{c.nome}</p>
                <p className="text-[10px] text-[#9b93a8] mt-1 leading-tight">{c.descricao}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-3">📚 Catálogo de Níveis</h3>
        <div className="space-y-2">
          {REGRAS_NIVEIS.map((n) => {
            const ehAtual = n.nivel === infoNivel.nivel;
            return (
              <div
                key={n.nivel}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  ehAtual
                    ? 'bg-[#fec800]/10 border-[#fec800] border-l-4'
                    : 'bg-white/5 border-white/5'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#fec800]/15 text-[#fec800] font-bold text-xs flex items-center justify-center shrink-0">
                  {n.nivel}
                </div>
                <p className="font-medium text-xs sm:text-sm text-white flex-1">{n.nome}</p>
                <span className="text-xs text-[#9b93a8]">
                  {n.xpNecessario.toLocaleString('pt-BR')} XP
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
