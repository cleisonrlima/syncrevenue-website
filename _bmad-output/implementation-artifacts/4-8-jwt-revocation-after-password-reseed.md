# Story 4.8: JWT Revocation via Token Versioning (Story 4.1 Review Follow-up)

Status: done

<!-- Created 2026-05-16 from Story 4.1 cross-model review (Codex). Deferred review finding #2. Parent Jira: SYN-166. Subtasks: SYN-174..181. -->

## Story

As a Sync Sirius operator,
I want existing admin JWTs to be invalidated immediately when an admin's password is reseeded or the account is removed,
So that a leaked or compromised token cannot continue to access the admin panel after credential rotation.

## Background

Story 4.1 review (Codex, 2026-05-16) flagged: "Existing JWTs are not revoked after password reseed or account removal [server/middleware/auth.ts:37] — deferred, current schema has no disabled/token-version/password-changed field; handle as a future admin security hardening story."

Today, the only mechanism that invalidates an admin JWT is the 8-hour `exp` claim. If `npm run db:seed` rotates the password (e.g., suspected compromise), any token already minted under the OLD password remains valid for up to 8 hours. Same problem if an admin row is deleted: outstanding tokens still pass `requireAdmin`.

The fix is a per-admin `token_version` counter included in the JWT payload and checked by `requireAdmin` against `admin_users.token_version`. Rotating the password bumps the counter; old tokens fail the version check on the very next request.

## Acceptance Criteria

1. **Given** the `admin_users` table is migrated, **when** the schema is inspected, **then** a new column `token_version INTEGER NOT NULL DEFAULT 0` exists on `admin_users`; existing rows backfill to `0` automatically via the `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ... ADD COLUMN ... DEFAULT 0` migration; the column is non-nullable.

2. **Given** `npm run db:seed` is run with the same email and a NEW password (different bcrypt hash), **when** the upsert fires, **then** `admin_users.token_version` for that row increments by 1; the password hash is replaced as before; the seed action is reported as `updated` per Story 4.1's existing seed return value.

3. **Given** `npm run db:seed` is run with the same email and the SAME password (re-running for idempotency), **when** the upsert fires, **then** `admin_users.token_version` ALSO increments by 1 (simpler contract: any seed upsert revokes outstanding tokens). Document this trade-off inline so re-running the seed against the live prod DB is understood to log out all active admins. Acceptable for Phase 3 (single admin, low frequency).

