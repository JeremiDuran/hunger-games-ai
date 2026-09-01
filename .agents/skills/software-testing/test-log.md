# Software Testing Log

Tracks all test sessions run by the `software-testing` skill.
Updated automatically after each session (pass, skip, or circuit break).

> **Purpose**: Prevent redundant test runs, surface circuit-break history,
> and give visibility into what is and is not covered.

---

## Log

| File | Test Type | Status | Iterations | Date | Notes |
|---|---|---|---|---|---|
| `src/lib/schemas/setup.ts` | Unit / Schema Contract | ✅ Passed | 1 | 2026-09-01 | Covers 35 tests for Arena, Tributes, Rules Zod schemas, field error mapping, storage draft parsers, and DB payload serialization transforms. |
| `src/lib/engine/prng.ts` | Unit / Deterministic PRNG | ✅ Passed | 1 | 2026-09-01 | Covers 15 tests for Mulberry32 reproducibility, string seed hashing, bounds, nextBoolean, pickOne, weighted picks, shuffle, and subSeed derivation. |
| `src/lib/engine/biometrics.ts` | Unit / State Machine | ✅ Passed | 1 | 2026-09-01 | Covers 18 tests for Survival/Sanity clamping, tag evaluation across all thresholds, environmental priority flags, delta application, and condition predicates. |
| `src/lib/engine/adapters.ts` | Unit / Schema Adapter | ✅ Passed | 2 | 2026-09-01 | Covers 17 tests for DB row to EngineTribute mapping, legacy stats fallback, inventory sanitizer, DB update serialization, and setup settings parsing. |
| `src/lib/engine/phases/bloodbath.ts` | Unit / Phase Resolver | ✅ Passed | 1 | 2026-09-01 | Covers 3 tests for Bloodbath horn rush vs periphery scavenge vs flee tactics, fleer safety, weapon loot, and lethality casualty scaling. |
| `src/lib/engine/phases/day.ts` | Unit / Phase Resolver | ✅ Passed | 1 | 2026-09-01 | Covers 2 tests for Day phase foraging, rest, skirmishes, and sponsor drop frequency scaling across abundance/famine settings. |
| `src/lib/engine/phases/night.ts` | Unit / Phase Resolver | ✅ Passed | 2 | 2026-09-01 | Covers 3 tests for Allied encampment sanity recovery, cold exposure penalties for lone tributes, and Fallen Anthem broadcast event recaps. |
| `src/lib/engine/phases/feast.ts` | Unit / Phase Resolver | ✅ Passed | 1 | 2026-09-01 | Covers 2 tests for Desperate tribute attendance incentives, abstainer safety in perimeter hiding, and legendary backpack contesting. |
| `src/lib/engine/phases/special.ts` | Unit / Special Phases | ✅ Passed | 1 | 2026-09-01 | Covers 3 tests for Generic NPC Overload (100% NPC encounters), Arena Cataclysms, and gear mitigation against environmental disasters. |
| `src/lib/engine/combat/lethality.ts` | Unit / Monte Carlo | ✅ Passed | 1 | 2026-09-01 | Covers 2 tests for Monte Carlo lethality calibration (high_bloodbath > balanced > gritty_survival) and biometric [0, 100] bounds integrity. |
| `src/lib/engine/alliances.ts` | Unit / Cohesion & Alliances | ✅ Passed | 1 | 2026-09-01 | Covers 22 tests for max alliance size cap (5), N-tribute scaling (12 vs 24+), Career pack initialization, pack cohesion (0-100), strain evaluation, dynamic recruitment, and degraded alliance sync. |
| `src/lib/engine/__tests__/betrayal-lifecycle.test.ts` | Integration / Betrayal Lifecycle | ✅ Passed | 2 | 2026-09-01 | Covers 10 tests for multi-phase lifecycle (Day->Night->Day), external casualty auto-dissolution, low-sanity (<25) paranoid backstab, endgame (<=4) betrayal, District Duo Twist exemption, and placement/killCount integrity. |
| `src/lib/engine/__tests__/state-delta-integrity.test.ts` | Unit / Invariant | ✅ Passed | 1 | 2026-09-01 | Covers 2 tests for byte-identical PRNG determinism across repeated runs and strict kill count increment integrity. |

---

## Status Key

| Status | Meaning |
|---|---|
| ✅ Passed | All tests written for this session are passing |
| 🔧 Pending | Tests written but not yet passing; work in progress |
| 🟡 Optional | Tests deemed optional; skipped by choice |
| 🔴 Skipped | Tests unnecessary for this file; reason noted |
| 🛑 Circuit Break | Reached 5-iteration limit without passing; human review needed |

---

## Notes on Circuit Breaks

When a session is marked 🛑 Circuit Break, document:
- The exact assertion that kept failing
- What was tried across each iteration
- A hypothesis for the root cause

This prevents the next agent session from repeating the same failed attempts.
