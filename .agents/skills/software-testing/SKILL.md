---
name: software-testing
description: >-
  Use this skill when implementing new features, after a code-review flagged
  issues, or when the user asks to "add tests", "test this", "verify this
  works", or "is this tested". It smartly assesses whether tests are necessary
  given the context, applies modern testing practices (unit, integration, E2E,
  contract), and enforces a hard 5-iteration circuit breaker to stop test loops.
  Works hand-in-hand with `no-slop` and `code-review`.
---

# Software Testing: Quality Gate Skill

Assess, write, and run tests with purpose. Not every line needs a test.
Not every test that fails needs another iteration. Be precise, be fast, stop early.

---

## Step 0: Check the Test Log

Before writing a single test, read [`.agents/skills/software-testing/test-log.md`](./test-log.md):

- If the target file has **already been tested and passed** (✅), skip unless the user asks for a re-run or code changed.
- If a previous session hit the **iteration limit** (🛑 Circuit Break), do **not** resume automatically — ask the user for direction.
- If tests are **pending** (🔧), pick up from where the last session left off.

---

## Step 1: Context Assessment — Should We Test This?

> **This is the most important step.** Writing unnecessary tests is slop.
> Not every function needs a unit test. Use judgment.

### Ask these questions first:

| Question | If YES → | If NO → |
|---|---|---|
| Is this pure logic (transforms data, has no side effects)? | Unit test it | Integration or skip |
| Is this a critical user flow (auth, payment, game state)? | Integration + E2E | Unit may suffice |
| Is this a UI component with branching render logic? | Component test | Visual check only |
| Is this a route handler / API endpoint? | Integration test | — |
| Is this glue code (wires A to B, no logic of its own)? | Skip — test A and B | — |
| Is this an LLM narrative call? | Mock the model, test the wrapper | — |
| Does this code have existing, passing tests? | Add to them | — |
| Is this a one-line utility (getter, formatter)? | Only if shared widely | Skip |

### Necessity Verdict

After the questions above, assign one of three verdicts before proceeding:

- **🟢 TEST** — Clear value, proceed to Step 2.
- **🟡 OPTIONAL** — Low-risk code, test only if the user insists or time permits.
- **🔴 SKIP** — Glue code, trivial passthrough, or already covered. Document reason in the test log.

> If the verdict is 🔴 SKIP, update the log and stop here. Do not write tests for the sake of coverage metrics.

---

## Step 2: Choose the Right Test Type

Use the **narrowest, fastest test** that gives you confidence. Do not default to E2E for everything.

### Test Pyramid — Project-Specific Guidance

```
          ┌─────────┐
          │   E2E   │  ← Playwright: critical user journeys only
          │  (few)  │     e.g. signup → create game → tribute dies
          ├─────────┤
          │  Integ  │  ← Vitest: API routes, DB calls, multi-module flows
          │ (some)  │     e.g. POST /api/game/events + DB side effect
          ├─────────┤
          │  Unit   │  ← Vitest: pure functions, state machines, parsers
          │ (most)  │     e.g. selectTributeForEvent(), parseEventTemplate()
          └─────────┘
```

| Layer | Tool | When to use |
|---|---|---|
| **Unit** | Vitest | Pure logic, utilities, state transitions |
| **Integration** | Vitest + Supabase test client | API route handlers, DB queries, multi-module flows |
| **Component** | Vitest + React Testing Library | UI components with conditional rendering or state |
| **E2E** | Playwright | Full user journeys that cross auth, payments, or game flow |
| **Contract** | Zod schema assertions | AI SDK responses, external API shapes |

### Rule: No E2E for Unit-Level Problems

If you can test something with a unit test, do not write an E2E for it. E2E tests are slow, flaky, and expensive to maintain.

---

## Step 3: Write the Tests

### Universal Rules (applies to all test types)

- **Arrange / Act / Assert** — every test follows this structure. No exceptions.
- **One assertion per test** (or one logical concept). If you need 10 `expect()`s, split the test.
- **Name tests as sentences**: `it('returns null when tribute is already dead')` not `it('works')`.
- **No `any` in test files** — same TypeScript discipline as production code.
- **Mock at the boundary**, not deep inside. Mock Supabase, not internal helpers.
- **Never hardcode environment secrets** in tests. Use `.env.test` or test helpers.
- **Do not test implementation details** — test observable behavior and outputs.

### Project-Specific Patterns

#### Unit Test Template (Vitest)
```ts
import { describe, it, expect } from 'vitest';
import { selectTributeForEvent } from '@/lib/game/tribute';

describe('selectTributeForEvent', () => {
  it('excludes dead tributes from selection', () => {
    // Arrange
    const tributes = [
      { id: '1', status: 'alive' },
      { id: '2', status: 'dead' },
    ] satisfies Tribute[];

    // Act
    const result = selectTributeForEvent(tributes, mockEvent);

    // Assert
    expect(result.every(t => t.status === 'alive')).toBe(true);
  });
});
```

