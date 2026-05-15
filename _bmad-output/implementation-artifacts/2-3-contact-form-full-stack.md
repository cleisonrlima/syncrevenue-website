# Story 2.3: Contact Form - Full Stack

Status: done

## Story

As a visitor with a non-demo inquiry,
I want to submit a contact message with a subject routing to the right service area,
so that the Sync Sirius team can respond to my specific inquiry.

## Acceptance Criteria

1. Given the Contact section renders with its form, when a visitor scrolls to it, then the form contains: name (required), email (required), subject/service dropdown (required: SyncRevenue, BI/Data Analytics, OBTs, Custom Development, Other), message (required); labels are above fields; required fields are asterisked; `SectionHeader` is used.
2. Given a visitor selects "BI/Data Analytics" from the subject dropdown and submits, when `POST /api/contact` is processed, then the same contact form handles BI/Analytics, OBT, and Custom Dev inquiries; no separate form exists; subject is included in the payload and SMTP notification for team routing.
3. Given a visitor submits the contact form with valid data, when `POST /api/contact` is processed, then rate limit runs; Zod `contactSchema` validates with locale allowlist enforced; `contacts.dao.ts` `insert()` writes to the `contacts` table; `sendNotification()` fires asynchronously; response is `{ success: true, message: '...' }` with HTTP 201.
4. Given the API returns success, when `useContact` receives the response, then the form is replaced in-place by confirmation in the active locale; `aria-live="polite"` is on the confirmation region; no redirect occurs.
5. Given field-level validation, when a visitor blurs an invalid field, then an inline error appears in the active locale; no Toast is used for field errors; submit is disabled until all required fields are valid.
6. Given the API returns 429, when `useContact` receives the error, then an inline error in the active locale appears below the form, not a Toast.
7. Given the contact form submission writes to DB, when the `contacts` row is inspected, then `locale` holds the value from `useLocaleStore` at time of submission.
8. Given a visitor submits the contact form a second time with the same email within 60 seconds, when `POST /api/contact` is processed, then the server checks `contacts` for an existing row with matching `email` and `created_at` within the last 60 seconds; if duplicate found, returns `{ success: true, message: '...' }` with HTTP 200 without inserting a second record.

## Tasks / Subtasks

- [x] Implement the backend contact submission route (AC: 2, 3, 7, 8)
  - [x] Replace the `501` placeholder in `server/routes/contact.ts`; keep `formRateLimiter` on `router.post('/')`.
  - [x] Use `contactSchema.safeParse(req.body)` before DAO calls; return HTTP 400 using `{ success: false, message: 'Invalid contact request', field? }` for validation failures.
  - [x] Use `contactsDao.findRecentByEmail(parsed.email, 60)` before insert; on duplicate return HTTP 200 success without inserting or sending a second notification.
  - [x] Insert through `contactsDao.insert(parsed)` only; do not import `db` or call `db.prepare()` in route handlers.
  - [x] Fire `sendNotification()` after successful insert without making SMTP delivery determine the HTTP response.
  - [x] Include `subject` in the notification subject or body; prefer subject `New Contact - ${parsed.subject}` and a body with name, email, subject, locale, and message.
- [x] Implement frontend API and hook flow (AC: 3, 4, 5, 6, 7)
  - [x] Add `ContactPayload`, `ContactSuccessResponse`, `ContactApiError`, and `postContact()` to `src/lib/api.ts`; keep all fetch calls in this file.
  - [x] Implement `src/hooks/useContact.ts` with status enum `idle | submitting | success | error`, error state, and `submitContact()` action.
  - [x] Mirror Story 2.2's duplicate-submit guard using an immediate ref so two quick calls cannot dispatch two API requests.
  - [x] Add `CONTACT_SUBJECT_OPTIONS = ['SyncRevenue', 'BI/Data Analytics', 'OBTs', 'Custom Development', 'Other'] as const`; use the same values in client validation and, if tightened server-side, in `contactSchema`.
  - [x] Capture submitted locale from `useLocaleStore.getState().locale` at submit time; do not read locale directly from `i18next` for the payload.
  - [x] Treat HTTP 429 distinctly so the UI can render an inline rate-limit error instead of a Toast.
