import type { AIGameResponse, GameLoopContext, WarRoomScenario, Location, Unit } from "./types"
import { SAMPLE_PAYLOADS } from "./ai-payloads"
import { resolveSemanticPosition } from "./geometry-utils"

export function createGameLoopContext(scenario: WarRoomScenario, round: number, selectedTactic: any): GameLoopContext {
  return {
    current_round: round,
    chosen_tactic: selectedTactic,
    scenario,
    units: scenario.units,
    map_context: {
      regions: scenario.mapRegions,
      weather: getWeatherForRound(round),
    },
  }
}

export function reconcileStateChanges(scenario: WarRoomScenario, response: AIGameResponse): WarRoomScenario {
  // 1. Identify occupied positions from units that are NOT moving or being removed
  // This allows moving units to take spots vacated by others, while avoiding collisions with stationary/already-moved units.
  const occupiedLocations: Location[] = [];
  
  scenario.units.forEach(unit => {
    const change = response.state_changes.find(c => c.unit_id === unit.id);
    // If no change, or change is just status update, it stays put. 
    // If action is MOVE or REMOVE, it leaves its current spot.
    const isMovingOrRemoved = change && (change.action === 'MOVE' || change.action === 'REMOVE');
    
    if (!isMovingOrRemoved) {
      occupiedLocations.push(unit.location);
    }
  });

  // 2. Process all units
  const updatedUnits = scenario.units.map((unit) => {
    const change = response.state_changes.find((c) => c.unit_id === unit.id)
    
    // Case 1: No Change
    if (!change) return unit

    // Case 2: Removed
    if (change.action === "REMOVE") {
      return null as any
    }

    // Case 3: Move (Semantic)
    if (change.action === "MOVE" && change.semantic_update) {
      // Pass the CURRENT list of occupied locations (including stationary units + any already processed movers)
      // Note: Since we use .map, 'occupiedLocations' currently only has stationary units.
      // Ideally we should process serially if we want unit A to avoid unit B's *new* location if A comes after B in the list.
      // But standard .map is fine if we accept that "later" units avoid "earlier" units only if we push to array.
      // To disable self-collision for the moment of calculation? No, the unit is moving *to* a new spot.
      
      const newXY = resolveSemanticPosition(
        change.semantic_update, 
        scenario.mapRegions,
        occupiedLocations, // Pass the collision mask
        undefined // Pass undefined instead of non-existent tacticalMesh
      )

      // SNAP TO HEX (New Logic)
      let newQ = unit.q;
      let newR = unit.r;
      let finalLocation = newXY;

      if (scenario.hexGrid) {
        // Find nearest hex to the resolved Euclidean point
        // Simple distance check against all hexes (O(N) but N is small ~300)
        let nearestHex: any = null;
        let minDist = Infinity;
        const MAX_SNAP_DISTANCE = 150; // Don't snap to hexes more than 150px away
        
        for (const hex of scenario.hexGrid) {
          // Validate hex is within map bounds
          if (hex.x < 0 || hex.x > scenario.mapDimensions.width || 
              hex.y < 0 || hex.y > scenario.mapDimensions.height) {
            continue; // Skip out-of-bounds hexes
          }
          
          const dx = hex.x - newXY.x;
          const dy = hex.y - newXY.y;
          const dist = dx*dx + dy*dy;
          
          if (dist < minDist && dist < MAX_SNAP_DISTANCE * MAX_SNAP_DISTANCE) {
             minDist = dist;
             nearestHex = hex;
          }
        }
        
        if (nearestHex) {
           newQ = nearestHex.q;
           newR = nearestHex.r;
           finalLocation = { x: nearestHex.x, y: nearestHex.y }; // Sync location to hex center
        }
      }

      // Mark this new spot as taken for subsequent units in this very loop?
      // map() function runs synchronously, so if we push to occupiedLocations HERE, 
      // the next iteration of map() will see it.
      occupiedLocations.push(finalLocation);

      return {
        ...unit,
        location: finalLocation,
        q: newQ, // update hex coord
        r: newR, // update hex coord
        semanticPos: change.semantic_update,
        tags: change.new_tags || unit.tags,
      }
    }

    // Case 4: Move (Legacy/Fallback)
    if (change.action === "MOVE" && change.to_region) {
      const targetRegion = scenario.mapRegions.find((r) => r.id === change.to_region)
      if (targetRegion) {
        // Fallback: Just center (not collision checked currently as it's legacy)
        const centerX = targetRegion.points.reduce((sum, p) => sum + p[0], 0) / targetRegion.points.length
        const centerY = targetRegion.points.reduce((sum, p) => sum + p[1], 0) / targetRegion.points.length
        
        const newLoc = { x: centerX, y: centerY };
        occupiedLocations.push(newLoc);

        return {
          ...unit,
          location: newLoc,
          tags: change.new_tags || unit.tags,
        }
      }
    }

    // Case 5: Status Update
    if (change.action === "UPDATE_STATUS") {
      return {
        ...unit,
        tags: change.new_tags || unit.tags,
      }
    }

    return unit
  })

  return {
    ...scenario,
    units: updatedUnits.filter(Boolean),
  }
}

function getWeatherForRound(round: number): string {
  const weatherOptions = ["Clear", "Cloudy", "Rainy", "Muddy", "Foggy"]
  return weatherOptions[round % weatherOptions.length]
}

export function getInitialPayload(tacticId: string): AIGameResponse | null {
  // Map tactic IDs to sample payloads based on scenario context
  const payloadMap: Record<string, keyof typeof SAMPLE_PAYLOADS> = {
    // WW2 Blitzkrieg tactics
    opt_1: "ww2_flank_left_success", // Flank Left → Success example
    opt_2: "ww2_flank_left_failure", // Frontal Assault → Failure example
    opt_3: "ww2_flank_left_success", // Encirclement → Success

    // Napoleonic tactics
    nopt_1: "napoleonic_assault_success", // Breakthrough Center
    nopt_2: "napoleonic_assault_success", // Feint Right Flank
    nopt_3: "napoleonic_assault_success", // Supply Interdiction
    nopt_4: "napoleonic_assault_success", // Cavalry Charge

    // Medieval tactics
    medopt_1: "medieval_siege_success", // Bombard Walls
    medopt_2: "medieval_siege_success", // Fortify Siege Lines
    medopt_3: "medieval_siege_success", // Infiltrate Supply
    medopt_4: "medieval_siege_success", // Night Raid
    medopt_5: "medieval_siege_success", // Suppress Garrison
  }

  const payloadKey = payloadMap[tacticId] || "ww2_flank_left_success"
  return SAMPLE_PAYLOADS[payloadKey] || null
}
