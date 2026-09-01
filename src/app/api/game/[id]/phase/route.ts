/**
 * Hunger Games AI — Phase Advancement & Simulation API Route Handler
 * Next.js 16 App Router POST & GET endpoints for advancing match phases and querying phase history.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { advanceGamePhase } from "@/lib/engine/orchestrator";
import {
  dbGameStateToEngine,
  enginePhaseResultToDbPayloads,
  engineTributeToDbUpdate,
  engineAllianceToDbPayload,
} from "@/lib/engine/adapters";
import { PhaseType } from "@/lib/engine/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/game/[id]/phase
 * Advances the simulation by one procedural phase and persists state atomically to Supabase.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id: gameId } = await context.params;

    if (!gameId || !UUID_REGEX.test(gameId)) {
      return NextResponse.json(
        { error: "Invalid or malformed game UUID" },
        { status: 400 }
      );
    }

    // Optional Gamemaker manual phase override in request body
    let customPhaseType: PhaseType | undefined = undefined;
    try {
      const body = await req.json();
      if (body && typeof body.customPhaseType === "string") {
        customPhaseType = body.customPhaseType as PhaseType;
      }
    } catch {
      // Body is optional
    }

    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: User must be signed in to advance game state" },
        { status: 401 }
      );
    }

    // 2. Fetch game record (enforces RLS via user_id)
    const { data: gameRow, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (gameError || !gameRow) {
      return NextResponse.json(
        { error: "Game not found or access denied" },
        { status: 404 }
      );
    }

    if (gameRow.status === "finished") {
      return NextResponse.json(
        {
          error: "Game is already finished",
          status: "finished",
          winnerId: gameRow.winner_id,
        },
        { status: 400 }
      );
    }

    // 3. Fetch tributes, active alliances, and latest recorded phase
    const [tributesRes, alliancesRes, phasesRes] = await Promise.all([
      supabase.from("tributes").select("*").eq("game_id", gameId),
      supabase.from("game_alliances").select("*").eq("game_id", gameId),
      supabase
        .from("game_phases")
        .select("*")
        .eq("game_id", gameId)
        .order("phase_order", { ascending: false })
        .limit(1),
    ]);

    if (tributesRes.error || !tributesRes.data) {
      return NextResponse.json(
        { error: "Failed to load tribute roster", details: tributesRes.error },
        { status: 500 }
      );
    }

    const tributeRows = tributesRes.data;
    const allianceRows = alliancesRes.data ?? [];
    const latestPhaseRow = phasesRes.data?.[0] ?? null;

    // 4. Reconstruct in-memory EngineGameState
    const currentGameState = dbGameStateToEngine({
      gameRow,
      tributeRows,
      allianceRows,
      latestPhaseRow,
    });

    // 5. Execute pure deterministic phase advancement
    const { phaseResult, nextGameState } = advanceGamePhase({
      gameState: currentGameState,
      customPhaseType,
    });

    // 6. Convert to database persistence payloads
    const { phaseRow, eventRows } = enginePhaseResultToDbPayloads(phaseResult);

    // 7. Persist to Supabase in order
    // A. Insert game_phases row
    const { error: phaseInsertError } = await supabase
      .from("game_phases")
      .insert(phaseRow);

    if (phaseInsertError) {
      console.error("[api/game/phase] Failed to insert phase:", phaseInsertError);
      return NextResponse.json(
        { error: "Database error persisting game phase", details: phaseInsertError },
        { status: 500 }
      );
    }

    // B. Insert game_phase_events rows
    if (eventRows.length > 0) {
      const { error: eventsInsertError } = await supabase
        .from("game_phase_events")
        .insert(eventRows);

      if (eventsInsertError) {
        console.error("[api/game/phase] Failed to insert events:", eventsInsertError);
      }
    }

    // C. Update modified tribute records
    const tributeUpdates = Array.from(phaseResult.updatedTributes.values()).map(
      (updatedTribute) =>
        supabase
          .from("tributes")
          .update(engineTributeToDbUpdate(updatedTribute))
          .eq("id", updatedTribute.id)
    );
    await Promise.all(tributeUpdates);

    // D. Upsert active/modified alliances
    const allianceUpserts = Array.from(nextGameState.alliances.values()).map(
      (alliance) =>
        supabase
          .from("game_alliances")
          .upsert(engineAllianceToDbPayload(alliance))
    );
    await Promise.all(allianceUpserts);

    // E. Update public.games state
    const isFinished = nextGameState.status === "finished";
    const gameUpdatePayload = {
      current_day: nextGameState.currentDay,
      current_phase_type: nextGameState.currentPhaseType,
      status: nextGameState.status,
      winner_id: phaseResult.winnerIds?.[0] ?? null,
      ended_at: isFinished ? new Date().toISOString() : null,
    };

    await supabase.from("games").update(gameUpdatePayload).eq("id", gameId);

    // 8. Return structured response to client
    const aliveCount = Array.from(nextGameState.tributes.values()).filter(
      (t) => t.status === "alive"
    ).length;
    const fallenCount = Array.from(nextGameState.tributes.values()).filter(
      (t) => t.status === "dead"
    ).length;

    return NextResponse.json({
      success: true,
      phase: {
        id: phaseResult.phaseId,
        gameId: phaseResult.gameId,
        dayNumber: phaseResult.dayNumber,
        phaseType: phaseResult.phaseType,
        phaseOrder: phaseResult.phaseOrder,
        fallenTributeIds: phaseResult.fallenTributeIds,
        isVictoryTriggered: phaseResult.isVictoryTriggered,
        winnerIds: phaseResult.winnerIds,
      },
      events: phaseResult.events,
      gameState: {
        currentDay: nextGameState.currentDay,
        currentPhaseType: nextGameState.currentPhaseType,
        phaseOrder: nextGameState.phaseOrder,
        status: nextGameState.status,
        winnerIds: nextGameState.winnerIds,
        aliveCount,
        fallenCount,
      },
    });
  } catch (error) {
    console.error("[api/game/phase] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Failed to advance game phase",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/game/[id]/phase
 * Fetches all chronological phases and events for game history replay.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id: gameId } = await context.params;

    if (!gameId || !UUID_REGEX.test(gameId)) {
      return NextResponse.json(
        { error: "Invalid or malformed game UUID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: User must be signed in to view game history" },
        { status: 401 }
      );
    }

    const { data: phases, error: phasesError } = await supabase
      .from("game_phases")
      .select(
        `
        id,
        game_id,
        day_number,
        phase_type,
        phase_order,
        fallen_tribute_ids,
        status,
        created_at,
        game_phase_events (
          id,
          event_order,
          event_category,
          outcome_type,
          tribute_ids,
          killer_ids,
          victim_ids,
          narrative_text,
          state_delta,
          created_at
        )
      `
      )
      .eq("game_id", gameId)
      .order("phase_order", { ascending: true });

    if (phasesError) {
      return NextResponse.json(
        { error: "Failed to fetch game phases", details: phasesError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      gameId,
      phases: phases ?? [],
    });
  } catch (error) {
    console.error("[api/game/phase] GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch game history",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
