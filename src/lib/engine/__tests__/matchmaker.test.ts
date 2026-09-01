import { describe, it, expect } from "vitest";
import { partitionTributesIntoEncounters, generatePartitionSizes } from "../matchmaker";
import { bootstrapInitialAlliances } from "../alliances";
import { createPRNG } from "../prng";
import { createInitialBiometrics } from "../biometrics";
import { EngineTribute, EngineGameSettings, EngineAlliance } from "../types";

function createMockRoster(count: number, gameId = "game-test"): EngineTribute[] {
  const tributes: EngineTribute[] = [];
  for (let i = 1; i <= count; i++) {
    const district = Math.min(12, Math.ceil(i / 2));
    tributes.push({
      id: `tribute-${i}`,
      gameId,
      name: `Tribute ${i}`,
      district,
      gender: i % 2 === 0 ? "female" : "male",
      personality: "Resourceful competitor",
      physicalAspect: "Athletic build",
      avatarUrl: null,
      status: "alive",
      killCount: 0,
      biometrics: createInitialBiometrics(),
      inventory: [],
      deathPhaseId: null,
      placement: null,
    });
  }
  return tributes;
}

const defaultSettings: EngineGameSettings = {
  enableBloodbath: true,
  enableMuttations: true,
  enableDisasters: true,
  enableSponsorDrops: true,
  enableMidGameFeast: true,
  pacing: "cinematic",
  turnGranularity: "event_by_event",
  combatLethality: "balanced",
  sponsorGenerosity: "standard",
  muttationTiming: "climax_only",
  disasterFrequency: "moderate",
  allianceDynamic: "dynamic_pacts",
  narrativeVoice: "novel_cinematic",
  victoryCondition: "sole_victor",
};

