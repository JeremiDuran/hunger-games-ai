import { describe, it, expect } from "vitest";
import { createPRNG } from "../prng";
import { FeastPhaseResolver } from "../phases/feast";
import { EngineTribute, EngineGameSettings } from "../types";
import { createInitialBiometrics } from "../biometrics";
import { DEFAULT_RULES_STATE } from "@/lib/schemas/setup";

function createMockTribute(id: string, district: number, overrides: Partial<EngineTribute> = {}): EngineTribute {
  return {
    id,
    gameId: "game-test-1",
    name: `Tribute ${id}`,
    district,
    gender: "female",
    personality: "Fierce",
    physicalAspect: "Lean",
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

describe("Feast Phase Resolver (Cornucopia Supply Call)", () => {
  const resolver = new FeastPhaseResolver();
  const defaultSettings: EngineGameSettings = {
    ...DEFAULT_RULES_STATE,
    enableBloodbath: true,
    enableMuttations: true,
    enableDisasters: true,
    enableSponsorDrops: true,
    enableMidGameFeast: true,
  };

  it("heavily incentivizes desperate / critically injured tributes to attend the Feast", () => {
    let desperateAttended = 0;
    const runs = 50;

    for (let seed = 1; seed <= runs; seed++) {
      const desperateTribute = createMockTribute("desperate", 11, {
        biometrics: {
          survival: 25, // Critical need
          sanity: 50,
          physicalTag: "critically_injured",
          mentalTag: "composed",
        },
      });

      const allMap = new Map([[desperateTribute.id, desperateTribute]]);

      const result = resolver.resolvePhase({
        gameId: "game-1",
        dayNumber: 3,
        phaseType: "feast",
        phaseOrder: 5,
        aliveTributes: [desperateTribute],
        allTributes: allMap,
        alliances: new Map(),
        settings: defaultSettings,
        prng: createPRNG(seed),
        arenaName: "Arena",
        arenaDescription: "Woodland arena.",
      });

      // If attended uncontested, outcomeType is "loot"
      if (result.events[0]?.outcomeType === "loot") {
        desperateAttended++;
      }
    }

    // Attendance probability for desperate tributes is 85% -> expect >= 70% in runs
    expect(desperateAttended / runs).toBeGreaterThan(0.7);
  });

  it("safely protects abstainers who choose not to attend the Cornucopia Feast", () => {
    const prng = createPRNG(999);
    // Healthy tribute
    const healthyTribute = createMockTribute("healthy", 2, {
      biometrics: {
        survival: 95,
        sanity: 80,
        physicalTag: "unscathed",
        mentalTag: "resolute",
      },
    });

    const allMap = new Map([[healthyTribute.id, healthyTribute]]);

    const result = resolver.resolvePhase({
      gameId: "game-1",
      dayNumber: 3,
      phaseType: "feast",
      phaseOrder: 5,
      aliveTributes: [healthyTribute],
      allTributes: allMap,
      alliances: new Map(),
      settings: defaultSettings,
      prng,
      arenaName: "Arena",
      arenaDescription: "Woodland arena.",
    });

    const updated = result.updatedTributes.get(healthyTribute.id)!;
    expect(updated.status).toBe("alive");
  });
});
