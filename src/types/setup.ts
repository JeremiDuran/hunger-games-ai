import { Database } from "@/types/database";

export type GameStatus = Database["public"]["Enums"]["game_status"];

export type GamePacing = "instant" | "normal" | "cinematic";

export type SetupTab = "arena" | "tributes" | "rules";

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

