# Story 2.7: Security Hardening - Rate Limiting, Headers & Locale Allowlist

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Sync Sirius operator,
I want all form submission endpoints protected with rate limiting, security headers, and server-side locale validation,
so that the site is not abused by bots and lead data remains clean and secure.

## Acceptance Criteria

1. Given a rate limit test, when 21 requests to `POST /api/demo` are sent from the same IP within 15 minutes, then the 21st request receives HTTP 429 with `{ success: false, message: 'Too many requests' }`; the first 20 succeed.
2. Given the same applies to `POST /api/contact`, when tested identically, then same 429 behavior; rate limit windows on `/api/demo` and `/api/contact` are independent.
3. Given a request to `POST /api/demo` with `locale: "fr"`, when Zod server-side schema validates, then request is rejected with HTTP 400 and `{ success: false, message: '...', field: 'locale' }`; `fr` is not written to DB.
4. Given any Express route is called, when HTTP response headers are inspected, then Helmet default headers are present; `Access-Control-Allow-Origin` is `ALLOWED_ORIGIN` env var only - no wildcard.
5. Given a SQL-injection attempt in any form field, when the DAO executes the query, then better-sqlite3 parameterized queries prevent injection; malicious string is stored as literal text or rejected; no SQL error surfaces to client.
6. Given `tsc && vite build` is run, when `dist/client/` is inspected, then no `VITE_`-prefixed env vars containing secrets appear in the client bundle.

## Tasks / Subtasks

- [x] Fix form rate-limiter contract and per-route isolation (AC: 1, 2)
  - [x] Change the 429 JSON response in `server/middleware/rateLimit.ts` to exactly `{ success: false, message: 'Too many requests' }`.
  - [x] Do not share one `formRateLimiter` instance between demo and contact routes. Create a distinct limiter instance for `/api/demo` and another for `/api/contact` so same-IP quota is independent per endpoint.
  - [x] Keep `FORM_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000`, `FORM_RATE_LIMIT_MAX = 20`, `standardHeaders: 'draft-7'`, and `legacyHeaders: false`.
  - [x] Keep rate limiting mounted only on `router.post('/')` for form routes; GET/unknown routes should not consume form quota.
- [x] Strengthen server tests for real rate-limit behavior (AC: 1, 2)
  - [x] Update `server/index.rateLimit.test.ts` to send 20 valid, unique-payload `POST /api/demo` submissions from one IP and assert they succeed before the 21st returns exact 429 JSON.
  - [x] Add the same valid-request exhaustion test for `POST /api/contact`.
  - [x] Add an independence test: exhausting `/api/demo` from one IP must not block that same IP's first valid `/api/contact` request, and vice versa.
  - [x] Assert standard `RateLimit`/`RateLimit-Policy` headers are present and legacy `X-RateLimit-*` headers are absent where practical.
- [x] Preserve and verify locale allowlists (AC: 3)
  - [x] Keep `LOCALES = ['en', 'pt-BR', 'es'] as const` and `z.enum(LOCALES)` in `server/schemas/demo.schema.ts`; do not widen the server locale type to arbitrary strings.
  - [x] Keep `contactSchema` importing the same `LOCALES` allowlist; FR40 applies to all form schemas, even though AC3 names `/api/demo`.
  - [x] Keep invalid-locale failures returning HTTP 400 with `field: 'locale'` before any DAO insert or SMTP notification.
  - [x] Ensure tests prove invalid `locale: 'fr'` leaves `demo_requests` and `contacts` unchanged.
- [x] Verify Helmet and CORS headers on success and error paths (AC: 4)
  - [x] Keep `app.disable('x-powered-by')` and `app.use(helmet())` before CORS, JSON parsing, route mounts, and API error handling in `server/index.ts`.
  - [x] Keep CORS configured from `process.env.ALLOWED_ORIGIN`; never use `cors()` default behavior or `origin: '*'`.
  - [x] Extend `server/index.test.ts` or add a focused node-environment test to inspect representative responses: `/api/health`, `/api/demo` validation 400, `/api/demo` rate-limit 429, and `/api/missing` 404.
  - [x] Assert at least these Helmet defaults: `content-security-policy`, `x-content-type-options: nosniff`, `x-frame-options`, `referrer-policy`, and no `x-powered-by`.
  - [x] Assert `Access-Control-Allow-Origin` equals `process.env.ALLOWED_ORIGIN` for matching `Origin` requests and is never `*`.
