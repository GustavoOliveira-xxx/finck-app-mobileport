import React from 'react';
import { AvisoToast } from '../types';

interface ToastAvisoProps {
  aviso: AvisoToast | null;
}

export const ToastAviso: React.FC<ToastAvisoProps> = ({ aviso }) => {
  if (!aviso) return null;

  const bgClasses = {
    sucesso: 'bg-[#1fd18f]/15 border-[#1fd18f]/40 text-[#1fd18f] glow-green',
    erro: 'bg-[#ff4d5e]/15 border-[#ff4d5e]/40 text-[#ff4d5e] glow-red',
    info: 'bg-[#9333c4]/15 border-[#9333c4]/40 text-[#9333c4] glow-purple',
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce">
      <div className={`px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl text-center font-medium text-sm flex items-center justify-center gap-2 ${bgClasses[aviso.tipo]}`}>
        <span>{aviso.texto}</span>
      </div>
    </div>
  );
};
