import type { AIGameResponse } from "../../../types"

export const HYDASPES_PAYLOADS: Record<string, AIGameResponse> = {
  hyd_opt_1: {
    narrative_update:
      "Alexander leads the Companions on a daring night crossing upstream! They appear suddenly on the enemy's right flank at dawn. Porus is forced to turn his line to face the new threat, disrupting his formation.",
    state_changes: [
      {
        unit_id: "mac_u1",
        action: "MOVE",
        semantic_update: { regionId: "hyd-east-plains", tag: "flanking" },
        new_tags: ["Flanking", "Surprise", "Charging"],
      },
      {
        unit_id: "ind_e2",
        action: "UPDATE_STATUS", // Chariots
        new_tags: ["Confused", "Outflanked"],
      }
    ],
    visual_fx: [
      { type: "DUST", region: "hyd-east-plains" },
      { type: "SMOKE", region: "hyd-river" } // Fog of war
    ],
    next_options: [
      {
        id: "hyd_hammer_anvil",
        title: "Hammer and Anvil",
        description: "Crush the infantry between the phalanx and cavalry.",
        compositeActions: [{ semanticAction: "ENCIRCLE", description: "Hammer and anvil", targetLogic: "flank" }]
      }
    ]
  },

  hyd_opt_2: {
    narrative_update:
      "Your archers target the mahouts and the elephants' eyes! Maddened by pain, the great beasts panic and stampede backwards, trampling their own infantry. Chaos engulfs the Indian center.",
    state_changes: [
      {
         unit_id: "ind_e1",
         action: "MOVE", // Moving backwards uncontrollably
         semantic_update: { regionId: "hyd-east-plains", tag: "routing" },
         new_tags: ["Rampaging", "Stampede", "Friendly_Fire"],
      }
    ],
    visual_fx: [
      { type: "DUST", region: "hyd-east-forest" },
      { type: "EXPLOSION", target_unit: "ind_e1" } // Representing chaos/impact
    ],
    next_options: [
      {
        id: "hyd_advance",
        title: "General Advance",
        description: "Push forward while they are disorganized.",
        compositeActions: [{ semanticAction: "ADVANCE", description: "General advance", targetLogic: "nearest" }]
      }
    ]
  },

  hyd_opt_3: {
    narrative_update:
      "The Phalanx bristling with sarrissas marches steadily into the river. Despite the mud and arrows, the wall of pikes pushes back the enemy infantry. It is a slow, grinding slaughter.",
    state_changes: [
      {
        unit_id: "mac_u2",
        action: "MOVE",
        semantic_update: { regionId: "hyd-east-mud", tag: "engaged" },
        new_tags: ["Unstoppable", "Phalanx_Push"],
      }
    ],
    visual_fx: [
      { type: "MUD_SPLAT", region: "hyd-east-mud" },
      { type: "IMPACT", region: "hyd-east-mud" }
    ],
    next_options: [
      {
        id: "hyd_hold",
        title: "Maintain Formation",
        description: "Keep the line steady.",
        compositeActions: [{ semanticAction: "HOLD", description: "Hold formation", targetLogic: "self" }]
      }
    ]
  },

  hyd_opt_4: {
    narrative_update:
      "The Companion Cavalry charges the elephants directly! A risky maneuver, but the horses are trained to ignore the smell of elephants. Using axes to hack at trunks, they stall the enemy advance.",
    state_changes: [
      {
        unit_id: "mac_u1",
        action: "ASSAULT",
        semantic_update: { regionId: "hyd-east-forest", tag: "engaged" },
        new_tags: ["Elephant_Hunters", "Brave"],
      },
      {
        unit_id: "ind_e1",
        action: "UPDATE_STATUS",
        new_tags: ["Stalled", "Fighting_Back"],
      }
    ],
    visual_fx: [
      { type: "IMPACT", target_unit: "ind_e1" },
      { type: "DUST", region: "hyd-east-forest" }
    ],
    next_options: [
      {
        id: "hyd_withdraw",
        title: "Withdraw Cavalry",
        description: "Pull back before losses mount.",
        compositeActions: [{ semanticAction: "RETREAT", description: "Withdraw cavalry", targetLogic: "self" }]
      }
    ]
  }
}
