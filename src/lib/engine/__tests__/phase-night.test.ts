import { describe, it, expect } from "vitest";
import { createPRNG } from "../prng";
import { NightPhaseResolver } from "../phases/night";
import { EngineTribute, EngineGameSettings, EngineAlliance } from "../types";
import { createInitialBiometrics } from "../biometrics";
import { DEFAULT_RULES_STATE } from "@/lib/schemas/setup";

function createMockTribute(id: string, district: number, overrides: Partial<EngineTribute> = {}): EngineTribute {
  return {
    id,
    gameId: "game-test-1",
    name: `Tribute ${id}`,
    district,
    gender: "male",
    personality: "Stoic",
    physicalAspect: "Strong",
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

describe("Night Phase Resolver (Camps, Exposure, Betrayals, Fallen Anthem)", () => {
  const resolver = new NightPhaseResolver();
  const defaultSettings: EngineGameSettings = {
    ...DEFAULT_RULES_STATE,
    enableBloodbath: true,
    enableMuttations: true,
    enableDisasters: true,
    enableSponsorDrops: true,
  };

  it("recovers sanity in allied encampments and protects allies from cold exposure", () => {
    const prng = createPRNG(101);
    const t1 = createMockTribute("t1", 12, { biometrics: { survival: 50, sanity: 40, physicalTag: "unscathed", mentalTag: "anxious" } });
    const t2 = createMockTribute("t2", 12, { biometrics: { survival: 50, sanity: 40, physicalTag: "unscathed", mentalTag: "anxious" } });

    const alliance: EngineAlliance = {
      id: "all-12",
      gameId: "game-1",
      tributeIds: ["t1", "t2"],
      status: "active",
      formedPhaseId: null,
      dissolvedPhaseId: null,
      betrayedByTributeId: null,
    };

    const t3 = createMockTribute("t3", 1);
    const t4 = createMockTribute("t4", 2);
    const t5 = createMockTribute("t5", 3);
    const t6 = createMockTribute("t6", 4);

    const allMap = new Map([
      ["t1", t1],
      ["t2", t2],
      ["t3", t3],
      ["t4", t4],
      ["t5", t5],
      ["t6", t6],
    ]);
    const allianceMap = new Map([["all-12", alliance]]);

    const result = resolver.resolvePhase({
      gameId: "game-1",
      dayNumber: 1,
      phaseType: "night",
      phaseOrder: 3,
      aliveTributes: [t1, t2, t3, t4, t5, t6],
      allTributes: allMap,
      alliances: allianceMap,
      settings: defaultSettings,
      prng,
      arenaName: "Cold Arena",
      arenaDescription: "Sub-zero tundra.",
    });

    const up1 = result.updatedTributes.get("t1")!;
    const up2 = result.updatedTributes.get("t2")!;

    expect(up1.biometrics.sanity).toBeGreaterThan(40);
    expect(up2.biometrics.sanity).toBeGreaterThan(40);
    expect(up1.biometrics.survival).toBe(50); // Protected from cold
  });

  it("penalizes unequipped lone tributes with hypothermia and isolation", () => {
    const prng = createPRNG(202);
    const lone = createMockTribute("t-lone", 7, {
      biometrics: { survival: 50, sanity: 50, physicalTag: "unscathed", mentalTag: "composed" },
      inventory: [],
    });

    const allMap = new Map([[lone.id, lone]]);

    const result = resolver.resolvePhase({
      gameId: "game-1",
      dayNumber: 1,
      phaseType: "night",
      phaseOrder: 3,
      aliveTributes: [lone],
      allTributes: allMap,
      alliances: new Map(),
      settings: { ...defaultSettings, enableMuttations: false },
      prng,
      arenaName: "Cold Arena",
      arenaDescription: "Sub-zero tundra.",
    });

    const updated = result.updatedTributes.get(lone.id)!;
    expect(updated.biometrics.survival).toBeLessThan(50);
    expect(updated.biometrics.sanity).toBeLessThan(50);
  });

  it("broadcasts the Capitol anthem event recapping fallen tributes", () => {
    const prng = createPRNG(303);
    const survivor = createMockTribute("survivor", 1);
    const deadId = "dead-tribute-1";

    const result = resolver.resolvePhase({
      gameId: "game-1",
      dayNumber: 1,
      phaseType: "night",
      phaseOrder: 3,
      aliveTributes: [survivor],
      allTributes: new Map([[survivor.id, survivor]]),
      alliances: new Map(),
      settings: defaultSettings,
      prng,
      arenaName: "Arena",
      arenaDescription: "Woodland.",
      priorFallenTributeIds: [deadId],
    });

    const anthemEvent = result.events.find(
      (e) => e.eventId.includes("anthem")
    );
    expect(anthemEvent).toBeDefined();
    expect(result.fallenTributeIds).toContain(deadId);
  });
});
