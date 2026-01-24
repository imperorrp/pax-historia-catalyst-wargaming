// @ts-ignore
import { Delaunay } from "d3-delaunay";
import { getPolygonCentroid } from "../geometry-utils";
import type { MapRegion, RegionLayoutDef } from "../types";

export function generatePaintedMap(
  layoutDefs: RegionLayoutDef[],
  width: number,
  height: number,
  // Add scaleType parameter (default to tactical)
  scaleType: 'tactical' | 'grand_strategy' = 'tactical'
): MapRegion[] {
  
  // 1. DENSITY SWITCH
  // Tactical = 400 (Smooth, blobbier)
  // Grand Strategy = Density based on map size, aiming for ~10k for a large map to get pixel-perfect borders
  
  let numMicroCells = 400;
  if (scaleType === 'grand_strategy') {
      // Calculate roughly 1 cell per 400 sq pixels for high detail
      // e.g. 2000x1500 = 3,000,000 / 400 = 7500 cells
      numMicroCells = Math.floor((width * height) / 300);
      // Cap at 15k to prevent browser crash
      numMicroCells = Math.min(numMicroCells, 15000);
      // Min floor
      numMicroCells = Math.max(numMicroCells, 4000);
  }

  // 1. Generate dense Voronoi Grid (The "Canvas")
  // Using Halton sequence or just random for now. Random is fine for organic feel.
  const points = new Array(numMicroCells).fill(0).map(() => [
    Math.random() * width,
    Math.random() * height
  ] as [number, number]);

  // Relax once for better cell shapes (less "spiky" slivers)
  const delaunay = Delaunay.from(points);
  const voronoi = delaunay.voronoi([0, 0, width, height]);
  
  // Create micro-regions wrapper
  const microCells: { 
    id: number; 
    polygon: [number, number][]; 
    centroid: {x: number, y: number};
    regionId: string | null 
  }[] = [];

  for(let i=0; i < points.length; i++) {
    const polygon = voronoi.cellPolygon(i);
    // cellPolygon returns null for infinite cells (shouldn't happen with bounds)
    if(polygon) {
       microCells.push({
         id: i,
         polygon: polygon,
         centroid: getPolygonCentroid(polygon),
         regionId: null
       });
    }
  }

  // 2. Assign cells to regions (The "Painting" Phase)
  // We process specific shapes first (Path/River), then blobs
  // This allows rivers to "cut through" forest blobs if we order layoutDefs correctly.
  // Ideally, narrow features come first? Or last?
  // If we want rivers to overwrite forests, they should be processed LAST (Painter's algo).
  // But wait, if we only assign `if (!cell.regionId)` then FIRST matters.
  // Let's do PRIORITY painting: Overwrite allowed if explicit? 
  // For now: First Match Wins. So put specific/important features FIRST in layoutDefs.
  
  for (const def of layoutDefs) {
    if (def.type === "path") {
       paintPath(microCells, def);
    } else if (def.type === "blob" || def.type === "point") {
       paintBlob(microCells, def);
    }
    // Noise/Scattered - TODO
  }
  
  // 3. Fill gaps (Unclaimed cells)
  // Assign to nearest claimed neighbor
  fillGaps(microCells, layoutDefs);

  // 4. Aggregate & Finalize
  // We calculate neighbors based on the underlying graph structure
  const regionNeighborSet = new Map<string, Set<string>>();
  layoutDefs.forEach(d => regionNeighborSet.set(d.id, new Set()));

  // Check adjacency in the micro-grid
  for (let i = 0; i < points.length; i++) {
     const myRegionId = microCells[i].regionId;
     if (!myRegionId) continue;
     
     const neighborsGenerator = voronoi.delaunay.neighbors(i);
     for (const nIndex of neighborsGenerator) {
        const neighborRegionId = microCells[nIndex]?.regionId;
        if (neighborRegionId && neighborRegionId !== myRegionId) {
           regionNeighborSet.get(myRegionId)?.add(neighborRegionId);
        }
     }
  }

  const finalRegions: MapRegion[] = layoutDefs.map(def => {
    const cells = microCells.filter(c => c.regionId === def.id);
    const subPolygons = cells.map(c => c.polygon);
    
    // Fallback if no cells claimed (shouldn't happen with gap filling)
    if (cells.length === 0) {
        // Create a dummy region at first point
        const pt = def.points[0];
        return {
            id: def.id,
            name: def.name,
            points: [[pt[0]-10, pt[1]-10], [pt[0]+10, pt[1]-10], [pt[0]+10, pt[1]+10], [pt[0]-10, pt[1]+10]],
            neighbors: [],
            terrain: def.terrain as any,
            subPolygons: []
        };
    }

    // Calculate convex hull of ALL vertices for the "legacy" single-polygon representation
    // This is useful for bounds checking and simple labels
    const allVertices: [number, number][] = [];
    subPolygons.forEach(poly => allVertices.push(...poly));
    
    const hullIndices = Delaunay.from(allVertices).hull;
    const hullPolygon = Array.from(hullIndices).map((i: any) => allVertices[i]);
    
    // Calculate accurate centroid weighted by cell centroids?
    // Simple average of cell centroids is good enough
    let cx = 0, cy = 0;
    cells.forEach(c => { cx += c.centroid.x; cy += c.centroid.y; });
    const centroid = { x: cx / cells.length, y: cy / cells.length };

    return {
      id: def.id,
      name: def.name,
      points: hullPolygon as [number, number][], // Approximate outer boundary
      subPolygons: subPolygons, // THE REAL DATA
      neighbors: Array.from(regionNeighborSet.get(def.id) || []),
      terrain: def.terrain as any,
      isFort: def.isFort,
      centroid: centroid
    };
  });

  return finalRegions;
}

