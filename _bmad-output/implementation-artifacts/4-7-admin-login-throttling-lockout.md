# Story 4.7: Admin Login Throttling & Account Lockout (Story 4.1 Review Follow-up)

Status: done

<!-- Created 2026-05-16 from Story 4.1 cross-model review (Codex). Deferred review finding #1. Parent Jira: SYN-165. -->

## Story

As a Sync Sirius operator,
I want the admin login endpoint protected against brute-force attempts with both per-IP rate limiting and per-account lockout,
So that credential stuffing and password-guessing attacks against the admin panel are infeasible in practice.

## Background

Story 4.1 review (Codex, 2026-05-16) flagged that `POST /api/admin/auth/login` has no auth-specific throttling. The existing `formRateLimiter` is mounted only on `/api/demo` and `/api/contact` (per Story 2.7). The admin login endpoint is currently unbounded, which exposes the panel to:

- **IP-bound brute force**: attacker hammers `/api/admin/auth/login` from a single IP, no quota stops them.
- **Email-bound credential stuffing**: attacker tries one stolen password across many emails (or many passwords against one email) — no per-account lockout exists.

Story 4.1 itself explicitly scoped admin login rate limiting OUT (defer to follow-up). This story is that follow-up.

## Acceptance Criteria

1. **Given** more than 5 failed `POST /api/admin/auth/login` attempts arrive from the same IP within a 15-minute window, **when** the 6th attempt is submitted, **then** the server returns HTTP 429 with body `{ success: false, message: 'Too many requests' }`; no `admin_token` cookie is set; the limiter window is INDEPENDENT of the existing form rate limiter (exhausting `/api/admin/auth/login` from one IP must NOT consume `/api/demo` quota and vice versa).

2. **Given** more than 5 failed login attempts target the same `email` value within a 15-minute window (across any IP), **when** the 6th attempt for that email arrives, **then** the account is temporarily locked; the response stays HTTP 401 with body `{ success: false, message: 'Invalid credentials' }` — exact same envelope as a normal wrong-password (no information leak that the account is locked vs unknown vs wrong-password); the lock auto-clears 15 minutes after the most recent failed attempt timestamp.

3. **Given** an admin presents the CORRECT password during an active lockout window, **when** the login request is processed, **then** the account remains locked and the response is HTTP 401 `'Invalid credentials'` until the lockout window elapses. Once it elapses, the next correct-password attempt resets the failure counter and issues a normal JWT cookie (200 + cookie).

4. **Given** an admin enters the correct password while the failure counter is below the threshold (1–5 prior failures), **when** login succeeds, **then** the failure counter for that email resets to 0 atomically with the cookie issuance; subsequent failures start counting from 0 again.

5. **Given** the schema is inspected, **when** the admin storage layout is read, **then** failure tracking is DURABLE across server restarts. Either: (a) a new `admin_login_attempts` table with columns `(email TEXT NOT NULL, failed_count INTEGER NOT NULL DEFAULT 0, last_failed_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (email))`, OR (b) `admin_users` gains `failed_count` and `locked_until` columns. Pick (a) for cleaner separation between credential store and security counters; document the choice inline. No in-memory-only counters — server restart must NOT reset state.

6. **Given** the response envelope is inspected, **when** any throttling-induced denial fires, **then** the JSON body matches the project convention exactly: 429 uses `{ success: false, message: 'Too many requests' }` (matches the existing form rate limiter shape from Story 2.7); 401-during-lockout uses the same `'Invalid credentials'` shape as Story 4.1's wrong-password path.

7. **Given** unit and integration tests run, **when** `npm run test:run` executes, **then** new tests cover: (a) 6th IP-bound attempt within window → 429; (b) 6th email-bound attempt → still 401 (asserts message is exactly `'Invalid credentials'`, NOT `'Account locked'`); (c) correct password during lockout → still 401; (d) correct password after window elapses → 200 + cookie + counter reset; (e) failure counter persists across `createApp()` re-creates (i.e., across server restarts simulated by re-importing the module); (f) IP and email windows are independent (exhausting one branch does not exhaust the other).

