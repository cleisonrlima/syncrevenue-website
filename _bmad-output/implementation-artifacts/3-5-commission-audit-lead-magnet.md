# Story 3.5: Commission Audit Lead Magnet

Status: done

<!-- Note: Validation completed during create-story. Story is ready for dev-story. -->

## Story

As a travel agency back-office manager in the PT-BR market,
I want to submit my BSP data for a free commission leakage analysis,
so that I can bring concrete evidence of recoverable revenue to my director without committing to a full demo.

## Acceptance Criteria

1. **Given** Story 3.5 is being implemented, **when** `server/db.ts initSchema()` runs, **then** an `audit_requests` table is created if absent with columns: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `name TEXT NOT NULL`, `email TEXT NOT NULL`, `company TEXT NOT NULL`, `role TEXT NOT NULL`, `gds TEXT NOT NULL`, `notes TEXT`, `locale TEXT NOT NULL CHECK (locale IN ('en','pt-BR','es'))`, `created_at TEXT NOT NULL DEFAULT (datetime('now'))`; rate limiting on `POST /api/audit` uses the same 20 req / 15-min window as `/api/demo` and `/api/contact` via `createFormRateLimiter()`.

2. **Given** a commission audit section is added to the home page, **when** a visitor scrolls to it, **then** the section explains the free audit offer (30 days BSP data → leakage report), exposes a clear CTA that opens or scrolls to the audit request form, and renders inside the existing `React.lazy` + `Suspense` + `ErrorBoundary` trio in `Home.tsx`.

3. **Given** the commission audit form renders, **when** a visitor views it, **then** fields are: name (required), email (required), company (required), role (required), GDS system dropdown (required: Amadeus/Sabre/Galileo/Worldspan/Other/None yet), notes (optional); locale is auto-filled from `useLocaleStore` as a hidden field; required fields show an asterisk; the form uses the same label-above + blur-validation + `text-destructive` + `aria-describedby` patterns as `DemoForm.tsx` and `Contact.tsx`.

4. **Given** a visitor submits the audit form with valid data, **when** `POST /api/audit` is processed, **then** the request passes `formRateLimiter`, is validated by a Zod schema with locale allowlist, is stored via an `auditDao.insert()` call (no inline `db.prepare()` in the route), triggers a fire-and-forget `sendNotification()` to `NOTIFY_EMAIL`, returns `{ success: true, message: '...' }` with HTTP 201 (or HTTP 200 if a duplicate by email within 60 seconds is detected, matching `/api/demo` behavior), and the DB write succeeds regardless of SMTP outcome; the visitor sees an in-place confirmation rendered inside an `aria-live="polite"` region.

5. **Given** the section position in `Home.tsx`, **when** the file is inspected, **then** `CommissionAudit` is mounted immediately after `SyncRevenue` and before `Services`, wrapped in its own `ErrorBoundary` + `Suspense` block with a `SectionSkeleton` fallback matching the established convention; the existing Marcus trust-build scroll order (Hero → SyncRevenue → … → Team → DemoScheduler → Contact) is preserved.

6. **Given** the audit form on a mobile viewport (`< 640px`), **when** rendered, **then** all input fields and the submit button are full-width, no fields sit side-by-side, the submit button has `min-h-[44px] whitespace-nowrap`, the form is fully keyboard-operable, and the in-place confirmation is announced by screen readers via `aria-live="polite"`.

7. **Given** active locale is `pt-BR` throughout interaction, **when** the section copy, form labels, validation errors, success confirmation, and Toast render, **then** all visible text displays in PT-BR; EN and ES strings are also present in the i18n bundle and selected when the locale changes; `t()` calls use the existing `defaultValue` discipline.

## Tasks / Subtasks

- [x] Task 1: Backend — DB schema + DAO factory (AC: 1, 4)
  - [x] Extend `server/db.ts initSchema()` to add an `audit_requests` table matching AC1 exactly. Use `CREATE TABLE IF NOT EXISTS` so the call remains idempotent on server boot. Do not drop or alter existing tables.
  - [x] Create `server/dao/audit.dao.ts` mirroring `server/dao/leads.dao.ts` — export an `AuditRequestInput` interface, `AuditRequestRow` interface, `AuditDao` interface, `createAuditDao(database)` factory, and a default `auditDao` singleton built against `defaultDb`. Expose `insert(input)`, `findRecentByEmail(email, withinSeconds=60)`, `list({locale?, limit?, offset?})`, and `getById(id)`. Use prepared statements at factory time.
  - [x] Add `server/dao/audit.dao.test.ts` covering insert returns row, `findRecentByEmail` within window, list with filter + pagination, getById. Use the existing in-memory DB pattern from `server/dao/leads.dao.test.ts`.

