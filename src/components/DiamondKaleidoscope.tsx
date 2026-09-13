import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface DiamondKaleidoscopeProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
}

export const DiamondKaleidoscope: React.FC<DiamondKaleidoscopeProps> = ({
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

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0612';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const segments = 8;
    const segAngle = (Math.PI * 2) / segments;
    const dSize = Math.min(width, height) * 0.42;
    const rot = t * 5;
    const pulse = 1 + Math.sin(t * 2) * 0.04;

    const drawDiamond = (x: number, y: number, size: number, angle: number, fillColor: string, strokeColor: string, strokeW: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.6, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.6, 0);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeW;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    for (let i = 0; i < 50; i++) {
      const a = (i / 50) * Math.PI * 2 + t * 2;
      const d = Math.max(width, height) * 0.3 + Math.sin(t * 2 + i * 2) * 80;
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d;
      const r = Math.max(0.5, 0.6 + Math.sin(t * 2 + i * 2) * 0.4);
      const o = Math.max(0.08, 0.12 + Math.sin(t * 2 + i * 2) * 0.08);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(195,166,255,${o})`;
      ctx.fill();
    }

    for (let seg = 0; seg < segments; seg++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(seg * segAngle);

      const lineLen = Math.max(width, height) * 0.6;
      const la = seg * segAngle;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(la) * lineLen, Math.sin(la) * lineLen);
      ctx.strokeStyle = `rgba(123,47,247,${0.2 + Math.sin(t * 2 + seg * 2) * 0.1})`;
      ctx.lineWidth = 0.4;
      ctx.stroke();

      ctx.rotate(rot);
      ctx.scale(pulse, pulse);

      ctx.beginPath();
      ctx.moveTo(0, -dSize);
      ctx.lineTo(dSize * 0.6, 0);
      ctx.lineTo(0, dSize);
      ctx.lineTo(-dSize * 0.6, 0);
      ctx.closePath();
      ctx.fillStyle = `rgba(184,169,232,${0.06 + Math.sin(t * 2) * 0.03})`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(195,224,252,0.6)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const facets = [
        [0, -dSize, dSize * 0.6, 0],
        [0, -dSize, -dSize * 0.6, 0],
        [0, -dSize, dSize * 0.3, dSize * 0.5],
        [0, -dSize, -dSize * 0.3, dSize * 0.5],
        [dSize * 0.6, 0, 0, dSize],
        [-dSize * 0.6, 0, 0, dSize],
        [dSize * 0.3, dSize * 0.5, 0, dSize],
        [-dSize * 0.3, dSize * 0.5, 0, dSize],
      ];
      ctx.strokeStyle = 'rgba(195,224,252,0.4)';
      ctx.lineWidth = 1;
      for (const [x1, y1, x2, y2] of facets) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2 + t * 2;
        const d = dSize * (0.4 + Math.sin(t * 2 + i * 2) * 0.35);
        const x = Math.cos(a) * d;
        const y = Math.sin(a) * d;
        const r = Math.max(0.8, 1.2 + Math.sin(t * 3 + i * 2) * 1.5);
        const o = Math.max(0.15, 0.4 + Math.sin(t * 4 + i * 2) * 0.4);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${o})`;
        ctx.fill();
      }

      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 - t * 3;
        const d = dSize * (0.2 + Math.sin(t * 4 + i * 2) * 0.12);
        const x = Math.cos(a) * d;
        const y = Math.sin(a) * d;
        const r = Math.max(0.4, 0.8 + Math.sin(t * 2 + i * 2) * 0.8);
        const o = Math.max(0.12, 0.35 + Math.sin(t * 2 + i * 2) * 0.3);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(195,224,252,${o})`;
        ctx.fill();
      }

      ctx.restore();
    }

    const smallDiamonds = [
      { orbit: 0.55, angleOff: 0, size: 0.06, speedMul: 2, phaseMul: 1 },
      { orbit: 0.55, angleOff: Math.PI / 4, size: 0.05, speedMul: -2, phaseMul: 2 },
      { orbit: 0.65, angleOff: Math.PI / 2, size: 0.045, speedMul: 3, phaseMul: 1 },
      { orbit: 0.65, angleOff: Math.PI * 3 / 4, size: 0.055, speedMul: -3, phaseMul: 2 },
      { orbit: 0.75, angleOff: Math.PI, size: 0.04, speedMul: 2, phaseMul: 3 },
      { orbit: 0.75, angleOff: Math.PI * 5 / 4, size: 0.05, speedMul: -2, phaseMul: 3 },
      { orbit: 0.85, angleOff: Math.PI * 3 / 2, size: 0.035, speedMul: 4, phaseMul: 1 },
      { orbit: 0.85, angleOff: Math.PI * 7 / 4, size: 0.045, speedMul: -4, phaseMul: 2 },
      { orbit: 0.5, angleOff: Math.PI / 6, size: 0.03, speedMul: 3, phaseMul: 2 },
      { orbit: 0.5, angleOff: Math.PI * 5 / 6, size: 0.035, speedMul: -3, phaseMul: 1 },
      { orbit: 0.6, angleOff: Math.PI * 7 / 6, size: 0.025, speedMul: 4, phaseMul: 3 },
      { orbit: 0.6, angleOff: Math.PI * 11 / 6, size: 0.03, speedMul: -4, phaseMul: 3 },
      { orbit: 0.9, angleOff: Math.PI / 3, size: 0.025, speedMul: 2, phaseMul: 1 },
      { orbit: 0.9, angleOff: Math.PI * 2 / 3, size: 0.02, speedMul: -2, phaseMul: 2 },
      { orbit: 0.95, angleOff: Math.PI * 4 / 3, size: 0.022, speedMul: 3, phaseMul: 1 },
      { orbit: 0.95, angleOff: Math.PI * 5 / 3, size: 0.018, speedMul: -3, phaseMul: 2 },
    ];

    for (const sd of smallDiamonds) {
      const orbitDist = dSize * sd.orbit;
      const orbAngle = sd.angleOff + t * sd.speedMul;
      const sx = Math.cos(orbAngle) * orbitDist;
      const sy = Math.sin(orbAngle) * orbitDist;
      const sz = Math.min(width, height) * sd.size;
      const sRot = t * 4 * (sd.speedMul > 0 ? 1 : -1);
      const sPulse = 0.8 + Math.sin(t * 2 * sd.phaseMul) * 0.2;
      const sOpacity = 0.3 + Math.sin(t * 2 * sd.phaseMul) * 0.25;

      drawDiamond(sx, sy, sz * sPulse, sRot, 'rgba(184,169,232,0.15)', 'rgba(195,224,252,0.7)', 1.5, sOpacity);
    }

  }, [frame, width, height, totalFrames, speed, t]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: '#0a0612' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};