- [x] Add SQL-injection regression tests without changing DAO architecture (AC: 5)
  - [x] Add route or DAO tests using payload strings such as `Robert'); DROP TABLE demo_requests;--` in demo `name`/`message` and contact `message`.
  - [x] Assert the request either succeeds with the malicious text stored literally or is rejected by schema validation; it must not surface a SQL error to the client.
  - [x] After the injection attempt, query `sqlite_master` or perform a normal insert/list operation to prove `demo_requests` and `contacts` still exist.
  - [x] Keep all SQL in DAO files; route handlers must not call `db.prepare()`.
- [x] Add repeatable client bundle secret inspection (AC: 6)
  - [x] Run `npm run build` as part of story verification.
  - [x] Inspect `dist/client/**/*` after build for forbidden server-secret identifiers and values: `VITE_JWT_SECRET`, `VITE_SMTP`, `VITE_DB_PATH`, `VITE_NOTIFY`, `JWT_SECRET`, `SMTP_PASS`, `SMTP_USER`, `NOTIFY_EMAIL`, and any test secret values set during the check.
  - [x] Prefer a small node script or Vitest node test that scans the built files deterministically; do not rely only on manual grep.
  - [x] Do not introduce any new `VITE_`-prefixed server configuration.
- [x] Run verification before marking implementation complete
  - [x] `npm run typecheck`
  - [x] `npm run test:run -- server/middleware/rateLimit.test.ts server/index.rateLimit.test.ts server/index.test.ts server/routes/demo.test.ts server/routes/contact.test.ts server/schemas/demo.schema.test.ts server/schemas/contact.schema.test.ts server/dao/leads.dao.test.ts server/dao/contacts.dao.test.ts`
  - [x] `npm run test:run`
  - [x] `npm run build`
  - [x] Run the client-bundle secret scan created for AC6.

## Dev Notes

### Source Context

- Epic 2 goal: visitors can submit demo and contact inquiries with locale-aware validation, receive on-page confirmation, receive SMTP notification internally, and have all lead data stored securely with rate limiting enforced. Story 2.7 closes the security baseline for FR38-FR40. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2: Lead Capture & Conversion (Phase 1 MVP - Part B)`]
- PRD Phase 1 explicitly includes security baseline scope: rate limiting, Helmet headers, restricted CORS, and no secrets in the client bundle. [Source: `_bmad-output/planning-artifacts/prd.md#Phase 1 - MVP`]
- Architecture requires middleware order: `helmet()` -> `cors()` -> `express.json()` -> rate limit on form routes -> auth on admin routes -> handlers. Preserve this order. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Architecture response envelope is `{ success: true, data?, message? }` or `{ success: false, message, field? }`; keep all failures in this envelope. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- No `project-context.md` file was found during persistent-fact loading.

### Previous Story Intelligence

- Story 2.1 created the Express app, DB schema, DAO layer, server schemas, Helmet/CORS setup, and baseline rate limiter. Story 2.7 should harden and verify these instead of replacing the backend architecture. [Source: `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md`]
- Story 2.2 delivered `POST /api/demo`, duplicate email suppression, DB insert, SMTP fire-and-forget, hidden locale payload, and route tests. Preserve payload shape and duplicate retry semantics. [Source: `_bmad-output/implementation-artifacts/2-2-demo-request-form-full-stack.md`]
- Story 2.3 delivered `POST /api/contact`, contact subject allowlist, 429 inline frontend handling, and contact route tests. Preserve subject values exactly: `SyncRevenue`, `BI/Data Analytics`, `OBTs`, `Custom Development`, `Other`. [Source: `_bmad-output/implementation-artifacts/2-3-contact-form-full-stack.md`]
- Story 2.5 intentionally did not change the rate limiter, CORS, Helmet, DAO, or schema surfaces while tightening SMTP notifications. Story 2.7 owns those backend security assertions now. [Source: `_bmad-output/implementation-artifacts/2-5-smtp-notification-demo-contact.md`]
- Story 2.6 completed frontend accessibility and locale-aware client validation. It did not change API endpoints, persistence, SMTP behavior, or server security. Keep its frontend behavior untouched. [Source: `_bmad-output/implementation-artifacts/2-6-form-accessibility-locale-aware-validation.md`]
- Recent git history is Story 2.6, 2.5, 2.4, 2.3, and 2.2. Story 2.6 left Playwright blocked in this sandbox because local server binds are rejected; non-E2E Vitest and typecheck passed. [Source: `git log --oneline -5`; `_bmad-output/implementation-artifacts/tests/test-summary.md`]
- Worktree note at story creation: `_bmad-output/story-automator/orchestration-2-20260515-153220.md` was already modified and unrelated. Do not revert or overwrite it while implementing this story. [Source: `git status --short`]

