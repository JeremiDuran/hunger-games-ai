import { describe, it, expect } from "vitest";
import {
  calculateTributeAffinity,
  bootstrapInitialAlliances,
  getTributeAlliance,
  getActiveAlliances,
  areTributesAllied,
  getAlliedTributeIds,
  createAlliance,
  dissolveAlliance,
  betrayAlliance,
  evaluateAllianceStrain,
  CAREER_DISTRICTS,
} from "../alliances";
import { EngineTribute, EngineAlliance } from "../types";
import { createPRNG } from "../prng";
import { createInitialBiometrics } from "../biometrics";

function createMockTribute(overrides: Partial<EngineTribute>): EngineTribute {
  return {
    id: overrides.id ?? "t-1",
    gameId: overrides.gameId ?? "game-1",
    name: overrides.name ?? "Tribute 1",
    district: overrides.district ?? 12,
    gender: overrides.gender ?? "female",
    personality: overrides.personality ?? "",
    physicalAspect: overrides.physicalAspect ?? "",
    avatarUrl: overrides.avatarUrl ?? null,
    status: overrides.status ?? "alive",
    killCount: overrides.killCount ?? 0,
    biometrics: overrides.biometrics ?? createInitialBiometrics(),
    inventory: overrides.inventory ?? [],
    deathPhaseId: overrides.deathPhaseId ?? null,
    placement: overrides.placement ?? null,
  };
}

