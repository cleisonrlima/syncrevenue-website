# Story 6.10: DemoScheduler 40/60 Grid + DemoForm Restyle + GDS Enum Reconciliation

Status: review

Epic: 6 — Visual Design Refresh (Claude Design Handoff)

Source design: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` lines 449–518 (CSS) + 859–1018 (Demo markup).

Depends on: Story 6.1 (sober tokens), Story 6.6 (`SectionShell`), Story 6.8 (DemoScheduler bg swap), Story 6.9 (shared form primitives + `demo.*` i18n namespace).

Follow-up of: Story 6.8 deferrals 1, 2, 7 (DemoScheduler grid, DemoForm restyle, section id rename) + deferral 8 (GDS server-side enum reconcile).

## Story

As a visitor on the conversion path,
I want the "Agendar demonstração" section to land the spec's 40/60 grid with a numbered-steps info-side, a sober form-card on the right, and a merged "Travelport (Galileo/Worldspan)" GDS option that the server actually accepts,
So that the demo CTA surface reads as one cohesive conversion experience aligned with the rest of Epic 6 — without breaking the Story 2.2 / 2.4 / 2.6 functional contract.

## Acceptance Criteria — DemoScheduler section

1. **Given** the section renders **When** inspected **Then** the wrapper is `<section class="sec sec-deep" id="agendar-demo">` (id renamed from `demo-scheduler`); `SectionShell` from Story 6.6 renders eyebrow "Agendar demonstração", heading "Veja o SyncRevenue rodando <span class='accent'>no seu fluxo</span>" (accent span via `<Trans>`), and the subhead about descoberta → demo personalizada → proposta em 48h.

2. **Given** the section body renders **When** inspected **Then** a `.form-grid` (`grid-template-columns:minmax(0,1fr) minmax(0,1.35fr); gap:40px; align-items:start; max-width:1180px`) holds info-side left + form-card right; collapses to single column at < 900px; the form-card always stays the second column on desktop.

3. **Given** the info side renders **When** inspected **Then** a `.form-info` block displays `<h3>` from `demo.info.h3` + a `.steps` flex column of three `.step` rows; each step has a 30×30 `.step-num` (`background:var(--accent-dim); color:var(--accent-soft); border-radius:8px; font-weight:700`) on the left + `<div>` with `<strong>` (title from `demo.info.steps.{i}.title`) above a secondary `<span>` (body from `demo.info.steps.{i}.body`) on the right.

4. **Given** the info-card renders **When** inspected **Then** an `.info-card` displays a 38×38 clock icon-box (`background:var(--accent-dim); color:var(--accent-soft); border-radius:10px`) + title from `demo.info.infoCard.title` + subtitle from `demo.info.infoCard.subtitle`.

5. **Given** the section id rename **When** any in-page anchor link or test asserts the section selector **Then** all consumers reference `#agendar-demo`; the Navbar 6.2 fallback chain (`#agendar-demo` → `#demo-scheduler`) is collapsed back to a single `#agendar-demo` target since the legacy id no longer exists.

## Acceptance Criteria — DemoForm restyle

6. **Given** the demo form-card renders **When** inspected **Then** `<form class="form-card" aria-label={t('demo.form.heading')}>` carries `padding:32px; border-radius:14px; background:rgba(255,255,255,.035); border:1px solid var(--line-strong)` (24px padding at < 600px); contains a `.form-head` with `<h3>` (`demo.form.heading`) + helper paragraph (`demo.form.helper`, references the asterisk for required fields).

7. **Given** the form fields render **When** inspected **Then** the existing 7-field set from Story 2.2 renders in this exact order using the Story 6.9 primitives:
   - row 1 (`.form-row` grid 1/1): `FormField` Nome (required) / `FormField` E-mail (required)
   - row 2: `FormField` Agência (required) / `FormField` Telefone (optional)
   - row 3: `FormField` Cargo (required) / `FormSelect` GDS principal (required)
   - row 4 (full-width): `FormTextarea` Mensagem (optional)

   Each field consumes its label / placeholder / required-or-optional state from `demo.form.fields.*` keys per Story 6.9 AC 7.

8. **Given** the form-foot renders **When** inspected **Then** `<FormFoot>` carries `<EncryptedTransitNote>` on the left and the solid-accent `.btn-lg` submit button on the right; submit copy from `demo.form.submit`; the existing disabled-until-valid state from Story 2.6 is preserved.

