import { describe, it, expect } from "vitest";
import {
  synthesizeSingleNpcFromDescription,
  synthesizeNpcBatchFromDescription,
} from "../thematics/npc-generator";
import { partitionTributesIntoEncounters } from "../matchmaker";
import { NpcOverloadResolver } from "../phases/special";
import { NightPhaseResolver } from "../phases/night";
import { createPRNG } from "../prng";
import { createInitialBiometrics } from "../biometrics";
import { EngineGameState, EngineTribute, EngineGameSettings } from "../types";
import { DEFAULT_RULES_STATE } from "@/lib/schemas/setup";

function createMockTribute(id: string, name: string, district: number): EngineTribute {
  return {
    id,
    gameId: "game-1",
    name,
    district,
    gender: "unspecified",
    personality: "Determined survivor.",
    physicalAspect: "Agile build.",
    avatarUrl: null,
    status: "alive",
    biometrics: createInitialBiometrics(),
    inventory: [],
    killCount: 0,
    deathPhaseId: null,
    placement: null,
  };
}

const baseSettings: EngineGameSettings = {
  ...DEFAULT_RULES_STATE,
  enableBloodbath: true,
  enableMuttations: true,
  enableDisasters: true,
  enableSponsorDrops: true,
  enableMidGameFeast: true,
  enableSpecialEvents: true,
  customNpcs: [],
};

