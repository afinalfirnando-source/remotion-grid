import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface FlowLinesProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
}

const PI2 = Math.PI * 2;

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const LINES = 90;

interface Ribbon {
  offset: number; // vertical offset from center path
  spread: number; // how much this line deviates
  hue: number;
  sat: number;
  lit: number;
  alpha: number;
  width: number;
  phase: number;
}

const ribbons: Ribbon[] = [];
for (let i = 0; i < LINES; i++) {
  const frac = i / LINES;
  // Distribute lines in a tight band with gaussian-ish falloff
  const offset = (frac - 0.5) * 0.30;
  const huePick = seededRandom(i * 17);
  // Color by horizontal tendency: gold center-left, white, pink right
  const hue = huePick < 0.5 ? 30 + seededRandom(i * 17 + 1) * 14
    : huePick < 0.72 ? 42 + seededRandom(i * 17 + 1) * 10
    : huePick < 0.88 ? 15 + seededRandom(i * 17 + 1) * 12
    : 320 + seededRandom(i * 17 + 1) * 20;
  ribbons.push({
    offset,
    spread: 0.004 + seededRandom(i * 17 + 2) * 0.010,
    hue,
    sat: 80 + seededRandom(i * 17 + 3) * 20,
    lit: 52 + seededRandom(i * 17 + 4) * 22,
    alpha: 0.22 + seededRandom(i * 17 + 5) * 0.35,
    width: 1 + seededRandom(i * 17 + 6) * 2.5,
    phase: seededRandom(i * 17 + 7) * PI2,
  });
}

// Shared flow field — ALL lines follow this same shape (parallel ribbons)
// Integer multipliers only for seamless loop
function flowY(fx: number, t: number): number {
  return (
    Math.sin(fx * PI2 * 2 + t * 2) * 0.055
    + Math.sin(fx * PI2 * 3 - t * 3 + 1.3) * 0.035
    + Math.sin(fx * PI2 * 5 + t * 1 + 2.6) * 0.018
    + Math.sin(fx * PI2 * 1 - t * 1 + 0.7) * 0.03
  );
}

const FlowLines: React.FC<FlowLinesProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * PI2 * speed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark background with subtle blue center glow
    const bg = ctx.createRadialGradient(
      width * 0.5, height * 0.5, 0,
      width * 0.5, height * 0.5, width * 0.55,
    );
    bg.addColorStop(0, '#0a1430');
    bg.addColorStop(0.5, '#050a1c');
    bg.addColorStop(1, '#010204');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    const steps = 160;
    const centerY = 0.5;

    for (let li = 0; li < ribbons.length; li++) {
      const R = ribbons[li];
      const pts: { x: number; y: number }[] = [];
      for (let s = 0; s <= steps; s++) {
        const fx = s / steps;
        // Shared flow + tiny per-line wobble (also loops)
        const wobble = Math.sin(fx * PI2 * 7 + R.phase + t * 2) * R.spread;
        const y = centerY + R.offset * 0.9 + flowY(fx, t) + wobble;
        pts.push({ x: fx * width, y: y * height });
      }
      const strokePath = () => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let s = 1; s < pts.length; s++) ctx.lineTo(pts[s].x, pts[s].y);
        ctx.stroke();
      };
      // Wide glow
      ctx.strokeStyle = `hsla(${R.hue},${R.sat}%,${R.lit}%,${R.alpha * 0.20})`;
      ctx.lineWidth = R.width * 5;
      strokePath();
      // Mid glow
      ctx.strokeStyle = `hsla(${R.hue},${R.sat}%,${R.lit}%,${R.alpha * 0.5})`;
      ctx.lineWidth = R.width * 2.2;
      strokePath();
      // Core
      ctx.strokeStyle = `hsla(${R.hue},${Math.min(100, R.sat + 5)}%,${Math.min(84, R.lit + 12)}%,${R.alpha})`;
      ctx.lineWidth = R.width;
      strokePath();
    }

    ctx.globalCompositeOperation = 'source-over';

    // Soft blur pass — downscale then upscale for silk smoothness
    const blurC = document.createElement('canvas');
    blurC.width = Math.floor(width * 0.55);
    blurC.height = Math.floor(height * 0.55);
    const bctx = blurC.getContext('2d');
    if (bctx) {
      bctx.imageSmoothingEnabled = true;
      bctx.drawImage(canvas, 0, 0, blurC.width, blurC.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.globalAlpha = 0.55;
      ctx.drawImage(blurC, 0, 0, width, height);
      ctx.globalAlpha = 1;
    }

    // Lighting — warm glow traveling along the band (loops with t)
    ctx.globalCompositeOperation = 'screen';
    const lx = width * (0.5 + Math.sin(t) * 0.18);
    const ly = height * (0.5 + Math.cos(t * 2) * 0.05);
    const light = ctx.createRadialGradient(lx, ly, 0, lx, ly, width * 0.28);
    light.addColorStop(0, 'rgba(255,190,110,0.16)');
    light.addColorStop(0.5, 'rgba(255,150,80,0.06)');
    light.addColorStop(1, 'rgba(255,150,80,0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, width, height);

    // Cool rim light from right
    const rx = width * (0.8 + Math.cos(t) * 0.06);
    const rim = ctx.createRadialGradient(rx, height * 0.5, 0, rx, height * 0.5, width * 0.2);
    rim.addColorStop(0, 'rgba(255,120,180,0.10)');
    rim.addColorStop(1, 'rgba(255,120,180,0)');
    ctx.fillStyle = rim;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';

    // Contrast — deepen shadows with vignette
    const vig = ctx.createRadialGradient(
      width * 0.5, height * 0.5, width * 0.15,
      width * 0.5, height * 0.5, width * 0.6,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(0.6, 'rgba(0,0,8,0.25)');
    vig.addColorStop(1, 'rgba(0,0,5,0.65)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: '#050a1c' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { FlowLines };
