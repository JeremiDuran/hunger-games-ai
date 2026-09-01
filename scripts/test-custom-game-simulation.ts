/**
 * Hunger Games AI — Custom Game Simulation & Live DB Verification
 * 
 * Creates a custom test game in Supabase with:
 *   - Custom Arena: "The Floor is Lava Caldera"
 *   - 26 Tributes: 24 Canon 74th tributes + 'Larry the Evil Cat' (D13) + 'Sentient Plastic Chair' (D13)
 *   - Default settings with turnGranularity: "event_by_event"
 * 
 * Advances the Bloodbath phase, persists all records to Supabase,
 * and executes & generates the AI Narrative for the very first event (Event 1), then pauses.
 * Includes automatic error cleanup to ensure no orphan games remain if a step fails.
 * 
 * Usage:
 *   npx tsx scripts/test-custom-game-simulation.ts
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CANON_74TH_TRIBUTES } from "../src/config/tribute-presets";
import { advanceGamePhase } from "../src/lib/engine/orchestrator";
import {
  dbGameStateToEngine,
  enginePhaseResultToDbPayloads,
  engineTributeToDbUpdate,
  engineAllianceToDbPayload,
} from "../src/lib/engine/adapters";
import { serializeEventToNarrativePayload } from "../src/lib/engine/narrative-serializer";
import { generateNarrative } from "../src/lib/ai";
import { bootstrapInitialAlliances } from "../src/lib/engine/alliances";
import { createPRNG } from "../src/lib/engine/prng";
import { Database, Tables } from "../src/types/database";

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "jeremiduran17@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

let activeGameId: string | null = null;
let globalSupabase: SupabaseClient<Database> | null = null;

async function runCustomGameSimulation() {
  console.log("\n=======================================================");
  console.log(" 🌋  HUNGER GAMES AI: CUSTOM GAME & LIVE DB SIMULATION");
  console.log("=======================================================");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    process.exit(1);
  }

  if (!ADMIN_PASSWORD) {
    console.error("❌ Missing ADMIN_PASSWORD in .env.local");
    process.exit(1);
  }

  console.log(`📡 Connecting to Supabase: ${SUPABASE_URL}`);
  console.log(`👤 Authenticating as Head Gamemaker (${ADMIN_EMAIL})...`);

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  globalSupabase = supabase;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (authError || !authData.user) {
    console.error("❌ Authentication Failed:", authError?.message || "Invalid credentials");
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`✅ Authentication Successful! User ID: ${userId}\n`);

  // Clean up any stale previous test runs with matching title
  const testTitle = "The 74th Hunger Games: The Floor is Lava Caldera";
  const { data: oldGames } = await supabase.from("games").select("id").eq("title", testTitle);
  if (oldGames && oldGames.length > 0) {
    console.log(`🧹 Cleaning up ${oldGames.length} previous test game run(s)...`);
    for (const old of oldGames) {
      await supabase.from("games").delete().eq("id", old.id);
    }
  }

  // ------------------------------------------------------------------
  // Step 1: Create Custom Game in public.games
  // ------------------------------------------------------------------
  const customArena = {
    title: testTitle,
    arena_name: "The Floor is Lava Caldera",
    arena_description:
      "A volatile subterranean caldera with shifting obsidian plates, rising rivers of incandescent molten magma, crumbling basalt pillars, and blinding sulfurous steam vents.",
    tribute_count: 26,
    settings: {
      enable_bloodbath: true,
      enable_muttations: true,
      enable_disasters: true,
      enable_sponsor_drops: true,
      enable_mid_game_feast: true,
      pacing: "cinematic",
      turn_granularity: "event_by_event",
      combat_lethality: "balanced",
      sponsor_generosity: "standard",
      muttation_timing: "climax_only",
      disaster_frequency: "moderate",
      alliance_dynamic: "dynamic_pacts",
      narrative_voice: "novel_cinematic",
      victory_condition: "sole_victor",
    },
  };

  console.log(`🏛️ Creating Game in Supabase [public.games]...`);
  console.log(`   • Title: ${customArena.title}`);
  console.log(`   • Arena: ${customArena.arena_name}`);
  console.log(`   • Tributes: 26 across 13 Districts`);
  console.log(`   • Granularity: event_by_event\n`);

  const { data: createdGame, error: gameInsertError } = await supabase
    .from("games")
    .insert({
      user_id: userId,
      title: customArena.title,
      arena_name: customArena.arena_name,
      arena_description: customArena.arena_description,
      tribute_count: customArena.tribute_count,
      status: "setup",
      current_day: 0,
      current_phase_type: "bloodbath",
      settings: customArena.settings,
    })
    .select()
    .single();

  if (gameInsertError || !createdGame) {
    throw new Error(`Failed to create game in database: ${JSON.stringify(gameInsertError)}`);
  }

  activeGameId = createdGame.id;
  console.log(`✅ Game successfully created! Game UUID: ${activeGameId}\n`);

  // ------------------------------------------------------------------
  // Step 2: Build 26-Tribute Roster (24 Canon + 2 Custom District 13)
  // ------------------------------------------------------------------
  console.log(`👥 Assembling 26-Tribute Roster (24 Canon + District 13 Legends)...`);

  const rawTributesPayload = [
    // 24 Canon Tributes (Districts 1 - 12)
    ...CANON_74TH_TRIBUTES.map((t) => ({
      game_id: activeGameId!,
      name: t.name,
      district: t.district,
      gender: t.gender,
      personality: t.personality,
      physical_aspect: t.physicalAspect,
      avatar_url: t.avatarUrl,
      status: "alive" as const,
      kill_count: 0,
      stats: { survival: 50, sanity: 50, physical_tag: "unscathed", mental_tag: "composed" },
      inventory: [],
    })),
    // 2 Custom Tributes (District 13)
    {
      game_id: activeGameId!,
      name: "Larry the Evil Cat",
      district: 13,
      gender: "male" as const,
      personality: "Chaotic, sinister feline predator with razor-sharp claws, night vision, and zero remorse.",
      physical_aspect: "Sleek midnight black fur, glowing sulfur-yellow eyes, lethal razor claws.",
      avatar_url: null,
      status: "alive" as const,
      kill_count: 0,
      stats: { survival: 50, sanity: 50, physical_tag: "unscathed", mental_tag: "composed" },
      inventory: [],
    },
    {
      game_id: activeGameId!,
      name: "Sentient Plastic Chair",
      district: 13,
      gender: "non_binary" as const,
      personality: "Unwavering stoic plastic monobloc lawn chair, impervious to intimidation, panic, or persuasion.",
      physical_aspect: "White molded polypropylene monobloc lawn chair, pristine, weatherproof, and virtually indestructible.",
      avatar_url: null,
      status: "alive" as const,
      kill_count: 0,
      stats: { survival: 50, sanity: 50, physical_tag: "unscathed", mental_tag: "composed" },
      inventory: [],
    },
  ];

  const { data: insertedTributes, error: tributesInsertError } = await supabase
    .from("tributes")
    .insert(rawTributesPayload)
    .select();

  if (tributesInsertError || !insertedTributes || insertedTributes.length !== 26) {
    throw new Error(`Failed to insert tributes into database: ${JSON.stringify(tributesInsertError)}`);
  }

  console.log(`✅ Successfully persisted 26 tributes in Supabase [public.tributes]!`);
  console.log(`   • District 12: Katniss Everdeen & Peeta Mellark`);
  console.log(`   • District 13: Larry the Evil Cat & Sentient Plastic Chair`);
  console.log(`   • Total Living Combatants: ${insertedTributes.length}\n`);

  // ------------------------------------------------------------------
  // Step 3: Initialize Alliances & Transition to in_progress
  // ------------------------------------------------------------------
  const prng = createPRNG(`${activeGameId}-setup-alliances-42`);
  const engineRoster = insertedTributes.map((t) => ({
    id: t.id,
    gameId: t.game_id,
    name: t.name,
    district: t.district,
    gender: t.gender,
    personality: t.personality ?? "",
    physicalAspect: t.physical_aspect ?? "",
    avatarUrl: t.avatar_url,
    status: t.status,
    killCount: t.kill_count,
    biometrics: { survival: 50, sanity: 50, physicalTag: "unscathed" as const, mentalTag: "composed" as const },
    inventory: [],
    deathPhaseId: null,
    placement: null,
  }));

  const initialAlliances = bootstrapInitialAlliances(
    engineRoster,
    "dynamic_pacts",
    activeGameId!,
    prng
  );

  if (initialAlliances.size > 0) {
    const allianceInserts = Array.from(initialAlliances.values()).map((a) =>
      engineAllianceToDbPayload(a)
    );
    await supabase.from("game_alliances").insert(allianceInserts);
    console.log(`🤝 Initialized ${initialAlliances.size} Starting District Alliances in [public.game_alliances].\n`);
  }

  // Transition game from setup to in_progress
  await supabase.from("games").update({ status: "in_progress" }).eq("id", activeGameId);

  // ------------------------------------------------------------------
  // Step 4: Reconstruct Engine Game State from DB (Parity Check)
  // ------------------------------------------------------------------
  console.log(`🔍 Verifying Database-to-Engine State Parity...`);
  const { data: reloadedGame } = await supabase.from("games").select("*").eq("id", activeGameId).single();
  const { data: reloadedTributes } = await supabase.from("tributes").select("*").eq("game_id", activeGameId);
  const { data: reloadedAlliances } = await supabase.from("game_alliances").select("*").eq("game_id", activeGameId);

  const gameState = dbGameStateToEngine({
    gameRow: (reloadedGame ?? createdGame) as Tables<"games">,
    tributeRows: reloadedTributes as Tables<"tributes">[],
    allianceRows: reloadedAlliances as Tables<"game_alliances">[],
    latestPhaseRow: null,
  });

  console.log(`✅ State Parity Verified:`);
  console.log(`   • Game ID: ${gameState.gameId}`);
  console.log(`   • Total Tributes Loaded: ${gameState.tributes.size}`);
  console.log(`   • Starting Phase: ${gameState.currentPhaseType.toUpperCase()} (Day ${gameState.currentDay})\n`);

  // ------------------------------------------------------------------
  // Step 5: Advance Simulation to Day 0 Bloodbath
  // ------------------------------------------------------------------
  console.log("⚡ Executing Day 0 Bloodbath Simulation at the Golden Cornucopia Horn...");
  const { phaseResult, nextGameState } = advanceGamePhase({ gameState });

  console.log(`🎯 Phase Computed:`);
  console.log(`   • Phase Type: ${phaseResult.phaseType.toUpperCase()}`);
  console.log(`   • Generated Events: ${phaseResult.events.length}`);
  console.log(`   • Casualties at Cornucopia: ${phaseResult.fallenTributeIds.length}`);

  // Persist phase result to database
  const { phaseRow, eventRows } = enginePhaseResultToDbPayloads(phaseResult);

  const { error: phaseErr } = await supabase.from("game_phases").insert(phaseRow);
  if (phaseErr) {
    throw new Error(`Failed to persist phase to DB: ${JSON.stringify(phaseErr)}`);
  }

  const { error: eventsErr } = await supabase.from("game_phase_events").insert(eventRows);
  if (eventsErr) {
    throw new Error(`Failed to persist events to DB: ${JSON.stringify(eventsErr)}`);
  }

  // Update modified tributes
  for (const updatedTribute of phaseResult.updatedTributes.values()) {
    await supabase
      .from("tributes")
      .update(engineTributeToDbUpdate(updatedTribute))
      .eq("id", updatedTribute.id);
  }

  // Update game state
  await supabase
    .from("games")
    .update({
      current_day: nextGameState.currentDay,
      current_phase_type: nextGameState.currentPhaseType,
      status: nextGameState.status,
    })
    .eq("id", activeGameId);

  console.log(`💾 Phase and all ${eventRows.length} events successfully persisted to Supabase!\n`);

  // ------------------------------------------------------------------
  // Step 6: event_by_event Granularity — Inspect & Generate Event 1
  // ------------------------------------------------------------------
  console.log("=======================================================");
  console.log(" 🎯  EVENT_BY_EVENT GRANULARITY: EXECUTING FIRST EVENT");
  console.log("=======================================================");

  const firstEvent = phaseResult.events[0];
  if (!firstEvent) {
    console.log("No events occurred in this phase.");
    process.exit(0);
  }

  console.log(`\n📋 [EVENT 1 TELEMETRY]:`);
  console.log(`   • Event Order: #${firstEvent.eventOrder}`);
  console.log(`   • Category: ${firstEvent.eventCategory.toUpperCase()} | Outcome: ${firstEvent.outcomeType.toUpperCase()}`);
  console.log(`   • Participants (${firstEvent.tributeIds.length}):`);
  firstEvent.tributeIds.forEach((id) => {
    const tribute = gameState.tributes.get(id);
    console.log(`     - ${tribute?.name} (District ${tribute?.district})`);
  });

  if (firstEvent.killerIds?.length) {
    const killers = firstEvent.killerIds.map((id) => gameState.tributes.get(id)?.name).join(", ");
    console.log(`   • Killer: ${killers}`);
  }
  if (firstEvent.victimIds?.length) {
    const victims = firstEvent.victimIds.map((id) => gameState.tributes.get(id)?.name).join(", ");
    console.log(`   • Fallen Victim: 💀 ${victims}`);
  }
  if (firstEvent.thematicContext?.itemContested) {
    console.log(`   • Contested Loot: ⚔️ ${firstEvent.thematicContext.itemContested}`);
  }
  if (firstEvent.thematicContext?.locationDescription) {
    console.log(`   • Location: 📍 ${firstEvent.thematicContext.locationDescription}`);
  }

  // Serialize to AI Narrative Request
  const narrativePayload = serializeEventToNarrativePayload(firstEvent, {
    simulationTitle: customArena.title,
    arenaName: customArena.arena_name,
    arenaDescription: customArena.arena_description,
    narrativeVoice: "novel_cinematic",
    tributes: gameState.tributes,
  });

  console.log(`\n🤖 Calling OpenRouter AI Storyteller for Event 1...`);
  const narrativeText = await generateNarrative(narrativePayload, {
    apiKey: OPENROUTER_API_KEY,
  });

  console.log(`\n✨ [AI STORYTELLER LIVE NARRATIVE]:`);
  console.log(`   "${narrativeText}"\n`);

  // Update narrative text in database for event 1
  await supabase
    .from("game_phase_events")
    .update({ narrative_text: narrativeText })
    .eq("phase_id", phaseResult.phaseId)
    .eq("event_order", firstEvent.eventOrder);

  console.log(`💾 Narrative text cached directly into [public.game_phase_events]!`);
  console.log(`🛑 [EVENT_BY_EVENT STEP COMPLETE]: Successfully stopped after Event 1 as instructed.`);
  console.log(`=======================================================\n`);

  await supabase.auth.signOut();
}

runCustomGameSimulation().catch(async (err) => {
  console.error("\n💥 Fatal simulation error:", err);
  if (activeGameId && globalSupabase) {
    console.log(`🧹 Cleaning up failed game [${activeGameId}] from database...`);
    try {
      await globalSupabase.from("games").delete().eq("id", activeGameId);
      console.log(`✅ Cleanup complete.`);
    } catch (cleanErr) {
      console.error(`Failed during cleanup:`, cleanErr);
    }
  }
  process.exit(1);
});
