# Test Design — Epic 5: Production Deployment (Phase 4) — v2 Re-Pass

**Sprint:** Epic 5 Post-Sprint TEA — second pass
**Date:** 2026-05-20
**Analyst:** Murat — Master Test Architect (bmad-tea)
**Scope:** Stories 5.1 through 5.11 (all `done`). Verifies closure of v1 findings (G1, G2, G3, G4, G8) by Stories 5.7–5.11, then scans the post-closure landscape for new gaps, NFR risks, and cross-story regression risks.
**Prior artifact:** [test-design-epic-5.md](test-design-epic-5.md) (v1, 2026-05-20 — stories 5.1–5.6 + 5.7/5.8/5.9 ready-for-dev)
**Mode:** Fresh re-pass — both closure verification and new-gap discovery

---

## Executive Summary

The v1 TEA pass surfaced eight findings (G1–G8) and recommended two new stories (5.10, 5.11) plus three already-queued follow-ups (5.7, 5.8, 5.9). All five follow-up stories are now `done` and pushed. This v2 pass independently verifies that the v1 closure work landed correctly and scans for residual or newly-exposed risk.

**Verdict on v1 closure: ALL CLOSED.**

- G1 (score 9, backup tests in CI) — verified: `.github/workflows/quality.yml:23-24` adds `- name: Run backup script tests / run: npm run test:backup` to the `unit` job.
- G2 (score 4, health DAO unit tests) — verified: `server/dao/health.dao.test.ts` exists with 3 tests covering happy-path ping, closed-DB throw, and singleton interface. Temp-dir DB pattern per review patch.
- G3 (score 6, prerender build-output assertion) — verified: `scripts/test-build-output.mjs` exists (158 lines, Node built-ins only, depth-tracked DOM walk locating the rooted `<h1>`); dedicated `build-smoke` CI job runs `npm run build && npm run test:build` after `unit`.
- G4 (score 4, trust proxy) — verified: `server/index.ts:54` calls `app.set('trust proxy', 1)` inside the `NODE_ENV === 'production'` block, before the redirect middleware; redirect now normalises proxy-chain `X-Forwarded-Proto` values; 4 new tests in `server/index.test.ts` cover the AC.
- G8 (score 4, LHCI vs Express headers) — verified: `docs/deployment-runbook.md` adds section 9 "Post-Deploy Header Verification" with curl recipes for HSTS, Cache-Control on hashed assets, and X-Content-Type-Options.
- G5, G6, G7 — remain accepted; no production conditions changed the rationale.

**New findings in v2: TWO, totalling one mitigation-required and one mitigation-recommended.**

- **NG1 (P2×I2 = 4):** `scripts/generate-seo-assets.test.mjs` is authored as Vitest tests (imports `describe, expect, it` from `'vitest'`) but `vite.config.ts:27` constrains `test.include` to `['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts', 'eslint-rules/**/*.test.mjs']` — `scripts/**/*.test.mjs` is silently excluded. The 6 tests for the SEO sitemap/robots generator never run.
- **NG2 (P3×I2 = 6):** Pre-existing Vitest flakes in `server/routes/admin/auth.test.ts` (Story 4.7 throttling timing) and `src/pages/Home*.test.tsx` (RTL `waitFor` timeouts) recur in **every** Epic 5 story dev record from 5.7 onward. They consistently produce 13-14 false-failure rows in full `npm run test:run` invocations, force every dev agent to add an "in isolation, this passes" caveat, and mask real regressions. The Epic 5 retro's Action Item C1 fixes the *process* (`try/finally` cleanup discipline) but does not fix the *outstanding flakes themselves*, which pre-date the rule.

**Net new stories recommended: 2 (5.12 — test stability, 5.13 — Vitest include glob for scripts/).**

**Quality gate decision: PASS with follow-ups.** Highest v2 risk score is 6, below the gate-failure threshold of 9. Sprint is releasable.

---

