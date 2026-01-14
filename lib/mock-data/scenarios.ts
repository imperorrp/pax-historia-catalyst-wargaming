import type { WarRoomScenario, RegionLayoutDef } from "../types"
import { generateVoronoiRegions, type SeedPoint } from "../grid-engine/voronoi-generator"
import { generatePaintedMap } from "../grid-engine/map-painter"

// Blitzkrieg Scenario Seeds
const BLITZKRIEG_SEEDS: SeedPoint[] = [
  // Ardennes Forest (East/South)
  { id: "region-1", x: 600, y: 350, terrain: "forest", name: "Ardennes Forest" },
  // Sedan Plains (West/Center)
  { id: "region-2", x: 250, y: 350, terrain: "plains", name: "Sedan Plains" },
  // Maginot Line (South)
  { id: "region-3", x: 600, y: 550, terrain: "urban", name: "Maginot Defenses" },
];

// Hydaspes Scenario Seeds (Revised)
const HYDASPES_SEEDS: SeedPoint[] = [
  // THE RIVER (The Spine) - Zig-zag to create a channel
  { id: "hyd-river-north", x: 450, y: 100, terrain: "river", name: "Jhelum Upstream" },
  { id: "hyd-river-mid", x: 500, y: 350, terrain: "river", name: "The Crossing" },
  { id: "hyd-river-south", x: 400, y: 600, terrain: "river", name: "Jhelum Downstream" },

  // MACEDONIAN SIDE (Left/West)
  { id: "hyd-west-camp", x: 200, y: 350, terrain: "plains", name: "Alexander's Camp" },
  { id: "hyd-west-hills", x: 150, y: 100, terrain: "mountain", name: "Rainy Hills" },
  
  // INDIAN SIDE (Right/East)
  { id: "hyd-east-mud", x: 650, y: 350, terrain: "mud", name: "Muddy Banks" }, // Buffer zone
  { id: "hyd-east-forest", x: 800, y: 350, terrain: "forest", name: "Elephant Corps" },
  { id: "hyd-east-plains", x: 800, y: 600, terrain: "plains", name: "Chariot Ground" }
];

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

// Austerlitz Scenario Seeds
const AUSTERLITZ_SEEDS: SeedPoint[] = [
  // THE HEIGHTS (Critical Strategic Point)
  { id: "aust-pratzen-heights", x: 700, y: 250, terrain: "mountain", name: "Pratzen Heights" },
  
  // GOLDBACH STREAM (Natural Barrier)
  { id: "aust-goldbach-north", x: 400, y: 150, terrain: "river", name: "Goldbach Stream" },
  { id: "aust-goldbach-mid", x: 350, y: 350, terrain: "river", name: "Goldbach Valley" },
  { id: "aust-goldbach-south", x: 300, y: 520, terrain: "river", name: "Goldbach Flats" },
  
  // FRENCH POSITIONS (Left/West)
  { id: "aust-french-center", x: 150, y: 300, terrain: "plains", name: "French Center" },
  { id: "aust-french-north", x: 200, y: 100, terrain: "plains", name: "French Left" },
  
  // VILLAGES & URBAN AREAS
  { id: "aust-bosenitz", x: 600, y: 450, terrain: "urban", name: "Bosenitz Village" },
  { id: "aust-sokolnitz", x: 500, y: 550, terrain: "urban", name: "Sokolnitz" },
  
  // ALLIED POSITIONS (Right/East)
  { id: "aust-allied-right", x: 900, y: 200, terrain: "plains", name: "Allied Right" },
  { id: "aust-allied-center", x: 850, y: 400, terrain: "plains", name: "Allied Center" }
];

// Medieval Siege Seeds
const MEDIEVAL_SIEGE_SEEDS: SeedPoint[] = [
  // THE FORTRESS (Keep as important structure)
  { id: "med-keep-central", x: 650, y: 250, terrain: "urban", name: "Castle Keep" },
  { id: "med-outer-wall", x: 550, y: 350, terrain: "urban", name: "Outer Walls" },
  
  // SIEGE POSITIONS
  { id: "med-siege-north", x: 300, y: 150, terrain: "plains", name: "North Siege Line" },
  { id: "med-siege-west", x: 200, y: 350, terrain: "plains", name: "Main Siege Camp" },
  { id: "med-siege-south", x: 300, y: 520, terrain: "plains", name: "South Batteries" },
  
  // APPROACH TERRAIN
  { id: "med-forest-cover", x: 100, y: 100, terrain: "forest", name: "Forest Approach" },
  { id: "med-river-cross", x: 450, y: 500, terrain: "river", name: "River Crossing" },
  
  // RELIEF ROUTES
  { id: "med-road-east", x: 700, y: 500, terrain: "plains", name: "Eastern Road" }
];

