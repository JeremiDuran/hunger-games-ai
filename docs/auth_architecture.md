# Hunger Games AI — Authentication & Session Architecture

> **Document Status**: Technical Implementation Spec
> **Last Updated**: 2026-08-26
> **Related Documents**: [`routes_and_ux_flow.md`](file:///c:/jj_projects/hg-ai/docs/routes_and_ux_flow.md)

This document outlines the technical implementation strategy for the dual-tier (Guest vs. Registered) authentication system using Supabase Auth, Next.js 16 App Router, and `@supabase/ssr`.

---

## 1. Architecture Overview

The system supports two parallel user states that share the exact same database foreign keys, seamlessly allowing guests to transition to registered members without losing their game progress.

*   **Guest Tier (Anonymous Auth)**: Uses Supabase `signInAnonymously()`. Generates a legitimate Postgres `auth.users` record with an `is_anonymous: true` flag. Guests get a real `UUID` and a JWT session, allowing them to interact securely with the database via Row Level Security (RLS).
*   **Registered Tier (Permanent Auth)**: Uses standard Email/Password (and later Google OAuth) via PKCE flow. Permanent users have `is_anonymous: false` and gain access to advanced features like `/archives` and saved presets.

### The "Progress Preservation" Flow (Identity Linking)
When a Guest decides to register, the system uses Supabase's Identity Linking (`updateUser()`) to attach an Email/Password credential directly to their existing anonymous `UUID`. No data migration script is needed; their foreign keys (`games.user_id`) remain perfectly intact.

---

## 2. Next.js 16 SSR & Session Management

We will use the `@supabase/ssr` package to manage sessions securely using cookies across both Server Components and Client Components.

### A. The PKCE Flow
Because Next.js SSR requires the server to read tokens, we must use the **PKCE (Proof Key for Code Exchange)** flow. 
1. Client initiates sign-in/sign-up.
2. Supabase redirects to our `/auth/callback` route with an auth code.
3. Our Route Handler (`/api/auth/callback/route.ts`) exchanges the code for an Access Token and Refresh Token, writing them to secure `HttpOnly` cookies via `@supabase/ssr`'s `setAll` configuration.

### B. Security & Validation (`getUser` vs `getSession`)
*   **Client-Side**: `createBrowserClient()` handles token caching and automatic background refreshes.
*   **Server-Side / API Routes**: We must **always use `supabase.auth.getUser()`** rather than `getSession()` before authorizing sensitive actions. `getSession()` only validates the JWT signature locally, while `getUser()` calls the Supabase API to ensure the token is not revoked and the user is genuinely active.

### C. Caching Gotchas (Critical)
To prevent CDN session leakage (e.g., serving User A's session to User B), any route reading or modifying auth state must opt out of static caching:
```typescript
// Enforce dynamic rendering in Next.js Server Components and Route Handlers handling Auth
export const dynamic = 'force-dynamic'
```

---

## 3. Proxy & Route Protection

The Next.js Proxy (`src/proxy.ts`, formerly `middleware.ts` prior to Next.js 16) has two responsibilities:
1.  **Session Refresh**: It initializes a Supabase Server Client (`src/lib/supabase/proxy.ts`) and calls `getUser()`. If the refresh token is nearing expiration, `@supabase/ssr` automatically refreshes the session and attaches the new tokens to both the incoming request headers (for downstream Server Components) and the outgoing response cookies (for the browser).
2.  **Route Protection**: It enforces access control based on the JWT claims.

### Route Protection Matrix

| Route Level | Paths | Proxy Logic |
| :--- | :--- | :--- |
| **Public** | `/`, `/login`, `/auth/callback` | Accessible to all. (If already logged in as a permanent user, `/login` redirects to `/lobby`). |
| **Guest/Active** | `/lobby`, `/setup`, `/game/[id]` | Requires **any** valid session (Anonymous or Permanent). If no session exists when hitting `/setup` or `/lobby`, the client silently initiates `signInAnonymously()`. |
| **Protected** | `/archives`, `/profile` | Requires a Permanent session. Proxy checks if `user.is_anonymous === true`. If true, redirects to `/login` with a `?next=/archives` parameter. |

---

## 4. Database Schema & RLS Implementation

The database must differentiate between Anonymous and Permanent users directly in Postgres.

### Identifying Anonymous Users in SQL
Anonymous users carry the standard `authenticated` Postgres role. We differentiate them by extracting the `is_anonymous` claim from the JWT inside our RLS policies:
```sql
(select (auth.jwt()->>'is_anonymous')::boolean)
```

### RLS Policy Examples
```sql
-- 1. Games Table: Guests & Members can fully manage their OWN active games.
CREATE POLICY "Users can manage their own games" ON public.games
FOR ALL TO authenticated
USING ( user_id = (select auth.uid()) )
WITH CHECK ( user_id = (select auth.uid()) );

-- 2. Archives Table: ONLY Permanent Members can insert/view archives.
CREATE POLICY "Only permanent users manage archives" ON public.archives
FOR ALL TO authenticated
USING ( 
  user_id = (select auth.uid()) AND 
  COALESCE((select (auth.jwt()->>'is_anonymous')::boolean), false) IS FALSE 
);
```

### Profile Triggers
Our `public.profiles` table trigger `on_auth_user_created` will create an empty/default profile for anonymous users. When an anonymous user links an email, we update their profile row with the new metadata.

---

## 5. Account Upgrade Flow (Conflict Resolution)

When an Anonymous user explicitly registers via the `/login` page or an inline `<AuthDialog />`, we must handle the **Identity Collision Edge Case**:

1. **Attempt Link**: The app calls `supabase.auth.updateUser({ email, password })`.
2. **Success**: The user is now permanent. Their UUID remains the same. The UI updates.
3. **Conflict (Email exists)**: If the email belongs to an existing user, `updateUser` returns an error. We must then handle the collision:
    *   Prompt the user: *"An account with this email already exists. Sign in to merge or switch?"*
    *   If they sign in to the existing account, we perform a manual reassignment script via a secured Edge Function or RPC: `UPDATE games SET user_id = [ExistingUserUUID] WHERE user_id = [AnonymousUserUUID]`.
    *   (MVP Phase: Simply inform the user the email is taken, prompt them to sign out of the guest account, and sign into their real account, abandoning the guest game).

---

## 6. Current Implementation Scope (Email/Password)

**Step 1: Auth Utilities (`src/lib/supabase/`)**
*   `server.ts` (Next.js server client wrapper)
*   `client.ts` (Next.js browser client wrapper)
*   `proxy.ts` (Session refresh wrapper)

**Step 2: Sign-Up / Sign-In Forms**
*   Email/Password registration.
*   Magic Link fallback (optional, but highly recommended for frictionless conversion).
*   Callback Route `GET /api/auth/callback` to securely exchange the `code`.

**Step 3: Anonymous Initialization**
*   A React Provider or hook at the `layout.tsx` level (or upon entering `/lobby`) that checks for a session, and if `null`, instantly calls `supabase.auth.signInAnonymously()`.

---

## 7. Future Work: Google OAuth

Once the Email/Password and Anonymous core is stable, Google OAuth requires:
1.  Enabling the Google Provider in the Supabase Dashboard.
2.  Using `supabase.auth.linkIdentity({ provider: 'google' })` for logged-in guests to upgrade.
3.  Using `supabase.auth.signInWithOAuth({ provider: 'google' })` for standard login.
4.  Ensuring the `redirectTo` points to our existing PKCE `/auth/callback` handler, so the cookies are set exactly the same way as Email flows.
