import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { hexToRgb, rgbToString, palettes } from '../utils/colors';
import { noise } from '../utils/math';

interface GridDotsProps {
  rows?: number;
  cols?: number;
  palette?: string[];
  speed?: number;
  width?: number;
  height?: number;
  dotSize?: number;
  totalFrames?: number;
}

export const GridDots: React.FC<GridDotsProps> = ({
  rows = 15,
  cols = 25,
  palette = palettes.ocean,
  speed = 1,
  width = 1920,
  height = 1080,
  dotSize = 8,
  totalFrames = 300,
}) => {
  const frame = useCurrentFrame();
  const spacingX = width / (cols + 1);
  const spacingY = height / (rows + 1);

  const TWO_PI = 2 * Math.PI;
  const phase = (frame / totalFrames) * TWO_PI * speed;

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', background: '#0a0a0a' }}>
      <svg width={width} height={height}>
        {Array.from({ length: rows }).map((_, row) =>
          Array.from({ length: cols }).map((_, col) => {
            const x = spacingX * (col + 1);
            const y = spacingY * (row + 1);
            const dist = Math.sqrt(
              (x - width / 2) ** 2 + (y - height / 2) ** 2
            );
            const wave = Math.sin(dist * 0.005 + phase);
            const size = dotSize * (0.5 + wave * 0.5);
            const colorIdx = Math.floor(noise(row, col, 10) * palette.length);
            const [r, g, b] = hexToRgb(palette[colorIdx % palette.length]);
            const opacity = 0.3 + wave * 0.5;

            return (
              <circle
                key={`${row}-${col}`}
                cx={x}
                cy={y}
                r={Math.max(1, size)}
                fill={rgbToString(r, g, b, Math.max(0.1, opacity))}
              />
            );
          })
        )}
      </svg>
    </div>
  );
};
