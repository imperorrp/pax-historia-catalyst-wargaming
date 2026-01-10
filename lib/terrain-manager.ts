// Phase 2: Feature & Terrain Injection
import type { TacticalNode, TacticalMesh } from "./types"
import { getDistance } from "./geometry-utils"

export type TerrainType = 'plains' | 'forest' | 'urban' | 'water' | 'mountain';

export class TerrainManager {

  /**
   * Applies a terrain feature to a set of nodes based on a semantic anchor.
   * e.g. "Add Forest to the North"
   */
  static applyTerrainFeature(
    mesh: TacticalMesh,
    regionId: string,
    type: TerrainType,
    anchor: 'north' | 'south' | 'east' | 'west' | 'center',
    radius: number = 2 // Number of hops or physical distance? User said "radius: 3", implies hops or distance.
    // Let's assume neighbor hops for graph logic, or distance. Graph hops is safer for "mesh" logic. 
  ) {
    const regionNodes = mesh.nodes.filter(n => n.regionId === regionId);
    if (regionNodes.length === 0) return;

    // 1. Find Anchor Node
    let startNode = regionNodes[0];
    
    // Calculate bounding box of region nodes to find extremes
    const xs = regionNodes.map(n => n.x);
    const ys = regionNodes.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Closest node to target point
    let targetX = centerX;
    let targetY = centerY;

    if (anchor === 'north') targetY = minY;
    if (anchor === 'south') targetY = maxY;
    if (anchor === 'east') targetX = maxX;
    if (anchor === 'west') targetX = minX;

    let minDist = Number.MAX_VALUE;
    for (const node of regionNodes) {
      const d = Math.sqrt(Math.pow(node.x - targetX, 2) + Math.pow(node.y - targetY, 2));
      if (d < minDist) {
        minDist = d;
        startNode = node;
      }
    }

    // 2. Flood Fill / BFS to find neighbors within radius
    const toUpdate = new Set<string>();
    const queue: {node: TacticalNode, dist: number}[] = [{node: startNode, dist: 0}];
    const visited = new Set<string>([startNode.id]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      toUpdate.add(current.node.id);

      if (current.dist < radius) {
        for (const neighborId of current.node.neighbors) {
          if (!visited.has(neighborId)) {
            const neighborNode = mesh.nodes.find(n => n.id === neighborId);
            if (neighborNode) {
              visited.add(neighborId);
              queue.push({ node: neighborNode, dist: current.dist + 1 });
            }
          }
        }
      }
    }

    // 3. Apply changes
    mesh.nodes.forEach(node => {
      if (toUpdate.has(node.id)) {
        node.terrain = type;
      }
    });
  }

  /**
   * Identifies chokepoints based on graph connectivity (Bridge detection).
   * Simplified: Nodes with high centrality or articulation points.
   * For prototype: Find nodes that connect two large subgraphs.
   */
  static identifyChokepoints(mesh: TacticalMesh) {
    // TODO: Implement bridge detection algorithm (Tarjan's or similar)
    // For now, we leave as placeholder
  }
}
