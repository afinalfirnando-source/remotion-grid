import React, { useRef, useMemo, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface GlitterFlowProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const PI2 = Math.PI * 2;
const NUM_WIND = 3000;
const NUM_ORBIT = 600;

function GlitterFlow({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
}: GlitterFlowProps) {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * PI2 * speed;

  const windData = useMemo(() => {
    return Array.from({ length: NUM_WIND }, (_, i) => {
      const s = i + 5000;
      return {
        sx: seededRandom(s) * width,
        sy: seededRandom(s + 1) * height,
        sz: 0.5 + seededRandom(s + 2) * 2.5,
        br: 0.3 + seededRandom(s + 3) * 0.7,
        vx: 1 + seededRandom(s + 4) * 2,
        vy: 0.5 + seededRandom(s + 5) * 1.5,
        ph: seededRandom(s + 6) * PI2,
        dx: 60 + seededRandom(s + 7) * 180,
        dy: 20 + seededRandom(s + 8) * 60,
        wx: 5 + seededRandom(s + 9) * 15,
        wy: 3 + seededRandom(s + 10) * 10,
      };
    });
  }, [width, height]);

  const orbitData = useMemo(() => {
    return Array.from({ length: NUM_ORBIT }, (_, i) => ({
      bx: seededRandom(i * 2) * width,
      by: seededRandom(i * 2 + 1) * height,
      sz: 1 + seededRandom(i * 3) * 3,
      br: 0.4 + seededRandom(i * 4) * 0.6,
      sp: 0.5 + seededRandom(i * 5) * 1.5,
      ph: seededRandom(i * 6) * PI2,
      ob: 10 + seededRandom(i * 7) * 40,
    }));
  }, [width, height]);

  const flowLines = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      sx: seededRandom(i * 100) * width,
      sy: seededRandom(i * 100 + 50) * height,
    }));
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#031a18';
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'screen';

    // Gradients
    const g1 = ctx.createRadialGradient(width * 0.3, height * 0.4, 0, width * 0.3, height * 0.4, width * 0.4);
    g1.addColorStop(0, 'rgba(0,100,90,0.35)');
    g1.addColorStop(0.5, 'rgba(0,60,55,0.15)');
    g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, width, height);

    const g2 = ctx.createRadialGradient(width * 0.7, height * 0.6, 0, width * 0.7, height * 0.6, width * 0.35);
    g2.addColorStop(0, 'rgba(0,120,100,0.3)');
    g2.addColorStop(0.5, 'rgba(0,80,70,0.12)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, width, height);

    const g3 = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, width * 0.3);
    g3.addColorStop(0, 'rgba(20,180,150,0.2)');
    g3.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, width, height);

    // Flow lines
    ctx.strokeStyle = 'rgba(0,150,130,0.06)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const fl = flowLines[i];
      ctx.beginPath();
      ctx.moveTo(fl.sx, fl.sy);
      for (let s = 1; s <= 8; s++) {
        ctx.lineTo(
          fl.sx + Math.sin(t + i + s * 0.5) * 150 + s * 40,
          fl.sy + Math.cos(t + i + s * 0.7) * 100 + s * 30
        );
      }
      ctx.stroke();
    }

    // Wind particles
    for (const p of windData) {
      const px = p.sx + Math.sin(t * p.vx + p.ph) * p.dx + Math.sin(t * 2 + p.ph) * p.wx;
      const py = p.sy + Math.sin(t * p.vy + p.ph + 1) * p.dy + Math.sin(t * 3 + p.ph) * p.wy;
      const flicker = 0.6 + Math.sin(t * 2 + p.ph * 3) * 0.4;
      const alpha = p.br * flicker;
      const r = 80 + alpha * 120 | 0;
      const g = 200 + alpha * 55 | 0;
      const b = 180 + alpha * 75 | 0;

      ctx.beginPath();
      ctx.arc(px, py, p.sz, 0, PI2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    }

    // Orbital particles
    for (const p of orbitData) {
      const px = p.bx + Math.sin(t * p.sp + p.ph) * p.ob;
      const py = p.by + Math.cos(t * p.sp + p.ph + 1) * p.ob * 0.7;
      const flicker = 0.5 + Math.sin(t * 3 + p.ph) * 0.5;
      const alpha = p.br * flicker;
      const r = 100 + alpha * 155 | 0;
      const g = 220 + alpha * 35 | 0;
      const b = 200 + alpha * 55 | 0;

      // Glow
      ctx.beginPath();
      ctx.arc(px, py, p.sz * 3, 0, PI2);
      ctx.fillStyle = `rgba(0,${180 + alpha * 75 | 0},${160 + alpha * 95 | 0},${alpha * 0.12})`;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(px, py, p.sz, 0, PI2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();

      if (alpha > 0.7) {
        ctx.beginPath();
        ctx.arc(px, py, p.sz * 0.4, 0, PI2);
        ctx.fillStyle = `rgba(255,255,255,${(alpha - 0.7) * 2})`;
        ctx.fill();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: '#031a18' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
}

export { GlitterFlow };
