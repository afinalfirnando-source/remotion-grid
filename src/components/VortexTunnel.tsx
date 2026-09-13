import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type VortexColorScheme = 'cyan' | 'neonPink' | 'toxicGreen';

interface VortexTunnelProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: VortexColorScheme;
}

const schemes: Record<VortexColorScheme, { core: string; mid: string; glow: string; trail: string; line: string; bg1: string; bg2: string; bg3: string; bgBokeh: string }> = {
  cyan: {
    core: 'rgba(220,245,255,',
    mid: 'rgba(0,240,255,',
    glow: 'rgba(0,220,255,',
    trail: 'rgba(0,180,240,',
    line: 'rgba(30,160,220,',
    bg1: '#0a1830',
    bg2: '#06101e',
    bg3: '#02060c',
    bgBokeh: 'rgba(10,40,80,',
  },
  neonPink: {
    core: 'rgba(255,230,245,',
    mid: 'rgba(255,50,150,',
    glow: 'rgba(255,0,120,',
    trail: 'rgba(200,0,180,',
    line: 'rgba(180,20,120,',
    bg1: '#1a0515',
    bg2: '#120310',
    bg3: '#080108',
    bgBokeh: 'rgba(60,10,40,',
  },
  toxicGreen: {
    core: 'rgba(220,255,230,',
    mid: 'rgba(50,255,80,',
    glow: 'rgba(0,220,60,',
    trail: 'rgba(0,180,50,',
    line: 'rgba(20,160,40,',
    bg1: '#051a08',
    bg2: '#031205',
    bg3: '#020803',
    bgBokeh: 'rgba(10,50,15,',
  },
};

const ARMS = 5;
const PARTICLES_PER_ARM = 80;
const RING_COUNT = 10;
const RING_PARTICLES = 20;

