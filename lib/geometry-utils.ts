// @ts-ignore - Third-party library without TypeScript definitions
import PoissonDiskSampling from 'poisson-disk-sampling';
// @ts-ignore - Third-party library without TypeScript definitions
import { Delaunay } from 'd3-delaunay';
import type { Location, MapRegion, SemanticPlacement, SemanticPosition, TacticalNode, TacticalMesh } from "./types"

// Calculate centroid of a polygon
export function getPolygonCentroid(points: [number, number][]): Location {
  let x = 0,
    y = 0
  for (const [px, py] of points) {
    x += px
    y += py
  }
  return { x: x / points.length, y: y / points.length }
}

// Check if point is inside polygon (ray casting)
export function isPointInPolygon(point: Location, polygon: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// Find which region contains a location
export function findRegionAtLocation(location: Location, regions: MapRegion[]): MapRegion | null {
  return regions.find((region) => isPointInPolygon(location, region.points)) || null
}

// Calculate distance between two locations
export function getDistance(a: Location, b: Location): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}

// Get regions adjacent to a given region (shared border)
export function getAdjacentRegions(regionId: string, regions: MapRegion[]): MapRegion[] {
  const region = regions.find((r) => r.id === regionId)
  if (!region) return []

  return regions.filter((other) => {
    if (other.id === region.id) return false
    // Simple heuristic: regions are adjacent if they're close
    const regionCentroid = getPolygonCentroid(region.points)
    const otherCentroid = getPolygonCentroid(other.points)
    return getDistance(regionCentroid, otherCentroid) < 150
  })
}

// Theater culling: Find border regions and support regions
export function generateTheaterOfOperations(
  playerUnitRegions: string[],
  enemyUnitRegions: string[],
  regions: MapRegion[],
): string[] {
  const theater = new Set<string>([...playerUnitRegions, ...enemyUnitRegions])

  // Add border regions (where player meets enemy)
  for (const playerId of playerUnitRegions) {
    const adjacent = getAdjacentRegions(playerId, regions)
    for (const adj of adjacent) {
      if (enemyUnitRegions.includes(adj.id)) {
        theater.add(adj.id)
      }
    }
  }

  // Add 1 layer of support regions
  const toAdd = new Set<string>()
  for (const rid of theater) {
    const adjacent = getAdjacentRegions(rid, regions)
    adjacent.forEach((adj) => toAdd.add(adj.id))
  }
  toAdd.forEach((id) => theater.add(id))

  return Array.from(theater)
}

// --- NEW: Topological Solvers ---

/**
 * 1. Find the shared edge between two regions (The Border)
 * Returns an array of points representing the border line.
 */
export function getSharedBorder(regionA: MapRegion, regionB: MapRegion): [number, number][] {
  // Heuristic: Find points in A that are very close to B
  // const threshold = 5; // Pixel tolerance
  // const borderPoints: [number, number][] = [];

  // In a real app, use Turf.js. For prototype, we verify proximity.
  // We simplify: Find the centroid of A and B. The border is the intersection of the line 
  // connecting centroids with the polygon edges. 
  // OR simpler: Return the midpoint between their centroids for visual abstraction.
  
  const cA = getPolygonCentroid(regionA.points);
  const cB = getPolygonCentroid(regionB.points);
  
  // Return a line segment representing the "Front"
  // Weighted midpoint logic
  // const midX = (cA.x + cB.x) / 2;
  // const midY = (cA.y + cB.y) / 2;
  
  return [[cA.x, cA.y], [cB.x, cB.y]]; // Simplified vector for now
}

// Helper: Get bounding box for sectors
export function getBoundingBox(points: [number, number][]) {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys)
  };
}

/**
 * 4. MESH GENERATOR (Replaces Grid system)
 * Uses Poisson Disk Sampling to fill organic shapes
 */
