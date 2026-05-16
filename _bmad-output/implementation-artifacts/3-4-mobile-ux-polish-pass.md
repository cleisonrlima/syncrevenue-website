# Story 3.4: Mobile UX Polish Pass

Status: review

<!-- Note: Validation completed during create-story. Story is ready for dev-story. -->

## Story

As a visitor accessing Sync Sirius on a mobile device,
I want a smooth, visually refined mobile experience,
so that the site feels as premium on my phone as it does on desktop.

## Acceptance Criteria

1. **Given** the site is viewed at a `375px` wide mobile viewport, **when** each public homepage section is reviewed from Hero through Contact, **then** there is no document-level horizontal overflow, all headings fit without truncation or clipped words in EN/PT-BR/ES, section spacing remains generous, and all card/grid layouts stack cleanly to one column unless a component is explicitly designed for controlled horizontal scroll.

2. **Given** the Hero is viewed at `375px`, **when** the first viewport renders, **then** the H1 computes to `32px` to `36px`, the primary CTA is full-width or near-full-width with a minimum `44px` touch target, `StatRow` stacks vertically, and `TrustBar` uses horizontal scroll below `480px` and a 2x2 grid at `480px` to `767px`.

3. **Given** the navbar hamburger overlay is open on a mobile viewport, **when** a visitor interacts with it, **then** nav links and controls have at least `44px` tap targets, Escape closes the overlay, clicking outside the menu content closes the overlay, focus remains trapped while open, focus returns to the hamburger on close, body scroll is locked only while open, and any open/close animation respects `prefers-reduced-motion`.

4. **Given** all public forms are viewed below `640px`, **when** Demo and Contact form fields render, **then** every field is full-width, no fields sit side-by-side, submit buttons are full-width or near-full-width, labels/errors remain programmatically associated, and success/error states do not introduce horizontal overflow.

5. **Given** a Lighthouse mobile audit is run against the production build, **when** results are reviewed, **then** the mobile Performance score is at least `90`, LCP is at most `2.5s` on simulated 4G, CLS is below `0.1`, and no Lighthouse accessibility violations are flagged.

6. **Given** automated responsive and accessibility tests run, **when** Story 3.4 is complete, **then** Playwright or equivalent browser tests verify the `375px` no-overflow contract, Hero mobile sizing/layout, mobile overlay close/focus behavior, mobile form full-width submit controls, and at least one cross-locale heading fit check for PT-BR or ES.

## Tasks / Subtasks

- [x] Task 1: Establish mobile audit coverage before changing layout (AC: 1, 2, 4, 6)
  - [x] Add a browser spec such as `tests/e2e/mobile-ux.spec.ts` using a `375x800` viewport. Prefer Playwright's real browser layout APIs over jsdom for overflow/box checks.
  - [x] Assert `document.documentElement.scrollWidth <= window.innerWidth` and `document.body.scrollWidth <= window.innerWidth` after visiting `/` and after scrolling through all public sections.
  - [x] Scroll through `#hero`, `#syncrevenue`, `#services`, `#comparison`, `#security`, `#client-references`, `#team`, `#demo-scheduler`, and `#contact`; assert each section is visible and its direct card/grid children stack vertically unless the element is the approved `TrustBar` horizontal-scroll rail or `Comparison` table scroll container.
  - [x] Add a cross-locale mobile pass for PT-BR or ES that checks headings are visible and not clipped by comparing bounding boxes against viewport width.

- [x] Task 2: Polish Hero mobile layout without regressing desktop or LCP (AC: 1, 2, 5)
  - [x] Update `src/components/sections/Hero.tsx` only as needed so the mobile H1 computes to `32px` to `36px`; preserve the existing desktop sizes and do not animate or lazy-load the H1/primary CTA.
  - [x] Make the Hero primary CTA full-width or near-full-width below `640px` while preserving the desktop row layout with the tertiary link.
  - [x] Preserve `StatRow`'s mobile-first vertical stack and desktop horizontal layout; do not introduce new text or data.
  - [x] Preserve `TrustBar`'s approved behavior: horizontal scroll below `480px`, 2x2 grid from `480px` to `<768px`, single row/flex wrapping on desktop.
  - [x] Ensure decorative Hero glow and any wide children cannot increase document scroll width on `375px`.

