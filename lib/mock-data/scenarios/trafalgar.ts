import type { WarRoomScenario, RegionLayoutDef } from "../../types"
import { generatePaintedMap } from "../../grid-engine/map-painter"

// PAINTER'S ALGORITHM LAYOUT FOR TRAFALGAR (Scale: Naval Battle - Open Ocean)
const TRAFALGAR_LAYOUT: RegionLayoutDef[] = [
    // The Combined Fleet Layer - A long crescent line broken into segments
    // Northern Sector (Van)
    { id: "enemy-van", name: "Combined Fleet Van", type: "path", terrain: "water", seeds: 1, influence: 50, points: [[620, 50], [670, 150]] },
    // Center Sector (Command)
    { id: "enemy-center", name: "Combined Fleet Center", type: "path", terrain: "water", seeds: 2, influence: 50, points: [[670, 150], [690, 250], [680, 400]] },
    // Southern Sector (Rear)
    { id: "enemy-rear", name: "Combined Fleet Rear", type: "path", terrain: "water", seeds: 1, influence: 50, points: [[680, 400], [620, 550]] },
    
    // Nelson's Weather Column (North) - Angled attack vector towards Center/Van
    { id: "weather-column", name: "Weather Column", type: "path", terrain: "water", seeds: 1, influence: 40, points: [[100, 200], [300, 240], [500, 280]] },
    
    // Collingwood's Lee Column (South) - Angled attack vector towards Rear
    { id: "lee-column", name: "Lee Column", type: "path", terrain: "water", seeds: 1, influence: 40, points: [[100, 400], [300, 420], [500, 440]] },

    // Background Ocean - covers everything (Must be LAST to not overwrite specific zones)
    { id: "pixel-ocean", name: "Open Ocean", type: "blob", terrain: "ocean", seeds: 5, influence: 800, points: [[400, 300]] }
];

