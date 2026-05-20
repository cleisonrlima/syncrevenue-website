# Backend Module

**Stack:** Express + better-sqlite3 + Zod + nodemailer
**Entry:** `server/index.ts`

---

## Files

| File | Description |
|---|---|
| `server/index.ts` | Express bootstrap; graceful shutdown with 10s forced exit if `close` hangs |
| `server/db.ts` | SQLite connection singleton; schema init + idempotent migrations. Story 6.10 GDS CHECK migration rebuilds `demo_requests` transactionally, copies explicit columns, and recreates dependent index/trigger SQL before commit. Open failure logs and `process.exit(1)` |
| `server/db.seed.ts` | Admin user seed / reset CLI |
| `server/middleware/auth.ts` | JWT cookie verify → `req.admin` |
| `server/middleware/rateLimit.ts` | Exports `createFormRateLimiter()` factory — invoked per POST route, never shared singleton |
| `server/test-utils/request.ts` | Test harness: invokes Express via `IncomingMessage`/`ServerResponse`, no port bind, no `supertest` |
| `server/lib/mailer.ts` | `sendNotification(subject, body)` — fire-and-forget via `void ...catch(console.error)` in routes |
| `scripts/check-client-bundle-secrets.mjs` | Post-build scan of `dist/client` for seeded sentinel env vars |
| `server/routes/demo.ts` | `POST /api/demo` — demo request |
| `server/routes/contact.ts` | `POST /api/contact` — contact form |
| `server/routes/admin/auth.ts` | `POST /api/admin/login`, `POST /api/admin/logout` |
| `server/routes/admin/leads.ts` | `GET/PATCH /api/admin/leads` |
| `server/routes/admin/team.ts` | `GET/POST/PATCH/DELETE /api/admin/team` |

---

## Middleware Stack Order

```
helmet() → cors() → express.json() → rateLimit (form routes) → auth (admin routes) → handlers
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/demo` | — | Submit demo request |
| POST | `/api/contact` | — | Submit contact form |
| POST | `/api/admin/login` | — | Admin login |
| POST | `/api/admin/logout` | JWT | Admin logout |
| GET | `/api/admin/leads` | JWT | List leads (filterable) |
| PATCH | `/api/admin/leads/:id/status` | JWT | Update lead status |
| GET | `/api/admin/team` | JWT | List team members |
| POST | `/api/admin/team` | JWT | Create team member |
| PATCH | `/api/admin/team/:id` | JWT | Update team member |
| DELETE | `/api/admin/team/:id` | JWT | Deactivate team member |
| PATCH | `/api/admin/team/:id/active` | JWT | Toggle active |

---

## API Response Envelope

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "..." }
```

---

## Status

> Fill as stories complete

| Story | Files Created |
|---|---|
| 1.1 | server/index.ts (health check), server/db.ts (connection, WAL, no schema), all placeholder files |
| 2.1 | server/index.ts (full middleware stack, createApp factory, route mounts, JSON API fallbacks, prod static), server/db.ts (initSchema for 4 tables), server/middleware/auth.ts (JWT cookie verify), server/middleware/rateLimit.ts (express-rate-limit form limiter 20/15m), server/schemas/{demo,contact}.schema.ts (Zod), server/lib/mailer.ts (Nodemailer sendNotification fire-and-forget), server/dao/{leads,contacts,team,admin}.dao.ts (typed factories), server/routes/{demo,contact,admin/*}.ts (Express Router stubs / typed list endpoints, POST-only form rate limiting, protected auth /me), co-located *.test.ts (63 server tests) |
| 2.2 | (frontend-only — see Code/Frontend.md) |
| 2.3 | `server/routes/contact.ts` POST handler + per-route limiter; `server/schemas/contact.schema.ts` subject enum (`CONTACT_SUBJECT_VALUES`); contact route + schema tests |
| 2.4 | (frontend-only — `DemoFormHandle` imperative handle, single-form invariant) |
| 2.5 | `server/lib/mailer.ts` body formatting; both routes call `void sendNotification(...).catch(console.error)`; em-dash subjects |
| 2.6 | (frontend-only — `createDemoSchema(t)` / `createContactSchema(t)` factories in `src/hooks/*`) |
| 2.7 | `server/middleware/rateLimit.ts` refactored to `createFormRateLimiter()` factory; per-route instances in `demo.ts` / `contact.ts`; exact 429 body `{ success: false, message: 'Too many requests' }`; `scripts/check-client-bundle-secrets.mjs` post-build sentinel scan |
| 6.10 | `server/schemas/demo.schema.ts` accepts canonical `Travelport (Galileo/Worldspan)` plus legacy `Galileo` / `Worldspan` / `None yet`; `server/db.ts` extends `demo_requests.gds` CHECK via transactional table rebuild that preserves dependent indexes/triggers; route/schema/db tests cover new + legacy + invalid GDS |
| 5.7 | `ecosystem.config.js` adds OPT-IN PM2 cluster mode block — commented-out `exec_mode: 'cluster'` + `instances: 'max'` with SQLite-WAL write-safety warning + ADR cross-reference. No production-path change; default execution stays `fork`. WAL pragma already on in `server/db.ts:14` (unchanged); regression guard added in `server/db.test.ts` ("enables WAL journal_mode on a fresh connection (Story 5.7 ADR)"). ADR: `vault/Planning/Architecture-Key.md` → "Cluster Mode Decision (Story 5.7 — 2026-05-20)". |

---

## Test Harness Notes

- Every server test must start with `// @vitest-environment node` (default project env is `jsdom`).
- Use `server/test-utils/request.ts` instead of `supertest` — invokes Express via `IncomingMessage`/`ServerResponse`, no port bind.
- Forensic source-walk tests (Story 2.1) assert no `VITE_*` secret strings in `src/**` and no `db.prepare(` in `server/routes/**`.

## Playwright Sandbox Workaround

> Full reference: [[Planning/Sandbox-Conventions]] (codified in Story 3.10).

When local port binding is denied by the sandbox, run Playwright specs with:

```
PLAYWRIGHT_BASE_URL=http://127.0.0.1:9 npm run test:e2e -- --project=chromium <spec>
```

The `127.0.0.1:9` base URL satisfies the launcher's URL validation without requiring a real listener; `playwright.config.ts:28` also skips the auto `webServer` block when the env var is set. Pattern discovered in Story 2.7; see [[Planning/Sandbox-Conventions]] for caveats (the recipe only unblocks the runner — real-server specs must still opt in via `test.skip(!process.env.PLAYWRIGHT_BASE_URL, ...)`).
