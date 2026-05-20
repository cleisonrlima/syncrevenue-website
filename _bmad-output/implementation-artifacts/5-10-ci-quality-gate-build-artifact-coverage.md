# Story 5.10: CI Quality Gate — Build Artifact & Backup Coverage

**Epic:** 5 — Production Deployment (Phase 4)
**Status:** backlog
**Origin:** Epic 5 Post-Sprint TEA pass (2026-05-20) — findings G1 (score 9), G3 (score 6), G8 (score 4)
**Jira sync:** Deferred — OAuth unavailable at creation time. Must be synced before dev begins.

---

## Story

As the engineer responsible for CI quality gates,
I want the backup script tests and the prerender build-output validation to run in CI,
So that regressions in `scripts/backup.sh` and `scripts/prerender.tsx` are caught before they reach production.

---

## Context

Three related CI coverage gaps were identified in the Epic 5 TEA pass:

**G1 (score 9 — highest risk in sprint):** `scripts/backup.sh` has 3 integration tests in `scripts/backup.test.mjs` that cover the happy path, 30-day retention, and error exit. However, `npm run test:backup` is NOT in `.github/workflows/quality.yml`. A broken backup script is invisible to CI — it would only be discovered when the scheduled cron job fails silently on the production server.

**G3 (score 6):** `scripts/prerender.tsx` has internal sanity checks that exit non-zero if the `<h1>` or `<picture>` element is missing from the rendered output. However, these checks only run during `npm run build`, which is only executed in the `lighthouse` job (not in the `unit` job). A prerender regression discovered by LHCI would only surface after the unit job has already passed — adding latency to the feedback loop. A dedicated `test:build` script that builds and inspects `dist/client/index.html` would catch prerender regressions in the `unit` job.

**G8 (score 4):** LHCI uses `vite preview` as the server, not the actual Express server. Production HTTP headers (`Cache-Control: max-age=31536000, immutable`, `Strict-Transport-Security`) set by `server/index.ts` are not exercised during LHCI runs. This is a documentation finding — no code change required, but the deployment runbook should note the discrepancy so operators know to verify security headers post-deploy.

---

## Acceptance Criteria

### AC 1 — Backup Tests in CI (G1)

- `npm run test:backup` is added as a step in the `unit` job in `.github/workflows/quality.yml`.
- The step runs after `npm run test:run`.
- A failure in `backup.test.mjs` (non-zero exit code) fails the `unit` job and blocks merge.
- Verified: introduce a deliberate syntax error in `backup.sh`, confirm CI fails; revert and confirm CI passes.

### AC 2 — Prerender Build-Output Smoke Test (G3)

- A new test script `scripts/test-build-output.mjs` (or equivalent Vitest test tagged `@build-smoke`) is created that:
  1. Asserts `dist/client/index.html` exists.
  2. Reads the file and asserts it contains the prerendered `<h1>` heading text (e.g., `More commission per ticket`).
  3. Asserts it contains a `<picture>` element.
  4. Asserts the `<h1>` appears **before** the first `<script type="module">` tag in the file (confirming it is pre-rendered, not hydrated).
- A new npm script `"test:build": "node scripts/test-build-output.mjs"` is added to `package.json`.
- This script is added to the `lighthouse` job in `quality.yml` (after the build step, before LHCI runs), OR to a dedicated `build-smoke` job that runs after `unit`.
- Verified: remove the `scripts/prerender.tsx` call from the `build` script, run `npm run build && npm run test:build`, confirm non-zero exit; restore and confirm zero exit.

### AC 3 — Runbook Documentation Update (G8)

- `docs/deployment-runbook.md` gains a "Post-Deploy Verification" section (or updates the existing first-deploy checklist) noting:
  - LHCI uses `vite preview` and does NOT exercise the Express production server's security headers.
  - After first production deploy, manually verify `Strict-Transport-Security`, `Cache-Control`, and `X-Content-Type-Options` headers using `curl -I https://<domain>/api/health` and `curl -I https://<domain>/assets/<hashed-file>.js`.
  - Suggested curl commands provided.

### AC 4 — All Existing Tests Pass

- `npm run test:run` — all Vitest tests green.
- `npm run test:backup` — all 3 backup tests pass.
- `npm run test:build` — passes against a freshly built `dist/client/index.html`.
- `npm run build` — exits 0.
- `tsc --noEmit` — zero errors.

---

## Tasks / Subtasks

- [ ] Task 1 — Add `npm run test:backup` to CI (AC: 1)
  - [ ] Add step to `unit` job in `.github/workflows/quality.yml` after `npm run test:run`
  - [ ] Verify step name is descriptive: `- name: Run backup script tests`

- [ ] Task 2 — Create `scripts/test-build-output.mjs` (AC: 2)
  - [ ] Read `dist/client/index.html` (fail fast if not found)
  - [ ] Assert `<h1>` with prerendered text present
  - [ ] Assert `<picture>` element present
  - [ ] Assert `<h1>` position in file is before first `<script type="module">` tag
  - [ ] Exit 0 on pass; exit 1 with diagnostic message on failure

- [ ] Task 3 — Add `test:build` npm script (AC: 2)
  - [ ] Add `"test:build": "node scripts/test-build-output.mjs"` to `package.json`
  - [ ] Wire into CI in `lighthouse` job or dedicated `build-smoke` job (after `npm run build`)

- [ ] Task 4 — Update `docs/deployment-runbook.md` (AC: 3)
  - [ ] Add "Post-Deploy Header Verification" section with curl commands
  - [ ] Note LHCI limitation (vite preview vs Express server)

- [ ] Task 5 — Verify all tests pass (AC: 4)

---

## Dev Notes

- `scripts/test-build-output.mjs` should use only Node.js built-ins (`fs`, `path`, `assert`) — no new dependencies.
- The prerendered `<h1>` text is in English (default locale): `"More commission per ticket"` — this is the static EN prerender from `scripts/prerender.tsx`.
- The check for `<h1>` position before `<script type="module">` is the key invariant: if React hydration runs before the hero markup exists, LCP regresses to 3,000+ ms. This test is the minimum automated safety net.
- `npm run test:build` depends on a prior `npm run build` — document this in the script's inline comment. The CI step should be: `run: npm run build && npm run test:build`.
- Do NOT add `@types/node` to production dependencies — it is already in `devDependencies`.

---

## File Structure Requirements

| File | Change type | Notes |
|------|-------------|-------|
| `.github/workflows/quality.yml` | UPDATE | Add `npm run test:backup` to `unit` job |
| `scripts/test-build-output.mjs` | NEW | Post-build HTML smoke assertions |
| `package.json` | UPDATE | Add `test:build` script |
| `docs/deployment-runbook.md` | UPDATE | Add post-deploy header verification section |
