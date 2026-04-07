import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { buildTrack, buildBike } from '@/components/game/GameEngine.jsx';
import HUD from '@/components/game/HUD';
import Minimap from '@/components/game/Minimap';
import GameMenu from '@/components/game/GameMenu';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

export default function Game() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const bikeRef = useRef(null);
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
  const gearKeyRef = useRef({ q: false, e: false }); // evita repetición de tecla

  const [showMenu, setShowMenu] = useState(true);
  const [selectedCircuit, setSelectedCircuit] = useState(null);
  const [selectedBike, setSelectedBike] = useState(null);
  const [gameState, setGameState] = useState({
    lapTime: 0, bestLap: null, lap: 1, totalLaps: 5,
    speed: 0, gear: 0, rpmRatio: 0,
    lapNotify: false, offTrack: false, finished: false,
  });
  const [minimapData, setMinimapData] = useState({
    spline: null, bikePos: null, bikeHeading: 0,
    startPos: null, trackW: 13, bikeColor: 0xe10000,
  });

  const { data: circuits = [], isLoading: loadingCircuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => base44.entities.Circuit.list(),
  });

  const { data: bikes = [], isLoading: loadingBikes } = useQuery({
    queryKey: ['bikes'],
    queryFn: () => base44.entities.Bike.list(),
  });

  // Set defaults when data loads
  useEffect(() => {
    if (circuits.length > 0 && !selectedCircuit) setSelectedCircuit(circuits[0].id);
  }, [circuits, selectedCircuit]);

  useEffect(() => {
    if (bikes.length > 0 && !selectedBike) setSelectedBike(bikes[0].id);
  }, [bikes, selectedBike]);

  // Initialize THREE scene once
  useEffect(() => {
    const scene = new THREE.Scene();
    // Realistic sky gradient via fog + sky mesh
    scene.fog = new THREE.Fog(0x87CEEB, 200, 1200);
    scene.background = new THREE.Color(0x87CEEB);
    sceneRef.current = scene;

    // Sky dome
    const skyGeo = new THREE.SphereGeometry(1000, 16, 8);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {},
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y;
          vec3 skyTop = vec3(0.18, 0.42, 0.80);
          vec3 skyHorizon = vec3(0.72, 0.88, 1.0);
          vec3 col = mix(skyHorizon, skyTop, clamp(h * 1.8, 0.0, 1.0));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 8, 20);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;

    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }

    // Lights — warm sun, blue sky fill
    scene.add(new THREE.AmbientLight(0xfff4e0, 0.4));
    const sun = new THREE.DirectionalLight(0xfffbe0, 2.2);
    sun.position.set(300, 400, 150);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 1200;
    sun.shadow.camera.left = -400;
    sun.shadow.camera.right = 400;
    sun.shadow.camera.top = 400;
    sun.shadow.camera.bottom = -400;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x9ec8ff, 0x3a7a3a, 0.6));

    renderer.render(scene, camera);

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();

      // Gear shift — one press at a time
      const s = stateRef.current;
      if (!s.isPlaying) return;
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

  const K = (...k) => k.some(v => keysRef.current[v]);

  const getClosestT = (pos) => {
    const s = stateRef.current;
    let best = Infinity, bt = s.closestT;
    const RANGE = 0.3, STEPS = 60;
    for (let i = 0; i <= STEPS; i++) {
      const t = ((s.closestT - RANGE / 2 + i / STEPS * RANGE) % 1 + 1) % 1;
      const p = s.spline.getPoint(t);
      const d = (p.x - pos.x) ** 2 + (p.z - pos.z) ** 2;
      if (d < best) { best = d; bt = t; }
    }
    s.closestT = bt;
    return bt;
  };

  const gameLoop = useCallback(() => {
    const s = stateRef.current;
    if (!s.isPlaying) return;
    animRef.current = requestAnimationFrame(gameLoop);

    const bike = bikeRef.current;
    const camera = cameraRef.current;
    if (!bike || !camera) return;

    // Gear-based speed limits: each gear unlocks a fraction of maxSpd
    // Gear 1→topGear, speed ceiling grows linearly
    const gearSpeedCeiling = (s.gear / s.bkCfg.topGear) * s.bkCfg.maxSpd;

    // Acceleration / Braking
    const accelKey = K('w', 'ArrowUp');
    const brakeKey = K('s', 'ArrowDown');
    const frontBrake = K(' ');

    if (accelKey) {
      // Can only accelerate up to this gear's ceiling
      s.speed = Math.min(s.speed + s.bkCfg.accel, gearSpeedCeiling);
    } else if (brakeKey) {
      s.speed = Math.max(s.speed - s.bkCfg.brake, 0);
    } else if (frontBrake) {
      s.speed = Math.max(s.speed - s.bkCfg.brake * 0.6, 0);
    } else {
      s.speed *= 0.985;
    }

    // If player downshifts below current speed ceiling, clamp gradually (engine brake)
    if (s.speed > gearSpeedCeiling) {
      s.speed = Math.max(s.speed - s.bkCfg.brake * 0.3, gearSpeedCeiling);
    }

    if (!s.onTrack) s.speed *= 0.90;

    // Steering
    s.steerInput = 0;
    if (s.speed > 0.03) {
      const velFactor = Math.min(s.speed / s.bkCfg.maxSpd, 1);
      const turnRate = s.bkCfg.turn * (1.1 - velFactor * 0.4);
      if (K('a', 'ArrowLeft')) { s.heading += turnRate; s.steerInput = 1; }
      if (K('d', 'ArrowRight')) { s.heading -= turnRate; s.steerInput = -1; }
    }

    // Lean
    const targetLean = s.steerInput * 0.55;
    s.leanAngle += (targetLean - s.leanAngle) * s.bkCfg.lean;

    // Movement — heading 0 = hacia +Z, aumentar heading = girar derecha
    bike.position.x += Math.sin(s.heading) * s.speed;
    bike.position.z += Math.cos(s.heading) * s.speed;
    bike.position.y = 0;

    // Rotation — alinear mesh con heading
    const qHead = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.heading);
    const qLean = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -s.leanAngle);
    bike.quaternion.copy(qHead).multiply(qLean);

    // Track detection
    if (s.spline) {
      const ct = getClosestT(bike.position);
      const cp = s.spline.getPoint(ct);
      const dist = Math.sqrt((bike.position.x - cp.x) ** 2 + (bike.position.z - cp.z) ** 2);
      s.onTrack = dist < s.circuit.trackW / 2 + 1.5;

      if (!s.onTrack) {
        s.offTrackTimer++;
      } else {
        s.offTrackTimer = 0;
      }
    }

    // Lap detection
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
            if (!s.bestLap || t < s.bestLap) {
              s.bestLap = t;
            }
            s.lapCount++;
            s.lapStart = performance.now();
            s.halfwayDone = false;
            s.lapCooldown = 120;

            if (s.lapCount > s.circuit.laps) {
              s.finished = true;
            }

            // Flash notify
            setGameState(prev => ({ ...prev, lapNotify: true }));
            setTimeout(() => setGameState(prev => ({ ...prev, lapNotify: false })), 1600);
          }
        }
      }
    }

    // If stopped, go to neutral
    if (s.speed < 0.005) s.gear = 1;

    // RPM within current gear (0→1 going from 0 to ceiling)
    const gearCeil = (s.gear / s.bkCfg.topGear) * s.bkCfg.maxSpd;
    const prevCeil = ((s.gear - 1) / s.bkCfg.topGear) * s.bkCfg.maxSpd;
    const rpmInGear = gearCeil > prevCeil
      ? (s.speed - prevCeil) / (gearCeil - prevCeil)
      : 0;

    // Camera — speed-based zoom + vibration at high speed
    const speedRatio = s.speed / (s.bkCfg.maxSpd || 2.3);
    const camDist = 11 + speedRatio * 6;
    const camH = 3.5 + speedRatio * 2.5;
    // Vibration at high speed
    const vib = speedRatio > 0.6 ? (Math.random() - 0.5) * 0.08 * speedRatio : 0;
    s.camTarget.set(
      bike.position.x - Math.sin(s.heading) * camDist + vib,
      bike.position.y + camH + Math.abs(vib) * 0.5,
      bike.position.z - Math.cos(s.heading) * camDist + vib
    );
    camera.position.lerp(s.camTarget, 0.07);
    s.camLook.set(
      bike.position.x + Math.sin(s.heading) * 5,
      bike.position.y + 1.2,
      bike.position.z + Math.cos(s.heading) * 5
    );
    camera.lookAt(s.camLook);

    // Update HUD state (throttled)
    const elapsed = (performance.now() - s.lapStart) / 1000;
    setGameState(prev => ({
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

    // Minimap
    setMinimapData(prev => ({
      ...prev,
      bikePos: { x: bike.position.x, z: bike.position.z },
      bikeHeading: s.heading,
    }));

    rendererRef.current.render(sceneRef.current, camera);
  }, []);

  const launch = useCallback(() => {
    const circuitData = circuits.find(c => c.id === selectedCircuit);
    const bikeData = bikes.find(b => b.id === selectedBike);
    if (!circuitData || !bikeData) return;

    const scene = sceneRef.current;
    const s = stateRef.current;

    // Convert entity data to engine format
    const cir = {
      id: circuitData.id,
      name: circuitData.name,
      laps: circuitData.laps || 5,
      trackW: circuitData.track_width || 13,
      wps: (circuitData.waypoints || []).map(wp => [wp.x, wp.z]),
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

    if (bikeRef.current) scene.remove(bikeRef.current);
    const bikeMesh = buildBike(bk);
    scene.add(bikeMesh);
    bikeRef.current = bikeMesh;

    // Reset state
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
    s.finished = false;

    const startOffset = new THREE.Vector3(
      -Math.sin(s.startHeading) * 3, 0, Math.cos(s.startHeading) * 3
    );
    bikeMesh.position.copy(s.startPos).add(startOffset);
    bikeMesh.rotation.set(0, s.startHeading, 0);

    const camera = cameraRef.current;
    s.camTarget.copy(bikeMesh.position);
    camera.position.set(
      bikeMesh.position.x + Math.sin(s.startHeading) * 16,
      bikeMesh.position.y + 6,
      bikeMesh.position.z - Math.cos(s.startHeading) * 16
    );
    camera.lookAt(bikeMesh.position);

    setMinimapData({
      spline: s.spline,
      bikePos: { x: bikeMesh.position.x, z: bikeMesh.position.z },
      bikeHeading: s.heading,
      startPos: s.startPos,
      trackW: cir.trackW,
      bikeColor: bk.color,
    });

    setShowMenu(false);
    s.isPlaying = true;
    gameLoop();
  }, [circuits, bikes, selectedCircuit, selectedBike, gameLoop]);

  const goMenu = useCallback(() => {
    const s = stateRef.current;
    s.isPlaying = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);

    s.trackMeshes.forEach(m => sceneRef.current.remove(m));
    s.trackMeshes.length = 0;
    if (bikeRef.current) {
      sceneRef.current.remove(bikeRef.current);
      bikeRef.current = null;
    }
    s.spline = null;

    setShowMenu(true);
    setGameState({
      lapTime: 0, bestLap: null, lap: 1, totalLaps: 5,
      speed: 0, gear: 0, rpmRatio: 0,
      lapNotify: false, offTrack: false, finished: false,
    });
    setMinimapData({
      spline: null, bikePos: null, bikeHeading: 0,
      startPos: null, trackW: 13, bikeColor: 0xe10000,
    });

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-mono">
      <div ref={containerRef} className="fixed inset-0 z-0" />

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
            className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 bg-black/90 border border-border
                       text-muted-foreground px-4 py-2 text-[10px] tracking-[2px] uppercase
                       hover:border-primary hover:text-primary transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            GESTIONAR DATOS
          </Link>
        </>
      )}

      {!showMenu && (
        <>
          <HUD gameState={gameState} onBack={goMenu} />
          <Minimap
            spline={minimapData.spline}
            bikePos={minimapData.bikePos}
            bikeHeading={minimapData.bikeHeading}
            startPos={minimapData.startPos}
            trackW={minimapData.trackW}
            bikeColor={minimapData.bikeColor}
          />
        </>
      )}
    </div>
  );
}