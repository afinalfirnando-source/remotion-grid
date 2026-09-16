import React, { useRef, useEffect, useMemo } from 'react';
import { useCurrentFrame } from 'remotion';

interface FiberOpticProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
}

function seeded(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const NUM_STRANDS = 250;
const NUM_BOKEH = 100;

const FiberOptic: React.FC<FiberOpticProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;

  const strands = useMemo(() => {
    return Array.from({ length: NUM_STRANDS }, (_, i) => {
      const spreadAngle = seeded(i * 7 + 1) * Math.PI * 1.0 + Math.PI * 0.5;
      const length = 0.5 + seeded(i * 7 + 2) * 0.6;
      const baseX = 0.3 + seeded(i * 7 + 3) * 0.4;
      const baseY = 1.05 + seeded(i * 7 + 4) * 0.2;
      const thickness = 1.5 + seeded(i * 7 + 5) * 3;
      const wobble = seeded(i * 7 + 6) * 0.06;
      const speedMul = 1 + Math.floor(seeded(i * 7 + 7) * 3); // integer: 1,2,3
      const hue = seeded(i * 7 + 8);
      const brightness = 0.7 + seeded(i * 7 + 9) * 0.3;
      return { spreadAngle, length, baseX, baseY, thickness, wobble, speedMul, hue, brightness };
    });
  }, []);

  const bokehs = useMemo(() => {
    return Array.from({ length: NUM_BOKEH }, (_, i) => ({
      x: 0.08 + seeded(i * 11 + 1) * 0.84,
      y: 0.03 + seeded(i * 11 + 2) * 0.75,
      size: 8 + seeded(i * 11 + 3) * 25,
      hue: seeded(i * 11 + 4),
      pulseSpeed: 1 + Math.floor(seeded(i * 11 + 5) * 3),
      pulsePhase: seeded(i * 11 + 6) * Math.PI * 2,
      drift: seeded(i * 11 + 7) * 0.015,
      brightness: 0.5 + seeded(i * 11 + 8) * 0.5,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#020012';
    ctx.fillRect(0, 0, width, height);

    // Ambient glow from bottom center
    const amb = ctx.createRadialGradient(width * 0.5, height * 1.2, 0, width * 0.5, height * 1.2, width * 0.8);
    amb.addColorStop(0, 'rgba(160,80,255,0.25)');
    amb.addColorStop(0.3, 'rgba(120,60,220,0.12)');
    amb.addColorStop(0.6, 'rgba(80,40,180,0.05)');
    amb.addColorStop(1, 'transparent');
    ctx.fillStyle = amb;
    ctx.fillRect(0, 0, width, height);

    // Additional blue-purple haze
    const haze = ctx.createRadialGradient(width * 0.45, height * 0.6, 0, width * 0.45, height * 0.6, width * 0.5);
    haze.addColorStop(0, 'rgba(100,60,200,0.08)');
    haze.addColorStop(1, 'transparent');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);

    // Draw strands (back to front by length)
    const sortedStrands = [...strands].sort((a, b) => a.length - b.length);

    for (const s of sortedStrands) {
      const tAnim = t * s.speedMul;
      const wobX = Math.sin(tAnim * 2 + s.hue * 10) * s.wobble * width;
      const wobX2 = Math.cos(tAnim * 3 + s.hue * 8) * s.wobble * width * 0.4;

      const bx = s.baseX * width + wobX;
      const by = s.baseY * height;
      const tipX = bx + Math.cos(s.spreadAngle) * s.length * height + wobX2;
      const tipY = by + Math.sin(s.spreadAngle) * s.length * height;

      let red: number, grn: number, blu: number;
      if (s.hue < 0.25) {
        red = 40; grn = 120; blu = 255;
      } else if (s.hue < 0.5) {
        red = 160; grn = 60; blu = 255;
      } else if (s.hue < 0.75) {
        red = 240; grn = 80; blu = 220;
      } else {
        red = 255; grn = 140; blu = 200;
      }

      const bright = s.brightness;

      // Strand outer glow (wide)
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = `rgba(${red},${grn},${blu},${bright * 0.08})`;
      ctx.lineWidth = s.thickness * 8;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Strand mid glow
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = `rgba(${red},${grn},${blu},${bright * 0.2})`;
      ctx.lineWidth = s.thickness * 4;
      ctx.stroke();

      // Strand body — gradient from dim to bright
      const grad = ctx.createLinearGradient(bx, by, tipX, tipY);
      grad.addColorStop(0, `rgba(${Math.round(red * 0.1)},${Math.round(grn * 0.1)},${Math.round(blu * 0.1)},0)`);
      grad.addColorStop(0.3, `rgba(${Math.round(red * 0.5 * bright)},${Math.round(grn * 0.5 * bright)},${Math.round(blu * 0.5 * bright)},0.7)`);
      grad.addColorStop(0.85, `rgba(${Math.round(red * bright)},${Math.round(grn * bright)},${Math.round(blu * bright)},1)`);
      grad.addColorStop(1, `rgba(255,255,255,1)`);

      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = s.thickness;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Tip glow — very bright multi-layer
      const pulse = 0.8 + Math.sin(tAnim * 2 + s.hue * 5) * 0.2;
      const tipSz = s.thickness * 2 * pulse;

      // Ultra wide
      ctx.beginPath();
      ctx.arc(tipX, tipY, tipSz * 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${red},${grn},${blu},${bright * 0.06 * pulse})`;
      ctx.fill();

      // Wide
      ctx.beginPath();
      ctx.arc(tipX, tipY, tipSz * 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${red},${grn},${blu},${bright * 0.15 * pulse})`;
      ctx.fill();

      // Mid
      ctx.beginPath();
      ctx.arc(tipX, tipY, tipSz * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${red},${grn},${blu},${bright * 0.35 * pulse})`;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(tipX, tipY, tipSz * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${bright * 0.8 * pulse})`;
      ctx.fill();

      // Hot white center
      ctx.beginPath();
      ctx.arc(tipX, tipY, tipSz * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${bright * pulse})`;
      ctx.fill();
    }

    // Draw bokeh circles — bright and soft
    for (const b of bokehs) {
      const pulse = 0.5 + Math.sin(t * b.pulseSpeed + b.pulsePhase) * 0.5;
      const driftX = Math.sin(t * 2 + b.pulsePhase) * b.drift * width;
      const driftY = Math.cos(t * 2 + b.pulsePhase * 0.7) * b.drift * height * 0.5;
      const bx = b.x * width + driftX;
      const by = b.y * height + driftY;

      let red: number, grn: number, blu: number;
      if (b.hue < 0.25) {
        red = 60; grn = 140; blu = 255;
      } else if (b.hue < 0.5) {
        red = 180; grn = 80; blu = 255;
      } else if (b.hue < 0.75) {
        red = 255; grn = 120; blu = 240;
      } else {
        red = 255; grn = 180; blu = 220;
      }

      const sz = b.size * (0.7 + pulse * 0.3);
      const br = b.brightness;

      // Outer soft glow
      ctx.beginPath();
      ctx.arc(bx, by, sz * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${red},${grn},${blu},${br * 0.06 * pulse})`;
      ctx.fill();

      // Mid glow
      ctx.beginPath();
      ctx.arc(bx, by, sz * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${red},${grn},${blu},${br * 0.15 * pulse})`;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(bx, by, sz * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${red},${grn},${blu},${br * 0.35 * pulse})`;
      ctx.fill();

      // White center
      ctx.beginPath();
      ctx.arc(bx, by, sz * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${br * 0.5 * pulse})`;
      ctx.fill();
    }
  }, [frame, width, height, totalFrames, speed, t, strands, bokehs]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: '#020012' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { FiberOptic };
