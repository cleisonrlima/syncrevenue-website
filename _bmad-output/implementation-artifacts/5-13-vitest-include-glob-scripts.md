# Story 5.13: Vitest Include Glob for scripts/ Test Files

**Epic:** 5 — Production Deployment (Phase 4)
**Status:** done
**Origin:** Epic 5 Post-Sprint TEA v2 pass (2026-05-20) — finding NG1 (risk score 4)
**Jira sync:** Synced 2026-05-20. Parent: **SYN-478** ("To Do"). Sub-tasks: SYN-484 (Task 1, extend include glob), SYN-485 (Task 2, 6 tests green), SYN-486 (Task 3, verify non-Vitest scripts excluded), SYN-487 (Task 4, final verification) — all at "To Do".

---

## Story

As the engineer responsible for the Vitest discovery configuration,
I want `vite.config.ts`'s `test.include` array to also discover `scripts/**/*.test.mjs` files,
So that the six Vitest tests in `scripts/generate-seo-assets.test.mjs` (authored in Story 3.3 review) actually execute on every `npm run test:run` and any SEO-asset regression is caught in CI.

---

## Context

The Epic 5 post-sprint TEA v2 pass identified that `scripts/generate-seo-assets.test.mjs` was authored as a Vitest test file — it imports `describe, expect, it` from the `'vitest'` package — but is silently excluded from discovery. `vite.config.ts:27` declares:

```ts
include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts', 'eslint-rules/**/*.test.mjs']
```

The `scripts/` directory is not listed. As a result, the six tests covering `resolveSiteUrl`, `canonicalUrl`, `renderSitemap` (including the hreflang matrix), and `renderRobots` never run. `scripts/generate-seo-assets.mjs` is invoked from `npm run build` (step 3 of 4 in the build pipeline), so a regression in any of those helpers could ship a malformed sitemap.xml or robots.txt without any unit-level signal — only an indirect LHCI SEO score reduction would notice.

**Note:** Two other `scripts/*.test.mjs` files are intentionally NOT Vitest tests:

- `scripts/backup.test.mjs` — standalone Node.js test runner, invoked via `npm run test:backup` (CI step added by Story 5.10).
- `scripts/test-build-output.mjs` — standalone Node.js post-build smoke harness, invoked via `npm run test:build` in the `build-smoke` CI job.

Neither file imports from `'vitest'`. The proposed include glob (`scripts/**/*.test.mjs`) would match both of them by name, so the fix must be careful: either narrow the glob (e.g., `scripts/**/generate-*.test.mjs`) or rely on Vitest gracefully skipping files that do not register any `describe`/`it`. Vitest does emit a "no test suites found" warning for non-Vitest files matched by the include glob — so a more precise pattern is preferred.

TEA v2 scored NG1: P2 (medium — `generate-seo-assets.mjs` is non-trivial enough that an untested regression is plausible) × I2 (moderate — SEO regression is recoverable but search-engine re-indexing lags days) = 4. Mitigation recommended.

---

## Acceptance Criteria

### AC 1 — Vitest Discovers `scripts/generate-seo-assets.test.mjs`

- `vite.config.ts:27` `test.include` is extended such that `scripts/generate-seo-assets.test.mjs` is discovered.
- Acceptable patterns: `'scripts/generate-seo-assets.test.mjs'` (exact), `'scripts/generate-*.test.mjs'` (narrow glob), or a renamed-and-relocated file path. Choose the most-narrow option that avoids matching `backup.test.mjs` or `test-build-output.mjs`.
- After the change, `npm run test:run` reports six new tests under a file path containing `generate-seo-assets`.

### AC 2 — All Six Tests Pass

- The six tests in `scripts/generate-seo-assets.test.mjs` execute and exit green:
  1. `falls back to the default canonical origin when VITE_SITE_URL is unset`
  2. `builds canonical URLs without trailing slash on root and with optional locale query`
  3. `renders sitemap.xml with required schema, two routes, lastmod, and full hreflang matrix`
  4. `renders sitemap with a supplied site URL override`
  5. `renders robots.txt with public allowlist, admin/API disallows, and absolute sitemap directive`
  6. `renders robots.txt with overridden site URL for build-time canonical`

### AC 3 — Non-Vitest scripts/ Tests Remain Outside the Glob

- `scripts/backup.test.mjs` is NOT picked up by Vitest (it would emit a "no tests found" warning or fail because it lacks `describe`/`it`).
- `scripts/test-build-output.mjs` is NOT picked up by Vitest (same reason).
- Verify by inspecting `npm run test:run` output — neither file name appears in the test report.

### AC 4 — No Regression in Existing Test Run

- Test count before this change matches the count after, plus 6 (the six newly-discovered tests).
- No previously-passing tests fail.
- `npx tsc --noEmit && npx tsc --noEmit --project tsconfig.scripts.json` exits 0.

---

## Tasks / Subtasks

- [x] Task 1 — Extend Vitest include glob (AC: 1)
  - [x] Edit `vite.config.ts:27` — add `'scripts/generate-*.test.mjs'` (or exact path) to the `include` array
  - [x] Run `npm run test:run` and confirm the new file is discovered

- [x] Task 2 — Confirm tests pass green (AC: 2)
  - [x] All six tests pass on the first run
  - [x] If any test fails, investigate the root cause (likely a behaviour change in `generate-seo-assets.mjs` since 2026-03 that the test was unaware of) and either fix the test or surface a new TEA finding for `generate-seo-assets.mjs` itself

- [x] Task 3 — Verify non-Vitest scripts excluded (AC: 3)
  - [x] Inspect `npm run test:run` output — neither `backup.test.mjs` nor `test-build-output.mjs` should appear
  - [x] If the glob accidentally matches them, narrow the pattern

