import * as THREE from 'three';

const TRACK_SEGMENTS = 260;

function createRibbon(points, width, y = 0, closed = true) {
  const positions = [];
  const indices = [];

  const getTangent = (index) => {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    return new THREE.Vector3().subVectors(next, current).normalize();
  };

  const limit = closed ? points.length : points.length - 1;

  for (let index = 0; index < limit; index += 1) {
    const point = points[index];
    const tangent = getTangent(index);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    const left = point.clone().addScaledVector(normal, -width / 2).setY(y);
    const right = point.clone().addScaledVector(normal, width / 2).setY(y);

    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
  }

  for (let index = 0; index < limit; index += 1) {
    const current = index * 2;
    const next = ((index + 1) % limit) * 2;

    indices.push(
      current,
      current + 1,
      next,
      current + 1,
      next + 1,
      next
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function getTrackBounds(points) {
  return points.reduce((bounds, point) => ({
    minX: Math.min(bounds.minX, point.x),
    maxX: Math.max(bounds.maxX, point.x),
    minZ: Math.min(bounds.minZ, point.z),
    maxZ: Math.max(bounds.maxZ, point.z),
  }), {
    minX: Infinity,
    maxX: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity,
  });
}

function addCircuitImagePlane(scene, cir, trackPoints, trackMeshes) {
  if (!cir.imageUrl) return;

  const bounds = getTrackBounds(trackPoints);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const widthFromTrack = Math.max(bounds.maxX - bounds.minX, 120);
  const heightFromTrack = Math.max(bounds.maxZ - bounds.minZ, 120);
  const aspect = cir.imageAspect || 1;
  const scale = cir.imageScale || 1.7;
  const planeWidth = Math.max(widthFromTrack * scale, heightFromTrack * scale * aspect);
  const planeHeight = planeWidth / aspect;

  const map = new THREE.TextureLoader().load(cir.imageUrl);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const imagePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(planeWidth, planeHeight),
    new THREE.MeshBasicMaterial({
      map,
      color: 0x9fe7ff,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    })
  );
  imagePlane.rotation.x = -Math.PI / 2;
  imagePlane.position.set(centerX, -0.52, centerZ);
  imagePlane.name = 'circuitImagePlane';
  scene.add(imagePlane);
  trackMeshes.push(imagePlane);
}

export function buildTrack(scene, cir, trackMeshes) {
  trackMeshes.forEach((mesh) => scene.remove(mesh));
  trackMeshes.length = 0;

  const trackWidth = cir.trackW;
  const curvePoints = cir.wps.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const spline = new THREE.CatmullRomCurve3(curvePoints, true, 'catmullrom', 0.5);
  const trackPoints = spline.getPoints(TRACK_SEGMENTS);
  const splineLength = spline.getLength();

  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(2400, 2400),
    new THREE.MeshBasicMaterial({ color: 0x13072a })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.6;
  scene.add(grass);
  trackMeshes.push(grass);

  const grid = new THREE.GridHelper(2400, 80, 0x00f2ff, 0x34106a);
  grid.position.y = -0.5;
  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  gridMaterials.forEach((material) => {
    material.transparent = true;
    material.opacity = 0.26;
  });
  scene.add(grid);
  trackMeshes.push(grid);

  addCircuitImagePlane(scene, cir, trackPoints, trackMeshes);

  const gravel = new THREE.Mesh(
    createRibbon(trackPoints, trackWidth + 12, -0.25),
    new THREE.MeshBasicMaterial({ color: 0x4a285f, side: THREE.DoubleSide })
  );
  scene.add(gravel);
  trackMeshes.push(gravel);

  const asphalt = new THREE.Mesh(
    createRibbon(trackPoints, trackWidth, -0.15),
    new THREE.MeshBasicMaterial({ color: 0x181926, side: THREE.DoubleSide })
  );
  scene.add(asphalt);
  trackMeshes.push(asphalt);

  const racingLine = new THREE.Mesh(
    createRibbon(trackPoints, Math.max(trackWidth * 0.18, 2.2), -0.1),
    new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
    })
  );
  scene.add(racingLine);
  trackMeshes.push(racingLine);

  for (const side of [-1, 1]) {
    const edgePoints = trackPoints.map((point, index) => {
      const current = trackPoints[index];
      const next = trackPoints[(index + 1) % trackPoints.length];
      const tangent = new THREE.Vector3().subVectors(next, current).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
      return point.clone().addScaledVector(normal, side * (trackWidth / 2 - 0.45)).setY(-0.02);
    });

    const edge = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(edgePoints),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
    );
    scene.add(edge);
    trackMeshes.push(edge);
  }

  for (let index = 0; index < TRACK_SEGMENTS; index += 8) {
    const point = trackPoints[index];
    const next = trackPoints[(index + 1) % trackPoints.length];
    const tangent = new THREE.Vector3().subVectors(next, point).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);

    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 1.2),
        new THREE.MeshBasicMaterial({
          color: Math.floor(index / 8) % 2 === 0 ? 0xff1d8e : 0x00f2ff,
          side: THREE.DoubleSide,
        })
      );
      curb.rotation.x = -Math.PI / 2;
      curb.rotation.z = Math.atan2(tangent.x, tangent.z);
      curb.position.copy(point).addScaledVector(normal, side * (trackWidth / 2 + 0.45)).setY(-0.04);
      scene.add(curb);
      trackMeshes.push(curb);
    }
  }

  const startPos = trackPoints[0].clone().setY(0);
  const nextStart = trackPoints[1].clone();
  const startDirection = new THREE.Vector3().subVectors(nextStart, startPos).normalize();
  const startHeading = Math.atan2(-startDirection.x, -startDirection.z);
  const startNormal = new THREE.Vector3(-startDirection.z, 0, startDirection.x);

  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const tile = new THREE.Mesh(
        new THREE.PlaneGeometry(trackWidth / 8, 2.2),
        new THREE.MeshBasicMaterial({
          color: (row + col) % 2 === 0 ? 0xffffff : 0x111111,
          side: THREE.DoubleSide,
        })
      );
      tile.rotation.x = -Math.PI / 2;
      tile.rotation.z = Math.atan2(startDirection.x, startDirection.z);
      tile.position.copy(startPos)
        .addScaledVector(startNormal, -trackWidth / 2 + trackWidth / 16 + col * (trackWidth / 8))
        .addScaledVector(startDirection, (row - 0.5) * 2.2)
        .setY(-0.03);
      scene.add(tile);
      trackMeshes.push(tile);
    }
  }

  return { spline, splineLength, startPos, startHeading };
}

