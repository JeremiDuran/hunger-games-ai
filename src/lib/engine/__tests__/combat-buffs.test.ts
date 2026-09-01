import { describe, it, expect } from "vitest";
import { createPRNG } from "../prng";
import { EngineTribute } from "../types";
import {
  calculateBaseCombatPower,
  calculateTotalCombatPower,
  resolve1v1Clash,
  resolvePvEClash,
} from "../combat/calculus";
import { EngineItem } from "../items/types";

function createMockTribute(overrides: Partial<EngineTribute> = {}): EngineTribute {
  return {
    id: "tribute-1",
    gameId: "game-1",
    name: "Tribute One",
    district: 1,
    gender: "male",
    personality: "Ruthless fighter",
    physicalAspect: "Towering stature",
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

describe("Deterministic Combat Advantage & Equipment Buff Calculus", () => {
  describe("calculateBaseCombatPower", () => {
    it("calculates baseline power accurately: (Survival * 0.6) + (Sanity * 0.4)", () => {
      // 50 * 0.6 + 50 * 0.4 = 30 + 20 = 50
      const baseline = createMockTribute({
        biometrics: {
          survival: 50,
          sanity: 50,
          physicalTag: "scratched",
          mentalTag: "composed",
        },
      });
      expect(calculateBaseCombatPower(baseline)).toBe(50);

      // 80 * 0.6 + 60 * 0.4 = 48 + 24 = 72
      const prime = createMockTribute({
        biometrics: {
          survival: 80,
          sanity: 60,
          physicalTag: "unscathed",
          mentalTag: "composed",
        },
      });
      expect(calculateBaseCombatPower(prime)).toBe(72);

      // 20 * 0.6 + 30 * 0.4 = 12 + 12 = 24
      const injured = createMockTribute({
        biometrics: {
          survival: 20,
          sanity: 30,
          physicalTag: "critically_injured",
          mentalTag: "anxious",
        },
      });
      expect(calculateBaseCombatPower(injured)).toBe(24);
    });
  });

  describe("calculateTotalCombatPower with ItemTier Buffs", () => {
    const commonKnife: EngineItem = {
      id: "w-common",
      name: "Hunting Knife",
      category: "weapon",
      tier: "common",
    };
    const rareSpear: EngineItem = {
      id: "w-rare",
      name: "Titanium Spear",
      category: "weapon",
      tier: "rare",
    };
    const legendaryBow: EngineItem = {
      id: "w-legendary",
      name: "Golden Bow",
      category: "weapon",
      tier: "legendary",
    };

    it("scales power according to weapon tiers", () => {
      const baseTribute = createMockTribute({
        biometrics: {
          survival: 50,
          sanity: 50,
          physicalTag: "unscathed",
          mentalTag: "composed",
        },
      });

      const unarmedPower = calculateTotalCombatPower(baseTribute); // 50
      const commonPower = calculateTotalCombatPower({
        ...baseTribute,
        inventory: [commonKnife],
      }); // 50 * (1 + 0.15) = 57.5
      const rarePower = calculateTotalCombatPower({
        ...baseTribute,
        inventory: [rareSpear],
      }); // 50 * (1 + 0.35) = 67.5
      const legendaryPower = calculateTotalCombatPower({
        ...baseTribute,
        inventory: [legendaryBow],
      }); // 50 * (1 + 0.50) = 75

      expect(unarmedPower).toBe(50);
      expect(commonPower).toBe(57.5);
      expect(rarePower).toBe(67.5);
      expect(legendaryPower).toBe(75);
    });

    it("applies condition penalties for critical injury", () => {
      const injuredTribute = createMockTribute({
        biometrics: {
          survival: 20,
          sanity: 50,
          physicalTag: "critically_injured",
          mentalTag: "composed",
        },
        inventory: [rareSpear],
      });

      // Base: (20*0.6 + 50*0.4) = 12 + 20 = 32
      // Weapon: 32 * 1.35 = 43.2
      // Critical Injury Penalty: 43.2 * 0.7 = 30.24 -> 30.2
      const power = calculateTotalCombatPower(injuredTribute);
      expect(power).toBe(30.2);
    });
  });

  describe("resolve1v1Clash", () => {
    const rareWeapon: EngineItem = {
      id: "weapon-1",
      name: "Obsidian Spear",
      category: "weapon",
      tier: "rare",
    };
    const rareArmor: EngineItem = {
      id: "armor-1",
      name: "Kevlar Vest",
      category: "armor",
      tier: "rare",
    };

    it("statistically favors armed tributes over unarmed tributes across seeded runs", () => {
      let armedWins = 0;
      const totalRuns = 200;

      for (let seed = 1; seed <= totalRuns; seed++) {
        const prng = createPRNG(seed);
        const armedTribute = createMockTribute({
          id: "armed",
          name: "Armed Tribute",
          inventory: [rareWeapon],
        });
        const unarmedTribute = createMockTribute({
          id: "unarmed",
          name: "Unarmed Tribute",
          inventory: [],
        });

        const result = resolve1v1Clash(armedTribute, unarmedTribute, { prng });
        if (result.victorId === "armed") {
          armedWins++;
        }
      }

      // With a Rare weapon (+35%), armed tribute should win substantially > 58% of runs
      const winRate = armedWins / totalRuns;
      expect(winRate).toBeGreaterThan(0.58);
    });

    it("mitigates damage when defender wears armor across clashes", () => {
      let totalArmoredDamage = 0;
      let totalUnarmoredDamage = 0;
      const runs = 50;

      for (let seed = 1; seed <= runs; seed++) {
        const strongAttacker = createMockTribute({
          id: "attacker",
          name: "Cato",
          biometrics: {
            survival: 90,
            sanity: 80,
            physicalTag: "unscathed",
            mentalTag: "resolute",
          },
          inventory: [rareWeapon],
        });
        const armoredDefender = createMockTribute({
          id: "defender-armored",
          name: "Peeta Armored",
          biometrics: {
            survival: 100,
            sanity: 50,
            physicalTag: "unscathed",
            mentalTag: "composed",
          },
          inventory: [rareArmor],
        });
        const unarmoredDefender = createMockTribute({
          id: "defender-unarmored",
          name: "Peeta Unarmored",
          biometrics: {
            survival: 100,
            sanity: 50,
            physicalTag: "unscathed",
            mentalTag: "composed",
          },
          inventory: [],
        });

        const armoredResult = resolve1v1Clash(strongAttacker, armoredDefender, {
          prng: createPRNG(seed),
          lethality: "gritty_survival",
        });
        const unarmoredResult = resolve1v1Clash(strongAttacker, unarmoredDefender, {
          prng: createPRNG(seed),
          lethality: "gritty_survival",
        });

        const armoredSurvival =
          armoredResult.victorId === armoredDefender.id
            ? armoredResult.updatedVictor.biometrics.survival
            : armoredResult.updatedLoser.biometrics.survival;

        const unarmoredSurvival =
          unarmoredResult.victorId === unarmoredDefender.id
            ? unarmoredResult.updatedVictor.biometrics.survival
            : unarmoredResult.updatedLoser.biometrics.survival;

        totalArmoredDamage += armoredDefender.biometrics.survival - armoredSurvival;
        totalUnarmoredDamage += unarmoredDefender.biometrics.survival - unarmoredSurvival;
      }

      expect(totalArmoredDamage).toBeLessThan(totalUnarmoredDamage);
    });

    it("loots inventory on death when a tribute is slain", () => {
      const prng = createPRNG(101);
      const strongAttacker = createMockTribute({
        id: "cato",
        name: "Cato",
        biometrics: {
          survival: 100,
          sanity: 90,
          physicalTag: "unscathed",
          mentalTag: "resolute",
        },
        inventory: [rareWeapon],
      });
      const weakVictim = createMockTribute({
        id: "weak",
        name: "Weak Tribute",
        biometrics: {
          survival: 5,
          sanity: 10,
          physicalTag: "critically_injured",
          mentalTag: "manic",
        },
        inventory: [rareArmor],
      });

      const result = resolve1v1Clash(strongAttacker, weakVictim, {
        prng,
        lethality: "high_bloodbath",
      });

      expect(result.isFatal).toBe(true);
      expect(result.updatedLoser.status).toBe("dead");
      expect(result.updatedVictor.killCount).toBe(1);
      // Winner should now hold the dead victim's armor
      const hasLootedArmor = result.updatedVictor.inventory.some(
        (i) => typeof i !== "string" && i.id === "armor-1"
      );
      expect(hasLootedArmor).toBe(true);
    });
  });

  describe("resolvePvEClash against Mutts/Hazards", () => {
    it("resolves cooperative combat against mutts deterministically", () => {
      const prng = createPRNG(777);
      const tributeA = createMockTribute({ id: "t1", name: "Katniss" });
      const tributeB = createMockTribute({ id: "t2", name: "Peeta" });

      const result = resolvePvEClash(
        [tributeA, tributeB],
        { name: "Alpha Wolf Mutt", power: 60, threatLevel: "moderate" },
        { prng }
      );

      expect(typeof result.isBeastSlain).toBe("boolean");
      expect(result.updatedTributes.size).toBe(2);
    });
  });
});
