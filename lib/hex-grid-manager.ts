import { AxialHex, hexToPixel } from './grid-engine/hex-math';
import { isPointInPolygon, getPolygonCentroid } from './geometry-utils';
import type { MapRegion, HexData, Unit, PositionTag } from './types';

export class HexGridManager {
  
  /**
   * Generates a unified hex grid for the entire map, filtering to only valid regions.
   * This ensures hexes align perfectly across region borders.
   */
  
  private static mapRegionTerrainToHexTerrain(regionTerrain?: string): HexData['terrain'] {
    switch (regionTerrain) {
      case 'urban': return 'urban_ruins';
      case 'river': return 'water';
      default: return (regionTerrain as HexData['terrain']) || 'plains';
    }
  }
  static generateHexGrid(regions: MapRegion[], width: number, height: number, hexRadius: number = 30): HexData[] {
    const hexDataList: HexData[] = [];
    const processedHexes = new Set<string>();

    // Estimate grid bounds based on pixel dimensions
    const colStep = hexRadius * Math.sqrt(3);
    const rowStep = hexRadius * 1.5;
    
    const cols = Math.ceil(width / colStep) + 2;
    const rows = Math.ceil(height / rowStep) + 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Convert Offset (row, col) to Axial (q, r) - using "Odd-r" layout
        const q = col - (row - (row & 1)) / 2;
        const r = row;
        
        // Use user's Math source of truth
        const pixelPos = hexToPixel({ q, r });
        
        // Check bounds
        if (pixelPos.x < -hexRadius || pixelPos.x > width + hexRadius || 
            pixelPos.y < -hexRadius || pixelPos.y > height + hexRadius) {
            continue;
        }

        const hexKey = `${q},${r}`;
        if (processedHexes.has(hexKey)) continue;
        processedHexes.add(hexKey);

        const point = { x: pixelPos.x, y: pixelPos.y };

        // Check if inside ANY region
        const region = regions.find(reg => isPointInPolygon(point, reg.points));
        
        if (region) {
          hexDataList.push({
            q,
            r,
            s: -q - r,
            x: pixelPos.x,
            y: pixelPos.y,
            regionId: region.id,
            terrain: this.mapRegionTerrainToHexTerrain(region.terrain), // Base terrain from region
            height: 1
          });
        }
      }
    }

    return hexDataList;
  }

  // --- Logic for Phase 3: Spiral Fill & Semantic Placement ---

  static getHexesInRegion(grid: HexData[], regionId: string): HexData[] {
    return grid.filter(h => h.regionId === regionId);
  }

  static getCentroidHex(hexes: HexData[]): HexData | null {
    if (hexes.length === 0) return null;
    let sumQ = 0, sumR = 0;
    hexes.forEach(h => { sumQ += h.q; sumR += h.r; });
    const avgQ = Math.round(sumQ / hexes.length);
    const avgR = Math.round(sumR / hexes.length);
    // Find closest actual hex in the set to this average
    return HexGridManager.findClosestHex(hexes, { q: avgQ, r: avgR }) || hexes[0];
  }

  static findClosestHex(pool: HexData[], target: { q: number, r: number }): HexData | null {
    let closest: HexData | null = null;
    let minDist = Infinity;
    
    for (const h of pool) {
      // Axial distance
      const dist = (Math.abs(h.q - target.q) + Math.abs(h.q + h.r - target.q - target.r) + Math.abs(h.r - target.r)) / 2;
      if (dist < minDist) {
        minDist = dist;
        closest = h;
      }
    }
    return closest;
  }

  static getAnchorHex(grid: HexData[], regionId: string, positionTag: PositionTag, enemyDirectionHex?: AxialHex): HexData | null {
    const regionHexes = HexGridManager.getHexesInRegion(grid, regionId);
    if (!regionHexes.length) return null;
    
    if (positionTag === 'center') {
      return HexGridManager.getCentroidHex(regionHexes);
    }

    const target = enemyDirectionHex || { q: 10, r: 10 }; 

    const sorted = [...regionHexes].sort((a, b) => {
        const distA = HexGridManager.axialDistance(a, target);
        const distB = HexGridManager.axialDistance(b, target);
        return distA - distB;
    });

    if (positionTag === 'front_line') return sorted[0]; 
    if (positionTag === 'rear_guard') return sorted[sorted.length - 1];
    
    if (positionTag === 'flank_left') return sorted[0]; 
    if (positionTag === 'flank_right') return sorted[sorted.length - 1];

    return HexGridManager.getCentroidHex(regionHexes);
  }

  static axialDistance(a: AxialHex, b: AxialHex): number {
      return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }

  // SPIRAL SEARCH
  static findValidSpot(grid: HexData[], startHex: HexData, occupiedHexes: Set<string>): HexData | null {
     if (!occupiedHexes.has(`${startHex.q},${startHex.r}`)) return startHex;

     for (let radius = 1; radius <= 5; radius++) {
         const ring = HexGridManager.getRing(startHex, radius);
         for (const coord of ring) {
             const candidate = grid.find(h => h.q === coord.q && h.r === coord.r);
             if (candidate && !occupiedHexes.has(`${candidate.q},${candidate.r}`)) {
                 return candidate;
             }
         }
     }
     return null; 
  }

  static getRing(center: AxialHex, radius: number): AxialHex[] {
      const results: AxialHex[] = [];
      const neighbors = [
        { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 },
        { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 }
      ];

      let currQ = center.q + (neighbors[4].q * radius);
      let currR = center.r + (neighbors[4].r * radius);

      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < radius; j++) {
            results.push({ q: currQ, r: currR });
            currQ += neighbors[i].q;
            currR += neighbors[i].r;
        }
      }
      return results;
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

