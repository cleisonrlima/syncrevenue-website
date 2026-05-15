# Story 2.2: Demo Request Form - Full Stack

Status: done

## Story

As a visitor ready to learn more about SyncRevenue,
I want to submit a demo request with my contact details and GDS system,
so that the Sync Sirius team can reach out and schedule a personalized demo.

## Acceptance Criteria

1. Given the `DemoForm` renders, when a visitor views it, then 8 fields are visible: name (required), email (required), company (required), phone (optional), role (required), GDS system dropdown (required: Amadeus/Sabre/Galileo/Worldspan/Other/None yet), message (optional); locale is auto-filled from `useLocaleStore` as a hidden field; required fields are marked with an asterisk; optional fields are labeled "(optional)".
2. Given a visitor leaves a required field and moves focus away, when blur fires on that field, then an inline error message appears below the field in the active locale; the error uses `text-destructive`; `aria-describedby` links the error to the field; no Toast is used for field validation errors.
3. Given a visitor has not completed all required fields, when they interact with the submit button, then the submit button is disabled and no API call is made.
4. Given a visitor completes all required fields with valid data and clicks submit, when the `useDemo` hook fires, then the button transitions to `submitting` state with a spinner plus "Sending..." text, remains disabled, and `POST /api/demo` fires with `{ name, email, company, phone, role, gds, message, locale }`.
5. Given the API receives a valid demo request, when `POST /api/demo` is processed, then rate limit runs first; Zod validates server-side with locale allowlist enforced; `leads.dao.ts` `insert()` writes to `demo_requests`; `sendNotification()` fires asynchronously; response is `{ success: true, message: '...' }` with HTTP 201; the DB write succeeds regardless of SMTP outcome.
6. Given the API returns success, when `useDemo` receives the response, then form status transitions to `success`; the form is replaced in-place by "Request received! Our team will reach out within 1 business day." in the active locale; the confirmation region has `aria-live="polite"`; no page redirect occurs.
7. Given a visitor submits the demo form a second time with the same email within 60 seconds, when `POST /api/demo` is processed, then the server checks `demo_requests` for an existing row with matching `email` and `created_at` within the last 60 seconds; if a duplicate is found, returns `{ success: true, message: '...' }` with HTTP 200 without inserting a second record; the visitor sees the same confirmation as a first submission.
8. Given the API returns a non-429 error, when `useDemo` receives the error, then form status transitions to `error`; a destructive bottom-right Toast appears and auto-dismisses in 5 seconds; the form is not cleared and the visitor can retry.
9. Given active locale is `pt-BR` throughout interaction, when validation errors, labels, and confirmation render, then all text displays in PT-BR.

## Tasks / Subtasks

- [x] Implement the backend demo submission route (AC: 5, 7)
  - [x] Replace the `501` placeholder in `server/routes/demo.ts` with the full handler behind the existing `formRateLimiter`.
  - [x] Use `demoSchema.safeParse(req.body)` before DAO calls; return HTTP 400 using `{ success: false, message, field? }` for validation failures.
  - [x] Check `leadsDao.findRecentByEmail(parsed.email, 60)` before insert; on duplicate return HTTP 200 success without inserting.
  - [x] Insert through `leadsDao.insert(parsed)` only; do not import `db` or call `db.prepare()` in the route.
  - [x] Fire `sendNotification()` after a successful insert without making SMTP delivery determine the HTTP response.
- [x] Implement frontend API and hook flow (AC: 3, 4, 6, 8)
  - [x] Add `postDemo()` to `src/lib/api.ts` as the sole fetch wrapper for `POST /api/demo`.
  - [x] Implement `src/hooks/useDemo.ts` with status enum `idle | submitting | success | error`, error state, and a `submitDemo()` action.
  - [x] Keep submit disabled while invalid or `submitting`; guard the hook so invalid form state cannot send an API call.
  - [x] Treat HTTP 429 separately from other failures if returned; story 2.2 needs Toast for non-429 failures, while later hardening can add inline 429 handling.
- [x] Implement `DemoForm` UI and client validation (AC: 1, 2, 3, 4, 6, 8, 9)
  - [x] Replace `src/components/sections/DemoForm.tsx` placeholder with controlled inputs/select/textarea using React state.
  - [x] Create a locale-aware client schema or validator in the client surface using the existing translation keys and `useLocaleStore`; do not import server code into the client if that causes server dependency leakage.
  - [x] Validate required fields on blur, not on keystroke; show translated inline errors with stable IDs linked via `aria-describedby`.
  - [x] Render the hidden locale field from `useLocaleStore.getState().locale` or the selected store value at submit time.
  - [x] Replace the form in place with the translated success title/body and `aria-live="polite"` after success.
  - [x] Add a destructive bottom-right Toast for non-429 API errors. If no Toast exists, create a small local `src/components/ui/Toast.tsx`/`Toaster` pattern using existing Tailwind tokens instead of adding a new UI framework.
