import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

function redirectWithCookies(
  url: URL | string,
  sourceResponse: NextResponse
): NextResponse {
  const redirectResponse = NextResponse.redirect(url);
  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export async function updateSession(
  request: NextRequest,
  initialResponse?: NextResponse
) {
  const response =
    initialResponse ??
    NextResponse.next({
      request,
    });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
        if (headers) {
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        }
      },
    },
  });

  // IMPORTANT: Calling getUser refreshes expired auth tokens
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  // Normalize pathname to ignore locale prefix for route matching
  const pathnameWithoutLocale =
    pathname.replace(/^\/(?:en|es)(?=\/|$)/, "") || "/";
  const localePrefix = pathname.startsWith("/es") ? "/es" : "";

  // 1. Permanent-Only Routes: /profile, /archives, /presets
  const isPermanentOnlyRoute =
    pathnameWithoutLocale.startsWith("/profile") ||
    pathnameWithoutLocale.startsWith("/archives") ||
    pathnameWithoutLocale.startsWith("/presets");

  if (isPermanentOnlyRoute) {
    const isPermanent = Boolean(user && !user.is_anonymous);
    if (!isPermanent) {
      const loginUrl = new URL(`${localePrefix}/login`, request.url);
      loginUrl.searchParams.set("next", pathname);
      return redirectWithCookies(loginUrl, response);
    }
  }

  // 2. If already logged in as a permanent user, visiting /login can redirect to /lobby
  if (pathnameWithoutLocale === "/login") {
    const isPermanent = Boolean(user && !user.is_anonymous);
    if (isPermanent) {
      const nextParam =
        request.nextUrl.searchParams.get("next") || `${localePrefix}/lobby`;
      const safeNext =
        nextParam.startsWith("/") && !nextParam.startsWith("//")
          ? nextParam
          : `${localePrefix}/lobby`;
      return redirectWithCookies(new URL(safeNext, request.url), response);
    }
  }

  // 3. Landing page root "/": route active sessions directly to their respective hubs
  if (pathnameWithoutLocale === "/") {
    if (user) {
      if (user.is_anonymous) {
        // Guest user can only have 1 game -> redirect to its gamehub (or /setup if no game created yet)
        let guestGameId: string | null = null;
        try {
          const { data: guestGame } = await supabase
            .from("games")
            .select("id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (guestGame?.id) {
            guestGameId = guestGame.id;
          }
        } catch {
          // Gracefully fallback to setup on query error
        }

        if (guestGameId) {
          return redirectWithCookies(
            new URL(`${localePrefix}/game/${guestGameId}/hub`, request.url),
            response
          );
        }

        return redirectWithCookies(
          new URL(`${localePrefix}/setup`, request.url),
          response
        );
      } else {
        // Permanent user: direct to Capitol lobby
        return redirectWithCookies(
          new URL(`${localePrefix}/lobby`, request.url),
          response
        );
      }
    }
  }

  return response;
}

