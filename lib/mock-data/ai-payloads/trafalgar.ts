import type { AIGameResponse } from "../../../types"

export const TRAFALGAR_PAYLOADS: Record<string, AIGameResponse> = {
  opt_nelson_touch: {
    narrative_update:
      "The 'Nelson Touch' executes perfectly! The weather column led by HMS Victory breaks the enemy line just astern of the Bucentaure, while Collingwood's lee column shatters the enemy rear. The Allied formation is cut in three, with their van unable to tack back in time.",
    state_changes: [
      {
        unit_id: "br_victory",
        action: "MOVE",
        semantic_update: { regionId: "enemy-center", tag: "engaged" },
        new_tags: ["Engaged", "Broadsides_Firing", "Line_Breaker"],
      },
      {
        unit_id: "br_royal_sovereign",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "engaged" },
        new_tags: ["Engaged", "First_Rate", "Surrounded"],
      },
      {
        unit_id: "fr_bucentaure",
        action: "UPDATE_STATUS",
        new_tags: ["Damaged", "Isolated", "Under_Fire"],
      },
      {
        unit_id: "sp_santip",
        action: "UPDATE_STATUS",
        new_tags: ["Massive_Damage", "Immobile"],
      }
    ],
    visual_fx: [
      { type: "SMOKE", region: "enemy-center" },
      { type: "EXPLOSION", target_unit: "fr_bucentaure" },
      { type: "FIRE", region: "enemy-rear" },
      { type: "SMOKE", region: "weather-column" }
    ],
    next_options: [
      {
        id: "tf_pursue",
        title: "General Chase",
        description: "Pursue fleeing enemy ships individually.",
        compositeActions: [{ semanticAction: "ASSAULT", description: "Chase" }]
      },
      {
        id: "tf_board",
        title: "Board Flagships",
        description: "Attempt to capture the enemy commanders.",
        compositeActions: [{ semanticAction: "ASSAULT", description: "Capture commanders" }]
      },
      {
        id: "tf_anchor",
        title: "Anchor to Weather Storm",
        description: "Prepare for the approaching gale.",
        compositeActions: [{ semanticAction: "FORTIFY", description: "Anchor ships" }]
      }
    ]
  },

  opt_pell_mell: {
    narrative_update:
      "A chaotic melee ensues! Ships engage muzzle-to-muzzle in a swirling fog of war. Superior British gunnery begins to tell, but losses are heavy on both sides. The Redoutable puts up a fierce resistance against the Victory.",
    state_changes: [
      {
        unit_id: "br_victory",
        action: "ASSAULT",
        semantic_update: { regionId: "enemy-center", tag: "engaged" },
        new_tags: ["Heavy_Damage", "Sniper_Fire", "Engaged"],
      },
      {
        unit_id: "fr_redoutable",
        action: "ASSAULT",
        semantic_update: { regionId: "enemy-center", tag: "engaged" },
        new_tags: ["Grappled", "Boarding", "Elite_Defense"],
      },
       {
        unit_id: "br_temeraire",
        action: "MOVE",
        semantic_update: { regionId: "enemy-center", tag: "support" },
        new_tags: ["Saving_Nelson", "Double_Broadside"],
      }
    ],
    visual_fx: [
      { type: "SMOKE", region: "enemy-center" },
      { type: "FIRE", target_unit: "br_victory" },
      { type: "IMPACT", target_unit: "fr_redoutable" },
      { type: "DUST", region: "pixel-ocean" } // Cannon smoke everywhere
    ],
    next_options: [
      {
        id: "tf_support",
        title: "Support the Flagship",
        description: "Send reserves to save HMS Victory.",
        compositeActions: [{ semanticAction: "SPEARHEAD", description: "Rescue Nelson" }]
      },
      {
        id: "tf_break_off",
        title: "Break Contact",
        description: "Disengage to repair rigging.",
        compositeActions: [{ semanticAction: "RETREAT", description: "Repair rigging" }]
      }
    ]
  },

  opt_conventional_line: {
    narrative_update:
      "You form a parallel line of battle to exchange broadsides. While orderly, this allows the larger Combined Fleet to bring all their guns to bear. The exchange is brutal and inconclusive, with the enemy van tacking to double up on your lead ships.",
    state_changes: [
      {
        unit_id: "br_victory",
        action: "MOVE",
        semantic_update: { regionId: "enemy-center", tag: "line_battle" },
        new_tags: ["Firing_Line", "Taking_Hits"],
      },
      {
        unit_id: "fr_formidable",
        action: "MOVE",
        semantic_update: { regionId: "enemy-center", tag: "flanking" },
        new_tags: ["Flanking", "Unscathed"],
      }
    ],
    visual_fx: [
      { type: "SMOKE", region: "enemy-van" },
      { type: "SMOKE", region: "enemy-center" },
      { type: "IMPACT", target_unit: "br_victory" }
    ],
    next_options: [
      {
        id: "tf_close_range",
        title: "Close the Range",
        description: "Attempt to close to pistol shot distance.",
        compositeActions: [{ semanticAction: "ASSAULT", description: "Close pistol range" }]
      },
      {
        id: "tf_withdraw",
        title: "Tactical Withdrawal",
        description: "Turn away to regroup.",
        compositeActions: [{ semanticAction: "RETREAT", description: "Withdraw" }]
      }
    ]
  },

  opt_cut_rear: {
    narrative_update:
      "Collingwood's column successfully isolates the enemy rear, overwhelming Santa Ana. However, the enemy van and center remain largely unengaged and are turning to envelope your separated force.",
    state_changes: [
      {
        unit_id: "br_royal_sovereign",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "engaged" },
        new_tags: ["Victorious", "Isolated"],
      },
      {
        unit_id: "sp_santa_ana",
        action: "UPDATE_STATUS",
        new_tags: ["Surrendered", "Demasted"],
      },
      {
        unit_id: "fr_bucentaure",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "counter_attack" },
        new_tags: ["Counter_Charging"],
      }
    ],
    visual_fx: [
      { type: "EXPLOSION", target_unit: "sp_santa_ana" },
      { type: "SMOKE", region: "enemy-rear" }
    ],
    next_options: [
      {
        id: "tf_rejoin",
        title: "Rejoin with Nelson",
        description: "Fight back towards the main fleet.",
        compositeActions: [{ semanticAction: "MANEUVER", description: "Rejoin fleet" }]
      },
      {
        id: "tf_defend_prize",
        title: "Defend Prizes",
        description: "Secure the captured Spanish ships.",
        compositeActions: [{ semanticAction: "FORTIFY", description: "Secure prizes" }]
      }
    ]
  }
}
