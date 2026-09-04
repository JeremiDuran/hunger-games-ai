/**
 * Hunger Games AI — Game Details & Live Arena Roster API Route Handler
 * Next.js 16 App Router GET endpoint for loading full match, tribute roster, and alliance state.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
        { error: "Unauthorized: User session required" },
        { status: 401 }
      );
    }

    // 1. Fetch game record (enforces RLS)
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: "Game not found or access denied" },
        { status: 404 }
      );
    }

    // 2. Fetch tributes, alliances, and phases
    const [tributesRes, alliancesRes, phasesRes] = await Promise.all([
      supabase
        .from("tributes")
        .select("*")
        .eq("game_id", gameId)
        .order("district", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("game_alliances")
        .select("*")
        .eq("game_id", gameId),
      supabase
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
        .order("phase_order", { ascending: true }),
    ]);

    if (tributesRes.error) {
      return NextResponse.json(
        { error: "Failed to fetch tributes", details: tributesRes.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      game,
      tributes: tributesRes.data ?? [],
      alliances: alliancesRes.data ?? [],
      phases: phasesRes.data ?? [],
    });
  } catch (error) {
    console.error("[api/game/[id]] GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to load game details",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