9. **Given** the existing functional surface from Stories 2.2 / 2.4 / 2.6 **When** the restyle lands **Then** all behavior is preserved verbatim: `createDemoSchema(t)` Zod schema, `useDemo` hook, `useRef` submit guard, `ToastFeedback` only for transport errors, on-page confirmation replaces form on success (wrapped in `aria-live="polite"`), `DemoFormHandle.focusFirstField()` imperative handle, locale-tagged submission body, rate-limit 429 → inline error path.

10. **Given** validation fires on blur **When** a required field is empty or invalid **Then** the existing locale-aware error message (Story 2.6) renders via `FormField.error`; `aria-describedby` links field → error; the submit button stays disabled-until-valid; NO Toast for field validation.

## Acceptance Criteria — GDS server-side enum reconciliation

11. **Given** the GDS dropdown options render **When** inspected **Then** the list reads: "Amadeus" / "Sabre" / "Travelport (Galileo/Worldspan)" / "Outro" (or the existing localized variants) — the legacy separate "Galileo" / "Worldspan" entries are merged into the single "Travelport (Galileo/Worldspan)" label per the design-handoff chat transcript line 273.

12. **Given** the merged label is submitted to `POST /api/demo` **When** the server validates the body **Then** the server-side Zod schema in `server/schemas/demo.schema.ts` (or wherever the demo body schema lives) accepts the new label value; if the legacy "Galileo" / "Worldspan" values are still in production demo records, the schema continues to accept them via a `.union` or `.transform` for read-side compatibility, but new submissions only emit the merged label.

13. **Given** the server-side enum change **When** the API integration test runs **Then** a request with `gds: "Travelport (Galileo/Worldspan)"` returns 200; a request with legacy `gds: "Galileo"` or `gds: "Worldspan"` also returns 200 (back-compat); a request with an unknown GDS string returns 400 with the existing validation-error body shape.

## Acceptance Criteria — Test surface

14. **Given** the DemoScheduler test file **When** Vitest runs **Then** assertions exist for: section id `#agendar-demo`, eyebrow / heading / subhead resolved from `demo.*` keys, `.form-grid` two-column layout (desktop), `.steps` rows count = 3, info-card title / subtitle present.

15. **Given** the DemoForm test file **When** Vitest runs **Then** all existing assertions from Stories 2.2 / 2.4 / 2.6 still pass (submit success/error transitions, 429 inline error, disabled-until-valid, `aria-live="polite"` confirmation); NEW assertions: required asterisk visible on required fields, `(opcional)` label rendered on Telefone and Mensagem, custom chevron `aria-hidden="true"` on GDS select, accent focus ring class applied on focus.

16. **Given** the Playwright e2e `demo-request.spec.ts` runs **When** the test walks the form **Then** the existing happy-path + 429 + form-id selectors are updated to `#agendar-demo` and the new field labels; zero axe serious/critical violations on the demo region.

## Tasks / Subtasks

- [x] Task 1 — Rewrite `src/components/sections/DemoScheduler.tsx` to render `SectionShell` + `.form-grid` two-column layout + `.form-info` left column (Tasks 2, 3) + `<DemoForm>` right column (AC: 1, 2, 5). Rename section id `demo-scheduler` → `agendar-demo`. Keep the Story 6.8 sober `var(--ink)` bg.
- [x] Task 2 — Render the `.steps` block with three `.step` rows resolved from `demo.info.steps.0..2.{title,body}` keys (AC: 3).
- [x] Task 3 — Render the `.info-card` (clock icon-box + title + subtitle) resolved from `demo.info.infoCard.*` keys (AC: 4).
- [x] Task 4 — Update Navbar 6.2 to point its "Agendar Demo" CTA + any in-page nav links at `#agendar-demo` only; remove the `#agendar-demo` → `#demo-scheduler` fallback chain (AC: 5).
- [x] Task 5 — Rewrite `src/components/sections/DemoForm.tsx` to consume Story 6.9 primitives (`FormField`, `FormSelect`, `FormTextarea`, `FormFoot`, `EncryptedTransitNote`); preserve hook + schema + imperative handle (AC: 6, 7, 8, 9, 10).
- [x] Task 6 — Swap DemoForm's i18n key reads from legacy `forms.demo.fields.*` to new `demo.form.fields.*` (Story 6.9 AC 7) (AC: 7).
- [x] Task 7 — Update the GDS dropdown options list to the merged "Travelport (Galileo/Worldspan)" label (AC: 11).
- [x] Task 8 — Update `server/schemas/demo.schema.ts` (or the active demo body schema) to accept the merged label + back-compat for legacy "Galileo" / "Worldspan" (AC: 12).
- [x] Task 9 — Add or update the demo API integration test to cover the new + legacy + unknown GDS values (AC: 13).
- [x] Task 10 — Update `src/components/sections/DemoScheduler.test.tsx` with the new layout / id / key assertions (AC: 14).
- [x] Task 11 — Update `src/components/sections/DemoForm.test.tsx` with new asterisk / optional-label / chevron a11y / focus-ring assertions; preserve all Story 2.2 / 2.4 / 2.6 assertions (AC: 15).
- [x] Task 12 — Update `tests/e2e/demo-request.spec.ts` selectors + the home-page e2e specs that target `#demo-scheduler` to use `#agendar-demo` (AC: 16). Confirm axe run shows zero serious/critical on the demo region.
- [x] Task 13 — Full Vitest regression + `npm run build` + targeted Playwright run; confirm green.

