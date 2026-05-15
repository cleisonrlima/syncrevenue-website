# Story 2.5: SMTP Notification - Demo & Contact

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Sync Sirius team member,
I want to receive an immediate email notification for each demo request and contact form submission,
so that I can respond to qualified leads without checking a dashboard.

## Acceptance Criteria

1. Given a valid demo request is submitted, when `leads.dao.ts insertLead()` completes, then `sendNotification()` is called asynchronously with subject `New Demo Request — [Company]` and body containing all fields: name, email, company, phone, role, GDS, message, locale, timestamp; HTTP response returns to visitor before `sendMail` resolves.
2. Given a valid contact form is submitted, when `contacts.dao.ts insertContact()` completes, then `sendNotification()` is called with subject `New Contact — [Subject]` and body containing name, email, subject, message, locale, timestamp.
3. Given the SMTP server is unreachable, when `transporter.sendMail()` throws, then the error is logged server-side; visitor's HTTP response is unaffected, no 5xx is produced, and the saved DB record is not rolled back.
4. Given SMTP credentials are configured, when `server/lib/mailer.ts` is inspected, then all SMTP config (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) comes from `process.env` only, no credentials exist in source, and `NOTIFY_EMAIL` is the recipient for all notifications.

## Tasks / Subtasks

- [x] Tighten demo notification contract in `server/routes/demo.ts` (AC: 1, 3)
  - [x] Store the inserted row returned by `leadsDao.insert(parsed)` and use its `created_at` as the notification timestamp; do not synthesize a separate timestamp.
  - [x] Change the subject from the current generic `New demo request` to exactly `New Demo Request — ${parsed.company}`.
  - [x] Format the body with all required fields: `Name`, `Email`, `Company`, `Phone`, `Role`, `GDS`, `Message`, `Locale`, `Timestamp`.
  - [x] Preserve 60-second duplicate retry behavior: duplicate demo submissions return HTTP 200, do not insert, and do not send another notification.
  - [x] Preserve fire-and-forget behavior: call `void sendNotification(...)` after successful insert and never `await` mail delivery before responding.
- [x] Tighten contact notification contract in `server/routes/contact.ts` (AC: 2, 3)
  - [x] Store the inserted row returned by `contactsDao.insert(parsed)` and use its `created_at` as the notification timestamp.
  - [x] Change the subject from the current ASCII hyphen form `New Contact - ${parsed.subject}` to exactly `New Contact — ${parsed.subject}`.
  - [x] Format the body with required fields: `Name`, `Email`, `Subject`, `Message`, `Locale`, `Timestamp`.
  - [x] Preserve duplicate contact retry behavior: duplicate contact submissions return HTTP 200, do not insert, and do not send another notification.
  - [x] Keep subject values business-readable (`SyncRevenue`, `BI/Data Analytics`, `OBTs`, `Custom Development`, `Other`) for sales routing.
- [x] Keep `server/lib/mailer.ts` env-only and resilient (AC: 3, 4)
  - [x] Do not add hardcoded host/user/pass/from/to values anywhere in source, tests excluded only for mock env setup.
  - [x] Keep `NOTIFY_EMAIL` as the sole recipient and `SMTP_USER || NOTIFY_EMAIL` as the sender fallback unless a test exposes a bug.
  - [x] Keep `sendNotification(subject, body)` catching and logging `transporter.sendMail()` errors and resolving `undefined`.
  - [x] Do not move SMTP config into `src/` or add `VITE_`-prefixed SMTP variables.
- [x] Add focused server tests (AC: 1-4)
  - [x] Update `server/routes/demo.test.ts` to assert exact demo subject, all body fields including `Timestamp`, non-blocking response with an unresolved `sendNotification()` promise, and unchanged DB row count/notification count on duplicate retry.
  - [x] Update `server/routes/contact.test.ts` to assert exact contact subject with em dash, all body fields including `Timestamp`, non-blocking response with an unresolved `sendNotification()` promise, and unchanged duplicate retry behavior.
  - [x] Update `server/lib/mailer.test.ts` if needed to assert `nodemailer.createTransport()` receives only env-derived host/port/auth values and `sendMail()` targets `process.env.NOTIFY_EMAIL`.
  - [x] Keep existing validation, locale allowlist, rate limit, and success envelope tests passing.
