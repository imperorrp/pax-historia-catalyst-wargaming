export interface Location {
  x: number
  y: number
}

export interface Unit {
  id: string
  name: string
  type: "armor" | "infantry" | "cavalry" | "artillery"
  owner: "player" | "enemy"
  location: Location
  tags: string[]
  visibility?: number // 0-100, for fog of war
  status?: "fresh" | "engaged" | "wavering" | "routing" // New: unit morale/cohesion state
}

export interface CatalystOption {
  id: string
  title: string
  description: string
  semanticAction: VisualActionType // Updated from visualPath
  requiredUnitTypes?: ("armor" | "infantry" | "cavalry" | "artillery")[]
}

export interface MapRegion {
  id: string
  name: string
  points: [number, number][]
  terrain?: "plains" | "forest" | "mountain" | "urban" | "river"
  isFort?: boolean
  isCity?: boolean
}

export type VisualActionType =
  | "ADVANCE"
  | "ASSAULT"
  | "FLANK_LEFT"
  | "FLANK_RIGHT"
  | "RETREAT"
  | "INFILTRATE"
  | "ENCIRCLE"
  | "SPEARHEAD"
  | "FORTIFY"
  | "BLOCKADE"
  | "HOLD"
  | "AMBUSH"
  | "BOMBARD"
  | "SUPPRESS"
  | "SEVER_SUPPLY"
  | "FEINT"

export interface VisualPlan {
  title: string
  steps: VisualStep[]
}

export interface VisualStep {
  unit_id: string
  action: VisualActionType
  target: string // unit_id or region_id
  pivot?: string // optional intermediate region for pathfinding
  phaseOpacity?: number // for multi-step sequencing (0-1)
}

export interface ActionResolution {
  operation: string
  vectors: Vector[]
  modifiers: {
    river_crossing?: boolean
    urban_combat?: boolean
    enemy_entrenchment?: "low" | "medium" | "high"
    terrain_advantage?: "own" | "enemy" | "neutral"
  }
}

export interface Vector {
  source: string // unit/region ID
  target: string // unit/region ID
  type: string // action type
}

export interface WarRoomScenario {
  id: string // Added scenario ID for switcher
  name: string // Added scenario name
  era: "WW2" | "Napoleonic" | "Ancient" | "Medieval"
  playerPolity: string
  enemyPolity: string
  mapRegions: MapRegion[]
  units: Unit[]
  options: CatalystOption[]
  mapDimensions: {
    width: number
    height: number
  }
}

export interface AIGameResponse {
  narrative_update: string
  state_changes: StateChange[]
  visual_fx: VisualEffect[]
  next_options: CatalystOption[]
}

export interface StateChange {
  unit_id: string
  action: "MOVE" | "UPDATE_STATUS" | "REMOVE"
  to_region?: string
  new_tags?: string[]
  new_location?: Location
}

export interface VisualEffect {
  type: "MUD_SPLAT" | "EXPLOSION" | "SMOKE" | "FIRE" | "DUST" | "IMPACT"
  region?: string
  target_unit?: string
  position?: Location
}

export interface GameLoopContext {
  current_round: number
  chosen_tactic: CatalystOption
  scenario: WarRoomScenario
  units: Unit[]
  map_context: {
    weather?: string
    regions: MapRegion[]
  }
}
