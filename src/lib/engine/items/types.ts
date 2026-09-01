/**
 * Hunger Games AI — Item Domain Types
 * Strict TypeScript types for dynamic items, tiers, and lifecycle states.
 */

export type ItemCategory =
  | "weapon"
  | "armor"
  | "medical"
  | "sustenance"
  | "tool";

export type ItemTier = "common" | "uncommon" | "rare" | "legendary";

export type ItemLifecycleState =
  | "contested"
  | "claimed"
  | "stolen"
  | "destroyed"
  | "lost"
  | "consumed"
  | "dropped";

export interface EngineItem {
  id: string;
  name: string;
  category: ItemCategory;
  tier: ItemTier;
  durability?: number; // Optional remaining uses for consumables/tools
}
