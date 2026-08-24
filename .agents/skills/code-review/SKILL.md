---
name: code-review
description: >-
  Use this skill when the user asks to review, audit, analyze, or refactor a
  file or system in the project. Analyzes code for adherence to modern
  development guidelines, rates refactor urgency from 1 to 5, and tracks
  reviewed files to prevent redundant re-optimization. Activate when the user
  says things like "review this", "check this file", "does this need refactor",
  "audit the codebase", or similar.
---

# Code Review: Cure Skill

Analyze a file or system for code quality. Rate refactor urgency. Track reviewed files to avoid over-optimizing.

---

## Step 1: Identify the Target

Determine what to review:
- **Single file**: the user points at a specific file
- **System/feature**: a directory or set of related files (e.g., all files under `src/app/api/`)
- **Full project audit**: all files under `src/`

If the target is ambiguous, ask the user to clarify before proceeding.

---

## Step 2: Check the Review Log

Before reviewing anything, check [`.agents/skills/code-review/reviewed-files.md`](./reviewed-files.md):

- If the file was **previously reviewed at score 1–2** (low urgency), skip it unless the user explicitly asks for a re-review.
- If the file was **previously reviewed at score 3–5** and **already refactored** (marked with ✅), skip it.
- If the file was reviewed but **not yet refactored**, note this to the user and proceed only on their instruction.

This log prevents over-optimizing files that are already clean.

---

## Step 3: Read the File(s)

Read the target file(s) in full. Understand:
- What the code does and where it sits in the architecture
- What framework/library conventions apply (Next.js App Router, TypeScript, Vercel AI SDK, etc.)

---

## Step 4: Evaluate Against These Criteria

Score each criterion from 1 (excellent) to 5 (critical issues):

### A. TypeScript Correctness
- Are types precise? (`any`, unsafe `as` casts, missing return types)
- Are discriminated unions used for complex state?
- Are generics used appropriately vs. overused?

### B. Code Clarity & Naming
- Are functions/variables named for what they do, not how?
- Is complexity hidden behind unclear abstractions?
- Are magic numbers/strings extracted to constants?

### C. Error Handling
- Are all async operations wrapped with error handling?
- Are errors logged with context, not swallowed silently?

### D. React / Next.js Patterns (if applicable)
- Is the server/client boundary correct and intentional?
- Is data fetching done server-side where possible?
- Are `useEffect` anti-patterns present?
- Are Suspense boundaries used for async components?

### E. Modularity & Coupling
- Does each function/module have a single responsibility?
- Is there premature abstraction or over-engineering?
- Are there circular dependencies or tight coupling?

### F. Performance Concerns
- Are there obvious N+1 patterns or unnecessary re-renders?
- Are heavy imports bundled into client components unnecessarily?

---

## Step 5: Assign an Overall Refactor Score

Based on the evaluation above, assign a single **Refactor Urgency Score**:

| Score | Meaning | Action |
|---|---|---|
| **1** | Clean. Follows best practices. | No changes needed. |
| **2** | Minor stylistic issues. | Optional low-priority cleanup. |
| **3** | Notable issues. Could cause bugs or tech debt. | Schedule a refactor pass. |
| **4** | Significant problems. Likely causing real bugs or slowing development. | Refactor soon. |
| **5** | Critical. Unsafe patterns, security issues, or fundamentally broken architecture. | Refactor immediately. |

---

## Step 6: Report Your Findings

Write a structured review using this format:

```
## Review: <filename or system name>
**Score: X/5** — <one-line verdict>

### Issues Found
- **[Severity: High/Medium/Low]** <criterion>: <specific issue with line reference if possible>
- ...

### What's Good
- <what already follows good practices — acknowledge this>

### Recommended Changes
- <concrete, actionable change #1>
- <concrete, actionable change #2>
- ...

### Should we refactor now?
<Yes/No/Optional — with a one-sentence rationale>
```

---

## Step 7: Act on the Review (If Instructed)

If the user says "go ahead" or "fix it":

1. Apply only the changes flagged as **High severity** or required for score 3+ issues.
2. Do **not** rewrite code that scored 1–2 — over-optimization is slop too.
3. After applying changes, re-run: `npx tsc --noEmit` and `npm run lint` to confirm no regressions.

---

## Step 8: Update the Review Log

After completing a review (with or without changes), update [`.agents/skills/code-review/reviewed-files.md`](./reviewed-files.md):

**Format for each entry:**
```md
| `path/to/file.ts` | 3 | 2026-08-24 | ✅ Refactored | Removed `any` types, split god function |
```

---

## Reference: Common Slop Patterns to Flag

These are the most frequent issues in TypeScript / Next.js codebases:

| Pattern | Why it's slop |
|---|---|
| `const x: any = ...` | Throws away type safety |
| `useEffect` for data fetch in App Router | Wrong paradigm; use server components |
| `'use client'` on a root layout | Forces entire subtree to be client-side |
| Empty `catch {}` | Silently hides failures |
| `// @ts-ignore` without explanation | Sweeps real bugs under the rug |
| 200-line components | Violates single responsibility |
| Hardcoded locale strings | Breaks i18n |
| Importing server libs in client files | Runtime crash on client |
| `export default` anonymous arrow fn | Kills stack traces and refactoring tools |
| `console.log` left in production code | Pollutes logs and leaks data |
