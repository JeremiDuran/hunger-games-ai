---
name: web-performance
description: >-
  Use this skill when building new pages, adding third-party libraries, working
  with images/fonts/scripts, or optimizing Core Web Vitals. Covers LCP, CLS,
  INP, bundle size, lazy loading, font strategy, and Next.js 16 performance
  primitives. Activate when the user mentions performance, slow, loading, CWV,
  LCP, CLS, FID, INP, bundle, or optimization.
---

# Web Performance Guidelines — Core Web Vitals & Next.js 16

> [!WARNING]
> **Next.js version caveat** — This skill contains code examples written from training data.
> Before using any Next.js-specific pattern (`next/image`, `next/font`, `next/script`, caching
> options, Suspense conventions), **read the relevant guide in `node_modules/next/dist/docs/`
> first** as instructed by `AGENTS.md`. The performance principles here are stable; the exact
> API may differ in Next.js 16.3.2.

This project targets **green Core Web Vitals** (LCP < 2.5s, CLS < 0.1, INP < 200ms). Apply these rules whenever building or modifying pages, adding dependencies, or handling media.

---

## 1. Core Web Vitals Targets

| Metric | Good | Needs work | Poor |
|--------|------|------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5–4s | > 4s |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1–0.25 | > 0.25 |
| **INP** (Interaction to Next Paint) | < 200ms | 200–500ms | > 500ms |

---

## 2. Images — The Biggest LCP Win

Always use Next.js `<Image>` — never a raw `<img>` tag.

```tsx
import Image from 'next/image';

// ❌ Raw img tag — no optimization, causes CLS, no lazy loading
<img src="/hero.jpg" />

// ✅ Next.js Image — WebP/AVIF, lazy, correct sizing
<Image
  src="/hero.jpg"
  alt="Arena at dawn"
  width={1200}
  height={630}
  priority           // ← Add for above-the-fold images (improves LCP)
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**Rules**:
- Add `priority` to the **LCP image** (the largest visible image on first load).
- Always set `width` and `height` or use `fill` to prevent CLS.
- Use `sizes` to prevent downloading oversized images on mobile.
- For background-style full-bleed images: use `fill` + `className="object-cover"`.

---

## 3. Fonts

Use Next.js `next/font` — it eliminates FOUT (Flash of Unstyled Text) and prevents layout shift from font loading.

```tsx
// src/app/layout.tsx
import { Inter, Cinzel } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['400', '700'],
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

**Never** load fonts with a `<link>` tag in the `<head>` — always use `next/font`.

---

## 4. Script Loading

```tsx
import Script from 'next/script';

// ❌ Raw <script> tag — blocks rendering
<script src="https://example.com/analytics.js" />

// ✅ next/script with appropriate strategy
<Script src="https://example.com/analytics.js" strategy="lazyOnload" />
```

### Script strategies

| Strategy | When to use |
|----------|-------------|
| `beforeInteractive` | Critical: consent banners, polyfills needed before hydration |
| `afterInteractive` (default) | Tag managers, analytics (fires after hydration) |
| `lazyOnload` | Low-priority: chat widgets, social embeds |
| `worker` | Offload to a Web Worker (requires experimental config) |

---

## 5. Code Splitting & Lazy Loading

Dynamic import heavy components — especially those not visible on first render:

```tsx
import dynamic from 'next/dynamic';

// ❌ Always imported — increases initial bundle
import GameSimulator from '@/components/GameSimulator';

// ✅ Only loaded when needed
const GameSimulator = dynamic(() => import('@/components/GameSimulator'), {
  loading: () => <div className="animate-pulse h-64 bg-muted rounded" />,
  ssr: false, // for components that use browser APIs
});
```

**When to use `dynamic`**:
- Components only shown after user interaction (modals, tabs, accordions)
- Components that use `window`/`document` directly
- Heavy third-party components (charts, editors, maps)
- Components > ~50KB

---

## 6. Bundle Size Discipline

Before `npm install`, check bundle size at [bundlephobia.com](https://bundlephobia.com).

**Check current bundle**:
```bash
npm run build && npx @next/bundle-analyzer
```

**Rules**:
- Don't import entire libraries when you only need one function:

```ts
// ❌ Imports all of lodash (~70KB)
import _ from 'lodash';
const clamp = _.clamp(val, 0, 100);

// ✅ Import only what you need
import clamp from 'lodash/clamp';
// Or better — use native or gsap.utils.clamp()
```

- Use **tree-shakeable** imports. Check that your `tsconfig.json` has `"moduleResolution": "bundler"`.
- Prefer packages that are **ESM-only** with named exports.

---

## 7. Streaming & Suspense (Next.js App Router)

Use Suspense to stream content progressively instead of blocking the entire page on slow data:

```tsx
// ❌ Waterfall — entire page waits for all data
export default async function Page() {
  const [tributes, events] = await Promise.all([getTributes(), getEvents()]);
  return <GameBoard tributes={tributes} events={events} />;
}

// ✅ Stream independently — fast data shows immediately
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <Suspense fallback={<TributesSkeleton />}>
        <TributesList />  {/* async server component */}
      </Suspense>
      <Suspense fallback={<EventsFeedSkeleton />}>
        <EventsFeed />    {/* async server component */}
      </Suspense>
    </div>
  );
}
```

---

## 8. Preventing Layout Shift (CLS)

Layout shift happens when elements move after the page has rendered. Sources to eliminate:

| Cause | Fix |
|-------|-----|
| Images without dimensions | Always set `width`/`height` or use `fill` |
| Fonts loading late | Use `next/font` with `display: swap` |
| Dynamic content inserted above existing content | Reserve space with skeleton/placeholder |
| Ads or embeds without fixed size | Set explicit `width` and `height` on the container |
| `<Suspense>` fallback smaller than actual content | Make skeleton the same height as the real content |

---

## 9. Caching Strategy

```ts
// Default — cached indefinitely (static)
const data = await fetch('/api/events');

// Revalidate every 60 seconds
const data = await fetch('/api/leaderboard', {
  next: { revalidate: 60 },
});

// Always fresh — opt out of caching
const data = await fetch('/api/game-state', {
  cache: 'no-store',
});
```

**Rules**:
- Game state (live simulation) → `cache: 'no-store'`
- Leaderboard → `revalidate: 60` (or use `revalidateTag`)
- Static content (lore, rules) → default (infinite cache)

---

## 10. Performance Checklist

Before marking any page as done:

- [ ] LCP image has `priority` prop
- [ ] All images use `next/image` with `width`/`height` or `fill`
- [ ] Fonts loaded via `next/font`, not `<link>`
- [ ] No `<script>` tags — use `next/script` with correct `strategy`
- [ ] Heavy components use `dynamic()` import
- [ ] Suspense boundaries around async server components
- [ ] No unnecessary client-side bundle imports
- [ ] `cache` strategy chosen intentionally for each `fetch`
- [ ] Skeleton/placeholder heights match actual content to avoid CLS
