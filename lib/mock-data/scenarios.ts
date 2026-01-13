import type { WarRoomScenario } from "../types"

export const SCENARIOS: Record<string, WarRoomScenario> = {
  ww2_blitzkrieg: {
    id: "ww2_blitzkrieg",
    name: "Blitzkrieg: France 1940",
    era: "WW2",
    playerPolity: "Germany",
    enemyPolity: "France",
    mapDimensions: {
      width: 900,
      height: 700,
    },
    mapRegions: [
      {
        id: "region-1", // Ardennes Forest (East/South)
        name: "Ardennes Forest",
        points: [
          [450, 0], [500, 50], [550, 100], [600, 150], [650, 200], [700, 250], [750, 300], [800, 350], [850, 400], [900, 450],
          [900, 700], [800, 700], [700, 650], [600, 600], [500, 550], [450, 500], [400, 450], [350, 400], [300, 350], [250, 300], [200, 250], [150, 200], [100, 150], [50, 100], [0, 50], [0, 0]
        ],
        gridScale: 35,
        neighbors: ["region-2", "region-3"],
        terrain: "forest",
        isCity: false,
      },
      {
        id: "region-2", // Sedan Plains (West/Center)
        name: "Sedan Plains",
        points: [
          [0, 50], [100, 150], [200, 250], [300, 350], [350, 400], [400, 450], [450, 500], [500, 550], [450, 600], [400, 650], [350, 700],
          [0, 700], [0, 400], [50, 350], [100, 300], [150, 250], [200, 200], [250, 150], [300, 100], [350, 50], [400, 0], [450, 0]
        ],
        gridScale: 35,
        neighbors: ["region-1", "region-3"],
        terrain: "plains",
        features: [
          {
            id: "meuse_river",
            type: "river",
            location: { regionId: "region-2", tag: "center" }
          },
          {
            id: "sedan_bridge",
            type: "bridge",
            location: { regionId: "region-2", tag: "center" }
          }
        ]
      },
      {
        id: "region-3", // Maginot Line (South)
        name: "Maginot Defenses",
        points: [
          [450, 500], [500, 550], [550, 600], [600, 650], [650, 700], [700, 700], [750, 650], [800, 600], [850, 550], [900, 500], [900, 700],
          [800, 700], [750, 700], [700, 700], [650, 700], [600, 700], [550, 700], [500, 700], [450, 700], [400, 700], [350, 700], [300, 700], [250, 700], [200, 700], [150, 700], [100, 700], [50, 700], [0, 700]
        ],
        gridScale: 35,
        neighbors: ["region-1", "region-2"],
        terrain: "urban",
        isFort: true,
        features: [
          {
            id: "maginot_bunkers",
            type: "fortification",
            location: { regionId: "region-3", tag: "center" }
          }
        ]
      },
    ],
    units: [
      {
        id: "u1",
        name: "7th Panzer Division",
        type: "armor",
        owner: "player",
        placement: { regionId: "region-2", tag: "front_line" },
        tags: ["Elite", "High Mobility", "Panzer"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "u2",
        name: "1st Infantry Division",
        type: "infantry",
        owner: "player",
        placement: { regionId: "region-2", tag: "center" },
        tags: ["Motorized", "Supply Train"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "u3",
        name: "8th Flak Regiment",
        type: "artillery",
        owner: "player",
        placement: { regionId: "region-2", tag: "rear" },
        tags: ["Anti-Air", "Heavy"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "e1",
        name: "55th Infantry Division",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "region-3", tag: "front_line" },
        tags: ["Entrenched", "Low Ammo", "Maginot"],
        visibility: 75,
        status: "engaged",
      },
      {
        id: "e2",
        name: "1st Cavalry Division",
        type: "cavalry",
        owner: "enemy",
        placement: { regionId: "region-1", tag: "flank_right" },
        tags: ["Mobile", "Scouting", "Reserve"],
        visibility: 50,
        status: "fresh",
      },
      {
        id: "e3",
        name: "71st Artillery Regiment",
        type: "artillery",
        owner: "enemy",
        placement: { regionId: "region-3", tag: "center" },
        tags: ["Fortress Guns", "Heavy"],
        visibility: 80,
        status: "engaged",
      },
    ],
    options: [
      {
        id: "opt_1",
        title: "Forest Flanking",
        description: "Send armor through the dense Ardennes forest to surprise the Maginot Line.",
        semanticAction: "FLANK_LEFT",
        requiredUnitTypes: ["armor", "cavalry"],
      },
      {
        id: "opt_2",
        title: "River Crossing",
        description: "Direct assault across the Meuse River at Sedan.",
        semanticAction: "ASSAULT",
        requiredUnitTypes: ["infantry", "armor"],
      },
      {
        id: "opt_3",
        title: "Fortress Bombardment",
        description: "Concentrate artillery on the Maginot bunkers before infantry assault.",
        semanticAction: "BOMBARD",
        requiredUnitTypes: ["artillery"],
      },
      {
        id: "opt_4",
        title: "Combined Arms Push",
        description: "Coordinate armor, infantry, and artillery for a breakthrough.",
        semanticAction: "SPEARHEAD",
        requiredUnitTypes: ["armor", "infantry", "artillery"],
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
      width: 1000,
      height: 600,
    },
    mapRegions: [
      {
        id: "nord-1",
        name: "Pratzen Heights",
        points: [
          [500, 150], [600, 180], [650, 220], [700, 260], [750, 300], [780, 350], [800, 400], [820, 450], [850, 500], [900, 550], [950, 600],
          [1000, 600], [1000, 400], [950, 350], [900, 300], [850, 250], [800, 200], [750, 150], [700, 120], [650, 100], [600, 80], [550, 60], [500, 40], [450, 20], [400, 0], [350, 0], [300, 50], [250, 100], [200, 150], [150, 200], [100, 250], [50, 300], [0, 350], [0, 600], [100, 600], [200, 600], [300, 600], [400, 600], [500, 600]
        ],
        neighbors: ["nord-2", "nord-3", "nord-4"],
        terrain: "hills",
        isFort: true,
      },
      {
        id: "nord-2",
        name: "Goldbach Stream",
        points: [
          [0, 350], [50, 300], [100, 250], [150, 200], [200, 150], [250, 100], [300, 50], [350, 0], [400, 0], [450, 20], [500, 40], [550, 60], [600, 80], [650, 100], [700, 120], [750, 150], [800, 200], [850, 250], [900, 300], [950, 350], [1000, 400], [1000, 600], [950, 600], [900, 600], [850, 600], [800, 600], [750, 600], [700, 600], [650, 600], [600, 600], [550, 600], [500, 600], [450, 600], [400, 600], [350, 600], [300, 600], [250, 600], [200, 600], [150, 600], [100, 600], [50, 600], [0, 600]
        ],
        neighbors: ["nord-1", "nord-3"],
        terrain: "river",
      },
      {
        id: "nord-3",
        name: "Bosenitz Village",
        points: [
          [750, 150], [800, 200], [850, 250], [900, 300], [950, 350], [1000, 400], [1000, 500], [950, 450], [900, 400], [850, 350], [800, 300], [750, 250], [700, 200], [650, 150], [600, 100], [550, 50], [500, 0], [450, 0], [400, 50], [350, 100], [300, 150], [250, 200], [200, 250], [150, 300], [100, 350], [50, 400], [0, 450], [0, 600], [50, 600], [100, 600], [150, 600], [200, 600], [250, 600], [300, 600], [350, 600], [400, 600], [450, 600], [500, 600], [550, 600], [600, 600], [650, 600], [700, 600], [750, 600], [800, 600], [850, 600], [900, 600], [950, 600], [1000, 600]
        ],
        neighbors: ["nord-1", "nord-2"],
        terrain: "urban",
        isCity: true,
      },
      {
        id: "nord-4",
        name: "Sokolnitz Heights",
        points: [
          [400, 0], [450, 0], [500, 0], [550, 50], [600, 100], [650, 150], [700, 200], [750, 250], [800, 300], [850, 350], [900, 400], [950, 450], [1000, 500], [1000, 600], [950, 600], [900, 600], [850, 600], [800, 600], [750, 600], [700, 600], [650, 600], [600, 600], [550, 600], [500, 600], [450, 600], [400, 600], [350, 600], [300, 600], [250, 600], [200, 600], [150, 600], [100, 600], [50, 600], [0, 600], [0, 450], [50, 400], [100, 350], [150, 300], [200, 250], [250, 200], [300, 150], [350, 100], [400, 50]
        ],
        neighbors: ["nord-1", "nord-2"],
        terrain: "hills",
        features: [
          {
            id: "sokolnitz_pond",
            type: "pond",
            location: { regionId: "nord-4", tag: "center" }
          }
        ]
      },
    ],
    units: [
      {
        id: "n_u1",
        name: "I Corps (Napoleon)",
        type: "infantry",
        owner: "player",
        placement: { regionId: "nord-2", tag: "center" },
        tags: ["Commander", "Reserve", "Imperial Guard"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "n_u2",
        name: "II Cavalry Corps",
        type: "cavalry",
        owner: "player",
        placement: { regionId: "nord-2", tag: "flank_left" },
        tags: ["Fast", "Reconnaissance", "Cuirassiers"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "n_u3",
        name: "IV Corps Artillery",
        type: "artillery",
        owner: "player",
        placement: { regionId: "nord-4", tag: "rear" },
        tags: ["Horse Artillery", "Mobile"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "n_e1",
        name: "Austrian Center",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "nord-1", tag: "center" },
        tags: ["Entrenched", "Superior Numbers", "Grenadiers"],
        visibility: 100,
        status: "engaged",
      },
      {
        id: "n_e2",
        name: "Russian Right Flank",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "nord-3", tag: "center" },
        tags: ["Mobile", "Reinforcements", "Musketeers"],
        visibility: 80,
        status: "fresh",
      },
      {
        id: "n_e3",
        name: "Russian Artillery",
        type: "artillery",
        owner: "enemy",
        placement: { regionId: "nord-1", tag: "rear" },
        tags: ["Heavy Guns", "Positioned"],
        visibility: 90,
        status: "engaged",
      },
    ],
    options: [
      {
        id: "nopt_1",
        title: "Pratzen Assault",
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
      {
        id: "nopt_5",
        title: "Artillery Bombardment",
        description: "Concentrate artillery fire on enemy positions before attack.",
        semanticAction: "BOMBARD",
        requiredUnitTypes: ["artillery"],
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
      height: 600,
    },
    mapRegions: [
      {
        id: "med-1",
        name: "Castle Keep",
        points: [
          [600, 200], [650, 180], [700, 160], [750, 140], [800, 120], [800, 200], [780, 250], [760, 300], [740, 350], [720, 400], [700, 450], [680, 500], [660, 550], [640, 600],
          [600, 600], [580, 550], [560, 500], [540, 450], [520, 400], [500, 350], [480, 300], [460, 250], [440, 200], [420, 150], [400, 100], [380, 50], [360, 0], [400, 0], [450, 50], [500, 100], [550, 150], [600, 200]
        ],
        neighbors: ["med-2", "med-3"],
        terrain: "urban",
        isFort: true,
        isCity: true,
      },
      {
        id: "med-2",
        name: "Siege Camp",
        points: [
          [0, 400], [50, 380], [100, 360], [150, 340], [200, 320], [250, 300], [300, 280], [350, 260], [400, 240], [450, 220], [500, 200], [550, 180], [600, 160], [650, 140], [700, 120], [750, 100], [800, 80], [800, 150], [750, 170], [700, 190], [650, 210], [600, 230], [550, 250], [500, 270], [450, 290], [400, 310], [350, 330], [300, 350], [250, 370], [200, 390], [150, 410], [100, 430], [50, 450], [0, 470], [0, 600], [50, 600], [100, 600], [150, 600], [200, 600], [250, 600], [300, 600], [350, 600], [400, 600], [450, 600], [500, 600], [550, 600], [600, 600], [650, 600], [700, 600], [750, 600], [800, 600], [800, 400], [750, 380], [700, 360], [650, 340], [600, 320], [550, 300], [500, 280], [450, 260], [400, 240], [350, 220], [300, 200], [250, 180], [200, 160], [150, 140], [100, 120], [50, 100], [0, 80]
        ],
        neighbors: ["med-1", "med-3", "med-4"],
        terrain: "plains",
      },
      {
        id: "med-3",
        name: "Forest Approach",
        points: [
          [0, 80], [50, 100], [100, 120], [150, 140], [200, 160], [250, 180], [300, 200], [350, 220], [400, 240], [450, 260], [500, 280], [550, 300], [600, 320], [650, 340], [700, 360], [750, 380], [800, 400], [800, 600], [750, 600], [700, 600], [650, 600], [600, 600], [550, 600], [500, 600], [450, 600], [400, 600], [350, 600], [300, 600], [250, 600], [200, 600], [150, 600], [100, 600], [50, 600], [0, 600], [0, 470], [50, 450], [100, 430], [150, 410], [200, 390], [250, 370], [300, 350], [350, 330], [400, 310], [450, 290], [500, 270], [550, 250], [600, 230], [650, 210], [700, 190], [750, 170], [800, 150], [800, 80], [750, 60], [700, 40], [650, 20], [600, 0], [550, 0], [500, 0], [450, 0], [400, 0], [350, 0], [300, 0], [250, 0], [200, 0], [150, 0], [100, 0], [50, 0], [0, 0]
        ],
        neighbors: ["med-2", "med-4"],
        terrain: "forest",
      },
      {
        id: "med-4",
        name: "River Crossing",
        points: [
          [0, 0], [50, 0], [100, 0], [150, 0], [200, 0], [250, 0], [300, 0], [350, 0], [400, 0], [450, 0], [500, 0], [550, 0], [600, 0], [650, 20], [700, 40], [750, 60], [800, 80], [800, 150], [750, 170], [700, 190], [650, 210], [600, 230], [550, 250], [500, 270], [450, 290], [400, 310], [350, 330], [300, 350], [250, 370], [200, 390], [150, 410], [100, 430], [50, 450], [0, 470], [0, 80], [50, 60], [100, 40], [150, 20], [200, 0]
        ],
        neighbors: ["med-2", "med-3"],
        terrain: "river",
        features: [
          {
            id: "stone_bridge",
            type: "bridge",
            location: { regionId: "med-4", tag: "center" }
          }
        ]
      },
    ],
    units: [
      {
        id: "med_u1",
        name: "Royal Foot",
        type: "infantry",
        owner: "player",
        placement: { regionId: "med-2", tag: "center" },
        tags: ["Siege Engineers", "Heavy", "Longbows"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "med_u2",
        name: "Siege Artillery",
        type: "artillery",
        owner: "player",
        placement: { regionId: "med-2", tag: "flank_left" },
        tags: ["Cannons", "Slow", "Bombards"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "med_u3",
        name: "Knights",
        type: "cavalry",
        owner: "player",
        placement: { regionId: "med-3", tag: "flank_right" },
        tags: ["Heavy Cavalry", "Noble"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "med_e1",
        name: "Castle Garrison",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "med-1", tag: "center" },
        tags: ["Fortified", "Outnumbered", "Crossbows"],
        visibility: 100,
        status: "wavering",
      },
      {
        id: "med_e2",
        name: "Relief Force",
        type: "cavalry",
        owner: "enemy",
        placement: { regionId: "med-3", tag: "center" },
        tags: ["Hidden", "Fast", "Light Horse"],
        visibility: 30,
        status: "fresh",
      },
      {
        id: "med_e3",
        name: "Castle Artillery",
        type: "artillery",
        owner: "enemy",
        placement: { regionId: "med-1", tag: "rear" },
        tags: ["Ballistae", "Defensive"],
        visibility: 80,
        status: "engaged",
      },
    ],
    options: [
      {
        id: "medopt_1",
        title: "Wall Bombardment",
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
        title: "Supply Interdiction",
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
      {
        id: "medopt_6",
        title: "Bridge Control",
        description: "Secure the river crossing to prevent reinforcements.",
        semanticAction: "SEVER_SUPPLY",
        requiredUnitTypes: ["cavalry", "infantry"],
      },
    ],
  },
}

export const MOCK_SCENARIO = SCENARIOS.ww2_blitzkrieg
