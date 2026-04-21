import React, { lazy, startTransition, Suspense, useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useQuery } from '@tanstack/react-query';
import { buildTrack, buildBike } from '@/components/game/GameEngine.jsx';
import GameMenu from '@/components/game/GameMenu';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { localData } from '@/data/localData.js';

const HUD = lazy(() => import('@/components/game/HUD'));
const Minimap = lazy(() => import('@/components/game/Minimap'));

const UI_UPDATE_INTERVAL_MS = 50;
const MINIMAP_UPDATE_INTERVAL_MS = 80;
const TARGET_FRAME_MS = 1000 / 60;
const ORTHO_VIEW_HEIGHT = 220;
const CAMERA_ALTITUDE = 220;

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
    startPos: new THREE.Vector3(),
    startHeading: 0,
    trackMeshes: [],
    bkCfg: null,
    circuit: null,
    camTarget: new THREE.Vector3(),
    camLook: new THREE.Vector3(),
    finished: false,
  });
  const keysRef = useRef({});
  const animRef = useRef(null);
  const gearKeyRef = useRef({ q: false, e: false });

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
  });
  const [minimapData, setMinimapData] = useState({
    spline: null,
    bikePos: null,
    bikeHeading: 0,
    startPos: null,
    trackW: 13,
    bikeColor: 0xe10000,
  });

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
      const nextAspect = window.innerWidth / window.innerHeight;
      renderer.setPixelRatio(1);
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.left = (-ORTHO_VIEW_HEIGHT * nextAspect) / 2;
      camera.right = (ORTHO_VIEW_HEIGHT * nextAspect) / 2;
      camera.top = ORTHO_VIEW_HEIGHT / 2;
      camera.bottom = -ORTHO_VIEW_HEIGHT / 2;
      camera.updateProjectionMatrix();
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
    s.lastFrameTime = frameTime;

    const bike = bikeRef.current;
    const camera = cameraRef.current;
    if (!bike || !camera || !s.bkCfg) return;

    const gearSpeedCeiling = (s.gear / s.bkCfg.topGear) * s.bkCfg.maxSpd;
    const accelKey = K('w', 'ArrowUp');
    const brakeKey = K('s', 'ArrowDown');
    const frontBrake = K(' ');

    if (accelKey) {
      s.speed = Math.min(s.speed + s.bkCfg.accel, gearSpeedCeiling);
    } else if (brakeKey) {
      s.speed = Math.max(s.speed - s.bkCfg.brake, 0);
    } else if (frontBrake) {
      s.speed = Math.max(s.speed - s.bkCfg.brake * 0.6, 0);
    } else {
      s.speed *= 0.985;
    }

    if (s.speed > gearSpeedCeiling) {
      s.speed = Math.max(s.speed - s.bkCfg.brake * 0.3, gearSpeedCeiling);
    }

    if (!s.onTrack) s.speed *= 0.9;

    s.steerInput = 0;
    if (s.speed > 0.03) {
      const velFactor = Math.min(s.speed / s.bkCfg.maxSpd, 1);
      const turnRate = s.bkCfg.turn * (1.1 - velFactor * 0.4);
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
    s.leanAngle += (targetLean - s.leanAngle) * s.bkCfg.lean;

    bike.position.x += Math.sin(s.heading) * s.speed;
    bike.position.z += Math.cos(s.heading) * s.speed;
    s.visualTime += 1;

    const speedRatio = Math.min(s.speed / s.bkCfg.maxSpd, 1);
    const enginePulse = Math.sin(s.visualTime * (0.28 + speedRatio * 1.45));
    const visual = bike.getObjectByName('bikeVisual');
    const frontWheel = bike.getObjectByName('frontWheel');
    const rearWheel = bike.getObjectByName('rearWheel');
    const tailLight = bike.getObjectByName('bikeTailLight');
    const rider = bike.getObjectByName('bikeRider');
    const speedTrail = bike.getObjectByName('bikeSpeedTrail');

    bike.position.y = 0.02 + Math.abs(enginePulse) * 0.035 * speedRatio;
    s.wheelSpin += s.speed * 1.95;
    if (frontWheel) frontWheel.rotation.z = s.wheelSpin;
    if (rearWheel) rearWheel.rotation.z = s.wheelSpin * 1.08;
    if (visual) {
      visual.position.x = enginePulse * 0.035 * speedRatio;
      visual.rotation.y = -s.steerInput * 0.08 * speedRatio;
      visual.scale.setScalar(1 + speedRatio * 0.018);
    }
    if (rider) rider.position.x = -s.leanAngle * 0.48;
    if (tailLight?.material) tailLight.material.opacity = (brakeKey || frontBrake) ? 1 : 0.45 + speedRatio * 0.25;
    if (speedTrail?.material) {
      speedTrail.material.opacity = Math.max(0, speedRatio - 0.34) * 0.55;
      speedTrail.scale.y = 0.72 + speedRatio * 1.4;
      speedTrail.scale.x = 1 + Math.abs(enginePulse) * 0.18;
    }

    const qHead = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.heading);
    const qLean = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -s.leanAngle * (0.72 + speedRatio * 0.34));
    bike.quaternion.copy(qHead).multiply(qLean);

    if (s.spline) {
      const ct = getClosestT(bike.position);
      const cp = s.spline.getPoint(ct);
      const dist = Math.sqrt((bike.position.x - cp.x) ** 2 + (bike.position.z - cp.z) ** 2);
      s.onTrack = dist < s.circuit.trackW / 2 + 1.5;
      s.offTrackTimer = s.onTrack ? 0 : s.offTrackTimer + 1;
    }

    s.lapCooldown = Math.max(0, s.lapCooldown - 1);
    if (s.spline && !s.finished) {
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

            if (s.lapCount > s.circuit.laps) s.finished = true;

            setGameState((prev) => ({ ...prev, lapNotify: true }));
            if (lapNotifyTimeoutRef.current) clearTimeout(lapNotifyTimeoutRef.current);
            lapNotifyTimeoutRef.current = setTimeout(() => {
              setGameState((prev) => ({ ...prev, lapNotify: false }));
            }, 1600);
          }
        }
      }
    }

    if (s.speed < 0.005) s.gear = 1;

    const gearCeil = (s.gear / s.bkCfg.topGear) * s.bkCfg.maxSpd;
    const prevCeil = ((s.gear - 1) / s.bkCfg.topGear) * s.bkCfg.maxSpd;
    const rpmInGear = gearCeil > prevCeil ? (s.speed - prevCeil) / (gearCeil - prevCeil) : 0;

    s.camTarget.set(bike.position.x, CAMERA_ALTITUDE, bike.position.z);
    camera.position.lerp(s.camTarget, 0.12);
    s.camLook.set(bike.position.x, 0, bike.position.z);
    camera.lookAt(s.camLook);

    const now = performance.now();
    const elapsed = (now - s.lapStart) / 1000;

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

    rendererRef.current.render(sceneRef.current, camera);
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
    s.lapStart = performance.now();
    s.bestLap = null;
    s.bkCfg = bk;
    s.circuit = cir;
    s.lapCooldown = 0;
    s.visualTime = 0;
    s.wheelSpin = 0;
    s.lastFrameTime = 0;
    s.finished = false;
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
    });

    setShowMenu(false);
    setGameState((prev) => ({ ...prev, lapNotify: false, finished: false }));
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
    s.visualTime = 0;
    s.wheelSpin = 0;
    s.lastFrameTime = 0;
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
    });
    setMinimapData({
      spline: null,
      bikePos: null,
      bikeHeading: 0,
      startPos: null,
      trackW: 13,
      bikeColor: 0xe10000,
    });

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  return (
    <div className="retro-game relative w-full h-screen overflow-hidden bg-black font-mono">
      <div ref={containerRef} className="fixed inset-0 z-0" />
      <div className="retro-vignette pointer-events-none fixed inset-0 z-[8]" />
      <div className="retro-crt pointer-events-none fixed inset-0 z-[70]" />
      <div className="retro-scan pointer-events-none fixed inset-0 z-[71]" />

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
          />
        </Suspense>
      )}
    </div>
  );
}