export function buildBike(bk) {
  const bike = new THREE.Group();
  bike.name = 'bikeRoot';

  const visual = new THREE.Group();
  visual.name = 'bikeVisual';
  bike.add(visual);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 32),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    })
  );
  shadow.name = 'bikeShadow';
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.2, 2.65, 1);
  shadow.position.y = 0.015;
  bike.add(shadow);

  const body = new THREE.Mesh(
    new THREE.PlaneGeometry(1.95, 4.6),
    new THREE.MeshBasicMaterial({
      color: bk.color,
      side: THREE.DoubleSide,
    })
  );
  body.rotation.x = -Math.PI / 2;
  body.position.y = 0.08;
  visual.add(body);

  const noseShape = new THREE.Shape();
  noseShape.moveTo(0, 2.45);
  noseShape.lineTo(0.98, -1.05);
  noseShape.lineTo(0.42, -1.65);
  noseShape.lineTo(-0.42, -1.65);
  noseShape.lineTo(-0.98, -1.05);
  noseShape.closePath();
  const nose = new THREE.Mesh(
    new THREE.ShapeGeometry(noseShape),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    })
  );
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.105, 1.35);
  visual.add(nose);

  const cockpit = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 24),
    new THREE.MeshBasicMaterial({
      color: 0x151a20,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    })
  );
  cockpit.rotation.x = -Math.PI / 2;
  cockpit.scale.set(0.85, 1.35, 1);
  cockpit.position.set(0, 0.12, 0.76);
  visual.add(cockpit);

  const rider = new THREE.Mesh(
    new THREE.CircleGeometry(0.52, 24),
    new THREE.MeshBasicMaterial({
      color: 0x20242b,
      side: THREE.DoubleSide,
    })
  );
  rider.name = 'bikeRider';
  rider.rotation.x = -Math.PI / 2;
  rider.scale.set(0.75, 1.08, 1);
  rider.position.set(0, 0.14, -0.08);
  visual.add(rider);

  const tail = new THREE.Mesh(
    new THREE.PlaneGeometry(1.18, 1.38),
    new THREE.MeshBasicMaterial({
      color: 0x111111,
      side: THREE.DoubleSide,
    })
  );
  tail.rotation.x = -Math.PI / 2;
  tail.position.set(0, 0.1, -2.05);
  visual.add(tail);

  const tailLight = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.14),
    new THREE.MeshBasicMaterial({
      color: 0xff1d1d,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    })
  );
  tailLight.name = 'bikeTailLight';
  tailLight.rotation.x = -Math.PI / 2;
  tailLight.position.set(0, 0.13, -2.76);
  visual.add(tailLight);

  const trail = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 4.2),
    new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  trail.name = 'bikeSpeedTrail';
  trail.rotation.x = -Math.PI / 2;
  trail.position.set(0, 0.06, -4.15);
  visual.add(trail);

  const sideMaterial = new THREE.MeshBasicMaterial({
    color: 0x050505,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });

  [-0.92, 0.92].forEach((xOffset) => {
    const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 2.7), sideMaterial);
    wing.rotation.x = -Math.PI / 2;
    wing.rotation.z = xOffset > 0 ? -0.08 : 0.08;
    wing.position.set(xOffset, 0.115, 0.18);
    visual.add(wing);
  });

  const wheelGeometry = new THREE.RingGeometry(0.34, 0.62, 28);
  const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.DoubleSide });
  const hubGeometry = new THREE.CircleGeometry(0.22, 20);
  const hubMaterial = new THREE.MeshBasicMaterial({ color: 0xcfd4dc, side: THREE.DoubleSide });
  const spokeGeometry = new THREE.PlaneGeometry(0.1, 1.05);
  const spokeMaterial = new THREE.MeshBasicMaterial({ color: 0x7a828c, side: THREE.DoubleSide });

  [-1.56, 1.62].forEach((zOffset, index) => {
    const wheel = new THREE.Group();
    wheel.name = index === 0 ? 'rearWheel' : 'frontWheel';
    wheel.position.set(0, 0.11, zOffset);
    visual.add(wheel);

    const tire = new THREE.Mesh(wheelGeometry, wheelMaterial);
    tire.rotation.x = -Math.PI / 2;
    wheel.add(tire);

    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.rotation.x = -Math.PI / 2;
    hub.position.y = 0.01;
    wheel.add(hub);

    for (let spokeIndex = 0; spokeIndex < 3; spokeIndex += 1) {
      const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
      spoke.rotation.x = -Math.PI / 2;
      spoke.rotation.z = spokeIndex * (Math.PI / 3);
      spoke.position.y = 0.02;
      wheel.add(spoke);
    }
  });

  return bike;
}
