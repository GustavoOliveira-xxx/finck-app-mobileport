import React, { useState } from 'react';
import { Perfil } from '../types';
import { CaptchaSlider } from './CaptchaSlider';
import { Eye, EyeOff } from 'lucide-react';

interface AuthScreenProps {
  perfil: Perfil | null;
  setUsuarioLogado: (val: boolean) => void;
  salvarPerfilNovo: (novoPerfil: Perfil) => void;
  mostrarAviso: (texto: string, tipo?: 'sucesso' | 'erro' | 'info') => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  perfil,
  setUsuarioLogado,
  salvarPerfilNovo,
  mostrarAviso,
}) => {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [confirma, setConfirma] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [verificado, setVerificado] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificado) {
      mostrarAviso('Arraste o controle para verificar.', 'erro');
      return;
    }
    if (!perfil) {
      mostrarAviso('Nenhuma conta encontrada. Cadastre-se primeiro.', 'erro');
      return;
    }
    if (perfil.email.toLowerCase() === email.trim().toLowerCase() && perfil.senha === senha) {
      setUsuarioLogado(true);
      mostrarAviso(`Bem-vindo de volta, ${perfil.nome}!`, 'sucesso');
    } else {
      mostrarAviso('E-mail ou senha incorretos.', 'erro');
    }
  };

  const handleCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificado) {
      mostrarAviso('Arraste o controle para verificar.', 'erro');
      return;
    }
    if (!nome.trim()) {
      mostrarAviso('Informe seu nome completo.', 'erro');
      return;
    }
    if (!email.trim()) {
      mostrarAviso('Informe um e-mail válido.', 'erro');
      return;
    }
    if (senha.length < 6) {
      mostrarAviso('A senha deve ter pelo menos 6 caracteres.', 'erro');
      return;
    }
    if (senha !== confirma) {
      mostrarAviso('As senhas não coincidem.', 'erro');
      return;
    }

    const novo: Perfil = {
      nome: nome.trim(),
      email: email.trim(),
      senha,
      profissao: '',
      renda: 0,
      formatoMoeda: 'BRL',
      formatoData: 'pt-BR',
    };
    salvarPerfilNovo(novo);
    setUsuarioLogado(true);
    mostrarAviso('Conta criada com sucesso!', 'sucesso');
  };

  return (
    <div className="min-h-screen bg-[#08070b] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1c1626] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl glow-purple">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-2xl bg-[#1c1626] p-2 shadow-2xl shadow-[#680c90]/50 border-2 border-[#fec800]/60 mb-4 overflow-hidden flex items-center justify-center shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Financial CK Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-xs text-[#9b93a8] font-semibold uppercase tracking-widest">
            CONTROLE FINANCEIRO INTELIGENTE
          </p>
        </div>

        {modo === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Bem-vindo ao Financial CK</h2>
              <p className="text-xs text-[#9b93a8] mt-0.5">Acesse sua conta para gerenciar suas finanças</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase tracking-wider">
                E-MAIL
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase tracking-wider">
                SENHA
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-2.5 text-[#9b93a8] hover:text-white"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Seus dados ficam salvos localmente no navegador. Caso esqueça a senha, use 'Apagar Todos os Dados' no perfil para redefinir."
                    )
                  }
                  className="text-xs text-[#6b6478] hover:text-[#9b93a8]"
                >
                  Esqueci minha senha
                </button>
              </div>
            </div>

            <CaptchaSlider verificado={verificado} setVerificado={setVerificado} />

            <button
              type="submit"
              disabled={!verificado}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                verificado
                  ? 'bg-[#fec800] text-[#08070b] hover:bg-[#ffdf5c] shadow-lg shadow-[#fec800]/20'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              Entrar
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-[#9b93a8]">
                Não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setModo('cadastro');
                    setVerificado(false);
                  }}
                  className="text-[#fec800] font-bold hover:underline"
                >
                  Cadastre-se agora
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Criar Conta</h2>
              <p className="text-xs text-[#9b93a8] mt-0.5">Comece a organizar sua vida financeira</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase tracking-wider">
                NOME COMPLETO
              </label>
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase tracking-wider">
                E-MAIL
              </label>
              <input
                type="email"
                placeholder="meu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase tracking-wider">
                SENHA
              </label>
              <input
                type="password"
                placeholder="Mín. 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#9b93a8] mb-1 uppercase tracking-wider">
                CONFIRMAR SENHA
              </label>
              <input
                type="password"
                placeholder="Repita a senha"
                value={confirma}
                onChange={(e) => setConfirma(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fec800]"
                required
              />
            </div>

            <CaptchaSlider verificado={verificado} setVerificado={setVerificado} />

            <button
              type="submit"
              disabled={!verificado}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                verificado
                  ? 'bg-[#fec800] text-[#08070b] hover:bg-[#ffdf5c] shadow-lg shadow-[#fec800]/20'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              Cadastrar
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-[#9b93a8]">
                Já tem conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setModo('login');
                    setVerificado(false);
                  }}
                  className="text-[#fec800] font-bold hover:underline"
                >
                  Fazer login
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
