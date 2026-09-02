/**
 * Hunger Games AI — Dynamic Thematic Arena Synthesizer
 * Procedurally generates arena-specific Cataclysms and themed NPC/Mutt batches
 * tailored to arbitrary user-defined arenas (factories, robots, plants, biomes, sci-fi, etc.).
 */

import { PRNG } from "../prng";
import { synthesizeNpcBatchFromDescription } from "./npc-generator";

export interface SynthesizedCataclysm {
  name: string;
  description: string;
  hazardType: string;
}

interface ThematicArenaProfile {
  triggers: string[];
  cataclysms: Array<{ name: string; description: string; hazardType: string }>;
  npcPool: string[];
}

const THEMATIC_PROFILES: ThematicArenaProfile[] = [
  // 1. Sawmill / Logging / Timber Complex
  {
    triggers: [
      "sawmill", "logging", "lumber", "saw", "timber", "woodcut", "carpenter", "sawdust", "log"
    ],
    cataclysms: [
      {
        name: "High-Speed Circular Saw Surge & Silo Collapse",
        description: "Floor-mounted circular saws break free from their tracks and careen wildly across sawdust drifts, while overhead suspension ropes snap, sending hundreds of tons of massive hanging logs crashing through multi-story wooden scaffolding.",
        hazardType: "saw_surge",
      },
      {
        name: "Explosive Sawdust Deflagration & Log Flume Deluge",
        description: "Dense clouds of suspended sawdust ignite in a blinding thermobaric flash explosion that engulfs the multi-story towers, while ruptured sluice flumes flood the ground in roaring torrents of churning timber.",
        hazardType: "sawdust_firestorm",
      },
    ],
    npcPool: [
      "Rogue Tracked Circular Saw Bots",
      "Hydraulic Timber Claw Mechs",
      "Sawdust Stalker Hounds",
      "Splinter-Bark Golems",
      "High-Speed Cable Pulley Drones",
    ],
  },

  // 2. Robotic / Factory / Industrial / Lasers / Tech / Machinery
  {
    triggers: [
      "robot", "laser", "factory", "machine", "mechanical", "cyber", "industrial",
      "drone", "foundry", "facility", "tech", "automated", "turret", "circuit",
      "steel", "gear", "piston", "android", "cyborg", "metal", "assembly", "hydraulics"
    ],
    cataclysms: [
      {
        name: "Automated Factory Lockdown & Sweeping Laser Grid",
        description: "The facility's defense matrix initiates a lethal security purge, sweeping crisscrossing high-intensity laser grids and venting boiling hydraulic coolant across the factory floor.",
        hazardType: "laser_grid",
      },
      {
        name: "Foundry Core Meltdown & Molten Slag Deluge",
        description: "The primary smelting crucibles rupture amidst screaming klaxons, sending blinding white-hot molten metal surging down assembly lines and conveyor ramps.",
        hazardType: "foundry_meltdown",
      },
      {
        name: "High-Voltage Arc Flash & Superheated Steam Rupture",
        description: "Severed industrial power conduits arc blinding electrical currents across conductive steel catwalks, bursting high-pressure steam conduits in deafening blasts.",
        hazardType: "electrical_arc",
      },
    ],
    npcPool: [
      "Laser-Mounted Patrol Drones",
      "Overheated Assembly Mechs",
      "Hydraulic Stamping Sentries",
      "High-Voltage Arc Automata",
      "Plasma Blade Infiltrators",
      "Conveyor Scrapper Bots",
    ],
  },

  // 2. Domestic / Living Room / Carnivorous Houseplants / Household
  {
    triggers: [
      "plant", "house", "room", "living", "carpet", "furniture", "vine", "spore",
      "fern", "vacuum", "cleaner", "pot", "kitchen", "indoor", "domestic", "flower",
      "garden", "carnivorous", "foliage", "moss", "ivy"
    ],
    cataclysms: [
      {
        name: "Rampant Chlorophyll Surge & Rogue Vacuum Purge",
        description: "Carnivorous houseplant vines explode in violent growth, crushing drywall and furniture while a feral heavy-duty vacuum cleaner tears through the carpet with whirring titanium intake blades.",
        hazardType: "plant_surge",
      },
      {
        name: "Suffocating Toxic Pollen Bloom & Spore Cloud",
        description: "Overgrown exotic floral bulbs detonate in unison, filling the enclosed rooms with blinding, hallucinogenic golden pollen and asphyxiating neurotoxins.",
        hazardType: "spore_cloud",
      },
      {
        name: "Collapsing Ceiling Fixtures & Barbed Briar Avalanche",
        description: "Intertwined leafy tendrils wrench down ceiling beams and chandeliers, burying combatants under an avalanche of splintered furniture and razor-sharp thorns.",
        hazardType: "debris_collapse",
      },
    ],
    npcPool: [
      "Carnivorous Monstera Vines",
      "Feral Robotic Vacuums",
      "Toxic Pollen Pitchers",
      "Barbed Strangler Ivy Packs",
      "Serrated Cactus Golems",
    ],
  },

  // 3. Volcanic / Lava / Caldera / Fire / Magma / Ash
  {
    triggers: ["lava", "volcano", "caldera", "magma", "obsidian", "sulfur", "fire", "cinder", "flame", "pyroclastic"],
    cataclysms: [
      {
        name: "Tectonic Caldera Rupture & Magma Surge",
        description: "Shifting obsidian tectonic plates fracture violently, releasing surging rivers of incandescent molten magma and blinding sulfurous steam vents across the entire sector.",
        hazardType: "magma",
      },
      {
        name: "Pyroclastic Ash Cloud & Suffocating Gas Eruption",
        description: "A superheated avalanche of choking volcanic ash and toxic sulfur gas descends from the caldera rim, blotting out the sky and scalding exposed skin.",
        hazardType: "ash",
      },
      {
        name: "Subterranean Magma Vent Detonation",
        description: "Pressurized underground magma pockets explode upward in searing geysers of liquid fire, shattering basalt pillars and collapsing bridges.",
        hazardType: "eruption",
      },
    ],
    npcPool: [
      "Obsidian Hound Mutts",
      "Magma Viper Swarm",
      "Volcanic Ash Stalker Predators",
      "Sulfur-Scaled Razor Lizards",
      "Cinder-Winged Night Bats",
    ],
  },

  // 4. Arctic / Ice / Snow / Glacier / Tundra / Blizzard
  {
    triggers: ["ice", "snow", "glacier", "blizzard", "freeze", "arctic", "boreal", "sub-zero", "frost", "tundra"],
    cataclysms: [
      {
        name: "Flash Arctic Blizzard Whiteout",
        description: "A sudden hundred-mile-per-hour blizzard engulfs the arena, dropping ambient temperatures below negative forty and blinding all visibility with razor-sharp ice crystals.",
        hazardType: "blizzard",
      },
      {
        name: "Glacial Crevasse Rupture & Catastrophic Avalanche",
        description: "The frozen terrain cracks open into bottomless icy abysses as millions of tons of glacial pack ice thunder down the slopes.",
        hazardType: "avalanche",
      },
      {
        name: "Sub-Zero Freezing Fog Wave",
        description: "A dense, supernatural freezing fog rolls through the ravines, causing flash hypothermia and frostbite on immediate contact with breathing tributes.",
        hazardType: "frost",
      },
    ],
    npcPool: [
      "Glacial Dire Wolves",
      "Frost-Fang Burrower Mutts",
      "Blizzard Sabre Wyrms",
      "Arctic Apex Cave Bears",
      "Razor-Ice Falcon Mutts",
    ],
  },

  // 5. Jungle / Forest / Woodland / Swamp / Marsh
  {
    triggers: ["jungle", "forest", "woodland", "tree", "canopy", "rainforest", "swamp", "marsh", "pine"],
    cataclysms: [
      {
        name: "Corrosive Acid Fog Deluge",
        description: "A sickly chartreuse fog sweeps through the dense canopy, burning flesh on contact, dissolving organic matter, and forcing tributes into desperate headlong flight.",
        hazardType: "acid_fog",
      },
      {
        name: "Arboreal Wildfire Firestorm",
        description: "An unquenchable chemical wildfire ignited by Capitol jets races across the treetops, turning the forest floor into an inescapable furnace.",
        hazardType: "firestorm",
      },
      {
        name: "Blinding Toxic Spore Cloud Bloom",
        description: "Genetically modified flora detonate in unison, discharging dense clouds of hallucinogenic and lethal nerve toxins throughout the underbrush.",
        hazardType: "spore_cloud",
      },
    ],
    npcPool: [
      "Tracker Jacker Swarms",
      "Venom-Spitting Lizard Mutts",
      "Carnivorous Tree Panther Mutts",
      "Shadow Creeper Serpents",
      "Serrated Mandrill Packs",
    ],
  },

  // 6. Desert / Dunes / Sand / Wasteland / Canyon
  {
    triggers: ["desert", "sand", "dune", "wasteland", "arid", "sun", "canyon"],
    cataclysms: [
      {
        name: "Blinding Glass-Sand Dust Storm",
        description: "A gale-force haboob carries pulverized glass and burning sand, stripping foliage, lacerating unprotected skin, and suffocating unwary combatants.",
        hazardType: "sandstorm",
      },
      {
        name: "Seismic Sinkhole Chasm",
        description: "The unstable desert basin collapses into colossal subterranean sinkholes, swallowing entire dunes and pulling tributes toward the maw.",
        hazardType: "sinkhole",
      },
    ],
    npcPool: [
      "Giant Dune Scorpion Mutts",
      "Razor-Jaw Sand Crawler Swarms",
      "Dust Stalker Hyena Mutts",
      "Sun-Scaled Venom Adders",
    ],
  },

  // 7. Water / Ocean / Sea / Coastal / Reef
  {
    triggers: ["water", "ocean", "island", "sea", "tidal", "reef", "beach"],
    cataclysms: [
      {
        name: "Tidal Surge Tsunami Inundation",
        description: "A towering sixty-foot wave of turbulent black seawater crashes across the shores, sweeping tributes into rip currents and shattering shoreline barricades.",
        hazardType: "tsunami",
      },
      {
        name: "Boiling Geyser & Undertow Surge",
        description: "Submerged geothermal vents boil the surrounding waters, creating scalding steam vortices and treacherous undertows.",
        hazardType: "boiling_waters",
      },
    ],
    npcPool: [
      "Carnivorous Reef Shark Mutts",
      "Venomous Electric Ray Swarms",
      "Spike-Fin Amphibian Stalkers",
      "Tidal Moray Predators",
    ],
  },

  // 8. Space / Sci-Fi / Void / Zero-G / Alien / Cyberpunk
  {
    triggers: ["space", "alien", "void", "star", "station", "gravity", "nebula", "neon", "cyberpunk", "hologram", "matrix"],
    cataclysms: [
      {
        name: "Catastrophic Airlock Decompression & Void Venting",
        description: "Explosive atmospheric decompression tears through breached bulkheads, sucking tributes toward the vacuum of space amidst screaming emergency klaxons.",
        hazardType: "decompression",
      },
      {
        name: "Artificial Gravity Inversion & Kinetic Shockwave",
        description: "The station's gravitational stabilizers fail, violently hurling tributes toward the ceiling before slamming them back down into jagged debris.",
        hazardType: "gravity_inversion",
      },
    ],
    npcPool: [
      "Void-Stalker Parasites",
      "Pressurized Security Drones",
      "Holographic Decoy Phantoms",
      "Zero-G Chittering Xenomorphs",
    ],
  },

  // 9. Underground / Caves / Caverns / Subterranean
  {
    triggers: ["cave", "underground", "subterranean", "mine", "cavern", "chasm", "stalactite", "tunnel"],
    cataclysms: [
      {
        name: "Seismic Cavern Collapse & Stalactite Rain",
        description: "A massive tectonic tremor destabilizes the ceiling, sending razor-sharp limestone stalactites plunging like spears amidst choking pulverized stone dust.",
        hazardType: "cavern_collapse",
      },
      {
        name: "Methane Pocket Ignition & Flash Firestorm",
        description: "Trapped subterranean gases ignite into an inescapable fireball that races through tight tunnels, consuming oxygen in an instant.",
        hazardType: "gas_firestorm",
      },
    ],
    npcPool: [
      "Subterranean Blind Stalkers",
      "Venom-Fanged Chasm Bats",
      "Burrowing Centipede Swarms",
      "Cave Lurker Arachnids",
    ],
  },

  // 10. Urban Ruins / City / Decaying Monoliths / Concrete
  {
    triggers: ["ruin", "city", "urban", "concrete", "skyscraper", "monolith", "asphalt", "decay", "street"],
    cataclysms: [
      {
        name: "Skyscraper Facade Collapse & Concrete Deluge",
        description: "Weakened architectural foundations give way, raining thousands of tons of pulverized concrete, jagged rebar, and shattered glass across the avenues.",
        hazardType: "concrete_collapse",
      },
      {
        name: "Subway Inundation & Toxic Sump Rupture",
        description: "Ruptured underground sewer and water mains flood the ruined boulevards with raging torrents of toxic, contaminated chemical sludge.",
        hazardType: "toxic_flood",
      },
    ],
    npcPool: [
      "Feral City Stray Hound Packs",
      "Sewer Stalker Alligator Mutts",
      "Razor-Claw Scavenger Birds",
      "Armored Infiltration Androids",
    ],
  },
];

