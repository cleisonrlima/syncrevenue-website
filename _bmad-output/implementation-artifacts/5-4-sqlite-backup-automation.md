# Story 5.4: SQLite Backup Automation

## Story

**As a** Sync Sirius operator,
**I want** the SQLite database backed up automatically on a schedule,
**So that** lead data is not permanently lost if the server fails or the DB file is corrupted.

**Epic:** 5 — Production Deployment (Phase 4)
**Depends on:** Story 5.1 (Production Build + PM2 Process Management)
**Status:** done
**Review Status:** done

---

## Acceptance Criteria

**AC 1:** Backup script runs (e.g., daily at 2am) → copies `sync_sirius.db` to a timestamped file in a backup directory outside `dist/`.

**AC 2:** Backups older than 30 days are deleted automatically; at least 30 daily backups are retained.

**AC 3:** The backup directory is NOT publicly accessible via HTTP; it sits outside the web root (`dist/client/`).

**AC 4:** Backup failure → error is logged to stderr; the production PM2 server process continues — backup failure does not affect site availability.

---

## Tasks / Subtasks

- [x] **Task 1 (AC 1, AC 4): Create `scripts/backup.sh`**
  - [x] Reads `DB_PATH` from environment with fallback to `../data/sync_sirius.db`
  - [x] `BACKUP_DIR` defaults to `../backups` (outside `dist/` and outside web root)
  - [x] Timestamp format: `sync_sirius_YYYY-MM-DD_HH-MM-SS.db`
  - [x] On success: prints `[backup] Created: <path>`
  - [x] On failure: prints `[backup] ERROR: <msg>` to stderr and exits 1
  - [x] Script made executable (`chmod +x`)

- [x] **Task 2 (AC 2): Retention logic**
  - [x] After backup, deletes files matching `sync_sirius_*.db` in `$BACKUP_DIR` with mtime older than 30 days using `find … -mtime +30 -delete`

- [x] **Task 3 (AC 3): Web root isolation**
  - [x] Backup dir `../backups` is outside `dist/client/` (web root)
  - [x] `backups/` added to `.gitignore`

- [x] **Task 4: npm script and cron documentation**
  - [x] `db:backup` npm script added to `package.json`
  - [x] `docs/backup-cron-setup.md` created with cron job instructions

- [x] **Task 5: Tests (`scripts/backup.test.mjs`)**
  - [x] Test 1: Creates temp DB, runs script, verifies timestamped backup created
  - [x] Test 2: Retention — old files deleted, new backup present
  - [x] Test 3: Missing/nonexistent DB_PATH causes exit code 1 and ERROR on stderr
  - [x] `test:backup` npm script added to `package.json`

---

## Dev Notes

- Stack: Bash script using only system tools (`bash`, `find`, `date`, `cp`). No new npm dependencies.
- The web root is `dist/client/` (served by Express). The backup dir `../backups` resolves to a sibling of the project root when running from `dist/`, or from project root when running directly — both are outside the web root.
- PM2 runs `node dist/server/index.js` as a separate process; cron runs `backup.sh` independently. A cron failure has no impact on the Node process.
- Test harness: Node.js native `assert`, `fs`, `child_process.execSync` — no Vitest, stays outside the main test suite.
- `*.db` is already in `.gitignore` — the `backups/` directory entry prevents accidental git tracking of the backup folder itself.

---

## Dev Agent Record

### Implementation Plan

1. Write `scripts/backup.sh` (bash, AC 1 + 2 + 4).
2. Verify script is executable.
3. Update `.gitignore` with `backups/`.
4. Add `db:backup` and `test:backup` to `package.json`.
5. Write `docs/backup-cron-setup.md`.
6. Write `scripts/backup.test.mjs` (3 test cases).
7. Run `npm run test:backup` and `npm run test:run`.

### Debug Log

_(none)_

### Completion Notes

