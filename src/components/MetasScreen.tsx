import React, { useState, useMemo, useEffect } from 'react';
import { Meta, Transacao, TipoMeta } from '../types';
import { Header } from './Header';
import { formatarMoeda, formatarData, gerarId, hojeISO } from '../utils/formatters';
import { REGRAS_XP } from '../utils/gamification';
import { Plus, X, Target, Trash2, Edit2, ArrowRightLeft } from 'lucide-react';

interface MetasScreenProps {
  metas: Meta[];
  setMetas: (m: Meta[]) => void;
  transacoes: Transacao[];
  setTransacoes?: (t: Transacao[]) => void;
  ganharXP: (valor: number, motivo: string) => void;
  desbloquearConquista: (id: string) => void;
  mostrarAviso: (texto: string, tipo?: 'sucesso' | 'erro' | 'info') => void;
  onSair: () => void;
}

export const MetasScreen: React.FC<MetasScreenProps> = ({
  metas,
  setMetas,
  transacoes,
  setTransacoes,
  ganharXP,
  desbloquearConquista,
  mostrarAviso,
  onSair,
}) => {
  const [modalMetaOpen, setModalMetaOpen] = useState(false);
  const [metaEdicao, setMetaEdicao] = useState<Meta | null>(null);
  const [modalAporteOpen, setModalAporteOpen] = useState(false);
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState<Meta | null>(null);
  const [valorAporte, setValorAporte] = useState('');

  const [nome, setNome] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [valorInicial, setValorInicial] = useState('');
  const [dataLimite, setDataLimite] = useState('');
  const [tipoRent, setTipoRent] = useState<TipoMeta>('simples');
  const [taxa, setTaxa] = useState('');

  useEffect(() => {
    if (metaEdicao) {
      setNome(metaEdicao.nome);
      setValorTotal(String(metaEdicao.valorTotal));
      setValorInicial(String(metaEdicao.valorAtual));
      setDataLimite(metaEdicao.dataLimite);
      setTipoRent(metaEdicao.tipo);
      setTaxa(String(metaEdicao.taxa || ''));
    } else {
      setNome('');
      setValorTotal('');
      setValorInicial('');
      setDataLimite('');
      setTipoRent('simples');
      setTaxa('');
    }
  }, [metaEdicao, modalMetaOpen]);

  const saldoDisponivel = useMemo(() => {
    let e = 0;
    let s = 0;
    transacoes.forEach((t) => {
      if (t.tipo === 'entrada') e += Number(t.valor);
      else s += Number(t.valor);
    });
    return e - s;
  }, [transacoes]);

  const resumo = useMemo(() => {
    let reservado = 0;
    let rendendo = 0;
    let falta = 0;
    metas.forEach((m) => {
      reservado += Number(m.valorAtual);
      if (m.tipo === 'cdb') rendendo += Number(m.valorAtual);
      falta += Math.max(0, Number(m.valorTotal) - Number(m.valorAtual));
    });
    return { reservado, rendendo, falta };
  }, [metas]);

  const calcularMeses = (dataLimiteStr: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fim = new Date(dataLimiteStr + 'T00:00:00');
    fim.setHours(0, 0, 0, 0);
    if (isNaN(fim.getTime()) || fim < hoje) return 0;
    return Math.max(0, (fim.getFullYear() - hoje.getFullYear()) * 12 + (fim.getMonth() - hoje.getMonth()));
  };

  const calcularValorMensal = (faltaVal: number, meses: number, taxaMensalVal = 0) => {
    if (meses <= 0) return faltaVal;
    if (taxaMensalVal <= 0) return faltaVal / meses;
    const taxaDec = taxaMensalVal / 100;
    return faltaVal / (((Math.pow(1 + taxaDec, meses) - 1) / taxaDec) * (1 + taxaDec));
  };

  const salvarMeta = (e: React.FormEvent) => {
    e.preventDefault();
    const vt = parseFloat(valorTotal.replace(',', '.'));
    if (!nome.trim()) {
      mostrarAviso('Informe o nome da meta.', 'erro');
      return;
    }
    if (isNaN(vt) || vt <= 0) {
      mostrarAviso('Informe um valor total válido.', 'erro');
      return;
    }
    if (!dataLimite) {
      mostrarAviso('Informe a data limite.', 'erro');
      return;
    }

    const novaOuEditada: Meta = {
      id: metaEdicao?.id || gerarId(),
      nome: nome.trim(),
      valorTotal: vt,
      valorAtual: parseFloat(valorInicial.replace(',', '.')) || 0,
      dataLimite,
      tipo: tipoRent,
      taxa: tipoRent === 'cdb' ? parseFloat(taxa.replace(',', '.')) || 0 : 0,
      dataCriacao: metaEdicao?.dataCriacao || new Date().toISOString(),
    };

    if (metaEdicao) {
      setMetas(metas.map((m) => (m.id === novaOuEditada.id ? novaOuEditada : m)));
      mostrarAviso('Meta atualizada com sucesso!', 'sucesso');
    } else {
      setMetas([...metas, novaOuEditada]);
      ganharXP(REGRAS_XP.novaMeta, 'Criou uma nova meta!');
      desbloquearConquista('primeira_meta');
      mostrarAviso('Meta cadastrada com sucesso!', 'sucesso');
    }

    setModalMetaOpen(false);
    setMetaEdicao(null);
  };

  const abrirAporte = (m: Meta) => {
    setMetaSelecionada(m);
    setValorAporte('');
    setModalAporteOpen(true);
  };

  const confirmarAporte = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valorAporte.replace(',', '.'));
    if (!metaSelecionada || isNaN(val) || val <= 0) return;

    const jaConcluida = metaSelecionada.valorAtual / metaSelecionada.valorTotal >= 0.999;
    const novoValor = Number(metaSelecionada.valorAtual) + val;
    const agoraConcluida = novoValor / metaSelecionada.valorTotal >= 0.999;

    setMetas(
      metas.map((m) => (m.id === metaSelecionada.id ? { ...m, valorAtual: novoValor } : m))
    );

    if (setTransacoes) {
      const nova: Transacao = {
        id: gerarId(),
        valor: val,
        descricao: `Aporte/Transferência para meta: ${metaSelecionada.nome}`,
        data: hojeISO(),
        tipo: 'entrada',
        metaId: metaSelecionada.id,
      };
      setTransacoes([nova, ...transacoes]);
    }

    mostrarAviso(`Valor adicionado à meta! Saldo da meta: R$ ${formatarMoeda(novoValor)}`, 'sucesso');

    if (!jaConcluida && agoraConcluida) {
      ganharXP(REGRAS_XP.metaConcluida, `Meta "${metaSelecionada.nome}" concluída!`);
      desbloquearConquista('meta_concluida');
    }
    setModalAporteOpen(false);
  };

  const excluirMeta = (id: string) => {
    setMetas(metas.filter((m) => m.id !== id));
    setModalDetalhesOpen(false);
    mostrarAviso('Meta removida com sucesso!', 'info');
  };

  return (
    <div className="space-y-5 pb-12">
      <Header subtitulo="Metas Financeiras" onSair={onSair} />

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Minhas Metas</h2>
        <p className="text-xs sm:text-sm text-[#9b93a8]">
          Defina objetivos e acompanhe seu progresso com rendimentos
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-[#141019] border border-white/10 rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-bold text-[#9b93a8] uppercase">RESERVADO</p>
          <p className="text-xs sm:text-lg font-bold text-white mt-1">
            R$ {formatarMoeda(resumo.reservado)}
          </p>
        </div>
        <div className="bg-[#141019] border border-white/10 rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-bold text-[#9b93a8] uppercase">RENDENDO</p>
          <p className="text-xs sm:text-lg font-bold text-[#1fd18f] mt-1">
            R$ {formatarMoeda(resumo.rendendo)}
          </p>
        </div>
        <div className="bg-[#141019] border border-white/10 rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-bold text-[#9b93a8] uppercase">FALTANTE</p>
          <p className="text-xs sm:text-lg font-bold text-[#fec800] mt-1">
            R$ {formatarMoeda(resumo.falta)}
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          setMetaEdicao(null);
          setModalMetaOpen(true);
        }}
        className="w-full py-3 bg-[#fec800] text-[#08070b] font-bold text-sm rounded-xl hover:bg-[#ffdf5c] transition-colors flex items-center justify-center gap-2 shadow-lg glow-yellow"
      >
        <Plus className="w-5 h-5" />
        <span>Nova Meta</span>
      </button>

      <div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-3">Suas Metas</h3>
        {metas.length === 0 ? (
          <div className="p-8 border border-dashed border-white/15 rounded-xl text-center bg-[#141019]">
            <Target className="w-8 h-8 text-[#9b93a8] mx-auto mb-2 opacity-50" />
            <p className="text-xs text-[#6b6478]">
              Nenhuma meta cadastrada. Comece agora mesmo definindo seus objetivos!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {metas.map((meta) => {
              const progresso = Math.min(100, Math.max(0, (meta.valorAtual / meta.valorTotal) * 100));
              const meses = calcularMeses(meta.dataLimite);
              const concluida = progresso >= 99.9;

              return (
                <div
                  key={meta.id}
                  className={`bg-[#141019] border rounded-2xl p-4 sm:p-5 transition-all ${
                    concluida ? 'border-[#1fd18f]/50 glow-green' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white text-base truncate">{meta.nome}</h4>
                    <div className="flex items-center gap-2">
                      {meta.tipo === 'cdb' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#9333c4]/20 text-[#9333c4] border border-[#9333c4]/30">
                          +{Number(meta.taxa).toFixed(2)}% a.m.
                        </span>
                      )}
                      {concluida && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1fd18f]/20 text-[#1fd18f] border border-[#1fd18f]/30">
                          ✅ Concluída
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden my-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        concluida ? 'bg-[#1fd18f]' : 'bg-[#9333c4]'
                      }`}
                      style={{ width: `${progresso}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#9b93a8] my-1">
                    <span>Progresso: {progresso.toFixed(1)}%</span>
                    <span>{meses > 0 ? `${meses} meses restantes` : 'Prazo vencido'}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm my-3">
                    <span className="font-bold text-white">R$ {formatarMoeda(meta.valorAtual)}</span>
                    <span className="text-[#9b93a8]">de R$ {formatarMoeda(meta.valorTotal)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => abrirAporte(meta)}
                      className="py-2 px-3 bg-[#1fd18f]/15 hover:bg-[#1fd18f]/25 text-[#1fd18f] border border-[#1fd18f]/30 font-bold text-xs rounded-lg transition-colors"
                    >
                      + Adicionar
                    </button>
                    <button
                      onClick={() => {
                        setMetaSelecionada(meta);
                        setModalDetalhesOpen(true);
                      }}
                      className="py-2 px-3 bg-white/5 hover:bg-white/10 text-[#9b93a8] border border-white/10 font-bold text-xs rounded-lg transition-colors"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalMetaOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-[#1c1626] border border-white/15 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalMetaOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-[#9b93a8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              {metaEdicao ? 'Editar Meta' : 'Nova Meta'}
            </h3>

            <form onSubmit={salvarMeta} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                  NOME DA META
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reserva de Emergência"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                  VALOR TOTAL (R$)
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                  VALOR INICIAL (R$)
                </label>
                <input
                  type="text"
                  placeholder="0,00 (opcional)"
                  value={valorInicial}
                  onChange={(e) => setValorInicial(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                  DATA LIMITE (AAAA-MM-DD)
                </label>
                <input
                  type="date"
                  value={dataLimite}
                  onChange={(e) => setDataLimite(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1.5 uppercase">
                  TIPO DE INVESTIMENTO
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoRent('simples')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      tipoRent === 'simples'
                        ? 'bg-[#fec800] text-[#08070b] border-[#fec800] font-bold'
                        : 'bg-white/5 text-[#9b93a8] border-white/10'
                    }`}
                  >
                    Sem rendimento
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoRent('cdb')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      tipoRent === 'cdb'
                        ? 'bg-[#fec800] text-[#08070b] border-[#fec800] font-bold'
                        : 'bg-white/5 text-[#9b93a8] border-white/10'
                    }`}
                  >
                    CDB / Poupança
                  </button>
                </div>
              </div>

              {tipoRent === 'cdb' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                    TAXA MENSAL (%)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 0.8"
                    value={taxa}
                    onChange={(e) => setTaxa(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#fec800] text-[#08070b] font-bold text-sm rounded-lg hover:bg-[#ffdf5c] transition-colors"
              >
                Salvar Meta
              </button>
            </form>
          </div>
        </div>
      )}

      {modalAporteOpen && metaSelecionada && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1c1626] border border-white/15 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setModalAporteOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-[#9b93a8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Adicionar Valor</h3>
            <p className="text-xs text-[#9b93a8] mb-4">
              Meta: <span className="text-white font-bold">{metaSelecionada.nome}</span>
            </p>

            <form onSubmit={confirmarAporte} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                  VALOR A ADICIONAR (R$)
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={valorAporte}
                  onChange={(e) => setValorAporte(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1fd18f] text-[#08070b] font-bold text-sm rounded-lg hover:bg-[#1fd18f]/90 transition-colors"
              >
                Adicionar
              </button>
            </form>
          </div>
        </div>
      )}

      {modalDetalhesOpen && metaSelecionada && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#1c1626] border border-white/15 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalDetalhesOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-[#9b93a8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const progresso = Math.min(
                100,
                Math.max(0, (metaSelecionada.valorAtual / metaSelecionada.valorTotal) * 100)
              );
              const meses = calcularMeses(metaSelecionada.dataLimite);
              const falta = Math.max(0, metaSelecionada.valorTotal - metaSelecionada.valorAtual);
              const valorMensal = calcularValorMensal(falta, meses, metaSelecionada.taxa || 0);

              return (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">{metaSelecionada.nome}</h3>

                  <div className="text-center py-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-4xl font-extrabold text-[#1fd18f]">{progresso.toFixed(0)}%</p>
                    <p className="text-xs text-[#9b93a8] mt-1 mb-2">alcançado</p>
                    <div className="w-4/5 mx-auto bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#1fd18f] h-full rounded-full"
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-[#9b93a8] mb-1">Valor Total</p>
                      <p className="font-bold text-white text-sm">
                        R$ {formatarMoeda(metaSelecionada.valorTotal)}
                      </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-[#9b93a8] mb-1">Valor Atual</p>
                      <p className="font-bold text-white text-sm">
                        R$ {formatarMoeda(metaSelecionada.valorAtual)}
                      </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-[#9b93a8] mb-1">Falta</p>
                      <p className="font-bold text-white text-sm">
                        R$ {formatarMoeda(falta)}
                      </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-[#9b93a8] mb-1">Aporte Mensal</p>
                      <p className="font-bold text-white text-sm">
                        {meses > 0 ? `R$ ${formatarMoeda(valorMensal)}` : '—'}
                      </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-[#9b93a8] mb-1">Data Limite</p>
                      <p className="font-bold text-white text-sm">
                        {formatarData(metaSelecionada.dataLimite)}
                      </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-[#9b93a8] mb-1">Tempo Restante</p>
                      <p className="font-bold text-white text-sm">
                        {meses > 0 ? `${meses} meses` : 'Vencido'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      onClick={() => {
                        setModalDetalhesOpen(false);
                        abrirAporte(metaSelecionada);
                      }}
                      className="py-2.5 bg-[#1fd18f] text-[#08070b] font-bold text-xs rounded-lg hover:bg-[#1fd18f]/90"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => {
                        setModalDetalhesOpen(false);
                        setMetaEdicao(metaSelecionada);
                        setModalMetaOpen(true);
                      }}
                      className="py-2.5 bg-[#9333c4] text-white font-bold text-xs rounded-lg hover:bg-[#9333c4]/90"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => excluirMeta(metaSelecionada.id)}
                      className="py-2.5 bg-red-600/80 text-white font-bold text-xs rounded-lg hover:bg-red-600"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
