/**
 * Hunger Games AI — Engine Adapters & Data Converters
 * Bidirectional mapping between Supabase DB models, Setup Wizard types, and Engine Domain models.
 */

import { Tables, TablesUpdate, Json } from "@/types/database";
import { TributeData } from "@/types/setup";
import { DEFAULT_RULES_STATE } from "@/lib/schemas/setup";
import {
  EngineTribute,
  EngineGameSettings,
  TributeBiometrics,
  PhysicalConditionTag,
  MentalConditionTag,
} from "./types";
import {
  clampBiometric,
  createInitialBiometrics,
  evaluatePhysicalTag,
  evaluateMentalTag,
} from "./biometrics";

/**
 * Parses raw JSONB stats from the database into strict TributeBiometrics.
 * Gracefully handles legacy formats (e.g. { health: 100, strength: 50... }) or corrupted data.
 */
export function parseDbTributeStats(rawStats: unknown): TributeBiometrics {
  if (!rawStats || typeof rawStats !== "object" || Array.isArray(rawStats)) {
    return createInitialBiometrics();
  }

  const statsObj = rawStats as Record<string, unknown>;

  // Case 1: Modern biometrics schema { survival: 50, sanity: 50, physical_tag: "...", mental_tag: "..." }
  if (
    typeof statsObj.survival === "number" &&
    typeof statsObj.sanity === "number"
  ) {
    const survival = clampBiometric(statsObj.survival);
    const sanity = clampBiometric(statsObj.sanity);

    const physicalTag =
      typeof statsObj.physical_tag === "string"
        ? (statsObj.physical_tag as PhysicalConditionTag)
        : evaluatePhysicalTag(survival);

    const mentalTag =
      typeof statsObj.mental_tag === "string"
        ? (statsObj.mental_tag as MentalConditionTag)
        : evaluateMentalTag(sanity);

    return {
      survival,
      sanity,
      physicalTag,
      mentalTag,
    };
  }

  // Case 2: Legacy fallback { health: 100... }
  if (typeof statsObj.health === "number") {
    if (statsObj.health >= 100) {
      return createInitialBiometrics();
    }
    const survival = clampBiometric(statsObj.health / 2); // Scale 0..100
    const sanity = 50;
    return {
      survival,
      sanity,
      physicalTag: evaluatePhysicalTag(survival),
      mentalTag: evaluateMentalTag(sanity),
    };
  }

  return createInitialBiometrics();
}

import { EngineItem } from "./items/types";
import { isEngineItem } from "./items/buffs";

/**
 * Safely parses raw inventory JSONB into an array of EngineItem objects or string names.
 */
export function parseDbInventory(rawInventory: unknown): (EngineItem | string)[] {
  if (Array.isArray(rawInventory)) {
    return rawInventory.filter(
      (item): item is EngineItem | string => typeof item === "string" || isEngineItem(item)
    );
  }
  return [];
}

/**
 * Converts a Supabase `tributes` database row into an EngineTribute domain model.
 */
export function dbTributeToEngine(row: Tables<"tributes">): EngineTribute {
  const biometrics = parseDbTributeStats(row.stats);
  const inventory = parseDbInventory(row.inventory);

  return {
    id: row.id,
    gameId: row.game_id,
    name: row.name,
    district: row.district,
    gender: row.gender,
    personality: row.personality ?? "",
    physicalAspect: row.physical_aspect ?? "",
    avatarUrl: row.avatar_url,
    status: row.status,
    killCount: row.kill_count,
    biometrics,
    inventory,
    deathPhaseId: row.death_phase_id,
    placement: row.placement,
  };
}

/**
 * Converts an EngineTribute domain model into a Supabase `tributes` update payload.
 */
export function engineTributeToDbUpdate(
  tribute: EngineTribute
): TablesUpdate<"tributes"> {
  return {
    status: tribute.status,
    kill_count: tribute.killCount,
    death_phase_id: tribute.deathPhaseId,
    placement: tribute.placement,
    inventory: tribute.inventory as unknown as Json,
    stats: {
      survival: tribute.biometrics.survival,
      sanity: tribute.biometrics.sanity,
      physical_tag: tribute.biometrics.physicalTag,
      mental_tag: tribute.biometrics.mentalTag,
    },
  };
}

