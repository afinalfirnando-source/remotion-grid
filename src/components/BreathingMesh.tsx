import React, { useRef, useEffect } from 'react';
import { useCurrentFrame } from 'remotion';

export type BreathingScheme = 'blueOcean' | 'steel' | 'deepSea';

interface BreathingMeshProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: BreathingScheme;
}

const schemes: Record<BreathingScheme, {
  base: [number, number, number];
  peak: [number, number, number];
  shadow: [number, number, number];
  light: [number, number, number];
  bg1: string; bg2: string; bg3: string;
  name: string;
}> = {
  blueOcean: {
    base: [20, 80, 160],
    peak: [180, 240, 255],
    shadow: [5, 20, 50],
    light: [0.45, 0.55, 0.7],
    bg1: '#0a1628', bg2: '#061020', bg3: '#030810',
    name: 'Blue Ocean',
  },
  steel: {
    base: [100, 105, 115],
    peak: [230, 235, 245],
    shadow: [25, 28, 35],
    light: [0.5, 0.5, 0.55],
    bg1: '#181a20', bg2: '#101218', bg3: '#080a10',
    name: 'Steel',
  },
  deepSea: {
    base: [10, 70, 100],
    peak: [40, 220, 200],
    shadow: [2, 20, 35],
    light: [0.35, 0.6, 0.65],
    bg1: '#041418', bg2: '#021014', bg3: '#01080c',
    name: 'Deep Sea',
  },
};

const GRID_COLS = 42;
const GRID_ROWS = 26;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export const BreathingMesh: React.FC<BreathingMeshProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'blueOcean',
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (frame / totalFrames) * Math.PI * 2 * speed;
  const sc = schemes[scheme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, sc.bg1);
    bg.addColorStop(0.5, sc.bg2);
    bg.addColorStop(1, sc.bg3);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Grid spacing — full screen
    const marginX = -20;
    const marginY = -20;
    const spacingX = (width - marginX * 2) / (GRID_COLS - 1);
    const spacingY = (height - marginY * 2) / (GRID_ROWS - 1);

    // Camera sway
    const camSwayX = Math.sin(t * 2) * 6;
    const camSwayY = Math.cos(t * 3) * 3;

    // Light direction (normalized) — slightly from top-right
    const lightDir = normalize([sc.light[0], sc.light[1], 0.55]);

    // Compute heights for all grid points
    type Point = { x: number; y: number; z: number };
    const pts: Point[][] = [];

    for (let r = 0; r < GRID_ROWS; r++) {
      const row: Point[] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        const nx = (c / (GRID_COLS - 1)) * 2 - 1; // -1..1
        const ny = (r / (GRID_ROWS - 1)) * 2 - 1; // -1..1

        // Breathing waves — ALL integer multipliers of t for seamless loop
        const w1 = Math.sin(nx * 2.5 + t * 2) * 0.3;           // horizontal wave
        const w2 = Math.cos(ny * 2.0 + t * 3) * 0.25;          // vertical wave
        const w3 = Math.sin((nx + ny) * 1.8 + t * 2) * 0.18;   // diagonal wave
        const w4 = Math.cos((nx - ny) * 2.2 + t * 4) * 0.12;   // cross wave
        const dist = Math.sqrt(nx * nx + ny * ny);
        const w5 = Math.sin(dist * 3.0 - t * 2) * 0.2;         // radial wave
        const w6 = Math.cos(dist * 2.0 + t * 3) * 0.1;         // radial breathing

        // Edge falloff — lower near edges for depth
        const edgeFade = 1.0 - dist * 0.3;

        const z = (w1 + w2 + w3 + w4 + w5 + w6) * edgeFade;

        const px = marginX + c * spacingX + camSwayX;
        const py = marginY + r * spacingY + camSwayY;

        row.push({ x: px, y: py, z });
      }
      pts.push(row);
    }

    // Build triangles and sort by depth for painter's algorithm
    type Tri = {
      verts: [Point, Point, Point];
      depth: number;
      normal: [number, number, number];
      brightness: number;
      colIdx: number; // height index for color
    };

    const tris: Tri[] = [];

    for (let r = 0; r < GRID_ROWS - 1; r++) {
      for (let c = 0; c < GRID_COLS - 1; c++) {
        const tl = pts[r][c];
        const tr = pts[r][c + 1];
        const bl = pts[r + 1][c];
        const br = pts[r + 1][c + 1];

        // Triangle 1: tl → tr → bl
        const n1 = triangleNormal(tl, tr, bl);
        const b1 = clamp(dot(n1, lightDir), 0, 1);
        const avgZ1 = (tl.z + tr.z + bl.z) / 3;
        tris.push({
          verts: [tl, tr, bl],
          depth: avgZ1,
          normal: n1,
          brightness: b1,
          colIdx: avgZ1,
        });

        // Triangle 2: tr → br → bl
        const n2 = triangleNormal(tr, br, bl);
        const b2 = clamp(dot(n2, lightDir), 0, 1);
        const avgZ2 = (tr.z + br.z + bl.z) / 3;
        tris.push({
          verts: [tr, br, bl],
          depth: avgZ2,
          normal: n2,
          brightness: b2,
          colIdx: avgZ2,
        });
      }
    }

    // Sort by depth — farthest first (painter's algorithm)
    tris.sort((a, b) => a.depth - b.depth);

    // Draw triangles
    for (const tri of tris) {
      const [v0, v1, v2] = tri.verts;

      // Color based on height
      const hNorm = clamp((tri.colIdx + 0.4) / 0.8, 0, 1); // normalize height to 0..1
      let col: [number, number, number];
      if (hNorm < 0.5) {
        col = lerp3(sc.shadow, sc.base, hNorm * 2);
      } else {
        col = lerp3(sc.base, sc.peak, (hNorm - 0.5) * 2);
      }

      // Apply lighting
      const lit = [
        Math.round(col[0] * (0.35 + tri.brightness * 0.65)),
        Math.round(col[1] * (0.35 + tri.brightness * 0.65)),
        Math.round(col[2] * (0.35 + tri.brightness * 0.65)),
      ] as [number, number, number];

      // Ambient occlusion — darker triangles near bottom
      const ao = 0.7 + tri.brightness * 0.3;
      const final: [number, number, number] = [
        Math.round(lit[0] * ao),
        Math.round(lit[1] * ao),
        Math.round(lit[2] * ao),
      ];

      ctx.beginPath();
      ctx.moveTo(v0.x, v0.y);
      ctx.lineTo(v1.x, v1.y);
      ctx.lineTo(v2.x, v2.y);
      ctx.closePath();
      ctx.fillStyle = `rgb(${final[0]},${final[1]},${final[2]})`;
      ctx.fill();

      // Subtle edge lines
      ctx.strokeStyle = `rgba(${final[0] + 20},${final[1] + 20},${final[2] + 20},0.15)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }, [frame, width, height, totalFrames, speed, t, sc]);

  return (
    <div style={{ width, height, overflow: 'hidden', background: sc.bg3 }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};

// Vector math helpers
function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 1];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function dot(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function triangleNormal(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
  c: { x: number; y: number; z: number },
): [number, number, number] {
  const u = [b.x - a.x, b.y - a.y, b.z - a.z];
  const v = [c.x - a.x, c.y - a.y, c.z - a.z];
  const n = [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
  const len = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
  if (len === 0) return [0, 0, 1];
  return [n[0] / len, n[1] / len, n[2] / len];
}
