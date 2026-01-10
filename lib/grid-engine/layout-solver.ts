import { generateRegionHexMap, getRegionCentroidHex, RegionHexMap } from './region-map';
import { AxialHex, hexDistance } from './hex-math';
import type { WarRoomScenario, Unit, PositionTag } from '../types';

import { HexData } from '../types'; // Verify import
import { hexToPixel } from './hex-math';

/**
 * Hydrates a scenario by converting Semantic Placements into concrete Hex Coordinates.
 * Also generates the HexData array for rendering.
 */
export function hydrateScenarioLayout(scenario: WarRoomScenario, displayWidth?: number, displayHeight?: number): WarRoomScenario {
  const width = displayWidth ?? scenario.mapDimensions.width;
  const height = displayHeight ?? scenario.mapDimensions.height;
  // 1. Generate the Board
  const regionMap = generateRegionHexMap(
    scenario.mapRegions, 
    scenario.mapDimensions.width, 
    scenario.mapDimensions.height
  );

  // Flatten region map to hexGrid for rendering
  const hexGrid: HexData[] = [];
  const hexIndex: Record<string, HexData> = {};
  Object.entries(regionMap).forEach(([rId, hexes]) => {
     // Lookup the actual terrain for this region
     let regionTerrain = 'plains';
     let structure: HexData['structure'] = 'none';

     if (rId === '__base__') {
       regionTerrain = 'plains';
     } else {
       const region = scenario.mapRegions.find(r => r.id === rId);
       if (region) {
         regionTerrain = region.terrain || 'plains';
         if (region.isCity) structure = 'city_block';
         if (region.isFort) structure = 'fortress';
       }
     }
     
     hexes.forEach(h => {
        const pix = hexToPixel(h);
        const hexDatum: HexData = {
           q: h.q,
           r: h.r,
           s: -h.q - h.r,
           x: pix.x,
           y: pix.y,
           regionId: rId,
           terrain: regionTerrain as any,
           structure,
        };
        hexGrid.push(hexDatum);
        hexIndex[`${h.q},${h.r}`] = hexDatum;
     });
  });

  // 2. Track Occupied Hexes to prevent stacking
  const occupiedHexKeys = new Set<string>();
  const hexKey = (h: AxialHex) => `${h.q},${h.r}`;

  // 3. Place Units
  const units = scenario.units.map(unit => {
    // If unit already has hard coordinates (e.g. from save state), respect them
    if (unit.hex) {
      occupiedHexKeys.add(hexKey(unit.hex));
      return unit;
    }

    if (!unit.placement) {
       console.warn(`Unit ${unit.id} "${unit.name}" has no placement data.`);
       return unit;
    }

    const { regionId, tag } = unit.placement;
    const hexesInRegion = regionMap[regionId];

    if (!hexesInRegion || hexesInRegion.length === 0) {
      console.warn(`Region ${regionId} not found or empty for unit ${unit.id}.`);
      return unit;
    }

    // Determine Anchor Point
    let anchor: AxialHex = hexesInRegion[0]; // Default
    
    // Sort logic for Front/Rear
    // For prototype, we assume Left-to-Right flow (Player on Left, Enemy on Right?)
    // Or we use simplified sorting: 
    // "Front Line" -> Closest to Enemy Centroid (or Map Center vs Edge)
    // Let's assume Map Center (width/2) is the "Front" for both sides for now (Simplification)
    // Ideally we need "Enemy Polity Location".
    
    // Simplification: 
    // If Player: Front Line = Rightmost hexes (Max Q?)
    // If Enemy: Front Line = Leftmost hexes (Min Q?)
    
    const sortedByX = [...hexesInRegion].sort((a, b) => a.q - b.q); // Ascending Q
    
    if (unit.owner === 'player') {
       // Player is typically on Left/West
       if (tag === 'front_line') anchor = sortedByX[sortedByX.length - 1]; // Rightmost
       else if (tag === 'rear_guard') anchor = sortedByX[0]; // Leftmost
       else if (tag === 'center') anchor = getRegionCentroidHex(hexesInRegion) || anchor;
    } else {
       // Enemy is typically on Right/East
       if (tag === 'front_line') anchor = sortedByX[0]; // Leftmost (facing player)
       else if (tag === 'rear_guard') anchor = sortedByX[sortedByX.length - 1]; // Rightmost
       else if (tag === 'center') anchor = getRegionCentroidHex(hexesInRegion) || anchor;
    }

    // Spiral Search for valid spot
    const validSpot = findSpiralSpot(anchor, occupiedHexKeys, hexesInRegion);
    
    if (validSpot) {
      occupiedHexKeys.add(hexKey(validSpot));
      console.log(`✓ Placed unit ${unit.id} "${unit.name}" at hex (${validSpot.q}, ${validSpot.r})`);
      return { ...unit, hex: validSpot };
    } else {
      console.warn(`Could not find spot for unit ${unit.name} in ${regionId}`);
      return unit;
    }
  });

  return { ...scenario, units, hexGrid, mapDimensions: { width, height }, hexIndex }; 
}

function findSpiralSpot(center: AxialHex, occupied: Set<string>, validRegionHexes: AxialHex[]): AxialHex | null {
  // Check center first
  if (!occupied.has(`${center.q},${center.r}`)) return center;

  // Search Radius 1 to 5
  // Note: This simple ring generator assumes generic grid, but we must verify 
  // the candidate is actually inside the validRegionHexes list.
  
  const validSet = new Set(validRegionHexes.map(h => `${h.q},${h.r}`));

  for (let radius = 1; radius <= 5; radius++) {
    const ring = getRing(center, radius);
    for (const spot of ring) {
      const key = `${spot.q},${spot.r}`;
      if (validSet.has(key) && !occupied.has(key)) {
        return spot;
      }
    }
  }

  return null;
}

function getRing(center: AxialHex, radius: number): AxialHex[] {
  const results: AxialHex[] = [];
  let hex = { ...center };
  
  // Directions (Pointy Top neighbors):
  // +q,-r; +1,0; 0,+1; -1,+1; -1,0; 0,-1 ??
  // Let's use standard cubic directions
  // E, SE, SW, W, NW, NE
  const directions = [
    { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 }, 
    { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 }
  ];

  // Move along direction 4 (SW) radius times to start (arbitrary start point on ring)
  // Actually standard algo: start at center + scale(direction[4], radius)
  let currQ = center.q + (directions[4].q * radius);
  let currR = center.r + (directions[4].r * radius);
  
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < radius; j++) {
      results.push({ q: currQ, r: currR });
      currQ += directions[i].q;
      currR += directions[i].r;
    }
  }
  return results;
}
