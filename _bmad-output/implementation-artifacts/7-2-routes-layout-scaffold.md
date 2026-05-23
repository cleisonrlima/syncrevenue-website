# Story 7.2: Routes / Layout Scaffold — `/v2`, `/demo`, `/dashboard/*` + DashboardLayout Shell

Status: done

Epic: 7 — Figma 'teste' SaaS Import — Dashboard Suite + Dark Theme

Source: Figma Make file `https://www.figma.com/make/66Wb2MAv5PLOBSJLoFM3E3/teste`. Key files: `src/app/App.tsx`, `src/app/routes.tsx`, `src/app/pages/DashboardLayout.tsx`. Local references: `src/App.tsx`, `src/main.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx`.

Depends on: Story 7.1 (foundation deps + tokens + dark mode + cn/ImageWithFallback must be merged before this story starts).

## Story

As a developer wiring the Epic 7 product surfaces into the local app,
I want the five new routes registered and the `DashboardLayout` shell (sidebar + header + outlet) ported and rendering placeholder bodies,
So that Stories 7.3 (dashboard pages) and 7.4 (Landing + DemoForm) can drop their components into a known, navigable scaffold without re-litigating routing or layout chrome.

## Acceptance Criteria

1. **Given** `src/App.tsx` is the existing router root **When** Epic 7 routes are registered **Then** five new routes exist alongside the existing `/`, `/privacy`, `/admin/*`, `*` routes: `/v2` (Landing placeholder), `/demo` (DemoForm placeholder), `/dashboard` (DashboardLayout with index DashboardHome placeholder), `/dashboard/recovery` (RevenueRecovery placeholder), `/dashboard/payouts` (Payouts placeholder), `/dashboard/insights` (Insights placeholder), `/dashboard/settings` (Settings placeholder). AND every new route renders without throwing under `npm run dev`. AND the existing routes still resolve unchanged (regression check via the existing Vitest suite — 89 files / 772 passing baseline holds).

2. **Given** the Figma `DashboardLayout.tsx` uses `react-router` v7 imports (`Outlet`, `Link`, `useLocation`) **When** ported to local **Then** the local file imports from `react-router-dom@7` (the local package; behavior identical), keeps the sidebar (5 nav items — Overview / Revenue Recovery / Payouts / Insights / Settings with lucide-react icons LayoutDashboard / Target / CreditCard / BarChart2 / Settings), header (search input + bell button + "Import Statement" primary CTA), and footer user card (initials avatar + name + email). The sidebar `Link` `to` values use absolute `/dashboard`, `/dashboard/recovery`, etc. paths to match the route registration.

3. **Given** the existing `src/App.tsx` wraps every route with `<Navbar />` + `<main>` + `<Footer />` **When** the dashboard routes render **Then** the existing public Navbar + Footer are NOT rendered for `/dashboard/*` — the DashboardLayout owns its own chrome and a `location.pathname.startsWith('/dashboard')` (or equivalent) guard in `src/App.tsx` suppresses the public chrome. Skip-to-content link, ScrollRestoration, and the `<main id="main-content">` wrapper continue to behave correctly for `/`, `/v2`, `/demo`, `/privacy`, `/admin/*`.

4. **Given** the local Navbar is part of the public site chrome **When** `/v2` and `/demo` render **Then** they DO render under the existing Navbar + Footer (they are public marketing surfaces) unless their Figma designs include their own nav (Landing Figma source includes its own dark `<nav>` — strip the local Navbar wrap for `/v2`; DemoForm Figma source includes its own minimal nav — strip the local Navbar wrap for `/demo` too). Final guard: `Navbar` + `Footer` render only for `/`, `/privacy`, `/admin/*` (admin retains its own AdminLayout already).

5. **Given** placeholder pages are needed before Stories 7.3 / 7.4 ship **When** this story lands **Then** each of `src/pages/v2.tsx` (or `Landing.tsx`), `src/pages/Demo.tsx`, `src/pages/dashboard/DashboardHome.tsx`, `src/pages/dashboard/RevenueRecovery.tsx`, `src/pages/dashboard/Payouts.tsx`, `src/pages/dashboard/Insights.tsx`, `src/pages/dashboard/Settings.tsx` exports a default React component that renders a single `<h1>` with the page title and a one-line "Coming in Story 7.X" note. Each placeholder uses `useDocumentMeta` (or equivalent) so SEO meta is consistent.

6. **Given** the layout scaffold is additive **When** the existing test suite runs **Then** `npm run test:run` exits 0 (89 files / 772 passing baseline holds); a NEW Vitest spec `src/components/layout/DashboardLayout.test.tsx` asserts (a) sidebar renders 5 nav items, (b) clicking a nav item updates `useLocation().pathname`, (c) the active nav item gets the `bg-white/10 text-white` class; existing `src/components/layout/Navbar.test.tsx` extended (or new `App.routes.test.tsx`) asserts Navbar is NOT rendered for `/dashboard/*` routes.

## Tasks / Subtasks

- [x] **Task 1: Register 7 new routes in `src/App.tsx` (AC: 1)**
  - [x] Add `<Route path="/v2" element={<Landing />} />` (placeholder import)
  - [x] Add `<Route path="/demo" element={<Demo />} />` (placeholder import)
  - [x] Add `<Route path="/dashboard" element={<DashboardLayout />}>` with index `<DashboardHome />` + 4 child routes (recovery/payouts/insights/settings)
  - [x] Verify route precedence — `*` catch-all stays LAST, dashboard nested routes precede `*`
  - [x] `npm run dev` smoke: navigate to each new route, confirm no console errors

