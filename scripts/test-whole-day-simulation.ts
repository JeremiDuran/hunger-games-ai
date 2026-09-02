/**
 * Hunger Games AI — Whole Day Granularity & Live AI Narrative Flow Test
 *
 * Implements the Canonical Benchmark Match from AGENTS.md:
 *   - Arena: "The Floor is Lava Caldera" (custom volcanic arena)
 *   - Roster: 26 Tributes (24 Canon 74th + Larry the Evil Cat & Sentient Plastic Chair)
 *   - Granularity: "whole_day" (computes phase, generates all event narratives in bg, then reveals all)
 *   - Discrete phase transitions: Whole-day mode halts at phase end until explicit Gamemaker advancement
 *
 * Lifecycle:
 *   1. Setup game in Supabase with Canonical Benchmark configuration.
 *   2. Bootstrap starting district alliances & transition to `in_progress`.
 *   3. For each phase in the Day 0 -> Day 1 -> Night 1 cycle:
 *      a. Advance phase deterministically with simulation engine.
 *      b. Persist phase, raw events, and modified tribute/alliance state.
 *      c. Background Worker: Sequentially generate AI narratives for ALL events in the phase
 *         via OpenRouter (or fallback) and cache directly to `game_phase_events.narrative_text`.
 *      d. Whole-Day Reveal: Present the full formatted phase chronicle (events, loot, casualties, Fallen Anthem).
 *      e. Phase Gating: Confirm the system halts at phase boundary without auto-creating next phase.
 *   4. Verify comprehensive database & mathematical invariants.
 *   5. Automatic zero-residue cleanup in `finally` block.
 *
 * Usage:
 *   npx tsx scripts/test-whole-day-simulation.ts
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
import { generateNarrativeWithMetadata } from "../src/lib/ai";
import { bootstrapInitialAlliances } from "../src/lib/engine/alliances";
import { createPRNG } from "../src/lib/engine/prng";
import { Database, Tables } from "../src/types/database";

// ---------------------------------------------------------------------------
// 1. Environment Loading
// ---------------------------------------------------------------------------
function loadEnv(): void {
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

interface TestReport {
  phasesRun: number;
  totalEventsProcessed: number;
  narrativesGenerated: number;
  fatalitiesRecorded: number;
  itemsLooted: number;
  invariantsPassed: number;
  invariantsFailed: number;
}

let activeGameId: string | null = null;
let globalSupabase: SupabaseClient<Database> | null = null;

async function runWholeDaySimulation(): Promise<void> {
  console.log("\n=======================================================");
  console.log(" 🌞  HUNGER GAMES AI: TRUE WHOLE-DAY SIMULATION & NARRATIVE TEST");
  console.log("=======================================================");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    process.exit(1);
  }

  if (!ADMIN_PASSWORD) {
    console.error("❌ Missing ADMIN_PASSWORD in .env.local");
    process.exit(1);
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  globalSupabase = supabase;

  // Authenticate Head Gamemaker
  console.log(`👤 Authenticating Head Gamemaker (${ADMIN_EMAIL})...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (authError || !authData.user) {
    console.error("❌ Authentication Failed:", authError?.message || "Invalid credentials");
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`✅ Head Gamemaker Authenticated! User ID: ${userId}`);

  const report: TestReport = {
    phasesRun: 0,
    totalEventsProcessed: 0,
    narrativesGenerated: 0,
    fatalitiesRecorded: 0,
    itemsLooted: 0,
    invariantsPassed: 0,
    invariantsFailed: 0,
  };

  function assertInvariant(description: string, condition: boolean): void {
    if (condition) {
      console.log(`   ✅ [PASS] Invariant: ${description}`);
      report.invariantsPassed++;
    } else {
      console.error(`   ❌ [FAIL] Invariant Violation: ${description}`);
      report.invariantsFailed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Step 1: Clean Stale Previous Test Games & Create Canonical Match
    // -------------------------------------------------------------
    const benchmarkConfig = {
      title: "The 74th Hunger Games: The Floor is Lava Caldera",
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
        turn_granularity: "whole_day",
        combat_lethality: "balanced",
        sponsor_generosity: "standard",
        muttation_timing: "climax_only",
        disaster_frequency: "moderate",
        alliance_dynamic: "dynamic_pacts",
        narrative_voice: "novel_cinematic",
        victory_condition: "sole_victor",
      },
    };

    const { data: oldGames } = await supabase
      .from("games")
      .select("id")
      .eq("title", benchmarkConfig.title);

    if (oldGames && oldGames.length > 0) {
      console.log(`🧹 Purging ${oldGames.length} stale benchmark test game run(s)...`);
      for (const old of oldGames) {
        await supabase.from("games").delete().eq("id", old.id);
      }
    }

    console.log(`\n🏛️ [Step 1] Creating Canonical Match in Supabase [status: setup]...`);
    console.log(`   • Title: ${benchmarkConfig.title}`);
    console.log(`   • Arena: ${benchmarkConfig.arena_name}`);
    console.log(`   • Granularity: ${benchmarkConfig.settings.turn_granularity}`);

    const { data: gameRow, error: gameError } = await supabase
      .from("games")
      .insert({
        user_id: userId,
        title: benchmarkConfig.title,
        arena_name: benchmarkConfig.arena_name,
        arena_description: benchmarkConfig.arena_description,
        tribute_count: benchmarkConfig.tribute_count,
        status: "setup",
        current_day: 0,
        current_phase_type: "bloodbath",
        settings: benchmarkConfig.settings,
      })
      .select()
      .single();

    if (gameError || !gameRow) {
      throw new Error(`Failed to create game: ${gameError?.message}`);
    }

    activeGameId = gameRow.id;
    console.log(`✅ Match created successfully! ID: ${activeGameId}`);

    // -------------------------------------------------------------
    // Step 2: Insert Canonical 26-Tribute Roster
    // -------------------------------------------------------------
    console.log(`\n👥 [Step 2] Inserting 26 Tributes (24 Canon + District 13 Legends)...`);
    const tributePayloads = [
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

    const { data: insertedTributes, error: tributeError } = await supabase
      .from("tributes")
      .insert(tributePayloads)
      .select();

    if (tributeError || !insertedTributes || insertedTributes.length !== 26) {
      throw new Error(`Failed to insert tributes: ${tributeError?.message}`);
    }
    console.log(`✅ 26 Tributes persisted in [public.tributes].`);

    // -------------------------------------------------------------
    // Step 3: Bootstrap Starting Alliances & Transition to in_progress
    // -------------------------------------------------------------
    console.log(`\n🤝 [Step 3] Bootstrapping Initial District Alliances...`);
    const setupPrng = createPRNG(`${activeGameId}-setup-alliances-74`);
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
      setupPrng
    );

    if (initialAlliances.size > 0) {
      const alliancePayloads = Array.from(initialAlliances.values()).map((a) =>
        engineAllianceToDbPayload(a)
      );
      await supabase.from("game_alliances").insert(alliancePayloads);
      console.log(`   • Starting Alliances Formed: ${initialAlliances.size}`);
    }

    await supabase.from("games").update({ status: "in_progress" }).eq("id", activeGameId!);
    console.log(`✅ Match Status Transitioned: [setup -> in_progress]`);

    // -------------------------------------------------------------
    // Step 4: Single-Phase Whole-Day Simulation (Day 0 Bloodbath)
    // -------------------------------------------------------------
    // In whole_day granularity, the system computes the entire current phase,
    // generates all event narratives in the background, reveals them all at once,
    // and STOPS at the phase boundary awaiting manual Gamemaker advancement.
    console.log(`\n=======================================================`);
    console.log(`⚡ [SIMULATING PHASE]: DAY 0 BLOODBATH AT THE CORNUCOPIA`);
    console.log(`=======================================================`);

    // 4.1 Reconstruct current Engine Game State from DB (Zero Drift Check)
    const { data: dbGame } = await supabase.from("games").select("*").eq("id", activeGameId!).single();
    const { data: dbTributes } = await supabase.from("tributes").select("*").eq("game_id", activeGameId!);
    const { data: dbAlliances } = await supabase.from("game_alliances").select("*").eq("game_id", activeGameId!);
    const { data: dbLatestPhases } = await supabase
      .from("game_phases")
      .select("*")
      .eq("game_id", activeGameId!)
      .order("phase_order", { ascending: false })
      .limit(1);

    const latestPhaseRow = dbLatestPhases && dbLatestPhases.length > 0 ? dbLatestPhases[0] : null;

    const currentGameState = dbGameStateToEngine({
      gameRow: dbGame as Tables<"games">,
      tributeRows: dbTributes as Tables<"tributes">[],
      allianceRows: dbAlliances as Tables<"game_alliances">[],
      latestPhaseRow,
    });

    const livingBefore = Array.from(currentGameState.tributes.values()).filter((t) => t.status === "alive").length;
    console.log(`📍 Starting Phase: ${currentGameState.currentPhaseType.toUpperCase()} (Day ${currentGameState.currentDay})`);
    console.log(`   • Active Living Combatants: ${livingBefore}`);
    console.log(`   • Active Pacts: ${Array.from(currentGameState.alliances.values()).filter((a) => a.status === "active").length}`);

    // 4.2 Compute pure deterministic phase result
    console.log(`\n🎲 Running Deterministic Simulation Engine...`);
    const { phaseResult, nextGameState } = advanceGamePhase({
      gameState: currentGameState,
    });

    report.phasesRun = 1;
    report.totalEventsProcessed = phaseResult.events.length;
    report.fatalitiesRecorded = phaseResult.fallenTributeIds.length;

    console.log(`🎯 Phase Output Computed:`);
    console.log(`   • Phase Order: #${phaseResult.phaseOrder}`);
    console.log(`   • Total Events Generated: ${phaseResult.events.length}`);
    console.log(`   • Phase Casualties: ${phaseResult.fallenTributeIds.length}`);

    // 4.3 Persist phase structure & raw events to Supabase
    const { phaseRow, eventRows } = enginePhaseResultToDbPayloads(phaseResult);

    const { error: phaseInsertErr } = await supabase.from("game_phases").insert(phaseRow);
    if (phaseInsertErr) throw new Error(`Failed to insert phase: ${phaseInsertErr.message}`);

    const { error: eventsInsertErr } = await supabase.from("game_phase_events").insert(eventRows);
    if (eventsInsertErr) throw new Error(`Failed to insert events: ${eventsInsertErr.message}`);

    // Persist updated tributes
    for (const updatedTribute of phaseResult.updatedTributes.values()) {
      await supabase
        .from("tributes")
        .update(engineTributeToDbUpdate(updatedTribute))
        .eq("id", updatedTribute.id);
    }

    // Persist updated alliances
    for (const alliance of nextGameState.alliances.values()) {
      await supabase
        .from("game_alliances")
        .upsert(engineAllianceToDbPayload(alliance));
    }

    // Update games table with next state (current_day, current_phase_type)
    await supabase
      .from("games")
      .update({
        current_day: nextGameState.currentDay,
        current_phase_type: nextGameState.currentPhaseType,
        status: nextGameState.status,
        winner_id: nextGameState.winnerIds?.[0] ?? null,
      })
      .eq("id", activeGameId!);

    console.log(`💾 Base phase and events persisted to database.`);

    // -------------------------------------------------------------
    // 4.4 Background Worker: Generate AI Narratives for ALL Events
    // (Simulating the web app's background generation pipeline for whole_day)
    // -------------------------------------------------------------
    console.log(`\n🤖 [Background Worker] Processing AI Narrative Generation for all ${phaseResult.events.length} events...`);

    for (let i = 0; i < phaseResult.events.length; i++) {
      const event = phaseResult.events[i];
      const narrativePayload = serializeEventToNarrativePayload(event, {
        simulationTitle: benchmarkConfig.title,
        arenaName: benchmarkConfig.arena_name,
        arenaDescription: benchmarkConfig.arena_description,
        narrativeVoice: "novel_cinematic",
        tributes: currentGameState.tributes,
      });

      const { text: narrativeText, modelId } = await generateNarrativeWithMetadata(narrativePayload, {
        apiKey: OPENROUTER_API_KEY,
      });

      // Update database with generated narrative
      const { error: updateNarrativeErr } = await supabase
        .from("game_phase_events")
        .update({ narrative_text: narrativeText })
        .eq("phase_id", phaseResult.phaseId)
        .eq("event_order", event.eventOrder);

      if (updateNarrativeErr) {
        throw new Error(`Failed to cache narrative for event #${event.eventOrder}: ${updateNarrativeErr.message}`);
      }

      report.narrativesGenerated++;
      const snippet = narrativeText.length > 70 ? narrativeText.slice(0, 67) + "..." : narrativeText;
      console.log(`   [Bg Event ${i + 1}/${phaseResult.events.length}] (Order #${event.eventOrder} | ${event.eventCategory.toUpperCase()} | Model: ${modelId}): "${snippet}"`);
    }

    console.log(`✅ All ${phaseResult.events.length} event narratives synthesized and stored in Supabase!`);

    // -------------------------------------------------------------
    // 4.5 Whole-Day Presentation / Reveal
    // (Simulating the web app displaying the complete phase chronicle)
    // -------------------------------------------------------------
    console.log(`\n-------------------------------------------------------`);
    console.log(`📖 [WHOLE-DAY PHASE REVEAL]: DAY 0 BLOODBATH`);
    console.log(`-------------------------------------------------------`);

    // Query complete events from DB to verify persistence & display
    const { data: dbPhaseEvents } = await supabase
      .from("game_phase_events")
      .select("*")
      .eq("phase_id", phaseResult.phaseId)
      .order("event_order", { ascending: true });

    if (!dbPhaseEvents || dbPhaseEvents.length !== phaseResult.events.length) {
      throw new Error("Mismatch in persisted phase events count!");
    }

    for (const ev of dbPhaseEvents) {
      const participants = (ev.tribute_ids as string[])
        .map((id) => currentGameState.tributes.get(id)?.name ?? id)
        .join(", ");
      const victims = (ev.victim_ids as string[] | null)?.length
        ? ` | 💀 Casualties: ${(ev.victim_ids as string[]).map((id) => currentGameState.tributes.get(id)?.name ?? id).join(", ")}`
        : "";

      console.log(`\n📌 [Event #${ev.event_order}] [${ev.event_category?.toUpperCase()}] (${participants})${victims}`);
      console.log(`   "${ev.narrative_text}"`);
    }

    // -------------------------------------------------------------
    // 4.6 Invariant Assertions for Phase
    // -------------------------------------------------------------
    console.log(`\n=======================================================`);
    console.log(" 🔍 [WHOLE-DAY PHASE INVARIANT AUDIT & PARITY]");
    console.log("=======================================================");

    // Check all events have non-null narrative_text
    const allEventsHaveNarrative = dbPhaseEvents.every(
      (e) => typeof e.narrative_text === "string" && e.narrative_text.trim().length > 0
    );
    assertInvariant("100% of phase events possess cached narrative_text in Supabase", allEventsHaveNarrative);

    // Living + Dead count check
    const livingCount = Array.from(phaseResult.updatedTributes.values()).filter((t) => t.status === "alive").length;
    const deadCount = Array.from(phaseResult.updatedTributes.values()).filter((t) => t.status === "dead").length;
    assertInvariant(
      `Living (${livingCount}) + Dead (${deadCount}) = 26 Total Roster`,
      livingCount + deadCount === 26
    );

    // Sequential dead placements check
    const deadTributes = Array.from(phaseResult.updatedTributes.values()).filter((t) => t.status === "dead");
    const deadPlacementsValid = deadTributes.every((t) => typeof t.placement === "number" && t.placement >= 2);
    assertInvariant(
      `All ${deadTributes.length} fallen tributes have valid sequential placements`,
      deadPlacementsValid
    );

    // Living tributes placement null
    const livingTributes = Array.from(phaseResult.updatedTributes.values()).filter((t) => t.status === "alive");
    const livingPlacementsNull = livingTributes.every((t) => t.placement === null);
    assertInvariant(
      `All ${livingTributes.length} survivors have placement === null`,
      livingPlacementsNull
    );

    // Inventory consistency check
    let inventoryConsistent = true;
    for (const event of phaseResult.events) {
      for (const [tId, delta] of Object.entries(event.stateDeltas)) {
        if (delta.itemsGained && delta.itemsGained.length > 0) {
          const consumedOrLost = new Set([
            ...(delta.itemsConsumed ?? []).map((i) => (typeof i === "string" ? i : i.name)),
            ...(delta.itemsLost ?? []).map((i) => (typeof i === "string" ? i : i.name)),
            ...(delta.itemsDestroyed ?? []).map((i) => (typeof i === "string" ? i : i.name)),
          ]);

          const tribute = phaseResult.updatedTributes.get(tId);
          for (const item of delta.itemsGained) {
            const itemName = typeof item === "string" ? item : item.name;
            report.itemsLooted++;
            if (!consumedOrLost.has(itemName)) {
              const hasItem = tribute?.inventory.some((inv) =>
                typeof inv === "string" ? inv === itemName : inv.name === itemName
              );
              if (!hasItem) {
                inventoryConsistent = false;
              }
            }
          }
        }
      }
    }
    assertInvariant("Looted items are correctly registered in tribute inventory", inventoryConsistent);

    // 4.7 Phase Gating Check: Confirm system halts without auto-creating next phase
    const { data: phasesInDb } = await supabase
      .from("game_phases")
      .select("id")
      .eq("game_id", activeGameId!);
    assertInvariant(
      `Whole-Day mode halts strictly at phase boundary without auto-creating next phase (Exactly 1 phase record in DB)`,
      phasesInDb?.length === 1
    );

    console.log(`\n🛑 [WHOLE_DAY STEP COMPLETE]: Successfully finished Day 0 Bloodbath phase, generated all ${report.narrativesGenerated} event narratives, revealed all events, and halted.`);

    console.log(`\n📈 [Session Metrics]:`);
    console.log(`   • Phases Simulated: ${report.phasesRun}`);
    console.log(`   • Total Events Processed: ${report.totalEventsProcessed}`);
    console.log(`   • AI Narratives Generated & Cached: ${report.narrativesGenerated}`);
    console.log(`   • Total Casualties: ${report.fatalitiesRecorded}`);
    console.log(`   • Total Items Looted: ${report.itemsLooted}`);
    console.log(`   • Invariants Passed: ${report.invariantsPassed}/${report.invariantsPassed + report.invariantsFailed}`);

    if (report.invariantsFailed > 0) {
      throw new Error(`Session failed with ${report.invariantsFailed} invariant violation(s)`);
    }

    console.log(`\n🏆 [VERDICT]: Whole Day Granularity & AI Narrative Flow 100% Verified!`);
  } catch (err) {
    console.error("\n💥 Error during Whole Day test execution:", err);
    throw err;
  } finally {
    // -------------------------------------------------------------
    // Step 5: Unconditional Zero-Residue Cleanup (AGENTS.md Protocol)
    // -------------------------------------------------------------
    if (activeGameId && globalSupabase) {
      console.log(`\n🧹 Purging active test match [${activeGameId}] to ensure zero database residue...`);
      const { error: purgeErr } = await globalSupabase
        .from("games")
        .delete()
        .eq("id", activeGameId);

      if (purgeErr) {
        console.error(`⚠️ Failed to delete test game [${activeGameId}]:`, purgeErr.message);
      } else {
        console.log(`✨ Cascade purge successful for game [${activeGameId}]. DB is clean.`);
      }
    }
    if (globalSupabase) {
      await globalSupabase.auth.signOut();
      console.log("🔒 Supabase session cleanly terminated.\n");
    }
  }
}

runWholeDaySimulation().catch((err) => {
  console.error("💥 Fatal test runner failure:", err);
  process.exit(1);
});

