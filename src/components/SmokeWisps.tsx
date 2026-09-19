import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface SmokeWispsProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: SmokeScheme;
}

export type SmokeScheme = 'mono' | 'ember' | 'abyss' | 'mint' | 'royal';

const schemes: Record<SmokeScheme, {
  bg: string;
  edge: [number, number, number];
  core: [number, number, number];
  bloom: string;
  bloomEnd: string;
}> = {
  mono: {
    bg: '#000000',
    edge: [205, 205, 210], core: [50, 50, 45],
    bloom: 'rgba(200,205,215,0.10)', bloomEnd: 'rgba(200,205,215,0)',
  },
  ember: {
    bg: '#080201',
    edge: [215, 120, 65], core: [40, 25, 15],
    bloom: 'rgba(255,120,40,0.10)', bloomEnd: 'rgba(255,120,40,0)',
  },
  abyss: {
    bg: '#01070c',
    edge: [115, 185, 220], core: [30, 45, 50],
    bloom: 'rgba(60,180,230,0.10)', bloomEnd: 'rgba(60,180,230,0)',
  },
  mint: {
    bg: '#010a05',
    edge: [125, 210, 155], core: [30, 45, 30],
    bloom: 'rgba(60,220,120,0.10)', bloomEnd: 'rgba(60,220,120,0)',
  },
  royal: {
    bg: '#06030e',
    edge: [175, 145, 230], core: [40, 30, 45],
    bloom: 'rgba(140,90,255,0.10)', bloomEnd: 'rgba(140,90,255,0)',
  },
};

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

function smoothstep(a: number, b: number, x: number): number {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
}

const SmokeWisps: React.FC<SmokeWispsProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'mono',
}) => {
  const sc = schemes[scheme];
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const t = (frame / totalFrames) * PI2 * speed;

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

    // Slow drift (loops)
    const driftX = Math.sin(t) * 0.4;
    const driftY = Math.cos(t) * 0.3;
    const swirl = Math.sin(t * 2) * 0.15;

    for (let py = 0; py < sh; py++) {
      for (let px = 0; px < sw; px++) {
        const idx = (py * sw + px) * 4;
        const nx = px / sw;
        const ny = py / sh;

        // Domain-warped billows
        const qx = fbm(nx * 3 + driftX, ny * 3 + driftY, 3);
        const qy = fbm(nx * 3 + 5.2 + driftY, ny * 3 + 1.3 + driftX, 3);
        const wx = nx * 3 + 3.2 * qx + Math.sin(t) * 0.35 + swirl * nx;
        const wy = ny * 3 + 3.2 * qy + Math.cos(t) * 0.35;
        const v = fbm(wx, wy, 5);

        // Fine tendril detail
        const detail = fbm(nx * 9 + driftX * 1.5 + qx * 2, ny * 9 + driftY * 1.5, 3);
        const combined = v * 0.72 + detail * 0.28;

        // Bias: denser on right, wispier on left (like reference)
        const bias = 0.12 + nx * 0.28;
        let density = smoothstep(0.02 + bias * 0.4, 0.75, combined * 0.5 + 0.5 + bias * 0.35);

        // Soft top glow variation
        const glow = Math.sin(nx * 2 + t * 2) * 0.03 + 0.03;
        density = Math.max(0, Math.min(1, density + glow * (1 - density)));

        // Smoke shading: bright core, tinted edges
        const core = smoothstep(0.45, 0.9, density);
        const r = density * sc.edge[0] + core * sc.core[0];
        const g = density * sc.edge[1] + core * sc.core[1];
        const b = density * sc.edge[2] + core * sc.core[2];

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

    // Gentle top-right light bloom (loops)
    ctx.globalCompositeOperation = 'screen';
    const bx = width * (0.72 + Math.sin(t) * 0.03);
    const bloom = ctx.createRadialGradient(bx, height * 0.3, 0, bx, height * 0.3, width * 0.3);
    bloom.addColorStop(0, sc.bloom);
    bloom.addColorStop(1, sc.bloomEnd);
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: sc.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { SmokeWisps };
