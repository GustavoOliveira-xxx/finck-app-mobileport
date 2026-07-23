import React, { useState, useMemo, useRef } from 'react';
import { Transacao } from '../types';
import { Header } from './Header';
import { formatarMoeda, formatarData } from '../utils/formatters';
import { REGRAS_XP } from '../utils/gamification';
import { Download, FileCheck2 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RelatoriosScreenProps {
  transacoes: Transacao[];
  ganharXP: (valor: number, motivo: string) => void;
  mostrarAviso: (texto: string, tipo?: 'sucesso' | 'erro' | 'info') => void;
  onSair: () => void;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const RelatoriosScreen: React.FC<RelatoriosScreenProps> = ({
  transacoes,
  ganharXP,
  mostrarAviso,
  onSair,
}) => {
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const xpConcedidoRef = useRef(false);

  const filtradas = useMemo(() => {
    return transacoes
      .filter((t) => {
        const [a, m] = t.data.split('-');
        return Number(m) === mes && Number(a) === ano;
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transacoes, mes, ano]);

  const totais = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    filtradas.forEach((t) => {
      if (t.tipo === 'entrada') entradas += Number(t.valor);
      else saidas += Number(t.valor);
    });
    const saldo = entradas - saidas;
    const taxaEconomia = entradas > 0 ? ((saldo / entradas) * 100).toFixed(1) : '0';
    return { entradas, saidas, saldo, taxaEconomia };
  }, [filtradas]);

  const evolucao = useMemo(() => {
    const diasNoMes = new Date(ano, mes, 0).getDate();
    const saldoDiario = Array(diasNoMes + 1).fill(0);

    filtradas.forEach((t) => {
      const dia = Number(t.data.split('-')[2]);
      if (dia >= 1 && dia <= diasNoMes) {
        saldoDiario[dia] += t.tipo === 'entrada' ? Number(t.valor) : -Number(t.valor);
      }
    });

    let acumulado = 0;
    const pontos: Array<{ dia: string; valor: number }> = [];
    const passo = diasNoMes > 15 ? Math.ceil(diasNoMes / 10) : 1;

    for (let d = 1; d <= diasNoMes; d++) {
      acumulado += saldoDiario[d];
      if (d % passo === 0 || d === diasNoMes) {
        pontos.push({ dia: `${d}`, valor: acumulado });
      }
    }
    return pontos;
  }, [filtradas, mes, ano]);

  const gerarRelatorio = () => {
    if (!xpConcedidoRef.current) {
      ganharXP(REGRAS_XP.relatorioGerado, 'Gerou um relatório!');
      xpConcedidoRef.current = true;
    }
    mostrarAviso('Relatório gerado com sucesso!', 'sucesso');
  };

  const exportarCSV = () => {
    if (filtradas.length === 0) {
      mostrarAviso('Nenhum dado para exportar no período.', 'info');
      return;
    }

    const linhas = [
      'Data,Descricao,Tipo,Valor',
      ...filtradas.map(
        (t) =>
          `${formatarData(t.data)},"${(t.descricao || '').replace(/"/g, '""')}",${t.tipo},${t.valor}`
      ),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(linhas.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `relatorio_finck_${mes}_${ano}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostrarAviso('Relatório CSV baixado!', 'sucesso');
  };

  return (
    <div className="space-y-5 pb-12">
      <Header subtitulo="Relatórios Financeiros" onSair={onSair} />

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Relatórios</h2>
        <p className="text-xs sm:text-sm text-[#9b93a8]">
          Análise detalhada das suas movimentações
        </p>
      </div>

      <div className="bg-[#141019] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Período do Relatório</h3>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {MESES.map((nome, idx) => (
            <button
              key={nome}
              onClick={() => setMes(idx + 1)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                mes === idx + 1
                  ? 'bg-[#fec800] text-[#08070b] border-[#fec800] font-bold'
                  : 'bg-white/5 text-[#9b93a8] border-white/10 hover:text-white'
              }`}
            >
              {nome.slice(0, 3)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          {[ano - 1, ano, ano + 1].map((a) => (
            <button
              key={a}
              onClick={() => setAno(a)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                ano === a
                  ? 'bg-[#fec800] text-[#08070b] border-[#fec800] font-bold'
                  : 'bg-white/5 text-[#9b93a8] border-white/10 hover:text-white'
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={gerarRelatorio}
            className="py-2.5 px-4 bg-[#fec800] text-[#08070b] font-bold text-xs rounded-xl hover:bg-[#ffdf5c] transition-colors flex items-center justify-center gap-2"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Gerar Relatório</span>
          </button>
          <button
            onClick={exportarCSV}
            className="py-2.5 px-4 bg-white/5 text-white border border-white/10 font-bold text-xs rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-[#141019] border border-white/10 rounded-xl p-3">
          <p className="text-[10px] font-bold text-[#9b93a8] uppercase">ENTRADAS</p>
          <p className="text-sm sm:text-base font-bold text-[#1fd18f] mt-1">
            R$ {formatarMoeda(totais.entradas)}
          </p>
        </div>
        <div className="bg-[#141019] border border-white/10 rounded-xl p-3">
          <p className="text-[10px] font-bold text-[#9b93a8] uppercase">SAÍDAS</p>
          <p className="text-sm sm:text-base font-bold text-[#ff4d5e] mt-1">
            R$ {formatarMoeda(totais.saidas)}
          </p>
        </div>
        <div className="bg-[#141019] border border-white/10 rounded-xl p-3">
          <p className="text-[10px] font-bold text-[#9b93a8] uppercase">SALDO</p>
          <p
            className={`text-sm sm:text-base font-bold mt-1 ${
              totais.saldo >= 0 ? 'text-[#1fd18f]' : 'text-[#ff4d5e]'
            }`}
          >
            R$ {formatarMoeda(totais.saldo)}
          </p>
        </div>
        <div className="bg-[#141019] border border-white/10 rounded-xl p-3">
          <p className="text-[10px] font-bold text-[#9b93a8] uppercase">TAXA DE ECONOMIA</p>
          <p className="text-sm sm:text-base font-bold text-[#fec800] mt-1">
            {totais.taxaEconomia}%
          </p>
        </div>
      </div>

      <div className="bg-[#141019] border border-white/10 rounded-2xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-white mb-4">Evolução do Saldo no Mês</h3>
        {evolucao.length > 1 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolucao}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fec800" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#fec800" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="dia" stroke="#9b93a8" fontSize={12} />
                <YAxis stroke="#9b93a8" fontSize={12} />
                <Tooltip
                  formatter={(value: any) => [`R$ ${formatarMoeda(Number(value))}`, 'Saldo Acumulado']}
                  contentStyle={{ backgroundColor: '#1c1626', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <Area type="monotone" dataKey="valor" stroke="#fec800" strokeWidth={2} fillOpacity={1} fill="url(#colorSaldo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-[#6b6478]">
            Sem dados suficientes para o gráfico no período selecionado
          </div>
        )}
      </div>

      <div className="bg-[#141019] border border-white/10 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Transações do Período</h3>
          <span className="text-xs text-[#9b93a8]">
            {filtradas.length} registro{filtradas.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtradas.length === 0 ? (
          <p className="text-center py-6 text-xs text-[#6b6478]">
            Nenhuma transação encontrada para o período selecionado
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {filtradas.map((t) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-[#9b93a8] w-20">{formatarData(t.data)}</span>
                <span className="text-white font-medium flex-1 truncate mx-2">{t.descricao}</span>
                <span
                  className={`font-bold ${
                    t.tipo === 'entrada' ? 'text-[#1fd18f]' : 'text-[#ff4d5e]'
                  }`}
                >
                  {t.tipo === 'entrada' ? '+' : '-'} R$ {formatarMoeda(t.valor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
