import React, { memo, useRef, useEffect, useCallback } from 'react';

function Minimap({ spline, bikePos, bikeHeading, startPos, trackW, bikeColor, boostPads = [] }) {
  const canvasRef = useRef(null);
  const mmDataRef = useRef(null);

  useEffect(() => {
    if (!spline) return;
    const pts = spline.getPoints(250);
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    pts.forEach((p) => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    });

    const scale = 130 / Math.max(maxX - minX, maxZ - minZ);
    const oX = 10 + (130 - (maxX - minX) * scale) / 2 - minX * scale;
    const oZ = 10 + (130 - (maxZ - minZ) * scale) / 2 - minZ * scale;
    mmDataRef.current = { pts, scale, oX, oZ };
  }, [spline]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mmDataRef.current || !bikePos) return;

    const ctx = canvas.getContext('2d');
    const { pts, scale, oX, oZ } = mmDataRef.current;
    ctx.clearRect(0, 0, 150, 150);

    ctx.fillStyle = 'rgba(4, 0, 12, 0.82)';
    ctx.fillRect(0, 0, 150, 150);

    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = p.x * scale + oX;
      const z = p.z * scale + oZ;
      if (i === 0) {
        ctx.moveTo(x, z);
        return;
      }
      ctx.lineTo(x, z);
    });
    ctx.closePath();
    ctx.strokeStyle = '#211131';
    ctx.lineWidth = trackW * scale + 6;
    ctx.stroke();
    ctx.strokeStyle = '#484364';
    ctx.lineWidth = trackW * scale;
    ctx.stroke();
    ctx.strokeStyle = '#9cf8ff';
    ctx.lineWidth = 1;
    ctx.stroke();

    boostPads.forEach((pad) => {
      const px = pad.position.x * scale + oX;
      const pz = pad.position.z * scale + oZ;
      ctx.save();
      ctx.translate(px, pz);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#ffef5a';
      ctx.fillRect(-3.5, -3.5, 7, 7);
      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-4.5, -4.5, 9, 9);
      ctx.restore();
    });

    if (startPos) {
      const sx = startPos.x * scale + oX;
      const sz = startPos.z * scale + oZ;
      ctx.beginPath();
      ctx.arc(sx, sz, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#ff2aa1';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    const mx = bikePos.x * scale + oX;
    const mz = bikePos.z * scale + oZ;
    ctx.beginPath();
    ctx.arc(mx, mz, 5, 0, Math.PI * 2);
    ctx.fillStyle = `#${(bikeColor || 0xe10000).toString(16).padStart(6, '0')}`;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const arrowAngle = Math.PI / 2 - bikeHeading;
    ctx.save();
    ctx.translate(mx, mz);
    ctx.rotate(arrowAngle);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(255, 239, 90, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(2.5, 2.5, 145, 145);
  }, [bikeColor, bikeHeading, bikePos, boostPads, startPos, trackW]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="retro-minimap-frame fixed bottom-14 right-5 z-[15] pointer-events-none p-2">
      <canvas ref={canvasRef} width={150} height={150} />
    </div>
  );
}

export default memo(Minimap);
