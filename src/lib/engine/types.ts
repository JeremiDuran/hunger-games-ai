/**
 * Hunger Games AI — Simulation Engine Domain Types & Contracts
 * Strict TypeScript types for deterministic procedural execution.
 */

import { Database } from "@/types/database";
import {
  CombatLethality,
  AllianceDynamic,
  SponsorGenerosity,
  MuttationTiming,
  DisasterFrequency,
  NarrativeVoice,
  VictoryCondition,
  GamePacing,
  TurnGranularity,
} from "@/types/setup";

// ==========================================
// 1. Biometric Condition Tags & State
// ==========================================

export type PhysicalConditionTag =
  | "unscathed"
  | "scratched"
  | "bruised"
  | "wounded"
  | "critically_injured"
  | "poisoned"
  | "freezing"
  | "starving"
  | "fatal";

export type MentalConditionTag =
  | "resolute"
  | "calm"
  | "composed"
  | "alert"
  | "anxious"
  | "shaken"
  | "paranoid"
  | "disturbed"
  | "delirious"
  | "manic";

export interface TributeBiometrics {
  survival: number; // 0 to 100
  sanity: number; // 0 to 100
  physicalTag: PhysicalConditionTag;
  mentalTag: MentalConditionTag;
}

export type TributeGender = Database["public"]["Enums"]["tribute_gender"];
export type TributeStatus = Database["public"]["Enums"]["tribute_status"];

export interface EngineTribute {
  id: string;
  gameId: string;
  name: string;
  district: number;
  gender: TributeGender;
  personality: string;
  physicalAspect: string;
  avatarUrl: string | null;
  status: TributeStatus;
  killCount: number;
  biometrics: TributeBiometrics;
  inventory: string[];
  deathPhaseId: string | null;
  placement: number | null;
}

// ==========================================
// 2. Engine Game Settings & Setup Matrix
// ==========================================

export interface EngineGameSettings {
  enableBloodbath: boolean;
  enableMuttations: boolean;
  enableDisasters: boolean;
  enableSponsorDrops: boolean;
  enableMidGameFeast: boolean;
  pacing: GamePacing;
  turnGranularity: TurnGranularity;
  combatLethality: CombatLethality;
  sponsorGenerosity: SponsorGenerosity;
  muttationTiming: MuttationTiming;
  disasterFrequency: DisasterFrequency;
  allianceDynamic: AllianceDynamic;
  narrativeVoice: NarrativeVoice;
  victoryCondition: VictoryCondition;
}

// ==========================================
// 3. Phase & Event Taxonomy
// ==========================================

export type PhaseType = "bloodbath" | "day" | "night" | "feast";
export type EventCategory =
  | "combat"
  | "forage"
  | "hazard"
  | "sponsor"
  | "mutt"
  | "social";
export type OutcomeType =
  | "death"
  | "wound"
  | "loot"
  | "flee"
  | "alliance"
  | "idle";

export interface EnvironmentalContextFlags {
  isPoisoned?: boolean;
  isFreezing?: boolean;
  isStarving?: boolean;
}

export interface TributeStateDelta {
  tributeId: string;
  survivalDelta: number;
  sanityDelta: number;
  newPhysicalTag?: PhysicalConditionTag;
  newMentalTag?: MentalConditionTag;
  isFatal?: boolean;
  killerId?: string;
  itemsGained?: string[];
  itemsLost?: string[];
  narrativeNotes?: string;
}

export interface EngineEventOutcome {
  eventId: string;
  eventOrder: number;
  eventCategory: EventCategory;
  outcomeType: OutcomeType;
  tributeIds: string[];
  killerIds: string[] | null;
  victimIds: string[] | null;
  stateDeltas: Record<string, TributeStateDelta>;
  narrativeText?: string;
  thematicContext?: {
    itemContested?: string;
    npcName?: string;
    hazardName?: string;
  };
}

export interface EnginePhaseResult {
  phaseId: string;
  gameId: string;
  dayNumber: number;
  phaseType: PhaseType;
  phaseOrder: number;
  events: EngineEventOutcome[];
  fallenTributeIds: string[];
  updatedTributes: Map<string, EngineTribute>;
  isVictoryTriggered: boolean;
  winnerIds: string[] | null;
}

// ==========================================
// 4. Alliance Domain Model
// ==========================================

export type AllianceStatus = "active" | "dissolved" | "betrayed";

export interface EngineAlliance {
  id: string;
  gameId: string;
  tributeIds: string[];
  status: AllianceStatus;
  formedPhaseId: string | null;
  dissolvedPhaseId: string | null;
  betrayedByTributeId: string | null;
}

// ==========================================
// 5. Overall Engine Match State
// ==========================================

export interface EngineGameState {
  gameId: string;
  title: string;
  arenaName: string;
  arenaDescription: string;
  currentDay: number;
  currentPhaseType: PhaseType;
  phaseOrder: number;
  status: Database["public"]["Enums"]["game_status"];
  winnerIds: string[] | null;
  tributes: Map<string, EngineTribute>;
  alliances: Map<string, EngineAlliance>;
  settings: EngineGameSettings;
  seed: number;
}
