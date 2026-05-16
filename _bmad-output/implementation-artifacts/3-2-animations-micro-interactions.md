# Story 3.2: Animations & Micro-Interactions

Status: ready-for-dev

<!-- Note: Validation completed during create-story. Story is ready for dev-story. -->

## Story

As a visitor scrolling through the Sync Sirius site,
I want subtle, purposeful animations on section entry and interactive elements,
so that the experience feels polished and premium without distracting from the content.

## Acceptance Criteria

1. **Given** Motion for React is installed as the current Framer Motion package, **when** a below-the-fold public content section enters the viewport, **then** the section animates once with opacity `0 -> 1`, translate-y `20px -> 0`, duration about `0.4s`, and ease-out timing; it does not re-animate on re-scroll.

2. **Given** a visitor has `prefers-reduced-motion: reduce`, **when** any section animation or micro-interaction would fire, **then** transform and opacity animations are suppressed, content renders at its final position immediately, and no layout shift is introduced.

3. **Given** a primary CTA uses `GradientButton`, **when** a pointer hovers the button, **then** the hover transition is smooth at about `150ms`, affects only visual paint properties such as brightness/gradient, and does not change width, height, padding, margin, font size, or position.

4. **Given** the `LanguageSwitcher` changes locale, **when** content re-renders in EN, PT-BR, or ES, **then** no untranslated key flashes, scroll position is preserved, focus is not moved unexpectedly, and layout shift stays below the project CLS budget.

5. **Given** `npm run typecheck` and `npm run build` run after Motion is added, **when** `dist/client/assets` is inspected, **then** Motion code is absent from the main `index-*.js` chunk and only appears in async section/shared chunks used by animated sections; Lighthouse CI still enforces LCP <= 2.5s and CLS < 0.1.

6. **Given** automated tests run, **when** unit and browser tests cover motion behavior, **then** they verify reduced-motion final-state rendering, one-shot section entry behavior, stable CTA dimensions on hover, and locale switch scroll preservation on `/`.

## Tasks / Subtasks

- [ ] Task 1: Add Motion dependency and keep the package choice current (AC: 1, 5)
  - [ ] Add `motion` to `dependencies` in `package.json` and update `package-lock.json` with npm, targeting the current verified release family (`^12.37.0` as of 2026-05-16).
  - [ ] Do not add both `motion` and `framer-motion`. The epic says "Framer Motion"; current official React docs publish the package as `motion` and import from `motion/react`.
  - [ ] Keep React 18 compatibility. Official Motion docs require React `18.2` or higher; this repo uses React `18.3.1`.

- [ ] Task 2: Create a reusable animated section wrapper that does not enter the main bundle (AC: 1, 2, 5)
  - [ ] Create `src/components/sections/MotionSection.tsx` or an equivalently scoped section helper. Do not import Motion from `src/pages/Home.tsx`, `src/App.tsx`, `src/main.tsx`, `Navbar.tsx`, or any always-loaded layout file.
  - [ ] Use Motion's reduced-size path: `import * as m from "motion/react-m"` plus `LazyMotion` from `motion/react`. Use `LazyMotion strict` so accidental `motion.*` imports fail during development.
  - [ ] Load features through a dynamic import, for example a small `src/components/sections/motionFeatures.ts` exporting `domAnimation`, and pass `features={() => import('./motionFeatures').then(mod => mod.default)}`. This prevents Motion feature code from being pulled into the main chunk.
  - [ ] Use `useInView(ref, { once: true, amount: 0.2 })` or the equivalent Motion viewport API so entry animation triggers once per section.
  - [ ] Use `useReducedMotion()` and short-circuit to final visible styles when reduced motion is enabled. Do not rely only on Tailwind `motion-safe:` for JS-driven Motion animations.
  - [ ] Preserve semantic `<section>` output. The wrapper must pass through `id`, `role`, `aria-label`, `aria-labelledby`, and `className` exactly; do not add extra landmark nesting.
  - [ ] Do not animate height, padding, margin, font size, or layout-affecting properties. Only animate `opacity` and `y` transform.

