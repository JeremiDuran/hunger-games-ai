import { describe, it, expect } from "vitest";
import { createPRNG } from "../prng";
import { DayPhaseResolver } from "../phases/day";
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
    personality: "Strategic",
    physicalAspect: "Quick",
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

describe("Day Phase Resolver (Scouting, Foraging, Skirmishes, Sponsor Drops)", () => {
  const resolver = new DayPhaseResolver();
  const defaultSettings: EngineGameSettings = {
    ...DEFAULT_RULES_STATE,
    enableBloodbath: true,
    enableMuttations: true,
    enableDisasters: true,
    enableSponsorDrops: true,
  };

  it("resolves foraging, rest, and skirmish encounters for alive tributes", () => {
    const prng = createPRNG(999);
    const tributes = [
      createMockTribute("t1", 1),
      createMockTribute("t2", 2),
      createMockTribute("t3", 3),
      createMockTribute("t4", 4),
    ];
    const allMap = new Map(tributes.map((t) => [t.id, t]));

    const result = resolver.resolvePhase({
      gameId: "game-1",
      dayNumber: 1,
      phaseType: "day",
      phaseOrder: 2,
      aliveTributes: tributes,
      allTributes: allMap,
      alliances: new Map(),
      settings: defaultSettings,
      prng,
      arenaName: "Tropical Rainforest",
      arenaDescription: "A humid rainforest with heavy canopy and rushing streams.",
    });

    expect(result.events.length).toBeGreaterThan(0);
    expect(result.updatedTributes.size).toBe(4);
  });

  it("scales sponsor drop frequency according to sponsorGenerosity setting", () => {
    const runs = 100;
    let abundanceDrops = 0;
    let famineDrops = 0;

    for (let seed = 1; seed <= runs; seed++) {
      const tribute = createMockTribute("t-solo", 12);
      const allMap = new Map([[tribute.id, tribute]]);

      const abundanceResult = resolver.resolvePhase({
        gameId: "game-1",
        dayNumber: 1,
        phaseType: "day",
        phaseOrder: 2,
        aliveTributes: [tribute],
        allTributes: allMap,
        alliances: new Map(),
        settings: {
          ...defaultSettings,
          enableSponsorDrops: true,
          sponsorGenerosity: "abundance",
        },
        prng: createPRNG(seed),
        arenaName: "Arena",
        arenaDescription: "Forest arena.",
      });

      const famineResult = resolver.resolvePhase({
        gameId: "game-1",
        dayNumber: 1,
        phaseType: "day",
        phaseOrder: 2,
        aliveTributes: [tribute],
        allTributes: allMap,
        alliances: new Map(),
        settings: {
          ...defaultSettings,
          enableSponsorDrops: true,
          sponsorGenerosity: "famine",
        },
        prng: createPRNG(seed),
        arenaName: "Arena",
        arenaDescription: "Forest arena.",
      });

      abundanceDrops += abundanceResult.events.filter((e) => e.eventCategory === "sponsor").length;
      famineDrops += famineResult.events.filter((e) => e.eventCategory === "sponsor").length;
    }

    expect(abundanceDrops).toBeGreaterThan(famineDrops);
  });
});
