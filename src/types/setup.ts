import { Database } from "@/types/database";

export type GameStatus = Database["public"]["Enums"]["game_status"];

export type GamePacing = "instant" | "normal" | "cinematic";

export type SetupTab = "arena" | "tributes" | "rules" | "summary";

export interface ArenaHazardSettings {
  enableBloodbath: boolean;
  enableMuttations: boolean;
  enableDisasters: boolean;
  enableSponsorDrops: boolean;
}

export interface ArenaSetupState {
  simulationTitle: string;
  arenaName: string;
  arenaDescription: string;
  hazards: ArenaHazardSettings;
  pacing: GamePacing;
}

export interface ArenaPreset {
  id: string;
  name: string;
  simulationTitle: string;
  arenaName: string;
  description: string;
  hazards: ArenaHazardSettings;
  tag: string;
  canonSeason?: number;
}

export type TributeGender = Database["public"]["Enums"]["tribute_gender"];

export type TributesPerDistrict = 2 | 3 | 4;

export interface TributeData {
  id: string;
  name: string;
  district: number;
  gender: TributeGender;
  personality: string;
  physicalAspect: string;
  avatarUrl: string | null;
}

export interface TributesSetupState {
  totalTributes: number;
  tributesPerDistrict: TributesPerDistrict;
  districtCount: number;
  tributes: TributeData[];
}

export type TurnGranularity = "event_by_event" | "full_phase" | "autoplay";

export type CombatLethality = "balanced" | "high_bloodbath" | "gritty_survival";

export type SponsorGenerosity = "standard" | "abundance" | "famine";

export type MuttationTiming = "climax_only" | "night_stalkers";

export type DisasterFrequency = "moderate" | "frequent" | "reactive_only";

export type AllianceDynamic = "dynamic_pacts" | "lone_wolves" | "career_pack";

export type NarrativeVoice =
  | "novel_cinematic"
  | "capitol_broadcast"
  | "gamemaker_log";

export type VictoryCondition =
  | "sole_victor"
  | "district_duo_twist"
  | "no_victors";

export interface RulesSetupState {
  turnGranularity: TurnGranularity;
  pacing: GamePacing;
  combatLethality: CombatLethality;
  sponsorGenerosity: SponsorGenerosity;
  muttationTiming: MuttationTiming;
  disasterFrequency: DisasterFrequency;
  allianceDynamic: AllianceDynamic;
  enableMidGameFeast: boolean;
  narrativeVoice: NarrativeVoice;
  victoryCondition: VictoryCondition;
}

