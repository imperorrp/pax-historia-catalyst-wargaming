
export const HEX_SIZE = 30; // Radius
const SQRT_3 = Math.sqrt(3);

export interface AxialHex {
  q: number;
  r: number;
}

export interface PixelPoint {
  x: number;
  y: number;
}

/**
 * Converts Axial Coordinates (q, r) to Pixel Coordinates (x, y)
 * Orientation: Pointy-topped
 */
export function hexToPixel(hex: AxialHex): PixelPoint {
  const x = HEX_SIZE * (SQRT_3 * hex.q + (SQRT_3 / 2) * hex.r);
  const y = HEX_SIZE * ((3 / 2) * hex.r);
  return { x, y };
}

/**
 * Converts Pixel Coordinates (x, y) to Axial Coordinates (q, r)
 * Orientation: Pointy-topped
 */
export function pixelToHex(point: PixelPoint): AxialHex {
  const q = ((SQRT_3 / 3) * point.x - (1 / 3) * point.y) / HEX_SIZE;
  const r = ((2 / 3) * point.y) / HEX_SIZE;
  return axialRound(q, r);
}

/**
 * Get the 6 corner points of a hex at a given center location
 */
export function getHexCorners(center: PixelPoint): PixelPoint[] {
  const corners: PixelPoint[] = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i - 30; // -30 for pointy top
    const angle_rad = Math.PI / 180 * angle_deg;
    corners.push({
      x: center.x + HEX_SIZE * Math.cos(angle_rad),
      y: center.y + HEX_SIZE * Math.sin(angle_rad)
    });
  }
  return corners;
}

/**
 * Rounds floating point axial coords to nearest integer hex
 */
function axialRound(q: number, r: number): AxialHex {
  let qRound = Math.round(q);
  let rRound = Math.round(r);
  const s = -q - r;
  const sRound = Math.round(s);

  const qDiff = Math.abs(qRound - q);
  const rDiff = Math.abs(rRound - r);
  const sDiff = Math.abs(sRound - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    qRound = -rRound - sRound;
  } else if (rDiff > sDiff) {
    rRound = -qRound - sRound;
  }
  
  return { q: qRound, r: rRound };
}

/**
 * Distance between two hexes in grid steps
 */
export function hexDistance(a: AxialHex, b: AxialHex): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function hexAdd(a: AxialHex, b: AxialHex): AxialHex {
  return { q: a.q + b.q, r: a.r + b.r };
}

export function hexScale(a: AxialHex, k: number): AxialHex {
  return { q: a.q * k, r: a.r * k };
}
