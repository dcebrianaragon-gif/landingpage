import * as THREE from 'three';

// ═══════════════════════════════════════════════════════
// TRACK BUILDER
// ═══════════════════════════════════════════════════════
export function buildTrack(scene, cir, trackMeshes) {
  trackMeshes.forEach(m => scene.remove(m));
  trackMeshes.length = 0;

  const W = cir.trackW;
  const SEGS = 600;

  const pts = cir.wps.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  const splineLength = curve.getLength();
  const tPts = curve.getPoints(SEGS);

  const getTangent = (i) => {
    const a = tPts[i % tPts.length];
    const b = tPts[(i + 1) % tPts.length];
    return new THREE.Vector3().subVectors(b, a).normalize();
  };

  // ── Ground (grass) ──────────────────────────────────
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.MeshStandardMaterial({ color: 0x2d5a1b, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);
  trackMeshes.push(ground);

  // ── Gravel traps ──────────────────────────────────────
  {
    const verts = [], uvs = [], idxs = [];
    const GRAVEL = W / 2 + 4;
    for (let i = 0; i <= SEGS; i++) {
      const p = tPts[i % tPts.length];
      const tang = getTangent(i);
      const right = new THREE.Vector3(-tang.z, 0, tang.x);
      for (const side of [-1, 1]) {
        const inner = p.clone().addScaledVector(right, side * (W / 2));
        const outer = p.clone().addScaledVector(right, side * GRAVEL);
        verts.push(inner.x, 0.0, inner.z, outer.x, 0.0, outer.z);
        uvs.push(0, i / SEGS, 1, i / SEGS);
      }
    }
    for (let i = 0; i < SEGS; i++) {
      const a = i * 4, b = a + 1, c = a + 4, d = a + 5;
      idxs.push(a, b, c, b, d, c);
      const e = i * 4 + 2, f = e + 1, gg = e + 4, h = e + 5;
      idxs.push(e, f, gg, f, h, gg);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idxs);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: 0xb8a882, roughness: 1, metalness: 0
    }));
    mesh.receiveShadow = true;
    scene.add(mesh);
    trackMeshes.push(mesh);
  }

  // ── Asphalt surface ──────────────────────────────────
  {
    const verts = [], uvs = [], idxs = [];
    for (let i = 0; i <= SEGS; i++) {
      const p = tPts[i % tPts.length];
      const tang = getTangent(i);
      const right = new THREE.Vector3(-tang.z, 0, tang.x);
      const L = p.clone().addScaledVector(right, -W / 2);
      const R = p.clone().addScaledVector(right, W / 2);
      verts.push(L.x, 0.015, L.z, R.x, 0.015, R.z);
      uvs.push(0, i / SEGS * 8, 1, i / SEGS * 8);
    }
    for (let i = 0; i < SEGS; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idxs.push(a, b, c, b, d, c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idxs);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: 0x252525, roughness: 0.95, metalness: 0.05
    }));
    mesh.receiveShadow = true;
    scene.add(mesh);
    trackMeshes.push(mesh);
  }

  // ── Racing line ───────────────────────────────────────
  {
    const verts = [], uvs = [], idxs = [];
    const LW = W * 0.28;
    for (let i = 0; i <= SEGS; i++) {
      const p = tPts[i % tPts.length];
      const tang = getTangent(i);
      const right = new THREE.Vector3(-tang.z, 0, tang.x);
      const L = p.clone().addScaledVector(right, -LW / 2);
      const R = p.clone().addScaledVector(right, LW / 2);
      verts.push(L.x, 0.02, L.z, R.x, 0.02, R.z);
      uvs.push(0, i / SEGS, 1, i / SEGS);
    }
    for (let i = 0; i < SEGS; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idxs.push(a, b, c, b, d, c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idxs);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, roughness: 0.85, metalness: 0.08, opacity: 0.7, transparent: true
    }));
    mesh.receiveShadow = true;
    scene.add(mesh);
    trackMeshes.push(mesh);
  }

  // ── White edge lines ──────────────────────────────────
  for (const side of [-1, 1]) {
    const lpts = [];
    for (let i = 0; i <= SEGS; i++) {
      const p = tPts[i % tPts.length];
      const tang = getTangent(i);
      const right = new THREE.Vector3(-tang.z, 0, tang.x);
      lpts.push(p.clone().addScaledVector(right, side * (W / 2 - 0.5)).setY(0.04));
    }
    const ln = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(lpts),
      new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.9, transparent: true })
    );
    scene.add(ln);
    trackMeshes.push(ln);
  }

  // ── Dashed center line ────────────────────────────────
  for (let i = 0; i < SEGS; i += 6) {
    const p = tPts[i % tPts.length];
    const q = tPts[(i + 3) % tPts.length];
    const lpts = [p.clone().setY(0.025), q.clone().setY(0.025)];
    const ln = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(lpts),
      new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.25, transparent: true })
    );
    scene.add(ln);
    trackMeshes.push(ln);
  }

  // ── Curbs ─────────────────────────────────────────────
  for (let i = 0; i < SEGS; i += 3) {
    const p = tPts[i % tPts.length];
    const tang = getTangent(i);
    const right = new THREE.Vector3(-tang.z, 0, tang.x);
    const segLen = tPts[0].distanceTo(tPts[1]) * 3;
    const isRed = Math.floor(i / 3) % 2 === 0;
    for (const side of [-1, 1]) {
      const pos = p.clone().addScaledVector(right, side * (W / 2 + 0.8)).setY(0.02);
      const sq = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.06, segLen * 0.9),
        new THREE.MeshStandardMaterial({ color: isRed ? 0xe8002d : 0xffffff, roughness: 0.6 })
      );
      sq.position.copy(pos);
      sq.rotation.y = Math.atan2(tang.x, tang.z);
      scene.add(sq);
      trackMeshes.push(sq);
    }
  }

  // ── Start/finish line ─────────────────────────────────
  const p0 = tPts[0], p1 = tPts[1];
  const d0 = new THREE.Vector3().subVectors(p1, p0).normalize();
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 3; row++) {
      const right = new THREE.Vector3(-d0.z, 0, d0.x);
      const sqColor = (col + row) % 2 === 0 ? 0xffffff : 0x111111;
      const sq = new THREE.Mesh(
        new THREE.PlaneGeometry(W / 10, 1.8),
        new THREE.MeshBasicMaterial({ color: sqColor })
      );
      sq.rotation.x = -Math.PI / 2;
      sq.rotation.y = Math.atan2(d0.x, d0.z);
      const offset = (-W / 2 + W / 20 + col * W / 10);
      sq.position.copy(p0)
        .addScaledVector(right, offset)
        .addScaledVector(d0, (row - 1) * 1.8)
        .setY(0.05);
      scene.add(sq);
      trackMeshes.push(sq);
    }
  }

  const startPos = p0.clone().setY(0);
  const startHeading = Math.atan2(-d0.x, -d0.z);

  // ── Tyre barriers ─────────────────────────────────────
  for (let i = 0; i < SEGS; i += 3) {
    const p = tPts[i];
    const tang = getTangent(i);
    const right = new THREE.Vector3(-tang.z, 0, tang.x);
    for (const side of [-1, 1]) {
      const pos = p.clone().addScaledVector(right, side * (W / 2 + 3.2)).setY(0);
      const col = i % 6 === 0 ? 0xcc0000 : 0x111111;
      const tyre = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.5, 12),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 })
      );
      tyre.position.copy(pos).setY(0.25);
      tyre.castShadow = true;
      scene.add(tyre);
      trackMeshes.push(tyre);
    }
  }

  // ── Armco barriers ────────────────────────────────────
  for (const side of [-1, 1]) {
    for (let i = 0; i < SEGS; i += 2) {
      const p = tPts[i % tPts.length];
      const tang = getTangent(i);
      const right = new THREE.Vector3(-tang.z, 0, tang.x);
      const q = tPts[(i + 2) % tPts.length];
      const segLen = p.distanceTo(q) * 1.05;
      const pos = p.clone().addScaledVector(right, side * (W / 2 + 5.5)).setY(0.55);
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.5, segLen),
        new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8, roughness: 0.3 })
      );
      bar.position.copy(pos);
      bar.rotation.y = Math.atan2(tang.x, tang.z);
      bar.castShadow = true;
      scene.add(bar);
      trackMeshes.push(bar);
    }
  }

  // ── Grandstands ───────────────────────────────────────
  for (let i = 0; i < 40; i++) {
    const t = i / 40;
    const cp = curve.getPoint(t);
    const ct = curve.getTangent(t);
    const rgt = new THREE.Vector3(-ct.z, 0, ct.x);
    const side = i % 2 === 0 ? 1 : -1;
    const dist = W / 2 + 14 + Math.random() * 18;
    const pos = cp.clone().addScaledVector(rgt, side * dist);
    const h = 5 + Math.random() * 12;
    const w = 8 + Math.random() * 10;
    const obj = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, w * 0.4),
      new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.8 })
    );
    obj.position.copy(pos).setY(h / 2);
    obj.castShadow = true;
    scene.add(obj);
    trackMeshes.push(obj);
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.3, w * 0.4),
      new THREE.MeshStandardMaterial({
        color: [0xe8002d, 0x0033a0, 0x009900, 0xff6600][i % 4], roughness: 0.7
      })
    );
    roof.position.copy(pos).setY(h + 0.15);
    scene.add(roof);
    trackMeshes.push(roof);
  }

  // ── Trees ─────────────────────────────────────────────
  for (let i = 0; i < 120; i++) {
    const t = Math.random();
    const cp = curve.getPoint(t);
    const ct = curve.getTangent(t);
    const rgt = new THREE.Vector3(-ct.z, 0, ct.x);
    const side = Math.random() > 0.5 ? 1 : -1;
    const dist = W / 2 + 20 + Math.random() * 60;
    const pos = cp.clone().addScaledVector(rgt, side * dist);
    const h = 5 + Math.random() * 9;
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.5, h * 0.45, 7),
      new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.95 })
    );
    trunk.position.y = h * 0.22;
    tree.add(trunk);
    for (let l = 0; l < 3; l++) {
      const top = new THREE.Mesh(
        new THREE.ConeGeometry(2.2 - l * 0.3, h * 0.35, 8),
        new THREE.MeshStandardMaterial({
          color: [0x1a5c1a, 0x1e6e1e, 0x166016][l], roughness: 0.95
        })
      );
      top.position.y = h * 0.45 + l * h * 0.18;
      tree.add(top);
    }
    tree.position.copy(pos);
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
    trackMeshes.push(tree);
  }

  // ── Pit building ──────────────────────────────────────
  {
    const pitPos = tPts[Math.floor(SEGS * 0.02)];
    const pitTang = getTangent(Math.floor(SEGS * 0.02));
    const right = new THREE.Vector3(-pitTang.z, 0, pitTang.x);
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(40, 8, 10),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7 })
    );
    building.position.copy(pitPos).addScaledVector(right, W / 2 + 12).setY(4);
    building.rotation.y = Math.atan2(pitTang.x, pitTang.z);
    scene.add(building);
    trackMeshes.push(building);
  }

  return { spline: curve, splineLength, startPos, startHeading };
}

