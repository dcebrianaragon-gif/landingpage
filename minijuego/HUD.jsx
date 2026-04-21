import React, { memo } from 'react';

const RPM_COLORS = [
  '#00f2ff', '#00f2ff', '#00f2ff', '#00f2ff',
  '#00f2ff', '#00f2ff', '#00f2ff', '#ffcc00',
  '#ffcc00', '#ffcc00', '#ff8800', '#ff8800',
  '#e10000', '#e10000', '#e10000', '#e10000',
];

function HUD({ gameState, onBack }) {
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
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 font-mono text-white">
      <div className="flex items-start justify-between">
        <div className="retro-hud-box px-4 py-2">
          <span className="text-[10px] tracking-[3px] text-[#ffef5a]">LAP TIME</span>
          <div className="retro-digits text-2xl font-black leading-tight text-[#00f2ff]">{lapTime.toFixed(2)}</div>
          <div className="mt-0.5 text-[9px] tracking-[2px] text-white/55">
            MEJOR: <span>{bestLap ? bestLap.toFixed(2) : '--'}s</span>
          </div>
        </div>
        <button
          onClick={onBack}
          className="retro-button pointer-events-auto cursor-pointer px-5 py-2 font-mono text-[10px] uppercase tracking-[3px]"
        >
          MENU
        </button>
      </div>

      {lapNotify && (
        <div className="retro-popup absolute left-1/2 top-[42%] z-50 -translate-x-1/2 -translate-y-1/2 text-5xl font-black italic">
          LAP CLEAR
        </div>
      )}

      {finished && (
        <div className="absolute left-1/2 top-[38%] z-50 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="retro-popup text-5xl font-black italic">
            GAME CLEAR
          </div>
          <div className="retro-digits mt-2 text-2xl font-bold text-[#00f2ff]">
            Mejor vuelta: {bestLap ? bestLap.toFixed(2) : '--'}s
          </div>
        </div>
      )}

      {offTrack && (
        <div className="retro-warning absolute left-1/2 top-[28%] z-50 -translate-x-1/2 -translate-y-1/2 text-xl font-black italic">
          OUT RUN
        </div>
      )}

      <div className="flex items-end justify-between">
        <div className="flex items-end gap-3">
          <div className="retro-hud-box px-4 py-1.5 text-center">
            <div className="retro-digits text-5xl font-black leading-none text-[#ff2aa1]">
              {gear === 0 ? 'N' : gear}
            </div>
            <div className="text-[8px] tracking-[3px] text-white/55">GEAR</div>
          </div>
          <div className="flex h-[50px] items-end gap-[3px]">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="w-2 transition-colors duration-50"
                style={{
                  height: `${15 + i * 2.2}px`,
                  backgroundColor: i < activeRpm ? RPM_COLORS[i] : '#140926',
                  boxShadow: i < activeRpm ? `0 0 10px ${RPM_COLORS[i]}` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="retro-hud-box px-4 py-2">
            <span className="text-[10px] tracking-[3px] text-[#ffef5a]">LAP</span>
            <div className="retro-digits text-xl font-black leading-tight text-[#ff2aa1]">
              {lap} / {totalLaps}
            </div>
          </div>
          <div className="retro-hud-box px-4 py-2">
            <span className="text-[10px] tracking-[3px] text-[#ffef5a]">SPEED</span>
            <div className="retro-digits text-xl font-black leading-tight text-[#00f2ff]">
              {Math.floor(speed * 160)} km/h
            </div>
          </div>
        </div>
      </div>

      <div className="retro-help absolute bottom-2 left-0 w-full text-center text-[10px] tracking-widest">
        W/UP GAS - A/D STEER - S/DOWN BRAKE - SPACE HARD BRAKE - Q/E GEAR
      </div>
    </div>
  );
}

export default memo(HUD);
