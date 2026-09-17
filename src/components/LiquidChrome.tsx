import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type LiquidChromeScheme = 'chrome' | 'gold' | 'rose' | 'emerald' | 'obsidian';

interface LiquidChromeProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: LiquidChromeScheme;
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

const schemes: Record<LiquidChromeScheme, {
  bg: string;
  shadow: [number, number, number];
  mid: [number, number, number];
  highlight: [number, number, number];
  tint: [number, number, number];
  glow1: string;
  glow2: string;
}> = {
  chrome: {
    bg: '#1a1e2a',
    shadow: [30, 35, 60], mid: [160, 170, 200], highlight: [240, 245, 255], tint: [0, 0, 30],
    glow1: 'rgba(200,210,230,0.15)', glow2: 'rgba(180,200,230,0.1)',
  },
  gold: {
    bg: '#1a1508',
    shadow: [50, 30, 5], mid: [200, 160, 50], highlight: [255, 230, 140], tint: [20, 10, 0],
    glow1: 'rgba(255,200,80,0.15)', glow2: 'rgba(255,180,40,0.1)',
  },
  rose: {
    bg: '#1a0e18',
    shadow: [60, 15, 35], mid: [200, 80, 130], highlight: [255, 190, 210], tint: [30, 0, 15],
    glow1: 'rgba(255,140,180,0.15)', glow2: 'rgba(255,100,150,0.1)',
  },
  emerald: {
    bg: '#0a1a12',
    shadow: [5, 50, 25], mid: [50, 190, 100], highlight: [160, 255, 200], tint: [0, 20, 10],
    glow1: 'rgba(80,220,140,0.15)', glow2: 'rgba(40,200,100,0.1)',
  },
  obsidian: {
    bg: '#0a0a10',
    shadow: [10, 10, 20], mid: [60, 60, 80], highlight: [180, 180, 220], tint: [0, 0, 15],
    glow1: 'rgba(120,120,180,0.12)', glow2: 'rgba(80,80,140,0.08)',
  },
};

function mapChrome(val: number, s: typeof schemes.chrome): [number, number, number] {
  const v = Math.max(0, Math.min(1, val));
  const sharp = Math.pow(v, 0.6);
  const t = sharp;
  return [
    Math.min(255, s.shadow[0] + (s.mid[0] - s.shadow[0]) * t + (s.highlight[0] - s.mid[0]) * Math.pow(v, 4)),
    Math.min(255, s.shadow[1] + (s.mid[1] - s.shadow[1]) * t + (s.highlight[1] - s.mid[1]) * Math.pow(v, 4)),
    Math.min(255, s.shadow[2] + (s.mid[2] - s.shadow[2]) * t + (s.highlight[2] - s.mid[2]) * Math.pow(v, 4)),
  ];
}

const LiquidChrome: React.FC<LiquidChromeProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'chrome',
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

        const n1 = warpedNoise(nx * 2.5, ny * 2.5, t);
        const n2 = warpedNoise(nx * 4 + 10, ny * 4 + 10, t);
        const n3 = warpedNoise(nx * 1.5 + 20, ny * 1.5, t);

        let h = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

        const dx = warpedNoise((nx + 0.01) * 2.5, ny * 2.5, t) - n1;
        const dy = warpedNoise(nx * 2.5, (ny + 0.01) * 2.5, t) - n1;

        let chrome = h * 0.6 + (dx + dy) * 3 + 0.5;
        chrome += Math.sin(h * 12 + t) * 0.1;
        chrome += Math.sin(n1 * 8 + n2 * 6 + t) * 0.08;
        chrome = Math.max(0, Math.min(1, chrome));

        const [r, g, b] = mapChrome(chrome, pal);
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
    const hl = ctx.createRadialGradient(
      width * 0.4, height * 0.35, 0,
      width * 0.4, height * 0.35, width * 0.3
    );
    hl.addColorStop(0, pal.glow1);
    hl.addColorStop(0.5, 'rgba(0,0,0,0)');
    hl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hl;
    ctx.fillRect(0, 0, width, height);

    const hl2 = ctx.createRadialGradient(
      width * 0.65, height * 0.55, 0,
      width * 0.65, height * 0.55, width * 0.25
    );
    hl2.addColorStop(0, pal.glow2);
    hl2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hl2;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'source-over';
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { LiquidChrome };
