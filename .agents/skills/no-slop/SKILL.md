---
name: no-slop
description: >-
  Use this skill when writing new code, reviewing a code plan, or starting any
  implementation task. It provides anti-slop guidelines — modern, opinionated
  standards for TypeScript and general software development — to prevent
  accumulation of low-quality, over-engineered, or stale patterns before they
  enter the codebase. Activate proactively at the start of any coding task.
---

# No-Slop: Anti-Slop Prevention Guidelines

These are the standards to apply **before writing any code** in this project.
They are architecture-agnostic but aware that this project uses Next.js 16 App Router, TypeScript, Tailwind CSS v4, and Vercel AI SDK.

---

## 1. TypeScript: Write Real Types, Not Escape Hatches

**Never use `any`.** It defeats the entire purpose of TypeScript.
- Use `unknown` when the type is genuinely unknown, then narrow it with guards.
- Use generics to preserve type information across boundaries.
- Use `satisfies` to validate objects against types without widening.

```ts
// ❌ Slop
const data: any = await fetch(...).then(r => r.json());

// ✅ Good
const data = await fetch(...).then<ApiResponse>(r => r.json());
```

**Avoid `as` casts** unless you are 100% certain and add a comment explaining why.

**Avoid non-null assertions (`!`)** unless you have already narrowed the type in the same scope.

**Use discriminated unions** for complex state instead of optional fields:

```ts
// ❌ Slop — ambiguous state
type State = { loading: boolean; data?: Data; error?: string };

// ✅ Good — exhaustive and safe
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Data }
  | { status: 'error'; message: string };
```

---

## 2. Functions: Small, Pure, Named

- **Single responsibility**: one function does one thing.
- **No magic numbers or strings**: extract to named constants.
- **Avoid deeply nested callbacks**: use `async/await`, early returns, and guard clauses.
- **Name things for what they do**, not how they do it. `generateNarrative()` not `doLLMStuff()`.

```ts
// ❌ Slop
function process(x: any) {
  if (x) {
    if (x.type === 1) {
      // ...
    }
  }
}

// ✅ Good
const EVENT_TYPE_COMBAT = 1;

function processCombatEvent(event: CombatEvent): NarrativeContext {
  if (event.type !== EVENT_TYPE_COMBAT) return defaultContext;
  // ...
}
```

---

## 3. Error Handling: Explicit, Never Silent

- **Never swallow errors** with empty `catch` blocks.
- In server-side Next.js code, use `try/catch` and return typed error responses.
- In client-side React, use Error Boundaries for render errors and `try/catch` for async.
- **Log errors with context**, not just `console.error(e)`.

```ts
// ❌ Slop
try {
  await generateNarrative(event);
} catch {}

// ✅ Good
try {
  await generateNarrative(event);
} catch (err) {
  console.error('[narrative] failed to generate for event', event.id, err);
  throw new NarrativeGenerationError('Generation failed', { cause: err });
}
```

---

## 4. React / Next.js: Server-First, Client-Minimal

- **Default to Server Components.** Add `'use client'` only when you need:
  - Event handlers (`onClick`, `onChange`)
  - Browser APIs (`window`, `localStorage`)
  - React state (`useState`, `useReducer`)
  - Third-party client libs that require it
- **Never `useEffect` for data fetching** in App Router. Use `async` server components or `fetch` in route handlers.
- **Suspense boundaries are load boundaries.** Wrap async server components with `<Suspense fallback={...}>` for granular loading states.
- **Keep client bundles small.** Don't import server-only libs in client components.

---

## 5. Code Organisation: Flat Is Better Than Nested

- Prefer **co-location**: keep a component's types, helpers, and styles close to where they're used.
- Avoid premature abstraction. Extract a helper only when it's used in 3+ places or has clear reuse value.
- **One export per file** for components. Multiple named exports are fine for utility modules.
- Use **barrel files (`index.ts`) sparingly** — they harm tree-shaking and make dependency graphs opaque.

---

## 6. Dependencies: Question Every Import

Before `npm install`, ask:
1. Is this already available in the existing stack? (e.g., don't add `lodash` when you need one utility)
2. Is it actively maintained and type-safe?
3. What's the bundle size impact? (check bundlephobia.com)
4. Does it work in the Next.js App Router environment (client/server split)?

---

## 7. Comments: Why, Not What

- Code explains *what*. Comments explain *why*.
- Don't comment obvious code. Comment non-obvious decisions.
- Use `// TODO(name): description` or `// FIXME:` with a reason, not orphan TODOs.

---

## 8. Checklist Before Submitting Code

Before finalizing any implementation, verify:

- [ ] No `any` types introduced
- [ ] No `as` casts without a comment explaining why
- [ ] All async operations have error handling
- [ ] Server vs. client boundary is intentional and documented with `'use client'`
- [ ] No magic strings/numbers — all extracted to named constants
- [ ] Function names are descriptive and action-oriented
- [ ] No dead code or commented-out blocks left in
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
