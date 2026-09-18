import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface BokehGlowProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: BokehScheme;
}

export type BokehScheme = 'aqua' | 'violet' | 'rose' | 'gold' | 'emerald';

const PI2 = Math.PI * 2;

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

interface Dot {
  bx: number;
  by: number;
  r: number;
  layer: number;
  phase: number;
  phase2: number;
  amp: number;
  spd: number;
  alpha: number;
}

const COUNT = 280;
const dots: Dot[] = [];
for (let i = 0; i < COUNT; i++) {
  const roll = seededRandom(i * 11);
  const layer = roll < 0.45 ? 0 : roll < 0.78 ? 1 : 2;
  const r = layer === 0
    ? 1 + seededRandom(i * 11 + 1) * 3.5
    : layer === 1
      ? 5 + seededRandom(i * 11 + 1) * 20
      : 22 + seededRandom(i * 11 + 1) * 45;
  dots.push({
    bx: seededRandom(i * 11 + 2),
    by: seededRandom(i * 11 + 3),
    r,
    layer,
    phase: seededRandom(i * 11 + 4) * PI2,
    phase2: seededRandom(i * 11 + 5) * PI2,
    amp: 0.015 + seededRandom(i * 11 + 6) * 0.045,
    spd: 1 + Math.floor(seededRandom(i * 11 + 7) * 3),
    alpha: layer === 0
      ? 0.5 + seededRandom(i * 11 + 8) * 0.5
      : layer === 1
        ? 0.4 + seededRandom(i * 11 + 8) * 0.5
        : 0.25 + seededRandom(i * 11 + 8) * 0.35,
  });
}

const schemes: Record<BokehScheme, {
  bg: [string, string, string, string];
  light: [number, number, number];
  mid: [number, number, number];
  deep: [number, number, number];
  bright: [number, number, number];
  topGlow: string;
  brGlow: string;
  botGlow: string;
  div: string;
}> = {
  aqua: {
    bg: ['#4a9cba', '#2a7a9c', '#155084', '#0d3868'],
    light: [190, 245, 255], mid: [140, 225, 240], deep: [100, 190, 215], bright: [225, 252, 255],
    topGlow: 'rgba(180,245,255,0.20)', brGlow: 'rgba(180,250,255,0.30)', botGlow: 'rgba(170,245,255,0.30)',
    div: '#1a5a80',
  },
  violet: {
    bg: ['#7a5aae', '#5c3f94', '#3a2568', '#241544'],
    light: [225, 200, 255], mid: [190, 150, 240], deep: [150, 110, 210], bright: [245, 235, 255],
    topGlow: 'rgba(215,190,255,0.20)', brGlow: 'rgba(220,190,255,0.30)', botGlow: 'rgba(215,190,255,0.30)',
    div: '#4a3570',
  },
  rose: {
    bg: ['#b0688c', '#94506e', '#683050', '#482036'],
    light: [255, 210, 225], mid: [240, 170, 200], deep: [215, 130, 170], bright: [255, 240, 248],
    topGlow: 'rgba(255,205,225,0.20)', brGlow: 'rgba(255,205,225,0.30)', botGlow: 'rgba(255,205,225,0.30)',
    div: '#703a54',
  },
  gold: {
    bg: ['#b0924e', '#8e743a', '#624e22', '#423412'],
    light: [255, 235, 190], mid: [245, 210, 150], deep: [220, 180, 110], bright: [255, 250, 235],
    topGlow: 'rgba(255,230,180,0.20)', brGlow: 'rgba(255,235,190,0.30)', botGlow: 'rgba(255,235,190,0.30)',
    div: '#6e5a30',
  },
  emerald: {
    bg: ['#4e9c6e', '#357a52', '#205c38', '#123e24'],
    light: [200, 250, 215], mid: [160, 230, 180], deep: [115, 200, 140], bright: [235, 255, 240],
    topGlow: 'rgba(190,250,205,0.20)', brGlow: 'rgba(190,250,205,0.30)', botGlow: 'rgba(190,250,205,0.30)',
    div: '#2e5c40',
  },
};

function drawGlowDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alpha: number,
  layer: number,
  pal: (typeof schemes)[BokehScheme],
) {
  const [lr, lg, lb] = pal.light;
  const [mr, mg, mb] = pal.mid;
  const [dr, dg, db] = pal.deep;
  const [br, bg2, bb] = pal.bright;
  if (layer === 0) {
    const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 3.5);
    halo.addColorStop(0, `rgba(${lr},${lg},${lb},${alpha * 0.6})`);
    halo.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.5, 0, PI2);
    ctx.fill();

    ctx.fillStyle = `rgba(${br},${bg2},${bb},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, PI2);
    ctx.fill();
  } else if (layer === 1) {
    // Outer halo
    const halo = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2);
    halo.addColorStop(0, `rgba(${mr},${mg},${mb},${alpha * 0.3})`);
    halo.addColorStop(1, `rgba(${mr},${mg},${mb},0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, PI2);
    ctx.fill();

    // Bokeh body with ring
    const body = ctx.createRadialGradient(x, y, 0, x, y, r);
    body.addColorStop(0, `rgba(${br},${bg2},${bb},${alpha * 0.95})`);
    body.addColorStop(0.3, `rgba(${lr},${lg},${lb},${alpha * 0.65})`);
    body.addColorStop(0.62, `rgba(${mr},${mg},${mb},${alpha * 0.4})`);
    body.addColorStop(0.82, `rgba(${lr},${lg},${lb},${alpha * 0.55})`);
    body.addColorStop(0.95, `rgba(${lr},${lg},${lb},${alpha * 0.5})`);
    body.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, PI2);
    ctx.fill();

    // Inner ring
    ctx.strokeStyle = `rgba(${br},${bg2},${bb},${alpha * 0.4})`;
    ctx.lineWidth = Math.max(0.6, r * 0.06);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.68, 0, PI2);
    ctx.stroke();
  } else {
    // Large soft bokeh
    const soft = ctx.createRadialGradient(x, y, 0, x, y, r);
    soft.addColorStop(0, `rgba(${lr},${lg},${lb},${alpha * 0.7})`);
    soft.addColorStop(0.35, `rgba(${mr},${mg},${mb},${alpha * 0.45})`);
    soft.addColorStop(0.7, `rgba(${dr},${dg},${db},${alpha * 0.2})`);
    soft.addColorStop(1, `rgba(${dr},${dg},${db},0)`);
    ctx.fillStyle = soft;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, PI2);
    ctx.fill();

    const core = ctx.createRadialGradient(x, y, 0, x, y, r * 0.4);
    core.addColorStop(0, `rgba(${br},${bg2},${bb},${alpha * 0.85})`);
    core.addColorStop(1, `rgba(${br},${bg2},${bb},0)`);
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.4, 0, PI2);
    ctx.fill();
  }
}

const BokehGlow: React.FC<BokehGlowProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'aqua',
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * PI2 * speed;
  const pal = schemes[scheme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Bright luminous teal background like reference
    // — bright top, deep bottom-left, glowing bottom-right
    const bg = ctx.createLinearGradient(0, 0, width * 0.6, height);
    bg.addColorStop(0, pal.bg[0]);
    bg.addColorStop(0.35, pal.bg[1]);
    bg.addColorStop(0.7, pal.bg[2]);
    bg.addColorStop(1, pal.bg[3]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Top glow — bright wash like reference top
    const top = ctx.createLinearGradient(0, 0, 0, height * 0.4);
    top.addColorStop(0, pal.topGlow);
    top.addColorStop(1, 'rgba(180,245,255,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, width, height * 0.4);

    // Bottom-right glow — strong like reference
    const brGlow = ctx.createRadialGradient(
      width * 0.85, height * 0.95, 0,
      width * 0.85, height * 0.95, width * 0.45,
    );
    brGlow.addColorStop(0, pal.brGlow);
    brGlow.addColorStop(0.5, pal.brGlow.replace(/[\d.]+\)$/, '0.12)'));
    brGlow.addColorStop(1, pal.brGlow.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = brGlow;
    ctx.fillRect(0, 0, width, height);

    // Bottom glow — bright light source like reference
    const bottom = ctx.createLinearGradient(0, height * 0.5, 0, height);
    bottom.addColorStop(0, pal.botGlow.replace(/[\d.]+\)$/, '0)'));
    bottom.addColorStop(1, pal.botGlow);
    ctx.fillStyle = bottom;
    ctx.fillRect(0, height * 0.5, width, height * 0.5);

    // Draw back → front
    for (let layer = 2; layer >= 0; layer--) {
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        if (d.layer !== layer) continue;

        const fx = Math.sin(t * d.spd + d.phase) * d.amp;
        const fy = Math.cos(t * d.spd + d.phase2) * d.amp * 1.3;
        const x = (d.bx + fx) * width;
        const y = (d.by + fy) * height;

        const twinkle = 1 + Math.sin(t * 2 + d.phase) * 0.18;
        const r = d.r * (width / 960) * (1 + Math.sin(t * d.spd + d.phase2) * 0.08);
        const alpha = Math.min(1, d.alpha * twinkle);

        drawGlowDot(ctx, x, y, r, alpha, layer, pal);
      }
    }

    // Light vignette (keep bright)
    const vig = ctx.createRadialGradient(
      width * 0.5, height * 0.5, width * 0.3,
      width * 0.5, height * 0.5, width * 0.65,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,20,0.28)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.div }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { BokehGlow };
