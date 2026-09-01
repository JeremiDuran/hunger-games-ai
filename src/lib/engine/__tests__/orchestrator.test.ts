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
  it("executes the Bloodbath at Day 0 when enableBloodbath is true", () => {
    const state = createMockGameState();
    const { phaseResult, nextGameState } = advanceGamePhase({ gameState: state });

    expect(phaseResult.phaseType).toBe("bloodbath");
    expect(phaseResult.dayNumber).toBe(0);
    expect(phaseResult.phaseOrder).toBe(1);
    expect(nextGameState.currentPhaseType).toBe("bloodbath");
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

  it("simulates a full match from start to finish until a Victor is crowned", () => {
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

    // Advancing from Night with 2 alive same-district tributes
    const { phaseResult, nextGameState } = advanceGamePhase({ gameState: state });

    expect(phaseResult.isVictoryTriggered).toBe(true);
    expect(phaseResult.winnerIds).toEqual(["katniss", "peeta"]);
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
