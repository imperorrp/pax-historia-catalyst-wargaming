
// lib/ai/knowledge-base.ts

export const TAG_LIBRARY = `
STANDARD UNIT TAGS (Use these to define unit state/capabilities):
- STATUS: "Fresh", "Engaged", "Wavering", "Routing", "Pinned", "Dug-in", "Exhausted"
- ATTRIBUTE: "Elite", "Green", "Heavy Armor", "Light", "Stealth", "Mounted", "Slow"
- EQUIPMENT: "Shields", "Longbows", "Spears", "Cannons", "Machine Guns", "Elephants"
- TACTICAL: "Flanking", "Encircled", "High Ground", "Ambushing", "Suppressed"
`;

export const FX_LIBRARY = `
AVAILABLE VISUAL FX TYPES:
- "EXPLOSION": Artillery hits, tank destruction.
- "SMOKE": Screen movement, aftermath of fire.
- "FIRE": Incendiary attacks, burning cities.
- "DUST": Cavalry charges, heavy movement.
- "MUD_SPLAT": Failed movement in difficult terrain.
- "IMPACT": Kinetic hits (arrows, swords, bullets).
`;

export const VISUAL_VOCABULARY = `
AVAILABLE VISUAL ACTIONS (Use these for 'semanticAction'):
- MOVEMENT:
  * "ADVANCE": Standard arrow. Use for marching.
  * "RETREAT": Dashed arrow pointing back. Use for withdrawals.
  * "FLANK_LEFT" / "FLANK_RIGHT": Curved arrows. Use for side attacks.
  * "ENCIRCLE": Pincer movement. Use when surrounding.
  * "INFILTRATE": Serpentine line. Use for stealth/spies.
  * "SPEARHEAD": Thick aggressive arrow. Use for breakthroughs.

- COMBAT:
  * "ASSAULT": Direct combat arrow with limit bar.
  * "BOMBARD": Explosive icon. Use for artillery/cannons.
  * "RAIN_ARROWS": Arcing projectile lines. Use for archers.
  * "TRAMPLE": Thick blunt arrow. Use for Elephants/Heavy Cavalry.
  * "NAVAL_RAM": Heavy impact arrow. Use for ships.
  * "FIRE_SHIP": Gradient flame arrow. Use for incendiary attacks.

- SPECIAL:
  * "HACK": Digital jagged line (Green). Use for Cyberpunk.
  * "EMP_BLAST": Area disruption. 
  * "FORTIFY": Defensive sawtooth line.
  * "AMBUSH": Question mark icon.
`;

export const TERRAIN_GUIDE = `
VALID TERRAIN TYPES & RULES:
- "plains": Open ground. Advantage to Cavalry/Armor.
- "forest": Dense cover. Blocks line of sight. Disadvantage to Cavalry. Advantage to Infantry ambush.
- "mountain": Impassable to Armor/Cavalry. High defense bonus.
- "river": Crossing imposes "Vulnerable" status unless a bridge is used.
- "mud": High movement penalty. Chance of vehicles getting "Stuck".
- "urban": Close quarters. High defense. Deadly to Armor without Infantry support.
`;

export const LAYOUT_GENERATION_RULES = `
RULES FOR GENERATING MAP REGIONS (The 'Painter's Algorithm'):
1. DO NOT define polygons. Define 'points' (centers).
2. 'type': "path" is for Rivers/Roads. Give it multiple points to create a curve.
3. 'type': "blob" is for Forests/Plains. Give it one central point.
4. 'influence': High number (e.g., 200) makes the region bigger. Low number (50) makes it smaller.
5. Coordinate Space: 0-1000 Width, 0-800 Height.
   - 0,0 is Top-Left. 
   - 1000,800 is Bottom-Right.
`;

