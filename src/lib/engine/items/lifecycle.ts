/**
 * Hunger Games AI — Item State Machine & Inventory Lifecycle Manager
 * Pure functions managing inventory transitions (claim, steal, consume, destroy, lose, drop).
 */

import { EngineTribute, TributeStateDelta } from "../types";
import { applyBiometricDelta } from "../biometrics";
import { EngineItem } from "./types";
import { normalizeItems, evaluateConsumableRecovery, isEngineItem } from "./buffs";

// ==========================================
// 1. Core State Machine Transitions
// ==========================================

/**
 * Claims a newly spawned or discovered item into a tribute's inventory.
 */
export function claimItem(item: EngineItem, tribute: EngineTribute): EngineTribute {
  const currentItems = normalizeItems(tribute.inventory);
  return {
    ...tribute,
    inventory: [...currentItems, item],
  };
}

export interface StealItemResult {
  updatedFrom: EngineTribute;
  updatedTo: EngineTribute;
  stolenItem: EngineItem | null;
}

/**
 * Transfers an item from one tribute's inventory to another (sneak theft or disarm).
 */
export function stealItem(
  itemId: string,
  fromTribute: EngineTribute,
  toTribute: EngineTribute
): StealItemResult {
  const fromItems = normalizeItems(fromTribute.inventory);
  const toItems = normalizeItems(toTribute.inventory);

  const itemIndex = fromItems.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) {
    return {
      updatedFrom: fromTribute,
      updatedTo: toTribute,
      stolenItem: null,
    };
  }

  const stolenItem = fromItems[itemIndex];
  const newFromItems = fromItems.filter((_, idx) => idx !== itemIndex);
  const newToItems = [...toItems, stolenItem];

  return {
    updatedFrom: { ...fromTribute, inventory: newFromItems },
    updatedTo: { ...toTribute, inventory: newToItems },
    stolenItem,
  };
}

export interface ConsumeItemResult {
  updatedTribute: EngineTribute;
  consumedItem: EngineItem | null;
  recoveryDelta: { survivalDelta: number; sanityDelta: number };
}

/**
 * Consumes a medical or sustenance item, applying biometric recovery and decrementing uses.
 */
export function consumeItem(itemId: string, tribute: EngineTribute): ConsumeItemResult {
  const currentItems = normalizeItems(tribute.inventory);
  const itemIndex = currentItems.findIndex((i) => i.id === itemId);

  if (itemIndex === -1) {
    return {
      updatedTribute: tribute,
      consumedItem: null,
      recoveryDelta: { survivalDelta: 0, sanityDelta: 0 },
    };
  }

  const item = currentItems[itemIndex];
  const recoveryDelta = evaluateConsumableRecovery(item);

  // Update item durability or remove if exhausted
  const remainingDurability = (item.durability ?? 1) - 1;
  const newItems =
    remainingDurability > 0
      ? currentItems.map((i, idx) =>
          idx === itemIndex ? { ...i, durability: remainingDurability } : i
        )
      : currentItems.filter((_, idx) => idx !== itemIndex);

  // Apply healing / recovery to tribute
  const updatedTribute = applyBiometricDelta(
    { ...tribute, inventory: newItems },
    {
      survivalDelta: recoveryDelta.survivalDelta,
      sanityDelta: recoveryDelta.sanityDelta,
    }
  );

  return {
    updatedTribute,
    consumedItem: item,
    recoveryDelta,
  };
}

export interface ItemRemovalResult {
  updatedTribute: EngineTribute;
  removedItem: EngineItem | null;
}

/**
 * Destroys a weapon or gear (e.g. shattered in combat or burned).
 */
export function destroyItem(itemId: string, tribute: EngineTribute): ItemRemovalResult {
  const currentItems = normalizeItems(tribute.inventory);
  const itemIndex = currentItems.findIndex((i) => i.id === itemId);

  if (itemIndex === -1) {
    return { updatedTribute: tribute, removedItem: null };
  }

  const destroyedItem = currentItems[itemIndex];
  const newItems = currentItems.filter((_, idx) => idx !== itemIndex);

  return {
    updatedTribute: { ...tribute, inventory: newItems },
    removedItem: destroyedItem,
  };
}

/**
 * Loses an item in the environment (e.g. dropped in a ravine, river, or mud).
 */
export function loseItem(itemId: string, tribute: EngineTribute): ItemRemovalResult {
  const currentItems = normalizeItems(tribute.inventory);
  const itemIndex = currentItems.findIndex((i) => i.id === itemId);

  if (itemIndex === -1) {
    return { updatedTribute: tribute, removedItem: null };
  }

  const lostItem = currentItems[itemIndex];
  const newItems = currentItems.filter((_, idx) => idx !== itemIndex);

  return {
    updatedTribute: { ...tribute, inventory: newItems },
    removedItem: lostItem,
  };
}

export interface DeathLootResult {
  updatedVictim: EngineTribute;
  updatedLooter?: EngineTribute;
  droppedItems: EngineItem[];
  lootedItems: EngineItem[];
}

/**
 * Drops all items from a slain victim, optionally allowing a looter (killer/scavenger) to claim them.
 */
export function dropInventoryOnDeath(
  victim: EngineTribute,
  looter?: EngineTribute
): DeathLootResult {
  const droppedItems = normalizeItems(victim.inventory);
  const updatedVictim: EngineTribute = { ...victim, inventory: [] };

  if (!looter || droppedItems.length === 0) {
    return {
      updatedVictim,
      droppedItems,
      lootedItems: [],
    };
  }

  // Looter claims all dropped items
  const currentLooterItems = normalizeItems(looter.inventory);
  const updatedLooter: EngineTribute = {
    ...looter,
    inventory: [...currentLooterItems, ...droppedItems],
  };

  return {
    updatedVictim,
    updatedLooter,
    droppedItems,
    lootedItems: droppedItems,
  };
}

// ==========================================
// 2. Delta Application Helper
// ==========================================

/**
 * Applies item deltas (itemsGained, itemsLost) to a tribute's inventory.
 */
export function applyItemDeltasToTribute(
  tribute: EngineTribute,
  delta: TributeStateDelta
): EngineTribute {
  let items = normalizeItems(tribute.inventory);

  // Remove lost items by ID or Name
  if (delta.itemsLost && delta.itemsLost.length > 0) {
    const lostSet = new Set(delta.itemsLost);
    items = items.filter((i) => !lostSet.has(i.id) && !lostSet.has(i.name));
  }

  // Remove destroyed items
  if (delta.itemsDestroyed && delta.itemsDestroyed.length > 0) {
    const destroyedSet = new Set(delta.itemsDestroyed);
    items = items.filter((i) => !destroyedSet.has(i.id) && !destroyedSet.has(i.name));
  }

  // Remove consumed items
  if (delta.itemsConsumed && delta.itemsConsumed.length > 0) {
    const consumedSet = new Set(delta.itemsConsumed);
    items = items.filter((i) => !consumedSet.has(i.id) && !consumedSet.has(i.name));
  }

  // Add gained items
  if (delta.itemsGained && delta.itemsGained.length > 0) {
    for (const gained of delta.itemsGained) {
      if (isEngineItem(gained)) {
        items.push(gained);
      } else {
        items.push({
          id: `item-gained-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: String(gained),
          category: "weapon",
          tier: "common",
        });
      }
    }
  }

  return {
    ...tribute,
    inventory: items,
  };
}
