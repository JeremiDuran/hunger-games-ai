import { describe, it, expect } from "vitest";
import { advanceGamePhase } from "../orchestrator";
import { EngineGameState, EngineTribute } from "../types";
import { createInitialBiometrics } from "../biometrics";
import { DEFAULT_RULES_STATE } from "@/lib/schemas/setup";

function createMockGameState(overrides: Partial<EngineGameState> = {}, count = 8): EngineGameState {
  const tributes = new Map<string, EngineTribute>();
  for (let i = 1; i <= count; i++) {
    const district = Math.ceil(i / 2);
    tributes.set(`t-${i}`, {
      id: `t-${i}`,
      gameId: "game-orch-test",
      name: `Tribute ${i}`,
      district,
      gender: i % 2 === 0 ? "female" : "male",
      personality: "Tactical",
      physicalAspect: "Prime",
      avatarUrl: null,
      status: "alive",
      killCount: 0,
      biometrics: createInitialBiometrics(),
      inventory: [],
      deathPhaseId: null,
      placement: null,
    });
  }

  return {
    gameId: "game-orch-test",
    title: "The 74th Hunger Games",
    arenaName: "Arena of Doom",
    arenaDescription: "Dangerous woods.",
    currentDay: 0,
    currentPhaseType: "bloodbath",
    phaseOrder: 0,
    status: "in_progress",
    winnerIds: null,
    tributes,
    alliances: new Map(),
    settings: {
      ...DEFAULT_RULES_STATE,
      enableBloodbath: true,
      enableMuttations: true,
      enableDisasters: true,
      enableSponsorDrops: true,
      combatLethality: "high_bloodbath",
    },
    seed: 555,
    ...overrides,
  };
}

