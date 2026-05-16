# Story 4.7: Admin Login Throttling & Account Lockout (Story 4.1 Review Follow-up)

Status: ready-for-dev

<!-- Created 2026-05-16 from Story 4.1 cross-model review (Codex). Deferred review finding #1. Parent Jira: TBD (created on next sync). -->

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

- [ ] Subtask 1: Schema — `admin_login_attempts` table (AC: 5)
  - [ ] Add `admin_login_attempts (email TEXT PRIMARY KEY, failed_count INTEGER NOT NULL DEFAULT 0, last_failed_at TEXT NOT NULL DEFAULT (datetime('now')))` to `server/db.ts` `initSchema`. Keep `CREATE TABLE IF NOT EXISTS` so existing prod DB upgrades cleanly without manual migration.
  - [ ] Add 2-line comment in `db.ts` explaining the rationale for separate table vs columns on `admin_users` (separation of credential store from security counters; easier to clear without touching credential rows).

- [ ] Subtask 2: DAO — `admin-login-attempts.dao.ts` (AC: 2, 3, 4, 5)
  - [ ] Create `server/dao/admin-login-attempts.dao.ts` with `createAdminLoginAttemptsDao(db)` factory matching the existing DAO pattern (`leads.dao.ts`, `admin.dao.ts`).
  - [ ] Methods: `getByEmail(email)`, `recordFailure(email)` (increments + bumps `last_failed_at = datetime('now')`), `reset(email)` (delete row OR set count=0), `isLocked(email, windowMs, threshold)` (read row, check count ≥ threshold AND last_failed_at within window).
  - [ ] Co-located `admin-login-attempts.dao.test.ts` covering all branches with `:memory:` DB.

- [ ] Subtask 3: Per-IP rate limiter for admin login (AC: 1, 6)
  - [ ] In `server/middleware/rateLimit.ts` add `createAdminLoginRateLimiter()` factory (separate from `createFormRateLimiter`). Constants: `ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000`, `ADMIN_LOGIN_MAX = 5`. `standardHeaders: 'draft-7'`, `legacyHeaders: false`. Custom handler returns exactly `{ success: false, message: 'Too many requests' }`.
  - [ ] Mount the limiter only on `POST /api/admin/auth/login` — NOT on `/logout` or `/me`. Mount it inside the admin auth router (not at app level) so the existing form limiters and admin path mounts stay untouched.
  - [ ] Add limiter test that confirms the demo + contact form limiters are still independent (cross-route exhaustion test).

- [ ] Subtask 4: Per-email lockout in `POST /api/admin/auth/login` (AC: 2, 3, 4)
  - [ ] In `server/routes/admin/auth.ts` `router.post('/login', ...)`: BEFORE calling `bcrypt.compareSync`, check `adminLoginAttemptsDao.isLocked(email, 15 * 60 * 1000, 5)`. If locked → respond HTTP 401 `'Invalid credentials'` (still run a `bcrypt.compareSync` against the existing `DUMMY_PASSWORD_HASH` from Story 4.1's review patch to keep response timing constant). Do NOT count locked-attempt rejections as additional failures (avoids permanent lockout via continued knocking).
  - [ ] On successful credential match AND not-locked: call `adminLoginAttemptsDao.reset(email)` atomically before issuing the JWT.
  - [ ] On failed credential match (unknown email OR wrong password): call `adminLoginAttemptsDao.recordFailure(email)`. Use the submitted email value for unknown-email counters too (so credential-stuffing against many real emails counts against each one).

- [ ] Subtask 5: Tests — admin auth route lockout coverage (AC: 1, 2, 3, 4, 6, 7)
  - [ ] Extend `server/routes/admin/auth.test.ts` with cases (a)–(f) from AC7. Use `vi.useFakeTimers()` or pass an explicit "now" injection to advance time past the 15-min window without `setTimeout` waits.
  - [ ] Independence test: exhaust `/api/admin/auth/login` from one IP, confirm `/api/demo` from the same IP still accepts a first valid request (mirror the Story 2.7 cross-route independence test pattern).
  - [ ] Persistence-across-restart test: pre-populate `admin_login_attempts` row with `failed_count = 5` and a recent `last_failed_at`, re-create the Express app via `createApp()`, confirm the next failed attempt is treated as locked.

- [ ] Subtask 6: Vault + docs (post-implementation)
  - [ ] Update `vault/Code/Admin.md` to list the new DAO, middleware factory, and schema table.
  - [ ] Update `vault/Code/Database.md` with the new `admin_login_attempts` table row.
  - [ ] Update `vault/Planning/Architecture-Key.md` Auth (Phase 3) block: document the 5-attempt/15-min thresholds and the "lockout returns same generic 401" no-info-leak rule.

- [ ] Subtask 7: Verification (all ACs)
  - [ ] `npm run typecheck`
  - [ ] `npm run test:run` — full suite green
  - [ ] `npm run build`
  - [ ] `npm run check:client-bundle-secrets`
  - [ ] Manual: `npm run dev`, fire 6 wrong-password attempts at the seeded admin from one IP via curl, confirm the 6th returns 429; then from a different IP try the same email password 6 times, confirm 401 stays (no leak).

### Review Findings

<!-- Populated by the reviewer after cross-model code review. Leave empty until then. -->

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

<!-- To be filled by the dev agent on implementation. -->

### Debug Log References

### Completion Notes List

### File List

### Change Log
