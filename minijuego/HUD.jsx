import React from 'react';

const RPM_COLORS = [
  '#00f2ff', '#00f2ff', '#00f2ff', '#00f2ff',
  '#00f2ff', '#00f2ff', '#00f2ff', '#ffcc00',
  '#ffcc00', '#ffcc00', '#ff8800', '#ff8800',
  '#e10000', '#e10000', '#e10000', '#e10000',
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
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 font-mono">
      <div className="flex items-start justify-between">
        <div className="border border-border bg-black/75 px-4 py-2 backdrop-blur-sm">
          <span className="text-[11px] tracking-widest text-muted-foreground">TIEMPO VUELTA</span>
          <div className="text-xl font-black leading-tight text-accent">{lapTime.toFixed(2)}</div>
          <div className="mt-0.5 text-[9px] text-muted-foreground/50">
            MEJOR: <span>{bestLap ? bestLap.toFixed(2) : '--'}s</span>
          </div>
        </div>
        <button
          onClick={onBack}
          className="pointer-events-auto cursor-pointer border border-primary bg-black/90 px-5 py-2 font-mono text-[10px] uppercase tracking-[3px] text-primary transition-all hover:bg-primary hover:text-white backdrop-blur-sm"
        >
          Volver al menu
        </button>
      </div>

      {lapNotify && (
        <div className="absolute left-1/2 top-[42%] z-50 -translate-x-1/2 -translate-y-1/2 text-5xl font-black italic text-primary drop-shadow-[0_0_50px_rgba(225,0,0,1)]">
          Vuelta completada
        </div>
      )}

      {finished && (
        <div className="absolute left-1/2 top-[38%] z-50 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-5xl font-black italic text-primary drop-shadow-[0_0_50px_rgba(225,0,0,1)]">
            Carrera terminada
          </div>
          <div className="mt-2 text-2xl font-bold text-accent">
            Mejor vuelta: {bestLap ? bestLap.toFixed(2) : '--'}s
          </div>
        </div>
      )}

      {offTrack && (
        <div className="absolute left-1/2 top-[28%] z-50 -translate-x-1/2 -translate-y-1/2 text-xl font-black italic text-orange-500 drop-shadow-[0_0_20px_rgba(255,136,0,0.8)]">
          Fuera de pista
        </div>
      )}

      <div className="flex items-end justify-between">
        <div className="flex items-end gap-3">
          <div className="border border-border bg-black/80 px-4 py-1.5 text-center">
            <div className="text-4xl font-black leading-none text-primary">
              {gear === 0 ? 'N' : gear}
            </div>
            <div className="text-[8px] tracking-[3px] text-muted-foreground/50">MARCHA</div>
          </div>
          <div className="flex h-[50px] items-end gap-[3px]">
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

        <div className="flex gap-2">
          <div className="border border-border bg-black/75 px-4 py-2 backdrop-blur-sm">
            <span className="text-[11px] tracking-widest text-primary">VUELTA</span>
            <div className="text-xl font-black leading-tight text-primary">
              {lap} / {totalLaps}
            </div>
          </div>
          <div className="border border-border bg-black/75 px-4 py-2 backdrop-blur-sm">
            <span className="text-[11px] tracking-widest text-muted-foreground">VELOCIDAD</span>
            <div className="text-xl font-black leading-tight text-accent">
              {Math.floor(speed * 160)} km/h
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-2 left-0 w-full text-center text-[10px] tracking-widest text-muted-foreground/30">
        [W/FLECHA ARRIBA] ACELERAR - [A/D o IZQ/DER] GIRAR - [S/FLECHA ABAJO] FRENAR - [ESPACIO] FRENO - [Q] BAJAR MARCHA - [E] SUBIR MARCHA
      </div>
    </div>
  );
}
