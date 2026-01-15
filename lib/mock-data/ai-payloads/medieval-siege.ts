import type { AIGameResponse } from "../../../types"

export const MEDIEVAL_SIEGE_PAYLOADS: Record<string, AIGameResponse> = {
  medopt_bombard: {
    narrative_update:
      "The trebuchets loose immense stone projectiles that crash against the curtain wall. Masonry shatters, and a section of the wall crumbles into rubble! The defenders scramble to plug the gap.",
    state_changes: [
      {
        unit_id: "med_u1",
        action: "BOMBARD",
        semantic_update: { regionId: "castle-keep", tag: "breaching" },
        new_tags: ["Firing", "Accurate"],
      },
      {
        unit_id: "med_e1", // Garrison
        action: "UPDATE_STATUS",
        new_tags: ["Exposed", "Panic"],
      }
    ],
    visual_fx: [
      { type: "EXPLOSION", region: "castle-keep" },
      { type: "DUST", region: "castle-keep" }
    ],
    next_options: [
      {
        id: "med_storm",
        title: "Storm the Breach",
        description: "Infantry charge into the gap.",
        compositeActions: [{ semanticAction: "ASSAULT", description: "Storm the breach" }]
      }
    ]
  },

  medopt_assault: {
    narrative_update:
      "Ladders are raised against the walls under a hail of arrows. The fighting is fierce on the battlements, but your veteran infantry gains a foothold on the ramparts!",
    state_changes: [
      {
        unit_id: "med_u2",
        action: "MOVE",
        semantic_update: { regionId: "castle-keep", tag: "fighting" },
        new_tags: ["On_Walls", "Bloodied"],
      },
      {
        unit_id: "med_e3", // Castle Artillery/Ballista
        action: "UPDATE_STATUS",
        new_tags: ["Overrun"],
      }
    ],
    visual_fx: [
      { type: "IMPACT", region: "castle-keep" },
      { type: "SMOKE", region: "castle-keep" } // Oil pots etc
    ],
    next_options: [
      {
        id: "med_open_gates",
        title: "Open the Gates",
        description: "Secure the gatehouse from inside.",
        compositeActions: [{ semanticAction: "GATES_OPEN", description: "Open gates" }]
      }
    ]
  },

  medopt_infiltrate: {
    narrative_update:
      "Sappers successfully collapse a mine tunnel under the corner tower! The tower leans and collapses in a cloud of dust. Meanwhile, scouts set fire to the enemy granary.",
    state_changes: [
      {
        unit_id: "med_u4", // Sappers
        action: "UPDATE_STATUS",
        new_tags: ["Successful_Mine", "Exhausted"],
      },
      {
         unit_id: "med_e1",
         action: "UPDATE_STATUS",
         new_tags: ["No_Supplies", "Breached"],
      }
    ],
    visual_fx: [
      { type: "EXPLOSION", region: "castle-keep" },
      { type: "FIRE", region: "castle-keep" }
    ],
    next_options: [
      {
        id: "med_starve",
        title: "Demand Surrender",
        description: "They have no food left.",
        compositeActions: [{ semanticAction: "DIPLOMACY", description: "Demand surrender" }]
      }
    ]
  },

  medopt_fortify: {
    narrative_update:
      "Your engineers dig in, creating a circumvallation line. When the enemy relief force charges, they break against your stakes and trenches. The siege continues securely.",
    state_changes: [
      {
        unit_id: "med_u2",
        action: "HOLD",
        semantic_update: { regionId: "siege-camp", tag: "fortified" },
        new_tags: ["Dug_In", "Protected"],
      },
      {
         unit_id: "med_e2", // Relief Force
         action: "UPDATE_STATUS",
         new_tags: ["Repulsed", "Ineffective"],
      }
    ],
    visual_fx: [
      { type: "DUST", region: "forest-approach" } // Cavalry charge dust
    ],
    next_options: [
      {
        id: "med_counter_attack",
        title: "Counter-Attack Relief",
        description: "Drive them off completely.",
        compositeActions: [{ semanticAction: "ASSAULT", description: "Counter-attack" }]
      }
    ]
  }
}
