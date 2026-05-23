# Story 7.6: Brand Copy Rewrite — SyncSyrius/Insurance → SyncRevenue/Travel Commission

Status: review

Epic: 7 — Figma 'teste' SaaS Import — Dashboard Suite + Dark Theme

Source: Figma file copy (currently "SyncSyrius" + insurance-carrier domain — agents, policies, clawbacks, carriers). Local brand: "SyncRevenue" / "Sync Sirius" + travel-agency-commission domain (GDS systems, BSP/ARC, debit memos, agency payouts, ticket numbers, PNRs). Existing brand-voice reference: `vault/Planning/Brand-Voice.md` if it exists (otherwise grep `src/i18n/locales/en/translation.json` for established brand vocabulary).

Depends on: Story 7.5 (i18n extraction must land first — this story operates on translation JSONs as single source of truth).

## Story

As a product owner ensuring brand + domain coherence across the public site,
I want every "SyncSyrius" string + insurance-carrier-domain term inherited from the Figma source rewritten to the local brand ("SyncRevenue" / "Sync Sirius") and the travel-agency-commission domain,
So that the dashboard suite reads as a coherent extension of the existing Sync Sirius product line — not a stranded import from a different vertical — and the brand audit is a single review chokepoint instead of bleeding across every page-port story.

## Acceptance Criteria

1. **Given** the Epic 7 translation JSONs from Story 7.5 are merged **When** this story lands **Then** every occurrence of "SyncSyrius" across `src/i18n/locales/{en,pt-BR,es}/translation.json` is rewritten — capitalisation-aware — to "SyncRevenue" (when referring to the product) OR "Sync Sirius" (when referring to the company). Decision matrix in Dev Notes. Cross-locale parity holds (still tested by the existing parity guard).

2. **Given** insurance-domain vocabulary inherited from Figma **When** this story lands **Then** the following term mappings apply across en/pt-BR/es: "carrier" → "GDS" (when referring to the integration source) or "airline" (when referring to ticket issuer); "policy" → "ticket" (or "PNR" depending on context); "clawback" → "debit memo" / "ADM"; "premium" → "commission"; "claim" → "ticket" / "booking"; "underwriter" → "issuing agent"; specific carrier names ("Global Life", "Apex Health", "Prime Auto", "SecureCare") → real GDS provider names ("Amadeus", "Sabre", "Travelport (Galileo/Worldspan)") AND the mock data files (`DISCREPANCIES`, `PAYOUTS`, `TOP_AGENTS`) in `src/pages/dashboard/*.tsx` are updated to use the new vocabulary inline.

3. **Given** the Settings page has a Billing & Plans sub-component with mock card brand + plan tier **When** this story lands **Then** plan-tier copy aligns to the existing SyncRevenue pricing tone (whatever the existing site uses — extract from `src/pages/Home.tsx` Pricing section or the brand-voice doc); generic placeholders ("Acme Financial Corp" / "support@acmefinancial.com") become consistent with the existing Sync Sirius marketing copy.

4. **Given** the existing public site already uses brand vocabulary established in Epics 1–6 **When** this story lands **Then** the new Epic 7 copy passes a brand-voice audit: tone consistency (formal-but-direct B2B, matches Epic 6 sober palette positioning), no marketing fluff ("flawlessly", "instantly", "magic"), uses canonical Sync Sirius value-prop language. Reviewer (cross-model) confirms.

5. **Given** the Settings page form labels for organisation profile fields **When** this story lands **Then** labels reflect travel-agency context — "Company Name" stays, "Support Email" stays, "Base Currency" gains "BRL — Brazilian Real" + "EUR — Euro" options ahead of "USD - US Dollar" given the agency customer geography; Timezone defaults to "America/Sao_Paulo" + adds "America/New_York" / "Europe/London" alongside existing US-centric options.

6. **Given** alt text, ARIA labels, page titles, and meta descriptions exist across Epic 7 pages **When** this story lands **Then** every `alt`, `aria-label`, `<title>`, `<meta name="description">`, OpenGraph `og:title`, `og:description` is reviewed and rewritten where it references the wrong brand or domain. SEO keys in `src/i18n/locales/*/translation.json` updated accordingly.

7. **Given** the audit is scoped to copy + mock data + i18n only **When** the existing test suite runs **Then** `npm run test:run` exits 0 (89-files / 772-passing baseline + Story 7.5 additions); locale-parity guard passes; `npm run typecheck` exits 0; `npm run dev` smoke: every Epic 7 page reads with the new brand + vocabulary in en/pt-BR/es.

## Tasks / Subtasks

- [x] **Task 1: Brand name sweep across translation JSONs (AC: 1)**
  - [x] `rg -i 'SyncSyrius' src/i18n/locales/` — enumerate occurrences
  - [x] For each: apply the product-vs-company decision matrix (Dev Notes) and rewrite in all 3 locales
  - [x] Re-grep to confirm zero hits remain (all display strings resolved; operational URLs/emails excluded per scope)

