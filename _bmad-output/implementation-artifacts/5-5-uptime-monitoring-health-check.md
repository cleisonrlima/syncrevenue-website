# Story 5.5: Uptime Monitoring & Health Check

Status: done

<!-- Created 2026-05-20. Epic 5 — Production Deployment. Sprint: SYN Sprint 3 (current sprint). Depends on: Story 5.3. -->

## Story

As a Sync Sirius operator,
I want automated uptime monitoring with alerts when the site goes down,
So that lead capture downtime is detected and resolved before significant demo requests are lost.

## Acceptance Criteria

1. **Given** the server is running AND the database is responsive, **when** `GET /api/health` is called without authentication, **then** the response is HTTP 200 `{ success: true, status: 'ok', timestamp: '<ISO string>' }` and completes in under 200ms.

2. **Given** a deployed production instance, **when** an uptime monitoring service is configured against `GET /api/health` with a 5-minute check interval, **then** the monitor sends an alert to `NOTIFY_EMAIL` within ≤5 minutes of the endpoint becoming unreachable.

3. **Given** PM2 restarts the server process during a monitoring poll window, **when** the downtime exceeds the check interval, **then** the alert fires; and once the server recovers, the monitoring service self-recovers without manual intervention.

4. **Given** the production server, **when** `POST /api/demo` is load-tested with `autocannon` before go-live, **then** p95 response time is verified to be ≤3 seconds.

## Tasks / Subtasks

- [ ] Subtask 1: Extract `/api/health` into `server/routes/health.ts` and enhance response (AC 1)
  - [ ] Create `server/routes/health.ts` with a GET `/` handler that returns `{ success: true, status: 'ok', timestamp: new Date().toISOString() }` HTTP 200
  - [ ] Add DB liveness probe: run `db.prepare('SELECT 1').get()` in try/catch; if it throws, return HTTP 503 `{ success: false, status: 'db_unavailable', timestamp: '...' }`
  - [ ] Import `db` from `server/db.ts`; no auth middleware applied
  - [ ] Replace the inline `app.get('/api/health', ...)` in `server/index.ts` with `app.use('/api', healthRouter)`
  - [ ] Write unit tests in `server/routes/health.test.ts`: happy path (200 + ok + timestamp), DB failure path (mock throws → 503 + db_unavailable)

- [ ] Subtask 2: Document uptime monitoring service setup (AC 2, 3)
  - [ ] Create `docs/monitoring-setup.md` with UptimeRobot setup instructions (primary) + Betteruptime/Freshping as alternatives
  - [ ] Include endpoint URL pattern, check interval (5 min), alert type (email to NOTIFY_EMAIL), keyword check (`"status":"ok"`), expected HTTP status (200)
  - [ ] Document self-recovery behavior and PM2 crash/restart interaction with monitor polling window

- [ ] Subtask 3: Document p95 load-test verification procedure (AC 4)
  - [ ] Add "Load Testing / p95 Verification" section to `docs/monitoring-setup.md` with `npx autocannon` sample command
  - [ ] Note that autocannon is not added as a project dependency

## Dev Notes

### Source Context

- Epic 5 enables production deployment of the SyncRevenue website. Story 5.5 adds health-check observability and uptime monitoring configuration. [Source: `_bmad-output/planning-artifacts/epics.md`]
- `server/index.ts` already has an inline `app.get('/api/health', (_req, res) => { res.json({ success: true, status: 'ok' }) })` at line 56. This story extracts and enhances it. [Source: `server/index.ts:56-58`]
- The `db` default export from `server/db.ts` is a `better-sqlite3` `Database` instance — synchronous API. `db.prepare('SELECT 1').get()` is synchronous and completes in microseconds on a healthy DB. [Source: `server/db.ts`]
- Route tests use the `server/test-utils/request` helper and isolate the DB via `vi.resetModules()` + a temp-dir `DB_PATH`. [Source: `server/routes/contact.test.ts`]
- `NOTIFY_EMAIL` is already a required env var enforced by `server/env-validation.ts`. [Source: `server/env-validation.ts`]

### Implementation Notes

**AC 1 — `/api/health` extraction and enhancement:**
- Create `server/routes/health.ts` exporting a Router. The GET `/` handler:
  1. Records `const start = Date.now()` (for documentation/logging only — not in response).
  2. Runs `db.prepare('SELECT 1').get()` in try/catch.
  3. On success: `res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() })` HTTP 200.
  4. On DB error: `res.status(503).json({ success: false, status: 'db_unavailable', timestamp: new Date().toISOString() })`.
  5. No authentication middleware — must be publicly accessible.