describe("Engine Phase Orchestrator & State Machine", () => {
  it("executes the Bloodbath at Day 0 when enableBloodbath is true and produces a valid UUID phaseId", () => {
    const state = createMockGameState();
    const { phaseResult, nextGameState } = advanceGamePhase({ gameState: state });

    expect(phaseResult.phaseType).toBe("bloodbath");
    expect(phaseResult.dayNumber).toBe(0);
    expect(phaseResult.phaseOrder).toBe(1);
    expect(nextGameState.currentPhaseType).toBe("bloodbath");

    // Check UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(phaseResult.phaseId)).toBe(true);
  });

  it("bypasses Bloodbath and starts directly at Day 1 Day Phase when enableBloodbath is false", () => {
    const state = createMockGameState({
      settings: {
        ...DEFAULT_RULES_STATE,
        enableBloodbath: false,
        enableMuttations: true,
        enableDisasters: true,
        enableSponsorDrops: true,
      },
    });

    const { phaseResult, nextGameState } = advanceGamePhase({ gameState: state });

    expect(phaseResult.phaseType).toBe("day");
    expect(phaseResult.dayNumber).toBe(1);
    expect(phaseResult.phaseOrder).toBe(1);
    expect(nextGameState.currentPhaseType).toBe("day");
    expect(nextGameState.currentDay).toBe(1);
  });

  it("simulates a full match from start to finish until a Victor is crowned with valid placements", () => {
    let state = createMockGameState({}, 6);
    let iterations = 0;
    const maxIterations = 30;

    while (state.status !== "finished" && iterations < maxIterations) {
      iterations++;
      const { nextGameState } = advanceGamePhase({ gameState: state });
      state = nextGameState;
    }

    expect(state.status).toBe("finished");
    expect(state.winnerIds).toBeDefined();
    expect(iterations).toBeLessThan(maxIterations);

    // Verify all tributes have non-null placements >= 1
    for (const tribute of state.tributes.values()) {
      expect(tribute.placement).toBeGreaterThanOrEqual(1);
    }
  });

  it("triggers District Duo Twist victory when 2 tributes of the same district remain alive", () => {
    const d12PartnerA: EngineTribute = {
      id: "katniss",
      gameId: "game-duo",
      name: "Katniss",
      district: 12,
      gender: "female",
      personality: "Archer",
      physicalAspect: "Lean",
      avatarUrl: null,
      status: "alive",
      killCount: 2,
      biometrics: createInitialBiometrics(),
      inventory: [],
      deathPhaseId: null,
      placement: null,
    };

    const d12PartnerB: EngineTribute = {
      id: "peeta",
      gameId: "game-duo",
      name: "Peeta",
      district: 12,
      gender: "male",
      personality: "Baker",
      physicalAspect: "Sturdy",
      avatarUrl: null,
      status: "alive",
      killCount: 1,
      biometrics: createInitialBiometrics(),
      inventory: [],
      deathPhaseId: null,
      placement: null,
    };

    const tributes = new Map([
      ["katniss", d12PartnerA],
      ["peeta", d12PartnerB],
    ]);

    const state: EngineGameState = {
      gameId: "game-duo",
      title: "The 74th Hunger Games",
      arenaName: "Arena",
      arenaDescription: "Woods.",
      currentDay: 5,
      currentPhaseType: "night",
      phaseOrder: 10,
      status: "in_progress",
      winnerIds: null,
      tributes,
      alliances: new Map(),
      settings: {
        ...DEFAULT_RULES_STATE,
        enableBloodbath: true,
        enableMuttations: true,
        enableDisasters: true,
        enableSponsorDrops: true,
        victoryCondition: "district_duo_twist",
      },
      seed: 777,
    };

    const { phaseResult, nextGameState } = advanceGamePhase({ gameState: state });

    expect(phaseResult.isVictoryTriggered).toBe(true);
    expect(phaseResult.winnerIds).toEqual(["katniss", "peeta"]);
    expect(nextGameState.status).toBe("finished");
    expect(nextGameState.tributes.get("katniss")?.placement).toBe(1);
    expect(nextGameState.tributes.get("peeta")?.placement).toBe(1);
  });

  it("does NOT trigger District Duo Twist if the final 2 tributes are from DIFFERENT districts", () => {
    const d12Katniss: EngineTribute = {
      id: "katniss",
      gameId: "game-diff",
      name: "Katniss",
      district: 12,
      gender: "female",
      personality: "Archer",
      physicalAspect: "Lean",
      avatarUrl: null,
      status: "alive",
      killCount: 2,
      biometrics: createInitialBiometrics(),
      inventory: [],
      deathPhaseId: null,
      placement: null,
    };

    const d2Cato: EngineTribute = {
      id: "cato",
      gameId: "game-diff",
      name: "Cato",
      district: 2,
      gender: "male",
      personality: "Warrior",
      physicalAspect: "Bulky",
      avatarUrl: null,
      status: "alive",
      killCount: 3,
      biometrics: createInitialBiometrics(),
      inventory: [],
      deathPhaseId: null,
      placement: null,
    };

    const tributes = new Map([
      ["katniss", d12Katniss],
      ["cato", d2Cato],
    ]);

    const state: EngineGameState = {
      gameId: "game-diff",
      title: "The 74th Hunger Games",
      arenaName: "Arena",
      arenaDescription: "Woods.",
      currentDay: 5,
      currentPhaseType: "day",
      phaseOrder: 9,
      status: "in_progress",
      winnerIds: null,
      tributes,
      alliances: new Map(),
      settings: {
        ...DEFAULT_RULES_STATE,
        enableBloodbath: true,
        enableMuttations: true,
        enableDisasters: true,
        enableSponsorDrops: true,
        victoryCondition: "district_duo_twist",
        combatLethality: "balanced",
      },
      seed: 888,
    };

    const { phaseResult, nextGameState } = advanceGamePhase({ gameState: state });

    // Since they are from different districts, game must continue if both survive, or finish with sole victor if one dies
    if (Array.from(nextGameState.tributes.values()).filter((t) => t.status === "alive").length === 2) {
      expect(phaseResult.isVictoryTriggered).toBe(false);
      expect(nextGameState.status).toBe("in_progress");
    } else {
      expect(phaseResult.isVictoryTriggered).toBe(true);
      expect(nextGameState.status).toBe("finished");
    }
  });

  it("handles mutual destruction (0 alive survivors) with no victors", () => {
    // Single tribute about to die in a hazard / PvE event
    const dyingTribute: EngineTribute = {
      id: "t-solo",
      gameId: "game-mutual",
      name: "Last Standing",
      district: 3,
      gender: "male",
      personality: "Desperate",
      physicalAspect: "Exhausted",
      avatarUrl: null,
      status: "alive",
      killCount: 0,
      biometrics: { survival: 1, sanity: 1, physicalTag: "critically_injured", mentalTag: "delirious" },
      inventory: [],
      deathPhaseId: null,
      placement: null,
    };

    const tributes = new Map([["t-solo", dyingTribute]]);

    const state: EngineGameState = {
      gameId: "game-mutual",
      title: "The 74th Hunger Games",
      arenaName: "Arena",
      arenaDescription: "Woods.",
      currentDay: 6,
      currentPhaseType: "day",
      phaseOrder: 11,
      status: "in_progress",
      winnerIds: null,
      tributes,
      alliances: new Map(),
      settings: {
        ...DEFAULT_RULES_STATE,
        enableBloodbath: true,
        enableMuttations: true,
        enableDisasters: true,
        enableSponsorDrops: true,
        disasterFrequency: "frequent",
      },
      seed: 999,
    };

    // Force a cataclysm phase where the solo tribute is killed
    const { phaseResult, nextGameState } = advanceGamePhase({
      gameState: state,
      customPhaseType: "cataclysm",
    });

    expect(phaseResult.isVictoryTriggered).toBe(true);
    expect(phaseResult.winnerIds).toEqual([]);
    expect(nextGameState.status).toBe("finished");
  });

  it("supports manual Gamemaker custom phase execution (e.g. cataclysm or npc_overload)", () => {
    const state = createMockGameState({}, 4);
    const { phaseResult, nextGameState } = advanceGamePhase({
      gameState: state,
      customPhaseType: "npc_overload",
    });

    expect(phaseResult.phaseType).toBe("npc_overload");
    expect(nextGameState.currentPhaseType).toBe("npc_overload");
    expect(phaseResult.events.every((e) => e.eventCategory === "mutt")).toBe(true);
  });
});