- [x] Task 3: Harden section/card responsive layout across the full homepage (AC: 1, 6)
  - [x] Review and adjust, as needed, `SyncRevenue`, `Services`, `Comparison`, `Security`, `ClientReferences`, `Team`, `DemoScheduler`, and `Contact` for mobile spacing, heading wrapping, card padding, and one-column grid behavior.
  - [x] Keep `Comparison` as the one approved horizontal-scroll content pattern if transforming it into stacked cards would exceed this story's scope. If it remains a table, the table scroll must be contained inside its own rounded border and must not cause document-level overflow.
  - [x] Preserve the section order and the `React.lazy` + `Suspense` + `ErrorBoundary` structure in `Home.tsx`.
  - [x] Preserve Story 3.2 `MotionSection` semantics and reduced-motion behavior; do not move Motion imports into `Home.tsx`, `App.tsx`, `main.tsx`, `Navbar.tsx`, or `Footer.tsx`.
  - [x] Preserve Story 3.1 Team behavior: real/placeholder photo handling, `data-team-grid`, composed image alt text, LinkedIn conditional rendering, and the existing single-column mobile Team test.

- [x] Task 4: Complete mobile hamburger overlay requirements (AC: 3, 6)
  - [x] Update `src/components/layout/Navbar.tsx` so the mobile overlay has a content panel/backdrop split or equivalent event handling that closes on outside tap without closing when interacting with menu content.
  - [x] Preserve Escape close, body scroll lock, desktop breakpoint auto-close, focus trap, and focus return.
  - [x] If adding animation, use Tailwind `motion-safe:` / `motion-reduce:` classes or a reduced-motion-aware implementation. Animate opacity/transform only; never animate height, width, margin, padding, or font size.
  - [x] Keep each mobile link/control at least `44px` high. The existing links already use `min-h-[44px]`; preserve or strengthen that contract.
  - [x] Extend `src/components/layout/Navbar.test.tsx` and/or `tests/e2e/mobile-overlay.spec.ts` to cover outside tap close and reduced-motion/no-layout-shift expectations where practical.

- [x] Task 5: Make public form mobile submit controls full-width (AC: 4, 6)
  - [x] Update `src/components/sections/DemoForm.tsx` so the submit `GradientButton` is full-width or near-full-width below `640px` and returns to the current desktop alignment at `sm` or `md` as appropriate.
  - [x] Update `src/components/sections/Contact.tsx` with the same submit button rule.
  - [x] Preserve the existing field state machines, locale capture, inline validation, hidden `locale` input, success focus behavior, Demo toast behavior, and Contact rate-limit inline error behavior.
  - [x] Add or extend tests to assert form submit buttons use mobile full-width classes and browser-level mobile layout does not render side-by-side form fields below `640px`.

- [x] Task 6: Verify performance, a11y, and regressions (AC: 5, 6)
  - [x] Run `npm run typecheck`.
  - [x] Run `npm run test:run`.
  - [x] Run `npm run build`.
  - [x] Run `npm run test:e2e -- tests/e2e/mobile-ux.spec.ts tests/e2e/mobile-overlay.spec.ts` or the final equivalent responsive spec set.
  - [x] Run `npm run lhci:mobile`. Do not weaken thresholds in `lighthouserc.mobile.json`.
  - [x] If local server binding or Chrome permissions block Playwright/LHCI in the sandbox, document the exact blocker in the Dev Agent Record and still complete typecheck/unit/build.

## Dev Notes

### Source Context

- Epic 3 is the Phase 2 polish epic and explicitly includes "polished mobile experience" alongside team content, animation, SEO, and the lead magnet. [Source: `_bmad-output/planning-artifacts/epics.md:763`]
- Story 3.4's epic ACs require a `375px` review with no horizontal overflow, mobile Hero sizing/layout, hamburger overlay polish, mobile form full-width behavior, and Lighthouse mobile performance/accessibility success. [Source: `_bmad-output/planning-artifacts/epics.md:845`]
- PRD responsive scope: mobile is `<768px`, tablet is `768-1024px`, desktop is `>1024px`; Phase 1 was functional mobile and Phase 2 is the polish pass. [Source: `_bmad-output/planning-artifacts/prd.md:245`]
- Performance budgets remain strict: LCP `<= 2.5s` on 4G mobile, FID `<100ms`, and CLS `<0.1`. [Source: `_bmad-output/planning-artifacts/prd.md:326`]
- UX spec requires mobile touch targets `>=44px`, `TrustBar` horizontal scroll below `480px` and 2x2 grid at `480-768px`, `StatRow` vertical below `640px`, all form fields full-width below `640px`, and hamburger navbar below `768px`. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md:314`]
- UX spec requires the mobile heading scale to land at `32-36px`, mobile-first CSS with `md:` / `lg:` overrides upward, associated form labels/errors, visible focus indicators, and reduced-motion respect. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md:564`; `_bmad-output/planning-artifacts/ux-design-specification.md:583`]

