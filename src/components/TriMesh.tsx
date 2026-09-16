import React, { useRef, useEffect, useMemo } from 'react';
import { useCurrentFrame } from 'remotion';

export type TriMeshScheme = 'ocean' | 'sunset' | 'neon';

interface TriMeshProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: TriMeshScheme;
}

const palettes: Record<TriMeshScheme, {
  bg: string;
  lights: [number, number, number, number][]; // x, y, r, g, b
  leftCol: [number, number, number];
  rightCol: [number, number, number];
}> = {
  ocean: {
    bg: '#000a1a',
    lights: [
      [0.5, 0.42, 60, 140, 255],
      [0.78, 0.38, 255, 120, 40],
      [0.2, 0.25, 160, 80, 255],
    ],
    leftCol: [25, 195, 235],
    rightCol: [245, 85, 45],
  },
  sunset: {
    bg: '#0f0008',
    lights: [
      [0.5, 0.4, 255, 100, 180],
      [0.75, 0.35, 255, 200, 60],
      [0.2, 0.3, 200, 60, 120],
    ],
    leftCol: [220, 60, 180],
    rightCol: [255, 200, 50],
  },
  neon: {
    bg: '#000810',
    lights: [
      [0.5, 0.42, 0, 255, 180],
      [0.75, 0.35, 0, 200, 255],
      [0.2, 0.25, 255, 0, 200],
    ],
    leftCol: [0, 220, 160],
    rightCol: [0, 180, 255],
  },
};

