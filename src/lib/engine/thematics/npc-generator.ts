/**
 * Hunger Games AI — Dynamic Thematic NPC Synthesizer
 * Generates custom NPC combatants with names and descriptions tailored to arbitrary arena lore.
 */

import { PRNG } from "../prng";
import { CustomNPC } from "../types";

interface NpcThematicPattern {
  keywords: string[];
  creatures: Array<{ name: string; description: string }>;
}

const THEMATIC_PATTERNS: NpcThematicPattern[] = [
  // 1. Sawmill / Logging / Lumber Site
  {
    keywords: [
      "sawmill", "logging", "lumber", "saw", "timber", "woodcut", "carpenter", "sawdust", "log"
    ],
    creatures: [
      {
        name: "Rogue Tracked Circular Saw Bot",
        description: "An unhinged motorized automaton mounted with a high-RPM spinning steel saw blade that carves through timber and bone alike."
      },
      {
        name: "Hydraulic Timber Claw Mech",
        description: "A heavy-duty log-loading automaton equipped with crushing steel pincer jaws and whistling steam vents."
      },
      {
        name: "Sawdust Stalker Hound",
        description: "A low-slung, camouflaged predatory mutt that charges silently through billowing sawdust banks with razor fangs."
      },
      {
        name: "Splinter-Bark Golem",
        description: "A hulking animatronic construction of bound pine logs bristling with armor-piercing wooden splinters."
      },
      {
        name: "High-Speed Cable Pulley Drone",
        description: "An aerial carrier rig that swoops along overhead logging cables, dropping swinging grappling hooks upon tributes."
      },
    ]
  },

  // 2. Robotic / Industrial / Factory / Tech / Cyber / Lasers
  {
    keywords: [
      "robot", "laser", "factory", "machine", "mechanical", "cyber", "industrial",
      "drone", "foundry", "facility", "tech", "automated", "turret", "circuit",
      "steel", "gear", "piston", "android", "cyborg", "metal", "assembly", "hydraulics"
    ],
    creatures: [
      {
        name: "Laser-Mounted Patrol Drone",
        description: "A hovering surveillance unit armed with twin high-energy laser emitters and heat-seeking optics."
      },
      {
        name: "Overheated Assembly Mech",
        description: "A hulking multi-armed fabrication automaton emitting acrid ozone and swinging molten weld heads."
      },
      {
        name: "Hydraulic Stamping Sentry",
        description: "A heavy-treaded industrial machine that slams crushing hydraulic pistons into the floor."
      },
      {
        name: "High-Voltage Arc Automaton",
        description: "A malfunctioning repair droid that discharges blinding electrical arcs at any nearby motion."
      },
      {
        name: "Plasma Blade Infiltrator",
        description: "A sleek titanium quad-walker equipped with whirring high-frequency plasma blades."
      },
      {
        name: "Conveyor Scrapper Bot",
        description: "A relentless tracked salvager with spinning titanium teeth designed to shred foreign objects."
      },
    ]
  },

  // 2. Carnivorous Plants / Household / Domestic / Overgrown Living Room
  {
    keywords: [
      "plant", "house", "room", "living", "carpet", "furniture", "vine", "spore",
      "fern", "vacuum", "cleaner", "pot", "kitchen", "indoor", "domestic", "flower",
      "garden", "carnivorous", "foliage", "moss", "ivy"
    ],
    creatures: [
      {
        name: "Carnivorous Monstera Vine",
        description: "Thick, creeping houseplant tendrils that whip through the room to constrict and drag tributes."
      },
      {
        name: "Feral Robotic Vacuum",
        description: "An overclocked motorized cleaner scouring the floor with razor-sharp intake blades and flashing sensors."
      },
      {
        name: "Toxic Pollen Pitcher",
        description: "A bloated exotic floral bulb that detonates with blinding, hallucinogenic golden spores."
      },
      {
        name: "Barbed Strangler Ivy",
        description: "Intertwined thorny creepers hanging from curtain rails and ceiling fixtures ready to snare."
      },
      {
        name: "Serrated Cactus Golem",
        description: "A towering clump of animated desert flora bristling with armor-piercing crystalline needles."
      },
    ]
  },

  // 3. Volcanic / Lava / Fire / Caldera / Ash
  {
    keywords: [
      "volcan", "lava", "magma", "caldera", "fire", "ash", "obsidian", "pyroclastic",
      "cinder", "flame", "sulfur", "crater"
    ],
    creatures: [
      {
        name: "Obsidian Magma Hound",
        description: "A four-legged predatory beast with charred stone armor and veins of liquid magma glowing through its ribs."
      },
      {
        name: "Ash-Stalker Viper Swarm",
        description: "Serpents with scales of white volcanic ash that strike unseen from scorching cinder banks."
      },
      {
        name: "Pyroclastic Salamander",
        description: "A massive, scaly brute capable of exhaling jets of superheated sulfur gas."
      },
      {
        name: "Molten Cinder Drake",
        description: "A winged terror that glides across thermal updrafts, dropping burning embers upon prey."
      },
    ]
  },

  // 4. Arctic / Frost / Snow / Ice / Glacier
  {
    keywords: [
      "snow", "ice", "arctic", "blizzard", "frozen", "tundra", "glaci", "frost",
      "sub-zero", "chill", "hail"
    ],
    creatures: [
      {
        name: "Frost-Bitten White Stalker",
        description: "A silent, furred apex predator with pale blue eyes adapted to hunt amidst blinding whiteouts."
      },
      {
        name: "Glacial Ice-Hornet Swarm",
        description: "Chitinous winged insects whose stings inject a rapidly crystallizing cryo-toxin."
      },
      {
        name: "Rime-Scaled Polar Serpent",
        description: "A subterranean ice-burrower that shatters frozen crusts beneath unsuspecting tributes."
      },
      {
        name: "Tundra Blizzard Behemoth",
        description: "A towering horned beast whose breath frosts tribute armor into brittle ice."
      },
    ]
  },

  // 5. Jungle / Forest / Swamp / Marsh
  {
    keywords: [
      "jungle", "rainforest", "swamp", "marsh", "bog", "canopy", "wetland",
      "bayou", "mangrove", "woods"
    ],
    creatures: [
      {
        name: "Tracker Jacker Swarm",
        description: "Genetically engineered gold hornets whose hallucinogenic venom causes gruesome swelling and madness."
      },
      {
        name: "Canopy Shadow Mandrill",
        description: "Fierce primate mutts with bioluminescent facial war-paint and bone-crushing fangs."
      },
      {
        name: "Quicksand Pit Leech",
        description: "Serrated aquatic parasites lurking beneath muddy silt pools to latch onto wading tributes."
      },
      {
        name: "Venomous Tree Viper",
        description: "Coiled arboreal serpents whose neurotoxic bites induce instant paralysis."
      },
    ]
  },

  // 6. Aquatic / Ocean / Deep Sea / Water
  {
    keywords: [
      "ocean", "water", "sea", "marine", "deep", "reef", "submerged", "tide",
      "aquatic", "abyss", "tsunami"
    ],
    creatures: [
      {
        name: "Serrated Trench Piranha Pack",
        description: "Razor-toothed schooling mutts drawn instantly by the scent of fresh blood in swirling waters."
      },
      {
        name: "Electric Reef Ray",
        description: "A flattened sea predator capable of discharging incapacitating bio-electric pulses."
      },
      {
        name: "Abyssal Spire Kraken",
        description: "Barbed tentacles that surge from dark trenches to drag submerged tributes under."
      },
    ]
  },

  // 7. Space / Void / Sci-Fi / Cyberpunk / Alien
  {
    keywords: [
      "space", "alien", "void", "star", "station", "gravity", "nebula", "astral",
      "neon", "cyberpunk", "hologram", "matrix"
    ],
    creatures: [
      {
        name: "Void-Stalker Parasite",
        description: "A chittering extraterrestrial organism that scuttles effortlessly along airlock bulkheads in zero-g."
      },
      {
        name: "Pressurized Security Drone",
        description: "An automated defense orb armed with kinetic crowd-control darts and flashing emergency strobes."
      },
      {
        name: "Holographic Decoy Phantom",
        description: "Flickering hard-light simulations that disorient tributes while venting toxic coolant."
      },
    ]
  },
];

