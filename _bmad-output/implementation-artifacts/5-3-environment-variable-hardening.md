# Story 5.3: Environment Variable Hardening

Status: done

<!-- Created 2026-05-19. Epic 5 — Production Deployment. Sprint: SYN Sprint 3 (current sprint). -->

## Story

As a Sync Sirius operator,
I want all production secrets configured securely in the hosting environment,
So that credentials are never exposed in source code, logs, or the client bundle.

## Acceptance Criteria

1. **Given** a production deployment, **when** the server starts, **then** all required env vars are configured via hosting platform secrets or VPS `.env`: `PORT`, `DB_PATH`, `JWT_SECRET` (strong random ≥32 chars), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL`, `ALLOWED_ORIGIN`. The `.env.example` file documents every key with a descriptive comment, including constraints (e.g., the `≥32 chars` requirement for `JWT_SECRET`) and which vars are dev-only seed credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).

2. **Given** a production build at `dist/client/`, **when** `npm run check:client-bundle-secrets` is executed, **then** `JWT_SECRET`, `SMTP_PASS`, `DB_PATH`, `SMTP_USER`, `SMTP_HOST`, and `NOTIFY_EMAIL` do NOT appear in any `.html`, `.js`, `.css`, or `.map` file in the bundle; and no `VITE_`-prefixed variable whose name contains secret-like keywords (`SECRET`, `PASS`, `KEY`, `TOKEN`) exists anywhere in the codebase.

3. **Given** normal server operation, **when** the server starts and handles requests, **then** no passwords, JWT secrets, or SMTP credentials appear in log output. A startup validation block (guarded to skip in `NODE_ENV=test`) checks all 9 required env vars are present and that `JWT_SECRET` is ≥32 characters — logging only the variable names (never values) on failure before calling `process.exit(1)`.

4. **Given** a VPS deployment, **when** the operator follows the `.env.example` setup instructions, **then** `.env` is readable only by the process owner (`chmod 600`), and `.env` is confirmed to be in `.gitignore` and not committed to the repository. The `.env.example` file includes a comment block at the top documenting the correct file-permission command.

## Tasks / Subtasks

- [x] Subtask 1: `.env.example` — Add descriptive comments and constraints for all keys (AC 1, 4)
  - [x] Add a comment block at the top of `.env.example` with production setup instructions: `chmod 600 .env && chown <process_user>:<process_user> .env`
  - [x] Add descriptive inline comments for every key explaining purpose and constraints (e.g., JWT_SECRET must be ≥32 chars, generated via `openssl rand -hex 32`)
  - [x] Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` have a comment clarifying they are only consumed by `npm run db:seed` — not read by the running server
  - [x] Confirm `VITE_SITE_URL` remains and is documented as a frontend (non-secret) variable

- [x] Subtask 2: Secret scan enhancement — verify and extend `scripts/check-client-bundle-secrets.mjs` (AC 2)
  - [x] Read the existing script; ensure all 6 server-only key names are in `forbiddenNames`: `JWT_SECRET`, `SMTP_PASS`, `DB_PATH`, `SMTP_USER`, `SMTP_HOST`, `NOTIFY_EMAIL`
  - [x] Added `SMTP_HOST` and `DB_PATH` to `forbiddenNames` (were missing from the original scan)
  - [x] Verified no `VITE_`-prefixed secret-like vars in source (only test assertions reference them)
  - [x] Run `npm run build` then `npm run check:client-bundle-secrets` → PASSED

- [x] Subtask 3: Server startup env validation (AC 3)
  - [x] Created `server/env-validation.ts` exporting `validateEnv()` and `REQUIRED_ENV_VARS`
  - [x] Called from `require.main === module` block in `server/index.ts` — tests never reach this block so guard is implicit
  - [x] Logs missing var names only (never values); calls `process.exit(1)` on failure
  - [x] Added `server/env-validation.test.ts` with 10 unit tests — all pass

- [x] Subtask 4: `.gitignore` confirmation and documentation (AC 4)
  - [x] `.env` and `.env.*` already in `.gitignore` (lines 5-6) — no change needed
  - [x] `git ls-files .env` → empty (no tracked .env file)
  - [x] Production `chmod 600` instructions added to `.env.example` header

## Dev Notes

### Source Context

