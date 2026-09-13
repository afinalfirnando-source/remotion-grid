import React from 'react';
import { useCurrentFrame } from 'remotion';

export type ColorScheme = 'ocean' | 'neonPurple' | 'sunsetGold';

interface SphereRippleProps {
  width?: number;
  height?: number;
  totalFrames?: number;
  speed?: number;
  scheme?: ColorScheme;
}

const schemes: Record<ColorScheme, { bg: string; line: (z: number) => string; dot: (z: number) => string }> = {
  ocean: {
    bg: '#eaf2fa',
    line: (z) => {
      const v = (z + 1) / 2;
      return `rgb(${100 + v * 50},${160 + v * 60},${220 + v * 30})`;
    },
    dot: (z) => {
      const v = (z + 1) / 2;
      return `rgb(${60 + v * 80},${130 + v * 80},${210 + v * 40})`;
    },
  },
  neonPurple: {
    bg: '#1a0a2e',
    line: (z) => {
      const v = (z + 1) / 2;
      return `rgb(${140 + v * 80},${60 + v * 60},${200 + v * 40})`;
    },
    dot: (z) => {
      const v = (z + 1) / 2;
      return `rgb(${200 + v * 55},${80 + v * 100},${220 + v * 35})`;
    },
  },
  sunsetGold: {
    bg: '#1a0f05',
    line: (z) => {
      const v = (z + 1) / 2;
      return `rgb(${220 + v * 35},${130 + v * 70},${40 + v * 60})`;
    },
    dot: (z) => {
      const v = (z + 1) / 2;
      return `rgb(${255},${180 + v * 60},${50 + v * 80})`;
    },
  },
};

export const SphereRipple: React.FC<SphereRippleProps> = ({
  width = 1920,
  height = 1080,
  totalFrames = 300,
  speed = 1,
  scheme = 'ocean',
}) => {
  const frame = useCurrentFrame();
  const t = (frame / totalFrames) * Math.PI * 2 * speed;
  const colors = schemes[scheme];

  const cols = 60;
  const rows = 34;
  const cx = width / 2;
  const cy = height / 2;

  const baseSpacingX = width / (cols - 1);
  const baseSpacingY = height / (rows - 1);

  const points: { x: number; y: number; z: number }[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: { x: number; y: number; z: number }[] = [];
    for (let c = 0; c < cols; c++) {
      const bx = baseSpacingX * c;
      const by = baseSpacingY * r;
      const dx = (bx - cx) / cx;
      const dy = (by - cy) / cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const wave1 = Math.sin(dist * 4 - t * 3);
      const wave2 = Math.sin(dx * 2 * Math.PI + t * 2);
      const wave3 = Math.cos(dy * 2 * Math.PI - t * 2);
      const z = (wave1 + wave2 + wave3) / 3;

      const spread = 1 + z * 0.12;
      const px = cx + dx * cx * spread;
      const py = cy + dy * cy * spread;

      row.push({ x: px, y: py, z });
    }
    points.push(row);
  }

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', background: colors.bg }}>
      <svg width={width} height={height}>
        {points.map((row, r) =>
          row.map((p, c) => {
            if (c < cols - 1) {
              const n = row[c + 1];
              const avg = (p.z + n.z) / 2;
              const val = (avg + 1) / 2;
              return (
                <line
                  key={`h${r}${c}`}
                  x1={p.x} y1={p.y} x2={n.x} y2={n.y}
                  stroke={colors.line(avg)}
                  strokeWidth={0.6 + val * 1.5}
                  opacity={0.15 + val * 0.65}
                />
              );
            }
            return null;
          })
        )}

        {points.map((row, r) => {
          if (r < rows - 1) {
            return row.map((p, c) => {
              const below = points[r + 1][c];
              const avg = (p.z + below.z) / 2;
              const val = (avg + 1) / 2;
              return (
                <line
                  key={`v${r}${c}`}
                  x1={p.x} y1={p.y} x2={below.x} y2={below.y}
                  stroke={colors.line(avg)}
                  strokeWidth={0.6 + val * 1.5}
                  opacity={0.15 + val * 0.65}
                />
              );
            });
          }
          return null;
        })}

        {points.map((row, r) =>
          row.map((p, c) => {
            const val = (p.z + 1) / 2;
            return (
              <circle
                key={`d${r}${c}`}
                cx={p.x} cy={p.y}
                r={1.2 + val * 3}
                fill={colors.dot(p.z)}
                opacity={0.25 + val * 0.7}
              />
            );
          })
        )}
      </svg>
    </div>
  );
};
