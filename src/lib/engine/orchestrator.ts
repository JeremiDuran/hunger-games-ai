/**
 * Hunger Games AI — Engine Phase Orchestrator & State Machine
 * Deterministic master advancement function managing phase transitions, PRNG seeding,
 * victory condition evaluation, and state persistence assembly.
 */

import {
  EngineGameState,
  EnginePhaseResult,
  PhaseType,
  EngineTribute,
} from "./types";
import { createPRNG } from "./prng";
import { getPhaseResolver } from "./phases";

export interface AdvancePhaseInput {
  gameState: EngineGameState;
  customPhaseType?: PhaseType;
}

export interface AdvancePhaseOutput {
  phaseResult: EnginePhaseResult;
  nextGameState: EngineGameState;
}

/**
 * Pure, deterministic function that advances a game to its next procedural phase.
 */
export function advanceGamePhase(input: AdvancePhaseInput): AdvancePhaseOutput {
  const { gameState, customPhaseType } = input;

  // 1. If game is already finished, return immediate no-op result
  if (gameState.status === "finished") {
    const emptyResult: EnginePhaseResult = {
      phaseId: `phase-${gameState.gameId.slice(0, 6)}-end`,
      gameId: gameState.gameId,
      dayNumber: gameState.currentDay,
      phaseType: gameState.currentPhaseType,
      phaseOrder: gameState.phaseOrder,
      events: [],
      fallenTributeIds: [],
      updatedTributes: gameState.tributes,
      isVictoryTriggered: true,
      winnerIds: gameState.winnerIds,
    };
    return { phaseResult: emptyResult, nextGameState: gameState };
  }

  // 2. Determine next phase type and day number
  const nextPhaseOrder = gameState.phaseOrder + 1;
  const { nextPhaseType, nextDayNumber } = computeNextPhaseStep({
    gameState,
    customPhaseType,
  });

  const phaseId = `phase-${gameState.gameId.slice(0, 8)}-p${nextPhaseOrder}-${nextPhaseType}`;

  // 3. Instantiate deterministic PRNG for this specific phase round
  const prng = createPRNG(
    `${gameState.gameId}-phase-${nextPhaseOrder}-${nextPhaseType}-${gameState.seed}`
  );

  // 4. Resolve the phase via registered PhaseResolver strategy
  const resolver = getPhaseResolver(nextPhaseType);
  const livingTributes = Array.from(gameState.tributes.values()).filter(
    (t) => t.status === "alive"
  );

  const resolution = resolver.resolvePhase({
    gameId: gameState.gameId,
    dayNumber: nextDayNumber,
    phaseType: nextPhaseType,
    phaseOrder: nextPhaseOrder,
    aliveTributes: livingTributes,
    allTributes: gameState.tributes,
    alliances: gameState.alliances,
    settings: gameState.settings,
    prng,
    arenaName: gameState.arenaName,
    arenaDescription: gameState.arenaDescription,
  });

  // 5. Update placement and deathPhaseId for any tributes who fell in this phase
  const updatedTributes = new Map<string, EngineTribute>(resolution.updatedTributes);
  const aliveAfterPhase = Array.from(updatedTributes.values()).filter(
    (t) => t.status === "alive"
  );

  for (const fallenId of resolution.fallenTributeIds) {
    const fallen = updatedTributes.get(fallenId);
    if (fallen) {
      updatedTributes.set(fallenId, {
        ...fallen,
        status: "dead",
        deathPhaseId: phaseId,
        placement: fallen.placement ?? aliveAfterPhase.length + resolution.fallenTributeIds.length,
      });
    }
  }

  // 6. Evaluate Victory Conditions
  const finalAliveTributes = Array.from(updatedTributes.values()).filter(
    (t) => t.status === "alive"
  );

  let isVictory = false;
  let winnerIds: string[] | null = null;

  // Case A: Sole Victor (1 or 0 tributes alive)
  if (finalAliveTributes.length <= 1) {
    isVictory = true;
    if (finalAliveTributes.length === 1) {
      const victor = finalAliveTributes[0];
      winnerIds = [victor.id];
      updatedTributes.set(victor.id, {
        ...victor,
        placement: 1,
      });
    } else {
      // 0 alive: Mutual destruction
      winnerIds = [];
    }
  }

  // Case B: District Duo Twist
  if (
    !isVictory &&
    gameState.settings.victoryCondition === "district_duo_twist" &&
    finalAliveTributes.length === 2 &&
    finalAliveTributes[0].district === finalAliveTributes[1].district
  ) {
    isVictory = true;
    winnerIds = [finalAliveTributes[0].id, finalAliveTributes[1].id];
    for (const duoVictor of finalAliveTributes) {
      updatedTributes.set(duoVictor.id, {
        ...duoVictor,
        placement: 1,
      });
    }
  }

  const phaseResult: EnginePhaseResult = {
    phaseId,
    gameId: gameState.gameId,
    dayNumber: nextDayNumber,
    phaseType: nextPhaseType,
    phaseOrder: nextPhaseOrder,
    events: resolution.events,
    fallenTributeIds: resolution.fallenTributeIds,
    updatedTributes,
    isVictoryTriggered: isVictory,
    winnerIds,
  };

  const nextGameState: EngineGameState = {
    ...gameState,
    currentDay: nextDayNumber,
    currentPhaseType: nextPhaseType,
    phaseOrder: nextPhaseOrder,
    status: isVictory ? "finished" : "in_progress",
    winnerIds,
    tributes: updatedTributes,
    alliances: resolution.updatedAlliances,
  };

  return {
    phaseResult,
    nextGameState,
  };
}

// ==========================================
// Helper: Phase Step State Transition
// ==========================================

interface ComputePhaseStepParams {
  gameState: EngineGameState;
  customPhaseType?: PhaseType;
}

export function computeNextPhaseStep(params: ComputePhaseStepParams): {
  nextPhaseType: PhaseType;
  nextDayNumber: number;
} {
  const { gameState, customPhaseType } = params;

  if (customPhaseType) {
    return {
      nextPhaseType: customPhaseType,
      nextDayNumber: gameState.currentDay || 1,
    };
  }

  // Initial Match Start (phaseOrder === 0)
  if (gameState.phaseOrder === 0) {
    if (gameState.settings.enableBloodbath) {
      return { nextPhaseType: "bloodbath", nextDayNumber: 0 };
    }
    // Bloodbath bypassed: Start directly at Day 1 Day phase
    return { nextPhaseType: "day", nextDayNumber: 1 };
  }

  // Ongoing transitions
  switch (gameState.currentPhaseType) {
    case "bloodbath":
      return { nextPhaseType: "day", nextDayNumber: 1 };

    case "day":
      return { nextPhaseType: "night", nextDayNumber: gameState.currentDay };

    case "night": {
      const nextDay = gameState.currentDay + 1;
      const aliveCount = Array.from(gameState.tributes.values()).filter(
        (t) => t.status === "alive"
      ).length;

      // Check for scheduled mid-game feast
      if (
        gameState.settings.enableMidGameFeast &&
        nextDay >= 3 &&
        aliveCount >= 4 &&
        aliveCount <= 8
      ) {
        return { nextPhaseType: "feast", nextDayNumber: nextDay };
      }

      return { nextPhaseType: "day", nextDayNumber: nextDay };
    }

    case "feast":
    case "cataclysm":
    case "npc_overload":
    case "arena_event":
      // Special phases occurring during the day transition to night
      return { nextPhaseType: "night", nextDayNumber: gameState.currentDay };

    default:
      return { nextPhaseType: "day", nextDayNumber: gameState.currentDay + 1 };
  }
}
