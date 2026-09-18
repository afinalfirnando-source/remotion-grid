import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface WireWaveProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: WireScheme;
}

export type WireScheme = 'mono' | 'ember' | 'abyss' | 'mint' | 'royal';

const PI2 = Math.PI * 2;

// Wave height — integer multipliers only for seamless loop
// variant shifts the wave character per scheme
function waveH(x: number, y: number, t: number, v: number): number {
  const a = 1 + v * 0.12;
  const b = 2 + (v % 3);
  const c = 1 + ((v + 1) % 3);
  const d = 2 + ((v + 2) % 2);
  return (
    Math.sin(x * 2.2 + t * 2 + v) * 0.34 * a
    + Math.sin(y * 2.8 - t * b + 1.2 + v * 0.7) * 0.28
    + Math.sin((x + y) * 1.6 + t * c + 2.4) * 0.22
    + Math.sin((x - y) * 2.4 - t * d + 0.6 + v) * 0.16
  );
}

const schemes: Record<WireScheme, {
  bg0: string; bg1: string; div: string;
  line: [number, number, number];
  glow: string;
  wave: number;
}> = {
  mono: {
    bg0: '#000000', bg1: '#000000', div: '#000000',
    line: [235, 238, 245], glow: 'rgba(255,255,255,0)',
    wave: 0,
  },
  ember: {
    bg0: '#160604', bg1: '#050201', div: '#0a0301',
    line: [255, 150, 70], glow: 'rgba(255,110,30,0.10)',
    wave: 1,
  },
  abyss: {
    bg0: '#041a24', bg1: '#010a10', div: '#020d14',
    line: [90, 220, 250], glow: 'rgba(0,180,220,0.10)',
    wave: 2,
  },
  mint: {
    bg0: '#04180e', bg1: '#010a05', div: '#020d06',
    line: [110, 250, 160], glow: 'rgba(40,220,110,0.10)',
    wave: 3,
  },
  royal: {
    bg0: '#120826', bg1: '#050310', div: '#0a0518',
    line: [190, 140, 255], glow: 'rgba(140,80,255,0.10)',
    wave: 4,
  },
};

const WireWave: React.FC<WireWaveProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'mono',
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * PI2 * speed;
  const pal = schemes[scheme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background motif per scheme
    const bg = ctx.createRadialGradient(
      width * 0.5, height * 0.5, 0,
      width * 0.5, height * 0.5, width * 0.6,
    );
    bg.addColorStop(0, pal.bg0);
    bg.addColorStop(1, pal.bg1);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Ambient glow wash
    if (pal.glow !== 'rgba(255,255,255,0)') {
      const wash = ctx.createRadialGradient(
        width * 0.5, height * 0.55, 0,
        width * 0.5, height * 0.55, width * 0.4,
      );
      wash.addColorStop(0, pal.glow);
      wash.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);
    }

    const NU = 46;
    const NV = 32;

    // Camera: rotate around Y then tilt around X — fixed angles
    const ry = -0.55;
    const rx = 0.62;
    const cosRy = Math.cos(ry);
    const sinRy = Math.sin(ry);
    const cosRx = Math.cos(rx);
    const sinRx = Math.sin(rx);

    const scale = Math.min(width, height) * 0.62;
    const persp = 3.2;
    const cx = width * 0.5;
    const cy = height * 0.56;

    // Project grid point to screen
    const project = (u: number, v: number): { x: number; y: number } => {
      const x = (u - 0.5) * 2.4;
      const y = (v - 0.5) * 1.7;
      const z = waveH(u * 3, v * 3, t, pal.wave) * 0.55;
      // Rotate Y
      const x1 = x * cosRy + z * sinRy;
      const z1 = -x * sinRy + z * cosRy;
      // Rotate X
      const y2 = y * cosRx - z1 * sinRx;
      const z2 = y * sinRx + z1 * cosRx;
      // Perspective
      const p = persp / (persp + z2);
      return { x: cx + x1 * scale * p, y: cy + y2 * scale * p };
    };

    ctx.lineWidth = Math.max(0.6, width / 2400);
    ctx.lineCap = 'round';

    const [lr, lg, lb] = pal.line;

    // Lines along U (varying u, fixed v)
    for (let j = 0; j <= NV; j++) {
      const v = j / NV;
      const depthFade = 0.25 + 0.75 * (j / NV);
      ctx.strokeStyle = `rgba(${lr},${lg},${lb},${0.42 * depthFade + 0.12})`;
      ctx.beginPath();
      for (let i = 0; i <= NU; i++) {
        const p = project(i / NU, v);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Lines along V (varying v, fixed u)
    for (let i = 0; i <= NU; i++) {
      const u = i / NU;
      const depthFade = 0.25 + 0.75 * (i / NU);
      ctx.strokeStyle = `rgba(${lr},${lg},${lb},${0.30 * depthFade + 0.08})`;
      ctx.beginPath();
      for (let j = 0; j <= NV; j++) {
        const p = project(u, j / NV);
        if (j === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.div }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { WireWave };