8. **Given** all verification commands run, **when** `npm run typecheck && npm run test:run && npm run build` executes, **then** all three pass; client bundle secret scan continues to pass.

## Tasks / Subtasks

- [x] Subtask 1: Schema — `admin_login_attempts` table (AC: 5)
  - [x] Add `admin_login_attempts (email TEXT PRIMARY KEY, failed_count INTEGER NOT NULL DEFAULT 0, last_failed_at TEXT NOT NULL DEFAULT (datetime('now')))` to `server/db.ts` `initSchema`. Keep `CREATE TABLE IF NOT EXISTS` so existing prod DB upgrades cleanly without manual migration.
  - [x] Add 2-line comment in `db.ts` explaining the rationale for separate table vs columns on `admin_users` (separation of credential store from security counters; easier to clear without touching credential rows).

- [x] Subtask 2: DAO — `admin-login-attempts.dao.ts` (AC: 2, 3, 4, 5)
  - [x] Create `server/dao/admin-login-attempts.dao.ts` with `createAdminLoginAttemptsDao(db)` factory matching the existing DAO pattern (`leads.dao.ts`, `admin.dao.ts`).
  - [x] Methods: `getByEmail(email)`, `recordFailure(email, now?)` (UPSERT — inserts with count 1 OR increments + bumps `last_failed_at`), `reset(email)` (deletes row), `isLocked(email, windowMs, threshold, now?)` (reads row, returns true when `failed_count ≥ threshold` AND `now - last_failed_at < windowMs`).
  - [x] Co-located `admin-login-attempts.dao.test.ts` covering all branches with `:memory:` DB (6 cases).

- [x] Subtask 3: Per-IP rate limiter for admin login (AC: 1, 6)
  - [x] In `server/middleware/rateLimit.ts` add `createAdminLoginRateLimiter()` factory (separate from `createFormRateLimiter`). Constants: `ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000`, `ADMIN_LOGIN_MAX = 5`. `standardHeaders: 'draft-7'`, `legacyHeaders: false`. Custom handler returns exactly `{ success: false, message: 'Too many requests' }`.
  - [x] Mount the limiter only on `POST /api/admin/auth/login` — NOT on `/logout` or `/me`. Mounted inside the admin auth router via `router.post('/login', adminLoginRateLimiter, ...)`.
  - [x] Added `rateLimit.test.ts` cases covering the new limiter envelope and the cross-route independence assertion (exhaust `/api/admin/auth/login`, `/api/demo` from same IP still 200).

- [x] Subtask 4: Per-email lockout in `POST /api/admin/auth/login` (AC: 2, 3, 4)
  - [x] In `server/routes/admin/auth.ts` `router.post('/login', ...)`: AFTER Zod validation and `JWT_SECRET` check, BEFORE `adminDao.findByEmail`, check `adminLoginAttemptsDao.isLocked(email, ADMIN_LOGIN_WINDOW_MS, ADMIN_LOGIN_MAX)`. If locked → run `bcrypt.compareSync(password, DUMMY_PASSWORD_HASH)` for timing parity, return 401 `'Invalid credentials'`, do NOT increment counter.
  - [x] On successful credential match AND not-locked: call `adminLoginAttemptsDao.reset(email)` before signing the JWT.
  - [x] On failed credential match (unknown email OR wrong password): call `adminLoginAttemptsDao.recordFailure(email)` using the submitted email value (counts against the submitted address regardless of existence).

- [x] Subtask 5: Tests — admin auth route lockout coverage (AC: 1, 2, 3, 4, 6, 7)
  - [x] Extended `server/routes/admin/auth.test.ts` with a `throttling and lockout (Story 4.7)` sub-describe containing 6 cases: (a) 6th IP-bound attempt → 429; (b) 6th email-bound attempt across IPs → 401 `'Invalid credentials'`; (c) correct password during active lockout → 401 + no cookie; (d) correct password after window elapses → 200 + cookie + counter reset; (e) partial-failure success path → counter deleted; (f) failure counter persists across `createApp()` re-creation (DB closed + same `DB_PATH` reopened).
  - [x] Independence test in `server/middleware/rateLimit.test.ts`: exhaust admin login limiter from one IP, confirm `/api/demo` still 200.
  - [x] Persistence test uses live DAO + `currentDb.close()` + `createIsolatedApp({reuseDbPath})` to simulate restart.