const DEFAULT_MUTT_POOL: CustomNPC[] = [
  {
    name: "Capitol Wolf Hybrid Mutt",
    description: "A hulking quad-walker bio-engineered with razor fangs, amber tracking eyes, and uncanny agility."
  },
  {
    name: "Tracker Jacker Swarm",
    description: "Bio-engineered golden wasps that attack in coordinated clouds with lethal hallucinogenic stings."
  },
  {
    name: "Carnivorous Stalker Beast",
    description: "A muscular feline predator engineered with night-vision lenses and razor-edged claws."
  },
  {
    name: "Sewer Reptilian Mutt",
    description: "An armored, low-slung predator with acid-laced saliva that navigates dark corridors."
  },
];

/**
 * Extracts salient nouns and words from the user's arena description to construct an ad-hoc custom NPC
 * if none of the pre-indexed patterns match.
 */
function synthesizeAdHocNpc(
  arenaText: string,
  prng: PRNG,
  existingNames: Set<string>
): CustomNPC {
  // Extract words 4+ letters
  const words = arenaText
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  const subjects = words.length > 0 ? words : ["Arena", "Sector", "Perimeter"];
  const descriptors = ["Stalker", "Predator", "Sentinel", "Mutt", "Beast", "Hunter", "Fiend", "Drone"];
  const prefixes = ["Feral", "Mutated", "Enraged", "Apex", "Bio-Engineered", "Armored", "Rogue"];

  for (let attempt = 0; attempt < 10; attempt++) {
    const subject = prng.pickOne(subjects);
    const desc = prng.pickOne(descriptors);
    const prefix = prng.pickOne(prefixes);

    const name = `${prefix} ${subject} ${desc}`;
    if (!existingNames.has(name)) {
      return {
        name,
        description: `A formidable hostile native to the ${arenaText.slice(0, 60)} environment, aggressively hunting nearby tributes.`
      };
    }
  }

  const fallbackSubject = prng.pickOne(subjects);
  return {
    name: `Apex ${fallbackSubject} Hunter`,
    description: `A lethal hostile adapted specifically to survive and dominate this arena's unique hazards.`
  };
}

