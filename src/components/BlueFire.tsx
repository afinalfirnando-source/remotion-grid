import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface BlueFireProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: FireScheme;
}

export type FireScheme = 'blue' | 'crimson' | 'toxic' | 'violet' | 'solar';

const schemes: Record<FireScheme, {
  bg: string; dim: [number,number,number]; mid: [number,number,number]; hot: [number,number,number];
}> = {
  blue:    { bg: '#000000', dim: [20,80,140],   mid: [60,180,220],   hot: [140,255,255] },
  crimson: { bg: '#0a0000', dim: [120,15,10],   mid: [220,60,20],   hot: [255,200,80] },
  toxic:   { bg: '#000a00', dim: [10,100,30],   mid: [30,200,80],   hot: [180,255,120] },
  violet:  { bg: '#05000a', dim: [80,20,120],   mid: [160,60,220],  hot: [220,160,255] },
  solar:   { bg: '#0a0600', dim: [140,80,10],   mid: [240,160,30],  hot: [255,240,140] },
};

const PI2 = Math.PI * 2;

function noise(x: number, y: number): number {
  const ix = Math.floor(x); const iy = Math.floor(y);
  const fx = x - ix; const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx); const sy = fy * fy * (3 - 2 * fy);
  const a = Math.sin(ix * 12.9898 + iy * 78.233) * 43758.5453;
  const b = Math.sin((ix + 1) * 12.9898 + iy * 78.233) * 43758.5453;
  const c = Math.sin(ix * 12.9898 + (iy + 1) * 78.233) * 43758.5453;
  const d = Math.sin((ix + 1) * 12.9898 + (iy + 1) * 78.233) * 43758.5453;
  const n0 = (a - Math.floor(a)) * 2 - 1; const n1 = (b - Math.floor(b)) * 2 - 1;
  const n2 = (c - Math.floor(c)) * 2 - 1; const n3 = (d - Math.floor(d)) * 2 - 1;
  return n0 + (n1 - n0) * sx + (n2 - n0) * sy + (n0 - n1 - n2 + n3) * sx * sy;
}

function fbm(x: number, y: number, oct: number): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * noise(x * f, y * f); a *= 0.5; f *= 2.03; }
  return v;
}

function smoothstep(a: number, b: number, x: number): number {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
}

const BlueFire: React.FC<BlueFireProps> = ({
  width = 1920, height = 1080, totalFrames = 300, speed = 1, scheme = 'blue',
}) => {
  const sc = schemes[scheme];
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const t = (frame / totalFrames) * PI2 * speed;
  const sw = Math.floor(width / 2); const sh = Math.floor(height / 2);
  const aspect = width / height;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!offRef.current) {
      offRef.current = document.createElement('canvas');
      offRef.current.width = sw; offRef.current.height = sh;
    }
    const off = offRef.current;
    const octx = off.getContext('2d');
    if (!octx) return;
    const imgData = octx.createImageData(sw, sh);
    const d = imgData.data;
    const driftX = Math.sin(t) * 0.3;
    const driftY = Math.cos(t) * 0.2;

    for (let py = 0; py < sh; py++) {
      const ny = py / sh;
      for (let px = 0; px < sw; px++) {
        const idx = (py * sw + px) * 4;
        const nx = px / sw;
        const heightFade = smoothstep(0.0, 0.7, 1.0 - ny);
        const qx = fbm(nx * 3 + driftX, ny * 4 + t * 2, 3);
        const qy = fbm(nx * 3 + 5.2 + driftY, ny * 4 + 1.3 + t, 3);
        const wx = nx * 3 + 2.5 * qx + Math.sin(t) * 0.4;
        const wy = ny * 4 + 2.5 * qy + Math.cos(t) * 0.3;
        const v = fbm(wx, wy, 5);
        const s1 = fbm(nx * 4 + qx * 2 + Math.sin(t) * 0.5, ny * 5 + qy * 2, 3);
        const combined = v * 0.7 + s1 * 0.3;
        let density = smoothstep(0.1, 0.65, combined * 0.5 + 0.5);
        density *= heightFade;
        const edgeFade = smoothstep(0.0, 0.15, nx) * smoothstep(1.0, 0.85, nx);
        density *= edgeFade;
        const core = smoothstep(0.4, 0.9, density);
        const mid = smoothstep(0.2, 0.6, density);
        let r = sc.dim[0] * density + sc.mid[0] * mid + sc.hot[0] * core;
        let g = sc.dim[1] * density + sc.mid[1] * mid + sc.hot[1] * core;
        let b = sc.dim[2] * density + sc.mid[2] * mid + sc.hot[2] * core;
        d[idx] = r > 255 ? 255 : r < 0 ? 0 : r | 0;
        d[idx + 1] = g > 255 ? 255 : g < 0 ? 0 : g | 0;
        d[idx + 2] = b > 255 ? 255 : b < 0 ? 0 : b | 0;
        d[idx + 3] = 255;
      }
    }
    octx.putImageData(imgData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, width, height);
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: sc.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { BlueFire };
