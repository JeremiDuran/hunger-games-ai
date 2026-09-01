/**
 * Hunger Games AI — Dynamic On-Demand Item Synthesizer
 * Synthesizes thematic items dynamically from arena description keywords without a static catalog.
 */

import { PRNG } from "../prng";
import { EngineItem, ItemCategory, ItemTier } from "./types";

export interface SynthesizeItemParams {
  arenaDescription: string;
  arenaName?: string;
  category?: ItemCategory;
  tier?: ItemTier;
  prng: PRNG;
}

// ==========================================
// 1. Lexical Thematic Materials & Archetypes
// ==========================================

interface ThematicLexicon {
  materials: string[];
  weaponNouns: string[];
  armorNouns: string[];
  medicalNouns: string[];
  sustenanceNouns: string[];
  toolNouns: string[];
}

const DEFAULT_LEXICON: ThematicLexicon = {
  materials: ["Steel", "Iron", "Hardwood", "Reinforced", "Survival", "Capitol"],
  weaponNouns: ["Knife", "Hunting Spear", "Short Bow", "Cleaver", "Machete", "Club"],
  armorNouns: ["Vest", "Padded Tunic", "Reinforced Bracers", "Leather Jacket", "Shield"],
  medicalNouns: ["Antiseptic Ointment", "Bandages", "Suture Kit", "Painkiller Vial", "Salve"],
  sustenanceNouns: ["Energy Rations", "Dried Jerky", "Purified Canteen", "Nutrient Paste"],
  toolNouns: ["Paracord Spool", "Fire Striker", "Wire Trap", "Multitool", "Flashlight"],
};

const THEMATIC_VOCABULARIES: Array<{
  triggers: string[];
  lexicon: ThematicLexicon;
}> = [
  {
    triggers: ["ice", "snow", "glacier", "blizzard", "freeze", "arctic", "boreal", "sub-zero", "frost"],
    lexicon: {
      materials: ["Whalebone", "Frost-Forged", "Glacial", "Thermal Fur", "Ice-Honed", "Mammoth"],
      weaponNouns: ["Ice Climbing Pick", "Bone Spear", "Serrated Harpoon", "Hunting Cleaver", "Flint Dagger"],
      armorNouns: ["Bear Pelt Cloak", "Insulated Parka", "Thermal Hide Vest", "Fur-Lined Bracers"],
      medicalNouns: ["Blubber Burn Salve", "Frostbite Ointment", "Herbal Warming Tonic", "Sterile Wrap"],
      sustenanceNouns: ["Whale Fat Pemmican", "Dried Caribou Jerky", "Meltwater Canteen", "Pine Needle Infusion"],
      toolNouns: ["Ice Cleats", "Friction Fire Drill", "Snowshoe Rig", "Signal Flare", "Thermal Blanket"],
    },
  },
  {
    triggers: ["jungle", "forest", "woodland", "tree", "canopy", "rainforest", "bamboo", "swamp", "pine"],
    lexicon: {
      materials: ["Bamboo", "Hardwood", "Vine-Wrapped", "Venom-Tipped", "Obsidian", "Camouflaged"],
      weaponNouns: ["Blowgun with Darts", "Heavy Machete", "Recurve Bow", "Woodland Spear", "Curare Dagger"],
      armorNouns: ["Bark-Splint Armor", "Camo Netting Poncho", "Hardened Leather Guard", "Ghillie Wrap"],
      medicalNouns: ["Tracker Jacker Antivenom", "Antiseptic Root Extract", "Mud Poultice", "Moss Bandage"],
      sustenanceNouns: ["Wild Foraged Berries", "Smoked River Trout", "Clean Spring Canteen", "Roasted Beetle Nuts"],
      toolNouns: ["Camouflage Netting", "Climbing Rope", "Tripwire Snare Kit", "Tree Stand Harness"],
    },
  },
  {
    triggers: ["ruin", "city", "urban", "metro", "skyscraper", "subway", "concrete", "metal", "dark days", "sector zero"],
    lexicon: {
      materials: ["Rusted Rebar", "Shattered Glass", "Scrap Iron", "Carbon Steel", "Asphalt", "Industrial"],
      weaponNouns: ["Rebar Javelin", "Pipe Machete", "Concrete Sledge", "Serrated Shard Knife", "Spiked Bat"],
      armorNouns: ["Riot Shield", "Kevlar Shard Vest", "Makeshift Gas Mask", "Steel Plating Harness"],
      medicalNouns: ["Capitol Medkit", "Burn Salve Syringe", "Coagulant Gauze", "Antibiotic Tablets"],
      sustenanceNouns: ["Pre-War Canned Rations", "Military Nutrient Block", "Filtered Water Flask", "Energy Gel"],
      toolNouns: ["Steel Crowbar", "Conductive Wire Coil", "Night-Vision Goggles", "Utility Pliers"],
    },
  },
  {
    triggers: ["water", "sea", "ocean", "reef", "coral", "atoll", "submerged", "island", "aquatic", "tidal"],
    lexicon: {
      materials: ["Coral-Tipped", "Conductive Copper", "Driftwood", "Sharktooth", "Kevlar Mesh", "Gilded"],
      weaponNouns: ["Spiked Trident", "Fishing Harpoon", "Bone Diving Knife", "Weighted Net", "Speargun"],
      armorNouns: ["Hydro-Skin Wetsuit", "Coral-Studded Vest", "Kevlar Mesh Gauntlets", "Scaled Shield"],
      medicalNouns: ["Kelp Burn Dressing", "Sea-Salt Antiseptic", "Purifying Iodine Dropper", "Sting Salve"],
      sustenanceNouns: ["Sun-Dried Fish Strip", "Oyster Shell Meat", "Desalinated Canteen", "Seaweed Rations"],
      toolNouns: ["Copper Wire Spool", "Braided Fishing Line", "Signal Mirror", "Snorkel Mask"],
    },
  },
  {
    triggers: ["space", "orbit", "olympus", "vacuum", "zero-g", "drone", "solar", "station", "complex"],
    lexicon: {
      materials: ["Titanium", "Polymer", "Plasma-Tempered", "Nanotech", "Alloy", "Aeronautic"],
      weaponNouns: ["Plasma Arc Torch", "Titanium Pry-Blade", "Pneumatic Spear", "Laser-Targeted Crossbow"],
      armorNouns: ["Pressurized Exosuit Vest", "Radiation Shielding", "Alloy Visor Mask", "Magnetic Bracers"],
      medicalNouns: ["Bio-Gel Regenerator", "Stim-Injector", "Nanite Wound Sealant", "Oxygen Capsule"],
      sustenanceNouns: ["Dehydrated Meal Pack", "Electrolyte Hydration Flask", "Protein Nutrient Cube"],
      toolNouns: ["Gravity Anchor Clip", "Thermal Scanner", "Diagnostic Multitool", "Emergency Thruster"],
    },
  },
  {
    triggers: ["desert", "sand", "dune", "arid", "sun", "scorch", "wasteland"],
    lexicon: {
      materials: ["Sandstone", "Sun-Bleached Bone", "Obsidian", "Scorpion Chitin", "Canvas"],
      weaponNouns: ["Curved Scimitar", "Obsidian Dagger", "Weighted Bolas", "Composite Bow", "Javelin"],
      armorNouns: ["Sand-Stalker Cloak", "Hardened Chitin Cuirass", "Dust Mask & Goggles", "Linen Wraps"],
      medicalNouns: ["Aloe Sunburn Gel", "Cactus Antidote Sap", "Heatstroke Tonic", "Clean Linen Dressing"],
      sustenanceNouns: ["Sun-Dried Dates", "Purified Water Bladder", "Salt Tablets", "Jerky Strip"],
      toolNouns: ["Shade Tarp Rig", "Solar Water Still", "Dune Navigation Compass", "Flint Striker"],
    },
  },
];

