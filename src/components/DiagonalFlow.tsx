import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface DiagonalFlowProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
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

const DiagonalFlow: React.FC<DiagonalFlowProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * PI2 * speed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Diagonal angle matching reference (~50 degrees)
    const angle = 0.87;
    ctx.fillStyle = '#d5d5da';
    ctx.fillRect(0, 0, width, height);

    // Draw stripes from back to front
    const stripeCount = 14;

    for (let s = 0; s < stripeCount; s++) {
      // Each stripe drifting — sin/cos for seamless loop
      const drift = Math.sin(t + s * 0.7) * 40;
      const driftY = Math.cos(t * 2 + s * 0.4) * 20;

      // Stripe position across the diagonal axis
      const centerFrac = (s + 0.5) / stripeCount;
      const stripeWidth = width * 0.09 + Math.sin(s * 2.3) * width * 0.02;

      // Base X position along the direction perpendicular to stripes
      const perpX = centerFrac * (width + height) - height * 0.3 + drift;

      ctx.save();
      ctx.translate(width / 2 + drift * 0.3, height / 2 + driftY * 0.3);
      ctx.rotate(-angle);
      ctx.translate(-width / 2, -height / 2);

      // Stripe Y position in rotated space
      const stripeY = centerFrac * height * 1.6 - height * 0.3 + drift * 0.5;

      // Stripe brightness varies — some brighter, some darker
      const bright = 232 + Math.sin(s * 1.9) * 14 + Math.sin(t + s) * 4;

      // Soft gradient stripe (like silk ribbon)
      const grad = ctx.createLinearGradient(0, stripeY - stripeWidth, 0, stripeY + stripeWidth);
      grad.addColorStop(0, 'rgba(200,200,208,0)');
      grad.addColorStop(0.25, `rgba(${bright - 18},${bright - 18},${bright - 12},0.75)`);
      grad.addColorStop(0.45, `rgba(${bright + 10},${bright + 10},${bright + 14},0.95)`);
      grad.addColorStop(0.55, `rgba(${bright + 14},${bright + 14},${bright + 18},1)`);
      grad.addColorStop(0.75, `rgba(${bright - 10},${bright - 10},${bright - 4},0.8)`);
      grad.addColorStop(1, 'rgba(200,200,208,0)');

      ctx.fillStyle = grad;
      ctx.fillRect(-width, stripeY - stripeWidth, width * 3, stripeWidth * 2);

      // Darker edge line on one side for depth (like reference)
      ctx.strokeStyle = `rgba(170,170,182,${0.25 + Math.abs(Math.sin(s * 1.3)) * 0.2})`;
      ctx.lineWidth = 2 + Math.abs(Math.sin(s * 2.1)) * 2;
      ctx.beginPath();
      ctx.moveTo(-width, stripeY + stripeWidth * 0.55);
      ctx.lineTo(width * 2, stripeY + stripeWidth * 0.55);
      ctx.stroke();

      // Bright highlight line on other side
      ctx.strokeStyle = `rgba(255,255,255,${0.3 + Math.abs(Math.cos(s * 1.7)) * 0.25})`;
      ctx.lineWidth = 1.5 + Math.abs(Math.cos(s * 2.7)) * 1.5;
      ctx.beginPath();
      ctx.moveTo(-width, stripeY - stripeWidth * 0.5);
      ctx.lineTo(width * 2, stripeY - stripeWidth * 0.5);
      ctx.stroke();

      ctx.restore();
    }

    // Overall soft blur via downscale-upscale
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = Math.floor(width * 0.4);
    blurCanvas.height = Math.floor(height * 0.4);
    const bctx = blurCanvas.getContext('2d');
    if (bctx) {
      bctx.imageSmoothingEnabled = true;
      bctx.drawImage(canvas, 0, 0, blurCanvas.width, blurCanvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(blurCanvas, 0, 0, width, height);
    }
  });

  return (
    <div style={{ width, height, overflow: 'hidden', background: '#d5d5da' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { DiagonalFlow };
