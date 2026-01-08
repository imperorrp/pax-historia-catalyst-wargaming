import type { CatalystOption, Unit, MapRegion } from "./types"

export function generateTacticalPrompt(
  tactic: CatalystOption,
  sourceUnit: Unit,
  targetRegion: MapRegion,
  sourceRegion: MapRegion,
): string {
  const tacticalContext = {
    maneuver: tactic.title,
    unit: sourceUnit.name,
    unitType: sourceUnit.type,
    fromRegion: sourceRegion.name,
    toRegion: targetRegion.name,
    visualPath: tactic.visualPath,
  }

  return `TACTICAL CATALYST ACTIVATED:

The player has committed the ${tacticalContext.unitType.toUpperCase()} unit "${tacticalContext.unit}" 
to execute a [${tacticalContext.maneuver}] maneuver from "${tacticalContext.fromRegion}" 
into enemy territory at "${tacticalContext.toRegion}".

TACTICAL CONTEXT:
- Maneuver Type: ${tacticalContext.maneuver}
- Unit Classification: ${tacticalContext.unitType}
- Attack Vector: ${tacticalContext.visualPath === "curve_left" ? "Left Flank" : tacticalContext.visualPath === "curve_right" ? "Right Flank" : tacticalContext.visualPath === "pincer" ? "Encirclement" : "Direct Assault"}
- Source Position: ${tacticalContext.fromRegion}
- Target Position: ${tacticalContext.toRegion}

Please narrate the tactical execution and battlefield outcome of this engagement, describing the strategic implications for both sides.`
}
