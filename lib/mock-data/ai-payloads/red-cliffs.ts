import type { AIGameResponse } from "../../../types"

export const RED_CLIFFS_PAYLOADS: Record<string, AIGameResponse> = {
  tk_opt_fire: {
    narrative_update:
      "The Southeast Wind blows! Huang Gai's fire ships crash into Cao Cao's chained armada. The flames spread instantly across the wooden hulls. The river turns into a sea of fire!",
    state_changes: [
      {
        unit_id: "tk_u2", // Huang Gai
        action: "FIRE_SHIP",
        semantic_update: { regionId: "yangtze-river", tag: "burning" },
        new_tags: ["Sacrificed", "Legendary"],
      },
      {
        unit_id: "tk_e1", // Iron Chain Armada
        action: "UPDATE_STATUS",
        new_tags: ["On_Fire", "Trapped", "Burning"],
      }
    ],
    visual_fx: [
      { type: "FIRE", region: "yangtze-river" },
      { type: "FIRE", region: "yangtze-river" }, // Double fire for emphasis
      { type: "SMOKE", region: "north-bank" }
    ],
    next_options: [
      {
        id: "tk_pursue_cao",
        title: "Pursue Cao Cao",
        description: "Don't let the warlord escape through Huarong Trail.",
        compositeActions: [{ semanticAction: "ASSAULT", description: "Pursue Cao Cao", targetLogic: "lowest_health" }]
      }
    ]
  },

  tk_opt_naval: {
    narrative_update:
      "Your fleets engage the Northerners. While outnumbered, your sailors are superior on water. The enemy, seasick and confused, cannot maintain formation against your boarding actions.",
    state_changes: [
      {
        unit_id: "tk_u1",
        action: "ASSAULT",
        semantic_update: { regionId: "yangtze-river", tag: "boarding" },
        new_tags: ["Boarding_Parties", "Victorious"],
      },
      {
        unit_id: "tk_e2",
        action: "UPDATE_STATUS",
        new_tags: ["Seasick", "Routing"],
      }
    ],
    visual_fx: [
      { type: "IMPACT", region: "yangtze-river" },
      { type: "WATER_SPLASH", region: "yangtze-river" }
    ],
    next_options: [
      {
        id: "tk_fire_attack",
        title: "Fire Attack Opportunity",
        description: "They are bunched up. Use fire now!",
        compositeActions: [{ semanticAction: "FIRE_SHIP", description: "Fire attack", targetLogic: "density" }]
      }
    ]
  },

  tk_opt_raid: {
    narrative_update:
      "Guan Yu and Zhao Yun lead raids against the northern camps. The granaries are torched! Cao Cao's army, already plagued by illness, begins to crumble from lack of supplies.",
    state_changes: [
      {
        unit_id: "tk_u4", // Reserves/Generals
        action: "MOVE",
        semantic_update: { regionId: "north-bank", tag: "raiding" },
        new_tags: ["Raiding", "Terror"],
      },
      {
        unit_id: "tk_e4", // Supplies
        action: "UPDATE_STATUS",
        new_tags: ["Destroyed", "Starving"],
      }
    ],
    visual_fx: [
      { type: "FIRE", region: "north-bank" },
      { type: "SMOKE", region: "north-bank" }
    ],
    next_options: [
      {
        id: "tk_final_push",
        title: "All-Out Assault",
        description: "Strike while they are weak.",
        compositeActions: [{ semanticAction: "COMBINED_ASSAULT", description: "All-out assault", targetLogic: "region", targetRegionId: "cao_camp" }]
      }
    ]
  },

  tk_opt_combined: {
    narrative_update:
      "Fire on the river, raids on the land! The Alliance forces coordinate perfectly. Cao Cao's dream of unification ends here in disaster.",
    state_changes: [
      {
        unit_id: "tk_u1",
        action: "MOVE",
        semantic_update: { regionId: "yangtze-river", tag: "engaged" },
        new_tags: ["Winning"],
      },
      {
        unit_id: "tk_e1",
        action: "UPDATE_STATUS",
        new_tags: ["Annihilated"],
      },
      {
         unit_id: "tk_e3",
         action: "UPDATE_STATUS",
         new_tags: ["Retreating", "Protecting_Lord"],
      }
    ],
    visual_fx: [
      { type: "FIRE", region: "yangtze-river" },
      { type: "EXPLOSION", region: "north-bank" },
      { type: "SMOKE", region: "yangtze-river" }
    ],
    next_options: [
      {
        id: "tk_victory",
        title: "A Tripartite World",
        description: "The Three Kingdoms era begins.",
        compositeActions: [{ semanticAction: "VICTORY", description: "Victory", targetLogic: "self" }]
      }
    ]
  }
}
