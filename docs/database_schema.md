# Database Schema Design (Supabase / PostgreSQL)
 
> **Document Status**: Approved Technical Specification  
> **Last Updated**: 2026-09-02  
> **Related Documents**: [`simulation_engine_reference.md`](./simulation_engine_reference.md), [`technical_stack.md`](./technical_stack.md), [`auth_architecture.md`](./auth_architecture.md), [`routes_and_ux_flow.md`](./routes_and_ux_flow.md)
 
This document outlines the database architecture for the Hunger Games AI Simulator. Built on Supabase (PostgreSQL), we leverage relational tables with strict Row-Level Security (RLS) and optimized subquery evaluation.

---

## 1. Core Foundational Tables (Game Setup & Ownership)

### `profiles` (Extends Supabase `auth.users`)
Stores user citizenship, token quota for AI generation, and display metadata for both Guest (anonymous) and Registered accounts.
- `id` (`UUID`, PK, `REFERENCES auth.users(id) ON DELETE CASCADE`)
- `username` (`TEXT`, e.g., `"Gamemaker-9a4f21"`)
- `role` (`user_role` ENUM: `'user'`, `'admin'`, default: `'user'`)
- `avatar_url` (`TEXT`, nullable)
- `tokens_balance` (`INTEGER`, default: `50`, `CHECK >= 0`)
- `created_at` (`TIMESTAMPTZ`, default: `now()`)
- `updated_at` (`TIMESTAMPTZ`, default: `now()`)

### `games`
Represents an instance of a Hunger Games simulation configured by a user.
- `id` (`UUID`, PK, default: `gen_random_uuid()`)
- `user_id` (`UUID`, FK `-> auth.users.id ON DELETE CASCADE`)
- `title` (`TEXT`, default: `'The 74th Annual Hunger Games'`)
- `status` (`game_status` ENUM: `'setup'`, `'in_progress'`, `'finished'`, `'archived'`)
- **Arena Environment & Storytelling Lore**:
  - `arena_name` (`TEXT`, default: `'Verdant Tropics'`)
  - `arena_description` (`TEXT`, rich environmental lore injected into LLM storytelling prompts)
- **Settings Matrix** (`JSONB`):
  - `enable_bloodbath` (`BOOLEAN`, default: `true`)
  - `enable_muttations` (`BOOLEAN`, default: `true`)
  - `enable_disasters` (`BOOLEAN`, default: `true`)
  - `enable_sponsor_drops` (`BOOLEAN`, default: `true`)
  - `pacing` (`TEXT`, `'instant'` | `'normal'` | `'cinematic'`)
- `tribute_count` (`INTEGER`, default: `24`, `CHECK >= 2 AND <= 48 AND tribute_count % 2 = 0`)
- `current_day` (`INTEGER`, default: `0`)
- `current_phase_type` (`TEXT`, default: `'bloodbath'`)
- `winner_id` (`UUID`, FK `-> tributes.id ON DELETE SET NULL`, nullable)
- `created_at` (`TIMESTAMPTZ`, default: `now()`)
- `updated_at` (`TIMESTAMPTZ`, default: `now()`)
- `ended_at` (`TIMESTAMPTZ`, nullable)

### `tributes`
The participants of a game configured during setup.
- `id` (`UUID`, PK, default: `gen_random_uuid()`)
- `game_id` (`UUID`, FK `-> games.id ON DELETE CASCADE`)
- `name` (`TEXT`)
- `district` (`INTEGER`, `CHECK >= 1 AND <= 24`)
- `gender` (`tribute_gender` ENUM: `'male'`, `'female'`, `'non_binary'`, `'unspecified'`)
- `personality` (`VARCHAR(280)`, backstory/temperament steer for LLM actions)
- `physical_aspect` (`VARCHAR(280)`, visual appearance steer)
- `avatar_url` (`TEXT`, nullable)
- `status` (`tribute_status` ENUM: `'alive'`, `'dead'`)
- `kill_count` (`INTEGER`, default: `0`, `CHECK >= 0`)
- `stats` (`JSONB`, default: `{"survival": 50, "sanity": 50, "physical_tag": "unscathed", "mental_tag": "composed"}`)
- `inventory` (`JSONB`, default: `[]`, e.g., `["knife", "iodine_drops"]`)
- `death_phase_id` (`UUID`, nullable)
- `placement` (`INTEGER`, nullable)
- `created_at` (`TIMESTAMPTZ`, default: `now()`)

---

## 2. Live Arena Simulation & Event Tracking Tables

