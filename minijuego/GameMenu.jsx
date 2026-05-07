import React from 'react';
import { Loader2 } from 'lucide-react';

function statWidth(value, maxValue) {
  return `${Math.max(12, Math.min(100, (value / maxValue) * 100))}%`;
}

function MenuStat({ label, value, fillWidth, fillClass }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[8px] uppercase tracking-[3px] text-white/70">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="retro-stat-bar h-2 overflow-hidden">
        <div className={`retro-stat-fill h-full ${fillClass}`} style={{ width: fillWidth }} />
      </div>
    </div>
  );
}

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
  const activeCircuit = circuits.find((circuit) => circuit.id === selectedCircuit) || circuits[0];
  const activeBike = bikes.find((bike) => bike.id === selectedBike) || bikes[0];

  return (
    <div className="retro-menu fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3">
      <div className="retro-menu-panel max-h-[92vh] w-[95%] max-w-[1040px] overflow-y-auto p-7 text-center scrollbar-thin scrollbar-thumb-primary">
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
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
              <div>
                <div className="retro-section-label mb-3 pb-1 text-left text-[9px] uppercase tracking-[4px]">
                  Stage select
                </div>
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {circuits.map((c) => (
                    <button
                      key={c.id}
                      type="button"
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
                <div className="grid grid-cols-2 gap-2">
                  {bikes.map((b) => (
                    <button
                      key={b.id}
                      type="button"
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
              </div>

              <aside className="retro-preview-panel flex flex-col gap-4 text-left">
                <div className="retro-section-label pb-1 text-[9px] uppercase tracking-[4px]">
                  Race briefing
                </div>

                {activeCircuit && (
                  <div className="retro-hud-box overflow-hidden p-0">
                    {activeCircuit.image_url && (
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={activeCircuit.image_url}
                          alt=""
                          className="h-full w-full object-cover opacity-75"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <div className="text-[9px] tracking-[3px] text-[#ffef5a]">{activeCircuit.flag}</div>
                          <div className="text-2xl font-black italic text-white">{activeCircuit.name}</div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2 px-4 py-4 text-center">
                      <div>
                        <div className="text-[8px] tracking-[3px] text-white/55">LAPS</div>
                        <div className="retro-digits mt-1 text-lg text-[#00f2ff]">{activeCircuit.laps || 5}</div>
                      </div>
                      <div>
                        <div className="text-[8px] tracking-[3px] text-white/55">WIDTH</div>
                        <div className="retro-digits mt-1 text-lg text-[#ff2aa1]">{activeCircuit.track_width || 13}</div>
                      </div>
                      <div>
                        <div className="text-[8px] tracking-[3px] text-white/55">STYLE</div>
                        <div className="retro-digits mt-1 text-lg text-[#ffef5a]">ARCADE</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeBike && (
                  <div className="retro-hud-box p-4">
                    <div className="mb-3">
                      <div className="text-[9px] tracking-[3px] text-[#ffef5a]">SELECTED BIKE</div>
                      <div className="mt-1 text-2xl font-black italic text-white">{activeBike.flag} {activeBike.name}</div>
                      <div className="mt-1 text-[11px] text-[#7eefff]">{activeBike.info}</div>
                    </div>

                    <div className="space-y-3">
                      <MenuStat
                        label="Top speed"
                        value={`${Math.round((activeBike.max_speed || 2.3) * 160)} km/h`}
                        fillWidth={statWidth(activeBike.max_speed || 2.3, 2.8)}
                        fillClass="bg-[#ff2aa1]"
                      />
                      <MenuStat
                        label="Accel"
                        value={(activeBike.accel || 0.033).toFixed(3)}
                        fillWidth={statWidth(activeBike.accel || 0.033, 0.05)}
                        fillClass="bg-[#00f2ff]"
                      />
                      <MenuStat
                        label="Brakes"
                        value={(activeBike.brake || 0.065).toFixed(3)}
                        fillWidth={statWidth(activeBike.brake || 0.065, 0.08)}
                        fillClass="bg-[#ffef5a]"
                      />
                      <MenuStat
                        label="Handling"
                        value={(activeBike.turn || 0.045).toFixed(3)}
                        fillWidth={statWidth(activeBike.turn || 0.045, 0.06)}
                        fillClass="bg-[#ff8800]"
                      />
                    </div>

                    <div className="mt-4 rounded-sm border border-white/10 bg-black/35 px-3 py-3 text-[10px] leading-5 text-white/75">
                      Usa los pads amarillos para recargar turbo, mantente cerca de la racing line y activa <span className="text-[#ffef5a]">SHIFT</span> en recta para exprimir la vuelta.
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onLaunch}
                  disabled={!selectedCircuit || !selectedBike}
                  className="retro-start-button mt-auto w-full cursor-pointer py-4 text-[15px] font-black italic uppercase tracking-[5px] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Start race
                </button>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
