---
name: layered-validation
description: >-
  Use this skill when building or modifying forms, API validation boundaries, guest session
  storage state, or database constraints. Covers Layered Validation (Defense in Depth) across
  Next.js (Zod schemas, UI feedback, state transforms) and Supabase PostgreSQL (types, check
  constraints, RLS). Activate when working on form validation, schemas, data transformation,
  or persistence.
---

# Layered Validation (Defense in Depth) Guidelines

This project enforces a **multi-layer validation architecture** to maintain pristine data integrity while delivering instant, accessible user feedback for both Guest (unauthenticated) and Registered users.

---

## 1. The Validation Flow

```
[ User Input in Form (e.g., ArenaForm) ]
                  │
                  ▼
 1. Client Validation Layer (Zod + React / Shadcn UI)
    - Real-time feedback, field-level error messages, visual indicators
    - ARIA invalid / error linkage (accessibility skill)
    - Blocks "Next Step" or submission if invalid
                  │
                  ▼
 2. Payload Transformation & Serialization Layer (`src/lib/schemas/`)
    - Whitespace trimming (`.trim()`) and sanitization
    - Case conversion (`camelCase` state -> `snake_case` DB column payload)
                  │
                  ├─── If Guest Session ───► Validate & write to `sessionStorage`
                  │
                  └─── If Authenticated ───► Validate API Boundary / Supabase Client
                                                   │
                                                   ▼
 3. Database Layer (Supabase PostgreSQL)
    - Hard check constraints (`CHECK`, `NOT NULL`, FKs)
    - Row-Level Security (`auth.uid() = user_id`)
```

---

## 2. Layer Responsibilities & Division of Concerns

| Layer | Technology | Primary Responsibilities |
| :--- | :--- | :--- |
| **Layer 1: Client UI** | React State / Zod / Shadcn | Instant user feedback, focus management on error, `<label>` & `aria-invalid` bindings, disabling submit/forward navigation. |
| **Layer 2: Transformation & Schema** | Zod (`src/lib/schemas/`) | Boundary validation, input trimming, sanitization, converting React `camelCase` to database `snake_case`, handling Guest vs Auth mode payloads. |
| **Layer 3: Database Constraints** | PostgreSQL / Supabase | Inviolable data integrity: `NOT NULL`, column types, numeric ranges (`CHECK`), foreign keys, and RLS policies. |

---

## 3. Implementation Rules by Layer

### Layer 1: Next.js Client & Form UI
1. **Never allow empty or whitespace-only strings** for required fields.
2. **Accessible Error Display**: Pair `text-destructive` with icons and text (never color alone). Follow the `accessibility` skill (`aria-invalid`, `aria-describedby`, `role="alert"`).
3. **Draft Auto-Sync**: Keep form state in context, but prevent proceeding to the next wizard step until the current step satisfies its validation schema.

### Layer 2: Transformation & Serialization (`src/lib/schemas/`)
1. Place all shared Zod schemas under `src/lib/schemas/` (e.g., `src/lib/schemas/arena.ts`).
2. Centralize serialization logic that maps frontend types to database types:
   ```ts
   // Example: Transform camelCase frontend state to snake_case DB payload
   export function toGameDbPayload(arenaState: ArenaSetupState) {
     return {
       title: arenaState.simulationTitle.trim(),
       arena_name: arenaState.arenaName.trim(),
       arena_description: arenaState.arenaDescription.trim(),
       settings: {
         pacing: arenaState.pacing,
         enable_bloodbath: arenaState.hazards.enableBloodbath,
         enable_muttations: arenaState.hazards.enableMuttations,
         enable_disasters: arenaState.hazards.enableDisasters,
         enable_sponsor_drops: arenaState.hazards.enableSponsorDrops,
       },
     };
   }
   ```
3. Use the same Zod schema to validate route handler requests under `src/app/api/`.

### Layer 3: Supabase PostgreSQL
1. **Always declare `NOT NULL`** on columns that must never be absent.
2. **Add Check Constraints** for finite boundaries (e.g. `CHECK (tribute_count >= 2 AND tribute_count <= 48)`).
3. **Always enforce Row-Level Security (RLS)** using optimized subquery caching `(select auth.uid())`.
4. Remember that PostgreSQL `NOT NULL` does not reject empty strings (`""`) — frontend Zod schemas must enforce `.min(1)` / `.trim()`.

---

## 4. Checklist for Any Form or Persistence Feature

Before marking any form, API endpoint, or DB table ready:

- [ ] Zod schema defined in `src/lib/schemas/` with `.trim()` and appropriate boundaries
- [ ] Client form gives immediate feedback and sets `aria-invalid` appropriately
- [ ] Forward navigation / submission is blocked when form state is invalid
- [ ] Payload serializer converts React `camelCase` to PostgreSQL `snake_case`
- [ ] Guest mode writes valid schema-compliant data to `sessionStorage`
- [ ] Supabase table has corresponding `NOT NULL`, check constraints, and RLS enabled