- [x] Implement Contact section UI and client validation (AC: 1, 4, 5, 6)
  - [x] Replace `src/components/sections/Contact.tsx` placeholder with a section containing `SectionHeader`, the contact form, and localized copy.
  - [x] Use controlled inputs/select/textarea initialized to empty strings; keep React inputs controlled for their lifetime.
  - [x] Validate required fields on blur and before submit; show translated inline errors with stable IDs linked via `aria-describedby`.
  - [x] Disable submit while invalid or submitting; no API call should fire from invalid state.
  - [x] Render success as an in-place `role="status"` or equivalent live region with `aria-live="polite"`.
  - [x] Render 429 as an inline form-level error in the active locale below the form; do not show `Toast` for 429.
  - [x] For non-429 API failures, use the existing destructive `Toast` pattern from `DemoForm` unless implementation can meet architecture UX more simply with an inline generic error and tests document that choice.
- [x] Update translations (AC: 1, 4, 5, 6)
  - [x] Add missing `forms.contact` keys in `en`, `pt-BR`, and `es`: section eyebrow/heading/subtext if needed, subject option labels, rate-limit inline error, optional generic failure copy, and success confirmation.
  - [x] Preserve dot-nested i18n structure; do not hardcode user-visible strings in `Contact.tsx`.
- [x] Keep scope boundaries clean (AC: 1-8)
  - [x] Do not create separate BI, OBT, or Custom Development forms; the subject dropdown routes all non-demo inquiries.
  - [x] Do not change DemoForm or DemoScheduler behavior except if a shared helper is extracted with full regression coverage.
  - [x] Do not implement Story 2.5's full notification formatting beyond including enough subject/message data for routing.
  - [x] Do not implement Story 2.6's full form accessibility audit or Story 2.7 hardening beyond requirements explicit in this story.
- [x] Add focused tests (AC: 1-8)
  - [x] Add `server/routes/contact.test.ts` coverage for HTTP 201 insert, HTTP 200 duplicate retry, HTTP 400 validation failure, locale allowlist, JSON envelope shape, subject in notification, and non-blocking mailer behavior.
  - [x] Update `server/index.test.ts` expectation that currently asserts `/api/contact` returns the `501` placeholder.
  - [x] Keep `server/index.rateLimit.test.ts` passing for `/api/contact` 429 JSON behavior.
  - [x] Add or extend `src/lib/api.test.ts` for `postContact()`, including malformed 2xx envelope rejection and 429 status preservation.
  - [x] Add `src/hooks/useContact.test.ts` for valid payload, invalid guard, duplicate-submit guard, success transition, retryable failure, and 429 error state.
  - [x] Add `src/components/sections/Contact.test.tsx` for visible fields, subject options, labels/asterisks, blur validation, `aria-describedby`, disabled submit, locale payload, success `aria-live`, 429 inline error, no Toast for field errors/429, and PT-BR labels/errors.
  - [x] Run `npm run typecheck`, focused Vitest files, and `npm run test:run` before marking complete.

## Dev Notes

### Source Context

- Epic 2 goal: visitors can submit demo and contact inquiries with locale-aware validation, on-page confirmation, SMTP notifications, secured storage, and rate limiting. Story 2.3 owns the general contact path. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2: Lead Capture & Conversion (Phase 1 MVP - Part B)`]
- Story 2.3 covers FR6, FR10, FR11, FR12, FR13 baseline, FR16, and FR22 for non-demo inquiries. [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.3: Contact Form - Full Stack`; `_bmad-output/planning-artifacts/prd.md#Lead Capture & Conversion`]
- The contact form is the secondary conversion path for visitors who need BI/Data Analytics, OBTs, Custom Development, or non-demo SyncRevenue support. FR11 explicitly says these inquiries use the contact form service dropdown and no separate form. [Source: `_bmad-output/planning-artifacts/prd.md#Lead Capture & Conversion`]
- PRD NFRs require `/api/contact` to respond within 3s under normal load, avoid duplicate records on retry, enforce 20 requests per 15 minutes, and never expose SMTP failure as a visitor-facing 5xx after lead save. [Source: `_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements`]
- No `project-context.md` file was found during persistent-fact loading.