### Previous Story Intelligence

- Story 3.2 added `MotionSection` to below-the-fold public sections and verified Motion stays out of the main bundle. Story 3.4 must preserve that isolation: no Motion imports in `Home.tsx`, `App.tsx`, `main.tsx`, `Navbar.tsx`, or `Footer.tsx`; only section chunks may depend on the wrapper. [Source: `_bmad-output/implementation-artifacts/3-2-animations-micro-interactions.md`]
- Story 3.2 review fixed mobile locale-switch Playwright coverage by opening the mobile menu before choosing a language. Reuse that helper pattern for Story 3.4 cross-locale mobile checks instead of querying the hidden desktop switcher. [Source: `_bmad-output/implementation-artifacts/3-2-animations-micro-interactions.md`]
- Story 3.3 added SEO head management and admin-route cleanup. Do not change SEO helpers, sitemap/robots generation, canonical rules, or admin head cleanup while polishing mobile layout. [Source: `_bmad-output/implementation-artifacts/3-3-seo-metadata-meta-tags-og-hreflang-sitemap.md`]
- Recent git history shows Story 3.3 and review follow-ups touched SEO files and generated asset tests, not mobile layout; Story 3.4 should avoid reopening canonical/hreflang behavior. [Source: `git log --oneline -5`; `git show --stat ab37c32`; `git show --stat 63797d8`]

### Current State of Files to Update

- `src/pages/Home.tsx` lazy-loads all public sections and wraps each in `ErrorBoundary` + `Suspense` with fixed/min-height `SectionSkeleton` fallbacks. Keep this structure intact; it is part of the CLS/performance strategy. [Source: `src/pages/Home.tsx:1`]
- `src/components/sections/Hero.tsx` currently uses `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`, which makes the mobile H1 `30px` by Tailwind default, below the Story 3.4 `32-36px` target. The CTA container is currently `flex flex-col sm:flex-row`, but the button does not have mobile width classes. [Source: `src/components/sections/Hero.tsx:45`; `src/components/sections/Hero.tsx:55`]
- `src/components/sections/StatRow.tsx` is already mobile-first `grid-cols-1 sm:grid-cols-3`; preserve it unless browser testing finds spacing issues. [Source: `src/components/sections/StatRow.tsx:83`]
- `src/components/sections/TrustBar.tsx` already implements `sm:hidden` horizontal scroll, `sm:grid md:hidden grid-cols-2`, and desktop flex. Preserve this breakpoint behavior while preventing document-level overflow. [Source: `src/components/sections/TrustBar.tsx:123`]
- `src/components/layout/Navbar.tsx` already supports Escape close, body scroll lock, focus trap, viewport auto-close at `1024px`, focus return, and `min-h-[44px]` mobile links. It does not currently close on outside tap, and there is no explicit open/close animation to validate against reduced motion. [Source: `src/components/layout/Navbar.tsx:12`; `src/components/layout/Navbar.tsx:111`]
- `src/components/sections/DemoForm.tsx` uses a `md:grid-cols-2` field grid, so fields are already one-column below `768px`; its submit button is `justify-self-start`, not mobile full-width. [Source: `src/components/sections/DemoForm.tsx:194`; `src/components/sections/DemoForm.tsx:341`]
- `src/components/sections/Contact.tsx` uses a single-column form, but its submit button is also `justify-self-start`, not mobile full-width. [Source: `src/components/sections/Contact.tsx:170`; `src/components/sections/Contact.tsx:251`]
- `tests/e2e/team-section.spec.ts` already has a `375px` mobile single-column test for Team only. Story 3.4 needs homepage-wide coverage, not another Team-only assertion. [Source: `tests/e2e/team-section.spec.ts`]
- `lighthouserc.mobile.json` already encodes the mobile gate: Performance `>=0.9`, Accessibility `>=1.0`, LCP `<=2500ms`, CLS `<=0.1`, and TBT `<=200ms`. Do not weaken it. [Source: `lighthouserc.mobile.json:1`]

