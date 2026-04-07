import React, { useRef, useEffect, useCallback } from 'react';

export default function Minimap({ spline, bikePos, bikeHeading, startPos, trackW, bikeColor }) {
  const canvasRef = useRef(null);
  const mmDataRef = useRef(null);

  useEffect(() => {
    if (!spline) return;
    const pts = spline.getPoints(250);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    pts.forEach(p => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
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

    // Track
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = p.x * scale + oX, z = p.z * scale + oZ;
      i === 0 ? ctx.moveTo(x, z) : ctx.lineTo(x, z);
    });
    ctx.closePath();
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = trackW * scale;
    ctx.stroke();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Start
    if (startPos) {
      const sx = startPos.x * scale + oX, sz = startPos.z * scale + oZ;
      ctx.beginPath();
      ctx.arc(sx, sz, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    // Bike
    const mx = bikePos.x * scale + oX;
    const mz = bikePos.z * scale + oZ;
    ctx.beginPath();
    ctx.arc(mx, mz, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#' + (bikeColor || 0xe10000).toString(16).padStart(6, '0');
    ctx.fill();

    // Direction arrow
    const arrowAngle = Math.PI / 2 - bikeHeading;
    ctx.save();
    ctx.translate(mx, mz);
    ctx.rotate(arrowAngle);
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(4, 5);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }, [spline, bikePos, bikeHeading, startPos, trackW, bikeColor]);

  useEffect(() => {
    draw();
  });

  return (
    <div className="fixed bottom-14 right-5 z-[15] pointer-events-none border border-border bg-black/80">
      <canvas ref={canvasRef} width={150} height={150} />
    </div>
  );
}