export const trafalgar: WarRoomScenario = {
    id: "napoleonic_trafalgar",
    name: "Trafalgar: Nelson's Triumph",
    era: "Napoleonic",
    playerPolity: "Britain",
    enemyPolity: "France & Spain",
    narrative_intro: `Atlantic Ocean, October 1805. The Napoleonic Wars rage across Europe, and the fate of empires is decided not only on land but on the high seas. Napoleon’s dreams of invasion hinge on breaking British naval supremacy, while the Royal Navy stands as the last bulwark against continental domination.

Off Cape Trafalgar, two great fleets converge in a contest of courage, innovation, and national destiny. The outcome will determine the course of the war, the security of the British Isles, and the future of global trade and empire. The wind, the waves, and the will of admirals will shape the world for generations to come.`,
    mapDimensions: {
      width: 800,
      height: 600,
    },
    mapRegions: generatePaintedMap(TRAFALGAR_LAYOUT, 800, 600),
    layoutDefs: TRAFALGAR_LAYOUT,
    decorations: [
      {
         id: "wind-direction",
         type: "symbol",
         points: [[100, 100]],
         label: "Wind: West-North-West",
         color: "rgba(255, 255, 255, 0.7)"
      },
      {
         id: "ocean-label",
         type: "label",
         points: [[700, 550]],
         label: "Atlantic Ocean",
         color: "rgba(52, 152, 219, 0.5)"
      }
    ],
    units: [
      // --- British Weather Column (Nelson - North) ---
      {
        id: "br_victory",
        name: "HMS Victory (Nelson)",
        type: "naval",
        owner: "player",
        placement: { regionId: "weather-column", tag: "front_line" }, // Leading
        tags: ["Flagship", "Commander", "100-guns"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "br_temeraire",
        name: "HMS Temeraire",
        type: "naval",
        owner: "player",
        placement: { regionId: "weather-column", tag: "center" },
        tags: ["98-guns", "Veteran"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "br_neptune",
        name: "HMS Neptune",
        type: "naval",
        owner: "player",
        placement: { regionId: "weather-column", tag: "rear" },
        tags: ["98-guns", "Slow"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "br_leviathan",
        name: "HMS Leviathan",
        type: "naval",
        owner: "player",
        placement: { regionId: "weather-column", tag: "rear" },
        tags: ["74-guns"],
        visibility: 95,
        status: "fresh",
      },
      {
        id: "br_conqueror",
        name: "HMS Conqueror",
        type: "naval",
        owner: "player",
        placement: { regionId: "weather-column", tag: "center" },
        tags: ["74-guns"],
        visibility: 95,
        status: "fresh",
      },
      {
        id: "br_britannia",
        name: "HMS Britannia",
        type: "naval",
        owner: "player",
        placement: { regionId: "weather-column", tag: "rear" },
        tags: ["100-guns", "Slow", "Heavy"],
        visibility: 90,
        status: "fresh",
      },

      // --- British Lee Column (Collingwood - South) ---
      {
        id: "br_royal_sovereign",
        name: "HMS Royal Sovereign",
        type: "naval",
        owner: "player",
        placement: { regionId: "lee-column", tag: "front_line" }, // Leading
        tags: ["Flagship (Lee)", "100-guns", "Fast"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "br_belleisle",
        name: "HMS Belleisle",
        type: "naval",
        owner: "player",
        placement: { regionId: "lee-column", tag: "center" },
        tags: ["74-guns", "Durable"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "br_mars",
        name: "HMS Mars",
        type: "naval",
        owner: "player",
        placement: { regionId: "lee-column", tag: "rear" },
        tags: ["74-guns", "Aggressive"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "br_tonnant",
        name: "HMS Tonnant",
        type: "naval",
        owner: "player",
        placement: { regionId: "lee-column", tag: "center" },
        tags: ["80-guns", "Powerful"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "br_bellerophon",
        name: "HMS Bellerophon",
        type: "naval",
        owner: "player",
        placement: { regionId: "lee-column", tag: "rear" },
        tags: ["74-guns", "Famous"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "br_colossus",
        name: "HMS Colossus",
        type: "naval",
        owner: "player",
        placement: { regionId: "lee-column", tag: "rear" },
        tags: ["74-guns"],
        visibility: 95,
        status: "fresh",
      },

      // --- Combined Fleet (France & Spain) ---
      
      // VAN (North)
      {
        id: "fr_formidable",
        name: "Formidable",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-van", tag: "front_line" },
        tags: ["80-guns", "Flagship (Van)"],
        visibility: 90,
        status: "fresh",
      },
      {
        id: "fr_duguay_trouin",
        name: "Duguay-Trouin",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-van", tag: "center" },
        tags: ["74-guns"],
        visibility: 90,
        status: "fresh",
      },
      {
        id: "fr_mont_blanc",
        name: "Mont-Blanc",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-van", tag: "rear" },
        tags: ["74-guns"],
        visibility: 90,
        status: "fresh",
      },
      {
        id: "sp_san_francisco",
        name: "San Francisco de Asis",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-van", tag: "flank_left" },
        tags: ["74-guns", "Spanish"],
        visibility: 90,
        status: "fresh",
      },

      // CENTER (Command)
      {
        id: "fr_bucentaure",
        name: "Bucentaure (Villeneuve)",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-center", tag: "center" }, 
        tags: ["Flagship", "80-guns", "Commander"],
        visibility: 100,
        status: "engaged",
      },
      {
        id: "sp_santip",
        name: "Santisima Trinidad",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-center", tag: "front_line" }, 
        tags: ["140-guns", "Massive", "Slow"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "fr_redoutable",
        name: "Redoutable",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-center", tag: "rear" }, 
        tags: ["74-guns", "Elite Crew"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "fr_neptune_fr",
        name: "Neptune (French)",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-center", tag: "flank_right" }, 
        tags: ["80-guns", "Strong"],
        visibility: 95,
        status: "fresh",
      },
      {
        id: "sp_san_justo",
        name: "San Justo",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-center", tag: "flank_left" }, 
        tags: ["74-guns", "Spanish"],
        visibility: 90,
        status: "fresh",
      },

      // REAR (South)
      {
        id: "sp_santa_ana",
        name: "Santa Ana",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-rear", tag: "front_line" },
        tags: ["112-guns", "Flagship (Alava)"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "fr_foudroyant",
        name: "Fougueux",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-rear", tag: "center" },
        tags: ["74-guns", "Aggressive"],
        visibility: 85,
        status: "fresh",
      },
      {
        id: "fr_indomptable",
        name: "Indomptable",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-rear", tag: "rear" },
        tags: ["80-guns"],
        visibility: 90,
        status: "fresh",
      },
      {
        id: "sp_principe",
        name: "Principe de Asturias",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-rear", tag: "flank_right" },
        tags: ["112-guns", "Flagship (Rear)"],
        visibility: 95,
        status: "fresh",
      },
      {
        id: "fr_aigle",
        name: "Aigle",
        type: "naval",
        owner: "enemy",
        placement: { regionId: "enemy-rear", tag: "flank_left" },
        tags: ["74-guns"],
        visibility: 90,
        status: "fresh",
      }
    ],
    options: [
      {
        id: "opt_nelson_touch",
        title: "The Nelson Touch (Break the Line)",
        description: "Abandon visual signaling. Drive straight at the enemy center to shatter their line and force a chaotic melee.",
        compositeActions: [
           { semanticAction: "ADVANCE", targetLogic: "center_mass", requiredUnitTypes: ["naval"], description: "Columns pierce the line" },
           { semanticAction: "BROADSIDES", targetLogic: "specific_unit", targetUnitId: "fr_bucentaure", requiredUnitTypes: ["naval"], description: "Raking fire on flagship" },
           { semanticAction: "REGION_ENCIRCLEMENT", targetLogic: "center_mass", requiredUnitTypes: ["naval"], description: "Isolate the center" }
        ],
        visualEffects: ["explosion", "smoke", "raking_fire"]
      },
      {
        id: "opt_pell_mell",
        title: "Pell-Mell (General Chase)",
        description: "Ship-to-ship action. Engage loosely and rely on superior British gunnery and seamanship.",
        compositeActions: [
           { semanticAction: "MANEUVER", targetLogic: "nearest", requiredUnitTypes: ["naval"], description: "Close to pistol range" },
           { semanticAction: "BOARDING", targetLogic: "nearest", requiredUnitTypes: ["naval"], description: "Board and capture" }
        ],
        visualEffects: ["boarding", "smoke"]
      },
      {
        id: "opt_conventional_line",
        title: "Form Line of Battle",
        description: "Revert to traditional tactics: form a parallel line to the enemy and trade broadsides.",
        compositeActions: [
           { semanticAction: "LINE_OF_BATTLE", targetLogic: "center_mass", requiredUnitTypes: ["naval"], description: "Form parallel line" },
           { semanticAction: "BROADSIDES", targetLogic: "center_mass", requiredUnitTypes: ["naval"], description: "Open broadsides along the line" }
        ],
        visualEffects: ["broadsides"]
      },
       {
        id: "opt_cut_rear",
        title: "Cut off the Rear",
        description: "Collingwood's column focuses entirely on overwhelming the enemy rear guard.",
        compositeActions: [
           { semanticAction: "ENCIRCLE", targetLogic: "flank_right", requiredUnitTypes: ["naval"], description: "Encircle the rear guard" },
           { semanticAction: "BROADSIDES", targetLogic: "flank_right", requiredUnitTypes: ["naval"], description: "Concentrate fire" }
        ],
        visualEffects: ["explosion", "raking_fire"]
      }
    ]
  }