export const RED_SILO_PAYLOADS: Record<string, any> = {
  opt1_trench_infiltration: {
    narrative_outcome: `The breachers lead the way through the service trench, thermal masks minimizing their signatures in the swirling dust. Ridge watchers fire blind, tracers arcing wide into the storm. Your raiders emerge at the silo's western hatch—breaching charges crack the airlock seals. The garrison, caught between trench infiltrators and autoturrets recalibrating, falls back to the processing core. You've secured the outer yard, but the defenders have fortified the control room.`,
    
    state_changes: [
      { unit_id: "p4_breacher_squad", action: "MOVE", semantic_update: { regionId: "silo_complex", tag: "flank_left" }, new_tags: ["Engaged"] },
      { unit_id: "p1_raiders", action: "MOVE", semantic_update: { regionId: "silo_complex", tag: "front_line" }, new_tags: ["Engaged"] },
      { unit_id: "e1_silo_garrison", action: "UPDATE_STATUS", semantic_update: null, new_tags: ["Suppressed", "Casualties"] },
      { unit_id: "e3_turret_section", action: "UPDATE_STATUS", semantic_update: null, new_tags: ["Damaged", "Suppressed"] }
    ],
    
    region_changes: [],
    
    visual_fx: [
      { type: "SMOKE", region: "silo_complex", target_unit: null },
      { type: "DUST", region: "service_trench", target_unit: null },
      { type: "EXPLOSION", region: "silo_complex", target_unit: "e3_turret_section" }
    ],
    
    next_options: [
      {
        id: "opt1_followup_control_room",
        title: "Storm the Control Room Core",
        description: "Assault the fortified processing control room where garrison command has retreated. High casualties expected, but seizing the comms mast and life support will force a surrender.",
        compositeActions: [
          { semanticAction: "ASSAULT", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: null, requiredUnitTypes: ["infantry"], description: null }
        ]
      },
      {
        id: "opt1_followup_ridge_neutralize",
        title: "Suppress Ridge Overwatch Before Advancing",
        description: "Before pressing the control room, eliminate the ridge platoon's ability to fire into the yard, preventing them from hitting your assault teams from above.",
        compositeActions: [
          { semanticAction: "BOMBARD", targetLogic: "specific_region", targetRegionId: "chryse_ridge", targetUnitId: null, requiredUnitTypes: ["artillery"], description: null },
          { semanticAction: "SUPPRESS", targetLogic: "specific_region", targetRegionId: "chryse_ridge", targetUnitId: null, requiredUnitTypes: [], description: null }
        ]
      },
      {
        id: "opt1_followup_hold_yard",
        title: "Hold the Yard and Negotiate",
        description: "Fortify your positions around the outer silo structures and wait. With the storm intensifying, offer the garrison safe passage in exchange for surrendering the facility intact.",
        compositeActions: [
          { semanticAction: "FORTIFY", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: null, requiredUnitTypes: [], description: null },
          { semanticAction: "DIPLOMACY", targetLogic: "specific_unit", targetRegionId: null, targetUnitId: "e1_silo_garrison", requiredUnitTypes: [], description: null }
        ]
      }
    ]
  },

  opt2_culvert_spearhead: {
    narrative_outcome: `Your rovers gun engines and race for the culvert crossing. Ridge watchers open up—kinetic slugs hammer armor plating, one rover loses a tire but grinds forward on rim actuators. Mortar rounds drop smoke shells near the crossing point. Your lead rover smashes through the perimeter wire, grinding autoturrets under its treads. The garrison scatters, but your rovers are exposed and taking heavy fire from the ridge. Infantry rushes in behind the armor, clearing buildings room by room.`,
    
    state_changes: [
      { unit_id: "p2_mars_rovers", action: "MOVE", semantic_update: { regionId: "silo_complex", tag: "front_line" }, new_tags: ["Damaged", "Engaged"] },
      { unit_id: "p1_raiders", action: "MOVE", semantic_update: { regionId: "silo_complex", tag: "center" }, new_tags: ["Engaged"] },
      { unit_id: "e3_turret_section", action: "REMOVE", semantic_update: null, new_tags: [] },
      { unit_id: "e1_silo_garrison", action: "UPDATE_STATUS", semantic_update: null, new_tags: ["Suppressed", "Routed"] },
      { unit_id: "e2_ridge_watch", action: "UPDATE_STATUS", semantic_update: null, new_tags: ["High Ground", "Dug-in", "Engaged"] }
    ],
    
    region_changes: [],
    
    visual_fx: [
      { type: "EXPLOSION", region: "culvert_bridge", target_unit: "p2_mars_rovers" },
      { type: "SMOKE", region: "silo_complex", target_unit: null },
      { type: "DUST", region: "culvert_bridge", target_unit: null },
      { type: "FIRE", region: "silo_complex", target_unit: "e3_turret_section" }
    ],
    
    next_options: [
      {
        id: "opt2_followup_fortify_and_repair",
        title: "Fortify and Repair Damaged Rovers",
        description: "You've taken the complex, but your armor is battered. Dig in, patch the rovers, and prepare to repel a counterattack from the ridge or QRF reinforcements.",
        compositeActions: [
          { semanticAction: "FORTIFY", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: null, requiredUnitTypes: [], description: null },
          { semanticAction: "HOLD", targetLogic: "self", targetRegionId: null, targetUnitId: null, requiredUnitTypes: [], description: null }
        ]
      },
      {
        id: "opt2_followup_counterattack_ridge",
        title: "Counterattack the Ridge",
        description: "Use the silo as a base and launch a climbing assault on the ridge platoon while they're still reeling from your breakthrough.",
        compositeActions: [
          { semanticAction: "ASSAULT", targetLogic: "specific_region", targetRegionId: "chryse_ridge", targetUnitId: null, requiredUnitTypes: ["infantry"], description: null }
        ]
      },
      {
        id: "opt2_followup_cut_off_qrf",
        title: "Intercept Quick-Reaction Force",
        description: "The QRF rovers are moving up from the culvert. Redirect your battered armor and artillery to block their approach before they can retake the silo.",
        compositeActions: [
          { semanticAction: "SUPPRESS", targetLogic: "specific_unit", targetRegionId: null, targetUnitId: "e4_quick_reaction_rover", requiredUnitTypes: ["artillery"], description: null },
          { semanticAction: "AMBUSH", targetLogic: "specific_region", targetRegionId: "culvert_bridge", targetUnitId: null, requiredUnitTypes: ["infantry"], description: null }
        ]
      }
    ]
  },

  opt3_west_dunes_flank: {
    narrative_outcome: `Your raiders and breachers crawl through the dust dunes, electrostatic grit obscuring thermal sensors. The knoll marksmen don't spot you until too late—a burst of suppressed gunfire drops two of them. You emerge near the silo's western service doors, catching the garrison completely by surprise. The quick-reaction rovers, still positioned for a southern push, scramble to redeploy but lose traction in the soft dust. The garrison fights hard but is now defending two fronts.`,
    
    state_changes: [
      { unit_id: "p1_raiders", action: "MOVE", semantic_update: { regionId: "silo_complex", tag: "flank_left" }, new_tags: ["Engaged"] },
      { unit_id: "p4_breacher_squad", action: "MOVE", semantic_update: { regionId: "silo_complex", tag: "flank_left" }, new_tags: ["Engaged"] },
      { unit_id: "e5_knoll_marksmen", action: "UPDATE_STATUS", semantic_update: null, new_tags: ["Casualties", "Routed"] },
      { unit_id: "e1_silo_garrison", action: "UPDATE_STATUS", semantic_update: null, new_tags: ["Engaged", "Divided"] },
      { unit_id: "e4_quick_reaction_rover", action: "UPDATE_STATUS", semantic_update: null, new_tags: ["Bogged", "Redeploying"] }
    ],
    
    region_changes: [],
    
    visual_fx: [
      { type: "DUST", region: "dust_dunes_west", target_unit: null },
      { type: "IMPACT", region: "antenna_knoll", target_unit: "e5_knoll_marksmen" },
      { type: "SMOKE", region: "silo_complex", target_unit: null }
    ],
    
    next_options: [
      {
        id: "opt3_followup_split_garrison",
        title: "Exploit the Split Garrison",
        description: "The defenders are fighting on two fronts. Press hard on both sides simultaneously to force a collapse or surrender.",
        compositeActions: [
          { semanticAction: "COMBINED_ASSAULT", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: null, requiredUnitTypes: ["infantry"], description: null }
        ]
      },
      {
        id: "opt3_followup_ambush_qrf",
        title: "Spring the Dunes Ambush on QRF",
        description: "The enemy rovers are bogged and vulnerable. Hit them with a close-range ambush while they're stuck in the soft dust, eliminating their mobile reserve.",
        compositeActions: [
          { semanticAction: "AMBUSH", targetLogic: "specific_unit", targetRegionId: null, targetUnitId: "e4_quick_reaction_rover", requiredUnitTypes: ["infantry"], description: null },
          { semanticAction: "SUPPRESS", targetLogic: "specific_unit", targetRegionId: null, targetUnitId: "e4_quick_reaction_rover", requiredUnitTypes: ["artillery"], description: null }
        ]
      },
      {
        id: "opt3_followup_capture_comms",
        title: "Capture the Comms Mast",
        description: "With the western service doors breached, make a dash for the comms relay mast. Cut their ability to call for reinforcements or orbital support.",
        compositeActions: [
          { semanticAction: "INFILTRATE", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: null, requiredUnitTypes: ["infantry"], description: null },
          { semanticAction: "SEVER_SUPPLY", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: null, requiredUnitTypes: [], description: null }
        ]
      }
    ]
  },

  opt4_counter_ridge_pressure: {
    narrative_outcome: `Micromortar rounds arc through the dust storm, impacting the basalt escarpment in sprays of regolith. The ridge platoon hunkers down as indirect fire walks across their positions. Your drones spot movement—they're pulling back from the forward edge. You push infantry up the antenna knoll, establishing a foothold. Ridge defenders counter-attack down the gullies, turning the slope into a brutal close-quarters fight in near-zero visibility. The high ground changes hands twice before your elite units hold.`,
    
    state_changes: [
      { unit_id: "p5_mortar_cart", action: "UPDATE_STATUS", semantic_update: null, new_tags: ["Engaged"] },
      { unit_id: "p3_drone_team", action: "MOVE", semantic_update: { regionId: "antenna_knoll", tag: "center" }, new_tags: ["Engaged"] },
      { unit_id: "p1_raiders", action: "MOVE", semantic_update: { regionId: "antenna_knoll", tag: "front_line" }, new_tags: ["Engaged", "Casualties"] },
      { unit_id: "e2_ridge_watch", action: "UPDATE_STATUS", semantic_update: null, new_tags: ["Casualties", "Suppressed"] },
      { unit_id: "e5_knoll_marksmen", action: "REMOVE", semantic_update: null, new_tags: [] }
    ],
    
    region_changes: [],
    
    visual_fx: [
      { type: "EXPLOSION", region: "chryse_ridge", target_unit: null },
      { type: "SMOKE", region: "chryse_ridge", target_unit: null },
      { type: "DUST", region: "antenna_knoll", target_unit: null },
      { type: "IMPACT", region: "antenna_knoll", target_unit: "e5_knoll_marksmen" }
    ],
    
    next_options: [
      {
        id: "opt4_followup_assault_ridge_summit",
        title: "Assault the Ridge Summit",
        description: "You've seized the knoll and suppressed the forward ridge positions. Push the final assault up the ramps to capture the escarpment summit and deny the enemy all high-ground advantage.",
        compositeActions: [
          { semanticAction: "ASSAULT", targetLogic: "specific_region", targetRegionId: "chryse_ridge", targetUnitId: null, requiredUnitTypes: ["infantry"], description: null }
        ]
      },
      {
        id: "opt4_followup_pincer_from_high_ground",
        title: "Use High Ground to Pincer the Silo",
        description: "With the knoll secured, use it as a fire base to support a southern push into the silo complex. The garrison will be caught between high-ground fire and your main assault.",
        compositeActions: [
          { semanticAction: "SUPPRESS", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: null, requiredUnitTypes: [], description: null },
          { semanticAction: "COMBINED_ASSAULT", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: null, requiredUnitTypes: ["infantry", "armor"], description: null }
        ]
      },
      {
        id: "opt4_followup_fortify_knoll",
        title: "Fortify the Knoll and Shell the Garrison",
        description: "Dig in on the knoll and let artillery and mortar fire grind down the garrison. The dust storm favors indirect fire over direct assault—starve them into surrender.",
        compositeActions: [
          { semanticAction: "FORTIFY", targetLogic: "specific_region", targetRegionId: "antenna_knoll", targetUnitId: null, requiredUnitTypes: [], description: null },
          { semanticAction: "BOMBARD", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: null, requiredUnitTypes: ["artillery"], description: null }
        ]
      }
    ]
  },

  opt5_cut_the_reaction_force: {
    narrative_outcome: `Your artillery drops precision fire on the culvert bridge—shaped charges crater the crossing, and you scatter debris across the gully approach. The quick-reaction rovers screech to a halt, pinned by mortar fire and unable to advance. Your armor and raiders sweep wide, bypassing the culvert entirely and encircling the silo complex from the south and west. The garrison realizes their mobile reserve is cut off—panic sets in. Some try to break out, others hunker down. You've isolated the battlefield.`,
    
    state_changes: [
      { unit_id: "p5_mortar_cart", action: "UPDATE_STATUS", semantic_update: null, new_tags: ["Engaged"] },
      { unit_id: "p2_mars_rovers", action: "MOVE", semantic_update: { regionId: "silo_complex", tag: "flank_right" }, new_tags: ["Engaged"] },
      { unit_id: "p1_raiders", action: "MOVE", semantic_update: { regionId: "silo_complex", tag: "flank_left" }, new_tags: ["Engaged"] },
      { unit_id: "e4_quick_reaction_rover", action: "UPDATE_STATUS", semantic_update: null, new_tags: ["Pinned", "Cut Off"] },
      { unit_id: "e1_silo_garrison", action: "UPDATE_STATUS", semantic_update: null, new_tags: ["Isolated", "Low Morale"] }
    ],
    
    region_changes: [
      {
        action: "MODIFY_REGION",
        region_id: "culvert_bridge",
        region_def: null,
        updates: { name: "Cratered Culvert Crossing", influence: null, terrain: null }
      }
    ],
    
    visual_fx: [
      { type: "EXPLOSION", region: "culvert_bridge", target_unit: null },
      { type: "SMOKE", region: "culvert_bridge", target_unit: null },
      { type: "DUST", region: "silo_complex", target_unit: null }
    ],
    
    next_options: [
      {
        id: "opt5_followup_force_surrender",
        title: "Demand Immediate Surrender",
        description: "The garrison is isolated, their QRF is trapped, and the storm is worsening. Broadcast a surrender demand—most will accept terms rather than die for a resource depot.",
        compositeActions: [
          { semanticAction: "DIPLOMACY", targetLogic: "specific_unit", targetRegionId: null, targetUnitId: "e1_silo_garrison", requiredUnitTypes: [], description: null }
        ]
      },
      {
        id: "opt5_followup_eliminate_qrf",
        title: "Eliminate the Trapped QRF",
        description: "The quick-reaction rovers are pinned and cut off. Finish them with concentrated fire to ensure they can't break out and hit your rear during the final assault.",
        compositeActions: [
          { semanticAction: "COMBINED_ASSAULT", targetLogic: "specific_unit", targetRegionId: null, targetUnitId: "e4_quick_reaction_rover", requiredUnitTypes: ["infantry", "artillery"], description: null }
        ]
      },
      {
        id: "opt5_followup_tighten_encirclement",
        title: "Tighten the Encirclement",
        description: "Close the noose around the silo complex from all sides. Any defenders attempting to flee into the storm will be cut down or lost to the dust.",
        compositeActions: [
          { semanticAction: "ENCIRCLE", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: null, requiredUnitTypes: ["infantry", "armor"], description: null },
          { semanticAction: "SUPPRESS", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: null, requiredUnitTypes: [], description: null }
        ]
      }
    ]
  }
}