const DEFAULT_CATACLYSMS: SynthesizedCataclysm[] = [
  {
    name: "Capitol Electric Forcefield Pulse Wave",
    description: "The Gamemakers recalibrate the perimeter forcefield, sending a crackling shockwave of electromagnetic lightning and concussive thunder surging toward the center.",
    hazardType: "forcefield_pulse",
  },
  {
    name: "Engineered Toxic Aerosol Deluge",
    description: "Concealed nozzles across the arena spray a heavy, pungent aerosol cloud that burns the lungs and forces all surviving combatants out of hiding.",
    hazardType: "toxic_gas",
  },
  {
    name: "Enclosing Arena Wall of Fire",
    description: "Coordinated jet bursts unleash an advancing wall of chemical flame, driving tributes inexorably toward a bloody convergence.",
    hazardType: "firewall",
  },
];

/**
 * Dynamically synthesizes an ad-hoc cataclysm from arbitrary user arena text
 * when no static profile triggers match.
 */
function synthesizeAdHocCataclysm(
  arenaName: string,
  arenaDescription: string,
  prng: PRNG
): SynthesizedCataclysm {
  const combined = `${arenaName} ${arenaDescription}`;
  const words = combined
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  const subjects = words.length > 0 ? words : ["Perimeter", "Arena", "Sector"];
  const prefixes = ["Catastrophic", "Seismic", "Unrelenting", "Violent", "Devastating", "Apex", "Overwhelming"];
  const disasterNouns = ["Inundation", "Shockwave", "Rupture", "Deluge", "Surge", "Firestorm", "Collapse", "Meltdown"];

  const subject1 = prng.pickOne(subjects);
  const subject2 = prng.pickOne(subjects);
  const prefix = prng.pickOne(prefixes);
  const noun = prng.pickOne(disasterNouns);

  const name = subject1 !== subject2
    ? `${prefix} ${subject1} & ${subject2} ${noun}`
    : `${prefix} ${subject1} ${noun}`;

  const snippet = arenaDescription.trim().length > 10
    ? arenaDescription.slice(0, 100).trim()
    : arenaName || "the arena environment";

  const description = `A catastrophic Gamemaker disaster erupts directly from ${snippet}: extreme environmental pressures and chaotic hazards sweep the sector, forcing every tribute to scramble for survival.`;

  return {
    name,
    description,
    hazardType: "environmental_cataclysm",
  };
}

