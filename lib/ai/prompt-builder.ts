import type { WarRoomScenario, CatalystOption } from "../types";

export function buildTurnPrompt(
  scenario: WarRoomScenario, 
  tactic: CatalystOption, 
  round: number
): string {
  // 1. Geography Summary
  const regions = scenario.mapRegions.map(r => {
     // Find units in this region
     const unitsHere = scenario.units.filter(u => u.placement?.regionId === r.id);
     const unitNames = unitsHere.map(u => `${u.name} (${u.owner})`).join(", ");
     return `- REGION [${r.id}] "${r.name}" (${r.terrain}): Contains [${unitNames || "Empty"}]`;
  }).join("\n");

  // 2. Unit Status Summary
  const units = scenario.units.map(u => {
     return `- UNIT [${u.id}] "${u.name}" (${u.type}): Tags [${u.tags.join(", ")}], Status: ${u.status}`;
  }).join("\n");

  // 3. Tactic Context
  // Ensure we handle simplified mock objects if needed
  const tacticInfo = `
    TACTIC SELECTED: "${tactic.title}" (ID: ${tactic.id})
    TYPE: ${tactic.semanticAction}
    TARGET LOGIC: ${tactic.targetLogic || "N/A"}
    DESCRIPTION: "${tactic.description}"
  `;

  return `
    CURRENT ROUND: ${round}
    
    ### BATTLEFIELD STATE
    ${regions}

    ### UNIT STATUS
    ${units}

    ### PLAYER ACTION
    ${tacticInfo}

    ### INSTRUCTIONS
    Calculate the outcome. 
    - If the tactic effectively counters the enemy (e.g., Flanking a fixed position), give the player a major advantage.
    - If the tactic is weak against the terrain (e.g., Cavalry charge into Mud), punish the player.
    - Update the 'tags' and 'status' of units to reflect this outcome.
  `;
}