- [x] Maintain scope boundaries (AC: 1-4)
  - [x] Do not change frontend forms, hooks, i18n copy, validation UX, or submit states.
  - [x] Do not change DB schema, DAO duplicate lookup semantics, rate limiter, CORS, Helmet, auth, or admin routes.
  - [x] Do not add an email queue, background worker, template engine, external email API, autoresponder to leads, or new dependency.
  - [x] Do not update sprint-status.yaml or epics.md during dev-story; workflow tooling owns status transitions.
- [x] Run verification before marking implementation complete
  - [x] `npm run typecheck`
  - [x] `npm run test:run -- server/routes/demo.test.ts server/routes/contact.test.ts server/lib/mailer.test.ts`
  - [x] `npm run test:run`

## Dev Notes

### Source Context

- Epic 2 goal: visitors can submit demo and contact inquiries with locale-aware validation, receive on-page confirmation, and Sync Sirius receives instant SMTP notifications; all lead data is stored with rate limiting enforced. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2: Lead Capture & Conversion (Phase 1 MVP - Part B)`]
- Story 2.5 owns FR13 notification completion for both already-built submission flows. Story 2.2 and 2.3 intentionally implemented baseline fire-and-forget notifications but left exact notification subject/body formatting to this story. [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.5: SMTP Notification - Demo & Contact`; `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md#Dev Notes`]
- PRD reliability requirement: SMTP notification failure must not surface as a visitor-facing 5xx; lead save succeeds regardless of email delivery outcome. [Source: `_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements`]
- SMTP scope is internal-only. Notification email goes to Sync Sirius internal `NOTIFY_EMAIL`; the website does not send outbound email to leads. [Source: `_bmad-output/planning-artifacts/prd.md#Technical Constraints`]
- No `project-context.md` file was found during persistent-fact loading.

### Previous Story Intelligence

- Story 2.1 delivered `server/lib/mailer.ts` with lazy cached Nodemailer transporter, env-only config, `resetTransporterForTesting()`, and a `sendNotification()` function that catches/logs mailer failures and resolves. Reuse it; do not create a second mailer. [Source: `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md#Completion Notes List`]
- Story 2.1 explicitly deferred exact business notification formatting to Story 2.5. [Source: `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md#Dev Notes`]
- Story 2.2 established the demo route pattern: `formRateLimiter`, `demoSchema.safeParse`, `leadsDao.findRecentByEmail`, `leadsDao.insert`, `void sendNotification(...)`, and 201/200 success envelopes. Preserve this structure while changing only the notification contract. [Source: `_bmad-output/implementation-artifacts/2-2-demo-request-form-full-stack.md#Completion Notes List`]
- Story 2.2 senior review fixed duplicate submit guarding and malformed 2xx envelope handling. Do not change frontend `postDemo()` or `useDemo()` for this story. [Source: `_bmad-output/implementation-artifacts/2-2-demo-request-form-full-stack.md#Senior Developer Review (AI)`]
- Story 2.3 established the contact route pattern and included enough `subject` data for routing, but noted Story 2.5 owns full notification formatting. [Source: `_bmad-output/implementation-artifacts/2-3-contact-form-full-stack.md#Tasks / Subtasks`]
- Story 2.4 was presentation-only and left backend routes untouched. Its completion does not change Story 2.5's backend scope. [Source: `_bmad-output/implementation-artifacts/2-4-demoscheduler-section-multiple-cta-entry-points.md#Completion Notes List`]
- Recent git history: `feat(story-2.4): DemoScheduler Section & Multiple CTA Entry Points`, `feat(story-2.3): Contact Form - Full Stack`, `feat(story-2.2): Demo Request Form - Full Stack`, `feat(story-2.1): Backend Infrastructure - Database, DAOs & Middleware`. [Source: `git log --oneline -5`]
- Worktree note at story creation: `_bmad-output/story-automator/orchestration-2-20260515-153220.md` is already modified and unrelated. Do not revert or overwrite it while implementing this story. [Source: `git status --short`]

### Current State of Files to Update

