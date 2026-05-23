# Story 7.5: i18n Extraction for Epic 7 Pages — en / pt-BR / es

Status: not-started

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

- [ ] **Task 1: Extract Landing strings (AC: 1, 2)**
  - [ ] Walk `src/pages/Landing.tsx`; for every string literal in JSX text or known prop (`alt`, `aria-label`, `title`, `placeholder`), replace with `t('landing.key')`
  - [ ] Add matching `landing.*` keys to `src/i18n/locales/en/translation.json`
  - [ ] CAROUSEL_SLIDES data → keys under `landing.heroSlides.{revenue,pay,insights}.{badge,title,titleHighlight,description,floatingTitle,floatingValue}`

- [ ] **Task 2: Extract Demo strings (AC: 1, 2)**
  - [ ] Walk `src/pages/Demo.tsx`; replace string literals with `t('demo.key')`
  - [ ] Add `demo.*` keys to en/ translation.json (form labels, helpers, success panel copy, footer disclaimer)

- [ ] **Task 3: Extract Dashboard chrome + 5 pages (AC: 1, 2)**
  - [ ] `DashboardLayout.tsx`: sidebar nav labels + header search placeholder + Import Statement CTA → `dashboard.layout.*`
  - [ ] `DashboardHome.tsx`: page header + 3 metric titles + chart headings + select options + side-card title + status labels → `dashboard.overview.*`
  - [ ] `RevenueRecovery.tsx`: page header + 3 metric labels + 4 tab labels + table column headers + status pill labels + pagination labels → `dashboard.recovery.*`
  - [ ] `Payouts.tsx`: same pattern → `dashboard.payouts.*`
  - [ ] `Insights.tsx`: page header + 4 metric titles + chart titles + legend labels → `dashboard.insights.*`
  - [ ] `Settings.tsx` + 6 sub-components: 6 tab labels + each sub-component's heading + form field labels + button labels + Danger Zone copy → `dashboard.settings.{general,team,security,billing,integrations,notifications}.*`

- [ ] **Task 4: Translate to pt-BR + es (AC: 3)**
  - [ ] Mirror en/ key structure in `src/i18n/locales/pt-BR/translation.json` with Brazilian Portuguese translations
  - [ ] Mirror in `src/i18n/locales/es/translation.json` with Spanish translations
  - [ ] Brand names (SyncSyrius / SyncRevenue) stay English — Story 7.6 owns the rewrite
  - [ ] Domain vocabulary (carrier, policy, clawback) stays English/literal — Story 7.6 owns the rewrite

- [ ] **Task 5: Extend locale-parity guard (AC: 4)**
  - [ ] Confirm `src/i18n/locales/locale-parity.test.ts` (or wherever the parity guard lives) walks the new namespaces automatically. If not, add explicit namespace declarations to its enumeration.
  - [ ] Run the test — fix any missing-key errors

- [ ] **Task 6: Add useTranslation hook per page (AC: 5)**
  - [ ] Every Epic 7 page imports `useTranslation`, destructures `t`, switches to `t('namespace.key')` calls
  - [ ] `useDocumentMeta` passes i18n keys for title/description/og fields

- [ ] **Task 7: Test sweep + i18n smoke (AC: 6)**
  - [ ] `npm run test:run` × 3 — exit 0
  - [ ] `npm run typecheck` exit 0
  - [ ] `npm run dev` smoke: switch language from en → pt-BR → es using the existing Navbar dropdown; confirm `/v2`, `/demo`, every `/dashboard/*` route updates copy + `document.documentElement.lang`

## Dev Notes

### Open reconciliations (resolve at create-time of story file → 2026-05-22)

1. **Mock data is NOT i18n content.** `DISCREPANCIES[0].carrier === 'Global Life'` stays as data. Story 7.6 rewrites the seed values to travel-commission domain (carriers → GDS systems like Amadeus/Sabre/Travelport); Story 7.5 only touches UI copy.

2. **`useDocumentMeta` keys.** Existing pattern (per `src/pages/Home.tsx`) takes `titleKey`, `descriptionKey`, `ogTitleKey`, `ogDescriptionKey`, `path`. Epic 7 pages need matching `seo.v2.*`, `seo.demo.*`, `seo.dashboard.*` keys under en/pt-BR/es per the existing `seo.home.*` pattern.

3. **Recharts chart labels.** Recharts `XAxis` and `YAxis` can take `tickFormatter` props (`(val) => \`$\${val}k\``). The literal `$` and `k` are not i18n content — they're locale-formatting concerns. Defer locale-aware number formatting to a later epic; Story 7.5 leaves these inline.

4. **Status pill copy ("Pending", "Resolved", "Disputed", etc.).** These are UI labels — extract under e.g. `dashboard.recovery.status.pending`. The mapping in `statusColor` styling stays string-keyed against the English value for now; consider switching to enum-keyed in a follow-up.

### Out of scope

- Brand-name + domain-vocabulary rewrite (SyncSyrius → SyncRevenue, insurance → travel) — Story 7.6
- Locale-aware number / date / currency formatting — out of Epic 7

### Subtasks land in Jira

Per CLAUDE.md, every task lands as a child Sub-task issue.
