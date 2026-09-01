import { describe, it, expect } from "vitest";
import {
  narrativeRequestSchema,
  narrativeParticipantSchema,
  narrativeStateDeltaSchema,
  NarrativeRequest,
} from "../narrative";

describe("Narrative Schemas", () => {
  describe("narrativeParticipantSchema", () => {
    it("parses valid participant with defaults", () => {
      const parsed = narrativeParticipantSchema.parse({
        id: "tribute-1",
        name: "Katniss",
        district: 12,
      });

      expect(parsed.id).toBe("tribute-1");
      expect(parsed.name).toBe("Katniss");
      expect(parsed.district).toBe(12);
      expect(parsed.survival).toBe(50);
      expect(parsed.sanity).toBe(50);
      expect(parsed.physicalTag).toBe("unscathed");
      expect(parsed.mentalTag).toBe("composed");
      expect(parsed.inventory).toEqual([]);
    });

    it("parses participant with full biometrics, role, and inventory", () => {
      const parsed = narrativeParticipantSchema.parse({
        id: "tribute-2",
        name: "Cato",
        district: 2,
        survival: 85,
        physicalTag: "bruised",
        sanity: 40,
        mentalTag: "paranoid",
        inventory: ["spear", "water canteen"],
        role: "killer",
      });

      expect(parsed.role).toBe("killer");
      expect(parsed.inventory).toHaveLength(2);
      expect(parsed.survival).toBe(85);
    });

    it("rejects invalid district numbers", () => {
      expect(() =>
        narrativeParticipantSchema.parse({
          id: "t-1",
          name: "Invalid",
          district: 25, // Max 24
        })
      ).toThrow();

      expect(() =>
        narrativeParticipantSchema.parse({
          id: "t-1",
          name: "Invalid",
          district: 0, // Min 1
        })
      ).toThrow();
    });
  });

  describe("narrativeStateDeltaSchema", () => {
    it("provides clean defaults for empty delta", () => {
      const parsed = narrativeStateDeltaSchema.parse({});
      expect(parsed.fatalities).toEqual([]);
      expect(parsed.healthChanges).toEqual({});
      expect(parsed.sanityChanges).toEqual({});
    });

    it("accepts complex delta with health and loot modifications", () => {
      const parsed = narrativeStateDeltaSchema.parse({
        fatalities: ["tribute-1"],
        healthChanges: { "tribute-1": -50, "tribute-2": -10 },
        sanityChanges: { "tribute-2": -15 },
        lootTransferred: { "tribute-2": ["bow", "arrows"] },
        itemsDestroyed: ["wooden shield"],
        narrativeNotes: "Ambushed from the tree canopy",
      });

      expect(parsed.fatalities).toEqual(["tribute-1"]);
      expect(parsed.healthChanges["tribute-1"]).toBe(-50);
      expect(parsed.lootTransferred?.["tribute-2"]).toEqual(["bow", "arrows"]);
    });
  });

  describe("narrativeRequestSchema", () => {
    const validMinimalRequest = {
      participants: [
        {
          id: "t-1",
          name: "Peeta",
          district: 12,
        },
      ],
    };

    it("parses minimal valid request with default options", () => {
      const parsed = narrativeRequestSchema.parse(validMinimalRequest);
      expect(parsed.simulationTitle).toBe("The Hunger Games");
      expect(parsed.arenaName).toBe("The Arena");
      expect(parsed.narrativeVoice).toBe("novel_cinematic");
      expect(parsed.eventCategory).toBe("combat");
      expect(parsed.outcomeType).toBe("idle");
      expect(parsed.participants).toHaveLength(1);
      expect(parsed.stateDelta.fatalities).toEqual([]);
    });

    it("parses full request across different narrative voices", () => {
      const fullRequest: NarrativeRequest = {
        simulationTitle: "The 75th Hunger Games (Third Quarter Quell)",
        arenaName: "Clockwork Arena",
        arenaLore: "A deadly mechanical island split into 12 clock sectors.",
        narrativeVoice: "capitol_broadcast",
        eventCategory: "hazard",
        outcomeType: "wound",
        participants: [
          {
            id: "t-1",
            name: "Finnick",
            district: 4,
            survival: 70,
            physicalTag: "scratched",
            sanity: 60,
            mentalTag: "alert",
            inventory: ["trident"],
            role: "defender",
          },
          {
            id: "t-2",
            name: "Johanna",
            district: 7,
            survival: 65,
            physicalTag: "unscathed",
            sanity: 55,
            mentalTag: "resolute",
            inventory: ["axe"],
            role: "ally",
          },
        ],
        stateDelta: {
          fatalities: [],
          healthChanges: { "t-1": -15 },
          sanityChanges: { "t-1": -10, "t-2": -5 },
        },
        thematicContext: {
          hazardName: "Acid Fog Wave",
          locationDescription: "Sector 2 Jungle Canopy",
          specialRulesTriggered: ["Tick-Tock Cycle #2"],
        },
        model: "openrouter/free",
      };

      const parsed = narrativeRequestSchema.parse(fullRequest);
      expect(parsed.narrativeVoice).toBe("capitol_broadcast");
      expect(parsed.thematicContext?.hazardName).toBe("Acid Fog Wave");
      expect(parsed.model).toBe("openrouter/free");
    });

    it("rejects request with empty participants array", () => {
      expect(() =>
        narrativeRequestSchema.parse({
          participants: [],
        })
      ).toThrow();
    });

    it("rejects unknown narrative voices", () => {
      expect(() =>
        narrativeRequestSchema.parse({
          ...validMinimalRequest,
          narrativeVoice: "invalid_voice",
        })
      ).toThrow();
    });
  });
});
