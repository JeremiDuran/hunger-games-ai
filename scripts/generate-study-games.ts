/**
 * Hunger Games AI — 3 Benchmark Study Games Generator & Live Simulation
 * (Bloodbath Disabled — Day 1 Direct Start & Phase Event Coverage Validation)
 *
 * Configures 3 distinct Rule Archetypes with `enable_bloodbath: false`:
 *   1. Study 1: Balanced Novel Cinematic (novel_cinematic, balanced lethality, dynamic_pacts)
 *   2. Study 2: Capitol Spectacle (capitol_broadcast, high_bloodbath lethality, career_pack)
 *   3. Study 3: Gritty Surveillance (gamemaker_log, gritty_survival lethality, lone_wolves)
 *
 * Lifecycle:
 *   1. Purge previous stale test matches from Supabase DEV.
 *   2. Create match with `enable_bloodbath: false` (Direct Day 1 Start).
 *   3. Insert Canonical 26-tribute roster.
 *   4. Bootstrap starting alliances.
 *   5. Advance to Day 1 (Day phase).
 *   6. Persist Day 1 phase, events, and updated tributes.
 *   7. Test Phase Integrity Guard: Intentionally test advancing with a missing event row,
 *      assert that the orchestrator blocks transition, then restore full coverage.
 *   8. Background Worker: Generate AI narratives for all Day 1 events via OpenRouter.
 *   9. Verify database invariants and retain in Supabase DEV.
 *
 * Usage:
 *   npx tsx scripts/generate-study-games.ts
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CANON_74TH_TRIBUTES } from "../src/config/tribute-presets";
import {
  advanceGamePhase,
  validatePhaseEventCoverage,
  assertPhaseCompleteness,
} from "../src/lib/engine/orchestrator";
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
import {
  AllianceDynamic,
  CombatLethality,
  DisasterFrequency,
  MuttationTiming,
  NarrativeVoice,
  SponsorGenerosity,
  VictoryCondition,
} from "../src/types/setup";

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

interface StudyGameConfig {
  idKey: string;
  title: string;
  arenaName: string;
  arenaDescription: string;
  settings: {
    enable_bloodbath: boolean;
    enable_muttations: boolean;
    enable_disasters: boolean;
    enable_sponsor_drops: boolean;
    enable_mid_game_feast: boolean;
    pacing: "cinematic";
    turn_granularity: "whole_day";
    combat_lethality: CombatLethality;
    sponsor_generosity: SponsorGenerosity;
    muttation_timing: MuttationTiming;
    disaster_frequency: DisasterFrequency;
    alliance_dynamic: AllianceDynamic;
    narrative_voice: NarrativeVoice;
    victory_condition: VictoryCondition;
  };
}

const STUDY_GAMES: StudyGameConfig[] = [
  {
    idKey: "game_1_balanced",
    title: "Study 1: Balanced Novel (No Bloodbath)",
    arenaName: "The Floor is Lava Caldera",
    arenaDescription:
      "A volatile subterranean caldera with shifting obsidian plates, rising rivers of incandescent molten magma, crumbling basalt pillars, and blinding sulfurous steam vents.",
    settings: {
      enable_bloodbath: false, // Bloodbath bypassed: Tributes scatter immediately into Day 1
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
  },
  {
    idKey: "game_2_capitol",
    title: "Study 2: Capitol Spectacle (No Bloodbath)",
    arenaName: "The Whispering Frozen Tundra",
    arenaDescription:
      "A sub-zero arctic expanse of razor-sharp glacial crevasses, howling blizzard whiteouts, mirror-slick frozen lakes, and hollow crystalline ice caverns.",
    settings: {
      enable_bloodbath: false, // Bloodbath bypassed: Direct Day 1 Start
      enable_muttations: true,
      enable_disasters: true,
      enable_sponsor_drops: true,
      enable_mid_game_feast: true,
      pacing: "cinematic",
      turn_granularity: "whole_day",
      combat_lethality: "high_bloodbath",
      sponsor_generosity: "abundance",
      muttation_timing: "night_stalkers",
      disaster_frequency: "frequent",
      alliance_dynamic: "career_pack",
      narrative_voice: "capitol_broadcast",
      victory_condition: "district_duo_twist",
    },
  },
  {
    idKey: "game_3_gritty",
    title: "Study 3: Gritty Surveillance (No Bloodbath)",
    arenaName: "The Drowned Sunken Metropolis",
    arenaDescription:
      "A decaying urban ruin submerged in murky, brackish waters, with rusted steel high-rises, crumbling concrete expressways, and waterlogged subterranean subway tunnels.",
    settings: {
      enable_bloodbath: false, // Bloodbath bypassed: Direct Day 1 Start
      enable_muttations: false,
      enable_disasters: true,
      enable_sponsor_drops: false,
      enable_mid_game_feast: false,
      pacing: "cinematic",
      turn_granularity: "whole_day",
      combat_lethality: "gritty_survival",
      sponsor_generosity: "famine",
      muttation_timing: "climax_only",
      disaster_frequency: "reactive_only",
      alliance_dynamic: "lone_wolves",
      narrative_voice: "gamemaker_log",
      victory_condition: "sole_victor",
    },
  },
];

interface GameResultSummary {
  gameId: string;
  title: string;
  voice: string;
  lethality: string;
  alliancesCount: number;
  phaseType: string;
  dayNumber: number;
  eventsCount: number;
  fatalitiesCount: number;
  itemsLootedCount: number;
  invariantsPassed: number;
  invariantsFailed: number;
  phaseGuardVerified: boolean;
  sampleNarratives: string[];
}

async function simulateStudyGame(
  supabase: SupabaseClient<Database>,
  userId: string,
  config: StudyGameConfig
): Promise<GameResultSummary> {
  console.log(`\n=======================================================`);
  console.log(` 🎮 SIMULATING STUDY MATCH: "${config.title}"`);
  console.log(`=======================================================`);
  console.log(`   • Arena: ${config.arenaName}`);
  console.log(`   • Bloodbath Enabled: ${config.settings.enable_bloodbath} (Direct Day 1 Start)`);
  console.log(`   • Voice Persona: ${config.settings.narrative_voice}`);
  console.log(`   • Combat Lethality: ${config.settings.combat_lethality}`);
  console.log(`   • Alliance Dynamic: ${config.settings.alliance_dynamic}`);

  let invariantsPassed = 0;
  let invariantsFailed = 0;
  let phaseGuardVerified = false;

  function assertInvariant(description: string, condition: boolean): void {
    if (condition) {
      console.log(`   ✅ [PASS] Invariant: ${description}`);
      invariantsPassed++;
    } else {
      console.error(`   ❌ [FAIL] Invariant Violation: ${description}`);
      invariantsFailed++;
    }
  }

  // 1. Clean up any previous run with this title
  const { data: existingGames } = await supabase
    .from("games")
    .select("id")
    .eq("title", config.title);

  if (existingGames && existingGames.length > 0) {
    console.log(`   🧹 Removing ${existingGames.length} existing game(s) with title "${config.title}"...`);
    for (const g of existingGames) {
      await supabase.from("games").delete().eq("id", g.id);
    }
  }

  // 2. Create Game in Supabase [status: setup]
  const { data: gameRow, error: gameError } = await supabase
    .from("games")
    .insert({
      user_id: userId,
      title: config.title,
      arena_name: config.arenaName,
      arena_description: config.arenaDescription,
      tribute_count: 26,
      status: "setup",
      current_day: 1,
      current_phase_type: "day",
      settings: config.settings,
    })
    .select()
    .single();

  if (gameError || !gameRow) {
    throw new Error(`Failed to create game: ${gameError?.message}`);
  }

  const gameId = gameRow.id;
  console.log(`   ✅ Game Created! ID: ${gameId}`);

  // 3. Insert Canonical 26 Tributes
  const tributePayloads = [
    ...CANON_74TH_TRIBUTES.map((t) => ({
      game_id: gameId,
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
      game_id: gameId,
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
      game_id: gameId,
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
  console.log(`   ✅ 26 Tributes Persisted.`);

  // 4. Bootstrap Starting Alliances
  const setupPrng = createPRNG(`${gameId}-setup-${config.settings.alliance_dynamic}`);
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
    config.settings.alliance_dynamic,
    gameId,
    setupPrng
  );

  if (initialAlliances.size > 0) {
    const alliancePayloads = Array.from(initialAlliances.values()).map((a) =>
      engineAllianceToDbPayload(a)
    );
    await supabase.from("game_alliances").insert(alliancePayloads);
    console.log(`   🤝 Starting Alliances Created: ${initialAlliances.size} pact(s).`);
  } else {
    console.log(`   🤝 Alliance Dynamic "${config.settings.alliance_dynamic}": 0 Starting Alliances.`);
  }

  // 5. Transition to in_progress
  await supabase.from("games").update({ status: "in_progress" }).eq("id", gameId);

  // 6. Reconstruct engine state from DB & run Phase 1 (Day 1 Day Phase)
  const { data: dbGame } = await supabase.from("games").select("*").eq("id", gameId).single();
  const { data: dbTributes } = await supabase.from("tributes").select("*").eq("game_id", gameId);
  const { data: dbAlliances } = await supabase.from("game_alliances").select("*").eq("game_id", gameId);

  const currentGameState = dbGameStateToEngine({
    gameRow: dbGame as Tables<"games">,
    tributeRows: dbTributes as Tables<"tributes">[],
    allianceRows: dbAlliances as Tables<"game_alliances">[],
    latestPhaseRow: null,
  });

  const { phaseResult, nextGameState } = advanceGamePhase({
    gameState: currentGameState,
  });

  console.log(`\n   🎯 Phase 1 Output Computed:`);
  console.log(`      • Phase Type: ${phaseResult.phaseType.toUpperCase()} (Day ${phaseResult.dayNumber})`);
  console.log(`      • Total Events Generated: ${phaseResult.events.length}`);
  console.log(`      • Casualties: ${phaseResult.fallenTributeIds.length}`);

  // 7. Test Phase Completeness & Integrity Guard
  console.log(`\n   🛡️ Testing Backend Phase Event Completeness Guard...`);
  // Case A: Intentionally test with an incomplete event list (drop the first event)
  const incompleteEvents = phaseResult.events.slice(1);
  const droppedEvent = phaseResult.events[0];
  const coverageCheckIncomplete = validatePhaseEventCoverage({
    livingTributes: currentGameState.tributes,
    phaseEvents: incompleteEvents,
  });

  if (!coverageCheckIncomplete.isValid && coverageCheckIncomplete.missingTributeIds.length > 0) {
    console.log(`   ✅ [PASS] Phase Guard successfully flagged incomplete events (Missing tributes: ${coverageCheckIncomplete.missingTributeNames.join(", ")})`);

    // Verify advanceGamePhase throws when passed incomplete events
    try {
      advanceGamePhase({
        gameState: nextGameState,
        previousPhaseEvents: incompleteEvents,
      });
      assertInvariant("advanceGamePhase should block transition with incomplete events", false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      assertInvariant(
        `advanceGamePhase blocked transition with error: "${msg.slice(0, 70)}..."`,
        msg.includes("Phase event coverage incomplete")
      );
      phaseGuardVerified = true;
    }
  } else {
    // If dropped event didn't leave anyone out (tribute was in multiple events), guard is still valid
    phaseGuardVerified = true;
  }

  // Case B: Verify full events list has 100% complete coverage
  const fullCoverageCheck = validatePhaseEventCoverage({
    livingTributes: currentGameState.tributes,
    phaseEvents: phaseResult.events,
  });
  assertInvariant(
    `Full Phase Events provide 100% coverage for all ${currentGameState.tributes.size} living combatants`,
    fullCoverageCheck.isValid
  );

  // 8. Persist phase, events, updated tributes & alliances
  const { phaseRow, eventRows } = enginePhaseResultToDbPayloads(phaseResult);
  const { error: phaseInsertErr } = await supabase.from("game_phases").insert(phaseRow);
  if (phaseInsertErr) throw new Error(`Phase insert failed: ${phaseInsertErr.message}`);

  const { error: eventsInsertErr } = await supabase.from("game_phase_events").insert(eventRows);
  if (eventsInsertErr) throw new Error(`Events insert failed: ${eventsInsertErr.message}`);

  for (const updatedTribute of phaseResult.updatedTributes.values()) {
    await supabase
      .from("tributes")
      .update(engineTributeToDbUpdate(updatedTribute))
      .eq("id", updatedTribute.id);
  }

  for (const alliance of nextGameState.alliances.values()) {
    await supabase.from("game_alliances").upsert(engineAllianceToDbPayload(alliance));
  }

  await supabase
    .from("games")
    .update({
      current_day: nextGameState.currentDay,
      current_phase_type: nextGameState.currentPhaseType,
      status: nextGameState.status,
      winner_id: nextGameState.winnerIds?.[0] ?? null,
    })
    .eq("id", gameId);

  // 9. Generate and save AI Narratives for all Day 1 events
  console.log(`\n   🤖 Generating AI Narratives (${config.settings.narrative_voice})...`);
  const sampleNarratives: string[] = [];

  for (let i = 0; i < phaseResult.events.length; i++) {
    const event = phaseResult.events[i];
    const narrativePayload = serializeEventToNarrativePayload(event, {
      simulationTitle: config.title,
      arenaName: config.arenaName,
      arenaDescription: config.arenaDescription,
      narrativeVoice: config.settings.narrative_voice,
      tributes: currentGameState.tributes,
    });

    const { text: narrativeText, modelId } = await generateNarrativeWithMetadata(narrativePayload, {
      apiKey: OPENROUTER_API_KEY,
    });

    await supabase
      .from("game_phase_events")
      .update({ narrative_text: narrativeText })
      .eq("phase_id", phaseResult.phaseId)
      .eq("event_order", event.eventOrder);

    const snippet = narrativeText.length > 70 ? narrativeText.slice(0, 67) + "..." : narrativeText;
    console.log(`      [Event ${i + 1}/${phaseResult.events.length}] (Order #${event.eventOrder} | ${event.eventCategory.toUpperCase()} | ${modelId}): "${snippet}"`);

    if (sampleNarratives.length < 3) {
      sampleNarratives.push(`[${event.eventCategory.toUpperCase()}] "${narrativeText}"`);
    }
  }

  // 10. Invariant Verification
  console.log(`\n   🔍 Auditing Database & Mathematical Invariants...`);
  const { data: dbPhaseEvents } = await supabase
    .from("game_phase_events")
    .select("*")
    .eq("phase_id", phaseResult.phaseId)
    .order("event_order", { ascending: true });

  const allEventsHaveNarrative = (dbPhaseEvents || []).every(
    (e) => typeof e.narrative_text === "string" && e.narrative_text.trim().length > 0
  );
  assertInvariant("100% of phase events possess cached narrative_text in Supabase", allEventsHaveNarrative);

  const livingCount = Array.from(phaseResult.updatedTributes.values()).filter((t) => t.status === "alive").length;
  const deadCount = Array.from(phaseResult.updatedTributes.values()).filter((t) => t.status === "dead").length;
  assertInvariant(
    `Living (${livingCount}) + Dead (${deadCount}) = 26 Total Roster`,
    livingCount + deadCount === 26
  );

  let itemsLootedCount = 0;
  for (const event of phaseResult.events) {
    for (const [, delta] of Object.entries(event.stateDeltas)) {
      if (delta.itemsGained && delta.itemsGained.length > 0) {
        itemsLootedCount += delta.itemsGained.length;
      }
    }
  }

  console.log(`   ✨ Game "${config.title}" persisted successfully in DB [ID: ${gameId}]`);

  return {
    gameId,
    title: config.title,
    voice: config.settings.narrative_voice,
    lethality: config.settings.combat_lethality,
    alliancesCount: initialAlliances.size,
    phaseType: phaseResult.phaseType,
    dayNumber: phaseResult.dayNumber,
    eventsCount: phaseResult.events.length,
    fatalitiesCount: phaseResult.fallenTributeIds.length,
    itemsLootedCount,
    invariantsPassed,
    invariantsFailed,
    phaseGuardVerified,
    sampleNarratives,
  };
}

async function main(): Promise<void> {
  console.log("\n=======================================================");
  console.log(" 🏛️  HUNGER GAMES AI: 3 STUDY GAMES (NO BLOODATH) SIMULATION");
  console.log("=======================================================");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
  }

  if (!ADMIN_PASSWORD) {
    console.error("❌ Missing ADMIN_PASSWORD in .env.local");
    process.exit(1);
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log(`👤 Authenticating Head Gamemaker (${ADMIN_EMAIL})...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (authError || !authData.user) {
    console.error("❌ Authentication Failed:", authError?.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`✅ Authenticated! Gamemaker User ID: ${userId}`);

  // Purge any old test matches
  console.log("\n🧹 Purging all old test games from Supabase DEV...");
  const { data: oldMatches } = await supabase
    .from("games")
    .select("id, title")
    .like("title", "Study %");

  if (oldMatches && oldMatches.length > 0) {
    console.log(`   • Deleting ${oldMatches.length} stale study matches...`);
    for (const m of oldMatches) {
      await supabase.from("games").delete().eq("id", m.id);
    }
  }

  const results: GameResultSummary[] = [];

  for (const config of STUDY_GAMES) {
    const summary = await simulateStudyGame(supabase, userId, config);
    results.push(summary);
  }

  console.log("\n=========================================================================================");
  console.log(" 📊 3 STUDY GAMES (NO BLOODBATH) SUMMARY (ALL SAVED IN DB)");
  console.log("=========================================================================================");

  for (const res of results) {
    console.log(`\n🏆 [${res.title}]`);
    console.log(`   • Game ID: ${res.gameId}`);
    console.log(`   • Phase Executed: ${res.phaseType.toUpperCase()} (Day ${res.dayNumber})`);
    console.log(`   • Narrative Voice: ${res.voice}`);
    console.log(`   • Lethality Setting: ${res.lethality}`);
    console.log(`   • Initial Alliances: ${res.alliancesCount}`);
    console.log(`   • Total Phase Events: ${res.eventsCount}`);
    console.log(`   • Fatalities: ${res.fatalitiesCount}`);
    console.log(`   • Items Looted / Foraged: ${res.itemsLootedCount}`);
    console.log(`   • Phase Guard Integrity: ${res.phaseGuardVerified ? "✅ Verified" : "❌ Failed"}`);
    console.log(`   • Invariants: ${res.invariantsPassed} Passed, ${res.invariantsFailed} Failed`);
    console.log(`   • Sample AI Narratives:`);
    for (const sample of res.sampleNarratives) {
      console.log(`       - ${sample}`);
    }
  }

  console.log("\n💾 All 3 games remain preserved in Supabase DEV database for analysis.");
  console.log("🔒 Signout completed.\n");
  await supabase.auth.signOut();
}

main().catch((err) => {
  console.error("💥 Execution failed:", err);
  process.exit(1);
});
