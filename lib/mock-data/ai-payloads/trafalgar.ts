import type { AIGameResponse } from "../../types"

export const TRAFALGAR_PAYLOADS: Record<string, AIGameResponse> = {
  opt_nelson_touch: {
    narrative_update:
      "The 'Nelson Touch' executes perfectly! The weather column led by HMS Victory breaks the enemy line just astern of the Bucentaure, while Collingwood's lee column shatters the enemy rear. The Allied formation is cut in three, with their van unable to tack back in time.",
    region_changes: [
      {
        action: "MODIFY_REGION",
        region_id: "enemy-center",
        updates: {
          name: "Shattered Center",
          influence: 70
        }
      },
      {
        action: "MODIFY_REGION",
        region_id: "enemy-rear",
        updates: {
          name: "Surrounded Rear Guard"
        }
      }
    ],
    state_changes: [
      // Weather column pierces enemy center
      {
        unit_id: "br_victory",
        action: "MOVE",
        semantic_update: { regionId: "enemy-center", tag: "front_line" },
        new_tags: ["Line Breaker", "Engaged", "Raking Fire"],
      },
      {
        unit_id: "br_temeraire",
        action: "MOVE",
        semantic_update: { regionId: "enemy-center", tag: "center" },
        new_tags: ["Engaged", "Double Broadside"],
      },
      {
        unit_id: "br_neptune",
        action: "MOVE",
        semantic_update: { regionId: "enemy-center", tag: "rear" },
        new_tags: ["Engaged", "Supporting"],
      },
      {
        unit_id: "br_leviathan",
        action: "MOVE",
        semantic_update: { regionId: "enemy-center", tag: "flank_left" },
        new_tags: ["Engaged", "Flanking"],
      },
      {
        unit_id: "br_conqueror",
        action: "MOVE",
        semantic_update: { regionId: "enemy-center", tag: "flank_right" },
        new_tags: ["Engaged", "Flanking"],
      },
      // Lee column smashes enemy rear
      {
        unit_id: "br_royal_sovereign",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "front_line" },
        new_tags: ["First Into Action", "Surrounded", "Heavy Fire"],
      },
      {
        unit_id: "br_belleisle",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "center" },
        new_tags: ["Engaged", "Under Fire"],
      },
      {
        unit_id: "br_mars",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "rear" },
        new_tags: ["Engaged", "Aggressive"],
      },
      {
        unit_id: "br_tonnant",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "flank_left" },
        new_tags: ["Engaged", "Powerful"],
      },
      // Enemy flagships under attack
      {
        unit_id: "fr_bucentaure",
        action: "UPDATE_STATUS",
        new_tags: ["Damaged", "Isolated", "Under Raking Fire"],
      },
      {
        unit_id: "sp_santip",
        action: "UPDATE_STATUS",
        new_tags: ["Massive Damage", "Immobile", "Surrounded"],
      },
      {
        unit_id: "sp_santa_ana",
        action: "UPDATE_STATUS",
        new_tags: ["Heavy Damage", "Engaged"],
      }
    ],
    visual_fx: [
      { type: "SMOKE", region: "enemy-center" },
      { type: "EXPLOSION", target_unit: "fr_bucentaure" },
      { type: "FIRE", region: "enemy-rear" },
      { type: "SMOKE", region: "weather-column" },
      { type: "EXPLOSION", target_unit: "sp_santip" }
    ],
    next_options: [
      {
        id: "tf_pursue",
        title: "General Chase",
        description: "Pursue fleeing enemy ships individually.",
        compositeActions: [{ semanticAction: "ASSAULT", description: "Chase", targetLogic: "weakest" }]
      },
      {
        id: "tf_board",
        title: "Board Flagships",
        description: "Attempt to capture the enemy commanders.",
        compositeActions: [{ semanticAction: "BOARDING", description: "Capture commanders", targetLogic: "nearest" }]
      },
      {
        id: "tf_anchor",
        title: "Anchor to Weather Storm",
        description: "Prepare for the approaching gale.",
        compositeActions: [{ semanticAction: "FORTIFY", description: "Anchor ships", targetLogic: "self" }]
      }
    ]
  },

  opt_pell_mell: {
    narrative_update:
      "A chaotic melee ensues! Ships engage muzzle-to-muzzle in a swirling fog of war. Superior British gunnery begins to tell, but losses are heavy on both sides. The Redoutable puts up a fierce resistance against the Victory.",
    region_changes: [
      {
        action: "CREATE_REGION",
        region_def: {
          id: "melee-zone",
          name: "Chaotic Melee",
          type: "blob",
          terrain: "water",
          influence: 120,
          points: [[500, 300]]
        }
      },
      {
        action: "REMOVE_REGION",
        region_id: "weather-column"
      },
      {
        action: "REMOVE_REGION",
        region_id: "lee-column"
      }
    ],
    state_changes: [
      // Ships scatter into close-quarters melee - all converge on new melee zone
      {
        unit_id: "br_victory",
        action: "MOVE",
        semantic_update: { regionId: "melee-zone", tag: "center" },
        new_tags: ["Grappled", "Heavy Damage", "Sniper Fire"],
      },
      {
        unit_id: "fr_redoutable",
        action: "MOVE",
        semantic_update: { regionId: "melee-zone", tag: "center" },
        new_tags: ["Grappled", "Boarding", "Elite Defense"],
      },
      {
        unit_id: "br_temeraire",
        action: "MOVE",
        semantic_update: { regionId: "melee-zone", tag: "front_line" },
        new_tags: ["Saving Nelson", "Double Broadside"],
      },
      {
        unit_id: "br_royal_sovereign",
        action: "MOVE",
        semantic_update: { regionId: "melee-zone", tag: "flank_left" },
        new_tags: ["Engaged", "Surrounded"],
      },
      {
        unit_id: "br_belleisle",
        action: "MOVE",
        semantic_update: { regionId: "melee-zone", tag: "flank_right" },
        new_tags: ["Dismasted", "Fighting On"],
      },
      {
        unit_id: "br_mars",
        action: "MOVE",
        semantic_update: { regionId: "melee-zone", tag: "rear" },
        new_tags: ["Engaged", "Captain Wounded"],
      },
      {
        unit_id: "sp_santa_ana",
        action: "UPDATE_STATUS",
        new_tags: ["Heavy Damage", "Engaged"],
      },
      {
        unit_id: "fr_bucentaure",
        action: "UPDATE_STATUS",
        new_tags: ["Isolated", "Under Attack"],
      }
    ],
    visual_fx: [
      { type: "SMOKE", region: "melee-zone" },
      { type: "FIRE", target_unit: "br_victory" },
      { type: "IMPACT", target_unit: "fr_redoutable" },
      { type: "SMOKE", region: "melee-zone" },
      { type: "EXPLOSION", target_unit: "br_belleisle" }
    ],
    next_options: [
      {
        id: "tf_support",
        title: "Support the Flagship",
        description: "Send reserves to save HMS Victory from the Redoutable.",
        compositeActions: [{ semanticAction: "SPEARHEAD", description: "Rescue Nelson", targetLogic: "ally_distress" }]
      },
      {
        id: "tf_break_off",
        title: "Break Contact",
        description: "Disengage to repair rigging.",
        compositeActions: [{ semanticAction: "RETREAT", description: "Repair rigging", targetLogic: "self" }]
      }
    ]
  },

  opt_conventional_line: {
    narrative_update:
      "The signal flies: 'Form Line of Battle'. Abandoning the daring column attack, the British fleet transforms into a single line parallel to the Combined Fleet. Every ship alters course, taking station in sequence. HMS Victory anchors the center while HMS Royal Sovereign guards the southern end. The maneuver is textbook, but it surrenders the initiative—the Combined Fleet's superior numbers can now bring all guns to bear.",
    region_changes: [
      {
        action: "CREATE_REGION",
        region_def: {
          id: "british-battle-line",
          name: "British Line of Battle",
          type: "path",
          terrain: "water",
          influence: 45,
          points: [[200, 150], [250, 250], [300, 350], [350, 450]]
        }
      },
      {
        action: "REMOVE_REGION",
        region_id: "weather-column"
      },
      {
        action: "REMOVE_REGION",
        region_id: "lee-column"
      }
    ],
    state_changes: [
      // Weather Column ships form northern section of battle line
      {
        unit_id: "br_victory",
        action: "MOVE",
        semantic_update: { regionId: "british-battle-line", tag: "center" },
        new_tags: ["Battle Line", "Flagship", "Broadsides Ready"],
      },
      {
        unit_id: "br_temeraire",
        action: "MOVE",
        semantic_update: { regionId: "british-battle-line", tag: "front_line" },
        new_tags: ["Battle Line", "Supporting"],
      },
      {
        unit_id: "br_neptune",
        action: "MOVE",
        semantic_update: { regionId: "british-battle-line", tag: "center" },
        new_tags: ["Battle Line", "Veteran"],
      },
      {
        unit_id: "br_leviathan",
        action: "MOVE",
        semantic_update: { regionId: "british-battle-line", tag: "rear" },
        new_tags: ["Battle Line"],
      },
      {
        unit_id: "br_conqueror",
        action: "MOVE",
        semantic_update: { regionId: "british-battle-line", tag: "center" },
        new_tags: ["Battle Line"],
      },
      {
        unit_id: "br_britannia",
        action: "MOVE",
        semantic_update: { regionId: "british-battle-line", tag: "rear" },
        new_tags: ["Battle Line", "Heavy"],
      },
      // Lee Column ships form southern section of battle line
      {
        unit_id: "br_royal_sovereign",
        action: "MOVE",
        semantic_update: { regionId: "british-battle-line", tag: "front_line" },
        new_tags: ["Battle Line", "Fast"],
      },
      {
        unit_id: "br_belleisle",
        action: "MOVE",
        semantic_update: { regionId: "british-battle-line", tag: "center" },
        new_tags: ["Battle Line", "Durable"],
      },
      {
        unit_id: "br_mars",
        action: "MOVE",
        semantic_update: { regionId: "british-battle-line", tag: "center" },
        new_tags: ["Battle Line"],
      },
      {
        unit_id: "br_tonnant",
        action: "MOVE",
        semantic_update: { regionId: "british-battle-line", tag: "rear" },
        new_tags: ["Battle Line", "Powerful"],
      },
      {
        unit_id: "br_bellerophon",
        action: "MOVE",
        semantic_update: { regionId: "british-battle-line", tag: "rear" },
        new_tags: ["Battle Line"],
      },
      {
        unit_id: "br_colossus",
        action: "MOVE",
        semantic_update: { regionId: "british-battle-line", tag: "rear" },
        new_tags: ["Battle Line", "Rear Guard"],
      },
      // Enemy responds by tightening their line
      {
        unit_id: "fr_formidable",
        action: "UPDATE_STATUS",
        new_tags: ["Battle Line", "Unengaged"],
      },
      {
        unit_id: "sp_santip",
        action: "UPDATE_STATUS",
        new_tags: ["Battle Line", "Massive", "Guns Ready"],
      }
    ],
    visual_fx: [
      { type: "SMOKE", region: "british-battle-line" },
      { type: "DUST", region: "weather-column" },
      { type: "DUST", region: "lee-column" }
    ],
    next_options: [
      {
        id: "tf_close_range",
        title: "Close the Range",
        description: "Order the line to advance and engage at point-blank range.",
        compositeActions: [{ semanticAction: "ADVANCE", description: "Close to pistol shot", targetLogic: "nearest" }]
      },
      {
        id: "tf_concentrate_fire",
        title: "Concentrate on Flagship",
        description: "All ships focus fire on Villeneuve's Bucentaure.",
        compositeActions: [{ semanticAction: "BROADSIDES", description: "Mass fire on flagship", targetLogic: "specific_unit", targetUnitId: "fr_bucentaure" }]
      },
      {
        id: "tf_withdraw",
        title: "Tactical Withdrawal",
        description: "Turn away to regroup and attempt another approach.",
        compositeActions: [{ semanticAction: "RETREAT", description: "Withdraw", targetLogic: "self" }]
      }
    ]
  },

  opt_cut_rear: {
    narrative_update:
      "Collingwood's column successfully isolates the enemy rear, overwhelming Santa Ana. The lee column ships swarm around the Spanish rear guard like wolves around wounded prey. However, the enemy van and center remain largely unengaged and are slowly turning to envelope your separated force.",
    region_changes: [
      {
        action: "MODIFY_REGION",
        region_id: "enemy-rear",
        updates: {
          name: "Isolated Rear (Under Attack)",
          influence: 40
        }
      }
    ],
    state_changes: [
      // Lee column concentrates on enemy rear
      {
        unit_id: "br_royal_sovereign",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "front_line" },
        new_tags: ["Victorious", "Isolated", "Prize Taker"],
      },
      {
        unit_id: "br_belleisle",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "center" },
        new_tags: ["Engaged", "Heavy Fighting"],
      },
      {
        unit_id: "br_mars",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "flank_left" },
        new_tags: ["Engaged", "Boarding"],
      },
      {
        unit_id: "br_tonnant",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "flank_right" },
        new_tags: ["Engaged", "Raking Fire"],
      },
      {
        unit_id: "br_bellerophon",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "rear" },
        new_tags: ["Supporting", "Engaged"],
      },
      {
        unit_id: "br_colossus",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "rear" },
        new_tags: ["Reserve", "Moving Up"],
      },
      // Weather column advances but more slowly
      {
        unit_id: "br_victory",
        action: "MOVE",
        semantic_update: { regionId: "pixel-ocean", tag: "center" },
        new_tags: ["Advancing", "Unsupported"],
      },
      {
        unit_id: "br_temeraire",
        action: "MOVE",
        semantic_update: { regionId: "pixel-ocean", tag: "rear" },
        new_tags: ["Following", "Ready"],
      },
      // Enemy reaction
      {
        unit_id: "sp_santa_ana",
        action: "UPDATE_STATUS",
        new_tags: ["Surrendered", "Dismasted", "Prize"],
      },
      {
        unit_id: "sp_principe",
        action: "UPDATE_STATUS",
        new_tags: ["Heavy Damage", "Fighting"],
      },
      {
        unit_id: "fr_bucentaure",
        action: "MOVE",
        semantic_update: { regionId: "enemy-rear", tag: "flank_right" },
        new_tags: ["Counter Attacking", "Threatening"],
      }
    ],
    visual_fx: [
      { type: "EXPLOSION", target_unit: "sp_santa_ana" },
      { type: "SMOKE", region: "enemy-rear" },
      { type: "FIRE", target_unit: "sp_principe" }
    ],
    next_options: [
      {
        id: "tf_rejoin",
        title: "Rejoin with Nelson",
        description: "Fight back towards the weather column.",
        compositeActions: [{ semanticAction: "MANEUVER", description: "Rejoin fleet", targetLogic: "center_mass" }]
      },
      {
        id: "tf_defend_prize",
        title: "Defend Prizes",
        description: "Secure the captured Spanish ships against counter-attack.",
        compositeActions: [{ semanticAction: "FORTIFY", description: "Secure prizes", targetLogic: "self" }]
      }
    ]
  }
}