/**
 * Synthesizes a single NPC matching the arena's description.
 */
export function synthesizeSingleNpcFromDescription(params: {
  arenaName?: string;
  arenaDescription?: string;
  prng: PRNG;
  existingNames?: string[];
}): CustomNPC {
  const { arenaName = "", arenaDescription = "", prng, existingNames = [] } = params;
  const combined = `${arenaName} ${arenaDescription}`.toLowerCase();
  const nameSet = new Set(existingNames);

  // 1. Check thematic keyword matches
  for (const pattern of THEMATIC_PATTERNS) {
    const matched = pattern.keywords.some((kw) => combined.includes(kw));
    if (matched) {
      // Find candidate not already in existingNames
      const available = pattern.creatures.filter((c) => !nameSet.has(c.name));
      if (available.length > 0) {
        return prng.pickOne(available);
      }
      // If all are used, pick any
      return prng.pickOne(pattern.creatures);
    }
  }

  // 2. If arena has rich text but no preset keywords match, synthesize an ad-hoc NPC from the text
  if (arenaDescription.trim().length > 10) {
    return synthesizeAdHocNpc(arenaDescription, prng, nameSet);
  }

  // 3. Fallback to Capitol defaults
  const availableDefault = DEFAULT_MUTT_POOL.filter((c) => !nameSet.has(c.name));
  return availableDefault.length > 0 ? prng.pickOne(availableDefault) : prng.pickOne(DEFAULT_MUTT_POOL);
}

/**
 * Synthesizes a batch of NPCs (e.g. 3-4) matching the arena's description.
 * Used exclusively for Special Event overloads (`npc_overload`).
 */
export function synthesizeNpcBatchFromDescription(params: {
  arenaName?: string;
  arenaDescription?: string;
  prng: PRNG;
  count?: number;
  existingNames?: string[];
}): CustomNPC[] {
  const { arenaName = "", arenaDescription = "", prng, count = 4, existingNames = [] } = params;
  const combined = `${arenaName} ${arenaDescription}`.toLowerCase();
  const usedNames = new Set(existingNames);
  const result: CustomNPC[] = [];

  // Find matching thematic patterns
  const matchedPatterns = THEMATIC_PATTERNS.filter((pattern) =>
    pattern.keywords.some((kw) => combined.includes(kw))
  );

  if (matchedPatterns.length > 0) {
    const allThematicCreatures = matchedPatterns.flatMap((p) => p.creatures);
    prng.shuffle(allThematicCreatures);

    for (const c of allThematicCreatures) {
      if (result.length >= count) break;
      if (!usedNames.has(c.name)) {
        result.push(c);
        usedNames.add(c.name);
      }
    }
  }

  // If still need more, synthesize ad-hoc or pull from defaults
  while (result.length < count) {
    const candidate = synthesizeSingleNpcFromDescription({
      arenaName,
      arenaDescription,
      prng,
      existingNames: Array.from(usedNames),
    });

    result.push(candidate);
    usedNames.add(candidate.name);
  }

  return result;
}