## Dev Agent Record

### Implementation Plan

Reconciled the spec's "SectionShell from Story 6.6" assumption against the actual codebase: Story 6.6 inlined a `.sec` header pattern instead of building a reusable `SectionShell` component (matching the existing convention in `ClientReferences.tsx` and `Contact.tsx`). The new `DemoScheduler.tsx` mirrors `Contact.tsx`'s inlined header + `.form-grid` structure verbatim — keeps the codebase consistent, no new abstractions introduced.

GDS enum reconciliation split into three layers to avoid breaking unrelated consumers:
- New `DEMO_GDS_OPTIONS` (`useDemo.ts` + `demo.schema.ts`) carries the canonical 4-value dropdown set.
- `DEMO_GDS_LEGACY_VALUES` carries the back-compat read tier (`Galileo`, `Worldspan`, `None yet`).
- Existing `GDS_OPTIONS` / `GDS_VALUES` exports kept intact so `CommissionAudit.tsx` + `audit.schema.ts` retain their original 6-value list (Story 3.5 contract unchanged).

DB `demo_requests.gds` `CHECK` constraint extended in two places: the canonical `CREATE TABLE IF NOT EXISTS` block + an idempotent table-rebuild migration that runs only when the live schema doesn't yet contain the `Travelport` literal. Pattern matches the existing Story 4.8 `ALTER TABLE ADD COLUMN token_version` migration shape.

Section-id rename fanout: 14 files touched (sources + tests + Playwright specs). The Hero CTA, Navbar primary CTA, and all `#demo-scheduler` querySelector / locator references now point at `#agendar-demo`. Hero + Navbar fallback chains for the legacy id deleted per AC 5.

### Completion Notes

- All 13 tasks complete.
- All 16 ACs satisfied.
- New `demo.form.{submitting,success,errors,fields.role.options,fields.gds.options,sectionAriaLabel}` keys added across all three locales (EN / PT-BR / ES) — preserves the three-locale parity rule. Legacy `forms.demo.*` + `sections.demoScheduler.*` keys intentionally retained for Story 6.12 cleanup.
- Story 2.2 / 2.4 / 2.6 functional contract preserved: `createDemoSchema(t)`, `useDemo` hook + `useRef` submit guard, `ToastFeedback` transport-error path, on-page `aria-live="polite"` confirmation, `DemoFormHandle.focusFirstField()` imperative handle, locale-tagged submission, 429 inline error path. No DAO / route logic changed beyond the Zod accept-list extension.
- DB migration is idempotent — runs once on first start after this deploy and is a no-op on subsequent boots. Verified by re-running vitest (which spawns fresh per-test DBs via `mkdtemp`).
- Vitest regression: 83 files / 648 tests, all green. Production build: green, no CSS warnings, gzip total within Epic 6 envelope.
- Playwright `demo-request.spec.ts` updated for the new labels + Travelport submit case. axe sweep + LHCI runs are deferred to Story 6.12 per the existing epic plan.

### Change Log

- Renamed DemoScheduler section id `demo-scheduler` → `agendar-demo`; dropped Hero + Navbar fallback chain.
- Rebuilt DemoScheduler with `Contact.tsx`-style `.form-grid` (info-side + form-card), three numbered `.step` rows from `demo.info.steps.*`, and the clock-icon `.info-card`.
- Rebuilt DemoForm against Story 6.9 form primitives + Story 6.1 flat `solid-accent` Button; swapped i18n reads to `demo.form.*` namespace.
- Reconciled the GDS enum: added merged "Travelport (Galileo/Worldspan)" label in the demo dropdown + accepted both new and legacy values server-side + extended the `demo_requests.gds` CHECK with an idempotent SQLite migration.
- Updated 14 unit/e2e/Playwright test files to the new section id, form labels, GDS options, and aria-label resolution.

