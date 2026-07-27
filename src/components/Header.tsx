import React from 'react';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  subtitulo: string;
  badge?: string;
  onSair?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ subtitulo, badge, onSair }) => {
  return (
    <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#1c1626] border border-[#fec800]/50 flex items-center justify-center shadow-lg shadow-[#680c90]/30 overflow-hidden p-0.5 shrink-0">
          <img
           src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Financial CK Logo"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-wider text-[#fec800] leading-none">
            Financial CK
          </h1>
          <p className="text-[10px] sm:text-xs font-semibold text-[#9b93a8] tracking-widest uppercase mt-1">
            {subtitulo}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {badge && (
          <div className="bg-[#fec800]/15 border border-[#fec800]/30 px-3 py-1.5 rounded-full">
            <span className="text-[#fec800] font-bold text-xs">{badge}</span>
          </div>
        )}
        {onSair && (
          <button
            onClick={onSair}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[#9b93a8] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Sair da conta"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        )}
      </div>
    </div>
  );
};
