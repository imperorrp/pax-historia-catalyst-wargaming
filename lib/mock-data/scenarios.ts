import type { WarRoomScenario } from "../types"

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
        id: "region-1", // Alsace (East/Right)
        name: "Alsace",
        points: [
          [400, 0], [420, 100], [380, 200], [410, 300], [390, 400], [400, 600], // Border (River)
          [800, 600], [800, 0] // East bound
        ],
        neighbors: ["region-2"],
        terrain: "forest",
        isCity: false,
      },
      {
        id: "region-2", // Lorraine (West/Left)
        name: "Lorraine",
        points: [
          [0, 0], 
          [400, 0], [420, 100], [380, 200], [410, 300], [390, 400], [400, 600], // Border (River)
          [0, 600] // West bound
        ], 
        neighbors: ["region-1"],
        terrain: "plains",
        features: [
           {
            id: "river_rhine",
            type: "river",
            location: { regionId: "region-2", tag: "center" } 
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
        placement: { regionId: "region-2", tag: "front_line" },
        tags: ["Elite", "High Mobility"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "u2",
        name: "5th Infantry Corps",
        type: "infantry",
        owner: "player",
        placement: { regionId: "region-2", tag: "center" },
        tags: ["Reinforced", "Supply Train"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "e1",
        name: "7th Infantry Division",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "region-1", tag: "front_line" },
        tags: ["Entrenched", "Low Ammo"],
        visibility: 75,
        status: "engaged",
      },
      {
        id: "e2",
        name: "3rd Cavalry Squadron",
        type: "cavalry",
        owner: "enemy",
        placement: { regionId: "region-1", tag: "flank_right" }, 
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
  
  // Minimal placeholder for second scenario to fix errors
  napoleonic_austerlitz: {
    id: "napoleonic_austerlitz",
    name: "Austerlitz: The Three Emperors",
    era: "Napoleonic",
    playerPolity: "France",
    enemyPolity: "Austria & Russia",
    mapDimensions: { width: 800, height: 600 },
    mapRegions: [],
    units: [],
    options: []
  }
}
