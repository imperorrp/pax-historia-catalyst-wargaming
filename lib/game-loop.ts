import type { AIGameResponse, GameLoopContext, WarRoomScenario } from "./types"
import { SAMPLE_PAYLOADS } from "./ai-payloads"

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
  const updatedUnits = scenario.units.map((unit) => {
    const change = response.state_changes.find((c) => c.unit_id === unit.id)
    if (!change) return unit

    if (change.action === "REMOVE") {
      return null as any
    }

    if (change.action === "MOVE" && change.to_region) {
      const targetRegion = scenario.mapRegions.find((r) => r.id === change.to_region)
      if (targetRegion) {
        const centerX = targetRegion.points.reduce((sum, p) => sum + p[0], 0) / targetRegion.points.length
        const centerY = targetRegion.points.reduce((sum, p) => sum + p[1], 0) / targetRegion.points.length

        return {
          ...unit,
          location: { x: centerX, y: centerY },
          tags: change.new_tags || unit.tags,
        }
      }
    }

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
