import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type PurpleCubesScheme = 'purple' | 'neon' | 'magma';

interface PurpleCubesProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: PurpleCubesScheme;
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

const schemes: Record<PurpleCubesScheme, {
  top: [number, number, number];
  topBright: [number, number, number];
  bg1: string; bg2: string;
}> = {
  purple: {
    top: [100, 30, 190],
    topBright: [170, 70, 255],
    bg1: '#0a0418', bg2: '#050210',
  },
  neon: {
    top: [0, 180, 200],
    topBright: [60, 255, 255],
    bg1: '#040a18', bg2: '#020510',
  },
  magma: {
    top: [200, 60, 20],
    topBright: [255, 140, 50],
    bg1: '#180804', bg2: '#100402',
  },
};

const COLS = 48;
const ROWS = 36;
const MAX_H = 0.45;
const MIN_H = 0.04;

const PurpleCubes: React.FC<PurpleCubesProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'purple',
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

    // Isometric projection — BIG cubes, fill screen
    const rx = width / 30;
    const ry = rx * 0.5;

    const camSwayX = Math.sin(t * 2) * rx * 0.4;
    const camSwayY = Math.cos(t * 3) * ry * 0.25;

    // Center grid with large overflow
    const gridCenterX = (COLS - ROWS) * rx / 2;
    const gridCenterY = (COLS + ROWS) * ry / 2;
    const originX = width / 2 - gridCenterX + camSwayX - rx * 6;
    const originY = height / 2 - gridCenterY + camSwayY - ry * 5;

    // Cube face height scale
    const heightScale = height * 0.15;

    // Build cubes
    type CubeData = {
      col: number; row: number;
      sx: number; sy: number;
      h: number; hNorm: number;
      idx: number;
    };

    const cubes: CubeData[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const seed = srand(idx);

        // Isometric position
        const sx = originX + (c - r) * rx;
        const sy = originY + (c + r) * ry;

        // Waves — ALL integer multipliers
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

        cubes.push({ col: c, row: r, sx, sy, h, hNorm, idx });
      }
    }

    // Sort: draw back first (lower row+col first)
    cubes.sort((a, b) => {
      const da = a.col + a.row;
      const db = b.col + b.row;
      if (da !== db) return da - db;
      return a.col - b.col;
    });

    // Draw each cube
    for (const cube of cubes) {
      const { sx, sy, h, hNorm, idx } = cube;
      const hPx = h * heightScale;

      // Skip off-screen
      if (sx < -rx * 3 || sx > width + rx * 3 || sy < -hPx - ry * 3 || sy > height + ry * 3) continue;

      // Pulse per cube
      const pulse = 0.85 + Math.sin(t * 2 + srand(idx) * 6.28) * 0.15;

      // Color based on height
      const topR = Math.round(lerp(sc.top[0], sc.topBright[0], hNorm) * pulse);
      const topG = Math.round(lerp(sc.top[1], sc.topBright[1], hNorm) * pulse);
      const topB = Math.round(lerp(sc.top[2], sc.topBright[2], hNorm) * pulse);

      // Isometric cube vertices
      // Top face (diamond)
      const topFace = [
        { x: sx, y: sy - hPx },           // top
        { x: sx + rx, y: sy + ry - hPx },  // right
        { x: sx, y: sy + ry * 2 - hPx },   // bottom
        { x: sx - rx, y: sy + ry - hPx },  // left
      ];

      // Left face
      const leftFace = [
        { x: sx - rx, y: sy + ry - hPx },
        { x: sx, y: sy + ry * 2 - hPx },
        { x: sx, y: sy + ry * 2 },
        { x: sx - rx, y: sy + ry },
      ];

      // Right face
      const rightFace = [
        { x: sx + rx, y: sy + ry - hPx },
        { x: sx, y: sy + ry * 2 - hPx },
        { x: sx, y: sy + ry * 2 },
        { x: sx + rx, y: sy + ry },
      ];

      // Draw right face (medium bright)
      ctx.beginPath();
      ctx.moveTo(rightFace[0].x, rightFace[0].y);
      for (let k = 1; k < 4; k++) ctx.lineTo(rightFace[k].x, rightFace[k].y);
      ctx.closePath();
      ctx.fillStyle = `rgb(${Math.round(topR * 0.6)},${Math.round(topG * 0.6)},${Math.round(topB * 0.6)})`;
      ctx.fill();

      // Draw left face (darkest)
      ctx.beginPath();
      ctx.moveTo(leftFace[0].x, leftFace[0].y);
      for (let k = 1; k < 4; k++) ctx.lineTo(leftFace[k].x, leftFace[k].y);
      ctx.closePath();
      ctx.fillStyle = `rgb(${Math.round(topR * 0.32)},${Math.round(topG * 0.32)},${Math.round(topB * 0.32)})`;
      ctx.fill();

      // Draw top face (brightest)
      ctx.beginPath();
      ctx.moveTo(topFace[0].x, topFace[0].y);
      for (let k = 1; k < 4; k++) ctx.lineTo(topFace[k].x, topFace[k].y);
      ctx.closePath();
      ctx.fillStyle = `rgb(${topR},${topG},${topB})`;
      ctx.fill();

      // Edge highlight
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

export { PurpleCubes };
