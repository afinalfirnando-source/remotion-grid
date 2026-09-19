import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface FlowingLinesProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: LinesScheme;
}

export type LinesScheme = 'mono' | 'cyan' | 'gold' | 'neon' | 'mint';

const schemes: Record<LinesScheme, {
  bg: string;
  line: [number, number, number];
}> = {
  mono: { bg: '#000000', line: [255, 255, 255] },
  cyan: { bg: '#020a10', line: [80, 220, 255] },
  gold: { bg: '#0a0600', line: [255, 200, 60] },
  neon: { bg: '#0a000a', line: [255, 60, 200] },
  mint: { bg: '#000a06', line: [80, 255, 160] },
};

const PI2 = Math.PI * 2;

const FlowingLines: React.FC<FlowingLinesProps> = ({
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

    // Line parameters: each has position, depth layer, wave params
    const lines: Array<{
      x: number;
      layer: number;       // 0=far(blur), 1=mid, 2=near(sharp)
      waveAmp: number;
      waveFreq: number;
      waveSpeed: number;   // integer multiplier of t
      wavePhase: number;
      thickness: number;
      opacity: number;
    }> = [];

    const totalLines = 65;
    for (let i = 0; i < totalLines; i++) {
      const nx = i / (totalLines - 1); // 0..1 across width
      // 3 depth layers: far=0(0-25%), mid=1(25-70%), near=2(70-100%)
      let layer: number, thickness: number, opacity: number;
      if (i < totalLines * 0.25) {
        layer = 0; thickness = 0.4; opacity = 0.35;
      } else if (i < totalLines * 0.70) {
        layer = 1; thickness = 0.7; opacity = 0.65;
      } else {
        layer = 2; thickness = 1.0; opacity = 0.95;
      }
      lines.push({
        x: nx,
        layer,
        waveAmp: 0.012 + Math.random() * 0.015,
        waveFreq: 2.0 + Math.random() * 2.5,
        waveSpeed: 1 + ((i * 3) % 3), // integer: 1, 2, or 3
        wavePhase: (i * 0.7) % PI2,
        thickness,
        opacity,
      });
    }

    // Slow global drift (loops)
    const globalDrift = Math.sin(t) * 0.015;

    for (let py = 0; py < sh; py++) {
      for (let px = 0; px < sw; px++) {
        const idx = (py * sw + px) * 4;
        const nx = px / sw;
        const ny = py / sh;

        let r = 0, g = 0, b = 0;

        for (let li = 0; li < lines.length; li++) {
          const ln = lines[li];

          // Wave displacement (integer t multipliers → seamless loop)
          const disp =
            Math.sin(ny * ln.waveFreq * PI2 + t * ln.waveSpeed + ln.wavePhase) * ln.waveAmp +
            Math.sin(ny * 1.5 * PI2 - t * 2 + ln.x * 4) * 0.004 +
            globalDrift;

          const lineX = ln.x + disp;
          const dist = Math.abs(nx - lineX);

          // Gaussian profile for soft line rendering
          const sigma = ln.layer === 0 ? 0.004 : ln.layer === 1 ? 0.0025 : 0.0015;
          const gauss = Math.exp(-(dist * dist) / (2 * sigma * sigma));
          const contribution = gauss * ln.opacity;

          r += contribution * sc.line[0];
          g += contribution * sc.line[1];
          b += contribution * sc.line[2];
        }

        d[idx] = Math.min(255, r | 0);
        d[idx + 1] = Math.min(255, g | 0);
        d[idx + 2] = Math.min(255, b | 0);
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

export { FlowingLines };
