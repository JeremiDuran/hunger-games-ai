---
name: accessibility
description: >-
  Use this skill when building or reviewing any interactive UI, form, modal,
  animation, or color decision. Covers WCAG 2.1 AA compliance — ARIA roles,
  keyboard navigation, focus management, color contrast, reduced-motion, and
  screen-reader patterns. Activate when the user mentions a11y, accessibility,
  ARIA, keyboard, screen reader, or contrast.
---

# Accessibility (a11y) Guidelines — WCAG 2.1 AA

This project targets **WCAG 2.1 Level AA** as a minimum. Apply these rules to every component. Non-compliance blocks shipping.

---

## 1. Semantic HTML First

Before reaching for ARIA, ask: *does a native HTML element already provide this behavior?*

```tsx
// ❌ ARIA abuse — reinventing the button
<div role="button" tabIndex={0} onClick={handleClick}>Click me</div>

// ✅ Use native — keyboard, focus, ARIA role all built-in
<button onClick={handleClick}>Click me</button>
```

**Golden rule**: ARIA supplements HTML; it does not replace it. If a native element exists, use it.

### Semantic element reference

| Purpose | Use |
|---------|-----|
| Page regions | `<header>`, `<main>`, `<nav>`, `<footer>`, `<aside>` |
| Navigation | `<nav>` with `aria-label` to distinguish multiple navs |
| Headings | `<h1>` (one per page) → `<h2>` → `<h3>` (never skip levels) |
| Interactive | `<button>` (action), `<a href>` (navigation) |
| Forms | `<label for>` explicitly linked to every `<input>` |
| Data | `<table>` with `<caption>`, `<th scope>` |

---

## 2. Keyboard Navigation

Every interactive feature must be fully operable with keyboard alone.

```tsx
// ❌ Mouse-only — click handler not reachable by keyboard
<div onClick={openModal}>Open</div>

// ✅ Keyboard-accessible — Enter and Space both trigger button
<button onClick={openModal}>Open</button>
```

### Required keyboard behaviors

| Element | Keys |
|---------|------|
| Buttons | `Enter`, `Space` |
| Links | `Enter` |
| Checkboxes | `Space` to toggle |
| Radio groups | Arrow keys to navigate |
| Select/Combobox | Arrow keys, `Enter`, `Escape` |
| Modals | `Escape` to close, tab trap inside |
| Dropdowns | Arrow keys, `Enter`, `Escape` |

### Focus Trapping in Modals

When a modal/dialog opens, keyboard focus **must** be trapped inside it. Use `@base-ui/react Dialog` (already in stack) — it handles this correctly.

```tsx
import { Dialog } from '@base-ui/react';

// Dialog.Root + Dialog.Popup handles focus trap and Escape automatically
<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Trigger asChild>
    <button>Open</button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Popup>
      {/* focus is trapped here */}
      <Dialog.Title>Confirm action</Dialog.Title>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>
```

---

## 3. Focus Management

- **Visible focus ring is mandatory**. Never do `outline: none` without providing an equally visible custom focus style.
- When a modal opens, move focus **into** the modal. When it closes, return focus to the **trigger element**.
- When routing (Next.js `<Link>` navigation), announce the new page to screen readers.

```css
/* globals.css — project-wide focus style */
:focus-visible {
  outline: 2px solid var(--color-focus-ring, #f59e0b);
  outline-offset: 3px;
  border-radius: 3px;
}

/* Only suppress for mouse users, not keyboard */
:focus:not(:focus-visible) {
  outline: none;
}
```

---

## 4. Color Contrast

| Text type | Minimum ratio | Target |
|-----------|---------------|--------|
| Normal text (< 18pt / < 14pt bold) | 4.5:1 | AA |
| Large text (≥ 18pt / ≥ 14pt bold) | 3:1 | AA |
| UI components & focus rings | 3:1 | AA |

**Never convey information by color alone.** Always pair color with a shape, icon, or text label.

```tsx
// ❌ Color-only status
<span className="text-red-500">Error</span>

// ✅ Color + icon + text
<span className="text-red-500 flex items-center gap-1">
  <AlertCircle aria-hidden="true" size={16} />
  Error: field is required
</span>
```

