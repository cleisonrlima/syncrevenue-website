# Story 5.7: PM2 Cluster Mode & Multi-Core Production Optimization

Status: ready-for-dev

<!-- Created 2026-05-19 as non-trivial finding from Story 5.1 code review. Epic 5 (Production Deployment). Jira: deferred (OAuth required). -->

## Story

As a Sync Sirius operator,
I want to understand and optionally enable PM2 cluster mode on a multi-core VPS,
so that the Express server can utilize all available CPU cores and maximize throughput.

## Acceptance Criteria

1. **Given** the project architecture documentation, **when** the decision to adopt cluster mode is evaluated, **then** an ADR (Architecture Decision Record) is written and committed to `vault/Planning/Architecture-Key.md` documenting: (a) fork vs cluster mode trade-offs, (b) SQLite concurrent-write safety under cluster (WAL mode analysis), (c) JWT session statefulness implications, (d) the chosen stance (opt-in or always-on).

2. **Given** the Express app uses SQLite via `better-sqlite3`, **when** cluster mode activates multiple workers, **then** the SQLite WAL (Write-Ahead Logging) mode behavior under concurrent writers is verified: either WAL mode is confirmed safe for this workload, or a serialization layer / single-writer pattern is documented as required.

3. **Given** the decision from AC 1 is "opt-in cluster mode", **when** the operator wants to enable it, **then** `ecosystem.config.js` includes clear commented-out fields (`exec_mode: 'cluster'`, `instances: 'max'`) that can be uncommented, with an inline warning about the SQLite write-safety requirement.

4. **Given** the decision from AC 1 is "always-on cluster mode", **when** `pm2 start ecosystem.config.js` is run on a multi-core host, **then** PM2 spawns `os.cpus().length` worker processes; all workers share the same TCP port via Node.js cluster; a basic load test (`autocannon` or `wrk`) confirms requests are distributed across workers.

5. **Given** cluster mode is adopted (AC 4), **when** SQLite write operations are performed under concurrent load, **then** `better-sqlite3` WAL mode is enabled (`PRAGMA journal_mode=WAL`) in `server/db.ts`; integration tests confirm no SQLITE_BUSY errors under simulated concurrent writes.

6. **Given** either stance is taken, **when** all changes are committed, **then** `npm run test:run` passes (732+ tests); `tsc --noEmit` exits 0; the ADR entry in `vault/Planning/Architecture-Key.md` is present.

## Tasks / Subtasks

- [ ] Task 1 — Audit Express app for cluster safety (AC: 1, 2)
  - [ ] Review all in-process shared state (in-memory caches, module-level singletons)
  - [ ] Confirm JWT is stateless (cookie-based, no server-side session store)
  - [ ] Review `server/db.ts` — check if WAL mode is already enabled; document current journal mode
  - [ ] Document findings in ADR draft

- [ ] Task 2 — Write ADR and choose stance (AC: 1)
  - [ ] Write ADR entry under `## Cluster Mode Decision` in `vault/Planning/Architecture-Key.md`
  - [ ] Cover: fork vs cluster, SQLite WAL under concurrent workers, stateless JWT confirmation, chosen stance

- [ ] Task 3 — Update `ecosystem.config.js` (AC: 3 or 4)
  - [ ] If opt-in: add commented-out `exec_mode: 'cluster'` + `instances: 'max'` with SQLite warning
  - [ ] If always-on: set `exec_mode: 'cluster'`, `instances: 'max'`; add WAL pragma to `server/db.ts`

- [ ] Task 4 — SQLite WAL mode (AC: 5) — only if cluster mode is adopted
  - [ ] Enable `PRAGMA journal_mode=WAL` in `server/db.ts` initialization block
  - [ ] Add integration test: simulate concurrent writes and assert no SQLITE_BUSY

- [ ] Task 5 — Verify tests and TypeScript (AC: 6)
  - [ ] Run `npm run test:run` — all tests green
  - [ ] Run `tsc --noEmit` — zero errors

## Dev Notes

### Background

The current `ecosystem.config.js` runs in PM2's default `fork` mode (single Node.js process). On a multi-core VPS, this leaves CPU cores idle. PM2 cluster mode uses the Node.js `cluster` module to spawn one worker per core, all listening on the same port.

**Key risk**: SQLite with `better-sqlite3` is synchronous and not designed for multi-process concurrent writes. Under cluster mode, multiple workers could issue concurrent writes to the same SQLite file. While SQLite's WAL mode handles concurrent reads well, concurrent writers from separate processes can produce `SQLITE_BUSY` errors without proper retry logic.

**Reference**: Story 5.1 review finding — `ecosystem.config.js` comment added: `// exec_mode defaults to 'fork' (single process). Switch to exec_mode: 'cluster', instances: 'max' for multi-core CPUs.`

### Relevant Files

- `ecosystem.config.js` — PM2 process config to update
- `server/db.ts` — SQLite database initialization; WAL mode pragma goes here
- `vault/Planning/Architecture-Key.md` — ADR entry destination

### Decision Guidance

If SQLite WAL mode is confirmed safe for the expected write volume (low-volume admin + form submissions), cluster mode is safe to adopt. If write volume is high or WAL safety cannot be confirmed, document the opt-in approach and defer full adoption to when a database migration (PostgreSQL) is considered.

## Dev Agent Record

_To be filled by the implementing agent._
