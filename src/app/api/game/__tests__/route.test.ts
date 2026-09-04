import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => {
  return {
    createClient: vi.fn(),
  };
});

// Mock AI module
vi.mock("@/lib/ai", () => {
  return {
    generateCornucopiaDescription: vi.fn().mockResolvedValue("A glittering golden horn surrounded by pedestals."),
  };
});

import { createClient } from "@/lib/supabase/server";

type MockSupabaseClient = Awaited<ReturnType<typeof createClient>>;

describe("POST /api/game", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValueOnce({ data: { user: null }, error: { message: "Unauthorized" } }),
      },
    } as unknown as MockSupabaseClient);

    const req = new NextRequest("http://localhost:3000/api/game", {
      method: "POST",
      body: JSON.stringify({ game: {}, tributes: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when request payload is missing game or tributes", async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null }),
      },
    } as unknown as MockSupabaseClient);

    const req = new NextRequest("http://localhost:3000/api/game", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("successfully creates game, persists Phase 0, and returns gameId", async () => {
    const mockGameId = "11111111-2222-3333-4444-555555555555";
    const mockTributes = [
      {
        id: "tribute-1",
        game_id: mockGameId,
        name: "Katniss Everdeen",
        district: 12,
        gender: "female",
        personality: "Resourceful survivor",
        physical_aspect: "Braided hair",
        avatar_url: null,
        status: "alive",
        kill_count: 0,
        stats: { survival: 50, sanity: 50, physical_tag: "unscathed", mental_tag: "composed" },
        inventory: [],
      },
      {
        id: "tribute-2",
        game_id: mockGameId,
        name: "Peeta Mellark",
        district: 12,
        gender: "male",
        personality: "Charismatic baker",
        physical_aspect: "Broad shoulders",
        avatar_url: null,
        status: "alive",
        kill_count: 0,
        stats: { survival: 50, sanity: 50, physical_tag: "unscathed", mental_tag: "composed" },
        inventory: [],
      },
    ];

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === "games") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValueOnce({
                  data: {
                    id: mockGameId,
                    user_id: "user-123",
                    title: "The 74th Hunger Games",
                    arena_name: "Verdant Woodlands",
                    arena_description: "Dense forest",
                    tribute_count: 2,
                    current_day: 0,
                    current_phase_type: "bloodbath",
                    status: "in_progress",
                    settings: { enable_bloodbath: true, alliance_dynamic: "dynamic_pacts" },
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "tributes") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValueOnce({
                data: mockTributes,
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "game_alliances") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValueOnce({
                data: [],
                error: null,
              }),
            }),
          };
        }
        if (table === "game_phases" || table === "game_phase_events") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {
          insert: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [], error: null }) }),
        };
      }),
    };

    vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as unknown as MockSupabaseClient);

    const req = new NextRequest("http://localhost:3000/api/game", {
      method: "POST",
      body: JSON.stringify({
        game: {
          title: "The 74th Hunger Games",
          arena_name: "Verdant Woodlands",
          arena_description: "Dense forest",
          settings: {
            enable_bloodbath: true,
            alliance_dynamic: "dynamic_pacts",
          },
        },
        tributes: mockTributes,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.gameId).toBe(mockGameId);
    expect(data.phaseId).toBeDefined();
    expect(data.eventsCount).toBeGreaterThanOrEqual(1);
  });
});