## Risk Scoring Matrix — v2

### v1 finding closures

| ID | Finding | v1 Score | v2 Status | Closing artifact |
|----|---------|---------:|-----------|------------------|
| G1 | `npm run test:backup` not in CI | 9 | ✅ CLOSED | Story 5.10 — `.github/workflows/quality.yml:23-24` |
| G2 | `health.dao.ts` no unit tests | 4 | ✅ CLOSED | Story 5.11 — `server/dao/health.dao.test.ts` (3 tests) |
| G3 | No prerender build-output assertion | 6 | ✅ CLOSED | Story 5.10 — `scripts/test-build-output.mjs` + `build-smoke` CI job |
| G4 | `trust proxy` absent | 4 | ✅ CLOSED | Story 5.9 — `server/index.ts:54` + 4 new tests in `server/index.test.ts` |
| G5 | PM2 crash-loop untestable | 3 | 🟡 ACCEPTED (unchanged) | `ecosystem.config.js` docs + ADR in `vault/Planning/Architecture-Key.md` (Story 5.7) |
| G6 | Font assets no cache header | 2 | 🟡 ACCEPTED (unchanged) | low risk; fonts self-hosted under Express defaults |
| G7 | No concurrent-run guard in backup script | 2 | 🟡 ACCEPTED (unchanged) | single-server deploy; cron collision probability negligible |
| G8 | LHCI uses `vite preview`, not Express | 4 | ✅ CLOSED | Story 5.10 — `docs/deployment-runbook.md` §9 "Post-Deploy Header Verification" |

### v2 new findings

| ID | Finding | Category | Probability | Impact | Score | Disposition |
|----|---------|----------|-------------|--------|-------|-------------|
| NG1 | `scripts/generate-seo-assets.test.mjs` (6 vitest tests) never runs — Vitest include glob misses `scripts/**/*.test.mjs` | TECH | P2 | I2 | 4 | **Story 5.13** |
| NG2 | Pre-existing flakes (4.7 auth throttling + Home RTL `waitFor`) mask signal across every Epic 5 full-suite run | OPS | P3 | I2 | 6 | **Story 5.12** |
| NG3 | `npm run build` runs in BOTH `build-smoke` and `lighthouse` jobs — ~30–60s wasted per CI invocation | OPS | P3 | I1 | 3 | Accepted; future CI cache-artifact pass |
| NG4 | `scripts/test-build-output.mjs` checks EN heading only; if FR prerender is ever added it will go unchecked | TECH | P1 | I1 | 1 | Accepted; single-locale prerender is by design (Story 5.6) |
| NG5 | `trust proxy 1` hard-coded; CDN-in-front-of-Nginx (2 hops) would silently invalidate the assumption | OPS | P1 | I2 | 2 | Accepted; runbook §4 documents the 1-hop assumption |
| NG6 | No automated production-server response-header smoke test (curl-against-`node dist/server/index.js`) | SEC/PERF | P2 | I2 | 4 | Accepted with caveat — runbook §9 is the manual mitigation; automating would require pm2-in-CI |

**Probability scale:** P1 = Low (≤25%), P2 = Medium (26–60%), P3 = High (>60%)
**Impact scale:** I1 = Minor, I2 = Moderate, I3 = Significant
**Score = P × I (1–9); ≥6 requires documented mitigation; =9 mandates gate failure**

---

## Closure Verification — Evidence

### G1 (CLOSED) — Backup tests in CI

Verified line-by-line:

```yaml
# .github/workflows/quality.yml:20-24
- run: npm run lint
- run: npm run typecheck
- run: npm run test:run
- name: Run backup script tests
  run: npm run test:backup
```

The step is in the `unit` job (line 10-24). A failure in `scripts/backup.test.mjs` fails the `unit` job; the `e2e`, `build-smoke`, and `lighthouse` jobs all `needs: unit`, so a backup-test failure blocks the entire pipeline. Confirmed by static review of the YAML structure.

