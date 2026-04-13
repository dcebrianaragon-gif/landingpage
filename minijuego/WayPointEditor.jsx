import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export default function WaypointEditor({ waypoints = [], onChange }) {
  const canvasRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const W = 400;
  const H = 300;
  const SCALE = 1.5;
  const OX = W / 2;
  const OZ = H / 2;

  const toCanvas = (x, z) => [OX + x * SCALE, OZ + z * SCALE];
  const fromCanvas = (cx, cz) => [(cx - OX) / SCALE, (cz - OZ) / SCALE];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(OX, OZ, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();

    if (waypoints.length < 2) return;

    ctx.beginPath();
    waypoints.forEach((wp, i) => {
      const [cx, cy] = toCanvas(wp.x, wp.z);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.strokeStyle = '#e10000';
    ctx.lineWidth = 2;
    ctx.stroke();

    waypoints.forEach((wp, i) => {
      const [cx, cy] = toCanvas(wp.x, wp.z);
      ctx.beginPath();
      ctx.arc(cx, cy, i === 0 ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#00f2ff' : '#e10000';
      ctx.fill();
      ctx.fillStyle = '#666';
      ctx.font = '9px monospace';
      ctx.fillText(i.toString(), cx + 6, cy - 4);
    });
  }, [waypoints]);

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const handleMouseDown = (e) => {
    const [mx, my] = getMousePos(e);
    for (let i = 0; i < waypoints.length; i++) {
      const [cx, cy] = toCanvas(waypoints[i].x, waypoints[i].z);
      if (Math.abs(mx - cx) < 8 && Math.abs(my - cy) < 8) {
        setDragging(i);
        return;
      }
    }
    const [x, z] = fromCanvas(mx, my);
    onChange([...waypoints, { x: Math.round(x), z: Math.round(z) }]);
  };

  const handleMouseMove = (e) => {
    if (dragging === null) return;
    const [mx, my] = getMousePos(e);
    const [x, z] = fromCanvas(mx, my);
    const nextWaypoints = [...waypoints];
    nextWaypoints[dragging] = { x: Math.round(x), z: Math.round(z) };
    onChange(nextWaypoints);
  };

  const handleMouseUp = () => setDragging(null);

  const removePoint = (idx) => {
    onChange(waypoints.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        Haz clic para anadir puntos. Arrastra para mover. El primer punto (azul) es la meta.
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-[400px] cursor-crosshair border border-border bg-black/50"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="max-h-40 space-y-1 overflow-y-auto">
        {waypoints.map((wp, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-6 text-right font-mono">{i}:</span>
            <span className="font-mono">({wp.x}, {wp.z})</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removePoint(i)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
