import type { WarRoomScenario, RegionLayoutDef } from "../types"
import { generateVoronoiRegions, type SeedPoint } from "../grid-engine/voronoi-generator"
import { generatePaintedMap } from "../grid-engine/map-painter"

// Import individual scenario files
import { blitzkrieg } from "./scenarios/blitzkrieg"
import { austerlitz } from "./scenarios/austerlitz"
import { medievalSiege } from "./scenarios/medieval-siege"
import { redCliffs } from "./scenarios/red-cliffs"
import { hydaspes } from "./scenarios/hydaspes"

export const SCENARIOS: Record<string, WarRoomScenario> = {
  ww2_blitzkrieg: blitzkrieg,
  napoleonic_austerlitz: austerlitz,
  medieval_siege: medievalSiege,
  three_kingdoms_red_cliffs: redCliffs,
  ancient_india_hydaspes: hydaspes,
}

export const MOCK_SCENARIO = SCENARIOS.ww2_blitzkrieg
