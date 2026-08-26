import { ArenaPreset } from "@/types/setup";

export const ARENA_PRESETS: ArenaPreset[] = [
  {
    id: "preset_74th_games",
    name: "The 74th Hunger Games (Canon)",
    simulationTitle: "The 74th Annual Hunger Games",
    arenaName: "Verdant Woodlands & Golden Cornucopia",
    description:
      "A vast temperate pine woodland surrounding a shimmering freshwater lake. Features heavily forested hills, hidden streams, nesting zones for genetically engineered Tracker Jackers, and a towering Golden Cornucopia stocked with lethal armaments.",
    hazards: {
      enableBloodbath: true,
      enableMuttations: true,
      enableDisasters: true,
      enableSponsorDrops: true,
    },
    tag: "74th Annual (Canon)",
    canonSeason: 74,
  },
  {
    id: "preset_75th_quell",
    name: "The 75th Quarter Quell (Canon)",
    simulationTitle: "The 75th Annual Hunger Games (3rd Quarter Quell)",
    arenaName: "The Clockwork Island",
    description:
      "A circular salt-water sea enclosed by a lethal forcefield. Twelve pie-shaped sectors activate every hour on the clock, unleashing terrifying disasters: poisonous fog, blood rain, flesh-eating monkey mutts, devastating lightning strikes, and tidal waves.",
    hazards: {
      enableBloodbath: true,
      enableMuttations: true,
      enableDisasters: true,
      enableSponsorDrops: true,
    },
    tag: "3rd Quarter Quell (Canon)",
    canonSeason: 75,
  },
  {
    id: "preset_dark_days",
    name: "Dark Days Ruined Capitol",
    simulationTitle: "Dark Days: Sector Zero Protocol",
    arenaName: "Sector Zero Ruins",
    description:
      "The bombed-out shell of an ancient metropolitan district. Crumbling skyscrapers provide sniper vantages, while flooded subterranean subways harbor deadly electrical surges and explosive Gamemaker landmines.",
    hazards: {
      enableBloodbath: true,
      enableMuttations: true,
      enableDisasters: true,
      enableSponsorDrops: false,
    },
    tag: "Urban Apocalypse",
  },
  {
    id: "preset_orbital_station",
    name: "Orbital Station Olympus",
    simulationTitle: "Project Olympus: Deep Space Protocol",
    arenaName: "Zero-G Deep Space Complex",
    description:
      "A decaying orbital space station orbiting Earth. Features malfunctioning artificial gravity plates, depressurizing airlocks, blinding solar radiation flares, and automated security drone mutts patrolling narrow metal air ducts.",
    hazards: {
      enableBloodbath: true,
      enableMuttations: true,
      enableDisasters: true,
      enableSponsorDrops: true,
    },
    tag: "Sci-Fi Deep Space",
  },
  {
    id: "preset_great_freeze",
    name: "The Great Freeze",
    simulationTitle: "The Great Freeze: Arctic Attrition",
    arenaName: "Boreal Glacial Abyss",
    description:
      "A merciless sub-zero alpine plateau battered by persistent howling blizzards. Open snowfields expose tributes to freezing winds, while frozen lakes conceal fragile ice crusts and subterranean hot springs with lethal scalding bursts.",
    hazards: {
      enableBloodbath: true,
      enableMuttations: false,
      enableDisasters: true,
      enableSponsorDrops: true,
    },
    tag: "Arctic Survival",
  },
  {
    id: "preset_submerged_coral",
    name: "The Sunken Atoll",
    simulationTitle: "The Sunken Atoll: Abyssal Trials",
    arenaName: "Bioluminescent Abyssal Reef",
    description:
      "A half-submerged tropical archipelago and flooded cavern system. Tributes must navigate rickety wooden catwalks, razor-sharp coral formations, predatory aquatic mutts, and sudden torrential storm surges.",
    hazards: {
      enableBloodbath: true,
      enableMuttations: true,
      enableDisasters: true,
      enableSponsorDrops: true,
    },
    tag: "Aquatic Warzone",
  },
];
