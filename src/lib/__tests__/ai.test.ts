import { describe, it, expect } from "vitest";
import {
  NARRATIVE_SYSTEM_PROMPTS,
  DEFAULT_OPENROUTER_MODEL,
  buildNarrativeUserPrompt,
  generateBarebonesFallback,
  getOpenRouterProvider,
  getStorytellingModel,
  generateNarrative,
  synthesizeCornucopiaDescription,
  generateCornucopiaDescription,
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

    it("instructs the Gamemaker log to emit one terse event-feed sentence", () => {
      const prompt = NARRATIVE_SYSTEM_PROMPTS.gamemaker_log;

      expect(prompt).toContain("exactly one short third-person sentence");
      expect(prompt).toContain("8 to 20 words");
      expect(prompt).toContain("Do NOT include numbering");
      expect(prompt).toContain("Never append district");
      expect(prompt).toContain("Make each sentence specific to its encounter");
    });

    it("forbids district-style labels in every narrative voice", () => {
      for (const prompt of Object.values(NARRATIVE_SYSTEM_PROMPTS)) {
        expect(prompt).toContain("(District 1)");
        expect(prompt).toContain("(D1)");
      }
    });

    it("grounds every narrative voice in the arena and participant details", () => {
      for (const prompt of Object.values(NARRATIVE_SYSTEM_PROMPTS)) {
        expect(prompt).toContain("Recreate the pre-determined event faithfully");
        expect(prompt).toContain("use the provided environment creatively");
      }
    });
  });

  describe("buildNarrativeUserPrompt", () => {
    it("formats comprehensive simulation context and participant telemetry", () => {
      const prompt = buildNarrativeUserPrompt(sampleRequest);

      expect(prompt).toContain("Match: The 74th Hunger Games");
      expect(prompt).toContain("Arena: Alpine Woodlands");
      expect(prompt).toContain("Dense pine trees");
      expect(prompt).toContain("Rue (District 11) [Role: VICTIM] | Condition: critically_injured, anxious");
      expect(prompt).toContain("Marvel (District 1) [Role: KILLER] | Condition: unscathed, calm");
      expect(prompt).toContain("Fatalities: Rue (District 11)");
      expect(prompt).toContain("Physical Condition Updates: Rue sustains physical injury / wounds");
      expect(prompt).toContain("Mental State Updates: Marvel is psychologically shaken / distressed");
      expect(prompt).toContain(
        "Specific Location: Southern Clearing near Tracker Jacker Nest"
      );
      expect(prompt).not.toContain("HP");
      expect(prompt).not.toContain("/100");
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
      expect(prompt).toContain("one short, plain, event-specific event-feed sentence");
      expect(prompt).toContain("Do not add district labels");
    });

    it("renders Cornucopia Structure when provided in thematic context", () => {
      const bloodbathRequest: NarrativeRequest = {
        ...sampleRequest,
        thematicContext: {
          cornucopiaDescription:
            "A colossal horn of heat-tempered blackened titanium on an obsidian rock shelf.",
          locationDescription: "At the mouth of the Cornucopia horn.",
        },
      };

      const prompt = buildNarrativeUserPrompt(bloodbathRequest);
      expect(prompt).toContain(
        "Cornucopia Structure: A colossal horn of heat-tempered blackened titanium on an obsidian rock shelf."
      );
      expect(prompt).toContain(
        "Specific Location: At the mouth of the Cornucopia horn."
      );
    });

    it("selectively omits arena lore for non-fatal combat and sponsor events to prevent clutter", () => {
      const skirmishRequest: NarrativeRequest = {
        ...sampleRequest,
        eventCategory: "combat",
        outcomeType: "wound",
        stateDelta: { fatalities: [], healthChanges: { "t-1": -15 }, sanityChanges: {} },
      };

      const skirmishPrompt = buildNarrativeUserPrompt(skirmishRequest);
      expect(skirmishPrompt).toContain("Arena: Alpine Woodlands\n");
      expect(skirmishPrompt).not.toContain("Dense pine trees");

      const sponsorRequest: NarrativeRequest = {
        ...sampleRequest,
        eventCategory: "sponsor",
        outcomeType: "loot",
        stateDelta: { fatalities: [], healthChanges: { "t-1": 15 }, sanityChanges: {} },
      };

      const sponsorPrompt = buildNarrativeUserPrompt(sponsorRequest);
      expect(sponsorPrompt).toContain("Arena: Alpine Woodlands\n");
      expect(sponsorPrompt).not.toContain("Dense pine trees");
    });

    it("includes arena lore for hazard and mutt events even when non-fatal", () => {
      const hazardRequest: NarrativeRequest = {
        ...sampleRequest,
        eventCategory: "hazard",
        outcomeType: "wound",
        stateDelta: { fatalities: [], healthChanges: { "t-1": -10 }, sanityChanges: {} },
      };

      const hazardPrompt = buildNarrativeUserPrompt(hazardRequest);
      expect(hazardPrompt).toContain("Arena: Alpine Woodlands (Dense pine trees, snowy ravines, icy streams)");

      const muttRequest: NarrativeRequest = {
        ...sampleRequest,
        eventCategory: "mutt",
        outcomeType: "wound",
        stateDelta: { fatalities: [], healthChanges: { "t-1": -15 }, sanityChanges: {} },
      };

      const muttPrompt = buildNarrativeUserPrompt(muttRequest);
      expect(muttPrompt).toContain("Arena: Alpine Woodlands (Dense pine trees, snowy ravines, icy streams)");
    });
  });

  describe("synthesizeCornucopiaDescription", () => {
    it("synthesizes volcanic horn for caldera/lava arenas", () => {
      const desc = synthesizeCornucopiaDescription(
        "The Floor is Lava Caldera",
        "Active volcanic craters and obsidian cliffs"
      );
      expect(desc).toContain("blackened titanium");
      expect(desc).toContain("obsidian");
    });

    it("synthesizes frozen horn for arctic/ice arenas", () => {
      const desc = synthesizeCornucopiaDescription(
        "Glacial Abyss",
        "Sub-zero temperatures and blizzard snowdrifts"
      );
      expect(desc).toContain("crystalline metallic horn");
      expect(desc).toContain("frozen ice sheet");
    });

    it("synthesizes desert horn for wasteland/dunes", () => {
      const desc = synthesizeCornucopiaDescription(
        "Sahara Wastes",
        "Scorched desert dunes"
      );
      expect(desc).toContain("sun-bleached golden alloy");
    });

    it("synthesizes jungle horn for rainforest/swamp", () => {
      const desc = synthesizeCornucopiaDescription(
        "Verdant Canopy",
        "Dense rainforest jungle"
      );
      expect(desc).toContain("burnished bronze horn");
    });

    it("synthesizes sawmill horn for industrial timber logging sites", () => {
      const desc = synthesizeCornucopiaDescription(
        "Sawmill Complex",
        "An massive industrial logging site with sawdust and logs"
      );
      expect(desc).toContain("rough-hewn heavy timber");
      expect(desc).toContain("saw blades");
    });

    it("synthesizes urban horn for city ruins", () => {
      const desc = synthesizeCornucopiaDescription(
        "Metro Ruin",
        "Decaying concrete skyscrapers and asphalt"
      );
      expect(desc).toContain("industrial steel horn");
    });

    it("synthesizes default golden horn when no biome matches", () => {
      const desc = synthesizeCornucopiaDescription("Generic Meadow");
      expect(desc).toContain("massive golden horn of plenty");
    });
  });

  describe("generateCornucopiaDescription", () => {
    it("falls back to procedural synthesis when no API key is provided", async () => {
      const originalKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const desc = await generateCornucopiaDescription({
        arenaName: "Volcano Valley",
        arenaDescription: "Molten magma rivers",
      });
      expect(desc).toContain("blackened titanium");

      process.env.OPENROUTER_API_KEY = originalKey;
    });
  });

  describe("generateBarebonesFallback", () => {
    it("uses the concise event-feed format for Gamemaker logs", () => {
      const fallback = generateBarebonesFallback({
        ...sampleRequest,
        narrativeVoice: "gamemaker_log",
        eventCategory: "forage",
        outcomeType: "loot",
        stateDelta: { fatalities: [], healthChanges: {}, sanityChanges: {} },
      });

      expect(fallback).toBe("Rue and Marvel gather supplies.");
    });

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
    it("initializes client with default curated storytelling model", () => {
      expect(DEFAULT_OPENROUTER_MODEL).toBe("meta-llama/llama-3.3-70b-instruct:free");
      const provider = getOpenRouterProvider("mock-api-key");
      expect(provider).toBeDefined();
    });

    it("returns storytelling model instance without errors", () => {
      const model = getStorytellingModel(undefined, "mock-api-key");
      expect(model).toBeDefined();
    });

    it("returns storytelling model with provider ignore and fallback models", () => {
      const model = getStorytellingModel(undefined, "mock-api-key", {
        ignoreProviders: ["InclusionAI", "liquid"],
        models: ["meta-llama/llama-3.3-70b-instruct:free", "google/gemini-2.0-flash-exp:free"],
      });
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