// --- Helpers ---

// Distance from point P to line segment VW
function distToSegment(p: {x:number, y:number}, v: {x:number, y:number}, w: {x:number, y:number}) {
  const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
  if (l2 == 0) return (p.x - v.x)**2 + (p.y - v.y)**2;
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt( (p.x - (v.x + t * (w.x - v.x)))**2 + (p.y - (v.y + t * (w.y - v.y)))**2 );
}

function paintPath(cells: any[], def: RegionLayoutDef) {
  // For each segment in def.points
  for (let i = 0; i < def.points.length - 1; i++) {
    const p1 = {x: def.points[i][0], y: def.points[i][1]};
    const p2 = {x: def.points[i+1][0], y: def.points[i+1][1]};
    
    cells.forEach(cell => {
       if (cell.regionId) return; // First Come First Served
       
       const d = distToSegment(cell.centroid, p1, p2);
       if (d < def.influence) {
         cell.regionId = def.id;
       }
    });
  }
}

function paintBlob(cells: any[], def: RegionLayoutDef) {
   // def.points are centers
   def.points.forEach(pt => {
      const center = {x: pt[0], y: pt[1]};
      cells.forEach(cell => {
         if (cell.regionId) return;
         const d = Math.sqrt((cell.centroid.x - center.x)**2 + (cell.centroid.y - center.y)**2);
         if (d < def.influence) {
            cell.regionId = def.id;
         }
      });
   });
}

function fillGaps(cells: any[], defs: RegionLayoutDef[]) {
   cells.filter(c => !c.regionId).forEach(cell => {
       // Find nearest defined region point
       let minD = Infinity;
       let bestId = null;
       
       defs.forEach(def => {
          // Check distance to definition points/segments
          if (def.type === 'path') {
             for (let i = 0; i < def.points.length - 1; i++) {
                const p1 = {x: def.points[i][0], y: def.points[i][1]};
                const p2 = {x: def.points[i+1][0], y: def.points[i+1][1]};
                const d = distToSegment(cell.centroid, p1, p2);
                if (d < minD) { minD = d; bestId = def.id; }
             }
          } else {
             def.points.forEach(pt => {
                const d = Math.sqrt((cell.centroid.x - pt[0])**2 + (cell.centroid.y - pt[1])**2);
                if (d < minD) { minD = d; bestId = def.id; }
             });
          }
       });
       
       if (bestId) cell.regionId = bestId;
   });
}