- [x] Task 2: Backend — Zod schema + Express route (AC: 1, 4)
  - [x] Create `server/schemas/audit.schema.ts` exporting `auditSchema` (z.object) with: `name` string trim min(1) max(200), `email` string trim toLowerCase email max(254), `company` string trim min(1) max(200), `role` string trim min(1) max(200), `gds` `z.enum(GDS_VALUES)` (reuse `GDS_VALUES` from `demo.schema.ts`), `notes` optional string trim max(2000) (use `.optional().or(z.literal('')).transform(v => v ? v : undefined)`), `locale` `z.enum(LOCALES)`. Export `AuditPayload = z.infer<typeof auditSchema>`. Add `server/schemas/audit.schema.test.ts` covering valid/invalid payloads.
  - [x] Create `server/routes/audit.ts` mirroring `server/routes/demo.ts` — mount the `createFormRateLimiter()` middleware, `safeParse` the body, return HTTP 400 with `{ success, message, field? }` on invalid, call `auditDao.findRecentByEmail(parsed.email, 60)` and return HTTP 200 success if duplicate, otherwise `auditDao.insert(parsed)` and fire `void sendNotification(...).catch(...)` with subject `New Commission Audit Request — ${parsed.company}` and a body listing name/email/company/role/GDS/notes/locale/timestamp. Return HTTP 201 with `{ success: true, message: 'Audit request received' }`. Do not import `db` directly in the route.
  - [x] Mount the router in `server/index.ts` immediately after the contact router: `app.use('/api/audit', auditRouter)`.
  - [x] Add `server/routes/audit.test.ts` covering HTTP 201 insert, HTTP 200 duplicate, HTTP 400 validation failure (including locale outside allowlist), JSON envelope shape, non-blocking SMTP. Extend `server/index.rateLimit.test.ts` (or add an `/api/audit`-specific assertion) so the 21st request inside the window returns HTTP 429 with `{ success: false, message: 'Too many requests' }`.

- [x] Task 3: Frontend — API wrapper + hook (AC: 4, 6, 7)
  - [x] Add `postAudit(payload)` to `src/lib/api.ts` as the sole `fetch` wrapper for `POST /api/audit`. Mirror the `postDemo` envelope (`success`, `message`, optional `field`) and error shape; return a discriminated union or throw with the API status attached so the hook can branch on 429.
  - [x] Create `src/hooks/useAudit.ts` mirroring `src/hooks/useDemo.ts` — export a `createAuditSchema(t)` factory that returns a locale-aware Zod schema using `t('forms.audit.errors.*', { defaultValue: '...' })`, export `GDS_OPTIONS` and `ROLE_OPTIONS` (reuse the existing constants if already exported by `useDemo`; otherwise import them). Export `useAudit()` with a `status` enum (`idle | submitting | success | error`), `error`, `isSubmitting`, and `submitAudit(values)` action. Guard the submit path against invalid state.
  - [x] Add `src/hooks/useAudit.test.ts` mirroring `useDemo.test.ts` — cover valid payload, submitting state, success state, 429 vs generic error branches.

