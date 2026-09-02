/**
 * Hunger Games AI — Centralized AI & OpenRouter Integration
 * Powered by Vercel AI SDK (@openrouter/ai-sdk-provider & ai).
 *
 * Core rule: The procedural simulation engine deterministically computes all outcomes.
 * The LLM strictly generates sensory, immersive narrative text based on pre-computed events.
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, generateText, LanguageModel } from "ai";
import { NarrativeVoice } from "@/types/setup";
import { NarrativeRequest } from "./schemas/narrative";

// ==========================================
// 1. Constants & Model Configuration
// ==========================================

export const CURATED_FREE_STORYTELLING_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "minimax/minimax-m2.7:free",
  "liquid/lfm-2.5-2.6b:free",
] as const;

export const DEFAULT_OPENROUTER_MODEL = CURATED_FREE_STORYTELLING_MODELS[0];

export const NARRATIVE_SYSTEM_PROMPTS = {
  novel_cinematic: `You are the official author and narrator of the Hunger Games arena.
Your role is to write visceral, immersive, and sensory third-person novel prose describing the arena events.
Focus on environmental details (weather, terrain, sounds), psychological tension, and physical stakes.
Rules:
1. All outcomes (deaths, injuries, items gained/lost, alliances) are 100% deterministic and provided in the prompt. NEVER contradict, alter, or invent extra deaths or health changes.
2. Keep your prose concise and impactful: exactly 2 to 4 sentences (40 to 80 words).
3. Do NOT include markdown headers, quotes around the whole text, or conversational preambles. Output ONLY the narrative prose.`,

  capitol_broadcast: `You are Caesar Flickerman and Claudius Templesmith broadcasting live from the Capitol studio.
Your role is to provide sensationalized, theatrical, high-energy television commentary for the citizens of Panem.
Use dramatic rhetoric, Capitol enthusiasm, and iconic broadcasting flair ("Panem, look at that move!", "A stunning turn of events!").
Rules:
1. All outcomes (deaths, injuries, items gained/lost, alliances) are 100% deterministic and provided in the prompt. NEVER contradict, alter, or invent extra deaths or health changes.
2. Keep your commentary concise: exactly 2 to 4 sentences (40 to 80 words).
3. Do NOT include markdown headers, quotes around the whole text, or conversational preambles. Output ONLY the broadcast commentary.`,

  gamemaker_log: `You are a Head Gamemaker monitoring the live Capitol surveillance telemetry.
Your role is to log incident reports with cold, clinical, tactical military precision.
Reference sector conditions, vital signs, physical damage assessments, and tactical engagements in concise log format.
Rules:
1. All outcomes (deaths, injuries, items gained/lost, alliances) are 100% deterministic and provided in the prompt. NEVER contradict, alter, or invent extra deaths or health changes.
2. Keep the report concise: exactly 2 to 4 sentences (40 to 80 words).
3. Do NOT include markdown headers, quotes around the whole text, or conversational preambles. Output ONLY the incident log text.`,
} as const;

// ==========================================
// 2. OpenRouter Provider Factory
// ==========================================

/**
 * Creates or retrieves the OpenRouter provider client instance.
 */
export function getOpenRouterProvider(apiKey?: string) {
  const key = apiKey || process.env.OPENROUTER_API_KEY || "";
  return createOpenRouter({
    apiKey: key,
    headers: {
      "HTTP-Referer": "https://hungergamesai.app",
      "X-Title": "Hunger Games AI",
    },
  });
}

export interface StorytellingModelOptions {
  model?: string;
  apiKey?: string;
  models?: string[];
  ignoreProviders?: string[];
}

/**
 * Gets a LanguageModel instance for the specified model slug with provider filtering and fallback models.
 */
export function getStorytellingModel(
  modelSlug?: string,
  apiKey?: string,
  options?: StorytellingModelOptions
): LanguageModel {
  const openrouter = getOpenRouterProvider(apiKey);
  const selectedSlug =
    modelSlug ||
    options?.model ||
    process.env.OPENROUTER_DEFAULT_MODEL ||
    DEFAULT_OPENROUTER_MODEL;

  const envIgnoreProviders = process.env.OPENROUTER_IGNORE_PROVIDERS
    ? process.env.OPENROUTER_IGNORE_PROVIDERS.split(",").map((s) => s.trim().toLowerCase())
    : [];

  const ignoreProviders = [
    ...new Set([
      ...envIgnoreProviders,
      ...(options?.ignoreProviders || []).map((s) => s.trim().toLowerCase()),
    ]),
  ];

  const envModels = process.env.OPENROUTER_MODELS
    ? process.env.OPENROUTER_MODELS.split(",").map((s) => s.trim())
    : undefined;

  const candidateModels =
    options?.models ||
    envModels ||
    (selectedSlug === CURATED_FREE_STORYTELLING_MODELS[0]
      ? CURATED_FREE_STORYTELLING_MODELS.slice(1)
      : undefined);

  const settings: Record<string, unknown> = {};
  if (ignoreProviders.length > 0) {
    settings.provider = {
      ignore: ignoreProviders,
      allow_fallbacks: true,
    };
  }
  if (candidateModels && candidateModels.length > 0) {
    // OpenRouter enforces that the 'models' fallback array must contain 3 items or fewer
    settings.models = candidateModels.slice(0, 3);
  }

  return openrouter(selectedSlug, Object.keys(settings).length > 0 ? settings : undefined);
}

