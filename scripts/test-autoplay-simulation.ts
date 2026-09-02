/**
 * Hunger Games AI — Autoplay Simulation Benchmark & Full Match Event Analytics
 *
 * Implements the Canonical Benchmark Match from AGENTS.md in Autonomous Autoplay mode:
 *   - Arena: "The Floor is Lava Caldera" (custom volcanic arena)
 *   - Roster: 26 Tributes across 13 Districts (24 Canon 74th + Larry the Evil Cat & Sentient Plastic Chair)
 *   - Granularity: "autoplay" (continuous hands-off execution until a Victor is crowned)
 *   - Pacing: "cinematic"
 *   - Default Rules: Bloodbath, Muttations, Disasters, Sponsor Drops, Mid-Game Feast, Dynamic Pacts
 *
 * Lifecycle:
 *   1. Authenticate Head Gamemaker against Supabase DEV.
 *   2. Purge any existing test matches from public.games.
 *   3. Create new game with default rules and turn_granularity: "autoplay".
 *   4. Seed 26 canonical tributes and bootstrap initial district alliances.
 *   5. Transition match status to "in_progress".
 *   6. Autoplay Loop:
 *      - Repeatedly compute and persist phase outcomes via deterministic engine.
 *      - Generate OpenRouter AI narratives for 100% of events in real time.
 *      - Stream phase updates, casualty reports, and loot telemetry.
 *      - Advance automatically until nextGameState.status === "finished".
 *   7. Perform exhaustive invariant audit on the completed database state.
 *   8. Generate detailed analytical breakdown of event categories, item combinations,
 *      fatality curves, and Victor biometrics.
 *   9. Preserve completed game in Supabase DEV for UI replay and inspection.
 *
 * Usage:
 *   npx tsx scripts/test-autoplay-simulation.ts
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
// 1. Environment Configuration
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

interface AnalyticsAccumulator {
  totalPhases: number;
  totalEvents: number;
  totalNarrativesGenerated: number;
  fatalitiesCount: number;
  eventCategories: Record<string, number>;
  itemsLooted: Record<string, number>;
  itemsConsumed: Record<string, number>;
  itemsLost: Record<string, number>;
  phaseSummaries: Array<{
    phaseOrder: number;
    dayNumber: number;
    phaseType: string;
    eventsCount: number;
    fatalities: string[];
  }>;
  modelUsage: Record<string, number>;
  invariantsPassed: number;
  invariantsFailed: number;
}

async function runAutoplaySimulation(): Promise<void> {
  console.log("\n=======================================================");
  console.log(" 🌋  HUNGER GAMES AI: AUTOPLAY BENCHMARK & STUDY GAME");
  console.log("=======================================================");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    process.exit(1);
  }

  if (!ADMIN_PASSWORD) {
    console.error("❌ Missing ADMIN_PASSWORD in .env.local");
    process.exit(1);
  }

  const supabase: SupabaseClient<Database> = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  // ---------------------------------------------------------------------------
  // Step 1: Clean All Existing Games from Supabase DEV
  // ---------------------------------------------------------------------------
  console.log("\n🧹 [Step 1] Purging all existing test games in public.games...");
  const { data: existingGames, error: fetchGamesErr } = await supabase
    .from("games")
    .select("id, title");

  if (fetchGamesErr) {
    console.error("⚠️ Failed to query existing games:", fetchGamesErr.message);
  } else if (existingGames && existingGames.length > 0) {
    console.log(`   Found ${existingGames.length} existing game(s). Deleting to ensure clean state...`);
    for (const g of existingGames) {
      await supabase.from("games").delete().eq("id", g.id);
      console.log(`   • Deleted game: "${g.title}" (${g.id})`);
    }
  } else {
    console.log("   • Database is already completely clean (0 games found).");
  }

  // ---------------------------------------------------------------------------
  // Step 2: Create Canonical Benchmark Autoplay Game
  // ---------------------------------------------------------------------------
  const benchmarkConfig = {
    title: "The 74th Hunger Games: The Floor is Lava Caldera (Autoplay Benchmark)",
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
      pacing: "cinematic" as const,
      turn_granularity: "autoplay" as const,
      combat_lethality: "balanced" as const,
      sponsor_generosity: "standard" as const,
      muttation_timing: "climax_only" as const,
      disaster_frequency: "moderate" as const,
      alliance_dynamic: "dynamic_pacts" as const,
      narrative_voice: "novel_cinematic" as const,
      victory_condition: "sole_victor" as const,
    },
  };

  console.log(`\n🏛️ [Step 2] Initializing Autoplay Match in public.games [status: setup]...`);
  console.log(`   • Title: ${benchmarkConfig.title}`);
  console.log(`   • Arena: ${benchmarkConfig.arena_name}`);
  console.log(`   • Mode: ${benchmarkConfig.settings.turn_granularity.toUpperCase()} (Continuous Autonomous Execution)`);

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

  const activeGameId = gameRow.id;
  console.log(`✅ Match created successfully! Game ID: ${activeGameId}`);

  // ---------------------------------------------------------------------------
  // Step 3: Insert Canonical 26-Tribute Roster
  // ---------------------------------------------------------------------------
  console.log(`\n👥 [Step 3] Deploying 26 Tributes across 13 Districts...`);
  const tributePayloads = [
    ...CANON_74TH_TRIBUTES.map((t) => ({
      game_id: activeGameId,
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
      game_id: activeGameId,
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
      game_id: activeGameId,
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
  console.log(`✅ 26 Tributes registered in [public.tributes].`);

  // ---------------------------------------------------------------------------
  // Step 4: Bootstrap Starting District Alliances & Transition to in_progress
  // ---------------------------------------------------------------------------
  console.log(`\n🤝 [Step 4] Bootstrapping Starting District Alliances...`);
  const setupPrng = createPRNG(`${activeGameId}-setup-alliances-benchmark`);
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
    activeGameId,
    setupPrng
  );

  if (initialAlliances.size > 0) {
    const alliancePayloads = Array.from(initialAlliances.values()).map((a) =>
      engineAllianceToDbPayload(a)
    );
    await supabase.from("game_alliances").insert(alliancePayloads);
    console.log(`   • Starting Alliances Formed: ${initialAlliances.size}`);
  }

  await supabase.from("games").update({ status: "in_progress" }).eq("id", activeGameId);
  console.log(`✅ Match Status Transitioned: [setup -> in_progress]`);

  // ---------------------------------------------------------------------------
  // Step 5: Autonomous Autoplay Loop (Until a Victor is Crowned)
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(" 🚀  COMMENCING AUTONOMOUS AUTOPLAY SIMULATION LOOP");
  console.log("=======================================================");

  const analytics: AnalyticsAccumulator = {
    totalPhases: 0,
    totalEvents: 0,
    totalNarrativesGenerated: 0,
    fatalitiesCount: 0,
    eventCategories: {},
    itemsLooted: {},
    itemsConsumed: {},
    itemsLost: {},
    phaseSummaries: [],
    modelUsage: {},
    invariantsPassed: 0,
    invariantsFailed: 0,
  };

  const MAX_PHASE_CIRCUIT_BREAKER = 35;
  let isGameOver = false;

  while (!isGameOver && analytics.totalPhases < MAX_PHASE_CIRCUIT_BREAKER) {
    // 5.1 Reconstruct Engine State strictly from Supabase DEV (Zero Drift Architecture)
    const { data: dbCurrentGame } = await supabase.from("games").select("*").eq("id", activeGameId).single();
    if (!dbCurrentGame) throw new Error("Active game lost from database!");

    if (dbCurrentGame.status === "finished") {
      console.log("🏁 Database indicates match is already finished.");
      break;
    }

    const { data: dbCurrentTributes } = await supabase.from("tributes").select("*").eq("game_id", activeGameId);
    const { data: dbCurrentAlliances } = await supabase.from("game_alliances").select("*").eq("game_id", activeGameId);
    const { data: dbLatestPhases } = await supabase
      .from("game_phases")
      .select("*")
      .eq("game_id", activeGameId)
      .order("phase_order", { ascending: false })
      .limit(1);

    const latestPhaseRow = dbLatestPhases && dbLatestPhases.length > 0 ? dbLatestPhases[0] : null;

    const currentGameState = dbGameStateToEngine({
      gameRow: dbCurrentGame as Tables<"games">,
      tributeRows: (dbCurrentTributes ?? []) as Tables<"tributes">[],
      allianceRows: (dbCurrentAlliances ?? []) as Tables<"game_alliances">[],
      latestPhaseRow,
    });

    const livingTributes = Array.from(currentGameState.tributes.values()).filter((t) => t.status === "alive");
    const livingCount = livingTributes.length;

    console.log(`\n-------------------------------------------------------`);
    console.log(`📍 [AUTOPLAY PHASE #${currentGameState.phaseOrder + 1}] | Living: ${livingCount}/26 | Alliances: ${Array.from(currentGameState.alliances.values()).filter((a) => a.status === "active").length}`);
    console.log(`-------------------------------------------------------`);

    // 5.2 Deterministic Phase Advancement
    const { phaseResult, nextGameState } = advanceGamePhase({
      gameState: currentGameState,
    });

    analytics.totalPhases++;
    analytics.totalEvents += phaseResult.events.length;
    analytics.fatalitiesCount += phaseResult.fallenTributeIds.length;

    console.log(`🎯 Simulated: Day ${phaseResult.dayNumber} ${phaseResult.phaseType.toUpperCase()} (Phase #${phaseResult.phaseOrder})`);
    console.log(`   • Events in Phase: ${phaseResult.events.length}`);
    console.log(`   • Casualties This Phase: ${phaseResult.fallenTributeIds.length}`);

    // Map casualties
    const casualtyNames = phaseResult.fallenTributeIds.map(
      (id) => currentGameState.tributes.get(id)?.name ?? id
    );
    if (casualtyNames.length > 0) {
      console.log(`   💀 Casualties: ${casualtyNames.join(", ")}`);
    }

    analytics.phaseSummaries.push({
      phaseOrder: phaseResult.phaseOrder,
      dayNumber: phaseResult.dayNumber,
      phaseType: phaseResult.phaseType,
      eventsCount: phaseResult.events.length,
      fatalities: casualtyNames,
    });

    // 5.3 Persist Phase, Events, Tributes, Alliances, and Game Status to Supabase DEV
    const { phaseRow, eventRows } = enginePhaseResultToDbPayloads(phaseResult);

    const { error: phaseInsertErr } = await supabase.from("game_phases").insert(phaseRow);
    if (phaseInsertErr) throw new Error(`Failed to insert phase: ${phaseInsertErr.message}`);

    const { error: eventsInsertErr } = await supabase.from("game_phase_events").insert(eventRows);
    if (eventsInsertErr) throw new Error(`Failed to insert events: ${eventsInsertErr.message}`);

    for (const updatedTribute of phaseResult.updatedTributes.values()) {
      await supabase
        .from("tributes")
        .update(engineTributeToDbUpdate(updatedTribute))
        .eq("id", updatedTribute.id);
    }

    for (const alliance of nextGameState.alliances.values()) {
      await supabase
        .from("game_alliances")
        .upsert(engineAllianceToDbPayload(alliance));
    }

    const isMatchConcluded = nextGameState.status === "finished";
    await supabase
      .from("games")
      .update({
        current_day: nextGameState.currentDay,
        current_phase_type: nextGameState.currentPhaseType,
        status: nextGameState.status,
        winner_id: nextGameState.winnerIds?.[0] ?? null,
        ended_at: isMatchConcluded ? new Date().toISOString() : null,
      })
      .eq("id", activeGameId);

    // 5.4 OpenRouter AI Narrative Synthesis for ALL Events
    console.log(`🤖 [AI Storyteller] Generating narratives for ${phaseResult.events.length} event(s)...`);
    for (let i = 0; i < phaseResult.events.length; i++) {
      const event = phaseResult.events[i];

      // Track categories
      analytics.eventCategories[event.eventCategory] =
        (analytics.eventCategories[event.eventCategory] || 0) + 1;

      // Track item state changes
      for (const [, delta] of Object.entries(event.stateDeltas)) {
        if (delta.itemsGained) {
          for (const item of delta.itemsGained) {
            const name = typeof item === "string" ? item : item.name;
            analytics.itemsLooted[name] = (analytics.itemsLooted[name] || 0) + 1;
          }
        }
        if (delta.itemsConsumed) {
          for (const item of delta.itemsConsumed) {
            const name = typeof item === "string" ? item : item.name;
            analytics.itemsConsumed[name] = (analytics.itemsConsumed[name] || 0) + 1;
          }
        }
        if (delta.itemsLost) {
          for (const item of delta.itemsLost) {
            const name = typeof item === "string" ? item : item.name;
            analytics.itemsLost[name] = (analytics.itemsLost[name] || 0) + 1;
          }
        }
      }

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

      analytics.modelUsage[modelId] = (analytics.modelUsage[modelId] || 0) + 1;
      analytics.totalNarrativesGenerated++;

      // Update database with generated narrative
      await supabase
        .from("game_phase_events")
        .update({ narrative_text: narrativeText })
        .eq("phase_id", phaseResult.phaseId)
        .eq("event_order", event.eventOrder);

      const snippet = narrativeText.length > 75 ? narrativeText.slice(0, 72) + "..." : narrativeText;
      const deathBadge = event.victimIds && event.victimIds.length > 0 ? ` 💀[x${event.victimIds.length}]` : "";
      console.log(
        `   [#${event.eventOrder} | ${event.eventCategory.toUpperCase()}${deathBadge} | ${modelId}]: "${snippet}"`
      );
    }

    if (isMatchConcluded) {
      isGameOver = true;
      console.log(`\n🎉 VICTORY ACHIEVED! Match concluded on Day ${nextGameState.currentDay} (${phaseResult.phaseType.toUpperCase()})!`);
      const winnerName = nextGameState.winnerIds?.[0]
        ? phaseResult.updatedTributes.get(nextGameState.winnerIds[0])?.name ?? nextGameState.winnerIds[0]
        : "Mutual Annihilation";
      console.log(`🏆 Victor of the 74th Hunger Games: ${winnerName.toUpperCase()}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 6: Full Database Invariant Audit
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(" 🔍 [EXHAUSTIVE INVARIANT AUDIT OF COMPLETED MATCH]");
  console.log("=======================================================");

  function assertInvariant(description: string, condition: boolean): void {
    if (condition) {
      console.log(`   ✅ [PASS] Invariant: ${description}`);
      analytics.invariantsPassed++;
    } else {
      console.error(`   ❌ [FAIL] Invariant Violation: ${description}`);
      analytics.invariantsFailed++;
    }
  }

  // 6.1 Query final database state
  const { data: finalGame } = await supabase.from("games").select("*").eq("id", activeGameId).single();
  const { data: finalTributes } = await supabase.from("tributes").select("*").eq("game_id", activeGameId);
  const { data: finalPhases } = await supabase.from("game_phases").select("*").eq("game_id", activeGameId);
  const { data: finalEvents } = await supabase.from("game_phase_events").select("*").in(
    "phase_id",
    (finalPhases ?? []).map((p) => p.id)
  );

  assertInvariant("Game record exists and status is 'finished'", finalGame?.status === "finished");
  assertInvariant("Game winner_id is populated with valid UUID", typeof finalGame?.winner_id === "string");
  assertInvariant("Game ended_at timestamp is populated", typeof finalGame?.ended_at === "string");

  // Roster invariants
  const livingTributes = (finalTributes ?? []).filter((t) => t.status === "alive");
  const deadTributes = (finalTributes ?? []).filter((t) => t.status === "dead");

  assertInvariant(`Total tributes count remains exactly 26 (${(finalTributes ?? []).length})`, finalTributes?.length === 26);
  assertInvariant(`Exactly 1 living Victor remains (${livingTributes.length})`, livingTributes.length === 1);
  assertInvariant(`Exactly 25 fallen tributes recorded (${deadTributes.length})`, deadTributes.length === 25);
  assertInvariant(`Victor placement is exactly 1`, livingTributes[0]?.placement === 1);
  assertInvariant(`Victor ID matches games.winner_id`, livingTributes[0]?.id === finalGame?.winner_id);

  // Check dead placements are strictly valid and unique 2..26
  const placements = new Set(deadTributes.map((t) => t.placement));
  assertInvariant("All 25 dead tributes have distinct placements", placements.size === 25);
  const allPlacementsInRange = deadTributes.every((t) => typeof t.placement === "number" && t.placement >= 2 && t.placement <= 26);
  assertInvariant("All fallen placements are strictly between 2 and 26", allPlacementsInRange);

  // Check 100% of persisted events have narrative_text
  const allEventsHaveNarrative = (finalEvents ?? []).every(
    (e) => typeof e.narrative_text === "string" && e.narrative_text.trim().length > 0
  );
  assertInvariant(
    `100% of all ${(finalEvents ?? []).length} match events have generated narrative_text in Supabase`,
    allEventsHaveNarrative
  );

  // Phase sequence invariants
  const phaseOrders = (finalPhases ?? []).map((p) => p.phase_order).sort((a, b) => a - b);
  const consecutivePhases = phaseOrders.every((val, idx) => val === idx + 1);
  assertInvariant(`Phases form a strictly contiguous sequence 1..${phaseOrders.length}`, consecutivePhases);

  // ---------------------------------------------------------------------------
  // Step 7: Post-Game Analytical Report
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(" 📊  HUNGER GAMES AI: FULL MATCH ANALYTICS & STUDY");
  console.log("=======================================================");

  const victor = livingTributes[0];
  const victorStats = victor?.stats as { survival?: number; sanity?: number; physical_tag?: string; mental_tag?: string } | undefined;
  const victorInventory = Array.isArray(victor?.inventory) ? victor.inventory : [];

  console.log(`\n👑 CROWNED VICTOR PROFILE:`);
  console.log(`   • Name: ${victor?.name} (District ${victor?.district})`);
  console.log(`   • Kill Count: ${victor?.kill_count}`);
  console.log(`   • Final Survival: ${victorStats?.survival ?? "N/A"} (${victorStats?.physical_tag ?? "N/A"})`);
  console.log(`   • Final Sanity: ${victorStats?.sanity ?? "N/A"} (${victorStats?.mental_tag ?? "N/A"})`);
  console.log(`   • Final Inventory: ${victorInventory.length > 0 ? victorInventory.map((i: any) => typeof i === "string" ? i : i.name).join(", ") : "(None)"}`);

  console.log(`\n📅 MATCH PACING & CHRONOLOGY:`);
  console.log(`   • Total Arena Days: ${finalGame?.current_day}`);
  console.log(`   • Total Phases Executed: ${analytics.totalPhases}`);
  console.log(`   • Total Events Resolved: ${analytics.totalEvents}`);
  console.log(`   • Total AI Narratives Synthesized: ${analytics.totalNarrativesGenerated}`);

  console.log(`\n🎭 EVENT CATEGORY DISTRIBUTION:`);
  for (const [cat, count] of Object.entries(analytics.eventCategories).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / analytics.totalEvents) * 100).toFixed(1);
    console.log(`   • ${cat.toUpperCase().padEnd(12)}: ${count.toString().padStart(3)} (${pct}%)`);
  }

  console.log(`\n⚔️ TOP KILLERS / COMBAT TELEMETRY:`);
  const killers = [...(finalTributes ?? [])].sort((a, b) => (b.kill_count ?? 0) - (a.kill_count ?? 0));
  for (const t of killers.slice(0, 5)) {
    console.log(`   • ${t.name.padEnd(25)} (District ${t.district}): ${t.kill_count} kill(s) | Placement: #${t.placement}`);
  }

  console.log(`\n📦 LOOT & ITEM ECONOMY DYNAMICS:`);
  const topLooted = Object.entries(analytics.itemsLooted).sort((a, b) => b[1] - a[1]).slice(0, 6);
  console.log(`   • Most Looted Items: ${topLooted.map(([item, count]) => `${item} (x${count})`).join(", ") || "None"}`);
  const topConsumed = Object.entries(analytics.itemsConsumed).sort((a, b) => b[1] - a[1]).slice(0, 6);
  console.log(`   • Most Consumed Items: ${topConsumed.map(([item, count]) => `${item} (x${count})`).join(", ") || "None"}`);

  console.log(`\n🤖 AI MODEL UTILIZATION:`);
  for (const [model, count] of Object.entries(analytics.modelUsage)) {
    const pct = ((count / analytics.totalNarrativesGenerated) * 100).toFixed(1);
    console.log(`   • ${model}: ${count} event narratives (${pct}%)`);
  }

  console.log(`\n📋 PHASE-BY-PHASE CASUALTY PROGRESSION:`);
  for (const p of analytics.phaseSummaries) {
    const fatalitiesStr = p.fatalities.length > 0 ? `💀 [${p.fatalities.join(", ")}]` : "None (Survivors evaded clash)";
    console.log(`   • Phase #${p.phaseOrder.toString().padStart(2)} (Day ${p.dayNumber} ${p.phaseType.toUpperCase().padEnd(10)}): ${p.eventsCount} events | Fatalities: ${fatalitiesStr}`);
  }

  console.log(`\n🏅 FINAL LEADERBOARD (TOP 10):`);
  const leaderboard = [...(finalTributes ?? [])].sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99));
  for (const t of leaderboard.slice(0, 10)) {
    const statusMark = t.placement === 1 ? "👑 VICTOR" : `Fallen (Kills: ${t.kill_count})`;
    console.log(`   #${t.placement?.toString().padStart(2)}: ${t.name.padEnd(25)} District ${t.district.toString().padStart(2)} — ${statusMark}`);
  }

  console.log("\n=======================================================");
  console.log(` 🏆 FINAL VERDICT: ${analytics.invariantsPassed}/${analytics.invariantsPassed + analytics.invariantsFailed} INVARIANTS PASSED`);
  console.log(` 💾 MATCH DATA RETAINED IN SUPABASE DEV (Game ID: ${activeGameId})`);
  console.log("=======================================================\n");

  if (analytics.invariantsFailed > 0) {
    throw new Error(`Simulation concluded with ${analytics.invariantsFailed} invariant failures.`);
  }

  await supabase.auth.signOut();
  console.log("🔒 Supabase session gracefully terminated.");
}

runAutoplaySimulation().catch((err) => {
  console.error("💥 Fatal error during Autoplay Simulation benchmark:", err);
  process.exit(1);
});
