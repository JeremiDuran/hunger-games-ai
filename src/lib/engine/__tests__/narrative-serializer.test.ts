import { describe, it, expect } from "vitest";
import {
  serializeEventToNarrativePayload,
  computeParticipantRole,
  NarrativeSerializationContext,
} from "../narrative-serializer";
import { EngineEventOutcome, EngineTribute } from "../types";
import { createInitialBiometrics } from "../biometrics";
import { narrativeRequestSchema } from "@/lib/schemas/narrative";

function createMockTribute(id: string, name: string, district = 1): EngineTribute {
  return {
    id,
    gameId: "game-test-narrative",
    name,
    district,
    gender: "female",
    personality: "Determined survivor",
    physicalAspect: "Agile, sharp-eyed",
    avatarUrl: null,
    status: "alive",
    killCount: 0,
    biometrics: createInitialBiometrics(),
    inventory: ["hunting knife", "canteen"],
    deathPhaseId: null,
    placement: null,
  };
}

describe("AI Storyteller Payload Serializer", () => {
  const context: NarrativeSerializationContext = {
    simulationTitle: "The 74th Annual Hunger Games",
    arenaName: "Verdant Jungle & Cornucopia Horn",
    arenaDescription: "A humid equatorial jungle with thick canopy and sudden flash floods.",
    narrativeVoice: "novel_cinematic",
    tributes: new Map([
      ["t1", createMockTribute("t1", "Katniss", 12)],
      ["t2", createMockTribute("t2", "Cato", 2)],
      ["t3", createMockTribute("t3", "Rue", 11)],
    ]),
  };

  it("computes participant roles accurately", () => {
    const lethalEvent: EngineEventOutcome = {
      eventId: "e-1",
      eventOrder: 1,
      eventCategory: "combat",
      outcomeType: "death",
      tributeIds: ["t2", "t3"],
      killerIds: ["t2"],
      victimIds: ["t3"],
      stateDeltas: {},
    };

    expect(computeParticipantRole("t2", lethalEvent, 0, 2)).toBe("killer");
    expect(computeParticipantRole("t3", lethalEvent, 1, 2)).toBe("victim");

    const forageEvent: EngineEventOutcome = {
      eventId: "e-2",
      eventOrder: 2,
      eventCategory: "forage",
      outcomeType: "loot",
      tributeIds: ["t1"],
      killerIds: null,
      victimIds: null,
      stateDeltas: {},
    };

    expect(computeParticipantRole("t1", forageEvent, 0, 1)).toBe("scavenger");

    const nonLethalCombat: EngineEventOutcome = {
      eventId: "e-3",
      eventOrder: 3,
      eventCategory: "combat",
      outcomeType: "wound",
      tributeIds: ["t1", "t2"],
      killerIds: null,
      victimIds: null,
      stateDeltas: {},
    };

    expect(computeParticipantRole("t1", nonLethalCombat, 0, 2)).toBe("attacker");
    expect(computeParticipantRole("t2", nonLethalCombat, 1, 2)).toBe("defender");
  });

  it("serializes a 1v1 lethal combat event into a valid NarrativeRequest", () => {
    const event: EngineEventOutcome = {
      eventId: "e-lethal",
      eventOrder: 1,
      eventCategory: "combat",
      outcomeType: "death",
      tributeIds: ["t2", "t3"],
      killerIds: ["t2"],
      victimIds: ["t3"],
      stateDeltas: {
        t2: { tributeId: "t2", survivalDelta: -10, sanityDelta: 5 },
        t3: {
          tributeId: "t3",
          survivalDelta: -50,
          sanityDelta: -25,
          isFatal: true,
          narrativeNotes: "Cato eliminated Rue with a titanium spear.",
        },
      },
      thematicContext: {
        locationDescription: "A rocky clearing near the stream.",
        itemContested: "titanium spear",
      },
    };

    const payload = serializeEventToNarrativePayload(event, context);

    expect(payload.simulationTitle).toBe("The 74th Annual Hunger Games");
    expect(payload.arenaName).toBe("Verdant Jungle & Cornucopia Horn");
    expect(payload.eventCategory).toBe("combat");
    expect(payload.outcomeType).toBe("death");
    expect(payload.participants).toHaveLength(2);

    const killer = payload.participants.find((p) => p.id === "t2");
    const victim = payload.participants.find((p) => p.id === "t3");

    expect(killer?.role).toBe("killer");
    expect(victim?.role).toBe("victim");
    expect(payload.stateDelta.fatalities).toContain("t3");
    expect(payload.stateDelta.healthChanges["t2"]).toBe(-10);
    expect(payload.stateDelta.healthChanges["t3"]).toBe(-50);
    expect(payload.thematicContext?.itemContested).toBe("titanium spear");

    // Must satisfy Zod schema without throwing
    expect(() => narrativeRequestSchema.parse(payload)).not.toThrow();
  });

  it("serializes a sponsor drop event with itemsGained", () => {
    const event: EngineEventOutcome = {
      eventId: "e-sponsor",
      eventOrder: 2,
      eventCategory: "sponsor",
      outcomeType: "loot",
      tributeIds: ["t1"],
      killerIds: null,
      victimIds: null,
      stateDeltas: {
        t1: {
          tributeId: "t1",
          survivalDelta: 15,
          sanityDelta: 10,
          itemsGained: ["Burn Ointment"],
          narrativeNotes: "A silver parachute dropped burn ointment to Katniss.",
        },
      },
      thematicContext: {
        itemDiscovered: "Burn Ointment",
      },
    };

    const payload = serializeEventToNarrativePayload(event, context);

    expect(payload.eventCategory).toBe("sponsor");
    expect(payload.outcomeType).toBe("loot");
    expect(payload.participants[0].id).toBe("t1");
    expect(payload.participants[0].role).toBe("solo");
    expect(payload.stateDelta.itemsGained?.["t1"]).toEqual(["Burn Ointment"]);

    expect(() => narrativeRequestSchema.parse(payload)).not.toThrow();
  });

  it("serializes a PvE muttation encounter with NPC metadata", () => {
    const event: EngineEventOutcome = {
      eventId: "e-pve",
      eventOrder: 3,
      eventCategory: "mutt",
      outcomeType: "wound",
      tributeIds: ["t1"],
      killerIds: null,
      victimIds: null,
      stateDeltas: {
        t1: {
          tributeId: "t1",
          survivalDelta: -20,
          sanityDelta: -15,
        },
      },
      thematicContext: {
        npcName: "Tracker Jacker Swarm",
        locationDescription: "High in the canopy.",
      },
    };

    const payload = serializeEventToNarrativePayload(event, context);

    expect(payload.eventCategory).toBe("mutt");
    expect(payload.thematicContext?.npcName).toBe("Tracker Jacker Swarm");
    expect(() => narrativeRequestSchema.parse(payload)).not.toThrow();
  });
});
