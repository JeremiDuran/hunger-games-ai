import { describe, it, expect } from "vitest";
import { CataclysmResolver, NpcOverloadResolver } from "../phases/special";
import {
  synthesizeArenaCataclysm,
  synthesizeThemedArenaNpcs,
} from "../thematics/arena-synthesizer";
import { advanceGamePhase, computeNextPhaseStep } from "../orchestrator";
import { createPRNG } from "../prng";
import { createInitialBiometrics } from "../biometrics";
import { EngineGameState, EngineTribute, EngineGameSettings } from "../types";
import { DEFAULT_RULES_STATE } from "@/lib/schemas/setup";

const mockSettings: EngineGameSettings = {
  ...DEFAULT_RULES_STATE,
  enableBloodbath: true,
  enableMuttations: true,
  enableDisasters: true,
  enableSponsorDrops: true,
};

function createMockTribute(id: string, name: string, district = 1): EngineTribute {
  return {
    id,
    gameId: "game-test-spec",
    name,
    district,
    gender: "male",
    personality: "Determined",
    physicalAspect: "Agile",
    avatarUrl: null,
    status: "alive",
    killCount: 0,
    biometrics: createInitialBiometrics(),
    inventory: [],
    deathPhaseId: null,
    placement: null,
  };
}

describe("Special Phases: Cataclysms & NPC Overloads", () => {
  describe("1. Arena Thematic Synthesizer", () => {
    it("synthesizes volcanic disaster & mutts for caldera arena", () => {
      const prng = createPRNG("test-volcanic-prng");
      const cataclysm = synthesizeArenaCataclysm({
        arenaName: "The Floor is Lava Caldera",
        arenaDescription: "A volcanic expanse of molten magma, obsidian plates, and sulfurous vents.",
        prng,
      });

      expect(cataclysm.hazardType).toBeDefined();
      expect(cataclysm.name.length).toBeGreaterThan(5);
      expect(cataclysm.description.length).toBeGreaterThan(20);

      const npcs = synthesizeThemedArenaNpcs({
        arenaName: "The Floor is Lava Caldera",
        arenaDescription: "A volcanic expanse of molten magma, obsidian plates, and sulfurous vents.",
        prng,
        count: 3,
      });

      expect(npcs.length).toBe(3);
      expect(npcs.some((npc) => npc.toLowerCase().includes("obsidian") || npc.toLowerCase().includes("magma") || npc.toLowerCase().includes("volcanic") || npc.toLowerCase().includes("sulfur"))).toBe(true);
    });

    it("synthesizes arctic blizzard & dire wolf mutts for tundra arena", () => {
      const prng = createPRNG("test-arctic-prng");
      const cataclysm = synthesizeArenaCataclysm({
        arenaName: "Frozen Tundra",
        arenaDescription: "Sub-zero blizzard terrain with glacial ice crevasses.",
        prng,
      });

      expect(["blizzard", "avalanche", "frost"]).toContain(cataclysm.hazardType);

      const npcs = synthesizeThemedArenaNpcs({
        arenaName: "Frozen Tundra",
        arenaDescription: "Sub-zero blizzard terrain with glacial ice crevasses.",
        prng,
        count: 3,
      });

      expect(npcs.length).toBe(3);
      expect(npcs.some((npc) => npc.toLowerCase().includes("glacial") || npc.toLowerCase().includes("frost") || npc.toLowerCase().includes("blizzard") || npc.toLowerCase().includes("arctic"))).toBe(true);
    });

    it("synthesizes industrial laser lockdown & mechs for evil robot factory", () => {
      const prng = createPRNG("test-factory-prng");
      const cataclysm = synthesizeArenaCataclysm({
        arenaName: "Automated Fabrication Facility",
        arenaDescription: "An evil factory that makes robots that shoot lasers.",
        prng,
      });

      expect(["laser_grid", "foundry_meltdown", "electrical_arc"]).toContain(cataclysm.hazardType);
      expect(cataclysm.name).toMatch(/laser|factory|meltdown|lockdown|arc/i);

      const npcs = synthesizeThemedArenaNpcs({
        arenaName: "Automated Fabrication Facility",
        arenaDescription: "An evil factory that makes robots that shoot lasers.",
        prng,
        count: 3,
      });

      expect(npcs.length).toBe(3);
      expect(npcs.some((npc) => /drone|bot|robot|mech|automaton|sentry|laser/i.test(npc))).toBe(true);
    });

    it("synthesizes plant surge & floral hostiles for living room with carnivorous houseplants", () => {
      const prng = createPRNG("test-living-room-prng");
      const cataclysm = synthesizeArenaCataclysm({
        arenaName: "Living Room Residence",
        arenaDescription: "Overgrown carnivorous houseplants and a feral vacuum cleaner.",
        prng,
      });

      expect(["plant_surge", "spore_cloud", "debris_collapse"]).toContain(cataclysm.hazardType);

      const npcs = synthesizeThemedArenaNpcs({
        arenaName: "Living Room Residence",
        arenaDescription: "Overgrown carnivorous houseplants and a feral vacuum cleaner.",
        prng,
        count: 3,
      });

      expect(npcs.length).toBe(3);
      expect(npcs.some((npc) => /plant|monstera|vacuum|pollen|ivy|cactus/i.test(npc))).toBe(true);
    });

    it("synthesizes custom ad-hoc cataclysms for completely novel/unindexed prompts", () => {
      const prng = createPRNG("test-novel-prng");
      const cataclysm = synthesizeArenaCataclysm({
        arenaName: "Caramel Candyland",
        arenaDescription: "A whimsical dimension of boiling molten caramel rivers and gingerbread towers.",
        prng,
      });

      expect(cataclysm.hazardType).toBe("environmental_cataclysm");
      expect(cataclysm.name).toMatch(/Caramel|Candyland|Molten|Gingerbread|Dimension/i);
      expect(cataclysm.description).toContain("boiling molten caramel");
    });
  });

  describe("2. Cataclysm Phase Resolver", () => {
    it("elevates lethality and feeds thematic context to 100% of event outcomes", () => {
      const prng = createPRNG("test-cataclysm-resolver");
      const tributes = new Map<string, EngineTribute>();
      for (let i = 1; i <= 6; i++) {
        tributes.set(`t-${i}`, createMockTribute(`t-${i}`, `Tribute ${i}`, i));
      }

      const resolver = new CataclysmResolver();
      const result = resolver.resolvePhase({
        gameId: "game-cataclysm-spec",
        dayNumber: 3,
        phaseType: "cataclysm",
        phaseOrder: 6,
        aliveTributes: Array.from(tributes.values()),
        allTributes: tributes,
        alliances: new Map(),
        settings: mockSettings,
        prng,
        arenaName: "The Floor is Lava Caldera",
        arenaDescription: "A volatile volcanic caldera with incandescent molten magma.",
      });

      expect(result.events.length).toBe(6);
      for (const event of result.events) {
        expect(event.eventCategory).toBe("hazard");
        expect(event.thematicContext?.hazardName).toBeDefined();
        expect(event.thematicContext?.locationDescription).toContain("[ARENA CATACLYSM]");
      }
    });
  });

  describe("3. NPC Overload Phase Resolver", () => {
    it("generates in-memory themed beasts and assigns them across all encounters", () => {
      const prng = createPRNG("test-npcoverload-resolver");
      const tributes = new Map<string, EngineTribute>();
      for (let i = 1; i <= 8; i++) {
        tributes.set(`t-${i}`, createMockTribute(`t-${i}`, `Tribute ${i}`, i));
      }

      const resolver = new NpcOverloadResolver();
      const result = resolver.resolvePhase({
        gameId: "game-npcoverload-spec",
        dayNumber: 4,
        phaseType: "npc_overload",
        phaseOrder: 8,
        aliveTributes: Array.from(tributes.values()),
        allTributes: tributes,
        alliances: new Map(),
        settings: mockSettings,
        prng,
        arenaName: "The Floor is Lava Caldera",
        arenaDescription: "Molten magma terrain with sulfurous vents.",
      });

      expect(result.events.length).toBeGreaterThanOrEqual(2);
      for (const event of result.events) {
        expect(event.eventCategory).toBe("mutt");
        expect(event.thematicContext?.npcName).toBeDefined();
        expect(event.thematicContext?.locationDescription).toContain("[ARENA MUTTATION OVERLOAD]");
      }
    });
  });

  describe("4. Diurnal Replacement in State Machine", () => {
    it("cleanly transitions Daytime Cataclysm to Nighttime of the same day", () => {
      const tributes = new Map<string, EngineTribute>();
      for (let i = 1; i <= 6; i++) {
        tributes.set(`t-${i}`, createMockTribute(`t-${i}`, `Tribute ${i}`, i));
      }

      const state: EngineGameState = {
        gameId: "game-diurnal-test",
        title: "The 74th Hunger Games",
        arenaName: "The Floor is Lava Caldera",
        arenaDescription: "Volcanic caldera.",
        currentDay: 3,
        currentPhaseType: "cataclysm",
        currentDiurnalSlot: "day",
        phaseOrder: 6,
        status: "in_progress",
        winnerIds: null,
        tributes,
        alliances: new Map(),
        settings: mockSettings,
        seed: 1234,
      };

      const { nextGameState } = advanceGamePhase({ gameState: state });

      // After Day 3 Daytime Cataclysm, next must be Nighttime on Day 3
      expect(nextGameState.currentDay).toBe(3);
      expect(["night", "npc_overload", "cataclysm"]).toContain(nextGameState.currentPhaseType);
      expect(nextGameState.currentDiurnalSlot).toBe("night");
    });

    it("cleanly transitions Nighttime Mutt Overload to Daytime of the next day", () => {
      const tributes = new Map<string, EngineTribute>();
      for (let i = 1; i <= 6; i++) {
        tributes.set(`t-${i}`, createMockTribute(`t-${i}`, `Tribute ${i}`, i));
      }

      const state: EngineGameState = {
        gameId: "game-diurnal-test-2",
        title: "The 74th Hunger Games",
        arenaName: "The Floor is Lava Caldera",
        arenaDescription: "Volcanic caldera.",
        currentDay: 3,
        currentPhaseType: "npc_overload",
        currentDiurnalSlot: "night",
        phaseOrder: 7,
        status: "in_progress",
        winnerIds: null,
        tributes,
        alliances: new Map(),
        settings: mockSettings,
        seed: 5678,
      };

      const { nextGameState } = advanceGamePhase({ gameState: state });

      // After Day 3 Nighttime Mutt Overload, next must be Daytime on Day 4
      expect(nextGameState.currentDay).toBe(4);
      expect(["day", "feast", "cataclysm", "npc_overload"]).toContain(nextGameState.currentPhaseType);
      expect(nextGameState.currentDiurnalSlot).toBe("day");
    });
  });

  describe("5. User Toggle & Day 3 Constraint for Special Events", () => {
    it("never triggers special events when enableSpecialEvents is false", () => {
      const tributes = new Map<string, EngineTribute>();
      for (let i = 1; i <= 6; i++) {
        tributes.set(`t-${i}`, createMockTribute(`t-${i}`, `Tribute ${i}`, i));
      }

      const disabledSettings: EngineGameSettings = {
        ...mockSettings,
        enableSpecialEvents: false,
        enableMidGameFeast: false,
      };

      for (let day = 1; day <= 10; day++) {
        const dayState: EngineGameState = {
          gameId: `test-disabled-${day}`,
          title: "Test",
          arenaName: "Arena",
          arenaDescription: "Arena desc",
          currentDay: day,
          currentPhaseType: "day",
          currentDiurnalSlot: "day",
          phaseOrder: day * 2,
          status: "in_progress",
          winnerIds: null,
          tributes,
          alliances: new Map(),
          settings: disabledSettings,
          seed: day * 100,
        };

        const nextStep = computeNextPhaseStep({ gameState: dayState });
        expect(nextStep.nextPhaseType).toBe("night");

        const nightState: EngineGameState = {
          ...dayState,
          currentPhaseType: "night",
          currentDiurnalSlot: "night",
          phaseOrder: day * 2 + 1,
        };

        const nextNightStep = computeNextPhaseStep({ gameState: nightState });
        expect(nextNightStep.nextPhaseType).toBe("day");
      }
    });

    it("never triggers special events before Day 3 even when enabled", () => {
      const tributes = new Map<string, EngineTribute>();
      for (let i = 1; i <= 6; i++) {
        tributes.set(`t-${i}`, createMockTribute(`t-${i}`, `Tribute ${i}`, i));
      }

      const enabledSettings: EngineGameSettings = {
        ...mockSettings,
        enableSpecialEvents: true,
        enableMidGameFeast: false,
      };

      // Day 1 & Day 2 checks across multiple seeds
      for (let seed = 1; seed <= 50; seed++) {
        const day1State: EngineGameState = {
          gameId: `test-early-${seed}`,
          title: "Test",
          arenaName: "Arena",
          arenaDescription: "Arena desc",
          currentDay: 1,
          currentPhaseType: "day",
          currentDiurnalSlot: "day",
          phaseOrder: 2,
          status: "in_progress",
          winnerIds: null,
          tributes,
          alliances: new Map(),
          settings: enabledSettings,
          seed,
        };

        expect(computeNextPhaseStep({ gameState: day1State }).nextPhaseType).toBe("night");

        const day2NightState: EngineGameState = {
          ...day1State,
          currentDay: 2,
          currentPhaseType: "day",
          phaseOrder: 4,
        };

        expect(computeNextPhaseStep({ gameState: day2NightState }).nextPhaseType).toBe("night");
      }
    });
  });
});
