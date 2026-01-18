
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
VALID TERRAIN TYPES:
- "plains": Default movement.
- "forest": Defensive bonus, blocks cavalry. Visual: Green cross-hatch.
- "mountain": Impassable/Hard. Visual: Grey peaks.
- "river": Blue wavy texture. Needs bridges to cross.
- "mud": Brown dotted texture. Slows movement (good for historic battles).
- "urban": Grey solid blocks. Good for defensive "FORTIFY".
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
      centerCoordinates: { x: 500, y: 200 }, // Top Center
      description: "Steep slopes defending the Saxon center."
    },
    {
      id: "marsh_flank",
      name: "Western Marsh",
      type: "blob",
      terrain: "mud",
      influence: 80,
      centerCoordinates: { x: 150, y: 400 }, // Left flank obstacle
      description: "Boggy ground unsuitable for cavalry."
    },
    {
      id: "valley_floor",
      name: "The Valley",
      type: "path", // A broad path for the attackers
      terrain: "plains",
      influence: 200,
      pathPoints: [[100, 700], [500, 600], [900, 700]], // Bottom area
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
      semanticAction: "FEINT",
      targetLogic: "center_mass"
    }
  ]
});

// ONE-SHOT EXAMPLE: TURN RESOLUTION
// This teaches the AI how to move units and apply FX
export const TURN_EXAMPLE_JSON = JSON.stringify({
  narrative_update: "The feigned retreat works! undisciplined Saxon Fyrd break ranks to chase your cavalry. As they hit the valley floor, your knights wheel around. The shield wall is fractured.",
  state_changes: [
    {
      unit_id: "saxon_wall",
      action: "MOVE",
      semantic_update: { regionId: "valley_floor", tag: "center" },
      new_tags: ["Disorganized", "Exposed"] // Changed from "Dug-in"
    },
    {
      unit_id: "norman_cav",
      action: "UPDATE_STATUS",
      new_tags: ["Counter-Attacking", "Fresh"]
    }
  ],
  visual_fx: [
    { type: "DUST", region: "senlac_hill" }, // Movement down hill
    { type: "IMPACT", target_unit: "saxon_wall" } // Knights hitting them
  ],
  next_options: [
    {
      id: "opt_crush",
      title: "Crush the Exposed",
      description: "Surround the isolated Saxon units.",
      semanticAction: "ENCIRCLE",
      targetLogic: "nearest"
    }
  ]
});
