import React, { useRef, useEffect, useMemo } from 'react';
import { useCurrentFrame } from 'remotion';

export type SilkWavesScheme = 'rainbow' | 'aurora' | 'fire' | 'ocean';

interface SilkWavesProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: SilkWavesScheme;
}

const palettes: Record<SilkWavesScheme, {
  bg: string; glow: string;
  inner: [number, number, number];
  mid: [number, number, number];
  outer: [number, number, number];
}> = {
  rainbow: {
    bg: '#010004', glow: 'rgba(255,120,200,0.15)',
    inner: [255, 130, 40], mid: [220, 50, 180], outer: [40, 120, 255],
  },
  aurora: {
    bg: '#000812', glow: 'rgba(80,255,180,0.12)',
    inner: [60, 255, 180], mid: [80, 200, 255], outer: [120, 80, 255],
  },
  fire: {
    bg: '#0a0002', glow: 'rgba(255,180,40,0.15)',
    inner: [255, 220, 60], mid: [255, 100, 30], outer: [200, 40, 20],
  },
  ocean: {
    bg: '#000510', glow: 'rgba(40,180,255,0.12)',
    inner: [0, 220, 255], mid: [40, 120, 240], outer: [20, 40, 180],
  },
};

const NUM_RINGS = 12;
const POINTS_PER_RING = 200;
const DURATION = 300;

const SilkWaves: React.FC<SilkWavesProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = DURATION,
  speed = 1,
  scheme = 'rainbow',
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;
  const pal = palettes[scheme];

  const rings = useMemo(() => {
    return Array.from({ length: NUM_RINGS }, (_, i) => {
      const ratio = i / (NUM_RINGS - 1);
      const baseRadius = 50 + ratio * 600;
      const waveAmp = 25 + ratio * 55;
      const waveFreq = 3 + (i % 4);
      const phase = i * 1.1;
      return { baseRadius, waveAmp, waveFreq, phase };
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Background from palette
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, width, height);

    // Central glow from palette
    const cx = width / 2;
    const cy = height / 2;

    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.45);
    cg.addColorStop(0, pal.glow);
    cg.addColorStop(0.5, pal.glow.replace(/[\d.]+\)$/, '0.04)'));
    cg.addColorStop(1, 'transparent');
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillRect(0, 0, width, height);

    // Draw rings back to front
    for (let ri = NUM_RINGS - 1; ri >= 0; ri--) {
      const ring = rings[ri];
      const ratio = ri / (NUM_RINGS - 1);

      // Color from palette
      let r: number, g: number, b: number;
      if (ratio > 0.65) {
        r = pal.outer[0]; g = pal.outer[1]; b = pal.outer[2];
      } else if (ratio > 0.3) {
        r = pal.mid[0]; g = pal.mid[1]; b = pal.mid[2];
      } else {
        r = pal.inner[0]; g = pal.inner[1]; b = pal.inner[2];
      }

      // Generate ring points with wave deformation
      const points: { x: number; y: number }[] = [];
      for (let s = 0; s <= POINTS_PER_RING; s++) {
        const angle = (s / POINTS_PER_RING) * Math.PI * 2;
        const wave = Math.sin(angle * ring.waveFreq + t * 2 + ring.phase) * ring.waveAmp;
        const wave2 = Math.cos(angle * (ring.waveFreq + 1) + t * 3 + ring.phase * 0.7) * ring.waveAmp * 0.5;
        const wave3 = Math.sin(angle * (ring.waveFreq + 2) + t * 2 + ring.phase * 1.3) * ring.waveAmp * 0.3;
        const expand = Math.sin(t * 2 + ring.phase) * 80;
        const radius = ring.baseRadius + wave + wave2 + wave3 + expand;

        const px = cx + Math.cos(angle + t) * radius;
        const py = cy + Math.sin(angle + t) * radius;
        points.push({ x: px, y: py });
      }

      // Fill ring area
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let s = 1; s < points.length; s++) {
        const prev = points[s - 1];
        const curr = points[s];
        const cpx = (prev.x + curr.x) / 2;
        const cpy = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
      }
      ctx.closePath();

      // Gradient fill
      const grad = ctx.createRadialGradient(cx, cy, ring.baseRadius - ring.waveAmp, cx, cy, ring.baseRadius + ring.waveAmp + 20);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.0)`);
      grad.addColorStop(0.2, `rgba(${r},${g},${b},0.2)`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},0.45)`);
      grad.addColorStop(0.6, `rgba(${r},${g},${b},0.45)`);
      grad.addColorStop(0.8, `rgba(${r},${g},${b},0.2)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0.0)`);
      ctx.fillStyle = grad;
      ctx.fill();

      // Glow lines
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let s = 1; s < points.length; s++) {
        const prev = points[s - 1];
        const curr = points[s];
        const cpx = (prev.x + curr.x) / 2;
        const cpy = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
      }
      ctx.closePath();

      // Ultra wide glow
      ctx.strokeStyle = `rgba(${r},${g},${b},0.08)`;
      ctx.lineWidth = 28;
      ctx.stroke();

      // Wide glow
      ctx.strokeStyle = `rgba(${r},${g},${b},0.18)`;
      ctx.lineWidth = 12;
      ctx.stroke();

      // Mid glow
      ctx.strokeStyle = `rgba(${r},${g},${b},0.4)`;
      ctx.lineWidth = 5;
      ctx.stroke();

      // Bright core
      ctx.strokeStyle = `rgba(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)},0.85)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // White hot center
      ctx.strokeStyle = `rgba(255,255,255,0.6)`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

  }, [frame, width, height, totalFrames, speed, t, rings, pal]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { SilkWaves };
