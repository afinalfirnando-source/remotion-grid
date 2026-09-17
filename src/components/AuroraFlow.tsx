import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type AuroraFlowScheme = 'neon' | 'sunset' | 'arctic' | 'forest' | 'golden';

interface AuroraFlowProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: AuroraFlowScheme;
}

const palettes: Record<AuroraFlowScheme, {
  bg: string;
  blue: [number, number, number];
  magenta: [number, number, number];
  highlight: [number, number, number];
  cyan: [number, number, number];
  warm: [number, number, number];
  glow1: string;
  glow2: string;
}> = {
  neon: {
    bg: '#08001a',
    blue: [50, 15, 200], magenta: [230, 30, 180], highlight: [255, 180, 240],
    cyan: [30, 210, 230], warm: [255, 100, 60],
    glow1: 'rgba(200,60,180,0.12)', glow2: 'rgba(40,200,220,0.08)',
  },
  sunset: {
    bg: '#1a0800',
    blue: [80, 20, 60], magenta: [220, 60, 40], highlight: [255, 200, 120],
    cyan: [200, 120, 40], warm: [255, 160, 30],
    glow1: 'rgba(220,80,40,0.12)', glow2: 'rgba(255,180,40,0.08)',
  },
  arctic: {
    bg: '#001020',
    blue: [10, 40, 100], magenta: [40, 140, 200], highlight: [180, 230, 255],
    cyan: [60, 220, 255], warm: [200, 240, 255],
    glow1: 'rgba(60,160,220,0.12)', glow2: 'rgba(100,230,255,0.08)',
  },
  forest: {
    bg: '#001a08',
    blue: [10, 60, 30], magenta: [30, 180, 80], highlight: [160, 255, 180],
    cyan: [40, 200, 140], warm: [120, 220, 60],
    glow1: 'rgba(40,180,80,0.12)', glow2: 'rgba(80,220,120,0.08)',
  },
  golden: {
    bg: '#1a1000',
    blue: [80, 40, 10], magenta: [200, 120, 20], highlight: [255, 230, 140],
    cyan: [220, 180, 40], warm: [255, 200, 60],
    glow1: 'rgba(220,140,20,0.12)', glow2: 'rgba(255,200,60,0.08)',
  },
};

const AuroraFlow: React.FC<AuroraFlowProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'neon',
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const pal = palettes[scheme];

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

    for (let py = 0; py < sh; py++) {
      for (let px = 0; px < sw; px++) {
        const idx = (py * sw + px) * 4;
        const nx = px / sw;
        const ny = py / sh;

        const w1 = Math.sin(nx * 2.5 + t) * 0.25;
        const w2 = Math.sin(nx * 1.8 - ny * 2.5 + t) * 0.2;
        const w3 = Math.cos(nx * 3 + ny * 1.5 + t) * 0.18;
        const w4 = Math.sin(ny * 3 + nx * 2 + t) * 0.15;

        const vertWarp = Math.sin(ny * Math.PI * 0.8 + w1 + w2) * 0.15;

        const dx = nx + w1 * 0.6 + w3 * 0.4;
        const dy = ny + vertWarp + w4 * 0.3;

        const bluePurple = Math.pow(Math.max(0, 1 - dx * 1.8), 1.2);
        const magBand = Math.exp(-Math.pow((dx - 0.35 + Math.sin(dy * 2 + t) * 0.08) * 5, 2));
        const pinkHighlight = Math.pow(Math.exp(-Math.pow((dx - 0.5 + w2 * 0.3) * 4, 2)), 1.5);
        const cyan = Math.pow(Math.max(0, (dx - 0.55) * 2.2), 1.1);
        const warm = Math.pow(Math.max(0, 1 - dy * 1.3), 2) *
          Math.exp(-Math.pow((dx - 0.4) * 3, 2)) * 0.35;

        const vSoft = 0.75 + Math.sin(dy * Math.PI) * 0.25;

        const p = pal.blue;
        const m = pal.magenta;
        const h = pal.highlight;
        const c = pal.cyan;
        const w = pal.warm;

        let r = (bluePurple * p[0] + magBand * m[0] + pinkHighlight * h[0] + cyan * c[0] + warm * w[0]) * vSoft;
        let g = (bluePurple * p[1] + magBand * m[1] + pinkHighlight * h[1] + cyan * c[1] + warm * w[1]) * vSoft;
        let b = (bluePurple * p[2] + magBand * m[2] + pinkHighlight * h[2] + cyan * c[2] + warm * w[2]) * vSoft;

        data[idx] = Math.min(255, Math.max(0, r));
        data[idx + 1] = Math.min(255, Math.max(0, g));
        data[idx + 2] = Math.min(255, Math.max(0, b));
        data[idx + 3] = 255;
      }
    }

    octx.putImageData(imageData, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, width, height);

    ctx.globalCompositeOperation = 'screen';
    const g1 = ctx.createRadialGradient(
      width * 0.35, height * 0.45, 0,
      width * 0.35, height * 0.45, width * 0.35
    );
    g1.addColorStop(0, pal.glow1);
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, width, height);

    const g2 = ctx.createRadialGradient(
      width * 0.7, height * 0.5, 0,
      width * 0.7, height * 0.5, width * 0.3
    );
    g2.addColorStop(0, pal.glow2);
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'source-over';

  }, [frame, width, height, totalFrames, speed, t, pal]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { AuroraFlow };
