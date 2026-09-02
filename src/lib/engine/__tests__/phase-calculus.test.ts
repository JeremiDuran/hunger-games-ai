import { describe, it, expect } from "vitest";
import { createPRNG } from "../prng";
import { EngineTribute } from "../types";
import { createInitialBiometrics } from "../biometrics";
import { EngineItem } from "../items/types";
import {
  resolveBloodbathHornClash,
  resolveBloodbathCareerSweep,
  resolveDaySkirmish,
  resolveNightAmbush,
  resolveNightExposure,
  resolveFeastDuel,
  resolveArenaHazardAoE,
  resolveMuttationSwarm,
} from "../combat/phase-calculus";

function createMockTribute(id: string, district: number, overrides: Partial<EngineTribute> = {}): EngineTribute {
  return {
    id,
    gameId: "game-test-1",
    name: `Tribute ${id}`,
    district,
    gender: "male",
    personality: "Determined",
    physicalAspect: "Athletic",
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

const mockSword: EngineItem = {
  id: "item-sword-1",
  name: "Glacial Broadsword",
  category: "weapon",
  tier: "rare",
};

const mockMedkit: EngineItem = {
  id: "item-medkit-1",
  name: "Capitol Trauma Kit",
  category: "medical",
  tier: "legendary",
  durability: 1,
};

describe("Phase-Specific Combat & Event Calculus", () => {
  describe("1. Bloodbath Horn Rush & Career Sweep", () => {
    it("equips contested weapon onto victor during horn clash and applies lethal damage", () => {
      const prng = createPRNG(12345);
      const career = createMockTribute("t-career", 1, {
        biometrics: { survival: 50, sanity: 50, physicalTag: "unscathed", mentalTag: "resolute" },
      });
      const weakling = createMockTribute("t-weak", 12, {
        biometrics: { survival: 40, sanity: 30, physicalTag: "scratched", mentalTag: "anxious" },
      });

      const result = resolveBloodbathHornClash(career, weakling, mockSword, {
        prng,
        lethality: "balanced",
      });

      expect(result.victorId).toBeDefined();
      expect(result.updatedVictor.inventory.some((i) => typeof i === "string" ? i === mockSword.name : i.name === mockSword.name)).toBe(true);
      expect(result.stateDeltas[result.victorId].itemsGained).toContain(mockSword.name);
      // Loser must have taken significant damage from the weapon strike
      expect(result.updatedLoser.biometrics.survival).toBeLessThanOrEqual(20);
    });

    it("resolves career sweep ambush against unequipped target", () => {
      const prng = createPRNG(999);
      const armedHunter = createMockTribute("t-cato", 2, {
        inventory: [mockSword],
      });
      const fleer = createMockTribute("t-fleer", 8);

      const result = resolveBloodbathCareerSweep(armedHunter, fleer, {
        prng,
        lethality: "high_bloodbath",
      });

      expect(result.victorId).toBeDefined();
      expect(result.stateDeltas[result.victorId]).toBeDefined();
      expect(result.stateDeltas[result.loserId]).toBeDefined();
    });
  });

  describe("2. Night Ambush & Exposure", () => {
    it("applies ambush surprise bonus on sleeping target during night ambush", () => {
      const prng = createPRNG(42);
      const assassin = createMockTribute("t-assassin", 2, { inventory: [mockSword] });
      const sleeper = createMockTribute("t-sleeper", 9);

      const result = resolveNightAmbush(assassin, sleeper, {
        prng,
        lethality: "balanced",
      });

      expect(result.victorId).toBe(assassin.id);
      expect(result.stateDeltas[sleeper.id].survivalDelta).toBeLessThan(0);
    });

    it("evaluates exposure damage for lone uninsulated tributes and camp recovery for allies", () => {
      const prng = createPRNG(77);
      const loneTribute = createMockTribute("t-lone", 10);
      const alliedTribute = createMockTribute("t-ally", 11);

      const loneResult = resolveNightExposure(loneTribute, { prng, isCampedWithAllies: false });
      const allyResult = resolveNightExposure(alliedTribute, { prng, isCampedWithAllies: true });

      expect(loneResult.stateDelta.survivalDelta).toBeLessThan(0);
      expect(allyResult.stateDelta.sanityDelta).toBeGreaterThan(0);
    });
  });

  describe("3. Feast Duel & District Backpacks", () => {
    it("claims backpack and immediately consumes medical supplies if victor is injured", () => {
      const prng = createPRNG(555);
      const injuredFighter = createMockTribute("t-fighter", 11, {
        biometrics: { survival: 35, sanity: 50, physicalTag: "wounded", mentalTag: "composed" },
      });
      const rival = createMockTribute("t-rival", 4);

      const result = resolveFeastDuel(injuredFighter, rival, mockMedkit, {
        prng,
        lethality: "balanced",
      });

      expect(result.victorId).toBeDefined();
      expect(result.claimedBackpackItem.name).toBe(mockMedkit.name);
      // If injured fighter won, medkit should be consumed to heal survival
      if (result.victorId === injuredFighter.id) {
        expect(result.updatedVictor.biometrics.survival).toBeGreaterThan(35);
      }
    });
  });

  describe("4. Arena Hazard AoE & Muttation Swarm", () => {
    it("applies AoE damage to multiple tributes with agility mitigation", () => {
      const prng = createPRNG(888);
      const t1 = createMockTribute("t1", 1, { biometrics: { survival: 80, sanity: 70, physicalTag: "unscathed", mentalTag: "resolute" } });
      const t2 = createMockTribute("t2", 12, { biometrics: { survival: 30, sanity: 30, physicalTag: "wounded", mentalTag: "anxious" } });

      const result = resolveArenaHazardAoE([t1, t2], { name: "Volcanic Lava Wall", description: "Lava surge" }, { prng });

      expect(result.updatedTributes.size).toBe(2);
      expect(result.stateDeltas["t1"].survivalDelta).toBeLessThan(0);
      expect(result.stateDeltas["t2"].survivalDelta).toBeLessThan(0);
    });

    it("scales muttation swarm power based on tribute group size", () => {
      const prng = createPRNG(333);
      const tributes = [createMockTribute("t1", 1), createMockTribute("t2", 2)];

      const result = resolveMuttationSwarm(tributes, { name: "Tracker Jackers", threatLevel: "lethal" }, { prng });

      expect(result.updatedTributes.size).toBe(2);
      expect(result.narrativeNotes).toContain("Tracker Jackers");
    });
  });
});