// ==========================================
// 3. Prompt Construction
// ==========================================

/**
 * Builds the structured user prompt payload for the LLM.
 */
export function buildNarrativeUserPrompt(request: NarrativeRequest): string {
  const {
    simulationTitle,
    arenaName,
    arenaLore,
    eventCategory,
    outcomeType,
    participants,
    stateDelta,
    thematicContext,
  } = request;

  // Selectively include arena biome lore:
  // - Critical for hazards, mutts, opening cornucopia clashes, and fatal climaxes.
  // - Omitted for quick combat skirmishes, sponsor parachutes, and social pacts to prevent prompt clutter.
  const shouldIncludeArenaLore = Boolean(
    arenaLore &&
      (eventCategory === "hazard" ||
        eventCategory === "mutt" ||
        Boolean(thematicContext?.cornucopiaDescription) ||
        Boolean(thematicContext?.hazardName) ||
        outcomeType === "death")
  );

  const arenaDisplay = shouldIncludeArenaLore
    ? `${arenaName} (${arenaLore})`
    : arenaName;

  const participantLines = participants
    .map((p) => {
      const roleStr = p.role ? ` [Role: ${p.role.toUpperCase()}]` : "";
      const invStr =
        p.inventory && p.inventory.length > 0
          ? ` | Inventory: ${p.inventory.join(", ")}`
          : " | Inventory: none";
      return `- ${p.name} (District ${p.district})${roleStr} | Condition: ${p.physicalTag}, ${p.mentalTag}${invStr}`;
    })
    .join("\n");

  const fatalities =
    stateDelta.fatalities && stateDelta.fatalities.length > 0
      ? stateDelta.fatalities
          .map((id) => {
            const found = participants.find((p) => p.id === id);
            return found ? `${found.name} (District ${found.district})` : id;
          })
          .join(", ")
      : "None";

  const physicalUpdates = Object.entries(stateDelta.healthChanges || {})
    .map(([id, delta]) => {
      const found = participants.find((p) => p.id === id);
      const name = found ? found.name : id;
      if (delta < 0) {
        return `${name} sustains physical injury / wounds`;
      }
      return `${name} recovers physical stamina`;
    })
    .join("; ");

  const mentalUpdates = Object.entries(stateDelta.sanityChanges || {})
    .map(([id, delta]) => {
      const found = participants.find((p) => p.id === id);
      const name = found ? found.name : id;
      if (delta < 0) {
        return `${name} is psychologically shaken / distressed`;
      }
      return `${name} regains focus / morale`;
    })
    .join("; ");

  const contextItems: string[] = [];
  if (thematicContext?.cornucopiaDescription) {
    contextItems.push(`Cornucopia Structure: ${thematicContext.cornucopiaDescription}`);
  }
  if (thematicContext?.itemContested) {
    contextItems.push(`Contested Item: ${thematicContext.itemContested}`);
  }
  if (thematicContext?.itemDiscovered) {
    contextItems.push(`Discovered Item: ${thematicContext.itemDiscovered}`);
  }
  if (thematicContext?.npcName) {
    contextItems.push(`Mutt/NPC Encountered: ${thematicContext.npcName}`);
  }
  if (thematicContext?.hazardName) {
    contextItems.push(`Environmental Hazard: ${thematicContext.hazardName}`);
  }
  if (thematicContext?.locationDescription) {
    contextItems.push(`Specific Location: ${thematicContext.locationDescription}`);
  }
  if (thematicContext?.specialRulesTriggered?.length) {
    contextItems.push(
      `Special Directives: ${thematicContext.specialRulesTriggered.join(", ")}`
    );
  }

  return `[SIMULATION CONTEXT]
Match: ${simulationTitle}
Arena: ${arenaDisplay}
Event Category: ${eventCategory.toUpperCase()} | Outcome: ${outcomeType.toUpperCase()}

[PARTICIPANTS]
${participantLines}

[DETERMINISTIC STATE OUTCOMES]
Fatalities: ${fatalities}
Physical Condition Updates: ${physicalUpdates || "None"}
Mental State Updates: ${mentalUpdates || "None"}
${contextItems.length > 0 ? `\n[ARENA THEMATIC CONTEXT]\n${contextItems.join("\n")}` : ""}
${stateDelta.narrativeNotes ? `\n[DIRECTIVE NOTES]\n${stateDelta.narrativeNotes}` : ""}

Generate a vivid, sensory narrative describing this exact encounter.`;
}