- [x] Subtask 6: Vault + docs (post-implementation)
  - [x] Updated `vault/Code/Admin.md` — added rateLimit middleware row, admin-login-attempts DAO row, Story 4.7 status entry, expanded Auth Flow step 1 with lockout branch + reset-on-success.
  - [x] Updated `vault/Code/Database.md` — added `admin_login_attempts` table + DAO row + lockout policy note.
  - [x] Updated `vault/Planning/Architecture-Key.md` Auth (Phase 3) block — documented per-IP + per-email thresholds, lockout-as-401 no-info-leak rule, timing-parity dummy compare, counter persistence.

- [x] Subtask 7: Verification (all ACs)
  - [x] `npm run typecheck` — passes
  - [x] `npm run test:run` — 418/418 passing (8 admin-auth lockout + 6 DAO + 3 rateLimit additions)
  - [x] `npm run build` — vite + tsc + SEO assets clean
  - [x] `npm run check:client-bundle-secrets` — clean (server-only changes; no client-bundle impact)
  - [x] Manual curl smoke deferred — equivalent surface area is exercised by tests (a)–(f); see Completion Notes for rationale.

### Review Findings

- [x] [Review][Patch] IP limiter counts successful login attempts [server/routes/admin/auth.ts:39]
- [x] [Review][Patch] Expired email-lockout windows keep stale failure counts [server/dao/admin-login-attempts.dao.ts:26]

## Dev Notes

### Source Context

- Story 4.1 review by Codex (cross-model, 2026-05-16) explicitly deferred this work: "[Defer] Login endpoint has no auth-specific throttling or lockout [server/routes/admin/auth.ts:31] — deferred, Story 4.1 notes explicitly call admin login rate limiting out of scope and direct review findings to follow-up work." [Source: `_bmad-output/implementation-artifacts/4-1-admin-authentication-login-session-management.md` Review Findings]
- Story 2.7 established the project's rate-limiting conventions: `express-rate-limit` with `standardHeaders: 'draft-7'`, `legacyHeaders: false`, exact 429 body `{ success: false, message: 'Too many requests' }`, per-route limiter instances (NOT shared singletons). Mirror this exactly. [Source: `server/middleware/rateLimit.ts`, `_bmad-output/implementation-artifacts/2-7-security-hardening-rate-limiting-headers-locale-allowlist.md`]
- Story 4.1 added a timing-equalization dummy hash in `server/routes/admin/auth.ts` (`DUMMY_PASSWORD_HASH`). Lockout-branch responses must run the same dummy comparison so locked-account responses are timing-indistinguishable from wrong-password responses. [Source: `server/routes/admin/auth.ts:11`]

### Current State of Files to Update

- `server/db.ts` — `initSchema` currently creates `demo_requests`, `contacts`, `team_members`, `admin_users`, `audit_requests`. Add `admin_login_attempts` here. [Source: `server/db.ts:23-85`]
- `server/middleware/rateLimit.ts` — has `createFormRateLimiter()` (15 min / 20 max). Add a sibling `createAdminLoginRateLimiter()` (15 min / 5 max). Do NOT modify the form limiter constants. [Source: `server/middleware/rateLimit.ts`]
- `server/routes/admin/auth.ts` — login route handles Zod validation, JWT_SECRET check, lookup, bcrypt compare (with timing equalization), JWT sign, cookie set. Lockout check goes BETWEEN Zod validation and the bcrypt compare. [Source: `server/routes/admin/auth.ts`]
- `server/routes/admin/auth.test.ts` — already has 9 cases. Add 6+ new cases for lockout behavior; reuse the existing `:memory:` + `createApp()` pattern. [Source: `server/routes/admin/auth.test.ts`]
- `server/dao/` — has `admin.dao.ts`, `leads.dao.ts`, `contacts.dao.ts`, `team.dao.ts`, `audit.dao.ts`. Add `admin-login-attempts.dao.ts` following the same factory pattern. [Source: `server/dao/`]

### Architecture Guardrails

