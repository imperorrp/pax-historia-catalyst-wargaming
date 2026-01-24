import type { WarRoomScenario, RegionLayoutDef } from "../../types"
import { generatePaintedMap } from "../../grid-engine/map-painter"

// A massive, continent-spanning layout
const MAP_WIDTH = 2200;
const MAP_HEIGHT = 1600;

const EUROPE_LAYOUT: RegionLayoutDef[] = [
    // --- OCEANS ---
    { id: "atlantic_ocean", name: "Atlantic Ocean", type: "blob", terrain: "ocean", seeds: 1, influence: 600, points: [[200, 800]] },
    { id: "northern_sea", name: "Northern Sea", type: "blob", terrain: "ocean", seeds: 1, influence: 400, points: [[800, 200]] },
    { id: "southern_sea", name: "Southern Sea", type: "blob", terrain: "ocean", seeds: 1, influence: 400, points: [[1000, 1400]] },

    // --- WESTERN ALLIANCE (Blue) ---
    // The "Island Kingdom" & Coastal Allies
    { id: "west_island", name: "Albion Isles", type: "blob", terrain: "urban", seeds: 2, influence: 250, points: [[500, 400]], isCity: true },
    { id: "west_coast_north", name: "Normandy Coast", type: "path", terrain: "plains", seeds: 3, influence: 150, points: [[600, 600], [800, 550]] },
    { id: "west_heartland", name: "Gaulish Heartland", type: "blob", terrain: "plains", seeds: 4, influence: 300, points: [[700, 800], [850, 900], [750, 700]] },
    { id: "west_iberia", name: "Iberian Peninsula", type: "blob", terrain: "mountain", seeds: 3, influence: 280, points: [[400, 1100], [550, 1200]] },
    { id: "west_fortress", name: "Maginot Line", type: "path", terrain: "mountain", seeds: 6, influence: 80, points: [[900, 600], [950, 900]], isFort: true },

    // --- NEUTRAL / CONTESTED BUFFER (Grey) ---
    { id: "low_countries", name: "Low Lands", type: "blob", terrain: "swamp", seeds: 2, influence: 120, points: [[950, 450]] },
    { id: "central_alps", name: "Alpine Republics", type: "blob", terrain: "mountain", seeds: 3, influence: 180, points: [[1100, 1000], [1200, 1050]] },
    { id: "balkan_states", name: "Balkan States", type: "path", terrain: "mountain", seeds: 4, influence: 200, points: [[1400, 1200], [1500, 1350]] },
    { id: "nordic_neutrals", name: "Nordic Neutrals", type: "blob", terrain: "forest", seeds: 3, influence: 250, points: [[1200, 200], [1300, 300]] },

    // --- EASTERN PACT (Red) ---
    { id: "east_germania", name: "Iron Provinces", type: "blob", terrain: "urban", seeds: 4, influence: 250, points: [[1100, 600], [1200, 700]] },
    { id: "east_polania", name: "Vistula Plains", type: "blob", terrain: "plains", seeds: 3, influence: 300, points: [[1400, 600], [1500, 550]] },
    { id: "east_capital", name: "Red Citadel", type: "point", terrain: "urban", seeds: 1, influence: 150, points: [[1800, 500]], isCity: true },
    { id: "east_steppes_north", name: "Northern Steppes", type: "blob", terrain: "forest", seeds: 5, influence: 400, points: [[1700, 300], [1900, 200], [2000, 400]] },
    { id: "east_steppes_south", name: "Southern Wheatlands", type: "blob", terrain: "plains", seeds: 5, influence: 400, points: [[1700, 900], [1900, 1000], [2000, 800]] },
    { id: "east_caucasus", name: "Oil Fields", type: "path", terrain: "mountain", seeds: 2, influence: 180, points: [[2100, 1100], [2150, 1200]] },
];