// ==========================================
// 4. Barebones Fallback Generator
// ==========================================

/**
 * Barebones fallback generator used when no API key is provided or an upstream error occurs.
 */
export function generateBarebonesFallback(request: NarrativeRequest): string {
  const names = request.participants.map((p) => p.name).join(" and ");
  const hasFatalities =
    request.stateDelta.fatalities && request.stateDelta.fatalities.length > 0;

  if (hasFatalities) {
    const deadNames = request.stateDelta.fatalities
      .map((id) => {
        const found = request.participants.find((p) => p.id === id);
        return found ? found.name : id;
      })
      .join(", ");
    return `In ${request.arenaName}, a lethal clash erupts between ${names}. ${deadNames} collapses as a cannon blast echoes across the arena.`;
  }

  switch (request.eventCategory) {
    case "combat":
      return `A tense skirmish breaks out in ${request.arenaName} between ${names}, ending after a swift exchange of blows as they disengage.`;
    case "forage":
      return `${names} scours the rugged terrain of ${request.arenaName} in search of vital supplies.`;
    case "hazard":
      return `The harsh elements of ${request.arenaName} test the endurance of ${names}.`;
    case "sponsor":
      return `A silver parachute glides down from above, delivering a package to ${names}.`;
    case "mutt":
      return `The sounds of hostile muttations reverberate near ${names} in ${request.arenaName}.`;
    case "social":
      return `${names} cross paths in the shadows of ${request.arenaName}, warily evaluating each other.`;
    default:
      return `${names} moves carefully through ${request.arenaName}, staying vigilant.`;
  }
}

// ==========================================
// 5. Streaming & Generation Operations
// ==========================================

export interface NarrativeGenerationResult {
  text: string;
  modelId: string;
  finishReason?: string;
  rawFinishReason?: string;
  warnings?: unknown[];
}

/**
 * Initiates streaming text generation for an arena event.
 */
export function streamNarrative(
  request: NarrativeRequest,
  options?: StorytellingModelOptions
) {
  const model = getStorytellingModel(
    request.model || options?.model,
    options?.apiKey,
    options
  );
  const systemPrompt =
    NARRATIVE_SYSTEM_PROMPTS[request.narrativeVoice] ||
    NARRATIVE_SYSTEM_PROMPTS.novel_cinematic;
  const userPrompt = buildNarrativeUserPrompt(request);

  return streamText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.7,
  });
}

/**
 * Generates narrative text for an arena event along with model metadata.
 */
export async function generateNarrativeWithMetadata(
  request: NarrativeRequest,
  options?: StorytellingModelOptions
): Promise<NarrativeGenerationResult> {
  const apiKey = options?.apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      text: generateBarebonesFallback(request),
      modelId: "fallback-no-key",
    };
  }

  try {
    const model = getStorytellingModel(
      request.model || options?.model,
      apiKey,
      options
    );
    const systemPrompt =
      NARRATIVE_SYSTEM_PROMPTS[request.narrativeVoice] ||
      NARRATIVE_SYSTEM_PROMPTS.novel_cinematic;
    const userPrompt = buildNarrativeUserPrompt(request);

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxRetries: 1,
      timeout: 15000,
    });

    const modelId =
      result.response?.modelId ||
      request.model ||
      options?.model ||
      DEFAULT_OPENROUTER_MODEL;

    const rawText = result.text.trim();

    // Check if the response was flagged by content filter, classifier model, or returned a safety refusal token (e.g., 'User:safety', 'User Safety: safe')
    const isSafetyRefusal =
      result.finishReason === "content-filter" ||
      /^user\s*(safety|:)/i.test(rawText) ||
      /user safety:\s*(safe|unsafe)/i.test(rawText) ||
      /nvidia\/.*content-safety/i.test(modelId) ||
      rawText.length === 0;

    if (isSafetyRefusal) {
      console.warn(
        `[narrative] Content filtered, classifier output, or model refusal from '${modelId}' (finishReason: ${result.finishReason}, text: "${rawText}"). Applying barebones fallback.`
      );
      return {
        text: generateBarebonesFallback(request),
        modelId,
        finishReason: result.finishReason,
        rawFinishReason: result.rawFinishReason,
        warnings: result.warnings,
      };
    }

    return {
      text: rawText,
      modelId,
      finishReason: result.finishReason,
      rawFinishReason: result.rawFinishReason,
      warnings: result.warnings,
    };
  } catch (err) {
    console.error("[narrative] failed to generate via OpenRouter:", err);
    return {
      text: generateBarebonesFallback(request),
      modelId: "fallback-error",
    };
  }
}

