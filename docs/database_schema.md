# Database Schema Design (Supabase / PostgreSQL)

This document outlines the database architecture for the Hunger Games AI Simulator. Built on Supabase (PostgreSQL), we leverage relational tables with strict Row-Level Security (RLS) and optimized subquery evaluation.

---

## 1. Core Foundational Tables (Game Setup & Ownership)

### `profiles` (Extends Supabase `auth.users`)
Stores user citizenship, token quota for AI generation, and display metadata for both Guest (anonymous) and Registered accounts.
- `id` (`UUID`, PK, `REFERENCES auth.users(id) ON DELETE CASCADE`)
- `username` (`TEXT`, e.g., `"Gamemaker-9a4f21"`)
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
- `tribute_count` (`INTEGER`, default: `24`, `CHECK >= 2 AND <= 48`)
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
- `stats` (`JSONB`, default: `{"health": 100, "strength": 50, "agility": 50, "intelligence": 50}`)
- `inventory` (`JSONB`, default: `[]`)
- `death_phase_id` (`UUID`, nullable)
- `placement` (`INTEGER`, nullable)
- `created_at` (`TIMESTAMPTZ`, default: `now()`)

---

## 2. Row-Level Security (RLS) & Performance Standards

All tables enforce Row-Level Security:
1. **Profiles**: Users can SELECT and UPDATE only their own profile (`(select auth.uid()) = id`).
2. **Games**: Users can manage only games where `user_id = (select auth.uid())`.
3. **Tributes**: Access is granted if the user owns the parent game via `EXISTS (SELECT 1 FROM games WHERE games.id = tributes.game_id AND games.user_id = (select auth.uid()))`.
4. **Performance**: All `auth.uid()` calls use subquery caching `(select auth.uid())` per Supabase best practices. Foreign keys (`user_id`, `game_id`, `winner_id`) are indexed.