- [x] Task 4: Frontend — Section + Form component (AC: 2, 3, 6, 7)
  - [x] Create `src/components/sections/CommissionAudit.tsx` exporting a default React component that renders the section markup (heading, subheading, value-prop bullets, CTA) and embeds an inline `AuditForm`. Use the existing `SectionHeader` primitive and the `MotionSection` wrapper for scroll-triggered animation parity with other Phase 2 sections. The section id MUST be `id="commission-audit"`.
  - [x] Create the form as either a co-located component inside `CommissionAudit.tsx` or a sibling `AuditForm.tsx` — use `forwardRef<AuditFormHandle>` with `useImperativeHandle` exposing `focusFirstField()` so a multi-CTA convergence pattern is available if a future story routes multiple buttons here (mirrors `DemoForm`).
  - [x] Implement controlled inputs/select/textarea using React state, blur-validation via `createAuditSchema(t)`, asterisk markers on required labels, `aria-describedby` linking each error to its field, `text-destructive` styling for errors, and a hidden `locale` field populated from `useLocaleStore`. Submit button uses `GradientButton type="submit"` with the exact same mobile classes as `DemoForm`/`Contact`: `w-full min-h-[44px] sm:w-auto sm:justify-self-start whitespace-nowrap`.
  - [x] On success, replace the form in place with a translated success title/body inside `<div aria-live="polite" tabIndex={-1}>` and focus it (mirror `DemoForm` success-focus pattern). On non-429 error, render a destructive bottom-right `Toast` via the existing `src/components/ui/Toast.tsx`.
  - [x] Add `src/components/sections/CommissionAudit.test.tsx` covering: visible fields with required/optional labels, blur validation errors in active locale, disabled submit while invalid, `aria-describedby` wiring, PT-BR labels/errors, success in-place confirmation with `aria-live="polite"`, submit button class assertions (`w-full`, `sm:w-auto`, `min-h-[44px]`, `whitespace-nowrap`).

- [x] Task 5: Frontend — Home composition (AC: 2, 5)
  - [x] Add `const CommissionAudit = lazy(() => import('@/components/sections/CommissionAudit'))` to `src/pages/Home.tsx`.
  - [x] Mount the section between `SyncRevenue` and `Services` in JSX order — wrap in its own `<ErrorBoundary>` + `<Suspense fallback={<SectionSkeleton className="min-h-[400px]" label="Loading commission audit" />}>` block. Do not change any other section's position or wrapping.
  - [x] Verify code-splitting: `npm run build` output must show `CommissionAudit-*.js` as its own chunk (alongside the other section chunks), and `dist/client/assets/index-*.js` must NOT inline its contents.

- [x] Task 6: i18n — translations across EN / PT-BR / ES (AC: 2, 3, 4, 6, 7)
  - [x] Add `sections.commissionAudit.*` keys in all three `src/i18n/locales/{en,pt-BR,es}/translation.json` files: `heading`, `subheading`, `bullet1`, `bullet2`, `bullet3`, `ctaLabel`. PT-BR is the primary market — copy must read naturally for a back-office manager (use "auditoria gratuita", "leakage" → "vazamento de comissões", "BSP" stays untranslated). EN and ES must be locale-distinct, not copy-pasted.
  - [x] Add `forms.audit.*` keys mirroring `forms.demo` structure: `nameLabel`, `nameError`, `emailLabel`, `emailErrorRequired`, `emailErrorFormat`, `companyLabel`, `companyError`, `roleLabel`, `roleError`, `roleOptionPlaceholder`, `gdsLabel`, `gdsError`, `gdsOptionPlaceholder`, `notesLabel`, `notesPlaceholder`, `submit`, `submitting`, `successTitle`, `successBody`, `errorGeneric`, `errorRateLimit`, `requiredMarker`. Keys must not exceed three levels of nesting (project convention). Every new `t()` call MUST pass a `defaultValue` to satisfy the `defaultValue` discipline.
  - [x] Run the existing deep-key i18n parity test (`src/i18n/index.test.ts`) to confirm EN, PT-BR, and ES bundles all expose the same shape under the new keys.

