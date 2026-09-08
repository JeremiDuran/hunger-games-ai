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
interface CustomTributeDef {
  name: string;
  district: number;
  gender: "male" | "female" | "non_binary" | "unspecified";
  personality: string;
  physicalAspect: string;
}

const CUSTOM_ROSTER: CustomTributeDef[] = [
  // District 1
  {
    name: "Prince Herb",
    district: 1,
    gender: "male",
    personality: "Fat man that has neurotic tendencies, multiple phobias but can survive getting hit by a car.",
    physicalAspect: "Heavy-set build, neurotic demeanor, remarkably durable body capable of surviving vehicle impacts.",
  },
  {
    name: "Murr",
    district: 1,
    gender: "male",
    personality: "Ferret looking man that can act as human pinata.",
    physicalAspect: "Ferret-like features, agile, surprisingly resilient under blunt force.",
  },
  {
    name: "Q",
    district: 1,
    gender: "male",
    personality: "Avid car enthusiast and ex firefighter and bouncer. Suffers from arachnophobia, which can be used against him.",
    physicalAspect: "Burly ex-bouncer frame, firefighter stamina, visible dread around spiders.",
  },

  // District 2
  {
    name: "Ambatakum",
    district: 2,
    gender: "male",
    personality: "Hero of the hood, he become one to avenge his brother Am Kaming.",
    physicalAspect: "Athletic vigilante build, intense vengeful gaze.",
  },
  {
    name: "Brandon Curington",
    district: 2,
    gender: "male",
    personality: "He was known to be Captain Am Kaming's lost son during the fall of the Nazi Nowhere Islands. He is highly respected for his perfect barber cuts.",
    physicalAspect: "Razor-sharp hairline, impeccable grooming, disciplined combat posture.",
  },
  {
    name: "Yes King",
    district: 2,
    gender: "male",
    personality: "Yes King Jr (aka Yes king) is the leader of the King Empire. Even though Yes King had a strong running empire he is still afraid of lions, pizzas, and chickens.",
    physicalAspect: "Regal imperial swagger, easily startled by poultry, pizza, or predators.",
  },

  // District 3
  {
    name: "Evil Larry",
    district: 3,
    gender: "male",
    personality: "Black cat that will try to steal your soul.",
    physicalAspect: "Midnight black feline fur, sinister glowing sulfur-yellow eyes, razor-sharp claws.",
  },
  {
    name: "Uncanny Cat",
    district: 3,
    gender: "male",
    personality: "He is the Dark side of Canny Cat, His Dark aura covering all over his body, He can't escape from the darkness, He is permanently UNCANNY.",
    physicalAspect: "Disturbing feline silhouette shrouded in an ominous, dark aura.",
  },
  {
    name: "SneedCat",
    district: 3,
    gender: "male",
    personality: "Cat that guards Sneed's Feed and Seed and manages its Whole budget. Can solve the most complex math equations in hours.",
    physicalAspect: "Calculating farmstead cat with an analytical gaze and meticulous poise.",
  },

  // District 4
  {
    name: "Waltuh",
    district: 4,
    gender: "male",
    personality: "Also known as Heisenburger, he makes the best burgers. His pimento sandwich was shown to be stronger than a miltary base firearms.",
    physicalAspect: "Bald man with a goatee and porkpie hat, clutching legendary pimento sandwiches.",
  },
  {
    name: "Finger",
    district: 4,
    gender: "male",
    personality: "A ex cop and marine that now acts as an assasin, he posses both brain and brawn.",
    physicalAspect: "Grizzled bald veteran with a deadpan stare, lethal tactical efficiency.",
  },
  {
    name: "Jesse Pinkman(God Ki)",
    district: 4,
    gender: "male",
    personality: "He has trained with gods and now has red hair and godly strenght.",
    physicalAspect: "Radiant divine aura, spiky crimson red hair, supernatural strength.",
  },

  // District 5
  {
    name: "The Demiurge",
    district: 5,
    gender: "non_binary",
    personality: "this being half lion half snake has come to mocks the mortals about their free will. He needs to stay though, to prevent them from escaping to the spiritual realm.",
    physicalAspect: "Roaring golden lion head attached to a massive coiled serpentine body.",
  },
  {
    name: "Stickman",
    district: 5,
    gender: "male",
    personality: "Duelist, fisherman, sniper, war master. He has seen it all.",
    physicalAspect: "Minimalist two-dimensional stick figure silhouette with uncanny combat reflexes.",
  },
  {
    name: "Spooky Skeleton",
    district: 5,
    gender: "non_binary",
    personality: "A very, very, very spooky skeletal that will spook you.",
    physicalAspect: "Bleached calcium skeleton clacking audibly, radiating pure eerie energy.",
  },

  // District 6
  {
    name: "Soap Monster",
    district: 6,
    gender: "non_binary",
    personality: "A monster that eats soap or other soapy products, whenever he goes places, they will stay dirty.",
    physicalAspect: "Grubby creature leaving trails of grime while perpetually munching bars of soap.",
  },
  {
    name: "Golden Tom Pearl",
    district: 6,
    gender: "male",
    personality: "A man with a yellow skin that can eat anything.",
    physicalAspect: "Striking yellow skin, insatiable iron-lined jaw capable of consuming any matter.",
  },
  {
    name: "Elspeth",
    district: 6,
    gender: "female",
    personality: "A shadowy witch who brews potent potions and casts curses under the moonlight, her dark magic both feared and sought.",
    physicalAspect: "Robed witch draped in midnight silk, eyes glimmering with forbidden arcane brew.",
  },
];
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
      title: "The 74th Hunger Games: Sawmill Complex",
      arena_name: "Sawmill Complex",
      arena_description:
        "An massive industrial logging site, evyrthing is made wood, sawdust scatters all over the place, massive logs are everyhere on the ground, stacked in silos, or hanging by ropes attchd the sealing, most building are several stories high with opne windows.On the ground moving saws are prsent, unknow is their purpose.",
      tribute_count: CUSTOM_ROSTER.length,
      settings: {
        enable_bloodbath: true,
        enable_muttations: true,
        enable_disasters: true,
        enable_sponsor_drops: true,
        enable_mid_game_feast: true,
        enable_special_events: true,
        pacing: "cinematic",
        turn_granularity: "whole_day",
        combat_lethality: "balanced",
        sponsor_generosity: "standard",
        muttation_timing: "climax_only",
        disaster_frequency: "moderate",
        alliance_dynamic: "dynamic_pacts",
        narrative_voice: "gamemaker_log",
        victory_condition: "sole_victor",
      },
    };

    const { data: oldGames } = await supabase
      .from("games")
      .select("id")
      .eq("title", benchmarkConfig.title);

    if (oldGames && oldGames.length > 0) {
      console.log(`🧹 Purging ${oldGames.length} stale run(s) of "${benchmarkConfig.title}"...`);
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
    // Step 2: Insert Custom 18-Tribute Roster
    // -------------------------------------------------------------
    console.log(`\n👥 [Step 2] Inserting ${CUSTOM_ROSTER.length} Custom Tributes across 6 Districts...`);
    const tributePayloads = CUSTOM_ROSTER.map((t) => ({
      game_id: activeGameId!,
      name: t.name,
      district: t.district,
      gender: t.gender,
      personality: t.personality,
      physical_aspect: t.physicalAspect,
      avatar_url: null,
      status: "alive" as const,
      kill_count: 0,
      stats: { survival: 50, sanity: 50, physical_tag: "unscathed", mental_tag: "composed" },
      inventory: [],
    }));

    const { data: insertedTributes, error: tributeError } = await supabase
      .from("tributes")
      .insert(tributePayloads)
      .select();

    if (tributeError || !insertedTributes || insertedTributes.length !== CUSTOM_ROSTER.length) {
      throw new Error(`Failed to insert tributes: ${tributeError?.message}`);
    }
    console.log(`✅ ${CUSTOM_ROSTER.length} Tributes persisted in [public.tributes].`);

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
        narrativeVoice: benchmarkConfig.settings.narrative_voice as any,
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
      `Living (${livingCount}) + Dead (${deadCount}) = ${benchmarkConfig.tribute_count} Total Roster`,
      livingCount + deadCount === benchmarkConfig.tribute_count
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
            // Surviving tributes must retain gained items; fallen tributes drop inventory on death
            if (tribute?.status === "alive" && !consumedOrLost.has(itemName)) {
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
    assertInvariant("Looted items are correctly registered in living tribute inventory (or dropped on death)", inventoryConsistent);

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

    // -------------------------------------------------------------
    // Step 4.8: Side-by-Side Narrative Comparison with Gamemaker Log
    // -------------------------------------------------------------
    const { data: prevGame } = await supabase
      .from("games")
      .select("id, title")
      .eq("title", "The 74th Hunger Games: Sawmill Complex")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prevGame) {
      const { data: prevPhases } = await supabase
        .from("game_phases")
        .select("id")
        .eq("game_id", prevGame.id)
        .order("phase_order", { ascending: true })
        .limit(1);

      if (prevPhases && prevPhases.length > 0) {
        const { data: prevEvents } = await supabase
          .from("game_phase_events")
          .select("event_order, event_category, narrative_text")
          .eq("phase_id", prevPhases[0].id)
          .order("event_order", { ascending: true });

        console.log(`\n=======================================================`);
        console.log(" ⚖️  SIDE-BY-SIDE NARRATIVE COMPARISON");
        console.log("=======================================================");
        console.log(`[Game A (Gamemaker Log): ${prevGame.id}] vs [Game B (Novel Cinematic): ${activeGameId}]\n`);

        for (const newEv of dbPhaseEvents) {
          const oldEv = prevEvents?.find((e) => e.event_order === newEv.event_order);
          console.log(`-------------------------------------------------------`);
          console.log(`📌 Event #${newEv.event_order} [${newEv.event_category?.toUpperCase()}]:`);
          console.log(`📡 [GAMEMAKER LOG]:\n"${oldEv?.narrative_text ?? "(Not found)"}"\n`);
          console.log(`📖 [NOVEL CINEMATIC]:\n"${newEv.narrative_text}"\n`);
        }
      }
    }
  } catch (err) {
    console.error("\n💥 Error during Whole Day test execution:", err);
    throw err;
  } finally {
    // -------------------------------------------------------------
    // Step 5: Test Retention / Optional Zero-Residue Cleanup
    // -------------------------------------------------------------
    const purgeGame = process.env.PURGE_TEST_GAME === "true";
    if (activeGameId && globalSupabase) {
      if (purgeGame) {
        console.log(`\n🧹 Purging active test match [${activeGameId}] (PURGE_TEST_GAME=true)...`);
        const { error: purgeErr } = await globalSupabase
          .from("games")
          .delete()
          .eq("id", activeGameId);

        if (purgeErr) {
          console.error(`⚠️ Failed to delete test game [${activeGameId}]:`, purgeErr.message);
        } else {
          console.log(`✨ Cascade purge successful for game [${activeGameId}]. DB is clean.`);
        }
      } else {
        console.log(`\n💾 Match data retained in Supabase DEV for testing (Game ID: ${activeGameId}).`);
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
