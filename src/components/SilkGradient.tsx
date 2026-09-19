import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface SilkGradientProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: SilkScheme;
}

export type SilkScheme = 'dusk' | 'sunset' | 'lagoon' | 'rose' | 'midnight';

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

function smoothstep(a: number, b: number, x: number): number {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
}

const schemes: Record<SilkScheme, {
  bg: string;
  stops: [number, number, number][];
}> = {
  dusk: {
    bg: '#3a2a9e',
    stops: [
      [32, 22, 140], [80, 70, 215], [140, 120, 240],
      [232, 160, 216], [64, 200, 216], [112, 232, 184],
    ],
  },
  sunset: {
    bg: '#8e2a4e',
    stops: [
      [90, 20, 70], [180, 60, 90], [240, 120, 90],
      [250, 190, 110], [250, 230, 170], [255, 250, 220],
    ],
  },
  lagoon: {
    bg: '#0a5a6e',
    stops: [
      [6, 50, 90], [10, 110, 150], [30, 170, 190],
      [110, 220, 200], [190, 245, 215], [240, 255, 240],
    ],
  },
  rose: {
    bg: '#7e2444',
    stops: [
      [70, 14, 50], [140, 40, 90], [205, 90, 130],
      [240, 150, 175], [248, 205, 215], [255, 240, 244],
    ],
  },
  midnight: {
    bg: '#0c1440',
    stops: [
      [8, 12, 60], [20, 40, 120], [40, 90, 180],
      [90, 150, 220], [150, 200, 245], [220, 240, 255],
    ],
  },
};

// Palette stops: smooth gradient bands
function palette(u: number, stops: [number, number, number][]): [number, number, number] {
  const x = Math.max(0, Math.min(0.9999, u)) * (stops.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  return [
    a[0] + (b[0] - a[0]) * s,
    a[1] + (b[1] - a[1]) * s,
    a[2] + (b[2] - a[2]) * s,
  ];
}

const SilkGradient: React.FC<SilkGradientProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'dusk',
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

    // Diagonal flow direction
    const ang = 0.6;
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);
    const driftX = Math.sin(t) * 0.35;
    const driftY = Math.cos(t) * 0.3;

    for (let py = 0; py < sh; py++) {
      for (let px = 0; px < sw; px++) {
        const idx = (py * sw + px) * 4;
        const nx = px / sw;
        const ny = py / sh;

        // Rotate to diagonal + drift (loops)
        const rx = nx * cosA + ny * sinA + driftX;
        const ry = -nx * sinA + ny * cosA + driftY;

        // Domain-warped bands
        const q = fbm(rx * 2.2, ry * 2.2, 3);
        const w = fbm(rx * 2.2 + 2.5 * q + Math.sin(t) * 0.3, ry * 2.2 - 2 * q + Math.cos(t) * 0.3, 4);

        // Band coordinate across the flow
        let u = ry * 0.9 + w * 0.55 + 0.5;
        // Gentle traveling ripple (loops)
        u += Math.sin(rx * 3 + t * 2) * 0.03;
        u = u - Math.floor(u);

        const [r, g, b] = palette(u, pal.stops);

        // Soft depth shading
        const shade = 0.92 + fbm(nx * 3 + Math.sin(t) * 0.2, ny * 3, 2) * 0.12;

        d[idx] = Math.min(255, Math.max(0, (r * shade) | 0));
        d[idx + 1] = Math.min(255, Math.max(0, (g * shade) | 0));
        d[idx + 2] = Math.min(255, Math.max(0, (b * shade) | 0));
        d[idx + 3] = 255;
      }
    }

    octx.putImageData(imgData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, width, height);
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { SilkGradient };