### Current State of Files to Update

- `server/middleware/rateLimit.ts` currently defines the right constants and uses `express-rate-limit`, but the handler returns `Too many requests. Please try again later.`. AC1/AC2 require exactly `Too many requests`. [Source: `server/middleware/rateLimit.ts`]
- `server/routes/demo.ts` and `server/routes/contact.ts` both import the same `formRateLimiter` singleton. That likely shares one in-memory quota across both endpoints, which violates AC2's independent-window requirement. Use `createFormRateLimiter()` separately per route. [Source: `server/routes/demo.ts`; `server/routes/contact.ts`]
- `server/index.rateLimit.test.ts` currently exhausts quota with invalid `{}` payloads and only checks `expect.any(String)` for the message. It does not prove the first 20 valid submissions succeed and does not prove demo/contact independence. [Source: `server/index.rateLimit.test.ts`]
- `server/routes/demo.test.ts` already covers invalid `locale: 'fr'` with `field: 'locale'` and no insert; keep this and add injection coverage. [Source: `server/routes/demo.test.ts`]
- `server/routes/contact.test.ts` already covers invalid contact locale and subject allowlists with no insert; keep this and add injection coverage. [Source: `server/routes/contact.test.ts`]
- `server/index.test.ts` already checks representative Helmet and CORS behavior plus a source scan for forbidden `VITE_` secret names in `src/`. AC6 requires inspecting built `dist/client/` after `npm run build`, so extend coverage or add a dedicated scan. [Source: `server/index.test.ts`]
- `server/dao/leads.dao.ts` and `server/dao/contacts.dao.ts` use `better-sqlite3` prepared statements with positional or named parameters. Preserve this; do not move SQL into route handlers. [Source: `server/dao/leads.dao.ts`; `server/dao/contacts.dao.ts`]
- `server/db.ts` enforces DB-level `CHECK (locale IN ('en','pt-BR','es'))` for both `demo_requests` and `contacts`. Server Zod validation should reject bad locales before the DB constraint is the first line of defense. [Source: `server/db.ts`]

### Architecture Guardrails

- Stack is fixed: Node/Express 4, TypeScript strict, `express-rate-limit@^8.5.2`, `helmet@^8.1.0`, `cors@^2.8.6`, `better-sqlite3@^12.10.0`, `zod@^3.25.76`, Vitest 4, and Vite 5. Do not upgrade dependencies for this story. [Source: `package.json`]
- `src/lib/api.ts` and frontend form components already rely on the 429 response body message for localized inline rendering. Keep response shape stable and avoid adding a new error envelope. [Source: `src/lib/api.ts`; `_bmad-output/implementation-artifacts/2-6-form-accessibility-locale-aware-validation.md`]
- CORS is not authorization. It only controls which browser origins can read responses. Continue relying on server validation, rate limiting, and admin auth for actual protection. [Source: Express CORS docs, Common Misconceptions]
- Do not add Redis, a job queue, a WAF dependency, CAPTCHA, ORM, GraphQL, or a new validation library. This story hardens the existing MVP Express/SQLite stack.
- Keep tests in the existing co-located pattern. Server tests use `// @vitest-environment node` and the custom `server/test-utils/request.ts` helper for Express without binding a local port.

### Latest Technical Notes