// ONE-SHOT EXAMPLE: SCENARIO GENERATION
// This teaches the AI how to use the "Painter's Algorithm" layout
export const SCENARIO_EXAMPLE_JSON = JSON.stringify({
  thought_chain: "This is a classic Medieval battle. The Saxons have defensive position on Senlac Hill with shield wall infantry. The Normans are in the valley with cavalry. I'll create a marsh to the west to limit flanking options and force engagement through the center.",
  name: "Battle of Hastings (1066)",
  era: "Medieval",
  playerPolity: "Normans",
  enemyPolity: "Saxons",
  narrative_intro: "William the Conqueror faces King Harold Godwinson on Senlac Hill. The Saxons hold the high ground with a shield wall.",
  layout: [
    {
      id: "senlac_hill",
      name: "Senlac Hill",
      type: "blob",
      terrain: "mountain",
      influence: 150,
      points: [[500, 200]], // Top Center
      description: "Steep slopes defending the Saxon center."
    },
    {
      id: "marsh_flank",
      name: "Western Marsh",
      type: "blob",
      terrain: "mud",
      influence: 80,
      points: [[150, 400]], // Left flank obstacle
      description: "Boggy ground unsuitable for cavalry."
    },
    {
      id: "valley_floor",
      name: "The Valley",
      type: "path", // A broad path for the attackers
      terrain: "plains",
      influence: 200,
      points: [[100, 700], [500, 600], [900, 700]], // Bottom area
      description: "Deployment zone for the Normans."
    }
  ],
  units: [
    {
      id: "norman_cav",
      name: "Norman Knights",
      type: "cavalry",
      owner: "player",
      placement: { regionId: "valley_floor", tag: "center" },
      tags: ["Mounted", "Shock", "Fresh"]
    },
    {
      id: "saxon_wall",
      name: "The Shield Wall",
      type: "infantry",
      owner: "enemy",
      placement: { regionId: "senlac_hill", tag: "front_line" },
      tags: ["Shields", "High Ground", "Dug-in"]
    }
  ],
  tactical_options: [
    {
      id: "opt_feint",
      title: "Feigned Retreat",
      description: "Pretend to flee to draw the Saxons off the hill.",
      // SHOW THE AI HOW TO STACK ACTIONS
      compositeActions: [
        { 
           semanticAction: "RETREAT", 
           targetLogic: "center_mass", 
           requiredUnitTypes: ["cavalry"], 
           description: "Lure enemy out" 
        },
        { 
           semanticAction: "ENCIRCLE", 
           targetLogic: "flank_right", 
           requiredUnitTypes: ["infantry"], 
           description: "Collapse on their flank" 
        }
      ],
      visualEffects: ["dust", "smoke"]
    }
  ]
});

// ONE-SHOT EXAMPLE: TURN RESOLUTION
// This teaches the AI how to move units and apply FX
export const TURN_EXAMPLE_JSON = JSON.stringify({
  thought_chain: "The breach is open. I need to direct the player's next move to exploit this specific location, rather than a general attack.",
  narrative_outcome: "The wall collapses! Dust chokes the defenders as your infantry surge forward.",
  state_changes: [
    {
      unit_id: "saxon_wall",
      action: "MOVE",
      semantic_update: { regionId: "valley_floor", tag: "center" },
      new_tags: ["Wavering", "Exposed"]
    },
    {
      unit_id: "norman_cav",
      action: "UPDATE_STATUS",
      new_tags: ["Engaged", "Victorious"]
    }
  ],
  visual_fx: [
    { type: "EXPLOSION", region: "castle-keep" },
    { type: "DUST", region: "castle-keep" }
  ],
  next_options: [
    {
      id: "opt_storm_breach",
      title: "Storm the Breach",
      description: "Pour infantry directly into the castle keep through the new gap.",
      compositeActions: [
        { 
           semanticAction: "SPEARHEAD", 
           targetLogic: "specific_region", 
           targetRegionId: "castle-keep", 
           requiredUnitTypes: ["infantry"], 
           description: "Assault the keep interior" 
        }
      ]
    },
    {
      id: "opt_cut_off",
      title: "Cut Off Retreat",
      description: "Send cavalry to the rear gate to prevent escape.",
      compositeActions: [
        { 
           semanticAction: "ENCIRCLE", 
           targetLogic: "specific_region", 
           targetRegionId: "rear-gate", 
           requiredUnitTypes: ["cavalry"],
           description: "Blockade rear exit"
        }
      ]
    }
  ]
});