### Architecture Guardrails

- **No new dependencies.** Mobile polish should be Tailwind/CSS/test work only. Use existing React, Tailwind, MotionSection, Playwright, axe, and LHCI tooling from `package.json`.
- **No shadcn assumptions.** This repo uses custom `GradientButton`, `SectionHeader`, `Toast`, native form controls, and Tailwind utilities. Do not import or generate shadcn/Radix components for this story.
- **No backend/admin scope.** Story 3.4 is public mobile UX only. Do not touch Express routes, DAOs, schemas, admin pages, SEO asset generation, or database files.
- **No section-order changes.** The trust-building scroll order is part of the UX: Hero -> SyncRevenue -> Services -> Comparison -> Security -> ClientReferences -> Team -> DemoScheduler -> Contact.
- **No decorative layout bloat.** This is polish, not a redesign. Avoid new hero media, new sections, new copy, new animations beyond the navbar overlay need, or changes that increase LCP risk.
- **Horizontal scroll is exceptional.** Approved: `TrustBar` below `480px` and `Comparison` table if contained. Everything else should fit the viewport.
- **Preserve i18n.** Do not hardcode user-visible strings. Cross-locale tests must use existing EN/PT-BR/ES translation content.
- **Preserve accessibility.** Keep labels, `aria-describedby`, `aria-live`, focus-visible rings, skip link behavior, overlay focus trap, and keyboard close behavior.

### Library/Framework Requirements

- React `18.3.1`, Vite `5.4.21`, TypeScript `6.0.3`, Tailwind `3.4.19`, Motion `12.38.0`, Playwright `1.60.0`, and LHCI `0.15.1` are already present. Do not upgrade packages for this story. [Source: `package.json`]
- Use Tailwind mobile-first classes. Base classes are mobile; add `sm:`, `md:`, and `lg:` overrides upward. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md:609`]
- Use Playwright for viewport/overflow assertions because jsdom cannot compute real layout. Keep co-located unit tests for class-level contracts where useful.

### Testing Requirements

- Co-located unit tests remain the default for component class/behavior contracts; use Playwright under `tests/e2e/` for real responsive layout.
- Existing Playwright config runs desktop, WebKit, and mobile projects, and auto-starts `npm run dev` unless `PLAYWRIGHT_BASE_URL` is provided. If server binding fails in this sandbox, document the exact failure. [Source: `playwright.config.ts`]
- Keep `npm run lhci:mobile` as the authoritative mobile performance gate. If it is blocked by local Chrome/server permissions, do not mark AC5 as fully verified; document the blocker in Dev Agent Record.
- Run the existing broad suites after layout changes because this story touches shared public UI: `npm run typecheck`, `npm run test:run`, `npm run build`, targeted e2e responsive specs, and `npm run lhci:mobile` when the environment permits.

### Project Structure Notes

- Expected updated files:
  - `src/components/sections/Hero.tsx`
  - `src/components/layout/Navbar.tsx`
  - `src/components/sections/DemoForm.tsx`
  - `src/components/sections/Contact.tsx`
  - Any public section component where browser audit finds mobile overflow or poor spacing
  - `src/components/layout/Navbar.test.tsx`
  - Existing relevant component tests, if class contracts change
  - New or updated Playwright spec under `tests/e2e/`
- Expected new files:
  - `tests/e2e/mobile-ux.spec.ts` or equivalent responsive browser spec
- Do not create `__tests__/` directories.
- Do not modify generated build output, package lockfiles, or dependencies unless a test/tooling gap is proven and documented.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md:845`] - Story 3.4 ACs
- [Source: `_bmad-output/planning-artifacts/prd.md:245`] - responsive breakpoint scope
- [Source: `_bmad-output/planning-artifacts/prd.md:326`] - mobile performance budgets
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md:314`] - mobile component requirements
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md:564`] - mobile heading/form/nav expectations
- [Source: `src/pages/Home.tsx:1`] - lazy public section orchestration
- [Source: `src/components/sections/Hero.tsx:45`] - current Hero H1/mobile CTA area
- [Source: `src/components/sections/TrustBar.tsx:123`] - current TrustBar responsive implementation
- [Source: `src/components/layout/Navbar.tsx:111`] - current mobile overlay implementation
- [Source: `src/components/sections/DemoForm.tsx:341`] - current Demo submit alignment
- [Source: `src/components/sections/Contact.tsx:251`] - current Contact submit alignment
- [Source: `lighthouserc.mobile.json:1`] - mobile Lighthouse gate

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Pre-existing Playwright spec `tests/e2e/mobile-overlay.spec.ts` stored a stale locator reference (`hamburger`) bound to `name: /open menu/i` that no longer resolved once the button's aria-label flipped to "Close menu". Rebound to fresh locators per state.
- LHCI `npm run lhci:mobile` blocked in the sandbox: `vite preview` start timed out ("Timed out waiting for the server to start listening") and `lighthouserc.mobile.json` references `preset: "mobile"`, which Lighthouse rejects (valid choices: `perf`, `experimental`, `desktop`). Thresholds were not weakened; AC5 must be validated outside the sandbox or via a follow-up to repair the LHCI config.
- Playwright WebKit binary missing in the sandbox (`Executable doesn't exist at ms-playwright/webkit-2287/pw_run.sh`); ran chromium + mobile-chrome projects, both pass 9/9 for the new mobile specs.