### G2 (CLOSED) — Health DAO unit tests

Verified file present at [server/dao/health.dao.test.ts](../../../server/dao/health.dao.test.ts) (41 lines, 3 tests):

| Test | AC | Implementation |
|------|----|----------------|
| `ping() returns true on an open database` | 5.11 AC 1 | `new Database(path.join(tempDir, 'health.db'))` → `dao.ping()` → `expect().toBe(true)` |
| `ping() throws when the database connection has been closed` | 5.11 AC 2 | `db.close()` → `expect(() => dao.ping()).toThrow()` |
| `default healthDao singleton exposes a ping method` | 5.11 AC 3 | `expect(typeof healthDao.ping).toBe('function')` |

Temp-dir cleanup is explicit (`fs.mkdtempSync` + `fs.rmSync(..., {recursive: true, force: true})`). DAO parity restored: all 7 DAO files in `server/dao/` now have matching `*.test.ts` files.

### G3 (CLOSED) — Prerender build-output assertion

Verified [scripts/test-build-output.mjs](../../../scripts/test-build-output.mjs) (158 lines, Node built-ins only). Four assertions:

1. `dist/client/index.html` exists.
2. File contains literal text `"More commission per ticket"` (EN-locale hero copy).
3. `<h1>` lives inside `<div id="root">` via depth-tracked walk over `<div>`/`</div>` tags from the `#root` opener.
4. `<picture>` lives inside the same `#root` span; the rooted `<h1>` itself contains the expected heading text.

Wiring verified in `package.json:25` (`"test:build": "node scripts/test-build-output.mjs"`) and `.github/workflows/quality.yml:51-65` (dedicated `build-smoke` job, `needs: unit`, runs `npm run build && npm run test:build`).

**Note on the deviation from the original AC phrasing.** Story 5.10 AC 2 originally asked for "the `<h1>` to appear before the first `<script type="module">`". Vite emits the module entry script in `<head>` (line 51 of the built artifact) while the prerendered `<h1>` lands in `<body>` — so the literal byte-order check is structurally impossible against a modern Vite template. The implemented "inside `<div id="root">`" assertion is the load-bearing equivalent of the LCP-critical invariant (hero markup must be in the hydration root before hydration runs) and matches what the prerender script actually produces. This v2 pass concurs with the deviation and considers G3 closed.

### G4 (CLOSED) — Trust proxy

