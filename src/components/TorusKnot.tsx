import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

interface TorusKnotProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function dot3(a: number[], b: number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross3(a: number[], b: number[]): number[] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function normalize3(v: number[]): number[] {
  const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return l === 0 ? [0, 0, 1] : [v[0] / l, v[1] / l, v[2] / l];
}

const KNOT_R = 3.2;
const TUBE_R = 0.7;

function centerPoint(phi: number): number[] {
  const p = 2, q = 3;
  return [
    (KNOT_R + TUBE_R * Math.cos(q * phi)) * Math.cos(p * phi),
    (KNOT_R + TUBE_R * Math.cos(q * phi)) * Math.sin(p * phi),
    TUBE_R * Math.sin(q * phi),
  ];
}

function frenetFrame(phi: number): { T: number[]; N: number[]; B: number[] } {
  const eps = 0.001;
  const c = centerPoint(phi);
  const cNext = centerPoint(phi + eps);
  const T = normalize3([cNext[0] - c[0], cNext[1] - c[1], cNext[2] - c[2]]);
  const cPrev = centerPoint(phi - eps);
  const d2 = [cNext[0] - 2 * c[0] + cPrev[0], cNext[1] - 2 * c[1] + cPrev[1], cNext[2] - 2 * c[2] + cPrev[2]];
  let N = normalize3([d2[0] - dot3(T, d2) * T[0], d2[1] - dot3(T, d2) * T[1], d2[2] - dot3(T, d2) * T[2]]);
  if (dot3(N, N) < 0.001) N = [1, 0, 0];
  const B = cross3(T, N);
  return { T, N: normalize3(N), B: normalize3(B) };
}

function surfacePoint(u: number, v: number): number[] {
  const phi = u * Math.PI * 2;
  const theta = v * Math.PI * 2;
  const center = centerPoint(phi);
  const frame = frenetFrame(phi);
  const cr = Math.cos(theta), sr = Math.sin(theta);
  return [
    center[0] + TUBE_R * cr * frame.N[0] + TUBE_R * sr * frame.B[0],
    center[1] + TUBE_R * cr * frame.N[1] + TUBE_R * sr * frame.B[1],
    center[2] + TUBE_R * cr * frame.N[2] + TUBE_R * sr * frame.B[2],
  ];
}

function project(x: number, y: number, z: number, ry: number, rx: number, w: number, h: number): number[] {
  const cY = Math.cos(ry), sY = Math.sin(ry);
  let x1 = x * cY + z * sY;
  let z1 = -x * sY + z * cY;
  const cX = Math.cos(rx), sX = Math.sin(rx);
  let y1 = y * cX - z1 * sX;
  let z2 = y * sX + z1 * cX;
  z2 += 7.5;
  if (z2 < 0.1) z2 = 0.1;
  const fov = 750;
  const scale = fov / z2;
  return [w / 2 + x1 * scale, h / 2 + y1 * scale, z2];
}

const U_SEGS = 140;
const V_SEGS = 24;

const TorusKnot: React.FC<TorusKnotProps> = ({
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

    const bg = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.6);
    bg.addColorStop(0, '#0a1508');
    bg.addColorStop(0.6, '#050a04');
    bg.addColorStop(1, '#010201');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const rotY = t * 2;
    const rotX = 0.25 + Math.sin(t * 2) * 0.15;

    const l1 = normalize3([0.5, -0.7, 0.8]);
    const l2 = normalize3([-0.4, 0.3, 0.6]);

    type Face = {
      p: number[][];
      depth: number;
      bright: number;
      uCoord: number;
      tileId: number;
    };

    const faces: Face[] = [];

    for (let i = 0; i < U_SEGS; i++) {
      for (let j = 0; j < V_SEGS; j++) {
        const u1 = i / U_SEGS, u2 = (i + 1) / U_SEGS;
        const v1 = j / V_SEGS, v2 = (j + 1) / V_SEGS;

        const a = surfacePoint(u1, v1);
        const b = surfacePoint(u2, v1);
        const c = surfacePoint(u2, v2);
        const d = surfacePoint(u1, v2);

        const makeTri = (v0: number[], v1t: number[], v2t: number[], u: number, tid: number) => {
          const e1 = [v1t[0] - v0[0], v1t[1] - v0[1], v1t[2] - v0[2]];
          const e2 = [v2t[0] - v0[0], v2t[1] - v0[1], v2t[2] - v0[2]];
          const n = normalize3(cross3(e1, e2));
          const bright = clamp(dot3(n, l1) * 0.6 + dot3(n, l2) * 0.4, 0.06, 1);
          const pa = project(v0[0], v0[1], v0[2], rotY, rotX, width, height);
          const pb = project(v1t[0], v1t[1], v1t[2], rotY, rotX, width, height);
          const pc = project(v2t[0], v2t[1], v2t[2], rotY, rotX, width, height);
          faces.push({ p: [pa, pb, pc], depth: (pa[2] + pb[2] + pc[2]) / 3, bright, uCoord: u, tileId: tid });
        };

        makeTri(a, b, c, u1, i * V_SEGS + j);
        makeTri(a, c, d, u1, i * V_SEGS + j + 0.5);
      }
    }

    faces.sort((a, b) => b.depth - a.depth);

    for (const f of faces) {
      const shimmer = Math.sin(f.uCoord * 14 + t * 3) * 0.2;
      const tileVar = (Math.sin(f.tileId * 7.31) * 0.5 + 0.5) * 0.12;
      const b = clamp(f.bright + shimmer + tileVar, 0, 1);

      const r = Math.round(lerp(5, 45, b));
      const g = Math.round(lerp(25, 235, b));
      const bl = Math.round(lerp(10, 55, b));

      ctx.beginPath();
      ctx.moveTo(f.p[0][0], f.p[0][1]);
      ctx.lineTo(f.p[1][0], f.p[1][1]);
      ctx.lineTo(f.p[2][0], f.p[2][1]);
      ctx.closePath();
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 0.3;
      ctx.stroke();
    }

    for (const f of faces) {
      if (f.bright > 0.65) {
        const cx = (f.p[0][0] + f.p[1][0] + f.p[2][0]) / 3;
        const cy = (f.p[0][1] + f.p[1][1] + f.p[2][1]) / 3;
        const pulse = 0.3 + Math.sin(t * 4 + f.uCoord * 10) * 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,255,210,${0.35 * pulse})`;
        ctx.fill();
      }
    }
  }, [frame, width, height, totalFrames, speed, t]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: '#010201' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export default TorusKnot;
