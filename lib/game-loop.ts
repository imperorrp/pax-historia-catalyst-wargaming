import type { AIGameResponse, GameLoopContext, WarRoomScenario, Location, Unit } from "./types"
import { SAMPLE_PAYLOADS } from "./mock-data/ai-payloads"
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
  // Process all units and apply state changes
  const updatedUnits = scenario.units.map((unit) => {
    const change = response.state_changes.find((c) => c.unit_id === unit.id)
    
    // Case 1: No Change
    if (!change) return unit

    // Case 2: Removed
    if (change.action === "REMOVE") {
      return null as any
    }

    // Case 3: Move with semantic update
    if (change.action === "MOVE" && change.semantic_update) {
      // Find target hex using the semantic placement
      if (!scenario.hexGrid) {
        console.warn("No hexGrid available for movement");
        return unit;
      }

      const targetRegionHexes = scenario.hexGrid.filter(h => h.regionId === change.semantic_update!.regionId);
      if (targetRegionHexes.length === 0) {
        console.warn(`No hexes found for region ${change.semantic_update!.regionId}`);
        return unit;
      }

      // Use simple center placement for the target region
      const centerHex = targetRegionHexes[Math.floor(targetRegionHexes.length / 2)];
      
      return {
        ...unit,
        hex: { q: centerHex.q, r: centerHex.r }, // Use hex object, not standalone q/r
        placement: change.semantic_update,
        tags: change.new_tags || unit.tags,
      }
    }

    // Case 4: Status update only
    if (change.action === "UPDATE_STATUS") {
      return {
        ...unit,
        tags: change.new_tags || unit.tags,
      }
    }

    // Default: return unchanged
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
    medopt_6: "medieval_siege_success", // Bridge Control
    
    // Three Kingdoms
    tk_opt_1: "three_kingdoms_fire_success",
    tk_opt_2: "medieval_siege_success", // Recycle generic success for now
    
    // Hydaspes
    hyd_opt_1: "hydaspes_stampede",
    hyd_opt_2: "hydaspes_stampede",
    hyd_opt_3: "hydaspes_stampede",
  }

  const payloadKey = payloadMap[tacticId] || "ww2_flank_left_success"
  return SAMPLE_PAYLOADS[payloadKey] || null
}