Verified [server/index.ts:54](../../../server/index.ts#L54): `app.set('trust proxy', 1)` sits inside `if (process.env.NODE_ENV === 'production')` and precedes the `X-Forwarded-Proto` redirect middleware. The redirect now normalises the first token of the comma-separated `X-Forwarded-Proto` header per the reviewer's patch (line 57). Four new tests in [server/index.test.ts:335-419](../../../server/index.test.ts#L335-L419) cover: trust proxy value is `1` in production, `req.protocol === 'https'` when `X-Forwarded-Proto: https`, redirect fires when `X-Forwarded-Proto: http` AND `req.protocol === 'http'` is captured before redirect, trust proxy is `false` in test/dev.

### G8 (CLOSED) — LHCI vs Express headers

Verified `docs/deployment-runbook.md` adds **§9. Post-Deploy Header Verification** with:

- An explicit "Why LHCI Cannot Cover This" subsection documenting that `vite preview` is the LHCI start server and does not exercise Express middleware.
- Curl recipes for `Strict-Transport-Security`, `Cache-Control` on hashed assets, and `X-Content-Type-Options`.
- Expected response shapes referencing `staticCacheHeaders()` in `server/index.ts`.

Section is positioned after SSL renewal (§8) and before Related Documents to avoid collision with Story 5.9's trust-proxy edits at §4.

---

## New Finding Detail — NG1

**`scripts/generate-seo-assets.test.mjs` is excluded from `npm run test:run`.**

The file was authored as Vitest tests (commit `63797d8` — Story 3.3 review follow-ups). It imports the canonical Vitest API:

```js
// scripts/generate-seo-assets.test.mjs:1
import { describe, expect, it } from 'vitest'
```

But Vitest configuration in `vite.config.ts:27` restricts test discovery to:

```ts
include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts', 'eslint-rules/**/*.test.mjs']
```

`scripts/**/*.test.mjs` is not listed. The 6 tests inside the file — covering `resolveSiteUrl`, `canonicalUrl`, `renderSitemap` (including the hreflang matrix), and `renderRobots` — silently never execute.

**Impact:** SEO regression in `scripts/generate-seo-assets.mjs` would not be caught by CI. `generate-seo-assets.mjs` is invoked from `package.json:8` (`"build": "tsc -p tsconfig.server.json && vite build && node scripts/generate-seo-assets.mjs && ..."`), so a broken generator could ship a malformed sitemap or robots.txt without any unit-level signal — only LHCI's SEO score (which weights robots.txt presence, not content correctness) would notice indirectly.

**Probability:** P2 — the generator handles canonical URL construction, locale matrix expansion, and absolute-URL emission; non-trivial enough that an untested regression is plausible. Authored 6 tests imply the author considered these paths brittle.
**Impact:** I2 — SEO regression is recoverable (re-deploy fixes it) but search-engine re-indexing can lag days; degrades organic acquisition silently.
**Score:** P2 × I2 = 4. Mitigation required (≥6 threshold not crossed but documented per project convention for ≥4).

**Recommended fix (Story 5.13):** Extend `vite.config.ts:27` `include` to add `'scripts/**/*.test.mjs'`. Verify `npm run test:run` discovers the 6 new tests and all pass. Alternative (rejected): relocate the file to `server/` — incorrect because it tests a `scripts/`-namespaced module.

---

## New Finding Detail — NG2

**Pre-existing Vitest flakes recur in every Epic 5 full-suite run.**

Three story dev records (5.7, 5.8, 5.10, 5.11) each document the same anomaly during `npm run test:run`:

| Source | Documented failures | Documented cause |
|---|---|---|
| Story 5.7 dev record line 105 | "flaky failures in pre-existing admin-auth and home-e2e suites observed; unrelated to this story's scope" | not stated |
| Story 5.8 dev record line 120 | "751 passing, 14 failing. All 14 failures are timeouts in `server/routes/admin/auth.test.ts` (throttling/lockout suite from Story 4.7), pre-existing flakes unrelated to this story." | Story 4.7 throttling tests |
| Story 5.10 dev record lines 156-161 | "752 PASS / 13 FAIL — failures are pre-existing flakes in `server/routes/admin/auth.test.ts` (Story 4.7 throttling timing flakes) and `src/pages/Home*.test.tsx` (RTL waitFor timeouts on slow runners)." | Story 4.7 timing + Home RTL `waitFor` |
| Story 5.11 dev record lines 134-138 | "14 failures in `server/routes/admin/team.test.ts` (timeout-style errors at 212s total duration)... Re-running the canonical failing test in isolation passed in 8.48s." | Vitest CPU contention; isolation passes |

**The flakes pre-date Epic 5** (the auth throttling tests were added in Story 4.7 on 2026-05-16; the Home RTL tests are even older). The Epic 5 retrospective surfaces them under §4.1 Issue 1 as a pattern, but the retro Action Item C1 only addresses the **process** (PR-checklist for `try/finally` cleanup discipline) — it does not address the **existing** flakes already in the suite.

**Why this is a TEA gate concern, not a retro action:**

- **Signal masking.** Every dev agent has to caveat real-vs-flake in their dev record. A genuine regression introduced in a future story would be hard to distinguish from the chronic baseline noise.
- **Cross-story discipline cost.** Each story dev record adds ~20 lines of "these failures are pre-existing" prose. That's compounding documentation debt with no fix in sight.
- **Cross-model review noise.** Cross-model reviewers (Story Automator rule, mandatory per CLAUDE.md) have to spend cycles confirming the same flake list every story.
- **CI signal corruption.** If the flakes ever become consistent (e.g., a CI runner change makes them fail every time), the entire `unit` job goes red and blocks unrelated merges.

**Probability:** P3 (>60% — observed in every recent Epic 5 full-suite run; ~100% recurrence in available evidence).
**Impact:** I2 (moderate — masks signal, slows velocity, no current production breakage but accumulates risk).
**Score:** P3 × I2 = 6. Mitigation required.

**Recommended fix (Story 5.12):**

1. Audit `server/routes/admin/auth.test.ts` throttling suite (Story 4.7) — replace any `setTimeout`-based or wall-clock-dependent assertion with Vitest fake timers (`vi.useFakeTimers()` + `vi.advanceTimersByTime()`).
2. Audit `src/pages/Home*.test.tsx` — replace `waitFor(() => …, { timeout: N })` with `findBy*` queries that have built-in retry, or with explicit `await screen.findByRole(…)` calls. Increase the Vitest default timeout only if a specific async path has unavoidable I/O.
3. Verify full `npm run test:run` exits 0 with no flake-related caveats for three consecutive CI runs.
4. Add an inline comment to the touched tests linking to Story 5.12 so future maintainers know why the patterns changed.

This is a one-touch test-stability story; no production code is modified. Estimated 4–8 hours.

---

## Cross-Story Coverage Analysis — v2 Delta

The v1 analysis remains valid for Stories 5.1–5.6. v2 additions:

### 5.7 × 5.6 — Cluster mode ADR + prerender script

Story 5.7 keeps cluster mode opt-in. The prerender script (Story 5.6) is a build-time-only script that runs once on the build host, not at runtime — so cluster vs fork mode has zero interaction with prerender. No coverage gap.

### 5.7 × 5.4 — Cluster mode + backup script

If a future operator enables cluster mode and the backup cron fires while multiple workers handle requests, SQLite WAL mode (PRAGMA confirmed enabled per `server/db.test.ts:113-125`) allows concurrent reads from PM2 workers AND a concurrent read from the backup script's `sqlite3 .backup` command. WAL is read-safe under concurrent readers. The opt-in stance keeps this path latent. Accepted.

### 5.8 × 5.6 — Prerender typecheck

Story 5.8's `tsconfig.scripts.json` is verified to extend the base config and add `scripts/` to the typecheck graph. AC 2 closure (deliberate type error → exit non-zero) was verified by the dev agent. The `@types/node`'s `process.exit: never` typing satisfies AC 5 without an edit to `prerender.tsx`. Cross-story risk: if `@types/node` is ever downgraded below the version that types `process.exit` as `never`, AC 5 would regress to a TS2454 error. Probability low (no reason to downgrade); accepted.

### 5.9 × 5.2 — Trust proxy + HSTS

The v1 cross-story note flagged that without trust proxy, Helmet's HSTS might depend on `req.secure` — empirical evidence showed Helmet emits HSTS unconditionally when `hsts.maxAge` is set. Story 5.9 now enables trust proxy regardless. The redirect middleware reads `X-Forwarded-Proto` directly (not via `req.secure`), so the change is additive. No new risk.

### 5.10 × 5.6 + 5.4 — CI build-smoke job

The new `build-smoke` job runs `npm run build && npm run test:build`. `npm run build` invokes (1) `tsc -p tsconfig.server.json`, (2) `vite build`, (3) `node scripts/generate-seo-assets.mjs`, (4) `node_modules/.bin/tsx scripts/prerender.tsx`. If ANY of those four steps exits non-zero, the build-smoke job fails before `test:build` runs — so the build-smoke job is, in effect, an end-to-end build sanity check that backstops both prerender (5.6) and SEO asset generation (5.13's untested code path). The build-smoke job therefore provides a partial mitigation for NG1 — a fatal regression in `generate-seo-assets.mjs` would still fail CI. The remaining gap (silent unit-level regression in the helper functions tested by the dead `generate-seo-assets.test.mjs`) is what NG1 captures.

### 5.11 × 5.5 — Health DAO + route

Story 5.5's route tests cover the route handler with a mocked DAO. Story 5.11's DAO tests cover the DAO in isolation. The DAO factory (`createHealthDao(database)`) is now exercised against a real `better-sqlite3` instance — the only path that was not previously covered. Composition: route layer × DAO layer × DB layer all individually tested. No gap.

---

## NFR Coverage Assessment — v2 Delta

All v1 NFR statuses unchanged except:

| NFR | v1 Status | v2 Status | Note |
|-----|-----------|-----------|------|
| S8 — `trust proxy` for accurate `req.ip` | OPEN | **PASS** | Story 5.9 closed |
| M1 — `scripts/` TypeScript coverage | OPEN | **PASS** | Story 5.8 closed |
| R3 — Backup CI coverage | PASS with CI gap | **PASS (full)** | Story 5.10 closed |
| (new) M6 — Vitest discovery completeness | n/a | **OPEN (NG1)** | `scripts/generate-seo-assets.test.mjs` not discovered |
| (new) M7 — Test suite stability | n/a | **OPEN (NG2)** | Chronic flake debt; Story 5.12 candidate |

---

## CI Coverage Assessment — v2 Delta

### Current CI Pipeline (after Stories 5.10 + 5.11)

```
push/PR
  └── unit (parallel)              ✓ lint, typecheck, test:run, test:backup
       ├── e2e (after unit)         ✓ playwright test
       ├── build-smoke (after unit) ✓ npm run build && npm run test:build
       └── lighthouse (after unit)  ✓ lhci (desktop), lhci:mobile
```

### Gaps in CI — v2

| Gap | Severity | v2 Disposition |
|-----|----------|----------------|
| `scripts/generate-seo-assets.test.mjs` not discovered by Vitest | MEDIUM | **Story 5.13** (NG1) |
| `npm run build` runs twice in CI (`build-smoke` + `lighthouse`) | LOW | Accepted — future cache-artifact pass |
| No automated curl-against-Express smoke in CI | LOW | Accepted — runbook §9 is manual mitigation |
| No 3-run burn-in for flakes-suspect tests | MEDIUM-LOW | Covered by Story 5.12 (NG2) AC 5 |
| No shard/parallel strategy for Playwright | LOW | Suite small enough |

### CI Script Injection Safety — v2

No regression. The new `build-smoke` job uses only `npm` commands and contains no `${{ inputs.* }}` or `${{ github.event.* }}` interpolations in `run:` blocks. Safe.

---

## Recommendations Summary — v2

### Actionable — New Stories Needed

#### Story 5.12 — Stabilize Pre-Existing Vitest Flakes

**Cluster of findings:** NG2 (score 6)

**Rationale:** Chronic flake debt in `server/routes/admin/auth.test.ts` and `src/pages/Home*.test.tsx` masks signal across every Epic 5 story dev record. The Epic 5 retro's Action Item C1 addresses the process going forward; this story addresses the existing debt. Estimated 4–8 hours; no production code modified.

**Priority:** P1 — score 6, threshold for documented mitigation.

#### Story 5.13 — Vitest Include Glob for scripts/

**Cluster of findings:** NG1 (score 4)

**Rationale:** Six existing Vitest tests for `scripts/generate-seo-assets.mjs` silently never run. One-line `vite.config.ts` fix; no test refactor needed. Estimated 1 hour.

**Priority:** P2 — score 4, mitigation recommended but not threshold-crossing.

### Accepted Findings (No New Story)

| ID | Finding | Rationale for acceptance |
|----|---------|--------------------------|
| G5 | PM2 crash-loop untestable | Infrastructure; runbook + ADR cover it |
| G6 | Font assets no cache header | Self-hosted; low risk at current scale |
| G7 | No concurrent-run guard in backup script | Single-server cron; collision probability negligible |
| NG3 | `npm run build` runs twice in CI | Wasted CI minutes only; not a quality gap |
| NG4 | Build-smoke checks EN only | Single-locale prerender is by design |
| NG5 | `trust proxy 1` hard-coded | Documented in runbook §4; future CDN topology change is a known follow-up |
| NG6 | No automated production-server curl smoke | Runbook §9 is the manual mitigation; pm2-in-CI overhead not yet justified |
| P7 (v1) | No automated p95 perf gate | Already explicitly out of scope per Story 5.5 AC 4 |

---

## Traceability Summary — v2 Additions

| Story | AC covered by tests | Gaps |
|-------|---------------------|------|
| 5.7 | AC 1 (ADR in `vault/Planning/Architecture-Key.md`), AC 2 (WAL pragma regression test `server/db.test.ts:113-125`), AC 3 (opt-in fields in `ecosystem.config.js`), AC 6 (test suite + tsc clean) | AC 4/5 (always-on cluster) — N/A by stance |
| 5.8 | AC 1 (`tsconfig.scripts.json` extends base + types), AC 2 (deliberate type error → exit 2 verified), AC 3 (`typecheck` chained), AC 4 (CI covers scripts), AC 5 (auto-satisfied via `@types/node`) | None |
| 5.9 | AC 1 (`server/index.ts:54` + 1 unit test), AC 2 (2 protocol unit tests in `server/index.test.ts`), AC 3 (rate-limit tests still green), AC 4 (`docs/deployment-runbook.md` §4 expanded) | None |
| 5.10 | AC 1 (G1 — `quality.yml:23-24`), AC 2 (G3 — `scripts/test-build-output.mjs` + `build-smoke` job), AC 3 (G8 — runbook §9), AC 4 (all verifications green) | None |
| 5.11 | AC 1 (`server/dao/health.dao.test.ts` ping returns true), AC 2 (closed-DB throw), AC 3 (singleton interface), AC 4 (tsc clean + isolated suite green) | None |

---

## Quality Gate Decision — v2

**Gate decision: PASS with follow-ups.**

- Highest v2 risk score is 6 (NG2). Below the gate-failure threshold of 9.
- All v1 ≥6-score findings are CLOSED.
- New findings (NG1, NG2) are queued as Stories 5.12 and 5.13 — non-blocking for current production readiness.
- Epic 5's primary deployment infrastructure is unchanged; the v2 follow-ups address test-suite hygiene and discovery completeness, not deployable code.

Sprint is **releasable**. Stories 5.12 and 5.13 should be scheduled in the next available capacity window, with 5.12 prioritised over 5.13 due to its higher impact on day-to-day dev velocity.

---

## Appendix — Confidence Scores (v2)

| Assessment Area | Confidence (1-10) | Notes |
|-----------------|-------------------|-------|
| v1 closure verification | 10 | All five v1 high-priority finds verified line-by-line against code + CI + docs |
| New finding NG1 evidence | 10 | Grep-confirmed `vite.config.ts:27` include + grep-confirmed `import from 'vitest'` in the dead test file |
| New finding NG2 evidence | 9 | Four story dev records corroborate the same flake pattern; one minor confidence reduction because the flake list per run is slightly variable (13 vs 14) |
| Cross-story regression analysis | 8 | Read every Story 5.7–5.11 dev record; high-confidence pattern matches |
| NFR delta assessment | 9 | All v1 NFRs re-checked against code as it stands today |
| CI pipeline analysis | 10 | Read full `quality.yml` post-Story 5.10; correct DAG mapping |
| Risk scores | 8 | Calibrated against v1 anchors; no production telemetry to refine further |

All scores ≥7 — no stop-and-ask threshold triggered (per `confidence-gate` knowledge fragment).