describe("Alliance Cohesion & Lifecycle Manager", () => {
  describe("calculateTributeAffinity", () => {
    it("returns high positive affinity boost for tributes from the same district", () => {
      const katniss = createMockTribute({ id: "t-katniss", name: "Katniss", district: 12 });
      const peeta = createMockTribute({ id: "t-peeta", name: "Peeta", district: 12 });

      const affinity = calculateTributeAffinity(katniss, peeta);
      expect(affinity).toBeGreaterThanOrEqual(75);
    });

    it("gives Career pack bonus for tributes from Districts 1, 2, 4", () => {
      const cato = createMockTribute({ id: "t-cato", name: "Cato", district: 2 });
      const glimmer = createMockTribute({ id: "t-glimmer", name: "Glimmer", district: 1 });

      const affinity = calculateTributeAffinity(cato, glimmer);
      expect(affinity).toBeGreaterThanOrEqual(60);
    });

    it("penalizes affinity when a tribute is in paranoid mental breakdown", () => {
      const normalTribute = createMockTribute({ id: "t-1", district: 11 });
      const paranoidTribute = createMockTribute({
        id: "t-2",
        district: 11,
        biometrics: {
          survival: 50,
          sanity: 15, // Paranoid (<25)
          physicalTag: "unscathed",
          mentalTag: "paranoid",
        },
      });

      const normalAffinity = calculateTributeAffinity(normalTribute, normalTribute);
      const paranoidAffinity = calculateTributeAffinity(normalTribute, paranoidTribute);

      expect(paranoidAffinity).toBeLessThan(normalAffinity);
    });
  });

  describe("bootstrapInitialAlliances", () => {
    it("returns empty map for 'lone_wolves' setting", () => {
      const tributes = [
        createMockTribute({ id: "t-1", district: 1 }),
        createMockTribute({ id: "t-2", district: 1 }),
        createMockTribute({ id: "t-3", district: 2 }),
      ];
      const prng = createPRNG(42);

      const alliances = bootstrapInitialAlliances(tributes, "lone_wolves", "game-100", prng);
      expect(alliances.size).toBe(0);
    });

    it("creates a single Career Pack alliance grouping Districts 1, 2, and 4 in 'career_pack' mode", () => {
      const tributes = [
        createMockTribute({ id: "t-d1-a", district: 1 }),
        createMockTribute({ id: "t-d1-b", district: 1 }),
        createMockTribute({ id: "t-d2-a", district: 2 }),
        createMockTribute({ id: "t-d4-a", district: 4 }),
        createMockTribute({ id: "t-d12-a", district: 12 }),
      ];
      const prng = createPRNG(42);

      const alliances = bootstrapInitialAlliances(tributes, "career_pack", "game-100", prng);
      expect(alliances.size).toBe(1);

      const careerAlliance = Array.from(alliances.values())[0];
      expect(careerAlliance.status).toBe("active");
      expect(careerAlliance.tributeIds).toEqual(["t-d1-a", "t-d1-b", "t-d2-a", "t-d4-a"]);
      expect(careerAlliance.tributeIds).not.toContain("t-d12-a");
    });

    it("evaluates District Partner Pacts with high probability under 'dynamic_pacts'", () => {
      const tributes = [
        createMockTribute({ id: "t-d12-1", district: 12 }),
        createMockTribute({ id: "t-d12-2", district: 12 }),
        createMockTribute({ id: "t-d11-1", district: 11 }),
        createMockTribute({ id: "t-d11-2", district: 11 }),
      ];
      // Seed with predictable roll
      const prng = createPRNG(1234);

      const alliances = bootstrapInitialAlliances(tributes, "dynamic_pacts", "game-100", prng);
      expect(alliances.size).toBeGreaterThanOrEqual(1);

      for (const alliance of alliances.values()) {
        expect(alliance.status).toBe("active");
        expect(alliance.tributeIds.length).toBe(2);
      }
    });
  });

  describe("Alliance Queries & Utilities", () => {
    const mockAlliance: EngineAlliance = {
      id: "alliance-alpha",
      gameId: "game-1",
      tributeIds: ["t-1", "t-2"],
      status: "active",
      formedPhaseId: null,
      dissolvedPhaseId: null,
      betrayedByTributeId: null,
    };

    const alliancesMap = new Map<string, EngineAlliance>([
      [mockAlliance.id, mockAlliance],
    ]);

    it("finds active tribute alliance", () => {
      expect(getTributeAlliance(alliancesMap, "t-1")).toEqual(mockAlliance);
      expect(getTributeAlliance(alliancesMap, "t-2")).toEqual(mockAlliance);
      expect(getTributeAlliance(alliancesMap, "t-3")).toBeNull();
    });

    it("checks if two tributes are allied", () => {
      expect(areTributesAllied(alliancesMap, "t-1", "t-2")).toBe(true);
      expect(areTributesAllied(alliancesMap, "t-1", "t-3")).toBe(false);
      expect(areTributesAllied(alliancesMap, "t-1", "t-1")).toBe(false);
    });

    it("returns list of allied tribute IDs", () => {
      expect(getAlliedTributeIds(alliancesMap, "t-1")).toEqual(["t-2"]);
      expect(getAlliedTributeIds(alliancesMap, "t-2")).toEqual(["t-1"]);
      expect(getAlliedTributeIds(alliancesMap, "t-3")).toEqual([]);
    });

    it("filters active alliances", () => {
      const dissolvedAlliance: EngineAlliance = {
        id: "alliance-dissolved",
        gameId: "game-1",
        tributeIds: ["t-4", "t-5"],
        status: "dissolved",
        formedPhaseId: null,
        dissolvedPhaseId: "phase-1",
        betrayedByTributeId: null,
      };

      const map = new Map<string, EngineAlliance>([
        [mockAlliance.id, mockAlliance],
        [dissolvedAlliance.id, dissolvedAlliance],
      ]);

      const active = getActiveAlliances(map);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe("alliance-alpha");
    });
  });

  describe("Lifecycle State Transitions & Strain Evaluation", () => {
    it("creates, dissolves, and betrays alliances", () => {
      const created = createAlliance("game-1", ["t-1", "t-2"], "phase-0", "alliance-test");
      expect(created.status).toBe("active");
      expect(created.formedPhaseId).toBe("phase-0");

      const dissolved = dissolveAlliance(created, "phase-2");
      expect(dissolved.status).toBe("dissolved");
      expect(dissolved.dissolvedPhaseId).toBe("phase-2");

      const betrayed = betrayAlliance(created, "t-1", "phase-3");
      expect(betrayed.status).toBe("betrayed");
      expect(betrayed.betrayedByTributeId).toBe("t-1");
      expect(betrayed.dissolvedPhaseId).toBe("phase-3");
    });

    it("evaluates strain when fewer than 2 alive members remain in alliance", () => {
      const alliance: EngineAlliance = {
        id: "a-1",
        gameId: "g-1",
        tributeIds: ["t-1", "t-2"],
        status: "active",
        formedPhaseId: null,
        dissolvedPhaseId: null,
        betrayedByTributeId: null,
      };

      const tributes = new Map<string, EngineTribute>([
        ["t-1", createMockTribute({ id: "t-1", status: "alive" })],
        ["t-2", createMockTribute({ id: "t-2", status: "dead" })],
      ]);

      const strain = evaluateAllianceStrain(alliance, tributes, 10);
      expect(strain.shouldDissolve).toBe(true);
      expect(strain.shouldBetray).toBe(false);
    });

    it("triggers betrayal risk when an alive alliance member suffers a paranoid breakdown", () => {
      const alliance: EngineAlliance = {
        id: "a-1",
        gameId: "g-1",
        tributeIds: ["t-1", "t-2"],
        status: "active",
        formedPhaseId: null,
        dissolvedPhaseId: null,
        betrayedByTributeId: null,
      };

      const tributes = new Map<string, EngineTribute>([
        ["t-1", createMockTribute({ id: "t-1", status: "alive", biometrics: { survival: 50, sanity: 60, physicalTag: "unscathed", mentalTag: "composed" } })],
        ["t-2", createMockTribute({ id: "t-2", status: "alive", biometrics: { survival: 50, sanity: 12, physicalTag: "unscathed", mentalTag: "manic" } })],
      ]);

      const strain = evaluateAllianceStrain(alliance, tributes, 10);
      expect(strain.shouldBetray).toBe(true);
      expect(strain.potentialBetrayerId).toBe("t-2");
    });

    it("triggers endgame climax tension when 4 or fewer tributes remain in the match", () => {
      const alliance: EngineAlliance = {
        id: "a-1",
        gameId: "g-1",
        tributeIds: ["t-1", "t-2"],
        status: "active",
        formedPhaseId: null,
        dissolvedPhaseId: null,
        betrayedByTributeId: null,
      };

      const tributes = new Map<string, EngineTribute>([
        ["t-1", createMockTribute({ id: "t-1", status: "alive", killCount: 2 })],
        ["t-2", createMockTribute({ id: "t-2", status: "alive", killCount: 0 })],
      ]);

      const strain = evaluateAllianceStrain(alliance, tributes, 3); // 3 alive in entire arena
      expect(strain.shouldBetray).toBe(true);
      expect(strain.reason).toBe("endgame_climax");
    });
  });
});
