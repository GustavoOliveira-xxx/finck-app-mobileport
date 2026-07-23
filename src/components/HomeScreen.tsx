import React, { useState, useMemo } from 'react';
import { Perfil, Transacao, Meta, TipoTransacao } from '../types';
import { Header } from './Header';
import { formatarMoeda, formatarData, hojeISO, gerarId } from '../utils/formatters';
import { REGRAS_XP } from '../utils/gamification';
import { PlusCircle, MinusCircle, Trash2, X, ArrowRightLeft, Target } from 'lucide-react';

interface HomeScreenProps {
  perfil: Perfil | null;
  transacoes: Transacao[];
  setTransacoes: (t: Transacao[]) => void;
  metas: Meta[];
  setMetas: (m: Meta[]) => void;
  ganharXP: (valor: number, motivo: string) => void;
  desbloquearConquista: (id: string) => void;
  mostrarAviso: (texto: string, tipo?: 'sucesso' | 'erro' | 'info') => void;
  onSair: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  perfil,
  transacoes,
  setTransacoes,
  metas,
  setMetas,
  ganharXP,
  desbloquearConquista,
  mostrarAviso,
  onSair,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [modalTransferirOpen, setModalTransferirOpen] = useState(false);
  const [transacaoParaExcluir, setTransacaoParaExcluir] = useState<Transacao | null>(null);
  const [transferirMetaId, setTransferirMetaId] = useState('');
  const [valorTransferir, setValorTransferir] = useState('');

  const [tipo, setTipo] = useState<TipoTransacao>('entrada');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(hojeISO());
  const [metaId, setMetaId] = useState('');
  const [dadosParaSalvar, setDadosParaSalvar] = useState<{
    valor: number;
    descricao: string;
    data: string;
    tipo: TipoTransacao;
    metaId?: string;
  } | null>(null);