/**
 * Generates non-streaming narrative text for an arena event.
 */
export async function generateNarrative(
  request: NarrativeRequest,
  options?: StorytellingModelOptions
): Promise<string> {
  const result = await generateNarrativeWithMetadata(request, options);
  return result.text;
}

// ==========================================
// 6. Cornucopia Synthesis & Generation
// ==========================================

/**
 * Procedural deterministic fallback synthesizer for the Cornucopia structure based on arena lore.
 */
export function synthesizeCornucopiaDescription(
  arenaName: string,
  arenaLore?: string
): string {
  const combined = `${arenaName} ${arenaLore || ""}`.toLowerCase();

  if (/volcan|lava|magma|caldera|fire|ash|obsidian|pyroclastic/.test(combined)) {
    return "A colossal horn of heat-tempered blackened titanium, perched on an obsidian rock shelf surrounded by glowing fissures and rising sulfur vents.";
  }
  if (/snow|ice|arctic|blizzard|frozen|tundra|glaci|frost|sub-zero/.test(combined)) {
    return "A frosted crystalline metallic horn encrusted with jagged rime, standing atop a treacherous frozen ice sheet surrounded by razor-sharp icicles.";
  }
  if (/desert|sand|dune|arid|wasteland|badland|scorched|sahara/.test(combined)) {
    return "A sun-bleached golden alloy horn rising like a desert monument from shifting dunes, radiating scorching heat across the ring of metal pedestals.";
  }
  if (/jungle|rainforest|forest|wood|swamp|marsh|bog|canopy|grove/.test(combined)) {
    return "A towering burnished bronze horn half-swallowed by ancient moss and thick vines, resting on a muddy clearing beneath towering canopy trees.";
  }
  if (/ruin|city|urban|concrete|skyscraper|industrial|factory|decay|asphalt/.test(combined)) {
    return "A battered industrial steel horn anchored amidst cracked asphalt and rusted rebar, shadowed by decaying concrete monoliths.";
  }
  if (/ocean|water|island|aquatic|beach|coast|reef|sea|lake/.test(combined)) {
    return "A polished coralline horn looming on a raised sandbar spit, battered by swirling tides with launching pedestals submerged in knee-deep water.";
  }
  if (/cave|underground|subterranean|mine|chasm|abyss|tunnel/.test(combined)) {
    return "A dark basalt-carved horn looming under towering stalactites in a cavernous chamber, lit only by eerie luminescent moss.";
  }
  if (/cyber|holo|neon|tech|digital|simulation|virtual|quantum/.test(combined)) {
    return "A geometric prism-faceted horn pulsing with neon conduits and digital telemetry grids, flanked by luminescent glass launch plates.";
  }

  return "A massive golden horn of plenty resting on a circular stone dais, surrounded by the ring of numbered launch pedestals.";
}

export interface CornucopiaGenerationOptions extends StorytellingModelOptions {
  arenaName: string;
  arenaDescription?: string;
  narrativeVoice?: NarrativeVoice;
}

/**
 * Generates an evocative 1-2 sentence description of the arena's custom Cornucopia horn, pedestals, and launch ring.
 */
export async function generateCornucopiaDescription(
  options: CornucopiaGenerationOptions
): Promise<string> {
  const { arenaName, arenaDescription = "", narrativeVoice = "novel_cinematic" } = options;
  const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return synthesizeCornucopiaDescription(arenaName, arenaDescription);
  }

  try {
    const model = getStorytellingModel(options.model, apiKey, options);
    const systemPrompt = `You are the lead Gamemaker architect designing the Cornucopia for the Hunger Games arena.
Describe the central Cornucopia horn, its unique construction/materials, and the surrounding tribute launch pedestals in 1 to 2 evocative, sensory sentences (20 to 45 words).
Tailor the materials, appearance, and hazards directly to the arena's specific biome and theme.
Do NOT include preamble, markdown headers, or quotes. Output ONLY the description.`;

    const userPrompt = `Arena: ${arenaName}
Lore: ${arenaDescription || "Standard Capitol Arena"}
Voice Style: ${narrativeVoice}

Describe the Cornucopia structure and opening launch ring for this arena.`;

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxRetries: 1,
      timeout: 10000,
    });

    const text = result.text.trim();
    if (!text || /^user\s*(safety|:)/i.test(text)) {
      return synthesizeCornucopiaDescription(arenaName, arenaDescription);
    }
    return text;
  } catch (err) {
    console.warn(
      "[ai] Failed to generate custom Cornucopia description with LLM, using procedural synthesizer:",
      err
    );
    return synthesizeCornucopiaDescription(arenaName, arenaDescription);
  }
}
