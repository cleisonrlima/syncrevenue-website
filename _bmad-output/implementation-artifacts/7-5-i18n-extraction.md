# Story 7.5: i18n Extraction for Epic 7 Pages — en / pt-BR / es

Status: done

Epic: 7 — Figma 'teste' SaaS Import — Dashboard Suite + Dark Theme

Source: Figma Make file `https://www.figma.com/make/66Wb2MAv5PLOBSJLoFM3E3/teste`. Local references: stories 7.3 + 7.4 will have landed pages with hardcoded English. Local i18n: `src/i18n/locales/{en,pt-BR,es}/translation.json`, `src/i18n/`, react-i18next + i18next-browser-languagedetector pattern established in Epic 1 Story 1.3.

Depends on: Story 7.3 (dashboard pages ported) + Story 7.4 (Landing + Demo ported). Story 7.5 operates on the JSX produced by 7.3/7.4.

## Story

As a developer ensuring locale parity per the project's i18n contract (Epic 1, Story 1.3),
I want every hardcoded English string in the Epic 7 pages (Landing, Demo, DashboardLayout, DashboardHome, RevenueRecovery, Payouts, Insights, Settings) extracted into the react-i18next namespace pattern under `en/`, `pt-BR/`, `es/`,
So that visitors get the dashboard suite + demo + landing variant in their detected/selected language, and the existing `Sections.i18n.test.tsx` deep-key parity guard continues to enforce zero-divergence across locales.

## Acceptance Criteria

1. **Given** the Epic 7 pages from Stories 7.3 + 7.4 are merged with hardcoded English **When** this story lands **Then** every user-facing string (page titles, headings, descriptions, CTA labels, table column headers, status pills, empty-state messages, form field labels + placeholders + helper text, toast messages, confirmation panels) is replaced by a `t('namespace.key')` call. Namespaces: `landing.*` for `/v2`, `demo.*` for `/demo`, `dashboard.layout.*` for DashboardLayout chrome, `dashboard.overview.*` / `dashboard.recovery.*` / `dashboard.payouts.*` / `dashboard.insights.*` / `dashboard.settings.*` for the 5 dashboard pages.

2. **Given** the en/ translation JSON is the source of truth **When** keys are added to `src/i18n/locales/en/translation.json` **Then** every key from AC 1 has an entry with the EXACT English copy that previously sat hardcoded in the JSX (no rewording at extraction time — that's Story 7.6's responsibility). Mock-data values that are arguably "content" (carrier names, agent names, policy numbers) STAY inline as data — they're not UI copy.

3. **Given** locale parity is enforced **When** keys are added to en/ **Then** `src/i18n/locales/pt-BR/translation.json` and `src/i18n/locales/es/translation.json` get IDENTICAL key structures with translations. Translations are pragmatic Portuguese (BR) + Spanish — quality matches the existing Epic 1–6 translation tone. Brand names ("SyncSyrius" / "SyncRevenue") stay English in all three locales until Story 7.6 rewrites the source.

4. **Given** the existing `src/i18n/locales/locale-parity.test.ts` (or `Sections.i18n.test.tsx`) deep-key parity guard exists **When** the new namespaces are added **Then** the existing test extends or remains green automatically (it walks the en/ tree and asserts every key exists in pt-BR/ + es/). If the existing test is namespace-scoped, extend it to cover `landing.*`, `demo.*`, `dashboard.*`.

5. **Given** Epic 7 pages now consume `useTranslation()` **When** they mount **Then** each page imports `import { useTranslation } from 'react-i18next'`, destructures `const { t } = useTranslation()`, and uses `t('namespace.key', 'fallback English')` form so any missing key still renders a sensible string in dev. Existing `useDocumentMeta` SEO calls pass `titleKey` / `descriptionKey` parameters per the established pattern.

