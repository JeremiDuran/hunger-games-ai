# Hunger Games AI — Agent Instructions

## Project Context

This is a **Next.js 16 App Router** project (TypeScript, Tailwind CSS v4, Turbopack).

**Planned stack** (not all installed yet — check `package.json` for current state):
- **Framework**: Next.js 16 App Router
- **LLM**: Vercel AI SDK + OpenRouter (all AI calls via `src/lib/ai.ts`)
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS v4 + Framer Motion + Shadcn UI
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

---

<!-- BEGIN:nextjs-agent-rules -->


# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
