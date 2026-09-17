import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type LavaVeinsScheme = 'lava' | 'ice' | 'toxic' | 'void' | 'solar';

interface LavaVeinsProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: LavaVeinsScheme;
}

const PI2 = Math.PI * 2;

function noise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = Math.sin(ix * 12.9898 + iy * 78.233) * 43758.5453;
  const b = Math.sin((ix + 1) * 12.9898 + iy * 78.233) * 43758.5453;
  const c = Math.sin(ix * 12.9898 + (iy + 1) * 78.233) * 43758.5453;
  const d = Math.sin((ix + 1) * 12.9898 + (iy + 1) * 78.233) * 43758.5453;
  const n0 = (a - Math.floor(a)) * 2 - 1;
  const n1 = (b - Math.floor(b)) * 2 - 1;
  const n2 = (c - Math.floor(c)) * 2 - 1;
  const n3 = (d - Math.floor(d)) * 2 - 1;
  return n0 + (n1 - n0) * sx + (n2 - n0) * sy + (n0 - n1 - n2 + n3) * sx * sy;
}

function fbm(x: number, y: number, oct: number): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    v += a * noise(x * f, y * f);
    a *= 0.5;
    f *= 2.03;
  }
  return v;
}

function warpedNoise(x: number, y: number, t: number): number {
  const qx = fbm(x, y, 3);
  const qy = fbm(x + 5.2, y + 1.3, 3);
  const rx = fbm(x + 4 * qx + 1.7 + t * 0.25, y + 4 * qy + 9.2, 3);
  const ry = fbm(x + 4 * rx + 8.3 + t * 0.2, y + 4 * qx + 2.8, 3);
  return fbm(x + 4 * rx, y + 4 * ry, 4);
}

const schemes: Record<LavaVeinsScheme, {
  bg: string;
  rock: [number, number, number];
  dim: [number, number, number];
  mid: [number, number, number];
  bright: [number, number, number];
  hot: [number, number, number];
  glow: string;
}> = {
  lava: {
    bg: '#0a0503',
    rock: [20, 8, 5], dim: [80, 15, 5], mid: [180, 60, 10],
    bright: [255, 150, 20], hot: [255, 240, 100], glow: 'rgba(200,60,0,0.15)',
  },
  ice: {
    bg: '#030a12',
    rock: [8, 15, 30], dim: [15, 50, 100], mid: [30, 120, 180],
    bright: [100, 210, 255], hot: [200, 245, 255], glow: 'rgba(60,140,220,0.15)',
  },
  toxic: {
    bg: '#050a03',
    rock: [10, 20, 5], dim: [20, 80, 15], mid: [40, 160, 30],
    bright: [120, 240, 60], hot: [220, 255, 150], glow: 'rgba(60,200,20,0.15)',
  },
  void: {
    bg: '#08030f',
    rock: [15, 5, 25], dim: [40, 10, 80], mid: [90, 30, 160],
    bright: [160, 80, 230], hot: [220, 180, 255], glow: 'rgba(120,40,200,0.15)',
  },
  solar: {
    bg: '#0f0a03',
    rock: [25, 15, 5], dim: [100, 60, 10], mid: [200, 140, 30],
    bright: [255, 210, 80], hot: [255, 250, 200], glow: 'rgba(220,160,20,0.15)',
  },
};

function veinColor(val: number, s: typeof schemes.lava): [number, number, number] {
  const v = Math.max(0, Math.min(1, val));
  if (v < 0.15) {
    const r = v / 0.15;
    return [s.rock[0] + r * (s.dim[0] - s.rock[0]), s.rock[1] + r * (s.dim[1] - s.rock[1]), s.rock[2] + r * (s.dim[2] - s.rock[2])];
  } else if (v < 0.35) {
    const r = (v - 0.15) / 0.2;
    return [s.dim[0] + r * (s.mid[0] - s.dim[0]), s.dim[1] + r * (s.mid[1] - s.dim[1]), s.dim[2] + r * (s.mid[2] - s.dim[2])];
  } else if (v < 0.6) {
    const r = (v - 0.35) / 0.25;
    return [s.mid[0] + r * (s.bright[0] - s.mid[0]), s.mid[1] + r * (s.bright[1] - s.mid[1]), s.mid[2] + r * (s.bright[2] - s.mid[2])];
  } else {
    const r = (v - 0.6) / 0.4;
    return [s.bright[0] + r * (s.hot[0] - s.bright[0]), s.bright[1] + r * (s.hot[1] - s.bright[1]), s.bright[2] + r * (s.hot[2] - s.bright[2])];
  }
}

const LavaVeins: React.FC<LavaVeinsProps> = ({
  width = 1920, height = 1080, totalFrames = 300, speed = 1, scheme = 'lava',
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const t = (frame / totalFrames) * PI2 * speed;
  const pal = schemes[scheme];
  const sw = Math.floor(width / 2);
  const sh = Math.floor(height / 2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!offRef.current) {
      offRef.current = document.createElement('canvas');
      offRef.current.width = sw;
      offRef.current.height = sh;
    }
    const off = offRef.current;
    const octx = off.getContext('2d');
    if (!octx) return;

    const imgData = octx.createImageData(sw, sh);
    const d = imgData.data;

    for (let py = 0; py < sh; py++) {
      for (let px = 0; px < sw; px++) {
        const idx = (py * sw + px) * 4;
        const nx = px / sw;
        const ny = py / sh;

        const rock = fbm(nx * 6 + 100, ny * 6 + 200, 4) * 0.15;
        const flowY = ny + Math.sin(t) * 0.3;
        const vein1 = warpedNoise(nx * 3, flowY * 2, t);
        const vein2 = warpedNoise(nx * 5 + 10, flowY * 3 + 10, t);

        const veinMask = Math.abs(vein1) < 0.08 ? 1 : 0;
        const veinMask2 = Math.abs(vein2) < 0.06 ? 0.7 : 0;
        const veinGlow = Math.max(0, 1 - Math.abs(vein1) * 8) * 0.6;
        const veinGlow2 = Math.max(0, 1 - Math.abs(vein2) * 10) * 0.4;
        const vein = Math.min(1, veinMask + veinMask2 + veinGlow + veinGlow2);

        const heat = Math.sin(nx * 4 + flowY * 3 + t) * 0.15 + Math.sin(ny * 5 + t * 2) * 0.1;
        const lava = Math.max(rock, vein * (0.7 + heat));
        const finalVal = lava < 0.2 ? rock * 0.5 : lava;

        const [r, g, b] = veinColor(finalVal, pal);
        d[idx] = r;
        d[idx + 1] = g;
        d[idx + 2] = b;
        d[idx + 3] = 255;
      }
    }

    octx.putImageData(imgData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, width, height);

    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(width * 0.5, height * 0.3, 0, width * 0.5, height * 0.3, width * 0.4);
    glow.addColorStop(0, pal.glow);
    glow.addColorStop(0.5, 'rgba(0,0,0,0)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { LavaVeins };
