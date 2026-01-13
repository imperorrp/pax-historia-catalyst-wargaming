import type { AIGameResponse } from "../types"

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
          regionId: "region-1",
          tag: "front_line"
        },
        new_tags: ["Armor", "Advancing", "Breakthrough"],
      },
      {
        unit_id: "u2",
        action: "MOVE",
        semantic_update: {
          regionId: "region-2",
          tag: "front_line"
        },
        new_tags: ["Infantry", "Following", "Support"],
      },
      {
        unit_id: "e1",
        action: "MOVE",
        semantic_update: {
          regionId: "region-1",
          tag: "rear_guard"
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
          tag: "center"
        },
        new_tags: ["Infantry", "Fresh", "Victorious"],
      },
      {
        unit_id: "n_e1",
        action: "MOVE",
        semantic_update: {
          regionId: "nord-1",
          tag: "flank_right"
        },
        new_tags: ["Infantry", "Broken", "Routing"],
      },
    ],
    visual_fx: [
      { type: "SMOKE", region: "nord-1" },
      { type: "EXPLOSION", target_unit: "n_e1" },
      { type: "DUST", region: "nord-2" },
      { type: "FIRE", region: "nord-1" },
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

  // Napoleonic - Cavalry Charge Success
  napoleonic_cavalry_charge_success: {
    narrative_update:
      "The Cuirassiers charge forward in a magnificent display of élan! Their heavy horses crash through the Russian lines, sabers flashing and lances lowered. The enemy formations shatter under the impact!",
    state_changes: [
      {
        unit_id: "n_u2",
        action: "MOVE",
        semantic_update: {
          regionId: "nord-3",
          tag: "center"
        },
        new_tags: ["Cavalry", "Charging", "Breakthrough"],
      },
      {
        unit_id: "n_e2",
        action: "UPDATE_STATUS",
        new_tags: ["Infantry", "Shattered", "Routing"],
      },
    ],
    visual_fx: [
      { type: "DUST", region: "nord-3" },
      { type: "EXPLOSION", target_unit: "n_e2" },
      { type: "SMOKE", region: "nord-3" },
      { type: "FIRE", region: "nord-3" },
      { type: "IMPACT", target_unit: "n_e2" },
    ],
    next_options: [
      {
        id: "opt_exploit",
        title: "Exploit the Gap",
        description: "Push through the breach before enemy can reform",
        semanticAction: "ASSAULT",
        requiredUnitTypes: ["cavalry", "infantry"],
      },
      {
        id: "opt_reform",
        title: "Reform Lines",
        description: "Regroup cavalry after the charge",
        semanticAction: "FORTIFY",
      },
      {
        id: "opt_pursue",
        title: "Pursue the Routed",
        description: "Chase fleeing enemy forces",
        semanticAction: "ENCIRCLE",
        requiredUnitTypes: ["cavalry"],
      },
    ],
  },

  // Napoleonic - Artillery Bombardment Success
  napoleonic_artillery_success: {
    narrative_update:
      "Your horse artillery unlimbers and begins a devastating barrage! The Austrian positions on Pratzen Heights are pounded mercilessly. Enemy formations waver under the iron hail!",
    state_changes: [
      {
        unit_id: "n_u3",
        action: "UPDATE_STATUS",
        new_tags: ["Artillery", "Bombarding", "Effective"],
      },
      {
        unit_id: "n_e1",
        action: "UPDATE_STATUS",
        new_tags: ["Infantry", "Under Fire", "Wavering"],
      },
      {
        unit_id: "n_e3",
        action: "UPDATE_STATUS",
        new_tags: ["Artillery", "Suppressed", "Damaged"],
      },
    ],
    visual_fx: [
      { type: "EXPLOSION", region: "nord-1" },
      { type: "SMOKE", region: "nord-1" },
      { type: "FIRE", region: "nord-1" },
      { type: "DUST", region: "nord-4" },
      { type: "IMPACT", target_unit: "n_e3" },
    ],
    next_options: [
      {
        id: "opt_assault",
        title: "Assault Under Cover",
        description: "Attack while artillery suppresses enemy fire",
        semanticAction: "ASSAULT",
        requiredUnitTypes: ["infantry"],
      },
      {
        id: "opt_shift_fire",
        title: "Shift Fire",
        description: "Target enemy artillery positions",
        semanticAction: "BOMBARD",
        requiredUnitTypes: ["artillery"],
      },
      {
        id: "opt_cease_fire",
        title: "Cease Fire",
        description: "Conserve ammunition and reposition",
        semanticAction: "FORTIFY",
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
          tag: "center"
        },
        new_tags: ["Mixed", "Fresh", "Victorious"],
      },
      {
        unit_id: "med_e1",
        action: "REMOVE",
      },
    ],
    visual_fx: [
      { type: "EXPLOSION", region: "med-1" },
      { type: "FIRE", region: "med-1" },
      { type: "SMOKE", region: "med-1" },
      { type: "DUST", region: "med-2" },
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

  // Medieval - Night Raid Success
  medieval_night_raid_success: {
    narrative_update:
      "Under the cover of darkness, your raiders scale the walls with grappling hooks and ladders! The castle garrison is caught completely off guard. Confusion reigns as your forces create chaos within the fortifications!",
    state_changes: [
      {
        unit_id: "med_u1",
        action: "MOVE",
        semantic_update: {
          regionId: "med-1",
          tag: "flank_left"
        },
        new_tags: ["Infantry", "Inside Walls", "Surprise"],
      },
      {
        unit_id: "med_u3",
        action: "MOVE",
        semantic_update: {
          regionId: "med-1",
          tag: "flank_right"
        },
        new_tags: ["Cavalry", "Mounted", "Disruptive"],
      },
      {
        unit_id: "med_e1",
        action: "UPDATE_STATUS",
        new_tags: ["Infantry", "Surprised", "Disorganized"],
      },
    ],
    visual_fx: [
      { type: "FIRE", region: "med-1" },
      { type: "SMOKE", region: "med-1" },
      { type: "EXPLOSION", target_unit: "med_e1" },
      { type: "DUST", region: "med-1" },
      { type: "IMPACT", target_unit: "med_e1" },
    ],
    next_options: [
      {
        id: "opt_exploit_chaos",
        title: "Exploit the Chaos",
        description: "Press the attack while defenders are disorganized",
        semanticAction: "ASSAULT",
        requiredUnitTypes: ["infantry", "cavalry"],
      },
      {
        id: "opt_secure_gate",
        title: "Secure the Gate",
        description: "Open the main gate for the main force",
        semanticAction: "SEVER_SUPPLY",
      },
      {
        id: "opt_withdraw",
        title: "Tactical Withdrawal",
        description: "Pull back before reinforcements arrive",
        semanticAction: "RETREAT",
      },
    ],
  },

  // Medieval - Bridge Control Success
  medieval_bridge_control_success: {
    narrative_update:
      "Your knights charge across the stone bridge, their heavy armor and lances overwhelming the light horse defenders! The vital river crossing is secured, cutting off the castle's supply lines and preventing relief forces from intervening!",
    state_changes: [
      {
        unit_id: "med_u3",
        action: "MOVE",
        semantic_update: {
          regionId: "med-4",
          tag: "center"
        },
        new_tags: ["Cavalry", "Controlling", "Bridge"],
      },
      {
        unit_id: "med_e2",
        action: "UPDATE_STATUS",
        new_tags: ["Cavalry", "Repelled", "Retreating"],
      },
    ],
    visual_fx: [
      { type: "DUST", region: "med-4" },
      { type: "EXPLOSION", target_unit: "med_e2" },
      { type: "SMOKE", region: "med-4" },
      { type: "IMPACT", target_unit: "med_e2" },
      { type: "FIRE", region: "med-4" },
    ],
    next_options: [
      {
        id: "opt_fortify_bridge",
        title: "Fortify Bridge",
        description: "Build defensive works to hold the crossing",
        semanticAction: "FORTIFY",
      },
      {
        id: "opt_cross_river",
        title: "Cross River",
        description: "Send infantry across to threaten the castle",
        semanticAction: "ASSAULT",
        requiredUnitTypes: ["infantry"],
      },
      {
        id: "opt_wait_relief",
        title: "Wait for Relief",
        description: "Block the bridge and starve the garrison",
        semanticAction: "SEVER_SUPPLY",
      },
    ],
  },
}