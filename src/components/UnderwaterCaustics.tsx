import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type CausticScheme = 'tropical' | 'deepOcean' | 'coral' | 'kelp' | 'abyss';

interface UnderwaterCausticsProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: CausticScheme;
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

function caustic(x: number, y: number, t: number): number {
  const c1 = fbm(x + Math.sin(t) * 0.5, y + Math.cos(t) * 0.5, 4);
  const c2 = fbm(x * 1.5 + Math.cos(t) * 0.4 + 5, y * 1.5 + Math.sin(t) * 0.3 + 5, 4);
  const c3 = fbm(x * 0.8 + Math.sin(t * 2) * 0.3 + 10, y * 0.8 + Math.cos(t * 2) * 0.3 + 10, 3);
  const raw = (c1 + c2 + c3) / 3;
  return Math.max(0, raw * 2.5 - 0.3);
}

const schemes: Record<CausticScheme, {
  bg: string;
  deep: [number, number, number];
  mid: [number, number, number];
  bright: [number, number, number];
  hot: [number, number, number];
  waveColor: [number, number, number];
  glow: string;
}> = {
  tropical: {
    bg: '#061525',
    deep: [8, 20, 45], mid: [15, 50, 90],
    bright: [80, 200, 220], hot: [200, 240, 255],
    waveColor: [30, 50, 40], glow: 'rgba(100,200,230,0.15)',
  },
  deepOcean: {
    bg: '#030d1a',
    deep: [3, 10, 30], mid: [8, 30, 70],
    bright: [40, 140, 200], hot: [150, 220, 255],
    waveColor: [15, 40, 60], glow: 'rgba(60,140,220,0.15)',
  },
  coral: {
    bg: '#1a0d10',
    deep: [35, 12, 18], mid: [80, 30, 40],
    bright: [200, 100, 90], hot: [255, 200, 180],
    waveColor: [50, 20, 25], glow: 'rgba(200,100,80,0.15)',
  },
  kelp: {
    bg: '#081508',
    deep: [10, 25, 12], mid: [20, 60, 30],
    bright: [60, 180, 100], hot: [180, 255, 200],
    waveColor: [20, 50, 30], glow: 'rgba(80,200,100,0.15)',
  },
  abyss: {
    bg: '#0a0618',
    deep: [15, 5, 35], mid: [30, 10, 70],
    bright: [80, 40, 180], hot: [180, 150, 255],
    waveColor: [25, 10, 50], glow: 'rgba(100,60,200,0.15)',
  },
};

const UnderwaterCaustics: React.FC<UnderwaterCausticsProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'tropical',
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

        const c = caustic(nx * 4, ny * 4, t);

        let r: number, g: number, b: number;

        if (c < 0.3) {
          const f = c / 0.3;
          r = pal.deep[0] + f * (pal.mid[0] - pal.deep[0]);
          g = pal.deep[1] + f * (pal.mid[1] - pal.deep[1]);
          b = pal.deep[2] + f * (pal.mid[2] - pal.deep[2]);
        } else if (c < 0.6) {
          const f = (c - 0.3) / 0.3;
          r = pal.mid[0] + f * (pal.bright[0] - pal.mid[0]);
          g = pal.mid[1] + f * (pal.bright[1] - pal.mid[1]);
          b = pal.mid[2] + f * (pal.bright[2] - pal.mid[2]);
        } else {
          const f = (c - 0.6) / 0.4;
          r = pal.bright[0] + f * (pal.hot[0] - pal.bright[0]);
          g = pal.bright[1] + f * (pal.hot[1] - pal.bright[1]);
          b = pal.bright[2] + f * (pal.hot[2] - pal.bright[2]);
        }

        const wave = Math.sin(nx * 8 + ny * 3 + t * 3) * 0.02;
        r += wave * pal.waveColor[0];
        g += wave * pal.waveColor[1];
        b += wave * pal.waveColor[2];

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
    const glow = ctx.createRadialGradient(
      width * 0.5, height * 0.25, 0,
      width * 0.5, height * 0.25, width * 0.3
    );
    glow.addColorStop(0, pal.glow);
    glow.addColorStop(0.5, 'rgba(0,0,0,0)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { UnderwaterCaustics };
