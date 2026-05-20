# Story 5.12: Stabilize Pre-Existing Vitest Flakes

**Epic:** 5 — Production Deployment (Phase 4)
**Status:** done
**Origin:** Epic 5 Post-Sprint TEA v2 pass (2026-05-20) — finding NG2 (risk score 6)
**Jira sync:** Synced 2026-05-20. Parent: **SYN-477** ("To Do"). Sub-tasks: SYN-479 (Task 1, fake timers), SYN-480 (Task 2, findBy*), SYN-481 (Task 3, 3 green runs), SYN-482 (Task 4, doc trail), SYN-483 (Task 5, final verification) — all at "To Do".

---

## Story

As the engineer responsible for the Vitest suite,
I want the pre-existing flakes in `server/routes/admin/auth.test.ts` (Story 4.7 throttling tests) and `src/pages/Home*.test.tsx` (RTL `waitFor` timeouts) to be eliminated,
So that full `npm run test:run` invocations exit 0 deterministically and no future story dev record needs an "in isolation, this passes" caveat.

---

## Context

The Epic 5 post-sprint TEA v2 pass identified that **every** Epic 5 story dev record from 5.7 onward documents the same anomaly during full `npm run test:run`:

| Source | Failures | Cause documented |
|---|---|---|
| Story 5.7 | flaky admin-auth + home-e2e suites | not pinned |
| Story 5.8 | 14 timeouts in `server/routes/admin/auth.test.ts` (Story 4.7 throttling/lockout) | throttling timing |
| Story 5.10 | 13 timeouts in 4.7 throttling + Home RTL `waitFor` | timing + slow runners |
| Story 5.11 | 14 timeouts in `server/routes/admin/team.test.ts`; passes in isolation in 8.48s | Vitest CPU contention |

The flakes pre-date Epic 5. Story 4.7 introduced the auth throttling/lockout tests on 2026-05-16; the Home RTL tests are even older. Epic 5 retro Action Item C1 added a *process* fix (PR-checklist for `try/finally` cleanup discipline), but the **existing** flaky tests have no remediation story — until this one.

TEA v2 scored this NG2: P3 (>60% observed recurrence) × I2 (moderate — masks signal, slows velocity, no production breakage yet) = 6. ≥6 requires documented mitigation.

---

## Acceptance Criteria

### AC 1 — Auth Throttling Tests Use Fake Timers (Story 4.7 suite)

- Every test in `server/routes/admin/auth.test.ts` that asserts a time-based throttling, lockout, or retry-after behaviour uses `vi.useFakeTimers()` and `vi.advanceTimersByTime()` instead of real `setTimeout` or wall-clock waits.
- Tests that previously relied on real elapsed time complete in < 100ms each.
- The throttling/lockout assertions remain semantically equivalent — no AC coverage from Story 4.7 is regressed.

### AC 2 — Home RTL Tests Use `findBy*` Queries

- Every assertion in `src/pages/Home.test.tsx`, `src/pages/Home.section.test.tsx`, and any other `src/pages/Home*.test.tsx` file that currently uses `waitFor(() => ..., { timeout: N })` is replaced with the corresponding `findBy*` query (e.g., `await screen.findByRole('heading', ...)`) or with `await screen.findByText(...)` where appropriate.
- Where an async path has unavoidable I/O (e.g., dynamic import of a translation file) and `findBy*` is insufficient, the Vitest test-level timeout is raised explicitly with an inline comment naming the root cause.
- The semantic coverage (every element previously asserted is still asserted) is preserved.

### AC 3 — Full Test Suite Green for Three Consecutive Runs

- `npm run test:run` exits 0 against the touched files on at least three consecutive runs.
- No "passes in isolation" caveat is required in any subsequent story dev record.
- CI's `unit` job goes green on the resulting PR.

### AC 4 — Documentation Trail

- Each touched test file gains an inline comment near the top: `// Patterns updated by Story 5.12 — see _bmad-output/test-artifacts/test-design/test-design-epic-5-v2.md`.
- `_bmad-output/test-artifacts/test-design/test-design-epic-5-v2.md` NG2 section is referenced so future maintainers know why the patterns changed.

### AC 5 — No Regression in Source Code

- Zero changes in `server/` or `src/` outside the test files themselves.
- No production code modification — this is a pure test-stability story.
- `npx tsc --noEmit && npx tsc --noEmit --project tsconfig.scripts.json` exits 0.

---

## Tasks / Subtasks

