# Test Design — Epic 5: Production Deployment (Phase 4)

**Sprint:** Epic 5 Post-Sprint TEA Pass
**Date:** 2026-05-20
**Analyst:** Murat — Master Test Architect (bmad-tea)
**Scope:** Stories 5.1 through 5.6 (all done); follow-ups 5.7, 5.8, 5.9 (ready-for-dev)
**Mode:** Post-sprint — all stories completed; analysis covers gaps, cross-story risks, and next-sprint recommendations

---

## Executive Summary

Epic 5 delivered core production infrastructure: PM2 process management, domain/SSL/TLS configuration, environment variable hardening, SQLite backup automation, uptime monitoring, and mobile LCP SSG prerendering. The sprint generated 747 Vitest unit/integration tests and a Playwright E2E suite with solid coverage of functional paths.

**Overall test coverage verdict: ADEQUATE with targeted gaps.** Three high-priority gaps warrant new stories. Five medium findings are captured as actionable recommendations. Two cross-story regression risks are flagged.

**Net new stories recommended:** 2 (Stories 5.10 and 5.11).

---

## Risk Scoring Matrix

| ID | Finding | Category | Probability | Impact | Score | Disposition |
|----|---------|----------|-------------|--------|-------|-------------|
| G1 | `scripts/backup.test.mjs` never runs in CI — shell-level backup failures are invisible to quality gate | OPS | P3 | I3 | 9 | **Story 5.10** |
| G2 | `server/dao/health.dao.ts` has no unit tests — ping() failure path and return value untested at DAO level | TECH | P2 | I2 | 4 | **Story 5.11** |
| G3 | Prerender smoke test: no E2E assertion that `dist/client/index.html` contains pre-rendered hero markup before hydration | TECH | P2 | I3 | 6 | **Story 5.10** |
| G4 | `app.set('trust proxy', 1)` absent — covered by Story 5.9 (ready-for-dev); no regression risk until deployed | OPS | P2 | I2 | 4 | Covered by 5.9 |
| G5 | PM2 crash-loop guard (`max_restarts: 10`, `min_uptime: 5s`) untestable at unit level — validated by config review only | OPS | P1 | I3 | 3 | Accepted; operator runbook documents |
| G6 | `staticCacheHeaders` regex does not cover `.woff2` or `.ttf` font assets — unhashed fonts would receive no cache header | TECH | P2 | I1 | 2 | Accepted; font assets are self-hosted and served with default Express cache |
| G7 | `scripts/backup.sh` has no concurrent-run guard — two simultaneous cron invocations could produce a partial/corrupt backup | OPS | P1 | I2 | 2 | Accepted; single-server deployment makes concurrent cron collision extremely unlikely |
| G8 | Mobile LHCI run uses `vite preview` (SPA fallback), not the actual Express server with prerender output — production HTTP headers not exercised in LHCI | PERF | P2 | I2 | 4 | Story 5.10 |

**Probability scale:** P1 = Low (≤25%), P2 = Medium (26–60%), P3 = High (>60%)
**Impact scale:** I1 = Minor, I2 = Moderate, I3 = Significant
**Score = P × I (1–9); ≥6 requires documented mitigation; =9 mandates gate failure**

---

## Cross-Story Coverage Analysis

### 5.1 × 5.6 — Build Pipeline Regression Risk

Story 5.6 extended the `npm run build` script to append the prerender step (`node_modules/.bin/tsx ... scripts/prerender.tsx`). Story 5.1's `ecosystem.config.js` assumes `dist/server/index.js` is the build output. The Vitest suite runs without executing `npm run build`, so a broken prerender step would not fail unit CI — only the LHCI job (which runs `npm run build` as its `startServerCommand`) would catch it. This gap is partially covered by LHCI but LHCI is not blocked on the unit job in the current CI DAG.

**Risk:** MEDIUM. Mitigation already partially in place (Story 5.8 will add type-checking; LHCI runs on every push). No new story required beyond 5.8.

### 5.2 × 5.9 — HSTS + Trust Proxy Ordering

