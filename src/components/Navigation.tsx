import React from 'react';
import { TabName } from '../types';
import { Home, BarChart3, Target, FileText, Star, User } from 'lucide-react';

interface NavigationProps {
  abaAtiva: TabName;
  setAbaAtiva: (tab: TabName) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ abaAtiva, setAbaAtiva }) => {
  const abas: { id: TabName; label: string; icone: React.ReactNode }[] = [
    { id: 'Início', label: 'Início', icone: <Home className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'Análises', label: 'Análises', icone: <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'Metas', label: 'Metas', icone: <Target className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'Relatórios', label: 'Relatórios', icone: <FileText className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'XP', label: 'XP', icone: <Star className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'Perfil', label: 'Perfil', icone: <User className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#141019]/95 backdrop-blur-md border-t border-white/10 px-2 pt-2 pb-[calc(10px+env(safe-area-inset-bottom,16px))] sm:pb-3 shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-around">
        {abas.map((aba) => {
          const ativo = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
                ativo
                  ? 'text-[#fec800] bg-[#fec800]/10 border border-[#fec800]/20 font-bold scale-105'
                  : 'text-[#9b93a8] hover:text-white font-medium'
              }`}
            >
              <div>{aba.icone}</div>
              <span className="text-[10px] sm:text-xs mt-1">{aba.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