- [x] Task 1 — Audit and rewrite Story 4.7 auth throttling tests (AC: 1)
  - [x] Grep `server/routes/admin/auth.test.ts` for `setTimeout`, `Date.now`, real-clock dependencies
  - [x] Replace with `vi.useFakeTimers()` + `vi.advanceTimersByTime()` per Vitest fake-timers docs
  - [x] Verify each test runs in < 100ms locally (`vitest run --reporter=verbose`)
  - [x] Re-run touched file 3× in isolation to confirm determinism

- [x] Task 2 — Audit and rewrite Home RTL tests (AC: 2)
  - [x] Grep `src/pages/Home*.test.tsx` for `waitFor(`, identify each usage
  - [x] Replace with `findBy*` queries where the assertion is "wait until element appears"
  - [x] Where `findBy*` is insufficient, document the reason inline and raise the test-level timeout explicitly
  - [x] Re-run touched files 3× in isolation to confirm determinism

- [x] Task 3 — Full-suite verification (AC: 3)
  - [x] Run `npm run test:run` three consecutive times locally; all exit 0
  - [ ] Push branch; verify CI `unit` job goes green *(deferred — main thread handles push/PR)*
  - [ ] Re-trigger the workflow once via `gh workflow run quality.yml` to confirm a third green pass *(deferred — main thread)*

- [x] Task 4 — Documentation trail (AC: 4)
  - [x] Add the inline reference comment to each touched test file
  - [x] Optionally add a one-paragraph note to `vault/Code/Backend.md` and `vault/Code/Frontend.md` flagging the pattern change

- [x] Task 5 — Final verification (AC: 5)
  - [x] Confirm `git diff --stat` shows only test-file modifications (no `src/` or `server/` source touched)
  - [x] `npm run typecheck` exits 0
  - [x] All linters pass

---

## Dev Notes

### Fake Timer Pattern (Vitest)

```ts
import { vi, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('locks the account after N failed attempts within the window', async () => {
  // ...failed login attempts...
  vi.advanceTimersByTime(60_000) // skip to "60 seconds later" deterministically
  // ...assert unlock or remain-locked...
})
```

### `findBy*` Pattern (Testing Library)

```ts
// Before:
await waitFor(() => {
  expect(screen.getByRole('heading', { name: /more commission/i })).toBeInTheDocument()
}, { timeout: 5_000 })

// After:
await screen.findByRole('heading', { name: /more commission/i })
```

`findBy*` queries retry until the element appears or the default 1-second timeout elapses. They are deterministic in CI because they read the rendered DOM after every React effect flush, rather than racing a polling interval.

### Why This Is Not a Process-Only Fix

The Epic 5 retro Action Item C1 added a process discipline (`try/finally` cleanup on tests that mutate `process.env` or call `vi.doMock`). That is a forward-looking fix. The flakes in `server/routes/admin/auth.test.ts` and `src/pages/Home*.test.tsx` predate Action Item C1 and use a different anti-pattern (real-clock-dependent assertions and `waitFor` with long timeouts). They need their own code-level fix.

---

## File Structure Requirements

| File | Change type | Notes |
|------|-------------|-------|
| `server/routes/admin/auth.test.ts` | UPDATE | Fake timers + < 100ms per test |
| `src/pages/Home.test.tsx` | UPDATE | `waitFor` → `findBy*` |
| `src/pages/Home.section.test.tsx` | UPDATE | `waitFor` → `findBy*` |
| (any other `src/pages/Home*.test.tsx`) | UPDATE | as needed |

No source files in `server/` (outside `__tests__`) or `src/components` should be modified. If the audit reveals a genuine race condition in production code, surface it as a separate finding — do not fix it under this story.

---

## Testing Requirements

- All touched test files individually pass in < 5 seconds.
- `npm run test:run` exits 0 with the full suite — no "13/14 failing" line in the output.
- The change does not alter Vitest's reported test count by more than ±2 (legitimate consolidation OK; large-scale deletion is a red flag).

---

## Out of Scope

- Refactoring the underlying production code (auth route, Home page).
- Adding new test coverage — this story is purely test-stability, not coverage expansion.
- Migrating from Vitest to a different test runner.

---

## Dev Agent Record

### Implementation Plan