#### API Route Integration Test Template (Vitest)
```ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/game/events/route';
import { createMockRequest } from '@/test/helpers';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('POST /api/game/events', () => {
  it('returns 400 when event payload is missing tribute_id', async () => {
    const req = createMockRequest({ body: { event_type: 'combat' } });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

#### AI SDK Contract Test (Zod Shape Assertion)
```ts
import { z } from 'zod';
import { NarrativeSchema } from '@/lib/ai';

it('LLM response matches NarrativeSchema contract', async () => {
  const raw = await generateNarrative(mockContext);
  const parsed = NarrativeSchema.safeParse(raw);
  expect(parsed.success).toBe(true);
});
```

### LLM / AI Calls: Always Mock the Model

- **Never call OpenRouter in tests.** It costs money, is slow, and is non-deterministic.
- Mock at the `generateText` / `streamText` boundary from Vercel AI SDK.
- Test the wrapper logic (prompt construction, response parsing, error handling) — not the model itself.

```ts
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'Katniss kills the beast.' }),
}));
```

---

## Step 4: Run and Iterate — The Circuit Breaker

### Iteration Discipline

Run the tests. If they fail, fix and re-run. But you **must stop at iteration 5**.

```
Iteration 1 → Fail → Fix → Continue
Iteration 2 → Fail → Fix → Continue
Iteration 3 → Fail → Fix → Continue
Iteration 4 → Fail → Fix → Continue
Iteration 5 → Fail → 🛑 CIRCUIT BREAK
```

### 🛑 Circuit Break Protocol

If you have not achieved passing tests by the 5th iteration:

1. **Stop all further test changes immediately.**
2. **Report the state clearly** to the user:
   - What the test is trying to verify
   - What it is actually producing
   - What you tried across each iteration
3. **Do not guess further** — the root cause likely requires human input (design clarification, environment issue, wrong mock, flawed assumption).
4. **Log the session as `🛑 Circuit Break`** in `test-log.md`.
5. **Suggest one of**:
   - Re-scoping the test to a simpler assertion
   - Switching test type (e.g., integration → unit)
   - Asking if the underlying code is correct before testing it

> Tests that loop endlessly are a signal — the code or the assumption is wrong, not just the test.

### Signs of a Looping Test (Trigger Circuit Break Early)

- You are modifying mocks without understanding why they are wrong
- Each fix causes a different test to break
- The error message changes but the test still fails
- You are testing an implementation detail that keeps changing
- You have passed iteration 3 and have no clear root cause hypothesis

---

## Step 5: Report Results

After tests pass (or circuit break), report using this format:

```
## Test Session: <target file or feature>
**Status: ✅ Passed | 🛑 Circuit Break | 🟡 Optional / Skipped**
**Iterations Used: X / 5**
**Tests Written: N (unit: X, integration: Y, E2E: Z)**

### Coverage Summary
- What is now covered
- What is intentionally NOT covered (and why)

### Skipped / Out of Scope
- <anything deferred and why>

### Recommended Follow-ups
- <future test work if any>
```

---

## Step 6: Update the Test Log

After every session (pass, skip, or circuit break), update [`.agents/skills/software-testing/test-log.md`](./test-log.md).

**Log entry format:**
```md
| `path/to/file.ts` | Unit | ✅ Passed | 2 | 2026-08-24 | Covers selectTributeForEvent(), dead tribute exclusion |
```

---

## Reference: Testing Anti-Patterns to Avoid

| Anti-Pattern | Why it is slop |
|---|---|
| Testing implementation details | Breaks on every refactor, adds no real safety |
| `expect(true).toBe(true)` | Tautological — always passes, never catches bugs |
| Mocking what you are testing | You are testing the mock, not the code |
| 100% coverage as a goal | Coverage != correctness; chasing it creates noise |
| `any` in test files | Same as in production code — breaks type safety |
| `console.log` debug left in tests | Pollutes CI output |
| Calling real APIs in unit tests | Slow, flaky, and costs money |
| One giant test file per feature | Hard to maintain; co-locate tests near source |
| Testing after-the-fact when code is already wrong | Fix the code first, then write the test |
| More than 5 iterations without a plan change | Loop detected — circuit break, reassess |

---

## Integration With Sibling Skills

| Skill | Relationship |
|---|---|
| `no-slop` | Tests must obey the same TypeScript and code quality standards as production code |
| `code-review` | If a review surfaces a score of 3+, this skill should be triggered to add regression coverage before refactoring |

> **Rule**: If `code-review` flags a file as score 4 or 5, always run this skill on it before and after the refactor.