- `server/routes/demo.ts` currently validates, checks duplicate email, calls `leadsDao.insert(parsed)` without storing the returned row, calls `void sendNotification('New demo request', body)`, and responds HTTP 201. It already does not `await` SMTP, but the subject is wrong and the body omits `Timestamp`. [Source: `server/routes/demo.ts`]
- `server/routes/contact.ts` currently validates, checks duplicate email, calls `contactsDao.insert(parsed)` without storing the returned row, calls `void sendNotification(\`New Contact - ${parsed.subject}\`, body)`, and responds HTTP 201. It already does not `await` SMTP, but the subject delimiter is wrong and the body omits `Timestamp`. [Source: `server/routes/contact.ts`]
- `server/dao/leads.dao.ts` `insert(input)` already returns a full `DemoRequestRow` including `created_at` and `updated_at`. Use that return value for timestamp instead of adding DAO methods or querying again. [Source: `server/dao/leads.dao.ts`]
- `server/dao/contacts.dao.ts` `insert(input)` already returns a full `ContactRow` including `created_at`. Use that return value for timestamp. [Source: `server/dao/contacts.dao.ts`]
- `server/lib/mailer.ts` already reads `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `NOTIFY_EMAIL` from `process.env`, creates a Nodemailer transporter lazily, sends `text` email, catches errors, and logs with `console.error`. Preserve this behavior. [Source: `server/lib/mailer.ts`]
- `.env.example` already documents `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL`, and real `.env` files are gitignored. [Source: `.env.example`; `.gitignore`]

### Architecture Guardrails

- Stack is fixed: TypeScript strict mode, Node/Express backend, SQLite via `better-sqlite3`, Zod 3, Nodemailer 8, Vitest. Do not add an ORM, GraphQL, job queue, template system, or alternate mail provider. [Source: `_bmad-output/planning-artifacts/architecture.md#Technology Stack - Pre-Defined`; `package.json`]
- API routes must use DAO methods only; route handlers must never call `db.prepare()` directly. Story 2.5 should not need DAO changes. [Source: `_bmad-output/planning-artifacts/architecture.md#Data Access Boundary`]
- Public API routes are `POST /api/demo` and `POST /api/contact`; both return `{ success, message }` envelopes. Preserve the existing client contract. [Source: `_bmad-output/planning-artifacts/architecture.md#API Boundary`]
- Locale is captured in the existing payload and stored in DB; keep server-side allowlist validation in `demoSchema` and `contactSchema`. [Source: `_bmad-output/planning-artifacts/architecture.md#i18n Boundary`]
- Form API endpoints should respond within 3s under normal load. Notification dispatch must not wait on SMTP resolution. [Source: `_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements`]
- Notification failure is server-log only. Never roll back a saved lead/contact because SMTP fails. [Source: `_bmad-output/planning-artifacts/prd.md#Reliability`]

### Implementation Details

- Demo route target shape:
  ```ts
  const inserted = leadsDao.insert(parsed)

  void sendNotification(
    `New Demo Request — ${parsed.company}`,
    [
      `Name: ${parsed.name}`,
      `Email: ${parsed.email}`,
      `Company: ${parsed.company}`,
      `Phone: ${parsed.phone ?? ''}`,
      `Role: ${parsed.role}`,
      `GDS: ${parsed.gds}`,
      `Message: ${parsed.message ?? ''}`,
      `Locale: ${parsed.locale}`,
      `Timestamp: ${inserted.created_at}`,
    ].join('\n')
  ).catch(error => {
    console.error('Demo notification failed:', error)
  })
  ```
- Contact route target shape:
  ```ts
  const inserted = contactsDao.insert(parsed)

  void sendNotification(
    `New Contact — ${parsed.subject}`,
    [
      `Name: ${parsed.name}`,
      `Email: ${parsed.email}`,
      `Subject: ${parsed.subject}`,
      `Message: ${parsed.message}`,
      `Locale: ${parsed.locale}`,
      `Timestamp: ${inserted.created_at}`,
    ].join('\n')
  ).catch(error => {
    console.error('Contact notification failed:', error)
  })
  ```