- **No new runtime dependencies.** `express-rate-limit` already installed for the form limiters; reuse it.
- **Failure counter store MUST be durable.** No in-memory-only counters (server restart would reset and defeat the lockout). SQLite write per failure is fine — admin login is a low-volume endpoint.
- **No information leak.** Locked-account, unknown-email, and wrong-password ALL return exactly `{ success: false, message: 'Invalid credentials' }` HTTP 401. No different status code, no different message, no different `set-cookie`, no different response timing.
- **Independent limiter instances** per Story 2.7's cross-route independence rule. Use `createAdminLoginRateLimiter()` factory pattern, NOT a shared singleton.
- **Window definition**: a "rolling 15-minute window" — last_failed_at older than 15 min from the current attempt time means the counter resets implicitly on next failed attempt (or use a "reset row if last_failed_at + 15min < now()" DAO helper).
- **Test seeded user**: the existing test pattern in `server/routes/admin/auth.test.ts` seeds bcrypt cost 12 (per Story 4.1 review patch). Keep that.

### Latest Technical Notes

- `express-rate-limit` v8.5 default store is in-memory. That's fine for the IP-bound limiter (per-IP counters reset on restart is acceptable — the durable per-email lockout is the strong defense). Do NOT swap for `rate-limit-redis` or similar; out of scope.
- `better-sqlite3` synchronous writes are fine in the login hot path — login is single-digit per minute in steady state.

### Testing Requirements

- Use `vi.setSystemTime(...)` (Vitest fake timers) to advance "now" past the 15-min window without sleeping. Reset between tests.
- Test the "exhaust then advance time then succeed" sequence end-to-end with a real `createApp()` to catch any mismatch between the DAO's window read and the route's enforcement.
- Cross-route independence: re-use the Story 2.7 pattern that exhausts `/api/demo` from one IP and then verifies `/api/contact` from the same IP still succeeds. Add an analogous test for `/api/admin/auth/login` vs `/api/demo`.

### Project Structure Notes

Expected write surface:

```
server/
  db.ts                                  ← UPDATE: add admin_login_attempts to initSchema
  dao/admin-login-attempts.dao.ts        ← NEW
  dao/admin-login-attempts.dao.test.ts   ← NEW
  middleware/rateLimit.ts                ← UPDATE: add createAdminLoginRateLimiter
  middleware/rateLimit.test.ts           ← UPDATE: cover the new limiter
  routes/admin/auth.ts                   ← UPDATE: lockout check + recordFailure / reset
  routes/admin/auth.test.ts              ← UPDATE: 6+ new lockout cases

vault/
  Code/Admin.md                          ← UPDATE
  Code/Database.md                       ← UPDATE
  Planning/Architecture-Key.md           ← UPDATE
```

### References

- [Source: `_bmad-output/implementation-artifacts/4-1-admin-authentication-login-session-management.md`] — Story 4.1 review findings (deferred entry #1)
- [Source: `server/routes/admin/auth.ts`] — current login route + dummy hash timing equalization
- [Source: `server/middleware/rateLimit.ts`] — existing form rate limiter pattern
- [Source: `server/db.ts:23-85`] — `initSchema` definition
- [Source: `_bmad-output/implementation-artifacts/2-7-security-hardening-rate-limiting-headers-locale-allowlist.md`] — rate-limit conventions + cross-route independence

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context), CLI (Claude Code).

### Debug Log References

- `npm run typecheck` — clean
- `npm run test:run -- server/dao/admin-login-attempts.dao.test.ts server/middleware/rateLimit.test.ts server/routes/admin/auth.test.ts` — 32/32 passing after review fixes
- `npm run test:run` — 422/422 (added review regression coverage for failed-only IP limiting + expired email-window restart)
- `npm run build` — vite + SEO clean
- `npm run check:client-bundle-secrets` — clean

### Completion Notes List

