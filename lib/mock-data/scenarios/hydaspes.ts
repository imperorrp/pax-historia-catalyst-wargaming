import type { WarRoomScenario, RegionLayoutDef } from "../../types"
import { generatePaintedMap } from "../../grid-engine/map-painter"

// PAINTER'S ALGORITHM LAYOUT FOR HYDASPES
const HYDASPES_LAYOUT: RegionLayoutDef[] = [
    { id: "hyd-river", name: "River Hydaspes", type: "path", terrain: "river", seeds: 1, influence: 50, points: [[200, 0], [300, 200], [500, 400], [700, 700]] },
    { id: "hyd-west-camp", name: "Alexander's Camp", type: "blob", terrain: "plains", seeds: 1, influence: 140, points: [[200, 350]], isFort: true },
    { id: "hyd-west-hills", name: "Rainy Hills", type: "blob", terrain: "mountain", seeds: 1, influence: 120, points: [[100, 100]] },
    { id: "hyd-island", name: "River Island", type: "point", terrain: "mud", seeds: 1, influence: 35, points: [[380, 250]] },
    { id: "hyd-east-mud", name: "Muddy Banks", type: "path", terrain: "mud", seeds: 1, influence: 60, points: [[500, 100], [550, 350], [500, 600]] },
    { id: "hyd-east-forest", name: "Elephant Corps", type: "blob", terrain: "forest", seeds: 1, influence: 160, points: [[750, 350]] },
    { id: "hyd-east-plains", name: "Chariot Ground", type: "blob", terrain: "plains", seeds: 1, influence: 150, points: [[750, 600]] },
    { id: "hyd-flank-route", name: "Hidden Route", type: "path", terrain: "forest", seeds: 1, influence: 40, points: [[50, 50], [250, 40], [350, 80]] }
];

export const hydaspes: WarRoomScenario = {
    id: "ancient_india_hydaspes",
    name: "Hydaspes: 326 BC",
    era: "Ancient",
    playerPolity: "Macedonia",
    enemyPolity: "Paurava Kingdom",
    mapDimensions: { width: 900, height: 700 },
    mapRegions: generatePaintedMap(HYDASPES_LAYOUT, 900, 700),
    layoutDefs: HYDASPES_LAYOUT,
    units: [
      {
        id: "mac_u1", name: "Companion Cavalry", type: "cavalry",
        owner: "player", placement: { regionId: "hyd-west-hills", tag: "flank_right" },
        tags: ["Shock Cavalry", "Elite"], status: "fresh"
      },
      {
        id: "mac_u2", name: "Phalanx", type: "infantry",
        owner: "player", placement: { regionId: "hyd-west-camp", tag: "center" },
        tags: ["Sarissa", "Slow"], status: "fresh"
      },
      {
        id: "ind_e1", name: "War Elephants", type: "elephant",
        owner: "enemy", placement: { regionId: "hyd-east-forest", tag: "front_line" },
        tags: ["Terrifying", "Trample"], status: "fresh"
      },
      {
        id: "ind_e2", name: "Indian Chariots", type: "chariot",
        owner: "enemy", placement: { regionId: "hyd-east-plains", tag: "flank_left" },
        tags: ["Stuck in Mud", "Heavy"], status: "engaged"
      }
    ],
    options: [
      {
        id: "hyd_opt_1", title: "Cavalry Encirclement",
        description: "Send Alexander and the Companions to cross upstream and strike the enemy rear.",
        compositeActions: [
           { semanticAction: "ENCIRCLE", targetLogic: "rear", requiredUnitTypes: ["cavalry"], description: "Cross upstream and flank" },
           { semanticAction: "SPEARHEAD", targetLogic: "rear", requiredUnitTypes: ["cavalry"], description: "Strike enemy rear" }
        ]
      },
      {
        id: "hyd_opt_2", title: "Target the Elephants",
        description: "Order light infantry to rain arrows on the beasts to cause a stampede.",
        compositeActions: [
           { semanticAction: "RAIN_ARROWS", targetLogic: "nearest", requiredUnitTypes: ["infantry"], description: "Arrow barrage on elephants" },
           { semanticAction: "SUPPRESS", targetLogic: "nearest", requiredUnitTypes: ["infantry"], description: "Cause stampede" }
        ]
      },
      {
        id: "hyd_opt_3", title: "Phalanx Advance",
        description: "Lock shields and push across the river banks.",
        compositeActions: [
           { semanticAction: "ADVANCE", targetLogic: "center_mass", requiredUnitTypes: ["infantry"], description: "Phalanx push" },
           { semanticAction: "HOLD", targetLogic: "center_mass", requiredUnitTypes: ["infantry"], description: "Maintain formation" }
        ]
      },
      {
        id: "hyd_opt_4", title: "Elephant Counter",
        description: "Use cavalry to harass and disrupt the elephant charge before it reaches the lines.",
        compositeActions: [
           { semanticAction: "SUPPRESS", targetLogic: "nearest", requiredUnitTypes: ["cavalry"], description: "Harass elephants" },
           { semanticAction: "FEINT", targetLogic: "nearest", requiredUnitTypes: ["cavalry"], description: "Draw them out" },
           { semanticAction: "SPEARHEAD", targetLogic: "nearest", requiredUnitTypes: ["cavalry"], description: "Counter-charge" }
        ]
      }
    ]
  }