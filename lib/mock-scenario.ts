import type { WarRoomScenario } from "./types"

export const SCENARIOS: Record<string, WarRoomScenario> = {
  ww2_blitzkrieg: {
    id: "ww2_blitzkrieg",
    name: "Blitzkrieg: France 1940",
    era: "WW2",
    playerPolity: "Germany",
    enemyPolity: "France",
    mapDimensions: {
      width: 800,
      height: 600,
    },
    mapRegions: [
      {
        id: "region-1", // Alsace (Right/East)
        name: "Alsace",
        points: [
          [400, 0], [420, 100], [380, 200], [410, 300], [390, 400], [400, 600], // Border (River)
          [800, 600], [800, 0] // East bound
        ],
        gridScale: 30, 
        neighbors: ["region-2"],
        terrain: "forest",
        isCity: false,
      },
      {
        id: "region-2", // Lorraine (Left/West)
        name: "Lorraine",
        points: [
          [0, 0], 
          [400, 0], [420, 100], [380, 200], [410, 300], [390, 400], [400, 600], // Border (River)
          [0, 600] // West bound
        ], 
        gridScale: 30,
        neighbors: ["region-1"],
        terrain: "plains",
        features: [
           {
            id: "river_rhine",
            type: "river",
            // Semantic location only here, actual drawing will use the shared border geometry
            location: { regionId: "region-2", type: "feature" } 
          }
        ]
      },
    ],
    units: [
      {
        id: "u1",
        name: "1st Panzer Division",
        type: "armor",
        owner: "player",
        location: { x: 150, y: 250 }, 
        q: 2, r: 5, // Hex Override
        semanticPos: { regionId: "region-2", type: "sector", targetId: "west" },
        tags: ["Elite", "High Mobility"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "u2",
        name: "5th Infantry Corps",
        type: "infantry",
        owner: "player",
        location: { x: 100, y: 350 },
        q: 2, r: 7, // Hex Override
        semanticPos: { regionId: "region-2", type: "sector", targetId: "south_west" },
        tags: ["Reinforced", "Supply Train"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "e1",
        name: "7th Infantry Division",
        type: "infantry",
        owner: "enemy",
        location: { x: 600, y: 250 }, 
        q: 9, r: 1, // Hex Override (East, Alsace)
        semanticPos: { regionId: "region-1", type: "centroid" },
        tags: ["Entrenched", "Low Ammo"],
        visibility: 75,
        status: "engaged",
      },
      {
        id: "e2",
        name: "3rd Cavalry Squadron",
        type: "cavalry",
        owner: "enemy",
        location: { x: 750, y: 150 },
        q: 10, r: -1, // Hex Override (North-East, Alsace)
        semanticPos: { regionId: "region-1", type: "centroid" },
        tags: ["Mobile", "Scouting"],
        visibility: 50,
        status: "fresh",
      },
    ],
    options: [
      {
        id: "opt_1",
        title: "Flank Left",
        description: "Send armor through the forest to encircle enemy positions.",
        semanticAction: "FLANK_LEFT",
        requiredUnitTypes: ["armor", "cavalry"],
      },
      {
        id: "opt_2",
        title: "Frontal Assault",
        description: "Direct charge across the river crossing.",
        semanticAction: "ASSAULT",
        requiredUnitTypes: ["infantry", "armor"],
      },
      {
        id: "opt_3",
        title: "Encirclement",
        description: "Coordinate left and right flanks to trap enemy forces.",
        semanticAction: "ENCIRCLE",
        requiredUnitTypes: ["armor", "cavalry"],
      },
    ],
  },

  napoleonic_austerlitz: {
    id: "napoleonic_austerlitz",
    name: "Austerlitz: The Three Emperors",
    era: "Napoleonic",
    playerPolity: "France",
    enemyPolity: "Austria & Russia",
    mapDimensions: {
      width: 800,
      height: 500,
    },
    mapRegions: [
      {
        id: "nord-1",
        name: "Pratzen Heights",
        points: [
          [400, 100],
          [550, 120],
          [570, 250],
          [480, 280],
          [350, 200],
        ],
        neighbors: ["nord-2", "nord-3"],
        terrain: "plains",
        isFort: true,
      },
      {
        id: "nord-2",
        name: "Goldbach Stream",
        points: [
          [300, 200],
          [400, 100],
          [450, 150],
          [380, 280],
        ],
        neighbors: ["nord-1"],
        terrain: "river",
      },
      {
        id: "nord-3",
        name: "Bosenitz Village",
        points: [
          [550, 280],
          [680, 300],
          [700, 420],
          [580, 430],
        ],
        neighbors: ["nord-1"],
        terrain: "urban",
        isCity: true,
      },
    ],
    units: [
      {
        id: "n_u1",
        name: "I Corps (Napoleon)",
        type: "infantry",
        owner: "player",
        location: { x: 350, y: 350 },
        semanticPos: { regionId: "nord-2", type: "sector", targetId: "south" },
        tags: ["Commander", "Reserve"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "n_u2",
        name: "II Cavalry Corps",
        type: "cavalry",
        owner: "player",
        location: { x: 320, y: 280 },
        semanticPos: { regionId: "nord-2", type: "sector", targetId: "west" },
        tags: ["Fast", "Reconnaissance"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "n_e1",
        name: "Austrian Center",
        type: "infantry",
        owner: "enemy",
        location: { x: 480, y: 180 },
        semanticPos: { regionId: "nord-1", type: "centroid" },
        tags: ["Entrenched", "Superior Numbers"],
        visibility: 100,
        status: "engaged",
      },
      {
        id: "n_e2",
        name: "Russian Right Flank",
        type: "infantry",
        owner: "enemy",
        location: { x: 650, y: 320 },
        semanticPos: { regionId: "nord-3", type: "centroid" },
        tags: ["Mobile", "Reinforcements"],
        visibility: 80,
        status: "fresh",
      },
    ],
    options: [
      {
        id: "nopt_1",
        title: "Breakthrough Center",
        description: "Pierce the Austrian center at Pratzen Heights—the decisive point.",
        semanticAction: "SPEARHEAD",
        requiredUnitTypes: ["infantry", "armor"],
      },
      {
        id: "nopt_2",
        title: "Feint Right Flank",
        description: "Attack the Russian right to draw reserves, then exploit the center.",
        semanticAction: "FEINT",
        requiredUnitTypes: ["cavalry", "infantry"],
      },
      {
        id: "nopt_3",
        title: "Supply Interdiction",
        description: "Cut the coalition's supply lines before they regroup.",
        semanticAction: "SEVER_SUPPLY",
        requiredUnitTypes: ["cavalry"],
      },
      {
        id: "nopt_4",
        title: "Cavalry Charge",
        description: "Massed cavalry assault to shatter enemy morale.",
        semanticAction: "ASSAULT",
        requiredUnitTypes: ["cavalry"],
      },
    ],
  },

  medieval_siege: {
    id: "medieval_siege",
    name: "Castle Siege: The Breach",
    era: "Medieval",
    playerPolity: "The Crown",
    enemyPolity: "Rebel Lords",
    mapDimensions: {
      width: 800,
      height: 500,
    },
    mapRegions: [
      {
        id: "med-1",
        name: "Castle Walls",
        points: [
          [550, 150],
          [700, 160],
          [710, 350],
          [560, 360],
        ],
        neighbors: ["med-2"],
        terrain: "urban",
        isFort: true,
        isCity: true,
      },
      {
        id: "med-2",
        name: "Siege Camps",
        points: [
          [200, 100],
          [500, 120],
          [550, 150],
          [280, 180],
        ],
        neighbors: ["med-1", "med-3"],
        terrain: "plains",
      },
      {
        id: "med-3",
        name: "Forest Approach",
        points: [
          [100, 300],
          [400, 280],
          [450, 400],
          [200, 420],
        ],
        neighbors: ["med-2"],
        terrain: "forest",
      },
    ],
    units: [
      {
        id: "med_u1",
        name: "Pike & Shot Company",
        type: "infantry",
        owner: "player",
        location: { x: 350, y: 300 },
        semanticPos: { regionId: "med-2", type: "centroid" },
        tags: ["Siege Engineers", "Heavy"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "med_u2",
        name: "Siege Artillery",
        type: "artillery",
        owner: "player",
        location: { x: 300, y: 200 },
        semanticPos: { regionId: "med-2", type: "sector", targetId: "west" },
        tags: ["Cannons", "Slow"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "med_e1",
        name: "Castle Garrison",
        type: "infantry",
        owner: "enemy",
        location: { x: 630, y: 250 },
        semanticPos: { regionId: "med-1", type: "centroid" },
        tags: ["Fortified", "Outnumbered"],
        visibility: 100,
        status: "wavering",
      },
      {
        id: "med_e2",
        name: "Relief Force (Forest)",
        type: "cavalry",
        owner: "enemy",
        location: { x: 250, y: 350 },
        semanticPos: { regionId: "med-3", type: "centroid" },
        tags: ["Hidden", "Fast"],
        visibility: 30,
        status: "fresh",
      },
    ],
    options: [
      {
        id: "medopt_1",
        title: "Bombard Walls",
        description: "Focus artillery on the eastern wall to breach defenses.",
        semanticAction: "BOMBARD",
        requiredUnitTypes: ["artillery"],
      },
      {
        id: "medopt_2",
        title: "Fortify Siege Lines",
        description: "Entrench to prepare for relief force—strong defense.",
        semanticAction: "FORTIFY",
        requiredUnitTypes: ["infantry"],
      },
      {
        id: "medopt_3",
        title: "Infiltrate Supply",
        description: "Send scouts to poison or cut off the castle's water supply.",
        semanticAction: "INFILTRATE",
        requiredUnitTypes: ["cavalry"],
      },
      {
        id: "medopt_4",
        title: "Night Raid",
        description: "Attack under cover of darkness to demoralize defenders.",
        semanticAction: "AMBUSH",
        requiredUnitTypes: ["infantry", "cavalry"],
      },
      {
        id: "medopt_5",
        title: "Suppress Garrison",
        description: "Sustained gunfire to suppress counterattacks.",
        semanticAction: "SUPPRESS",
        requiredUnitTypes: ["infantry", "artillery"],
      },
    ],
  },
}

export const MOCK_SCENARIO = SCENARIOS.ww2_blitzkrieg
