import { defineHex, Grid, rectangle, spiral, Hex } from 'honeycomb-grid';
import { isPointInPolygon, getBoundingBox, getPolygonCentroid } from './geometry-utils';
import type { MapRegion, HexData } from './types';

export class HexGridManager {
  
  /**
   * Generates a unified hex grid for the entire map, filtering to only valid regions.
   * This ensures hexes align perfectly across region borders.
   */
  static generateHexGrid(regions: MapRegion[], width: number, height: number, hexRadius: number = 30): HexData[] {
    
    // 1. Define the Hex Class (Flat-topped is common for strategy games, or Pointy-topped)
    // We'll use Pointy-topped (orientation: 'pointy') which is default usually
    const Tile = defineHex({ dimensions: hexRadius, origin: { x: 0, y: 0 } });
    
    // 2. Generate a rectangle grid covering the canvas
    const grid = new Grid(Tile, rectangle({ 
      width: Math.ceil(width / (hexRadius * 1.5)) + 5, 
      height: Math.ceil(height / (hexRadius * 1.5)) + 5 
    }));

    const hexDataList: HexData[] = [];

    // 3. Filter and Map
    grid.forEach((hex) => {
       // Standard method to get center in pixels (Pointy Top):
       // x = size * sqrt(3) * (q + r/2)
       // y = size * 3/2 * r
       const pixelX = (hexRadius * Math.sqrt(3) * (hex.q + hex.r / 2));
       const pixelY = (hexRadius * 3 / 2 * hex.r);
       
       const point = { x: pixelX, y: pixelY };
       
       // Check if inside ANY region
       const region = regions.find(r => isPointInPolygon(point, r.points));
       
       if (region) {
         hexDataList.push({
           q: hex.q,
           r: hex.r,
           s: hex.s,
           x: pixelX,
           y: pixelY,
           regionId: region.id,
           terrain: 'plains', // Default, will be painted later
           height: 1
         });
       }
    });
    
    return hexDataList;
  }

  // --- LOGIC: Distance & Neighbors ---

  static getHexDistance(a: {q: number, r: number}, b: {q: number, r: number}): number {
    // Axial distance formula: (abs(a.q - b.q) + abs(a.q + a.r - b.q - b.r) + abs(a.r - b.r)) / 2
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }

  static getNeighbors(hex: {q: number, r: number}, grid: HexData[]): HexData[] {
    // Axial neighbor offsets
    const directions = [
      { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
      { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    
    return directions.map(d => {
      const targetQ = hex.q + d.q;
      const targetR = hex.r + d.r;
      return grid.find(h => h.q === targetQ && h.r === targetR);
    }).filter((h): h is HexData => !!h);
  }

  // --- LOGIC: Pathfinding (A*) ---
  
  static findPath(start: {q: number, r: number}, end: {q: number, r: number}, grid: HexData[], obstacles: string[] = []): HexData[] {
    // Basic A* Implementation
    
    // Quick check: Start and End must exist in grid
    const startNode = grid.find(h => h.q === start.q && h.r === start.r);
    const endNode = grid.find(h => h.q === end.q && h.r === end.r);
    
    if (!startNode || !endNode) return [];

    const openSet: HexData[] = [startNode];
    const cameFrom = new Map<HexData, HexData>();
    
    const gScore = new Map<HexData, number>();
    gScore.set(startNode, 0);
    
    const fScore = new Map<HexData, number>();
    fScore.set(startNode, this.getHexDistance(startNode, endNode));

    while (openSet.length > 0) {
      // Get node with lowest fScore
      let current = openSet[0];
      let lowestF = fScore.get(current) || Infinity;
      
      for (const node of openSet) {
        const f = fScore.get(node) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = node;
        }
      }

      if (current === endNode) {
        return this.reconstructPath(cameFrom, current);
      }

      openSet.splice(openSet.indexOf(current), 1);
      
      const neighbors = this.getNeighbors(current, grid);
      for (const neighbor of neighbors) {
        // Skip obstacles (if we implemented obstacle tagging)
        // For now, assume all grid hexes are valid
        
        const tentativeG = (gScore.get(current) || 0) + 1; // Distance 1 per hop
        
        if (tentativeG < (gScore.get(neighbor) || Infinity)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeG);
          fScore.set(neighbor, tentativeG + this.getHexDistance(neighbor, endNode));
          
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    return []; // No path found
  }

  private static reconstructPath(cameFrom: Map<HexData, HexData>, current: HexData): HexData[] {
    const totalPath = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      totalPath.unshift(current);
    }
    return totalPath;
  }
}

