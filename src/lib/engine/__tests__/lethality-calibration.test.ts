import { describe, it, expect } from "vitest";
import { createPRNG } from "../prng";
import { resolve1v1Clash } from "../combat/calculus";
import { EngineTribute } from "../types";
import { createInitialBiometrics } from "../biometrics";
import { CombatLethality } from "@/types/setup";

function createMockTribute(id: string, overrides: Partial<EngineTribute> = {}): EngineTribute {
  return {
    id,
    gameId: "game-test-1",
    name: `Tribute ${id}`,
    district: 1,
    gender: "male",
    personality: "Warrior",
    physicalAspect: "Prime",
    avatarUrl: null,
    status: "alive",
    killCount: 0,
    biometrics: createInitialBiometrics(),
    inventory: [],
    deathPhaseId: null,
    placement: null,
    ...overrides,
  };
}

describe("Combat Math & Lethality Modifier Calibration (Monte Carlo Simulations)", () => {
  it("statistically scales mortality: high_bloodbath > balanced > gritty_survival", () => {
    const totalSimulations = 300;

    const countFatalities = (lethality: CombatLethality): number => {
      let fatalCount = 0;
      for (let seed = 1; seed <= totalSimulations; seed++) {
        const prng = createPRNG(seed);
        const t1 = createMockTribute("t1", {
          biometrics: { survival: 40, sanity: 50, physicalTag: "wounded", mentalTag: "composed" },
        });
        const t2 = createMockTribute("t2", {
          biometrics: { survival: 40, sanity: 50, physicalTag: "wounded", mentalTag: "composed" },
        });

        const result = resolve1v1Clash(t1, t2, { prng, lethality });
        if (result.isFatal) {
          fatalCount++;
        }
      }
      return fatalCount;
    };

    const highBloodbathFatalities = countFatalities("high_bloodbath");
    const balancedFatalities = countFatalities("balanced");
    const grittySurvivalFatalities = countFatalities("gritty_survival");

    expect(highBloodbathFatalities).toBeGreaterThan(balancedFatalities);
    expect(balancedFatalities).toBeGreaterThan(grittySurvivalFatalities);
  });

  it("strictly preserves the mathematical invariant that survival & sanity remain in [0, 100]", () => {
    const runs = 200;
    for (let seed = 1; seed <= runs; seed++) {
      const prng = createPRNG(seed);
      const t1 = createMockTribute("t1", {
        biometrics: { survival: prng.nextInt(1, 100), sanity: prng.nextInt(1, 100), physicalTag: "unscathed", mentalTag: "composed" },
      });
      const t2 = createMockTribute("t2", {
        biometrics: { survival: prng.nextInt(1, 100), sanity: prng.nextInt(1, 100), physicalTag: "unscathed", mentalTag: "composed" },
      });

      const result = resolve1v1Clash(t1, t2, {
        prng,
        lethality: prng.pickOne(["high_bloodbath", "balanced", "gritty_survival"]),
      });

      const victSurv = result.updatedVictor.biometrics.survival;
      const victSan = result.updatedVictor.biometrics.sanity;
      const losSurv = result.updatedLoser.biometrics.survival;
      const losSan = result.updatedLoser.biometrics.sanity;

      expect(victSurv).toBeGreaterThanOrEqual(0);
      expect(victSurv).toBeLessThanOrEqual(100);
      expect(victSan).toBeGreaterThanOrEqual(0);
      expect(victSan).toBeLessThanOrEqual(100);

      expect(losSurv).toBeGreaterThanOrEqual(0);
      expect(losSurv).toBeLessThanOrEqual(100);
      expect(losSan).toBeGreaterThanOrEqual(0);
      expect(losSan).toBeLessThanOrEqual(100);

      expect(Number.isNaN(victSurv)).toBe(false);
      expect(Number.isNaN(losSurv)).toBe(false);
    }
  });
});