- [x] Embed the demo form without taking over Story 2.4 scope (AC: 1, 6)
  - [x] Ensure `DemoForm` is reachable from the current public home flow, preferably inside the existing `DemoScheduler` placeholder section.
  - [x] Keep Story 2.4-owned CTA routing and final DemoScheduler copy/layout out of scope unless needed to make the form visible and testable.
  - [x] Do not use the existing `useModalStore` for Phase 1; the form is section-embedded and modal behavior is deferred.
- [x] Update translations (AC: 1, 2, 4, 6, 8, 9)
  - [x] Add any missing `forms.demo` keys in `en`, `pt-BR`, and `es`: role options, GDS options, required marker support if needed, success copy, rate-limit/general error text, and Toast text.
  - [x] Preserve dot-nested i18n structure with no flat keys and no strings hardcoded in components.
- [x] Add focused tests (AC: 1-9)
  - [x] Update `server/index.test.ts` expectations that currently assert `/api/demo` returns the `501` placeholder.
  - [x] Add or update `server/routes/demo.test.ts` or `server/index.test.ts` coverage for HTTP 201 insert, HTTP 200 duplicate retry, HTTP 400 validation failure, JSON envelope shape, and non-blocking mailer behavior.
  - [x] Add `src/hooks/useDemo.test.ts` or component tests verifying valid payload, submit state, success state, and failure retry behavior.
  - [x] Add `src/components/sections/DemoForm.test.tsx` coverage for visible fields, required/optional labels, blur validation, `aria-describedby`, disabled submit, PT-BR labels/errors, and success confirmation `aria-live`.
  - [x] Run `npm run typecheck`, relevant Vitest files, and at least `npm run test:run` before marking complete.

## Dev Notes

### Source Context

- Epic 2 goal: visitors can submit demo and contact inquiries with locale-aware validation, on-page confirmation, SMTP notifications, secured storage, and rate limiting. Story 2.2 owns the demo request path. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2: Lead Capture & Conversion (Phase 1 MVP - Part B)`]
- Story 2.2 covers FR9, FR12, FR16, FR22, and part of FR13 for demo submissions. Story 2.5 may refine SMTP subject/body details; Story 2.6 will harden accessibility/locale validation; Story 2.7 will harden security behavior. Do not defer baseline behavior required by this story's ACs. [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.2: Demo Request Form - Full Stack`]
- The demo form is a trust-funnel endpoint for security-sensitive travel agency buyers. The message field is important because buyers like Ricardo may describe GDS credential/security concerns before the first call. [Source: `_bmad-output/planning-artifacts/prd.md#Journey 3: Ricardo - The Owner Who Needs More Than a Promise`]
- PRD NFRs require `/api/demo` to respond within 3s under normal load, avoid duplicate records on retry, and never expose SMTP failure as a visitor-facing 5xx after lead save. [Source: `_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements`]

### Previous Story Intelligence

- Story 2.1 is complete and implemented the server foundation this story must reuse: Express app factory, route mounts, `formRateLimiter`, `demoSchema`, `leadsDao`, `sendNotification()`, JSON API fallbacks, and co-located server tests. [Source: `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md#Completion Notes List`]
- `server/routes/demo.ts` is intentionally still a `501` placeholder. Replace that file in place; do not create a parallel route. [Source: `server/routes/demo.ts`]
- `leadsDao.findRecentByEmail(email, withinSeconds)` and `leadsDao.insert(input)` already exist. Use them for idempotency and inserts. [Source: `server/dao/leads.dao.ts`]
- `sendNotification(subject, body)` already catches/logs SMTP errors and resolves. The route can call it without letting mail delivery change the API outcome. [Source: `server/lib/mailer.ts`]
- Existing route tests currently assert placeholder behavior for `/api/demo`; update them as part of implementation. [Source: `server/index.test.ts#mounts /api/demo (501 placeholder envelope)`]

### Current State of Files to Update

