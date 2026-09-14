import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type HypnoSpiralScheme = 'classic' | 'neon' | 'sunset';

interface HypnoSpiralProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: HypnoSpiralScheme;
}

const schemes: Record<HypnoSpiralScheme, {
  colorA: [number, number, number];
  colorB: [number, number, number];
  bg: string;
}> = {
  classic: {
    colorA: [255, 255, 255],
    colorB: [15, 15, 15],
    bg: '#000000',
  },
  neon: {
    colorA: [0, 255, 240],
    colorB: [130, 0, 220],
    bg: '#050510',
  },
  sunset: {
    colorA: [255, 160, 50],
    colorB: [160, 30, 160],
    bg: '#0a0505',
  },
};

const HypnoSpiral: React.FC<HypnoSpiralProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'classic',
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
    ctx.fillStyle = sc.bg;
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    // Full screen — use diagonal for complete coverage
    const maxR = Math.sqrt(width * width + height * height) / 2 + 20;

    const NUM_RINGS = 80;
    const STRIPE_COUNT = 12;
    const TOTAL_TWIST = 6;

    const globalSpin = t * 2;

    for (let ring = NUM_RINGS; ring >= 0; ring--) {
      const ringNorm = ring / NUM_RINGS;
      const ringR = ringNorm * maxR;
      const thickness = maxR / NUM_RINGS * 1.15;
      const twistAngle = (1 - ringNorm) * TOTAL_TWIST * Math.PI * 2 + globalSpin;

      const segments = 200;
      for (let s = 0; s < segments; s++) {
        const a1 = (s / segments) * Math.PI * 2;
        const a2 = ((s + 1) / segments) * Math.PI * 2;
        const a1t = a1 + twistAngle;

        const stripeVal = Math.sin(a1t * STRIPE_COUNT);
        const blend = (stripeVal + 1) / 2;
        const depthFade = 0.25 + ringNorm * 0.75;

        const r = Math.round((sc.colorA[0] * blend + sc.colorB[0] * (1 - blend)) * depthFade);
        const g = Math.round((sc.colorA[1] * blend + sc.colorB[1] * (1 - blend)) * depthFade);
        const b = Math.round((sc.colorA[2] * blend + sc.colorB[2] * (1 - blend)) * depthFade);

        ctx.beginPath();
        ctx.arc(cx, cy, ringR + thickness / 2, a1, a2);
        ctx.arc(cx, cy, Math.max(0, ringR - thickness / 2), a2, a1, true);
        ctx.closePath();
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fill();
      }
    }

    // Center hole
    const holeR = maxR * 0.03;
    const holeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, holeR * 4);
    holeGrad.addColorStop(0, sc.bg);
    holeGrad.addColorStop(0.6, sc.bg);
    holeGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = holeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, holeR * 4, 0, Math.PI * 2);
    ctx.fill();
  }, [frame, width, height, totalFrames, speed, t, sc]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: sc.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { HypnoSpiral };