export const grandStrategyEurope: WarRoomScenario = {
    id: "grand_strategy_europe",
    name: "The Continental War (194X)",
    narrative_intro: "The fragile peace has shattered. The Eastern Pact has massed enormous armor formations on the Vistula, threatening to sweep across the Central Plains. The Western Alliance digs in behind the Maginot Line, while their naval supremacy is challenged in the Northern Sea. You must coordinate Army Groups, managing the entire theater of war.",
    era: "WW2",
    scaleType: "grand_strategy",
    playerPolity: "Western Alliance",
    enemyPolity: "Eastern Pact",
    mapDimensions: { width: MAP_WIDTH, height: MAP_HEIGHT },
    
    // Pass the flag to the generator
    mapRegions: generatePaintedMap(EUROPE_LAYOUT, MAP_WIDTH, MAP_HEIGHT, 'grand_strategy'), 
    layoutDefs: EUROPE_LAYOUT,
    
    // --- UNITS: Grand Strategy Scale (Army Groups, Fleets) ---
    units: [
       // WESTERN ALLIANCE
       { id: "ag_north", name: "North Army Group", type: "infantry", owner: "player", placement: { regionId: "west_fortress", tag: "front_line" }, tags: ["Dug In", "Fortified"], status: "fresh" },
       { id: "ag_center", name: "Central Cmd", type: "armor", owner: "player", placement: { regionId: "west_heartland", tag: "center" }, tags: ["Reserve Armor"], status: "fresh" },
       { id: "exp_force", name: "Expeditionary Corps", type: "infantry", owner: "player", placement: { regionId: "west_coast_north", tag: "rear" }, tags: ["Mobile"], status: "fresh" },
       { id: "home_fleet", name: "Home Fleet", type: "naval", owner: "player", placement: { regionId: "northern_sea", tag: "center" }, tags: ["Carrier Group"], status: "fresh" },
       { id: "med_fleet", name: "Mediterranean Sqdn", type: "naval", owner: "player", placement: { regionId: "southern_sea", tag: "center" }, tags: ["Battleships"], status: "fresh" },

       // EASTERN PACT
       { id: "red_shock_1", name: "1st Shock Front", type: "armor", owner: "enemy", placement: { regionId: "east_germania", tag: "front_line" }, tags: ["Heavy Tanks"], status: "fresh" },
       { id: "red_guard_2", name: "2nd Guards Army", type: "infantry", owner: "enemy", placement: { regionId: "east_polania", tag: "center" }, tags: ["Mass Assault"], status: "fresh" },
       { id: "red_steppes", name: "Steppe Front", type: "cavalry", owner: "enemy", placement: { regionId: "east_steppes_south", tag: "flank_left" }, tags: ["Mechanized"], status: "fresh" },
       { id: "red_subs", name: "Wolfpack", type: "naval", owner: "enemy", placement: { regionId: "atlantic_ocean", tag: "center" }, tags: ["Submarines"], status: "fresh" },
    ],
    
    // --- OPTIONS: Grand Strategy Maneuvers ---
    options: [
       {
         id: "op_fortress_europe",
         title: "Operation: Iron Shield",
         description: "Dig in along the fortifications and focus on Air Superiority to bleed the enemy advance.",
         semanticAction: "FORTIFY",
         targetLogic: "specific_region",
         targetRegionId: "west_fortress",
         visualEffects: ["SMOKE"],
         compositeActions: [
             { semanticAction: "FORTIFY", targetRegionId: "west_fortress", description: "Reinforce lines" },
             { semanticAction: "AIRSTRIKE", targetLogic: "specific_region", targetRegionId: "east_germania", description: "Bombard staging grounds" }
         ]
       },
       {
         id: "op_overlord_counter",
         title: "Operation: Trident",
         description: "A daring amphibious counter-assault flanking the enemy position via the Northern Sea.",
         semanticAction: "ASSAULT",
         targetLogic: "flank_left",
         visualEffects: ["EXPLOSION", "MUD_SPLAT"],
         compositeActions: [
             { semanticAction: "MANEUVER", targetRegionId: "northern_sea", requiredUnitTypes: ["naval"], description: "Fleet establishes corridor" },
             { semanticAction: "FLANK_RIGHT", targetRegionId: "low_countries", requiredUnitTypes: ["infantry", "armor"], description: "Landings in Low Countries" },
             { semanticAction: "BOMBARD", targetLogic: "flank_right", requiredUnitTypes: ["naval"], description: "Coastal bombardment" }
         ]
       },
       {
         id: "op_deep_battle",
         title: "Operation: Deep Strike",
         description: "Launch a concentrated armored spearhead to punch through the center towards the Capital.",
         semanticAction: "SPEARHEAD",
         targetLogic: "center_mass",
         targetRegionId: "east_germania",
         visualEffects: ["DUST", "EXPLOSION"],
         compositeActions: [
             { semanticAction: "SPEARHEAD", targetLogic: "specific_region", targetRegionId: "east_germania", requiredUnitTypes: ["armor"] },
             { semanticAction: "SUPPRESS", targetLogic: "specific_region", targetRegionId: "east_polania", requiredUnitTypes: ["artillery", "naval"] }
         ]
       }
    ]
};