export const VortexTunnel: React.FC<VortexTunnelProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'cyan',
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;
  const c = schemes[scheme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const bgG = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
    bgG.addColorStop(0, c.bg1);
    bgG.addColorStop(0.4, c.bg2);
    bgG.addColorStop(1, c.bg3);
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.min(width, height) * 0.7;
    const vr = t * 2;

    for (let i = 0; i < 40; i++) {
      const bx = ((i * 137.5 + t * 4) % (width + 300)) - 150;
      const by = ((i * 89.3 + t * 2) % (height + 300)) - 150;
      const br = 40 + Math.sin(t * 2 + i) * 25;
      const bo = 0.04 + Math.sin(t * 2 + i * 2) * 0.02;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, `${c.bgBokeh}${bo})`);
      g.addColorStop(1, `${c.bgBokeh}0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let arm = 0; arm < ARMS; arm++) {
      const armOffset = (arm / ARMS) * Math.PI * 2;

      for (let p = 0; p < PARTICLES_PER_ARM; p++) {
        const pNorm = p / PARTICLES_PER_ARM;
        const spiralAngle = armOffset + pNorm * Math.PI * 6 + vr + arm * 0.5;
        const spiralR = maxR * (0.03 + pNorm * 0.97);
        const wobble = Math.sin(pNorm * 20 + t * 3 + arm) * spiralR * 0.03;

        const px = cx + Math.cos(spiralAngle) * (spiralR + wobble);
        const py = cy + Math.sin(spiralAngle) * (spiralR + wobble) * 0.45;

        const depth = 0.1 + pNorm * 0.9;
        const pulse = 0.5 + Math.sin(t * 2 + p * 0.3 + arm * 1.2) * 0.4;
        const alpha = pulse * depth * 0.85;
        const size = (2.5 + pulse * 6) * (0.3 + depth * 0.7);

        const trailCount = 5;
        for (let tr = trailCount; tr >= 1; tr--) {
          const trP = pNorm - tr * 0.012;
          if (trP < 0) continue;
          const trAngle = armOffset + trP * Math.PI * 6 + vr + arm * 0.5;
          const trR = maxR * (0.03 + trP * 0.97);
          const trAlpha = alpha * (1 - tr / trailCount) * 0.35;
          const trSize = size * (1 - tr / trailCount) * 0.5;

          const trx = cx + Math.cos(trAngle) * trR;
          const try_ = cy + Math.sin(trAngle) * trR * 0.45;

          ctx.beginPath();
          ctx.arc(trx, try_, trSize, 0, Math.PI * 2);
          ctx.fillStyle = `${c.trail}${trAlpha})`;
          ctx.fill();
        }

        const pg = ctx.createRadialGradient(px, py, 0, px, py, size * 4);
        pg.addColorStop(0, `${c.mid}${alpha})`);
        pg.addColorStop(0.3, `${c.mid}${alpha * 0.5})`);
        pg.addColorStop(1, 'rgba(100,50,200,0)');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, size * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `${c.core}${alpha})`;
        ctx.fill();
      }

      for (let s = 0; s < 40; s++) {
        const sP = s / 40;
        const sAngle = armOffset + sP * Math.PI * 6 + vr + arm * 0.5;
        const sR = maxR * (0.03 + sP * 0.97);
        const sx = cx + Math.cos(sAngle) * sR;
        const sy = cy + Math.sin(sAngle) * sR * 0.45;
        const sAlpha = 0.1 * (1 - sP * 0.6);

        if (s < 39) {
          const sP2 = (s + 1) / 40;
          const sAngle2 = armOffset + sP2 * Math.PI * 6 + vr + arm * 0.5;
          const sR2 = maxR * (0.03 + sP2 * 0.97);
          const sx2 = cx + Math.cos(sAngle2) * sR2;
          const sy2 = cy + Math.sin(sAngle2) * sR2 * 0.45;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx2, sy2);
          ctx.strokeStyle = `${c.line}${sAlpha})`;
          ctx.lineWidth = 1.5 + (1 - sP) * 2;
          ctx.stroke();
        }
      }
    }

    for (let ring = 0; ring < RING_COUNT; ring++) {
      const ringNorm = ring / (RING_COUNT - 1);
      const ringR = maxR * (0.05 + ringNorm * 0.95);
      const ringDepth = 0.2 + ringNorm * 0.8;

      for (let p = 0; p < RING_PARTICLES; p++) {
        const pAngle = (p / RING_PARTICLES) * Math.PI * 2 + vr + ring * 0.3;
        const wobble = Math.sin(p * 3 + t * 3 + ring) * ringR * 0.05;

        const px = cx + Math.cos(pAngle) * (ringR + wobble);
        const py = cy + Math.sin(pAngle) * (ringR + wobble) * 0.45;

        const pulse = 0.5 + Math.sin(t * 2 + p * 0.5 + ring * 0.8) * 0.4;
        const alpha = pulse * ringDepth * 0.5;
        const size = (1.5 + pulse * 3) * (0.3 + ringDepth * 0.7);

        const rg = ctx.createRadialGradient(px, py, 0, px, py, size * 3);
        rg.addColorStop(0, `${c.mid}${alpha})`);
        rg.addColorStop(0.5, `${c.mid}${alpha * 0.3})`);
        rg.addColorStop(1, 'rgba(80,40,160,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(px, py, size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `${c.core}${alpha * 0.85})`;
        ctx.fill();
      }
    }

    for (let r = 0; r < 8; r++) {
      const rAngle = r * (Math.PI * 2 / 8) + vr;
      const rRadius = maxR * (0.04 + Math.sin(t * 2 + r) * 0.015);
      const rx = cx + Math.cos(rAngle) * rRadius;
      const ry = cy + Math.sin(rAngle) * rRadius * 0.45;
      const rr = 2.5 + Math.sin(t * 3 + r * 2) * 1;
      const ro = 0.3 + Math.sin(t * 2 + r) * 0.15;

      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fillStyle = `${c.glow}${ro})`;
      ctx.fill();
    }

    const cGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.2);
    cGlow.addColorStop(0, `${c.glow}${0.18 + Math.sin(t * 2) * 0.07})`);
    cGlow.addColorStop(0.4, `${c.mid}${0.1 + Math.sin(t * 2) * 0.04})`);
    cGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.2, 0, Math.PI * 2);
    ctx.fill();

  }, [frame, width, height, totalFrames, speed, t]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: c.bg3 }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};
