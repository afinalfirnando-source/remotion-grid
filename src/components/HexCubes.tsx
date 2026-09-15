import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type HexCubesScheme = 'emerald' | 'ocean' | 'lava';

interface HexCubesProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: HexCubesScheme;
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

const schemes: Record<HexCubesScheme, {
  top: [number, number, number];
  topBright: [number, number, number];
  bg1: string; bg2: string;
}> = {
  emerald: {
    top: [20, 170, 80],
    topBright: [60, 255, 140],
    bg1: '#041208', bg2: '#020a04',
  },
  ocean: {
    top: [20, 100, 180],
    topBright: [60, 180, 255],
    bg1: '#040812', bg2: '#02040a',
  },
  lava: {
    top: [200, 50, 10],
    topBright: [255, 130, 40],
    bg1: '#140604', bg2: '#0a0302',
  },
};

const COLS = 48;
const ROWS = 36;
const MAX_H = 0.45;
const MIN_H = 0.04;
const SQRT3 = Math.sqrt(3);

const HexCubes: React.FC<HexCubesProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'emerald',
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

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, sc.bg1);
    bg.addColorStop(1, sc.bg2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Hex grid scale
    const rx = width / 32;
    const ry = rx * 0.5;

    const camSwayX = Math.sin(t * 2) * rx * 0.4;
    const camSwayY = Math.cos(t * 3) * ry * 0.25;

    // Center hex grid
    const gridCenterX = (COLS - ROWS) * rx / 2;
    const gridCenterY = (COLS + ROWS) * ry / 2;
    const originX = width / 2 - gridCenterX + camSwayX - rx * 6;
    const originY = height / 2 - gridCenterY + camSwayY - ry * 5;

    const heightScale = height * 0.15;

    type HexData = {
      sx: number; sy: number;
      h: number; hNorm: number;
      idx: number;
    };

    const hexes: HexData[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const seed = srand(idx);

        const sx = originX + (c - r) * rx;
        const sy = originY + (c + r) * ry;

        const nx = (c / (COLS - 1)) * 2 - 1;
        const ny = (r / (ROWS - 1)) * 2 - 1;
        const dist = Math.sqrt(nx * nx + ny * ny);

        const w1 = Math.sin(c * 0.3 + t * 2) * 0.22;
        const w2 = Math.cos(r * 0.3 + t * 3) * 0.18;
        const w3 = Math.sin((c + r) * 0.25 + t * 2) * 0.14;
        const w4 = Math.sin(dist * 2.5 - t * 2) * 0.18;
        const noise = seed * 0.12;

        const hNorm = clamp(0.4 + w1 + w2 + w3 + w4 + noise, 0, 1);
        const h = MIN_H + hNorm * (MAX_H - MIN_H);

        hexes.push({ sx, sy, h, hNorm, idx });
      }
    }

    hexes.sort((a, b) => {
      const da = a.sx + a.sy;
      const db = b.sx + b.sy;
      return da - db;
    });

    // Hexagon points (flat-top)
    const hexPoints = (cx: number, cy: number, size: number): [number, number][] => {
      const pts: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        pts.push([cx + size * Math.cos(a), cy + size * Math.sin(a) * 0.55]);
      }
      return pts;
    };

    for (const hex of hexes) {
      const { sx, sy, h, hNorm, idx } = hex;
      const hPx = h * heightScale;
      const pulse = 0.85 + Math.sin(t * 2 + srand(idx) * 6.28) * 0.15;

      const topR = Math.round(lerp(sc.top[0], sc.topBright[0], hNorm) * pulse);
      const topG = Math.round(lerp(sc.top[1], sc.topBright[1], hNorm) * pulse);
      const topB = Math.round(lerp(sc.top[2], sc.topBright[2], hNorm) * pulse);

      const hexSize = rx * 0.9;

      // Top hexagon face
      const topFace = hexPoints(sx, sy - hPx, hexSize);

      // Draw side faces (6 vertical strips going down from each edge)
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const aNext = (Math.PI / 3) * ((i + 1) % 6);

        const x1 = sx + hexSize * Math.cos(a);
        const y1 = sy - hPx + hexSize * Math.sin(a) * 0.55;
        const x2 = sx + hexSize * Math.cos(aNext);
        const y2 = sy - hPx + hexSize * Math.sin(aNext) * 0.55;

        // Only draw side faces that face toward camera (bottom half)
        if (Math.sin(a) > 0 || Math.sin(aNext) > 0) {
          const sideBright = 0.25 + Math.sin(a + Math.PI / 6) * 0.15;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x2, y2 + hPx * 0.8);
          ctx.lineTo(x1, y1 + hPx * 0.8);
          ctx.closePath();
          ctx.fillStyle = `rgb(${Math.round(topR * sideBright)},${Math.round(topG * sideBright)},${Math.round(topB * sideBright)})`;
          ctx.fill();
        }
      }

      // Draw top hexagon
      ctx.beginPath();
      ctx.moveTo(topFace[0][0], topFace[0][1]);
      for (let k = 1; k < 6; k++) ctx.lineTo(topFace[k][0], topFace[k][1]);
      ctx.closePath();
      ctx.fillStyle = `rgb(${topR},${topG},${topB})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${0.06 + hNorm * 0.06})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }, [frame, width, height, totalFrames, speed, t, sc]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: sc.bg2 }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { HexCubes };
