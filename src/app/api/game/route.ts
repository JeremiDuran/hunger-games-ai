/**
 * Hunger Games AI — Game Creation & Match Initialization API Route Handler
 * Next.js 16 App Router POST endpoint for creating new matches from setup configuration.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCornucopiaDescription } from "@/lib/ai";
import { bootstrapInitialAlliances } from "@/lib/engine/alliances";
import { createPRNG } from "@/lib/engine/prng";
import { advanceGamePhase } from "@/lib/engine/orchestrator";
import {
  dbGameStateToEngine,
  dbTributeToEngine,
  enginePhaseResultToDbPayloads,
  engineTributeToDbUpdate,
  engineAllianceToDbPayload,
} from "@/lib/engine/adapters";
import { TablesInsert } from "@/types/database";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: User session required to initialize game" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { game: gamePayload, tributes: tributesPayload } = body;

    if (!gamePayload || !tributesPayload || !Array.isArray(tributesPayload)) {
      return NextResponse.json(
        { error: "Invalid request payload: missing game or tributes configuration" },
        { status: 400 }
      );
    }

    // 1. Generate Cornucopia description if Bloodbath is enabled
    const settings = { ...(gamePayload.settings || {}) };
    if (settings.enable_bloodbath) {
      const cornucopiaDesc = await generateCornucopiaDescription({
        arenaName: gamePayload.arena_name || "The Arena",
        arenaDescription: gamePayload.arena_description || "",
        narrativeVoice: settings.narrative_voice || "novel_cinematic",
      });
      settings.cornucopia_description = cornucopiaDesc;
    }

    // 2. Insert into public.games with status "setup" (required by database immutability trigger)
    const { data: gameRow, error: gameError } = await supabase
      .from("games")
      .insert({
        user_id: user.id,
        title: gamePayload.title || "The 74th Annual Hunger Games",
        arena_name: gamePayload.arena_name || "The Arena",
        arena_description: gamePayload.arena_description || "",
        tribute_count: tributesPayload.length,
        settings,
        current_day: 0,
        current_phase_type: settings.enable_bloodbath ? "bloodbath" : "day",
        status: "setup",
      })
      .select()
      .single();

    if (gameError || !gameRow) {
      console.error("[api/game] Failed to insert game:", gameError);
      return NextResponse.json(
        { error: "Failed to create game in database", details: gameError?.message || "Unknown game insertion error" },
        { status: 500 }
      );
    }

    const gameId = gameRow.id;

    // 3. Insert into public.tributes while game status is "setup"
    const tributeRowsToInsert: TablesInsert<"tributes">[] = tributesPayload.map((t: any) => ({
      game_id: gameId,
      name: t.name,
      district: t.district,
      gender: t.gender,
      personality: t.personality || "",
      physical_aspect: t.physical_aspect || t.physicalAspect || "",
      avatar_url: t.avatar_url || t.avatarUrl || null,
      status: "alive",
      kill_count: 0,
      stats: t.stats || { survival: 50, sanity: 50, physical_tag: "unscathed", mental_tag: "composed" },
      inventory: t.inventory || [],
    }));

    const { data: insertedTributes, error: tributesError } = await supabase
      .from("tributes")
      .insert(tributeRowsToInsert)
      .select();

    if (tributesError || !insertedTributes) {
      console.error("[api/game] Failed to insert tributes:", JSON.stringify(tributesError, null, 2));
      return NextResponse.json(
        {
          error: "Failed to insert tributes",
          details: tributesError?.message || JSON.stringify(tributesError),
        },
        { status: 500 }
      );
    }

    // 4. Bootstrap starting alliances if configured
    let insertedAlliances: any[] = [];
    if (settings.alliance_dynamic !== "lone_wolves") {
      let seed = 42;
      for (let i = 0; i < gameId.length; i++) {
        seed = (seed * 31 + gameId.charCodeAt(i)) & 0x7fffffff;
      }
      const prng = createPRNG(seed);
      const engineTributes = insertedTributes.map(dbTributeToEngine);

      const initialAlliances = bootstrapInitialAlliances(
        engineTributes,
        settings.alliance_dynamic || "dynamic_pacts",
        gameId,
        prng
      );

      if (initialAlliances.size > 0) {
        const alliancePayloads = Array.from(initialAlliances.values()).map(engineAllianceToDbPayload);
        const { data: alliancesData } = await supabase
          .from("game_alliances")
          .insert(alliancePayloads)
          .select();
        insertedAlliances = alliancesData ?? [];
      }
    }

    // 5. Transition game status to "in_progress" now that roster and alliances are committed
    await supabase
      .from("games")
      .update({ status: "in_progress" })
      .eq("id", gameId);

    // 6. Procedural Engine Groundwork: advance Phase 0 (Bloodbath or Day 1)
    const initialEngineState = dbGameStateToEngine({
      gameRow: { ...gameRow, status: "in_progress" },
      tributeRows: insertedTributes,
      allianceRows: insertedAlliances,
      latestPhaseRow: null,
      hasFeastOccurred: false,
    });

    if (settings.cornucopia_description) {
      initialEngineState.cornucopiaDescription = settings.cornucopia_description;
    }

    const { phaseResult, nextGameState } = advanceGamePhase({
      gameState: initialEngineState,
    });

    const { phaseRow, eventRows } = enginePhaseResultToDbPayloads(phaseResult);

    const { error: phaseInsertError } = await supabase
      .from("game_phases")
      .insert(phaseRow);

    if (phaseInsertError) {
      console.error("[api/game] Failed to insert initial phase:", phaseInsertError);
    }

    if (eventRows.length > 0) {
      const { error: eventsInsertError } = await supabase
        .from("game_phase_events")
        .insert(eventRows);

      if (eventsInsertError) {
        console.error("[api/game] Failed to insert initial phase events:", eventsInsertError);
      }
    }

    // Update modified tributes from phaseResult
    const tributeUpdates = Array.from(phaseResult.updatedTributes.values()).map(
      (updatedTribute) =>
        supabase
          .from("tributes")
          .update(engineTributeToDbUpdate(updatedTribute))
          .eq("id", updatedTribute.id)
    );
    await Promise.all(tributeUpdates);

    // Update games state
    await supabase
      .from("games")
      .update({
        current_day: nextGameState.currentDay,
        current_phase_type: nextGameState.currentPhaseType,
        status: nextGameState.status,
        winner_id: phaseResult.winnerIds?.[0] ?? null,
      })
      .eq("id", gameId);

    return NextResponse.json({
      success: true,
      gameId,
      phaseId: phaseResult.phaseId,
      eventsCount: eventRows.length,
    });
  } catch (error) {
    console.error("[api/game] Unexpected error initializing game:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize game",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
