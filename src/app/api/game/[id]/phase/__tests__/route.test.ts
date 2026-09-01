import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "../route";
import { NextRequest } from "next/server";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => {
  return {
    createClient: vi.fn(),
  };
});

import { createClient } from "@/lib/supabase/server";

type MockSupabaseClient = Awaited<ReturnType<typeof createClient>>;

describe("Route Handler: /api/game/[id]/phase", () => {
  const mockGameId = "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when game ID is not a valid UUID", async () => {
    const req = new NextRequest("http://localhost:3000/api/game/invalid-uuid/phase", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "invalid-uuid" }) });
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("Invalid or malformed game UUID");
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValueOnce({ data: { user: null }, error: { message: "No session" } }),
      },
    } as unknown as MockSupabaseClient);

    const req = new NextRequest(`http://localhost:3000/api/game/${mockGameId}/phase`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: mockGameId }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when game does not exist in DB", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValueOnce({ data: null, error: { message: "Not found" } }),
          }),
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as unknown as MockSupabaseClient);

    const req = new NextRequest(`http://localhost:3000/api/game/${mockGameId}/phase`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: mockGameId }) });
    expect(res.status).toBe(404);
  });

  it("returns 400 when game is already finished", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValueOnce({
              data: {
                id: mockGameId,
                status: "finished",
                winner_id: "tribute-1",
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as unknown as MockSupabaseClient);

    const req = new NextRequest(`http://localhost:3000/api/game/${mockGameId}/phase`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: mockGameId }) });
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("Game is already finished");
  });

  it("successfully advances phase, persists to database, and returns 200", async () => {
    const mockGameRow = {
      id: mockGameId,
      user_id: "user-1",
      title: "The 74th Hunger Games",
      arena_name: "Verdant Tropics",
      arena_description: "Dense rainforest.",
      status: "in_progress",
      current_day: 0,
      current_phase_type: "bloodbath",
      tribute_count: 2,
      winner_id: null,
      settings: {
        enable_bloodbath: true,
        combat_lethality: "balanced",
      },
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-09-01T00:00:00Z",
      ended_at: null,
    };

    const mockTributeRows = [
      {
        id: "a1111111-1111-4111-8111-111111111111",
        game_id: mockGameId,
        name: "Katniss",
        district: 12,
        gender: "female",
        personality: "Archer",
        physical_aspect: "Lean",
        avatar_url: null,
        status: "alive",
        kill_count: 0,
        stats: { survival: 50, sanity: 50 },
        inventory: [],
        death_phase_id: null,
        placement: null,
        created_at: "2026-09-01T00:00:00Z",
      },
      {
        id: "b2222222-2222-4222-8222-222222222222",
        game_id: mockGameId,
        name: "Peeta",
        district: 12,
        gender: "male",
        personality: "Baker",
        physical_aspect: "Sturdy",
        avatar_url: null,
        status: "alive",
        kill_count: 0,
        stats: { survival: 50, sanity: 50 },
        inventory: [],
        death_phase_id: null,
        placement: null,
        created_at: "2026-09-01T00:00:00Z",
      },
    ];

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === "games") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockGameRow, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "tributes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockTributeRows, error: null }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "game_alliances") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "game_phases") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "game_phase_events") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as MockSupabaseClient);

    const req = new NextRequest(`http://localhost:3000/api/game/${mockGameId}/phase`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: mockGameId }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.phase).toBeDefined();
    expect(data.phase.dayNumber).toBe(0);
    expect(data.phase.phaseType).toBe("bloodbath");
    expect(data.gameState).toBeDefined();
  });

  it("GET endpoint returns chronological phases and events", async () => {
    const mockPhases = [
      {
        id: "p-1",
        game_id: mockGameId,
        day_number: 0,
        phase_type: "bloodbath",
        phase_order: 1,
        fallen_tribute_ids: [],
        status: "completed",
        created_at: "2026-09-01T00:00:00Z",
        game_phase_events: [],
      },
    ];

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPhases, error: null }),
          }),
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as MockSupabaseClient);

    const req = new NextRequest(`http://localhost:3000/api/game/${mockGameId}/phase`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: mockGameId }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.phases).toHaveLength(1);
  });
});
