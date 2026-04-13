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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <div className="max-h-[92vh] w-[95%] max-w-[740px] overflow-y-auto border-2 border-primary p-8 text-center scrollbar-thin scrollbar-thumb-primary">
        <h1 className="font-black italic text-3xl uppercase tracking-tight">
          MOTOGP TM <span className="text-primary">SIMULATOR</span>
        </h1>
        <span className="mb-7 block text-[10px] tracking-[3px] text-muted-foreground/40">
          2026 SEASON - SELECT YOUR SETUP
        </span>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm tracking-widest">CARGANDO DATOS...</span>
          </div>
        ) : (
          <>
            <div className="mb-3 border-b border-border pb-1 text-left text-[9px] uppercase tracking-[4px] text-muted-foreground/60">
              Elige circuito
            </div>
            <div className="mb-5 grid grid-cols-3 gap-2">
              {circuits.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCircuit(c.id)}
                  className={`cursor-pointer border bg-transparent px-2 py-3 text-center font-mono text-[11px] uppercase transition-all ${
                    selectedCircuit === c.id
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-border text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-white'
                  }`}
                >
                  {c.flag} {c.name}
                  <span className="mt-1 block text-[8px] normal-case text-muted-foreground/50">
                    {c.laps || 5} vueltas
                  </span>
                </button>
              ))}
            </div>

            <div className="mb-3 border-b border-border pb-1 text-left text-[9px] uppercase tracking-[4px] text-muted-foreground/60">
              Elige tu moto
            </div>
            <div className="mb-6 grid grid-cols-2 gap-2">
              {bikes.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onSelectBike(b.id)}
                  className={`cursor-pointer border bg-transparent px-2 py-3 text-center font-mono text-[11px] uppercase transition-all ${
                    selectedBike === b.id
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-border text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-white'
                  }`}
                >
                  {b.flag} {b.name}
                  <span className="mt-1 block text-[8px] normal-case text-muted-foreground/50">
                    {b.info}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={onLaunch}
              disabled={!selectedCircuit || !selectedBike}
              className="w-full cursor-pointer border-2 border-primary bg-transparent py-4 text-[15px] font-black italic uppercase tracking-[5px] text-primary transition-all hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary"
            >
              Iniciar carrera
            </button>
          </>
        )}
      </div>
    </div>
  );
}