6. **Given** the i18n extraction is mechanical **When** the existing test suite runs **Then** `npm run test:run` exits 0 (89-files / 772-passing baseline holds, modulo +N from the new per-page tests); the locale-parity guard passes; `npx tsc --noEmit` exits 0; `npm run dev` smoke: language switcher in the existing Navbar toggles `/v2`, `/demo`, `/dashboard/*` content between en/pt-BR/es and document.documentElement.lang attribute updates correctly.

## Tasks / Subtasks

- [x] **Task 1: Extract Landing strings (AC: 1, 2)**
  - [x] Walk `src/pages/Landing.tsx`; for every string literal in JSX text or known prop (`alt`, `aria-label`, `title`, `placeholder`), replace with `t('landing.key')`
  - [x] Add matching `landing.*` keys to `src/i18n/locales/en/translation.json`
  - [x] CAROUSEL_SLIDES data → keys under `landing.heroSlides.{revenue,pay,insights}.{badge,title,titleHighlight,description,floatingTitle,floatingValue}`

- [x] **Task 2: Extract Demo strings (AC: 1, 2)**
  - [x] Walk `src/pages/Demo.tsx`; replace string literals with `t('figmaDemo.key')` (deliberate AC deviation — see Dev Agent Record)
  - [x] Add `figmaDemo.*` keys to en/ translation.json (form labels, helpers, success panel copy, footer disclaimer)

- [x] **Task 3: Extract Dashboard chrome + 5 pages (AC: 1, 2)**
  - [x] `DashboardLayout.tsx`: sidebar nav labels + header search placeholder + Import Statement CTA → `dashboard.layout.*`
  - [x] `DashboardHome.tsx`: page header + 3 metric titles + chart headings + select options + side-card title + status labels → `dashboard.overview.*`
  - [x] `RevenueRecovery.tsx`: page header + 3 metric labels + 4 tab labels + table column headers + status pill labels + pagination labels → `dashboard.recovery.*`
  - [x] `Payouts.tsx`: same pattern → `dashboard.payouts.*`
  - [x] `Insights.tsx`: page header + 4 metric titles + chart titles + legend labels → `dashboard.insights.*`
  - [x] `Settings.tsx` + 6 sub-components: 6 tab labels + each sub-component's heading + form field labels + button labels + Danger Zone copy → `dashboard.settings.{general,team,security,billing,integrations,notifications}.*`

- [x] **Task 4: Translate to pt-BR + es (AC: 3)**
  - [x] Mirror en/ key structure in `src/i18n/locales/pt-BR/translation.json` with Brazilian Portuguese translations
  - [x] Mirror in `src/i18n/locales/es/translation.json` with Spanish translations
  - [x] Brand names (SyncSyrius / SyncRevenue) stay English — Story 7.6 owns the rewrite
  - [x] Domain vocabulary (carrier, policy, clawback) stays English/literal — Story 7.6 owns the rewrite

- [x] **Task 5: Extend locale-parity guard (AC: 4)**
  - [x] Extended `src/components/sections/Sections.i18n.test.tsx` (the existing parity guard) with `REQUIRED_EPIC_7_PATHS` enumeration (8 path groups: landing / figmaDemo / dashboard.layout / dashboard.status / overview / recovery / payouts / insights / settings) plus tree-shape equality assertions for `landing.*` / `figmaDemo.*` / `dashboard.*`. Mirrors the Story 6.9 `REQUIRED_DEMO_PATHS` pattern.
  - [x] Ran the test — all 854 tests across 101 files pass.

- [x] **Task 6: Add useTranslation hook per page (AC: 5)**
  - [x] Every Epic 7 page imports `useTranslation`, destructures `t`, switches to `t('namespace.key', 'English fallback')` calls
  - [x] `useDocumentMeta` already passed i18n keys for title/description/og fields (set up by Stories 7.2/7.3/7.4); pt-BR + es `seo.*` entries were already present, no change required.

- [x] **Task 7: Test sweep + i18n smoke (AC: 6)**
  - [x] `npm run test:run` — exit 0 (101 files / 859 tests)
  - [x] `npm run typecheck` — exit 0
  - [x] `npm run build` — exit 0 (pre-existing Hero.tsx `fetchPriority` warning outside Story 7.5 scope)