Story 5.2's HSTS Helmet config sits before the trust proxy call (which is not yet implemented — Story 5.9). Express `req.secure` is only accurate after `app.set('trust proxy', 1)`. The HSTS Helmet middleware uses `req.secure` internally to determine whether to set the header on HTTP responses. Without trust proxy, behind a TLS-terminating proxy, `req.secure` is always `false` — Helmet may not emit HSTS on some paths.

**Risk:** LOW in practice (Helmet's HSTS is unconditional when `hsts.maxAge` is set; it does not gate on `req.secure`). Verify Helmet docs confirm unconditional HSTS before Story 5.9 ships. Add a comment to the relevant test in `server/index.test.ts`.

### 5.3 × 5.5 — `NOTIFY_EMAIL` Env Var Validation Coverage

Story 5.3 validates all 9 required env vars including `NOTIFY_EMAIL`. Story 5.5's health check documents that UptimeRobot should alert to `NOTIFY_EMAIL`. The env validation correctly blocks startup if `NOTIFY_EMAIL` is absent — good coverage, no gap.

### 5.4 × 5.1 — Backup Script Assumes Cron, Not PM2 Integration

Story 5.4's backup runs via cron, entirely outside the PM2 process lifecycle. This is correct architecture but means PM2's `max_restarts` / crash recovery has no interaction with the backup schedule. No coverage gap — the isolation is intentional.

### 5.6 × 5.2 — Prerender HTML Served Without Production HTTP Headers

The `vite preview` server used in LHCI does not replicate the Express production server's `Cache-Control`, `Strict-Transport-Security`, and `X-Content-Type-Options` headers. The LHCI performance scores are valid (they measure frontend rendering), but best-practices scores around security headers may differ from production. This is an existing structural gap in the LHCI setup that predates Epic 5.

---

## Story-by-Story Coverage Audit

### Story 5.1 — Production Build & PM2 Process Management

**Coverage status: GOOD**

| Test type | Coverage | Files |
|-----------|----------|-------|
| Unit — `staticCacheHeaders` | 6 tests, all paths covered | `server/index.test.ts` |
| Unit — Cache-Control hashed asset variants | JS, CSS, WebP all tested | `server/index.test.ts` |
| Unit — Cache-Control unhashed files | og-default.png, robots.txt tested | `server/index.test.ts` |
| Unit — index.html no-cache + HTTP/1.0 Pragma/Expires | Tested | `server/index.test.ts` |
| Integration — `npm run build` clean exit | Validated at implementation time | — |
| E2E — none required | Correct; cache headers are production-only, not exercised in dev/E2E | — |

**Gaps:**
- PM2 runtime behaviors (auto-restart ≤5s, `pm2 startup` persistence) are infrastructure-level and cannot be tested with Vitest/Playwright. Operator runbook documents manual validation. Accepted.
- No test covers the `fs.existsSync(clientDir)` guard path — confirmed intentional defensive code; low risk.

**Verdict: No new tests required.**

### Story 5.2 — Domain Configuration & SSL/TLS

**Coverage status: GOOD**

| Test type | Coverage | Files |
|-----------|----------|-------|
| Unit — HTTP→HTTPS redirect (production mode) | 301 on http, pass-through on https/absent | `server/index.test.ts` |
| Unit — No redirect in test/dev | Tested | `server/index.test.ts` |
| Unit — HSTS in production | maxAge, includeSubDomains, preload all asserted | `server/index.test.ts` |
| Unit — No HSTS in dev/test | Tested | `server/index.test.ts` |
| Unit — CORS exact origin | Tested | `server/index.test.ts` |
| Unit — CORS preflight OPTIONS | Tested, try/finally restored | `server/index.test.ts` |
| Unit — CORS no wildcard | Tested for foreign origins | `server/index.test.ts` |
| Docs — deployment-runbook.md | Present with HSTS preload caveat section | `docs/deployment-runbook.md` |

**Gaps:**
- No E2E test verifies the `Location` header value on a live HTTP→HTTPS redirect. Acceptable — redirect fires at the network layer and cannot be exercised in the Playwright dev-server environment. LHCI would catch a missing redirect by reporting HTTP 301 on the root URL.
- `trust proxy 1` absence (G4) covered by Story 5.9.

**Verdict: No new tests required beyond Story 5.9.**

### Story 5.3 — Environment Variable Hardening

**Coverage status: EXCELLENT**

| Test type | Coverage | Files |
|-----------|----------|-------|
| Unit — all 9 vars present → no exit | Tested | `server/env-validation.test.ts` |
| Unit — JWT_SECRET length enforcement (≥32 after trim) | Tested with boundary values (31, 32, whitespace-padded) | `server/env-validation.test.ts` |
| Unit — missing single var → exit 1 + key name logged | Tested | `server/env-validation.test.ts` |
| Unit — missing multiple vars → exit 1 | Tested | `server/env-validation.test.ts` |
| Unit — empty string and whitespace-only vars | Tested | `server/env-validation.test.ts` |
| Unit — REQUIRED_ENV_VARS exhaustive loop | All 9 vars individually tested | `server/env-validation.test.ts` |
| Unit — secret value never logged | Sentinel approach tested | `server/env-validation.test.ts` |
| Static — `VITE_` secret prefix scan | Tested in `server/index.test.ts` | `server/index.test.ts` |
| Static — bundle secret scan | `npm run check:client-bundle-secrets` | `scripts/check-client-bundle-secrets.mjs` |

**Gaps:** None significant. The `require.main === module` guard for the `validateEnv()` call is correctly verified by the test architecture (tests import `createApp` without triggering the guard). No new tests required.

**Verdict: No new tests required.**

### Story 5.4 — SQLite Backup Automation

**Coverage status: ADEQUATE — critical CI gap identified (G1)**

| Test type | Coverage | Files |
|-----------|----------|-------|
| Integration — happy path backup creation | Tested | `scripts/backup.test.mjs` |
| Integration — 30-day retention pruning | Tested with `touch -d "31 days ago"` | `scripts/backup.test.mjs` |
| Integration — missing DB → exit 1 + stderr ERROR | Tested | `scripts/backup.test.mjs` |
| CI coverage | **MISSING** — `npm run test:backup` is NOT in `.github/workflows/quality.yml` | — |

**Critical gap (G1, score 9):** `scripts/backup.test.mjs` is a standalone Node.js script executed via `npm run test:backup`. The CI pipeline (`quality.yml`) runs `npm run test:run` (Vitest) and `npm run test:e2e` (Playwright) but does NOT run `npm run test:backup`. This means the backup script can regress silently — a broken `backup.sh` would not block a merge or deploy.

**Secondary gap (G8 crossover):** No test simulates the `find -delete || true` error path added in the code review (M1 patch). The `|| true` prevents a false-negative failure signal but the amended behavior has no coverage. Low priority since the backup itself succeeds at that point.

**Verdict: Story 5.10 should add `npm run test:backup` to CI.**

### Story 5.5 — Uptime Monitoring & Health Check

**Coverage status: GOOD**

| Test type | Coverage | Files |
|-----------|----------|-------|
| Unit — GET /api/health → 200 + shape | Tested | `server/routes/health.test.ts` |
| Unit — No auth required | Tested | `server/routes/health.test.ts` |
| Unit — DB failure → 503 + db_unavailable | Tested with `vi.doMock`, try/finally patched | `server/routes/health.test.ts` |
| Unit — Timing budget (< 150ms) | Tested | `server/routes/health.test.ts` |
| Integration — health route mounted | Tested in `server/index.test.ts` | `server/index.test.ts` |

**Gap (G2):** `server/dao/health.dao.ts` exports `createHealthDao` and `healthDao` singleton. There are no dedicated unit tests for the DAO itself. The `health.test.ts` covers the DAO indirectly via the route, but a dedicated DAO test would:
1. Confirm `ping()` returns `true` on a live DB.
2. Confirm `ping()` throws when called on a closed DB.
3. Document the `createHealthDao(database)` factory pattern for future maintainers.

**Risk score: 4 (P2 × I2).** Medium priority — route tests provide indirect coverage, but the DAO has no isolated test harness. Assigned to Story 5.11.

**Verdict: Story 5.11 adds `server/dao/health.dao.test.ts`.**

### Story 5.6 — Mobile LCP SSG / Prerender Hero

**Coverage status: ADEQUATE — prerender output validation gap identified (G3)**

| Test type | Coverage | Files |
|-----------|----------|-------|
| Unit — full Vitest suite unaffected | 747 tests pass | — |
| E2E — hero rendering, LCP image visible | Tested | `tests/e2e/hero.spec.ts` |
| E2E — hydration: locale switch, scroll-to-CTA | Tested at smoke level via `tests/e2e/smoke.spec.ts` | — |
| Performance — LHCI 3-run mobile median | LCP 2,259ms, FCP 1,659ms, TBT 75ms, CLS 0.000, Perf 98% | `_bmad-output/implementation-artifacts/story-5-6-lhci-report-2026-05-20/` |
| Build output validation | Ad-hoc in dev agent record; `heroPresent` + `picturePresent` gate in prerender.tsx | `scripts/prerender.tsx` |

**Gap (G3, score 6):** No automated test verifies that `dist/client/index.html` contains pre-rendered hero markup after `npm run build`. The `prerender.tsx` script has internal sanity checks (`heroPresent` causes `process.exit(1)`) but these only run during the build step. There is no Vitest test or CI artifact assertion that reads the built HTML and verifies prerendered content is present. If the prerender step silently degrades (e.g., a React component change causes an empty render), LHCI is the only safety net — and LHCI only runs the lighthouse jobs, not as a blocking step for the unit job.

**Gap (G8, score 4):** The LHCI `startServerCommand` uses `vite preview`, not the actual Express server. Production security headers (`Cache-Control: max-age=31536000, immutable`, `Strict-Transport-Security`) are NOT exercised during LHCI runs. Best-practices scores may differ in production.

**Verdict: Story 5.10 should add a CI build-output smoke test that verifies `dist/client/index.html` contains the prerendered `<h1>` and `<picture>` elements after `npm run build`.**

---

## NFR Coverage Assessment

### Security (S)

| NFR | Coverage | Status |
|-----|----------|--------|
| S1 — Secrets never in client bundle | `check:client-bundle-secrets` script + Vitest assertion | PASS |
| S2 — JWT_SECRET entropy enforced at startup | `env-validation.ts` + 11 unit tests | PASS |
| S3 — CORS restricted to `ALLOWED_ORIGIN`, no wildcard | 4 unit tests | PASS |
| S4 — HSTS in production | Unit test verifies max-age, includeSubDomains, preload | PASS |
| S5 — HTTP→HTTPS redirect in production | Unit test verifies 301 | PASS |
| S6 — Admin routes require auth | Unit test verifies 401 without cookie | PASS |
| S7 — Rate limiting per IP | Tested in `server/index.test.ts` and `tests/e2e/security-hardening.spec.ts` | PASS |
| S8 — `trust proxy` for accurate req.ip in rate limiting | Not yet implemented (Story 5.9) | OPEN |

**S8 status:** Story 5.9 is `ready-for-dev` and directly addresses this gap. No new story needed.

### Performance (P)

| NFR | Coverage | Status |
|-----|----------|--------|
| P1 — Hashed assets: Cache-Control immutable, 1-year | 4 unit tests | PASS |
| P2 — index.html: Cache-Control no-cache | 1 unit test | PASS |
| P3 — Mobile LCP < 2,500ms | LHCI 3-run: 2,259ms median | PASS |
| P4 — Mobile FCP < 2,000ms | LHCI 3-run: 1,659ms median | PASS |
| P5 — Mobile TBT < 200ms | LHCI 3-run: 75ms median | PASS |
| P6 — /api/health < 200ms | Unit test (< 150ms budget) | PASS |
| P7 — /api/demo p95 ≤ 3s under load | Load test via autocannon documented; not automated in CI | INFO |

**P7 note:** Autocannon load testing is documented in `docs/monitoring-setup.md` as a manual pre-deploy verification step, per AC 4 of Story 5.5. Automating p95 performance gates in CI is a meaningful enhancement but was explicitly out of scope for Epic 5. No new story recommended at this time — this is a natural Epic 6 / Epic 7 backlog item.

### Reliability (R)

| NFR | Coverage | Status |
|-----|----------|--------|
| R1 — PM2 auto-restart (autorestart: true) | Config review; cannot unit-test without PM2 | ACCEPTED |
| R2 — PM2 crash-loop guard (max_restarts: 10, min_uptime: 5s) | Config review only | ACCEPTED |
| R3 — Backup on schedule with retention | 3 integration tests | PASS (CI gap: G1) |
| R4 — DB liveness probe (503 on DB failure) | Unit test | PASS |
| R5 — Health check publicly accessible | Unit test (no auth required path) | PASS |
| R6 — PM2 startup persistence | Operator runbook step; not automatable | ACCEPTED |

### Maintainability (M)

| NFR | Coverage | Status |
|-----|----------|--------|
| M1 — Scripts/ TypeScript type coverage | Not in typecheck (Story 5.8 open) | OPEN |
| M2 — `validateEnv` startup guard keeps index.ts clean | Verified by import path and test isolation | PASS |
| M3 — No raw SQL in route handlers | Static test in `server/index.test.ts` | PASS |
| M4 — Deployment runbook accurate and complete | Docs present; HSTS preload caveat added in review | PASS |
| M5 — Backup cron documentation | `docs/backup-cron-setup.md` present | PASS |

---

## CI Coverage Assessment

### Current CI Pipeline (`quality.yml`)

```
push/PR
  └── unit (parallel)              ✓ lint, typecheck, test:run
  └── e2e (after unit)             ✓ playwright test
  └── lighthouse (after unit)      ✓ lhci (desktop), lhci:mobile
```

### Gaps in CI

| Gap | Severity | Action |
|-----|----------|--------|
| `npm run test:backup` not in CI | HIGH | Story 5.10 |
| `scripts/prerender.tsx` excluded from typecheck | HIGH | Story 5.8 (ready-for-dev) |
| LHCI uses `vite preview` not Express server | MEDIUM | Story 5.10 (optional enhancement, scope-limited) |
| No build-output smoke test for prerender HTML | MEDIUM | Story 5.10 |
| `lighthouse` job does not block `e2e` job | LOW | Acceptable DAG — lighthouse is informational gate |
| No shard/parallel strategy for Playwright | LOW | Small suite — not needed at current scale |

### CI Script Injection Safety

The `quality.yml` workflow does not use `${{ inputs.* }}` or user-controlled `github.event.*` values in `run:` blocks. The `LHCI_GITHUB_APP_TOKEN` is correctly passed via `env:` using `${{ secrets.* }}`. No injection vulnerabilities found.

---

## Recommendations Summary

### Actionable — New Stories Needed

#### Story 5.10 — CI Quality Gate Completeness for Epic 5 Build Artifacts

**Cluster of findings: G1, G3, G8**

**Rationale:** Three related CI coverage gaps share a common theme — build-output and build-adjacent scripts are untested in the quality gate. A single story can address all three with targeted, low-cost changes:

1. Add `npm run test:backup` as a step in the `unit` job in `.github/workflows/quality.yml` (G1 — score 9, highest-priority finding in this sprint). Backup script regressions are currently invisible to CI.
2. Add a Vitest test (or Node.js build-smoke script in `scripts/`) that runs `npm run build` and inspects `dist/client/index.html` to assert the prerendered `<h1>` text and `<picture>` element are present before the React `<script>` tags (G3 — score 6). This test should be tagged `@build-smoke` and run in CI after the standard test:run step, or added to a dedicated `test:build` npm script.
3. (Optional, lower priority) Document in `docs/deployment-runbook.md` the discrepancy between LHCI's `vite preview` environment and the production Express server for security-header testing (G8 — score 4). No code change required; docs-only.

**Priority:** P1 (G1 alone scores 9 — threshold for mandatory gate failure).

**Jira sync:** Deferred (OAuth unavailable). Note in story file.

#### Story 5.11 — Health DAO Unit Tests

**Rationale:** `server/dao/health.dao.ts` is the only DAO in `server/dao/` without dedicated unit tests (G2 — score 4). The DAO is simple but untested directly. A dedicated `server/dao/health.dao.test.ts` with 3–4 tests (happy path ping, closed DB throws, factory pattern) would close the coverage gap and establish consistent testing discipline across all DAO files.

**Priority:** P2.

**Jira sync:** Deferred (OAuth unavailable). Note in story file.

### Accepted Findings (No New Story)

| ID | Finding | Rationale for acceptance |
|----|---------|--------------------------|
| G4 | Trust proxy absent | Covered by Story 5.9 (ready-for-dev) |
| G5 | PM2 crash-loop untestable | Infrastructure-level; runbook documents manual validation |
| G6 | Font assets no cache header | Low risk; fonts are self-hosted, serving under Express defaults |
| G7 | No concurrent-run guard in backup script | Single-server; cron collision probability negligible |
| P7 | No automated p95 performance gate | Explicit out-of-scope per Story 5.5 AC 4; documented manual step |

---

## Traceability Summary

| Story | AC covered by tests | Gaps |
|-------|---------------------|------|
| 5.1 | AC 1 (build), AC 2 (ecosystem.config review), AC 3 (unit: Cache-Control), AC 4 (runbook), AC 5 (unit: 6 tests) | AC 2/3/4 PM2 runtime untestable |
| 5.2 | AC 1 (redirect × 3 unit tests), AC 2 (HSTS unit × 2), AC 3 (CORS × 4 unit tests), AC 4 (runbook docs) | trust proxy (Story 5.9) |
| 5.3 | AC 1 (.env.example docs), AC 2 (secret scan script), AC 3 (11 env validation unit tests), AC 4 (.gitignore confirmed) | None |
| 5.4 | AC 1 (integration: backup created), AC 2 (integration: retention), AC 3 (gitignore + path check), AC 4 (integration: exit 1 + stderr) | **CI gap: test never runs in quality.yml** |
| 5.5 | AC 1 (4 health route unit tests), AC 2+3 (monitoring docs), AC 4 (autocannon docs) | DAO-level tests missing |
| 5.6 | AC 1 (prerender.tsx sanity check), AC 2+3 (LHCI 3-run evidence), AC 4 (Vitest 747 pass), AC 5 (ADR written), AC 6 (zero bundle impact), AC 7 (6.13 amended) | No post-build HTML assertion in CI |

---

## Quality Gate Decision

**Gate decision: CONDITIONAL PASS**

The sprint is releasable with the following conditions:

1. **Before next deploy:** Stories 5.7, 5.8, 5.9 are already queued as `ready-for-dev`. These address cluster mode architecture, prerender type coverage, and trust proxy — all non-blocking for the current single-worker deployment but should ship before a multi-server or CDN topology is adopted.

2. **Story 5.10 (CI backup gate):** The G1 finding scores 9 — the highest risk level. `npm run test:backup` must be added to CI before the next sprint that touches `scripts/backup.sh` or changes the database path. Until then, backup regressions are invisible.

3. **Story 5.11 (Health DAO tests):** Medium priority, non-blocking for deploy.

---

## Appendix — Confidence Scores

| Assessment Area | Confidence (1-10) | Notes |
|-----------------|-------------------|-------|
| Unit test coverage completeness | 9 | Read all test files; full picture |
| E2E coverage completeness | 8 | Read all specs; minor prerender gap |
| CI pipeline analysis | 9 | Read quality.yml in full |
| NFR assessment (security) | 9 | Read server/index.ts + test files |
| NFR assessment (performance) | 8 | LHCI reports reviewed via dev agent record |
| Backup script coverage | 9 | Read backup.sh + backup.test.mjs |
| Risk scores | 8 | Based on code review; no production runtime data |

All scores ≥7 — no stop-and-ask rule triggered (threshold: <7 requires clarification before generating recommendations).
