# Story 1.4: App Shell, Routing & Navigation

Status: done

## Story

As a visitor,
I want to navigate between site sections via a persistent navbar and access a footer with useful links,
so that I can explore the site freely from any scroll position.

## Acceptance Criteria

1. **Given** the route tree is configured **When** `App.tsx` is inspected **Then** routes exist: `/` → `Home.tsx`, `/privacy` → `Privacy.tsx`, `/admin` → `AdminLayout.tsx` (shell only); all public section components are lazy-loaded via `React.lazy` with `Suspense` + `SectionSkeleton` fallbacks

2. **Given** the Navbar renders at desktop width (> 1024px) **When** inspected **Then** Navbar is sticky (`position: fixed; top: 0`), full-width, dark navy bg (`#0D0D3A` = `bg-brand-navy`); logo renders left; nav links render center; LanguageSwitcher + primary Demo CTA (`GradientButton size="sm"`) render right

3. **Given** a visitor is on mobile (< 768px) **When** they tap the hamburger icon **Then** a full-screen overlay menu appears with all nav links; clicking any link or pressing Escape closes the overlay; menu items have ≥ 44×44px touch targets

4. **Given** `Home.tsx` renders **When** page loads **Then** sections render in approved scroll order: Hero → SyncRevenue → Comparison → Security → ClientReferences → DemoScheduler placeholder → Contact placeholder; each section wrapped in Suspense + SectionSkeleton; placeholder sections render as empty shell divs

5. **Given** the Footer renders **When** inspected **Then** it includes company address, copyright notice, navigation links, LanguageSwitcher, and Privacy Policy link to `/privacy`; footer is not sticky

6. **Given** a keyboard user loads the page **When** they press Tab before any other interaction **Then** the first focusable element is a "Skip to main content" link; it becomes visible on focus and moves focus to the `<main>` element on activation

7. **Given** semantic HTML structure **When** the DOM is inspected **Then** page uses `<nav>`, `<main>`, `<section>`, `<footer>` elements correctly; all sections have appropriate heading hierarchy (h1 in hero, h2 in sections)

## Tasks / Subtasks

- [x] Task 0: Update `src/App.tsx` — full route tree (AC: 1)
  - [x] Import Home, Privacy, AdminLayout as regular imports (pages are not lazy-loaded at route level)
  - [x] Import Login, Dashboard, Leads, Team (admin pages) as regular imports
  - [x] Add `<Routes>`: `/` → `<Home />`, `/privacy` → `<Privacy />`, `/admin` → `<AdminLayout />` with nested admin routes
  - [x] Wrap content area in `<main id="main-content">` so skip link target exists
  - [x] Add skip link as first element before `<nav>` (see Dev Notes for pattern)
  - [x] `npm run typecheck` — zero errors