/**
 * Initializes a clean in-memory roster from React / Setup Wizard TributeData.
 */
export function initializeEngineRoster(
  tributes: TributeData[],
  gameId: string
): Map<string, EngineTribute> {
  const roster = new Map<string, EngineTribute>();

  for (const t of tributes) {
    const engineTribute: EngineTribute = {
      id: t.id,
      gameId,
      name: t.name,
      district: t.district,
      gender: t.gender,
      personality: t.personality,
      physicalAspect: t.physicalAspect,
      avatarUrl: t.avatarUrl,
      status: "alive",
      killCount: 0,
      biometrics: createInitialBiometrics(),
      inventory: [],
      deathPhaseId: null,
      placement: null,
    };
    roster.set(t.id, engineTribute);
  }

  return roster;
}

/**
 * Parses raw JSONB settings from public.games table into EngineGameSettings.
 */
export function dbGameSettingsToEngine(
  rawSettings: unknown
): EngineGameSettings {
  if (!rawSettings || typeof rawSettings !== "object" || Array.isArray(rawSettings)) {
    return {
      enableBloodbath: true,
      enableMuttations: true,
      enableDisasters: true,
      enableSponsorDrops: true,
      enableMidGameFeast: DEFAULT_RULES_STATE.enableMidGameFeast,
      pacing: DEFAULT_RULES_STATE.pacing,
      turnGranularity: DEFAULT_RULES_STATE.turnGranularity,
      combatLethality: DEFAULT_RULES_STATE.combatLethality,
      sponsorGenerosity: DEFAULT_RULES_STATE.sponsorGenerosity,
      muttationTiming: DEFAULT_RULES_STATE.muttationTiming,
      disasterFrequency: DEFAULT_RULES_STATE.disasterFrequency,
      allianceDynamic: DEFAULT_RULES_STATE.allianceDynamic,
      narrativeVoice: DEFAULT_RULES_STATE.narrativeVoice,
      victoryCondition: DEFAULT_RULES_STATE.victoryCondition,
    };
  }

  const s = rawSettings as Record<string, unknown>;

  return {
    enableBloodbath: typeof s.enable_bloodbath === "boolean" ? s.enable_bloodbath : true,
    enableMuttations: typeof s.enable_muttations === "boolean" ? s.enable_muttations : true,
    enableDisasters: typeof s.enable_disasters === "boolean" ? s.enable_disasters : true,
    enableSponsorDrops: typeof s.enable_sponsor_drops === "boolean" ? s.enable_sponsor_drops : true,
    enableMidGameFeast: typeof s.enable_mid_game_feast === "boolean" ? s.enable_mid_game_feast : true,
    pacing: typeof s.pacing === "string" ? (s.pacing as EngineGameSettings["pacing"]) : "cinematic",
    turnGranularity:
      typeof s.turn_granularity === "string"
        ? (s.turn_granularity as EngineGameSettings["turnGranularity"])
        : "event_by_event",
    combatLethality:
      typeof s.combat_lethality === "string"
        ? (s.combat_lethality as EngineGameSettings["combatLethality"])
        : "balanced",
    sponsorGenerosity:
      typeof s.sponsor_generosity === "string"
        ? (s.sponsor_generosity as EngineGameSettings["sponsorGenerosity"])
        : "standard",
    muttationTiming:
      typeof s.muttation_timing === "string"
        ? (s.muttation_timing as EngineGameSettings["muttationTiming"])
        : "climax_only",
    disasterFrequency:
      typeof s.disaster_frequency === "string"
        ? (s.disaster_frequency as EngineGameSettings["disasterFrequency"])
        : "moderate",
    allianceDynamic:
      typeof s.alliance_dynamic === "string"
        ? (s.alliance_dynamic as EngineGameSettings["allianceDynamic"])
        : "dynamic_pacts",
    narrativeVoice:
      typeof s.narrative_voice === "string"
        ? (s.narrative_voice as EngineGameSettings["narrativeVoice"])
        : "novel_cinematic",
    victoryCondition:
      typeof s.victory_condition === "string"
        ? (s.victory_condition as EngineGameSettings["victoryCondition"])
        : "sole_victor",
  };
}
