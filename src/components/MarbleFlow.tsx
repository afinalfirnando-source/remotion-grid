import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type MarbleScheme = 'classic' | 'noir' | 'rosa' | 'verde' | 'royal';

interface MarbleFlowProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: MarbleScheme;
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
  const rx = fbm(x + 4 * qx + 1.7 + t, y + 4 * qy + 9.2, 3);
  const ry = fbm(x + 4 * rx + 8.3 + t, y + 4 * qx + 2.8, 3);
  return fbm(x + 4 * rx, y + 4 * ry, 4);
}

const schemes: Record<MarbleScheme, {
  bg: string;
  base: [number, number, number];
  baseVar: [number, number, number];
  veinColor: [number, number, number];
  veinPulse: [number, number, number];
  highlight: string;
}> = {
  classic: {
    bg: '#e8e0d8',
    base: [220, 215, 210], baseVar: [40, 20, -10],
    veinColor: [80, 50, 10], veinPulse: [20, 15, 5],
    highlight: 'rgba(255,255,255,0.12)',
  },
  noir: {
    bg: '#1a1a1e',
    base: [30, 30, 35], baseVar: [-10, -10, 5],
    veinColor: [120, 100, 140], veinPulse: [40, 30, 50],
    highlight: 'rgba(200,180,255,0.08)',
  },
  rosa: {
    bg: '#f5e8ec',
    base: [240, 225, 230], baseVar: [15, -10, -5],
    veinColor: [160, 60, 80], veinPulse: [40, 15, 20],
    highlight: 'rgba(255,200,220,0.12)',
  },
  verde: {
    bg: '#e0ece5',
    base: [220, 235, 225], baseVar: [-10, 15, -5],
    veinColor: [30, 120, 60], veinPulse: [10, 30, 15],
    highlight: 'rgba(200,255,220,0.12)',
  },
  royal: {
    bg: '#e8e0f0',
    base: [225, 215, 240], baseVar: [10, -15, 30],
    veinColor: [60, 30, 140], veinPulse: [20, 10, 40],
    highlight: 'rgba(200,180,255,0.12)',
  },
};

const MarbleFlow: React.FC<MarbleFlowProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'classic',
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

        const base = fbm(nx * 4 + 50, ny * 4 + 80, 4) * 0.15;

        const flowX = nx + Math.sin(t) * 0.15;
        const flowY = ny + Math.cos(t) * 0.1;

        const vein1 = warpedNoise(flowX * 3, flowY * 3, t);
        const vein2 = warpedNoise(flowX * 5 + 20, flowY * 5 + 20, t);
        const vein3 = warpedNoise(flowX * 2 + 40, flowY * 2, t);

        const v1Sharp = Math.abs(vein1) < 0.05 ? 1 : 0;
        const v2Sharp = Math.abs(vein2) < 0.04 ? 0.7 : 0;
        const v3Sharp = Math.abs(vein3) < 0.06 ? 0.5 : 0;
        const v1Glow = Math.max(0, 1 - Math.abs(vein1) * 10) * 0.5;
        const v2Glow = Math.max(0, 1 - Math.abs(vein2) * 12) * 0.4;

        const vein = Math.min(1, v1Sharp + v2Sharp + v3Sharp + v1Glow + v2Glow);
        const veinPulse = vein * (0.6 + Math.sin(vein1 * 5 + t) * 0.15);

        let r = pal.base[0] + base * 30;
        let g = pal.base[1] + base * 25;
        let b = pal.base[2] + base * 20;

        r += veinPulse * pal.veinColor[0];
        g += veinPulse * pal.veinColor[1];
        b += veinPulse * pal.veinColor[2];

        const colorVar = Math.sin(nx * 6 + ny * 4 + t * 2) * 0.03;
        r += colorVar * pal.baseVar[0];
        g += colorVar * pal.baseVar[1];
        b += colorVar * pal.baseVar[2];

        d[idx] = Math.min(255, Math.max(0, r | 0));
        d[idx + 1] = Math.min(255, Math.max(0, g | 0));
        d[idx + 2] = Math.min(255, Math.max(0, b | 0));
        d[idx + 3] = 255;
      }
    }

    octx.putImageData(imgData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, width, height);

    ctx.globalCompositeOperation = 'overlay';
    const hl = ctx.createRadialGradient(
      width * 0.4, height * 0.35, 0,
      width * 0.4, height * 0.35, width * 0.35
    );
    hl.addColorStop(0, pal.highlight);
    hl.addColorStop(0.5, 'rgba(255,255,255,0.04)');
    hl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hl;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { MarbleFlow };
