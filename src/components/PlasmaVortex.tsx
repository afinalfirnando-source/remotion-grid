import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface PlasmaVortexProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: PlasmaScheme;
}

export type PlasmaScheme = 'violet' | 'crimson' | 'abyss' | 'inferno' | 'venom';

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

const schemes: Record<PlasmaScheme, {
  bg: string;
  base: [number, number, number];
  energy: [number, number, number];
  core: [number, number, number];
  hi: [number, number, number];
  boltGlow: string;
  boltMid: string;
}> = {
  violet: {
    bg: '#06030c',
    base: [26, 10, 62], energy: [130, 52, 168], core: [90, 60, 140], hi: [120, 110, 130],
    boltGlow: '150,100,255', boltMid: '180,140,255',
  },
  crimson: {
    bg: '#0c0306',
    base: [62, 10, 22], energy: [170, 50, 70], core: [140, 55, 70], hi: [130, 105, 115],
    boltGlow: '255,100,140', boltMid: '255,140,170',
  },
  abyss: {
    bg: '#020a0e',
    base: [8, 34, 52], energy: [40, 130, 160], core: [45, 95, 125], hi: [105, 125, 135],
    boltGlow: '90,200,255', boltMid: '140,220,255',
  },
  inferno: {
    bg: '#0e0502',
    base: [64, 22, 8], energy: [175, 85, 30], core: [145, 70, 35], hi: [135, 110, 90],
    boltGlow: '255,150,70', boltMid: '255,185,120',
  },
  venom: {
    bg: '#030c05',
    base: [10, 52, 26], energy: [50, 160, 80], core: [55, 120, 70], hi: [105, 130, 110],
    boltGlow: '100,255,140', boltMid: '150,255,180',
  },
};

const PlasmaVortex: React.FC<PlasmaVortexProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'violet',
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

    // Vortex rotation oscillates (loops)
    const rot = Math.sin(t) * 0.35;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const breathe = 1 + Math.sin(t * 2) * 0.06;

    for (let py = 0; py < sh; py++) {
      for (let px = 0; px < sw; px++) {
        const idx = (py * sw + px) * 4;
        const nx = px / sw;
        const ny = py / sh;

        // Rotate coords around center for vortex swirl
        const dx = (nx - 0.5) * breathe;
        const dy = (ny - 0.5) * breathe;
        const vx = dx * cosR - dy * sinR;
        const vy = dx * sinR + dy * cosR;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Domain-warped plasma
        const qx = fbm(vx * 3 + Math.sin(t), vy * 3 + Math.cos(t), 3);
        const qy = fbm(vx * 3 + 5.2 + Math.cos(t), vy * 3 + 1.3 + Math.sin(t), 3);
        const p = fbm(vx * 3 + 3 * qx + Math.sin(t * 2) * 0.4, vy * 3 + 3 * qy, 4);

        // Ridged neon tubes
        const ridge = 1 - Math.abs(p * 1.4);
        const tube = Math.pow(Math.max(0, ridge), 3);

        // Energy level
        const energy = Math.max(0, p * 0.5 + 0.5 + tube * 0.7);

        // Single unified palette
        let r: number, g: number, b: number;
        r = pal.base[0] + energy * pal.energy[0];
        g = pal.base[1] + energy * pal.energy[1];
        b = pal.base[2] + energy * pal.energy[2];

        // Center vortex brightness
        const core = Math.max(0, 1 - dist * 3.2) * (0.5 + tube * 0.8);
        r += core * pal.core[0];
        g += core * pal.core[1];
        b += core * pal.core[2];

        // Neon tube highlights
        if (tube > 0.55) {
          const hl = (tube - 0.55) / 0.45;
          r += hl * pal.hi[0];
          g += hl * pal.hi[1];
          b += hl * pal.hi[2];
        }

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

    // === Lightning bolt across the middle ===
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const midY = height * 0.5;
    const flicker = 0.65 + Math.sin(t * 4) * 0.2 + Math.sin(t * 7) * 0.1;
    const pts: { x: number; y: number }[] = [];
    const segs = 90;
    for (let s = 0; s <= segs; s++) {
      const fx = s / segs;
      const jag = Math.sin(fx * 40 + t * 3) * 6
        + Math.sin(fx * 23 - t * 2) * 12
        + Math.sin(fx * 9 + t * 4) * 22 * Math.sin(fx * Math.PI);
      pts.push({ x: fx * width, y: midY + jag * (height / 1080) });
    }
    const strokeBolt = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let s = 1; s < pts.length; s++) ctx.lineTo(pts[s].x, pts[s].y);
      ctx.stroke();
    };
    // Wide glow
    ctx.strokeStyle = `rgba(${pal.boltGlow},${0.16 * flicker})`;
    ctx.lineWidth = 26;
    strokeBolt();
    // Mid glow
    ctx.strokeStyle = `rgba(${pal.boltMid},${0.35 * flicker})`;
    ctx.lineWidth = 9;
    strokeBolt();
    // Core
    ctx.strokeStyle = `rgba(235,240,255,${0.9 * flicker})`;
    ctx.lineWidth = 2.5;
    strokeBolt();

    ctx.globalCompositeOperation = 'source-over';

    // Vignette
    const vig = ctx.createRadialGradient(
      width * 0.5, height * 0.5, width * 0.2,
      width * 0.5, height * 0.5, width * 0.6,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { PlasmaVortex };
