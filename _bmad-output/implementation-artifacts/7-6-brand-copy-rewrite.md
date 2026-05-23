# Story 7.6: Brand Copy Rewrite — SyncSyrius/Insurance → SyncRevenue/Travel Commission

Status: not-started

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

- [ ] **Task 1: Brand name sweep across translation JSONs (AC: 1)**
  - [ ] `rg -i 'SyncSyrius' src/i18n/locales/` — enumerate occurrences
  - [ ] For each: apply the product-vs-company decision matrix (Dev Notes) and rewrite in all 3 locales
  - [ ] Re-grep to confirm zero hits remain

- [ ] **Task 2: Domain vocabulary sweep across translation JSONs (AC: 2)**
  - [ ] `rg -wi '(carrier|policy|clawback|premium|underwriter|insurance)' src/i18n/locales/` — enumerate
  - [ ] Apply term mappings; pay attention to compound phrases (e.g. "carrier statement" → "GDS statement")
  - [ ] All 3 locales

- [ ] **Task 3: Mock data swap in dashboard pages (AC: 2)**
  - [ ] `src/pages/dashboard/DashboardHome.tsx` — `DISCREPANCIES` carrier values + policy IDs rewritten to GDS providers + PNR-like IDs (e.g. `POL-8823` → `PNR-K7H2X`)
  - [ ] `src/pages/dashboard/RevenueRecovery.tsx` — same DISCREPANCIES rewrite + table column header text where it directly mirrors mock data
  - [ ] `src/pages/dashboard/Payouts.tsx` — PAYOUTS agent names stay (people are people), but `role` values aligned to agency roles ("Travel Consultant", "Senior Agent", "Branch Manager")
  - [ ] `src/pages/dashboard/Insights.tsx` — `REGIONAL_DATA` stays; `PRODUCT_PERFORMANCE` lines rewritten from insurance product lines ("Life Ins.", "Health", "Auto", "Property") → travel product lines ("Air", "Hotel", "Car", "Cruise")
  - [ ] `src/pages/dashboard/Settings.tsx` — Billing card examples ("Visa ending in 4242") stay (real-world payment refs); plan tier ("ENTERPRISE") aligned to SyncRevenue pricing model

- [ ] **Task 4: Settings page locale defaults (AC: 5)**
  - [ ] Add BRL + EUR currency options before USD in the General sub-component
  - [ ] Add America/Sao_Paulo + Europe/London timezone options
  - [ ] Default selection logic deferred to a later epic (real user state)

- [ ] **Task 5: SEO + a11y attribute sweep (AC: 6)**
  - [ ] Audit every `alt`, `aria-label`, `<title>` via i18n keys touched by Story 7.5
  - [ ] Audit OG image (`og:image`) URLs — Epic 7 pages currently inherit `/og-default.png` from `index.html`; if a per-page OG image is needed it gets a follow-up story (out of 7.6 scope)

- [ ] **Task 6: Cross-model brand-voice review (AC: 4)**
  - [ ] Per CLAUDE.md "Cross-Model Review (Mandatory)", reviewer agent (non-Claude if dev = Claude, or vice versa) audits the rewritten copy against brand-voice reference
  - [ ] Findings → new story per "Review Findings → New Story" rule if non-trivial

- [ ] **Task 7: Test sweep (AC: 7)**
  - [ ] `npm run test:run` × 3 — exit 0
  - [ ] Locale parity guard exit 0
  - [ ] `npm run typecheck` exit 0
  - [ ] `npm run dev` smoke: visit `/v2`, `/demo`, every `/dashboard/*` in en/pt-BR/es

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