- `scripts/backup.sh`: reads `DB_PATH` env (fallback `../data/sync_sirius.db`), copies to timestamped file in `$BACKUP_DIR` (`../backups` default), prunes files older than 30 days with `find -mtime +30 -delete`, exits 1 with stderr message on any failure.
- `scripts/backup.test.mjs`: 3 test cases using Node `assert` + `execSync` — happy path, retention cleanup, and error-exit when DB missing.
- `docs/backup-cron-setup.md`: cron line, manual verification, PM2 isolation note.
- No new npm dependencies added. All existing Vitest tests unaffected.

---

## File List

- `_bmad-output/implementation-artifacts/5-4-sqlite-backup-automation.md` (this file)
- `scripts/backup.sh` (new)
- `scripts/backup.test.mjs` (new)
- `docs/backup-cron-setup.md` (new)
- `package.json` (modified — added `db:backup`, `test:backup` scripts)
- `.gitignore` (modified — added `backups/`)

---

---

## Review Findings

**Reviewer:** Cross-model adversarial reviewer (Claude Sonnet 4.6)
**Date:** 2026-05-20
**Outcome:** Approved with one inline patch

### AC Validation

| AC | Status | Evidence |
|----|--------|---------|
| AC 1 — timestamped backup to dir outside `dist/` | Implemented | `scripts/backup.sh` L31-35: BACKUP_DIR defaults to `../backups`; timestamp via `date +%Y-%m-%d_%H-%M-%S` |
| AC 2 — delete >30 days, retain ≥30 | Implemented | `find "$BACKUP_DIR" -name "sync_sirius_*.db" -mtime +30 -delete`. `-mtime +30` = strictly older than 30 days (31+), so 30-day files are retained — semantics correct |
| AC 3 — backup dir outside web root | Implemented | Default `../backups` is a sibling of project root; web root is `dist/client/`. No HTTP exposure. |
| AC 4 — failure → stderr only; PM2 unaffected | Implemented | Script run by cron, not PM2. All errors write to stderr and exit 1. `cp` failure trapped explicitly. |

### Findings

**MEDIUM (patched inline):**

**M1 — `set -euo pipefail` + `find -delete` false-positive failure signal**
- Location: `scripts/backup.sh` line 64 (pre-patch)
- `find -delete` exits non-zero when it encounters a file it cannot delete (e.g., permission denied on a stale backup owned by a different user). With `set -e` active, this aborts the script after the backup itself has already succeeded, causing cron to report a failure and trigger MAILTO alerts incorrectly.
- Fix applied: appended `|| true` to the `find` line. The backup is already written at this point; a retention-pass partial failure is non-critical and must not mask a successful backup.
- Files changed: `scripts/backup.sh`

**LOW (no action):**

**L1 — Cron example uses relative `bash scripts/backup.sh` after `cd`**
- `BASH_SOURCE[0]` resolves correctly to an absolute path even when the script is invoked with a relative path argument (`basename` + `pwd` chain on line 27). Verified by test. No fix needed.

**L2 — No test for `mkdir -p` failure path**
- Covered by `set -e` + explicit error message. Not in AC scope. No fix needed.

### Test Quality

- Test 1 (happy path): real assertion on file count, size, and stdout content. Solid.
- Test 2 (retention): `touch -d "31 days ago"` verified working on this Linux host. Asserts old files gone, new file present. Solid.
- Test 3 (error path): asserts exit code 1 and `[backup] ERROR:` on stderr. Solid.
- All tests use `try/finally` for cleanup — no temp-dir leaks on failure.

### Git vs Story Discrepancies

- `vault/00-Home.md`, `vault/Code/Index.md`, `vault/Planning/Epics-Index.md` changed in the implementation commit but absent from story File List. These are vault protocol updates, not source code — excluded from review per skill rules. No finding.

---

## Change Log

| Date | Change |
|------|--------|
| 2026-05-20 | Story created and implemented — backup script, retention, cron docs, Node test harness |
| 2026-05-20 | Cross-model review: patched `find -delete \|\| true` (M1); all ACs verified; status → done |