- [ ] Task 3: Apply section-entry animation to public below-the-fold sections (AC: 1, 2, 5)
  - [ ] Update these lazy-loaded sections to render through the wrapper: `SyncRevenue`, `Services`, `Comparison`, `Security`, `ClientReferences`, `Team`, `DemoScheduler`, and `Contact`.
  - [ ] Do not wrap these sections from `Home.tsx`; each section's own lazy chunk should import the wrapper.
  - [ ] Leave `Hero` root unanimated unless performance checks prove no LCP regression. If any Hero motion is added, it must not delay or transform the H1 or primary CTA that contribute to initial paint.
  - [ ] Preserve existing section IDs, landmarks, labels, gradients, spacing, and data attributes (`data-team-grid`, `data-reference-grid`, etc.).
  - [ ] Preserve the `React.lazy` + `Suspense` + `ErrorBoundary` pattern and all `SectionSkeleton` min-heights in `Home.tsx`.

- [ ] Task 4: Refine `GradientButton` hover/active transitions (AC: 2, 3)
  - [ ] In `src/components/ui/GradientButton.tsx`, replace generic `transition-all` with a targeted transition such as `transition-[filter,background-position,box-shadow] duration-150 ease-out` or the closest Tailwind-supported equivalent.
  - [ ] Keep `hover:brightness-110` or an equivalent paint-only effect. Do not change padding, border width, font size, `transform`, or layout on hover.
  - [ ] Keep the existing `motion-safe:active:scale-[0.98]` active press affordance, but ensure reduced-motion disables transform. If active scale causes test instability or reduced-motion violations, replace it with a paint-only active state.
  - [ ] Preserve disabled styling and focus-visible ring classes.

- [ ] Task 5: Verify LanguageSwitcher behavior remains stable (AC: 4)
  - [ ] Keep the canonical locale flow order in `src/i18n/LanguageSwitcher.tsx`: `i18next.changeLanguage(locale)` -> `useLocaleStore.setState({ locale })` -> `localStorage.setItem('i18nextLng', locale)` in `try/catch`.
  - [ ] Do not introduce route navigation, `window.location`, scroll-to-top behavior, Suspense fallback flashes, or async translation loading for bundled locale JSON.
  - [ ] If awaiting `changeLanguage`, preserve the existing no-navigation behavior and keep the active button state synchronized with `useLocaleStore`.

- [ ] Task 6: Add focused tests for Story 3.2 (AC: 2, 3, 4, 6)
  - [ ] Add a co-located unit test for the motion wrapper (for example `src/components/sections/MotionSection.test.tsx`). Mock Motion hooks/components as needed; assert reduced-motion renders children immediately with final opacity/transform state and that in-view state does not remount children.
  - [ ] Add or extend `src/components/ui/GradientButton.test.tsx` to assert hover transition classes are targeted and size classes remain stable.
  - [ ] Extend `tests/e2e/locale-switch.spec.ts` for `/`: scroll to a below-the-fold section, switch locale, assert pathname remains `/` and `window.scrollY` changes by less than 50px.
  - [ ] Add a Playwright spec such as `tests/e2e/animations.spec.ts` that emulates `prefers-reduced-motion: reduce`, visits `/`, scrolls through at least one animated section, and verifies the section is visible without transform/opacity hiding.
  - [ ] Add a Playwright hover check for one primary CTA: record its bounding box before and after hover and assert width/height/x/y stay unchanged within 1px.

- [ ] Task 7: Build, bundle, and performance verification (AC: 5)
  - [ ] Run `npm run typecheck`.
  - [ ] Run `npm run test:run`.
  - [ ] Run `npm run build`.
  - [ ] Inspect `dist/client/assets/index-*.js` and confirm it does not contain Motion identifiers/imports (`motion`, `LazyMotion`, `domAnimation`, `react-m`). If sourcemaps are unavailable, use chunk filenames/sizes and string search as the practical guard.
  - [ ] Verify the existing section chunks still exist in `dist/client/assets` and Motion code is isolated to async section/shared chunks, not the main app chunk.
  - [ ] Run `npm run lhci` and `npm run lhci:mobile` when local browser/server permissions allow. If sandbox networking blocks preview, document the exact command failure in the Dev Agent Record and still complete typecheck/test/build.

## Dev Notes

### Source Context

