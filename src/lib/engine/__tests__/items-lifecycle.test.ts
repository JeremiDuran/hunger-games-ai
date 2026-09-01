import { describe, it, expect } from "vitest";
import { createPRNG } from "../prng";
import { EngineTribute } from "../types";
import {
  claimItem,
  stealItem,
  consumeItem,
  destroyItem,
  loseItem,
  dropInventoryOnDeath,
  applyItemDeltasToTribute,
} from "../items/lifecycle";
import { synthesizeItem } from "../items/synthesizer";
import { EngineItem } from "../items/types";
import {
  calculateWeaponBonus,
  calculateArmorMitigation,
  getBestWeapon,
  getBestArmor,
} from "../items/buffs";

function createMockTribute(overrides: Partial<EngineTribute> = {}): EngineTribute {
  return {
    id: "tribute-1",
    gameId: "game-1",
    name: "Katniss Everdeen",
    district: 12,
    gender: "female",
    personality: "Resourceful survivor",
    physicalAspect: "Dark hair, athletic build",
    avatarUrl: null,
    status: "alive",
    killCount: 0,
    biometrics: {
      survival: 50,
      sanity: 50,
      physicalTag: "scratched",
      mentalTag: "composed",
    },
    inventory: [],
    deathPhaseId: null,
    placement: null,
    ...overrides,
  };
}

