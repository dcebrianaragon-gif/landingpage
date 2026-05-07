import React, { memo } from 'react';

const RPM_COLORS = [
  '#00f2ff', '#00f2ff', '#00f2ff', '#00f2ff',
  '#00f2ff', '#00f2ff', '#00f2ff', '#ffcc00',
  '#ffcc00', '#ffcc00', '#ff8800', '#ff8800',
  '#e10000', '#e10000', '#e10000', '#e10000',
];

function formatTime(seconds) {
  return seconds ? `${seconds.toFixed(2)}s` : '--';
}

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
    countdown = null,
    boostMeter = 100,
    boosting = false,
    precision = 100,
    precisionAverage = 100,
    maxSpeed = 0,
    padHits = 0,
  } = gameState;

  const activeRpm = Math.floor(rpmRatio * 16);
  const boostLevel = Math.max(0, Math.min(100, boostMeter));
  const livePrecision = Math.round(precision);
  const avgPrecision = Math.round(precisionAverage);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 font-mono text-white">
      <div className="flex items-start justify-between gap-4">
        <div className="retro-hud-box px-4 py-2">
          <span className="text-[10px] tracking-[3px] text-[#ffef5a]">LAP TIME</span>
          <div className="retro-digits text-2xl font-black leading-tight text-[#00f2ff]">{lapTime.toFixed(2)}</div>
          <div className="mt-0.5 text-[9px] tracking-[2px] text-white/55">
            MEJOR: <span>{formatTime(bestLap)}</span>
          </div>
        </div>

        <div className="retro-hud-box hidden px-4 py-2 text-center md:block">
          <span className="text-[10px] tracking-[3px] text-[#ffef5a]">RACING LINE</span>
          <div className="retro-digits text-xl font-black leading-tight text-[#7af8ff]">{livePrecision}%</div>
          <div className="mt-0.5 text-[9px] tracking-[2px] text-white/55">
            MEDIA: <span>{avgPrecision}%</span>
          </div>
        </div>

        <button
          onClick={onBack}
          className="retro-button pointer-events-auto cursor-pointer px-5 py-2 font-mono text-[10px] uppercase tracking-[3px]"
        >
          MENU
        </button>
      </div>

      {countdown && !finished && (
        <div className="retro-countdown absolute left-1/2 top-[41%] z-50 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-[12px] tracking-[5px] text-[#ffef5a]">GET READY</div>
          <div className="retro-popup mt-3 text-6xl font-black italic md:text-7xl">
            {countdown}
          </div>
        </div>
      )}

      {lapNotify && (
        <div className="retro-popup absolute left-1/2 top-[42%] z-50 -translate-x-1/2 -translate-y-1/2 text-5xl font-black italic">
          LAP CLEAR
        </div>
      )}

      {finished && (
        <div className="retro-finish-panel absolute left-1/2 top-[39%] z-50 w-[min(92vw,540px)] -translate-x-1/2 -translate-y-1/2 px-5 py-5 text-center">
          <div className="retro-popup text-4xl font-black italic md:text-5xl">
            GAME CLEAR
          </div>
          <div className="retro-finish-grid mt-5 grid grid-cols-2 gap-3 text-left">
            <div className="retro-hud-box px-3 py-3">
              <span className="text-[9px] tracking-[3px] text-[#ffef5a]">BEST LAP</span>
              <div className="retro-digits mt-1 text-lg text-[#00f2ff]">{formatTime(bestLap)}</div>
            </div>
            <div className="retro-hud-box px-3 py-3">
              <span className="text-[9px] tracking-[3px] text-[#ffef5a]">V MAX</span>
              <div className="retro-digits mt-1 text-lg text-[#ff2aa1]">{Math.floor(maxSpeed * 160)} km/h</div>
            </div>
            <div className="retro-hud-box px-3 py-3">
              <span className="text-[9px] tracking-[3px] text-[#ffef5a]">LINE AVG</span>
              <div className="retro-digits mt-1 text-lg text-[#7af8ff]">{avgPrecision}%</div>
            </div>
            <div className="retro-hud-box px-3 py-3">
              <span className="text-[9px] tracking-[3px] text-[#ffef5a]">BOOST PADS</span>
              <div className="retro-digits mt-1 text-lg text-[#ffef5a]">{padHits}</div>
            </div>
          </div>
        </div>
      )}

      {offTrack && (
        <div className="retro-warning absolute left-1/2 top-[28%] z-50 -translate-x-1/2 -translate-y-1/2 text-xl font-black italic">
          OUT RUN
        </div>
      )}

      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
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

          <div className="retro-hud-box px-3 py-3">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-[3px]">
              <span className="text-[#ffef5a]">Turbo</span>
              <span className={boosting ? 'text-white' : 'text-white/60'}>
                {boosting ? 'BOOST ON' : `${Math.round(boostLevel)}%`}
              </span>
            </div>
            <div className="retro-boost-shell mt-2 h-3 w-full overflow-hidden">
              <div
                className={`retro-boost-fill h-full ${boosting ? 'is-boosting' : ''}`}
                style={{ width: `${boostLevel}%` }}
              />
            </div>
          </div>
        </div>

        <div className="retro-hud-metrics grid grid-cols-2 gap-2">
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
          <div className="retro-hud-box px-4 py-2 md:hidden">
            <span className="text-[10px] tracking-[3px] text-[#ffef5a]">LINE</span>
            <div className="retro-digits text-xl font-black leading-tight text-[#7af8ff]">
              {livePrecision}%
            </div>
          </div>
          <div className="retro-hud-box px-4 py-2">
            <span className="text-[10px] tracking-[3px] text-[#ffef5a]">V MAX</span>
            <div className="retro-digits text-xl font-black leading-tight text-[#ffef5a]">
              {Math.floor(maxSpeed * 160)} km/h
            </div>
          </div>
        </div>
      </div>

      <div className="retro-help absolute bottom-2 left-0 w-full text-center text-[10px] tracking-widest">
        W/UP GAS - A/D STEER - S/DOWN BRAKE - SPACE HARD BRAKE - Q/E GEAR - SHIFT TURBO
      </div>
    </div>
  );
}

export default memo(HUD);