- [x] Task 7: E2E + verification (AC: 1-7)
  - [x] Add `tests/e2e/commission-audit.spec.ts` covering: section visible after `SyncRevenue` and before `Services`; form submits with valid PT-BR data and shows in-place confirmation; required-field blur validation in EN and PT-BR; mobile 375px viewport — all fields and submit are full-width with `min-h-[44px]`. Reuse the helpers/patterns from `tests/e2e/mobile-ux.spec.ts`.
  - [x] Run `npm run typecheck`.
  - [x] Run `npm run test:run`.
  - [x] Run `npm run build` and confirm the new `CommissionAudit-*.js` chunk appears.
  - [x] Run `npm run test:e2e -- tests/e2e/commission-audit.spec.ts` (or document any sandbox blocker in the Dev Agent Record, matching Story 3.4's convention).
  - [x] Do NOT run `npm run lhci:mobile` regression in this story unless verifying that the new section did not push LCP past 2.5s (AC5 of Story 3.4 already documents an outstanding LCP deferral).

## Dev Notes

### Source Context

- Epic 3 is the Phase 2 polish + conversion epic. Story 3.5 introduces a second conversion path tailored for back-office managers in the PT-BR market who need ROI evidence before committing to a full demo. [Source: `_bmad-output/planning-artifacts/epics.md:763` Epic 3 framing; `_bmad-output/planning-artifacts/epics.md:873` Story 3.5 AC list]
- The Marcus / Ricardo / Brazilian back-office personas guide the trust-build scroll order. The audit lead magnet must reinforce, not interrupt, that journey — hence the strict AC5 position constraint. [Source: `_bmad-output/planning-artifacts/prd.md` Journeys 2-3]
- Phase 1 (Epic 2) shipped the demo and contact form stack — DB, DAO factory, Zod schema, rate limiter, SMTP mailer, locale capture, success aria-live, Toast for errors. Story 3.5 MUST reuse those primitives end-to-end; building a parallel form stack is the most likely failure mode for this story. [Source: `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md`; `2-2-demo-request-form-full-stack.md`; `2-3-contact-form-full-stack.md`]
- The `/api/demo` 60-second duplicate-by-email guard is a deliberate UX choice (form retries should look like success, not 4xx). `/api/audit` should follow the same pattern. [Source: `server/routes/demo.ts:24-32`; epics.md story 2.2 AC7]

### Previous Story Intelligence

- **Story 3.4 (Mobile UX Polish Pass)** established the mobile contract every new form must honor: 44px tap targets on all interactive controls, `w-full sm:w-auto min-h-[44px] whitespace-nowrap` on submit buttons, no horizontal overflow at 375px, no fields side-by-side below 640px, mobile-hamburger overlay parity. The unit test pattern `expect(submit).toHaveClass('w-full', 'sm:w-auto', 'min-h-[44px]', 'whitespace-nowrap')` was added in Story 3.4's deferred-findings resolution — repeat it for the new audit submit. [Source: `_bmad-output/implementation-artifacts/3-4-mobile-ux-polish-pass.md`]
- **Story 3.2 (Animations)** established `MotionSection` as the wrapper for scroll-triggered fade-in on section entry. The `CommissionAudit` section should use it for parity with other Phase 2 sections, and Motion imports MUST stay out of `Home.tsx` / `App.tsx` / `main.tsx` (only the section chunk depends on Motion). [Source: `_bmad-output/implementation-artifacts/3-2-animations-micro-interactions.md`]
- **Story 3.3 (SEO)** added `useDocumentMeta` for locale-reactive head management. No new SEO keys are required for 3.5 (it's an in-page section, not a new route), but do NOT touch `useDocumentMeta`, sitemap generation, or hreflang behavior. [Source: `_bmad-output/implementation-artifacts/3-3-seo-metadata-meta-tags-og-hreflang-sitemap.md`]
- **Story 2.6 (Form Accessibility & Locale Validation)** locked in the locale-aware client validation pattern: `createDemoSchema(t)` / `createContactSchema(t)` factories that return Zod schemas closure-bound to translated error messages. Replicate this verbatim as `createAuditSchema(t)` — do not inline string literals. [Source: `_bmad-output/implementation-artifacts/2-6-form-accessibility-locale-aware-validation.md`]
- **Story 2.7 (Security Hardening)** locked in the locale allowlist enforcement on the server (`z.enum(LOCALES)` and CHECK constraint at the DB level) and the rate-limit envelope (`{ success: false, message: 'Too many requests' }`). Repeat both. [Source: `_bmad-output/implementation-artifacts/2-7-security-hardening-rate-limiting-headers-locale-allowlist.md`]

### Current State of Files to Update

- `server/db.ts` — single-file schema bootstrap. The `initSchema()` block at lines 24-72 is where the `audit_requests` `CREATE TABLE IF NOT EXISTS` belongs. The file already runs `initSchema(db)` once on import; no extra wiring needed. [Source: `server/db.ts:23-77`]
- `server/index.ts` — Express app factory. The audit router mount belongs at line 40 (right after `app.use('/api/contact', contactRouter)`), before the `/api/admin/*` routes. [Source: `server/index.ts:38-44`]
- `src/pages/Home.tsx` — section composition. The new section import + JSX block belongs after line 7 (`SyncRevenue`) and the JSX between lines 36 and 38 (between the `SyncRevenue` ErrorBoundary block and the `Services` ErrorBoundary block). [Source: `src/pages/Home.tsx:1-75`]
- `src/lib/api.ts` — single source of truth for all `fetch` calls. The `postAudit()` wrapper belongs here next to `postDemo`/`postContact`. Do not call `fetch()` from hooks or components directly. [Architectural rule, established in Story 2.1]

### Canonical Patterns to Reuse (Anti-Reinvention Checklist)

- **DAO factory + default singleton** — `createAuditDao(database = defaultDb)` + `export const auditDao = createAuditDao()`. Mirrors `server/dao/leads.dao.ts:42-107`.
- **Locale-aware Zod schema factory** — `createAuditSchema(t)` returns a fresh schema per call so error messages reflect the current `t`. Mirrors `createDemoSchema` in `src/hooks/useDemo.ts`.
- **Rate limiter** — `createFormRateLimiter()` from `server/middleware/rateLimit.ts:7`. Do NOT create a new limiter constant.
- **Fire-and-forget SMTP** — `void sendNotification(subject, body).catch(err => console.error(...))`. The DB write outcome is independent of the SMTP outcome. Mirrors `server/routes/demo.ts:36-51`.
- **API envelope strictness** — always `{ success: boolean, message: string }`; add `field?: string` on validation failures. HTTP 201 for new insert, HTTP 200 for duplicate retry, HTTP 400 for validation, HTTP 429 for rate limit. Mirrors all of Epic 2.
- **`useImperativeHandle` multi-CTA convergence** — even though Story 3.5 only has one CTA (the section's own button), expose `focusFirstField()` so future stories can route additional CTAs to the form without refactor. Mirrors `DemoForm` + `Contact`.
- **`defaultValue` discipline** — every `t('key')` MUST pass `{ defaultValue: '...' }`. The ESLint rule for this is tracked in Story 3.10 (not yet shipped), so reviewer eyeballs are still the enforcement mechanism — be diligent.
- **Lazy + Suspense + ErrorBoundary trio** — every public homepage section is mounted inside this exact structure in `Home.tsx`. The `CommissionAudit` section adds one more occurrence.
- **`data-*` markers over CSS classes for E2E** — when adding the Playwright spec, prefer `data-testid` (e.g., `data-testid="commission-audit-section"`, `data-testid="commission-audit-form"`, `data-testid="commission-audit-submit"`) over class selectors. Mirrors recent test hardening in Story 3.4.

### Architecture Guardrails

- Express version, helmet, cors, express-rate-limit, better-sqlite3, Zod versions are pinned in `package.json` and `package-lock.json`. Do not bump any dependency in this story.
- The DB path is resolved from `DB_PATH` env var (default `data/sync_sirius.db`). WAL journaling is enabled at boot. The `audit_requests` table participates in WAL automatically — no extra steps.
- The `LOCALES` and `GDS_VALUES` constants in `server/schemas/demo.schema.ts` are the canonical source. Import them in `audit.schema.ts` rather than re-declaring (a copy-pasted enum will silently drift).
- The DB CHECK constraint on `locale` must match the Zod `z.enum(LOCALES)`. Mismatch will surface only at insert time as a SQLite constraint error — keep them aligned.
- Tests live co-located next to source (no `__tests__/` folders). Server tests use the in-memory DB pattern from `server/test-utils/`; reuse it.

### Library / Framework Requirements

- **Zod** — current pinned version (see `package.json`). Use `.safeParse()` on the server (so the route can return HTTP 400 with field path) and the same schema factory on the client for inline blur validation.
- **better-sqlite3** — synchronous prepared statements via `database.prepare(...)`. Prepare statements at DAO factory time, not per call.
- **express-rate-limit** — `draft-7` standard headers, `legacyHeaders: false`. Reuse `createFormRateLimiter()`.
- **React 18** — concurrent rendering. Suspense boundaries must wrap the lazy section. Use `forwardRef` for the form so `useImperativeHandle` works.
- **react-i18next** — `useTranslation()` hook. Every `t()` call MUST pass `{ defaultValue: '...' }`.
- **Framer Motion** — only via the `MotionSection` wrapper; do NOT import `motion` directly into `CommissionAudit.tsx`. The wrapper handles `prefers-reduced-motion`.

### Testing Requirements

- Add server-side tests at `server/dao/audit.dao.test.ts`, `server/schemas/audit.schema.test.ts`, `server/routes/audit.test.ts`. Use the in-memory better-sqlite3 pattern (`new Database(':memory:')` + `initSchema()`).
- Add client tests at `src/hooks/useAudit.test.ts` and `src/components/sections/CommissionAudit.test.tsx`. Mock `postAudit` via `vi.mock('@/lib/api', ...)`.
- Add an E2E spec at `tests/e2e/commission-audit.spec.ts` covering the happy path, the PT-BR locale path, and the 375px mobile contract.
- All existing tests must continue to pass — Story 3.5 must not regress the 261 currently-green tests.

### Project Structure Notes

- Expected NEW files:
  - `server/dao/audit.dao.ts`, `server/dao/audit.dao.test.ts`
  - `server/schemas/audit.schema.ts`, `server/schemas/audit.schema.test.ts`
  - `server/routes/audit.ts`, `server/routes/audit.test.ts`
  - `src/hooks/useAudit.ts`, `src/hooks/useAudit.test.ts`
  - `src/components/sections/CommissionAudit.tsx`, `src/components/sections/CommissionAudit.test.tsx`
  - `tests/e2e/commission-audit.spec.ts`
- Expected UPDATED files:
  - `server/db.ts` (add `audit_requests` table to `initSchema`)
  - `server/index.ts` (mount audit router)
  - `src/lib/api.ts` (add `postAudit`)
  - `src/pages/Home.tsx` (add lazy import + Suspense + ErrorBoundary block between SyncRevenue and Services)
  - `src/i18n/locales/{en,pt-BR,es}/translation.json` (add `sections.commissionAudit.*` and `forms.audit.*`)
- Do NOT create `__tests__/` directories. Do NOT modify generated build output, lockfiles, or non-target dependencies.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md:873`] — Story 3.5 user story + acceptance criteria
- [Source: `_bmad-output/planning-artifacts/epics.md:763`] — Epic 3 framing
- [Source: `_bmad-output/planning-artifacts/prd.md`] — PT-BR market personas and Journey 3 (Ricardo, the owner who needs more than a promise)
- [Source: `_bmad-output/planning-artifacts/architecture.md`] — Stack pins, DB conventions, API envelope strictness
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md:314,564,583`] — Mobile breakpoints, label-above + blur-validation, focus indicators, reduced-motion
- [Source: `server/db.ts:23-77`] — `initSchema` location for the new `audit_requests` table
- [Source: `server/dao/leads.dao.ts:42-107`] — DAO factory + singleton pattern to mirror
- [Source: `server/routes/demo.ts:10-57`] — Route handler shape to mirror
- [Source: `server/schemas/demo.schema.ts:3-18`] — `LOCALES` and `GDS_VALUES` constants to reuse
- [Source: `server/middleware/rateLimit.ts:1-22`] — `createFormRateLimiter()` to reuse
- [Source: `src/hooks/useDemo.ts`] — locale-aware schema factory + hook pattern to mirror
- [Source: `src/components/sections/DemoForm.tsx:1-100`] — `forwardRef` + `useImperativeHandle` + controlled form pattern to mirror
- [Source: `src/pages/Home.tsx:1-75`] — Section composition + lazy/Suspense/ErrorBoundary pattern; insertion point is between `SyncRevenue` and `Services`
- [Source: `_bmad-output/implementation-artifacts/3-4-mobile-ux-polish-pass.md`] — Mobile contract (44px, `w-full sm:w-auto`, `whitespace-nowrap`); class-assertion unit-test pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context)

### Debug Log References

- Initial `audit.dao.test.ts` included a noise test that created a second DAO without `initSchema`, which threw `no such table: audit_requests`. Removed the dao2 reference and kept the CHECK-constraint assertion via the main dao only.
- `MotionSection` types do not declare `data-testid`, but TSX intrinsic data-attribute pass-through means typecheck remained clean. No type changes required.
- Initial e2e mobile-contract assertion used `submitBox.width >= 300` which failed at 375px viewport: page padding (px-4 = 32px) + form padding (p-6 = 48px) leaves a 295px content area. Threshold relaxed to ≥ 280 to match the actual layout.
- LHCI mobile gate intentionally NOT re-run in this story — Story 3.4 already documents the LCP 3018ms and color-contrast regressions; running again would only reconfirm those known issues. The new `CommissionAudit-*.js` chunk is below-the-fold (lazy) and does not enter the Hero LCP path.

### Completion Notes List

- Created by BMAD create-story workflow.
- Implemented all 7 tasks. All ACs satisfied.
- Backend reuses Epic 2 primitives: `createFormRateLimiter()`, `LOCALES` / `GDS_VALUES` from `demo.schema.ts`, fire-and-forget `sendNotification()` pattern, API envelope strictness (201 insert / 200 duplicate / 400 invalid / 429 rate-limit). No `db.prepare()` in the route — all DB access goes through `auditDao`.
- Frontend reuses Epic 2 patterns: `forwardRef` + `useImperativeHandle(focusFirstField)` (multi-CTA convergence), locale-aware Zod schema factory `createAuditSchema(t)`, hidden locale field populated from `useLocaleStore`, blur-validation with `aria-describedby` wiring, `Toast` for non-429 errors, in-place success replacement with `aria-live="polite"`.
- Section mounted between `SyncRevenue` and `Services` in `Home.tsx` with the standard `<ErrorBoundary><Suspense fallback={<SectionSkeleton .../>}>` wrapper.
- i18n keys added in all three locales (en, pt-BR, es) under `forms.audit.*` and `sections.commissionAudit.*`. Deep-key parity test passes.
- Submit button class assertion test (`w-full`, `sm:w-auto`, `min-h-[44px]`, `whitespace-nowrap`) added — mirrors Story 3.4 review-resolution unit-test pattern.
- Build verification: `CommissionAudit-D8423iaR.js` chunk emitted at 9.78 kB (gzip 3.35 kB). Main bundle grew by ~4.7 kB (api.ts additions for `postAudit` + `AuditApiError`). Acceptable.
- Verification results: `npm run typecheck` ✅; `npm run test:run` 298/298 ✅ (was 261, +37 new); `npm run build` ✅; `npm run test:e2e -- tests/e2e/commission-audit.spec.ts --project=chromium` 3/3 ✅.

### File List

**New:**
- `server/dao/audit.dao.ts`
- `server/dao/audit.dao.test.ts`
- `server/schemas/audit.schema.ts`
- `server/schemas/audit.schema.test.ts`
- `server/routes/audit.ts`
- `server/routes/audit.test.ts`
- `src/hooks/useAudit.ts`
- `src/hooks/useAudit.test.ts`
- `src/components/sections/CommissionAudit.tsx`
- `src/components/sections/CommissionAudit.test.tsx`
- `tests/e2e/commission-audit.spec.ts`

**Modified:**
- `server/db.ts` (added `audit_requests` table to `initSchema`)
- `server/index.ts` (mounted `auditRouter` at `/api/audit`)
- `server/index.rateLimit.test.ts` (added `/api/audit` rate-limit coverage + cross-route isolation)
- `src/lib/api.ts` (added `AuditPayload`, `AuditSuccessResponse`, `AuditApiError`, `postAudit`)
- `src/pages/Home.tsx` (added lazy `CommissionAudit` between `SyncRevenue` and `Services`)
- `src/i18n/locales/en/translation.json` (added `forms.audit.*`, `sections.commissionAudit.*`)
- `src/i18n/locales/pt-BR/translation.json` (added `forms.audit.*`, `sections.commissionAudit.*`)
- `src/i18n/locales/es/translation.json` (added `forms.audit.*`, `sections.commissionAudit.*`)

### Change Log

| Date       | Change                                          | Author |
|------------|-------------------------------------------------|--------|
| 2026-05-15 | Story created from epics.md and ready-for-dev   | claude |
| 2026-05-16 | Full implementation: 7 tasks, 298 tests pass, build green, e2e 3/3 | claude |