### Review Findings

- [x] [Review][Patch] Epic 7 routes lack an available language switcher [src/App.tsx:104] — fixed by adding `LanguageSwitcher` to Landing, Demo, and DashboardLayout route-owned chrome.
- [x] [Review][Patch] Dashboard chart and metric hover labels still expose hardcoded English/internal labels [src/pages/dashboard/Insights.tsx:166] — fixed by adding localized Recharts series/tooltip labels and extracting `+2 new`.
- [x] [Review][Patch] Translated status labels are not searchable in localized dashboards [src/pages/dashboard/RevenueRecovery.tsx:144] — fixed by including translated status labels in Recovery and Payouts search values.
- [x] [Review][Patch] Unknown statuses fall through to success-like labels/styles [src/pages/dashboard/RevenueRecovery.tsx:328] — fixed by routing unknown statuses to neutral styling and `dashboard.status.unknown`.
- [x] [Review][Patch] Locale parity tests do not verify interpolation placeholder parity [src/components/sections/Sections.i18n.test.tsx:650] — fixed by adding placeholder-token parity checks for Epic 7 keys.
- [x] [Review][Patch] Row action buttons have identical accessible names per table [src/pages/dashboard/RevenueRecovery.tsx:334] — fixed with row-specific `openRecovery` / `openPayout` labels.
- [x] [Review][Patch] Epic 7 route-level locale switching is not covered by tests [src/components/sections/Sections.i18n.test.tsx:644] — fixed with route-level language-switch tests for `/demo` and `/dashboard/recovery`.
- [x] [Review][Patch] Deferred-action note is stale after commit/push landed [./7-5-i18n-extraction.md:111] — fixed by replacing the stale deferred note with a resolved-actions note.

## Dev Agent Record

### Completion notes

- **Namespace deviation from AC 1** (approved by user 2026-05-22): the `/demo` Figma page strings landed under `figmaDemo.*` instead of `demo.*`. Rationale: `demo.*` is already populated by the Epic 1/2 `DemoScheduler` section on the `/` home page (`demo.eyebrow`, `demo.form.*`, etc.). Using the same prefix for the `/demo` Figma surface would have collided — different page, totally different copy, same key namespace. `figmaDemo.*` keeps both surfaces clean and avoids a destructive rewrite of established Epic 1 keys.
- **Status-pill conditional styling review fix**: `RevenueRecovery.tsx` and `Payouts.tsx` now map raw mock-data status labels through local status metadata so labels resolve through `dashboard.status.*`, localized status labels participate in search, and unknown future statuses render neutrally instead of as resolved/completed. Story 7.6 still owns the broader domain-vocabulary rewrite.
- **`TIME_RANGES` state IDs decoupled from labels** (`DashboardHome.tsx`): the time-range `<select>` now stores `last7Months` / `thisYear` / `allTime` as state values rather than the English-readable labels. The displayed `<option>` text is `t('dashboard.overview.timeRanges.*')`. The Story 7.3 DashboardHome test was updated to reflect the new state values (one-line change).
- **`TABS` / `METRICS` arrays refactored to carry i18n keys**: `RevenueRecovery.tsx`, `Payouts.tsx`, `Settings.tsx` previously held English label strings directly in their const arrays. Each was refactored to a `{ id, labelKey, labelFallback, ... }` shape so `t()` resolves the label at render time. `testIdSlug` was preserved per row so the existing `dashboard-recovery-tab-all-discrepancies` / `dashboard-payouts-tab-failed` / `dashboard-settings-integration-stripe` test selectors continue to match.
- **DashboardLayout `data-i18n-key` attribute preserved**: Story 7.2 added a `data-i18n-key` attribute to each nav item span as a placeholder. Story 7.5 wires the actual `t(labelKey, defaultLabel)` resolution but keeps the attribute as a diagnostic hook (no harm; could be removed in Story 7.6).