- [x] **Task 2: Port `DashboardLayout.tsx` to `src/components/layout/DashboardLayout.tsx` (AC: 2)**
  - [x] Swap `react-router` imports → `react-router-dom`
  - [x] Lucide icons (LayoutDashboard, Target, CreditCard, BarChart2, Settings, Bell, Search, TrendingUp) imported from `lucide-react` (added by Story 7.1)
  - [x] Replace `ImageWithFallback` import path to local `src/components/figma/ImageWithFallback` (added by Story 7.1)
  - [x] Replace inline logo import `../../imports/1351_rev_1.jpg` with `/logo-or-asset-from-public.png` (local asset — confirm logo asset path during port)
  - [x] Inline user card (initials, name, email) keeps Figma placeholder values for now (Settings page will derive from real user state in a later epic)

- [x] **Task 3: Gate public Navbar + Footer off for dashboard (AC: 3, 4)**
  - [x] In `src/App.tsx`, expand the existing `isHomeRoute` pattern to also derive `isDashboardRoute = location.pathname.startsWith('/dashboard')` and `isFigmaPublicRoute = ['/v2', '/demo'].includes(location.pathname)`
  - [x] Conditionally render `<Navbar />` and `<Footer />` ONLY for non-dashboard, non-figma-public routes
  - [x] Confirm ScrollRestoration + skip-to-content link still work on every route they DO render under
  - [x] Document the guard in inline comment referencing this story

- [x] **Task 4: Author 7 placeholder pages (AC: 5)**
  - [x] `src/pages/Landing.tsx` (mounted at `/v2`)
  - [x] `src/pages/Demo.tsx` (mounted at `/demo`)
  - [x] `src/pages/dashboard/DashboardHome.tsx`, `RevenueRecovery.tsx`, `Payouts.tsx`, `Insights.tsx`, `Settings.tsx`
  - [x] Each placeholder: default export, single `<h1>` with route title, one-line note pointing at the implementing story
  - [x] Each placeholder: `useDocumentMeta({ titleKey, descriptionKey, path })` so SEO meta is consistent (i18n keys can be temporary hardcoded fallbacks; full extraction in Story 7.5)

- [x] **Task 5: Test coverage for scaffold (AC: 6)**
  - [x] `src/components/layout/DashboardLayout.test.tsx` — sidebar nav, active state, link clicks
  - [x] `src/App.routes.test.tsx` (or extend an existing spec) — asserts Navbar/Footer gating
  - [x] `npm run test:run` × 3 — all exit 0
  - [x] `npx tsc --noEmit && npx tsc --noEmit --project tsconfig.scripts.json` exit 0

### Review Findings

- [x] [Review][Patch] Add mobile-accessible dashboard navigation; current sidebar is hidden below `lg` with no fallback [src/components/layout/DashboardLayout.tsx:81]
- [x] [Review][Patch] Remove nested `<main>` landmarks between the app shell and dashboard shell [src/App.tsx:60]
- [x] [Review][Patch] Replace deny-list chrome gating with route-accurate checks for dashboard, Figma public routes, and allowed public chrome [src/App.tsx:35]
- [x] [Review][Patch] Add dashboard-scoped handling for unknown dashboard child routes so `/dashboard/*` misses keep the dashboard shell [src/App.tsx:69]
- [x] [Review][Patch] Add SEO translations or fallback support for all new placeholder route meta keys [src/pages/Landing.tsx:15]
- [x] [Review][Patch] Extend route chrome tests to assert Footer/contentinfo visibility, not only Navbar visibility [src/App.routes.test.tsx:45]

## Dev Notes

### Open reconciliations (resolve at create-time of story file → 2026-05-22)

1. **Route path final naming (D2-followup).** Story 7.4 (Landing + DemoForm) will produce the final UX for these surfaces; this story locks in `/v2` as the placeholder mount point. If user later picks `/preview` instead, that's a 1-line rename in this scaffold + a redirect entry (`{ path: '/v2', element: <Navigate to="/preview" replace /> }`).

2. **Logo asset.** Figma source imports `../../imports/1351_rev_1.jpg` (a Make-file local asset). The local repo has these as `1351_rev_1.jpg` etc. at repo root. **Resolution:** copy the canonical logo to `public/logos/syncsirius-logo.png` (or reuse the existing `public/logos/` asset if Story 6.2 already established the canonical path) and reference via absolute `/logos/syncsirius-logo.png`. Inline `<ImageWithFallback>` keeps the fallback behaviour from the Figma source.

3. **Existing AdminLayout pattern.** The local repo already has `src/components/layout/AdminLayout.tsx` (Epic 4). The DashboardLayout is a SECOND layout, not a replacement — both coexist per Epic 7 decision 3. No code path should accidentally collapse them.

4. **`Settings` icon name collision.** Lucide exports `Settings` and the Figma source uses it for the sidebar nav icon. If the local repo has any component named `Settings` (it doesn't, per the current `src/` tree), prefer aliased import: `import { Settings as SettingsIcon } from 'lucide-react'`.

### Out of scope (explicit non-goals)

- Page bodies (dashboard 5 pages, Landing, DemoForm) — Story 7.3 / 7.4
- i18n extraction — Story 7.5
- Real route auth gating for `/dashboard/*` — out of Epic 7 scope (Figma source assumes the dashboard is always accessible; real auth wiring is a later epic)

### Subtasks land in Jira

Per CLAUDE.md, every task above lands as a child Sub-task issue under the parent Story Jira issue at create-time (handled by `/jira-assistant`).