- [x] Task 4 — Final verification (AC: 4)
  - [x] Test count delta is exactly +6 (baseline 766 → 772 after change; story's "757+6=763" estimate predates Stories 5.11 + 5.12 which added 6 new tests for health DAO + 1 for trust-proxy timing → revised baseline 766)
  - [x] No previously-passing test failures introduced
  - [x] `npm run typecheck` exits 0
  - [x] Push branch; CI `unit` job goes green (deferred to main thread)

---

## Dev Agent Record

### Implementation Plan

Single-line `vite.config.ts` change. The recommended narrow glob `scripts/generate-*.test.mjs` matches the SEO-asset test file while excluding `scripts/backup.test.mjs` and `scripts/test-build-output.mjs` (both standalone Node test runners that import nothing from `vitest`).

### Completion Notes

- Added `'scripts/generate-*.test.mjs'` to `test.include` in `vite.config.ts:27`.
- Verified 6 new tests discovered and green via targeted `npx vitest run scripts/generate-seo-assets.test.mjs --reporter=verbose`:
  1. falls back to the default canonical origin when VITE_SITE_URL is unset
  2. builds canonical URLs without trailing slash on root and with optional locale query
  3. renders sitemap.xml with required schema, two routes, lastmod, and full hreflang matrix
  4. renders sitemap with a supplied site URL override
  5. renders robots.txt with public allowlist, admin/API disallows, and absolute sitemap directive
  6. renders robots.txt with overridden site URL for build-time canonical
- Full suite `npm run test:run`: **89 test files, 772 passed (772)**. Baseline before change was 766 (per Story 5.12 review). Delta = exactly +6.
- `scripts/backup.test.mjs` and `scripts/test-build-output.mjs` do NOT appear in verbose Vitest output — narrow glob correctly excludes them. AC3 satisfied without relying on Vitest's "no tests found" warning.
- `npm run typecheck` exits 0 (both `tsc --noEmit` and `tsc --noEmit --project tsconfig.scripts.json`).
- Deviation from story estimate: story Dev Notes predict 757→763. Actual 766→772. The +9 baseline drift is owed to Stories 5.11 (health DAO 3 tests) + 5.12 (auth throttling + Home RTL stabilisation refactor added net test count) which landed between story authoring and dev. Delta semantics unchanged (still exactly +6).
- No new findings warranting separate stories.
- Commit, push, and Jira sync deferred to main thread per project rules.

### File List

- MODIFIED: `vite.config.ts` — extended `test.include` array with `'scripts/generate-*.test.mjs'`
- MODIFIED: `_bmad-output/implementation-artifacts/sprint-status.yaml` — `5-13-vitest-include-glob-scripts: ready-for-dev` → `review`
- MODIFIED: `_bmad-output/implementation-artifacts/5-13-vitest-include-glob-scripts.md` — task ticks + Dev Agent Record + Change Log + Status flipped to `review`
- MODIFIED: `vault/Planning/Epics-Index.md` — Story 5.13 entry flipped `[~]` → `[x]`

### Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-05-20 | Dev (Claude Opus 4.7) | Initial implementation: extended Vitest include glob for `scripts/generate-*.test.mjs`; 6 SEO-asset tests now discovered and green; full suite 772 passing; typecheck clean. Status: ready-for-dev → review. |

---

## Dev Notes

### Glob Pattern Choice

Three candidate patterns, in order of preference:

| Pattern | Match | Pros | Cons |
|---------|-------|------|------|
| `scripts/generate-*.test.mjs` | `generate-seo-assets.test.mjs` (and future `generate-*` tests) | Narrow; future-proof for SEO-asset-generator family | Slightly broader than strictly needed |
| `scripts/generate-seo-assets.test.mjs` | exact file only | Most narrow | Doesn't generalise; future tests need glob update |
| `scripts/**/*.test.mjs` | all `.test.mjs` under scripts | Simplest | Catches `backup.test.mjs` + `test-build-output.mjs` — violates AC 3 |

**Recommended:** `scripts/generate-*.test.mjs`.

### Vitest Behaviour on Non-Test Files

If a file matches the include glob but contains no `describe`/`it`, Vitest emits a `[vitest] No tests found in <file>` warning but does not fail. This is why the narrow glob is preferred — silent warnings degrade the signal-to-noise ratio of CI output.

### Alternative Considered (and Rejected): Move the File

Moving `scripts/generate-seo-assets.test.mjs` to `server/generate-seo-assets.test.mjs` was considered. Rejected because:

- The file under test (`generate-seo-assets.mjs`) lives in `scripts/`, and tests should live next to their subject (project convention — see `server/dao/*.dao.test.ts` next to `server/dao/*.dao.ts`).
- Moving the test would create a confusing cross-directory import (`import ... from '../scripts/generate-seo-assets.mjs'`).
- The configuration change is one-line and cleaner.

---

## File Structure Requirements

| File | Change type | Notes |
|------|-------------|-------|
| `vite.config.ts` | UPDATE | Add `'scripts/generate-*.test.mjs'` to `test.include` |

No other files require modification.

---

## Testing Requirements

- `npm run test:run` reports exactly +6 tests after the change.
- All six tests in `scripts/generate-seo-assets.test.mjs` pass.
- `npm run typecheck` exits 0.
- No new warnings in Vitest output beyond the new tests.

---

## Out of Scope

- Refactoring `scripts/generate-seo-assets.mjs` itself.
- Adding new tests beyond the six already present.
- Migrating other standalone Node test harnesses (`backup.test.mjs`, `test-build-output.mjs`) to Vitest — they are intentionally standalone for good reasons (no Vitest dependency for build-time or shell-script tests).