- `src/components/sections/DemoForm.tsx` only renders `<div id="demo-form" />`; it has no fields, state, validation, or success/error UI.
- `src/hooks/useDemo.ts` is empty (`export {}`); create the hook here rather than embedding fetch/state logic directly in `DemoForm`.
- `src/lib/api.ts` is empty (`export {}`); all fetch calls must live here per architecture.
- `src/components/sections/DemoScheduler.tsx` only renders `<section id="demo-scheduler" />`; it can host `DemoForm` now, but Story 2.4 owns the final CTA section content and multi-entry routing.
- `src/components/sections/Contact.tsx` and `src/hooks/useContact.ts` are placeholders for Story 2.3. Do not implement contact behavior here.
- `src/i18n/locales/*/translation.json` already contain core `forms.demo` label/error/success keys, but role/GDS option labels and Toast-specific text may need additions in all three locales.

### Architecture Guardrails

- Stack is fixed: TypeScript strict mode, React 18, Vite 5, Express 4, SQLite via `better-sqlite3`, Zod 3, Zustand, i18next/react-i18next, and Nodemailer. Do not add Redux, Formik, React Hook Form, an ORM, GraphQL, SSR, or a second backend framework. [Source: `_bmad-output/planning-artifacts/architecture.md#Technology Stack - Pre-Defined`]
- Public API route is `POST /api/demo`; responses must use `{ success: true, data?, message? }` or `{ success: false, message, field? }`. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- API and DB fields remain `snake_case` where applicable. The demo payload fields are already simple lower-case names; do not introduce camelCase response fields like `createdAt`. [Source: `_bmad-output/planning-artifacts/architecture.md#API JSON Naming - snake_case throughout`]
- All SQL stays inside DAO files. Route handlers call DAO methods only. [Source: `_bmad-output/planning-artifacts/architecture.md#Data Access Boundary`]
- Locale flow is `useLocaleStore` -> form payload -> API -> DB `locale`. Do not read locale directly from `i18next` inside `DemoForm` for the submitted value. [Source: `_bmad-output/planning-artifacts/architecture.md#i18n Boundary`]
- Form state enum is `idle | submitting | success | error`. Keep this in `useDemo.ts`. [Source: `_bmad-output/planning-artifacts/architecture.md#Form Submission State Machine`]
- Validation errors are inline and never Toast. Success replaces the form. Non-rate-limit API failure uses Toast. [Source: `_bmad-output/planning-artifacts/architecture.md#Error Handling`; `_bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns`]

### UX and Accessibility Requirements

