import React from 'react';

const RPM_COLORS = [
  '#00f2ff', '#00f2ff', '#00f2ff', '#00f2ff',
  '#00f2ff', '#00f2ff', '#00f2ff', '#ffcc00',
  '#ffcc00', '#ffcc00', '#ff8800', '#ff8800',
  '#e10000', '#e10000', '#e10000', '#e10000'
];

export default function HUD({ gameState, onBack }) {
  const {
    lapTime = 0,
    bestLap = null,
    lap = 1,
    totalLaps = 5,
    speed = 0,
    gear = 0,
    rpmRatio = 0,
    lapNotify = false,
    offTrack = false,
    finished = false,
  } = gameState;

  const activeRpm = Math.floor(rpmRatio * 16);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 p-4 flex flex-col justify-between font-mono">
      {/* Top row */}
      <div className="flex justify-between items-start">
        <div className="bg-black/75 border border-border backdrop-blur-sm px-4 py-2">
          <span className="text-[11px] tracking-widest text-muted-foreground">TIEMPO VUELTA</span>
          <div className="text-xl font-black text-accent leading-tight">{lapTime.toFixed(2)}</div>
          <div className="text-[9px] text-muted-foreground/50 mt-0.5">
            MEJOR: <span>{bestLap ? bestLap.toFixed(2) : '--'}s</span>
          </div>
        </div>
        <button
          onClick={onBack}
          className="pointer-events-auto bg-black/90 border border-primary text-primary 
                     px-5 py-2 font-mono text-[10px] tracking-[3px] uppercase cursor-pointer 
                     transition-all hover:bg-primary hover:text-white backdrop-blur-sm"
        >
          ← MENÚ
        </button>
      </div>

      {/* Lap notification */}
      {lapNotify && (
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2
                        font-black text-5xl italic text-primary
                        drop-shadow-[0_0_50px_rgba(225,0,0,1)] z-50">
          VUELTA ✓
        </div>
      )}

      {/* Finished notification */}
      {finished && (
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2
                        text-center z-50">
          <div className="font-black text-5xl italic text-primary
                          drop-shadow-[0_0_50px_rgba(225,0,0,1)]">
            ¡CARRERA TERMINADA!
          </div>
          <div className="text-accent text-2xl font-bold mt-2">
            Mejor vuelta: {bestLap ? bestLap.toFixed(2) : '--'}s
          </div>
        </div>
      )}

      {/* Off track */}
      {offTrack && (
        <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2
                        font-black text-xl italic text-orange-500
                        drop-shadow-[0_0_20px_rgba(255,136,0,0.8)] z-50">
          ⚠ FUERA DE PISTA
        </div>
      )}

      {/* Bottom row */}
      <div className="flex justify-between items-end">
        {/* Gear + RPM */}
        <div className="flex items-end gap-3">
          <div className="bg-black/80 border border-border px-4 py-1.5 text-center">
            <div className="font-black text-4xl text-primary leading-none">
              {gear === 0 ? 'N' : gear}
            </div>
            <div className="text-[8px] text-muted-foreground/50 tracking-[3px]">MARCHA</div>
          </div>
          <div className="flex items-end gap-[3px] h-[50px]">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="w-2 rounded-t-sm transition-colors duration-50"
                style={{
                  height: `${15 + i * 2.2}px`,
                  backgroundColor: i < activeRpm ? RPM_COLORS[i] : '#1a1a1a',
                }}
              />
            ))}
          </div>
        </div>

        {/* Speed + Lap */}
        <div className="flex gap-2">
          <div className="bg-black/75 border border-border backdrop-blur-sm px-4 py-2">
            <span className="text-[11px] tracking-widest text-primary">VUELTA</span>
            <div className="text-xl font-black text-primary leading-tight">
              {lap} / {totalLaps}
            </div>
          </div>
          <div className="bg-black/75 border border-border backdrop-blur-sm px-4 py-2">
            <span className="text-[11px] tracking-widest text-muted-foreground">VELOCIDAD</span>
            <div className="text-xl font-black text-accent leading-tight">
              {Math.floor(speed * 160)} km/h
            </div>
          </div>
        </div>
      </div>

      {/* Controls help */}
      <div className="absolute bottom-2 left-0 w-full text-center text-[10px] text-muted-foreground/30 tracking-widest">
        [W/↑] ACELERAR · [A/D / ←→] GIRAR · [S/↓] FRENAR · [ESPACIO] FRENO · [Q] BAJAR MARCHA · [E] SUBIR MARCHA
      </div>
    </div>
  );
}