The story's AC1 wording (replace `setTimeout` / wall-clock waits with `vi.useFakeTimers()` + `vi.advanceTimersByTime()`) anticipated the wrong root cause. The Story 4.7 throttling suite never used `setTimeout` directly. The real cost driver was `bcrypt.compareSync` at cost factor 12 (~250-300ms per call) being invoked for every login attempt — including the timing-parity dummy compare on every wrong-password path. Five-to-six attempts per throttling test stacked to 1.5-2.5s each; a baseline `vitest run server/routes/admin/auth.test.ts` measured 21.64s wall time across 22 tests. Under full-suite CPU contention this drifted past the 5s per-test default and produced the 13-14 timeout rows every Epic 5 dev record documented.

Two-pronged fix that honours both AC1 letter and intent:

1. **Mock `bcryptjs` module-wide inside `server/routes/admin/auth.test.ts`** with a deterministic constant-time stub (`hashSync` wraps plaintext in a marker; `compareSync` checks the marker matches). Preserves the only semantic property the auth route relies on — correct plaintext matches its hash, anything else does not — while eliminating the per-call CPU cost. The mock survives the `vi.resetModules()` call inside `createIsolatedApp()`.
2. **Replace `Date.now() - 16*60*1000` wall-clock arithmetic with `vi.useFakeTimers()` + `vi.setSystemTime()` + `vi.advanceTimersByTime(16 * 60 * 1000)`** inside the two tests that exercise lockout-window expiry. Wrapped in `try/finally` so `vi.useRealTimers()` is restored even on assertion failure. The DAO accepts a `now` parameter and uses `Date.parse()` against stored ISO strings, so controlling the system clock is sufficient — no need to fake any setTimeout.

For Home RTL tests, the fix is what AC2 specifies — every `waitFor(() => expect(document.querySelector('#section-id')).toBeInTheDocument())` becomes `await screen.findByRole('region', { name: '<aria-label>' }, { timeout: 5000 })`. Each Home section already exposes a `role="region"` (or implicit region via `aria-labelledby` on `<section>`) with a stable aria-label resolved through i18n. The 5s ceiling stays explicit because Home wraps every section in `React.lazy` + `Suspense` (chunk import time can exceed RTL's 1s default under CPU contention) — documented inline per AC2.

### Deviation from AC1

AC1 prescribes `vi.useFakeTimers()` + `vi.advanceTimersByTime()` as if the throttling tests used `setTimeout`. They did not. The literal AC1 letter ("Replace with `vi.useFakeTimers()` + `vi.advanceTimersByTime()` per Vitest fake-timers docs") IS satisfied — the two tests that synthesised an elapsed window now drive fake timers per the docs — but the dominant performance fix is the bcrypt mock, which AC1 does not anticipate. The < 100ms-per-test threshold is satisfied for every throttling/lockout test (measured 13-21ms each after the change; previously 700-2500ms). The throttling/lockout semantics from Story 4.7 are unchanged — the dummy bcrypt compare still runs for timing-parity, just constant-time.

### Findings for separate stories

None. No production-code bug surfaced during the test audit. The auth route's `DUMMY_PASSWORD_HASH` constant remains a real bcrypt $2b$12 hash (the mock's `compareSync` correctly returns `false` for it, which is the route's intent). The DAO's `Date.parse(row.last_failed_at.replace(' ', 'T') + 'Z')` round-trip is sound. Home page's lazy-loaded sections are working as designed — the test fragility was purely on the RTL side.

### Completion Notes

- `server/routes/admin/auth.test.ts` — bcryptjs mocked module-wide; two "16 min ago" tests now drive fake timers via `vi.setSystemTime()` + `vi.advanceTimersByTime()` inside `try/finally`. Per-test runtimes dropped from 700-2500ms to 13-21ms (well under the 100ms AC1 threshold). File total: 21.64s → 1.22s in isolation. 22/22 pass.
- `src/pages/Home.test.tsx` — every `waitFor` for section presence replaced with `findByRole('region', { name }, { timeout: 5000 })`. `container` no longer destructured (use `screen` exclusively).
- `src/pages/Home.story-1-7.e2e.test.tsx` — replaced one `waitFor` for `#security` with `findByRole('region', { name: 'Your Data is Protected' })`.
- `src/pages/Home.story-1-8.e2e.test.tsx` — replaced two `waitFor` blocks for `#clientes` and `#agendar-demo`; added `lazySectionWait = { timeout: 5000 }` constant; extended both pre-existing team `findByRole` calls to use the same 5s ceiling.
- `src/pages/Home.story-1-9.e2e.test.tsx` — replaced one `waitFor` for `#agendar-demo`.
- `src/pages/Home.story-2-4.e2e.test.tsx` — replaced four `waitFor` blocks (`#hero`, `#agendar-demo`, twice). Hero uses `findByRole('region', { name: /More commission per ticket.*Less rework at the rate desk/ })` since the implicit region's accessible name is the rendered h1 text.
- Every touched file gained the AC4 doc-trail comment near the top referencing `_bmad-output/test-artifacts/test-design/test-design-epic-5-v2.md`.
- Vault notes added: `vault/Code/Backend.md` (Story 5.12 row in the per-story file map) and `vault/Code/Frontend.md` (note appended to the "Unit / jsdom (Vitest)" section under Testing Infrastructure).
- Full suite (`npm run test:run`) ran green 3 consecutive times (766/766 pass, exit 0; durations 36.35s / 37.71s / 44.78s). After the run that exposed the missing `lazySectionWait` on the Home.test.tsx queries, the explicit 5s timeout was re-added and the three-run determinism check repeated cleanly.
- `npm run typecheck` exits 0.
- ESLint emits 6 warnings of the form `File ignored because no matching configuration was supplied` for the touched test files — these are pre-existing project-config gaps (the test files were never in the ESLint config to begin with), not introduced by this story. Zero errors.

### Verification commands

```
# Isolation runs
npx vitest run server/routes/admin/auth.test.ts --reporter=verbose
# Tests  22 passed (22); Duration 1.22s
npx vitest run src/pages/Home.test.tsx src/pages/Home.story-1-6.e2e.test.tsx src/pages/Home.story-1-7.e2e.test.tsx src/pages/Home.story-1-8.e2e.test.tsx src/pages/Home.story-1-9.e2e.test.tsx src/pages/Home.story-2-4.e2e.test.tsx --reporter=verbose
# Tests  14 passed (14); Duration 4.57s

# Three-run determinism
for i in 1 2 3; do npm run test:run; done
# Run 1: Tests 766 passed (766); 36.35s
# Run 2: Tests 766 passed (766); 37.71s
# Run 3: Tests 766 passed (766); 44.78s

# Typecheck
npm run typecheck
# exit 0
```

---

## File List

- `server/routes/admin/auth.test.ts` (UPDATE)
- `src/pages/Home.test.tsx` (UPDATE)
- `src/pages/Home.story-1-7.e2e.test.tsx` (UPDATE)
- `src/pages/Home.story-1-8.e2e.test.tsx` (UPDATE)
- `src/pages/Home.story-1-9.e2e.test.tsx` (UPDATE)
- `src/pages/Home.story-2-4.e2e.test.tsx` (UPDATE)
- `vault/Code/Backend.md` (UPDATE — Story 5.12 row added)
- `vault/Code/Frontend.md` (UPDATE — note appended to Vitest testing-infrastructure section)
- `vault/Planning/Epics-Index.md` (UPDATE — Story 5.12 subtask boxes ticked)
- `_bmad-output/implementation-artifacts/5-12-stabilize-pre-existing-vitest-flakes.md` (UPDATE — Tasks/Subtasks, Dev Agent Record, File List, Change Log, Status)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (UPDATE — flip `ready-for-dev` → `in-progress` → `review`)

---

## Change Log

- 2026-05-20 — Mocked `bcryptjs` module-wide in `server/routes/admin/auth.test.ts` with a deterministic constant-time stub; replaced wall-clock arithmetic in the two lockout-window-expiry tests with `vi.useFakeTimers()` + `vi.setSystemTime()` + `vi.advanceTimersByTime()`. Per-test runtimes dropped from 700-2500ms to 13-21ms.
- 2026-05-20 — Replaced every `waitFor(() => expect(document.querySelector('#section-id')).toBeInTheDocument())` in `src/pages/Home*.test.tsx` with `await screen.findByRole('region', { name: '<aria-label>' }, { timeout: 5000 })`. Added documented `lazySectionWait` constants where helpful.
- 2026-05-20 — Added inline doc-trail comments referencing `_bmad-output/test-artifacts/test-design/test-design-epic-5-v2.md` to every touched test file (AC4).
- 2026-05-20 — Vault notes appended to `vault/Code/Backend.md` (Story 5.12 entry) and `vault/Code/Frontend.md` (Vitest testing-infrastructure section).
- 2026-05-20 — Three-consecutive-run determinism confirmed locally: `npm run test:run` exited 0 with 766/766 passing on every attempt. `npm run typecheck` exits 0.

---

## Status

done

---

## Review

### 2026-05-20 — Code Review (Adversarial, bmad-code-review skill)

**Gate verdict: PASS.** Three independent review layers (Blind Hunter on diff only, Edge Case Hunter on diff + project, Acceptance Auditor on diff + story spec) produced zero non-dismissed findings. Two cosmetic observations were dismissed as noise (no `DUMMY_PASSWORD_HASH`-returns-false explicit assertion under the mock; `Home.story-1-7.e2e.test.tsx` keeps a pre-existing inline `{ timeout: 6000 }` rather than adopting the new `lazySectionWait = { timeout: 5000 }` constant used in the other Home suites — pre-existing, out of story scope).

Per-AC outcome:

- **AC1 (auth fake timers, < 100ms per test, no Story 4.7 regression):** PASS. `npx vitest run server/routes/admin/auth.test.ts` 22/22 pass in 1.41s wall time; both lockout-window-expiry tests now drive `vi.useFakeTimers()` + `vi.setSystemTime()` + `vi.advanceTimersByTime(16 * 60 * 1000)` inside `try/finally` (reviewer-confirmed). The two refactored assertions measured 16-18ms in the verbose reporter. The bcrypt module-scope mock is deterministic and constant-time, and `compareSync(plaintext, DUMMY_PASSWORD_HASH)` correctly returns `false` because the real `$2b$12$...` hash string does not match the stub's `${MARKER}$${plaintext}` shape — preserving the route's dummy-compare intent (always-fails). The timing-parity property the route comments document is moot under the mock, but timing parity is a security property that belongs in integration/security tests, not unit tests; the unit suite still exercises the call site. Mock round-trip (`hashSync(NEW_PASSWORD, 4)` → `compareSync(NEW_PASSWORD, ...)` returns `true`) confirmed via password-rotation tests at lines 440/458. AC1 deviation (bcrypt mock not prescribed by literal AC1 text) is explicitly documented in the Dev Agent Record and addresses the real root cause TEA v2 NG2 identified.
- **AC2 (Home `waitFor` → `findBy*`, explicit timeout justified inline):** PASS. Every `waitFor(() => expect(document.querySelector('#section-id')).toBeInTheDocument())` was replaced with `await screen.findByRole('region', { name: '<aria-label>' }, lazySectionWait)`. The `lazySectionWait = { timeout: 5000 }` constant carries an inline comment naming React.lazy + Suspense chunk-import latency under CPU contention as the root cause. `Home.story-2-4.e2e.test.tsx` hero query uses `findByRole('region', { name: /More commission per ticket.*Less rework at the rate desk/ })` with an inline rationale comment because the hero `<section>`'s implicit-region accessible name is the rendered `<h1>` text. Semantic coverage strengthened (region role + aria-label both required, vs. previous bare ID selector).
- **AC3 (3× consecutive green full suite):** PASS. Reviewer ran `npm run test:run` three consecutive times this session — every run exited 0 with 766/766 passing across 88 test files (durations 52.93s / 53.53s / 54.09s). Matches the Dev Agent Record's reported 766/766 figures. The Tasks/Subtasks lines marked `*deferred — main thread handles push/PR*` (CI green confirmation, workflow re-trigger) are correctly out of dev scope.
- **AC4 (doc-trail comment in every touched test file):** PASS. Verified by reading the top of each of the 6 touched test files — every file carries the exact prescribed comment `// Patterns updated by Story 5.12 — see _bmad-output/test-artifacts/test-design/test-design-epic-5-v2.md` plus a short NG2-rationale paragraph. `auth.test.ts` additionally documents the bcrypt-mock rationale; the Home suites document the `findBy*` rationale.
- **AC5 (zero source changes in `server/` or `src/` outside test files; typecheck exit 0):** PASS. `git diff --name-only` for the Story 5.12 scope contains only the 6 test files plus vault/sprint-status/story-file doc-trail edits. The dirty `server/index.ts` from Story 5.9 (Express trust-proxy) is pre-existing and explicitly out of this story's scope. `npm run typecheck` exited 0 (both `tsc --noEmit` and the chained `tsc --noEmit --project tsconfig.scripts.json` from Story 5.8).

**Test-count drift:** None. The suite still reports 766 tests across 88 files. The Dev Agent Record's claim that no assertions were deleted holds — every `waitFor` → `findBy*` swap is a 1:1 replacement.

**No follow-up stories raised.** No production-code bug surfaced. No new test gaps identified. The remaining unchecked subtasks (CI workflow re-trigger + branch-push verification) are correctly deferred to the main thread per CLAUDE.md (commit/push/Jira are not dev's responsibility).

**Status transition:** `review` → `done`.
