import type { WarRoomScenario } from "@/lib/types"

export const RED_SILO_MARS: WarRoomScenario = {
  id: "red-silo-mars",
  name: "Red Silo at Chryse Ridge: Mars Resource Warfare",
  era: "Near-Future",
  narrative_intro: "A rare water-ice and regolith-processing silo sits at the base of a basalt ridge on Mars. A planetwide dust storm is rising—visibility is poor, comms are intermittent, and sensors are degraded. The defenders have fortified the silo and the ridge approaches; the attackers must seize the structure before the storm fully grounds drones and blinds long-range fire.",
  playerPolity: "Free Martian Prospectors (Assault Detachment)",
  enemyPolity: "Ares Consortium Security (Garrison)",
  
  mapDimensions: { width: 1000, height: 800 },
  
  layoutDefs: [
    {
      id: "chryse_ridge",
      name: "Chryse Ridge Escarpment",
      type: "blob",
      terrain: "mountain",
      seeds: 1,
      influence: 220,
      points: [[520, 170]]
    },
    {
      id: "silo_complex",
      name: "Resource Silo Complex",
      type: "blob",
      terrain: "urban",
      seeds: 1,
      influence: 160,
      points: [[520, 360]]
    },
    {
      id: "service_trench",
      name: "Service Trench & Buried Conduits",
      type: "path",
      terrain: "urban",
      seeds: 1,
      influence: 80,
      points: [[120, 620], [260, 560], [390, 500], [520, 430], [640, 390]]
    },
    {
      id: "dust_dunes_west",
      name: "Western Dust Dunes",
      type: "blob",
      terrain: "mud",
      seeds: 1,
      influence: 190,
      points: [[210, 430]]
    },
    {
      id: "east_gully",
      name: "Elysium Gully (Dry Channel)",
      type: "path",
      terrain: "river",
      seeds: 1,
      influence: 120,
      points: [[860, 120], [800, 260], [760, 370], [720, 520], [680, 700]]
    },
    {
      id: "culvert_bridge",
      name: "Culvert Bridge Crossing",
      type: "blob",
      terrain: "plains",
      seeds: 1,
      influence: 70,
      points: [[740, 455]]
    },
    {
      id: "south_approach_plain",
      name: "South Approach Plain",
      type: "blob",
      terrain: "plains",
      seeds: 1,
      influence: 240,
      points: [[520, 680]]
    },
    {
      id: "antenna_knoll",
      name: "Antenna Knoll",
      type: "blob",
      terrain: "mountain",
      seeds: 1,
      influence: 120,
      points: [[300, 250]]
    },
    {
      id: "storm_front",
      name: "Dust Storm Front",
      type: "noise",
      terrain: "mud",
      seeds: 1,
      influence: 200,
      points: [
        [120, 160], [240, 120], [360, 200], [520, 140], [700, 210], [880, 160],
        [920, 320], [820, 520], [640, 610], [420, 560], [260, 650], [140, 520]
      ]
    }
  ],
  
  mapRegions: [], // Will be hydrated by map-painter
  
  units: [
    {
      id: "p1_raiders",
      name: "Prospector Raiders (Pressurized Infantry)",
      type: "infantry",
      owner: "player",
      placement: { regionId: "south_approach_plain", tag: "center" },
      tags: ["Fresh", "Light"]
    },
    {
      id: "p2_mars_rovers",
      name: "Armed Rovers (Improvised Armor)",
      type: "armor",
      owner: "player",
      placement: { regionId: "south_approach_plain", tag: "front_line" },
      tags: ["Fresh", "Slow"]
    },
    {
      id: "p3_drone_team",
      name: "Scout Drone Operators",
      type: "infantry",
      owner: "player",
      placement: { regionId: "south_approach_plain", tag: "rear_guard" },
      tags: ["Fresh", "Stealth"]
    },
    {
      id: "p4_breacher_squad",
      name: "Hab-Breacher Squad",
      type: "infantry",
      owner: "player",
      placement: { regionId: "service_trench", tag: "flank_left" },
      tags: ["Fresh", "Elite"]
    },
    {
      id: "p5_mortar_cart",
      name: "Micromortar Cart",
      type: "artillery",
      owner: "player",
      placement: { regionId: "south_approach_plain", tag: "rear_guard" },
      tags: ["Fresh"]
    },
    {
      id: "e1_silo_garrison",
      name: "Ares Silo Garrison",
      type: "infantry",
      owner: "enemy",
      placement: { regionId: "silo_complex", tag: "center" },
      tags: ["Dug-in", "Shields", "Fresh"]
    },
    {
      id: "e2_ridge_watch",
      name: "Ridge Watch Platoon",
      type: "infantry",
      owner: "enemy",
      placement: { regionId: "chryse_ridge", tag: "front_line" },
      tags: ["High Ground", "Dug-in", "Fresh"]
    },
    {
      id: "e3_turret_section",
      name: "Perimeter Autoturret Section",
      type: "artillery",
      owner: "enemy",
      placement: { regionId: "silo_complex", tag: "front_line" },
      tags: ["Dug-in", "Suppressed"]
    },
    {
      id: "e4_quick_reaction_rover",
      name: "Quick-Reaction Rover Troop",
      type: "armor",
      owner: "enemy",
      placement: { regionId: "culvert_bridge", tag: "flank_right" },
      tags: ["Fresh", "Heavy Armor"]
    },
    {
      id: "e5_knoll_marksmen",
      name: "Knoll Marksmen Team",
      type: "infantry",
      owner: "enemy",
      placement: { regionId: "antenna_knoll", tag: "flank_left" },
      tags: ["High Ground", "Stealth", "Fresh"]
    }
  ],
  
  options: [
    {
      id: "opt1_trench_infiltration",
      title: "Trench Infiltration to the Silo",
      description: "Use the buried service trench to approach under cover and breach into the complex before defenders can concentrate fire through the dust.",
      compositeActions: [
        { semanticAction: "INFILTRATE", targetLogic: "specific_region", targetRegionId: "service_trench", targetUnitId: undefined, requiredUnitTypes: ["infantry"], description: "Move breachers and raiders through covered trench sections, using storm noise for concealment." },                                               
        { semanticAction: "ASSAULT", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: undefined, requiredUnitTypes: ["infantry"], description: "Breach into the silo yard and clear lanes between structures at close range." },
        { semanticAction: "FORTIFY", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: undefined, requiredUnitTypes: [], description: "Secure access points and lock down the comms mast and processing controls." }
      ],
      visualEffects: ["dust", "smoke"]
    },
    {
      id: "opt2_culvert_spearhead",
      title: "Culvert Spearhead (High Risk, Fast Capture)",
      description: "Drive the rovers hard across the culvert bridge to crack the perimeter quickly, accepting that the crossing is a predictable kill zone.",
      compositeActions: [
        { semanticAction: "SPEARHEAD", targetLogic: "specific_region", targetRegionId: "culvert_bridge", targetUnitId: undefined, requiredUnitTypes: ["armor"], description: "Punch across the narrow crossing before ridge fire can fully range in." },
        { semanticAction: "SUPPRESS", targetLogic: "specific_unit", targetRegionId: undefined, targetUnitId: "e2_ridge_watch", requiredUnitTypes: ["artillery", "infantry"], description: "Lay suppressive fire into ridge positions to reduce accurate shots during the crossing." },
        { semanticAction: "COMBINED_ASSAULT", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: undefined, requiredUnitTypes: ["armor", "infantry"], description: "Armor pins the yard while infantry clears buildings and disables turret control nodes." }
      ],
      visualEffects: ["dust", "explosions"]
    },
    {
      id: "opt3_west_dunes_flank",
      title: "Western Dunes Flank Under Storm Cover",
      description: "Exploit the dust drifts to mask a wide left hook. Slower for vehicles, but strong for infantry to emerge close to the silo perimeter.",
      compositeActions: [
        { semanticAction: "FLANK_LEFT", targetLogic: "specific_region", targetRegionId: "dust_dunes_west", targetUnitId: undefined, requiredUnitTypes: ["infantry"], description: "Move light infantry along the dunes to avoid ridge sightlines." },
        { semanticAction: "AMBUSH", targetLogic: "specific_region", targetRegionId: "dust_dunes_west", targetUnitId: undefined, requiredUnitTypes: ["infantry"], description: "Set an ambush for the enemy quick-reaction rover if it redeploys away from the culvert." },
        { semanticAction: "ASSAULT", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: undefined, requiredUnitTypes: ["infantry"], description: "Hit the western service doors and pipe-rack lanes, forcing the garrison to split." }
      ],
      visualEffects: ["dust"]
    },
    {
      id: "opt4_counter_ridge_pressure",
      title: "Pressure the Ridge to Break Overwatch",
      description: "Reduce the defenders' high-ground advantage by bombarding and then pushing a climbing assault up the escarpment ramps.",
      compositeActions: [
        { semanticAction: "BOMBARD", targetLogic: "specific_region", targetRegionId: "chryse_ridge", targetUnitId: undefined, requiredUnitTypes: ["artillery"], description: "Micromortar fire onto ridge fighting positions—imprecise in the storm, but disruptive." },
        { semanticAction: "ADVANCE", targetLogic: "specific_region", targetRegionId: "antenna_knoll", targetUnitId: undefined, requiredUnitTypes: ["infantry"], description: "Occupy the knoll as a stepping-stone and deny marksmen overwatch." },
        { semanticAction: "ASSAULT", targetLogic: "specific_region", targetRegionId: "chryse_ridge", targetUnitId: undefined, requiredUnitTypes: ["infantry"], description: "Close assault up the ramps/gullies to force ridge defenders into close combat where visibility matters less." }
      ],
      visualEffects: ["explosions", "smoke", "dust"]
    },
    {
      id: "opt5_cut_the_reaction_force",
      title: "Sever the Quick-Reaction Route",
      description: "Prevent the enemy rover troop from reinforcing the silo by fixing it at the culvert and cutting its movement corridor along the gully.",
      compositeActions: [
        { semanticAction: "SEVER_SUPPLY", targetLogic: "specific_region", targetRegionId: "culvert_bridge", targetUnitId: undefined, requiredUnitTypes: [], description: "Disable the culvert approach with obstacles and targeted fire, making reinforcement slow and costly." },
        { semanticAction: "SUPPRESS", targetLogic: "specific_unit", targetRegionId: undefined, targetUnitId: "e4_quick_reaction_rover", requiredUnitTypes: ["artillery"], description: "Keep the rover troop pinned while infantry closes in from covered routes." },
        { semanticAction: "ENCIRCLE", targetLogic: "specific_region", targetRegionId: "silo_complex", targetUnitId: undefined, requiredUnitTypes: ["infantry", "armor"], description: "Once QRF is contained, wrap the silo perimeter to force a garrison surrender or breakthrough attempt." }
      ],
      visualEffects: ["dust", "smoke"]
    }
  ]
}
