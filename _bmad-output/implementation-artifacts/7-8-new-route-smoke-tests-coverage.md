# Story 7.8: New-Route Smoke Tests + Vitest Coverage Floor

Status: not-started

Epic: 7 — Figma 'teste' SaaS Import — Dashboard Suite + Dark Theme

Source: Local files only. Key files: `vite.config.ts` (`test.include` glob from Story 5.13), `playwright.config.ts`, existing test patterns in `src/pages/Home*.test.tsx` + `src/components/sections/*.test.tsx`.

Depends on: Stories 7.1–7.7 (must all be merged so smoke tests assert against the final state).

## Story

As the engineer accountable for the Vitest coverage floor + Playwright e2e suite,
I want minimum-viable smoke tests for every new Epic 7 route (`/v2`, `/demo`, `/dashboard`, `/dashboard/recovery`, `/dashboard/payouts`, `/dashboard/insights`, `/dashboard/settings`) AND a confirmation that the post-Epic-7 Vitest baseline matches or exceeds the pre-Epic-7 baseline (89 files / 772 passing as of Story 5.13),
So that any regression in a new route is caught the moment it lands, the test count grows monotonically, and the post-sprint TEA pass has a known good baseline to audit against.

## Acceptance Criteria

1. **Given** the Epic 7 routes are merged **When** smoke tests are added **Then** each new route has at least one Vitest spec asserting (a) the page mounts under `<MemoryRouter initialEntries={['<route>']}>` without throwing, (b) the primary heading is present via `screen.findByRole('heading')`. These are MINIMUM coverage — pages with significant interactivity (tabs, filters, charts) get one additional interaction test per Story 7.3 / 7.4 ACs (covered there).

2. **Given** axe accessibility scans exist for the existing site (Story 3.9 Playwright + axe-core) **When** Story 7.8 lands **Then** the Playwright spec is extended with one axe scan per new route (`/v2`, `/demo`, `/dashboard`, `/dashboard/recovery`, `/dashboard/payouts`, `/dashboard/insights`, `/dashboard/settings`). Zero serious/critical violations on each. Moderate/minor violations triaged per Story 7.7 Task 5 pattern.

3. **Given** Playwright user-journey traversals exist for the existing site **When** Story 7.8 lands **Then** one NEW Playwright spec covers `/v2` → click "Book a Demo" → land on `/demo` → fill form → submit → see success panel (mocked, no real API call). One additional NEW spec covers `/dashboard` → click each of the 4 child nav items → confirm URL + heading update.

4. **Given** the pre-Epic-7 baseline is 89 files / 772 passing (Story 5.13 commit) **When** the post-Epic-7 baseline is measured **Then** `npm run test:run` reports ≥ 89 files / ≥ 772 passing AND exits 0 across three consecutive invocations. The delta is documented (e.g., "+13 files / +47 tests across Epic 7"). Any pre-existing flake from Story 5.12 stays green per that story's stabilisation work.

5. **Given** `npm run typecheck` chains `tsc --noEmit && tsc --noEmit --project tsconfig.scripts.json` (Story 5.8 + 5.13) **When** Story 7.8 lands **Then** both invocations exit 0. New `*.test.ts(x)` files in `src/pages/dashboard/` are picked up by the existing Vitest glob (or the glob is extended if needed — but `src/**/*.test.tsx` should already cover them per `vite.config.ts:27` post-Story-5.13).

6. **Given** `npm run build` produces a deployable artifact **When** Story 7.8 lands **Then** the build completes without warnings or errors, `dist/client/index.html` retains the prerendered Hero markup for `/` (Story 5.6 invariant), and `scripts/test-build-output.mjs` (Story 5.10 CI gate) passes. Bundle-size regression documented if > 100 KB total or > 20 KB initial chunk.

7. **Given** the post-sprint TEA pass (per CLAUDE.md) needs a baseline **When** Story 7.8 closes **Then** the story Dev Agent Record explicitly records: total Vitest files, total Vitest tests, Lighthouse perf/a11y/best-practices/SEO per route (or per-page where measured), axe violation counts per route. This snapshot is the input for `bmad-tea` against Epic 7.

## Tasks / Subtasks

