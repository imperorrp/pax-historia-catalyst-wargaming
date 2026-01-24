import type { AIGameResponse } from "../../../types"

export const BLITZKRIEG_PAYLOADS: Record<string, AIGameResponse> = {
  bk_opt_panzer: {
    narrative_update:
      "Guderian's Panzers slice through the Sedan sector! The French defenses, overwhelmed by speed and concentrated firepower, crumble. Lead armored elements are already racing towards the Channel coast.",
    state_changes: [
      {
        unit_id: "u1",
        action: "MOVE",
        semantic_update: { regionId: "sedan-plains", tag: "breakthrough" },
        new_tags: ["Breakthrough", "Victorious", "Moving_Fast"],
      },
      {
        unit_id: "u5",
        action: "UPDATE_STATUS",
        new_tags: ["Outmaneuvered", "Neutralized"],
      }
    ],
    visual_fx: [
      { type: "DUST", region: "sedan-plains" },
      { type: "EXPLOSION", target_unit: "u5" },
      { type: "SMOKE", region: "sedan-plains" }
    ],
    next_options: [
      {
        id: "bk_pursue",
        title: "Race to the Sea",
        description: "Drive north to cut off Allied armies.",
        compositeActions: [{ semanticAction: "ADVANCE", description: "Race to sea", targetLogic: "region", targetRegionId: "coast" }]
      }
    ]
  },

  bk_opt_ardennes: {
    narrative_update:
      "The 'Impossible' route works! Your armor emerges from the dense Ardennes, catching the enemy completely by surprise. Panic spreads among the rear echelon troops as tanks appear where no tanks should be.",
    state_changes: [
      {
        unit_id: "u1",
        action: "MOVE",
        semantic_update: { regionId: "ardennes-forest", tag: "flank_left" },
        new_tags: ["Stealth", "Surprise_Attack"],
      },
      {
        unit_id: "u6",
        action: "UPDATE_STATUS",
        new_tags: ["Bypassed", "Confused"],
      }
    ],
    visual_fx: [
      { type: "SMOKE", region: "ardennes-forest" }
    ],
    next_options: [
      {
        id: "bk_secure_bridges",
        title: "Secure Crossings",
        description: "Seize the Meuse bridges.",
        compositeActions: [{ semanticAction: "SPEARHEAD", description: "Secure bridges", targetLogic: "region", targetRegionId: "meuse-river" }]
      }
    ]
  },

  bk_opt_artillery: {
    narrative_update:
      "A thunderous barrage rains down on the Maginot fortifications. While the concrete holds, the defenders are suppressed and blinded. This pinning action allows your other forces to maneuver freely.",
    state_changes: [
      {
        unit_id: "u3",
        action: "BOMBARD",
        semantic_update: { regionId: "maginot-line", tag: "suppressing" },
        new_tags: ["Firing", "Heat_War"],
      },
      {
        unit_id: "u7",
        action: "UPDATE_STATUS",
        new_tags: ["Suppressed", "Hunkered_Down"],
      }
    ],
    visual_fx: [
      { type: "EXPLOSION", region: "maginot-line" },
      { type: "SMOKE", region: "maginot-line" },
      { type: "FIRE", target_unit: "u7" }
    ],
    next_options: [
      {
        id: "bk_assault_forts",
        title: "Assault Fortifications",
        description: "Send combat engineers to clear bunkers.",
        compositeActions: [{ semanticAction: "ASSAULT", description: "Assault bunkers", targetLogic: "nearest" }]
      }
    ]
  },

  bk_opt_combined: {
    narrative_update:
      "The ultimate expression of Blitzkrieg. Stukas scream overhead, artillery pounds the line, and Panzers surge forward. The enemy front disintegrates across the entire sector.",
    state_changes: [
      {
        unit_id: "u1",
        action: "MOVE",
        semantic_update: { regionId: "sedan-plains", tag: "breakthrough" },
        new_tags: ["Combined_Arms", "Unstoppable"],
      },
      {
        unit_id: "u2",
        action: "MOVE",
        semantic_update: { regionId: "sedan-plains", tag: "support" },
        new_tags: ["Mopping_Up"],
      },
      {
        unit_id: "u4",
        action: "UPDATE_STATUS",
        new_tags: ["Routing", "Destroyed"],
      }
    ],
    visual_fx: [
      { type: "EXPLOSION", region: "sedan-plains" },
      { type: "SMOKE", region: "sedan-plains" },
      { type: "FIRE", region: "maginot-line" },
      { type: "DUST", region: "ardennes-forest" }
    ],
    next_options: [
      {
        id: "bk_fall_of_france",
        title: "Drive to Paris",
        description: "End the campaign.",
        compositeActions: [{ semanticAction: "VICTORY", description: "Victory in Paris", targetLogic: "region", targetRegionId: "paris" }]
      }
    ]
  }
}
