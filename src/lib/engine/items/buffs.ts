/**
 * Hunger Games AI — ItemTier Buffs & Mechanical Calculators
 * Pure functions for calculating combat power multipliers, damage mitigation,
 * and biometric recovery deltas directly from ItemTier and ItemCategory.
 */

import { EngineItem, ItemCategory, ItemTier } from "./types";

// ==========================================
// 1. Multiplier Constants & Weights
// ==========================================

export const WEAPON_TIER_BUFFS: Record<ItemTier, number> = {
  common: 0.15,
  uncommon: 0.25,
  rare: 0.35,
  legendary: 0.50,
};

export const ARMOR_TIER_MITIGATION: Record<ItemTier, number> = {
  common: 0.15,
  uncommon: 0.25,
  rare: 0.35,
  legendary: 0.50,
};

export const TOOL_TIER_BUFFS: Record<ItemTier, number> = {
  common: 0.10,
  uncommon: 0.15,
  rare: 0.25,
  legendary: 0.40,
};

export const MEDICAL_TIER_RECOVERY: Record<
  ItemTier,
  { survivalDelta: number; sanityDelta: number }
> = {
  common: { survivalDelta: 20, sanityDelta: 0 },
  uncommon: { survivalDelta: 35, sanityDelta: 5 },
  rare: { survivalDelta: 50, sanityDelta: 15 },
  legendary: { survivalDelta: 75, sanityDelta: 25 },
};

export const SUSTENANCE_TIER_RECOVERY: Record<
  ItemTier,
  { survivalDelta: number; sanityDelta: number }
> = {
  common: { survivalDelta: 15, sanityDelta: 10 },
  uncommon: { survivalDelta: 20, sanityDelta: 15 },
  rare: { survivalDelta: 30, sanityDelta: 25 },
  legendary: { survivalDelta: 45, sanityDelta: 35 },
};

const TIER_ORDER: Record<ItemTier, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  legendary: 4,
};

// ==========================================
// 2. Type Guard & Extraction Utilities
// ==========================================

export function isEngineItem(item: unknown): item is EngineItem {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.tier === "string"
  );
}

/**
 * Normalizes an array of items (which may contain legacy string names) into structured EngineItems.
 */
export function normalizeItems(items: readonly (EngineItem | string)[]): EngineItem[] {
  return items.map((item, index) => {
    if (isEngineItem(item)) {
      return item;
    }
    // Fallback: Infer basic properties from string name
    const str = String(item).toLowerCase();
    let category: ItemCategory = "tool";
    if (
      str.includes("sword") ||
      str.includes("knife") ||
      str.includes("spear") ||
      str.includes("bow") ||
      str.includes("axe") ||
      str.includes("mace") ||
      str.includes("dagger") ||
      str.includes("trident")
    ) {
      category = "weapon";
    } else if (
      str.includes("armor") ||
      str.includes("vest") ||
      str.includes("jacket") ||
      str.includes("shield") ||
      str.includes("cloak")
    ) {
      category = "armor";
    } else if (
      str.includes("med") ||
      str.includes("bandage") ||
      str.includes("ointment") ||
      str.includes("antivenom")
    ) {
      category = "medical";
    } else if (
      str.includes("ration") ||
      str.includes("meat") ||
      str.includes("bread") ||
      str.includes("water") ||
      str.includes("berries")
    ) {
      category = "sustenance";
    }

    return {
      id: `item-legacy-${index}`,
      name: String(item),
      category,
      tier: "common",
    };
  });
}

// ==========================================
// 3. Category & Tier Evaluators
// ==========================================

/**
 * Finds the highest-tier weapon from an array of inventory items.
 */
export function getBestWeapon(items: readonly (EngineItem | string)[]): EngineItem | null {
  const normalized = normalizeItems(items);
  const weapons = normalized.filter((item) => item.category === "weapon");

  if (weapons.length === 0) return null;

  return weapons.reduce((best, curr) =>
    TIER_ORDER[curr.tier] > TIER_ORDER[best.tier] ? curr : best
  );
}

/**
 * Finds the highest-tier armor from an array of inventory items.
 */
export function getBestArmor(items: readonly (EngineItem | string)[]): EngineItem | null {
  const normalized = normalizeItems(items);
  const armors = normalized.filter((item) => item.category === "armor");

  if (armors.length === 0) return null;

  return armors.reduce((best, curr) =>
    TIER_ORDER[curr.tier] > TIER_ORDER[best.tier] ? curr : best
  );
}

/**
 * Finds the highest-tier tool from an array of inventory items.
 */
export function getBestTool(items: readonly (EngineItem | string)[]): EngineItem | null {
  const normalized = normalizeItems(items);
  const tools = normalized.filter((item) => item.category === "tool");

  if (tools.length === 0) return null;

  return tools.reduce((best, curr) =>
    TIER_ORDER[curr.tier] > TIER_ORDER[best.tier] ? curr : best
  );
}

/**
 * Calculates the combat multiplier for a weapon (e.g. +0.35 for a rare weapon).
 */
export function calculateWeaponBonus(weapon: EngineItem | null): number {
  if (!weapon || weapon.category !== "weapon") return 0;
  return WEAPON_TIER_BUFFS[weapon.tier] ?? 0;
}

/**
 * Calculates damage mitigation percentage for equipped armor (e.g. 0.35 for rare armor).
 */
export function calculateArmorMitigation(items: readonly (EngineItem | string)[]): number {
  const bestArmor = getBestArmor(items);
  if (!bestArmor) return 0;
  return ARMOR_TIER_MITIGATION[bestArmor.tier] ?? 0;
}

/**
 * Calculates tactical combat roll bonus for equipped tools (e.g. +0.15 for uncommon tool).
 */
export function calculateToolBonus(items: readonly (EngineItem | string)[]): number {
  const bestTool = getBestTool(items);
  if (!bestTool) return 0;
  return TOOL_TIER_BUFFS[bestTool.tier] ?? 0;
}

/**
 * Evaluates the biometric recovery deltas (Survival + Sanity) for a consumable item.
 */
export function evaluateConsumableRecovery(item: EngineItem): {
  survivalDelta: number;
  sanityDelta: number;
} {
  if (item.category === "medical") {
    return MEDICAL_TIER_RECOVERY[item.tier] ?? { survivalDelta: 20, sanityDelta: 0 };
  }

  if (item.category === "sustenance") {
    return SUSTENANCE_TIER_RECOVERY[item.tier] ?? { survivalDelta: 15, sanityDelta: 10 };
  }

  return { survivalDelta: 0, sanityDelta: 0 };
}
