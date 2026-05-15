# Story 2.1: Backend Infrastructure - Database, DAOs & Middleware

Status: done

## Story

As a developer,
I want the complete Express server with middleware stack, all 4 DB tables, DAO layer, and Zod schemas in place,
so that all lead capture API routes have a secure, validated foundation to build on.

## Acceptance Criteria

1. Given Express server is initialized, when `server/index.ts` is inspected, then middleware stack applies in order: `helmet()` -> `cors({ origin: process.env.ALLOWED_ORIGIN })` -> `express.json()` -> rate limit on form routes -> auth on admin routes; no `VITE_`-prefixed secrets exist anywhere in `src/`.
2. Given the DB schema is initialized, when `server/db.ts` runs, then all 4 tables are created if absent: `demo_requests`, `contacts`, `team_members`, `admin_users`, with exact columns, types, and CHECK constraints per architecture spec; tables use ANSI SQL where possible and keep the architecture-defined SQLite primary key/default syntax.
3. Given the DAO layer is implemented, when `server/dao/` is inspected, then four DAO files exist: `leads.dao.ts`, `contacts.dao.ts`, `team.dao.ts`, `admin.dao.ts`; all SQL lives in DAO files; no `db.prepare()` calls appear in route handlers; DAO methods return typed objects.
4. Given rate limit middleware is applied, when `/api/demo` or `/api/contact` receives more than 20 requests in 15 minutes from the same IP, then subsequent requests receive HTTP 429 with `{ success: false, message: string }`.
5. Given Zod schemas are implemented, when `server/schemas/demo.schema.ts` and `server/schemas/contact.schema.ts` are inspected, then both include strict locale validation: `z.enum(['en', 'pt-BR', 'es'])`; GDS validates against allowed enum; all required fields are non-empty strings.
6. Given security headers are applied, when an HTTP response from any Express route is inspected, then Helmet default headers are present; `Access-Control-Allow-Origin` is set to `ALLOWED_ORIGIN` only, never wildcard.
7. Given the mailer is implemented, when `server/lib/mailer.ts` is inspected, then `sendNotification(subject, body)` wraps `transporter.sendMail()` in `try/catch`, logs errors, and never throws; callers do not need to await it for the HTTP response to succeed.

## Tasks / Subtasks

- [x] Implement Express bootstrap and middleware stack (AC: 1, 4, 6)
  - [x] Update `server/index.ts` to load `dotenv/config`, create the Express app, apply `helmet`, strict CORS from `process.env.ALLOWED_ORIGIN`, JSON parsing, public route mounts, admin route mounts, health route, production static serving for `dist/client`, and graceful shutdown.
  - [x] Apply rate limiting to `POST /api/demo` and `POST /api/contact` only; keep admin auth middleware on `/api/admin/*` only.
  - [x] Ensure all API responses use `{ success, data?, message?, field? }` and no API route returns HTML.
  - [x] Verify no server-only value is introduced in `src/` and no `VITE_` secret appears in client code.
- [x] Implement database schema initialization (AC: 2)
  - [x] Update `server/db.ts` to keep the existing connection singleton, directory creation, WAL pragma, open failure handling, and export, then add idempotent table creation for `demo_requests`, `contacts`, `team_members`, and `admin_users`.
  - [x] Match architecture columns exactly, including locale/status/GDS/read/active CHECK constraints and defaults.
  - [x] Keep the database path behavior compatible with `.env.example`: `DB_PATH=../data/sync_sirius.db`.
- [x] Implement DAO layer (AC: 3)
  - [x] Implement typed DAO methods in `server/dao/leads.dao.ts` for demo request insert, duplicate lookup by email within 60 seconds, list/filter support needed by Phase 3, and status update.
  - [x] Implement `server/dao/contacts.dao.ts` for contact insert, duplicate lookup by email within 60 seconds, list support, and read-state support if needed by admin contacts.
  - [x] Implement `server/dao/team.dao.ts` for team member list/create/update/active toggle using `team_members`.
  - [x] Implement `server/dao/admin.dao.ts` for admin lookup by email and seed/create helpers for `admin_users`.
  - [x] Keep every `db.prepare()` call inside DAO files or `server/db.ts`; route handlers must call DAO methods only.
