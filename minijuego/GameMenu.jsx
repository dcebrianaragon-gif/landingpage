import React from 'react';
import { Loader2 } from 'lucide-react';

export default function GameMenu({
  circuits,
  bikes,
  selectedCircuit,
  selectedBike,
  onSelectCircuit,
  onSelectBike,
  onLaunch,
  loading,
}) {
  return (
    <div className="retro-menu fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3">
      <div className="retro-menu-panel max-h-[92vh] w-[95%] max-w-[820px] overflow-y-auto p-7 text-center scrollbar-thin scrollbar-thumb-primary">
        <h1 className="retro-title font-black italic text-4xl uppercase tracking-tight">
          MotoGP <span>PIXEL GP</span>
        </h1>
        <span className="mb-7 block text-[10px] tracking-[4px] text-[#ffef5a]">
          INSERT COIN - SELECT YOUR MACHINE
        </span>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-[#00f2ff]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm tracking-widest">CARGANDO DATOS...</span>
          </div>
        ) : (
          <>
            <div className="retro-section-label mb-3 pb-1 text-left text-[9px] uppercase tracking-[4px]">
              Stage select
            </div>
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {circuits.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCircuit(c.id)}
                  className={`retro-select-card group relative min-h-[138px] cursor-pointer overflow-hidden bg-black text-left font-mono uppercase transition-all ${
                    selectedCircuit === c.id
                      ? 'is-selected text-white'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  {c.image_url && (
                    <img
                      src={c.image_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-55 grayscale contrast-125 transition duration-500 group-hover:scale-105 group-hover:opacity-80 group-hover:grayscale-0"
                    />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black via-[#140926]/65 to-transparent" />
                  <span className="relative z-10 flex h-full min-h-[132px] flex-col justify-end p-3">
                    <span className="text-[10px] tracking-[3px] text-[#ffef5a]">{c.flag}</span>
                    <span className="mt-1 text-[15px] font-black italic leading-tight tracking-tight text-white drop-shadow-[2px_2px_0_#000]">
                      {c.name}
                    </span>
                    <span className="mt-2 text-[8px] normal-case tracking-[2px] text-[#00f2ff]">
                      {c.laps || 5} laps - satellite stage
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="retro-section-label mb-3 pb-1 text-left text-[9px] uppercase tracking-[4px]">
              Bike select
            </div>
            <div className="mb-6 grid grid-cols-2 gap-2">
              {bikes.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onSelectBike(b.id)}
                  className={`retro-bike-chip cursor-pointer px-2 py-3 text-center font-mono text-[11px] uppercase transition-all ${
                    selectedBike === b.id
                      ? 'is-selected text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {b.flag} {b.name}
                  <span className="mt-1 block text-[8px] normal-case text-[#00f2ff]/70">
                    {b.info}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={onLaunch}
              disabled={!selectedCircuit || !selectedBike}
              className="retro-start-button w-full cursor-pointer py-4 text-[15px] font-black italic uppercase tracking-[5px] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Start race
            </button>
          </>
        )}
      </div>
    </div>
  );
}