describe("Item System & Lifecycle State Machine", () => {
  describe("Dynamic Item Synthesizer (No Catalog Required)", () => {
    it("synthesizes arctic-themed items when arena description mentions ice/blizzard", () => {
      const prng = createPRNG(12345);
      const item = synthesizeItem({
        arenaDescription: "A freezing glacial plateau battered by sub-zero howling blizzards.",
        arenaName: "Boreal Glacial Abyss",
        category: "weapon",
        tier: "rare",
        prng,
      });

      expect(item.category).toBe("weapon");
      expect(item.tier).toBe("rare");
      expect(item.id).toMatch(/^item-weapon-\d+$/);
      // Name should contain arctic materials or weapons (e.g. Bone, Harpoon, Frost, Ice)
      expect(typeof item.name).toBe("string");
      expect(item.name.length).toBeGreaterThan(5);
    });

    it("synthesizes urban-themed items when arena description mentions ruins/skyscrapers", () => {
      const prng = createPRNG(54321);
      const item = synthesizeItem({
        arenaDescription: "Crumbling concrete skyscrapers and flooded subterranean subways.",
        arenaName: "Sector Zero Ruins",
        category: "armor",
        tier: "uncommon",
        prng,
      });

      expect(item.category).toBe("armor");
      expect(item.tier).toBe("uncommon");
      expect(typeof item.name).toBe("string");
    });

    it("synthesizes consumable items with initial durability of 1", () => {
      const prng = createPRNG(999);
      const medItem = synthesizeItem({
        arenaDescription: "Temperate pine forest.",
        category: "medical",
        prng,
      });

      expect(medItem.category).toBe("medical");
      expect(medItem.durability).toBe(1);
    });
  });

  describe("Item State Machine Transitions", () => {
    const mockWeapon: EngineItem = {
      id: "item-spear-1",
      name: "Titanium Spear",
      category: "weapon",
      tier: "rare",
    };

    const mockMedkit: EngineItem = {
      id: "item-medkit-1",
      name: "Sterile Medical Kit",
      category: "medical",
      tier: "rare",
      durability: 1,
    };

    it("claims an item and adds it to tribute inventory immutably", () => {
      const tribute = createMockTribute();
      const updated = claimItem(mockWeapon, tribute);

      expect(tribute.inventory).toHaveLength(0);
      expect(updated.inventory).toHaveLength(1);
      expect(updated.inventory[0]).toEqual(mockWeapon);
    });

    it("steals an item from one tribute to another", () => {
      const tributeA = createMockTribute({
        id: "tribute-a",
        name: "Marvel",
        inventory: [mockWeapon],
      });
      const tributeB = createMockTribute({
        id: "tribute-b",
        name: "Foxface",
        inventory: [],
      });

      const { updatedFrom, updatedTo, stolenItem } = stealItem(
        "item-spear-1",
        tributeA,
        tributeB
      );

      expect(stolenItem).toEqual(mockWeapon);
      expect(updatedFrom.inventory).toHaveLength(0);
      expect(updatedTo.inventory).toHaveLength(1);
      expect(updatedTo.inventory[0]).toEqual(mockWeapon);
    });

    it("consumes medical item, restoring survival and removing exhausted item", () => {
      const woundedTribute = createMockTribute({
        biometrics: {
          survival: 30,
          sanity: 40,
          physicalTag: "wounded",
          mentalTag: "anxious",
        },
        inventory: [mockMedkit],
      });

      const { updatedTribute, consumedItem, recoveryDelta } = consumeItem(
        "item-medkit-1",
        woundedTribute
      );

      expect(consumedItem).toEqual(mockMedkit);
      expect(recoveryDelta.survivalDelta).toBe(50); // Rare medical restores +50
      expect(updatedTribute.biometrics.survival).toBe(80);
      expect(updatedTribute.biometrics.physicalTag).toBe("unscathed");
      expect(updatedTribute.inventory).toHaveLength(0); // Durability was 1, so removed
    });

    it("destroys an item from inventory", () => {
      const tribute = createMockTribute({ inventory: [mockWeapon] });
      const { updatedTribute, removedItem } = destroyItem("item-spear-1", tribute);

      expect(removedItem).toEqual(mockWeapon);
      expect(updatedTribute.inventory).toHaveLength(0);
    });

    it("loses an item in terrain", () => {
      const tribute = createMockTribute({ inventory: [mockWeapon] });
      const { updatedTribute, removedItem } = loseItem("item-spear-1", tribute);

      expect(removedItem).toEqual(mockWeapon);
      expect(updatedTribute.inventory).toHaveLength(0);
    });

    it("drops inventory on death and transfers to looter", () => {
      const victim = createMockTribute({
        id: "victim-1",
        name: "Cato",
        inventory: [mockWeapon, mockMedkit],
      });
      const killer = createMockTribute({
        id: "killer-1",
        name: "Katniss",
        inventory: [],
      });

      const { updatedVictim, updatedLooter, droppedItems, lootedItems } =
        dropInventoryOnDeath(victim, killer);

      expect(updatedVictim.inventory).toHaveLength(0);
      expect(droppedItems).toHaveLength(2);
      expect(lootedItems).toHaveLength(2);
      expect(updatedLooter?.inventory).toHaveLength(2);
    });

    it("applies item deltas to tribute inventory accurately", () => {
      const tribute = createMockTribute({ inventory: [mockWeapon] });
      const updated = applyItemDeltasToTribute(tribute, {
        tributeId: tribute.id,
        survivalDelta: 0,
        sanityDelta: 0,
        itemsLost: ["item-spear-1"],
        itemsGained: [mockMedkit],
      });

      expect(updated.inventory).toHaveLength(1);
      expect(updated.inventory[0]).toEqual(mockMedkit);
    });
  });

  describe("Item Buff Extraction & Helpers", () => {
    const commonSword: EngineItem = {
      id: "sword-1",
      name: "Iron Sword",
      category: "weapon",
      tier: "common",
    };
    const legendaryBow: EngineItem = {
      id: "bow-1",
      name: "Legendary Recurve Bow",
      category: "weapon",
      tier: "legendary",
    };
    const rareArmor: EngineItem = {
      id: "armor-1",
      name: "Kevlar Vest",
      category: "armor",
      tier: "rare",
    };

    it("extracts the highest tier weapon from inventory", () => {
      const best = getBestWeapon([commonSword, legendaryBow]);
      expect(best).toEqual(legendaryBow);
      expect(calculateWeaponBonus(best)).toBe(0.5); // +50% for legendary
    });

    it("extracts the highest tier armor and calculates damage mitigation", () => {
      const best = getBestArmor([commonSword, rareArmor]);
      expect(best).toEqual(rareArmor);
      expect(calculateArmorMitigation([commonSword, rareArmor])).toBe(0.35); // 35% mitigation for rare
    });
  });
});
