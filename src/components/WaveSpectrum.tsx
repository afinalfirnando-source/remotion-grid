import React, { useRef, useEffect, useMemo } from 'react';
import { useCurrentFrame } from 'remotion';

interface WaveSpectrumProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
}

function seeded(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const NUM_PEAKS = 85;

const WaveSpectrum: React.FC<WaveSpectrumProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;

  const peaks = useMemo(() => {
    return Array.from({ length: NUM_PEAKS }, (_, i) => {
      const nx = (i / (NUM_PEAKS - 1)) * 2 - 1;
      const baseHeight = 0.12 + seeded(i * 5 + 1) * 0.55;
      const waveFreq = 2 + Math.floor(seeded(i * 5 + 2) * 4);
      const waveAmp = 0.1 + seeded(i * 5 + 3) * 0.25;
      const phase = seeded(i * 5 + 4) * Math.PI * 2;
      const innerFreq = 3 + Math.floor(seeded(i * 5 + 6) * 5);
      const innerAmp = 0.05 + seeded(i * 5 + 7) * 0.12;
      return { nx, baseHeight, waveFreq, waveAmp, phase, innerFreq, innerAmp };
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Background gradient — warm bottom
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#010005');
    bg.addColorStop(0.45, '#050010');
    bg.addColorStop(0.6, '#120015');
    bg.addColorStop(0.75, '#1a0010');
    bg.addColorStop(1, '#080005');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const lineY = height * 0.5;
    const maxH = height * 0.42;

    // Compute peak heights
    const pd: {
      x: number; h: number; r: number; g: number; b: number; baseW: number;
    }[] = [];

    for (const p of peaks) {
      const x = (p.nx * 0.47 + 0.5) * width;
      const w1 = Math.sin(t * p.waveFreq + p.phase) * p.waveAmp;
      const w2 = Math.sin(t * p.innerFreq + p.phase * 1.7) * p.innerAmp;
      const h = (p.baseHeight + w1 + w2) * maxH;

      const cm = (p.nx + 1) * 0.5;
      let r: number, g: number, b: number;
      if (cm < 0.25) {
        r = 255; g = 160 + cm * 300; b = 20;
      } else if (cm < 0.5) {
        r = 240; g = 60; b = 140 + (cm - 0.25) * 400;
      } else if (cm < 0.75) {
        r = 100 + (0.75 - cm) * 400; g = 60; b = 240 + (cm - 0.5) * 40;
      } else {
        r = 40; g = 100 + (1 - cm) * 100; b = 255;
      }

      pd.push({ x, h, r, g, b, baseW: width / NUM_PEAKS * 1.5 });
    }

    // Draw glossy reflection
    for (const p of pd) {
      const reflH = p.h * 0.65;
      const bw = p.baseW;

      // Reflection gradient
      const rg = ctx.createLinearGradient(p.x, lineY, p.x, lineY + reflH);
      rg.addColorStop(0, `rgba(${Math.round(p.r * 0.7)},${Math.round(p.g * 0.7)},${Math.round(p.b * 0.7)},0.6)`);
      rg.addColorStop(0.2, `rgba(${Math.round(p.r * 0.5)},${Math.round(p.g * 0.5)},${Math.round(p.b * 0.5)},0.45)`);
      rg.addColorStop(0.5, `rgba(${Math.round(p.r * 0.25)},${Math.round(p.g * 0.25)},${Math.round(p.b * 0.25)},0.2)`);
      rg.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.moveTo(p.x, lineY);
      ctx.bezierCurveTo(
        p.x - bw * 0.4, lineY + reflH * 0.3,
        p.x - bw * 0.2, lineY + reflH * 0.7,
        p.x, lineY + reflH
      );
      ctx.bezierCurveTo(
        p.x + bw * 0.2, lineY + reflH * 0.7,
        p.x + bw * 0.4, lineY + reflH * 0.3,
        p.x, lineY
      );
      ctx.closePath();
      ctx.fillStyle = rg;
      ctx.fill();
    }

    // Draw peaks
    for (const p of pd) {
      const bw = p.baseW;
      const tipW = bw * 0.08;

      // Ultra wide glow
      ctx.beginPath();
      ctx.moveTo(p.x, lineY);
      ctx.bezierCurveTo(
        p.x - bw * 1.3, lineY,
        p.x - bw * 0.8, lineY - p.h * 1.1,
        p.x, lineY - p.h * 1.12
      );
      ctx.bezierCurveTo(
        p.x + bw * 0.8, lineY - p.h * 1.1,
        p.x + bw * 1.3, lineY,
        p.x, lineY
      );
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},0.05)`;
      ctx.fill();

      // Wide glow
      ctx.beginPath();
      ctx.moveTo(p.x, lineY);
      ctx.bezierCurveTo(
        p.x - bw * 0.9, lineY,
        p.x - bw * 0.5, lineY - p.h * 1.06,
        p.x, lineY - p.h * 1.08
      );
      ctx.bezierCurveTo(
        p.x + bw * 0.5, lineY - p.h * 1.06,
        p.x + bw * 0.9, lineY,
        p.x, lineY
      );
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},0.1)`;
      ctx.fill();

      // Mid glow
      ctx.beginPath();
      ctx.moveTo(p.x, lineY);
      ctx.bezierCurveTo(
        p.x - bw * 0.6, lineY,
        p.x - bw * 0.3, lineY - p.h * 1.02,
        p.x, lineY - p.h * 1.04
      );
      ctx.bezierCurveTo(
        p.x + bw * 0.3, lineY - p.h * 1.02,
        p.x + bw * 0.6, lineY,
        p.x, lineY
      );
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},0.18)`;
      ctx.fill();

      // Peak body — smooth bezier
      const grad = ctx.createLinearGradient(p.x, lineY, p.x, lineY - p.h);
      grad.addColorStop(0, `rgba(${Math.round(p.r * 0.2)},${Math.round(p.g * 0.2)},${Math.round(p.b * 0.2)},0.9)`);
      grad.addColorStop(0.25, `rgba(${Math.round(p.r * 0.55)},${Math.round(p.g * 0.55)},${Math.round(p.b * 0.55)},0.95)`);
      grad.addColorStop(0.6, `rgba(${p.r},${p.g},${p.b},1)`);
      grad.addColorStop(0.85, `rgba(${Math.min(255, p.r + 50)},${Math.min(255, p.g + 50)},${Math.min(255, p.b + 50)},1)`);
      grad.addColorStop(1, `rgba(255,255,255,0.9)`);

      ctx.beginPath();
      ctx.moveTo(p.x, lineY);
      ctx.bezierCurveTo(
        p.x - bw * 0.5, lineY,
        p.x - tipW * 2, lineY - p.h * 0.7,
        p.x, lineY - p.h
      );
      ctx.bezierCurveTo(
        p.x + tipW * 2, lineY - p.h * 0.7,
        p.x + bw * 0.5, lineY,
        p.x, lineY
      );
      ctx.fillStyle = grad;
      ctx.fill();

      // Tip glow
      ctx.beginPath();
      ctx.arc(p.x, lineY - p.h, bw * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},0.4)`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, lineY - p.h, bw * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,0.85)`;
      ctx.fill();
    }

  }, [frame, width, height, totalFrames, speed, t, peaks]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: '#010005' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { WaveSpectrum };
