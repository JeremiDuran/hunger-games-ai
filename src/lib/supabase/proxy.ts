import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(
  request: NextRequest,
  initialResponse?: NextResponse
) {
  let response =
    initialResponse ??
    NextResponse.next({
      request,
    });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // Create new response if modifying cookies
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
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
      return NextResponse.redirect(loginUrl);
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
      return NextResponse.redirect(new URL(safeNext, request.url));
    }
  }

  // 3. Landing page root "/": route active sessions directly to their respective hubs
  if (pathnameWithoutLocale === "/") {
    if (user) {
      if (user.is_anonymous) {
        // Guest user with active session: direct to single-game arena setup
        return NextResponse.redirect(
          new URL(`${localePrefix}/setup`, request.url)
        );
      } else {
        // Permanent user: direct to Capitol lobby
        return NextResponse.redirect(
          new URL(`${localePrefix}/lobby`, request.url)
        );
      }
    }
  }

  return response;
}

