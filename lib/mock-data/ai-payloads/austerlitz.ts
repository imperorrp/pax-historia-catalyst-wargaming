import type { AIGameResponse } from "../../../types"

export const AUSTERLITZ_PAYLOADS: Record<string, AIGameResponse> = {
  nopt_main: {
    narrative_update:
      "Soult's corps emerges from the fog as the 'Lion's Leap'! They storm the Pratzen Heights, shattering the vulnerable Allied center. The Russian Emperor watches in horror as his army is bisected.",
    state_changes: [
      {
        unit_id: "n_u4",
        action: "MOVE", // The famous maneuver was Soult's
        semantic_update: { regionId: "pratzen-heights", tag: "center" },
        new_tags: ["High_Ground", "Dominant", "Victorious"],
      },
      {
        unit_id: "n_e1",
        action: "UPDATE_STATUS",
        new_tags: ["Broken", "Cut_Off", "Routing"],
      }
    ],
    visual_fx: [
      { type: "DUST", region: "bosenitz-village" }, // Fog lifting effect maybe? or just dust
      { type: "SMOKE", region: "pratzen-heights" },
      { type: "IMPACT", target_unit: "n_e1" }
    ],
    next_options: [
      {
        id: "nap_encircle",
        title: "Encircle the Flanks",
        description: "Turn the guns of the heights onto the trapped enemy wings.",
        compositeActions: [{ semanticAction: "ENCIRCLE", description: "Encircle flanks" }]
      }
    ]
  },

  nopt_feint: {
    narrative_update:
      "Davout holds the line on the right! The Russians take the bait, overcommitting their reserves to crush your 'weak' flank. The trap is set.",
    state_changes: [
      {
        unit_id: "n_u1",
        action: "HOLD",
        semantic_update: { regionId: "aust-plains", tag: "holding" },
        new_tags: ["Stubborn_Defense", "Bait"],
      },
      {
        unit_id: "n_e2",
        action: "MOVE",
        semantic_update: { regionId: "aust-plains", tag: "overextended" }, // Moving into trap
        new_tags: ["Overextended", "Aggressive"],
      }
    ],
    visual_fx: [
      { type: "SMOKE", region: "aust-plains" }
    ],
    next_options: [
      {
        id: "nap_spring_trap",
        title: "Spring the Trap",
        description: "Launch the counter-attack on their exposed flank.",
        compositeActions: [{ semanticAction: "DIVERSION", description: "Counter-attack" }]
      }
    ]
  },

  nopt_combined: {
    narrative_update:
      "A symphony of destruction. Artillery blasts holes in their lines, Infantry pins them down, and Murat's cavalry delivers the coup de grâce. The Allied army ceases to exist as a fighting force.",
    state_changes: [
      {
        unit_id: "n_u2", // Imperial Guard
        action: "MOVE",
        semantic_update: { regionId: "pratzen-heights", tag: "reserve_committed" },
        new_tags: ["Guard_Charge", "Decisive"],
      },
      {
        unit_id: "n_e4",
        action: "UPDATE_STATUS",
        new_tags: ["Annihilated"],
      }
    ],
    visual_fx: [
      { type: "EXPLOSION", region: "pratzen-heights" },
      { type: "SMOKE", region: "pratzen-heights" },
      { type: "FIRE", region: "bosenitz-village" }
    ],
    next_options: [
        {
          id: "nap_glory",
          title: "Victory Parade",
          description: "Inspect the field.",
          compositeActions: [{ semanticAction: "VICTORY", description: "Victory" }]
        }
    ]
  },

  nopt_heights: {
    narrative_update:
      "Your Grand Battery unleashes hell on the Pratzen Heights. The frozen ground amplifies the ricochet of cannonballs, tearing through enemy ranks. They are forced to withdraw from the high ground.",
    state_changes: [
      {
        unit_id: "n_u3",
        action: "BOMBARD",
        semantic_update: { regionId: "pratzen-heights", tag: "bombarding" },
        new_tags: ["Firing_Roundshot"],
      },
      {
        unit_id: "n_e3",
        action: "UPDATE_STATUS",
        new_tags: ["Silenced", "Guns_Disabled"],
      }
    ],
    visual_fx: [
      { type: "EXPLOSION", region: "pratzen-heights" }, // Lots of explosions
      { type: "SMOKE", region: "pratzen-heights" }
    ],
     next_options: [
        {
          id: "nap_take_heights",
          title: "Seize the Heights",
          description: "Infantry forward.",
          compositeActions: [{ semanticAction: "ADVANCE", description: "Seize heights" }]
        }
    ]
  }
}
