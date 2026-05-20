# Story 5.11: Health DAO Unit Tests

**Epic:** 5 — Production Deployment (Phase 4)
**Status:** backlog
**Origin:** Epic 5 Post-Sprint TEA pass (2026-05-20) — finding G2 (risk score 4)
**Jira sync:** Deferred — OAuth unavailable at creation time. Must be synced before dev begins.

---

## Story

As a backend engineer,
I want `server/dao/health.dao.ts` to have a dedicated unit test file,
So that the DAO's contract (ping returns true, ping throws on closed DB, factory pattern works) is verified in isolation and consistent with every other DAO in the project.

---

## Context

Story 5.5 introduced `server/routes/health.ts` and `server/dao/health.dao.ts`. The route has 4 unit tests in `server/routes/health.test.ts` that cover the DAO indirectly (via the route handler with a mocked DAO for the failure path). However, `server/dao/health.dao.ts` is the only DAO in `server/dao/` without a dedicated `*.test.ts` file:

```
server/dao/
  admin.dao.test.ts          ✓
  admin-login-attempts.dao.test.ts  ✓
  audit.dao.test.ts          ✓
  contacts.dao.test.ts       ✓
  health.dao.ts              ← NO test file
  leads.dao.test.ts          ✓
  team.dao.test.ts           ✓
```

The gap is low-severity (route tests provide indirect coverage) but violates the DAO testing discipline established across the project. A dedicated DAO test:
1. Tests `createHealthDao()` in isolation with a real temp-dir database.
2. Tests `ping()` returns `true` on a healthy DB.
3. Tests `ping()` throws when called on a closed DB — exercising the exact error path the route's `try/catch` handles.
4. Documents the DAO's expected interface for future maintainers.

---

## Acceptance Criteria

### AC 1 — `server/dao/health.dao.test.ts` Exists and Covers Happy Path

- `createHealthDao(database)` called with a fresh `better-sqlite3` instance → `ping()` returns `true`.
- Test uses a temp-dir DB (same pattern as other DAO tests in the project).
- Test cleans up the DB and temp dir in `afterEach` or `afterAll`.

### AC 2 — `ping()` Throws on Closed Database

- `createHealthDao(database)` called with a `Database` instance that has been `close()`d → `ping()` throws.
- The thrown error is not swallowed — the test asserts `expect(() => healthDao.ping()).toThrow()`.
- This test validates the error path that `server/routes/health.ts` catches to return HTTP 503.

### AC 3 — Exported `healthDao` Singleton is a Valid `HealthDao`

- The default-exported `healthDao` singleton (created with `createHealthDao()` using the module-level `db`) is an object with a `ping` method — asserted at import time.
- This is a type-safety smoke test, not a behavior test (the singleton uses the real DB; just confirm the interface).

### AC 4 — All Existing Tests Still Pass

- `npm run test:run` — all Vitest tests pass (no regressions).
- `tsc --noEmit` — zero TypeScript errors.

---

## Tasks / Subtasks

- [ ] Task 1 — Create `server/dao/health.dao.test.ts` (AC: 1, 2, 3)
  - [ ] Add `// @vitest-environment node` header
  - [ ] Implement `createIsolatedDb()` helper using `fs.mkdtempSync` + `new Database(tempPath)` (consistent with other DAO tests)
  - [ ] Test 1: `ping()` returns `true` on open DB (AC 1)
  - [ ] Test 2: `ping()` throws when DB is closed via `.close()` (AC 2)
  - [ ] Test 3: default `healthDao` singleton has `ping` method (AC 3)
  - [ ] `afterEach` cleanup: close DB, remove temp dir

- [ ] Task 2 — Verify all tests pass (AC: 4)
  - [ ] `npm run test:run` — green
  - [ ] `tsc --noEmit` — zero errors

---

## Dev Notes

### Pattern Reference

Follow the pattern in `server/dao/contacts.dao.test.ts` or `server/dao/admin.dao.test.ts` for:
- Temp-dir database creation with `fs.mkdtempSync` and `path.join(os.tmpdir(), 'prefix-')`
- Schema initialization via `initSchema(testDb)`
- Cleanup in `afterEach`

### Closed DB Error

`better-sqlite3` throws `"This database connection is not open"` when `.prepare()` is called on a closed database. The `healthDao.ping()` implementation calls `database.prepare('SELECT 1').get()` — so closing the DB before calling `ping()` will trigger this error path.

```typescript
const db = new Database(tempPath)
initSchema(db)
const dao = createHealthDao(db)
db.close()
expect(() => dao.ping()).toThrow()
```

### File to Create

```
server/dao/health.dao.test.ts   ← NEW
```

No other files should require changes.
