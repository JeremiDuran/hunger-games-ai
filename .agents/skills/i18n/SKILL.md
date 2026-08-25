---
name: i18n
description: >-
  Use this skill when adding user-facing strings, building new pages or
  components, or working with locale routing, date/number formatting, or
  pluralization. Covers internationalization with next-intl in Next.js 16 App
  Router. Activate when the user mentions i18n, translations, locales, language,
  next-intl, or any hardcoded user-facing string.
---

# i18n with next-intl — Next.js 16 App Router

> [!WARNING]
> **Next.js version caveat** — This skill contains code examples written from training data.
> Before using any Next.js-specific pattern (file conventions, config, API signatures), **read the
> relevant guide in `node_modules/next/dist/docs/` first** as instructed by `AGENTS.md`.
> The principles here are stable; the exact API may differ in Next.js 16.3.2.

This project uses **next-intl** for internationalization. **No user-facing string may ever be hardcoded** in JSX — every visible string must go through the translation system.

> **Stack status**: `next-intl` is planned but may not be installed yet. Check `package.json`. If missing, install it first:
> ```bash
> npm install next-intl
> ```

---

## 1. Project Conventions

- Locale files live in `src/messages/<locale>.json` (e.g. `src/messages/en.json`, `src/messages/es.json`)
- Supported locales are defined in `src/i18n/routing.ts`
- Locale-prefixed routes live under `src/app/[locale]/`
- The default locale is `en`
- RTL locales (Arabic, Hebrew, etc.) require a `dir="rtl"` attribute on `<html>`

---

## 2. Installation & Setup

### Install

```bash
npm install next-intl
```

### `src/i18n/routing.ts` — Define locales

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'fr', 'pt'],
  defaultLocale: 'en',
  // optional: remove locale prefix for the default locale
  localePrefix: 'as-needed',
});
```

### `src/i18n/request.ts` — Server-side config

```ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate the locale — fall back to default if invalid
  if (!locale || !routing.locales.includes(locale as never)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### `next.config.ts` — Plugin

```ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl({
  // ...your existing Next.js config
});
```

### `src/middleware.ts` — Locale routing

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

### Move app routes under `[locale]`

```
src/app/
  [locale]/
    layout.tsx   ← sets <html lang>, loads messages
    page.tsx
    ...
```

### `src/app/[locale]/layout.tsx`

```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as never)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

---

## 3. Message File Structure

Organize messages by feature/page namespace, not a flat list:

```json
// src/messages/en.json
{
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try again",
    "close": "Close"
  },
  "nav": {
    "home": "Home",
    "play": "Play",
    "leaderboard": "Leaderboard",
    "profile": "Profile"
  },
  "game": {
    "start": "Start Game",
    "tribute": {
      "name": "{name}",
      "district": "District {number}",
      "status": "{name} has {status, select, alive {survived} dead {fallen} other {unknown status}}"
    },
    "event": {
      "combat": "{attacker} attacked {defender}",
      "alliance": "{tribute1} and {tribute2} formed an alliance"
    }
  },
  "home": {
    "hero": {
      "title": "May the odds be ever in your favor",
      "subtitle": "An AI-powered Hunger Games simulation",
      "cta": "Enter the Arena"
    }
  }
}
```

---

## 4. Using Translations

### Server Components (preferred)

```tsx
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('home.hero');

  return (
    <section>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      <button>{t('cta')}</button>
    </section>
  );
}
```

### Client Components

```tsx
'use client';
import { useTranslations } from 'next-intl';

export function GameStatus({ tributeName }: { tributeName: string }) {
  const t = useTranslations('game.tribute');

  return <span>{t('district', { number: 12 })}</span>;
}
```

### Pluralization

```json
// en.json
{
  "game": {
    "tributes": "{count, plural, one {# tribute remaining} other {# tributes remaining}}"
  }
}
```

```tsx
const t = useTranslations('game');
<p>{t('tributes', { count: tributesLeft })}</p>
// → "1 tribute remaining" or "3 tributes remaining"
```

---

## 5. Navigation with Locales

Use next-intl's `Link` and `useRouter` instead of Next.js's native versions so the locale prefix is handled automatically:

```tsx
import { Link, useRouter, usePathname } from '@/i18n/navigation';

// In src/i18n/navigation.ts:
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

```tsx
// ❌ Will lose locale prefix
import Link from 'next/link';
<Link href="/play">Play</Link>

// ✅ Locale-aware
import { Link } from '@/i18n/navigation';
<Link href="/play">Play</Link>
// → /en/play, /es/play, etc.
```

---

## 6. Date, Number & Currency Formatting

**Never** use `toLocaleDateString()` or `Intl` directly. Use next-intl's `useFormatter` or `getFormatter` so formatting respects the active locale.

```tsx
import { useFormatter } from 'next-intl';

function ScoreDisplay({ score, date }: { score: number; date: Date }) {
  const format = useFormatter();

  return (
    <div>
      <span>{format.number(score, { style: 'decimal' })}</span>
      <time>{format.dateTime(date, { dateStyle: 'long' })}</time>
    </div>
  );
}
```

---

## 7. Rules

- **No hardcoded strings in JSX.** Any text a user sees must come from a message file.
- **Namespace everything.** Use dot-notation namespaces (`home.hero.title`) — never a flat global key.
- **Message keys are descriptive** — `game.tribute.district`, not `d` or `district1`.
- **ICU message format** — use `{variable}`, `{count, plural, ...}`, `{value, select, ...}` for dynamic content.
- **RTL support** — always use logical CSS properties (`padding-inline-start` not `padding-left`; `margin-inline-end` not `margin-right`) so layout flips correctly for RTL locales.
- **Don't concatenate strings** — always use interpolation: `t('greeting', { name })` not `t('hello') + ' ' + name`.
- **Type-safe messages** — Use next-intl's TypeScript integration so missing keys are caught at build time.

---

## 8. TypeScript Integration

Add type-safety for all message keys:

```ts
// src/types/global.d.ts or src/i18n/types.ts
import en from '../messages/en.json';

type Messages = typeof en;

declare global {
  interface IntlMessages extends Messages {}
}
```

After this, `t('nonExistentKey')` will be a TypeScript error.

---

## 9. i18n Checklist

Before marking any UI work as done:

- [ ] No hardcoded user-facing strings in JSX
- [ ] All new strings added to `src/messages/en.json` (and matching keys added to all other locale files)
- [ ] Strings use ICU format for pluralization and variables
- [ ] Navigation uses locale-aware `Link` from `@/i18n/navigation`
- [ ] Dates/numbers/currencies formatted with `useFormatter` / `getFormatter`
- [ ] Layout has correct `lang` attribute
- [ ] RTL locales: CSS uses logical properties (`inline-start`, `inline-end`)
- [ ] New translation keys are namespaced (not flat globals)
