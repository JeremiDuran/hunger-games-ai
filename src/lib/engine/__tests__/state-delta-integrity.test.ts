import { describe, it, expect } from "vitest";
import { advanceGamePhase } from "../orchestrator";
import { EngineGameState, EngineTribute } from "../types";
import { createInitialBiometrics } from "../biometrics";
import { DEFAULT_RULES_STATE } from "@/lib/schemas/setup";
import { EngineItem } from "../items/types";

function createMockGameState(seed = 42, count = 12): EngineGameState {
  const tributes = new Map<string, EngineTribute>();
  for (let i = 1; i <= count; i++) {
    const district = Math.ceil(i / 2);
    const weapon: EngineItem | undefined =
      i % 3 === 0
        ? { id: `w-${i}`, name: `Spear ${i}`, category: "weapon", tier: "common" }
        : undefined;

    tributes.set(`t-${i}`, {
      id: `t-${i}`,
      gameId: "game-deterministic-1",
      name: `Tribute ${i}`,
      district,
      gender: i % 2 === 0 ? "female" : "male",
      personality: "Competitive",
      physicalAspect: "Trained",
      avatarUrl: null,
      status: "alive",
      killCount: 0,
      biometrics: createInitialBiometrics(),
      inventory: weapon ? [weapon] : [],
      deathPhaseId: null,
      placement: null,
    });
  }

  return {
    gameId: "game-deterministic-1",
    title: "The 74th Hunger Games",
    arenaName: "Clockwork Arena",
    arenaDescription: "A salt-water lagoon surrounded by 12 clockwork sectors.",
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
    },
    seed,
  };
}

describe("State Delta Mathematical Integrity & Bitwise PRNG Determinism", () => {
  it("guarantees 100% byte-identical phase resolution across repeated runs with identical seed", () => {
    const initialState1 = createMockGameState(98765, 12);
    const initialState2 = createMockGameState(98765, 12);

    const run1Phase1 = advanceGamePhase({ gameState: initialState1 });
    const run2Phase1 = advanceGamePhase({ gameState: initialState2 });

    expect(JSON.stringify(run1Phase1.phaseResult)).toBe(
      JSON.stringify(run2Phase1.phaseResult)
    );

    const run1Phase2 = advanceGamePhase({ gameState: run1Phase1.nextGameState });
    const run2Phase2 = advanceGamePhase({ gameState: run2Phase1.nextGameState });

    expect(JSON.stringify(run1Phase2.phaseResult)).toBe(
      JSON.stringify(run2Phase2.phaseResult)
    );
  });

  it("verifies kill counts increment by +1 for every fatal strike", () => {
    const state = createMockGameState(1234, 12);
    const { phaseResult, nextGameState } = advanceGamePhase({ gameState: state });

    const deaths = phaseResult.events.filter((e) => e.outcomeType === "death");
    const killers = deaths.flatMap((d) => d.killerIds ?? []);

    const totalKillsEarned = Array.from(nextGameState.tributes.values()).reduce(
      (sum, t) => sum + t.killCount,
      0
    );

    expect(totalKillsEarned).toBe(killers.length);
  });
});