### Previous Story Intelligence

- Story 2.1 completed the backend foundation this story must reuse: Express app factory, mounted `/api/contact`, `formRateLimiter`, `contactSchema`, `contactsDao`, `sendNotification()`, JSON API fallbacks, and server test harness. [Source: `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md#Completion Notes List`]
- Story 2.2 completed the demo form path and established the frontend/backend pattern to mirror: route `safeParse`, DAO duplicate check, fire-and-forget notification, `src/lib/api.ts` fetch wrapper, hook state machine, controlled form, blur validation, localized success state, and focused tests. [Source: `_bmad-output/implementation-artifacts/2-2-demo-request-form-full-stack.md#Completion Notes List`]
- Story 2.2 senior review fixed issues that must not recur here: duplicate submissions before React re-render, malformed 2xx API envelopes treated as success, stale Toast state across retries, and incomplete File List documentation. [Source: `_bmad-output/implementation-artifacts/2-2-demo-request-form-full-stack.md#Senior Developer Review (AI)`]
- Recent git history confirms the relevant prior implementation landed in `feat(story-2.2): Demo Request Form - Full Stack`, touching `server/routes/demo.ts`, `src/lib/api.ts`, `src/hooks/useDemo.ts`, `src/components/sections/DemoForm.tsx`, `src/components/ui/Toast.tsx`, translations, and focused tests. [Source: `git show --stat 61d4de5`]
- Worktree note at story creation: `_bmad-output/story-automator/orchestration-2-20260515-153220.md` is already modified and unrelated. Do not revert or overwrite it while implementing this story. [Source: `git status --short`]

### Current State of Files to Update

- `server/routes/contact.ts` currently returns HTTP 501 `{ success: false, message: 'Contact submission not yet implemented' }` behind `formRateLimiter`. Replace this route in place; do not create a parallel route.
- `server/routes/demo.ts` is the reference implementation for this route's structure: `safeParse`, duplicate lookup, DAO insert, non-blocking `sendNotification()`, and 201/200 success envelopes.
- `server/dao/contacts.dao.ts` already provides `insert(input)`, `findRecentByEmail(email, withinSeconds)`, `list(filter)`, `markRead(id, read)`, and `getById(id)`. Use these methods; do not add raw SQL to routes.
- `server/schemas/contact.schema.ts` validates `name`, `email`, `subject`, `message`, and `locale`. It currently accepts any non-empty subject. Because this story defines fixed dropdown values, tightening `subject` to the same allowlist as the UI is acceptable and should be covered by tests.
- `src/components/sections/Contact.tsx` is only `export default function Contact() { return <section id="contact" /> }`; it has no copy, `SectionHeader`, form, validation, success, or error UI.
- `src/hooks/useContact.ts` is empty (`export {}`); implement contact submission state here instead of embedding API state in the component.
- `src/lib/api.ts` currently contains only demo payload/error/`postDemo()` code. Add contact support here and keep response-envelope validation at least as strict as `postDemo()`.
- `src/i18n/locales/*/translation.json` already include basic `forms.contact` labels/errors/success copy. They do not yet include fixed subject option labels or a contact-specific rate-limit inline message.
- `src/components/ui/Toast.tsx`, `GradientButton`, and `SectionHeader` already exist. Reuse them; do not add a UI framework.

### Architecture Guardrails