**Tool**: Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or the browser's DevTools accessibility panel to verify.

---

## 5. ARIA Patterns

Only add ARIA attributes that are not already implied by the native element.

```tsx
// ❌ Redundant — <button> already has role="button"
<button role="button">Click</button>

// ✅ Correct — ARIA adds meaning native element lacks
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Live Regions for Dynamic Content

When content updates without a page reload (game events, narrative text, scores), announce it to screen readers:

```tsx
// Polite — waits for user to finish current interaction
<div role="status" aria-live="polite">
  {currentNarrative}
</div>

// Assertive — interrupts immediately (use sparingly — only for errors/alerts)
<div role="alert" aria-live="assertive">
  {criticalError}
</div>
```

### Common ARIA attributes

| Attribute | Use |
|-----------|-----|
| `aria-label` | Visible label is absent or insufficient |
| `aria-labelledby` | Points to another element as the label |
| `aria-describedby` | Points to supplemental description |
| `aria-hidden="true"` | Hides decorative elements from screen readers |
| `aria-expanded` | State of expandable elements (menus, accordions) |
| `aria-disabled` | Communicates disabled state (do not use HTML `disabled` alone on custom elements) |
| `aria-current="page"` | Current page in navigation |

---

## 6. Reduced Motion

Always respect `prefers-reduced-motion`. This is critical for users with vestibular disorders — ignoring it can cause physical harm.

```tsx
// GSAP — check before running animations
import gsap from 'gsap';
import { gsap as gsapCore } from 'gsap';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  gsap.to('.hero', { opacity: 1, y: 0, duration: 0.8 });
} else {
  // Set final state immediately, no animation
  gsap.set('.hero', { opacity: 1, y: 0 });
}
```

```css
/* CSS fallback — always include alongside GSAP */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

For GSAP, use `gsap.matchMedia()` from the **gsap-core** skill which handles this elegantly.

---

## 7. Forms and Inputs

```tsx
// ❌ Placeholder-only label — disappears on type, not accessible
<input type="email" placeholder="Email address" />

// ✅ Explicit label association
<div className="flex flex-col gap-1">
  <label htmlFor="email" className="text-sm font-medium">
    Email address
  </label>
  <input
    id="email"
    type="email"
    autoComplete="email"
    aria-describedby="email-hint"
    aria-invalid={!!errors.email}
    aria-errormessage="email-error"
  />
  <span id="email-hint" className="text-xs text-muted">
    We'll never share your email.
  </span>
  {errors.email && (
    <span id="email-error" role="alert" className="text-xs text-destructive">
      {errors.email}
    </span>
  )}
</div>
```

---

## 8. Images and Media

```tsx
// Decorative images — hide from screen readers
<Image src={divider} alt="" aria-hidden="true" />

// Informative images — describe the content, not the style
<Image src={arena} alt="The Cornucopia arena surrounded by forest at dawn" />

// Icon buttons — always label the action, not the icon
<button aria-label="Close dialog">
  <X aria-hidden="true" />
</button>
```

---

## 9. Skip Navigation

Add a skip link as the **very first element** in `layout.tsx` so keyboard users can bypass the navigation:

```tsx
// src/app/layout.tsx
<body>
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded"
  >
    Skip to main content
  </a>
  <Header />
  <main id="main-content" tabIndex={-1}>
    {children}
  </main>
</body>
```

---

## 10. Accessibility Checklist

Before marking any UI work as done:

- [ ] All interactive elements reachable and operable by keyboard
- [ ] Visible focus ring present on all interactive elements
- [ ] All images have meaningful `alt` text (or `alt=""` if decorative)
- [ ] Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for UI components
- [ ] Information not conveyed by color alone
- [ ] Dynamic content updates announced via `aria-live`
- [ ] Modals trap focus; focus returns to trigger on close
- [ ] `prefers-reduced-motion` respected for all animations
- [ ] Forms: every input has an associated `<label>`
- [ ] Page has one `<h1>`, heading hierarchy is correct
- [ ] Skip navigation link present in layout
- [ ] `lang` attribute set on `<html>` in layout
