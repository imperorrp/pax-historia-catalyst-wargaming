import type { WarRoomScenario, RegionLayoutDef } from "../../types"
import { generatePaintedMap } from "../../grid-engine/map-painter"

// PAINTER'S ALGORITHM LAYOUT FOR MEDIEVAL SIEGE
const MEDIEVAL_SIEGE_LAYOUT: RegionLayoutDef[] = [
    { id: "castle-keep", name: "Castle Keep", type: "blob", terrain: "urban", seeds: 1, influence: 100, points: [[600, 200]], isFort: true },
    { id: "siege-camp", name: "Siege Camp", type: "blob", terrain: "plains", seeds: 1, influence: 180, points: [[200, 400]] },
    { id: "forest-approach", name: "Forest Approach", type: "blob", terrain: "forest", seeds: 1, influence: 160, points: [[200, 100]] },
    { id: "river-crossing", name: "River Crossing", type: "path", terrain: "river", seeds: 1, influence: 50, points: [[400, 300], [500, 350], [600, 400]] }
];

export const medievalSiege: WarRoomScenario = {
    id: "medieval_siege",
    name: "Castle Siege: The Breach",
    era: "Medieval",
    playerPolity: "The Crown",
    enemyPolity: "Rebel Lords",
    narrative_intro: `Europe, High Middle Ages. Castles dot the landscape as symbols of feudal power and the struggle for legitimacy. The land is fractured by rival claims, dynastic feuds, and the ambitions of lords and kings.

A besieged fortress is more than stone and mortar—it is the heart of a region’s authority, a storehouse of wealth, and a refuge for the desperate. The outcome of a siege can tip the balance of power, spark revolts, or bring peace to a war-torn countryside. As the engines of war grind on, famine and disease threaten both besieger and besieged, and the fate of the realm hangs on the breach or the bargain struck at dawn.`,
    mapDimensions: {
      width: 800,
      height: 600,
    },
    mapRegions: generatePaintedMap(MEDIEVAL_SIEGE_LAYOUT, 800, 600),
    layoutDefs: MEDIEVAL_SIEGE_LAYOUT,
    units: [
      {
        id: "med_u1",
        name: "Trebuchet Battery",
        type: "artillery",
        owner: "player",
        placement: { regionId: "siege-camp", tag: "center" },
        tags: ["Siege Engine", "Heavy", "Slow Reload"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "med_u2",
        name: "Assault Infantry",
        type: "infantry",
        owner: "player",
        placement: { regionId: "siege-camp", tag: "front_line" },
        tags: ["Scaling Ladders", "Siege Towers"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "med_u3",
        name: "Light Cavalry Scouts",
        type: "cavalry",
        owner: "player",
        placement: { regionId: "forest-approach", tag: "flank_left" },
        tags: ["Fast", "Scouting", "Harass"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "med_u4",
        name: "Siege Engineers",
        type: "infantry",
        owner: "player",
        placement: { regionId: "siege-camp", tag: "rear" },
        tags: ["Mining", "Sappers", "Support"],
        visibility: 90,
        status: "fresh",
      },
      {
        id: "med_u5",
        name: "Archers",
        type: "infantry",
        owner: "player",
        placement: { regionId: "forest-approach", tag: "center" },
        tags: ["Ranged", "Cover Fire"],
        visibility: 95,
        status: "fresh",
      },
      {
        id: "med_e1",
        name: "Castle Garrison",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "castle-keep", tag: "center" },
        tags: ["Defending", "Fortified", "Low Morale"],
        visibility: 100,
        status: "wavering",
      },
      {
        id: "med_e2",
        name: "Relief Force",
        type: "cavalry",
        owner: "enemy",
        placement: { regionId: "forest-approach", tag: "flank_right" },
        tags: ["Hidden", "Fast", "Light Horse"],
        visibility: 30,
        status: "fresh",
      },
      {
        id: "med_e3",
        name: "Castle Artillery",
        type: "artillery",
        owner: "enemy",
        placement: { regionId: "castle-keep", tag: "rear" },
        tags: ["Ballistae", "Defensive"],
        visibility: 80,
        status: "engaged",
      },
      {
        id: "med_e4",
        name: "Town Militia",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "siege-camp", tag: "rear" },
        tags: ["Reserve", "Poor Training"],
        visibility: 60,
        status: "wavering",
      },
    ],
    options: [
      {
        id: "medopt_bombard",
        title: "Castle Bombardment",
        description: "Focus trebuchets and siege engines on the castle keep to create breach points.",
        compositeActions: [
           { semanticAction: "BOMBARD", targetLogic: "specific_region", targetRegionId: "castle-keep", requiredUnitTypes: ["artillery"], description: "Systematic bombardment" },
           { semanticAction: "SUPPRESS", targetLogic: "specific_region", targetRegionId: "castle-keep", requiredUnitTypes: ["artillery"], description: "Suppressive barrage" }
        ],
        visualEffects: ["fire", "explosion", "smoke"]
      },
      {
        id: "medopt_assault",
        title: "Combined Escalade",
        description: "Coordinate artillery, infantry assault, and cavalry screening for breach.",
        compositeActions: [
           { semanticAction: "ASSAULT", targetLogic: "specific_region", targetRegionId: "castle-keep", requiredUnitTypes: ["infantry"], description: "Escalade assault" },
           { semanticAction: "SEVER_SUPPLY", targetLogic: "specific_region", targetRegionId: "river-crossing", requiredUnitTypes: ["cavalry"], description: "Isolate the castle" }
        ]
      },
      {
        id: "medopt_infiltrate",
        title: "Sabotage & Infiltration",
        description: "Send scouts to infiltrate and sow panic while mining under walls.",
        compositeActions: [
           { semanticAction: "INFILTRATE", targetLogic: "specific_region", targetRegionId: "castle-keep", requiredUnitTypes: ["cavalry"], description: "Night infiltration" },
           { semanticAction: "GATES_OPEN", targetLogic: "specific_region", targetRegionId: "castle-keep", requiredUnitTypes: ["infantry"], description: "Mining sabotage" }
        ]
      },
      {
        id: "medopt_fortify",
        title: "Fortify & Defend",
        description: "Entrench siege lines and prepare defenses against relief forces.",
        semanticAction: "FORTIFY",
          compositeActions: [
            { semanticAction: "FORTIFY", targetLogic: "self", requiredUnitTypes: ["infantry"], description: "Fortify siege lines" },
            { semanticAction: "HOLD", targetLogic: "self", requiredUnitTypes: ["infantry"], description: "Defend against relief" }
          ]
      }
    ]
  }