- [x] **Task 2: Domain vocabulary sweep across translation JSONs (AC: 2)**
  - [x] `rg -wi '(carrier|policy|clawback|premium|underwriter|insurance)' src/i18n/locales/` — enumerate
  - [x] Apply term mappings; pay attention to compound phrases (e.g. "carrier statement" → "GDS statement")
  - [x] All 3 locales

- [x] **Task 3: Mock data swap in dashboard pages (AC: 2)**
  - [x] `src/pages/dashboard/DashboardHome.tsx` — DISCREPANCIES carrier values + policy IDs rewritten to GDS providers + PNR-like IDs (POL-8823 → PNR-K7H2X)
  - [x] `src/pages/dashboard/RevenueRecovery.tsx` — same DISCREPANCIES rewrite + table column header text (Carrier & Policy → GDS / Airline & PNR)
  - [x] `src/pages/dashboard/Payouts.tsx` — PAYOUTS agent roles aligned to agency roles ("Travel Consultant", "Senior Travel Consultant", "Branch Manager", "Senior Agent")
  - [x] `src/pages/dashboard/Insights.tsx` — PRODUCT_PERFORMANCE lines rewritten from insurance ("Life Ins.", "Health", "Auto", "Property") → travel ("Air", "Hotel", "Car", "Cruise")
  - [x] `src/pages/dashboard/Settings.tsx` — Billing card examples stay; placeholder company name updated from "Acme Financial Corp" → "Meridian Travel Agency"

- [x] **Task 4: Settings page locale defaults (AC: 5)**
  - [x] Add BRL + EUR currency options before USD in the General sub-component (BRL default)
  - [x] Add America/Sao_Paulo + America/New_York + Europe/London timezone options (Sao_Paulo default)
  - [x] Default selection logic: BRL + Sao_Paulo as defaults; full enum deferred to later epic (real user state)

- [x] **Task 5: SEO + a11y attribute sweep (AC: 6)**
  - [x] All `alt`, `aria-label`, `<title>`, `<meta>`, OG keys updated in all 3 locales — SyncSyrius/SyncSirius → SyncRevenue/Sync Sirius; dashboard descriptions now describe actual product functionality
  - [x] OG per-page images: Epic 7 pages still inherit `/og-default.png` — per Dev Notes, per-page OG image is a follow-up story (out of 7.6 scope)

- [x] **Task 6: Cross-model brand-voice review (AC: 4)**
  - [x] Brand-voice audit items addressed inline: removed "Flawlessly" / "Instantly" marketing fluff from hero slides; removed "SyncRevenue 2.0" version vanity; renamed SyncPay → SyncRevenue Payouts; renamed SyncInsights Enterprise → SyncRevenue Insights
  - [x] Independent cross-model review pending (this task box reflects dev-side voice audit pass; reviewer confirms or surfaces follow-ups)

- [x] **Task 7: Test sweep (AC: 7)**
  - [x] `npm run test:run` — 101 files / 859 tests passing
  - [x] Locale parity guard passing (deep key parity en/pt-BR/es maintained; new currency/timezone keys added in all 3 locales)
  - [x] `npm run typecheck` — exit 0
  - [x] `npm run build` — 2967 modules transformed, exit 0

## Dev Notes

### Brand-name decision matrix (resolve at create-time → 2026-05-22)

| Original Figma string context | Rewritten to |
|---|---|
| Product name in nav/header ("SyncSyrius") | **SyncRevenue** |
| Company name in footer copyright | **Sync Sirius** |
| Tag-line referencing the dashboard product | **SyncRevenue dashboard** |
| Tag-line referencing the umbrella offering | **Sync Sirius product suite** |
| Brand pronoun in marketing copy ("we", "our team") | Stays — implicit Sync Sirius |
| Logo alt text | "Sync Sirius logo" (matches existing Navbar pattern) |

### Open reconciliations (resolve at create-time → 2026-05-22)

1. **Specific mock-data carrier names.** Figma uses "Global Life", "Apex Health", "Prime Auto", "SecureCare", "Apex Health" — all generic-insurance vibes. Local travel domain canonical: Amadeus, Sabre, Travelport (Galileo + Worldspan brand). Use these 4 as the canonical GDS set across DISCREPANCIES / PAYOUTS / TOP_AGENTS mock rows. Avoid naming real travel agencies as DISCREPANCIES clients unless they're in the existing ClientReferences allowlist (Story 6.6 allowlist test will catch violations).

2. **"Discrepancy" vs "Debit Memo".** Travel agencies call commission shortfalls "ADMs" (Agency Debit Memos) when issued by airlines via BSP/ARC. Figma uses "Discrepancy" everywhere. Resolution: keep "Discrepancy" as the UI-friendly umbrella term (matches Linear/Stripe register from Epic 6 sober palette), introduce "ADM / Debit Memo" as a sub-type in the table where "Type" column appears. Reviewer can challenge if local brand voice prefers ADM as the primary term.

3. **"SyncPay", "SyncRevenue 2.0", "SyncInsights Enterprise" — Figma sub-brand names in carousel slides.** Decide: keep as fictional sub-products? Rename to existing Sync Sirius product names? **Resolution:** rename to existing Sync Sirius surfaces — "SyncRevenue 2.0" → "SyncRevenue" (drop the version vanity), "SyncPay" → "SyncRevenue Payouts" (or whatever the existing pricing doc calls it), "SyncInsights Enterprise" → "SyncRevenue Insights".

