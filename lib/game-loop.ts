import { useAIStore } from "./ai/store"
import { SAMPLE_PAYLOADS } from "./mock-data/ai-payloads"
import { resolveSemanticPosition } from "./geometry-utils"

// Helper to generate a fake prompt for visualization
function generateMockPrompt(tacticId: string, round: number) {
  return `[SYSTEM]: SIMULATING PROMPT FOR ROUND ${round}
[CONTEXT]: Player selected tactic ID "${tacticId}"
[TASK]: Resolve combat interaction based on current unit positions.
[NOTE]: This is a pre-generated mock prompt for demonstration.`
}

export async function resolveTurn(tacticId: string, currentRound: number, scenario?: WarRoomScenario, tactic?: any): Promise<any> {
  const { isMockMode, setTurnTransaction, setLoading, provider, openaiKey, googleKey, selectedModel, turnSystemPrompt } = useAIStore.getState()
  
  setLoading(true)

  if (isMockMode) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // In mock mode, we use the tacticID to look up a predefined payload
    // If scenario/tactic passed, we could theoretically build a dynamic mock response,
    // but here we trust the hardcoded samples for safety.
    const mockPayload = getInitialPayload(tacticId) || SAMPLE_PAYLOADS["bk_opt_panzer"]; // Fallback
    const mockPrompt = generateMockPrompt(tacticId, currentRound)
    
    setTurnTransaction(mockPrompt, "MOCK MODE: No system prompt.", mockPayload)
    setLoading(false)
    return mockPayload
  } else {
    // REAL AI CALL (Phase 4)
    try {
      if (!scenario || !tactic) {
        throw new Error("Scenario and Tactic are required for live AI resolution")
      }

      const response = await fetch('/api/resolve-turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pass keys if provided by user, otherwise server falls back to env
          ...(openaiKey ? { 'x-openai-key': openaiKey } : {}),
          ...(googleKey ? { 'x-google-key': googleKey } : {})
        },
        body: JSON.stringify({ 
          scenario, 
          tactic, 
          round: currentRound,
          config: {
            provider,
            model: selectedModel,
            systemPrompt: turnSystemPrompt // Pass user overrides
          }
        })
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "AI Request Failed")
      }

      const data = await response.json()
      setTurnTransaction(data.prompt, data.systemPrompt || "System prompt not returned.", data.payload) // API returns all three
      setLoading(false)
      return data.payload
    } catch (e) {
      console.error(e)
      setLoading(false)
      alert("AI Error: " + (e as Error).message)
      return null
    }
  }
}

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
  // Capture region IDs for sanity check
  const regionIds = new Set(scenario.mapRegions.map(r => r.id));

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
      // SANITIZATION: Check if target region actually exists
      if (!regionIds.has(change.semantic_update.regionId)) {
        console.warn(`AI Hallucination: Tried to move unit to non-existent region ${change.semantic_update.regionId}`);
        return unit; // Ignore move, keep unit where it is
      }
      
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
    options: response.next_options !== undefined 
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

  // Final fallback to prevent infinite loops: Return an "End of Mock Data" payload
  console.warn(`No payload found for tacticId: ${tacticId}. Ending simulation.`)
  return {
    narrative_update: "End of simulation data. No further pre-scripted events available for this branch.",
    state_changes: [],
    visual_fx: [],
    next_options: []
  }
}