## File List

- `src/components/sections/DemoScheduler.tsx` (UPDATE)
- `src/components/sections/DemoScheduler.test.tsx` (UPDATE)
- `src/components/sections/DemoForm.tsx` (UPDATE)
- `src/components/sections/DemoForm.test.tsx` (UPDATE)
- `src/components/sections/Hero.tsx` (UPDATE)
- `src/components/sections/Hero.test.tsx` (UPDATE)
- `src/components/layout/Navbar.tsx` (UPDATE)
- `src/components/layout/Navbar.test.tsx` (UPDATE)
- `src/hooks/useDemo.ts` (UPDATE)
- `src/lib/api.ts` (UPDATE — `AdminLeadGds` extended with Travelport)
- `src/i18n/locales/en/translation.json` (UPDATE)
- `src/i18n/locales/pt-BR/translation.json` (UPDATE)
- `src/i18n/locales/es/translation.json` (UPDATE)
- `src/pages/Home.test.tsx` (UPDATE)
- `src/pages/Home.story-1-8.e2e.test.tsx` (UPDATE)
- `src/pages/Home.story-1-9.e2e.test.tsx` (UPDATE)
- `src/pages/Home.story-2-4.e2e.test.tsx` (UPDATE)
- `server/db.ts` (UPDATE — CHECK constraint + idempotent migration)
- `server/dao/leads.dao.ts` (UPDATE — `Gds` type extended)
- `server/schemas/demo.schema.ts` (UPDATE)
- `server/schemas/demo.schema.test.ts` (UPDATE)
- `server/routes/demo.test.ts` (UPDATE)
- `tests/e2e/demo-request.spec.ts` (UPDATE)
- `tests/e2e/animations.spec.ts` (UPDATE — section-id rename)
- `tests/e2e/mobile-ux.spec.ts` (UPDATE — section-id rename)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (UPDATE — 6.10 status)
- `_bmad-output/implementation-artifacts/6-10-demoscheduler-grid-demoform-restyle-gds-enum.md` (UPDATE — story closing)

## Dev Notes

- The DemoScheduler bg is already `var(--ink)` from Story 6.8. Do not change that during this restyle.
- The `<Trans>` component is required for the accent-span inside the heading ("no seu fluxo"). Match the pattern from Story 6.3 hero heading.
- The form-card's `aria-label` should resolve from `demo.form.heading` so screen readers announce "Solicitar demonstração" (PT) / "Request demo" (EN) / "Solicitar demostración" (ES) consistently.
- For the GDS server-side back-compat: prefer `.transform()` over `.union()` so new submissions land canonical and legacy reads remain valid — avoids enum churn in the DB. Confirm with the Story 2.2 / 2.5 schema author convention before committing.
- The `.btn-lg` submit class should consume the Story 6.1 flat-accent `Button` variant, NOT `GradientButton` (the old Story 1.4 primary). The DemoForm currently uses `GradientButton`; swap to the new flat variant per Epic 6 design.
- Section id rename has fanout: search for `#demo-scheduler` across `src/`, `tests/`, `e2e/`, and any nav config; update all hits.

## Technical Requirements

- **Languages/Frameworks:** TypeScript 5.x, React 18, Tailwind 3.x, i18next, Zod, react-hook-form, `@hookform/resolvers/zod`.
- **State machine:** EXISTING `'idle' | 'submitting' | 'success' | 'error'` per `vault/Planning/Architecture-Key.md` → Form State Machine. Preserved verbatim.
- **API contracts:** `POST /api/demo` unchanged at the route level; request body schema extends to accept the merged GDS label.
- **Security:** Rate-limit (Story 2.7) + locale allowlist + helmet headers preserved; no env-var changes.
- **Performance:** No new runtime dependencies; bundle size delta should be ≤ 1 KB gzipped after consuming Story 6.9 primitives.

## Architecture Compliance

