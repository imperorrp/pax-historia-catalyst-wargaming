import type { WarRoomScenario, CatalystOption } from "../types";

export function buildTurnPrompt(
  scenario: WarRoomScenario, 
  tactic: CatalystOption, 
  round: number
): string {
  // 1. Geography Summary with available region IDs
  const regionList = scenario.mapRegions.map(r => r.id);
  const regions = scenario.mapRegions.map(r => {
     // Find units in this region
     const unitsHere = scenario.units.filter(u => u.placement?.regionId === r.id);
     const unitNames = unitsHere.map(u => `${u.name} [${u.id}] (${u.owner})`).join(", ");
     return `- REGION [${r.id}] "${r.name}" (${r.terrain}): Contains [${unitNames || "Empty"}]`;
  }).join("\n");

  // 2. Unit Status Summary with placement info
  const playerUnits = scenario.units.filter(u => u.owner === 'player');
  const enemyUnits = scenario.units.filter(u => u.owner === 'enemy');
  
  const formatUnit = (u: any) => {
     const placement = u.placement ? `at ${u.placement.regionId}/${u.placement.tag}` : "unplaced";
     return `- UNIT [${u.id}] "${u.name}" (${u.type}): ${placement}, Tags [${u.tags.join(", ")}], Status: ${u.status}`;
  };
  
  const playerUnitsSummary = playerUnits.map(formatUnit).join("\n");
  const enemyUnitsSummary = enemyUnits.map(formatUnit).join("\n");

  // 3. Tactic Context with composite actions
  const compositeActionsStr = tactic.compositeActions 
    ? tactic.compositeActions.map((a: any) => `  - ${a.semanticAction}: ${a.description || ''} (target: ${a.targetLogic})`).join("\n")
    : "None specified";
    
  const tacticInfo = `
    TACTIC SELECTED: "${tactic.title}" (ID: ${tactic.id})
    DESCRIPTION: "${tactic.description}"
    
    COMPOSITE ACTIONS EXPECTED:
${compositeActionsStr}
  `;

  return `
CURRENT ROUND: ${round}

### AVAILABLE REGIONS (Use these IDs for semantic_update)
${regionList.join(", ")}

### BATTLEFIELD STATE
${regions}

### PLAYER FORCES (${playerUnits.length} units)
${playerUnitsSummary}

### ENEMY FORCES (${enemyUnits.length} units)
${enemyUnitsSummary}

### PLAYER ACTION
${tacticInfo}

### REASONING GUIDANCE
Think about:
1. What physical movement does this tactic imply? (Advancing? Retreating? Reforming?)
2. How many units are affected by this order?
3. Where should units end up relative to the enemy?
4. What would a player expect to SEE happen on the map?

Remember: Movement is visual feedback. If units don't move, the player feels nothing happened.
  `;
}


