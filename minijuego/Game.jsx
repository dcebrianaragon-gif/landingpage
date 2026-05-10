import React, { lazy, startTransition, Suspense, useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useQuery } from '@tanstack/react-query';
import { buildTrack, buildBike } from '@/components/game/GameEngine.jsx';
import GameMenu from '@/components/game/GameMenu';
import { Link } from 'react-router-dom';
import { ChevronLeft, Settings } from 'lucide-react';
import { localData } from '@/data/localData.js';

const menuAudioUrl = new URL('./assets/audio/menu.ogg', import.meta.url).href;
const gameAudioUrl = new URL('./assets/audio/game-2d.ogg', import.meta.url).href;
const buttonAudioUrl = new URL('./assets/audio/button.ogg', import.meta.url).href;

const HUD = lazy(() => import('@/components/game/HUD'));
const Minimap = lazy(() => import('@/components/game/Minimap'));

const UI_UPDATE_INTERVAL_MS = 50;
const MINIMAP_UPDATE_INTERVAL_MS = 80;
const TARGET_FRAME_MS = 1000 / 60;
const ORTHO_VIEW_HEIGHT = 220;
const CAMERA_ALTITUDE = 220;
const COUNTDOWN_DURATION_MS = 3200;
const BOOST_METER_MAX = 100;
const BOOST_PAD_COOLDOWN_MS = 2200;
const BOOST_PAD_METER_GAIN = 24;
const BOOST_PAD_SPEED_KICK = 0.2;
const BOOST_DRAIN_PER_FRAME = 0.48;
const BOOST_RECOVERY_PER_FRAME = 0.18;

function applyCameraFrustum(camera, viewHeight, viewport) {
  const aspect = viewport.width / viewport.height;
  camera.left = (-viewHeight * aspect) / 2;
  camera.right = (viewHeight * aspect) / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
}

function getCountdownLabel(now, countdownEnd) {
  const remaining = countdownEnd - now;
  if (remaining <= 0) return null;
  if (remaining > 2400) return '3';
  if (remaining > 1600) return '2';
  if (remaining > 800) return '1';
  return 'GO';
}

function getLandingUrl() {
  const currentUrl = new URL(window.location.href);
  const relativePath = currentUrl.pathname.includes('/dist/') ? '../../entrada1.html' : '../entrada1.html';
  return new URL(relativePath, currentUrl.href).href;
}

function disposeSceneObject(object) {
  if (!object) return;

  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    const { material } = child;
    if (!material) return;

    if (Array.isArray(material)) {
      material.forEach((entry) => {
        entry?.map?.dispose?.();
        entry?.dispose?.();
      });
      return;
    }

    material.map?.dispose?.();
    material.dispose?.();
  });
}

