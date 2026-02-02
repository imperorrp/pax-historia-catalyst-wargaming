import { z } from "zod";

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
  targetRegionId: z.string().optional().describe("Required if targetLogic is 'specific_region'"), 
  targetUnitId: z.string().optional().describe("Required if targetLogic is 'specific_unit'"),
  requiredUnitTypes: z.array(z.string()).optional(),
  description: z.string().optional()
});

export const ScenarioGenerationSchema = z.object({
  thought_chain: z.string().optional(),
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
    
    visualEffects: z.array(z.string()).optional()
  }))
});

export const TurnResolutionSchema = z.object({
    thought_chain: z.string().optional(),
    narrative_outcome: z.string(),
    state_changes: z.array(z.object({
        unit_id: z.string(),
        action: z.enum(["MOVE", "UPDATE_STATUS", "BOMBARD", "HOLD", "REMOVE"]),
        semantic_update: z.object({
          regionId: z.string(),
          tag: z.string()
        }).optional(),
        new_tags: z.array(z.string()).optional()
    })),
    visual_fx: z.array(z.object({
      type: z.enum(["MUD_SPLAT", "EXPLOSION", "SMOKE", "FIRE", "DUST", "IMPACT", "WATER_SPLASH"]),
      region: z.string().optional(),
      target_unit: z.string().optional()
    })).optional(),
    next_options: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        compositeActions: z.array(VisualActionSchema).min(1)
    }))
});
