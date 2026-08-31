# Hunger Games AI — Technical Stack & Framework Architecture

> **Document Status**: Approved Technical Specification  
> **Last Updated**: 2026-08-31  
> **Related Documents**: [`database_schema.md`](./database_schema.md), [`auth_architecture.md`](./auth_architecture.md), [`routes_and_ux_flow.md`](./routes_and_ux_flow.md), [`live_arena_design.md`](./live_arena_design.md)

---

## 1. Executive Stack Overview

Hunger Games AI (`hg-ai`) is built on **Next.js 16 App Router** with server-first rendering, procedural simulation determinism, and streaming AI narrative generation.

| Layer | Technology | Purpose & Implementation |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3.3 (App Router) | Server Components (RSC), dynamic route streaming, edge handlers, and server actions. |
| **Bundler & Compiler** | Turbopack + TypeScript 5 | Ultra-fast local HMR and compile-time type safety across database schemas, APIs, and components. |
| **Styling & Design System** | Tailwind CSS v4 + Base UI | High-performance CSS engine with dynamic CSS theme variables (`--primary`, `--accent`, `--theme-glow`) and accessible primitives (`@base-ui/react`). |
| **Animation Engine** | GSAP 3.15 + `@gsap/react` | 60fps GPU-accelerated cinematic timelines, canvas particle loops (`useGSAP`), and `prefers-reduced-motion` compliance. |
| **Database & Auth** | Supabase (PostgreSQL + Auth) | Relational database with strict Row-Level Security (RLS), Anonymous Auth (`signInAnonymously()`), and subquery caching. |
| **Internationalization** | `next-intl` 4.13 | Full multi-language support from the ground up (`src/app/[locale]/...`, `src/messages/`). |
| **Data Validation** | Zod 4 (v4.5) | Layered validation (Defense in Depth) across client forms, route handlers, and database payloads. |
| **Testing Framework** | Vitest 4 (`vitest`, `vite-tsconfig-paths`) | High-speed unit, schema contract, and logic test runner with TypeScript path alias support. |
| **AI / LLM Routing** *(Planned)* | Vercel AI SDK + OpenRouter | Server-side LLM streaming for dynamic narrative generation (`src/lib/ai.ts`, `/api/narrative`). |
| **Payments & Tokens** *(Planned)* | Stripe (`stripe`, `@stripe/stripe-js`) | Token balance purchases and Gamemaker passes. |

---

## 2. Project Directory Structure