- [x] Implement middleware, schemas, and mailer (AC: 4, 5, 7)
  - [x] Replace `server/middleware/rateLimit.ts` placeholder with an `express-rate-limit` middleware configured for `windowMs: 15 * 60 * 1000`, `limit: 20`, JSON 429 response, `standardHeaders`, and no legacy headers.
  - [x] Replace `server/middleware/auth.ts` placeholder with JWT httpOnly-cookie verification, 401 on missing/invalid/expired token, and a typed `req.admin` attachment.
  - [x] Replace `server/schemas/demo.schema.ts` placeholder with strict server-side Zod validation for `name`, `email`, `company`, `phone?`, `role`, `gds`, `message?`, and `locale`.
  - [x] Replace `server/schemas/contact.schema.ts` placeholder with strict server-side Zod validation for `name`, `email`, `subject`, `message`, and `locale`.
  - [x] Replace `server/lib/mailer.ts` placeholder with a Nodemailer transporter using only `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `NOTIFY_EMAIL` from `process.env`; `sendNotification(subject, body)` must log and swallow send errors.
- [x] Wire route placeholders without implementing later stories' full behavior (AC: 1, 3, 4, 6)
  - [x] Mount `server/routes/demo.ts`, `server/routes/contact.ts`, and `server/routes/admin/*` so middleware can be verified.
  - [x] Do not implement full demo/contact submission flows here beyond what is needed for infrastructure tests; Story 2.2 owns demo form full-stack behavior and Story 2.3 owns contact form full-stack behavior.
  - [x] Keep route handlers free of raw SQL and prepared statements.
- [x] Add focused tests (AC: 1-7)
  - [x] Add co-located Vitest tests for `server/db.ts`, each DAO, `rateLimit.ts`, `auth.ts`, both schemas, and `mailer.ts`.
  - [x] Test table creation/check constraints using an isolated temporary `DB_PATH`; do not use or mutate the real local database.
  - [x] Test rate-limit 429 response shape and CORS/Helmet headers via Express request-level tests or equivalent lightweight harness.
  - [x] Test `sendNotification()` resolves without throwing when `sendMail` rejects.
  - [x] Run `npm run typecheck` and the relevant `npm run test:run -- server/...` commands.
- [x] Update supporting documentation if implementation changes module status
  - [x] Update `vault/Code/Backend.md` and `vault/Code/Database.md` status rows for Story 2.1 after implementation.
  - [x] Update `_bmad-output/implementation-artifacts/tests/test-summary.md` only if new generated-test summary content is produced.

## Dev Notes

### Source Context

- Epic 2 goal: visitors submit demo/contact inquiries with locale-aware validation, on-page confirmation, SMTP notifications, secured storage, and rate limiting. Story 2.1 is the foundation for FR9-FR16, FR22, FR38-FR40. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2: Lead Capture & Conversion (Phase 1 MVP - Part B)`]
- Story 2.1 is a backend infrastructure story, not a UX story. It must prepare DB, middleware, DAO, schema, auth, and mailer surfaces so Stories 2.2-2.7 can build on them. [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.1: Backend Infrastructure - Database, DAOs & Middleware`]
- PRD confirms lead data must be tagged by locale, stored in a secured store, rate-limited, and validated against the allowlist `en`, `pt-BR`, `es`. [Source: `_bmad-output/planning-artifacts/prd.md#Functional Requirements`]
- PRD NFRs require form API responses in <= 3s under normal load, rate limit of 20 requests per 15 minutes on `/api/demo` and `/api/contact`, and SMTP failure not surfacing as 5xx after DB write. [Source: `_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements`]

### Current State of Files to Update

- `server/index.ts` currently only applies `express.json()`, exposes `/api/health`, opens the DB, listens on `PORT || 3001`, and handles graceful shutdown. It does not yet apply Helmet, CORS, rate limiting, auth middleware, API route mounts, or production static serving.
- `server/db.ts` already creates the DB directory, opens `better-sqlite3`, sets WAL mode, logs open failure, exits on DB open failure, and exports the singleton. Schema creation is explicitly deferred to Story 2.1.
- `server/middleware/rateLimit.ts`, `server/middleware/auth.ts`, `server/lib/mailer.ts`, `server/schemas/demo.schema.ts`, `server/schemas/contact.schema.ts`, all `server/dao/*.ts`, `server/routes/demo.ts`, `server/routes/contact.ts`, `server/routes/admin/*.ts`, and `server/db.seed.ts` are placeholders containing `export {}`.
- `.env.example` already documents required keys: `PORT`, `DB_PATH`, `JWT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL`, `ALLOWED_ORIGIN`; keep real secret values out of source.

### Architecture Guardrails

- Stack is fixed: TypeScript strict mode, Node/Express backend, Vite/React frontend, SQLite via `better-sqlite3`, Zod, Zustand, i18next, JWT, bcryptjs, Nodemailer. Do not introduce an ORM, GraphQL, Redux, server-side rendering, or a second backend framework. [Source: `_bmad-output/planning-artifacts/architecture.md#Technology Stack - Pre-Defined`]
- Data access pattern is raw SQL plus DAO/repository. Use one DAO per domain: `leads.dao.ts`, `contacts.dao.ts`, `team.dao.ts`, `admin.dao.ts`. Route handlers call DAO methods only. [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- API JSON must stay `snake_case`; no camelCase transforms in API responses. DAO methods should return typed objects matching DB/API field names. [Source: `_bmad-output/planning-artifacts/architecture.md#API JSON Naming - snake_case throughout`]
- API response envelope is always `{ success: true, data?: T, message?: string }` or `{ success: false, message: string, field?: string }`. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Middleware order is fixed: `helmet()` -> `cors()` -> `express.json()` -> route-level rate limit for form routes -> auth for admin routes -> handlers. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Public API routes are `POST /api/demo` and `POST /api/contact`; protected routes are all `/api/admin/*`; Express serves `dist/client/` in production and Vite proxies `/api` in development. [Source: `_bmad-output/planning-artifacts/architecture.md#Architectural Boundaries`]
- Co-locate tests beside the server file they cover. Do not add `__tests__/` folders. [Source: `_bmad-output/planning-artifacts/architecture.md#Structure Patterns`]

### Required Database Schema

Implement these four tables exactly as specified by architecture:

- `demo_requests`: `id`, `name`, `email`, `company`, `phone`, `role`, `gds`, `message`, `locale`, `status`, `created_at`, `updated_at`; CHECK constraints for GDS (`Amadeus`, `Sabre`, `Galileo`, `Worldspan`, `Other`, `None yet`), locale (`en`, `pt-BR`, `es`), and status (`pending`, `contacted`, `qualified`).
- `contacts`: `id`, `name`, `email`, `subject`, `message`, `locale`, `read`, `created_at`; CHECK constraints for locale and `read IN (0,1)`.
- `team_members`: `id`, `name`, `role_en`, `role_pt`, `role_es`, `bio_en`, `bio_pt`, `bio_es`, `linkedin`, `photo_url`, `order_index`, `active`; CHECK constraint for `active IN (0,1)`.
- `admin_users`: `id`, `email UNIQUE`, `password_hash`, `created_at`.

Source: `_bmad-output/planning-artifacts/architecture.md#Database Schema`

### Security and Reliability Requirements

- JWT auth uses an httpOnly cookie with SameSite=Strict and 8-hour expiry. Token payload is `{ adminId, email, iat, exp }`; no roles are needed for MVP. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- `bcryptjs` salt rounds must be at least 12 for admin password hashing. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- CORS origin must be `process.env.ALLOWED_ORIGIN`; never `*`. Helmet default headers must be enabled. [Source: `_bmad-output/planning-artifacts/architecture.md#Security Constraints Enforced`]
- SQLite WAL mode is already present and should remain. `better-sqlite3` official docs recommend WAL mode for web-app read/write performance; use its `db.pragma()` API for PRAGMAs. [Source: `server/db.ts`; external: `better-sqlite3` docs]
- Nodemailer `sendMail()` returns a promise when no callback is supplied; implement `sendNotification()` with `await transporter.sendMail(...)` inside `try/catch` and swallow/log errors to preserve fire-and-forget visitor UX. [Source: `_bmad-output/planning-artifacts/architecture.md#SMTP (Fire-and-Forget)`; external: Nodemailer docs]
- `express-rate-limit` v8 supports `standardHeaders`, `legacyHeaders`, and `ipv6Subnet`; configure intentionally and test the JSON 429 handler. [Source: `package.json`; external: express-rate-limit docs]

### Previous Story Intelligence

- Story 1.11 established the test infrastructure baseline and explicitly deferred backend DAO/route/middleware tests to Story 2.1. This story must not ship without backend-focused tests. [Source: `_bmad-output/implementation-artifacts/1-11-test-infrastructure-baseline.md#Why this is Story 1.11 and not Story 2.0`]
- Use Vitest for unit/integration tests and Playwright only for browser-level E2E. Story 2.1 should prefer fast server tests; no UI E2E is required unless implementation changes visible frontend behavior. [Source: `package.json`; `_bmad-output/implementation-artifacts/1-11-test-infrastructure-baseline.md#Files touched`]
- Keep existing Epic 1 frontend patterns intact. Backend changes must not alter current public pages, lazy section loading, i18n initialization, privacy route, or content-section tests.

### Latest Technical Notes

- Installed package versions already include the backend dependencies this story needs: `express@^4.22.2`, `helmet@^8.1.0`, `cors@^2.8.6`, `express-rate-limit@^8.5.2`, `better-sqlite3@^12.10.0`, `zod@^3.25.76`, `jsonwebtoken@^9.0.3`, `bcryptjs@^3.0.3`, `nodemailer@^8.0.7`. Use these installed dependencies; do not upgrade packages as part of this story unless required by a failing install or security issue.
- Helmet docs state `helmet()` sets default security response headers and removes Express's default `X-Powered-By`; tests can assert representative headers rather than duplicating every default header value.
- `better-sqlite3` v12 line requires a supported Node.js version and recommends WAL for web-app concurrency; this repo already uses WAL and should keep that behavior.

### Scope Boundaries

- Do not build the DemoForm UI, contact form UI, hooks, locale-aware client schemas, or confirmation UX in this story. Those belong to Stories 2.2, 2.3, and 2.6.
- Do not implement SMTP notification formatting for every business payload beyond the generic `sendNotification(subject, body)` utility. Story 2.5 owns exact demo/contact notification body content.
- Do not implement admin pages. Story 2.1 may implement backend admin auth/DAO foundations because the middleware and tables require them, but Phase 3 UI stories own admin UX.
- Do not add new environment variable names beyond the keys already documented in `.env.example` unless architecture is updated.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 2.1: Backend Infrastructure - Database, DAOs & Middleware`
- `_bmad-output/planning-artifacts/architecture.md#Data Architecture`
- `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`
- `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Architectural Boundaries`
- `_bmad-output/planning-artifacts/prd.md#Functional Requirements`
- `_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Conversion-Optimized Form UX`
- `_bmad-output/implementation-artifacts/1-11-test-infrastructure-baseline.md#Dev Notes`
- `vault/Planning/Architecture-Key.md`
- `vault/Code/Backend.md`
- `vault/Code/Database.md`
- `package.json`
- `.env.example`
- Helmet official docs: `https://helmetjs.github.io/`
- express-rate-limit official usage docs: `https://express-rate-limit.mintlify.app/quickstart/usage`
- better-sqlite3 official docs: `https://github.com/WiseLibs/better-sqlite3`
- Nodemailer official docs: `https://nodemailer.com/`

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m] (Caveman Mode)

### Debug Log References

- `npm run typecheck` — clean (no errors).
- `npx vitest run server/` — 63 server tests pass across 12 files.
- `npm run test:run` — 162 total tests pass across 34 files (no regressions vs. Epic 1 baseline).

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Existing backend scaffold is present but mostly placeholder-only; implementation must update placeholders rather than create duplicate parallel files.
- `server/db.ts` exports `initSchema(db?)` which is invoked at module load against the singleton and is also injectable for in-memory test databases. Schema creation is idempotent (`CREATE TABLE IF NOT EXISTS`) and matches architecture columns/CHECK/UNIQUE/defaults exactly.
- `server/index.ts` now exports a `createApp()` factory so tests can boot the full middleware stack against ephemeral ports; the listener only starts when the file is run as the main module (`require.main === module`). Middleware order: `helmet → cors(ALLOWED_ORIGIN, credentials: true) → express.json → cookieParser → routes`. Form rate limiter is applied only to `POST /api/demo` and `POST /api/contact`; `requireAdmin` guards admin data routes and `/api/admin/auth/me` while login/logout remain public placeholders.
- Routes are Express `Router()` modules; demo/contact and admin auth currently return `501` envelopes because full behavior belongs to Stories 2.2, 2.3, and the admin auth story. Admin list endpoints (leads/contacts/team) are functional and call DAOs directly — no `db.prepare` in any route file (enforced by a co-located test).
- DAO files use a `create*Dao(database = defaultDb)` factory pattern so tests can inject in-memory SQLite without touching the real local `data/sync_sirius.db`. Default singletons are exported for production use.
- Mailer uses lazy-cached Nodemailer transporter, exposes `resetTransporterForTesting()`, and `sendNotification()` always resolves — SMTP failures are logged and swallowed so the visitor-facing HTTP path never sees a 5xx caused by mail delivery.
- Zod schemas enforce strict `z.enum(['en','pt-BR','es'])` locale and `gds` enums per AC5, lowercase emails, trim whitespace, and convert empty optional `phone`/`message` strings to `undefined`.
- Co-located tests use `// @vitest-environment node` directive on every server test so they run in Node (project default Vitest env is `jsdom` for the React tests). Lightweight request harness invokes the Express app directly through `IncomingMessage`/`ServerResponse` instead of pulling in `supertest`.
- `server/index.test.ts` includes a forensic test that walks `src/**/*.{ts,tsx,js,jsx}` and asserts no `VITE_JWT_SECRET`/`VITE_SMTP*`/`VITE_DB_PATH`/`VITE_NOTIFY*` strings exist anywhere in client code (AC1), and a second test that walks `server/routes/**/*.ts` to assert no `db.prepare(` calls leak into route handlers (AC3).
- No new env keys, no new dependencies, and no package version changes — uses only what was already installed.

### Senior Developer Review (AI)

Reviewer: Codex on 2026-05-15

Outcome: Approved after automatic fixes. Story status set to `done`.

Findings fixed:
- HIGH — Form route limiter was mounted with `app.use('/api/demo', formRateLimiter, ...)` and `app.use('/api/contact', ...)`, so non-POST requests under those paths could consume the 20-request form quota. Moved the limiter into the POST handlers and added a regression test that GET requests do not consume POST quota.
- HIGH — `/api/admin/auth/me` was mounted on the public auth router and relied on `req.admin` without running `requireAdmin`, so valid admin identity could never be returned by that endpoint. Added `requireAdmin` to `/me` and covered both missing-cookie and valid-cookie behavior.
- MEDIUM — Unknown or malformed `/api/*` requests fell through to Express default HTML/error responses, contradicting the story task requiring API responses to use the JSON envelope and never return HTML. Added JSON 404 and API error handlers with regression coverage.
- MEDIUM — The story File List omitted changed review/support files discovered in git: `server/index.rateLimit.test.ts` and `server/test-utils/request.ts`. File List updated.

Validation notes:
- Acceptance criteria 1-7 cross-checked against implementation and tests.
- Project context file was not present; architecture, PRD, epics, package metadata, and official docs references were used instead.
- External reference spot-check: express-rate-limit official usage documents endpoint-level limiter placement; Helmet official docs document default `helmet()` headers; Nodemailer official docs document promise-returning `sendMail`; better-sqlite3 official docs document `prepare()` and WAL usage.

### File List

- server/db.ts (modified — added idempotent `initSchema`, invoked on module load, exported for tests)
- server/index.ts (modified — `createApp()` factory, full middleware stack, route mounts, JSON API fallbacks, prod static, `require.main` guard for listener)
- server/dao/leads.dao.ts (modified — `createLeadsDao`/`leadsDao`, insert/findRecentByEmail/list/updateStatus/getById)
- server/dao/contacts.dao.ts (modified — `createContactsDao`/`contactsDao`, insert/findRecentByEmail/list/markRead/getById)
- server/dao/team.dao.ts (modified — `createTeamDao`/`teamDao`, list/getById/create/update/setActive with whitelisted patch keys)
- server/dao/admin.dao.ts (modified — `createAdminDao`/`adminDao`, findByEmail/findById/create/upsert)
- server/middleware/rateLimit.ts (modified — `createFormRateLimiter`, `formRateLimiter`, 20/15m, JSON 429 envelope, draft-7 standard headers, legacy off)
- server/middleware/auth.ts (modified — `requireAdmin`, `AUTH_COOKIE_NAME='admin_token'`, JWT verify, 401 on missing/invalid/expired, 500 when `JWT_SECRET` missing, typed `req.admin`)
- server/schemas/demo.schema.ts (modified — `demoSchema`, `LOCALES`, `GDS_VALUES`, strict enums + trim/lowercase email)
- server/schemas/contact.schema.ts (modified — `contactSchema` reusing `LOCALES`)
- server/lib/mailer.ts (modified — `getTransporter` lazy cache, `resetTransporterForTesting`, `sendNotification` swallows errors)
- server/routes/demo.ts (modified — `Router`, rate-limited `POST /` 501 placeholder envelope)
- server/routes/contact.ts (modified — `Router`, rate-limited `POST /` 501 placeholder envelope)
- server/routes/admin/auth.ts (modified — `Router`, login/logout 501 placeholders, protected `GET /me`)
- server/routes/admin/leads.ts (modified — `Router`, `GET /` lists via `leadsDao` with status/locale query filters)
- server/routes/admin/contacts.ts (modified — `Router`, `GET /` lists via `contactsDao` with locale/read query filters)
- server/routes/admin/team.ts (modified — `Router`, `GET /` lists via `teamDao`)
- server/db.test.ts (new — initSchema/CHECK/UNIQUE/idempotency, 8 tests)
- server/dao/leads.dao.test.ts (new — 5 tests)
- server/dao/contacts.dao.test.ts (new — 4 tests)
- server/dao/team.dao.test.ts (new — 5 tests)
- server/dao/admin.dao.test.ts (new — 4 tests)
- server/schemas/demo.schema.test.ts (new — 7 tests)
- server/schemas/contact.schema.test.ts (new — 4 tests)
- server/middleware/rateLimit.test.ts (new — 2 tests, JSON 429 shape verified via request harness)
- server/middleware/auth.test.ts (new — 5 tests covering 401 paths and valid token)
- server/lib/mailer.test.ts (new — 3 tests, swallow-on-error verified via `vi.mock('nodemailer')`)
- server/index.test.ts (new — 13 tests covering Helmet, CORS non-wildcard, route mounts, auth `/me`, JSON API fallback/error envelopes, plus forensic VITE_ and `db.prepare` guards)
- server/index.rateLimit.test.ts (new — 3 tests covering mounted form route rate limiting and POST-only quota behavior)
- server/test-utils/request.ts (new — direct Express request harness for server tests)
- vault/Code/Backend.md (modified — Story 2.1 status row filled with full file inventory)
- vault/Code/Database.md (modified — Story 2.1 status row filled)
- vault/Code/Index.md (modified — status points to Story 2.2 after Story 2.1 completion)
- vault/00-Home.md (modified — active sprint and quality status reflect Story 2.1 done)
- vault/Planning/Epics-Index.md (modified — Story 2.1 marked `[x]` Done)
- _bmad-output/implementation-artifacts/tests/test-summary.md (modified — server/full-suite counts and review regression coverage updated)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified — `2-1-...` set to `done`, `last_updated` header updated)

### Change Log

- 2026-05-15 — Story 2.1 backend infrastructure landed: 4-table schema initialization, typed DAOs, full Express middleware stack (helmet/cors/rate limit/JWT cookie auth), strict Zod schemas with locale enum, fire-and-forget Nodemailer notification utility, mounted public/admin route surfaces, 57 co-located server tests. No regressions: 156/156 total tests passed before senior-review fixes.
- 2026-05-15 — Full suite after senior review passes: 162/162 tests across 34 files.
- 2026-05-15 — Senior review auto-fixes applied: POST-only form rate limiter placement, protected `/api/admin/auth/me`, JSON envelope handlers for unmatched/malformed API requests, added regression tests. `npm run typecheck` clean; `npx vitest run server/` passes 63/63 tests.