- In `server/index.ts`: remove the inline `app.get('/api/health', ...)` and add `import healthRouter from './routes/health'` + `app.use('/api', healthRouter)` before the demo/contact routes.
- The DB liveness probe is synchronous so < 200ms is trivially satisfied on any functioning system.

**AC 2 + 3 — Monitoring service (documentation):**
- No code changes. Create `docs/monitoring-setup.md` with:
  - UptimeRobot free-tier setup (primary recommendation) — account creation, monitor type (HTTP(s)), URL pattern, interval, alert contacts.
  - Betteruptime and Freshping as alternatives.
  - Keyword monitoring on `"status":"ok"` to catch degraded responses that still return HTTP 200.
  - Self-recovery behavior: once the endpoint is reachable again, all three services auto-resume green state — no manual reset.
  - PM2 note: `pm2 start ecosystem.config.js` auto-restarts the process on crash in ~1-5 seconds; only extended outages (> 5 min) will trigger alerts. A one-time crash and fast recovery produces no alert.

**AC 4 — Load test documentation:**
- Add section to `docs/monitoring-setup.md` with autocannon sample: `npx autocannon -c 10 -d 30 http://localhost:3001/api/demo -m POST -H 'Content-Type: application/json' -b '<json payload>'`. Recommend measuring p99 as well. Do NOT add autocannon to package.json dependencies.

### Architecture Guardrails

- No new npm dependencies.
- Health route must remain unauthenticated — do NOT add `requireAdmin` or any other middleware.
- Route isolation: import `db` directly in `health.ts` (same pattern as other routes that import DAOs).
- `vi.resetModules()` pattern required in tests to get fresh `db` instance per test run (consistent with existing route tests).
- All 743 existing tests must continue to pass; `tsc --noEmit` must exit 0.

## Review Findings

**Reviewer:** Cross-model independent review (Claude Sonnet 4.6)
**Review date:** 2026-05-20

### Summary

Implementation passes adversarial review. All 5 focus areas clean. One trivial patch applied inline.

### Findings

#### F1 — DB probe correctness (PASS)
`ping()` correctly catches all exceptions from `database.prepare('SELECT 1').get()`, including the "database connection is not open" error thrown by better-sqlite3 when the DB is closed. Returns 503 on any throw. No internal error details leak to the response body.

#### F2 — 503 response shape consistency (PASS)
Shape `{ success, status, timestamp }` is identical between 200 and 503 responses. Keyword monitoring on `"status":"ok"` as documented correctly identifies degraded state. No uptime-monitor compatibility issues.

#### F3 — Test isolation (PASS with trivial patch)
`vi.resetModules()` in `beforeEach` correctly re-evaluates `../db` with the fresh `DB_PATH` env var, so each test gets a fresh DB-backed `healthDao` singleton. The 503 failure-simulation test used `vi.doMock` + `vi.doUnmock` but the unmock was not wrapped in `try/finally`, meaning a failing assertion could leave the mock registered for subsequent tests. **Patched inline** — `vi.doUnmock` moved to `finally` block. Commit: `fix(story-5.5): close review findings`.

#### F4 — Security (PASS)
503 response body contains only `{ success: false, status: 'db_unavailable', timestamp }`. The caught exception is swallowed — no stack trace, no internal path, no SQLite error message exposed.

#### F5 — Timing budget (PASS, low flakiness risk noted)
150ms budget measured from after `createApp()` returns (module loading excluded). Synchronous SQLite `SELECT 1` completes in microseconds. 150ms is very generous. Flakiness risk on heavily loaded CI runners is low-probability and acceptable.

#### F6 — `docs/monitoring-setup.md` accuracy (PASS)
Endpoint URL pattern, response shape, HTTP status codes, keyword monitoring, alert contacts, PM2 recovery behavior, and autocannon load-test command are all accurate. The load test targets `/api/demo` (correct per AC 4, not the health endpoint). No documentation errors found.

### Non-trivial findings
None. No new stories required from this review.

---

### File Write Surface

```
server/routes/health.ts              ← NEW: extracted + enhanced health check handler
server/routes/health.test.ts         ← NEW: unit tests (happy path + DB failure)
server/index.ts                      ← UPDATE: replace inline /api/health with healthRouter
docs/monitoring-setup.md             ← NEW: UptimeRobot setup + load-test procedure
_bmad-output/implementation-artifacts/sprint-status.yaml  ← UPDATE: 5-5 → done
vault/Planning/Epics-Index.md        ← UPDATE: 5.5 → [x]
vault/00-Home.md                     ← UPDATE: project status
```