- Stack is fixed: TypeScript strict mode, React 18, Vite 5, Express 4, SQLite via `better-sqlite3`, Zod 3, Zustand, i18next/react-i18next, Nodemailer, Tailwind. Do not add Redux, Formik, React Hook Form, an ORM, GraphQL, SSR, or another backend framework. [Source: `_bmad-output/planning-artifacts/architecture.md#Technology Stack - Pre-Defined`; `package.json`]
- Public API route is `POST /api/contact`; responses must use `{ success: true, data?, message? }` or `{ success: false, message, field? }`. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- All SQL stays in DAO files. Route handlers call DAO methods only. [Source: `_bmad-output/planning-artifacts/architecture.md#Data Access Boundary`]
- API and DB fields stay `snake_case` where applicable. Do not introduce camelCase response fields like `createdAt`. [Source: `_bmad-output/planning-artifacts/architecture.md#API JSON Naming - snake_case throughout`]
- Locale flow is `useLocaleStore` -> form payload -> API -> DB `locale`. Do not read the submitted locale directly from i18next. [Source: `_bmad-output/planning-artifacts/architecture.md#i18n Boundary`]
- Form state enum is `idle | submitting | success | error`, consistent with `useDemo.ts` and architecture. [Source: `_bmad-output/planning-artifacts/architecture.md#Form Submission State Machine`]
- Validation errors are inline, success replaces the form, rate-limit 429 is inline, and SMTP failure is server-log only. [Source: `_bmad-output/planning-artifacts/architecture.md#Error Handling`; `_bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns`]

### Contact Implementation Details

- Use the exact subject values from the story: `SyncRevenue`, `BI/Data Analytics`, `OBTs`, `Custom Development`, `Other`. These should be the submitted payload values so the backend notification and admin contact list receive business-readable routing data.
- Suggested server success messages: `"Contact request received"` or `"Contact message received"`. The client should show localized confirmation from i18n, not rely on server copy for user-facing text.
- For Zod failures, map the first issue to `field = issue.path[0]?.toString()` and return a safe generic message. Do not echo technical Zod internals to the visitor.
- `sendNotification()` can be called fire-and-forget as in `server/routes/demo.ts`; it catches/logs internally, and route-local `.catch()` may log context if TypeScript/lint needs a handled promise.
- Notification body should include at least name, email, subject, locale, and message. Story 2.5 may refine exact formatting, but this story must include subject for routing.
- Duplicate retry logic uses email only, matching the AC and existing DAO method. Do not include subject/message in the duplicate key unless the story or architecture changes.

### UX and Accessibility Requirements

- `Contact.tsx` must keep `id="contact"` because Navbar and Footer link to `/#contact`. [Source: `src/components/layout/Navbar.tsx`; `src/components/layout/Footer.tsx`]
- Use `SectionHeader` from `src/components/ui/SectionHeader.tsx` as required by AC1. Keep labels above fields; placeholders are not labels. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns`]
- Required fields are name, email, subject/service, and message. Each required label gets an asterisk. There are no optional fields in Story 2.3.
- Field validation occurs on blur and before submit, not only after submit. Error text uses `text-destructive` and stable `aria-describedby` IDs.
- Confirmation remains on the page and replaces the form. Use `role="status"` plus `aria-live="polite"` for compatibility with assistive tech.
- Mobile form fields must be full-width and touch targets at least 44x44px; no horizontal overflow below 768px. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Mobile Considerations`]
- React controlled inputs must stay controlled; initialize all string fields to `''`, not `undefined`. [Source: React official `<input>` docs]

### Testing Requirements

- Server tests should use the existing direct Express `request()` harness and isolated `DB_PATH` temp database pattern from Story 2.2. [Source: `server/test-utils/request.ts`; `server/routes/demo.test.ts`]
- Co-locate tests beside source files. Do not create `__tests__/` directories. [Source: `_bmad-output/planning-artifacts/architecture.md#Test Organization - Co-located`]
- Component tests should use React Testing Library and the existing i18n/test setup. `DemoForm.test.tsx` is the closest form reference.
- Verify duplicate retry by posting once, posting the same email again within 60 seconds, and asserting the `contacts` row count and notification call count do not increase.
- Verify the 429 path at component/hook level without using Toast. Server-level rate limit is already covered in `server/index.rateLimit.test.ts`; keep it passing.
- Run at minimum:
  - `npm run typecheck`
  - `npm run test:run -- server/routes/contact.test.ts server/index.test.ts server/index.rateLimit.test.ts src/lib/api.test.ts src/hooks/useContact.test.ts src/components/sections/Contact.test.tsx`
  - `npm run test:run`

### Latest Technical Notes

