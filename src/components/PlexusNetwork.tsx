import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface PlexusNetworkProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
}

function srand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const PlexusNetwork: React.FC<PlexusNetworkProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = 40;
    const rows = 25;
    const total = cols * rows;

    const rndX: number[] = [];
    const rndY: number[] = [];
    const rndSpd: number[] = [];
    const rndPh: number[] = [];
    for (let i = 0; i < total; i++) {
      rndX.push(srand(i * 3) * 2 - 1);
      rndY.push(srand(i * 3 + 1) * 2 - 1);
      rndSpd.push(1 + Math.floor(srand(i * 5) * 3));
      rndPh.push(srand(i * 7) * Math.PI * 2);
    }

    const camX = Math.sin(t * 2) * width * 0.03 + Math.sin(t * 4) * width * 0.01;
    const camY = Math.cos(t * 2) * height * 0.015;

    const nx: number[] = [];
    const ny: number[] = [];
    const nd: number[] = [];
    const isOrange: boolean[] = [];
    const phases: number[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const depth = 0.3 + (r / (rows - 1)) * 0.7;

        const bx = (c / (cols - 1) - 0.5) * 2;
        const by = (r / (rows - 1) - 0.5) * 2;

        const cx = bx + rndX[idx] * 0.25;
        const cy = by + rndY[idx] * 0.2;

        const sp = rndSpd[idx];
        const ph = rndPh[idx];

        const wx = Math.sin(t * 3 * sp + ph) * 0.15;
        const wy = Math.cos(t * 2 * sp + ph * 1.3) * 0.12;
        const wz = Math.sin(t * 4 * sp + ph * 0.7) * 40;

        const gx = cx + wx + Math.sin(t * 2) * 0.015;
        const gy = cy + wy + Math.cos(t * 2) * 0.008;

        nx.push(width / 2 + gx * width * 0.8 * depth + camX * depth);
        ny.push(height * 0.1 + gy * height * 0.65 * depth + r * height * 0.024 + camY * depth + wz * depth);
        nd.push(depth);
        isOrange.push(srand(idx * 11) > 0.87);
        phases.push(ph);
      }
    }

    ctx.clearRect(0, 0, width, height);

    const bgG = ctx.createRadialGradient(width * 0.5, height * 0.35, 0, width * 0.5, height * 0.35, width * 0.8);
    bgG.addColorStop(0, '#0e2a3d');
    bgG.addColorStop(0.5, '#081620');
    bgG.addColorStop(1, '#030810');
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 25; i++) {
      const bx = ((i * 137.5 + t * 5) % (width + 200)) - 100;
      const by = ((i * 89.3 + t * 2) % (height + 200)) - 100;
      const br = 30 + Math.sin(t * 2 + i) * 20;
      const bo = 0.06 + Math.sin(t * 2 + i * 2) * 0.04;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, `rgba(15,70,90,${bo})`);
      g.addColorStop(1, 'rgba(15,70,90,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    const maxDist = 280;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const ax = nx[idx];
        const ay = ny[idx];
        if (ax < -150 || ax > width + 150 || ay < -150 || ay > height + 150) continue;

        const nbrs: number[] = [];
        if (c + 1 < cols) nbrs.push(idx + 1);
        if (r + 1 < rows) nbrs.push(idx + cols);
        if (c + 1 < cols && r + 1 < rows) nbrs.push(idx + cols + 1);
        if (c > 0 && r + 1 < rows) nbrs.push(idx + cols - 1);

        for (const ni of nbrs) {
          const bx = nx[ni];
          const by = ny[ni];
          if (bx < -150 || bx > width + 150 || by < -150 || by > height + 150) continue;

          const dx = ax - bx;
          const dy = ay - by;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const a = 1 - dist / maxDist;
            const avgD = (nd[idx] + nd[ni]) / 2;
            const dFade = 0.3 + avgD * 0.7;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = `rgba(40,200,240,${a * 0.8 * dFade})`;
            ctx.lineWidth = 1 + dFade * 2;
            ctx.stroke();
          }
        }
      }
    }

    for (let i = 0; i < total; i++) {
      const sx = nx[i];
      const sy = ny[i];
      if (sx < -60 || sx > width + 60 || sy < -60 || sy > height + 60) continue;

      const pulse = 0.5 + Math.sin(t * 2 + phases[i]) * 0.45;
      const df = 0.2 + nd[i] * 0.8;
      const alpha = pulse * df;
      const sc = 0.4 + nd[i] * 0.6;

      const gr = (20 + pulse * 22) * sc;

      if (isOrange[i]) {
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, gr);
        g.addColorStop(0, `rgba(255,180,50,${alpha})`);
        g.addColorStop(0.3, `rgba(255,120,20,${alpha * 0.5})`);
        g.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = g;
      } else {
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, gr);
        g.addColorStop(0, `rgba(0,240,255,${alpha})`);
        g.addColorStop(0.3, `rgba(0,180,220,${alpha * 0.5})`);
        g.addColorStop(1, 'rgba(0,100,160,0)');
        ctx.fillStyle = g;
      }
      ctx.beginPath();
      ctx.arc(sx, sy, gr, 0, Math.PI * 2);
      ctx.fill();

      const cr = (4 + pulse * 5) * sc;
      ctx.beginPath();
      ctx.arc(sx, sy, cr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.95})`;
      ctx.fill();
    }

    for (let i = 0; i < 40; i++) {
      const px = ((i * 97.3 + t * 3) % (width + 80)) - 40;
      const py = ((i * 61.7 + t * 2) % (height + 80)) - 40;
      const ps = 0.7 + Math.sin(t * 2 + i * 2) * 0.4;
      const po = 0.15 + Math.sin(t * 2 + i) * 0.1;
      ctx.beginPath();
      ctx.arc(px, py, ps, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,210,240,${po})`;
      ctx.fill();
    }

  }, [frame, width, height, totalFrames, speed, t]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: '#030810' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};