### Completion Notes List

- Created by BMAD create-story workflow in YOLO mode.
- Validation applied: expanded generic mobile polish ACs into concrete implementation guardrails, added existing-file current-state notes, preserved Story 3.2 Motion bundle isolation and Story 3.3 SEO behavior, and required real-browser responsive coverage before declaring completion.
- Checklist validation result: no critical gaps found after adding explicit current-state notes, regression guardrails, and verification requirements.
- Hero H1 now `text-[2rem]` (32px) on mobile, scaling to `sm:text-4xl` and up; primary CTA gains `w-full min-h-[44px] sm:w-auto` so it is full-width below 640px and returns to inline row layout from `sm`.
- Demo + Contact submit buttons converted to `w-full min-h-[44px] sm:w-auto sm:justify-self-start`, satisfying the AC4 mobile full-width contract while preserving desktop alignment.
- Navbar mobile overlay refactored to a single `bg-brand-navy` backdrop wrapping a `mobile-overlay-content` panel that stops click propagation. Outside taps close; taps on links/controls behave as before. Added `motion-safe:animate-fade-in` / `motion-reduce:animate-none` with a new `fade-in` keyframe in `tailwind.config.ts` — opacity-only, no layout-affecting animation.
- New Playwright spec `tests/e2e/mobile-ux.spec.ts` covers: document/body scrollWidth ≤ viewport across all public sections, every section bounding box within viewport, Hero H1 computed font-size 32–36px, Hero CTA ≥ 300px wide and ≥ 44px tall, Demo + Contact submit buttons fill ≥ 95% of form content width, and a PT-BR cross-locale Hero H1 fit pass via the mobile language switcher.
- `tests/e2e/mobile-overlay.spec.ts` extended with outside-tap close/content-tap-stays-open coverage. Existing Esc/focus-return test was already flaky due to stale locator binding (independent of this story's changes) and was repaired in-place.
- Unit suite: 259/259 pass (`npm run test:run`). Typecheck and `npm run build` pass cleanly.
- E2E: `npm run test:e2e -- tests/e2e/mobile-ux.spec.ts tests/e2e/mobile-overlay.spec.ts --project=chromium` → 9 passed; same on `--project=mobile-chrome`. WebKit projects skipped (binary not installed in sandbox).
- AC5 Lighthouse mobile gate not executable locally; see Debug Log entry. A follow-up story should repair `lighthouserc.mobile.json` (`preset: "mobile"` → drop or set to `perf`) so the gate can run.

### File List

- src/components/sections/Hero.tsx
- src/components/sections/DemoForm.tsx
- src/components/sections/Contact.tsx
- src/components/layout/Navbar.tsx
- src/components/layout/Navbar.test.tsx
- tailwind.config.ts
- tests/e2e/mobile-ux.spec.ts (new)
- tests/e2e/mobile-overlay.spec.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/3-4-mobile-ux-polish-pass.md

### Change Log

- 2026-05-16: Story context created and marked ready-for-dev.
- 2026-05-16: Implemented Story 3.4 — Hero mobile sizing, mobile-full-width form submits, Navbar overlay outside-tap close + reduced-motion fade-in, and new 375px responsive Playwright coverage. Tests/typecheck/build green; LHCI mobile blocked by sandbox + pre-existing preset bug, flagged for follow-up.
