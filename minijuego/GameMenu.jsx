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
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
      <div className="border-2 border-primary p-8 max-w-[740px] w-[95%] max-h-[92vh] overflow-y-auto text-center
                      scrollbar-thin scrollbar-thumb-primary">
        <h1 className="font-black italic text-3xl uppercase tracking-tight">
          MOTOGP™ <span className="text-primary">SIMULATOR</span>
        </h1>
        <span className="text-muted-foreground/40 text-[10px] tracking-[3px] block mb-7">
          2026 SEASON · SELECT YOUR SETUP
        </span>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm tracking-widest">CARGANDO DATOS...</span>
          </div>
        ) : (
          <>
            {/* Circuits */}
            <div className="text-[9px] text-muted-foreground/60 tracking-[4px] uppercase mb-3 border-b border-border pb-1 text-left">
              Elige Circuito
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {circuits.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCircuit(c.id)}
                  className={`bg-transparent border px-2 py-3 font-mono text-[11px] cursor-pointer 
                             transition-all text-center uppercase
                             ${selectedCircuit === c.id
                               ? 'border-primary bg-primary/10 text-white'
                               : 'border-border text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-white'
                             }`}
                >
                  {c.flag} {c.name}
                  <span className="block text-[8px] text-muted-foreground/50 normal-case mt-1">
                    {c.laps || 5} vueltas
                  </span>
                </button>
              ))}
            </div>

            {/* Bikes */}
            <div className="text-[9px] text-muted-foreground/60 tracking-[4px] uppercase mb-3 border-b border-border pb-1 text-left">
              Elige tu Moto
            </div>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {bikes.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onSelectBike(b.id)}
                  className={`bg-transparent border px-2 py-3 font-mono text-[11px] cursor-pointer 
                             transition-all text-center uppercase
                             ${selectedBike === b.id
                               ? 'border-primary bg-primary/10 text-white'
                               : 'border-border text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-white'
                             }`}
                >
                  {b.flag} {b.name}
                  <span className="block text-[8px] text-muted-foreground/50 normal-case mt-1">
                    {b.info}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={onLaunch}
              disabled={!selectedCircuit || !selectedBike}
              className="w-full py-4 bg-transparent border-2 border-primary text-primary font-black 
                         italic text-[15px] tracking-[5px] uppercase cursor-pointer transition-all
                         hover:bg-primary hover:text-white
                         disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary"
            >
              ▶ ENCENDER MOTOR
            </button>
          </>
        )}
      </div>
    </div>
  );
}