- [ ] **Task 1: Vitest smoke spec per new route (AC: 1)**
  - [ ] `src/pages/Landing.test.tsx` — confirms Story 7.4 added this; if not, add minimum spec here
  - [ ] `src/pages/Demo.test.tsx` — confirms Story 7.4
  - [ ] `src/pages/dashboard/DashboardHome.test.tsx` — Story 7.3 should have added; confirm
  - [ ] `src/pages/dashboard/RevenueRecovery.test.tsx` — Story 7.3
  - [ ] `src/pages/dashboard/Payouts.test.tsx` — Story 7.3
  - [ ] `src/pages/dashboard/Insights.test.tsx` — Story 7.3
  - [ ] `src/pages/dashboard/Settings.test.tsx` — Story 7.3
  - [ ] If any are missing, add minimum render-without-crash + heading-present test

- [ ] **Task 2: Playwright axe scan per new route (AC: 2)**
  - [ ] Extend the existing axe scan spec (per Story 3.9) with 7 new route entries
  - [ ] Run; capture violations
  - [ ] Triage per AC 2

- [ ] **Task 3: Playwright user-journey traversals (AC: 3)**
  - [ ] New spec `tests/v2-to-demo.spec.ts` — Landing → Book a Demo → submit form → see success
  - [ ] New spec `tests/dashboard-nav.spec.ts` — Dashboard → click each sidebar item → assert URL + heading
  - [ ] Both specs run in chromium + webkit per `playwright.config.ts`

- [ ] **Task 4: Vitest baseline confirmation (AC: 4)**
  - [ ] `npm run test:run` × 3 — exit 0 each time
  - [ ] Document file/test count delta in story Dev Agent Record
  - [ ] If a Story 5.12 flake re-emerges, this is a story-level blocker — investigate before merge

- [ ] **Task 5: Typecheck confirmation (AC: 5)**
  - [ ] `npm run typecheck` exit 0
  - [ ] If a new test file lives outside the existing glob, extend `vite.config.ts` `test.include` (probably not needed if files land under `src/**`)

- [ ] **Task 6: Build + bundle audit (AC: 6)**
  - [ ] `npm run build` exit 0
  - [ ] `node scripts/test-build-output.mjs` exit 0
  - [ ] Compare `dist/client/assets/*.js` sizes vs. pre-Epic-7 baseline; record delta

- [ ] **Task 7: TEA-baseline snapshot (AC: 7)**
  - [ ] Record in story Dev Agent Record:
    - Vitest: total files, total tests, run time
    - Lighthouse `/` (desktop + mobile): perf / a11y / best-practices / SEO
    - Lighthouse `/v2` (desktop + mobile): same
    - Lighthouse `/dashboard` (desktop + mobile): same
    - Axe: violations per route (serious/critical/moderate/minor counts)
  - [ ] This baseline is the input for the post-sprint `bmad-tea` pass

## Dev Notes

### Open reconciliations (resolve at create-time → 2026-05-22)

1. **Spec ownership.** Story 7.3 + 7.4 ACs already mandate per-page minimum tests. Story 7.8's Task 1 is a backstop — if 7.3/7.4 reviewers signed off without those tests, 7.8 adds them. The duplication is intentional safety net, not redundant work.

2. **Playwright cost.** Each new axe scan + user-journey adds ~10–30s to e2e runtime. Acceptable. If the CI total > 5min, consider parallelisation in a follow-up.

3. **TEA baseline format.** Existing TEA passes (`_bmad-output/test-artifacts/test-design/test-design-epic-5.md`, `-v2.md`) use a structured table. Mirror that format in this story's Dev Agent Record so TEA can ingest cleanly.

4. **Bundle-size budget.** Epic 7 adds ~13 radix packages + recharts + react-slick + lucide-react = ~150–300 KB raw, ~50–100 KB gzipped. The new chunks should only load on `/v2` + `/dashboard/*` (route-level code-split). Confirm by inspecting `dist/client/assets/` chunk naming + content.

### Out of scope

- Per-route Lighthouse threshold gates in `lighthouserc.json` — out of Story 7.8; existing `/` thresholds stay
- Real backend integration tests (auth, real data) — out of Epic 7 entirely
- Visual regression tests (Percy / Chromatic) — separate epic if value justifies

### Subtasks land in Jira

Per CLAUDE.md, every task lands as a child Sub-task issue.