export default function Game() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const bikeRef = useRef(null);
  const lapNotifyTimeoutRef = useRef(null);
  const uiFrameRef = useRef({ hud: 0, minimap: 0 });
  const viewportRef = useRef({ width: window.innerWidth, height: window.innerHeight });
  const stateRef = useRef({
    isPlaying: false,
    speed: 0,
    heading: 0,
    leanAngle: 0,
    gear: 0,
    steerInput: 0,
    onTrack: true,
    offTrackTimer: 0,
    lapCount: 1,
    lapStart: 0,
    bestLap: null,
    halfwayDone: false,
    closestT: 0,
    lapCooldown: 0,
    visualTime: 0,
    wheelSpin: 0,
    lastFrameTime: 0,
    spline: null,
    racingLinePoints: [],
    boostPads: [],
    boostPadCooldowns: [],
    startPos: new THREE.Vector3(),
    startHeading: 0,
    trackMeshes: [],
    bkCfg: null,
    circuit: null,
    camTarget: new THREE.Vector3(),
    camLook: new THREE.Vector3(),
    finished: false,
    finishedAt: 0,
    raceStarted: false,
    countdownEnd: 0,
    countdownLabel: null,
    boostMeter: BOOST_METER_MAX,
    boostActive: false,
    precision: 100,
    precisionAccum: 0,
    precisionSamples: 0,
    precisionAverage: 100,
    maxSpeed: 0,
    padHits: 0,
    cameraViewHeight: ORTHO_VIEW_HEIGHT,
  });
  const keysRef = useRef({});
  const animRef = useRef(null);
  const gearKeyRef = useRef({ q: false, e: false });
  const audioRef = useRef({
    unlocked: false,
    menu: null,
    game: null,
    button: null,
  });
  const showMenuRef = useRef(true);

  const [showMenu, setShowMenu] = useState(true);
  const [selectedCircuit, setSelectedCircuit] = useState(null);
  const [selectedBike, setSelectedBike] = useState(null);
  const [gameState, setGameState] = useState({
    lapTime: 0,
    bestLap: null,
    lap: 1,
    totalLaps: 5,
    speed: 0,
    gear: 0,
    rpmRatio: 0,
    lapNotify: false,
    offTrack: false,
    finished: false,
    countdown: null,
    boostMeter: BOOST_METER_MAX,
    boosting: false,
    precision: 100,
    precisionAverage: 100,
    maxSpeed: 0,
    padHits: 0,
  });
  const [minimapData, setMinimapData] = useState({
    spline: null,
    bikePos: null,
    bikeHeading: 0,
    startPos: null,
    trackW: 13,
    bikeColor: 0xe10000,
    boostPads: [],
  });

  const goBackToSite = useCallback(() => {
    const fallbackUrl = getLandingUrl();

    if (window.history.length > 1 && document.referrer) {
      try {
        const previousUrl = new URL(document.referrer);
        if (previousUrl.origin === window.location.origin) {
          window.history.back();
          return;
        }
      } catch (error) {
        // Use the fallback URL below if referrer parsing fails.
      }
    }

    window.location.href = fallbackUrl;
  }, []);

  useEffect(() => {
    showMenuRef.current = showMenu;
  }, [showMenu]);

  useEffect(() => {
    const audio = audioRef.current;
    audio.menu = new Audio(menuAudioUrl);
    audio.game = new Audio(gameAudioUrl);
    audio.button = new Audio(buttonAudioUrl);

    audio.menu.loop = true;
    audio.menu.volume = 0.24;
    audio.game.loop = true;
    audio.game.volume = 0.18;
    audio.button.volume = 0.48;

    const play = (sound) => {
      if (!sound) return;
      sound.currentTime = 0;
      sound.play().catch(() => {});
    };

    const unlock = () => {
      audio.unlocked = true;
      if (showMenuRef.current) {
        audio.game.pause();
        audio.menu.play().catch(() => {});
      }
    };

    const handlePress = (event) => {
      const target = event.target;
      if (target?.closest?.('button, a, .retro-select-card, .retro-bike-chip')) {
        play(audio.button);
      }
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    document.addEventListener('click', handlePress, true);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      document.removeEventListener('click', handlePress, true);
      audio.menu?.pause();
      audio.game?.pause();
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio.unlocked || !audio.menu || !audio.game) return;

    if (showMenu) {
      audio.game.pause();
      audio.menu.play().catch(() => {});
      return;
    }

    audio.menu.pause();
    audio.game.play().catch(() => {});
  }, [showMenu]);

  const { data: circuits = [], isLoading: loadingCircuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => localData.listCircuits(),
  });

  const { data: bikes = [], isLoading: loadingBikes } = useQuery({
    queryKey: ['bikes'],
    queryFn: () => localData.listBikes(),
  });

  useEffect(() => {
    if (circuits.length > 0 && !selectedCircuit) setSelectedCircuit(circuits[0].id);
  }, [circuits, selectedCircuit]);

  useEffect(() => {
    if (bikes.length > 0 && !selectedBike) setSelectedBike(bikes[0].id);
  }, [bikes, selectedBike]);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070016);
    sceneRef.current = scene;

    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.OrthographicCamera(
      (-ORTHO_VIEW_HEIGHT * aspect) / 2,
      (ORTHO_VIEW_HEIGHT * aspect) / 2,
      ORTHO_VIEW_HEIGHT / 2,
      -ORTHO_VIEW_HEIGHT / 2,
      0.1,
      1000
    );
    camera.position.set(0, CAMERA_ALTITUDE, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.className = 'retro-game-canvas';
    rendererRef.current = renderer;

    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }

    renderer.render(scene, camera);

    const handleResize = () => {
      viewportRef.current = { width: window.innerWidth, height: window.innerHeight };
      renderer.setPixelRatio(1);
      renderer.setSize(window.innerWidth, window.innerHeight);
      applyCameraFrustum(camera, stateRef.current.cameraViewHeight || ORTHO_VIEW_HEIGHT, viewportRef.current);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (lapNotifyTimeoutRef.current) clearTimeout(lapNotifyTimeoutRef.current);
      stateRef.current.trackMeshes.forEach((mesh) => disposeSceneObject(mesh));
      if (bikeRef.current) {
        disposeSceneObject(bikeRef.current);
      }
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const s = stateRef.current;
      if (!s.isPlaying || !s.bkCfg) return;

      if ((e.key === 'q' || e.key === 'Q') && !gearKeyRef.current.q) {
        gearKeyRef.current.q = true;
        if (s.gear > 1) s.gear--;
      }
      if ((e.key === 'e' || e.key === 'E') && !gearKeyRef.current.e) {
        gearKeyRef.current.e = true;
        if (s.gear < s.bkCfg.topGear) s.gear++;
      }
    };

    const up = (e) => {
      keysRef.current[e.key] = false;
      if (e.key === 'q' || e.key === 'Q') gearKeyRef.current.q = false;
      if (e.key === 'e' || e.key === 'E') gearKeyRef.current.e = false;
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const K = (...k) => k.some((v) => keysRef.current[v]);

  const getClosestT = (pos) => {
    const s = stateRef.current;
    let best = Infinity;
    let bt = s.closestT;
    const range = 0.3;
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = ((s.closestT - range / 2 + (i / steps) * range) % 1 + 1) % 1;
      const p = s.spline.getPoint(t);
      const d = (p.x - pos.x) ** 2 + (p.z - pos.z) ** 2;
      if (d < best) {
        best = d;
        bt = t;
      }
    }
    s.closestT = bt;
    return bt;
  };

  const gameLoop = useCallback((frameTime = performance.now()) => {
    const s = stateRef.current;
    if (!s.isPlaying) return;
    animRef.current = requestAnimationFrame(gameLoop);
    if (frameTime - s.lastFrameTime < TARGET_FRAME_MS) return;
    const previousFrameTime = s.lastFrameTime || frameTime - TARGET_FRAME_MS;
    const deltaFactor = THREE.MathUtils.clamp((frameTime - previousFrameTime) / TARGET_FRAME_MS, 0.85, 1.85);
    s.lastFrameTime = frameTime;

    const bike = bikeRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!bike || !camera || !renderer || !s.bkCfg) return;

    if (!s.raceStarted && frameTime >= s.countdownEnd) {
      s.raceStarted = true;
      s.countdownLabel = null;
      s.lapStart = frameTime;
    } else if (!s.raceStarted) {
      s.countdownLabel = getCountdownLabel(frameTime, s.countdownEnd);
    }

    const canControlBike = s.raceStarted && !s.finished;
    const accelKey = canControlBike && K('w', 'ArrowUp');
    const brakeKey = canControlBike && K('s', 'ArrowDown');
    const frontBrake = canControlBike && K(' ');
    const boostRequested = canControlBike && K('Shift') && s.boostMeter > 6 && s.speed > 0.08;

    if (boostRequested) {
      s.boostMeter = Math.max(0, s.boostMeter - BOOST_DRAIN_PER_FRAME * deltaFactor);
      s.boostActive = s.boostMeter > 0.5;
    } else if (brakeKey) {
      s.boostActive = false;
      s.boostMeter = Math.min(BOOST_METER_MAX, s.boostMeter + BOOST_RECOVERY_PER_FRAME * 0.5 * deltaFactor);
    } else {
      s.boostActive = false;
      const recharge = s.onTrack ? BOOST_RECOVERY_PER_FRAME : BOOST_RECOVERY_PER_FRAME * 0.55;
      s.boostMeter = Math.min(BOOST_METER_MAX, s.boostMeter + recharge * deltaFactor);
    }

    const baseGearSpeedCeiling = (s.gear / s.bkCfg.topGear) * s.bkCfg.maxSpd;
    const boostCeilingBonus = s.boostActive ? s.bkCfg.maxSpd * 0.24 : 0;
    const gearSpeedCeiling = baseGearSpeedCeiling + boostCeilingBonus;
    const boostAccelFactor = s.boostActive ? 1.45 : 1;

    if (accelKey) {
      s.speed = Math.min(s.speed + s.bkCfg.accel * boostAccelFactor * deltaFactor, gearSpeedCeiling);
    } else if (brakeKey) {
      s.speed = Math.max(s.speed - s.bkCfg.brake * deltaFactor, 0);
    } else if (frontBrake) {
      s.speed = Math.max(s.speed - s.bkCfg.brake * 1.22 * deltaFactor, 0);
    } else {
      s.speed *= 0.985 ** deltaFactor;
    }

    if (s.boostActive) {
      s.speed = Math.min(s.speed + s.bkCfg.accel * 0.62 * deltaFactor, gearSpeedCeiling);
    }

    if (s.speed > gearSpeedCeiling) {
      s.speed = Math.max(s.speed - s.bkCfg.brake * 0.34 * deltaFactor, gearSpeedCeiling);
    }

    if (!s.onTrack) s.speed *= 0.91 ** deltaFactor;

    if (s.finished) {
      s.speed *= 0.975 ** deltaFactor;
    }

    s.steerInput = 0;
    if (canControlBike && s.speed > 0.03) {
      const velFactor = Math.min(s.speed / s.bkCfg.maxSpd, 1);
      const turnRate = s.bkCfg.turn * (1.1 - velFactor * 0.4) * deltaFactor * (s.boostActive ? 0.94 : 1);
      if (K('a', 'ArrowLeft')) {
        s.heading += turnRate;
        s.steerInput = 1;
      }
      if (K('d', 'ArrowRight')) {
        s.heading -= turnRate;
        s.steerInput = -1;
      }
    }

    const targetLean = s.steerInput * 0.55;
    s.leanAngle += (targetLean - s.leanAngle) * s.bkCfg.lean * deltaFactor;

    bike.position.x += Math.sin(s.heading) * s.speed * deltaFactor;
    bike.position.z += Math.cos(s.heading) * s.speed * deltaFactor;
    s.visualTime += deltaFactor;

    const speedRatio = Math.min(s.speed / s.bkCfg.maxSpd, 1);
    const boostFx = s.boostActive ? 1 : 0;
    const enginePulse = Math.sin(s.visualTime * (0.28 + speedRatio * 1.45));
    const visual = bike.getObjectByName('bikeVisual');
    const frontWheel = bike.getObjectByName('frontWheel');
    const rearWheel = bike.getObjectByName('rearWheel');
    const tailLight = bike.getObjectByName('bikeTailLight');
    const rider = bike.getObjectByName('bikeRider');
    const speedTrail = bike.getObjectByName('bikeSpeedTrail');

    bike.position.y = 0.02 + Math.abs(enginePulse) * 0.035 * speedRatio;
    s.wheelSpin += s.speed * 1.95 * deltaFactor;
    if (frontWheel) frontWheel.rotation.z = s.wheelSpin;
    if (rearWheel) rearWheel.rotation.z = s.wheelSpin * 1.08;
    if (visual) {
      visual.position.x = enginePulse * 0.035 * speedRatio;
      visual.rotation.y = -s.steerInput * 0.08 * speedRatio;
      visual.scale.setScalar(1 + speedRatio * 0.018 + boostFx * 0.028);
    }
    if (rider) rider.position.x = -s.leanAngle * 0.48;
    if (tailLight?.material) tailLight.material.opacity = (brakeKey || frontBrake) ? 1 : 0.45 + speedRatio * 0.25;
    if (speedTrail?.material) {
      speedTrail.material.color.set(s.boostActive ? 0xffef5a : 0x00f2ff);
      speedTrail.material.opacity = Math.max(0, speedRatio - 0.26) * (s.boostActive ? 0.98 : 0.58);
      speedTrail.scale.y = 0.72 + speedRatio * 1.4 + boostFx * 0.9;
      speedTrail.scale.x = 1 + Math.abs(enginePulse) * 0.18 + boostFx * 0.26;
    }

    const qHead = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.heading);
    const qLean = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -s.leanAngle * (0.72 + speedRatio * 0.34));
    bike.quaternion.copy(qHead).multiply(qLean);

    if (s.spline) {
      const ct = getClosestT(bike.position);
      const cp = s.spline.getPoint(ct);
      const dist = Math.sqrt((bike.position.x - cp.x) ** 2 + (bike.position.z - cp.z) ** 2);
      s.onTrack = dist < s.circuit.trackW / 2 + 1.5;
      s.offTrackTimer = s.onTrack ? 0 : s.offTrackTimer + deltaFactor;

      if (s.racingLinePoints.length > 0) {
        const baseIndex = Math.round(ct * (s.racingLinePoints.length - 1));
        let bestLineDist = Infinity;
        for (let offset = -3; offset <= 3; offset += 1) {
          const idx = (baseIndex + offset + s.racingLinePoints.length) % s.racingLinePoints.length;
          const linePoint = s.racingLinePoints[idx];
          const lineDist = Math.hypot(bike.position.x - linePoint.x, bike.position.z - linePoint.z);
          if (lineDist < bestLineDist) bestLineDist = lineDist;
        }

        const perfectWindow = Math.max(s.circuit.trackW * 0.45, 4.6);
        const livePrecision = Math.max(0, 100 - (bestLineDist / perfectWindow) * 100);
        s.precision += (livePrecision - s.precision) * 0.14 * deltaFactor;
        s.precisionAccum += livePrecision;
        s.precisionSamples += 1;
        s.precisionAverage = s.precisionAccum / s.precisionSamples;
      }
    }

    s.maxSpeed = Math.max(s.maxSpeed, s.speed);

    s.boostPads.forEach((pad, padIndex) => {
      const cooldownEndsAt = s.boostPadCooldowns[padIndex] || 0;
      const cooldownLeft = Math.max(0, cooldownEndsAt - frameTime);
      const ready = cooldownLeft === 0;
      const padMesh = sceneRef.current?.getObjectByName(`boostPad_${padIndex}`);
      const glowMesh = sceneRef.current?.getObjectByName(`boostPadGlow_${padIndex}`);
      const shimmer = 0.78 + Math.sin((s.visualTime + padIndex * 4.5) * 0.18) * 0.14;

      if (padMesh?.material) {
        padMesh.material.opacity = ready ? shimmer : 0.22 + (1 - cooldownLeft / BOOST_PAD_COOLDOWN_MS) * 0.24;
      }

      if (glowMesh?.material) {
        glowMesh.material.opacity = ready ? 0.12 + Math.sin((s.visualTime + padIndex * 5.5) * 0.14) * 0.08 : 0.04;
      }

      if (!canControlBike || !ready) return;

      const distanceToPad = Math.hypot(bike.position.x - pad.position.x, bike.position.z - pad.position.z);
      if (distanceToPad > pad.radius) return;

      s.boostPadCooldowns[padIndex] = frameTime + BOOST_PAD_COOLDOWN_MS;
      s.boostMeter = Math.min(BOOST_METER_MAX, s.boostMeter + BOOST_PAD_METER_GAIN);
      s.speed = Math.min(s.speed + BOOST_PAD_SPEED_KICK, s.bkCfg.maxSpd * 1.22);
      s.padHits += 1;
    });

    s.lapCooldown = Math.max(0, s.lapCooldown - deltaFactor);
    if (s.spline && canControlBike) {
      const mid = s.spline.getPoint(0.5);
      const dMid = Math.sqrt((bike.position.x - mid.x) ** 2 + (bike.position.z - mid.z) ** 2);
      if (dMid < 9) s.halfwayDone = true;

      if (s.halfwayDone && s.lapCooldown === 0) {
        const dStart = Math.sqrt(
          (bike.position.x - s.startPos.x) ** 2 +
          (bike.position.z - s.startPos.z) ** 2
        );

        if (dStart < 9) {
          const t = (performance.now() - s.lapStart) / 1000;
          if (t > 5) {
            if (!s.bestLap || t < s.bestLap) s.bestLap = t;
            s.lapCount++;
            s.lapStart = performance.now();
            s.halfwayDone = false;
            s.lapCooldown = 120;

            if (s.lapCount > s.circuit.laps) {
              s.finished = true;
              s.finishedAt = performance.now();
              s.raceStarted = false;
              s.countdownLabel = null;
            }

            setGameState((prev) => ({ ...prev, lapNotify: !s.finished }));
            if (!s.finished) {
              if (lapNotifyTimeoutRef.current) clearTimeout(lapNotifyTimeoutRef.current);
              lapNotifyTimeoutRef.current = setTimeout(() => {
                setGameState((prev) => ({ ...prev, lapNotify: false }));
              }, 1600);
            }
          }
        }
      }
    }

    if (s.speed < 0.005) s.gear = 1;

    const gearCeil = (s.gear / s.bkCfg.topGear) * s.bkCfg.maxSpd;
    const prevCeil = ((s.gear - 1) / s.bkCfg.topGear) * s.bkCfg.maxSpd;
    const rpmInGear = gearCeil > prevCeil ? (s.speed - prevCeil) / (gearCeil - prevCeil) : 0;

    const desiredViewHeight = ORTHO_VIEW_HEIGHT + speedRatio * 42 + boostFx * 26;
    s.cameraViewHeight += (desiredViewHeight - s.cameraViewHeight) * 0.08 * deltaFactor;
    applyCameraFrustum(camera, s.cameraViewHeight, viewportRef.current);
    s.camTarget.set(bike.position.x, CAMERA_ALTITUDE, bike.position.z);
    camera.position.lerp(s.camTarget, 0.12);
    s.camLook.set(bike.position.x, 0, bike.position.z);
    camera.lookAt(s.camLook);

    const now = performance.now();
    const lapTimerAnchor = s.finishedAt || now;
    const elapsed = s.raceStarted || s.finished ? (lapTimerAnchor - s.lapStart) / 1000 : 0;

    if (now - uiFrameRef.current.hud >= UI_UPDATE_INTERVAL_MS) {
      uiFrameRef.current.hud = now;
      startTransition(() => {
        setGameState((prev) => ({
          ...prev,
          lapTime: elapsed,
          bestLap: s.bestLap,
          lap: Math.min(s.lapCount, s.circuit.laps),
          totalLaps: s.circuit.laps,
          speed: s.speed,
          gear: s.gear,
          rpmRatio: Math.max(0, Math.min(1, rpmInGear)),
          offTrack: s.offTrackTimer > 10,
          finished: s.finished,
          countdown: s.countdownLabel,
          boostMeter: s.boostMeter,
          boosting: s.boostActive,
          precision: s.precision,
          precisionAverage: s.precisionAverage,
          maxSpeed: s.maxSpeed,
          padHits: s.padHits,
        }));
      });
    }

    if (now - uiFrameRef.current.minimap >= MINIMAP_UPDATE_INTERVAL_MS) {
      uiFrameRef.current.minimap = now;
      startTransition(() => {
        setMinimapData((prev) => ({
          ...prev,
          bikePos: { x: bike.position.x, z: bike.position.z },
          bikeHeading: s.heading,
        }));
      });
    }

    renderer.render(sceneRef.current, camera);
  }, []);

  const launch = useCallback(() => {
    const circuitData = circuits.find((c) => c.id === selectedCircuit);
    const bikeData = bikes.find((b) => b.id === selectedBike);
    if (!circuitData || !bikeData) return;

    const scene = sceneRef.current;
    const s = stateRef.current;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (lapNotifyTimeoutRef.current) clearTimeout(lapNotifyTimeoutRef.current);

    s.trackMeshes.forEach((mesh) => {
      scene.remove(mesh);
      disposeSceneObject(mesh);
    });
    s.trackMeshes.length = 0;
    if (bikeRef.current) {
      scene.remove(bikeRef.current);
      disposeSceneObject(bikeRef.current);
      bikeRef.current = null;
    }

    const cir = {
      id: circuitData.id,
      name: circuitData.name,
      laps: circuitData.laps || 5,
      trackW: circuitData.track_width || 13,
      imageUrl: circuitData.image_url || '',
      imageAspect: circuitData.image_aspect || 1,
      imageScale: circuitData.image_scale || 1.7,
      wps: (circuitData.waypoints || []).map((wp) => [wp.x, wp.z]),
    };

    const bk = {
      name: bikeData.name,
      maxSpd: bikeData.max_speed || 2.3,
      accel: bikeData.accel || 0.033,
      brake: bikeData.brake || 0.065,
      turn: bikeData.turn || 0.045,
      lean: bikeData.lean || 0.14,
      topGear: bikeData.top_gear || 6,
      color: parseInt(bikeData.color_hex || 'e10000', 16),
    };

    const trackResult = buildTrack(scene, cir, s.trackMeshes);
    s.spline = trackResult.spline;
    s.racingLinePoints = trackResult.racingLinePoints || [];
    s.boostPads = trackResult.boostPads || [];
    s.boostPadCooldowns = s.boostPads.map(() => 0);
    s.startPos = trackResult.startPos;
    s.startHeading = trackResult.startHeading;

    const bikeMesh = buildBike(bk);
    scene.add(bikeMesh);
    bikeRef.current = bikeMesh;

    s.heading = s.startHeading;
    s.speed = 0;
    s.leanAngle = 0;
    s.gear = 1;
    s.steerInput = 0;
    s.onTrack = true;
    s.offTrackTimer = 0;
    s.closestT = 0;
    s.halfwayDone = false;
    s.lapCount = 1;
    s.lapStart = 0;
    s.bestLap = null;
    s.bkCfg = bk;
    s.circuit = cir;
    s.lapCooldown = 0;
    s.visualTime = 0;
    s.wheelSpin = 0;
    s.lastFrameTime = 0;
    s.finished = false;
    s.finishedAt = 0;
    s.raceStarted = false;
    s.countdownEnd = performance.now() + COUNTDOWN_DURATION_MS;
    s.countdownLabel = '3';
    s.boostMeter = BOOST_METER_MAX;
    s.boostActive = false;
    s.precision = 100;
    s.precisionAccum = 0;
    s.precisionSamples = 0;
    s.precisionAverage = 100;
    s.maxSpeed = 0;
    s.padHits = 0;
    s.cameraViewHeight = ORTHO_VIEW_HEIGHT;
    uiFrameRef.current.hud = 0;
    uiFrameRef.current.minimap = 0;

    const startOffset = new THREE.Vector3(
      -Math.sin(s.startHeading) * 3,
      0,
      Math.cos(s.startHeading) * 3
    );
    bikeMesh.position.copy(s.startPos).add(startOffset);
    bikeMesh.rotation.set(0, s.startHeading, 0);

    const camera = cameraRef.current;
    applyCameraFrustum(camera, ORTHO_VIEW_HEIGHT, viewportRef.current);
    s.camTarget.set(bikeMesh.position.x, CAMERA_ALTITUDE, bikeMesh.position.z);
    camera.position.copy(s.camTarget);
    camera.lookAt(bikeMesh.position.x, 0, bikeMesh.position.z);

    setMinimapData({
      spline: s.spline,
      bikePos: { x: bikeMesh.position.x, z: bikeMesh.position.z },
      bikeHeading: s.heading,
      startPos: s.startPos,
      trackW: cir.trackW,
      bikeColor: bk.color,
      boostPads: s.boostPads,
    });

    setShowMenu(false);
    setGameState({
      lapTime: 0,
      bestLap: null,
      lap: 1,
      totalLaps: cir.laps,
      speed: 0,
      gear: 1,
      rpmRatio: 0,
      lapNotify: false,
      offTrack: false,
      finished: false,
      countdown: '3',
      boostMeter: BOOST_METER_MAX,
      boosting: false,
      precision: 100,
      precisionAverage: 100,
      maxSpeed: 0,
      padHits: 0,
    });
    s.isPlaying = true;
    gameLoop();
  }, [circuits, bikes, selectedCircuit, selectedBike, gameLoop]);

  const goMenu = useCallback(() => {
    const s = stateRef.current;
    s.isPlaying = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (lapNotifyTimeoutRef.current) clearTimeout(lapNotifyTimeoutRef.current);

    s.trackMeshes.forEach((mesh) => {
      sceneRef.current.remove(mesh);
      disposeSceneObject(mesh);
    });
    s.trackMeshes.length = 0;
    if (bikeRef.current) {
      sceneRef.current.remove(bikeRef.current);
      disposeSceneObject(bikeRef.current);
      bikeRef.current = null;
    }
    s.spline = null;
    s.racingLinePoints = [];
    s.boostPads = [];
    s.boostPadCooldowns = [];
    s.visualTime = 0;
    s.wheelSpin = 0;
    s.lastFrameTime = 0;
    s.finished = false;
    s.finishedAt = 0;
    s.raceStarted = false;
    s.countdownEnd = 0;
    s.countdownLabel = null;
    s.boostMeter = BOOST_METER_MAX;
    s.boostActive = false;
    s.precision = 100;
    s.precisionAccum = 0;
    s.precisionSamples = 0;
    s.precisionAverage = 100;
    s.maxSpeed = 0;
    s.padHits = 0;
    s.cameraViewHeight = ORTHO_VIEW_HEIGHT;
    uiFrameRef.current.hud = 0;
    uiFrameRef.current.minimap = 0;

    setShowMenu(true);
    setGameState({
      lapTime: 0,
      bestLap: null,
      lap: 1,
      totalLaps: 5,
      speed: 0,
      gear: 0,
      rpmRatio: 0,
      lapNotify: false,
      offTrack: false,
      finished: false,
      countdown: null,
      boostMeter: BOOST_METER_MAX,
      boosting: false,
      precision: 100,
      precisionAverage: 100,
      maxSpeed: 0,
      padHits: 0,
    });
    setMinimapData({
      spline: null,
      bikePos: null,
      bikeHeading: 0,
      startPos: null,
      trackW: 13,
      bikeColor: 0xe10000,
      boostPads: [],
    });

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  return (
    <div className="retro-game relative w-full h-screen overflow-hidden bg-black font-mono">
      <div ref={containerRef} className="fixed inset-0 z-0" />
      <div className="retro-vignette pointer-events-none fixed inset-0 z-[8]" />
      <div className="retro-crt pointer-events-none fixed inset-0 z-[70]" />
      <div className="retro-scan pointer-events-none fixed inset-0 z-[71]" />
      <button
        type="button"
        onClick={goBackToSite}
        className="retro-button fixed left-4 top-4 z-[72] flex cursor-pointer items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-[3px]"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        VOLVER
      </button>

      {showMenu && (
        <>
          <GameMenu
            circuits={circuits}
            bikes={bikes}
            selectedCircuit={selectedCircuit}
            selectedBike={selectedBike}
            onSelectCircuit={setSelectedCircuit}
            onSelectBike={setSelectedBike}
            onLaunch={launch}
            loading={loadingCircuits || loadingBikes}
          />
          <Link
            to="/ManageData"
            className="retro-button fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-4 py-2 text-[10px] tracking-[2px] uppercase"
          >
            <Settings className="w-3.5 h-3.5" />
            GESTIONAR DATOS
          </Link>
        </>
      )}

      {!showMenu && (
        <Suspense fallback={null}>
          <HUD gameState={gameState} onBack={goMenu} />
          <Minimap
            spline={minimapData.spline}
            bikePos={minimapData.bikePos}
            bikeHeading={minimapData.bikeHeading}
            startPos={minimapData.startPos}
            trackW={minimapData.trackW}
            bikeColor={minimapData.bikeColor}
            boostPads={minimapData.boostPads}
          />
        </Suspense>
      )}
    </div>
  );
}
