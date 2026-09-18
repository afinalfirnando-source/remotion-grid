import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface PoolRipplesProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: PoolScheme;
}

export type PoolScheme = 'tropical' | 'lagoon' | 'sunset' | 'midnight' | 'emerald';

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

// Domain-warped caustic field — sin/cos integer multipliers only
function causticField(x: number, y: number, t: number): number {
  const wx = x + Math.sin(t) * 0.35;
  const wy = y + Math.cos(t) * 0.35;
  const qx = fbm(wx, wy, 3);
  const qy = fbm(wx + 5.2, wy + 1.3, 3);
  const rx = fbm(wx + 4 * qx + 1.7 + Math.sin(t), wy + 4 * qy + 9.2 + Math.cos(t), 3);
  const ry = fbm(wx + 4 * rx + 8.3 + Math.cos(t), wy + 4 * qx + 2.8 + Math.sin(t), 3);
  const v = fbm(wx + 4 * rx, wy + 4 * ry, 4);
  return v; // roughly [-1, 1]
}

const schemes: Record<PoolScheme, {
  bg: string;
  base: [number, number, number];
  swell: [number, number, number];
  glow: [number, number, number];
  tile: [number, number, number];
  sun: string;
}> = {
  tropical: {
    bg: '#3e9ed0',
    base: [62, 158, 208], swell: [60, 60, 40], glow: [160, 90, 40],
    tile: [8, 8, 6], sun: 'rgba(200,235,255,0.10)',
  },
  lagoon: {
    bg: '#0e7d84',
    base: [14, 125, 132], swell: [30, 60, 55], glow: [180, 110, 50],
    tile: [6, 12, 12], sun: 'rgba(180,240,230,0.10)',
  },
  sunset: {
    bg: '#b0583a',
    base: [176, 88, 58], swell: [60, 40, 30], glow: [80, 120, 130],
    tile: [14, 8, 6], sun: 'rgba(255,220,180,0.12)',
  },
  midnight: {
    bg: '#12325e',
    base: [18, 50, 94], swell: [25, 45, 60], glow: [150, 170, 120],
    tile: [4, 8, 14], sun: 'rgba(120,170,255,0.10)',
  },
  emerald: {
    bg: '#1d8a5f',
    base: [29, 138, 95], swell: [40, 60, 45], glow: [170, 100, 50],
    tile: [6, 12, 9], sun: 'rgba(190,245,210,0.10)',
  },
};

const PoolRipples: React.FC<PoolRipplesProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'tropical',
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

        // Caustic web — ridged pattern: bright thin lines
        const c1 = causticField(nx * 4, ny * 4, t);
        const c2 = causticField(nx * 7 + 13, ny * 7 + 7, t + 2);
        const ridge = 1 - Math.abs(c1 * 0.65 + c2 * 0.35);
        // Sharpen into thin bright web lines
        const web = Math.pow(Math.max(0, ridge), 6);

        // Secondary shimmer layer
        const c3 = causticField(nx * 10 + 31, ny * 10 + 17, t + 4);
        const ridge2 = 1 - Math.abs(c3);
        const web2 = Math.pow(Math.max(0, ridge2), 8) * 0.5;

        // Gentle large-scale brightness variation
        const swell = fbm(nx * 2 + Math.sin(t) * 0.2, ny * 2 + Math.cos(t) * 0.2, 3) * 0.08;

        // Base pool color
        let r = pal.base[0] + swell * pal.swell[0];
        let g = pal.base[1] + swell * pal.swell[1];
        let b = pal.base[2] + swell * pal.swell[2];

        // Caustic bright lines — near white
        const glowAmt = web + web2;
        r += glowAmt * pal.glow[0];
        g += glowAmt * pal.glow[1];
        b += glowAmt * pal.glow[2];

        // Faint tile grid underneath
        const tileX = Math.abs(((nx * 8) % 1) - 0.5);
        const tileY = Math.abs(((ny * 8) % 1) - 0.5);
        const tileLine = (tileX > 0.48 || tileY > 0.48) ? 1 : 0;
        r -= tileLine * pal.tile[0];
        g -= tileLine * pal.tile[1];
        b -= tileLine * pal.tile[2];

        // Subtle sparkle
        const sparkle = Math.sin(nx * 25 + ny * 22 + t * 3) * 0.015;
        r += sparkle * 60;
        g += sparkle * 60;
        b += sparkle * 50;

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

    // Sunny glow from top
    ctx.globalCompositeOperation = 'screen';
    const sun = ctx.createLinearGradient(0, 0, 0, height * 0.5);
    sun.addColorStop(0, pal.sun);
    sun.addColorStop(1, 'rgba(200,235,255,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, width, height * 0.5);
    ctx.globalCompositeOperation = 'source-over';
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { PoolRipples };