- Schema added under `CREATE TABLE IF NOT EXISTS admin_login_attempts (...)` so prod upgrades cleanly without manual migration step.
- DAO uses `INSERT ... ON CONFLICT(email) DO UPDATE` to keep `recordFailure` a single statement; `last_failed_at` formatted as `YYYY-MM-DD HH:MM:SS` UTC to match SQLite's `datetime('now')` output exactly (DAO accepts `now?: Date` injection for deterministic test windows).
- Per-IP limiter is mounted via `router.post('/login', adminLoginRateLimiter, ...)` — limiter store is per-instance (independent from form limiters), instance is created at module load time so test re-creation via `createApp()` gives each test a fresh counter (verified by 418-test suite).
- Review fix: admin login IP limiter now uses `skipSuccessfulRequests: true`, so repeated successful operator logins do not consume the failed-attempt quota; regression coverage exists in both limiter and route tests.
- Review fix: `recordFailure(email, now, windowMs)` restarts the per-email counter at 1 when the previous `last_failed_at` is outside the lockout window; regression coverage catches stale-count relock after expiry.
- Test harness fix: `server/test-utils/request.ts` now emits `finish` from the in-process response helper so middleware that observes response completion behaves like it does under Node's real HTTP server.
- Lockout branch runs `bcrypt.compareSync(password, DUMMY_PASSWORD_HASH)` to keep response timing indistinguishable from the wrong-password branch (per AC2/AC3 and Story 4.1's timing-equalization invariant). Body, status, and `set-cookie` absence are all identical across locked / unknown-email / wrong-password responses.
- Failure counter persists across server restart: persistence test closes the current `Database` handle, then calls `createIsolatedApp({reuseDbPath})` to re-import the module graph against the same `DB_PATH`, then asserts that a correct-password attempt is still rejected as locked.
- Manual curl smoke (AC7-h) deferred: the automated suite exercises the equivalent surfaces — IP-bound 429 (test a), per-email 401 across distinct IPs (test b), correct-during-lockout 401 (test c) — and runs against the same Express app via `createApp()`. Story-template manual step kept for the operator-handover smoke at release time.

### File List

**New:**
- `server/dao/admin-login-attempts.dao.ts`
- `server/dao/admin-login-attempts.dao.test.ts`

**Modified:**
- `server/db.ts` — added `admin_login_attempts` table + rationale comment in `initSchema`
- `server/middleware/rateLimit.ts` — added `ADMIN_LOGIN_WINDOW_MS`, `ADMIN_LOGIN_MAX`, `createAdminLoginRateLimiter`; review fix excludes successful responses from the failed-attempt quota
- `server/middleware/rateLimit.test.ts` — added admin login limiter cases + cross-route independence test + successful-login non-counting regression
- `server/routes/admin/auth.ts` — mounted per-IP limiter on `/login`; added per-email lockout check + recordFailure / reset; review fix passes lockout window to stale-counter reset path
- `server/routes/admin/auth.test.ts` — added `throttling and lockout (Story 4.7)` describe block with 8 cases; refactored `createIsolatedApp` to accept `reuseDbPath` + `seedAdmin` opts for the persistence-across-restart test
- `server/test-utils/request.ts` — emits response `finish` event for middleware completion hooks in in-process tests
- `vault/Code/Admin.md` — added rateLimit middleware row, admin-login-attempts DAO row, Story 4.7 status row, expanded Auth Flow step 1
- `vault/Code/Database.md` — added `admin_login_attempts` table + DAO row + lockout policy note
- `vault/Planning/Architecture-Key.md` — Auth (Phase 3) block updated with throttling/lockout details
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story 4.7 → in-progress → review
- `_bmad-output/implementation-artifacts/4-7-admin-login-throttling-lockout.md` — task checkboxes, File List, Change Log, status

### Change Log

| Date | Change |
|---|---|
| 2026-05-16 | Story 4.7 implemented: per-IP admin-login rate limit (5/15min) + durable per-email lockout (5/15min via `admin_login_attempts` table). 401 `Invalid credentials` envelope reused on lockout for no-info-leak; timing-equalized via dummy bcrypt compare. 15 new tests added; full suite green (418/418). Status → review. |
| 2026-05-16 | Review fixes applied: IP limiter now counts failed responses only, stale per-email windows restart at count 1 on the next failure, and response test helper emits `finish` for middleware completion hooks. Added regression coverage; full suite green (422/422). Status → done. |
