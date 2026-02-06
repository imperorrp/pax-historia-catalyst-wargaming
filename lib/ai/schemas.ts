import { z } from "zod";

// Schema for creating new regions dynamically
const RegionDefSchema = z.object({
  id: z.string().describe("Unique identifier for the new region"),
  name: z.string().describe("Display name for the region"),
  type: z.enum(["point", "path", "blob"]).describe("'path' for linear formations (columns, lines), 'blob' for areas"),
  terrain: z.string().describe("Terrain type - should match scenario context (e.g., 'water' for naval, 'plains' for land)"),
  points: z.array(z.array(z.number())).describe("Guide points: single [x,y] for blob, multiple for path. Use 0-1000 for x, 0-800 for y."),
  influence: z.number().describe("Size/width of the region. 30-60 for tight formations, 100+ for larger areas.")
});

// Schema for modifying existing regions
const RegionModifySchema = z.object({
  name: z.string().nullable().describe("New display name, or null if unchanged"),
  influence: z.number().nullable().describe("New influence, or null if unchanged"),
  terrain: z.string().nullable().describe("New terrain, or null if unchanged")
});

// Unit state change (existing)
const UnitStateChangeSchema = z.object({
  unit_id: z.string(),
  action: z.enum(["MOVE", "UPDATE_STATUS", "BOMBARD", "HOLD", "REMOVE"]),
  semantic_update: z.object({
    regionId: z.string(),
    tag: z.string()
  }).nullable().describe("Provide for MOVE, otherwise null"),
  new_tags: z.array(z.string()).describe("New tags to apply; use [] if none")
});

// Region change operations (new)
const RegionChangeSchema = z.object({
  action: z.enum(["CREATE_REGION", "REMOVE_REGION", "MODIFY_REGION"]),
  region_id: z.string().nullable().describe("Region id (required for REMOVE_REGION and MODIFY_REGION; otherwise null)"),
  region_def: RegionDefSchema.nullable().describe("Region definition (required for CREATE_REGION; otherwise null)"),
  updates: RegionModifySchema.nullable().describe("Updates (required for MODIFY_REGION; otherwise null)")
});

// The AI generates this to build a map
export const RegionLayoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["point", "path", "blob", "noise"]),
  terrain: z.enum(["plains", "forest", "mountain", "urban", "river", "mud"]),
  description: z.string(), // Flavor text for the UI
  // Unified points array for both blobs (center + seeds) and paths (waypoints)
  points: z.array(z.array(z.number())), 
  influence: z.number(), // How big is this region?
});

export const UnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["infantry", "armor", "cavalry", "artillery", "elephant", "chariot", "naval"]),
  owner: z.enum(["player", "enemy"]),
  // AI places them semantically, not by pixel
  placement: z.object({
    regionId: z.string(),
    tag: z.enum(["center", "front_line", "rear_guard", "flank_left", "flank_right"])
  }),
  tags: z.array(z.string())
});

// Define the Composite Action structure explicitly
const VisualActionSchema = z.object({
  semanticAction: z.enum([
      "ADVANCE", "ASSAULT", "FLANK_LEFT", "FLANK_RIGHT", "RETREAT", 
      "INFILTRATE", "ENCIRCLE", "SPEARHEAD", "FORTIFY", "AMBUSH", 
      "BOMBARD", "RAIN_ARROWS", "TRAMPLE", "NAVAL_RAM", "FIRE_SHIP", 
      "HACK", "EMP_BLAST", "SUPPRESS", "COMBINED_ASSAULT", 
      "REGION_BOMBARDMENT", "REGION_ENCIRCLEMENT", "GATES_OPEN", "SEVER_SUPPLY",
      "BROADSIDES", "RAKING_FIRE", "BOARDING", "MANEUVER", "LINE_OF_BATTLE",
      "DIVERSION", "VICTORY", "DIPLOMACY", "HOLD", "FEINT", "BLOCKADE", "AIRSTRIKE", "RECON"
  ]),
  targetLogic: z.enum(["nearest", "center_mass", "flank_left", "flank_right", "flank", "rear", "specific_region", "region", "specific_unit", "self", "lowest_health", "weakest", "density", "ally_distress"]),
  targetRegionId: z.string().nullable().describe("Region id if targetLogic is 'specific_region' or 'region'; otherwise null"),
  targetUnitId: z.string().nullable().describe("Unit id if targetLogic is 'specific_unit'; otherwise null"),
  requiredUnitTypes: z.array(z.string()).describe("Unit types needed for the composite action; use [] if none"),
  description: z.string().nullable().describe("Optional human-friendly description; otherwise null")
});

export const ScenarioGenerationSchema = z.object({
  thought_chain: z.string().nullable().describe("Optional reasoning text; otherwise null"),
  name: z.string(),
  era: z.string(),
  narrative_intro: z.string(),
  playerPolity: z.string(),
  enemyPolity: z.string(),
  layout: z.array(RegionLayoutSchema),
  units: z.array(UnitSchema),
  tactical_options: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    
    // Force the AI to fill the compositeActions array
    compositeActions: z.array(VisualActionSchema).min(1).describe("List of visual steps. ALWAYS provide at least one action."),
    
    visualEffects: z.array(z.string()).describe("Optional VFX identifiers; use [] if none")
  }))
});

export const TurnResolutionSchema = z.object({
  thought_chain: z.string().nullable().describe("Optional reasoning text; otherwise null"),
    narrative_outcome: z.string(),
    
    // Unit state changes
    state_changes: z.array(UnitStateChangeSchema),
    
    // Region modifications (optional - for dynamic battlefield changes)
    region_changes: z.array(RegionChangeSchema).describe(
      "Optional: Create new regions (e.g., battle lines, breaches), remove obsolete ones, or modify existing regions. Use [] if none."
    ),
    
    visual_fx: z.array(z.object({
      type: z.enum(["MUD_SPLAT", "EXPLOSION", "SMOKE", "FIRE", "DUST", "IMPACT", "WATER_SPLASH"]),
      region: z.string().nullable().describe("Region id or null"),
      target_unit: z.string().nullable().describe("Unit id or null")
    })).describe("Visual effects to render; use [] if none"),
    next_options: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        compositeActions: z.array(VisualActionSchema).min(1)
    }))
});
