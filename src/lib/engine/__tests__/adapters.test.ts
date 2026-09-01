import { describe, it, expect } from "vitest";
import {
  parseDbTributeStats,
  parseDbInventory,
  dbTributeToEngine,
  engineTributeToDbUpdate,
  initializeEngineRoster,
  dbGameSettingsToEngine,
  dbAllianceToEngine,
  engineAllianceToDbPayload,
  enginePhaseResultToDbPayloads,
  dbGameStateToEngine,
} from "../adapters";
import { Tables } from "@/types/database";
import { TributeData } from "@/types/setup";
import { EngineAlliance, EnginePhaseResult, EngineTribute } from "../types";
import { createInitialBiometrics } from "../biometrics";

describe("Engine Adapters & Converters", () => {
  describe("parseDbTributeStats", () => {
    it("parses valid modern biometrics JSONB", () => {
      const raw = {
        survival: 68,
        sanity: 82,
        physical_tag: "scratched",
        mental_tag: "resolute",
      };

      const parsed = parseDbTributeStats(raw);
      expect(parsed.survival).toBe(68);
      expect(parsed.sanity).toBe(82);
      expect(parsed.physicalTag).toBe("scratched");
      expect(parsed.mentalTag).toBe("resolute");
    });

    it("evaluates tags automatically if missing from modern biometrics JSONB", () => {
      const raw = {
        survival: 90,
        sanity: 20,
      };

      const parsed = parseDbTributeStats(raw);
      expect(parsed.survival).toBe(90);
      expect(parsed.sanity).toBe(20);
      expect(parsed.physicalTag).toBe("unscathed");
      expect(parsed.mentalTag).toBe("paranoid");
    });

    it("handles legacy stats format ({ health: 100... }) fallback", () => {
      const legacy = {
        health: 100,
        strength: 50,
        agility: 50,
        intelligence: 50,
      };

      const parsed = parseDbTributeStats(legacy);
      expect(parsed.survival).toBe(50);
      expect(parsed.sanity).toBe(50);
      expect(parsed.physicalTag).toBe("unscathed");
      expect(parsed.mentalTag).toBe("composed");
    });

    it("falls back to default initial biometrics for null or corrupt data", () => {
      expect(parseDbTributeStats(null)).toEqual({
        survival: 50,
        sanity: 50,
        physicalTag: "unscathed",
        mentalTag: "composed",
      });
      expect(parseDbTributeStats("invalid string")).toEqual({
        survival: 50,
        sanity: 50,
        physicalTag: "unscathed",
        mentalTag: "composed",
      });
      expect(parseDbTributeStats([1, 2, 3])).toEqual({
        survival: 50,
        sanity: 50,
        physicalTag: "unscathed",
        mentalTag: "composed",
      });
    });
  });

  describe("parseDbInventory", () => {
    it("parses string array correctly", () => {
      expect(parseDbInventory(["bow", "knife"])).toEqual(["bow", "knife"]);
    });

    it("filters out non-string items unless valid EngineItem", () => {
      expect(parseDbInventory(["knife", 123, null, "water_flask"])).toEqual([
        "knife",
        "water_flask",
      ]);
    });

    it("returns empty array for invalid input", () => {
      expect(parseDbInventory(null)).toEqual([]);
      expect(parseDbInventory({})).toEqual([]);
      expect(parseDbInventory("string")).toEqual([]);
    });
  });

  describe("dbTributeToEngine & engineTributeToDbUpdate", () => {
    const mockDbRow: Tables<"tributes"> = {
      id: "tribute-uuid-1",
      game_id: "game-uuid-1",
      name: "Peeta Mellark",
      district: 12,
      gender: "male",
      personality: "Artistic and protective",
      physical_aspect: "Broad shoulders, blond hair",
      avatar_url: "https://example.com/peeta.png",
      status: "alive",
      kill_count: 1,
      stats: {
        survival: 45,
        sanity: 60,
        physical_tag: "wounded",
        mental_tag: "composed",
      },
      inventory: ["bread_loaf", "camouflage_clay"],
      death_phase_id: null,
      placement: null,
      created_at: "2026-08-31T00:00:00Z",
    };

    it("maps database row to EngineTribute domain model", () => {
      const engineTribute = dbTributeToEngine(mockDbRow);

      expect(engineTribute.id).toBe("tribute-uuid-1");
      expect(engineTribute.gameId).toBe("game-uuid-1");
      expect(engineTribute.name).toBe("Peeta Mellark");
      expect(engineTribute.district).toBe(12);
      expect(engineTribute.gender).toBe("male");
      expect(engineTribute.killCount).toBe(1);
      expect(engineTribute.biometrics.survival).toBe(45);
      expect(engineTribute.biometrics.sanity).toBe(60);
      expect(engineTribute.biometrics.physicalTag).toBe("wounded");
      expect(engineTribute.biometrics.mentalTag).toBe("composed");
      expect(engineTribute.inventory).toEqual(["bread_loaf", "camouflage_clay"]);
    });

    it("serializes EngineTribute back to Supabase database update payload", () => {
      const engineTribute: EngineTribute = {
        id: "tribute-uuid-1",
        gameId: "game-uuid-1",
        name: "Peeta Mellark",
        district: 12,
        gender: "male",
        personality: "Artistic and protective",
        physicalAspect: "Broad shoulders",
        avatarUrl: null,
        status: "dead",
        killCount: 2,
        biometrics: {
          survival: 0,
          sanity: 10,
          physicalTag: "fatal",
          mentalTag: "manic",
        },
        inventory: ["titanium_spear"],
        deathPhaseId: "phase-uuid-3",
        placement: 8,
      };

      const updatePayload = engineTributeToDbUpdate(engineTribute);

      expect(updatePayload.status).toBe("dead");
      expect(updatePayload.kill_count).toBe(2);
      expect(updatePayload.death_phase_id).toBe("phase-uuid-3");
      expect(updatePayload.placement).toBe(8);
      expect(updatePayload.inventory).toEqual(["titanium_spear"]);
      expect(updatePayload.stats).toEqual({
        survival: 0,
        sanity: 10,
        physical_tag: "fatal",
        mental_tag: "manic",
      });
    });
  });

  describe("dbAllianceToEngine & engineAllianceToDbPayload", () => {
    it("converts DB alliance row to EngineAlliance", () => {
      const row: Tables<"game_alliances"> = {
        id: "alliance-1",
        game_id: "game-1",
        tribute_ids: ["t1", "t2"],
        status: "active",
        formed_phase_id: "phase-1",
        dissolved_phase_id: null,
        betrayed_by_tribute_id: null,
        created_at: "2026-09-01T00:00:00Z",
      };

      const alliance = dbAllianceToEngine(row);
      expect(alliance.id).toBe("alliance-1");
      expect(alliance.tributeIds).toEqual(["t1", "t2"]);
      expect(alliance.status).toBe("active");
    });

    it("converts EngineAlliance to DB insert payload", () => {
      const alliance: EngineAlliance = {
        id: "c4b12345-6789-4abc-def0-123456789abc",
        gameId: "game-1",
        tributeIds: ["t1", "t2"],
        status: "betrayed",
        formedPhaseId: "phase-1",
        dissolvedPhaseId: "phase-2",
        betrayedByTributeId: "t1",
      };

      const payload = engineAllianceToDbPayload(alliance);
      expect(payload.game_id).toBe("game-1");
      expect(payload.status).toBe("betrayed");
      expect(payload.betrayed_by_tribute_id).toBe("t1");
      expect(payload.id).toBe("c4b12345-6789-4abc-def0-123456789abc");
    });
  });

  describe("enginePhaseResultToDbPayloads", () => {
    it("creates typed insert rows for game_phases and game_phase_events", () => {
      const result: EnginePhaseResult = {
        phaseId: "e9a11111-2222-4333-8444-555555555555",
        gameId: "game-uuid-1",
        dayNumber: 1,
        phaseType: "day",
        phaseOrder: 2,
        fallenTributeIds: ["t2"],
        updatedTributes: new Map(),
        isVictoryTriggered: false,
        winnerIds: null,
        events: [
          {
            eventId: "f8b11111-2222-4333-8444-555555555555",
            eventOrder: 1,
            eventCategory: "combat",
            outcomeType: "death",
            tributeIds: ["t1", "t2"],
            killerIds: ["t1"],
            victimIds: ["t2"],
            narrativeText: "Katniss shoots an arrow.",
            stateDeltas: {},
          },
        ],
      };

      const { phaseRow, eventRows } = enginePhaseResultToDbPayloads(result);

      expect(phaseRow.id).toBe("e9a11111-2222-4333-8444-555555555555");
      expect(phaseRow.game_id).toBe("game-uuid-1");
      expect(phaseRow.day_number).toBe(1);
      expect(phaseRow.phase_type).toBe("day");
      expect(phaseRow.phase_order).toBe(2);
      expect(phaseRow.fallen_tribute_ids).toEqual(["t2"]);

      expect(eventRows).toHaveLength(1);
      expect(eventRows[0].phase_id).toBe(phaseRow.id);
      expect(eventRows[0].event_category).toBe("combat");
      expect(eventRows[0].killer_ids).toEqual(["t1"]);
      expect(eventRows[0].victim_ids).toEqual(["t2"]);
    });
  });

  describe("dbGameStateToEngine", () => {
    it("reconstructs complete EngineGameState from relational tables", () => {
      const gameRow: Tables<"games"> = {
        id: "g-100",
        user_id: "u-1",
        title: "The 74th Hunger Games",
        arena_name: "Verdant Tropics",
        arena_description: "Dense jungle.",
        status: "in_progress",
        current_day: 2,
        current_phase_type: "day",
        tribute_count: 2,
        winner_id: null,
        settings: {
          enable_bloodbath: true,
          combat_lethality: "balanced",
        },
        created_at: "2026-09-01T00:00:00Z",
        updated_at: "2026-09-01T00:00:00Z",
        ended_at: null,
      };

      const tributeRows: Tables<"tributes">[] = [
        {
          id: "t1",
          game_id: "g-100",
          name: "Katniss",
          district: 12,
          gender: "female",
          personality: "Tactical",
          physical_aspect: "Lean",
          avatar_url: null,
          status: "alive",
          kill_count: 1,
          stats: { survival: 50, sanity: 50 },
          inventory: [],
          death_phase_id: null,
          placement: null,
          created_at: "2026-09-01T00:00:00Z",
        },
      ];

      const latestPhaseRow: Tables<"game_phases"> = {
        id: "p-1",
        game_id: "g-100",
        day_number: 1,
        phase_type: "night",
        phase_order: 2,
        fallen_tribute_ids: [],
        status: "completed",
        created_at: "2026-09-01T00:00:00Z",
      };

      const gameState = dbGameStateToEngine({
        gameRow,
        tributeRows,
        latestPhaseRow,
      });

      expect(gameState.gameId).toBe("g-100");
      expect(gameState.title).toBe("The 74th Hunger Games");
      expect(gameState.currentDay).toBe(2);
      expect(gameState.phaseOrder).toBe(2);
      expect(gameState.tributes.size).toBe(1);
      expect(gameState.settings.enableBloodbath).toBe(true);
    });
  });

  describe("initializeEngineRoster", () => {
    it("creates in-memory Map of EngineTributes from TributeData array", () => {
      const setupTributes: TributeData[] = [
        {
          id: "t1",
          name: "Katniss",
          district: 12,
          gender: "female",
          personality: "Archer",
          physicalAspect: "Braid",
          avatarUrl: null,
        },
        {
          id: "t2",
          name: "Peeta",
          district: 12,
          gender: "male",
          personality: "Baker",
          physicalAspect: "Blond",
          avatarUrl: null,
        },
      ];

      const roster = initializeEngineRoster(setupTributes, "game-100");

      expect(roster.size).toBe(2);
      const katniss = roster.get("t1");
      expect(katniss).toBeDefined();
      expect(katniss?.name).toBe("Katniss");
      expect(katniss?.gameId).toBe("game-100");
      expect(katniss?.status).toBe("alive");
      expect(katniss?.biometrics.survival).toBe(50);
      expect(katniss?.biometrics.sanity).toBe(50);
      expect(katniss?.inventory).toEqual([]);
    });
  });

  describe("dbGameSettingsToEngine", () => {
    it("converts snake_case database settings to camelCase EngineGameSettings", () => {
      const dbSettings = {
        enable_bloodbath: false,
        enable_muttations: true,
        enable_disasters: false,
        enable_sponsor_drops: true,
        enable_mid_game_feast: false,
        pacing: "instant",
        turn_granularity: "autoplay",
        combat_lethality: "high_bloodbath",
        sponsor_generosity: "abundance",
        muttation_timing: "night_stalkers",
        disaster_frequency: "frequent",
        alliance_dynamic: "career_pack",
        narrative_voice: "capitol_broadcast",
        victory_condition: "district_duo_twist",
      };

      const settings = dbGameSettingsToEngine(dbSettings);

      expect(settings.enableBloodbath).toBe(false);
      expect(settings.enableMuttations).toBe(true);
      expect(settings.enableDisasters).toBe(false);
      expect(settings.enableSponsorDrops).toBe(true);
      expect(settings.enableMidGameFeast).toBe(false);
      expect(settings.pacing).toBe("instant");
      expect(settings.turnGranularity).toBe("autoplay");
      expect(settings.combatLethality).toBe("high_bloodbath");
      expect(settings.sponsorGenerosity).toBe("abundance");
      expect(settings.muttationTiming).toBe("night_stalkers");
      expect(settings.disasterFrequency).toBe("frequent");
      expect(settings.allianceDynamic).toBe("career_pack");
      expect(settings.narrativeVoice).toBe("capitol_broadcast");
      expect(settings.victoryCondition).toBe("district_duo_twist");
    });

    it("applies sensible defaults for empty or null DB settings", () => {
      const settings = dbGameSettingsToEngine(null);

      expect(settings.enableBloodbath).toBe(true);
      expect(settings.combatLethality).toBe("balanced");
      expect(settings.turnGranularity).toBe("event_by_event");
      expect(settings.victoryCondition).toBe("sole_victor");
    });
  });
});