- [x] Task 1: Implement `src/components/layout/Navbar.tsx` (AC: 2, 3, 6, 7)
  - [x] Replace `export default function Navbar() { return <nav /> }` entirely
  - [x] Sticky: `fixed top-0 inset-x-0 z-50 bg-brand-navy` (full width, highest z-index)
  - [x] Max content width: `max-w-[1280px] mx-auto` inner container
  - [x] Desktop (lg:): logo left, nav anchor links center, LanguageSwitcher + GradientButton right (all visible)
  - [x] Tablet/Mobile (< lg:): logo left, hamburger button right; center links hidden
  - [x] Nav links are `<a>` anchors (not React Router Links) — smooth scroll to section IDs on homepage
  - [x] Hamburger button: `aria-label="Open menu"` / `aria-label="Close menu"`, `aria-expanded={isOpen}`, ≥ 44×44px hit target
  - [x] Mobile overlay: full-screen `fixed inset-0 z-40 bg-brand-navy flex flex-col`; show/hide via `isOpen` state
  - [x] Overlay closes on: any link click, Escape key press (useEffect + keydown listener)
  - [x] LanguageSwitcher from `@/i18n/LanguageSwitcher` — reuse existing component, do NOT duplicate locale logic
  - [x] Demo CTA: `<GradientButton size="sm">` with `t('nav.demo')` label; links to `#demo-scheduler`
  - [x] Nav link labels from i18n: `t('nav.home')`, `t('nav.contact')` — NOT `nav.demo` (that's the CTA button)
  - [x] Create `src/components/layout/Navbar.test.tsx`: hamburger toggle test; Escape closes; aria-expanded changes (see Dev Notes)
  - [x] `npm run test:run` — all tests pass

- [x] Task 2: Implement `src/components/layout/Footer.tsx` (AC: 5, 7)
  - [x] Replace `export default function Footer() { return <footer /> }` entirely
  - [x] Use `<footer>` element with `bg-brand-navy text-brand-muted`
  - [x] Max content width: `max-w-[1280px] mx-auto` inner container
  - [x] Company name + address: "Sync Sirius, Inc." (static, not i18n)
  - [x] Copyright: "© 2026 Sync Sirius, Inc. All rights reserved." (static)
  - [x] Nav links: anchor `<a>` links to `#hero`, `#contact` — reuse same `t('nav.home')`, `t('nav.contact')` keys
  - [x] Privacy Policy: `<Link to="/privacy">{t('nav.privacy')}</Link>` — React Router Link (IS a route)
  - [x] LanguageSwitcher: include `<LanguageSwitcher />` from `@/i18n/LanguageSwitcher`
  - [x] Footer NOT sticky (default block flow)
  - [x] `npm run typecheck` — zero errors

- [x] Task 3: Implement `src/pages/Home.tsx` — section orchestrator (AC: 4, 7)
  - [x] Replace `export default function Home() { return <main /> }` entirely
  - [x] Lazy-import ALL 7 sections via `React.lazy(() => import('@/components/sections/...'))` — see Dev Notes for exact order
  - [x] Render as: Hero → SyncRevenue → Comparison → Security → ClientReferences → DemoScheduler → Contact
  - [x] Each section: `<Suspense fallback={<SectionSkeleton className="min-h-[400px]" label="Loading section" />}><SectionName /></Suspense>`
  - [x] DemoScheduler and Contact are existing stubs that render `<section id="..." />` — do NOT implement their content in this story
  - [x] Do NOT add Services or Team to Home.tsx — stories 1.6 and 1.8 will handle them
  - [x] Import `SectionSkeleton` from `@/components/sections/SectionSkeleton`
  - [x] `npm run typecheck` — zero errors

- [x] Task 4: Implement `src/pages/Privacy.tsx` — i18n-driven (AC: 1, 7)
  - [x] Replace `export default function Privacy() { return <main /> }` entirely
  - [x] Use `<main>` with `bg-brand-navy text-white min-h-screen`
  - [x] Render all `privacy.*` i18n keys: `title` (h1), `lastUpdated` (p), `intro` (p)
  - [x] 5 sections: `dataCollection`, `dataUse`, `dataRetention`, `gdsData`, `contact` — each with `.title` (h2) + `.body` (p)
  - [x] Use `useTranslation()` from `react-i18next` — pattern: `const { t } = useTranslation()`
  - [x] `npm run typecheck` — zero errors

- [x] Task 5: Implement `src/components/layout/AdminLayout.tsx` — shell only (AC: 1)
  - [x] Replace `export default function AdminLayout() { return <div /> }` entirely
  - [x] Import `Outlet` from `react-router-dom`
  - [x] Render: `<div className="min-h-screen bg-gray-950 text-white"><Outlet /></div>`
  - [x] No auth guard — that is explicitly deferred to a future epic
  - [x] `npm run typecheck` — zero errors

- [x] Task 6: Add smooth scroll + verify semantic structure (AC: 6, 7)
  - [x] Add to `src/index.css` under `@layer base`: `html { scroll-behavior: smooth; }`
  - [x] Verify skip link is the first focusable element in the rendered DOM (before Navbar)
  - [x] Verify `<main id="main-content">` target exists (added in Task 0)

- [x] Task 7: Typecheck + test + build + browser verification (AC: all)
  - [x] `npm run typecheck` — zero TypeScript errors
  - [x] `npm run test:run` — all tests pass, no regressions (15 tests: 12 existing + 3 new Navbar tests)
  - [x] `npm run build` — clean build, 7 lazy section chunks
  - [x] Start dev server (`npm run dev`); verified HTML response on localhost:5175

### Review Findings

- [x] [Review][Patch] Invalid HTML: `<a>` wraps `<button>` inside GradientButton — replaced with `onClick` handler on GradientButton [src/components/layout/Navbar.tsx]
- [x] [Review][Patch] Unused import: `cn` imported but never used — was already absent in final implementation [src/components/layout/Navbar.tsx]
- [x] [Review][Patch] Missing `/admin` index route — added `<Route index element={<Navigate to="login" replace />} />` [src/App.tsx]
- [x] [Review][Patch] Copyright year hardcoded `2026` — replaced with `new Date().getFullYear()` [src/components/layout/Footer.tsx]
- [x] [Review][Patch] No body scroll lock when mobile overlay open — added `document.body.style.overflow` useEffect [src/components/layout/Navbar.tsx]
- [x] [Review][Patch] i18n `t()` calls return raw key string if translation missing — added `defaultValue` param to all `t()` calls [src/pages/Privacy.tsx]
- [x] [Review][Patch] No `<ErrorBoundary>` around lazy-loaded sections — created `src/components/ErrorBoundary.tsx`, wrapped all 7 sections [src/pages/Home.tsx]
- [x] [Review][Patch] No test for mobile nav link click closing overlay — added 4th Navbar test; 16 tests total pass [src/components/layout/Navbar.test.tsx]
- [x] [Review][Patch] SVG hamburger/X icons missing `<title>` element — added `<title>` inside both SVGs [src/components/layout/Navbar.tsx]
- [x] [Review][Patch] `window.addEventListener` with no `typeof window === 'undefined'` guard — added SSR guard to keydown useEffect [src/components/layout/Navbar.tsx]
- [x] [Review][Defer] `<a href="/#hero">` from non-homepage triggers full page nav — by-design per spec constraint, defer SPA-aware section nav to future story [src/components/layout/Navbar.tsx, src/components/layout/Footer.tsx]

### Review Findings (Re-review 2026-05-14)

- [x] [Review][Patch] Skip link scrolls target behind fixed navbar — add `scroll-mt-16` to `<main id="main-content">` [src/App.tsx:22]
- [x] [Review][Patch] ErrorBoundary missing `componentDidCatch` — add error logging method [src/components/ErrorBoundary.tsx:12]
- [x] [Review][Patch] `scroll-behavior: smooth` no `prefers-reduced-motion` guard — violates WCAG 2.3.3; wrap in `@media (prefers-reduced-motion: no-preference)` [src/index.css:8]
- [x] [Review][Patch] SVG `aria-hidden="true"` contradicts internal `<title>` — remove `<title>` elements (button `aria-label` already handles it) [src/components/layout/Navbar.tsx:62,67]
- [x] [Review][Patch] Hamburger button redundant `aria-label` + `sr-only` `<span>` — screen reader hears label twice; remove `<span className="sr-only">` [src/components/layout/Navbar.tsx:56]
- [x] [Review][Patch] Body scroll lock cleanup unconditionally sets `overflow: ''` — save and restore previous `document.body.style.overflow` value [src/components/layout/Navbar.tsx:24-30]
- [x] [Review][Patch] Mobile overlay open + viewport resize to ≥1024px leaves `isOpen` stuck — add `matchMedia('(min-width: 1024px)')` listener to close overlay [src/components/layout/Navbar.tsx]
- [x] [Review][Patch] Mobile overlay no focus management — auto-focus first link on open, return focus to hamburger on close [src/components/layout/Navbar.tsx]
- [x] [Review][Patch] Mobile overlay no focus trap — Tab key escapes to elements behind overlay; add simple `onKeyDown` focus-looping handler [src/components/layout/Navbar.tsx:65]
- [x] [Review][Patch] No root-level ErrorBoundary — if Navbar/Footer/route render throws, white screen; wrap `<Routes>` in `<ErrorBoundary>` [src/App.tsx:24-31]
- [x] [Review][Patch] No 404 catch-all route — undefined paths render empty page; add `<Route path="*" element={<NotFound />} />` [src/App.tsx]
- [x] [Review][Patch] `handleDemoCta` fallback does full page reload via `window.location.href` — use `window.location.hash = '#demo-scheduler'` to avoid losing client state [src/components/layout/Navbar.tsx:34-40]
- [x] [Review][Patch] Privacy body `defaultValue: ''` renders blank paragraphs when keys missing — use meaningful English fallback text [src/pages/Privacy.tsx:14,20]
- [x] [Review][Patch] Privacy section title `defaultValue: section` shows raw keys like "dataCollection" — use human-readable defaults [src/pages/Privacy.tsx:19]
- [x] [Review][Patch] AdminLayout uses `bg-gray-950` instead of `bg-brand-navy` — inconsistent brand token with all other dark-bg components [src/components/layout/AdminLayout.tsx:5]
- [x] [Review][Patch] Footer address block uses `<div>` instead of semantic `<address>` element [src/components/layout/Footer.tsx:13-15]
- [x] [Review][Patch] Navbar test fragile DOM-order assumption — `homeLinks[homeLinks.length - 1]` breaks if link order changes; use `within()` to scope query to overlay [src/components/layout/Navbar.test.tsx:37]
- [x] [Review][Patch] Mobile overlay uses plain `<div>` without `role="navigation"` — screen reader users cannot jump to navigation landmark [src/components/layout/Navbar.tsx:65]
- [x] [Review][Defer] ErrorBoundary no recovery path (no retry button) — enhancement, outside current story scope [src/components/ErrorBoundary.tsx]
- [x] [Review][Defer] No scroll restoration on SPA route change — pre-existing, not introduced by this story
- [x] [Review][Defer] Navbar test imports `@/i18n` as side-effect — existing pattern used by all tests, not story-specific [src/components/layout/Navbar.test.tsx:6]
- [x] [Review][Defer] ErrorBoundary fallback "Failed to load section." hardcoded English — requires class→function refactor for `useTranslation`; error-only path, low exposure [src/components/ErrorBoundary.tsx:24]
- [x] [Review][Dismiss] Footer `<a>` vs `<Link>` — spec explicitly requires `<a>` for in-page anchors; already captured in prior deferred-work entry
- [x] [Review][Dismiss] SSR guards `typeof window/document === 'undefined'` — harmless defensive code, not a defect
- [x] [Review][Dismiss] Footer address/copyright hardcoded English — spec Dev Notes explicit: "static, not i18n"
- [x] [Review][Dismiss] Admin route tree beyond "shell only" — tasks explicitly require nested admin routes with stub pages
- [x] [Review][Dismiss] Section stubs have no headings — anti-pattern "Don't implement section content" takes precedence
- [x] [Review][Dismiss] aria-labels/SVG titles/SectionSkeleton labels hardcoded — user decision: treat as technical metadata, not content i18n
- [x] [Review][Dismiss] Skip link text "Skip to main content" — user decision: a11y metadata per D1 resolution

## Dev Notes

### Critical: File States — What Exists vs What to Replace

| File | Current State | Action |
|------|--------------|--------|
| `src/App.tsx` | Stub with single `/` route + `<div>Hello</div>` | REPLACE ENTIRELY |
| `src/components/layout/Navbar.tsx` | `return <nav />` | REPLACE ENTIRELY |
| `src/components/layout/Footer.tsx` | `return <footer />` | REPLACE ENTIRELY |
| `src/components/layout/AdminLayout.tsx` | `return <div />` | REPLACE ENTIRELY |
| `src/pages/Home.tsx` | `return <main />` | REPLACE ENTIRELY |
| `src/pages/Privacy.tsx` | `return <main />` | REPLACE ENTIRELY |
| `src/index.css` | No scroll-behavior | ADD one line in `@layer base` |
| `src/main.tsx` | BrowserRouter + i18n init complete | DO NOT TOUCH |
| `src/components/sections/SectionSkeleton.tsx` | Fully implemented | DO NOT TOUCH |
| `src/components/ui/GradientButton.tsx` | Fully implemented | DO NOT TOUCH |
| `src/i18n/LanguageSwitcher.tsx` | Fully implemented | DO NOT TOUCH |
| `src/store/useLocaleStore.ts` | Fully implemented | DO NOT TOUCH |
| `src/store/useModalStore.ts` | `export {}` stub | DO NOT TOUCH (future story) |
| `src/store/useAdminStore.ts` | `export {}` stub | DO NOT TOUCH (future story) |

All section stubs (`Hero.tsx`, `SyncRevenue.tsx`, etc.) return `<section id="..." />` — do NOT implement their content in this story.

### App.tsx — Full Route Tree Pattern

```typescript
import { Routes, Route } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Home from '@/pages/Home'
import Privacy from '@/pages/Privacy'
import AdminLayout from '@/components/layout/AdminLayout'
import Login from '@/pages/admin/Login'
import Dashboard from '@/pages/admin/Dashboard'
import Leads from '@/pages/admin/Leads'
import Team from '@/pages/admin/Team'

export default function App() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-brand-navy focus:rounded focus:font-semibold"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="pt-16">
        {/* pt-16 offsets the fixed Navbar height (64px) */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="team" element={<Team />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </>
  )
}
```

`pt-16` (4rem = 64px) offsets the fixed Navbar so content starts below it. Adjust if Navbar height differs.

### Navbar.tsx — Full Implementation Pattern

```typescript
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/i18n/LanguageSwitcher'
import GradientButton from '@/components/ui/GradientButton'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen])

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-brand-navy" aria-label="Main navigation">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="text-white font-bold text-lg">Sync Sirius</a>

        {/* Desktop nav links — hidden on mobile */}
        <div className="hidden lg:flex items-center gap-8">
          <a href="/#hero" className="text-brand-muted hover:text-white transition-colors text-sm">{t('nav.home')}</a>
          <a href="/#contact" className="text-brand-muted hover:text-white transition-colors text-sm">{t('nav.contact')}</a>
        </div>

        {/* Desktop right: LanguageSwitcher + Demo CTA */}
        <div className="hidden lg:flex items-center gap-4">
          <LanguageSwitcher />
          <a href="/#demo-scheduler">
            <GradientButton size="sm">{t('nav.demo')}</GradientButton>
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="lg:hidden w-11 h-11 flex items-center justify-center text-white"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          {/* Simple hamburger / X icon */}
          <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
          {isOpen ? (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-brand-navy flex flex-col pt-20 px-6 gap-6">
          <a href="/#hero" className="text-white text-xl py-3 min-h-[44px] flex items-center" onClick={() => setIsOpen(false)}>{t('nav.home')}</a>
          <a href="/#contact" className="text-white text-xl py-3 min-h-[44px] flex items-center" onClick={() => setIsOpen(false)}>{t('nav.contact')}</a>
          <a href="/#demo-scheduler" className="text-white text-xl py-3 min-h-[44px] flex items-center" onClick={() => setIsOpen(false)}>{t('nav.demo')}</a>
          <div className="mt-4"><LanguageSwitcher /></div>
        </div>
      )}
    </nav>
  )
}
```

Important: Mobile overlay has `z-40`, Navbar bar itself `z-50` — hamburger button stays clickable to close.

### Home.tsx — Section Order & Lazy Pattern

```typescript
import { lazy, Suspense } from 'react'
import SectionSkeleton from '@/components/sections/SectionSkeleton'

const Hero = lazy(() => import('@/components/sections/Hero'))
const SyncRevenue = lazy(() => import('@/components/sections/SyncRevenue'))
const Comparison = lazy(() => import('@/components/sections/Comparison'))
const Security = lazy(() => import('@/components/sections/Security'))
const ClientReferences = lazy(() => import('@/components/sections/ClientReferences'))
const DemoScheduler = lazy(() => import('@/components/sections/DemoScheduler'))
const Contact = lazy(() => import('@/components/sections/Contact'))

export default function Home() {
  return (
    <>
      <Suspense fallback={<SectionSkeleton className="min-h-[600px]" label="Loading hero" />}>
        <Hero />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="min-h-[400px]" label="Loading syncrevenue" />}>
        <SyncRevenue />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="min-h-[400px]" label="Loading comparison" />}>
        <Comparison />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="min-h-[400px]" label="Loading security" />}>
        <Security />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="min-h-[400px]" label="Loading references" />}>
        <ClientReferences />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="min-h-[300px]" label="Loading demo scheduler" />}>
        <DemoScheduler />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="min-h-[300px]" label="Loading contact" />}>
        <Contact />
      </Suspense>
    </>
  )
}
```

**Do NOT add Services or Team** — stories 1.6 and 1.8 will insert them into this file. The approved scroll order for this story excludes them.

### Section IDs (Anchor Nav Targets)

These IDs are already set in the stubs — do not change them:

| Section | ID | Nav href |
|---------|-----|---------|
| Hero | `hero` | `/#hero` |
| SyncRevenue | `syncrevenue` | (no nav link needed) |
| Comparison | `comparison` | (no nav link needed) |
| Security | `security` | (no nav link needed) |
| ClientReferences | `client-references` | (no nav link needed) |
| DemoScheduler | `demo-scheduler` | `/#demo-scheduler` (CTA target) |
| Contact | `contact` | `/#contact` |

Navbar links: Home → `/#hero`, Contact → `/#contact`, Demo CTA → `/#demo-scheduler`.

### Privacy.tsx — i18n Key Map

```typescript
import { useTranslation } from 'react-i18next'

export default function Privacy() {
  const { t } = useTranslation()
  return (
    <div className="bg-brand-navy text-white min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold mb-2">{t('privacy.title')}</h1>
        <p className="text-brand-muted text-sm mb-8">{t('privacy.lastUpdated')}</p>
        <p className="mb-10 text-brand-offwhite">{t('privacy.intro')}</p>
        {(['dataCollection', 'dataUse', 'dataRetention', 'gdsData', 'contact'] as const).map((section) => (
          <div key={section} className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{t(`privacy.${section}.title`)}</h2>
            <p className="text-brand-offwhite leading-relaxed">{t(`privacy.${section}.body`)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

All 5 `privacy.*` subsections map to `.title` + `.body`. All content is in translation files already — no hardcoded strings.

### AdminLayout.tsx — Shell Only

```typescript
import { Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Outlet />
    </div>
  )
}
```

No auth guard here — admin auth guard is deferred to a future epic. AdminLayout is purely a layout shell with `<Outlet />` for nested routes.

### Brand Tokens Available (Tailwind)

| Token | CSS Variable | Value |
|-------|-------------|-------|
| `bg-brand-navy` | `--color-navy` | `#0D0D3A` |
| `text-brand-electric-blue` | `--color-electric-blue` | `#0075F0` |
| `text-brand-muted` | `--color-muted` | `#8080A0` |
| `text-brand-offwhite` | `--color-offwhite` | `#F4F6FA` |
| `bg-gradient-brand` | gradient | used by GradientButton |
| `text-brand-slate` | `--color-slate` | `#404070` |