// ==========================================
// 2. Synthesizer Implementation
// ==========================================

/**
 * Procedurally generates an item dynamically matching the arena context without a static catalog.
 */
export function synthesizeItem(params: SynthesizeItemParams): EngineItem {
  const { arenaDescription, arenaName = "", prng } = params;

  // 1. Determine or roll ItemCategory
  const category: ItemCategory =
    params.category ??
    (prng.pickWeighted(
      ["weapon", "medical", "sustenance", "armor", "tool"],
      [40, 20, 20, 10, 10]
    ) as ItemCategory);

  // 2. Determine or roll ItemTier
  const tier: ItemTier =
    params.tier ??
    (prng.pickWeighted(
      ["common", "uncommon", "rare", "legendary"],
      [50, 30, 15, 5]
    ) as ItemTier);

  // 3. Find matching thematic vocabulary from arena description
  const combinedText = `${arenaName} ${arenaDescription}`.toLowerCase();
  const matchedTheme = THEMATIC_VOCABULARIES.find((theme) =>
    theme.triggers.some((trigger) => combinedText.includes(trigger))
  );

  const lexicon = matchedTheme?.lexicon ?? DEFAULT_LEXICON;

  // 4. Pick material and category noun
  const material = prng.pickOne(lexicon.materials);
  let noun = "";

  switch (category) {
    case "weapon":
      noun = prng.pickOne(lexicon.weaponNouns);
      break;
    case "armor":
      noun = prng.pickOne(lexicon.armorNouns);
      break;
    case "medical":
      noun = prng.pickOne(lexicon.medicalNouns);
      break;
    case "sustenance":
      noun = prng.pickOne(lexicon.sustenanceNouns);
      break;
    case "tool":
      noun = prng.pickOne(lexicon.toolNouns);
      break;
  }

  // Prefix legendary or rare modifiers
  let name = `${material} ${noun}`;
  if (tier === "legendary") {
    const legendaryPrefix = prng.pickOne(["Masterwork", "Flawless", "Capitol-Engineered", "Gilded"]);
    name = `${legendaryPrefix} ${name}`;
  } else if (tier === "rare" && prng.nextBoolean(0.5)) {
    const rarePrefix = prng.pickOne(["Tempered", "Pristine", "Serrated", "Reinforced"]);
    name = `${rarePrefix} ${name}`;
  }

  const id = `item-${category}-${prng.nextInt(1000, 9999)}`;
  const durability = category === "medical" || category === "sustenance" ? 1 : undefined;

  return {
    id,
    name,
    category,
    tier,
    durability,
  };
}