- Installed package versions are the source of truth for implementation: `react@^18.3.1`, `vite@^5.4.21`, `zod@^3.25.76`, `zustand@^4.5.7`, `express@^4.22.2`, `express-rate-limit@^8.5.2`, `better-sqlite3@^12.10.0`, `nodemailer@^8.0.7`, `vitest@^4.1.6`, and Testing Library packages already in `package.json`. Do not upgrade packages as part of this story unless a failing install or security issue blocks implementation. [Source: `package.json`]
- Zod docs describe `.safeParse()` as returning a plain success/error result without `try/catch`, which matches route and hook validation paths. [Source: Zod official docs: `https://zod.dev/basics?curius=1296&id=handling-errors`]
- React docs state text inputs with a string `value` prop are controlled and should not switch between `undefined` and strings; initialize form values to empty strings. [Source: React official docs: `https://react.dev/reference/react-dom/components/input`]
- MDN documents `aria-live="polite"` as appropriate for non-urgent updates that should be announced without interrupting the current task. [Source: MDN ARIA docs: `https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live`]
- express-rate-limit v8 supports custom handlers and standard rate-limit headers; keep the existing `formRateLimiter` rather than adding a second limiter. [Source: express-rate-limit docs: `https://express-rate-limit.mintlify.app/reference/configuration`]

### Project Structure Notes

- Expected write surface:
  - `server/routes/contact.ts`
  - `server/routes/contact.test.ts`
  - `server/index.test.ts`
  - `src/lib/api.ts`
  - `src/lib/api.test.ts`
  - `src/hooks/useContact.ts`
  - `src/hooks/useContact.test.ts`
  - `src/components/sections/Contact.tsx`
  - `src/components/sections/Contact.test.tsx`
  - `src/i18n/locales/en/translation.json`
  - `src/i18n/locales/pt-BR/translation.json`
  - `src/i18n/locales/es/translation.json`
  - optionally `server/schemas/contact.schema.ts` and `server/schemas/contact.schema.test.ts` if subject is tightened to an enum
- Keep existing public section order in `src/pages/Home.tsx`: `DemoScheduler` then `Contact`. Do not move `Contact` ahead of `DemoScheduler` as part of this story.
- Detected planning variance: architecture references shadcn/ui generated form/toast components, but the repo currently uses custom `GradientButton`, `SectionHeader`, and `Toast`. Follow the current repo implementation unless the developer verifies a hidden shadcn setup.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 2.3: Contact Form - Full Stack`
- `_bmad-output/planning-artifacts/prd.md#Lead Capture & Conversion`
- `_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements`
- `_bmad-output/planning-artifacts/architecture.md#Data Architecture`
- `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Integration Points`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns`
- `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md#Completion Notes List`
- `_bmad-output/implementation-artifacts/2-2-demo-request-form-full-stack.md#Completion Notes List`
- `server/routes/contact.ts`
- `server/routes/demo.ts`
- `server/dao/contacts.dao.ts`
- `server/schemas/contact.schema.ts`
- `server/lib/mailer.ts`
- `src/components/sections/Contact.tsx`
- `src/components/sections/DemoForm.tsx`
- `src/hooks/useContact.ts`
- `src/hooks/useDemo.ts`
- `src/lib/api.ts`
- `src/i18n/locales/en/translation.json`
- React official docs: `https://react.dev/reference/react-dom/components/input`
- Zod official docs: `https://zod.dev/basics?curius=1296&id=handling-errors`
- MDN ARIA live docs: `https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live`
- express-rate-limit official docs: `https://express-rate-limit.mintlify.app/reference/configuration`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-15: Started BMAD dev-story workflow for story 2.3; loaded story, sprint status, config, and demo-form implementation references.
- 2026-05-15: Red phase confirmed expected failures in focused contact tests before implementation.
- 2026-05-15: Focused validation passed: `npm run test:run -- server/routes/contact.test.ts server/index.test.ts server/index.rateLimit.test.ts src/lib/api.test.ts src/hooks/useContact.test.ts src/components/sections/Contact.test.tsx` (6 files, 39 tests).
- 2026-05-15: Typecheck passed: `npm run typecheck`.
- 2026-05-15: Full regression passed after updating the contact schema test for the tightened subject allowlist: `npm run test:run` (41 files, 202 tests). One interim full-suite run exposed a transient lazy Hero timing failure in existing privacy tests; the privacy tests passed in isolation and the full suite passed on rerun.
- 2026-05-15: Senior review loaded story, sprint status, architecture/UX references, implementation files, and tests; MCP resource discovery returned no configured resources, so review used repository docs/story references.
- 2026-05-15: Senior review auto-fixed stale contact field error state, missing native `required` semantics, incomplete File List entries, and lazy-section test timing regressions exposed by full-suite runs.
- 2026-05-15: Final validation passed: `npm run typecheck`; focused story suite `npm run test:run -- server/routes/contact.test.ts server/index.test.ts server/index.rateLimit.test.ts src/lib/api.test.ts src/hooks/useContact.test.ts src/components/sections/Contact.test.tsx` (6 files, 40 tests); `npm run test:run` (41 files, 203 tests).

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Validation checklist applied during story creation; story includes previous story intelligence, current placeholder state, architecture guardrails, UX/accessibility constraints, tests, and known planning variances.
- No `project-context.md` file was found in the repository during persistent-fact loading.
- Implemented `POST /api/contact` with Zod validation, subject/locale allowlists, DAO-only persistence, 60-second duplicate email suppression, and fire-and-forget SMTP notification containing routing subject data.
- Added contact API client and `useContact` state machine with immediate duplicate-submit guard, 429 preservation, and locale capture from `useLocaleStore`.
- Replaced the Contact placeholder with a localized, controlled, accessible form using `SectionHeader`, inline field/form errors, in-place live success confirmation, and fixed subject routing options.
- Added focused backend, API, hook, component, and schema coverage for acceptance criteria and regressions.
- Senior review fixed contact form accessibility/validation polish so required fields are programmatically required and corrected fields clear stale inline error state immediately.
- Senior review hardened existing lazy-loaded Home/Privacy tests with longer async waits after full regression exposed timing-only failures under the larger Story 2.3 test surface.

