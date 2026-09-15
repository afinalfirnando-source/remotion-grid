import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type RadialHexScheme = 'blue' | 'red' | 'green';

interface RadialHexProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: RadialHexScheme;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function srand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const schemes: Record<RadialHexScheme, {
  base: [number, number, number];
  peak: [number, number, number];
  bg1: string; bg2: string; bg3: string;
}> = {
  blue: {
    base: [30, 80, 140],
    peak: [200, 230, 255],
    bg1: '#1a3a5a', bg2: '#0c1e30', bg3: '#060e18',
  },
  red: {
    base: [140, 30, 30],
    peak: [255, 200, 200],
    bg1: '#5a1a1a', bg2: '#300c0c', bg3: '#180606',
  },
  green: {
    base: [20, 120, 50],
    peak: [200, 255, 220],
    bg1: '#1a4a2a', bg2: '#0c2818', bg3: '#061408',
  },
};

const COLS = 80;
const ROWS = 60;

const RadialHex: React.FC<RadialHexProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'blue',
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;
  const sc = schemes[scheme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.6);
    bg.addColorStop(0, sc.bg1);
    bg.addColorStop(0.6, sc.bg2);
    bg.addColorStop(1, sc.bg3);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const rx = width / 50;
    const ry = rx * 0.5;

    const camSwayX = Math.sin(t * 2) * rx * 0.3;
    const camSwayY = Math.cos(t * 3) * ry * 0.2;

    const centerC = (COLS - 1) / 2;
    const centerR = (ROWS - 1) / 2;
    const originX = width / 2 - (centerC - centerR) * rx + camSwayX;
    const originY = height / 2 - (centerC + centerR) * ry + camSwayY;

    const heightScale = height * 0.12;

    type HexData = {
      sx: number; sy: number;
      h: number; hNorm: number;
      dist: number;
      idx: number;
    };

    const hexes: HexData[] = [];
    const cx = COLS / 2;
    const cy = ROWS / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const seed = srand(idx);

        const sx = originX + (c - r) * rx;
        const sy = originY + (c + r) * ry;

        const dx = c - cx;
        const dy = r - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;

        const wave1 = Math.sin(dist * 8 - t * 3) * 0.35;
        const wave2 = Math.cos(dist * 5 + t * 2) * 0.2;
        const wave3 = Math.sin(dist * 12 - t * 4) * 0.1;
        const noise = seed * 0.08;

        const hNorm = clamp(0.5 + wave1 + wave2 + wave3 + noise, 0, 1);
        const h = hNorm * 0.5;

        hexes.push({ sx, sy, h, hNorm, dist, idx });
      }
    }

    hexes.sort((a, b) => {
      const da = a.sx + a.sy;
      const db = b.sx + b.sy;
      return da - db;
    });

    const hexPoints = (cx: number, cy: number, size: number): [number, number][] => {
      const pts: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        pts.push([cx + size * Math.cos(a), cy + size * Math.sin(a) * 0.55]);
      }
      return pts;
    };

    for (const hex of hexes) {
      const { sx, sy, h, hNorm, dist } = hex;
      const hPx = h * heightScale;

      const pulse = 0.85 + Math.sin(t * 2 + dist * 5) * 0.15;
      let r: number, g: number, b: number;

      if (hNorm > 0.7) {
        const peakBlend = (hNorm - 0.7) / 0.3;
        r = Math.round(lerp(sc.base[0], sc.peak[0], peakBlend) * pulse);
        g = Math.round(lerp(sc.base[1], sc.peak[1], peakBlend) * pulse);
        b = Math.round(lerp(sc.base[2], sc.peak[2], peakBlend) * pulse);
      } else {
        const baseBlend = hNorm / 0.7;
        r = Math.round(lerp(sc.base[0] * 0.3, sc.base[0], baseBlend) * pulse);
        g = Math.round(lerp(sc.base[1] * 0.3, sc.base[1], baseBlend) * pulse);
        b = Math.round(lerp(sc.base[2] * 0.3, sc.base[2], baseBlend) * pulse);
      }

      const hexSize = rx * 0.9;

      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const aNext = (Math.PI / 3) * ((i + 1) % 6);

        const x1 = sx + hexSize * Math.cos(a);
        const y1 = sy - hPx + hexSize * Math.sin(a) * 0.55;
        const x2 = sx + hexSize * Math.cos(aNext);
        const y2 = sy - hPx + hexSize * Math.sin(aNext) * 0.55;

        if (Math.sin(a) > 0 || Math.sin(aNext) > 0) {
          const sideBright = 0.25 + Math.sin(a + Math.PI / 6) * 0.15;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x2, y2 + hPx * 0.8);
          ctx.lineTo(x1, y1 + hPx * 0.8);
          ctx.closePath();
          ctx.fillStyle = `rgb(${Math.round(r * sideBright)},${Math.round(g * sideBright)},${Math.round(b * sideBright)})`;
          ctx.fill();
        }
      }

      const topFace = hexPoints(sx, sy - hPx, hexSize);
      ctx.beginPath();
      ctx.moveTo(topFace[0][0], topFace[0][1]);
      for (let k = 1; k < 6; k++) ctx.lineTo(topFace[k][0], topFace[k][1]);
      ctx.closePath();
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${0.08 + hNorm * 0.08})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }, [frame, width, height, totalFrames, speed, t, sc]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: sc.bg3 }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { RadialHex };
