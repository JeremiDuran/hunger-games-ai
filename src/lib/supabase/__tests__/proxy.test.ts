import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock @supabase/ssr
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "@supabase/ssr";
import { updateSession } from "../proxy";

describe("updateSession proxy redirects", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://mock.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "mock-anon-key",
    };
  });

  function setupMockSupabase({
    user = null,
    guestGame = null,
    gameQueryError = null,
  }: {
    user?: { id: string; is_anonymous?: boolean } | null;
    guestGame?: { id: string } | null;
    gameQueryError?: Error | null;
  }) {
    const mockMaybeSingle = vi.fn().mockImplementation(() => {
      if (gameQueryError) {
        return Promise.reject(gameQueryError);
      }
      return Promise.resolve({ data: guestGame, error: null });
    });

    const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      },
      from: mockFrom,
    };

    vi.mocked(createServerClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof createServerClient>
    );
    return { mockClient, mockFrom, mockEq };
  }

  it("returns 200 response when visitor is unauthenticated at '/'", async () => {
    setupMockSupabase({ user: null });

    const request = new NextRequest("http://localhost:3000/");
    const initialResponse = NextResponse.next();

    const result = await updateSession(request, initialResponse);
    expect(result.status).toBe(200);
    expect(result.headers.get("location")).toBeNull();
  });

  it("redirects permanent user to '/lobby' when entering the page at '/'", async () => {
    setupMockSupabase({
      user: { id: "user-perm-1", is_anonymous: false },
    });

    const request = new NextRequest("http://localhost:3000/");
    const initialResponse = NextResponse.next();

    const result = await updateSession(request, initialResponse);
    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("http://localhost:3000/lobby");
  });

  it("redirects permanent user to '/es/lobby' when entering the page at '/es'", async () => {
    setupMockSupabase({
      user: { id: "user-perm-1", is_anonymous: false },
    });

    const request = new NextRequest("http://localhost:3000/es");
    const initialResponse = NextResponse.next();

    const result = await updateSession(request, initialResponse);
    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("http://localhost:3000/es/lobby");
  });

  it("redirects guest user to their gamehub '/game/[id]/hub' when entering the page and they have a game", async () => {
    const { mockFrom, mockEq } = setupMockSupabase({
      user: { id: "guest-user-1", is_anonymous: true },
      guestGame: { id: "game-uuid-12345" },
    });

    const request = new NextRequest("http://localhost:3000/");
    const initialResponse = NextResponse.next();

    const result = await updateSession(request, initialResponse);

    expect(mockFrom).toHaveBeenCalledWith("games");
    expect(mockEq).toHaveBeenCalledWith("user_id", "guest-user-1");
    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("http://localhost:3000/game/game-uuid-12345/hub");
  });

  it("redirects guest user with locale prefix to '/es/game/[id]/hub' when entering '/es'", async () => {
    setupMockSupabase({
      user: { id: "guest-user-1", is_anonymous: true },
      guestGame: { id: "game-uuid-es-789" },
    });

    const request = new NextRequest("http://localhost:3000/es");
    const initialResponse = NextResponse.next();

    const result = await updateSession(request, initialResponse);
    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("http://localhost:3000/es/game/game-uuid-es-789/hub");
  });

  it("redirects guest user to '/setup' when entering the page and they have NO game yet", async () => {
    setupMockSupabase({
      user: { id: "guest-user-no-game", is_anonymous: true },
      guestGame: null,
    });

    const request = new NextRequest("http://localhost:3000/");
    const initialResponse = NextResponse.next();

    const result = await updateSession(request, initialResponse);
    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("http://localhost:3000/setup");
  });

  it("gracefully falls back to '/setup' if database query throws error for guest user", async () => {
    setupMockSupabase({
      user: { id: "guest-user-err", is_anonymous: true },
      gameQueryError: new Error("DB connection timeout"),
    });

    const request = new NextRequest("http://localhost:3000/");
    const initialResponse = NextResponse.next();

    const result = await updateSession(request, initialResponse);
    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("http://localhost:3000/setup");
  });

  it("redirects anonymous or unauthenticated users to '/login' when accessing permanent-only routes", async () => {
    setupMockSupabase({
      user: { id: "guest-user-1", is_anonymous: true },
    });

    const request = new NextRequest("http://localhost:3000/profile");
    const initialResponse = NextResponse.next();

    const result = await updateSession(request, initialResponse);
    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fprofile");
  });

  it("redirects permanent users away from '/login' to '/lobby'", async () => {
    setupMockSupabase({
      user: { id: "user-perm-1", is_anonymous: false },
    });

    const request = new NextRequest("http://localhost:3000/login");
    const initialResponse = NextResponse.next();

    const result = await updateSession(request, initialResponse);
    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("http://localhost:3000/lobby");
  });
});