function seeded(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Vec3 = { x: number; y: number; z: number };
type Tri = { a: number; b: number; c: number };

const NUM_PTS = 220;
const NUM_EDGES = 4;
const TRIS_PER_PT = 3;

const TriMesh: React.FC<TriMeshProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'ocean',
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;
  const pal = palettes[scheme];

  const basePoints = useMemo(() => {
    const pts: Vec3[] = [];
    for (let i = 0; i < NUM_PTS; i++) {
      pts.push({
        x: seeded(i * 3 + 1) * 1.6 - 0.3,
        y: seeded(i * 3 + 2) * 1.6 - 0.3,
        z: seeded(i * 3 + 3) * 0.5,
      });
    }
    return pts;
  }, []);

  const { triangles, edges } = useMemo(() => {
    const tris: Tri[] = [];
    const edgeSet = new Set<string>();
    const edgeList: [number, number][] = [];
    const triSet = new Set<string>();

    for (let i = 0; i < NUM_PTS; i++) {
      const pi = basePoints[i];
      const dists: { idx: number; d: number }[] = [];
      for (let j = 0; j < NUM_PTS; j++) {
        if (i === j) continue;
        const pj = basePoints[j];
        const dx = pi.x - pj.x, dy = pi.y - pj.y;
        dists.push({ idx: j, d: dx * dx + dy * dy });
      }
      dists.sort((a, b) => a.d - b.d);

      for (let k = 0; k < Math.min(NUM_EDGES, dists.length); k++) {
        const j = dists[k].idx;
        const ek = Math.min(i, j) + '-' + Math.max(i, j);
        if (!edgeSet.has(ek)) {
          edgeSet.add(ek);
          edgeList.push([i, j]);
        }
      }
      for (let k = 0; k < Math.min(TRIS_PER_PT, dists.length - 1); k++) {
        const j = dists[k].idx;
        const l = dists[k + 1].idx;
        const tk = [i, j, l].sort((a, b) => a - b).join('-');
        if (!triSet.has(tk)) {
          triSet.add(tk);
          tris.push({ a: i, b: j, c: l });
        }
      }
    }
    return { triangles: tris, edges: edgeList };
  }, [basePoints]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Background from palette
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, width, height);

    // Light sources from palette
    for (const [lx, ly, lr, lg, lb] of pal.lights) {
      const lgGrad = ctx.createRadialGradient(width * lx, height * ly, 0, width * lx, height * ly, width * 0.4);
      lgGrad.addColorStop(0, `rgba(${lr},${lg},${lb},0.18)`);
      lgGrad.addColorStop(0.5, `rgba(${lr},${lg},${lb},0.06)`);
      lgGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = lgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // Animate points (all integer multipliers of t)
    const pts: Vec3[] = basePoints.map((p, i) => ({
      x: p.x + Math.sin(t * 2 + i * 0.7) * 0.01 + Math.cos(t + i * 1.1) * 0.006,
      y: p.y + Math.cos(t * 2 + i * 0.5) * 0.01 + Math.sin(t * 3 + i * 0.9) * 0.006,
      z: p.z + Math.sin(t + i * 0.4) * 0.02,
    }));

    const px = (v: Vec3) => v.x * width;
    const py = (v: Vec3) => v.y * height;

    // Depth factor
    const depthOf = (z: number) => Math.max(0.2, Math.min(1, 0.55 + z * 0.9));

    // Color from x position using palette
    const colAt = (x: number, depth: number) => {
      const n = Math.max(0, Math.min(1, (x + 0.3) / 1.6));
      const [lr, lg, lb] = pal.leftCol;
      const [rr, rg, rb] = pal.rightCol;
      return {
        r: Math.round((lr + n * (rr - lr)) * depth),
        g: Math.round((lg + n * (rg - lg)) * depth),
        b: Math.round((lb + n * (rb - lb)) * depth),
      };
    };

    // Sort triangles back-to-front
    const sorted = [...triangles].sort((a, b) => {
      const az = (pts[a.a].z + pts[a.b].z + pts[a.c].z) / 3;
      const bz = (pts[b.a].z + pts[b.b].z + pts[b.c].z) / 3;
      return az - bz;
    });

    // Draw triangles
    for (const tri of sorted) {
      const pa = pts[tri.a], pb = pts[tri.b], pc = pts[tri.c];
      const cx = (pa.x + pb.x + pc.x) / 3;
      const cy = (pa.y + pb.y + pc.y) / 3;
      const cz = (pa.z + pb.z + pc.z) / 3;
      const depth = depthOf(cz);
      const col = colAt(cx, depth);

      // Simple shading by triangle area
      const area = Math.abs((pb.x - pa.x) * (pc.y - pa.y) - (pc.x - pa.x) * (pb.y - pa.y));
      const shade = Math.max(0.4, Math.min(1, area * 40 + 0.3));

      const r = Math.round(col.r * shade);
      const g = Math.round(col.g * shade);
      const b = Math.round(col.b * shade);
      const a = 0.55 * depth * shade;

      ctx.beginPath();
      ctx.moveTo(px(pa), py(pa));
      ctx.lineTo(px(pb), py(pb));
      ctx.lineTo(px(pc), py(pc));
      ctx.closePath();
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fill();
    }

    // Draw edges — maximum glow
    for (const [i, j] of edges) {
      const pa = pts[i], pb = pts[j];
      const avgX = (pa.x + pb.x) / 2;
      const avgZ = (pa.z + pb.z) / 2;
      const depth = depthOf(avgZ);
      const col = colAt(avgX, depth);

      // Layer 1: ultra wide soft glow
      ctx.beginPath();
      ctx.moveTo(px(pa), py(pa));
      ctx.lineTo(px(pb), py(pb));
      ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${depth * 0.08})`;
      ctx.lineWidth = 18;
      ctx.stroke();

      // Layer 2: very wide glow
      ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${depth * 0.16})`;
      ctx.lineWidth = 10;
      ctx.stroke();

      // Layer 3: wide glow
      ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${depth * 0.32})`;
      ctx.lineWidth = 5;
      ctx.stroke();

      // Layer 4: mid glow
      ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${depth * 0.55})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Layer 5: tight bright core
      ctx.strokeStyle = `rgba(${Math.min(255, col.r + 120)},${Math.min(255, col.g + 120)},${Math.min(255, col.b + 120)},${depth * 0.95})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Layer 6: white hot center
      ctx.strokeStyle = `rgba(255,255,255,${depth * 0.7})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    // Draw vertices with maximum glow
    for (const pt of pts) {
      const depth = depthOf(pt.z);
      const col = colAt(pt.x, depth);
      const sz = 1.6 + depth * 2;

      // Ultra wide glow
      ctx.beginPath();
      ctx.arc(px(pt), py(pt), sz * 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${depth * 0.08})`;
      ctx.fill();

      // Very wide glow
      ctx.beginPath();
      ctx.arc(px(pt), py(pt), sz * 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${depth * 0.18})`;
      ctx.fill();

      // Wide glow
      ctx.beginPath();
      ctx.arc(px(pt), py(pt), sz * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${depth * 0.35})`;
      ctx.fill();

      // Mid glow
      ctx.beginPath();
      ctx.arc(px(pt), py(pt), sz * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${depth * 0.55})`;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(px(pt), py(pt), sz, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.min(255, col.r + 60)},${Math.min(255, col.g + 60)},${Math.min(255, col.b + 60)},${depth})`;
      ctx.fill();

      // White hot center
      if (depth > 0.3) {
        ctx.beginPath();
        ctx.arc(px(pt), py(pt), sz * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(depth - 0.3) * 1.6})`;
        ctx.fill();
      }
    }
  }, [frame, width, height, totalFrames, speed, t, basePoints, triangles, edges, pal]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: pal.bg }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

export { TriMesh };