- Epic 3 is Phase 2 polish: real team content, animations, SEO, mobile polish, and commission-audit lead magnet. Story 3.2 specifically covers subtle section-entry motion, reduced-motion behavior, CTA hover polish, locale-switch stability, and bundle/LCP protection. [Source: `_bmad-output/planning-artifacts/epics.md:765`; `_bmad-output/planning-artifacts/epics.md:789`]
- Project performance budgets are strict: LCP <= 2.5s, FID < 100ms, CLS < 0.1. Locale switching is explicitly part of the CLS requirement. [Source: `_bmad-output/planning-artifacts/prd.md:326`; `_bmad-output/planning-artifacts/prd.md:328`]
- UX accessibility requirements explicitly call out reduced motion and locale switching: locale switch must not break focus or cause layout shift; Phase 2 animations must respect `prefers-reduced-motion`. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md:593`; `_bmad-output/planning-artifacts/ux-design-specification.md:594`]
- Existing public sections are already lazy-loaded from `src/pages/Home.tsx`, each wrapped in `ErrorBoundary` and `Suspense` with a fixed/min-height `SectionSkeleton`. Preserve this architecture because it prevents white screens and CLS during chunk load. [Source: `src/pages/Home.tsx:5`; `src/pages/Home.tsx:18`; `vault/Planning/Architecture-Key.md:141`; `vault/Planning/Architecture-Key.md:151`]

### Previous Story Intelligence

- Story 3.1 left real team photos and real person names as separate stakeholder-content follow-ups, but the Team component and tests now include `linkedinUrl`, composed image alt text, trimmed `photo`/`linkedinUrl`, and the truthful initials fallback. Story 3.2 must preserve those behaviors while adding section motion. [Source: `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md:204`; `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md:207`]
- Recent commits show the Story 3.1 implementation and review touched `Team.tsx`, `Team.test.tsx`, i18n JSON, Story 1.8 e2e coverage, and `tests/e2e/team-section.spec.ts`. Do not re-open Story 3.1 content questions in this story. [Source: `git show --stat 7da65dc`; `git show --stat bffc40e`]
- The sprint was advanced to 3.2 after Story 3.1 was marked done, and Story 3.6 now tracks the remaining real-photo/name follow-ups. Keep Story 3.2 scoped to motion and interaction polish. [Source: `git show --stat 249cbf7`; `_bmad-output/implementation-artifacts/sprint-status.yaml`]

### Current State of Files to Update

- `package.json` currently has no `motion` or `framer-motion` dependency. Add only `motion` plus lockfile changes. [Source: `package.json:20`; `package.json:34`]
- `src/pages/Home.tsx` lazy-loads each public section and should stay free of Motion imports. If Motion appears in this file, it is likely to enter the main app chunk and violate AC5. [Source: `src/pages/Home.tsx:1`; `src/pages/Home.tsx:5`]
- `src/components/ui/GradientButton.tsx` currently uses `transition-all`, `hover:brightness-110`, and `motion-safe:active:scale-[0.98]`. Tighten the transition target and duration without changing the public API. [Source: `src/components/ui/GradientButton.tsx:23`; `src/components/ui/GradientButton.tsx:26`]
- `src/i18n/LanguageSwitcher.tsx` already follows the canonical locale flow and uses bundled locale JSON through i18next. Preserve its no-navigation behavior and localStorage try/catch. [Source: `src/i18n/LanguageSwitcher.tsx:14`; `src/i18n/index.ts:11`; `vault/Planning/Architecture-Key.md:174`]
- `tests/e2e/locale-switch.spec.ts` already verifies locale switch without navigation and scroll preservation on `/privacy`; extend it for home-section scroll preservation rather than creating duplicate coverage. [Source: `tests/e2e/locale-switch.spec.ts:9`; `tests/e2e/locale-switch.spec.ts:24`]

### Architecture Guardrails

- **No main-bundle Motion imports.** Do not import `motion`, `LazyMotion`, `useInView`, or `useReducedMotion` from always-loaded files (`main.tsx`, `App.tsx`, `Home.tsx`, `Navbar.tsx`, `Footer.tsx`). Animated section chunks may import the wrapper.
- **Keep semantic sections.** Do not wrap a `<section>` in another `<section>`. If the helper abstracts the root element, it must render the root section itself and preserve all accessibility attributes.
- **Reduced motion is mandatory.** Tailwind `motion-safe:` is required for CSS animation classes, but JS-driven Motion also needs `useReducedMotion()` or `MotionConfig reducedMotion` handling. [Source: `vault/Planning/Architecture-Key.md:170`]
- **No layout-affecting animation.** Do not animate height, width, margin, padding, grid columns, table width, or font size. Entry animation is opacity plus transform only.
- **No new visible text.** Story 3.2 should not add user-visible copy. If test-only labels are needed, keep them existing or internal.
- **No backend/admin work.** Motion applies to public landing sections and CTA/UI polish only.
- **No shadcn assumptions.** This repo uses custom UI primitives and native controls; `components.json` is leftover config. [Source: `_bmad-output/planning-artifacts/architecture.md:982`; `vault/Code/Frontend.md:71`]
- **WCAG color exception still applies.** Do not add normal-size `text-brand-electric-blue` body text on white/offwhite backgrounds; use `text-brand-deep` for small accent text. [Source: `vault/Planning/Architecture-Key.md:126`]

### Library/Framework Requirements

- Current official Motion docs say install `motion`, import React APIs from `motion/react`, and note Vite needs no special configuration. The page footer reported latest version `12.37.0` at story creation time. [Source: `https://motion.dev/docs/react-installation`]
- Use `useInView` with `once: true` for one-shot viewport entry. Official docs state `once: true` stops observing and keeps the value true after first entry. [Source: `https://motion.dev/docs/react-use-in-view`]
- Use `useReducedMotion` from `motion/react` to detect the user's reduced-motion preference and render final-state content. [Source: `https://motion.dev/docs/react-use-reduced-motion`]
- For bundle size, official docs recommend `import * as m from "motion/react-m"` plus `LazyMotion`, and warn that using the normal `motion` component breaks LazyMotion's benefits. [Source: `https://motion.dev/docs/react-reduce-bundle-size`]

