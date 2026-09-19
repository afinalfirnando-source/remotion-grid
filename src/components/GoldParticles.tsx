import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface GoldParticlesProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
}

const PI2 = Math.PI * 2;

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const N = 4000;
const SK = 1800;
const TOTAL = N + SK;

const PX = new Float32Array(TOTAL);
const PY = new Float32Array(TOTAL);
const PS = new Float32Array(TOTAL);
const PB = new Float32Array(TOTAL);
const PA = new Float32Array(TOTAL);
const PF = new Float32Array(TOTAL);
const PW = new Uint8Array(TOTAL);
const PP = new Float32Array(TOTAL);
const PC_R = new Uint8Array(TOTAL);
const PC_G = new Uint8Array(TOTAL);
const PC_B = new Uint8Array(TOTAL);

for (let i = 0; i < N; i++) {
  const u = hash(i);
  PX[i] = u;
  PY[i] = u * 0.85 + 0.08;
  PS[i] = 0.6 + hash(i + 1000) * 2.2;
  PB[i] = 0.2 + hash(i + 2000) * 0.8;
  PA[i] = 0.01 + hash(i + 3000) * 0.03;
  PF[i] = 1.5 + hash(i + 4000) * 3.0;
  PW[i] = 1 + ((i * 7) % 3);
  PP[i] = hash(i + 6000) * PI2;
  PC_R[i] = 255;
  PC_G[i] = (160 + 50 * hash(i + 2000)) | 0;
  PC_B[i] = (30 + 50 * hash(i + 2000)) | 0;
}

for (let i = 0; i < SK; i++) {
  const j = N + i;
  PX[j] = hash(i + 7000);
  PY[j] = hash(i + 8000);
  PS[j] = 0.3 + hash(i + 9000) * 1.0;
  PB[j] = 0.3 + hash(i + 11000) * 0.7;
  PA[j] = 0;
  PF[j] = 0;
  PW[j] = 1 + ((i * 13) % 4);
  PP[j] = hash(i + 10000) * PI2;
  PC_R[j] = 255;
  PC_G[j] = (210 * PB[j]) | 0;
  PC_B[j] = (80 * PB[j]) | 0;
}

const GoldParticles: React.FC<GoldParticlesProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const t = (frame / totalFrames) * PI2 * speed;

  const sw = Math.floor(width / 2);
  const sh = Math.floor(height / 2);
  const aspect = width / height;

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

    const driftX = Math.sin(t) * 0.015;
    const driftY = Math.cos(t) * 0.012;

    for (let py = 0; py < sh; py++) {
      const ny = py / sh;
      for (let px = 0; px < sw; px++) {
        const idx = (py * sw + px) * 4;
        const nx = px / sw;
        let r = 0, g = 0, b = 0;

        for (let i = 0; i < TOTAL; i++) {
          let ppx: number, ppy: number;
          if (i < N) {
            const wave = Math.sin(PY[i] * PF[i] * PI2 + t * PW[i] + PP[i]) * PA[i];
            ppx = PX[i] + wave + driftX;
            ppy = PY[i] + Math.sin(PX[i] * 2.5 * PI2 + t * 2 + PP[i]) * PA[i] * 0.8 + driftY;
          } else {
            ppx = PX[i] + driftX * 1.5;
            ppy = PY[i] + driftY * 1.5;
          }
          const dx = (nx - ppx) * aspect;
          const dy = ny - ppy;
          const dist2 = dx * dx + dy * dy;
          const sigma = i < N ? 0.006 : 0.004;
          const gauss = Math.exp(-dist2 / (2 * sigma * sigma));
          let alpha = gauss * PB[i];
          if (i >= N) {
            alpha *= 0.5 + 0.5 * Math.sin(t * PW[i] + PP[i]);
          }
          r += alpha * PC_R[i];
          g += alpha * PC_G[i];
          b += alpha * PC_B[i];
        }
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

    ctx.globalCompositeOperation = 'screen';
    const bx = width * (0.5 + Math.sin(t) * 0.04);
    const by = height * (0.5 + Math.cos(t) * 0.03);
    const bloom = ctx.createRadialGradient(bx, by, 0, bx, by, width * 0.35);
    bloom.addColorStop(0, 'rgba(255,175,40,0.10)');
    bloom.addColorStop(0.5, 'rgba(200,130,20,0.04)');
    bloom.addColorStop(1, 'rgba(180,100,10,0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: '#000000' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { GoldParticles };