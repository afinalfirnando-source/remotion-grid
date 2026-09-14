import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type HexColorScheme = 'cyan' | 'magma' | 'aurora';

interface HexagonalWave3DProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: HexColorScheme;
}

const hexSchemes: Record<HexColorScheme, {
  top: (e: number) => [number, number, number];
  side: (e: number, darken: number) => [number, number, number];
  stroke: string;
  glow: string;
  bg1: string; bg2: string; bg3: string;
}> = {
  cyan: {
    top: (e) => [Math.round(8 + e * 170), Math.round(90 + e * 160), Math.round(160 + e * 95)],
    side: (e, d) => [
      Math.round((8 + e * 170) * d),
      Math.round((90 + e * 160) * d),
      Math.round((160 + e * 95) * d),
    ],
    stroke: 'rgba(120,220,255,',
    glow: 'rgba(100,230,255,',
    bg1: '#060e1a', bg2: '#040a14', bg3: '#020610',
  },
  magma: {
    top: (e) => [Math.round(160 + e * 95), Math.round(40 + e * 100), Math.round(10 + e * 50)],
    side: (e, d) => [
      Math.round((160 + e * 95) * d),
      Math.round((40 + e * 100) * d),
      Math.round((10 + e * 50) * d),
    ],
    stroke: 'rgba(255,160,80,',
    glow: 'rgba(255,120,40,',
    bg1: '#1a0808', bg2: '#120505', bg3: '#0a0303',
  },
  aurora: {
    top: (e) => [Math.round(20 + e * 100), Math.round(120 + e * 135), Math.round(100 + e * 155)],
    side: (e, d) => [
      Math.round((20 + e * 100) * d),
      Math.round((120 + e * 135) * d),
      Math.round((100 + e * 155) * d),
    ],
    stroke: 'rgba(80,220,200,',
    glow: 'rgba(60,200,180,',
    bg1: '#061a12', bg2: '#04120c', bg3: '#020a06',
  },
};

function srand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const COLS = 30;
const ROWS = 22;
const SQRT3 = Math.sqrt(3);

function hexPolygon(cx: number, cy: number, size: number, squash: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    pts.push([cx + size * Math.cos(a), cy + size * Math.sin(a) * squash]);
  }
  return pts;
}

export const HexagonalWave3D: React.FC<HexagonalWave3DProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'cyan',
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;
  const sc = hexSchemes[scheme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, sc.bg1);
    bg.addColorStop(0.5, sc.bg2);
    bg.addColorStop(1, sc.bg3);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const hexSize = Math.min(
      (width * 1.1) / (COLS * 1.7),
      (height * 1.2) / (ROWS * SQRT3 * 0.85)
    );
    const maxPillar = hexSize * 5;
    const squash = 0.55;
    const camX = Math.sin(t * 2) * 8;

    const spacingX = hexSize * 1.7;
    const spacingY = hexSize * SQRT3 * 0.85;
    const gridOffX = cx - (COLS - 1) * spacingX * 0.5;
    const gridOffY = -hexSize * 2;

    type HexData = {
      col: number; row: number;
      baseX: number; baseY: number;
      h: number; ph: number;
    };

    const hexes: HexData[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const offX = r % 2 === 1 ? spacingX * 0.5 : 0;
        const bx = gridOffX + c * spacingX + offX + camX;
        const by = gridOffY + r * spacingY;
        const idx = r * COLS + c;
        const ph = srand(idx) * Math.PI * 2;

        const w1 = Math.sin(c * 0.4 + t * 2 + ph) * 0.28;
        const w2 = Math.cos(r * 0.4 - t * 3 + ph * 0.5) * 0.22;
        const w3 = Math.sin((c + r) * 0.3 + t * 2 + ph * 0.3) * 0.15;
        const w4 = Math.cos((c - r) * 0.35 + t * 4) * 0.1;
        const dist = Math.sqrt(
          Math.pow((c / (COLS - 1) - 0.5) * 2, 2) +
          Math.pow((r / (ROWS - 1) - 0.5) * 2, 2)
        );
        const w5 = Math.sin(dist * 4 - t * 2) * 0.12;
        let h = 0.5 + w1 + w2 + w3 + w4 + w5;
        h = Math.max(0.05, Math.min(1, h));

        hexes.push({ col: c, row: r, baseX: bx, baseY: by, h, ph });
      }
    }

    hexes.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    for (const hex of hexes) {
      const { baseX, baseY, h, ph, row } = hex;
      if (baseX < -hexSize * 3 || baseX > width + hexSize * 3 || baseY < -maxPillar - hexSize * 3 || baseY > height + hexSize * 3) continue;

      const pillarH = h * maxPillar;
      const topY = baseY - pillarH;

      const topHex = hexPolygon(baseX, topY, hexSize, squash);
      const baseHex = hexPolygon(baseX, baseY, hexSize, squash);

      const e = h * h;
      const [topR, topG, topB] = sc.top(e);
      const pulse = 0.8 + Math.sin(t * 2 + ph) * 0.18;
      const topA = Math.min(1, 0.5 + h * 0.5) * pulse;

      const sideFace = (a: number, b: number, darken: number) => {
        const [sr, sg, sb] = sc.side(e, darken);
        ctx.beginPath();
        ctx.moveTo(topHex[a][0], topHex[a][1]);
        ctx.lineTo(topHex[b][0], topHex[b][1]);
        ctx.lineTo(baseHex[b][0], baseHex[b][1]);
        ctx.lineTo(baseHex[a][0], baseHex[a][1]);
        ctx.closePath();
        ctx.fillStyle = `rgba(${sr},${sg},${sb},${topA})`;
        ctx.fill();
        ctx.strokeStyle = `${sc.stroke}${0.08 + h * 0.06})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      };

      // Left side faces (darker)
      sideFace(4, 3, 0.28);
      sideFace(3, 2, 0.32);
      // Front face (medium)
      sideFace(2, 1, 0.45);
      // Right side faces (brighter)
      sideFace(1, 0, 0.5);
      sideFace(0, 5, 0.42);

      // Top face
      ctx.beginPath();
      ctx.moveTo(topHex[0][0], topHex[0][1]);
      for (let k = 1; k < 6; k++) ctx.lineTo(topHex[k][0], topHex[k][1]);
      ctx.closePath();
      ctx.fillStyle = `rgba(${topR},${topG},${topB},${Math.min(1, topA + 0.12)})`;
      ctx.fill();
      ctx.strokeStyle = `${sc.stroke}${0.25 + h * 0.15})`;
      ctx.lineWidth = Math.max(0.6, hexSize * 0.04);
      ctx.stroke();

      // Peak glow
      if (h > 0.78) {
        const glowR = hexSize * (1.5 + Math.sin(t * 2 + ph) * 0.3);
        const gg = ctx.createRadialGradient(baseX, topY, 0, baseX, topY, glowR);
        gg.addColorStop(0, `rgba(255,255,255,${0.45 * pulse})`);
        gg.addColorStop(0.35, `${sc.glow}${0.18 * pulse})`);
        gg.addColorStop(1, `${sc.glow}0)`);
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(baseX, topY, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(baseX, topY, Math.max(1, hexSize * 0.08), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.9 * pulse})`;
        ctx.fill();
      }
    }
  }, [frame, width, height, totalFrames, speed, t]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: '#020610' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};
