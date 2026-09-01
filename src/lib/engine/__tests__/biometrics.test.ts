import { describe, it, expect } from "vitest";
import {
  clampBiometric,
  evaluatePhysicalTag,
  evaluateMentalTag,
  createInitialBiometrics,
  applyBiometricDelta,
  isTributeFatal,
  isTributeCriticallyInjured,
  isTributeParanoid,
  isTributeManic,
  isTributeTacticallyResolute,
} from "../biometrics";
import { EngineTribute } from "../types";

describe("Biometric State Machine & Tag Evaluator", () => {
  describe("clampBiometric", () => {
    it("clamps values below 0 to 0", () => {
      expect(clampBiometric(-10)).toBe(0);
      expect(clampBiometric(-0.1)).toBe(0);
    });

    it("clamps values above 100 to 100", () => {
      expect(clampBiometric(110)).toBe(100);
      expect(clampBiometric(100.5)).toBe(100);
    });

    it("preserves valid values between 0 and 100 with 1 decimal precision", () => {
      expect(clampBiometric(50)).toBe(50);
      expect(clampBiometric(72.34)).toBe(72.3);
      expect(clampBiometric(72.36)).toBe(72.4);
    });

    it("returns baseline 50 for NaN", () => {
      expect(clampBiometric(NaN)).toBe(50);
    });
  });

  describe("evaluatePhysicalTag", () => {
    it("returns 'fatal' for survival <= 0", () => {
      expect(evaluatePhysicalTag(0)).toBe("fatal");
      expect(evaluatePhysicalTag(-5)).toBe("fatal");
    });

    it("prioritizes environmental flags when survival > 0", () => {
      expect(evaluatePhysicalTag(85, { isPoisoned: true })).toBe("poisoned");
      expect(evaluatePhysicalTag(60, { isFreezing: true })).toBe("freezing");
      expect(evaluatePhysicalTag(40, { isStarving: true })).toBe("starving");
    });

    it("still returns 'fatal' if survival <= 0 even with environmental flags", () => {
      expect(evaluatePhysicalTag(0, { isPoisoned: true })).toBe("fatal");
    });

    it("maps survival tiers accurately to standard tags", () => {
      // 80..100 -> unscathed
      expect(evaluatePhysicalTag(100)).toBe("unscathed");
      expect(evaluatePhysicalTag(80)).toBe("unscathed");

      // 55..79 -> scratched
      expect(evaluatePhysicalTag(79.9)).toBe("scratched");
      expect(evaluatePhysicalTag(55)).toBe("scratched");

      // 30..54 -> wounded
      expect(evaluatePhysicalTag(54.9)).toBe("wounded");
      expect(evaluatePhysicalTag(30)).toBe("wounded");

      // 1..29 -> critically_injured
      expect(evaluatePhysicalTag(29.9)).toBe("critically_injured");
      expect(evaluatePhysicalTag(1)).toBe("critically_injured");
    });
  });

  describe("evaluateMentalTag", () => {
    it("maps sanity tiers accurately to qualitative psychological tags", () => {
      // 80..100 -> resolute
      expect(evaluateMentalTag(100)).toBe("resolute");
      expect(evaluateMentalTag(80)).toBe("resolute");

      // 55..79 -> composed
      expect(evaluateMentalTag(79.9)).toBe("composed");
      expect(evaluateMentalTag(55)).toBe("composed");

      // 35..54 -> anxious
      expect(evaluateMentalTag(54.9)).toBe("anxious");
      expect(evaluateMentalTag(35)).toBe("anxious");

      // 15..34 -> paranoid
      expect(evaluateMentalTag(34.9)).toBe("paranoid");
      expect(evaluateMentalTag(15)).toBe("paranoid");

      // 0..14 -> manic
      expect(evaluateMentalTag(14.9)).toBe("manic");
      expect(evaluateMentalTag(0)).toBe("manic");
    });
  });

  describe("createInitialBiometrics", () => {
    it("initializes tribute entering arena at 50/50 baseline", () => {
      const biometrics = createInitialBiometrics();
      expect(biometrics.survival).toBe(50);
      expect(biometrics.sanity).toBe(50);
      expect(biometrics.physicalTag).toBe("unscathed");
      expect(biometrics.mentalTag).toBe("composed");
    });
  });

  describe("applyBiometricDelta", () => {
    const mockTribute: EngineTribute = {
      id: "tribute-1",
      gameId: "game-1",
      name: "Katniss Everdeen",
      district: 12,
      gender: "female",
      personality: "Resourceful archer",
      physicalAspect: "Braided hair",
      avatarUrl: null,
      status: "alive",
      killCount: 0,
      biometrics: {
        survival: 50,
        sanity: 50,
        physicalTag: "wounded",
        mentalTag: "composed",
      },
      inventory: ["bow", "arrows"],
      deathPhaseId: null,
      placement: null,
    };

    it("applies positive survival and sanity deltas correctly", () => {
      const updated = applyBiometricDelta(mockTribute, {
        survivalDelta: 35, // 50 + 35 = 85 (unscathed)
        sanityDelta: 35,   // 50 + 35 = 85 (resolute)
      });

      expect(updated.biometrics.survival).toBe(85);
      expect(updated.biometrics.sanity).toBe(85);
      expect(updated.biometrics.physicalTag).toBe("unscathed");
      expect(updated.biometrics.mentalTag).toBe("resolute");
      expect(updated.status).toBe("alive");
    });

    it("applies negative damage deltas and transitions to dead status when survival reaches 0", () => {
      const updated = applyBiometricDelta(mockTribute, {
        survivalDelta: -60, // 50 - 60 = -10 -> clamped 0 (fatal)
        sanityDelta: -40,   // 50 - 40 = 10 (manic)
      });

      expect(updated.biometrics.survival).toBe(0);
      expect(updated.biometrics.physicalTag).toBe("fatal");
      expect(updated.status).toBe("dead");
    });

    it("supports manual override tags (e.g. specific lore wounds)", () => {
      const updated = applyBiometricDelta(mockTribute, {
        survivalDelta: -10,
        overridePhysicalTag: "poisoned",
      });

      expect(updated.biometrics.survival).toBe(40);
      expect(updated.biometrics.physicalTag).toBe("poisoned");
    });

    it("does not mutate the original tribute object", () => {
      const originalSurvival = mockTribute.biometrics.survival;
      applyBiometricDelta(mockTribute, { survivalDelta: 20 });
      expect(mockTribute.biometrics.survival).toBe(originalSurvival);
    });
  });

  describe("Behavioral Condition Predicates", () => {
    it("identifies fatal condition (survival <= 0)", () => {
      expect(isTributeFatal(0)).toBe(true);
      expect(isTributeFatal(-5)).toBe(true);
      expect(isTributeFatal(1)).toBe(false);
    });

    it("identifies critical injury (0 < survival < 30)", () => {
      expect(isTributeCriticallyInjured(25)).toBe(true);
      expect(isTributeCriticallyInjured(0)).toBe(false);
      expect(isTributeCriticallyInjured(35)).toBe(false);
    });

    it("identifies paranoid state for betrayal risk (sanity < 25)", () => {
      expect(isTributeParanoid(24.9)).toBe(true);
      expect(isTributeParanoid(25)).toBe(false);
      expect(isTributeParanoid(50)).toBe(false);
    });

    it("identifies manic state (sanity < 15)", () => {
      expect(isTributeManic(14)).toBe(true);
      expect(isTributeManic(15)).toBe(false);
    });

    it("identifies tactically resolute state (sanity >= 75)", () => {
      expect(isTributeTacticallyResolute(75)).toBe(true);
      expect(isTributeTacticallyResolute(80)).toBe(true);
      expect(isTributeTacticallyResolute(74.9)).toBe(false);
    });
  });
});
