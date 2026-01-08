import type { Location, MapRegion } from "./types"

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
