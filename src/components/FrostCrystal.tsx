import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type FrostScheme = 'arctic' | 'aurora' | 'ember' | 'void' | 'emerald';

interface FrostCrystalProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: FrostScheme;
}

const PI2 = Math.PI * 2;

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

function warpedNoise(x: number, y: number, t: number): number {
  const qx = fbm(x, y, 3);
  const qy = fbm(x + 5.2, y + 1.3, 3);
  const rx = fbm(x + 4 * qx + 1.7 + t, y + 4 * qy + 9.2, 3);
  const ry = fbm(x + 4 * rx + 8.3 + t, y + 4 * qx + 2.8, 3);
  return fbm(x + 4 * rx, y + 4 * ry, 4);
}

const schemes: Record<FrostScheme, {
  bg: string;
  base: [number, number, number];
  baseVar: [number, number, number];
  veinColor: [number, number, number];
  veinPulse: [number, number, number];
  highlight: [number, number, number];
  glow: string;
  vignette: string;
}> = {
  arctic: {
    bg: '#060c1a',
    base: [10, 18, 40], baseVar: [20, 30, 40],
    veinColor: [60, 120, 200], veinPulse: [15, 30, 50],
    highlight: [100, 120, 80], glow: 'rgba(150,200,255,0.08)',
    vignette: 'rgba(5,10,25,0.6)',
  },
  aurora: {
    bg: '#050a12',
    base: [8, 15, 25], baseVar: [10, 20, 15],
    veinColor: [30, 180, 120], veinPulse: [10, 40, 25],
    highlight: [80, 100, 60], glow: 'rgba(80,220,160,0.08)',
    vignette: 'rgba(5,12,10,0.6)',
  },
  ember: {
    bg: '#120808',
    base: [30, 12, 10], baseVar: [20, 10, 8],
    veinColor: [200, 80, 30], veinPulse: [50, 20, 10],
    highlight: [100, 60, 30], glow: 'rgba(255,140,60,0.08)',
    vignette: 'rgba(15,5,5,0.6)',
  },
  void: {
    bg: '#0a0514',
    base: [15, 8, 30], baseVar: [15, 10, 25],
    veinColor: [120, 50, 200], veinPulse: [30, 15, 50],
    highlight: [80, 50, 60], glow: 'rgba(180,100,255,0.08)',
    vignette: 'rgba(10,5,18,0.6)',
  },
  emerald: {
    bg: '#05120a',
    base: [8, 25, 15], baseVar: [8, 20, 12],
    veinColor: [40, 200, 100], veinPulse: [12, 50, 25],
    highlight: [60, 100, 50], glow: 'rgba(80,240,140,0.08)',
    vignette: 'rgba(5,15,8,0.6)',
  },
};

const FrostCrystal: React.FC<FrostCrystalProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'arctic',
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

    const imgData = octx.createImageData(sw, sh);
    const d = imgData.data;

    for (let py = 0; py < sh; py++) {
      for (let px = 0; px < sw; px++) {
        const idx = (py * sw + px) * 4;
        const nx = px / sw;
        const ny = py / sh;

        const base = fbm(nx * 5 + 50, ny * 5 + 80, 4) * 0.12;

        const flowX = nx + Math.sin(t) * 0.12;
        const flowY = ny + Math.cos(t) * 0.08;

        const vein1 = warpedNoise(flowX * 3, flowY * 3, t);
        const vein2 = warpedNoise(flowX * 5 + 20, flowY * 5 + 20, t);
        const vein3 = warpedNoise(flowX * 2 + 40, flowY * 2, t);

        const v1Sharp = Math.abs(vein1) < 0.04 ? 1 : 0;
        const v2Sharp = Math.abs(vein2) < 0.03 ? 0.8 : 0;
        const v3Sharp = Math.abs(vein3) < 0.05 ? 0.6 : 0;
        const v1Glow = Math.max(0, 1 - Math.abs(vein1) * 12) * 0.5;
        const v2Glow = Math.max(0, 1 - Math.abs(vein2) * 15) * 0.4;
        const v3Glow = Math.max(0, 1 - Math.abs(vein3) * 10) * 0.3;

        const vein = Math.min(1, v1Sharp + v2Sharp + v3Sharp + v1Glow + v2Glow + v3Glow);
        const pulse = 0.7 + Math.sin(t * 2) * 0.15 + Math.sin(t * 3) * 0.1;
        const frostVal = vein * pulse;
        const iceGlow = Math.sin(vein1 * 6 + t) * 0.1;

        let r = pal.base[0] + base * pal.baseVar[0];
        let g = pal.base[1] + base * pal.baseVar[1];
        let b = pal.base[2] + base * pal.baseVar[2];

        r += frostVal * pal.veinColor[0] + iceGlow * pal.veinPulse[0];
        g += frostVal * pal.veinColor[1] + iceGlow * pal.veinPulse[1];
        b += frostVal * pal.veinColor[2] + iceGlow * pal.veinPulse[2];

        if (frostVal > 0.6) {
          const hl = (frostVal - 0.6) / 0.4;
          r += hl * pal.highlight[0];
          g += hl * pal.highlight[1];
          b += hl * pal.highlight[2];
        }

        const sparkle = Math.sin(nx * 15 + ny * 12 + t * 4) * 0.02;
        r += sparkle * 40;
        g += sparkle * 60;
        b += sparkle * 80;

        d[idx] = Math.min(255, Math.max(0, r | 0));
        d[idx + 1] = Math.min(255, Math.max(0, g | 0));
        d[idx + 2] = Math.min(255, Math.max(0, b | 0));
        d[idx + 3] = 255;
      }
    }

    octx.putImageData(imgData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, width, height);

    ctx.globalCompositeOperation = 'screen';
    const mistGrad = ctx.createRadialGradient(
      width * 0.5, height * 0.4, 0,
      width * 0.5, height * 0.4, width * 0.35
    );
    mistGrad.addColorStop(0, pal.glow);
    mistGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
    mistGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, 0, width, height);

    const cornerGrad = ctx.createRadialGradient(
      width * 0.5, height * 0.5, width * 0.2,
      width * 0.5, height * 0.5, width * 0.55
    );
    cornerGrad.addColorStop(0, 'rgba(0,0,0,0)');
    cornerGrad.addColorStop(0.7, pal.vignette);
    cornerGrad.addColorStop(1, pal.vignette);
    ctx.fillStyle = cornerGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'source-over';
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { FrostCrystal };