  const totais = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    transacoes.forEach((t) => {
      if (t.tipo === 'entrada') entradas += Number(t.valor);
      else saidas += Number(t.valor);
    });
    return { entradas, saidas, saldo: entradas - saidas };
  }, [transacoes]);

  const saudacao = useMemo(() => {
    const h = new Date().getHours();
    const s = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    return `${s}, ${perfil?.nome || 'Usuário'}!`;
  }, [perfil]);

  const abrirModal = (t: TipoTransacao) => {
    setTipo(t);
    setValor('');
    setDescricao('');
    setData(hojeISO());
    setMetaId('');
    setModalOpen(true);
  };

  const validarESeguir = (e: React.FormEvent) => {
    e.preventDefault();
    const valorFloat = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(valorFloat) || valorFloat <= 0) {
      mostrarAviso('Informe um valor válido!', 'erro');
      return;
    }
    if (!descricao.trim()) {
      mostrarAviso('Informe uma descrição!', 'erro');
      return;
    }
    if (!data) {
      mostrarAviso('Informe uma data!', 'erro');
      return;
    }

    setDadosParaSalvar({ valor: valorFloat, descricao: descricao.trim(), data, tipo, metaId });
    setModalOpen(false);
    setConfirmModalOpen(true);
  };

  const confirmarSalvar = () => {
    if (!dadosParaSalvar) return;
    const primeiraEntrada = !transacoes.some((t) => t.tipo === 'entrada');
    const primeiraSaida = !transacoes.some((t) => t.tipo === 'saida');

    const nova: Transacao = {
      ...dadosParaSalvar,
      id: gerarId(),
    };
    setTransacoes([nova, ...transacoes]);

    if (dadosParaSalvar.metaId) {
      setMetas(
        metas.map((m) => {
          if (m.id !== dadosParaSalvar.metaId) return m;
          const delta =
            dadosParaSalvar.tipo === 'entrada' ? dadosParaSalvar.valor : -dadosParaSalvar.valor;
          return { ...m, valorAtual: Number(m.valorAtual) + delta };
        })
      );
    }

    if (dadosParaSalvar.tipo === 'entrada') {
      ganharXP(REGRAS_XP.novaEntrada, 'Cadastrou uma entrada!');
      if (primeiraEntrada) desbloquearConquista('primeira_entrada');
    } else {
      ganharXP(REGRAS_XP.novaSaida, 'Registrou uma saída!');
      if (primeiraSaida) desbloquearConquista('primeira_saida');
    }

    setConfirmModalOpen(false);
    setDadosParaSalvar(null);
    mostrarAviso('Lançamento salvo com sucesso!', 'sucesso');
  };

  const confirmarExcluirTransacao = () => {
    if (!transacaoParaExcluir) return;
    const id = transacaoParaExcluir.id;
    setTransacoes(transacoes.filter((t) => t.id !== id));
    setTransacaoParaExcluir(null);
    mostrarAviso('Lançamento excluído com sucesso!', 'info');
  };

  const handleTransferirParaMeta = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(String(valorTransferir).replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      mostrarAviso('Informe um valor válido para transferência!', 'erro');
      return;
    }
    if (!transferirMetaId) {
      mostrarAviso('Selecione uma meta!', 'erro');
      return;
    }

    const metaAlvo = metas.find((m) => m.id === transferirMetaId);
    if (!metaAlvo) {
      mostrarAviso('Meta não encontrada!', 'erro');
      return;
    }

    // Update goal balance
    setMetas(
      metas.map((m) =>
        m.id === transferirMetaId ? { ...m, valorAtual: Number(m.valorAtual) + val } : m
      )
    );

    // Register a transaction for this goal transfer and update account balance
    const novaTransacao: Transacao = {
      id: gerarId(),
      valor: val,
      descricao: `Aporte/Transferência para meta: ${metaAlvo.nome}`,
      data: hojeISO(),
      tipo: 'entrada',
      metaId: transferirMetaId,
    };
    setTransacoes([novaTransacao, ...transacoes]);

    ganharXP(REGRAS_XP.novaEntrada, `Transferiu R$ ${formatarMoeda(val)} para a meta ${metaAlvo.nome}`);
    mostrarAviso(`R$ ${formatarMoeda(val)} transferido com sucesso para a meta "${metaAlvo.nome}"!`, 'sucesso');

    setModalTransferirOpen(false);
    setValorTransferir('');
    setTransferirMetaId('');
  };

  return (
    <div className="space-y-5 pb-12">
      <Header subtitulo="Controle Financeiro Inteligente" onSair={onSair} />

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">{saudacao}</h2>
        <p className="text-xs sm:text-sm text-[#9b93a8]">Acompanhe suas finanças em tempo real</p>
      </div>

      <div className="bg-[#1c1626] border border-white/15 rounded-2xl p-5 sm:p-6 shadow-xl glow-yellow">
        <p className="text-[11px] font-bold text-[#9b93a8] tracking-widest uppercase">SALDO ATUAL</p>
        <p className="text-2xl sm:text-4xl font-extrabold text-[#fec800] my-2">
          R$ {formatarMoeda(totais.saldo)}
        </p>
        <div className="h-px bg-white/10 my-4" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-[#9b93a8] tracking-wider uppercase mb-1">
              TOTAL ENTRADAS
            </p>
            <p className="text-base sm:text-xl font-bold text-[#1fd18f]">
              R$ {formatarMoeda(totais.entradas)}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-[#9b93a8] tracking-wider uppercase mb-1">
              TOTAL SAÍDAS
            </p>
            <p className="text-base sm:text-xl font-bold text-[#ff4d5e]">
              R$ {formatarMoeda(totais.saidas)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => abrirModal('entrada')}
            className="p-4 rounded-xl border border-[#1fd18f]/40 bg-[#141019] hover:bg-[#1fd18f]/10 text-left transition-all group glow-green"
          >
            <div className="flex items-center gap-2 mb-1">
              <PlusCircle className="w-5 h-5 text-[#1fd18f]" />
              <span className="font-bold text-[#1fd18f] text-base">+ Entrada</span>
            </div>
            <p className="text-xs text-[#9b93a8]">Valor recebido</p>
          </button>

          <button
            onClick={() => abrirModal('saida')}
            className="p-4 rounded-xl border border-[#ff4d5e]/40 bg-[#141019] hover:bg-[#ff4d5e]/10 text-left transition-all group glow-red"
          >
            <div className="flex items-center gap-2 mb-1">
              <MinusCircle className="w-5 h-5 text-[#ff4d5e]" />
              <span className="font-bold text-[#ff4d5e] text-base">- Saída</span>
            </div>
            <p className="text-xs text-[#9b93a8]">Valor gasto</p>
          </button>
        </div>

        <button
          onClick={() => {
            if (metas.length === 0) {
              mostrarAviso('Crie uma meta antes de realizar transferências!', 'info');
              return;
            }
            setTransferirMetaId(metas[0]?.id || '');
            setValorTransferir('');
            setModalTransferirOpen(true);
          }}
          className="w-full p-3.5 rounded-xl border border-[#fec800]/40 bg-[#141019] hover:bg-[#fec800]/10 flex items-center justify-center gap-2 text-[#fec800] font-bold text-sm transition-all shadow-md glow-yellow"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Transferir Saldo para Meta</span>
        </button>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-3">Últimas Movimentações</h3>
        {transacoes.length === 0 ? (
          <div className="p-8 border border-dashed border-white/15 rounded-xl text-center bg-[#141019]">
            <p className="text-xs text-[#6b6478]">Nenhuma transação cadastrada ainda.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transacoes.slice(0, 10).map((t) => (
              <div
                key={t.id}
                className={`flex items-center justify-between p-3.5 rounded-xl bg-[#141019] border border-white/10 border-l-4 transition-all hover:bg-white/5 ${
                  t.tipo === 'entrada' ? 'border-l-[#1fd18f]' : 'border-l-[#ff4d5e]'
                }`}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="font-semibold text-sm text-white truncate">{t.descricao}</p>
                  <p className="text-xs text-[#9b93a8] mt-0.5">{formatarData(t.data)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold text-sm sm:text-base ${
                      t.tipo === 'entrada' ? 'text-[#1fd18f]' : 'text-[#ff4d5e]'
                    }`}
                  >
                    {t.tipo === 'entrada' ? '+' : '-'} R$ {formatarMoeda(t.valor)}
                  </span>
                  <button
                    onClick={() => setTransacaoParaExcluir(t)}
                    className="w-7 h-7 rounded-lg bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Excluir Lançamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-[#1c1626] border border-white/15 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-[#9b93a8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              {tipo === 'entrada' ? 'Nova Entrada' : 'Nova Saída'}
            </h3>

            <form onSubmit={validarESeguir} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                  VALOR (R$)
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                  DESCRIÇÃO
                </label>
                <input
                  type="text"
                  placeholder="Ex: Salário, Mercado, Luz"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                  DATA (AAAA-MM-DD)
                </label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                  required
                />
              </div>

              {metas.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-[#9b93a8] mb-1.5 uppercase">
                    CONCILIAR COM META (OPCIONAL)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMetaId('')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        metaId === ''
                          ? 'bg-[#fec800] text-[#08070b] border-[#fec800]'
                          : 'bg-white/5 text-[#9b93a8] border-white/10'
                      }`}
                    >
                      Nenhuma
                    </button>
                    {metas.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMetaId(m.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          metaId === m.id
                            ? 'bg-[#fec800] text-[#08070b] border-[#fec800]'
                            : 'bg-white/5 text-[#9b93a8] border-white/10'
                        }`}
                      >
                        {m.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#fec800] text-[#08070b] font-bold text-sm rounded-lg hover:bg-[#ffdf5c] transition-colors"
              >
                Salvar
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmModalOpen && dadosParaSalvar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1c1626] border border-white/15 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-[#9b93a8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Confirmar Lançamento</h3>

            <div className="space-y-2 mb-6 text-sm text-white/90">
              <p>
                <span className="font-bold text-[#9b93a8]">Tipo: </span>
                {dadosParaSalvar.tipo === 'entrada' ? 'Entrada' : 'Saída'}
              </p>
              <p>
                <span className="font-bold text-[#9b93a8]">Valor: </span>
                R$ {formatarMoeda(dadosParaSalvar.valor)}
              </p>
              <p>
                <span className="font-bold text-[#9b93a8]">Descrição: </span>
                {dadosParaSalvar.descricao}
              </p>
              <p>
                <span className="font-bold text-[#9b93a8]">Data: </span>
                {formatarData(dadosParaSalvar.data)}
              </p>
              {dadosParaSalvar.metaId && (
                <p>
                  <span className="font-bold text-[#9b93a8]">Meta: </span>
                  {metas.find((m) => m.id === dadosParaSalvar.metaId)?.nome}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[#9b93a8] font-bold text-sm rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarSalvar}
                className="flex-1 py-2.5 bg-[#fec800] text-[#08070b] font-bold text-sm rounded-lg hover:bg-[#ffdf5c]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalTransferirOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1c1626] border border-white/15 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setModalTransferirOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-[#9b93a8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-[#fec800]" />
              Transferir Saldo para Meta
            </h3>
            <p className="text-xs text-[#9b93a8] mb-4">
              Informe o valor para destinar diretamente a uma meta cadastrada
            </p>

            <form onSubmit={handleTransferirParaMeta} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                  SELECIONE A META
                </label>
                <select
                  value={transferirMetaId}
                  onChange={(e) => setTransferirMetaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#141019] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                  required
                >
                  {metas.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#1c1626] text-white">
                      {m.nome} (Atual: R$ {formatarMoeda(m.valorAtual)} / R$ {formatarMoeda(m.valorTotal)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                  VALOR DA TRANSFERÊNCIA (R$)
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={valorTransferir}
                  onChange={(e) => setValorTransferir(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalTransferirOpen(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-[#9b93a8] font-bold text-sm rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#fec800] text-[#08070b] font-bold text-sm rounded-lg hover:bg-[#ffdf5c] transition-colors"
                >
                  Transferir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {transacaoParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1c1626] border border-white/15 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setTransacaoParaExcluir(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-[#9b93a8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[#ff4d5e]" />
              Excluir Lançamento
            </h3>
            <p className="text-sm text-[#9b93a8] mb-4">
              Tem certeza que deseja remover este lançamento de{' '}
              <span className="font-bold text-white">{transacaoParaExcluir.descricao}</span> no valor de{' '}
              <span className="font-bold text-[#fec800]">
                R$ {formatarMoeda(transacaoParaExcluir.valor)}
              </span>
              ?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTransacaoParaExcluir(null)}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[#9b93a8] font-bold text-sm rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarExcluirTransacao}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
