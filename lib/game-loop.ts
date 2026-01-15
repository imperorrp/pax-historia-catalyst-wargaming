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
    options: response.next_options && response.next_options.length > 0 
      ? response.next_options 
      : scenario.options,
  }
}

function getWeatherForRound(round: number): string {
  const weatherOptions = ["Clear", "Cloudy", "Rainy", "Muddy", "Foggy"]
  return weatherOptions[round % weatherOptions.length]
}

export function getInitialPayload(tacticId: string): AIGameResponse | null {
  // Direct lookup for new scenarios where payload key matches tactic ID
  if (SAMPLE_PAYLOADS[tacticId]) {
    return SAMPLE_PAYLOADS[tacticId]
  }

  // Fallback map for legacy/development IDs
  const legacyMap: Record<string, keyof typeof SAMPLE_PAYLOADS> = {
    // Blitzkrieg
    opt_1: "bk_opt_panzer",
    opt_2: "bk_opt_ardennes",
    opt_3: "bk_opt_combined",
    
    // Austerlitz (if old IDs are used)
    nopt_1: "nopt_main",
    nopt_2: "nopt_feint",
    nopt_3: "nopt_combined",

    // Hydaspes
    hyd_opt_1: "hyd_opt_1", 
    // ... others map 1:1 usually
  }

  const mappedKey = legacyMap[tacticId]
  if (mappedKey && SAMPLE_PAYLOADS[mappedKey]) {
    return SAMPLE_PAYLOADS[mappedKey]
  }

  // Final fallback to prevent crash
  console.warn(`No payload found for tacticId: ${tacticId}`)
  return SAMPLE_PAYLOADS["bk_opt_panzer"] || null
}
