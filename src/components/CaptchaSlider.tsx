import React, { useState, useRef } from 'react';

interface CaptchaSliderProps {
  verificado: boolean;
  setVerificado: (val: boolean) => void;
}

export const CaptchaSlider: React.FC<CaptchaSliderProps> = ({ verificado, setVerificado }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleStart = () => {
    if (verificado) return;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !trackRef.current || verificado) return;
    const rect = trackRef.current.getBoundingClientRect();
    const maxDrag = rect.width - 48;
    const currentX = clientX - rect.left - 24;
    const newPos = Math.max(0, Math.min(currentX, maxDrag));
    setPosition(newPos);

    if (newPos >= maxDrag - 4) {
      setPosition(maxDrag);
      setVerificado(true);
      setIsDragging(false);
    }
  };

  const handleEnd = () => {
    if (verificado) return;
    setIsDragging(false);
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const maxDrag = rect.width - 48;
    if (position < maxDrag - 4) {
      setPosition(0);
      setVerificado(false);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) handleMove(e.touches[0].clientX);
  };

  return (
    <div className="mb-4">
      <label className="block text-[11px] font-bold tracking-wider text-[#9b93a8] mb-1.5 uppercase">
        ARRASTE ATÉ O FINAL PARA VERIFICAR
      </label>
      <div
        ref={trackRef}
        onMouseMove={onMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchMove={onTouchMove}
        onTouchEnd={handleEnd}
        className={`relative h-12 rounded-lg border transition-colors flex items-center justify-center overflow-hidden select-none ${
          verificado
            ? 'bg-[#0f2c23] border-[#1fd18f]/50 text-[#1fd18f]'
            : 'bg-white/5 border-white/10 text-[#888098]'
        }`}
      >
        <div
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          style={{
            transform: verificado ? 'none' : `translateX(${position}px)`,
          }}
          className={`absolute h-10 w-11 rounded-md flex items-center justify-center font-black text-base cursor-grab active:cursor-grabbing transition-transform ${
            verificado
              ? 'right-1 top-1 bg-[#1fd18f] text-[#08070b] shadow-md pointer-events-none'
              : 'left-1 top-1 bg-[#680c90] text-white shadow-lg'
          }`}
        >
          {verificado ? '✓' : '⇒'}
        </div>
        <span className="text-xs font-bold pointer-events-none flex items-center gap-1.5">
          {verificado ? (
            <>
              <span className="text-sm">✔</span> Verificado
            </>
          ) : (
            'Deslize para verificar →'
          )}
        </span>
      </div>
    </div>
  );
};
