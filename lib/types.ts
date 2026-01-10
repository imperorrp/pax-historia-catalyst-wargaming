export interface Location {
  x: number
  y: number
}

// Phase 1: Mesh System
export interface TacticalNode {
  id: string; // e.g. "region-1-node-45"
  x: number;
  y: number;
  neighbors: string[]; // IDs of connected nodes
  terrain: 'plains' | 'forest' | 'urban' | 'water' | 'mountain';
  isBorder: boolean;
  regionId: string; // Which region generated this node?
}

// The mesh for the entire map
export interface TacticalMesh {
  nodes: TacticalNode[];
  edges: [TacticalNode, TacticalNode][]; // For rendering lines
}

export type AnchorType = 'centroid' | 'border' | 'sector' | 'feature';
export type PositionTag = 'center' | 'front_line' | 'rear_guard' | 'flank_left' | 'flank_right';

export interface SemanticPlacement {
  regionId: string;
  tag: PositionTag;
}

export interface Unit {
  id: string
  name: string
  type: "armor" | "infantry" | "cavalry" | "artillery"
  owner: "player" | "enemy"
  
  // The calculated "Truth" location (Axial) - populated by Hydrator
  hex?: { q: number, r: number };
  
  // The User/AI intent
  placement?: SemanticPlacement; 
  
  tags: string[]
  visibility?: number
  status?: "fresh" | "engaged" | "wavering" | "routing"
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
  neighbors: string[]; // IDs of adjacent regions
  features?: MapFeature[];
  terrain?: "plains" | "forest" | "mountain" | "urban" | "river"
  isFort?: boolean
  isCity?: boolean
  gridScale?: number // New: Grid density for this region (e.g. 10)
}

export interface MapFeature {
  id: string;
  type: 'river' | 'fort' | 'city' | 'forest';
  location: SemanticPlacement; // Where is this feature located?
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
  hexGrid?: HexData[];
  // Optional lookup map for fast hex->pixel access keyed by "q,r"
  hexIndex?: Record<string, HexData>;
}

export interface HexData {
  q: number;
  r: number;
  s: number;
  x: number;
  y: number;
  terrain: 'plains' | 'mud' | 'sand' | 'water' | 'mountain' | 'forest' | 'urban_ruins' | 'factory_floor' | 'swamp';
  structure?: 'fortress' | 'bunker' | 'city_block' | 'airfield' | 'rubble' | 'none';
  infrastructure?: ('road' | 'river' | 'wall')[];
  height?: number;
  regionId: string;
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
  semantic_update?: SemanticPlacement;
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
