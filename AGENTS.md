# Hunger Games AI — Agent Instructions

## Project Context

This is a **Next.js 16 App Router** project (TypeScript, Tailwind CSS v4, Turbopack).

**Planned stack** (not all installed yet — check `package.json` for current state):
- **Framework**: Next.js 16 App Router
- **LLM**: Vercel AI SDK + OpenRouter (all AI calls via `src/lib/ai.ts`)
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Styling & Animation**: Tailwind CSS v4 + GSAP + Shadcn UI
- **Payments**: Stripe
- **i18n**: next-intl (locale files in `src/messages/`)

**Core architecture rules**:
- The LLM **never decides game outcomes** — only generates narrative text for pre-determined events
- Events are procedurally computed in Next.js (TypeScript) and persisted directly to `game_phase_events`
- Guest state → `sessionStorage`; Registered user state → Supabase DB
- All user-facing strings must go through next-intl, not hardcoded
- Route handlers for LLM streaming live under `src/app/api/`

**Agent tooling**:
- MCP server: `next-devtools-mcp` connects automatically when `npm run dev` is running
- Use `get_errors` and `get_compilation_issues` tools before reporting issues
- Read `node_modules/next/dist/docs/` before writing any Next.js code

## Database Environments (Dev & Prod)

This project operates with two isolated Supabase environments:

### 1. DEV Environment (Active Development)
- **Project Ref**: `nrnwjtwnqfxlzrgjpzaf`
- **Project URL**: `https://nrnwjtwnqfxlzrgjpzaf.supabase.co`
- **MCP Server**: `supabase-hunger-games-ai` (Full access: database, debugging, development, docs, functions)
- **Role**: All active development, SQL testing, schema experimentation, test seed data, and migration authoring happen here.
- **Local Config**: Local `.env.local` points to this project.

### 2. PROD Environment (Production / Live)
- **Project Ref**: `ngnsucskdnourzzafcfa`
- **Project URL**: `https://ngnsucskdnourzzafcfa.supabase.co`
- **MCP Server**: `supabase-hunger-games-ai-prod` (Strict Read-Only access: debugging, logs, advisors, docs, schema inspection)
- **Role**: Serves live production traffic.

### 3. Agent Safety & Migration Rules
- **Active development MUST use DEV (`supabase-hunger-games-ai`)**: Always execute SQL, test queries, and create tables in DEV.
- **Never attempt direct DDL or destructive operations on PROD**: PROD MCP is read-only.
- **Migrations are the single source of truth**: All database schema changes must be saved as versioned SQL files under `supabase/migrations/` and committed to git.
- **Always consult database skills**: Follow `.agents/skills/supabase/` and `.agents/skills/supabase-postgres-best-practices/` for RLS, index, and query standards.

### 4. Incremental Execution Rule (One Task at a Time)
- **Strictly one step at a time**: Focus exclusively on the immediate task at hand. Do NOT bundle unrelated tasks, over-engineer future features prematurely, or extrapolate beyond the immediate scope.
- **Verify and checkpoint**: Complete the single task, test/verify it against skills/tools, update docs, and pause for review before proceeding to the next step.

### 5. Live Database Testing & Benchmark Simulation Protocol
- **Zero Database Residue (Create -> Execute -> Cleanup)**: Every test or verification script interacting with Supabase MUST follow the strict lifecycle pattern:
  1. Create test match in `public.games` (with `status: "setup"`).
  2. Insert tributes and bootstrap starting alliances.
  3. Transition match to `status: "in_progress"` and execute simulation steps.
  4. Assert mathematical & relational database invariants.
  5. **Unconditional Cleanup (`finally`)**: Always delete the test match in a `finally` block via `await supabase.from("games").delete().eq("id", gameId)` to cascade-purge all child records.
- **Canonical Benchmark Match Roster**:
  - **Arena**: `"The Floor is Lava Caldera"` (custom volcanic arena, non-preset).
  - **Roster**: **26 Tributes across 13 Districts** (24 Canon 74th tributes + District 13 custom entries: `'Larry the Evil Cat'` [Chaotic predator] and `'Sentient Plastic Chair'` [Stoic indestructible monobloc]).
  - **Settings**: Default rules (`enableBloodbath: true`, `enableMuttations: true`, `enableDisasters: true`, `enableSponsorDrops: true`, `combatLethality: "balanced"`, `pacing: "cinematic"`).
- **Granularity Testing Behavior**:
  - `event_by_event`: Simulates opening phase, executes and streams/generates narrative for Event #1 via OpenRouter, caches to `game_phase_events.narrative_text`, and stops after Event #1.
  - `whole_day`: Simulates complete multi-phase cycle (Day 0 Bloodbath -> Day 1 -> Night 1 with Capitol Fallen Anthem broadcast), checks 15/15 invariants, and purges.
  - `autoplay` / `end_to_end`: Simulates continuously from Day 0 to final crowned Victor.

**Coding standards** (read the relevant skill before starting any UI or feature work):
- Skill files live in `.agents/skills/` — each has a `SKILL.md` with rules and examples
- `no-slop` — TypeScript quality, error handling, React/Next.js patterns (read at start of any task)
- `react-no-unnecessary-effects` — avoid redundant or misplaced `useEffect` calls (calculation-during-render, useMemo, key reset, event handlers)
- `responsive-design` — mobile-first layout, fluid type, container queries, touch targets
- `accessibility` — WCAG 2.1 AA, ARIA, keyboard nav, focus management, reduced-motion
- `web-performance` — Core Web Vitals, images, fonts, bundle size, caching, Suspense
- `i18n` — next-intl setup, message files, locale routing, pluralization, RTL
- `layered-validation` — defense-in-depth validation across Next.js (Zod, UI, transforms) & Supabase (Postgres, RLS)
- `gsap-react` / `gsap-scrolltrigger` / `gsap-timeline` — animation (read before any GSAP work)
- `shadcn` — component library usage and composition
- `code-review` / `software-testing` — audit and test standards
- `simulation-engine` — procedural engine mechanics, phase lifecycle, combat formulas, matchmaking, biometrics, and deterministic PRNG (read before any engine or simulation work)

---

<!-- BEGIN:nextjs-agent-rules -->


# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
