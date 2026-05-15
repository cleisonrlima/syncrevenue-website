# Test Automation Summary — Story 2.4 (DemoScheduler & Multiple CTA Entry Points)

Generated: 2026-05-15
Framework: Vitest 4.1.6 + @testing-library/react + jsdom
Scope: presentation-layer story (no new API surface introduced — backend tests already covered by Story 2.1/2.2/2.3).

## Existing Coverage Audit

- `src/components/sections/DemoScheduler.test.tsx` — 8 cases: region/aria-label, dark-gradient bookend, `SectionHeader` copy from `sections.demoScheduler.*`, single `lg` CTA, embedded `DemoForm`, click → focus + scroll without hash change, overflow-hidden + `max-w-[960px]` container, pt-BR CTA label.
- `src/pages/Home.story-2-4.e2e.test.tsx` — 2 cases: exactly one `DemoForm` on `Home` + `DemoScheduler` precedes `Contact`; in-section CTA click moves focus to the Full Name input.
- `src/components/layout/Navbar.test.tsx` — 4 base cases (overlay open/close/escape, mobile link click).
- `src/components/sections/Hero.test.tsx` — Hero CTA presence, size, i18n keys.
- `src/pages/Home.story-1-9.e2e.test.tsx` — trust-section ordering ending in `#demo-scheduler` (covers AC4).

## Gaps Identified vs Story 2.4 Acceptance Criteria

| AC  | Behavior                                                         | Pre-existing coverage                                                                | Gap |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --- |
| AC2 | Hero "Schedule a Demo" CTA routes to `#demo-scheduler`           | `Hero.test.tsx` asserts CTA presence only; no convergence test at the page level     | YES |
| AC2 | Navbar desktop CTA routes to `#demo-scheduler`                   | No test; `Navbar.test.tsx` did not cover the demo CTA behavior                       | YES |
| AC2 | Navbar mobile menu link is the `/#demo-scheduler` anchor         | No assertion existed                                                                 | YES |
| AC7 | `es` locale renders translated CTA + aria-label                  | Only `pt-BR` locale asserted in `DemoScheduler.test.tsx`                             | YES |

All other AC items (1, 3, 4, 5, 6) were already covered by existing component + page-level tests.

## Generated / Extended Tests (auto-applied)

### `src/components/sections/DemoScheduler.test.tsx`

- Added `renders the CTA in es when the locale changes` — asserts CTA label `Agendar una Demo` and region aria-label `Agendar una demostración SyncRevenue` after `setLocale('es')`.

### `src/pages/Home.story-2-4.e2e.test.tsx`

- Replaced the simple `scrollIntoView = vi.fn()` stub with a target-recording polyfill (`scrollTargets: HTMLElement[]`) so the test can verify *which* element was scrolled to, not just that scrolling happened.
- Added `Hero "Schedule a Demo" CTA scrolls the visitor to the DemoScheduler section` — locates the Hero CTA inside `#hero`, clicks it, asserts `scrollTargets` contains the `#demo-scheduler` element, asserts `window.location.hash` is unchanged (no hash navigation / no reload — AC2 + AC6 invariants).

### `src/components/layout/Navbar.test.tsx`

- Added `Story 2.4 — Demo CTA convergence on #demo-scheduler` describe block with:
  - `desktop nav.demo CTA scrolls to the #demo-scheduler section` — stubs a `#demo-scheduler` section in `document.body`, clicks the desktop nav CTA (`Request Demo` in `en`), and asserts the stub was the scroll target and `window.location.hash` was not mutated.
  - `mobile menu exposes the /#demo-scheduler anchor for the demo CTA` — opens the overlay and asserts the demo link has `href="/#demo-scheduler"` (the AC2 mobile contract).

## Verification

- `npm run typecheck` → clean.
- `npm run test:run -- src/components/sections/DemoScheduler.test.tsx src/components/layout/Navbar.test.tsx src/pages/Home.story-2-4.e2e.test.tsx` → **18 / 18 passed**.
- `npm run test:run` (full suite) → **217 / 217 passed**, 43 test files.

## Coverage Summary

- AC1, AC3, AC4, AC5, AC6 — covered by pre-existing tests.
- AC2 (Hero CTA convergence) — now covered by `Home.story-2-4.e2e.test.tsx`.
- AC2 (Navbar desktop CTA convergence) — now covered by `Navbar.test.tsx`.
- AC2 (Navbar mobile anchor) — now covered by `Navbar.test.tsx`.
- AC7 (`en` + `pt-BR`) — pre-existing; AC7 (`es`) — now covered by `DemoScheduler.test.tsx`.

All seven acceptance criteria for Story 2.4 are now exercised by automated tests.

## Files Touched

- `src/components/sections/DemoScheduler.test.tsx` (modified — +1 case, es locale).
- `src/pages/Home.story-2-4.e2e.test.tsx` (modified — +1 case, Hero CTA convergence; replaced scroll stub with target recorder).
- `src/components/layout/Navbar.test.tsx` (modified — +2 cases, desktop CTA convergence + mobile anchor).

## Next Steps

- Run the suite in CI on the next push (Vitest already wired in `npm run test:run`).
- If Story 2.6 adds a focus-trap audit or ARIA-live re-validation for the demo flow, extend `DemoScheduler.test.tsx` rather than spinning up a new spec file.

## Checklist Validation (skill `bmad-qa-generate-e2e-tests`)

- [x] API tests generated — N/A (presentation-only story; backend already covered).
- [x] E2E tests generated for UI gaps.
- [x] Tests use standard Vitest + Testing Library APIs.
- [x] Tests cover happy path (CTA → scroll/focus convergence).
- [x] Tests cover error-adjacent invariants (no hash navigation, exactly one `DemoForm` mounted).
- [x] All generated tests run successfully.
- [x] Tests use proper locators (`getByRole`, accessible names, `getByLabelText`).
- [x] Tests have clear descriptions.
- [x] No hardcoded waits or sleeps (only `waitFor` for lazy-loaded sections, which is required by the existing pattern).
- [x] Tests are independent — each test sets up its own scroll spy and locale state; `afterEach` restores both.
- [x] Test summary created at `_bmad-output/implementation-artifacts/tests/test-summary.md`.
- [x] Tests saved alongside source (co-located convention).
- [x] Summary includes coverage metrics per AC.
