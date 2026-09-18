import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface PlushFurProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: FurScheme;
}

export type FurScheme = 'pink' | 'cream' | 'lavender' | 'mint' | 'sky';

const PI2 = Math.PI * 2;

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

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

interface Strand {
  bx: number;
  by: number;
  len: number;
  shade: number;
  phase: number;
  layer: number; // 0 undercoat, 1 mid, 2 highlight
}

const STRANDS = 22000;
const strands: Strand[] = [];
for (let i = 0; i < STRANDS; i++) {
  const roll = seededRandom(i * 7);
  const layer = roll < 0.35 ? 0 : roll < 0.8 ? 1 : 2;
  strands.push({
    bx: seededRandom(i * 7 + 1),
    by: seededRandom(i * 7 + 2),
    len: layer === 0 ? 0.016 + seededRandom(i * 7 + 3) * 0.022
      : layer === 1 ? 0.010 + seededRandom(i * 7 + 3) * 0.016
      : 0.006 + seededRandom(i * 7 + 3) * 0.010,
    shade: seededRandom(i * 7 + 4),
    phase: seededRandom(i * 7 + 5) * PI2,
    layer,
  });
}

const schemes: Record<FurScheme, {
  base: string; div: string;
  under: [number, number, number];
  mid: [number, number, number];
  hi: [number, number, number];
  sheen: string;
}> = {
  pink: {
    base: '#e78bb0', div: '#e78bb0',
    under: [150, 62, 100], mid: [218, 118, 160], hi: [240, 178, 202],
    sheen: 'rgba(255,215,228,0.14)',
  },
  cream: {
    base: '#e8cfa8', div: '#e8cfa8',
    under: [158, 118, 72], mid: [224, 186, 138], hi: [246, 228, 196],
    sheen: 'rgba(255,240,215,0.14)',
  },
  lavender: {
    base: '#b79ce0', div: '#b79ce0',
    under: [110, 82, 150], mid: [168, 140, 210], hi: [216, 196, 240],
    sheen: 'rgba(225,210,250,0.14)',
  },
  mint: {
    base: '#93d3ae', div: '#93d3ae',
    under: [66, 130, 94], mid: [132, 198, 152], hi: [198, 238, 210],
    sheen: 'rgba(210,250,225,0.14)',
  },
  sky: {
    base: '#8fbde6', div: '#8fbde6',
    under: [62, 108, 152], mid: [128, 178, 218], hi: [196, 226, 246],
    sheen: 'rgba(210,235,255,0.14)',
  },
};

const PlushFur: React.FC<PlushFurProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'pink',
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

    // Base coat
    octx.fillStyle = pal.base;
    octx.fillRect(0, 0, sw, sh);

    // Slow-drifting vortex centers (all sin/cos integer → loop)
    const v1x = 0.32 + Math.sin(t) * 0.06;
    const v1y = 0.42 + Math.cos(t) * 0.06;
    const v2x = 0.68 + Math.cos(t) * 0.06;
    const v2y = 0.58 + Math.sin(t * 2) * 0.05;
    const driftX = Math.sin(t) * 0.3;
    const driftY = Math.cos(t) * 0.3;
    // Traveling light wave sweeping across (loops)
    const waveX = 0.5 + Math.sin(t) * 0.35;

    octx.lineCap = 'round';

    // Draw back layer → front
    for (let layer = 0; layer <= 2; layer++) {
      for (let i = 0; i < strands.length; i++) {
        const s = strands[i];
        if (s.layer !== layer) continue;

        const nx = s.bx;
        const ny = s.by;
        const x = nx * sw;
        const y = ny * sh;

        // Flow direction: warped noise + swirl around vortices
        // Bigger time swing so motion is clearly visible
        const n = fbm(nx * 3 + driftX, ny * 3 + driftY, 3);
        const a1 = Math.atan2(ny - v1y, nx - v1x) + Math.PI / 2.3;
        const a2 = Math.atan2(ny - v2y, nx - v2x) - Math.PI / 2.6;
        const ang = n * 2.4 + a1 * 0.5 + a2 * 0.45 + Math.sin(t * 2 + s.phase) * 0.35;

        // Strand length breathes
        const breathe = 1 + Math.sin(t * 2 + s.phase) * 0.22;
        const L = s.len * Math.min(sw, sh) * breathe * 2.2;
        const dx = Math.cos(ang) * L;
        const dy = Math.sin(ang) * L;

        // Large soft clumps: bright tufts + deep valleys
        const clump = fbm(nx * 2.2 + driftX * 0.7, ny * 2.2 + driftY * 0.7, 3);
        // Traveling brightness wave
        const travel = Math.sin(nx * 4 - t * 2 + s.phase * 0.2) * 0.5 + 0.5;
        const light = clump * 0.6 + (travel - 0.5) * 0.5 + (s.shade - 0.5) * 0.5;

        // Shades per layer with strong contrast
        let r: number, g: number, b: number;
        if (layer === 0) {
          r = pal.under[0] + light * 60 + s.shade * 20;
          g = pal.under[1] + light * 55 + s.shade * 18;
          b = pal.under[2] + light * 55 + s.shade * 18;
        } else if (layer === 1) {
          r = pal.mid[0] + light * 34;
          g = pal.mid[1] + light * 70;
          b = pal.mid[2] + light * 62;
        } else {
          r = pal.hi[0] + light * 15;
          g = pal.hi[1] + light * 66;
          b = pal.hi[2] + light * 50;
        }

        octx.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},${layer === 0 ? 0.6 : layer === 1 ? 0.75 : 0.9})`;
        octx.lineWidth = layer === 0 ? 2.4 : layer === 1 ? 1.8 : 1.3;
        octx.beginPath();
        octx.moveTo(x, y);
        octx.quadraticCurveTo(
          x + dx * 0.5, y + dy * 0.5 + Math.sin(ang) * 2,
          x + dx, y + dy,
        );
        octx.stroke();
      }
    }

    // Copy upscaled with smoothing = soft plush feel
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, width, height);

    // Soft sheen light sweeping clearly across (loops)
    ctx.globalCompositeOperation = 'screen';
    const sheenX = width * (0.5 + Math.sin(t) * 0.3);
    const sheen = ctx.createRadialGradient(sheenX, height * 0.35, 0, sheenX, height * 0.35, width * 0.45);
    sheen.addColorStop(0, pal.sheen);
    sheen.addColorStop(1, pal.sheen.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.div }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { PlushFur };