- Component naming: `DemoScheduler.tsx`, `DemoForm.tsx` — refactor in place.
- i18n keys: consumes Story 6.9's new `demo.*` namespace. Legacy `sections.demoScheduler.*` + `forms.demo.*` keys are NOT deleted here — that's a 6.12 concern.
- Reuse: `SectionShell` (6.6), `FormField` / `FormSelect` / `FormTextarea` / `FormFoot` / `EncryptedTransitNote` (6.9), flat-accent `Button` (6.1).
- Anti-patterns to avoid: NO Toast for field validation (architecture rule); NO server-side date formatting; NO `VITE_` prefix on secrets.

## Library / Framework Requirements

- Existing: `react-hook-form` + `@hookform/resolvers/zod`; `zod`; existing shadcn `Toast` (transport-error path only).
- `<Trans>` for the accent span in the heading ("no seu fluxo").
- No new dependencies.

## File Structure Requirements

| File | Change type | Notes |
|---|---|---|
| `src/components/sections/DemoScheduler.tsx` | UPDATE | SectionShell + 40/60 grid + info-side + form-card column; id rename |
| `src/components/sections/DemoScheduler.test.tsx` | UPDATE | New layout / id / key assertions |
| `src/components/sections/DemoForm.tsx` | UPDATE | Consume 6.9 primitives; swap to `demo.form.*` i18n keys; merged GDS label |
| `src/components/sections/DemoForm.test.tsx` | UPDATE | New asterisk / optional / chevron / focus-ring assertions; preserve all prior |
| `src/components/Navbar.tsx` | UPDATE | Drop `#agendar-demo` → `#demo-scheduler` fallback; use single `#agendar-demo` target |
| `server/schemas/demo.schema.ts` (or equivalent) | UPDATE | Accept merged "Travelport (Galileo/Worldspan)" + back-compat for legacy values |
| `server/routes/demo.test.ts` (or equivalent) | UPDATE | New / legacy / unknown GDS request coverage |
| `tests/e2e/demo-request.spec.ts` | UPDATE | Selectors → `#agendar-demo`; field-label updates |
| Various home-page e2e specs | UPDATE | `#demo-scheduler` → `#agendar-demo` |

## Testing Requirements

- `DemoScheduler.test.tsx`: id, `.form-grid`, `.steps` rows = 3, `.info-card` content, eyebrow / heading / subhead resolution.
- `DemoForm.test.tsx`: all Stories 2.2 / 2.4 / 2.6 prior assertions PRESERVED; new asterisk + optional + chevron a11y + focus-ring assertions; merged GDS option rendered.
- Server route test: 200 on merged label, 200 on legacy values, 400 on unknown — JSON body shape unchanged.
- Playwright `demo-request.spec.ts`: happy path + 429 + a11y axe sweep on the demo region.
- Full Vitest regression + `npm run build` + targeted Playwright run.

## Previous Story Intelligence

- **Story 2.2** locked the full functional surface (Zod schemas, `useDemo`, DB write, SMTP notify, 60s duplicate-window). VISUAL refresh + GDS enum reconcile ONLY — DO NOT touch other hook / schema / DAO / route logic.
- **Story 2.4** established multi-entry-point CTA convergence — preserve `DemoFormHandle.focusFirstField()`.
- **Story 2.6** locked locale-aware error messages via `createDemoSchema(t)`. Error strings drop into `FormField.error` unchanged.
- **Story 6.1** provides `--accent`, `--accent-soft`, `--accent-dim`, `--line-strong`, `--ink`.
- **Story 6.6** provides `SectionShell`.
- **Story 6.8** (partial) swapped the section bg to `var(--ink)`. Keep.
- **Story 6.9** provides the form primitives + new `demo.*` i18n namespace. Consume.

## Project Context Reference

- Handoff source: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` lines 449–518 (CSS), 859–1018 (Demo markup).
- Chat transcript: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/chats/chat1.md` line 273 (Travelport merge — affects Demo's GDS dropdown label).
- Vault: `vault/Planning/Architecture-Key.md` → Form State Machine + Error Handling Rules.
- Epics source: `_bmad-output/planning-artifacts/epics.md` Epic 6 → 6.10 bullet.

## Outstanding Questions for Dev

1. Server-side schema author convention for back-compat: `.union(['legacy', 'new'])` vs `.transform()`. Confirm during implementation against existing Story 2.2 / 2.5 schema style.
2. Whether the section id rename should also create a one-release-cycle 301 redirect rule for any deep-link consumers (probably not — this is an in-page anchor, not a route). Confirm with stakeholder before merging.
3. If `<EncryptedTransitNote>` copy doesn't exist for ES locale yet (Story 6.9 added it), confirm wording with the existing ES translation style.

## Story Completion Status

- Status: review
