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
- Events are JSON templates stored in Supabase table `game_events`
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

---

<!-- BEGIN:nextjs-agent-rules -->


# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
