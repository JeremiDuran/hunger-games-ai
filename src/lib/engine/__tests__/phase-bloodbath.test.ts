import { describe, it, expect } from "vitest";
import { createPRNG } from "../prng";
import { BloodbathResolver } from "../phases/bloodbath";
import { EngineTribute, EngineGameSettings } from "../types";
import { createInitialBiometrics } from "../biometrics";
import { DEFAULT_RULES_STATE } from "@/lib/schemas/setup";

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

describe("Bloodbath Phase Resolver (Day 0 Cornucopia Clash vs Fleeing)", () => {
  const resolver = new BloodbathResolver();

  const defaultSettings: EngineGameSettings = {
    ...DEFAULT_RULES_STATE,
    enableBloodbath: true,
    enableMuttations: true,
    enableDisasters: true,
    enableSponsorDrops: true,
  };

  it("ensures fleers suffer 0 damage and escape safely into the perimeter", () => {
    const prng = createPRNG(42);
    // Scared tribute with low sanity (<35)
    const scaredTribute = createMockTribute("t-scared", 12, {
      biometrics: {
        survival: 50,
        sanity: 20, // Scared
        physicalTag: "unscathed",
        mentalTag: "paranoid",
      },
    });

    const allTributes = new Map<string, EngineTribute>([
      [scaredTribute.id, scaredTribute],
    ]);

    const result = resolver.resolvePhase({
      gameId: "game-1",
      dayNumber: 0,
      phaseType: "bloodbath",
      phaseOrder: 1,
      aliveTributes: [scaredTribute],
      allTributes,
      alliances: new Map(),
      settings: defaultSettings,
      prng,
      arenaName: "Dense Pine Forest",
      arenaDescription: "A cold pine forest surrounded by rocky peaks.",
    });

    const updated = result.updatedTributes.get(scaredTribute.id)!;
    expect(updated.status).toBe("alive");
    expect(updated.biometrics.survival).toBe(50); // No physical damage
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.events[0].outcomeType).toBe("flee");
  });

  it("awards high-tier weapon loot to uncontested or victorious horn rushers", () => {
    const prng = createPRNG(1234);
    // Career tribute (District 1) rushes the horn
    const careerTribute = createMockTribute("t-career", 1);
    const allTributes = new Map<string, EngineTribute>([
      [careerTribute.id, careerTribute],
    ]);

    const result = resolver.resolvePhase({
      gameId: "game-1",
      dayNumber: 0,
      phaseType: "bloodbath",
      phaseOrder: 1,
      aliveTributes: [careerTribute],
      allTributes,
      alliances: new Map(),
      settings: defaultSettings,
      prng,
      arenaName: "Ruined City",
      arenaDescription: "Concrete skyscrapers and shattered asphalt.",
    });

    const updated = result.updatedTributes.get(careerTribute.id)!;
    expect(updated.inventory.length).toBeGreaterThan(0);
    expect(result.events[0].outcomeType).toBe("loot");
  });

  it("scales casualty rate with combat lethality across multiple simulations", () => {
    const runs = 60;
    let highCasualties = 0;
    let grittyCasualties = 0;

    for (let seed = 1; seed <= runs; seed++) {
      const tributes = Array.from({ length: 12 }, (_, i) =>
        createMockTribute(`t-${i}`, (i % 12) + 1)
      );
      const allMap = new Map(tributes.map((t) => [t.id, t]));

      const highResult = resolver.resolvePhase({
        gameId: "game-1",
        dayNumber: 0,
        phaseType: "bloodbath",
        phaseOrder: 1,
        aliveTributes: tributes,
        allTributes: allMap,
        alliances: new Map(),
        settings: { ...defaultSettings, combatLethality: "high_bloodbath" },
        prng: createPRNG(seed),
        arenaName: "Arena",
        arenaDescription: "Woodland arena.",
      });

      const grittyResult = resolver.resolvePhase({
        gameId: "game-1",
        dayNumber: 0,
        phaseType: "bloodbath",
        phaseOrder: 1,
        aliveTributes: tributes,
        allTributes: allMap,
        alliances: new Map(),
        settings: { ...defaultSettings, combatLethality: "gritty_survival" },
        prng: createPRNG(seed),
        arenaName: "Arena",
        arenaDescription: "Woodland arena.",
      });

      highCasualties += highResult.fallenTributeIds.length;
      grittyCasualties += grittyResult.fallenTributeIds.length;
    }

    expect(highCasualties).toBeGreaterThan(grittyCasualties);
  });
});