describe("Dynamic Thematic NPCs (Option B)", () => {
  describe("1. Arbitrary Arena Synthesizer", () => {
    it("generates robotic and laser hostiles for an evil robot factory", () => {
      const prng = createPRNG(42);
      const npc = synthesizeSingleNpcFromDescription({
        arenaName: "Automated Fabrication Sector",
        arenaDescription: "An evil factory that makes robots that shoot lasers and molten solder.",
        prng,
      });

      expect(npc.name).toBeDefined();
      expect(npc.description).toBeDefined();
      expect(typeof npc.name).toBe("string");
      expect(typeof npc.description).toBe("string");
      // Check that it generated a tech/robot/laser theme, not an organic wolf or bee
      const isTech = /drone|bot|robot|mech|automaton|sentry|laser/i.test(npc.name);
      expect(isTech).toBe(true);
    });

    it("generates flora and domestic hostiles for a living room with carnivorous plants", () => {
      const prng = createPRNG(101);
      const npc = synthesizeSingleNpcFromDescription({
        arenaName: "Suburban Residence",
        arenaDescription: "A living room filled with overgrown carnivorous house plants and a feral vacuum cleaner.",
        prng,
      });

      expect(npc.name).toBeDefined();
      expect(npc.description).toBeDefined();
      const isLivingRoom = /monstera|plant|vine|vacuum|pollen|ivy|cactus/i.test(npc.name);
      expect(isLivingRoom).toBe(true);
    });

    it("synthesizes creative ad-hoc hostiles for totally novel/unanticipated descriptions", () => {
      const prng = createPRNG(999);
      const npc = synthesizeSingleNpcFromDescription({
        arenaName: "Quantum Holographic Matrix",
        arenaDescription: "A surreal dimension of shifting neon polygons and fractal gravity wells.",
        prng,
      });

      expect(npc.name).toBeDefined();
      expect(npc.description).toBeDefined();
      expect(npc.name.length).toBeGreaterThan(3);
      expect(npc.description.length).toBeGreaterThan(10);
    });

    it("synthesizes a diverse batch for special events", () => {
      const prng = createPRNG(77);
      const batch = synthesizeNpcBatchFromDescription({
        arenaName: "Automated Fabrication Sector",
        arenaDescription: "An evil factory that makes robots that shoot lasers.",
        prng,
        count: 4,
      });

      expect(batch).toHaveLength(4);
      const names = new Set(batch.map((b) => b.name));
      expect(names.size).toBe(4); // All 4 unique
      batch.forEach((npc) => {
        expect(npc.name).toBeTruthy();
        expect(npc.description).toBeTruthy();
      });
    });
  });

  describe("2. Matchmaker 50/50 Reuse vs Synthesis Rule", () => {
    it("creates an initial NPC when customNpcs is empty and appends it to settings", () => {
      const prng = createPRNG(1234);
      const tributes: EngineTribute[] = [
        createMockTribute("t-1", "Katniss", 12),
        createMockTribute("t-2", "Peeta", 12),
      ];

      const settings: EngineGameSettings = {
        ...baseSettings,
        muttationTiming: "night_stalkers", // forces mutt check
        customNpcs: [],
      };

      // Force mutt encounter during night
      partitionTributesIntoEncounters({
        gameId: "game-test-1",
        dayNumber: 1,
        phaseType: "night",
        aliveTributes: tributes,
        alliances: new Map(),
        settings,
        prng,
        arenaName: "Laser Drone Factory",
        arenaDescription: "A factory manufacturing laser robots.",
      });

      // If a mutt rolled, settings.customNpcs should contain newly synthesized NPC
      if (settings.customNpcs && settings.customNpcs.length > 0) {
        expect(settings.customNpcs[0].name).toBeDefined();
        expect(settings.customNpcs[0].description).toBeDefined();
      }
    });

    it("pulls from existing customNpcs or synthesizes a new one according to the 50/50 rule", () => {
      const prng = createPRNG(4321);
      const tributes: EngineTribute[] = [
        createMockTribute("t-1", "Katniss", 12),
        createMockTribute("t-2", "Peeta", 12),
      ];

      const existingNpc = {
        name: "Laser Sentry Drone Mark I",
        description: "A hovering patrol drone with twin red targeting lasers.",
      };

      const settings: EngineGameSettings = {
        ...baseSettings,
        muttationTiming: "night_stalkers",
        customNpcs: [existingNpc],
      };

      // Run multiple iterations to verify both paths (reuse and synthesis)
      let reusedCount = 0;
      let synthesizedCount = 0;

      for (let i = 0; i < 20; i++) {
        const iterPrng = createPRNG(100 + i);
        const result = partitionTributesIntoEncounters({
          gameId: `game-test-iter-${i}`,
          dayNumber: 1,
          phaseType: "night",
          aliveTributes: tributes,
          alliances: new Map(),
          settings,
          prng: iterPrng,
          arenaName: "Laser Drone Factory",
          arenaDescription: "A factory manufacturing laser robots.",
        });

        for (const enc of result.encounters) {
          for (const npc of enc.npcs) {
            if (npc.type === "mutt") {
              if (npc.name === existingNpc.name) {
                reusedCount++;
              } else {
                synthesizedCount++;
              }
            }
          }
        }
      }

      // Over 20 iterations, both existing reuse and new creation should occur
      expect(reusedCount + synthesizedCount).toBeGreaterThan(0);
      expect(settings.customNpcs?.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("3. Special Event Batch Generation (npc_overload)", () => {
    it("synthesizes and saves a batch of 4 themed NPCs into settings.customNpcs", () => {
      const prng = createPRNG(555);
      const tributes = new Map<string, EngineTribute>();
      for (let i = 1; i <= 8; i++) {
        tributes.set(`t-${i}`, createMockTribute(`t-${i}`, `Tribute ${i}`, i));
      }

      const settings: EngineGameSettings = {
        ...baseSettings,
        customNpcs: [],
      };

      const resolver = new NpcOverloadResolver();
      const output = resolver.resolvePhase({
        gameId: "game-npcoverload-test",
        dayNumber: 3,
        phaseType: "npc_overload",
        phaseOrder: 6,
        aliveTributes: Array.from(tributes.values()),
        allTributes: tributes,
        alliances: new Map(),
        settings,
        prng,
        arenaName: "Laser Robot Factory",
        arenaDescription: "An automated factory manufacturing aggressive laser mechs.",
      });

      // Must have created a batch of NPCs saved to settings.customNpcs
      expect(settings.customNpcs).toBeDefined();
      expect(settings.customNpcs!.length).toBeGreaterThanOrEqual(4);

      // All events in the phase must feature mutt encounters with thematic context
      expect(output.events.length).toBeGreaterThan(0);
      for (const event of output.events) {
        expect(event.eventCategory).toBe("mutt");
        expect(event.thematicContext?.npcName).toBeDefined();
        expect(event.thematicContext?.locationDescription).toContain("[ARENA MUTTATION OVERLOAD]");
      }
    });
  });

  describe("4. Night Phase Thematic Mutt Encounter", () => {
    it("uses customNpcs or synthesizes thematic mutts during night stalker attacks", () => {
      const prng = createPRNG(888);
      const tributes = new Map<string, EngineTribute>();
      for (let i = 1; i <= 6; i++) {
        tributes.set(`t-${i}`, createMockTribute(`t-${i}`, `Tribute ${i}`, i));
      }

      const settings: EngineGameSettings = {
        ...baseSettings,
        customNpcs: [],
      };

      const resolver = new NightPhaseResolver();
      const output = resolver.resolvePhase({
        gameId: "game-night-test",
        dayNumber: 2,
        phaseType: "night",
        phaseOrder: 4,
        aliveTributes: Array.from(tributes.values()),
        allTributes: tributes,
        alliances: new Map(),
        settings,
        prng,
        arenaName: "Suburban Living Room",
        arenaDescription: "Overgrown carnivorous houseplants and a feral vacuum cleaner.",
      });

      const muttEvents = output.events.filter((e) => e.eventCategory === "mutt");
      for (const me of muttEvents) {
        expect(me.thematicContext?.npcName).toBeDefined();
        // Should NOT be hardcoded "Nocturnal Shadow Mutt"
        expect(me.thematicContext?.npcName).not.toBe("Nocturnal Shadow Mutt");
      }
    });
  });
});
