import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Perfil,
  Transacao,
  Meta,
  GamificacaoState,
  AvisoToast,
  TabName,
} from './types';
import {
  STORAGE_KEYS,
  carregarItem,
  salvarItem,
  removerItens,
} from './utils/storage';
import {
  REGRAS_XP,
  CONQUISTAS,
  calcularNivelPorXP,
} from './utils/gamification';
import { hojeISO } from './utils/formatters';

import { AuthScreen } from './components/AuthScreen';
import { Navigation } from './components/Navigation';
import { ToastAviso } from './components/ToastAviso';
import { HomeScreen } from './components/HomeScreen';
import { AnalisesScreen } from './components/AnalisesScreen';
import { MetasScreen } from './components/MetasScreen';
import { RelatoriosScreen } from './components/RelatoriosScreen';
import { GamificacaoScreen } from './components/GamificacaoScreen';
import { PerfilScreen } from './components/PerfilScreen';
import { Smartphone, Monitor } from 'lucide-react';

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<TabName>('Início');
  const [modoMobile, setModoMobile] = useState(false);

  const [perfil, setPerfil] = useState<Perfil | null>(() =>
    carregarItem<Perfil | null>(STORAGE_KEYS.PERFIL, null)
  );

  const [transacoes, setTransacoes] = useState<Transacao[]>(() =>
    carregarItem<Transacao[]>(STORAGE_KEYS.TRANSACOES, [])
  );

  const [metas, setMetas] = useState<Meta[]>(() =>
    carregarItem<Meta[]>(STORAGE_KEYS.METAS, [])
  );

  const [gamificacao, setGamificacao] = useState<GamificacaoState>(() =>
    carregarItem<GamificacaoState>(STORAGE_KEYS.GAMIFICACAO, {
      xp: 0,
      nivel: 1,
      conquistas: {},
      historico: [],
      ultimoAcesso: null,
      streakDias: 0,
    })
  );

  const [aviso, setAviso] = useState<AvisoToast | null>(null);

  useEffect(() => {
    salvarItem(STORAGE_KEYS.PERFIL, perfil);
  }, [perfil]);

  useEffect(() => {
    salvarItem(STORAGE_KEYS.TRANSACOES, transacoes);
  }, [transacoes]);

  useEffect(() => {
    salvarItem(STORAGE_KEYS.METAS, metas);
  }, [metas]);

  useEffect(() => {
    salvarItem(STORAGE_KEYS.GAMIFICACAO, gamificacao);
  }, [gamificacao]);

  const mostrarAviso = useCallback(
    (texto: string, tipo: 'sucesso' | 'erro' | 'info' = 'info') => {
      setAviso({ texto, tipo });
      setTimeout(() => {
        setAviso(null);
      }, 3200);
    },
    []
  );

  const dispararConfeti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fec800', '#680c90', '#1fd18f', '#ffdf5c'],
      });
    } catch (e) {}
  }, []);

  const ganharXP = useCallback(
    (valor: number, motivo: string) => {
      if (!valor || valor <= 0) return;
      setGamificacao((prev) => {
        const nivelAntes = calcularNivelPorXP(prev.xp).nivel;
        const novoXP = (prev.xp || 0) + valor;
        const infoNovo = calcularNivelPorXP(novoXP);
        const conquistasClonadas = { ...prev.conquistas };

        if (infoNovo.nivel > nivelAntes) {
          dispararConfeti();
          mostrarAviso(
            `🎉 Parabéns! Você subiu para o Nível ${infoNovo.nivel} — ${infoNovo.nome}!`,
            'sucesso'
          );
          if (infoNovo.nivel >= 10 && !conquistasClonadas['mestre_financas']) {
            conquistasClonadas['mestre_financas'] = {
              desbloqueadaEm: new Date().toISOString(),
            };
          }
        } else {
          mostrarAviso(`+${valor} XP: ${motivo}`, 'sucesso');
        }

        return {
          ...prev,
          xp: novoXP,
          nivel: infoNovo.nivel,
          conquistas: conquistasClonadas,
          historico: [
            { data: new Date().toISOString(), valor, motivo },
            ...(prev.historico || []),
          ].slice(0, 100),
        };
      });
    },
    [mostrarAviso, dispararConfeti]
  );

  const desbloquearConquista = useCallback(
    (id: string) => {
      if (!CONQUISTAS[id]) return;
      setGamificacao((prev) => {
        if (prev.conquistas[id]) return prev;
        dispararConfeti();
        mostrarAviso(`🏆 Conquista Desbloqueada: ${CONQUISTAS[id].nome}!`, 'sucesso');
        return {
          ...prev,
          conquistas: {
            ...prev.conquistas,
            [id]: { desbloqueadaEm: new Date().toISOString() },
          },
        };
      });
    },
    [mostrarAviso, dispararConfeti]
  );

  useEffect(() => {
    if (!usuarioLogado) return;
    setGamificacao((prev) => {
      const hoje = hojeISO();
      if (prev.ultimoAcesso === hoje) return prev;

      const ontem = (() => {
        const d = new Date(Date.now() - 86400000);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(d.getDate()).padStart(2, '0')}`;
      })();

      const novoStreak = prev.ultimoAcesso === ontem ? (prev.streakDias || 0) + 1 : 1;

      setTimeout(() => {
        if (novoStreak === 1) ganharXP(REGRAS_XP.primeiroAcesso, 'Acesso diário');
        else ganharXP(REGRAS_XP.streakDiario, `Streak de ${novoStreak} dias consecutivos!`);
        if (novoStreak >= 7) desbloquearConquista('streak_7dias');
      }, 500);

      return {
        ...prev,
        ultimoAcesso: hoje,
        streakDias: novoStreak,
      };
    });
  }, [usuarioLogado, ganharXP, desbloquearConquista]);

  const salvarPerfilNovo = (novoPerfil: Perfil) => {
    setPerfil(novoPerfil);
  };

  const apagarTudo = useCallback(() => {
    removerItens([
      STORAGE_KEYS.PERFIL,
      STORAGE_KEYS.TRANSACOES,
      STORAGE_KEYS.METAS,
      STORAGE_KEYS.GAMIFICACAO,
    ]);
    setPerfil(null);
    setTransacoes([]);
    setMetas([]);
    setGamificacao({
      xp: 0,
      nivel: 1,
      conquistas: {},
      historico: [],
      ultimoAcesso: null,
      streakDias: 0,
    });
    mostrarAviso('Todos os dados foram apagados.', 'info');
    setTimeout(() => setUsuarioLogado(false), 1000);
  }, [mostrarAviso]);

  const handleSair = () => {
    setUsuarioLogado(false);
    mostrarAviso('Você saiu da sua conta com sucesso.', 'info');
  };

  if (!usuarioLogado) {
    return (
      <div className="min-h-screen bg-[#08070b]">
        <AuthScreen
          perfil={perfil}
          setUsuarioLogado={setUsuarioLogado}
          salvarPerfilNovo={salvarPerfilNovo}
          mostrarAviso={mostrarAviso}
        />
        <ToastAviso aviso={aviso} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08070b] text-[#f3f0f8] flex flex-col items-center">
      <div className="w-full max-w-4xl px-4 pt-3 flex justify-end">
        <button
          onClick={() => setModoMobile(!modoMobile)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-[#141019] text-[#9b93a8] hover:text-white text-xs transition-colors"
          title="Alternar entre visualização adaptativa desktop e simulação mobile"
        >
          {modoMobile ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-[#fec800]" />
              <span>Modo Tela Cheia</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-[#fec800]" />
              <span>Simular Celular</span>
            </>
          )}
        </button>
      </div>

      <main
        className={`w-full transition-all duration-300 ${
          modoMobile
            ? 'max-w-[410px] my-4 border border-white/20 rounded-[38px] p-5 bg-[#0d0b12] shadow-2xl overflow-hidden relative pb-[110px]'
            : 'max-w-3xl px-4 sm:px-6 pt-2 pb-[110px]'
        }`}
      >
        {abaAtiva === 'Início' && (
          <HomeScreen
            perfil={perfil}
            transacoes={transacoes}
            setTransacoes={setTransacoes}
            metas={metas}
            setMetas={setMetas}
            ganharXP={ganharXP}
            desbloquearConquista={desbloquearConquista}
            mostrarAviso={mostrarAviso}
            onSair={handleSair}
          />
        )}

        {abaAtiva === 'Análises' && (
          <AnalisesScreen
            transacoes={transacoes}
            ganharXP={ganharXP}
            onSair={handleSair}
          />
        )}

        {abaAtiva === 'Metas' && (
          <MetasScreen
            metas={metas}
            setMetas={setMetas}
            transacoes={transacoes}
            setTransacoes={setTransacoes}
            ganharXP={ganharXP}
            desbloquearConquista={desbloquearConquista}
            mostrarAviso={mostrarAviso}
            onSair={handleSair}
          />
        )}

        {abaAtiva === 'Relatórios' && (
          <RelatoriosScreen
            transacoes={transacoes}
            ganharXP={ganharXP}
            mostrarAviso={mostrarAviso}
            onSair={handleSair}
          />
        )}

        {abaAtiva === 'XP' && (
          <GamificacaoScreen gamificacao={gamificacao} onSair={handleSair} />
        )}

        {abaAtiva === 'Perfil' && (
          <PerfilScreen
            perfil={perfil}
            setPerfil={setPerfil}
            transacoes={transacoes}
            setTransacoes={setTransacoes}
            metas={metas}
            setMetas={setMetas}
            gamificacao={gamificacao}
            setGamificacao={setGamificacao}
            ganharXP={ganharXP}
            desbloquearConquista={desbloquearConquista}
            mostrarAviso={mostrarAviso}
            apagarTudo={apagarTudo}
            onSair={handleSair}
          />
        )}
      </main>

      <Navigation abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} />
      <ToastAviso aviso={aviso} />
    </div>
  );
}
