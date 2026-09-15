import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type RetroWavesScheme = 'classic' | 'candy' | 'miami';

interface RetroWavesProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: RetroWavesScheme;
}

const palettes: Record<RetroWavesScheme, {
  ribbons: [number, number, number][];
  bg1: string; bg2: string;
  edgeHi: string;
}> = {
  classic: {
    ribbons: [
      [180, 90, 40], [200, 120, 50], [160, 80, 60], [140, 100, 70],
      [190, 110, 45], [150, 75, 55], [170, 95, 55], [130, 85, 65],
    ],
    bg1: '#1a0e08', bg2: '#0a0604',
    edgeHi: 'rgba(255,220,180,0.25)',
  },
  candy: {
    ribbons: [
      [230, 90, 110], [245, 160, 60], [250, 210, 80], [110, 190, 140],
      [80, 170, 210], [150, 110, 210], [235, 130, 70], [90, 200, 170],
    ],
    bg1: '#1c0e12', bg2: '#0c0508',
    edgeHi: 'rgba(255,230,240,0.3)',
  },
  miami: {
    ribbons: [
      [0, 200, 200], [255, 90, 170], [120, 90, 255], [255, 200, 60],
      [60, 220, 160], [255, 130, 90], [90, 140, 255], [255, 170, 200],
    ],
    bg1: '#081226', bg2: '#04060f',
    edgeHi: 'rgba(200,240,255,0.3)',
  },
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const NUM_RIBBONS = 28;
const SEGMENTS = 200;

const RetroWaves: React.FC<RetroWavesProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'classic',
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;
  const pal = palettes[scheme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Retro background — warm dark
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, pal.bg1);
    bg.addColorStop(0.5, pal.bg1);
    bg.addColorStop(1, pal.bg2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Retro color palette — ribbons alternate
    const retroColors = pal.ribbons;

    const ribbonSpacing = height / (NUM_RIBBONS - 1);

    // Draw each ribbon (back to front)
    for (let ri = 0; ri < NUM_RIBBONS; ri++) {
      const baseY = ri * ribbonSpacing;
      const colorIdx = ri % retroColors.length;
      const baseCol = retroColors[colorIdx];

      // Ribbon thickness
      const thickness = ribbonSpacing * 0.8;

      // Build ribbon points
      type Point = { x: number; y: number };
      const topPoints: Point[] = [];
      const botPoints: Point[] = [];

      for (let s = 0; s <= SEGMENTS; s++) {
        const sx = (s / SEGMENTS) * width;
        const nx = (s / SEGMENTS) * 2 - 1; // -1..1

        // Wave functions — ALL integer multipliers
        const wave1 = Math.sin(nx * 3 + ri * 0.3 + t * 2) * 25;
        const wave2 = Math.cos(nx * 2 - ri * 0.2 + t * 3) * 18;
        const wave3 = Math.sin(nx * 5 + t * 4) * 10;
        const wave4 = Math.cos(ri * 0.4 + t * 2) * 12;

        const yOffset = wave1 + wave2 + wave3 + wave4;

        // Ribbon wave also varies thickness
        const thickVar = thickness * (0.85 + Math.sin(nx * 4 + ri * 0.5 + t * 2) * 0.15);

        topPoints.push({ x: sx, y: baseY + yOffset - thickVar / 2 });
        botPoints.push({ x: sx, y: baseY + yOffset + thickVar / 2 });
      }

      // Draw ribbon as filled shape with 3D shading
      // Bottom shadow (darker)
      ctx.beginPath();
      ctx.moveTo(topPoints[0].x, topPoints[0].y + 3);
      for (let k = 1; k < topPoints.length; k++) {
        ctx.lineTo(topPoints[k].x, topPoints[k].y + 3);
      }
      for (let k = botPoints.length - 1; k >= 0; k--) {
        ctx.lineTo(botPoints[k].x, botPoints[k].y + 3);
      }
      ctx.closePath();
      ctx.fillStyle = `rgb(${Math.round(baseCol[0] * 0.2)},${Math.round(baseCol[1] * 0.2)},${Math.round(baseCol[2] * 0.2)})`;
      ctx.fill();

      // Main ribbon body
      ctx.beginPath();
      ctx.moveTo(topPoints[0].x, topPoints[0].y);
      for (let k = 1; k < topPoints.length; k++) {
        ctx.lineTo(topPoints[k].x, topPoints[k].y);
      }
      for (let k = botPoints.length - 1; k >= 0; k--) {
        ctx.lineTo(botPoints[k].x, botPoints[k].y);
      }
      ctx.closePath();

      // Ribbon gradient — top highlight, middle base, bottom shadow
      const grad = ctx.createLinearGradient(0, baseY - thickness, 0, baseY + thickness);
      grad.addColorStop(0, `rgb(${Math.round(baseCol[0] * 1.2)},${Math.round(baseCol[1] * 1.2)},${Math.round(baseCol[2] * 1.2)})`);
      grad.addColorStop(0.3, `rgb(${baseCol[0]},${baseCol[1]},${baseCol[2]})`);
      grad.addColorStop(0.7, `rgb(${Math.round(baseCol[0] * 0.7)},${Math.round(baseCol[1] * 0.7)},${Math.round(baseCol[2] * 0.7)})`);
      grad.addColorStop(1, `rgb(${Math.round(baseCol[0] * 0.4)},${Math.round(baseCol[1] * 0.4)},${Math.round(baseCol[2] * 0.4)})`);
      ctx.fillStyle = grad;
      ctx.fill();

      // Top edge highlight
      ctx.beginPath();
      ctx.moveTo(topPoints[0].x, topPoints[0].y);
      for (let k = 1; k < topPoints.length; k++) {
        ctx.lineTo(topPoints[k].x, topPoints[k].y);
      }
      ctx.strokeStyle = pal.edgeHi;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Bottom edge shadow line
      ctx.beginPath();
      ctx.moveTo(botPoints[0].x, botPoints[0].y);
      for (let k = 1; k < botPoints.length; k++) {
        ctx.lineTo(botPoints[k].x, botPoints[k].y);
      }
      ctx.strokeStyle = `rgba(0,0,0,0.3)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [frame, width, height, totalFrames, speed, t, pal]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.bg2 }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export default RetroWaves;
