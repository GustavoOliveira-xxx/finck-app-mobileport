import React, { useState, useMemo, useRef } from 'react';
import { Transacao } from '../types';
import { Header } from './Header';
import { formatarMoeda } from '../utils/formatters';
import { REGRAS_XP } from '../utils/gamification';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface AnalisesScreenProps {
  transacoes: Transacao[];
  ganharXP: (valor: number, motivo: string) => void;
  onSair: () => void;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CORES_DONUT = [
  '#680c90', '#fec800', '#1fd18f', '#ff4d5e', '#9333c4',
  '#ffdf5c', '#46b4ff', '#ff7864', '#a855f7', '#ec4899'
];

export const AnalisesScreen: React.FC<AnalisesScreenProps> = ({ transacoes, ganharXP, onSair }) => {
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const xpConcedidoRef = useRef(false);

  const filtradas = useMemo(() => {
    return transacoes.filter((t) => {
      const [a, m] = t.data.split('-');
      return Number(m) === mes && Number(a) === ano;
    });
  }, [transacoes, mes, ano]);

  const totais = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    filtradas.forEach((t) => {
      if (t.tipo === 'entrada') entradas += Number(t.valor);
      else saidas += Number(t.valor);
    });
    return { entradas, saidas, saldo: entradas - saidas };
  }, [filtradas]);

  const dadosBarra = [
    { name: 'Entradas', valor: totais.entradas, fill: '#1fd18f' },
    { name: 'Saídas', valor: totais.saidas, fill: '#ff4d5e' },
  ];

  const categorias = useMemo(() => {
    const cat: Record<string, number> = {};
    filtradas
      .filter((t) => t.tipo === 'saida')
      .forEach((t) => {
        const nome = t.descricao || 'Outros';
        cat[nome] = (cat[nome] || 0) + Number(t.valor);
      });
    return Object.entries(cat).map(([name, value]) => ({ name, value }));
  }, [filtradas]);

  const analisar = () => {
    if (!xpConcedidoRef.current) {
      ganharXP(REGRAS_XP.analiseConsultada, 'Consultou análises!');
      xpConcedidoRef.current = true;
    }
  };

  return (
    <div className="space-y-5 pb-12">
      <Header subtitulo="Análises Financeiras" onSair={onSair} />

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Visão Geral</h2>
        <p className="text-xs sm:text-sm text-[#9b93a8]">
          Compare entradas, saídas e categorias de gastos
        </p>
      </div>

      <div className="bg-[#141019] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Período</h3>

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

        <div className="flex items-center gap-2 pt-2">
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
          <button
            onClick={analisar}
            className="flex-1 py-1.5 px-3 bg-[#680c90] hover:bg-[#9333c4] text-white font-bold text-xs rounded-full transition-colors"
          >
            Analisar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-[#141019] border border-white/10 rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-bold text-[#9b93a8] uppercase">ENTRADAS</p>
          <p className="text-xs sm:text-lg font-bold text-[#1fd18f] mt-1">
            R$ {formatarMoeda(totais.entradas)}
          </p>
        </div>
        <div className="bg-[#141019] border border-white/10 rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-bold text-[#9b93a8] uppercase">SAÍDAS</p>
          <p className="text-xs sm:text-lg font-bold text-[#ff4d5e] mt-1">
            R$ {formatarMoeda(totais.saidas)}
          </p>
        </div>
        <div className="bg-[#141019] border border-white/10 rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-bold text-[#9b93a8] uppercase">SALDO</p>
          <p
            className={`text-xs sm:text-lg font-bold mt-1 ${
              totais.saldo >= 0 ? 'text-[#1fd18f]' : 'text-[#ff4d5e]'
            }`}
          >
            R$ {formatarMoeda(totais.saldo)}
          </p>
        </div>
      </div>

      <div className="bg-[#141019] border border-white/10 rounded-2xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-white mb-4">Entradas vs Saídas</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosBarra}>
              <XAxis dataKey="name" stroke="#9b93a8" fontSize={12} />
              <YAxis stroke="#9b93a8" fontSize={12} />
              <Tooltip
                formatter={(value: any) => [`R$ ${formatarMoeda(Number(value))}`, 'Valor']}
                contentStyle={{ backgroundColor: '#1c1626', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                {dadosBarra.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#141019] border border-white/10 rounded-2xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-white mb-4">Distribuição de Gastos</h3>
        {categorias.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#6b6478]">
            Nenhum gasto registrado no período
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorias}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categorias.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_DONUT[index % CORES_DONUT.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`R$ ${formatarMoeda(Number(value))}`, 'Gasto']}
                  contentStyle={{ backgroundColor: '#1c1626', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
