/**
 * Hunger Games AI — Simulation Engine Domain Types & Contracts
 * Strict TypeScript types for deterministic procedural execution.
 */

import { Database } from "@/types/database";
import { PRNG } from "./prng";
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

import { EngineItem } from "./items/types";

// ==========================================
// 1. Biometric Condition Tags & State
// ==========================================

export type PhysicalConditionTag =
  | "unscathed"
  | "scratched"
  | "bruised"
  | "wounded"
  | "critically_injured"
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
  inventory: (EngineItem | string)[];
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

export type PhaseType =
  | "bloodbath"
  | "day"
  | "night"
  | "feast"
  | "cataclysm"
  | "npc_overload"
  | "arena_event";
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

export interface TributeStateDelta {
  tributeId: string;
  survivalDelta: number;
  sanityDelta: number;
  newPhysicalTag?: PhysicalConditionTag;
  newMentalTag?: MentalConditionTag;
  isFatal?: boolean;
  killerId?: string;
  itemsGained?: (EngineItem | string)[];
  itemsLost?: (EngineItem | string)[];
  itemsConsumed?: (EngineItem | string)[];
  itemsDestroyed?: (EngineItem | string)[];
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
    cornucopiaDescription?: string;
    itemContested?: string;
    itemDiscovered?: string;
    npcName?: string;
    hazardName?: string;
    locationDescription?: string;
    specialRulesTriggered?: string[];
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
  name?: string;
  cohesion?: number;
}

// ==========================================
// 5. Overall Engine Match State
// ==========================================

export interface EngineGameState {
  gameId: string;
  title: string;
  arenaName: string;
  arenaDescription: string;
  cornucopiaDescription?: string;
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

// ==========================================
// 6. Encounter Formations & Slot Matchmaker
// ==========================================

export type EncounterType =
  // Solo Formations (1 Tribute)
  | "solo_forage"
  | "solo_rest"
  | "solo_mishap"
  | "solo_pve"
  // Duo Formations (2 Tributes)
  | "duel_1v1"
  | "standoff_1v1"
  | "coop_pve_2"
  | "allied_camp_2"
  | "peaceful_encounter_2"
  // Trio Formations (3 Tributes)
  | "ffa_3way"
  | "ambush_1v2"
  | "spontaneous_truce_1v2"
  | "coop_pve_3"
  | "allied_camp_3"
  // Quad Formations (4 Tributes)
  | "ffa_4way"
  | "squad_war_2v2"
  | "stand_1v3"
  | "asymmetric_2v1v1"
  | "squad_pve_4way"
  // Special Cornucopia & Feast Events
  | "bloodbath_horn_clash"
  | "feast_supply_clash";

export type NPCType = "mutt" | "hazard" | "beast";
export type ThreatLevel = "minor" | "moderate" | "lethal";

export interface NPCCombatant {
  id: string;
  name: string;
  type: NPCType;
  threatLevel: ThreatLevel;
}

export interface EncounterFaction {
  id: string;
  name: string;
  tributeIds: string[];
  npcIds?: string[];
  isSpontaneousTruce?: boolean;
  isHostileToAll?: boolean;
}

export interface ThematicEncounterContext {
  itemContested?: string;
  itemDiscovered?: string;
  npcName?: string;
  hazardName?: string;
  locationDescription?: string;
  specialRulesTriggered?: string[];
}

export interface EncounterSlotFormation {
  id: string;
  encounterOrder: number;
  formationType: EncounterType;
  category: EventCategory;
  tributeIds: string[]; // 1 to 4 tributes
  npcs: NPCCombatant[]; // 0 to 2 NPCs
  factions: EncounterFaction[];
  thematicContext?: ThematicEncounterContext;
}

export interface MatchmakerContext {
  gameId: string;
  dayNumber: number;
  phaseType: PhaseType;
  aliveTributes: EngineTribute[];
  alliances: Map<string, EngineAlliance>;
  settings: EngineGameSettings;
  prng: PRNG;
  arenaName?: string;
  arenaDescription?: string;
}

export interface MatchmakerPartitionResult {
  encounters: EncounterSlotFormation[];
  unmatchedTributes: EngineTribute[];
}

// ==========================================
// 7. Re-export Item & Combat Domain Types
// ==========================================

export * from "./items/types";
export * from "./combat/calculus";

