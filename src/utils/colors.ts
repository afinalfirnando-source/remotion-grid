export const palettes = {
  ocean: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
  sunset: ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec'],
  forest: ['#2d6a4f', '#40916c', '#52b788', '#95d5b2'],
  neon: ['#f72585', '#7209b7', '#3a0ca3', '#4361ee'],
  pastel: ['#ffc8dd', '#ffafcc', '#bde0fe', '#a2d2ff'],
  fire: ['#d00000', '#e85d04', '#faa307', '#ffba08'],
  midnight: ['#03071e', '#370617', '#6a040f', '#9d0208'],
  arctic: ['#caf0f8', '#ade8f4', '#90e0ef', '#48cae4'],
  earth: ['#606c38', '#283618', '#dda15e', '#bc6c25'],
  cosmic: ['#7400b8', '#6930c3', '#5390d9', '#48bfe3'],
};

export function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function rgbToString(r: number, g: number, b: number, a = 1): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function lerpColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return rgbToString(r, g, b);
}

export function getGradientColors(palette: string[], index: number): [string, string] {
  const i = index % palette.length;
  const j = (index + 1) % palette.length;
  return [palette[i], palette[j]];
}