// Red Cliffs Seeds
const RED_CLIFFS_SEEDS: SeedPoint[] = [
  // THE GREAT RIVER (Yangtze)
  { id: "rc-river-west", x: 200, y: 350, terrain: "river", name: "Yangtze West" },
  { id: "rc-river-center", x: 500, y: 350, terrain: "river", name: "The Great River" },
  { id: "rc-river-east", x: 800, y: 350, terrain: "river", name: "Yangtze East" },
  
  // NORTHERN BANK (Cao Cao's Position)
  { id: "rc-north-west", x: 200, y: 150, terrain: "plains", name: "North Bank West" },
  { id: "rc-north-center", x: 500, y: 150, terrain: "plains", name: "Cao's Anchorage" },
  { id: "rc-north-east", x: 800, y: 150, terrain: "plains", name: "North Bank East" },
  
  // SOUTHERN BANK (Sun-Liu Alliance)
  { id: "rc-south-west", x: 200, y: 550, terrain: "mountain", name: "Red Cliffs" },
  { id: "rc-south-center", x: 500, y: 550, terrain: "mountain", name: "South Bank Camps" },
  { id: "rc-south-east", x: 800, y: 550, terrain: "mountain", name: "Eastern Heights" }
];

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
    mapRegions: generateVoronoiRegions(BLITZKRIEG_SEEDS, 900, 700, 2),
    rivers: [
      {
        id: "meuse_river",
        pathNodes: ["region-1", "region-2"], // Flows between Ardennes and Sedan
        width: 8,
        name: "Meuse River"
      }
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
    mapRegions: generateVoronoiRegions(AUSTERLITZ_SEEDS, 1000, 600, 2),
    rivers: [
      {
        id: "goldbach_stream",
        pathNodes: ["aust-goldbach-north", "aust-goldbach-mid", "aust-goldbach-south"],
        width: 6,
        name: "Goldbach Stream"
      }
    ],
    // KEEP OLD REGION DATA FOR REFERENCE BUT COMMENT OUT
    /* OLD POLYGON-BASED REGIONS:
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
    */
    units: [
      {
        id: "n_u1",
        name: "I Corps (Napoleon)",
        type: "infantry",
        owner: "player",
        placement: { regionId: "aust-french-center", tag: "center" },
        tags: ["Commander", "Reserve", "Imperial Guard"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "n_u2",
        name: "II Cavalry Corps",
        type: "cavalry",
        owner: "player",
        placement: { regionId: "aust-french-north", tag: "flank_left" },
        tags: ["Fast", "Reconnaissance", "Cuirassiers"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "n_u3",
        name: "IV Corps Artillery",
        type: "artillery",
        owner: "player",
        placement: { regionId: "aust-french-center", tag: "rear" },
        tags: ["Horse Artillery", "Mobile"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "n_e1",
        name: "Austrian Center",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "aust-pratzen-heights", tag: "center" },
        tags: ["Entrenched", "Superior Numbers", "Grenadiers"],
        visibility: 100,
        status: "engaged",
      },
      {
        id: "n_e2",
        name: "Russian Right Flank",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "aust-allied-right", tag: "center" },
        tags: ["Mobile", "Reinforcements", "Musketeers"],
        visibility: 80,
        status: "fresh",
      },
      {
        id: "n_e3",
        name: "Russian Artillery",
        type: "artillery",
        owner: "enemy",
        placement: { regionId: "aust-pratzen-heights", tag: "rear" },
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
        targetLogic: "specific_region",
        targetRegionId: "aust-pratzen-heights",
        requiredUnitTypes: ["infantry", "cavalry"],
      },
      {
        id: "nopt_2",
        title: "Feint & Exploit",
        description: "Attack the Russian right to draw reserves, then exploit the center—Napoleon's Masterstroke.",
        semanticAction: "FEINT",
        targetLogic: "flank_right",
        requiredUnitTypes: ["cavalry", "infantry"],
      },
      {
        id: "nopt_3",
        title: "Cavalry Encirclement",
        description: "Send cuirassiers to surround and shatter enemy morale with shock.",
        semanticAction: "ENCIRCLE",
        targetLogic: "center_mass",
        requiredUnitTypes: ["cavalry"],
      },
      {
        id: "nopt_4",
        title: "Artillery Preparation",
        description: "Concentrate horse artillery fire on enemy positions before infantry assault.",
        semanticAction: "BOMBARD",
        targetLogic: "specific_region",
        targetRegionId: "aust-pratzen-heights",
        requiredUnitTypes: ["artillery"],
      },
      {
        id: "nopt_5",
        title: "Combined Arms Breakthrough",
        description: "Coordinate artillery, cavalry, and infantry in devastating sequence.",
        semanticAction: "COMBINED_ASSAULT",
        targetLogic: "center_mass",
        requiredUnitTypes: ["artillery", "cavalry", "infantry"],
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
    mapRegions: generateVoronoiRegions(MEDIEVAL_SIEGE_SEEDS, 800, 600, 2),
    rivers: [
      {
        id: "castle_moat",
        pathNodes: ["med-river-cross", "med-outer-wall"],
        width: 8,
        name: "Moat & Stream"
      }
    ],
    /* OLD POLYGON-BASED REGIONS:
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
    */
    units: [
      {
        id: "med_u1",
        name: "Trebuchet Battery",
        type: "artillery",
        owner: "player",
        placement: { regionId: "med-siege-west", tag: "center" },
        tags: ["Siege Engine", "Heavy", "Slow Reload"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "med_u2",
        name: "Assault Infantry",
        type: "infantry",
        owner: "player",
        placement: { regionId: "med-siege-north", tag: "front_line" },
        tags: ["Scaling Ladders", "Siege Towers"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "med_u3",
        name: "Light Cavalry Scouts",
        type: "cavalry",
        owner: "player",
        placement: { regionId: "med-forest-cover", tag: "flank_left" },
        tags: ["Fast", "Scouting", "Harass"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "med_e1",
        name: "Castle Garrison",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "med-keep-central", tag: "center" },
        tags: ["Defending", "Fortified", "Low Morale"],
        visibility: 100,
        status: "wavering",
      },
      {
        id: "med_e2",
        name: "Relief Force",
        type: "cavalry",
        owner: "enemy",
        placement: { regionId: "med-road-east", tag: "center" },
        tags: ["Hidden", "Fast", "Light Horse"],
        visibility: 30,
        status: "fresh",
      },
      {
        id: "med_e3",
        name: "Castle Artillery",
        type: "artillery",
        owner: "enemy",
        placement: { regionId: "med-keep-central", tag: "rear" },
        tags: ["Ballistae", "Defensive"],
        visibility: 80,
        status: "engaged",
      },
    ],
    options: [
      {
        id: "medopt_1",
        title: "Systematic Bombardment",
        description: "Focus trebuchets on the eastern wall to create breach points.",
        semanticAction: "BOMBARD",
        targetLogic: "specific_region",
        targetRegionId: "med-outer-wall",
        requiredUnitTypes: ["artillery"],
      },
      {
        id: "medopt_2",
        title: "Fortify Siege Lines",
        description: "Entrench circumvallation to prepare for relief force.",
        semanticAction: "FORTIFY",
        requiredUnitTypes: ["infantry"],
      },
      {
        id: "medopt_3",
        title: "Night Infiltration",
        description: "Send scouts under darkness to poison wells and sow panic.",
        semanticAction: "INFILTRATE",
        targetLogic: "specific_region",
        targetRegionId: "med-keep-central",
        requiredUnitTypes: ["cavalry"],
      },
      {
        id: "medopt_4",
        title: "Escalade Assault",
        description: "Coordinate ladder teams and siege towers for synchronized wall breach.",
        semanticAction: "ASSAULT",
        targetLogic: "specific_region",
        targetRegionId: "med-outer-wall",
        requiredUnitTypes: ["infantry"],
      },
      {
        id: "medopt_5",
        title: "Suppressive Barrage",
        description: "Sustained trebuchet and crossbow fire to suppress defenders during assault.",
        semanticAction: "SUPPRESS",
        targetLogic: "specific_region",
        targetRegionId: "med-keep-central",
        requiredUnitTypes: ["infantry", "artillery"],
      },
      {
        id: "medopt_6",
        title: "Isolate the Castle",
        description: "Cavalry screen to intercept relief forces and secure river crossing.",
        semanticAction: "SEVER_SUPPLY",
        targetLogic: "specific_region",
        targetRegionId: "med-road-east",
        requiredUnitTypes: ["cavalry"],
      },
    ],
  },

  three_kingdoms_red_cliffs: {
    id: "three_kingdoms_red_cliffs",
    name: "Red Cliffs: 208 AD",
    era: "Ancient",
    playerPolity: "Sun-Liu Alliance",
    enemyPolity: "Cao Cao's Armada",
    mapDimensions: { width: 1000, height: 700 },
    mapRegions: generateVoronoiRegions(RED_CLIFFS_SEEDS, 1000, 700, 2),
    rivers: [
      {
        id: "yangtze_river",
        pathNodes: ["rc-river-west", "rc-river-center", "rc-river-east"],
        width: 15,
        name: "Yangtze River"
      }
    ],
    /* OLD POLYGON-BASED REGIONS:
    mapRegions: [
      {
        id: "rc-1", name: "Yangtze North Bank",
        points: [[0,0], [1000,0], [1000,250], [800,280], [600,260], [400,270], [200,250], [0,240]],
        neighbors: ["rc-2"], terrain: "plains", isFort: true
      },
      {
        id: "rc-2", name: "The Great River",
        points: [[0,240], [200,250], [400,270], [600,260], [800,280], [1000,250], [1000,550], [800,520], [600,540], [400,530], [200,550], [0,540]],
        neighbors: ["rc-1", "rc-3"], terrain: "river"
      },
      {
        id: "rc-3", name: "South Bank Camps",
        points: [[0,540], [200,550], [400,530], [600,540], [800,520], [1000,550], [1000,700], [0,700]],
        neighbors: ["rc-2"], terrain: "mountain"
      }
    ],
    */
    units: [
      {
        id: "tk_u1", name: "Zhou Yu's Fleet", type: "infantry", // Proxied as infantry for logic
        owner: "player", placement: { regionId: "rc-river-center", tag: "center" },
        tags: ["Warships", "Disciplined"], status: "fresh"
      },
      {
        id: "tk_u2", name: "Huang Gai's Fire Ships", type: "cavalry", // Fast units
        owner: "player", placement: { regionId: "rc-south-center", tag: "front_line" },
        tags: ["Incendiary", "Volatile", "False Defection"], status: "fresh"
      },
      {
        id: "tk_e1", name: "Iron Chain Armada", type: "armor", // Heavy, slow
        owner: "enemy", placement: { regionId: "rc-river-center", tag: "center" },
        tags: ["Chained Together", "Immobile", "Massive"], status: "fresh"
      },
      {
        id: "tk_e2", name: "Northern Cavalry", type: "cavalry",
        owner: "enemy", placement: { regionId: "rc-north-center", tag: "center" },
        tags: ["Seasick", "Disorganized"], status: "wavering"
      }
    ],
    options: [
      {
        id: "tk_opt_1", title: "The Fire Attack",
        description: "Launch fire ships into the chained enemy fleet using the Southeast wind—Zhou Yu's masterstroke.",
        semanticAction: "FIRE_SHIP",
        targetLogic: "center_mass",
        requiredUnitTypes: ["cavalry"]
      },
      {
        id: "tk_opt_2", title: "Naval Ram & Board",
        description: "Engage vanguard vessels in close combat to test their formation.",
        semanticAction: "NAVAL_RAM",
        targetLogic: "nearest",
        requiredUnitTypes: ["infantry"]
      },
      {
        id: "tk_opt_3", title: "Feint & Defection",
        description: "Huang Gai's false surrender to position fire ships—requires precise timing.",
        semanticAction: "FEINT",
        targetLogic: "center_mass",
        requiredUnitTypes: ["cavalry"]
      },
      {
        id: "tk_opt_4", title: "Shoreline Raid",
        description: "Raid the North Bank camps to disrupt supplies and morale.",
        semanticAction: "INFILTRATE",
        targetLogic: "specific_region",
        targetRegionId: "rc-north-center",
        requiredUnitTypes: ["cavalry"]
      }
    ]
  },

  ancient_india_hydaspes: {
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
        semanticAction: "ENCIRCLE",
        targetLogic: "rear",
        requiredUnitTypes: ["cavalry"]
      },
      {
        id: "hyd_opt_2", title: "Target the Elephants",
        description: "Order light infantry to rain arrows on the beasts to cause a stampede.",
        semanticAction: "RAIN_ARROWS",
        targetLogic: "nearest",
        requiredUnitTypes: ["infantry"]
      },
      {
        id: "hyd_opt_3", title: "Phalanx Advance",
        description: "Lock shields and push across the river banks.",
        semanticAction: "ADVANCE",
        targetLogic: "center_mass",
        requiredUnitTypes: ["infantry"]
      }
    ]
  },
}

export const MOCK_SCENARIO = SCENARIOS.ww2_blitzkrieg