- Keep the route-local `.catch()` even though `sendNotification()` catches internally; tests may mock `sendNotification()` to reject, and the route should still be demonstrably resilient.
- Do not send notifications on validation failure or duplicate retry. Existing tests already cover these paths; keep or strengthen them.
- Body field labels can remain English because this email is internal operational content, not visitor-facing localized UI.

### Testing Requirements

- Route tests should mock `../lib/mailer` as they do today; no real SMTP connection should occur.
- To prove non-blocking behavior, set `sendNotificationMock.mockReturnValueOnce(new Promise(() => undefined))`, post a valid payload, and assert the HTTP response resolves with 201. If the route accidentally awaits mail delivery, this test will hang or fail under a short timeout.
- Demo test assertions should verify:
  - subject exactly `New Demo Request — Example Travel`;
  - body contains `Name: Jane Smith`, `Email: jane@example.com`, `Company: Example Travel`, `Phone: +1 305 555 0100`, `Role: Owner`, `GDS: Sabre`, `Message: We need help reconciling commissions.`, `Locale: en`, and `Timestamp:`;
  - row count is `1` after success and remains `1` after duplicate retry;
  - notification call count remains `1` after duplicate retry;
  - mocked rejection still yields HTTP 201 and row count `1`.
- Contact test assertions should verify:
  - subject exactly `New Contact — BI/Data Analytics`;
  - body contains `Name: Jane Smith`, `Email: jane@example.com`, `Subject: BI/Data Analytics`, `Message: We need analytics help for agency revenue reporting.`, `Locale: pt-BR`, and `Timestamp:`;
  - duplicate retry remains non-inserting and non-notifying.
- Mailer tests should continue to mock `nodemailer`. If adding env assertions, inspect `nodemailer.createTransport` call arguments rather than reading private transporter state.
- Full-suite risk area: server tests use temp `DB_PATH` and module resets. Keep `vi.resetModules()` and temp DB cleanup patterns intact.

### Latest Technical Notes

- Installed package versions are the source of truth: `express@^4.22.2`, `better-sqlite3@^12.10.0`, `nodemailer@^8.0.7`, `zod@^3.25.76`, `typescript@^6.0.3`, `vitest@^4.1.6`. Do not upgrade dependencies for this story. [Source: `package.json`]
- Nodemailer `transporter.sendMail()` returns a promise when no callback is passed. `sendNotification()` already awaits it inside try/catch, so route handlers can safely call the helper fire-and-forget with `void`. [Source: `server/lib/mailer.ts`; `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md#Dev Notes`]
- External web research was not required for this story because implementation must follow the installed package versions and existing repo patterns; network access is restricted in this environment.

### Project Structure Notes

- Expected write surface:
  - `server/routes/demo.ts` (update notification subject/body and timestamp source)
  - `server/routes/contact.ts` (update notification subject/body and timestamp source)
  - `server/routes/demo.test.ts` (update/add notification contract tests)
  - `server/routes/contact.test.ts` (update/add notification contract tests)
  - `server/lib/mailer.test.ts` (optional update for env-derived transporter config)
- Expected no-touch surface:
  - `src/components/sections/DemoForm.tsx`
  - `src/components/sections/Contact.tsx`
  - `src/hooks/useDemo.ts`
  - `src/hooks/useContact.ts`
  - `src/lib/api.ts`
  - `server/db.ts`
  - `server/dao/leads.dao.ts`
  - `server/dao/contacts.dao.ts`
  - `server/schemas/demo.schema.ts`
  - `server/schemas/contact.schema.ts`
