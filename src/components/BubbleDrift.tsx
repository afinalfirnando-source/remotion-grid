import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface BubbleDriftProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: BubbleScheme;
}

export type BubbleScheme = 'silver' | 'gold' | 'ocean' | 'rose' | 'emerald';

const PI2 = Math.PI * 2;

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

interface Bubble {
  bx: number;
  by: number;
  r: number;
  depth: number; // 0 = far/blurry, 1 = mid, 2 = near/sharp
  phase: number;
  phase2: number;
  floatAmp: number;
  floatSpeed: number;
  pulseSpeed: number;
  alpha: number;
}

const BUBBLE_COUNT = 90;
const bubbles: Bubble[] = [];
for (let i = 0; i < BUBBLE_COUNT; i++) {
  const depthRoll = seededRandom(i * 7);
  const depth = depthRoll < 0.3 ? 0 : depthRoll < 0.7 ? 1 : 2;
  const r = depth === 0
    ? 20 + seededRandom(i * 7 + 1) * 60
    : depth === 1
      ? 8 + seededRandom(i * 7 + 1) * 28
      : 2 + seededRandom(i * 7 + 1) * 12;
  bubbles.push({
    bx: seededRandom(i * 7 + 2),
    by: seededRandom(i * 7 + 3),
    r,
    depth,
    phase: seededRandom(i * 7 + 4) * PI2,
    phase2: seededRandom(i * 7 + 5) * PI2,
    floatAmp: 0.02 + seededRandom(i * 7 + 6) * 0.05,
    floatSpeed: 1 + Math.floor(seededRandom(i * 7 + 7) * 3),
    pulseSpeed: 1 + Math.floor(seededRandom(i * 7 + 8) * 2),
    alpha: depth === 0
      ? 0.08 + seededRandom(i * 7 + 9) * 0.1
      : depth === 1
        ? 0.2 + seededRandom(i * 7 + 9) * 0.25
        : 0.4 + seededRandom(i * 7 + 9) * 0.4,
  });
}

const schemes: Record<BubbleScheme, {
  bg0: string; bg1: string; bg2: string;
  tint: [number, number, number];
  body: [number, number, number];
  rim: [number, number, number];
  leak: string;
}> = {
  silver: {
    bg0: '#16181f', bg1: '#0a0b10', bg2: '#030304',
    tint: [180, 190, 210], body: [120, 130, 155], rim: [210, 220, 240],
    leak: 'rgba(220,225,235,0.10)',
  },
  gold: {
    bg0: '#1c1408', bg1: '#100c04', bg2: '#050302',
    tint: [220, 190, 130], body: [160, 120, 60], rim: [245, 220, 170],
    leak: 'rgba(240,210,150,0.10)',
  },
  ocean: {
    bg0: '#0a1620', bg1: '#060c14', bg2: '#020304',
    tint: [130, 200, 230], body: [60, 130, 170], rim: [170, 225, 250],
    leak: 'rgba(150,210,240,0.10)',
  },
  rose: {
    bg0: '#1c0e16', bg1: '#10060c', bg2: '#050203',
    tint: [230, 160, 190], body: [170, 90, 130], rim: [250, 200, 225],
    leak: 'rgba(240,180,210,0.10)',
  },
  emerald: {
    bg0: '#0a1a12', bg1: '#051008', bg2: '#020402',
    tint: [140, 220, 170], body: [60, 150, 100], rim: [180, 245, 200],
    leak: 'rgba(160,230,180,0.10)',
  },
};

