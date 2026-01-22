import { useAIStore } from "./ai/store"
import { SAMPLE_PAYLOADS } from "./mock-data/ai-payloads"
import { resolveSemanticPosition } from "./geometry-utils"
import { WarRoomScenario, GameLoopContext, AIGameResponse } from "@/lib/types"

// Helper to generate a fake prompt for visualization
function generateMockPrompt(tacticId: string, round: number) {
  return `[SYSTEM]: SIMULATING PROMPT FOR ROUND ${round}
[CONTEXT]: Player selected tactic ID "${tacticId}"
[TASK]: Resolve combat interaction based on current unit positions.
[NOTE]: This is a pre-generated mock prompt for demonstration.`
}

export async function  resolveTurn(tacticId: string, currentRound: number, scenario?: WarRoomScenario, tactic?: any): Promise<any> {
  const store = useAIStore.getState();
  
  if (store.isMockMode) {
    // Log a "Fake" transaction for consistency in UI
    const txId = store.startTransaction('TURN_RES', `Tactic:${tacticId} Round:${currentRound}`);
    await new Promise(resolve => setTimeout(resolve, 800)); // Fake delay
    
    // In mock mode, we use the tacticID to look up a predefined payload
    const mockPayload = getInitialPayload(tacticId) || SAMPLE_PAYLOADS["bk_opt_panzer"];
    
    // Set mock prompt message for UI
    store.setMockPrompt('TURN');
    
    store.completeTransaction(txId, {
       ...mockPayload,
       _note: "MOCK DATA - No AI was called."
    });
    return mockPayload;
  } 
  
  // REAL AI CALL
  const txId = store.startTransaction('TURN_RES', `Mock:${tacticId} Round:${currentRound}`);
  
  try {
    // 1. Get fresh state values
    const currentState = useAIStore.getState();
    const { provider, openaiKey, googleKey, selectedModel, turnSystemPrompt } = currentState;

    // 2. Prepare Headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Explicitly attach the key for the ACTIVE provider
    if (provider === 'google' && googleKey) {
      headers['x-google-key'] = googleKey;
    } else if (provider === 'openai' && openaiKey) {
      headers['x-openai-key'] = openaiKey;
    }

    const response = await fetch('/api/resolve-turn', {
      method: 'POST',
      headers: headers, // Use the constructed headers object
      body: JSON.stringify({ 
        scenario, 
        tactic, 
        round: currentRound,
        config: {
          provider,
          model: selectedModel,
          systemPrompt: turnSystemPrompt
        }
      })
    });

    // CRITICAL FIX: Read text first to ensure we capture raw output even if JSON is invalid
    const rawText = await response.text();
    let data: any;

    try {
      data = JSON.parse(rawText);
    } catch (parseErr: any) {
      // Include HTTP status for more context in the error message
      const statusInfo = ` (status ${response.status} ${response.statusText})`;
      
      store.failTransaction(txId, `Response JSON parse error: ${parseErr.message}${statusInfo}`, rawText, undefined);

      // Re-throw to be handled by outer catch (which avoids duplicate failures)
      throw parseErr;
    }

    if (!response.ok) {
      if (data && data.raw) {
         // Create a more descriptive error message combining the error logic and details
         const detailedError = `Schema/Validation Failed: ${data.details || data.error}`;
         store.failTransaction(txId, detailedError, data.raw, data.usage);
         
         // Throw a user-friendly error but the store already has the full details
         throw new Error(data.error); 
      }

      throw new Error(data.error || "Unknown API Error");
    }

    // CRITICAL FIX: Update the store with the prompts used on the server
    if (data.prompt && data.systemPrompt) {
       store.setLastPrompts('TURN', data.prompt, data.systemPrompt);
    }

    // Success (API returns a wrapper { data, raw, usage })
    store.completeTransaction(txId, data);
    return data.data; // Return the actual payload

  } catch (e: any) {
    if (useAIStore.getState().history.find(h => h.id === txId)?.status === 'pending') {
      store.failTransaction(txId, e.message);
    }
    console.error("AI Failure:", e);
    return null;
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
  const regionIds = new Set((scenario.mapRegions || []).map((r: any) => r.id));

  // ---------------------------------------------------------
  // PATH A: NEW SCHEMA (state_changes / unit_updates aliases)
  // ---------------------------------------------------------
  // Since we migrated schema to use state_changes but some legacy internal logic might use unit_updates
  // We prioritize the array that actually has content.
  const updates: any[] = (response.state_changes && response.state_changes.length > 0) 
    ? response.state_changes 
    : (response.unit_updates && response.unit_updates.length > 0)
      // Map old schema to new internal format for consistent processing
      ? response.unit_updates.map((u: any) => ({
          unit_id: u.unitId,
          action: (u.position_update ? "MOVE" : (u.status === 'eliminated' ? "REMOVE" : "UPDATE_STATUS")) as any,
          semantic_update: u.position_update,
          new_tags: u.status ? [u.status] : []
        }))
      : [];

  // Track occupied hexes to prevent stacking
  // 1. Mark hexes of units that will NOT move.
  const occupiedHexes = new Set<string>();
  
  // We need to know which units are moving first.
  const movingUnitIds = new Set(updates.filter((u: any) => u.action === 'MOVE').map((u: any) => u.unit_id));
  const removedUnitIds = new Set(updates.filter((u: any) => u.action === 'REMOVE').map((u: any) => u.unit_id));

  scenario.units.forEach((u: any) => {
    if (!movingUnitIds.has(u.id) && !removedUnitIds.has(u.id) && u.hex) {
      occupiedHexes.add(`${u.hex.q},${u.hex.r}`);
    }
  });

  // 2. Process units
  const updatedUnits = scenario.units.map((unit) => {
    const change = updates.find((c) => c.unit_id === unit.id);

    // Case 1: No Change
    if (!change) return unit;

    // Case 2: Removed
    if (change.action === "REMOVE") {
      return null as any;
    }

    // Case 3: Move with semantic update
    if (change.action === "MOVE" && change.semantic_update) {
       // SANITIZATION: Check if target region actually exists
       if (!regionIds.has(change.semantic_update.regionId)) {
        console.warn(`AI Hallucination: Moved ${unit.id} to '${change.semantic_update.regionId}' which does not exist.`);
        return unit; // Ignore move
      }

      if (!scenario.hexGrid) {
        console.warn("No hexGrid available for movement");
        return unit; 
      }

      const targetRegionHexes = scenario.hexGrid.filter((h: any) => h.regionId === change.semantic_update!.regionId);
      if (targetRegionHexes.length === 0) {
        console.warn(`No hexes found for region ${change.semantic_update!.regionId}`);
        return unit;
      }

      // SMART PLACEMENT LOGIC:
      // Trycenter, then spiral out
      const centerIndex = Math.floor(targetRegionHexes.length / 2);
      // Sort hexes by distance to center to try "nearest valid"
      const centerHex = targetRegionHexes[centerIndex];
      
      const sortedCandidates = [...targetRegionHexes].sort((a, b) => {
         const distA = Math.hypot(a.q - centerHex.q, a.r - centerHex.r);
         const distB = Math.hypot(b.q - centerHex.q, b.r - centerHex.r);
         return distA - distB;
      });

      let chosenHex = sortedCandidates.find(h => !occupiedHexes.has(`${h.q},${h.r}`));
      
      // If region is FULL, fallback to center (stacking unavoidable)
      if (!chosenHex) {
        chosenHex = centerHex;
      } else {
        occupiedHexes.add(`${chosenHex.q},${chosenHex.r}`);
      }

      return {
        ...unit,
        hex: { q: chosenHex.q, r: chosenHex.r },
        placement: change.semantic_update,
        tags: change.new_tags || unit.tags,
      };
    }

    // Case 4: Status update only
    if (change.action === "UPDATE_STATUS") {
      return {
        ...unit,
        tags: change.new_tags || unit.tags,
      }
    }

    return unit;
  });

  const finalUnits = updatedUnits.filter(Boolean);

  return {
    ...scenario,
    units: finalUnits,
    options: response.next_tactical_options || response.next_options || scenario.options,
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
    narrative_outcome: "End of simulation data. No further pre-scripted events available for this branch.",
    unit_updates: [],
    state_changes: [],
    visual_fx: [],
    next_tactical_options: [],
    next_options: []
  }
}