- `express-rate-limit` supports a custom `handler` for blocked clients; default blocked status is 429. The local custom handler is the correct place to enforce the exact JSON body. [Source: https://express-rate-limit.mintlify.app/reference/configuration]
- With `standardHeaders: 'draft-7'`, `express-rate-limit` emits combined `RateLimit` and `RateLimit-Policy` headers; `legacyHeaders: false` disables legacy `X-RateLimit-*` headers. [Source: https://express-rate-limit.mintlify.app/reference/configuration]
- The Express CORS middleware default `cors()` behavior sets `Access-Control-Allow-Origin: *`; this repo must avoid default `cors()` and use a specific `origin` value from `ALLOWED_ORIGIN`. [Source: https://expressjs.com/en/resources/middleware/cors.html]
- Helmet's default middleware sets security headers including CSP defaults, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer`, and removes `X-Powered-By` when paired with Express disablement. [Source: https://helmetjs.github.io/]

### Testing Requirements

- Use unique valid emails for the first 20 rate-limit requests to avoid duplicate suppression returning 200 without insert. A 200 duplicate still succeeds, but unique payloads make the test prove the route can accept real submissions under the quota.
- Mock `sendNotification()` in route/rate-limit tests or assert only route behavior; do not let SMTP behavior dominate this security story.
- Use distinct `remoteAddress` values per test to prevent limiter state bleed. Since route-specific limiter instances are in memory, keep `vi.resetModules()` and isolated app setup for each test group.
- Rate-limit independence test should fail against the current shared singleton design; it should pass only after demo/contact use separate limiter instances.
- Injection tests should assert no 500 and no SQL error text in the response body. Then prove the table still exists by reading row count or performing another valid insert/list operation.
- Bundle secret scan should run after build and scan generated `.html`, `.js`, `.css`, and sourcemap files if sourcemaps are present. It should check both forbidden variable names and any intentionally seeded secret values used by the scan.

### Project Structure Notes

- Expected write surface:
  - `server/middleware/rateLimit.ts`
  - `server/routes/demo.ts`
  - `server/routes/contact.ts`
  - `server/index.rateLimit.test.ts`
  - `server/index.test.ts`
  - `server/routes/demo.test.ts`
  - `server/routes/contact.test.ts`
  - Optional: `scripts/check-client-bundle-secrets.mjs` or a focused node-environment test/script for AC6
- Expected no-touch surface:
  - `src/components/sections/DemoForm.tsx`
  - `src/components/sections/Contact.tsx`
  - `src/hooks/useDemo.ts`
  - `src/hooks/useContact.ts`
  - `server/lib/mailer.ts`
  - `server/dao/*` unless adding DAO-only tests reveals a defect
  - Translation JSON files unless existing tests expose a missing user-facing string
- Detected implementation variance: architecture listed `server/middleware/rateLimit.ts` as the FR39 target, but the live repo already has route-level mounting inside `server/routes/demo.ts` and `server/routes/contact.ts`. Keep the route-level mounting; just ensure each route receives its own limiter instance.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 2.7: Security Hardening - Rate Limiting, Headers & Locale Allowlist`
- `_bmad-output/planning-artifacts/prd.md#Phase 1 - MVP`
- `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`
- `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`
- `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md`
- `_bmad-output/implementation-artifacts/2-2-demo-request-form-full-stack.md`
- `_bmad-output/implementation-artifacts/2-3-contact-form-full-stack.md`
- `_bmad-output/implementation-artifacts/2-5-smtp-notification-demo-contact.md`
- `_bmad-output/implementation-artifacts/2-6-form-accessibility-locale-aware-validation.md`
- `server/middleware/rateLimit.ts`
- `server/routes/demo.ts`
- `server/routes/contact.ts`
- `server/index.ts`
- `server/index.rateLimit.test.ts`
- `server/index.test.ts`
- `server/routes/demo.test.ts`
- `server/routes/contact.test.ts`
- `server/schemas/demo.schema.ts`
- `server/schemas/contact.schema.ts`
- `server/dao/leads.dao.ts`
- `server/dao/contacts.dao.ts`
- `server/db.ts`
- `server/test-utils/request.ts`
- `package.json`
- Express Rate Limit configuration: https://express-rate-limit.mintlify.app/reference/configuration
- Express CORS middleware: https://expressjs.com/en/resources/middleware/cors.html
- Helmet docs: https://helmetjs.github.io/

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-15: Added failing rate-limit tests first; failures confirmed old 429 message and shared demo/contact quota before implementation.
- 2026-05-15: Verification passed: `npm run typecheck`.
- 2026-05-15: Verification passed: `npm run test:run -- server/middleware/rateLimit.test.ts server/index.rateLimit.test.ts server/index.test.ts server/routes/demo.test.ts server/routes/contact.test.ts server/schemas/demo.schema.test.ts server/schemas/contact.schema.test.ts server/dao/leads.dao.test.ts server/dao/contacts.dao.test.ts` (9 files, 56 tests).
- 2026-05-15: Verification passed: `npm run test:run` (43 files, 232 tests).
- 2026-05-15: Verification passed: `npm run build`.
- 2026-05-15: Verification passed: `JWT_SECRET=client-bundle-jwt-secret-sentinel SMTP_PASS=client-bundle-smtp-pass-sentinel SMTP_USER=client-bundle-smtp-user-sentinel NOTIFY_EMAIL=client-bundle-notify-email-sentinel@example.com npm run check:client-bundle-secrets`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Implemented exact rate-limit error contract and replaced the shared form limiter with separate per-route limiter instances for demo and contact.
- Strengthened rate-limit tests with 20 valid unique submissions, exact 21st-request 429 assertions, standard header checks, and same-IP route independence coverage.
- Preserved locale allowlists and expanded security assertions for Helmet/CORS behavior, SQL-injection-shaped payloads, and route handler DAO boundaries.
- Added repeatable client bundle secret scanning for generated `dist/client` files and verified it after production build with seeded secret values.

### File List

- `package.json`
- `scripts/check-client-bundle-secrets.mjs`
- `server/middleware/rateLimit.ts`
- `server/middleware/rateLimit.test.ts`
- `server/routes/demo.ts`
- `server/routes/contact.ts`
- `server/index.rateLimit.test.ts`
- `server/index.test.ts`
- `server/routes/demo.test.ts`
- `server/routes/contact.test.ts`
- `tests/e2e/security-hardening.spec.ts`
- `tests/e2e/security-test-env.ts`
- `_bmad-output/implementation-artifacts/tests/test-summary.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/2-7-security-hardening-rate-limiting-headers-locale-allowlist.md`

### Senior Developer Review (AI)

Reviewer: Dev
Date: 2026-05-15
Outcome: Approved after auto-fix

#### Review Scope

- Loaded story file and verified status was reviewable.
- Loaded architecture/security standards from `_bmad-output/planning-artifacts/architecture.md`.
- MCP documentation search checked; no MCP resources were configured in this environment.
- Cross-checked Acceptance Criteria 1-6 against implementation and tests.
- Reviewed changed source/test files and git-discovered files, excluding `_bmad/`, `_bmad-output/`, and non-source tool configuration from code review.

#### Findings

- [x] [AI-Review][MEDIUM] Story File List omitted implemented test artifacts discovered in git: `tests/e2e/security-hardening.spec.ts`, `tests/e2e/security-test-env.ts`, and `_bmad-output/implementation-artifacts/tests/test-summary.md`. Fixed by adding them to the Dev Agent Record File List.

#### Acceptance Criteria Validation

- AC1: Implemented. `/api/demo` allows 20 same-IP valid requests and returns exact HTTP 429 body on the 21st request.
- AC2: Implemented. `/api/contact` has the same 20/21 behavior, and demo/contact limiter state is route-isolated.
- AC3: Implemented. Server Zod schemas retain the `en`, `pt-BR`, `es` locale allowlist; invalid `fr` is rejected before insert with `field: 'locale'`.
- AC4: Implemented. Helmet defaults and restricted CORS are verified on success, validation error, 429, and 404 paths.
- AC5: Implemented. SQL-injection-shaped values are handled through DAO parameterized statements and do not surface SQL errors.
- AC6: Implemented. Deterministic `dist/client` secret scan exists and passed after production build.

#### Verification

- `npm run typecheck` -> passed.
- `npm run test:run -- server/middleware/rateLimit.test.ts server/index.rateLimit.test.ts server/index.test.ts server/routes/demo.test.ts server/routes/contact.test.ts server/schemas/demo.schema.test.ts server/schemas/contact.schema.test.ts server/dao/leads.dao.test.ts server/dao/contacts.dao.test.ts` -> passed: 9 files, 56 tests.
- `npm run test:run` -> passed: 43 files, 232 tests.
- `npm run build` -> passed.
- `JWT_SECRET=client-bundle-jwt-secret-sentinel SMTP_PASS=client-bundle-smtp-pass-sentinel SMTP_USER=client-bundle-smtp-user-sentinel NOTIFY_EMAIL=client-bundle-notify-email-sentinel@example.com npm run check:client-bundle-secrets` -> passed.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:9 npm run test:e2e -- tests/e2e/security-hardening.spec.ts --project=chromium` -> passed: 1 file, 1 test.

### Change Log

- 2026-05-15: Completed Story 2.7 security hardening and moved status to review.
- 2026-05-15: Senior developer review completed; fixed File List documentation gap and moved status to done.
