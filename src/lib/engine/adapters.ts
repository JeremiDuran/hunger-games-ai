/**
 * Hunger Games AI — Engine Adapters & Data Converters
 * Bidirectional mapping between Supabase DB models, Setup Wizard types, and Engine Domain models.
 */

import { Tables, TablesInsert, TablesUpdate, Json } from "@/types/database";
import { TributeData } from "@/types/setup";
import { DEFAULT_RULES_STATE } from "@/lib/schemas/setup";
import {
  EngineTribute,
  EngineAlliance,
  EngineGameState,
  EnginePhaseResult,
  EngineGameSettings,
  TributeBiometrics,
  PhysicalConditionTag,
  MentalConditionTag,
  AllianceStatus,
  PhaseType,
  CustomNPC,
} from "./types";
import {
  clampBiometric,
  clampSurvival,
  clampSanity,
  createInitialBiometrics,
  evaluatePhysicalTag,
  evaluateMentalTag,
} from "./biometrics";
import { EngineItem } from "./items/types";
import { isEngineItem } from "./items/buffs";

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
    const survival = clampSurvival(statsObj.survival);
    const sanity = clampSanity(statsObj.sanity);

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
 * Converts a Supabase `game_alliances` row into an EngineAlliance domain model.
 */
export function dbAllianceToEngine(row: Tables<"game_alliances">): EngineAlliance {
  return {
    id: row.id,
    gameId: row.game_id,
    tributeIds: row.tribute_ids,
    status: (row.status as AllianceStatus) || "active",
    formedPhaseId: row.formed_phase_id,
    dissolvedPhaseId: row.dissolved_phase_id,
    betrayedByTributeId: row.betrayed_by_tribute_id,
  };
}

/**
 * Converts an EngineAlliance domain model into a Supabase `game_alliances` insert payload.
 */
export function engineAllianceToDbPayload(
  alliance: EngineAlliance
): TablesInsert<"game_alliances"> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alliance.id);
  const payload: TablesInsert<"game_alliances"> = {
    game_id: alliance.gameId,
    tribute_ids: alliance.tributeIds,
    status: alliance.status,
    formed_phase_id: alliance.formedPhaseId,
    dissolved_phase_id: alliance.dissolvedPhaseId,
    betrayed_by_tribute_id: alliance.betrayedByTributeId,
  };
  if (isUuid) {
    payload.id = alliance.id;
  }
  return payload;
}

/**
 * Converts an EnginePhaseResult into database insert payloads for `game_phases` and `game_phase_events`.
 */
export function enginePhaseResultToDbPayloads(result: EnginePhaseResult): {
  phaseRow: TablesInsert<"game_phases">;
  eventRows: TablesInsert<"game_phase_events">[];
} {
  const phaseRow: TablesInsert<"game_phases"> = {
    id: result.phaseId,
    game_id: result.gameId,
    day_number: result.dayNumber,
    phase_type: result.phaseType,
    phase_order: result.phaseOrder,
    fallen_tribute_ids: result.fallenTributeIds,
    status: "completed",
  };

  const eventRows: TablesInsert<"game_phase_events">[] = result.events.map((event) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.eventId);
    const row: TablesInsert<"game_phase_events"> = {
      phase_id: result.phaseId,
      game_id: result.gameId,
      event_order: event.eventOrder,
      event_category: event.eventCategory,
      outcome_type: event.outcomeType,
      tribute_ids: event.tributeIds,
      killer_ids: event.killerIds,
      victim_ids: event.victimIds,
      narrative_text: event.narrativeText ?? "",
      state_delta: event.stateDeltas as unknown as Json,
    };
    if (isUuid) {
      row.id = event.eventId;
    }
    return row;
  });

  return { phaseRow, eventRows };
}

export interface DbGameStateInput {
  gameRow: Tables<"games">;
  tributeRows: Tables<"tributes">[];
  allianceRows?: Tables<"game_alliances">[];
  latestPhaseRow?: Tables<"game_phases"> | null;
  hasFeastOccurred?: boolean;
  phaseHistory?: Array<{ phase_type: string }>;
}

/**
 * Reconstructs a complete EngineGameState from relational Supabase database rows.
 */
export function dbGameStateToEngine(params: DbGameStateInput): EngineGameState {
  const {
    gameRow,
    tributeRows,
    allianceRows = [],
    latestPhaseRow,
    hasFeastOccurred: explicitHasFeast,
    phaseHistory,
  } = params;

  const tributes = new Map<string, EngineTribute>();
  for (const tRow of tributeRows) {
    tributes.set(tRow.id, dbTributeToEngine(tRow));
  }

  const alliances = new Map<string, EngineAlliance>();
  for (const aRow of allianceRows) {
    alliances.set(aRow.id, dbAllianceToEngine(aRow));
  }

  const settings = dbGameSettingsToEngine(gameRow.settings);

  // Compute current day, phase order, and phase type
  const phaseOrder = latestPhaseRow ? latestPhaseRow.phase_order : 0;
  const currentPhaseType = (gameRow.current_phase_type as PhaseType) || "bloodbath";
  const currentDay = gameRow.current_day ?? 0;

  // Derive hasFeastOccurred from explicit flag, phaseHistory, or latest phase
  const hasFeastOccurred =
    explicitHasFeast ??
    (phaseHistory
      ? phaseHistory.some((p) => p.phase_type === "feast")
      : latestPhaseRow?.phase_type === "feast" || currentPhaseType === "feast");

  // Derive current diurnal slot (day vs night)
  const isBloodbath = currentPhaseType === "bloodbath";
  const currentDiurnalSlot: "day" | "night" =
    isBloodbath || currentPhaseType === "day" || currentPhaseType === "feast"
      ? "day"
      : currentPhaseType === "night"
      ? "night"
      : settings.enableBloodbath
      ? phaseOrder % 2 === 0
        ? "day"
        : "night"
      : phaseOrder % 2 === 1
      ? "day"
      : "night";

  // Simple deterministic seed derived from game ID
  let seed = 42;
  for (let i = 0; i < gameRow.id.length; i++) {
    seed = (seed * 31 + gameRow.id.charCodeAt(i)) & 0x7fffffff;
  }

  return {
    gameId: gameRow.id,
    title: gameRow.title,
    arenaName: gameRow.arena_name,
    arenaDescription: gameRow.arena_description,
    currentDay,
    currentPhaseType,
    phaseOrder,
    status: gameRow.status,
    winnerIds: gameRow.winner_id ? [gameRow.winner_id] : null,
    tributes,
    alliances,
    settings,
    seed,
    hasFeastOccurred,
    currentDiurnalSlot,
  };
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
      enableSpecialEvents: DEFAULT_RULES_STATE.enableSpecialEvents,
      customNpcs: [],
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
    enableSpecialEvents: typeof s.enable_special_events === "boolean" ? s.enable_special_events : true,
    customNpcs: Array.isArray(s.custom_npcs) ? (s.custom_npcs as CustomNPC[]) : [],
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
