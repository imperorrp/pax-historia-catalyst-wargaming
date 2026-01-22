import type { WarRoomScenario, RegionLayoutDef } from "../../types"
import { generatePaintedMap } from "../../grid-engine/map-painter"

// PAINTER'S ALGORITHM LAYOUT FOR BLITZKRIEG (Scale: Country Level - No River Region)
const BLITZKRIEG_LAYOUT: RegionLayoutDef[] = [
    { id: "ardennes-forest", name: "Ardennes Sector", type: "blob", terrain: "forest", seeds: 1, influence: 300, points: [[700, 300]] },
    { id: "sedan-plains", name: "Sedan Sector", type: "blob", terrain: "plains", seeds: 1, influence: 300, points: [[200, 300]] },
    { id: "maginot-line", name: "Maginot Line", type: "path", terrain: "urban", seeds: 1, influence: 100, points: [[100, 600], [500, 600], [900, 600]], isFort: true }
];

export const blitzkrieg: WarRoomScenario = {
    id: "ww2_blitzkrieg",
    name: "Blitzkrieg: France 1940",
    era: "WW2",
    playerPolity: "Germany",
    enemyPolity: "France",
    narrative_intro: `Europe, May 1940. The world stands on the brink of a new era as the German war machine unleashes Blitzkrieg—lightning war—across the West.

France, still haunted by the scars of the Great War, trusts in the Maginot Line and the traditions of static defense. But the Ardennes, thought impassable, become the stage for a daring gamble. The fate of nations hangs in the balance as tanks and mechanized infantry surge through forests and river valleys, aiming to split the Allied armies and encircle Paris.

The collapse of France would send shockwaves across the globe, shattering the old order and ushering in years of darkness and resistance. The Sedan sector is not just a battlefield—it is the fulcrum on which the future of Europe pivots.`,
    mapDimensions: {
      width: 900,
      height: 700,
    },
    mapRegions: generatePaintedMap(BLITZKRIEG_LAYOUT, 900, 700),
    layoutDefs: BLITZKRIEG_LAYOUT,
    decorations: [
      {
         id: "meuse-river-deco",
         type: "river",
         points: [[450, 50], [420, 200], [450, 350], [430, 500], [450, 650]],
         color: "rgba(41, 128, 185, 0.6)",
         width: 2 // Thin wavy river
      },
      {
         id: "maginot-label",
         type: "label",
         points: [[500, 620]],
         label: "Maginot Line (Fortified)",
         color: "rgba(0,0,0,0.7)"
      }
    ],
    units: [
      {
        id: "u1",
        name: "7th Panzer Division",
        type: "armor",
        owner: "player",
        placement: { regionId: "sedan-plains", tag: "front_line" },
        tags: ["Elite", "High Mobility", "Panzer"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "u2",
        name: "1st Infantry Division",
        type: "infantry",
        owner: "player",
        placement: { regionId: "sedan-plains", tag: "center" },
        tags: ["Motorized", "Supply Train"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "u3",
        name: "8th Flak Regiment",
        type: "artillery",
        owner: "player",
        placement: { regionId: "sedan-plains", tag: "rear" },
        tags: ["Anti-Air", "Heavy"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "u4",
        name: "2nd Panzer Division",
        type: "armor",
        owner: "player",
        placement: { regionId: "ardennes-forest", tag: "flank_left" },
        tags: ["Elite", "High Mobility", "Panzer"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "u5",
        name: "French 9th Army",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "sedan-plains", tag: "center" },
        tags: ["Entrenched", "Fortified"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "u6",
        name: "French 2nd Army",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "ardennes-forest", tag: "flank_right" },
        tags: ["Entrenched", "Fortified"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "u7",
        name: "Maginot Garrison",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "maginot-line", tag: "center" },
        tags: ["Fortified", "Heavy Artillery"],
        visibility: 100,
        status: "fresh",
      },
    ],
    options: [
      {
        id: "bk_opt_panzer",
        title: "Panzer Thrust",
        description: "Concentrate armor for a lightning breakthrough through the Sedan sector.",
        compositeActions: [
           { semanticAction: "SPEARHEAD", targetLogic: "specific_region", targetRegionId: "sedan-plains", requiredUnitTypes: ["armor"], description: "Armor concentration" },
           { semanticAction: "ADVANCE", targetLogic: "specific_region", targetRegionId: "sedan-plains", requiredUnitTypes: ["armor"], description: "Rapid advance" }
        ]
      },
      {
        id: "bk_opt_ardennes",
        title: "Ardennes Maneuver",
        description: "Use the forest cover for a surprise flanking attack.",
        compositeActions: [
           { semanticAction: "INFILTRATE", targetLogic: "specific_region", targetRegionId: "ardennes-forest", requiredUnitTypes: ["armor"], description: "Forest infiltration" },
           { semanticAction: "FLANK_LEFT", targetLogic: "specific_region", targetRegionId: "ardennes-forest", requiredUnitTypes: ["infantry"], description: "Flanking maneuver" }
        ]
      },
      {
        id: "bk_opt_artillery",
        title: "Artillery Barrage",
        description: "Bombard the Maginot Line defenses to soften them up.",
        compositeActions: [
           { semanticAction: "REGION_BOMBARDMENT", targetLogic: "specific_region", targetRegionId: "maginot-line", requiredUnitTypes: ["artillery"], description: "Bombard fortifications" },
           { semanticAction: "SUPPRESS", targetLogic: "specific_region", targetRegionId: "maginot-line", requiredUnitTypes: ["artillery"], description: "Suppress defenders" }
        ],
        visualEffects: ["explosion", "smoke"]
      },
      {
        id: "bk_opt_combined",
        title: "Blitzkrieg Assault",
        description: "Coordinate all forces for a synchronized armored breakthrough.",
        compositeActions: [
           { semanticAction: "SPEARHEAD", targetLogic: "specific_region", targetRegionId: "sedan-plains", requiredUnitTypes: ["armor"], description: "Armor breakthrough" },
           { semanticAction: "ADVANCE", targetLogic: "specific_region", targetRegionId: "sedan-plains", requiredUnitTypes: ["infantry"], description: "Infantry follow-up" },
           { semanticAction: "REGION_BOMBARDMENT", targetLogic: "specific_region", targetRegionId: "sedan-plains", requiredUnitTypes: ["artillery"], description: "Artillery support" }
        ],
        visualEffects: ["explosion", "smoke"]
      }
    ]
  }