import type { AIGameResponse } from "./types"

export const SAMPLE_PAYLOADS: Record<string, AIGameResponse> = {
  // WW2 Blitzkrieg - Flank Left Success
  ww2_flank_left_success: {
    narrative_update:
      "Your Panzers execute a textbook flanking maneuver through the forest cover. The French infantry, caught unprepared, begins a fighting retreat. Morale wavers!",
    state_changes: [
      {
        unit_id: "U1",
        action: "MOVE",
        to_region: "Lorraine",
        new_tags: ["Armor", "Fresh", "Breakthrough"],
      },
      {
        unit_id: "E1",
        action: "UPDATE_STATUS",
        new_tags: ["Infantry", "Entrenched", "Wavering"],
      },
    ],
    visual_fx: [
      { type: "DUST", region: "Lorraine" },
      { type: "EXPLOSION", target_unit: "E1" },
    ],
    next_options: [
      {
        id: "opt_push",
        title: "Press Advantage",
        description: "Capitalize on enemy confusion",
        semanticAction: "ASSAULT",
      },
      {
        id: "opt_consolidate",
        title: "Consolidate Position",
        description: "Secure captured ground",
        semanticAction: "FORTIFY",
      },
      {
        id: "opt_encircle",
        title: "Complete Encirclement",
        description: "Cut off retreat route",
        semanticAction: "ENCIRCLE",
      },
    ],
  },

  // WW2 Blitzkrieg - Flank Left Failure
  ww2_flank_left_failure: {
    narrative_update:
      "The Panzers push through the mud, but French anti-tank defenses are stronger than expected. Your spearhead is bogged down and taking fire. The advance stalls.",
    state_changes: [
      {
        unit_id: "U1",
        action: "UPDATE_STATUS",
        new_tags: ["Armor", "Stalled", "Under_Fire"],
      },
      {
        unit_id: "E1",
        action: "UPDATE_STATUS",
        new_tags: ["Infantry", "Entrenched", "Firing"],
      },
    ],
    visual_fx: [
      { type: "MUD_SPLAT", region: "Lorraine" },
      { type: "IMPACT", target_unit: "U1" },
    ],
    next_options: [
      {
        id: "opt_withdraw",
        title: "Tactical Withdrawal",
        description: "Regroup and reassess",
        semanticAction: "RETREAT",
      },
      {
        id: "opt_suppress",
        title: "Suppressive Fire",
        description: "Neutralize enemy defenses",
        semanticAction: "BOMBARD",
      },
      {
        id: "opt_alternative",
        title: "Alternate Route",
        description: "Find another approach",
        semanticAction: "INFILTRATE",
      },
    ],
  },

  // Napoleonic - Infantry Assault Success
  napoleonic_assault_success: {
    narrative_update:
      "Your infantry columns, marching in perfect formation, overwhelm the Austrian defenders with disciplined musket fire and bayonet charges. The enemy line breaks!",
    state_changes: [
      {
        unit_id: "N1",
        action: "MOVE",
        to_region: "Pratzen",
        new_tags: ["Infantry", "Fresh", "Victorious"],
      },
      {
        unit_id: "E2",
        action: "UPDATE_STATUS",
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
        unit_id: "M1",
        action: "MOVE",
        to_region: "Castle",
        new_tags: ["Mixed", "Fresh", "Victorious"],
      },
      {
        unit_id: "E3",
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
