import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
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
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Calling getUser refreshes expired auth tokens
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Permanent-Only Routes: /profile, /archives, /presets
  const isPermanentOnlyRoute =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/archives") ||
    pathname.startsWith("/presets");

  if (isPermanentOnlyRoute) {
    const isPermanent = Boolean(user && !user.is_anonymous);
    if (!isPermanent) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. If already logged in as a permanent user, visiting /login can redirect to /lobby
  if (pathname === "/login") {
    const isPermanent = Boolean(user && !user.is_anonymous);
    if (isPermanent) {
      const nextParam = request.nextUrl.searchParams.get("next") || "/lobby";
      const safeNext = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/lobby";
      return NextResponse.redirect(new URL(safeNext, request.url));
    }
  }

  return supabaseResponse;
}