```
hg-ai/
├── src/
│   ├── app/
│   │   ├── [locale]/                 # next-intl localized App Router tree
│   │   │   ├── layout.tsx            # Root layout (fonts, providers, a11y skip links)
│   │   │   ├── page.tsx              # Landing page (3 brainstorm drafts + theme switcher)
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Dedicated Capitol auth terminal
│   │   │   ├── setup/
│   │   │   │   └── page.tsx          # 3-Step simulation configurator & pre-flight summary
│   │   │   ├── game/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx      # Live Arena simulation & phase playback
│   │   │   │   │   └── summary/
│   │   │   │   │       └── page.tsx  # Victor's Hall & final statistics
│   │   │   │   └── hub/              # Decoupled Game Hub / Roster telemetry
│   │   │   └── archives/             # Capitol archives (registered members)
│   │   ├── api/
│   │   │   ├── auth/callback/
│   │   │   │   └── route.ts          # Supabase OAuth PKCE exchange handler
│   │   │   ├── game/[id]/phase/
│   │   │   │   └── route.ts          # Deterministic procedural round engine
│   │   │   └── narrative/
│   │   │       └── route.ts          # Vercel AI SDK streaming flavor text
│   │   ├── globals.css               # Tailwind v4 theme variables & chamfer utilities
│   │   └── favicon.ico
│   ├── components/
│   │   ├── a11y/                     # Accessibility modals & skip links
│   │   ├── auth/                     # Auth dialogs & status badges
│   │   ├── disclaimer/               # Legal disclaimer & ThemeSidePanel
│   │   ├── landing/                  # Landing page drafts & GSAP canvas backgrounds
│   │   ├── setup/                    # Setup wizard forms, rosters, rules & summary
│   │   ├── game/                     # Live Arena event feed, phase rail & cards
│   │   └── ui/                       # Reusable primitives (Buttons, Modals, Badges)
│   ├── config/                       # Static presets (arena-presets.ts, tribute-presets.ts)
│   ├── hooks/                        # Custom hooks (useKeyboardShortcuts, useThemeEngine)
│   ├── i18n/                         # next-intl routing & navigation wrappers
│   ├── lib/
│   │   ├── a11y/                     # Accessibility context
│   │   ├── auth/                     # Supabase auth context & hooks
│   │   ├── schemas/                  # Zod validation schemas (setup, game, api)
│   │   ├── setup/                    # Setup wizard state machine context
│   │   ├── supabase/                 # Browser, server, and proxy Supabase clients
│   │   ├── theme-context.tsx         # Universal 5-theme visual engine
│   │   └── utils.ts                  # Class merging (cn) & helper functions
│   ├── messages/                     # Localization JSON dictionaries (en.json, ...)
│   ├── types/                        # TypeScript interfaces & Supabase DB types
│   └── proxy.ts                      # Session refresh & route protection proxy
├── supabase/
│   └── migrations/                   # Versioned, reproducible SQL migrations
├── docs/                             # Architecture specifications & design systems
├── AGENTS.md                         # AI agent instructions & database environment rules
├── package.json                      # Dependency manifests & build scripts
└── next.config.ts                    # Turbopack & Tailwind configuration
```

---

## 3. Configuration & Tooling

### A. Turbopack Configuration (`next.config.ts`)
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

### B. Dual Database Environments (Dev & Prod)
The project connects to two distinct Supabase environments via dedicated Model Context Protocol (MCP) servers:
- **DEV (`supabase-hunger-games-ai`)**: Full read/write access for SQL migration authoring, procedural testing, and development. Local `.env.local` points here.
- **PROD (`supabase-hunger-games-ai-prod`)**: Strict read-only access for monitoring live logs and advisors.

### C. Agent Devtools MCP (`.mcp.json`)
The `next-devtools-mcp` server provides real-time access to Next.js 16 compiler diagnostics:
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

## 4. Development Workflow

```bash
# Start local development server (Turbopack + next-devtools MCP)
npm run dev

# Run automated tests (Vitest single run)
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage reporting
npm run test:coverage

# Run TypeScript typecheck
npx tsc --noEmit

# Run ESLint validation
npm run lint

# Production build test
npm run build
```

---

## 5. Automated Testing Architecture & Quality Gates

Hunger Games AI enforces strict testing discipline adhering to the project's [`software-testing`](../.agents/skills/software-testing/SKILL.md) and [`no-slop`](../.agents/skills/no-slop/SKILL.md) quality gates.

```
          ┌─────────┐
          │   E2E   │  ← Playwright: critical user journeys only (e.g. signup → setup → victor)
          ├─────────┤
          │  Integ  │  ← Vitest + Supabase test client: API route handlers & session transitions
          ├─────────┤
          │  Unit   │  ← Vitest: pure functions, Zod schemas, transforms, state machines, parsers
          └─────────┘
```

### A. Testing Principles & Rules
1. **Narrowest, Fastest Layer First**: Unit tests are preferred for pure logic, state transitions, Zod schemas, and data transforms.
2. **Deterministic & Isolated**: Unit and schema tests never make live database writes or network calls.
3. **Layered Validation Parity**: Zod schemas in `src/lib/schemas/` are tested for boundary constraints, whitespace trimming, field-level error mapping, and exact database payload serialization (`camelCase` → `snake_case`).
4. **Circuit Breaker Protocol**: Test iteration is capped at a strict 5-iteration limit to prevent anti-pattern loops. Test runs and statuses are tracked in `.agents/skills/software-testing/test-log.md`.
