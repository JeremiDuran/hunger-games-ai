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