// ═══════════════════════════════════════════════════════
// BIKE BUILDER
// ═══════════════════════════════════════════════════════
export function buildBike(bk) {
  const g = new THREE.Group();
  const C = (c, met = 0.6, rou = 0.3) => new THREE.MeshStandardMaterial({ color: c, metalness: met, roughness: rou });
  const mc = C(bk.color);
  const dk = C(0x0d0d0d, 0.9, 0.3);
  const gr = C(0x444444, 0.8, 0.3);
  const ch = C(0x222222, 0.7, 0.4);
  const wh = C(0xffffff, 0.1, 0.4);

  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  };

  add(new THREE.BoxGeometry(0.55, 0.5, 2.1), mc, 0, 0.85, 0);
  add(new THREE.CylinderGeometry(0.14, 0.26, 0.85, 8), mc, 0, 0.85, 1.3);
  add(new THREE.BoxGeometry(0.08, 0.4, 1.5), mc, -0.28, 0.85, 0.1);
  add(new THREE.BoxGeometry(0.08, 0.4, 1.5), mc, 0.28, 0.85, 0.1);
  add(new THREE.BoxGeometry(0.46, 0.26, 0.8), mc, 0, 1.2, 0.1);
  add(new THREE.BoxGeometry(0.34, 0.2, 0.65), mc, 0, 1.06, -0.9);
  add(new THREE.BoxGeometry(0.5, 0.38, 0.85), gr, 0, 0.53, 0.1);
  add(new THREE.CylinderGeometry(0.055, 0.085, 1.15, 8), gr, 0.3, 0.43, -0.25);
  add(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 8), C(0x1a1a1a), 0.3, 0.38, -0.75);
  add(new THREE.BoxGeometry(0.1, 0.08, 1.1), ch, 0, 0.62, -0.45);
  add(new THREE.BoxGeometry(0.38, 0.22, 0.04), C(0x88ccff, 0.1, 0.05), 0, 1.38, 0.65);
  add(new THREE.BoxGeometry(0.3, 0.2, 0.02), wh, 0, 1.05, 1.33);

  const addWheel = (z, isFront) => {
    add(new THREE.CylinderGeometry(0.38, 0.38, 0.22, 22), dk, 0, 0.38, z);
    const rimMat = C(0x999999, 0.95, 0.15);
    add(new THREE.CylinderGeometry(0.22, 0.22, 0.24, 14), rimMat, 0, 0.38, z);
    for (let a = 0; a < 5; a++) {
      const ang = a * Math.PI * 2 / 5;
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.28, 0.035), rimMat);
      sp.position.set(Math.sin(ang) * 0.14, 0.38 + Math.cos(ang) * 0.14, z);
      sp.rotation.z = ang;
      sp.castShadow = true;
      g.add(sp);
    }
    add(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 10), C(0x888888, 0.9, 0.2), 0, 0.38, z);
    if (isFront) {
      add(new THREE.BoxGeometry(0.07, 0.62, 0.07), gr, -0.1, 0.68, z);
      add(new THREE.BoxGeometry(0.07, 0.62, 0.07), gr, 0.1, 0.68, z);
      add(new THREE.CylinderGeometry(0.28, 0.28, 0.025, 18), C(0x555555, 0.8, 0.4), 0, 0.38, z);
    }
  };
  addWheel(1.08, true);
  addWheel(-1.0, false);

  add(new THREE.BoxGeometry(0.72, 0.07, 0.07), dk, 0, 1.16, 0.73);
  add(new THREE.BoxGeometry(0.07, 0.07, 0.14), dk, -0.36, 1.16, 0.74);
  add(new THREE.BoxGeometry(0.07, 0.07, 0.14), dk, 0.36, 1.16, 0.74);

  add(new THREE.BoxGeometry(0.42, 0.52, 0.68), mc, 0, 1.5, -0.08);
  add(new THREE.BoxGeometry(0.32, 0.1, 0.1), mc, -0.2, 1.44, 0.58);
  add(new THREE.BoxGeometry(0.32, 0.1, 0.1), mc, 0.2, 1.44, 0.58);
  add(new THREE.BoxGeometry(0.15, 0.1, 0.48), mc, -0.18, 1.05, 0.28);
  add(new THREE.BoxGeometry(0.15, 0.1, 0.48), mc, 0.18, 1.05, 0.28);
  add(new THREE.SphereGeometry(0.22, 14, 12), mc, 0, 1.94, 0.18);
  add(new THREE.BoxGeometry(0.23, 0.13, 0.04), C(0x111122, 0.3, 0.05), 0, 1.9, 0.39);

  return g;
}