export function generateTacticalMesh(
  regions: MapRegion[], 
  minDistance: number = 25 
): TacticalMesh {
  let allNodes: TacticalNode[] = [];
  let allEdges: [TacticalNode, TacticalNode][] = [];
  let displayEdges: [TacticalNode, TacticalNode][] = [];

  // 1. Generate Nodes per Region
  regions.forEach(region => {
    const bounds = getBoundingBox(region.points);
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    
    // Create sampler for the bounding box
    const pds = new PoissonDiskSampling({
        shape: [width, height],
        minDistance: minDistance,
        maxDistance: minDistance * 1.5,
        tries: 10
    });
    
    const points = pds.fill();
    
    // Filter points inside the polygon
    const validPoints = points.map((p: [number, number]) => ({
      x: p[0] + bounds.minX,
      y: p[1] + bounds.minY
    })).filter((p: Location) => isPointInPolygon(p, region.points));
    
    // Create nodes
    const regionNodes: TacticalNode[] = validPoints.map((p: Location, i: number) => ({
      id: `${region.id}_node_${i}`,
      x: p.x,
      y: p.y,
      neighbors: [],
      terrain: 'plains', // Default
      isBorder: false, // Updated later
      regionId: region.id
    }));
    
    // 2. Intra-region Connectivity (Delaunay)
    if (regionNodes.length > 2) {
      const delaunay = Delaunay.from(regionNodes.map(n => [n.x, n.y]));
      
      // Iterate over Delaunay neighbors to build graph
      // returns iterator of index
      for (let i = 0; i < regionNodes.length; i++) {
        const neighbors = delaunay.neighbors(i);
        for (const neighborIdx of neighbors) {
           const neighbor = regionNodes[neighborIdx];
           // Add to node's neighbor list
           if (!regionNodes[i].neighbors.includes(neighbor.id)) {
              regionNodes[i].neighbors.push(neighbor.id);
           }
           // Add to edges list for rendering (avoid duplicates)
           if (i < neighborIdx) { // simple check to add edge once
               displayEdges.push([regionNodes[i], neighbor]);
           }
        }
      }
    }
    
    allNodes.push(...regionNodes);
  });
  
  // 3. Inter-region Connectivity (Stitching)
  // Connect nodes near shared borders of adjacent regions
  // Naive approach: Find nodes in Region A close to nodes in Region B
  
  // This step calculates actual graph edges across region boundaries
  // For prototype, we skip complex stitching and just return the localized meshes
  // OR we can do a distance check between border nodes
  
  return {
    nodes: allNodes,
    edges: displayEdges
  };
}

/**
 * 2. Get coordinates for a Compass Sector (e.g. "North", "South-East")
 */
export function getSectorPosition(region: MapRegion, sector: string): Location {
  const center = getPolygonCentroid(region.points);
  const bounds = getBoundingBox(region.points); 
  
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  
  // Push 25% towards the sector direction
  let dx = 0; 
  let dy = 0;
  
  if (sector.toLowerCase().includes('north')) dy -= height * 0.25;
  if (sector.toLowerCase().includes('south')) dy += height * 0.25;
  if (sector.toLowerCase().includes('east'))  dx += width * 0.25;
  if (sector.toLowerCase().includes('west'))  dx -= width * 0.25;
  
  return { x: center.x + dx, y: center.y + dy };
}

/**
 * 3. THE MASTER RESOLVER
 * Converts a vague AI command into X/Y pixels.
 */
export function resolveSemanticPosition(
  pos: SemanticPosition, 
  regions: MapRegion[],
  occupied: Location[] = [],
  mesh?: TacticalMesh // Optional mesh
): Location {
  
  const region = regions.find(r => r.id === pos.regionId);
  if (!region) return { x: 0, y: 0 }; // Fallback

  // 1. Calculate Ideal Semantic Point
  let idealPoint: Location;

  if (pos.type === 'centroid') {
    idealPoint = getPolygonCentroid(region.points);
  } 
  else if (pos.type === 'border' && pos.targetId) {
    const neighbor = regions.find(r => r.id === pos.targetId);
    if (neighbor) {
      const borderLine = getSharedBorder(region, neighbor);
      const t = pos.offset ?? 0.8; 
      idealPoint = {
        x: borderLine[0][0] * (1-t) + borderLine[1][0] * t,
        y: borderLine[0][1] * (1-t) + borderLine[1][1] * t
      };
    } else {
       idealPoint = getPolygonCentroid(region.points);
    }
  } 
  else if (pos.type === 'sector' && pos.targetId) {
    idealPoint = getSectorPosition(region, pos.targetId);
  } 
  else {
    idealPoint = getPolygonCentroid(region.points);
  }

  // 2. Snap to Mesh Node (if mesh provided, otherwise fallback to generator)
  let candidatePoints: Location[];

  if (mesh) {
    // Filter nodes in this region
    candidatePoints = mesh.nodes.filter(n => n.regionId === region.id);
  } else {
     // Generate temporary mesh (Legacy/Fallback mode)
      const tempMesh = generateTacticalMesh([region], region.gridScale || 25);
      candidatePoints = tempMesh.nodes;
  }

  // 3. Collision Logic
  const availablePoints = candidatePoints.filter(p => {
    return !occupied.some(occ => getDistance(p, occ) < 1.0);
  });
  
  const searchSpace = availablePoints.length > 0 ? availablePoints : candidatePoints;
  if (searchSpace.length === 0) return idealPoint; // Fallback if no nodes

  let closestPoint = searchSpace[0];
  let minDist = Number.MAX_VALUE;

  for (const p of searchSpace) {
    const d = getDistance(p, idealPoint);
    if (d < minDist) {
      minDist = d;
      closestPoint = p;
    }
  }

  return closestPoint;
}
