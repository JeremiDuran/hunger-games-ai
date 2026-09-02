# Hunger Games AI — Documentation Directory Index

Welcome to the **Hunger Games AI** architectural and design documentation hub. This directory contains the authoritative specifications, database schemas, UI layouts, and engine mechanics for the project.

---

## Quick Navigation Index

| Document | Primary Domain | Summary | Key Code Locations |
| :--- | :--- | :--- | :--- |
| **[`simulation_engine_reference.md`](./simulation_engine_reference.md)** | **Simulation Engine** | **The definitive reference manual** for the procedural engine: PRNG determinism, 0–100 biometrics, 1–4 tribute slot matchmaking, Bradley-Terry combat calculus, item lifecycle, alliances, phase resolvers, and database persistence. | [`src/lib/engine/`](file:///c:/jj_projects/hg-ai/src/lib/engine) |
| **[`event_system_and_simulation_engine.md`](./event_system_and_simulation_engine.md)** | **Event Architecture** | Core gameplay event philosophy, slot-based encounter definitions, 1v1 / 1v2 / FFA combinations, and AI Storyteller `/api/narrative` integration. | [`src/lib/engine/phases/`](file:///c:/jj_projects/hg-ai/src/lib/engine/phases), [`src/app/api/narrative/`](file:///c:/jj_projects/hg-ai/src/app/api/narrative) |
| **[`database_schema.md`](./database_schema.md)** | **Database & RLS** | Supabase PostgreSQL schema, relational tables (`games`, `tributes`, `game_phases`, `game_phase_events`, `game_alliances`), GIN indexing, and Row Level Security policies. | [`supabase/migrations/`](file:///c:/jj_projects/hg-ai/supabase/migrations), [`src/types/database.ts`](file:///c:/jj_projects/hg-ai/src/types/database.ts) |
| **[`simulation_rules_and_customizations.md`](./simulation_rules_and_customizations.md)** | **Setup & Rules Matrix** | Complete parameter specification for the Setup Wizard: lethality curves, sponsor frequencies, muttation timing, pacing, and arena customizations. | [`src/lib/schemas/setup.ts`](file:///c:/jj_projects/hg-ai/src/lib/schemas/setup.ts), [`src/components/setup/`](file:///c:/jj_projects/hg-ai/src/components/setup) |
| **[`live_arena_design.md`](./live_arena_design.md)** | **Live Arena UI/UX** | Viewport specifications for the live match screen: Top Broadcast Header, Central Theater with typewriter narrative streaming, Left-Hand Phase Rail, and Right-Hand Biometric HUD. | [`src/app/[locale]/game/[id]/`](file:///c:/jj_projects/hg-ai/src/app/[locale]/game) |
| **[`routes_and_ux_flow.md`](./routes_and_ux_flow.md)** | **Routes & UX Flow** | Next.js 16 App Router hierarchy, route paths, locale routing (`next-intl`), guest flow (`sessionStorage`) vs registered user flow (Supabase DB). | [`src/app/`](file:///c:/jj_projects/hg-ai/src/app) |
| **[`auth_architecture.md`](./auth_architecture.md)** | **Authentication** | Supabase Auth SSR setup, guest token minting, anonymous session management, and single-hop RLS performance architecture. | [`src/lib/auth/`](file:///c:/jj_projects/hg-ai/src/lib/auth), [`src/app/api/auth/`](file:///c:/jj_projects/hg-ai/src/app/api/auth) |
| **[`landing_page_design_system.md`](./landing_page_design_system.md)** | **Design System** | Visual guidelines: color palette (Capitol Gold, Blood Ember, Void Black), typography (Cinzel & Inter), animations (GSAP), and responsive layouts. | [`src/app/globals.css`](file:///c:/jj_projects/hg-ai/src/app/globals.css), [`src/components/landing/`](file:///c:/jj_projects/hg-ai/src/components/landing) |
| **[`technical_stack.md`](./technical_stack.md)** | **Tech Stack & Tooling** | Technology choices: Next.js 16 (App Router + Turbopack), Tailwind CSS v4, Base UI / Shadcn, OpenRouter AI SDK, Supabase DEV vs PROD environments. | [`package.json`](file:///c:/jj_projects/hg-ai/package.json), [`AGENTS.md`](file:///c:/jj_projects/hg-ai/AGENTS.md) |

---

## Agent Usage Instructions

When addressing queries or implementing features:
1. **Engine & Simulation questions**: Always check [`simulation_engine_reference.md`](./simulation_engine_reference.md) first or activate the `simulation-engine` skill.
2. **Database or SQL questions**: Consult [`database_schema.md`](./database_schema.md) and use DEV MCP (`supabase-hunger-games-ai`).
3. **UI & Viewport questions**: Read [`live_arena_design.md`](./live_arena_design.md) or [`landing_page_design_system.md`](./landing_page_design_system.md).
4. **Setup & Game Rules questions**: Read [`simulation_rules_and_customizations.md`](./simulation_rules_and_customizations.md).
