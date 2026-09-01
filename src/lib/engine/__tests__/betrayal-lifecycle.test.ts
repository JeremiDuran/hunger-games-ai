import { describe, it, expect } from "vitest";
import { createPRNG } from "../prng";
import { advanceGamePhase } from "../orchestrator";
import { NightPhaseResolver } from "../phases/night";
import { DayPhaseResolver } from "../phases/day";
import {
  calculateTributeAffinity,
  calculateAllianceCohesion,
  getAllianceSizeCapForRoster,
  bootstrapInitialAlliances,
  createAlliance,
  dissolveAlliance,
  betrayAlliance,
  evaluateAllianceStrain,
  syncDegradedAlliances,
} from "../alliances";
import {
  EngineGameState,
  EngineTribute,
  EngineAlliance,
  EngineGameSettings,
} from "../types";
import { createInitialBiometrics } from "../biometrics";
import { DEFAULT_RULES_STATE } from "@/lib/schemas/setup";

function createMockTribute(overrides: Partial<EngineTribute> = {}): EngineTribute {
  const id = overrides.id ?? `t-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    gameId: overrides.gameId ?? "game-lifecycle-1",
    name: overrides.name ?? `Tribute ${id}`,
    district: overrides.district ?? 12,
    gender: overrides.gender ?? "male",
    personality: overrides.personality ?? "Resourceful",
    physicalAspect: overrides.physicalAspect ?? "Athletic",
    avatarUrl: overrides.avatarUrl ?? null,
    status: overrides.status ?? "alive",
    killCount: overrides.killCount ?? 0,
    biometrics: overrides.biometrics ?? createInitialBiometrics(),
    inventory: overrides.inventory ?? [],
    deathPhaseId: overrides.deathPhaseId ?? null,
    placement: overrides.placement ?? null,
  };
}

describe("Persistent Alliances & Betrayal Lifecycle Test Suite", () => {
  const defaultSettings: EngineGameSettings = {
    ...DEFAULT_RULES_STATE,
    enableBloodbath: true,
    enableMuttations: true,
    enableDisasters: true,
    enableSponsorDrops: true,
    combatLethality: "balanced",
  };

  // =========================================================================
  // 1. Multi-Phase Alliance Lifecycle Tests
  // =========================================================================
  describe("Multi-Phase Alliance Lifecycle", () => {
    it("scales initial career pack size down to 3 for small matches (12 tributes)", () => {
      const prng = createPRNG(42);
      const smallRoster = Array.from({ length: 12 }, (_, i) =>
        createMockTribute({
          id: `t-d${Math.floor(i / 2) + 1}-${i % 2 === 0 ? "a" : "b"}`,
          district: Math.floor(i / 2) + 1,
        })
      );

      expect(getAllianceSizeCapForRoster(smallRoster.length)).toBe(3);

      const alliances = bootstrapInitialAlliances(smallRoster, "career_pack", "g-small", prng);
      expect(alliances.size).toBeGreaterThanOrEqual(1);

      for (const alliance of alliances.values()) {
        expect(alliance.tributeIds.length).toBeLessThanOrEqual(3);
        expect(alliance.status).toBe("active");
      }
    });

    it("creates standard 4-5 tribute career packs for standard matches (24 tributes)", () => {
      const prng = createPRNG(99);
      const standardRoster = Array.from({ length: 24 }, (_, i) =>
        createMockTribute({
          id: `t-d${Math.floor(i / 2) + 1}-${i % 2 === 0 ? "a" : "b"}`,
          district: Math.floor(i / 2) + 1,
        })
      );

      const alliances = bootstrapInitialAlliances(standardRoster, "career_pack", "g-std", prng);
      const primaryPack = Array.from(alliances.values()).find((a) => a.name === "Career Pack");

      expect(primaryPack).toBeDefined();
      expect(primaryPack!.tributeIds.length).toBeGreaterThanOrEqual(4);
      expect(primaryPack!.tributeIds.length).toBeLessThanOrEqual(5);
    });

    it("preserves active alliances across Day -> Night -> Day phase progression", () => {
      const t1 = createMockTribute({ id: "t-katniss", name: "Katniss", district: 12 });
      const t2 = createMockTribute({ id: "t-peeta", name: "Peeta", district: 12 });
      const t3 = createMockTribute({ id: "t-cato", name: "Cato", district: 2 });
      const t4 = createMockTribute({ id: "t-clove", name: "Clove", district: 2 });
      const t5 = createMockTribute({ id: "t-thresh", name: "Thresh", district: 11 });
      const t6 = createMockTribute({ id: "t-rue", name: "Rue", district: 11 });
      const t7 = createMockTribute({ id: "t-foxface", name: "Foxface", district: 5 });
      const t8 = createMockTribute({ id: "t-marvel", name: "Marvel", district: 1 });

      const alliance12 = createAlliance("game-prog", ["t-katniss", "t-peeta"], null, "all-12", "District 12 Duo");
      const alliance2 = createAlliance("game-prog", ["t-cato", "t-clove"], null, "all-2", "District 2 Duo");

      const tributesMap = new Map([
        [t1.id, t1],
        [t2.id, t2],
        [t3.id, t3],
        [t4.id, t4],
        [t5.id, t5],
        [t6.id, t6],
        [t7.id, t7],
        [t8.id, t8],
      ]);

      const alliancesMap = new Map([
        [alliance12.id, alliance12],
        [alliance2.id, alliance2],
      ]);

      const initialGameState: EngineGameState = {
        gameId: "game-prog",
        title: "The 74th Hunger Games",
        arenaName: "Wilderness",
        arenaDescription: "Pines and mountains.",
        currentDay: 1,
        currentPhaseType: "day",
        phaseOrder: 1,
        status: "in_progress",
        winnerIds: null,
        tributes: tributesMap,
        alliances: alliancesMap,
        settings: defaultSettings,
        seed: 777,
      };

      // Advance Day 1 -> Night 1
      const nightStep = advanceGamePhase({ gameState: initialGameState });
      expect(nightStep.phaseResult.phaseType).toBe("night");
      expect(nightStep.nextGameState.alliances.get("all-12")?.status).toBe("active");
      expect(nightStep.nextGameState.alliances.get("all-2")?.status).toBe("active");

      // Advance Night 1 -> Day 2
      const day2Step = advanceGamePhase({ gameState: nightStep.nextGameState });
      expect(day2Step.phaseResult.phaseType).toBe("day");
      expect(day2Step.nextGameState.currentDay).toBe(2);
      expect(day2Step.nextGameState.alliances.get("all-12")?.status).toBe("active");
    });

    it("automatically dissolves alliance when a member dies to an external hazard (1 member left)", () => {
      const t1 = createMockTribute({ id: "t1", status: "alive" });
      const t2 = createMockTribute({ id: "t2", status: "alive" });

      const alliance = createAlliance("g-1", ["t1", "t2"], null, "a-duo");
      const alliancesMap = new Map([[alliance.id, alliance]]);

      // T2 is killed by an environmental hazard or mutt
      const updatedTributes = new Map<string, EngineTribute>([
        ["t1", t1],
        ["t2", { ...t2, status: "dead", deathPhaseId: "phase-hazard" }],
      ]);

      const synced = syncDegradedAlliances(alliancesMap, updatedTributes, "phase-hazard");
      const syncedAlliance = synced.get("a-duo")!;

      expect(syncedAlliance.status).toBe("dissolved");
      expect(syncedAlliance.dissolvedPhaseId).toBe("phase-hazard");
      expect(syncedAlliance.betrayedByTributeId).toBeNull(); // Clean non-lethal dissolution
    });

    it("dissolves alliance peacefully when cohesion fractures without paranoia", () => {
      const t1 = createMockTribute({ id: "t1", district: 7, biometrics: { survival: 15, sanity: 26, physicalTag: "critically_injured", mentalTag: "anxious" } });
      const t2 = createMockTribute({ id: "t2", district: 9, biometrics: { survival: 15, sanity: 26, physicalTag: "critically_injured", mentalTag: "anxious" } });

      const alliance = createAlliance("g-1", ["t1", "t2"], null, "a-friction");
      const tributes = new Map([["t1", t1], ["t2", t2]]);

      // Starving, cross-district, low sanity in a 10-tribute match -> low cohesion
      const cohesion = calculateAllianceCohesion(alliance, tributes, 10);
      expect(cohesion).toBeLessThanOrEqual(25);

      const strain = evaluateAllianceStrain(alliance, tributes, 10);
      expect(strain.shouldDissolve).toBe(true);
      expect(strain.reason).toBe("peaceful_drift");
      expect(strain.isLethal).toBe(false);
    });
  });

  // =========================================================================
  // 2. Betrayal Condition Trigger Tests
  // =========================================================================
  describe("Betrayal Condition Triggers", () => {
    it("triggers lethal backstab when an alliance member's sanity drops below 25", () => {
      const calmAlly = createMockTribute({
        id: "t-calm",
        name: "Calm Ally",
        district: 1,
        biometrics: { survival: 80, sanity: 70, physicalTag: "unscathed", mentalTag: "calm" },
      });

      const paranoidAlly = createMockTribute({
        id: "t-paranoid",
        name: "Paranoid Ally",
        district: 2,
        biometrics: { survival: 60, sanity: 14, physicalTag: "unscathed", mentalTag: "delirious" }, // < 25
      });

      const alliance = createAlliance("g-betray", ["t-calm", "t-paranoid"], null, "a-betray");
      const tributes = new Map([
        ["t-calm", calmAlly],
        ["t-paranoid", paranoidAlly],
      ]);

      const strain = evaluateAllianceStrain(alliance, tributes, 10);
      expect(strain.shouldBetray).toBe(true);
      expect(strain.isLethal).toBe(true);
      expect(strain.potentialBetrayerId).toBe("t-paranoid");
      expect(strain.potentialVictimId).toBe("t-calm");
      expect(strain.reason).toBe("paranoid_breakdown");
    });

    it("triggers cold ruthless betrayal in endgame when <= 4 tributes remain", () => {
      const ruthlessAlly = createMockTribute({
        id: "t-cato",
        name: "Cato",
        district: 2,
        killCount: 3,
        biometrics: { survival: 90, sanity: 55, physicalTag: "unscathed", mentalTag: "composed" },
      });

      const weakerAlly = createMockTribute({
        id: "t-glimmer",
        name: "Glimmer",
        district: 1,
        killCount: 0,
        biometrics: { survival: 35, sanity: 40, physicalTag: "wounded", mentalTag: "anxious" },
      });

      const alliance = createAlliance("g-endgame", ["t-cato", "t-glimmer"], null, "a-career");
      const tributes = new Map([
        ["t-cato", ruthlessAlly],
        ["t-glimmer", weakerAlly],
      ]);

      // 3 living tributes remaining in entire arena -> Endgame trigger
      const strain = evaluateAllianceStrain(alliance, tributes, 3);
      expect(strain.shouldBetray).toBe(true);
      expect(strain.isLethal).toBe(true);
      expect(strain.potentialBetrayerId).toBe("t-cato");
      expect(strain.potentialVictimId).toBe("t-glimmer");
      expect(strain.reason).toBe("endgame_climax");
    });

    it("suppresses endgame betrayal for same-district duo under district_duo_twist", () => {
      const katniss = createMockTribute({
        id: "t-katniss",
        name: "Katniss",
        district: 12,
        killCount: 2,
        biometrics: { survival: 80, sanity: 65, physicalTag: "unscathed", mentalTag: "composed" },
      });

      const peeta = createMockTribute({
        id: "t-peeta",
        name: "Peeta",
        district: 12,
        killCount: 1,
        biometrics: { survival: 45, sanity: 60, physicalTag: "wounded", mentalTag: "composed" },
      });

      const alliance = createAlliance("g-twist", ["t-katniss", "t-peeta"], null, "a-duo-12");
      const tributes = new Map([
        ["t-katniss", katniss],
        ["t-peeta", peeta],
      ]);

      const twistSettings: EngineGameSettings = {
        ...defaultSettings,
        victoryCondition: "district_duo_twist",
      };

      const strain = evaluateAllianceStrain(alliance, tributes, 2, { settings: twistSettings });
      expect(strain.shouldBetray).toBe(false);
    });
  });

  // =========================================================================
  // 3. Backstab Delta, Kill Count & Placement Tests
  // =========================================================================
  describe("Backstab Delta & Kill Count Integrity", () => {
    it("executes night camp backstab, updates placement, increments kill count, and marks alliance as betrayed", () => {
      const resolver = new NightPhaseResolver();
      const prng = createPRNG(42);

      const betrayer = createMockTribute({
        id: "t-betrayer",
        name: "Betrayer",
        district: 2,
        killCount: 1,
        biometrics: { survival: 90, sanity: 15, physicalTag: "unscathed", mentalTag: "paranoid" }, // < 25
      });

      const victim = createMockTribute({
        id: "t-victim",
        name: "Victim",
        district: 4,
        killCount: 0,
        biometrics: { survival: 30, sanity: 50, physicalTag: "wounded", mentalTag: "composed" },
      });

      const bystander = createMockTribute({
        id: "t-bystander",
        name: "Bystander",
        district: 11,
        status: "alive",
      });

      const alliance = createAlliance("g-camp", ["t-betrayer", "t-victim"], null, "a-night-clash");
      const allTributes = new Map([
        [betrayer.id, betrayer],
        [victim.id, victim],
        [bystander.id, bystander],
      ]);
      const alliances = new Map([[alliance.id, alliance]]);

      const output = resolver.resolvePhase({
        gameId: "g-camp",
        dayNumber: 2,
        phaseType: "night",
        phaseOrder: 4,
        aliveTributes: [betrayer, victim, bystander],
        allTributes,
        alliances,
        settings: { ...defaultSettings, combatLethality: "high_bloodbath" },
        prng,
        arenaName: "Arena",
        arenaDescription: "Dark woods.",
      });

      // Find the betrayal event
      const betrayalEvent = output.events.find((e) =>
        e.tributeIds.includes("t-betrayer") && e.tributeIds.includes("t-victim")
      );
      expect(betrayalEvent).toBeDefined();

      const updatedAlliance = output.updatedAlliances.get("a-night-clash");
      expect(updatedAlliance?.status).toBe("betrayed");
      expect(updatedAlliance?.betrayedByTributeId).toBe("t-betrayer");

      const upBetrayer = output.updatedTributes.get("t-betrayer")!;
      const upVictim = output.updatedTributes.get("t-victim")!;

      if (betrayalEvent?.outcomeType === "death") {
        expect(upBetrayer.killCount).toBe(2); // Incremented +1
        expect(upVictim.status).toBe("dead");
        expect(output.fallenTributeIds).toContain("t-victim");
        expect(betrayalEvent.killerIds).toEqual(["t-betrayer"]);
        expect(betrayalEvent.victimIds).toEqual(["t-victim"]);
      } else {
        // Wounded non-fatal betrayal
        expect(upVictim.status).toBe("alive");
        expect(upVictim.biometrics.survival).toBeLessThan(30);
      }
    });

    it("verifies accurate placement assigned to victim upon fatal betrayal in orchestrator", () => {
      const killer = createMockTribute({
        id: "t-killer",
        district: 1,
        killCount: 0,
        biometrics: { survival: 95, sanity: 12, physicalTag: "unscathed", mentalTag: "manic" },
      });

      const victim = createMockTribute({
        id: "t-victim",
        district: 2,
        killCount: 0,
        biometrics: { survival: 15, sanity: 40, physicalTag: "critically_injured", mentalTag: "anxious" },
      });

      const survivor = createMockTribute({
        id: "t-survivor",
        district: 12,
        status: "alive",
      });

      const alliance = createAlliance("g-orch", ["t-killer", "t-victim"], null, "a-orch");
      const tributes = new Map([
        [killer.id, killer],
        [victim.id, victim],
        [survivor.id, survivor],
      ]);
      const alliances = new Map([[alliance.id, alliance]]);

      const gameState: EngineGameState = {
        gameId: "g-orch",
        title: "Arena Climax",
        arenaName: "Colosseum",
        arenaDescription: "Ruins.",
        currentDay: 3,
        currentPhaseType: "day",
        phaseOrder: 5,
        status: "in_progress",
        winnerIds: null,
        tributes,
        alliances,
        settings: { ...defaultSettings, combatLethality: "high_bloodbath" },
        seed: 42,
      };

      // Advance to Night 3
      const result = advanceGamePhase({ gameState });
      const deadVictim = result.nextGameState.tributes.get("t-victim");

      if (deadVictim?.status === "dead") {
        expect(deadVictim.deathPhaseId).toBeDefined();
        expect(deadVictim.placement).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
