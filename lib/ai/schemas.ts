import { z } from "zod";

// The AI generates this to build a map
export const RegionLayoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["point", "path", "blob", "noise"]),
  terrain: z.enum(["plains", "forest", "mountain", "urban", "river", "mud"]),
  description: z.string(), // Flavor text for the UI
  // Abstract positioning (0-100 scale) to be mapped to canvas size
  centerCoordinates: z.object({ x: z.number(), y: z.number() }), 
  pathPoints: z.array(z.array(z.number())).optional(), // For rivers/frontlines
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

export const ScenarioGenerationSchema = z.object({
  name: z.string(),
  era: z.string(),
  narrative_intro: z.string(),
  layout: z.array(RegionLayoutSchema),
  units: z.array(UnitSchema),
  // AI must generate 4 initial options
  tactical_options: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    actionType: z.enum([
      "ADVANCE", "ASSAULT", "FLANK_LEFT", "FLANK_RIGHT", "RETREAT", 
      "INFILTRATE", "ENCIRCLE", "SPEARHEAD", "FORTIFY", "AMBUSH", 
      "BOMBARD", "RAIN_ARROWS", "TRAMPLE", "NAVAL_RAM", "FIRE_SHIP", 
      "HACK", "EMP_BLAST"
    ]), 
    targetLogic: z.enum(["nearest", "center_mass", "flank_left", "flank_right", "rear", "specific_region"])
  }))
});

export const TurnResolutionSchema = z.object({
    narrative_outcome: z.string(),
    unit_updates: z.array(z.object({
        unitId: z.string(),
        status: z.enum(["fresh", "engaged", "wavering", "routing", "eliminated"]),
        position_update: z.object({
          regionId: z.string(),
          tag: z.enum(["center", "front_line", "rear_guard", "flank_left", "flank_right", "rear"])
        }).optional()
    })),
    // Map changes (optional) - e.g. region control flip
    region_updates: z.array(z.object({
      regionId: z.string(),
      owner: z.enum(["player", "enemy", "contested", "neutral"])
    })).optional(),
    // Next tactical choices
    next_tactical_options: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        actionType: z.string(), // Allowing string here for flexibility, or enum
        targetLogic: z.string()
    }))
});
