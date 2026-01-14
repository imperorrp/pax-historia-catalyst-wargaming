// lib/grid-engine/voronoi-generator.ts
// @ts-ignore
import { Delaunay } from "d3-delaunay";
import { smoothPolygon } from "../geometry-utils";
import type { MapRegion } from "../types";

export interface SeedPoint {
  id: string;
  x: number;
  y: number;
  terrain: string;
  name: string;
}

export function generateVoronoiRegions(
  seedPoints: SeedPoint[],
  width: number,
  height: number,
  iterations: number = 2 // How many times to "relax" the grid
): MapRegion[] {

  let currentPoints = seedPoints.map(p => [p.x, p.y] as [number, number]);
  let delaunay: any;
  let voronoi: any;

  // 1. Lloyd's Relaxation Loop
  // This moves points to the center of their cell, making shapes more regular/organic
  for (let i = 0; i < iterations; i++) {
    delaunay = Delaunay.from(currentPoints);
    voronoi = delaunay.voronoi([0, 0, width, height]);
    currentPoints = currentPoints.map((_, i) => {
      const polygon = voronoi.cellPolygon(i);
      if (!polygon) return currentPoints[i];
      // Calculate centroid of the polygon
      let cx = 0, cy = 0;
      polygon.forEach((p: any) => { cx += p[0]; cy += p[1]; });
      return [cx / polygon.length, cy / polygon.length];
    });
  }

  // Final Generation
  delaunay = Delaunay.from(currentPoints);
  voronoi = delaunay.voronoi([0, 0, width, height]);

  // 3. Convert cells to MapRegions
  return seedPoints.map((seed, i) => {
    const polygon = voronoi.cellPolygon(i);

    // Safety check: Voronoi can fail on edge cases
    if (!polygon) return {
       id: seed.id, name: seed.name, points: [], neighbors: [], terrain: seed.terrain as any, centroid: {x:0, y:0}
    };

    // 4. Find Neighbors (Delaunay graph defines connectivity)
    const neighborsIter = delaunay.neighbors(i);
    const neighborIds: string[] = [];
    for (const n of neighborsIter) {
      neighborIds.push(seedPoints[n].id);
    }

    // Flatten the [x,y] arrays
    let rawPoints = polygon.map((p: any) => [p[0], p[1]] as [number, number]);

    // Apply Chaikin's Smoothing
    // Organic terrain gets more smoothing to remove sharp corners
    if (['river', 'forest', 'hills', 'mountain'].includes(seed.terrain)) {
        rawPoints = smoothPolygon(rawPoints, 3);
    } else {
        // Even plains look better with slight rounding
        rawPoints = smoothPolygon(rawPoints, 1);
    }

    return {
      id: seed.id,
      name: seed.name,
      // Convert Polygon array to our format
      points: rawPoints,
      neighbors: neighborIds,
      terrain: seed.terrain as any,
      // Store the centroid for labeling
      centroid: { x: currentPoints[i][0], y: currentPoints[i][1] }
    };
  });
}