### File List

- `_bmad-output/implementation-artifacts/2-3-contact-form-full-stack.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `server/index.test.ts`
- `server/routes/contact.ts`
- `server/routes/contact.test.ts`
- `server/schemas/contact.schema.ts`
- `server/schemas/contact.schema.test.ts`
- `src/components/sections/Contact.tsx`
- `src/components/sections/Contact.test.tsx`
- `src/hooks/useContact.ts`
- `src/hooks/useContact.test.ts`
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/es/translation.json`
- `src/i18n/locales/pt-BR/translation.json`
- `src/lib/api.ts`
- `src/lib/api.test.ts`
- `src/pages/Home.story-1-9.e2e.test.tsx`
- `src/pages/Privacy.story-1-10.e2e.test.tsx`
- `src/pages/Privacy.test.tsx`
- `tests/e2e/contact-form.spec.ts`

### Senior Developer Review (AI)

Reviewer: Dev
Date: 2026-05-15
Outcome: Approved after auto-fixes

Findings fixed:
- Medium: Corrected contact fields could keep stale inline error text, `aria-invalid`, and `aria-describedby` until another blur. Fixed `Contact.tsx` to revalidate fields with existing errors as their values change and added regression coverage.
- Medium: Required contact controls were visually asterisked but not programmatically required. Added native `required` attributes and updated component assertions.
- Medium: Story File List omitted generated Story 2.3 Playwright coverage and senior-review test files. Updated File List for transparency.
- Low: Full-suite runs exposed pre-existing lazy-loaded Home/Privacy test timing failures under the larger test surface. Hardened affected tests with explicit lazy-section timeouts.

Review validation:
- Story status was `review` at review start.
- Acceptance Criteria 1-8 cross-checked against route, schema, DAO, API client, hook, UI, translations, and tests.
- No critical issues remained after fixes; story status set to `done`.

### Change Log

- 2026-05-15: Implemented full-stack contact form flow with backend persistence, client form, localized UX, duplicate suppression, routing notification data, and focused regression coverage.
- 2026-05-15: Senior review auto-fixed contact validation/accessibility polish and lazy-loaded route test timing; final typecheck, focused tests, and full regression passed.