### i18n Integration

- `useTranslation()` from `react-i18next` in every component that renders i18n text
- Nav key usage:
  - `t('nav.home')` = "Home" / "Início" / "Inicio"
  - `t('nav.demo')` = "Request Demo" / "Solicitar Demo"
  - `t('nav.contact')` = "Contact" / "Contato" / "Contacto"
  - `t('nav.privacy')` = "Privacy Policy" / "Política de Privacidade" / "Política de Privacidad"
- LanguageSwitcher: import from `@/i18n/LanguageSwitcher` — it handles locale state internally, just render `<LanguageSwitcher />`

### react-router-dom Version

`react-router-dom@7.15.0` — API is consistent with v6 for basic usage: `Routes`, `Route`, `Link`, `Outlet`, `useNavigate`. No breaking changes for this story's usage.

### Breakpoints (Mobile-First)

```
default (< 768px):  mobile — hamburger nav
md: (≥ 768px):      tablet — hamburger nav (Navbar still collapses at < lg:)
lg: (≥ 1024px):     desktop — full nav links visible
xl: (≥ 1280px):     wide — max-w-[1280px] clamps content
```

Use `hidden lg:flex` for desktop nav, `lg:hidden` for hamburger. Tablet uses hamburger nav.

### Skip Link Pattern

