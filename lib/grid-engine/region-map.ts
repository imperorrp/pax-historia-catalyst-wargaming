import { AxialHex, hexToPixel, HEX_SIZE, getHexCorners } from './hex-math';
import { isPointInPolygon } from '../geometry-utils';
import type { MapRegion } from '../types';

export interface RegionHexMap {
  [regionId: string]: AxialHex[];
}

/**
 * Maps every region to the list of Hexes fully contained within it.
 * This effectively "discretizes" the vector polygon into a raster of hexes.
 */
export function generateRegionHexMap(regions: MapRegion[], width: number, height: number): RegionHexMap {
  const regionMap: RegionHexMap = {};
  
  // Initialize map
  regions.forEach(r => regionMap[r.id] = []);
  regionMap['__base__'] = [];

  // Determine grid bounds
  // We can iterate the whole canvas or just bounds of each region.
  // Iterating generic rectangular grid is easiest to ensure tessellation alignment.
  
  const colStep = HEX_SIZE * Math.sqrt(3);
  const rowStep = HEX_SIZE * 1.5;
  
  const cols = Math.ceil(width / colStep) + 2;
  const rows = Math.ceil(height / rowStep) + 2;

  // Uses "Odd-r" offset coordinates for iteration, then converts to Axial
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      
      // Convert Offset(row,col) -> Axial(q,r)
      const q = col - (row - (row & 1)) / 2;
      const r = row;
      
      const hex: AxialHex = { q, r };
      const pixel = hexToPixel(hex);

      // Skip centers outside canvas
      if (pixel.x < 0 || pixel.x > width || pixel.y < 0 || pixel.y > height) continue;

      let placedInRegion = false;

      // Check which region this center point belongs to?
      // Find the first matching region (overlay priority)
      for (const region of regions) {
        // PAINTER'S ALGORITHM SUPPORT: Check sub-polygons if available
        let inside = false;
        if (region.subPolygons && region.subPolygons.length > 0) {
          for (const sub of region.subPolygons) {
            if (isPointInPolygon(pixel, sub)) {
              inside = true;
              break;
            }
          }
        } else {
          // Legacy support: Check main polygon
          if (isPointInPolygon(pixel, region.points)) {
            inside = true;
          }
        }

        if (!inside) continue;


        // Ensure all corners fit inside the region/pixel bounds (avoid cropped hexes)
        const corners = getHexCorners(pixel);
        let allInside = true;
        for (const c of corners) {
          // Pixel bounds - Relaxed check
          if (c.x < 0 || c.y < 0) {
            allInside = false; break;
          }
          // Region bounds
          if (!isPointInPolygon(c, region.points)) { allInside = false; break; }
        }

        if (allInside) {
          regionMap[region.id].push(hex);
          placedInRegion = true;
          // Break interaction to avoid duplicate hexes if regions overlap (unless strictly intended)
          // For visual clarity, one hex = one region is safer.
          break; 
        }
      }

      // If not placed in any defined region, add to base layer
      if (!placedInRegion) {
        regionMap['__base__'].push(hex);
      }
    }
  }

  return regionMap;
}

/**
 * Calculates the centroid hex of a region (or closest valid hex to it)
 */
export function getRegionCentroidHex(hexes: AxialHex[]): AxialHex | null {
  if (hexes.length === 0) return null;
  
  let totalQ = 0;
  let totalR = 0;
  
  for (const hex of hexes) {
    totalQ += hex.q;
    totalR += hex.r;
  }
  
  const avgQ = Math.round(totalQ / hexes.length);
  const avgR = Math.round(totalR / hexes.length);
  
  // The mathematical avg might not be in the list (e.g. donut shape), 
  // but for convexity assumption it's usually fine.
  // Ideally, find the hex in 'hexes' closest to this avg.
  
  let closest: AxialHex = hexes[0];
  let minDist = Infinity;
  
  const target = { q: avgQ, r: avgR };
  
  for (const hex of hexes) {
    const dist = (Math.abs(hex.q - target.q) + Math.abs(hex.q + hex.r - target.q - target.r) + Math.abs(hex.r - target.r)) / 2;
    if (dist < minDist) {
      minDist = dist;
      closest = hex;
    }
  }
  
  return closest;
}