### `game_phases`
Represents an individual chronological round/phase within a match timeline.
- `id` (`UUID`, PK, default: `gen_random_uuid()`)
- `game_id` (`UUID`, FK `-> games.id ON DELETE CASCADE`)
- `day_number` (`INTEGER`, e.g., `0` for Bloodbath, `1`, `2`, `3`...)
- `phase_type` (`TEXT`, check in `'bloodbath'`, `'day'`, `'night'`, `'feast'`, `'cataclysm'`, `'npc_overload'`, `'arena_event'`)
- `phase_order` (`INTEGER`, sequential index: 0, 1, 2, 3...)
- `fallen_tribute_ids` (`UUID[]`, default: `'{}'`)
- `status` (`TEXT`, default: `'completed'`, check in `'pending'`, `'simulating'`, `'completed'`)
- `created_at` (`TIMESTAMPTZ`, default: `now()`)

### `game_phase_events`
Stores each deterministic event outcome and its generated AI narrative prose.
- `id` (`UUID`, PK, default: `gen_random_uuid()`)
- `phase_id` (`UUID`, FK `-> game_phases.id ON DELETE CASCADE`)
- `game_id` (`UUID`, FK `-> games.id ON DELETE CASCADE`)
- `event_order` (`INTEGER`, sequential index within the phase: 0, 1, 2...)
- `event_category` (`TEXT`, e.g., `'combat'`, `'forage'`, `'hazard'`, `'sponsor'`, `'mutt'`, `'social'`)
- `outcome_type` (`TEXT`, `'death'`, `'wound'`, `'loot'`, `'flee'`, `'alliance'`, `'idle'`)
- `tribute_ids` (`UUID[]`, participating tributes)
- `killer_ids` (`UUID[]`, nullable)
- `victim_ids` (`UUID[]`, nullable)
- `narrative_text` (`TEXT`, rich sensory flavor prose)
- `state_delta` (`JSONB`, health modifications, item transfers, and condition tags)
- `created_at` (`TIMESTAMPTZ`, default: `now()`)

### `game_alliances`
Tracks dynamic pacts and hunting packs across the match timeline.
- `id` (`UUID`, PK, default: `gen_random_uuid()`)
- `game_id` (`UUID`, FK `-> games.id ON DELETE CASCADE`)
- `tribute_ids` (`UUID[]`, array of allied tribute UUIDs, e.g. 2 to 6 tributes)
- `status` (`TEXT`, default: `'active'`, check in `'active'`, `'dissolved'`, `'betrayed'`)
- `formed_phase_id` (`UUID`, FK `-> game_phases.id ON DELETE SET NULL`, nullable)
- `dissolved_phase_id` (`UUID`, FK `-> game_phases.id ON DELETE SET NULL`, nullable)
- `betrayed_by_tribute_id` (`UUID`, FK `-> tributes.id ON DELETE SET NULL`, nullable)
- `created_at` (`TIMESTAMPTZ`, default: `now()`)

---

## 3. Database State Immutability Triggers

To guarantee match integrity and prevent retro-active tampering during simulations, PostgreSQL triggers enforce strict lifecycle immutability:

1. **`trigger_validate_game_state_update`**:
   - `id`, `user_id`, and `created_at` are strictly immutable.
   - When a game is `in_progress` or `finished`, its core setup parameters (`title`, `arena_name`, `arena_description`, `settings`, `tribute_count`) are locked and cannot be updated.
   - When a game is `finished`, outcome fields (`winner_id`, `current_day`, `current_phase_type`, `ended_at`) cannot be modified.
2. **`trigger_validate_tribute_state_mutation`**:
   - Tributes can only be inserted or deleted when the parent game is in `'setup'` or `'archived'` status. Adding or removing tributes from an active or finished match throws an exception.

---

## 4. Maintenance Stored Procedures

### `cleanup_stale_anonymous_users(p_older_than interval)`
- **Security**: Restricted to caller with `role = 'admin'` in `public.profiles` (`SECURITY DEFINER`).
- **Function**: Safely cascades deletions for stale guest users (`is_anonymous = true` or `email is null`) older than the threshold (default: `24 hours`), automatically cascading deletion of their associated `games`, `tributes`, and event rows.

---

## 5. Row-Level Security (RLS) & Performance Standards

All tables enforce Row-Level Security:
1. **Profiles**: Users can SELECT and UPDATE only their own profile (`(select auth.uid()) = id`).
2. **Games**: Users can manage only games where `user_id = (select auth.uid())`.
3. **Tributes**: Access is granted if the user owns the parent game via `EXISTS (SELECT 1 FROM games WHERE games.id = tributes.game_id AND games.user_id = (select auth.uid()))`.
4. **Game Phases, Events & Alliances**: Access is granted if the user owns the parent game via `EXISTS (SELECT 1 FROM games WHERE games.id = <table_name>.game_id AND games.user_id = (select auth.uid()))`.
5. **Performance**: All `auth.uid()` calls use subquery caching `(select auth.uid())` per Supabase best practices. Foreign keys (`user_id`, `game_id`, `phase_id`, `winner_id`) are indexed with GIN indexing on `UUID[]` arrays (`tribute_ids`).
