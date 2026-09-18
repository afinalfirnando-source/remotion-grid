import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type NeonTubesScheme = 'purple' | 'neon' | 'magma';

interface NeonTubesProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: NeonTubesScheme;
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

const schemes: Record<NeonTubesScheme, {
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

const COLS = 44;
const ROWS = 32;
const MAX_H = 0.5;
const MIN_H = 0.05;

const NeonTubes: React.FC<NeonTubesProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'neon',
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

    // Isometric projection
    const rx = width / 28;
    const ry = rx * 0.5;

    const camSwayX = Math.sin(t * 2) * rx * 0.4;
    const camSwayY = Math.cos(t * 3) * ry * 0.25;

    const gridCenterX = (COLS - ROWS) * rx / 2;
    const gridCenterY = (COLS + ROWS) * ry / 2;
    const originX = width / 2 - gridCenterX + camSwayX - rx * 6;
    const originY = height / 2 - gridCenterY + camSwayY - ry * 5;

    const heightScale = height * 0.16;

    type TubeData = {
      col: number; row: number;
      sx: number; sy: number;
      h: number; hNorm: number;
      idx: number;
    };

    const tubes: TubeData[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const seed = srand(idx);

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

        tubes.push({ col: c, row: r, sx, sy, h, hNorm, idx });
      }
    }

    // Sort back to front
    tubes.sort((a, b) => {
      const da = a.col + a.row;
      const db = b.col + b.row;
      if (da !== db) return da - db;
      return a.col - b.col;
    });

    // Tube top ellipse radii (inscribed in diamond)
    const ex = rx * 0.62;
    const ey = ry * 0.62;

    for (const tube of tubes) {
      const { sx, sy, h, hNorm, idx } = tube;
      const hPx = h * heightScale;

      if (sx < -rx * 3 || sx > width + rx * 3 || sy < -hPx - ry * 3 || sy > height + ry * 3) continue;

      const pulse = 0.85 + Math.sin(t * 2 + srand(idx) * 6.28) * 0.15;

      const topR = Math.round(lerp(sc.top[0], sc.topBright[0], hNorm) * pulse);
      const topG = Math.round(lerp(sc.top[1], sc.topBright[1], hNorm) * pulse);
      const topB = Math.round(lerp(sc.top[2], sc.topBright[2], hNorm) * pulse);

      const topY = sy - hPx;

      // Body — cylinder wall with horizontal shading gradient
      const bodyGrad = ctx.createLinearGradient(sx - ex, 0, sx + ex, 0);
      bodyGrad.addColorStop(0, `rgb(${Math.round(topR * 0.25)},${Math.round(topG * 0.25)},${Math.round(topB * 0.25)})`);
      bodyGrad.addColorStop(0.3, `rgb(${Math.round(topR * 0.7)},${Math.round(topG * 0.7)},${Math.round(topB * 0.7)})`);
      bodyGrad.addColorStop(0.5, `rgb(${Math.round(topR * 0.55)},${Math.round(topG * 0.55)},${Math.round(topB * 0.55)})`);
      bodyGrad.addColorStop(0.75, `rgb(${Math.round(topR * 0.38)},${Math.round(topG * 0.38)},${Math.round(topB * 0.38)})`);
      bodyGrad.addColorStop(1, `rgb(${Math.round(topR * 0.22)},${Math.round(topG * 0.22)},${Math.round(topB * 0.22)})`);

      ctx.beginPath();
      ctx.moveTo(sx - ex, topY);
      ctx.lineTo(sx - ex, topY + hPx);
      ctx.ellipse(sx, topY + hPx, ex, ey, 0, Math.PI, 0, true);
      ctx.lineTo(sx + ex, topY);
      ctx.ellipse(sx, topY, ex, ey, 0, 0, Math.PI, false);
      ctx.closePath();
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Bottom rim shadow
      ctx.beginPath();
      ctx.ellipse(sx, topY + hPx, ex, ey, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,0,0,${0.15 + hNorm * 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Top face — bright ellipse with radial highlight
      const faceGrad = ctx.createRadialGradient(
        sx - ex * 0.25, topY - ey * 0.3, 0,
        sx, topY, ex,
      );
      faceGrad.addColorStop(0, `rgb(${Math.min(255, Math.round(topR * 1.25))},${Math.min(255, Math.round(topG * 1.25))},${Math.min(255, Math.round(topB * 1.25))})`);
      faceGrad.addColorStop(0.6, `rgb(${topR},${topG},${topB})`);
      faceGrad.addColorStop(1, `rgb(${Math.round(topR * 0.7)},${Math.round(topG * 0.7)},${Math.round(topB * 0.7)})`);
      ctx.beginPath();
      ctx.ellipse(sx, topY, ex, ey, 0, 0, Math.PI * 2);
      ctx.fillStyle = faceGrad;
      ctx.fill();

      // Edge highlight
      ctx.strokeStyle = `rgba(255,255,255,${0.08 + hNorm * 0.08})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  }, [frame, width, height, totalFrames, speed, t, sc]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: sc.bg2 }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { NeonTubes };