### Testing Requirements

- Co-located unit tests remain the default; never create `__tests__/` directories. [Source: `vault/Planning/Architecture-Key.md:103`]
- Existing test stack: Vitest + Testing Library for unit/jsdom, Playwright for real browser, axe/Lighthouse for a11y and performance. [Source: `vault/Code/Frontend.md:91`; `vault/Code/Frontend.md:102`; `vault/Code/Frontend.md:115`]
- Playwright config auto-starts `npm run dev` unless `PLAYWRIGHT_BASE_URL` is provided. Previous Story 3.1 Playwright runs were blocked in this sandbox by server/listen permissions; if that recurs, document it exactly and still run typecheck/unit/build. [Source: `playwright.config.ts:28`; `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md:167`]
- Lighthouse budgets are already encoded in `lighthouserc.json` and `lighthouserc.mobile.json`; do not weaken thresholds to pass this story. [Source: `lighthouserc.json:17`; `lighthouserc.json:21`]

### Project Structure Notes

- Expected new files: `src/components/sections/MotionSection.tsx`, optional `src/components/sections/motionFeatures.ts`, co-located `MotionSection.test.tsx`, optional `src/components/ui/GradientButton.test.tsx`, and one Playwright spec under `tests/e2e/`.
- Expected updated files: animated public section components, `GradientButton.tsx`, `package.json`, `package-lock.json`, `tests/e2e/locale-switch.spec.ts`.
- Do not move section components or change the public route tree. Do not unwrap `Home.tsx` fallback boundaries.
- Build artifact check is manual/scripted inspection of `dist/client/assets`; no new production dependency or route is needed for bundle analysis.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md:789`] - Story 3.2 ACs
- [Source: `_bmad-output/planning-artifacts/prd.md:326`] - LCP/FID/CLS budgets
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md:593`] - locale switch and reduced-motion UX requirements
- [Source: `src/pages/Home.tsx:5`] - current lazy section imports
- [Source: `src/components/ui/GradientButton.tsx:23`] - current CTA transition implementation
- [Source: `src/i18n/LanguageSwitcher.tsx:14`] - current locale switch flow
- [Source: `vault/Planning/Architecture-Key.md:141`] - canonical Lazy + Suspense + ErrorBoundary pattern
- [Source: `vault/Code/Frontend.md:115`] - Lighthouse CI and performance gate commands
- [Source: `https://motion.dev/docs/react-installation`] - current Motion React package/import guidance
- [Source: `https://motion.dev/docs/react-reduce-bundle-size`] - LazyMotion/react-m bundle-size guidance

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

### Completion Notes List

- Created by BMAD create-story workflow in YOLO mode.
- Validation applied: clarified Framer Motion vs current `motion` package, blocked main-bundle imports, scoped Hero/LCP risk, added reduced-motion requirements, and expanded tests for locale scroll and hover layout stability.

### File List
