# Next.js — Framework Setup Reference

> **Project**: Hunger Games AI (`hg-ai`)
> **Framework Version**: Next.js 16.3.2 (App Router)
> **Last Updated**: 2026-08-24

---

## Why Next.js

Next.js is the full-stack React framework powering this project. It was chosen because:

- **App Router** enables server-first rendering with React Server Components — critical for streaming LLM narrative text efficiently via `Suspense` boundaries
- **Route Handlers** (`src/app/api/`) act as a secure server-side proxy for OpenRouter API calls, keeping API keys off the client
- **Vercel deployment** is first-class — zero-config edge hosting, streaming support, and Stripe webhook endpoints just work
- **Turbopack** (bundler) gives fast local HMR with Tailwind v4 support built in
- **Built-in AI agent tooling** via `next-devtools-mcp` — agents get live compilation errors, route info, and server logs without a full build

---

## Installation

Bootstrapped via `create-next-app@latest` with the following flags:

```bash
npx create-next-app@latest ./ \
  --typescript \
  --app \
  --src-dir \
  --eslint \
  --tailwind \
  --agents-md \
  --use-npm \
  --yes
```

**Key choices:**
| Option | Value | Why |
|---|---|---|
| Router | App Router | Server components, streaming, layouts |
| Language | TypeScript | Type safety across DB schemas, API, components |
| Styling | Tailwind CSS v4 | Ships with Next.js default; Framer Motion + Shadcn added later |
| Bundler | Turbopack | Faster dev HMR; configured in `next.config.ts` |
| Source dir | `src/` | Cleaner separation from config files |

---

## Project Structure

```
hg-ai/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (fonts, providers)
│   │   ├── page.tsx              # Landing / lobby page
│   │   ├── game/                 # Game simulation routes
│   │   │   └── [id]/page.tsx
│   │   └── api/
│   │       ├── narrative/        # POST -> streams LLM narrative text
│   │       └── webhooks/         # Stripe event handlers
│   ├── components/               # UI components (Shadcn + custom)
│   ├── lib/
│   │   ├── ai.ts                 # OpenRouter client (Vercel AI SDK)
│   │   ├── supabase/             # Browser + server Supabase clients
│   │   └── stripe.ts             # Stripe server client
│   └── messages/                 # next-intl locale strings (en.json, ...)
├── docs/
│   └── architecture_analysis.md  # Full architecture decisions
├── AGENTS.md                      # AI agent instructions (auto + project context)
├── CLAUDE.md                      # @AGENTS.md (auto-generated)
├── .mcp.json                      # MCP server config for coding agents
├── .env.example                   # Environment variable template (commit this)
├── .env.local                     # Actual secrets (DO NOT commit)
└── next.config.ts                 # Turbopack + Tailwind config
```

---

## Key Config Files

### `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
```

### `.mcp.json` — Agent MCP Server

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

---

## Agent Tooling

This project is configured for AI coding agents per https://nextjs.org/docs/app/guides/ai-agents

### What's set up

| Tool | Purpose | File |
|---|---|---|
| `AGENTS.md` | Agent instructions + project context | `AGENTS.md` |
| `CLAUDE.md` | Points Claude at `AGENTS.md` | `CLAUDE.md` |
| `next-devtools-mcp` | Live runtime access: errors, routes, logs | `.mcp.json` |
| Bundled docs | Version-accurate Next.js docs for agents | `node_modules/next/dist/docs/` |

### How MCP works

1. Run `npm run dev`
2. `next-devtools-mcp` auto-discovers the running server on `localhost:3000`
3. Agents can call tools like:
   - `get_errors` — current build/runtime errors
   - `get_routes` — all app routes
   - `get_compilation_issues` — Turbopack compilation warnings
   - `compile_route` — on-demand route compilation check
   - `get_page_metadata` — components, rendering details per page

> The `next-devtools` MCP server is also registered globally in Antigravity's MCP config at
> `C:\Users\Herob\.gemini\config\mcp_config.json`, so it's always available in this IDE.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

| Variable | Used For |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public (client-side) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin (server-side only) |
| `OPENROUTER_API_KEY` | LLM routing via OpenRouter |
| `STRIPE_SECRET_KEY` | Stripe server-side billing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side |
| `STRIPE_WEBHOOK_SECRET` | Validate Stripe webhook events |

CAUTION: Never commit `.env.local`. It is in `.gitignore` by default.

---

## Dev Workflow

```bash
# Start dev server (also activates next-devtools-mcp)
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build
```

---

## Next Steps (Remaining Stack)

Planned installs for upcoming sprints — not yet installed:

```bash
# LLM streaming
npm install ai @ai-sdk/openai

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Payments
npm install stripe @stripe/stripe-js

# Animation + UI
npm install framer-motion

# i18n
npm install next-intl

# Shadcn UI (run separately via CLI)
npx shadcn@latest init
```
