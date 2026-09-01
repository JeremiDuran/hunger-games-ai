/**
 * Hunger Games AI — Phase Resolver Contracts & Context Interfaces
 * Strict TypeScript types for deterministic procedural phase execution.
 */

import { PRNG } from "../prng";
import {
  PhaseType,
  EngineTribute,
  EngineAlliance,
  EngineGameSettings,
  EngineEventOutcome,
} from "../types";

export interface PhaseContext {
  gameId: string;
  dayNumber: number;
  phaseType: PhaseType;
  phaseOrder: number;
  aliveTributes: EngineTribute[];
  allTributes: Map<string, EngineTribute>;
  alliances: Map<string, EngineAlliance>;
  settings: EngineGameSettings;
  prng: PRNG;
  arenaName: string;
  arenaDescription: string;
  priorFallenTributeIds?: string[];
}

export interface PhaseResolutionOutput {
  events: EngineEventOutcome[];
  fallenTributeIds: string[];
  updatedTributes: Map<string, EngineTribute>;
  updatedAlliances: Map<string, EngineAlliance>;
}

export interface BasePhaseResolver {
  readonly phaseType: PhaseType;
  resolvePhase(context: PhaseContext): PhaseResolutionOutput;
}