function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alpha: number,
  sharp: number,
  pal: (typeof schemes)[BubbleScheme],
) {
  const [tr, tg, tb] = pal.tint;
  const [br, bg2, bb] = pal.body;
  const [rr, rg, rb] = pal.rim;
  // Outer soft glow
  const glowR = r * (sharp > 0.5 ? 1.6 : 2.2);
  const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, glowR);
  glow.addColorStop(0, `rgba(${tr},${tg},${tb},${alpha * 0.25})`);
  glow.addColorStop(1, `rgba(${tr},${tg},${tb},0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, PI2);
  ctx.fill();

  // Main body
  const body = ctx.createRadialGradient(
    x - r * 0.25, y - r * 0.3, r * 0.05,
    x, y, r,
  );
  if (sharp > 0.5) {
    body.addColorStop(0, `rgba(${rr},${rg},${rb},${alpha * 0.9})`);
    body.addColorStop(0.3, `rgba(${tr},${tg},${tb},${alpha * 0.55})`);
    body.addColorStop(0.7, `rgba(${br},${bg2},${bb},${alpha * 0.35})`);
    body.addColorStop(0.9, `rgba(${tr},${tg},${tb},${alpha * 0.5})`);
    body.addColorStop(1, `rgba(${rr},${rg},${rb},${alpha * 0.15})`);
  } else {
    body.addColorStop(0, `rgba(${tr},${tg},${tb},${alpha * 0.5})`);
    body.addColorStop(0.5, `rgba(${br},${bg2},${bb},${alpha * 0.3})`);
    body.addColorStop(1, `rgba(${br},${bg2},${bb},0)`);
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, PI2);
  ctx.fill();

  if (sharp > 0.5) {
    // Rim light — bottom edge brighter
    ctx.strokeStyle = `rgba(${rr},${rg},${rb},${alpha * 0.6})`;
    ctx.lineWidth = Math.max(0.6, r * 0.06);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.97, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    // Specular highlight — top-left
    const hx = x - r * 0.32;
    const hy = y - r * 0.36;
    const hr = r * 0.22;
    const hl = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
    hl.addColorStop(0, `rgba(255,255,255,${alpha * 0.95})`);
    hl.addColorStop(0.5, `rgba(240,245,255,${alpha * 0.4})`);
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, PI2);
    ctx.fill();

    // Small secondary sparkle
    const sx = x + r * 0.25;
    const sy = y + r * 0.3;
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.35})`;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(0.5, r * 0.05), 0, PI2);
    ctx.fill();
  }
}

const BubbleDrift: React.FC<BubbleDriftProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'silver',
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

    // Dark background with subtle vignette variation
    const bg = ctx.createRadialGradient(
      width * 0.5, height * 0.45, 0,
      width * 0.5, height * 0.45, width * 0.6,
    );
    bg.addColorStop(0, pal.bg0);
    bg.addColorStop(0.5, pal.bg1);
    bg.addColorStop(1, pal.bg2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Draw far → near
    for (let layer = 0; layer <= 2; layer++) {
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        if (b.depth !== layer) continue;

        // Floating position — sin/cos integer multipliers for seamless loop
        const fx = Math.sin(t * b.floatSpeed + b.phase) * b.floatAmp;
        const fy = Math.cos(t * b.floatSpeed + b.phase2) * b.floatAmp * 1.4;
        const x = (b.bx + fx) * width;
        const y = (b.by + fy) * height;

        // Gentle size pulse
        const pulse = 1 + Math.sin(t * b.pulseSpeed + b.phase) * 0.06;
        const r = b.r * (width / 960) * pulse;

        // Alpha shimmer
        const shimmer = 1 + Math.sin(t * 2 + b.phase2) * 0.12;
        const alpha = Math.min(1, b.alpha * shimmer);

        const sharp = layer === 2 ? 1 : layer === 1 ? 0.6 : 0;
        drawBubble(ctx, x, y, r, alpha, sharp, pal);
      }
    }

    // Top-left light leak like reference
    const leak = ctx.createRadialGradient(
      width * 0.02, height * 0.45, 0,
      width * 0.02, height * 0.45, width * 0.22,
    );
    leak.addColorStop(0, pal.leak);
    leak.addColorStop(1, 'rgba(220,225,235,0)');
    ctx.fillStyle = leak;
    ctx.fillRect(0, 0, width, height);

    // Corner vignette
    const vig = ctx.createRadialGradient(
      width * 0.5, height * 0.5, width * 0.2,
      width * 0.5, height * 0.5, width * 0.62,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.bg1 }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { BubbleDrift };
