---
name: react-no-unnecessary-effects
description: Use whenever writing, reviewing, or refactoring React components that contain (or might need) useEffect — especially when an Effect only sets state based on props/state, runs on mount to compute a derived value, handles a specific user interaction, or notifies a parent of a change. Also use when the user asks "do I need an Effect here?", reports double-fetches/double-renders/flicker/race conditions, wants to fix redundant state, or wants a React code review. Encodes the official React team guidance ("You Might Not Need an Effect") for replacing unnecessary useEffect calls with calculation-during-render, useMemo, key resets, event-handler logic, or useSyncExternalStore. Push to apply this skill any time a useEffect appears in code Claude is writing or reviewing, not just when the user explicitly asks about Effects.
---

# You Might Not Need an Effect

Effects are an escape hatch for synchronizing a component with an external
system (a non-React widget, the network, the browser DOM, a subscription).
If there's no external system involved, the component almost certainly
doesn't need `useEffect`. Apply this skill any time you're about to write a
`useEffect`, or you're reviewing code that has one — walk through the
decision tree below before accepting it.

## Quick diagnostic

Ask: **"Why does this code need to run — because the component was
*displayed*, or because of something else (props/state changed, the user
did something, another component needs to know)?"**

- Only "because it was displayed, to sync with something outside React"
  → an Effect is legitimate.
- Anything else → there is almost always a better pattern. Use the table
  below to find it.

| Symptom in the code | Don't do this | Do this instead |
|---|---|---|
| `useEffect` that just calls `setX(f(props/state))` on every relevant change | redundant state + Effect | Calculate the value directly in the component body during render |
| The above, but the calculation is genuinely slow (looping over thousands of items, profiled as slow) | recomputing on every render, or storing in an Effect-driven state var | Wrap the calculation in `useMemo(() => f(...), [deps])` |
| `useEffect(() => setState(initial), [propId])` to reset *all* state when a prop (e.g. `userId`) changes | resetting fields one by one in an Effect | Give the subtree a `key={propId}` so React remounts it and resets state automatically |
| `useEffect` that resets/adjusts *one* field of state when a prop changes | Effect-driven partial reset | During render: `if (x !== prev) { setPrev(x); setSelection(null); }` — or better, store an ID and derive the value (`items.find(i => i.id === selectedId) ?? null`) instead of storing the object |
| Same logic duplicated across multiple event handlers, "so let's Effect it" | `useEffect` keyed on some derived condition (e.g. `product.isInCart`) that fires the shared logic | Extract a plain function and call it from each event handler |
| POST/mutation fired from an Effect after `setState` in a handler (two-step: handler sets state, Effect notices and POSTs) | `useEffect(() => { if (x) post(...) }, [x])` | Call the POST directly in the event handler |
| Chain of Effects, each `useEffect` watching the state the previous one just set (state ping-pong) | `card` Effect → `goldCardCount` Effect → `round` Effect → `isGameOver` Effect | Compute what you can during render (`const isGameOver = round > 5`) and compute all the next state together inside the one event handler that started the chain |
| `useEffect(() => { init() }, [])` in the root/app component meant to run once ever | assuming `[]` means "once" (it runs twice in Strict Mode dev, and on every remount) | Module-level `let didInit = false` guard inside the Effect, or run the init code at module top level / app entry point instead of in a component |
| Child component `useEffect(() => onFetched(data), [data])` to hand data up to its parent | child pushes data to parent via an Effect | Lift the fetch (or state) up: have the parent fetch/own the data and pass it *down* as a prop |
| `useEffect` that notifies a parent when internal state changes | notifying parent in a separate render pass via Effect | Call `onChange` in the same event handler that calls `setState`, or better, lift the state up and make the component fully controlled |
| `useEffect` that subscribes/unsubscribes to `window`, a browser API, or a third-party store and mirrors it into `useState` | manual subscribe/unsubscribe/setState in an Effect | Use `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` instead |
| `useEffect` that fetches data based on props/query and calls `setState` with the result, with no cleanup | fetch-then-setState with no guard against out-of-order responses | Keep it in an Effect (this one is legitimate — it's synchronizing with the network) but add a cleanup flag (`let ignore = false; ... return () => { ignore = true }`) to avoid race conditions, or extract into a custom hook (`useData(url)`). Prefer a framework's built-in data-fetching layer over raw Effects when one is available. |

## The two cases that never need an Effect

1. **Transforming data for rendering.** If you can compute it from the
   current props/state, do it inline in the function body (or `useMemo`
   if expensive) — not in an Effect that calls `setState`. An Effect that
   sets state which is itself just a function of other state/props causes
   an extra wasted render pass every time.
2. **Handling a user event.** If the code's true trigger is "the user
   clicked/typed/submitted," put it in the event handler, not an Effect.
   By the time an Effect runs, you've lost *which* interaction caused it —
   which also tends to cause bugs (e.g. a notification that re-fires on
   page refresh because the Effect only sees state, not the click that
   produced it).

## When reviewing a PR / diff

For every `useEffect` you encounter:
1. Identify what it depends on (its dependency array) and what it does
   inside.
2. Ask the diagnostic question above.
3. If it matches a row in the table, propose the replacement and explain
   briefly *why* (fewer render passes, no stale-then-corrected flash, no
   risk of the child/parent update ordering bug, etc.).
4. Only leave a `useEffect` in place if it's genuinely synchronizing with
   something outside React (DOM/browser API, third-party widget, network
   fetch with cleanup, subscriptions not covered by
   `useSyncExternalStore`).

## When writing new React code

Default to *not* reaching for `useEffect`. Before adding one, explicitly
check: is there an external system here? If not, calculate during render,
use `useMemo`, use a `key`, or put the logic in the event handler instead.
Mention to the user when React Compiler is in use, since it can
auto-memoize expensive calculations and reduce the need for manual
`useMemo` too.

## Source

Full writeup with runnable before/after examples:
https://react.dev/learn/you-might-not-need-an-effect
