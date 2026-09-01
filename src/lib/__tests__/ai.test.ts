import { describe, it, expect } from "vitest";
import {
  NARRATIVE_SYSTEM_PROMPTS,
  DEFAULT_OPENROUTER_MODEL,
  buildNarrativeUserPrompt,
  generateBarebonesFallback,
  getOpenRouterProvider,
  getStorytellingModel,
  generateNarrative,
} from "../ai";
import { NarrativeRequest } from "../schemas/narrative";

describe("AI Core Engine (src/lib/ai.ts)", () => {
  const sampleRequest: NarrativeRequest = {
    simulationTitle: "The 74th Hunger Games",
    arenaName: "Alpine Woodlands",
    arenaLore: "Dense pine trees, snowy ravines, icy streams",
    narrativeVoice: "novel_cinematic",
    eventCategory: "combat",
    outcomeType: "death",
    participants: [
      {
        id: "t-1",
        name: "Rue",
        district: 11,
        survival: 20,
        physicalTag: "critically_injured",
        sanity: 30,
        mentalTag: "anxious",
        inventory: ["slingshot"],
        role: "victim",
      },
      {
        id: "t-2",
        name: "Marvel",
        district: 1,
        survival: 80,
        physicalTag: "unscathed",
        sanity: 70,
        mentalTag: "calm",
        inventory: ["spear"],
        role: "killer",
      },
    ],
    stateDelta: {
      fatalities: ["t-1"],
      healthChanges: { "t-1": -20 },
      sanityChanges: { "t-2": -5 },
      lootTransferred: { "t-2": ["slingshot"] },
    },
    thematicContext: {
      locationDescription: "Southern Clearing near Tracker Jacker Nest",
    },
    model: "openrouter/free",
  };

  describe("System Prompts", () => {
    it("defines system prompts for all 3 voices", () => {
      expect(NARRATIVE_SYSTEM_PROMPTS.novel_cinematic).toContain(
        "official author and narrator"
      );
      expect(NARRATIVE_SYSTEM_PROMPTS.capitol_broadcast).toContain(
        "Caesar Flickerman"
      );
      expect(NARRATIVE_SYSTEM_PROMPTS.gamemaker_log).toContain(
        "Head Gamemaker"
      );
    });

    it("enforces deterministic outcome constraints in all system prompts", () => {
      for (const prompt of Object.values(NARRATIVE_SYSTEM_PROMPTS)) {
        expect(prompt).toContain("100% deterministic");
        expect(prompt).toContain("NEVER contradict, alter, or invent");
      }
    });
  });

  describe("buildNarrativeUserPrompt", () => {
    it("formats comprehensive simulation context and participant telemetry", () => {
      const prompt = buildNarrativeUserPrompt(sampleRequest);

      expect(prompt).toContain("Match: The 74th Hunger Games");
      expect(prompt).toContain("Arena: Alpine Woodlands");
      expect(prompt).toContain("Dense pine trees");
      expect(prompt).toContain("Rue (District 11) [Role: VICTIM]");
      expect(prompt).toContain("Marvel (District 1) [Role: KILLER]");
      expect(prompt).toContain("Fatalities: Rue (District 11)");
      expect(prompt).toContain("Vitality Changes: Rue: -20 HP");
      expect(prompt).toContain(
        "Specific Location: Southern Clearing near Tracker Jacker Nest"
      );
    });

    it("handles zero fatalities and peaceful encounters cleanly", () => {
      const peacefulRequest: NarrativeRequest = {
        simulationTitle: "The 74th Hunger Games",
        arenaName: "Alpine Woodlands",
        arenaLore: "",
        narrativeVoice: "gamemaker_log",
        eventCategory: "forage",
        outcomeType: "loot",
        participants: [
          {
            id: "t-3",
            name: "Foxface",
            district: 5,
            survival: 50,
            physicalTag: "unscathed",
            sanity: 60,
            mentalTag: "composed",
            inventory: [],
            role: "scavenger",
          },
        ],
        stateDelta: {
          fatalities: [],
          healthChanges: {},
          sanityChanges: { "t-3": 5 },
        },
        thematicContext: {
          itemDiscovered: "Nightlock Berries",
        },
      };

      const prompt = buildNarrativeUserPrompt(peacefulRequest);
      expect(prompt).toContain("Fatalities: None");
      expect(prompt).toContain("Discovered Item: Nightlock Berries");
    });
  });

  describe("generateBarebonesFallback", () => {
    it("generates fallback text for lethal events with cannon reference", () => {
      const fallback = generateBarebonesFallback(sampleRequest);
      expect(fallback).toContain("Alpine Woodlands");
      expect(fallback).toContain("Rue");
      expect(fallback).toContain("cannon blast echoes");
    });

    it("generates fallback text for non-lethal forage events", () => {
      const forageRequest: NarrativeRequest = {
        simulationTitle: "Test",
        arenaName: "Forest",
        arenaLore: "",
        narrativeVoice: "novel_cinematic",
        eventCategory: "forage",
        outcomeType: "idle",
        participants: [
          {
            id: "t-1",
            name: "Katniss",
            district: 12,
            survival: 50,
            physicalTag: "unscathed",
            sanity: 50,
            mentalTag: "composed",
            inventory: [],
          },
        ],
        stateDelta: { fatalities: [], healthChanges: {}, sanityChanges: {} },
      };

      const fallback = generateBarebonesFallback(forageRequest);
      expect(fallback).toContain("scours the rugged terrain of Forest");
    });

    it("generates fallback text for sponsor deliveries", () => {
      const sponsorRequest: NarrativeRequest = {
        ...sampleRequest,
        eventCategory: "sponsor",
        stateDelta: { fatalities: [], healthChanges: {}, sanityChanges: {} },
      };

      const fallback = generateBarebonesFallback(sponsorRequest);
      expect(fallback).toContain("silver parachute glides down");
    });
  });

  describe("OpenRouter Provider Configuration", () => {
    it("initializes client with default model slug openrouter/free", () => {
      expect(DEFAULT_OPENROUTER_MODEL).toBe("openrouter/free");
      const provider = getOpenRouterProvider("mock-api-key");
      expect(provider).toBeDefined();
    });

    it("returns storytelling model instance without errors", () => {
      const model = getStorytellingModel("openrouter/free", "mock-api-key");
      expect(model).toBeDefined();
    });
  });

  describe("generateNarrative (offline fallback resilience)", () => {
    it("returns barebones fallback when no API key is set", async () => {
      const originalKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const result = await generateNarrative(sampleRequest);
      expect(result).toBeDefined();
      expect(result).toContain("Rue");
      expect(result).toContain("Alpine Woodlands");

      process.env.OPENROUTER_API_KEY = originalKey;
    });
  });
});