- Epic 5 enables production deployment of the SyncRevenue website. Story 5.3 focuses specifically on securing secrets: documentation, bundle scanning, and startup validation. [Source: `_bmad-output/planning-artifacts/epics.md`]
- The server uses `import 'dotenv/config'` at the top of `server/index.ts` — dotenv is already wired. [Source: `server/index.ts:1`]
- `.env.example` already has all 9 required keys plus `VITE_SITE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. [Source: `.env.example`]
- `scripts/check-client-bundle-secrets.mjs` already exists and scans `dist/client/` for forbidden key names and sentinel values. Key names already include `JWT_SECRET`, `SMTP_PASS`, `SMTP_USER`, `NOTIFY_EMAIL`. Missing from current scan: `SMTP_HOST`, `DB_PATH`. [Source: `scripts/check-client-bundle-secrets.mjs`]
- `.env` is already in `.gitignore` (line 5: `.env`; line 6: `.env.*`). [Source: `.gitignore`]

### Implementation Notes

**AC 1 — `.env.example` completeness:**
- Add a production header comment block documenting `chmod 600 .env`
- Add inline comments for every key; JWT_SECRET comment must mention ≥32 chars and provide `openssl rand -hex 32` as the generation command
- Do NOT remove `VITE_SITE_URL` — it is a legitimate frontend variable (no secret)

**AC 2 — Secret scan:**
- The existing `forbiddenNames` array is missing `SMTP_HOST` and `DB_PATH`. Add them.
- No VITE_ secret vars exist in the current codebase — verify with grep; document the check in the script or a comment.

**AC 3 — Startup validation:**
- Create `server/env-validation.ts` exporting `validateEnv()` — keeps `index.ts` clean
- Guard: `if (process.env.NODE_ENV !== 'test') { validateEnv() }` — call this in the `createApp()` function or, better, in the `require.main === module` block (so tests that import `createApp` are not affected)
- Actually, the guard must be before `createApp()` is called in production. Best placement: in the `if (require.main === module)` block in `server/index.ts`, before `createApp()`. Tests never hit that block.
- Alternatively, export `validateEnv` from a standalone module and call it only in `server/index.ts` main block.
- `validateEnv()` signature: checks `REQUIRED_ENV_VARS` array, collects missing keys, logs names only, then checks `JWT_SECRET.length >= 32`, then exits if any issue.
- Test file: `server/env-validation.test.ts` with `// @vitest-environment node`. Mock `process.exit` and capture `console.error` calls. Restore env vars after each test.

**AC 4 — File permissions:**
- Documentation only. No code change. Confirm `.gitignore` coverage; confirm no `.env` is tracked.

### Architecture Guardrails

- No new runtime dependencies — dotenv is already installed.
- `validateEnv` must not run in test environment — guard with `NODE_ENV !== 'test'` or by placement in the `require.main === module` block.
- Logs must never print secret values — only key names.
- `check:client-bundle-secrets` script uses Node ESM (`.mjs`); keep changes compatible with that format.
- All existing 732 tests must pass; `tsc --noEmit` must exit 0.

### File Write Surface

```
.env.example                          ← UPDATE: production header + inline comments
scripts/check-client-bundle-secrets.mjs ← UPDATE: add SMTP_HOST + DB_PATH to forbiddenNames
server/env-validation.ts              ← NEW: validateEnv() function
server/env-validation.test.ts         ← NEW: unit tests for validateEnv
server/index.ts                       ← UPDATE: call validateEnv() in require.main block
vault/Planning/Epics-Index.md         ← UPDATE: Story 5.3 status
vault/00-Home.md                      ← UPDATE: project status
_bmad-output/implementation-artifacts/sprint-status.yaml ← UPDATE: 5-3 status
```

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 — 2026-05-19.

### Debug Log References

- `npx vitest run server/env-validation.test.ts` → **10/10 pass**
- `npm run typecheck` → 0 errors
- `npm run test:run` → **86 files, 742/742 pass** (732 prior + 10 new)
- `npm run build` → clean
- `npm run check:client-bundle-secrets` → `Client bundle secret scan passed.`
- `git ls-files .env` → empty (no tracked .env)

### Completion Notes

- `server/env-validation.ts`: exports `validateEnv()` + `REQUIRED_ENV_VARS` constant. Checks 9 required vars are non-empty, then checks `JWT_SECRET` ≥32 chars. Logs key names and constraints on failure — never values. Calls `process.exit(1)`.
- `server/index.ts`: imports `validateEnv` and calls it at the top of the `require.main === module` block — before `createApp()`. Tests that import `createApp` are unaffected because they never reach that block.
- `.env.example`: Full documentation overhaul — production `chmod 600` instructions in header, inline comments for every key with purpose + constraint notes. `VITE_SITE_URL` retained with explicit "non-secret" note. `ADMIN_EMAIL`/`ADMIN_PASSWORD` retain their dev-only seed annotation.
- `scripts/check-client-bundle-secrets.mjs`: Added `SMTP_HOST` and `DB_PATH` to `forbiddenNames`. Both were missing from the original scan; now all 6 server-only keys are covered.
- `server/env-validation.test.ts`: 10 unit tests covering: all-valid → no exit; JWT_SECRET exactly 32 → ok; JWT_SECRET exactly 31 → exit; JWT_SECRET <32 → exit; missing single var → exit with name; missing multiple vars → exit with all names; empty-string var → exit; whitespace-only var → exit; REQUIRED_ENV_VARS exhaustive coverage; secret value never logged.
- `.gitignore`: Already covered `.env` and `.env.*` — no change required.
- Commit: `ca03813` feat(story-5.3): environment variable hardening. Pushed to `origin/master`.

### File List

**Added**
- `server/env-validation.ts`
- `server/env-validation.test.ts`
- `_bmad-output/implementation-artifacts/5-3-environment-variable-hardening.md`

**Modified**
- `.env.example` (full documentation overhaul)
- `scripts/check-client-bundle-secrets.mjs` (added `SMTP_HOST`, `DB_PATH` to forbiddenNames)
- `server/index.ts` (import + call `validateEnv()` in require.main block)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (5-3 → done)
- `vault/Planning/Epics-Index.md` (5.3 → `[x]` done)
- `vault/00-Home.md` (project status updated)

### Change Log

| Date | Author | Change |
|---|---|---|
| 2026-05-19 | Claude Sonnet 4.6 | Story 5.3 implemented: validateEnv() startup guard + 10 unit tests, .env.example full docs + chmod 600 instructions, check-client-bundle-secrets extended with SMTP_HOST + DB_PATH. 742 tests pass; typecheck 0; build clean; secret scan passed. Committed ca03813, pushed to origin/master. Status → done. |
