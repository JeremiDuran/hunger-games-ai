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
