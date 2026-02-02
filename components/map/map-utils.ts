/**
 * Utility functions for map rendering and geometry calculations
 */

export function getBoundingBox(points: [number, number][]): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  points.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  return { minX, maxX, minY, maxY };
}

export function isPointInPolygon(point: { x: number; y: number }, polygon: [number, number][]): boolean {
  const { x, y } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

export function drawScatterProps(rc: RoughCanvas, points: [number, number][], terrain: string) {
  const bounds = getBoundingBox(points);
  const area = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
  const density = 0.0003; // Adjust based on visual density
  const count = Math.floor(area * density);

  for (let i = 0; i < count; i++) {
    const rx = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
    const ry = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);

    // Check if random point is actually inside the region
    if (isPointInPolygon({ x: rx, y: ry }, points)) {
      if (terrain === 'forest') {
        // Draw stylized pine tree
        rc.line(rx, ry, rx - 3, ry + 8, { stroke: '#2e7d32', strokeWidth: 1 });
        rc.line(rx, ry, rx + 3, ry + 8, { stroke: '#2e7d32', strokeWidth: 1 });
        rc.line(rx - 3, ry + 8, rx + 3, ry + 8, { stroke: '#2e7d32', strokeWidth: 1 });
      } else if (terrain === 'mountain') {
        // Draw mountain peak
        rc.path(`M ${rx} ${ry} L ${rx + 8} ${ry - 12} L ${rx + 16} ${ry}`, { stroke: '#5d4037', strokeWidth: 1 });
      } else if (terrain === 'river' || terrain === 'water') {
        // Draw water ripples
        rc.curve([[rx, ry], [rx + 3, ry + 1], [rx + 6, ry]], { stroke: '#2980b9', strokeWidth: 0.5 });
      } else if (terrain === 'swamp' || terrain === 'mud') {
        // Draw mud splatters
        rc.circle(rx, ry, 2 + Math.random() * 3, { fill: '#3e2723', fillStyle: 'solid', roughness: 2 });
      }
    }
  }
}

export function findSharedEdges(pointsA: [number, number][], pointsB: [number, number][]): [number, number][][] {
  const edges: [number, number][][] = [];
  const tolerance = 5; // pixels

  for (let i = 0; i < pointsA.length; i++) {
    const pA = pointsA[i];
    for (let j = 0; j < pointsB.length; j++) {
      const pB = pointsB[j];
      const dist = Math.hypot(pA[0] - pB[0], pA[1] - pB[1]);
      if (dist < tolerance) {
        // These points are close, consider them shared
        const pANext = pointsA[(i + 1) % pointsA.length];
        const pBNext = pointsB[(j + 1) % pointsB.length];
        const distNext = Math.hypot(pANext[0] - pBNext[0], pANext[1] - pBNext[1]);
        if (distNext < tolerance) {
          edges.push([pA, pANext]);
        }
      }
    }
  }
  return edges;
}

export function drawRiver(rc: RoughCanvas, regions: Array<{ id: string; points: [number, number][] }>, river: { pathNodes: string[]; width?: number; name: string }) {
  // Find shared edges between regions in the river path
  const riverSegments: [number, number][][] = [];

  for (let i = 0; i < river.pathNodes.length - 1; i++) {
    const regionA = regions.find(r => r.id === river.pathNodes[i]);
    const regionB = regions.find(r => r.id === river.pathNodes[i + 1]);

    if (regionA && regionB) {
      // Find shared edges (simplified - in practice you'd need proper edge detection)
      const sharedEdges = findSharedEdges(regionA.points, regionB.points);
      if (sharedEdges.length > 0) {
        riverSegments.push(...sharedEdges);
      }
    }
  }

  // Draw river segments
  riverSegments.forEach(segment => {
    if (segment.length >= 2) {
      rc.path(`M ${segment[0][0]} ${segment[0][1]} L ${segment[1][0]} ${segment[1][1]}`, {
        stroke: '#2980b9',
        strokeWidth: river.width || 6,
        roughness: 1
      });
    }
  });
}

// Re-export RoughCanvas type for convenience
export type RoughCanvas = import('roughjs/bin/canvas').RoughCanvas;
