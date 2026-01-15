import type { WarRoomScenario, RegionLayoutDef } from "../../types"
import { generatePaintedMap } from "../../grid-engine/map-painter"

// PAINTER'S ALGORITHM LAYOUT FOR AUSTERLITZ (Scale: Battlefield - Stream as Decoration)
const AUSTERLITZ_LAYOUT: RegionLayoutDef[] = [
    { id: "pratzen-heights", name: "Pratzen Heights", type: "blob", terrain: "mountain", seeds: 1, influence: 200, points: [[750, 300]] },
    { id: "aust-plains", name: "Austerlitz Plains", type: "blob", terrain: "plains", seeds: 1, influence: 250, points: [[400, 300]] },
    { id: "bosenitz-village", name: "Bosenitz", type: "point", terrain: "urban", seeds: 1, influence: 60, points: [[300, 400]] },
    { id: "aust-forest", name: "Santon Hill & Forest", type: "blob", terrain: "forest", seeds: 1, influence: 120, points: [[200, 200]] }
];

export const austerlitz: WarRoomScenario = {
    id: "napoleonic_austerlitz",
    name: "Austerlitz: The Three Emperors",
    era: "Napoleonic",
    playerPolity: "France",
    enemyPolity: "Austria & Russia",
    mapDimensions: {
      width: 1000,
      height: 600,
    },
    mapRegions: generatePaintedMap(AUSTERLITZ_LAYOUT, 1000, 600),
    layoutDefs: AUSTERLITZ_LAYOUT,
    decorations: [
      {
         id: "goldbach-deco",
         type: "river",
         points: [[420, 100], [500, 250], [620, 400], [700, 550]],
         color: "rgba(41, 128, 185, 0.5)",
         width: 2 // Thin stream
      }
    ],
    units: [
      {
        id: "n_u1",
        name: "I Corps (Napoleon)",
        type: "infantry",
        owner: "player",
        placement: { regionId: "aust-plains", tag: "center" },
        tags: ["Commander", "Reserve", "Imperial Guard"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "n_u2",
        name: "II Cavalry Corps",
        type: "cavalry",
        owner: "player",
        placement: { regionId: "aust-forest", tag: "flank_left" },
        tags: ["Fast", "Reconnaissance", "Cuirassiers"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "n_u3",
        name: "IV Corps Artillery",
        type: "artillery",
        owner: "player",
        placement: { regionId: "aust-plains", tag: "rear" },
        tags: ["Horse Artillery", "Mobile"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "n_u4",
        name: "III Corps",
        type: "infantry",
        owner: "player",
        placement: { regionId: "bosenitz-village", tag: "front_line" },
        tags: ["Veterans", "Flanking Force"],
        visibility: 90,
        status: "fresh",
      },
      {
        id: "n_u5",
        name: "Guard Cavalry",
        type: "cavalry",
        owner: "player",
        placement: { regionId: "aust-plains", tag: "flank_right" },
        tags: ["Elite", "Shock", "Reserve"],
        visibility: 95,
        status: "fresh",
      },
      {
        id: "n_u6",
        name: "V Corps (Lannes)",
        type: "infantry",
        owner: "player",
        placement: { regionId: "aust-plains", tag: "flank_left" },
        tags: ["Veterans", "Diversion", "Mobile"],
        visibility: 100,
        status: "fresh",
      },
      {
        id: "n_e1",
        name: "Austrian Center",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "pratzen-heights", tag: "center" },
        tags: ["Entrenched", "Superior Numbers", "Grenadiers"],
        visibility: 100,
        status: "engaged",
      },
      {
        id: "n_e2",
        name: "Russian Right Flank",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "aust-plains", tag: "flank_right" },
        tags: ["Mobile", "Reinforcements", "Musketeers"],
        visibility: 80,
        status: "fresh",
      },
      {
        id: "n_e3",
        name: "Russian Artillery",
        type: "artillery",
        owner: "enemy",
        placement: { regionId: "pratzen-heights", tag: "rear" },
        tags: ["Heavy Guns", "Positioned"],
        visibility: 90,
        status: "engaged",
      },
      {
        id: "n_e4",
        name: "Austrian Reserves",
        type: "infantry",
        owner: "enemy",
        placement: { regionId: "bosenitz-village", tag: "rear" },
        tags: ["Reserve", "Low Morale"],
        visibility: 70,
        status: "wavering",
      },
    ],
    options: [
      {
        id: "nopt_main",
        title: "Pratzen Masterstroke",
        description: "The decisive assault: artillery barrage followed by infantry spearhead at the heights.",
        compositeActions: [
           { semanticAction: "BOMBARD", targetLogic: "specific_region", targetRegionId: "pratzen-heights", requiredUnitTypes: ["artillery"], description: "Concentrate artillery on the heights" },
           { semanticAction: "SPEARHEAD", targetLogic: "specific_region", targetRegionId: "pratzen-heights", requiredUnitTypes: ["infantry"], description: "Pierce the Austrian center" }
        ],
        visualEffects: ["explosion", "smoke"]
      },
      {
         id: "nopt_feint",
         title: "Feint & Encircle",
         description: "Attack the Russian right to draw reserves, then encircle with cavalry shock.",
         compositeActions: [
           { semanticAction: "FEINT", targetLogic: "flank_right", requiredUnitTypes: ["infantry"], description: "Draw enemy reserves to the right" },
           { semanticAction: "ENCIRCLE", targetLogic: "center_mass", requiredUnitTypes: ["cavalry"], description: "Cavalry encirclement to shatter morale" }
         ]
      },
      {
         id: "nopt_combined",
         title: "Combined Arms Sequence",
         description: "Coordinate artillery, cavalry, and infantry in devastating sequence.",
         compositeActions: [
            { semanticAction: "BOMBARD", targetLogic: "center_mass", requiredUnitTypes: ["artillery"], description: "Artillery preparation" },
            { semanticAction: "ENCIRCLE", targetLogic: "center_mass", requiredUnitTypes: ["cavalry"], description: "Cavalry encirclement" },
            { semanticAction: "ADVANCE", targetLogic: "center_mass", requiredUnitTypes: ["infantry"], description: "Infantry exploitation" }
         ]
      },
      {
         id: "nopt_heights",
         title: "Heights Bombardment",
         description: "Concentrate artillery fire on Pratzen Heights with visual barrage effects.",
         compositeActions: [
            { semanticAction: "REGION_BOMBARDMENT", targetLogic: "specific_region", targetRegionId: "pratzen-heights", requiredUnitTypes: ["artillery"], description: "Concentrate fire" }
         ],
         visualEffects: ["explosion", "smoke", "cannon_fire"]
      }
    ]
  }