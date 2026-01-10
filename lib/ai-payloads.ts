import type { AIGameResponse } from "./types"

export const SAMPLE_PAYLOADS: Record<string, AIGameResponse> = {
  // WW2 Blitzkrieg - Flank Left Success
  ww2_flank_left_success: {
    narrative_update:
      "Your Panzers execute a textbook flanking maneuver through the forest cover, moving through the northern Ardennes and striking the exposed French left flank. The 7th Infantry Division, caught mid-rotation, begins a fighting retreat toward Metz. Enemy morale wavers as their defensive line fractures!",
    state_changes: [
      {
        unit_id: "u1",
        action: "MOVE",
        semantic_update: {
          regionId: "region-1", // Push into Alsace
          type: "border",
          targetId: "region-2",
          offset: 0.3
        },
        new_tags: ["Armor", "Advancing", "Breakthrough"],
      },
      {
        unit_id: "u2",
        action: "MOVE",
        semantic_update: {
          regionId: "region-2",
          type: "border",
          targetId: "region-1",
          offset: 0.5
        },
        new_tags: ["Infantry", "Following", "Support"],
      },
      {
        unit_id: "e1",
        action: "MOVE",
        semantic_update: {
          regionId: "region-1",
          type: "sector",
          targetId: "south_east", // Retreat deeper into Alsace
        },
        new_tags: ["Infantry", "Retreating", "Low Morale"],
      },
    ],
    visual_fx: [
      { type: "DUST", region: "region-2" },
      { type: "EXPLOSION", target_unit: "e1" },
      { type: "SMOKE", region: "region-1" },
    ],
    next_options: [
      {
        id: "opt_push",
        title: "Press the Pursuit",
        description: "Chase retreating forces before they can regroup",
        semanticAction: "ASSAULT",
        requiredUnitTypes: ["armor", "cavalry"],
      },
      {
        id: "opt_consolidate",
        title: "Consolidate Gains",
        description: "Secure captured territory and establish supply lines",
        semanticAction: "FORTIFY",
      },
      {
        id: "opt_encircle",
        title: "Complete Encirclement",
        description: "Send cavalry to cut off enemy retreat toward Strasbourg",
        semanticAction: "ENCIRCLE",
        requiredUnitTypes: ["cavalry"],
      },
    ],
  },

  // WW2 Blitzkrieg - Flank Left Failure
  ww2_flank_left_failure: {
    narrative_update:
      "The Panzers attempt to push through the northern Ardennes, but French intelligence anticipated the move. Hidden 75mm anti-tank guns open fire from concealed positions along the forest edge. Your lead elements take heavy casualties and the advance stalls in the mud. The 7th Infantry Division counterattacks with artillery support!",
    state_changes: [
      {
        unit_id: "u1",
        action: "UPDATE_STATUS",
        new_tags: ["Armor", "Pinned", "Heavy Casualties"],
      },
      {
        unit_id: "u2",
        action: "UPDATE_STATUS",
        new_tags: ["Infantry", "Defensive", "Holding"],
      },
      {
        unit_id: "e1",
        action: "UPDATE_STATUS",
        new_tags: ["Infantry", "Entrenched", "Counterattacking"],
      },
    ],
    visual_fx: [
      { type: "MUD_SPLAT", region: "region-2" },
      { type: "IMPACT", target_unit: "u1" },
      { type: "FIRE", region: "region-2" },
      { type: "EXPLOSION", target_unit: "u1" },
    ],
    next_options: [
      {
        id: "opt_withdraw",
        title: "Tactical Withdrawal",
        description: "Pull back to regroup and reassess",
        semanticAction: "RETREAT",
      },
      {
        id: "opt_artillery",
        title: "Call Artillery",
        description: "Suppress enemy positions with heavy bombardment",
        semanticAction: "BOMBARD",
        requiredUnitTypes: ["artillery"],
      },
      {
        id: "opt_hold",
        title: "Hold Position",
        description: "Dig in and defend current ground",
        semanticAction: "FORTIFY",
      },
    ],
  },

  // Napoleonic - Infantry Assault Success
  napoleonic_assault_success: {
    narrative_update:
      "Your infantry columns, marching in perfect formation, overwhelm the Austrian defenders with disciplined musket fire and bayonet charges. The enemy line breaks!",
    state_changes: [
      {
        unit_id: "n_u1",
        action: "MOVE",
        semantic_update: {
          regionId: "nord-1",
          type: "centroid"
        },
        new_tags: ["Infantry", "Fresh", "Victorious"],
      },
      {
        unit_id: "n_e1",
        action: "MOVE",
        semantic_update: {
          regionId: "nord-1", 
          type: "sector",
          targetId: "east"
        },
        new_tags: ["Infantry", "Broken", "Routing"],
      },
    ],
    visual_fx: [
      { type: "SMOKE", region: "Pratzen" },
      { type: "EXPLOSION", target_unit: "E2" },
    ],
    next_options: [
      {
        id: "opt_pursuit",
        title: "Pursue Routed Enemy",
        description: "Finish the campaign",
        semanticAction: "ASSAULT",
      },
      {
        id: "opt_regroup",
        title: "Regroup Infantry",
        description: "Prepare defensive line",
        semanticAction: "FORTIFY",
      },
      {
        id: "opt_reserves",
        title: "Deploy Reserves",
        description: "Reinforce breakthrough",
        semanticAction: "SPEARHEAD",
      },
    ],
  },

  // Medieval - Siege Success
  medieval_siege_success: {
    narrative_update:
      "Your siege works breach the castle walls. With rams and sappers wearing down the defenses, the garrison surrenders. The stronghold is yours!",
    state_changes: [
      {
        unit_id: "med_u1",
        action: "MOVE",
        semantic_update: {
          regionId: "med-1",
          type: "centroid"
        },
        new_tags: ["Mixed", "Fresh", "Victorious"],
      },
      {
        unit_id: "med_e1",
        action: "REMOVE",
      },
    ],
    visual_fx: [
      { type: "EXPLOSION", region: "Castle" },
      { type: "FIRE", region: "Castle" },
    ],
    next_options: [
      {
        id: "opt_occupy",
        title: "Garrison the Castle",
        description: "Hold strategic position",
        semanticAction: "FORTIFY",
      },
      {
        id: "opt_march",
        title: "March to Next Objective",
        description: "Press the campaign",
        semanticAction: "ADVANCE",
      },
      {
        id: "opt_rest",
        title: "Rest and Resupply",
        description: "Recover from siege",
        semanticAction: "HOLD",
      },
    ],
  },
}
