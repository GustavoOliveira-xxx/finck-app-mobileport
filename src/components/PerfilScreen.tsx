import React, { useState, useMemo } from 'react';
import { Perfil, Transacao, Meta, GamificacaoState } from '../types';
import { Header } from './Header';
import { formatarMoeda, hojeISO } from '../utils/formatters';
import { REGRAS_XP } from '../utils/gamification';
import { KeyRound, Download, Upload, Trash2, X } from 'lucide-react';

interface PerfilScreenProps {
  perfil: Perfil | null;
  setPerfil: (p: Perfil) => void;
  transacoes: Transacao[];
  setTransacoes: (t: Transacao[]) => void;
  metas: Meta[];
  setMetas: (m: Meta[]) => void;
  gamificacao: GamificacaoState;
  setGamificacao: (g: GamificacaoState) => void;
  ganharXP: (valor: number, motivo: string) => void;
  desbloquearConquista: (id: string) => void;
  mostrarAviso: (texto: string, tipo?: 'sucesso' | 'erro' | 'info') => void;
  apagarTudo: () => void;
  onSair: () => void;
}

export const PerfilScreen: React.FC<PerfilScreenProps> = ({
  perfil,
  setPerfil,
  transacoes,
  setTransacoes,
  metas,
  setMetas,
  gamificacao,
  setGamificacao,
  ganharXP,
  desbloquearConquista,
  mostrarAviso,
  apagarTudo,
  onSair,
}) => {
  const [nome, setNome] = useState(perfil?.nome || '');
  const [email, setEmail] = useState(perfil?.email || '');
  const [profissao, setProfissao] = useState(perfil?.profissao || '');
  const [renda, setRenda] = useState(perfil?.renda ? String(perfil.renda) : '');

  const [modalSenhaOpen, setModalSenhaOpen] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');

  const perfilCompleto = (p: Partial<Perfil>) =>
    !!(p.nome && p.email && p.profissao && p.renda && p.renda > 0);

  const estatisticas = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    transacoes.forEach((t) => {
      if (t.tipo === 'entrada') entradas += Number(t.valor);
      else saidas += Number(t.valor);
    });
    const saldo = entradas - saidas;
    const taxa = entradas > 0 ? ((saldo / entradas) * 100).toFixed(1) : '0';
    const concluidas = metas.filter((m) => m.valorAtual / m.valorTotal >= 0.999).length;
    return { entradas, saidas, saldo, taxa, totalMetas: metas.length, concluidas };
  }, [transacoes, metas]);

  const salvarDados = (e: React.FormEvent) => {
    e.preventDefault();
    const anteriorCompleto = perfilCompleto(perfil || {});
    const novoPerfil: Perfil = {
      ...perfil,
      nome: nome.trim(),
      email: email.trim(),
      profissao: profissao.trim(),
      renda: parseFloat(renda.replace(',', '.')) || 0,
    };
    setPerfil(novoPerfil);
    mostrarAviso('Dados salvos com sucesso!', 'sucesso');

    if (!anteriorCompleto && perfilCompleto(novoPerfil)) {
      ganharXP(REGRAS_XP.perfilCompleto, 'Perfil completo!');
      desbloquearConquista('perfil_completo');
    }
  };

  const alterarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (perfil && senhaAtual !== perfil.senha) {
      mostrarAviso('Senha atual incorreta!', 'erro');
      return;
    }
    if (novaSenha !== confirmaSenha) {
      mostrarAviso('As senhas não coincidem!', 'erro');
      return;
    }
    if (novaSenha.length < 6) {
      mostrarAviso('A senha deve ter pelo menos 6 caracteres!', 'erro');
      return;
    }

    if (perfil) {
      setPerfil({ ...perfil, senha: novaSenha });
      mostrarAviso('Senha alterada com sucesso!', 'sucesso');
      setModalSenhaOpen(false);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmaSenha('');
    }
  };

  const exportarBackup = () => {
    const dados = { perfil, transacoes, metas, gamificacao };
    const jsonStr = JSON.stringify(dados, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finck_backup_${hojeISO()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    mostrarAviso('Backup baixado com sucesso!', 'sucesso');
  };

  const importarBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const conteudo = event.target?.result as string;
        const dados = JSON.parse(conteudo);
        if (!dados.perfil && !dados.transacoes && !dados.metas) {
          mostrarAviso('Arquivo de backup inválido.', 'erro');
          return;
        }
        if (confirm('Importar este backup irá substituir todos os dados atuais. Continuar?')) {
          if (dados.perfil) setPerfil(dados.perfil);
          if (dados.transacoes) setTransacoes(dados.transacoes);
          if (dados.metas) setMetas(dados.metas);
          if (dados.gamificacao) setGamificacao(dados.gamificacao);
          mostrarAviso('Backup importado com sucesso!', 'sucesso');
        }
      } catch (err) {
        mostrarAviso('Erro ao ler o arquivo de backup.', 'erro');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 pb-12">
      <Header subtitulo="Perfil e Configurações" onSair={onSair} />

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Meu Perfil</h2>
        <p className="text-xs sm:text-sm text-[#9b93a8]">
          Gerencie suas informações e preferências
        </p>
      </div>

      <div className="bg-[#141019] border border-white/10 rounded-2xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span>👤</span>
          <span>Dados Pessoais</span>
        </h3>

        <form onSubmit={salvarDados} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
              NOME COMPLETO
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
              E-MAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
              PROFISSÃO
            </label>
            <input
              type="text"
              placeholder="Ex: Analista Financeiro"
              value={profissao}
              onChange={(e) => setProfissao(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
              RENDA MENSAL (R$)
            </label>
            <input
              type="text"
              placeholder="0,00"
              value={renda}
              onChange={(e) => setRenda(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#fec800] text-[#08070b] font-bold text-sm rounded-lg hover:bg-[#ffdf5c] transition-colors"
          >
            Salvar Alterações
          </button>
        </form>
      </div>

      <div className="bg-[#141019] border border-white/10 rounded-2xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>Estatísticas Gerais</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 bg-white/5 rounded-lg border border-white/5">
            <p className="text-[#9b93a8] mb-1">Total Entradas</p>
            <p className="font-bold text-[#1fd18f] text-sm">
              R$ {formatarMoeda(estatisticas.entradas)}
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/5">
            <p className="text-[#9b93a8] mb-1">Total Saídas</p>
            <p className="font-bold text-[#ff4d5e] text-sm">
              R$ {formatarMoeda(estatisticas.saidas)}
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/5">
            <p className="text-[#9b93a8] mb-1">Saldo Total</p>
            <p className="font-bold text-white text-sm">
              R$ {formatarMoeda(estatisticas.saldo)}
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/5">
            <p className="text-[#9b93a8] mb-1">Metas Criadas</p>
            <p className="font-bold text-white text-sm">{estatisticas.totalMetas}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/5">
            <p className="text-[#9b93a8] mb-1">Metas Concluídas</p>
            <p className="font-bold text-white text-sm">{estatisticas.concluidas}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/5">
            <p className="text-[#9b93a8] mb-1">Taxa de Economia</p>
            <p className="font-bold text-[#fec800] text-sm">{estatisticas.taxa}%</p>
          </div>
        </div>
      </div>

      <div className="bg-[#141019] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <span>⚙️</span>
          <span>Ações da Conta</span>
        </h3>

        <button
          onClick={() => setModalSenhaOpen(true)}
          className="w-full py-2.5 px-4 bg-[#9333c4]/20 border border-[#9333c4]/40 hover:bg-[#9333c4]/30 text-[#9333c4] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <KeyRound className="w-4 h-4" />
          <span>Alterar Senha</span>
        </button>

        <button
          onClick={exportarBackup}
          className="w-full py-2.5 px-4 bg-[#1fd18f]/15 border border-[#1fd18f]/30 hover:bg-[#1fd18f]/25 text-[#1fd18f] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Backup (JSON)</span>
        </button>

        <label className="w-full py-2.5 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-[#9b93a8] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>Importar Backup (JSON)</span>
          <input
            type="file"
            accept=".json"
            onChange={importarBackup}
            className="hidden"
          />
        </label>

        <button
          onClick={() => {
            if (confirm('Tem certeza? TODOS os seus dados salvos serão removidos permanentemente!')) {
              if (confirm('Confirmação final: Essa ação não pode ser desfeita.')) {
                apagarTudo();
              }
            }
          }}
          className="w-full py-2.5 px-4 bg-red-600/15 border border-red-600/30 hover:bg-red-600/25 text-red-500 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Apagar Todos os Dados</span>
        </button>
      </div>

      {modalSenhaOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1c1626] border border-white/15 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setModalSenhaOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-[#9b93a8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Alterar Senha</h3>

            <form onSubmit={alterarSenha} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                  SENHA ATUAL
                </label>
                <input
                  type="password"
                  placeholder="Digite sua senha atual"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                  NOVA SENHA
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase">
                  CONFIRMAR NOVA SENHA
                </label>
                <input
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#fec800] text-[#08070b] font-bold text-sm rounded-lg hover:bg-[#ffdf5c] transition-colors"
              >
                Alterar Senha
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
