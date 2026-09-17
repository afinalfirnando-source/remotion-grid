import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type InfernoScheme = 'inferno' | 'bluefire' | 'toxic' | 'void' | 'solar';

interface InfernoProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: InfernoScheme;
}

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

function fbm(x: number, y: number, octaves: number): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2.03;
  }
  return val;
}

function warpedNoise(x: number, y: number, t: number): number {
  const qx = fbm(x, y, 3);
  const qy = fbm(x + 5.2, y + 1.3, 3);
  const rx = fbm(x + 4 * qx + 1.7 + t * 0.25, y + 4 * qy + 9.2, 3);
  const ry = fbm(x + 4 * rx + 8.3 + t * 0.2, y + 4 * qx + 2.8, 3);
  return fbm(x + 4 * rx, y + 4 * ry, 4);
}

const palettes: Record<InfernoScheme, [number, number, number][]> = {
  inferno: [
    [10, 0, 0], [50, 5, 0], [100, 10, 0], [150, 25, 0], [200, 50, 0],
    [240, 90, 0], [255, 140, 0], [255, 180, 10], [255, 210, 40],
    [255, 235, 100], [255, 250, 200],
  ],
  bluefire: [
    [0, 2, 15], [0, 8, 50], [0, 20, 100], [10, 50, 160], [20, 100, 210],
    [40, 160, 240], [80, 200, 255], [140, 225, 255], [200, 245, 255],
    [230, 250, 255], [255, 255, 255],
  ],
  toxic: [
    [0, 8, 0], [5, 30, 0], [10, 60, 0], [20, 100, 5], [40, 150, 10],
    [60, 200, 20], [100, 230, 40], [160, 245, 80], [200, 250, 120],
    [230, 255, 180], [255, 255, 230],
  ],
  void: [
    [5, 0, 15], [15, 0, 40], [30, 5, 80], [50, 10, 120], [80, 20, 160],
    [110, 30, 190], [140, 60, 210], [170, 100, 230], [200, 150, 240],
    [220, 190, 250], [240, 230, 255],
  ],
  solar: [
    [15, 5, 0], [60, 15, 0], [120, 30, 0], [180, 60, 0], [230, 100, 0],
    [255, 150, 10], [255, 190, 40], [255, 220, 80], [255, 240, 130],
    [255, 250, 180], [255, 255, 230],
  ],
};

const glowColors: Record<InfernoScheme, { c1: string; c2: string; c3: string }> = {
  inferno: { c1: 'rgba(255,100,0,0.2)', c2: 'rgba(200,40,0,0.08)', c3: 'rgba(255,180,20,0.1)' },
  bluefire: { c1: 'rgba(0,120,255,0.2)', c2: 'rgba(0,60,200,0.08)', c3: 'rgba(100,200,255,0.1)' },
  toxic: { c1: 'rgba(60,220,20,0.2)', c2: 'rgba(20,150,10,0.08)', c3: 'rgba(120,255,60,0.1)' },
  void: { c1: 'rgba(120,40,200,0.2)', c2: 'rgba(60,10,140,0.08)', c3: 'rgba(180,100,255,0.1)' },
  solar: { c1: 'rgba(255,150,0,0.2)', c2: 'rgba(200,80,0,0.08)', c3: 'rgba(255,200,40,0.1)' },
};

function samplePalette(pal: [number, number, number][], val: number): [number, number, number] {
  const ci = Math.min(10, Math.max(0, val * 10));
  const i0 = Math.floor(ci);
  const f = ci - i0;
  const c0 = pal[i0];
  const c1 = pal[Math.min(10, i0 + 1)];
  return [
    c0[0] + (c1[0] - c0[0]) * f,
    c0[1] + (c1[1] - c0[1]) * f,
    c0[2] + (c1[2] - c0[2]) * f,
  ];
}

const Inferno: React.FC<InfernoProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'inferno',
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;
  const offRef = useRef<HTMLCanvasElement | null>(null);

  const pal = palettes[scheme];
  const glow = glowColors[scheme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sw = Math.floor(width / 2);
    const sh = Math.floor(height / 2);
    if (!offRef.current) {
      offRef.current = document.createElement('canvas');
      offRef.current.width = sw;
      offRef.current.height = sh;
    }
    const off = offRef.current;
    const octx = off.getContext('2d');
    if (!octx) return;

    const imageData = octx.createImageData(sw, sh);
    const data = imageData.data;

    const wt = t;

    for (let py = 0; py < sh; py++) {
      for (let px = 0; px < sw; px++) {
        const idx = (py * sw + px) * 4;
        const nx = px / sw;
        const ny = py / sh;

        const n1 = warpedNoise(nx * 3, ny * 3, wt);
        const n2 = warpedNoise(nx * 5 + 10, ny * 5 + 10, wt);
        const n3 = warpedNoise(nx * 1.5 + 20, ny * 1.5, wt);

        const verticalGrad = Math.pow(1 - ny, 1.5);
        let val = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) * 0.5 + verticalGrad * 0.5;

        const swirl = Math.sin(nx * 8 + n1 * 3 + wt) * 0.15;
        const swirl2 = Math.cos(ny * 6 + n2 * 4 + wt) * 0.1;
        val += swirl + swirl2;

        const vein = Math.max(0, 1 - Math.abs(n1 - n2) * 8) * 0.3;
        val += vein;

        val = Math.min(1, Math.max(0, val * 0.9));

        const [r, g, b] = samplePalette(pal, val);
        data[idx] = Math.min(255, r);
        data[idx + 1] = Math.min(255, g);
        data[idx + 2] = Math.min(255, b);
        data[idx + 3] = 255;
      }
    }

    octx.putImageData(imageData, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, width, height);

    ctx.globalCompositeOperation = 'screen';
    const glow1 = ctx.createRadialGradient(
      width * 0.5, height * 0.3, 0,
      width * 0.5, height * 0.3, width * 0.4
    );
    glow1.addColorStop(0, glow.c1);
    glow1.addColorStop(0.5, glow.c2);
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    const glow2 = ctx.createRadialGradient(
      width * 0.5, height * 0.5, 0,
      width * 0.5, height * 0.5, width * 0.25
    );
    glow2.addColorStop(0, glow.c3);
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'source-over';
  }, [frame, width, height, totalFrames, speed, t, pal, glow]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: '#000' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { Inferno };
