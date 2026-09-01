/**
 * Hunger Games AI — OpenRouter AI Storyteller Test Script
 * 
 * Generates realistic procedural mockup arena events across all narrative voices
 * and dispatches them to OpenRouter to verify live LLM generation, prompt injection,
 * and text formatting.
 * 
 * Usage:
 *   npx tsx scripts/test-openrouter-narrative.ts
 *   npx tsx scripts/test-openrouter-narrative.ts --voice=capitol_broadcast
 *   npx tsx scripts/test-openrouter-narrative.ts --model=meta-llama/llama-3.3-70b-instruct:free
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateNarrative, buildNarrativeUserPrompt } from "../src/lib/ai";
import { serializeEventToNarrativePayload } from "../src/lib/engine/narrative-serializer";
import { EngineEventOutcome, EngineTribute } from "../src/lib/engine/types";
import { NarrativeVoice } from "../src/types/setup";

// 1. Load environment variables from .env.local
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEFAULT_MODEL = process.env.OPENROUTER_DEFAULT_MODEL || "openrouter/free";

// Parse CLI flags
const args = process.argv.slice(2);
let selectedVoice: NarrativeVoice | null = null;
let selectedModel: string = DEFAULT_MODEL;

for (const arg of args) {
  if (arg.startsWith("--voice=")) {
    selectedVoice = arg.split("=")[1] as NarrativeVoice;
  }
  if (arg.startsWith("--model=")) {
    selectedModel = arg.split("=")[1];
  }
}

// 2. Mock Roster Data
const mockTributes = new Map<string, EngineTribute>([
  [
    "t1",
    {
      id: "t1",
      gameId: "test-game-openrouter",
      name: "Katniss Everdeen",
      district: 12,
      gender: "female",
      personality: "Resourceful, quiet, protective archer",
      physicalAspect: "Dark braided hair, olive skin, lean build",
      avatarUrl: null,
      status: "alive",
      killCount: 1,
      biometrics: { survival: 75, sanity: 65, physicalTag: "scratched", mentalTag: "composed" },
      inventory: ["Hunting Bow", "Iodine Flask"],
      deathPhaseId: null,
      placement: null,
    },
  ],
  [
    "t2",
    {
      id: "t2",
      gameId: "test-game-openrouter",
      name: "Cato Hadley",
      district: 2,
      gender: "male",
      personality: "Ruthless, arrogant Career pack leader",
      physicalAspect: "Towering, muscular, lethal build",
      avatarUrl: null,
      status: "alive",
      killCount: 3,
      biometrics: { survival: 85, sanity: 55, physicalTag: "unscathed", mentalTag: "alert" },
      inventory: ["Titanium Broadsword", "Kevlar Mesh"],
      deathPhaseId: null,
      placement: null,
    },
  ],
  [
    "t3",
    {
      id: "t3",
      gameId: "test-game-openrouter",
      name: "Thresh",
      district: 11,
      gender: "male",
      personality: "Stoic, immensely strong, solitary defender",
      physicalAspect: "Imposing height, weathered hands",
      avatarUrl: null,
      status: "alive",
      killCount: 2,
      biometrics: { survival: 40, sanity: 45, physicalTag: "wounded", mentalTag: "shaken" },
      inventory: ["Heavy Sickle"],
      deathPhaseId: null,
      placement: null,
    },
  ],
  [
    "t4",
    {
      id: "t4",
      gameId: "test-game-openrouter",
      name: "Foxface",
      district: 5,
      gender: "female",
      personality: "Cunning, stealthy scavenger avoiding direct clashes",
      physicalAspect: "Slight build, vivid red hair",
      avatarUrl: null,
      status: "alive",
      killCount: 0,
      biometrics: { survival: 50, sanity: 70, physicalTag: "unscathed", mentalTag: "alert" },
      inventory: ["Empty Water Canteen"],
      deathPhaseId: null,
      placement: null,
    },
  ],
]);

// 3. Mock Scenario Test Suite
interface TestScenario {
  title: string;
  voice: NarrativeVoice;
  event: EngineEventOutcome;
  arenaName: string;
  arenaDescription: string;
}

const testScenarios: TestScenario[] = [
  {
    title: "1. Day 0 Bloodbath Cornucopia Horn Lethal Clash",
    voice: "novel_cinematic",
    arenaName: "Clockwork Quell Tidal Arena",
    arenaDescription: "A circular salt-water lagoon surrounded by 12 dense jungle sectors governed by a deadly mechanical clock.",
    event: {
      eventId: "e-bb-1",
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
          survivalDelta: -40,
          sanityDelta: -30,
          isFatal: true,
          narrativeNotes: "Cato overpowers Thresh at the Cornucopia mouth with a devastating strike.",
        },
      },
      thematicContext: {
        itemContested: "Titanium Broadsword",
        locationDescription: "Golden Cornucopia horn steps above the salt-water surf.",
      },
    },
  },
  {
    title: "2. Stealth Foraging & Discovery",
    voice: "novel_cinematic",
    arenaName: "Frozen Alpine Tundra",
    arenaDescription: "Sub-zero glacial peaks, razor-sharp crevasse fields, and howling blizzards.",
    event: {
      eventId: "e-forage-1",
      eventOrder: 2,
      eventCategory: "forage",
      outcomeType: "loot",
      tributeIds: ["t4"],
      killerIds: null,
      victimIds: null,
      stateDeltas: {
        t4: {
          tributeId: "t4",
          survivalDelta: 10,
          sanityDelta: 15,
          itemsGained: ["Thermal Seal Blubber Torch", "Dried Venison Strip"],
          narrativeNotes: "Foxface discovered a hidden Gamemaker supply cache nestled beneath a frozen shelf.",
        },
      },
      thematicContext: {
        itemDiscovered: "Thermal Seal Blubber Torch",
        locationDescription: "A narrow crevasse shielded from the sub-zero wind.",
      },
    },
  },
  {
    title: "3. Capitol Television Broadcast (Caesar Flickerman Commentary)",
    voice: "capitol_broadcast",
    arenaName: "Ruined Post-Apocalyptic Metropolis",
    arenaDescription: "Crumbling skyscrapers, radioactive dust storms, and rusted rebar rubble.",
    event: {
      eventId: "e-broadcast-1",
      eventOrder: 3,
      eventCategory: "combat",
      outcomeType: "wound",
      tributeIds: ["t1", "t2"],
      killerIds: null,
      victimIds: null,
      stateDeltas: {
        t1: { tributeId: "t1", survivalDelta: -15, sanityDelta: -5 },
        t2: { tributeId: "t2", survivalDelta: -20, sanityDelta: 10 },
      },
      thematicContext: {
        locationDescription: "Shattered glass atrium of a collapsed department store.",
      },
    },
  },
  {
    title: "4. Head Gamemaker Tactical Surveillance Incident Log",
    voice: "gamemaker_log",
    arenaName: "Bioluminescent Quagmire",
    arenaDescription: "Deep toxic marshland with suffocating spores and predatory night leeches.",
    event: {
      eventId: "e-log-1",
      eventOrder: 4,
      eventCategory: "hazard",
      outcomeType: "wound",
      tributeIds: ["t3"],
      killerIds: null,
      victimIds: null,
      stateDeltas: {
        t3: { tributeId: "t3", survivalDelta: -25, sanityDelta: -20 },
      },
      thematicContext: {
        hazardName: "Corrosive Acid Fog Inundation",
        locationDescription: "Sector 7 Marsh Perimeter.",
      },
    },
  },
  {
    title: "5. Silver Sponsor Parachute Delivery",
    voice: "novel_cinematic",
    arenaName: "Verdant Jungle Canopy",
    arenaDescription: "Dense equatorial rainforest canopy with razor-sharp foliage and venomous insects.",
    event: {
      eventId: "e-sponsor-1",
      eventOrder: 5,
      eventCategory: "sponsor",
      outcomeType: "loot",
      tributeIds: ["t1"],
      killerIds: null,
      victimIds: null,
      stateDeltas: {
        t1: {
          tributeId: "t1",
          survivalDelta: 20,
          sanityDelta: 15,
          itemsGained: ["Potent Burn Salve"],
          narrativeNotes: "Capitol patrons sponsored medical salve after Katniss survived tracker jacker stings.",
        },
      },
      thematicContext: {
        itemDiscovered: "Potent Burn Salve",
        locationDescription: "High branch of a mammoth willow tree.",
      },
    },
  },
];

async function runLiveOpenRouterTestSuite() {
  console.log("\n=======================================================");
  console.log(" 🎬  HUNGER GAMES AI — OPENROUTER AI STORYTELLER TEST SUITE");
  console.log("=======================================================");
  console.log(`🤖 Target Model: ${selectedModel}`);
  console.log(`🔑 OpenRouter API Key: ${OPENROUTER_API_KEY ? "CONFIGURED (Live LLM Mode)" : "NOT CONFIGURED (Fallback Template Mode)"}`);
  if (selectedVoice) {
    console.log(`🎙️ Voice Filter: ${selectedVoice}`);
  }
  console.log("=======================================================\n");

  const filteredScenarios = selectedVoice
    ? testScenarios.filter((s) => s.voice === selectedVoice)
    : testScenarios;

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < filteredScenarios.length; i++) {
    const scenario = filteredScenarios[i];
    console.log(`\n-------------------------------------------------------`);
    console.log(`📌 Scenario [${i + 1}/${filteredScenarios.length}]: ${scenario.title}`);
    console.log(`   • Voice: [${scenario.voice}]`);
    console.log(`   • Arena: ${scenario.arenaName}`);
    console.log(`   • Category: ${scenario.event.eventCategory} | Outcome: ${scenario.event.outcomeType}`);

    try {
      // 1. Serialize Engine Event to NarrativeRequest
      const payload = serializeEventToNarrativePayload(scenario.event, {
        simulationTitle: "The 74th Annual Hunger Games",
        arenaName: scenario.arenaName,
        arenaDescription: scenario.arenaDescription,
        narrativeVoice: scenario.voice,
        tributes: mockTributes,
      });

      // Override model if specified
      if (selectedModel) {
        payload.model = selectedModel;
      }

      console.log(`\n📝 [Structured Prompt Dispatched to LLM]:`);
      const userPrompt = buildNarrativeUserPrompt(payload);
      console.log(userPrompt.split("\n").map((l) => `   | ${l}`).join("\n"));

      console.log(`\n⏳ Requesting Narrative from OpenRouter (${selectedModel})...`);
      const startTime = Date.now();

      const narrativeText = await generateNarrative(payload, {
        apiKey: OPENROUTER_API_KEY,
        model: selectedModel,
      });

      const elapsed = Date.now() - startTime;
      const wordCount = narrativeText.split(/\s+/).filter(Boolean).length;

      console.log(`\n✨ [Generated Narrative Output] (${elapsed}ms, ${wordCount} words):`);
      console.log(`   "${narrativeText}"`);

      // Assertions
      if (!narrativeText || narrativeText.length < 15) {
        throw new Error("Narrative response was empty or too short");
      }

      console.log(`\n✅ Result: PASSED`);
      passed++;
    } catch (err) {
      console.error(`\n❌ Result: FAILED:`, err);
      failed++;
    }
  }

  console.log("\n=======================================================");
  console.log(`🎯 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log("=======================================================\n");
}

runLiveOpenRouterTestSuite().catch((err) => {
  console.error("💥 Fatal test runner error:", err);
  process.exit(1);
});