### File List

Source files (8):
- `src/pages/Landing.tsx`
- `src/pages/Demo.tsx`
- `src/components/layout/DashboardLayout.tsx`
- `src/pages/dashboard/DashboardHome.tsx`
- `src/pages/dashboard/RevenueRecovery.tsx`
- `src/pages/dashboard/Payouts.tsx`
- `src/pages/dashboard/Insights.tsx`
- `src/pages/dashboard/Settings.tsx`

Translation bundles (3):
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/pt-BR/translation.json`
- `src/i18n/locales/es/translation.json`

Test files (5):
- `src/components/sections/Sections.i18n.test.tsx` (extended)
- `src/pages/dashboard/DashboardHome.test.tsx` (TIME_RANGES state-ID assertion update)
- `src/App.routes.test.tsx` (route-owned chrome locale switcher coverage)
- `src/pages/dashboard/RevenueRecovery.test.tsx` (translated status search coverage)
- `src/pages/dashboard/Payouts.test.tsx` (translated status search coverage)

Status / vault:
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/7-5-i18n-extraction.md`
- `vault/Planning/Epics-Index.md`
- `vault/00-Home.md`
- `vault/Code/i18n.md`

### Change Log

- 2026-05-22 — Story 7.5 dev pass complete. Three new i18n namespaces (`landing.*`, `figmaDemo.*`, `dashboard.*`) added to en/pt-BR/es bundles with full tree-shape parity. `useTranslation` wired into 8 Epic 7 surfaces. Parity guard extended in `Sections.i18n.test.tsx` with `REQUIRED_EPIC_7_PATHS` (~200 leaf keys). Status: not-started → review.
- 2026-05-22 — Senior code review patches complete. Added route-owned language switchers, localized Recharts labels/tooltips, translated-status search, neutral unknown-status handling, row-specific action labels, interpolation placeholder parity, and route-level locale switching tests. `npm run typecheck`, `npm run test:run` (101 files / 859 tests), and `npm run build` all green. Status: review → done.

## Deferred Actions Resolved

- **2026-05-22 — commit/push deferral resolved before review:** Story 7.5 dev changes landed in commit `4786563` and were pushed to `origin/master` before this review run. Review patches are local in this follow-up change set and supersede the stale staged-work note. Jira sync to Done remains part of this review closure.

## Dev Notes

### Open reconciliations (resolve at create-time of story file → 2026-05-22)

1. **Mock data is NOT i18n content.** `DISCREPANCIES[0].carrier === 'Global Life'` stays as data. Story 7.6 rewrites the seed values to travel-commission domain (carriers → GDS systems like Amadeus/Sabre/Travelport); Story 7.5 only touches UI copy.

2. **`useDocumentMeta` keys.** Existing pattern (per `src/pages/Home.tsx`) takes `titleKey`, `descriptionKey`, `ogTitleKey`, `ogDescriptionKey`, `path`. Epic 7 pages need matching `seo.v2.*`, `seo.demo.*`, `seo.dashboard.*` keys under en/pt-BR/es per the existing `seo.home.*` pattern.

3. **Recharts chart labels.** Recharts `XAxis` and `YAxis` can take `tickFormatter` props (`(val) => \`$\${val}k\``). The literal `$` and `k` are not i18n content — they're locale-formatting concerns. Defer locale-aware number formatting to a later epic; Story 7.5 leaves these inline.

4. **Status pill copy ("Pending", "Resolved", "Disputed", etc.).** These are UI labels and now resolve through `dashboard.status.*`. The mock row data still stores English status labels, but render/search go through local status metadata with a neutral unknown fallback so future new statuses do not silently render as resolved/completed.

### Out of scope

- Brand-name + domain-vocabulary rewrite (SyncSyrius → SyncRevenue, insurance → travel) — Story 7.6
- Locale-aware number / date / currency formatting — out of Epic 7

### Subtasks land in Jira

Per CLAUDE.md, every task lands as a child Sub-task issue.