4. **Given** a JWT is signed during `POST /api/admin/auth/login`, **when** the token payload is inspected, **then** it includes `{ adminId, email, tokenVersion }` (with `tokenVersion` matching the row's current `token_version`) plus `iat` and `exp` set by `jsonwebtoken`.

5. **Given** an admin presents a JWT to any `/api/admin/*` route protected by `requireAdmin`, **when** the middleware verifies the cookie, **then** it (a) verifies signature + expiry via `jwt.verify` (existing behavior), (b) loads `admin_users` by `payload.adminId`, (c) returns HTTP 401 `{ success: false, message: 'Unauthorized' }` if the row is missing OR `payload.tokenVersion !== row.token_version`, (d) attaches `req.admin = { adminId, email }` ONLY on the success path. No middleware-level caching across requests — every request re-reads the row.

6. **Given** an admin row is DELETED from `admin_users` (e.g., manually via SQLite CLI for offboarding), **when** that admin's previously-issued JWT is presented to a protected route, **then** `requireAdmin` returns HTTP 401 within the same request. No orphaned access.

7. **Given** an admin reseeds their own password and then logs in again, **when** they hit `/api/admin/auth/me`, **then** the freshly-issued JWT (with the bumped `tokenVersion`) succeeds with 200 + their session data. No regression to the happy path.

8. **Given** unit tests run, **when** `npm run test:run` executes, **then** new tests cover: (a) seed of new password bumps `token_version`; (b) seed of same password also bumps `token_version`; (c) JWT signed before reseed → `requireAdmin` returns 401 after reseed; (d) JWT signed after reseed → 200; (e) deleted admin row → 401; (f) `GET /api/admin/auth/me` round-trip still works post-reseed when re-logged-in; (g) the Story 4.1 happy-path login + `/me` test stays green.

9. **Given** all verification commands run, **when** `npm run typecheck && npm run test:run && npm run build && npm run check:client-bundle-secrets` execute, **then** all four pass.

## Tasks / Subtasks

- [x] Subtask 1: Schema migration — add `token_version` column (AC: 1)
  - [x] In `server/db.ts` `initSchema`, after the `CREATE TABLE IF NOT EXISTS admin_users (...)` statement, run a defensive `ALTER TABLE admin_users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0` wrapped in a try/catch (SQLite throws `duplicate column name` if the column already exists; swallow that specific error and rethrow others). Document inline why the try/catch is required (SQLite has no `ADD COLUMN IF NOT EXISTS`).
  - [x] Update the `CREATE TABLE` statement itself to include `token_version` for fresh DBs so the column exists from row 1.

- [x] Subtask 2: DAO — `AdminUserRow` type + DAO methods (AC: 1, 2, 3, 7)
  - [x] Extend `AdminUserRow` in `server/dao/admin.dao.ts` to include `token_version: number`.
  - [x] Add `incrementTokenVersion(email: string): AdminUserRow` method that runs `UPDATE admin_users SET token_version = token_version + 1 WHERE email = ?` and returns the new row.
  - [x] Update `upsert` to call `incrementTokenVersion` whenever the row already exists (and whenever the row is freshly inserted, leave `token_version = 0` as the default — first-time seed should NOT pre-bump).
  - [x] Extend `admin.dao.test.ts` with token_version coverage: insert → 0; upsert existing → +1; multiple upserts → +N.

- [x] Subtask 3: Login route — embed `tokenVersion` in JWT (AC: 4, 7)
  - [x] In `server/routes/admin/auth.ts` `router.post('/login', ...)`, change `jwt.sign({ adminId: user.id, email: user.email }, secret, { expiresIn: '8h' })` to `jwt.sign({ adminId: user.id, email: user.email, tokenVersion: user.token_version }, secret, { expiresIn: '8h' })`.
  - [x] No other route changes here — `/logout` and `/me` do not need updates beyond what middleware does.

- [x] Subtask 4: Middleware — enforce `tokenVersion` match (AC: 5, 6)
  - [x] In `server/middleware/auth.ts`, extend `AdminTokenPayload` to include `tokenVersion?: number` (optional in the type for migration safety, REQUIRED in runtime check).
  - [x] In `requireAdmin`, after `jwt.verify` succeeds and the payload shape check passes, look up `adminDao.findById(payload.adminId)`. If undefined OR `payload.tokenVersion !== row.token_version` (use strict `!==`, treat missing payload `tokenVersion` as `undefined !== <number>` → 401) → call `unauthorized(res)` and return.
  - [x] Attach `req.admin = { adminId, email }` (do NOT leak `tokenVersion` onto the request).
  - [x] Update `server/middleware/auth.test.ts` to import `createAdminDao` and pre-seed an admin row, build a fresh app per test, and cover: (a) valid token + matching version → 200; (b) valid token + stale version → 401; (c) valid token + deleted admin row → 401.

- [x] Subtask 5: Seed script — verify token_version bump (AC: 2, 3)
  - [x] No code change in `server/db.seed.ts` itself — `adminDao.upsert` is the only call path, and Subtask 2 already wires the bump there.
  - [x] Extend `server/db.seed.test.ts` to assert `token_version` starts at 0 on `created`, then becomes 1 / 2 on subsequent `updated` runs.

- [x] Subtask 6: Route test updates (AC: 7, 8)
  - [x] In `server/routes/admin/auth.test.ts`, add cases (c)–(f) from AC8. The "JWT signed before reseed → 401 after reseed" test should: log in normally, capture the cookie, call `adminDao.upsert` directly (or run the seed function) to bump version, then re-issue the protected request with the OLD cookie and expect 401.
  - [x] Update the existing happy-path login + `/me` round-trip test to assert the JWT payload includes `tokenVersion: 0` for a freshly-seeded admin (decode token in the test, do not rely on opacity).

- [x] Subtask 7: Vault + docs (post-implementation)
  - [x] Update `vault/Code/Admin.md` — add `token_version` to the schema row + document the revocation flow.
  - [x] Update `vault/Code/Database.md` — update `admin_users` table definition row.
  - [x] Update `vault/Planning/Architecture-Key.md` Auth (Phase 3) block — document the `tokenVersion` claim + the "seed bump revokes all outstanding tokens" rule + the trade-off (same-password re-seed also revokes).

- [x] Subtask 8: Verification (all ACs)
  - [x] `npm run typecheck`
  - [x] `npm run test:run` — full suite green
  - [x] `npm run build`
  - [x] `npm run check:client-bundle-secrets`
  - [ ] Manual: `npm run db:seed`, log in via `npm run dev` UI, then in another shell re-run `npm run db:seed` with the same email + new password; refresh the admin dashboard, confirm the redirect to `/admin/login` fires within one request cycle. **(Pending end-user verification — agent cannot drive a browser session. Equivalent scenario IS covered automatically: `server/routes/admin/auth.test.ts` "rejects pre-reseed cookie after admin password is reseeded" — login, capture cookie, `adminDao.upsert` to bump, hit `/api/admin/auth/me` with old cookie, expect 401.)**

### Review Findings

<!-- Populated by the reviewer after cross-model code review. Leave empty until then. -->

## Dev Notes

### Source Context

- Story 4.1 review by Codex (2026-05-16): "Existing JWTs are not revoked after password reseed or account removal [server/middleware/auth.ts:37]" — deferred to this story. [Source: `_bmad-output/implementation-artifacts/4-1-admin-authentication-login-session-management.md` Review Findings]
- Architecture decision (Story 4.1): JWT payload was scoped to `{ adminId, email }` only — "No roles needed (single admin user type)". This story extends the payload by ONE field (`tokenVersion`). No role / permission machinery added. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- The `requireAdmin` middleware today validates signature + expiry + payload shape. It does NOT read the DB on each request. This story adds the DB read so token freshness can be enforced. [Source: `server/middleware/auth.ts`]

### Current State of Files to Update

- `server/db.ts` — `admin_users` table currently has `(id, email, password_hash, created_at)`. Add `token_version INTEGER NOT NULL DEFAULT 0`. Use `ALTER TABLE` for the migration path on existing DBs. [Source: `server/db.ts:66-71`]
- `server/dao/admin.dao.ts` — exports `AdminUserRow`, `findByEmail`, `findById`, `create`, `upsert`. Extend the row type + `upsert` semantics; add `incrementTokenVersion`. [Source: `server/dao/admin.dao.ts`]
- `server/routes/admin/auth.ts` — login route signs JWT with `{ adminId, email }`. Add `tokenVersion`. [Source: `server/routes/admin/auth.ts:60`]
- `server/middleware/auth.ts` — `requireAdmin` does NOT load admin from DB. Add the DB load + version check. [Source: `server/middleware/auth.ts:23-47`]
- `server/db.seed.ts` — `seedAdminUser` calls `adminDao.upsert`. No direct change here; the bump rides on the DAO contract. [Source: `server/db.seed.ts`]

### Architecture Guardrails

- **No new runtime dependencies.**
- **DB read per protected request is acceptable** — admin traffic is single-digit RPS at most. Do NOT add Redis or in-memory caching for the row lookup (out of scope and adds invalidation complexity). Re-evaluate only if profiling proves a bottleneck.
- **`req.admin` shape MUST NOT change**: stays `{ adminId: number, email: string }` (no `tokenVersion` leakage onto the request object). Downstream routes already depend on this shape.
- **Migration safety**: rows existing before this story will be backfilled to `token_version = 0` by the `DEFAULT 0` clause. Any JWT minted before the migration was signed WITHOUT a `tokenVersion` claim — those tokens will fail the strict `!==` check (undefined !== 0) and force a re-login. This is desired behavior for a security hardening migration.
- **Same-password re-seed bumps version**: documented trade-off in AC3. Simpler contract beats "only bump on actual password change" detection (which requires comparing the hash before write — adds complexity and a timing channel via existence detection).

### Latest Technical Notes

- `jsonwebtoken.sign` accepts arbitrary JSON-serializable payloads. Adding one numeric field has no perf implication on signing or verification cost.
- SQLite has no `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. The standard pattern is `try { ALTER TABLE ... ADD COLUMN ... } catch (err) { if (!/duplicate column/.test(err.message)) throw err }`. Better-sqlite3 throws `SqliteError: duplicate column name: token_version`.

### Testing Requirements

- Decode the JWT in tests using `jwt.decode(token)` (no verification needed) to assert the `tokenVersion` claim is present and matches the row.
- Use the existing `:memory:` Database + `createApp()` pattern from `server/routes/admin/auth.test.ts`. Bump version mid-test by calling `adminDao.upsert({ email, password_hash })` (same email).
- Cover both `requireAdmin` middleware-level tests AND integration tests through a protected route (e.g., `/api/admin/auth/me`) so both surfaces are exercised.

### Project Structure Notes

Expected write surface:

```
server/
  db.ts                              ← UPDATE: ALTER TABLE add column + CREATE updates
  dao/admin.dao.ts                   ← UPDATE: AdminUserRow + incrementTokenVersion + upsert bump
  dao/admin.dao.test.ts              ← UPDATE: cover token_version transitions
  routes/admin/auth.ts               ← UPDATE: include tokenVersion in jwt.sign payload
  routes/admin/auth.test.ts          ← UPDATE: stale-cookie-after-reseed test + decode payload check
  middleware/auth.ts                 ← UPDATE: load admin + check tokenVersion match
  middleware/auth.test.ts            ← UPDATE: stale + deleted-row cases
  db.seed.test.ts                    ← UPDATE: token_version bump assertions

vault/
  Code/Admin.md                      ← UPDATE
  Code/Database.md                   ← UPDATE
  Planning/Architecture-Key.md       ← UPDATE
```

### References

- [Source: `_bmad-output/implementation-artifacts/4-1-admin-authentication-login-session-management.md`] — Story 4.1 review findings (deferred entry #2)
- [Source: `server/middleware/auth.ts`] — current `requireAdmin` implementation
- [Source: `server/dao/admin.dao.ts`] — current DAO contract
- [Source: `server/db.ts:66-71`] — `admin_users` table definition
- [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`] — JWT payload decision

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — caveman mode active per project CLAUDE.md (chat only; code/docs in normal prose).

