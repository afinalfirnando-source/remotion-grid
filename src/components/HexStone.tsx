import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface HexStoneProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: HexStoneScheme;
}

export type HexStoneScheme = 'carbon' | 'graphite' | 'sandstone' | 'slate' | 'bronze' | 'midnight';

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

const schemes: Record<HexStoneScheme, {
  bg: [string, string, string];
  base: [number, number, number];
  bright: [number, number, number];
  div: string;
  wash: string;
}> = {
  carbon: {
    bg: ['#101014', '#08080a', '#040405'],
    base: [14, 14, 16], bright: [62, 62, 66], div: '#060607', wash: 'rgba(120,125,145,0.07)',
  },
  graphite: {
    bg: ['#1a1c22', '#101216', '#07080b'],
    base: [26, 28, 34], bright: [88, 94, 108], div: '#0c0e12', wash: 'rgba(150,160,185,0.07)',
  },
  sandstone: {
    bg: ['#1c150e', '#100c07', '#070503'],
    base: [32, 24, 16], bright: [112, 84, 52], div: '#0d0905', wash: 'rgba(200,170,130,0.07)',
  },
  slate: {
    bg: ['#0e1620', '#080e16', '#04070c'],
    base: [18, 28, 38], bright: [62, 92, 120], div: '#060b11', wash: 'rgba(130,170,200,0.07)',
  },
  bronze: {
    bg: ['#1e1208', '#120a05', '#080502'],
    base: [36, 22, 12], bright: [128, 82, 38], div: '#0e0703', wash: 'rgba(215,170,110,0.07)',
  },
  midnight: {
    bg: ['#12102a', '#0a0818', '#050410'],
    base: [22, 20, 44], bright: [74, 68, 128], div: '#080614', wash: 'rgba(150,140,220,0.07)',
  },
};

const SQRT3 = Math.sqrt(3);
const MAX_H = 0.5;
const MIN_H = 0.03;

const HexStone: React.FC<HexStoneProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'carbon',
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;
  const pal = schemes[scheme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createRadialGradient(
      width * 0.5, height * 0.42, 0,
      width * 0.5, height * 0.42, width * 0.6,
    );
    bg.addColorStop(0, pal.bg[0]);
    bg.addColorStop(0.6, pal.bg[1]);
    bg.addColorStop(1, pal.bg[2]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Flat-top hex grid
    const size = width / 26;
    const stepX = size * 1.5;
    const stepY = size * SQRT3;
    const squash = 0.92;

    const camSwayX = Math.sin(t * 2) * size * 0.15;
    const camSwayY = Math.cos(t * 3) * size * 0.1;

    type HexData = {
      cx: number; cy: number;
      h: number; hNorm: number;
      idx: number;
    };

    const hexes: HexData[] = [];
    let idx = 0;
    const cols = Math.ceil(width / stepX) + 2;
    const rows = Math.ceil(height / stepY) + 2;
    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        const cx = c * stepX + camSwayX;
        const cy = r * stepY + (c % 2 === 0 ? 0 : stepY / 2) + camSwayY;
        const seed = srand(idx * 3.7);

        // Waves — ALL integer multipliers for seamless loop
        const w1 = Math.sin(c * 0.45 + t * 2) * 0.22;
        const w2 = Math.cos(r * 0.5 + t * 3) * 0.18;
        const w3 = Math.sin((c * 0.7 + r * 0.9) + t * 2) * 0.15;
        const w4 = Math.sin((c - r) * 0.35 - t * 2) * 0.16;
        const noise = seed * 0.18;

        const hNorm = clamp(0.42 + w1 + w2 + w3 + w4 + noise, 0, 1);
        const h = MIN_H + hNorm * (MAX_H - MIN_H);

        hexes.push({ cx, cy, h, hNorm, idx });
        idx++;
      }
    }

    // Draw top rows first
    hexes.sort((a, b) => a.cy - b.cy);

    // Flat-top hexagon corners
    const corners = (cx: number, cy: number, s: number): [number, number][] => {
      const pts: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i);
        pts.push([cx + s * Math.cos(a), cy + s * Math.sin(a) * squash]);
      }
      return pts;
    };

    const heightScale = height * 0.055;
    const hexSize = size * 0.96;

    for (const hex of hexes) {
      const { cx, cy, h, hNorm } = hex;
      const hPx = h * heightScale;

      if (cx < -size * 2 || cx > width + size * 2 || cy < -size * 2 || cy > height + size * 2) continue;

      // Stone tones
      const base = lerp(pal.base[0], pal.bright[0], hNorm);
      const baseG = lerp(pal.base[1], pal.bright[1], hNorm);
      const baseB = lerp(pal.base[2], pal.bright[2], hNorm);
      const top = lerp(pal.base[0] + 6, pal.bright[0], hNorm);
      const topG = lerp(pal.base[1] + 6, pal.bright[1], hNorm);
      const topB = lerp(pal.base[2] + 8, pal.bright[2], hNorm);

      const topPts = corners(cx, cy - hPx, hexSize);

      // Side walls — extrude down, only lower edges visible
      for (let i = 0; i < 6; i++) {
        const p1 = topPts[i];
        const p2 = topPts[(i + 1) % 6];
        const midY = (p1[1] + p2[1]) / 2;
        // Draw walls facing viewer (below center)
        if (midY > cy - hPx) {
          const shade = 0.35 + (midY - (cy - hPx)) / (hexSize * squash) * 0.25;
          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.lineTo(p2[0], p2[1] + hPx);
          ctx.lineTo(p1[0], p1[1] + hPx);
          ctx.closePath();
          ctx.fillStyle = `rgb(${Math.round(base * shade)},${Math.round(baseG * shade)},${Math.round(baseB * shade)})`;
          ctx.fill();
        }
      }

      // Top face with vertical light gradient
      const faceGrad = ctx.createLinearGradient(0, cy - hPx - hexSize * squash, 0, cy - hPx + hexSize * squash);
      faceGrad.addColorStop(0, `rgb(${Math.round(top * 1.25)},${Math.round(topG * 1.25)},${Math.round(topB * 1.28)})`);
      faceGrad.addColorStop(0.55, `rgb(${Math.round(top)},${Math.round(topG)},${Math.round(topB)})`);
      faceGrad.addColorStop(1, `rgb(${Math.round(top * 0.72)},${Math.round(topG * 0.72)},${Math.round(topB * 0.74)})`);
      ctx.beginPath();
      ctx.moveTo(topPts[0][0], topPts[0][1]);
      for (let k = 1; k < 6; k++) ctx.lineTo(topPts[k][0], topPts[k][1]);
      ctx.closePath();
      ctx.fillStyle = faceGrad;
      ctx.fill();

      // Top edge highlight
      ctx.strokeStyle = `rgba(255,255,255,${0.05 + hNorm * 0.09})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Soft glow on tallest hexes
      if (hNorm > 0.82) {
        ctx.strokeStyle = `rgba(200,200,215,${(hNorm - 0.82) * 0.9})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Top light wash
    ctx.globalCompositeOperation = 'screen';
    const wash = ctx.createLinearGradient(0, 0, 0, height * 0.5);
    wash.addColorStop(0, pal.wash);
    wash.addColorStop(1, pal.wash.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height * 0.5);
    ctx.globalCompositeOperation = 'source-over';
  }, [frame, width, height, totalFrames, speed, t, pal]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.div }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { HexStone };
