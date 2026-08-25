---
name: responsive-design
description: >-
  Use this skill when building or reviewing any UI component, page layout, or
  visual feature. Covers modern responsive design — mobile-first Tailwind
  breakpoints, fluid typography, container queries, spacing scales, and
  touch-friendly sizing. Activate when the user asks about layout, breakpoints,
  responsive, mobile, tablet, or grid.
---

# Responsive Design Guidelines

> [!NOTE]
> Most of this skill is CSS/Tailwind — stable across frameworks. The **Images and Media**
> section uses `next/image` API. Before using those patterns, verify against
> `node_modules/next/dist/docs/` as instructed by `AGENTS.md`.

Apply these rules to **every** UI component and page in this project. This project uses **Tailwind CSS v4**, **Next.js 16 App Router**, and targets web, mobile-web, and future PWA platforms.

---

## 1. Mobile-First Always

Write styles for the **smallest screen first**, then use breakpoint prefixes to scale up. Never write desktop-first CSS and then override it for mobile — that produces bloated specificity battles.

```tsx
// ❌ Slop — desktop-first, overrides break mobile intent
<div className="flex-row md:flex-col sm:flex-col">

// ✅ Good — mobile-first, scales up
<div className="flex flex-col md:flex-row">
```

### Tailwind v4 Breakpoint Reference

| Prefix | Min-width | Target |
|--------|-----------|--------|
| (none) | 0px | Mobile portrait |
| `sm:`  | 640px | Mobile landscape / small tablet |
| `md:`  | 768px | Tablet |
| `lg:`  | 1024px | Desktop |
| `xl:`  | 1280px | Wide desktop |
| `2xl:` | 1536px | Ultra-wide |

---

## 2. Fluid Typography

Avoid fixed `text-sm`, `text-xl` at specific breakpoints — use **`clamp()`** via Tailwind's `fluid` utilities or CSS custom properties for typography that scales smoothly without jumps.

```css
/* globals.css — fluid type scale tokens */
:root {
  --text-body: clamp(0.875rem, 1.5vw, 1rem);       /* 14px → 16px */
  --text-lead: clamp(1rem, 2vw, 1.25rem);           /* 16px → 20px */
  --text-heading: clamp(1.5rem, 4vw, 2.5rem);       /* 24px → 40px */
  --text-display: clamp(2rem, 6vw, 4rem);           /* 32px → 64px */
}
```

```tsx
// Use semantic size tokens, not raw Tailwind text utilities for headings
<h1 style={{ fontSize: 'var(--text-display)' }}>Welcome</h1>
```

---

## 3. Container Queries Over Media Queries for Components

For **components** (cards, sidebars, modals), prefer **container queries** so they respond to their parent, not the viewport. This makes components truly portable.

```tsx
// Wrap the component root
<div className="@container">
  <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-4">
    {/* cards */}
  </div>
</div>
```

> **Rule**: Use **viewport breakpoints** (`md:`, `lg:`) for **page-level layout**.  
> Use **container queries** (`@md:`, `@lg:`) for **reusable components**.

---

## 4. Touch-Friendly Sizing

All interactive elements must be at minimum **44×44px** tap targets (WCAG 2.5.5). This is a legal accessibility requirement in many markets.

```tsx
// ❌ Too small — 32px icon button
<button className="p-1">
  <Icon size={16} />
</button>

// ✅ Good — 44px+ target with visual centering
<button className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center">
  <Icon size={20} />
</button>
```

---

## 5. Spacing Scale Discipline

Use the **Tailwind spacing scale** consistently. Never use arbitrary pixel values for spacing unless it's a one-off layout hack with a comment.

```tsx
// ❌ Slop — arbitrary magic numbers
<div style={{ margin: '13px', padding: '7px' }}>

// ✅ Good — on-scale spacing
<div className="m-3 p-2">          {/* 12px margin, 8px padding */}
<div className="m-3.5 p-1.5">     {/* 14px, 6px */}
```

---

## 6. Layout Primitives

Always use **flex** or **grid** — never float or table for layout.

| Use case | Primitive |
|----------|-----------|
| Single axis (nav, rows, columns) | `flex` |
| Two-dimensional (cards, dashboards) | `grid` |
| Centering a single element | `grid place-items-center` |
| Even-width columns | `grid grid-cols-{n}` |
| Auto-fit responsive grid | `grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))]` |

---

## 7. Safe Area Insets (iOS/PWA)

For any UI that touches screen edges (navbars, FABs, bottom sheets), account for device safe areas:

```css
/* globals.css */
.safe-top    { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-left   { padding-left: env(safe-area-inset-left); }
.safe-right  { padding-right: env(safe-area-inset-right); }
```

```tsx
<nav className="safe-top fixed top-0 w-full">...</nav>
<footer className="safe-bottom fixed bottom-0 w-full">...</footer>
```

---

## 8. Images and Media

- Always specify `width` and `height` on `<Image>` (Next.js) to prevent layout shift (CLS).
- Use `sizes` prop to hint the browser for responsive loading:

```tsx
<Image
  src={heroImg}
  alt="Hunger Games arena"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
  priority={isAboveFold}
/>
```

- Prefer **SVG** for icons and decorative vectors.
- Use **WebP** or **AVIF** for photos (Next.js `<Image>` does this automatically).

---

## 9. Responsive Checklist

Before marking any UI work as done, verify:

- [ ] Tested at 375px (iPhone SE), 768px (iPad), 1280px (desktop)
- [ ] No horizontal scroll at any viewport width
- [ ] All interactive elements ≥ 44×44px tap target
- [ ] Text remains readable (≥ 16px body, ≥ 4.5:1 contrast ratio)
- [ ] Images have `width`/`height` or `fill` + `sizes` set
- [ ] Sticky/fixed elements account for safe area insets
- [ ] No layout shifts on load (CLS < 0.1)