- The form is section-embedded for Phase 1; do not implement a modal or use `useModalStore`. This avoids hiding the trust context that precedes the ask. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Modal and Overlay Patterns`; `_bmad-output/planning-artifacts/implementation-readiness-report-2026-05-14.md#Premature / Conflicting Architecture Artifacts`]
- Labels are always above fields. Required fields have an asterisk. Optional fields include "(optional)" in the label. Placeholders are not labels. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns`]
- Field validation occurs on blur, not on every keystroke and not submit-only. Error messages are one sentence and specific. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns`]
- Confirmation copy must be confident next-step language and remain on the page: "Request received! Our team will reach out within 1 business day." [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Experience Mechanics`]
- Use `aria-live="polite"` or a `role="status"` live region for the success confirmation so assistive tech announces the update without interrupting the current task. [Source: MDN `aria-live` reference]
- React controlled inputs must stay consistently controlled; initialize optional fields to empty strings rather than `undefined` in component state. [Source: React official `<input>` reference]

### Server Route Details

- Suggested success messages can use existing translation-independent API text such as `"Demo request received"`; the client should display localized confirmation from i18n, not the server message.
- For Zod failures, prefer first issue mapping: `field = issue.path[0]?.toString()` and message `"Invalid demo request"` or a safe generic string. Do not echo technical validation internals to the visitor.
- `sendNotification()` may be called without awaiting the returned promise, or awaited after insert because it swallows failures. To preserve response latency, prefer fire-and-forget with `.catch()` only if TypeScript/lint requires it.
- Notification content in this story only needs enough internal context to make Story 2.2 functional. Story 2.5 owns exact business formatting for subject/body across demo and contact.

### Testing Requirements

- Server tests should use the existing direct Express `request()` harness and isolated `DB_PATH` pattern from Story 2.1. [Source: `server/test-utils/request.ts`; `server/index.rateLimit.test.ts`]
- Co-locate new tests beside source files. Do not create `__tests__/` directories. [Source: `_bmad-output/planning-artifacts/architecture.md#Test Organization - Co-located`]
- Component tests should use React Testing Library and existing i18n/test setup. Existing public section tests show the repo pattern. [Source: `src/components/sections/Hero.test.tsx`; `src/test/setup.ts`]
- Verify the duplicate retry path by inserting once, posting the same email again within 60 seconds, and asserting row count does not increase.
- Verify SMTP does not block success by mocking `sendNotification()` rejection or relying on the existing mailer swallow behavior.

### Latest Technical Notes

- Installed package versions are the source of truth for this story: `react@^18.3.1`, `vite@^5.4.21`, `zod@^3.25.76`, `zustand@^4.5.7`, `express@^4.22.2`, `express-rate-limit@^8.5.2`, `better-sqlite3@^12.10.0`, and `nodemailer@^8.0.7`. Do not upgrade packages as part of Story 2.2 unless an install or security issue blocks implementation. [Source: `package.json`]
- Zod supports `safeParse()` for non-throwing validation paths; this is the right fit for route handlers and client validation. [Source: Zod official documentation]
- MDN documents `aria-live="polite"` as appropriate for updates that should be announced when assistive technology is idle; use this for the non-urgent success confirmation. [Source: MDN `aria-live` reference]

### Project Structure Notes

- Expected write surface:
  - `server/routes/demo.ts`
  - possibly `server/routes/demo.test.ts` and updates to `server/index.test.ts`
  - `src/lib/api.ts`
  - `src/hooks/useDemo.ts`
  - `src/components/sections/DemoForm.tsx`
  - `src/components/sections/DemoScheduler.tsx` only enough to render the form
  - optional `src/components/ui/Toast.tsx` or equivalent if no Toast exists
  - `src/i18n/locales/en/translation.json`, `src/i18n/locales/pt-BR/translation.json`, `src/i18n/locales/es/translation.json`
- Keep Story 2.3 contact form, Story 2.4 final CTA section, Story 2.5 exact email formatting, Story 2.6 full form accessibility audit, and Story 2.7 security hardening out of this implementation except where this story's ACs explicitly require baseline behavior.
- Detected planning variance: architecture mentions shadcn/ui generated components, but this repo currently has custom UI components only (`GradientButton`, `SectionHeader`) and no shadcn-generated Toast. Implement the minimal missing UI locally using project styling unless the project has a hidden shadcn setup the developer verifies first.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 2.2: Demo Request Form - Full Stack`
- `_bmad-output/planning-artifacts/prd.md#Lead Capture & Conversion`
- `_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements`
- `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Integration Points`
- `_bmad-output/planning-artifacts/architecture.md#Communication Patterns`
- `_bmad-output/planning-artifacts/ux-design-specification.md#DemoForm`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns`
- `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md#Completion Notes List`
- `server/routes/demo.ts`
- `server/schemas/demo.schema.ts`
- `server/dao/leads.dao.ts`
- `server/lib/mailer.ts`
- `src/components/sections/DemoForm.tsx`
- `src/hooks/useDemo.ts`
- `src/lib/api.ts`
- `src/i18n/locales/en/translation.json`
- React official docs: `https://react.dev/reference/react-dom/components/input`
- Zod official docs: `https://zod.dev/`
- MDN ARIA live regions: `https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Red phase: `npm run test:run -- server/routes/demo.test.ts src/hooks/useDemo.test.ts src/components/sections/DemoForm.test.tsx server/index.test.ts server/index.rateLimit.test.ts` failed against the placeholder route/hook/form as expected.
- Focused validation passed: `npm run test:run -- server/routes/demo.test.ts src/hooks/useDemo.test.ts src/components/sections/DemoForm.test.tsx server/index.test.ts server/index.rateLimit.test.ts` (30 tests).
- Type validation passed: `npm run typecheck`.
- Full regression passed: `npm run test:run` (37 files, 176 tests). A first full-suite run had one lazy-load timing failure in `src/pages/Privacy.test.tsx`; the test passed in isolation and the rerun passed without code changes.
- Senior review baseline passed: `npm run test:run -- server/routes/demo.test.ts src/hooks/useDemo.test.ts src/components/sections/DemoForm.test.tsx server/index.test.ts server/index.rateLimit.test.ts` (30 tests).
- Senior review fixes passed: `npm run test:run -- src/lib/api.test.ts src/hooks/useDemo.test.ts src/components/sections/DemoForm.test.tsx server/routes/demo.test.ts server/index.test.ts server/index.rateLimit.test.ts` (33 tests).
- Senior review type validation passed: `npm run typecheck`.
- Senior review full regression attempted: `npm run test:run` passed 177 tests and failed only the two known privacy lazy-load timing tests; rerun of `npm run test:run -- src/pages/Privacy.test.tsx src/pages/Privacy.story-1-10.e2e.test.tsx` passed (7 tests).
- Senior review Playwright demo spec was blocked by environment sandboxing: `npm run dev` failed because `tsx watch` could not open `/tmp/tsx-1001/30.pipe` (`EPERM`), and standalone Vite could not bind `127.0.0.1:5173` (`EPERM`).

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Validation checklist applied during story creation; story includes previous story intelligence, current placeholder state, architecture guardrails, UX/accessibility constraints, tests, and known planning variances.
- No `project-context.md` file was found in the repository during persistent-fact loading.
- Implemented `POST /api/demo` using existing `formRateLimiter`, server-side `demoSchema.safeParse`, DAO-only duplicate lookup/insert, and non-blocking notification dispatch.
- Added client `postDemo()` and `useDemo()` state machine with invalid-submit guard, 429 status preservation, success/error transitions, and retry-preserving error handling.
- Replaced the blank `DemoForm` with locale-aware controlled fields, blur validation, hidden locale from `useLocaleStore`, in-place live success confirmation, and local destructive Toast for non-429 API failures.
- Embedded the form in the existing `DemoScheduler` section only enough to make it reachable in the public home flow, leaving Story 2.4 CTA routing/copy scope untouched.
- Added role/GDS option translations in `en`, `pt-BR`, and `es`, plus focused backend, hook, and component coverage for AC 1-9.
- Senior review fixed duplicate-submit guarding before React re-render, strict API success-envelope validation, stale Toast clearing before retry, and incomplete File List documentation.

### File List

- `_bmad-output/implementation-artifacts/2-2-demo-request-form-full-stack.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `server/index.rateLimit.test.ts`
- `server/index.test.ts`
- `server/routes/demo.test.ts`
- `server/routes/demo.ts`
- `src/components/sections/DemoForm.test.tsx`
- `src/components/sections/DemoForm.tsx`
- `src/components/sections/DemoScheduler.tsx`
- `src/components/ui/Toast.tsx`
- `src/hooks/useDemo.test.ts`
- `src/hooks/useDemo.ts`
- `src/lib/api.test.ts`
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/es/translation.json`
- `src/i18n/locales/pt-BR/translation.json`
- `src/lib/api.ts`
- `tests/e2e/demo-request.spec.ts`

### Change Log

- 2026-05-15: Completed Story 2.2 demo request full-stack implementation and validation; story ready for review.
- 2026-05-15: Senior Developer Review completed; auto-fixed duplicate-submit, malformed API envelope, stale Toast retry, and File List documentation issues; story marked done.

### Senior Developer Review (AI)

Reviewer: Dev on 2026-05-15

Outcome: Approve after auto-fixes.

Checklist summary:
- Story status verified as reviewable; epic/story resolved as 2.2.
- Story context, architecture, UX form patterns, current package stack, File List, and git changes reviewed.
- MCP resources checked; no MCP resources were configured, so official references were consulted for React controlled inputs, Zod `safeParse`, and `aria-live`.
- Acceptance Criteria 1-9 cross-checked against implementation and focused tests.
- Security/data-boundary review confirmed rate limiter runs before validation, route uses DAO-only persistence, server Zod locale/GDS allowlists are enforced, and SMTP failure is non-blocking.

Findings fixed:
- [MEDIUM] `useDemo()` could dispatch duplicate API calls if `submitDemo()` was invoked twice before React committed the `submitting` state. Fixed with an immediate ref guard and regression coverage in `src/hooks/useDemo.test.ts`.
- [MEDIUM] `postDemo()` treated malformed 2xx responses without `success: true` as successful submissions. Fixed by requiring the success envelope and adding `src/lib/api.test.ts`.
- [LOW] A previous non-429 Toast could remain visible while retrying, including across a later 429 failure. Fixed by clearing stale Toast state before valid resubmission and adding component coverage.
- [MEDIUM] File List omitted source/test files discovered in git, including the new API wrapper test and E2E demo request spec. File List updated.

Validation:
- `npm run typecheck`
- `npm run test:run -- src/lib/api.test.ts src/hooks/useDemo.test.ts src/components/sections/DemoForm.test.tsx server/routes/demo.test.ts server/index.test.ts server/index.rateLimit.test.ts`
- `npm run test:run -- src/pages/Privacy.test.tsx src/pages/Privacy.story-1-10.e2e.test.tsx`
- `npm run test:run` attempted; only known privacy timing tests failed in the full-suite run and passed when isolated.
- `npm run test:e2e -- demo-request.spec.ts --project=chromium` attempted; blocked by sandbox port/IPC `EPERM`, not by assertion failure.