/**
 * Procedurally matches arena description keywords or dynamically synthesizes
 * a tailored arena Cataclysm for any arbitrary user prompt.
 */
export function synthesizeArenaCataclysm(params: {
  arenaName?: string;
  arenaDescription?: string;
  prng: PRNG;
}): SynthesizedCataclysm {
  const { arenaName = "", arenaDescription = "", prng } = params;
  const combinedText = `${arenaName} ${arenaDescription}`.toLowerCase();

  // 1. Check thematic profiles
  for (const profile of THEMATIC_PROFILES) {
    if (profile.triggers.some((trigger) => combinedText.includes(trigger))) {
      return prng.pickOne(profile.cataclysms);
    }
  }

  // 2. If user provided rich custom text but no profile matched, dynamically synthesize an ad-hoc disaster
  if (arenaDescription.trim().length > 10 || arenaName.trim().length > 5) {
    return synthesizeAdHocCataclysm(arenaName, arenaDescription, prng);
  }

  // 3. Default fallback
  return prng.pickOne(DEFAULT_CATACLYSMS);
}

/**
 * Procedurally generates a batch of themed apex predator/mutt names matching the arena.
 * Backed by the dynamic npc-generator for 100% thematic coverage across any arena.
 */
export function synthesizeThemedArenaNpcs(params: {
  arenaName?: string;
  arenaDescription?: string;
  prng: PRNG;
  count?: number;
}): string[] {
  const { arenaName = "", arenaDescription = "", prng, count = 4 } = params;
  const batch = synthesizeNpcBatchFromDescription({
    arenaName,
    arenaDescription,
    prng,
    count,
  });

  return batch.map((npc) => npc.name);
}
