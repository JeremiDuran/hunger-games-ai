import { describe, it, expect } from "vitest";
import { createPRNG } from "../prng";
import { CataclysmResolver, NpcOverloadResolver } from "../phases/special";
import { EngineTribute, EngineGameSettings } from "../types";
import { createInitialBiometrics } from "../biometrics";
import { DEFAULT_RULES_STATE } from "@/lib/schemas/setup";
import { EngineItem } from "../items/types";

function createMockTribute(id: string, district: number, overrides: Partial<EngineTribute> = {}): EngineTribute {
  return {
    id,
    gameId: "game-test-1",
    name: `Tribute ${id}`,
    district,
    gender: "male",
    personality: "Survivor",
    physicalAspect: "Tough",
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

describe("Special Interstitial Phase Resolvers (Cataclysm, Generic NPC Overload)", () => {
  const defaultSettings: EngineGameSettings = {
    ...DEFAULT_RULES_STATE,
    enableBloodbath: true,
    enableMuttations: true,
    enableDisasters: true,
    enableSponsorDrops: true,
  };

  describe("NpcOverloadResolver", () => {
    const resolver = new NpcOverloadResolver();

    it("guarantees that 100% of encounters in this phase feature an NPC combatant", () => {
      const prng = createPRNG(777);
      const tributes = [
        createMockTribute("t1", 1),
        createMockTribute("t2", 2),
        createMockTribute("t3", 3),
        createMockTribute("t4", 4),
      ];
      const allMap = new Map(tributes.map((t) => [t.id, t]));

      const result = resolver.resolvePhase({
        gameId: "game-1",
        dayNumber: 2,
        phaseType: "npc_overload",
        phaseOrder: 4,
        aliveTributes: tributes,
        allTributes: allMap,
        alliances: new Map(),
        settings: defaultSettings,
        prng,
        arenaName: "Arena",
        arenaDescription: "Dangerous woods.",
      });

      expect(result.events.length).toBeGreaterThan(0);
      for (const event of result.events) {
        expect(event.eventCategory).toBe("mutt");
        expect(event.thematicContext?.npcName).toBeDefined();
      }
    });
  });

  describe("CataclysmResolver", () => {
    const resolver = new CataclysmResolver();

    it("inflicts arena-wide environmental hazard damage across all alive tributes", () => {
      const prng = createPRNG(888);
      const t1 = createMockTribute("t1", 1);
      const t2 = createMockTribute("t2", 2);
      const allMap = new Map([
        ["t1", t1],
        ["t2", t2],
      ]);

      const result = resolver.resolvePhase({
        gameId: "game-1",
        dayNumber: 2,
        phaseType: "cataclysm",
        phaseOrder: 4,
        aliveTributes: [t1, t2],
        allTributes: allMap,
        alliances: new Map(),
        settings: defaultSettings,
        prng,
        arenaName: "Tidal Arena",
        arenaDescription: "Tidal ocean with clockwork sectors.",
      });

      const up1 = result.updatedTributes.get("t1")!;
      const up2 = result.updatedTributes.get("t2")!;

      expect(up1.biometrics.survival).toBeLessThan(50);
      expect(up2.biometrics.survival).toBeLessThan(50);
    });

    it("mitigates cataclysm damage when tributes possess armor and tool gear", () => {
      const prng = createPRNG(444);
      const armor: EngineItem = {
        id: "a1",
        name: "Insulated Jacket",
        category: "armor",
        tier: "rare",
      };
      const tool: EngineItem = {
        id: "tool1",
        name: "Climbing Rope",
        category: "tool",
        tier: "rare",
      };

      const gearedTribute = createMockTribute("geared", 1, {
        inventory: [armor, tool],
      });
      const ungearedTribute = createMockTribute("ungeared", 2, {
        inventory: [],
      });

      const allMap = new Map([
        ["geared", gearedTribute],
        ["ungeared", ungearedTribute],
      ]);

      const result = resolver.resolvePhase({
        gameId: "game-1",
        dayNumber: 2,
        phaseType: "cataclysm",
        phaseOrder: 4,
        aliveTributes: [gearedTribute, ungearedTribute],
        allTributes: allMap,
        alliances: new Map(),
        settings: defaultSettings,
        prng,
        arenaName: "Tidal Arena",
        arenaDescription: "Tidal ocean.",
      });

      const upGeared = result.updatedTributes.get("geared")!;
      const upUngeared = result.updatedTributes.get("ungeared")!;

      const gearedDamage = 50 - upGeared.biometrics.survival;
      const ungearedDamage = 50 - upUngeared.biometrics.survival;

      expect(gearedDamage).toBeLessThan(ungearedDamage);
    });
  });
});