- Detected planning variance: architecture mentions `shadcn/ui` form/toast components, but the repo uses custom form components and toast behavior. This story is backend-only, so follow live backend code and tests rather than adding UI dependencies.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 2.5: SMTP Notification - Demo & Contact`
- `_bmad-output/planning-artifacts/prd.md#Technical Constraints`
- `_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements`
- `_bmad-output/planning-artifacts/architecture.md#Lead Capture & Conversion`
- `_bmad-output/planning-artifacts/architecture.md#Data Access Boundary`
- `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md#Completion Notes List`
- `_bmad-output/implementation-artifacts/2-2-demo-request-form-full-stack.md#Completion Notes List`
- `_bmad-output/implementation-artifacts/2-3-contact-form-full-stack.md#Completion Notes List`
- `server/routes/demo.ts`
- `server/routes/contact.ts`
- `server/lib/mailer.ts`
- `server/dao/leads.dao.ts`
- `server/dao/contacts.dao.ts`
- `server/routes/demo.test.ts`
- `server/routes/contact.test.ts`
- `server/lib/mailer.test.ts`
- `.env.example`
- `.gitignore`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-15: Red test run for focused server tests failed as expected on exact demo/contact notification subject/body/timestamp contract before implementation.
- 2026-05-15: Focused server tests passed after route notification contract updates: `server/routes/demo.test.ts`, `server/routes/contact.test.ts`, `server/lib/mailer.test.ts`.
- 2026-05-15: Full verification passed: `npm run typecheck`, focused server test command, and `npm run test:run`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Demo route now uses the inserted lead row timestamp, exact `New Demo Request — ${parsed.company}` subject, all required body fields, duplicate no-notify behavior, and fire-and-forget notification dispatch.
- Contact route now uses the inserted contact row timestamp, exact `New Contact — ${parsed.subject}` subject, all required body fields, duplicate no-notify behavior, and fire-and-forget notification dispatch.
- Mailer implementation remained env-only and resilient; tests assert env-derived transport config and `NOTIFY_EMAIL` recipient behavior.
- Scope boundaries maintained: no frontend, DAO, schema, rate limiter, DB schema, dependency, queue, worker, template, or external mail API changes.

### File List

- `_bmad-output/implementation-artifacts/2-5-smtp-notification-demo-contact.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/tests/test-summary.md`
- `server/routes/demo.ts`
- `server/routes/contact.ts`
- `server/routes/demo.test.ts`
- `server/routes/contact.test.ts`
- `server/lib/mailer.test.ts`
- `tests/e2e/story-2-5-smtp-notification.spec.ts`

### Change Log

- 2026-05-15: Implemented Story 2.5 SMTP notification contract for demo and contact submissions; added focused route/mailer tests; verified typecheck and full test suite; moved story to review.
- 2026-05-15: Senior review completed; fixed File List omissions for Story 2.5 test artifacts; verified typecheck plus focused and full Vitest suites; moved story to done.

## Senior Developer Review (AI)

### Review Date

2026-05-15

### Reviewer

GPT-5 Codex

### Outcome

Approved - no source-code changes required.

### Findings

- [x] [MEDIUM] Story File List omitted the generated Story 2.5 Playwright spec, despite the untracked implementation file being part of the test coverage surface. Fixed by adding `tests/e2e/story-2-5-smtp-notification.spec.ts` to the File List.
- [x] [MEDIUM] Story File List omitted the updated test automation summary artifact. Fixed by adding `_bmad-output/implementation-artifacts/tests/test-summary.md` to the File List.

### Acceptance Criteria Validation

- AC1: Implemented. `server/routes/demo.ts` uses the inserted lead row timestamp, exact `New Demo Request — ${parsed.company}` subject, all required body fields, duplicate no-notify behavior, and fire-and-forget dispatch.
- AC2: Implemented. `server/routes/contact.ts` uses the inserted contact row timestamp, exact `New Contact — ${parsed.subject}` subject, all required body fields, duplicate no-notify behavior, and fire-and-forget dispatch.
- AC3: Implemented. Route tests cover rejected/unresolved notification promises without blocking or 5xx responses, and `server/lib/mailer.ts` catches/logs `sendMail` failures without rolling back saved records.
- AC4: Implemented. `server/lib/mailer.ts` reads SMTP host, port, user, password, and recipient from `process.env`; mailer tests assert env-derived transport config and `NOTIFY_EMAIL` recipient usage.

### Verification

- `npm run typecheck` -> passed.
- `npm run test:run -- server/routes/demo.test.ts server/routes/contact.test.ts server/lib/mailer.test.ts` -> passed, 16 tests.
- `npm run test:run` -> passed, 220 tests.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:1 npx playwright test tests/e2e/story-2-5-smtp-notification.spec.ts --project=chromium` -> blocked by sandbox localhost listener restriction: `listen EPERM 127.0.0.1:3100`.

### Residual Risk

- The new Playwright API/E2E resilience spec needs to run in CI or a local environment that permits localhost server binding.
