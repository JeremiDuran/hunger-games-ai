# Software Testing Log

Tracks all test sessions run by the `software-testing` skill.
Updated automatically after each session (pass, skip, or circuit break).

> **Purpose**: Prevent redundant test runs, surface circuit-break history,
> and give visibility into what is and is not covered.

---

## Log

| File | Test Type | Status | Iterations | Date | Notes |
|---|---|---|---|---|---|
| *(no entries yet)* | — | — | — | — | — |

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
