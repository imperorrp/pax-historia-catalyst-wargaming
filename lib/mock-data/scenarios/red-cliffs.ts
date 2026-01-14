import type { WarRoomScenario, RegionLayoutDef } from "../../types"
import { generatePaintedMap } from "../../grid-engine/map-painter"

// PAINTER'S ALGORITHM LAYOUT FOR RED CLIFFS
const RED_CLIFFS_LAYOUT: RegionLayoutDef[] = [
    { id: "north-bank", name: "North Bank Camps", type: "blob", terrain: "plains", seeds: 1, influence: 150, points: [[500, 150]] },
    { id: "south-bank", name: "Red Cliffs", type: "blob", terrain: "mountain", seeds: 1, influence: 140, points: [[500, 550]], isFort: true },
    { id: "yangtze-river", name: "Yangtze River", type: "path", terrain: "river", seeds: 1, influence: 70, points: [[200, 350], [400, 350], [600, 350], [800, 350]] },
    { id: "naval-channel", name: "Naval Channel", type: "path", terrain: "river", seeds: 1, influence: 40, points: [[300, 300], [500, 300], [700, 300]] }
];

export const redCliffs: WarRoomScenario = {
    id: "three_kingdoms_red_cliffs",
    name: "Red Cliffs: 208 AD",
    era: "Ancient",
    playerPolity: "Sun-Liu Alliance",
    enemyPolity: "Cao Cao's Armada",
    mapDimensions: { width: 1000, height: 700 },
    mapRegions: generatePaintedMap(RED_CLIFFS_LAYOUT, 1000, 700),
    layoutDefs: RED_CLIFFS_LAYOUT,
    units: [
      {
        id: "tk_u1", name: "Zhou Yu's Fleet", type: "infantry", // Proxied as infantry for logic
        owner: "player", placement: { regionId: "yangtze-river", tag: "center" },
        tags: ["Warships", "Disciplined"], status: "fresh"
      },
      {
        id: "tk_u2", name: "Huang Gai's Fire Ships", type: "cavalry", // Fast units
        owner: "player", placement: { regionId: "south-bank", tag: "front_line" },
        tags: ["Incendiary", "Volatile", "False Defection"], status: "fresh"
      },
      {
        id: "tk_u3", name: "Archers & Scouts", type: "infantry",
        owner: "player", placement: { regionId: "south-bank", tag: "rear" },
        tags: ["Ranged Support", "Reconnaissance"], status: "fresh"
      },
      {
        id: "tk_u4", name: "Liu Bei's Reserves", type: "infantry",
        owner: "player", placement: { regionId: "south-bank", tag: "flank_left" },
        tags: ["Reserve Force", "Fresh"], status: "fresh"
      },
      {
        id: "tk_e1", name: "Iron Chain Armada", type: "armor", // Heavy, slow
        owner: "enemy", placement: { regionId: "yangtze-river", tag: "center" },
        tags: ["Chained Together", "Immobile", "Massive"], status: "fresh"
      },
      {
        id: "tk_e2", name: "Northern Cavalry", type: "cavalry",
        owner: "enemy", placement: { regionId: "north-bank", tag: "center" },
        tags: ["Seasick", "Disorganized"], status: "wavering"
      },
      {
        id: "tk_e3", name: "Cao Cao's Elite Guard", type: "infantry",
        owner: "enemy", placement: { regionId: "north-bank", tag: "rear" },
        tags: ["Elite", "Defensive"], status: "fresh"
      },
      {
        id: "tk_e4", name: "Supply Barges", type: "infantry",
        owner: "enemy", placement: { regionId: "north-bank", tag: "flank_right" },
        tags: ["Vulnerable", "Logistics"], status: "wavering"
      }
    ],
    options: [
      {
        id: "tk_opt_fire",
        title: "The Fire Attack",
        description: "Launch fire ships into the chained enemy fleet using the Southeast wind—Zhou Yu's masterstroke.",
        semanticAction: "FIRE_SHIP",
        requiredUnitTypes: ["cavalry"],
        compositeActions: [
           { semanticAction: "FEINT", targetLogic: "center_mass", requiredUnitTypes: ["cavalry"], description: "False defection to position ships" },
           { semanticAction: "FIRE_SHIP", targetLogic: "center_mass", requiredUnitTypes: ["cavalry"], description: "Launch fire ships" }
        ],
        visualEffects: ["fire", "explosion", "smoke", "water"]
      },
      {
        id: "tk_opt_naval",
        title: "Naval Combat",
        description: "Engage enemy vessels in close combat and ram their chained formation.",
        semanticAction: "NAVAL_RAM",
        requiredUnitTypes: ["infantry"],
        compositeActions: [
           { semanticAction: "NAVAL_RAM", targetLogic: "nearest", requiredUnitTypes: ["infantry"], description: "Ram and board vessels" },
           { semanticAction: "SUPPRESS", targetLogic: "center_mass", requiredUnitTypes: ["infantry"], description: "Archers provide covering fire" }
        ]
      },
      {
        id: "tk_opt_raid",
        title: "Shoreline Disruption",
        description: "Raid northern camps to disrupt supplies and morale while targeting barges.",
        semanticAction: "SEVER_SUPPLY",
        targetRegionId: "north-bank",
        requiredUnitTypes: ["cavalry", "infantry"],
        compositeActions: [
           { semanticAction: "INFILTRATE", targetLogic: "specific_region", targetRegionId: "north-bank", requiredUnitTypes: ["cavalry"], description: "Shoreline raid" },
           { semanticAction: "SEVER_SUPPLY", targetLogic: "specific_region", targetRegionId: "north-bank", requiredUnitTypes: ["infantry"], description: "Target supply barges" }
        ]
      },
      {
        id: "tk_opt_combined",
        title: "Combined River Assault",
        description: "Coordinate all forces for a synchronized attack on the armada.",
        semanticAction: "COMBINED_ASSAULT",
        targetRegionId: "yangtze-river",
        requiredUnitTypes: ["cavalry", "infantry"],
        compositeActions: [
           { semanticAction: "FIRE_SHIP", targetLogic: "center_mass", requiredUnitTypes: ["cavalry"], description: "Fire ships" },
           { semanticAction: "NAVAL_RAM", targetLogic: "nearest", requiredUnitTypes: ["infantry"], description: "Naval combat" },
           { semanticAction: "REGION_BOMBARDMENT", targetLogic: "specific_region", targetRegionId: "yangtze-river", requiredUnitTypes: ["cavalry"], description: "River fire storm" }
        ],
        visualEffects: ["fire", "explosion", "smoke", "water"]
      }
    ]
  }