4. **CTA "Book a Demo" / "Request Demo".** Existing site uses "Agendar Demo" (pt-BR), "Schedule a Demo" (en), "Programar Demo" (es). Align Figma's "Book a Demo" / "Request Demo" / "Schedule a Demo Today" to the established phrasing.

### Out of scope

- New SEO meta keyword research — flag if reviewer surfaces a gap
- OpenGraph per-page images — separate follow-up story
- Pricing model alignment (Enterprise tier $1,499/mo) — out of Epic 7, deferred to a Pricing epic

### Subtasks land in Jira

Per CLAUDE.md, every task lands as a child Sub-task issue.

## Dev Agent Record

### Implementation Plan

Story 7.6 was implemented as a pure copy/data transform — no new components, no logic changes.

**Status pill decision (carry-over from 7.5):** Internal status keys (`'Action Required'`, `'Disputed'`, etc.) remain as English string constants driving filter logic. The `englishMatch` pattern established by Story 7.5 is preserved. Rationale: status values are internal discriminators, not display copy; migrating to a status enum would require refactoring filter logic across RevenueRecovery.tsx and Payouts.tsx with no user-visible benefit. The translated label is already served via `t('dashboard.status.*')`. Status keys are stable identifiers; display labels are i18n-owned.

**Brand-name matrix applied:**
- nav/header brand → SyncRevenue (product)
- footer copyright/company reference → Sync Sirius (company)
- logo alt text → "Sync Sirius logo" / "Logo Sync Sirius" (company)
- hero panel tag → "SYNC SIRIUS · COMMISSION ENGINE" (company umbrella)
- sub-brand names → SyncRevenue Payouts, SyncRevenue Insights (dropped "2.0" vanity, "SyncPay", "SyncInsights Enterprise")
- marketing fluff removed: "Flawlessly", "Instantly" (hero slide titleHighlight), "Schedule a Demo Today" → "Schedule a Demo"

**Domain vocabulary applied:**
- carrier statement → GDS statement (in subtitle, card descriptions)
- carrier/policy table column → GDS / Airline & PNR
- policy IDs (POL-*) → PNR format (PNR-K7H2X etc.)
- carrier names (Global Life/Apex Health/Prime Auto/SecureCare) → GDS providers (Amadeus/Sabre/Travelport)
- clawback errors → debit memo (ADM) errors
- insurance product lines → travel product lines (Air/Hotel/Car/Cruise)
- insurance type subtitle → travel product line subtitle
- SyncPay → SyncRevenue Payouts
- agent roles → travel-agency roles (Travel Consultant, Senior Travel Consultant, Branch Manager, Senior Agent)

**Operational data preserved (out of scope):** `privacy@syncsirius.com`, `contato@syncsirius.com`, LinkedIn URLs — these are functional identifiers, not display copy strings.

**Settings locale defaults:** BRL and America/Sao_Paulo added as first options and defaults in currency/timezone selects. Full i18n-based user-preference persistence deferred to a later epic.

**SEO rewrites:** All dashboard OG/meta descriptions rewritten from scaffold boilerplate to functional product descriptions in all 3 locales.

**Test updates:** 10 tests updated across 7 files to match new vocabulary (DashboardHome, RevenueRecovery, Payouts, Contact, HeroProductPanel, App.routes, Home.story-2-4.e2e).

### Completion Notes

- All 7 tasks complete. All 101 test files pass (859 tests). typecheck exit 0. Build exit 0.
- Zero remaining SyncSyrius display strings in locale JSONs.
- Parity guard passes — new currency/timezone keys were added in all 3 locales simultaneously.
- Reviewer note: The hero panel badge "SYNC SIRIUS · COMMISSION ENGINE" uses uppercase company slug form — reviewer may prefer "SYNCREVENUE · COMMISSION ENGINE" if the panel is product-scoped. Left as Sync Sirius per brand matrix (umbrella tag context).

### File List

- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/pt-BR/translation.json`
- `src/i18n/locales/es/translation.json`
- `src/pages/dashboard/DashboardHome.tsx`
- `src/pages/dashboard/RevenueRecovery.tsx`
- `src/pages/dashboard/Payouts.tsx`
- `src/pages/dashboard/Insights.tsx`
- `src/pages/dashboard/Settings.tsx`
- `src/pages/dashboard/DashboardHome.test.tsx`
- `src/pages/dashboard/RevenueRecovery.test.tsx`
- `src/pages/dashboard/Payouts.test.tsx`
- `src/components/sections/Contact.test.tsx`
- `src/components/sections/HeroProductPanel.test.tsx`
- `src/App.routes.test.tsx`
- `src/pages/Home.story-2-4.e2e.test.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-05-23: Story 7.6 brand copy rewrite — SyncSyrius/insurance → SyncRevenue/Sync Sirius/travel-commission vocabulary. All 3 locale JSONs, 5 dashboard TSX mock data files, 7 test files updated. typecheck/test:run (101/859)/build all green.
