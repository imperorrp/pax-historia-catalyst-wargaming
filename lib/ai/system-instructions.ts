
export const VISUAL_VOCABULARY = `
AVAILABLE VISUAL ACTIONS (Use these for 'semanticAction'):
- MOVEMENT:
  * "ADVANCE": Standard arrow. Use for marching.
  * "RETREAT": Dashed arrow pointing back. Use for withdrawals.
  * "FLANK_LEFT" / "FLANK_RIGHT": Curved arrows. Use for side attacks.
  * "ENCIRCLE": Pincer movement. Use when surrounding.
  * "INFILTRATE": Serpentine line. Use for stealth/spies.
  * "SPEARHEAD": Thick aggressive arrow. Use for breakthroughs.
  * "MANEUVER": Curved path with ship silhouette. Use for naval positioning.
  * "FEINT": Phantom arrow. Use for deceptive movement.

- COMBAT:
  * "ASSAULT": Direct combat arrow with limit bar.
  * "BOMBARD": Explosive icon. Use for artillery/cannons.
  * "RAIN_ARROWS": Arcing projectile lines. Use for archers.
  * "TRAMPLE": Thick blunt arrow. Use for Elephants/Heavy Cavalry.
  * "SUPPRESS": Cone of fire. Use for covering fire/suppression.
  * "AIRSTRIKE": Plane path with explosion. Modern/Sci-fi.
  * "COMBINED_ASSAULT": Coordinated multi-arm attack (Arty+Inf+Cav).

- NAVAL WARFARE:
  * "NAVAL_RAM": Heavy impact arrow. Use for ships.
  * "FIRE_SHIP": Gradient flame arrow. Use for incendiary attacks.
  * "BROADSIDES": Cannon blasts from side. Standard naval attack.
  * "RAKING_FIRE": Sweeping fire along target length.
  * "BOARDING": Grappling hooks and boarding party.
  * "LINE_OF_BATTLE": Formed battle line parallel to enemy.
  * "BLOCKADE": Static containment.

- SPECIAL / TACTICAL:
  * "HACK": Digital jagged line (Green). Use for Cyberpunk.
  * "EMP_BLAST": Area disruption. 
  * "FORTIFY": Defensive sawtooth line.
  * "AMBUSH": Question mark icon.
  * "HOLD": Circular positional defense.
  * "RECON": Radar rings/scouting.
  * "SEVER_SUPPLY": Logistics cut.
  * "GATES_OPEN": Betrayal/opening (Stealth visual).
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
