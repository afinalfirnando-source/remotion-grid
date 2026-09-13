import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface PastelFluidWavesProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
}

interface WaveLayer {
  baseY: number;
  amp1: number;
  amp2: number;
  kx1: number;
  kx2: number;
  s1: number;
  s2: number;
  ph1: number;
  ph2: number;
  color: string;
  alpha: number;
}

const LAYERS: WaveLayer[] = [
  { baseY: 0.3, amp1: 0.055, amp2: 0.025, kx1: 2, kx2: 4, s1: 1, s2: 2, ph1: 0.0, ph2: 1.3, color: '#b8d4f5', alpha: 0.9 },
  { baseY: 0.4, amp1: 0.06, amp2: 0.03, kx1: 3, kx2: 5, s1: 2, s2: 1, ph1: 1.1, ph2: 2.6, color: '#c3b8f0', alpha: 0.9 },
  { baseY: 0.5, amp1: 0.065, amp2: 0.028, kx1: 2, kx2: 3, s1: 1, s2: 3, ph1: 2.2, ph2: 0.7, color: '#bde0fe', alpha: 0.92 },
  { baseY: 0.6, amp1: 0.06, amp2: 0.032, kx1: 3, kx2: 6, s1: 3, s2: 2, ph1: 3.1, ph2: 1.9, color: '#ffc8dd', alpha: 0.92 },
  { baseY: 0.7, amp1: 0.055, amp2: 0.026, kx1: 4, kx2: 2, s1: 2, s2: 4, ph1: 4.2, ph2: 3.0, color: '#ffafcc', alpha: 0.94 },
  { baseY: 0.8, amp1: 0.05, amp2: 0.024, kx1: 3, kx2: 5, s1: 1, s2: 2, ph1: 5.0, ph2: 4.1, color: '#ffe5ec', alpha: 0.96 },
];

export const PastelFluidWaves: React.FC<PastelFluidWavesProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#fff8fb');
    bg.addColorStop(0.5, '#f3ecf9');
    bg.addColorStop(1, '#e8f1ff');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    for (let b = 0; b < 18; b++) {
      const bx0 = ((b * 613.7) % width) / width;
      const by0 = 0.15 + ((b * 377.3) % 700) / 1000;
      const driftX = Math.sin(t * 1 + b * 1.7) * width * 0.03;
      const driftY = Math.cos(t * 2 + b * 2.3) * height * 0.02;
      const br = width * (0.04 + ((b * 91) % 40) / 1000);
      const bx = bx0 * width + driftX;
      const by = by0 * height + driftY;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    const step = Math.max(8, Math.floor(width / 240));

    for (let li = 0; li < LAYERS.length; li++) {
      const L = LAYERS[li];
      const baseY = height * L.baseY + Math.sin(t * 1 + li * 1.2) * height * 0.015;

      ctx.beginPath();
      ctx.moveTo(-step, height + step);

      for (let x = -step; x <= width + step; x += step) {
        const u = x / width;
        const y =
          baseY +
          Math.sin(u * Math.PI * 2 * L.kx1 + t * L.s1 + L.ph1) * height * L.amp1 +
          Math.sin(u * Math.PI * 2 * L.kx2 - t * L.s2 + L.ph2) * height * L.amp2;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width + step, height + step);
      ctx.closePath();

      ctx.globalAlpha = L.alpha;
      ctx.fillStyle = L.color;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      for (let x = -step; x <= width + step; x += step) {
        const u = x / width;
        const y =
          baseY +
          Math.sin(u * Math.PI * 2 * L.kx1 + t * L.s1 + L.ph1) * height * L.amp1 +
          Math.sin(u * Math.PI * 2 * L.kx2 - t * L.s2 + L.ph2) * height * L.amp2;
        if (x === -step) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = Math.max(2, width / 1280);
      ctx.stroke();
    }
  }, [frame, width, height, totalFrames, speed, t]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: '#f6eff7' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};