describe("Dynamic Slot-Based Partitioner & Matchmaker", () => {
  // ==========================================
  // 1. Formation Combinatorics Tests
  // ==========================================
  describe("Formation Combinatorics & Hard Slot Constraints", () => {
    it("strictly bounds all encounters to max 4 tributes and max 2 NPCs", () => {
      const roster = createMockRoster(24);
      const prng = createPRNG(42);
      const alliances = bootstrapInitialAlliances(roster, "career_pack", "game-1", prng);

      const result = partitionTributesIntoEncounters({
        gameId: "game-1",
        dayNumber: 1,
        phaseType: "day",
        aliveTributes: roster,
        alliances,
        settings: defaultSettings,
        prng,
      });

      expect(result.encounters.length).toBeGreaterThan(0);
      for (const enc of result.encounters) {
        expect(enc.tributeIds.length).toBeGreaterThanOrEqual(1);
        expect(enc.tributeIds.length).toBeLessThanOrEqual(4);
        expect(enc.npcs.length).toBeGreaterThanOrEqual(0);
        expect(enc.npcs.length).toBeLessThanOrEqual(2);
      }
    });

    it("generates valid 1-tribute solo formations", () => {
      const roster = createMockRoster(1);
      const prng = createPRNG(1);

      const result = partitionTributesIntoEncounters({
        gameId: "game-solo",
        dayNumber: 5,
        phaseType: "day",
        aliveTributes: roster,
        alliances: new Map(),
        settings: defaultSettings,
        prng,
      });

      expect(result.encounters).toHaveLength(1);
      const enc = result.encounters[0];
      expect(enc.tributeIds).toHaveLength(1);
      expect(enc.factions).toHaveLength(1);
      expect(enc.factions[0].tributeIds).toEqual([roster[0].id]);
    });

    it("generates 2-tribute encounters (1v1 duels, standoffs, or coop)", () => {
      const roster = createMockRoster(2);
      const prng = createPRNG(77);

      const result = partitionTributesIntoEncounters({
        gameId: "game-duo",
        dayNumber: 1,
        phaseType: "day",
        aliveTributes: roster,
        alliances: new Map(),
        settings: defaultSettings,
        prng,
      });

      expect(result.encounters).toHaveLength(1);
      const enc = result.encounters[0];
      expect(enc.tributeIds).toHaveLength(2);
      expect(["duel_1v1", "standoff_1v1", "peaceful_encounter_2"]).toContain(enc.formationType);
    });

    it("generates 3-tribute encounters (1v1v1 FFA, 1v2 Pack Ambush, Spontaneous Truce)", () => {
      const roster = createMockRoster(3);
      const prng = createPRNG(99);

      const result = partitionTributesIntoEncounters({
        gameId: "game-trio",
        dayNumber: 2,
        phaseType: "day",
        aliveTributes: roster,
        alliances: new Map(),
        settings: defaultSettings,
        prng,
      });

      expect(result.encounters).toHaveLength(1);
      const enc = result.encounters[0];
      expect(enc.tributeIds).toHaveLength(3);
      expect(["ffa_3way", "spontaneous_truce_1v2", "ambush_1v2", "coop_pve_3"]).toContain(enc.formationType);
    });

    it("generates 4-tribute encounters (4-Way FFA, 2v2 Squad War, 1v3 Stand)", () => {
      const roster = createMockRoster(4);
      // Create 2 allied duos for 2v2 test
      const allianceA: EngineAlliance = {
        id: "a-1",
        gameId: "game-quad",
        tributeIds: ["tribute-1", "tribute-2"],
        status: "active",
        formedPhaseId: null,
        dissolvedPhaseId: null,
        betrayedByTributeId: null,
      };
      const allianceB: EngineAlliance = {
        id: "a-2",
        gameId: "game-quad",
        tributeIds: ["tribute-3", "tribute-4"],
        status: "active",
        formedPhaseId: null,
        dissolvedPhaseId: null,
        betrayedByTributeId: null,
      };
      const alliances = new Map<string, EngineAlliance>([
        [allianceA.id, allianceA],
        [allianceB.id, allianceB],
      ]);

      const prng = createPRNG(1234);

      const result = partitionTributesIntoEncounters({
        gameId: "game-quad",
        dayNumber: 3,
        phaseType: "day",
        aliveTributes: roster,
        alliances,
        settings: defaultSettings,
        prng,
      });

      expect(result.encounters.length).toBeGreaterThanOrEqual(1);
      const enc = result.encounters[0];
      if (enc.tributeIds.length === 4) {
        expect(enc.formationType).toBe("squad_war_2v2");
        expect(enc.factions).toHaveLength(2);
      }
    });
  });

  // ==========================================
  // 2. Roster Boundary Tests (2 to 48 Tributes)
  // ==========================================
  describe("Roster Boundary Invariant Tests (2 to 48 Tributes)", () => {
    // Test all even and odd counts from 2 to 48
    const countsToTest = Array.from({ length: 47 }, (_, i) => i + 2); // 2, 3, 4, ..., 48

    it.each(countsToTest)(
      "guarantees 100% coverage, 0 dropped tributes, and 0 duplicates for %i tributes",
      (count) => {
        const roster = createMockRoster(count);
        const prng = createPRNG(`boundary-test-seed-${count}`);
        const alliances = bootstrapInitialAlliances(roster, "career_pack", "game-boundary", prng);

        const result = partitionTributesIntoEncounters({
          gameId: "game-boundary",
          dayNumber: 1,
          phaseType: "day",
          aliveTributes: roster,
          alliances,
          settings: defaultSettings,
          prng,
        });

        // 1. Zero unmatched/leaked tributes
        expect(result.unmatchedTributes).toHaveLength(0);

        // 2. Exact tribute count sum invariant
        const totalTributesInEncounters = result.encounters.reduce(
          (sum, enc) => sum + enc.tributeIds.length,
          0
        );
        expect(totalTributesInEncounters).toBe(count);

        // 3. Zero duplicate tribute assignments
        const allAssignedIds = result.encounters.flatMap((e) => e.tributeIds);
        const uniqueIds = new Set(allAssignedIds);
        expect(uniqueIds.size).toBe(count);

        // 4. Invariant slot size bounds
        for (const enc of result.encounters) {
          expect(enc.tributeIds.length).toBeGreaterThanOrEqual(1);
          expect(enc.tributeIds.length).toBeLessThanOrEqual(4);
          expect(enc.npcs.length).toBeLessThanOrEqual(2);
        }
      }
    );

    it("verifies partition sizes generator composition integrity across large randomized trials", () => {
      const prng = createPRNG(999);
      for (let n = 2; n <= 48; n++) {
        for (let trial = 0; trial < 10; trial++) {
          const sizes = generatePartitionSizes(n, [], "day", prng);
          const sum = sizes.reduce((a, b) => a + b, 0);
          expect(sum).toBe(n);
          for (const s of sizes) {
            expect(s).toBeGreaterThanOrEqual(1);
            expect(s).toBeLessThanOrEqual(4);
          }
        }
      }
    });
  });

  // ==========================================
  // 3. Alliance Pairing & Dual Alliance Tests
  // ==========================================
  describe("Alliance Pairing & Invariant Safety", () => {
    it("never pits active formal allies as opposing combatants in the same encounter", () => {
      const roster = createMockRoster(8);
      const alliedIds = ["tribute-1", "tribute-2"];
      const alliance: EngineAlliance = {
        id: "alliance-pair",
        gameId: "game-test",
        tributeIds: alliedIds,
        status: "active",
        formedPhaseId: null,
        dissolvedPhaseId: null,
        betrayedByTributeId: null,
      };
      const alliances = new Map<string, EngineAlliance>([[alliance.id, alliance]]);

      // Run multiple seeds to verify invariant across shuffles
      for (let seed = 1; seed <= 20; seed++) {
        const prng = createPRNG(seed);
        const result = partitionTributesIntoEncounters({
          gameId: "game-test",
          dayNumber: 1,
          phaseType: "day",
          aliveTributes: roster,
          alliances,
          settings: defaultSettings,
          prng,
        });

        for (const enc of result.encounters) {
          const hasT1 = enc.tributeIds.includes("tribute-1");
          const hasT2 = enc.tributeIds.includes("tribute-2");

          if (hasT1 && hasT2) {
            // Both are in this encounter: They MUST be in the same faction or a cooperative encounter
            const t1Faction = enc.factions.find((f) => f.tributeIds.includes("tribute-1"));
            const t2Faction = enc.factions.find((f) => f.tributeIds.includes("tribute-2"));
            expect(t1Faction?.id).toBe(t2Faction?.id);
          }
        }
      }
    });

    it("creates spontaneous truces for unallied same-district tributes in 3-way encounters", () => {
      const katniss: EngineTribute = {
        id: "t-katniss",
        gameId: "game-truce",
        name: "Katniss",
        district: 12,
        gender: "female",
        personality: "Archer",
        physicalAspect: "Agile",
        avatarUrl: null,
        status: "alive",
        killCount: 0,
        biometrics: createInitialBiometrics(),
        inventory: [],
        deathPhaseId: null,
        placement: null,
      };
      const peeta: EngineTribute = {
        id: "t-peeta",
        gameId: "game-truce",
        name: "Peeta",
        district: 12,
        gender: "male",
        personality: "Baker",
        physicalAspect: "Strong",
        avatarUrl: null,
        status: "alive",
        killCount: 0,
        biometrics: createInitialBiometrics(),
        inventory: [],
        deathPhaseId: null,
        placement: null,
      };
      const cato: EngineTribute = {
        id: "t-cato",
        gameId: "game-truce",
        name: "Cato",
        district: 2,
        gender: "male",
        personality: "Career",
        physicalAspect: "Brute",
        avatarUrl: null,
        status: "alive",
        killCount: 2,
        biometrics: createInitialBiometrics(),
        inventory: [],
        deathPhaseId: null,
        placement: null,
      };

      const prng = createPRNG(42);
      const result = partitionTributesIntoEncounters({
        gameId: "game-truce",
        dayNumber: 2,
        phaseType: "day",
        aliveTributes: [katniss, peeta, cato],
        alliances: new Map(), // No formal alliance
        settings: defaultSettings,
        prng,
      });

      expect(result.encounters).toHaveLength(1);
      const enc = result.encounters[0];
      expect(enc.formationType).toBe("spontaneous_truce_1v2");
      const truceFaction = enc.factions.find((f) => f.isSpontaneousTruce);
      expect(truceFaction).toBeDefined();
      expect(new Set(truceFaction?.tributeIds)).toEqual(new Set(["t-katniss", "t-peeta"]));
    });

    it("spawns Alpha Mutts in climax endgame when remaining tributes <= 3", () => {
      const roster = createMockRoster(3);
      const prng = createPRNG(500);

      const result = partitionTributesIntoEncounters({
        gameId: "game-climax",
        dayNumber: 8,
        phaseType: "day",
        aliveTributes: roster,
        alliances: new Map(),
        settings: {
          ...defaultSettings,
          enableMuttations: true,
          muttationTiming: "climax_only",
        },
        prng,
      });

      expect(result.encounters).toHaveLength(1);
      const enc = result.encounters[0];
      expect(enc.npcs.length).toBeGreaterThan(0);
      expect(enc.npcs[0].name).toContain("Alpha");
    });
  });
});