The skip link MUST be the first DOM element in `App.tsx` (before `<Navbar />`). It is visually hidden by default (`sr-only`) and becomes visible when focused (`focus:not-sr-only`). `href="#main-content"` targets `<main id="main-content">`. This satisfies WCAG 2.4.1.

### Scroll Behavior

Add to `src/index.css` inside `@layer base`:
```css
html {
  scroll-behavior: smooth;
}
```

This enables CSS smooth scroll for all `<a href="#...">` anchor links. No JavaScript scroll library needed.

### Testing Requirements

**Co-locate test files** next to source. Naming: `*.test.tsx`. Use existing Vitest + testing-library setup.

**Navbar.test.tsx — required:**
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'
import '@/i18n'  // initialize i18next

describe('Navbar', () => {
  const renderNavbar = () => render(<Navbar />, { wrapper: MemoryRouter })

  it('hamburger button exists with aria-expanded false initially', () => {
    renderNavbar()
    const btn = screen.getByRole('button', { name: /open menu/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking hamburger opens overlay', async () => {
    const user = userEvent.setup()
    renderNavbar()
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('pressing Escape closes the overlay', async () => {
    const user = userEvent.setup()
    renderNavbar()
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false')
  })
})
```

Wrap Navbar in `MemoryRouter` since it uses `<Link>` (via LanguageSwitcher's internal deps). Import `@/i18n` to initialize i18next before rendering.

### Anti-Patterns — Never Do

```typescript
// ❌ Don't implement section content (Hero, SyncRevenue, etc.) — they're stubs, other stories do this
// ❌ Don't add auth guard to AdminLayout — that's a future epic
// ❌ Don't use useLocaleStore.getState().locale directly in components — use useLocaleStore() hook
// ❌ Don't create a new locale toggle — LanguageSwitcher already implemented, just import it
// ❌ Don't use React Router <Link> for in-page section anchors — use <a href="/#section-id">
// ❌ Don't add Services or Team to Home.tsx — stories 1.6 and 1.8 handle them
// ❌ Don't touch src/main.tsx — BrowserRouter is already there, re-adding it causes double-wrap
// ❌ Don't use position: sticky for Navbar — use position: fixed (Tailwind: fixed top-0) per AC
// ❌ Don't hardcode English strings — all user-visible text uses t() from useTranslation()
```

### Previous Story Learnings (1.1–1.3)

- `vitest.config` requires `import { defineConfig } from 'vitest/config'` for `test` block to typecheck (not from `vite`)
- `cn()` from `@/lib/utils` for all class merging — never string concatenation
- `@testing-library/jest-dom` setup already in `src/test/setup.ts` — matchers like `toHaveAttribute` work
- i18next already initialized — import `@/i18n` in test files before rendering components that use `useTranslation()`
- Tailwind v3 only — no v4 features; `tailwindcssAnimate` already configured
- `@vitejs/plugin-react@4` pinned for Vite 5 — do not upgrade
- `react-i18next@14` pinned — do not upgrade

### Project Structure Notes

All files for this story are within existing directories — no new directories needed:

```
src/
├── App.tsx                          ← UPDATE (route tree)
├── index.css                        ← UPDATE (add scroll-behavior)
├── components/
│   └── layout/
│       ├── Navbar.tsx               ← IMPLEMENT (stub → full)
│       ├── Footer.tsx               ← IMPLEMENT (stub → full)
│       └── AdminLayout.tsx          ← IMPLEMENT (stub → shell)
├── pages/
│   ├── Home.tsx                     ← IMPLEMENT (stub → section orchestrator)
│   └── Privacy.tsx                  ← IMPLEMENT (stub → i18n content)
```

### References

- Route structure: [architecture.md — Routing](../_bmad-output/planning-artifacts/architecture.md)
- Section scroll order: [epics.md — Story 1.4 AC4](../_bmad-output/planning-artifacts/epics.md)
- Navbar/Footer UX spec: [ux-design-specification.md — Navigation Patterns](../_bmad-output/planning-artifacts/ux-design-specification.md)
- Brand tokens: [tailwind.config.ts](tailwind.config.ts) + [src/index.css](src/index.css)
- i18n nav keys: [src/i18n/locales/en/translation.json](src/i18n/locales/en/translation.json) — `nav.*` section
- Privacy i18n keys: translation files — `privacy.*` section
- LanguageSwitcher (existing): [src/i18n/LanguageSwitcher.tsx](src/i18n/LanguageSwitcher.tsx)
- SectionSkeleton (existing): [src/components/sections/SectionSkeleton.tsx](src/components/sections/SectionSkeleton.tsx)
- GradientButton (existing): [src/components/ui/GradientButton.tsx](src/components/ui/GradientButton.tsx)
- Skip link / accessibility: [ux-design-specification.md — Accessibility Focus](../_bmad-output/planning-artifacts/ux-design-specification.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (create-story → dev-story 2026-05-14)

### Debug Log References

None.

### Completion Notes List

- Section order in Home.tsx (AC4) excludes Services and Team — those are stories 1.6 and 1.8 respectively.
- AdminLayout has no auth guard by design — explicitly deferred to future epic per AC1 "shell only".
- Navbar uses `position: fixed` (not sticky) per AC2 explicit requirement.
- `pt-16` on `<main>` offsets the 64px fixed Navbar — adjust if Navbar height changes.
- Mobile overlay z-index (z-40) is lower than Navbar bar (z-50) so hamburger button stays clickable.
- Privacy.tsx renders `<div>` not `<main>` (App.tsx provides the `<main>`) — no double `<main>` element.
- Skip link uses `focus:not-sr-only` pattern (Tailwind) — no extra JS needed.
- Dev server started on port 5175 (5173/5174 already in use from prior sessions).
- All 15 tests pass: 12 pre-existing + 3 new Navbar tests (hamburger toggle, Escape close, aria-expanded).
- Build produces 7 separate lazy chunks for section components — code splitting confirmed working.

### File List

- `src/App.tsx`
- `src/index.css`
- `src/components/layout/Navbar.tsx`
- `src/components/layout/Navbar.test.tsx` (new)
- `src/components/layout/Footer.tsx`
- `src/components/layout/AdminLayout.tsx`
- `src/pages/Home.tsx`
- `src/pages/Privacy.tsx`

### Change Log

- 2026-05-14: Story 1.4 created — App Shell, Routing & Navigation.
- 2026-05-14: Story 1.4 implemented — App.tsx full route tree, Navbar (sticky + mobile overlay + a11y), Footer (i18n + LanguageSwitcher + Privacy link), Home.tsx (lazy 7 sections), Privacy.tsx (i18n-driven), AdminLayout.tsx (shell + Outlet), smooth scroll CSS. 15 tests pass, clean build, dev server verified.
- 2026-05-14: Story 1.4 review findings implemented — fixed invalid nested `<a><button>`, added `/admin` index redirect, dynamic copyright year, body scroll lock, i18n defaultValues, ErrorBoundary for lazy sections, SSR window guard, SVG titles, overlay nav link click test. 16 tests pass, typecheck clean.