### Debug Log References

- Initial `npm run test:run` after middleware change: 1 regression in `server/index.test.ts` "admin auth /me requires and reads a valid admin cookie" (a synthetic token for `adminId: 7` no longer passes because the middleware now requires a matching DB row). Fixed by seeding a real admin row via `adminDao.create` in the test and signing the token with that row's `id`/`token_version`. Re-run: 440 / 440 passing across 68 files.
- `npm run typecheck`: clean.
- `npm run build`: clean (2.57s, no chunks affected).
- `npm run check:client-bundle-secrets`: pass.

### Completion Notes List

- Schema: `admin_users.token_version INTEGER NOT NULL DEFAULT 0` added both in the `CREATE TABLE` (fresh DBs) and via a defensive `ALTER TABLE` (existing DBs). The `ALTER` swallows only the SQLite `duplicate column name: token_version` error and rethrows anything else — same idempotent-migration pattern that the rest of the codebase will need for future ALTERs.
- DAO contract: `AdminUserRow` now carries `token_version`. `upsert` increments the counter only when the row already exists (first-time insert keeps `token_version = 0`). Added `incrementTokenVersion(email)` (used by the upsert path and exposed for tests) and `deleteByEmail(email)` (used by the middleware deleted-row test). Same-password re-seed also bumps — explicitly per AC3.
- Login route: `jwt.sign` payload extended with `tokenVersion: user.token_version`. No other route changes; `/logout` and `/me` flow through the upgraded middleware.
- Middleware: refactored to a factory `createRequireAdmin(dao)` so tests can inject an isolated DAO bound to a `:memory:` DB. The exported `requireAdmin` is still the singleton bound to the default app DAO — no call-site change in `server/routes/admin/auth.ts` or elsewhere. Per request: `jwt.verify` → payload shape check → `dao.findById(adminId)` → strict `payload.tokenVersion === row.token_version` → set `req.admin = { adminId, email }`. `tokenVersion` is intentionally NOT placed on `req.admin` (no downstream leak).
- Seed: `server/db.seed.ts` unchanged — the bump rides on the DAO contract. New test cases assert the transition `created → 0`, then `updated → 1, 2, ...` for both new-password and same-password reseeds.
- Tests added/updated: `server/dao/admin.dao.test.ts` (token_version transitions + delete), `server/middleware/auth.test.ts` (rewritten to use the DAO factory, covers stale/deleted/legacy/match cases), `server/routes/admin/auth.test.ts` (new `JWT revocation (Story 4.8)` describe block: stale-cookie-after-reseed, post-reseed re-login, deleted row, legacy no-claim token; happy-path test now decodes the JWT and asserts `tokenVersion: 0`), `server/db.seed.test.ts` (3 new cases), `server/index.test.ts` (admin `/me` cookie test re-seeds a real row).
- Backward compat: tokens minted before this migration carry no `tokenVersion` claim and fail the strict `!==` check (`undefined !== 0`), forcing a re-login. This is the desired security-hardening behavior — see AC1 / Dev Notes.
- Manual UI verification (the final manual checkbox under Subtask 8) is left unchecked: the equivalent end-to-end scenario IS covered automatically in `server/routes/admin/auth.test.ts` ("rejects pre-reseed cookie after admin password is reseeded"). The agent cannot drive a browser; the end-user can run the documented manual flow against `npm run dev` if they want a UI-level double-check before merging.

### File List

Modified:
- `server/db.ts`
- `server/dao/admin.dao.ts`
- `server/dao/admin.dao.test.ts`
- `server/routes/admin/auth.ts`
- `server/routes/admin/auth.test.ts`
- `server/middleware/auth.ts`
- `server/middleware/auth.test.ts`
- `server/db.seed.test.ts`
- `server/index.test.ts`
- `vault/Code/Admin.md`
- `vault/Code/Database.md`
- `vault/Planning/Architecture-Key.md`
- `vault/Planning/Epics-Index.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/4-8-jwt-revocation-after-password-reseed.md` (this file)

Created: none.
Deleted: none.

### Change Log

| Date | Change |
|---|---|
| 2026-05-17 | Implemented Story 4.8 — `token_version` migration, DAO bump on upsert, JWT payload claim, middleware enforcement; 13 new/updated tests across 5 files; vault + sprint-status updated; status → review. |
