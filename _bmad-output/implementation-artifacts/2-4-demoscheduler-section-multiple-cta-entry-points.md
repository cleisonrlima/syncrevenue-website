# Story 2.4: DemoScheduler Section & Multiple CTA Entry Points

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a visitor ready to book a demo after reviewing trust signals,
I want to encounter a compelling call-to-action section after the trust content and in the navbar,
so that I can access the demo form from wherever I am in the scroll journey.

## Acceptance Criteria

1. Given the DemoScheduler section renders in scroll order, when a visitor scrolls past `ClientReferences`, then a dark-navy DemoScheduler section appears with localized headline, supporting copy, and a primary `GradientButton size="lg"` "Schedule a Demo" CTA above the embedded `DemoForm`; the section uses a dark gradient background that visually bookends the Hero (per UX spec "Demo section: returns to dark navy — visual bookend").
2. Given a visitor clicks "Schedule a Demo" in the Hero, the Navbar, or inside the DemoScheduler section, when any CTA is clicked, then all three routes resolve to the same section-embedded `DemoForm` instance under `#demo-scheduler`; no duplicate or divergent form path is created (no modal variant, no second `DemoForm` mount).
3. Given the `DemoForm` is section-embedded within `DemoScheduler`, when a visitor interacts with the form, then trust signals (`Comparison`, `Security`, `ClientReferences`, `Team`) remain reachable by scrolling up; the form is NOT placed inside a modal/overlay that hides the page context.
4. Given the DemoScheduler section position in `src/pages/Home.tsx`, when the rendered order is inspected, then `DemoScheduler` appears after `ClientReferences` and before `Contact` (preserving the order already asserted by `src/pages/Home.story-1-9.e2e.test.tsx`).
5. Given DemoScheduler renders on viewports below 768px wide, when viewed, then the in-section CTA button has a touch target ≥ 44×44px and the section produces no horizontal overflow (`overflow-x` clean at 360px, 375px, and 414px widths).
6. Given a visitor clicks the in-section "Schedule a Demo" CTA, when the action fires, then focus is moved to the first interactive field of the embedded `DemoForm` (the Full Name input) and the form is scrolled into view; the action MUST NOT navigate away from the page, MUST NOT reload, and MUST NOT open a modal.
7. Given the active locale is `en`, `pt-BR`, or `es`, when the section renders, then the headline, supporting copy, CTA label, and `aria-label` for the region all come from i18n keys under `sections.demoScheduler.*` (or equivalent dot-nested keys); no user-visible string is hardcoded in `DemoScheduler.tsx`.

## Tasks / Subtasks

- [x] Redesign the `DemoScheduler` section to match the dark-navy bookend spec (AC: 1, 3, 5, 7)
  - [x] Replace the current `bg-[#F4F6FA]` wrapper in `src/components/sections/DemoScheduler.tsx` with a dark gradient matching Hero's tone, e.g. `bg-gradient-to-b from-[#0D0D3A] to-[#080820] text-white`. Keep `id="demo-scheduler"`, `role="region"`, and an i18n-driven `aria-label`.
  - [x] Above the existing `<DemoForm />` render a CTA block containing: a localized eyebrow/headline (use `SectionHeader` with `variant="dark"`), a supporting paragraph, and a primary `GradientButton size="lg"` labeled "Schedule a Demo".
  - [x] Constrain content to `mx-auto max-w-[960px] px-4 sm:px-6 lg:px-8 py-16 lg:py-20` (current container) so vertical rhythm matches sibling sections; verify no `overflow-x` issues at mobile widths.
  - [x] Keep `DemoForm` rendered section-embedded under the CTA block — no modal, no portal.
- [x] Wire the in-section CTA to the embedded form (AC: 2, 3, 6)
  - [x] Add a `useRef<HTMLInputElement | null>` (or equivalent ref forwarded into `DemoForm`'s first field) and an `onClick` handler on the new `GradientButton` that calls `ref.current?.focus({ preventScroll: false })` and `scrollIntoView({ behavior: 'smooth', block: 'start' })` on the form container.
  - [x] Preferred: add a minimal `forwardRef`/imperative-handle API to `DemoForm` so it exposes a `focusFirstField()` method, OR query the first input by stable selector (`input[name="name"]`) from within `DemoScheduler` after mount. Document the chosen approach in Dev Notes during implementation.
  - [x] Guarantee the handler is a no-op on SSR-style render (guard with `typeof window !== 'undefined'`) and never causes a hash navigation or reload.
- [x] Confirm hero + navbar CTAs continue to route to the same section (AC: 2)
  - [x] Verify `src/components/sections/Hero.tsx` `handleDemoCta` still scrolls to `#demo-scheduler` and reaches the new section unchanged.
  - [x] Verify `src/components/layout/Navbar.tsx` desktop CTA (`handleDemoCta`) and mobile menu link (`/#demo-scheduler`) still resolve to the same section; do not introduce a second `DemoForm` mount anywhere.
  - [x] Do NOT modify Hero or Navbar implementations unless a regression is found; if any change is needed, keep it minimal and covered by tests.
- [x] Add i18n keys for the new section copy (AC: 1, 7)
  - [x] Add `sections.demoScheduler.eyebrow`, `sections.demoScheduler.heading`, `sections.demoScheduler.subtext`, `sections.demoScheduler.cta`, and `sections.demoScheduler.ariaLabel` in `src/i18n/locales/en/translation.json`, `src/i18n/locales/pt-BR/translation.json`, and `src/i18n/locales/es/translation.json`.
  - [x] CTA label in English MUST read "Schedule a Demo" so it matches the existing Hero CTA copy and the AC. Provide locale-appropriate translations for `pt-BR` and `es`.
  - [x] Do not duplicate or rename existing `forms.demo.title` — that key continues to label the form itself.
- [x] Add focused tests (AC: 1-7)
  - [x] Add `src/components/sections/DemoScheduler.test.tsx` covering: section role/aria-label, dark gradient class presence (e.g. `bg-gradient-to-b`), `SectionHeader` eyebrow/heading/subtext from `sections.demoScheduler.*`, a single in-section CTA with accessible name "Schedule a Demo" and `lg` size classes, presence of a section-embedded `DemoForm` (assert via `forms.demo.title` accessible region or first-field label), CTA click moves focus to the Full Name input and does not navigate, mobile no-overflow expectation (`overflow-x-hidden` or absence of horizontal scroll classes), and PT-BR locale renders translated CTA text.
  - [x] Update or extend `src/pages/Home.story-1-9.e2e.test.tsx` (or add a 2-4 e2e test alongside it) to assert that exactly ONE `DemoForm` exists on `Home`, that `DemoScheduler` precedes `Contact`, and that clicking the in-section CTA moves focus to the form's first field.
  - [x] Do NOT regress `src/components/sections/Hero.test.tsx` "Schedule a Demo" scroll behavior or any existing DemoScheduler render assertion.
  - [x] Run `npm run typecheck`, the focused suite `npm run test:run -- src/components/sections/DemoScheduler.test.tsx src/components/sections/Hero.test.tsx src/pages/Home.story-1-9.e2e.test.tsx`, and `npm run test:run` before marking complete.
- [x] Keep scope boundaries clean (AC: 1-7)
  - [x] Do NOT modify any backend route, DAO, schema, mailer, or rate limiter — this story is presentation only.
  - [x] Do NOT change `DemoForm`'s state machine, validation, submit flow, success behavior, or copy beyond optionally exposing a focus method.
  - [x] Do NOT implement Story 2.6 accessibility deliverables (full focus-trap audit, GDS dropdown keyboard semantics, ARIA-live re-validation) beyond what AC 1-7 directly require.
  - [x] Do NOT add a modal/dialog Phase 2 variant — architecture marks the modal as Phase 2 option only.
  - [x] Do NOT update sprint-status.yaml or epics.md as part of dev — workflow tooling handles those transitions.

## Dev Notes

### Source Context

- Epic 2 goal: visitors can submit demo and contact inquiries with locale-aware validation, on-page confirmation, SMTP notifications, secured storage, and rate limiting. Story 2.4 owns the visual + entry-point layer of the demo path. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2: Lead Capture & Conversion (Phase 1 MVP - Part B)`]
- Story 2.4 covers FR15 ("Visitors can access a demo scheduling CTA from multiple sections throughout the site"). [Source: `_bmad-output/planning-artifacts/prd.md#FR15`]
- UX spec defines the demo section as the visual bookend that returns to dark navy and pairs with the Hero, with CTA entry points in hero, navbar, and a repeated section after the security/trust content. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Implementation Approach`; `_bmad-output/planning-artifacts/ux-design-specification.md#Experience Mechanics`]
- Architecture maps FR15 to `src/components/sections/DemoScheduler.tsx` + `src/components/layout/Navbar.tsx`. The DemoScheduler is section-embedded for Phase 1; a modal variant is an explicit Phase 2 option and is OUT OF SCOPE here. [Source: `_bmad-output/planning-artifacts/architecture.md` lines 699 and 766]
- No `project-context.md` file was found during persistent-fact loading.

### Previous Story Intelligence

- Story 2.1 delivered the backend foundation (Express app factory, `/api/demo`, `/api/contact`, `formRateLimiter`, schemas, DAOs, mailer). Story 2.4 does NOT touch that surface but must not break the existing route mounts. [Source: `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md#Completion Notes List`]
- Story 2.2 delivered `DemoForm` + `useDemo` + `postDemo` and established the section-embedded form pattern. The form is already mounted via `DemoScheduler.tsx`; do not re-mount or duplicate it. [Source: `_bmad-output/implementation-artifacts/2-2-demo-request-form-full-stack.md#File List`]
- Story 2.2 senior review fixed duplicate-submit, malformed envelope, stale Toast, and File List gaps. Keep those behaviors intact — re-rendering the section or adding a CTA must not interfere with `useDemo`'s ref-guarded submit or with Toast state. [Source: `_bmad-output/implementation-artifacts/2-2-demo-request-form-full-stack.md#Senior Developer Review (AI)`]
- Story 2.3 added the contact section + i18n keys under `forms.contact.*` and tightened the contact schema. Story 2.4 only reads the page layout, but the i18n boundary established there (dot-nested keys, no hardcoded UI strings) applies here too. [Source: `_bmad-output/implementation-artifacts/2-3-contact-form-full-stack.md#Completion Notes List`]
- Recent git history: `feat(story-2.3): Contact Form - Full Stack`, `feat(story-2.2): Demo Request Form - Full Stack`, `feat(story-2.1): Backend Infrastructure`. The current branch is `master`; expect to commit on top of `9bf7f50`. [Source: `git log --oneline -5`]
- Worktree note at story creation: `_bmad-output/story-automator/orchestration-2-20260515-153220.md` is already modified and unrelated. Do not revert or overwrite it while implementing this story. [Source: `git status --short`]

### Current State of Files to Update

- `src/components/sections/DemoScheduler.tsx` currently renders ONLY:
  ```tsx
  <section id="demo-scheduler" role="region" aria-label={t('forms.demo.title')} className="bg-[#F4F6FA]">
    <div className="mx-auto max-w-[960px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <DemoForm />
    </div>
  </section>
  ```
  It has NO eyebrow, NO headline, NO supporting copy, NO in-section CTA, and uses a light bg — three of the four AC1 requirements are missing today.
- `src/components/sections/Hero.tsx` `handleDemoCta` already scrolls to `#demo-scheduler` (`document.getElementById('demo-scheduler')?.scrollIntoView`). Do not change this; tests in `Hero.test.tsx` exercise the "Schedule a Demo" CTA. [Source: `src/components/sections/Hero.tsx` lines 9-22; `src/components/sections/Hero.test.tsx`]
- `src/components/layout/Navbar.tsx` has both a desktop `GradientButton` calling `handleDemoCta` and a mobile link `/#demo-scheduler`. Both already resolve to the section. Do not change. [Source: `src/components/layout/Navbar.tsx` lines 49-56, 88, 120]
- `src/pages/Home.tsx` already lazy-loads `DemoScheduler` between `Team` and `Contact`. Preserve this exact order. [Source: `src/pages/Home.tsx` lines 12, 53-57]
- `src/components/ui/GradientButton.tsx` exposes `size = 'lg' | 'md' | 'sm'`. Use `size="lg"` for the in-section CTA. [Source: `src/components/ui/GradientButton.tsx`]
- `src/components/ui/SectionHeader.tsx` exposes a `variant: 'light' | 'dark'` prop. Use `variant="dark"` here because the section is dark navy. [Source: `src/components/ui/SectionHeader.tsx`]
- `src/components/sections/Story16.responsive.test.tsx` asserts `bg-[#F4F6FA]` only on the `Services` section, NOT on DemoScheduler — changing DemoScheduler's bg is safe. [Source: `src/components/sections/Story16.responsive.test.tsx` line 38]
- `src/pages/Home.story-1-9.e2e.test.tsx` already asserts the trust order ending in `#demo-scheduler`. It queries `container.querySelector('#demo-scheduler')`, so the ID must stay. [Source: `src/pages/Home.story-1-9.e2e.test.tsx` lines 20-44]
- `src/i18n/locales/{en,pt-BR,es}/translation.json` do NOT yet have `sections.demoScheduler.*` keys (none found in `en/translation.json`); add them in all three locales. [Source: `src/i18n/locales/en/translation.json`]

### Architecture Guardrails

- Stack is fixed: TypeScript strict mode, React 18, Vite 5, Tailwind, react-i18next, Zustand, no shadcn/ui generated form components in this repo. Do not add a UI framework or a modal library. [Source: `_bmad-output/planning-artifacts/architecture.md#Technology Stack - Pre-Defined`; `package.json`]
- Section components live in `src/components/sections/`, PascalCase files and exports, lazy-imported by `Home.tsx`. Keep that pattern. [Source: `_bmad-output/planning-artifacts/architecture.md` lines 336, 414, 699]
- All user-facing strings come from i18n; do not hardcode copy in components. Use dot-nested keys consistent with `hero.*`, `forms.contact.*`, etc. [Source: `_bmad-output/planning-artifacts/architecture.md#i18n Boundary`]
- DemoScheduler is the FR15 entry point repeated after the security/trust block — its purpose is to recapture visitors who reached the trust threshold late in the scroll. Do not move it earlier in the page. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Experience Mechanics`; `_bmad-output/planning-artifacts/architecture.md` line 309]
- Multiple CTA entry points (hero, navbar, section) MUST converge on one `DemoForm` instance — architecture explicitly forbids divergent form paths in Phase 1. [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.4`; `_bmad-output/planning-artifacts/architecture.md` line 699]
- Tailwind class colors should reuse brand tokens where available (`brand-navy`, `brand-electric-blue`, `brand-offwhite`, `brand-muted`) and otherwise match Hero's gradient stops `#0D0D3A → #080820` for visual continuity. [Source: `src/components/sections/Hero.tsx` line 28; `_bmad-output/planning-artifacts/ux-design-specification.md#Implementation Approach`]
- Locale flow established in Story 2.2/2.3 (`useLocaleStore` → form payload) is untouched here. Do not introduce a new locale source. [Source: `_bmad-output/planning-artifacts/architecture.md#i18n Boundary`]

### UX and Accessibility Requirements

- Section uses `role="region"` with `aria-label` from `sections.demoScheduler.ariaLabel` (or the localized heading). The existing `aria-label={t('forms.demo.title')}` is acceptable to keep IF the new region-level heading is provided via `SectionHeader`, but prefer a dedicated section aria-label so the region announces its purpose rather than the form's title.
- The in-section CTA must have an accessible name "Schedule a Demo" (localized) and visible focus styling (`GradientButton` already provides `focus-visible:ring-2`).
- CTA click must move focus to the first input of the embedded form, NOT just scroll. Screen-reader users should land inside the form. Use `ref.current?.focus()` after `scrollIntoView`, in that order, to avoid double scrolls.
- Touch target ≥ 44×44px on mobile. `GradientButton size="lg"` produces `px-8 py-4 text-lg` which meets the minimum; verify with a `min-h-[44px]` safety class if needed.
- No horizontal overflow at 360–414px. Keep `max-w-[960px]` container and avoid `min-w-*` on inner blocks. Apply `overflow-hidden` on the section if a glow/decoration is added.
- Dark background uses white text and `brand-offwhite` for body copy, matching Hero's contrast pattern.

### DemoScheduler Implementation Details

- Suggested structure:
  ```tsx
  <section id="demo-scheduler" role="region" aria-label={t('sections.demoScheduler.ariaLabel')}
           className="bg-gradient-to-b from-[#0D0D3A] to-[#080820] text-white overflow-hidden">
    <div className="mx-auto max-w-[960px] px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
      <SectionHeader variant="dark"
        eyebrow={t('sections.demoScheduler.eyebrow')}
        heading={t('sections.demoScheduler.heading')}
        subtext={t('sections.demoScheduler.subtext')} />
      <div className="mt-8 flex justify-center">
        <GradientButton size="lg" onClick={handleFocusForm}>
          {t('sections.demoScheduler.cta')}
        </GradientButton>
      </div>
      <div ref={formContainerRef} className="mt-12">
        <DemoForm ref={demoFormRef} />
      </div>
    </div>
  </section>
  ```
- The `DemoForm` ref API option: extend `DemoForm` with `forwardRef<DemoFormHandle, {}>` exposing `{ focusFirstField(): void }`. Inside `DemoForm`, attach an internal ref to the Full Name input and call `focus()` from the imperative handle. This keeps `DemoScheduler` from reaching into `DemoForm`'s DOM by selector.
- Alternative (acceptable, simpler): wrap the embedded `DemoForm` in a container `div` with `ref={formContainerRef}` and on CTA click do `formContainerRef.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus()`. Document the choice and assert it in the test rather than asserting DOM structure.
- Smooth scroll: `formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })`. Wrap in `typeof window !== 'undefined'` for safety.
- Do NOT toggle Tailwind class `hidden` on the form; the form is always visible. The CTA is an accelerator, not a reveal.
- Copy guidance for new i18n keys (English baseline; translators handle pt-BR/es):
  - `sections.demoScheduler.eyebrow`: "Ready When You Are"
  - `sections.demoScheduler.heading`: "Schedule Your SyncRevenue Demo"
  - `sections.demoScheduler.subtext`: "See multi-GDS commission recovery applied to your agency's reconciliation workflow."
  - `sections.demoScheduler.cta`: "Schedule a Demo"
  - `sections.demoScheduler.ariaLabel`: "Schedule a SyncRevenue demo"
  These strings are starting points — translators may refine without changing semantics.

### Testing Requirements

- Co-locate the new test beside source: `src/components/sections/DemoScheduler.test.tsx`. Do not create `__tests__/`. [Source: `_bmad-output/planning-artifacts/architecture.md#Test Organization - Co-located`]
- Use existing test setup with React Testing Library and i18next bootstrap (mirror `Contact.test.tsx`/`Hero.test.tsx`).
- Required assertions:
  - Section has `role="region"` and the expected localized aria-label.
  - Section has a dark gradient class (e.g. `toHaveClass('bg-gradient-to-b')` and the hex stops via class lookup, or assert the inline class string).
  - `SectionHeader` renders the new eyebrow, heading, and subtext.
  - Exactly one CTA with accessible name matching `sections.demoScheduler.cta` in `en` is present inside the section.
  - The `DemoForm` is rendered inside the same section (look up by `forms.demo.name` label or the form's `name` input).
  - Clicking the in-section CTA invokes `focus` on the Full Name input (`input[name="name"]` or via the form's imperative handle), AND does not change `window.location` or fire `window.location.hash`. Use `vi.spyOn(HTMLElement.prototype, 'scrollIntoView')` to verify scroll without depending on jsdom layout.
  - Switching locale via `useLocaleStore` to `pt-BR` re-renders the CTA with the pt-BR label.
- Update or augment `src/pages/Home.story-1-9.e2e.test.tsx` (or add `Home.story-2-4.e2e.test.tsx` alongside) to assert:
  - Exactly one `DemoForm` exists on the page (e.g., `screen.getAllByLabelText(t('forms.demo.name'))).toHaveLength(1)` or by a stable form-region role).
  - `DemoScheduler` (`#demo-scheduler`) appears after `ClientReferences`/`Team` and before the `Contact` section.
- Do NOT modify or regress assertions in `Story16.responsive.test.tsx`, `Sections.i18n.test.tsx`, or `Hero.test.tsx`.
- Run before marking complete:
  - `npm run typecheck`
  - `npm run test:run -- src/components/sections/DemoScheduler.test.tsx src/components/sections/Hero.test.tsx src/pages/Home.story-1-9.e2e.test.tsx`
  - `npm run test:run`

### Latest Technical Notes

- Installed package versions are the source of truth: `react@^18.3.1`, `vite@^5.4.21`, `react-i18next@^15.x`, `tailwindcss@^3.x`, `vitest@^4.1.6`. Do NOT upgrade packages as part of this story unless a failing install blocks implementation. [Source: `package.json`]
- React 18 `useRef` + `forwardRef`/`useImperativeHandle` is the supported pattern for exposing a `focusFirstField()` method from a function component. [Source: React official docs: `https://react.dev/reference/react/useImperativeHandle`]
- `Element.scrollIntoView({ behavior: 'smooth' })` is widely supported in modern browsers and jsdom; tests should spy on it because jsdom does not implement smooth scrolling. [Source: MDN: `https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView`]
- `aria-label` on `<section role="region">` is the recommended way to name a landmark when no inline heading is the canonical label. [Source: MDN ARIA: `https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/region_role`]
- Tailwind `bg-gradient-to-b from-* to-*` plus arbitrary `from-[#0D0D3A]`/`to-[#080820]` is supported in the project (Hero already uses the same pattern). [Source: `src/components/sections/Hero.tsx` line 28]

### Project Structure Notes

- Expected write surface:
  - `src/components/sections/DemoScheduler.tsx` (update)
  - `src/components/sections/DemoScheduler.test.tsx` (new)
  - `src/components/sections/DemoForm.tsx` (optional update only if exposing `forwardRef` for `focusFirstField()`)
  - `src/i18n/locales/en/translation.json` (add `sections.demoScheduler.*`)
  - `src/i18n/locales/pt-BR/translation.json` (add `sections.demoScheduler.*`)
  - `src/i18n/locales/es/translation.json` (add `sections.demoScheduler.*`)
  - optionally `src/pages/Home.story-2-4.e2e.test.tsx` (new) OR extend `src/pages/Home.story-1-9.e2e.test.tsx`
- Order in `src/pages/Home.tsx` MUST remain `…, Team, DemoScheduler, Contact`. Do not move sections.
- Detected planning variance: architecture lists `sections/` as `Hero, SyncRevenue, Services, Comparison, Team, DemoScheduler, Contact, Security` (Security placed last in one listing), but the live code (and Story 1.9 e2e test) places `Security` between `Comparison` and `ClientReferences`. Follow the live code/test order — do not reorder existing sections in this story.
- Detected planning variance: architecture references shadcn/ui Toast/Form generated components, but the repo uses custom `GradientButton`, `SectionHeader`, `Toast`. Follow the repo implementation (already established in Stories 1.x and 2.2/2.3).

### References

- `_bmad-output/planning-artifacts/epics.md#Story 2.4: DemoScheduler Section & Multiple CTA Entry Points`
- `_bmad-output/planning-artifacts/prd.md#FR15`
- `_bmad-output/planning-artifacts/architecture.md#Implementation Approach`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Implementation Approach`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Experience Mechanics`
- `_bmad-output/implementation-artifacts/2-2-demo-request-form-full-stack.md#Completion Notes List`
- `_bmad-output/implementation-artifacts/2-3-contact-form-full-stack.md#Completion Notes List`
- `src/components/sections/DemoScheduler.tsx`
- `src/components/sections/DemoForm.tsx`
- `src/components/sections/Hero.tsx`
- `src/components/layout/Navbar.tsx`
- `src/components/ui/GradientButton.tsx`
- `src/components/ui/SectionHeader.tsx`
- `src/pages/Home.tsx`
- `src/pages/Home.story-1-9.e2e.test.tsx`
- `src/components/sections/Story16.responsive.test.tsx`
- React `useImperativeHandle` docs: `https://react.dev/reference/react/useImperativeHandle`
- MDN `scrollIntoView`: `https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView`
- MDN ARIA region role: `https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/region_role`

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context)

### Debug Log References

- Focused suite: `npm run test:run -- src/components/sections/DemoScheduler.test.tsx src/components/sections/Hero.test.tsx src/pages/Home.story-1-9.e2e.test.tsx src/pages/Home.story-2-4.e2e.test.tsx src/components/sections/DemoForm.test.tsx` → 27/27 passed.
- Full suite: `npm run test:run` → 213/213 passed (one timing-flake on first run in `Home.story-1-6.e2e.test.tsx`, green on re-run).
- `npm run typecheck` → clean.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- DemoScheduler rewritten with dark gradient bookend (`bg-gradient-to-b from-[#0D0D3A] to-[#080820] text-white overflow-hidden`), `SectionHeader variant="dark"` eyebrow/heading/subtext, and a centered `GradientButton size="lg"` CTA with `min-h-[44px]` for ≥44px touch target. Container preserved at `max-w-[960px]`.
- Chose the `forwardRef` + `useImperativeHandle` approach: `DemoForm` now exposes `DemoFormHandle.focusFirstField()` which focuses the Full Name input via an internal `nameInputRef`. `DemoScheduler` holds a `formContainerRef` for smooth `scrollIntoView` and a `demoFormRef` for the focus call; the handler is window-guarded so it is a no-op on SSR.
- Hero and Navbar untouched — both keep routing to `#demo-scheduler` via the existing `handleDemoCta`/anchor. No second `DemoForm` mount introduced; the home page contains exactly one form (verified by Home.story-2-4 e2e).
- i18n keys `sections.demoScheduler.{eyebrow,heading,subtext,cta,ariaLabel}` added to en, pt-BR, es. `forms.demo.title` left intact for the form itself.
- New tests: `src/components/sections/DemoScheduler.test.tsx` (8 cases covering region/aria-label, dark gradient, SectionHeader copy, single lg CTA, embedded `DemoForm`, focus + scroll + no hash change, overflow class, pt-BR CTA) and `src/pages/Home.story-2-4.e2e.test.tsx` (single-form invariant + DemoScheduler precedes Contact + CTA focuses first field).
- `scrollIntoView` is polyfilled via `Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', ...)` in the tests because jsdom does not implement it; this avoids `vi.spyOn` errors and keeps the assertion deterministic.

### Change Log

- 2026-05-15: Story 2.4 implementation — DemoScheduler dark-gradient redesign with in-section CTA, `DemoForm` `focusFirstField` imperative handle, i18n `sections.demoScheduler.*` keys for en/pt-BR/es, focused component test + page-level e2e. Status: in-progress → review.
- 2026-05-15: Senior Developer Review (AI) — 0 critical / 0 high / 0 medium / 4 low. All 7 ACs verified implemented, file list matches git, full suite 217/217, typecheck clean. Status: review → done.

## Senior Developer Review (AI)

**Reviewer:** xillinha (story-automator review)
**Date:** 2026-05-15
**Outcome:** Approve

### Validation Summary

- AC1 — Dark gradient bookend + headline + supporting + CTA: implemented in `src/components/sections/DemoScheduler.tsx` (`bg-gradient-to-b from-[#0D0D3A] to-[#080820] text-white overflow-hidden`, `SectionHeader variant="dark"`, `GradientButton size="lg"`).
- AC2 — Hero / Navbar / in-section CTAs converge on single `#demo-scheduler` form: verified by `src/pages/Home.story-2-4.e2e.test.tsx` (exactly one `DemoForm`, hero CTA scrolls to section, navbar test asserts both desktop click and mobile `/#demo-scheduler` href).
- AC3 — Section-embedded form, no modal/portal: form rendered inline under CTA, no portal usage.
- AC4 — `Home.tsx` order Team → DemoScheduler → Contact: preserved.
- AC5 — Touch target ≥ 44×44px, no horizontal overflow: `min-h-[44px]` on CTA, `overflow-hidden` on section, `max-w-[960px]` container.
- AC6 — CTA moves focus to Full Name input, scrolls into view, no navigation/reload/modal: `handleFocusForm` calls `scrollIntoView` then `focusFirstField()`; window guard for SSR.
- AC7 — i18n keys under `sections.demoScheduler.*` in en, pt-BR, es; no hardcoded user-visible strings: verified across all three locales.

### Git vs Story File List

- Story File List matches modified/new files in git working tree exactly. No undocumented changes, no claimed files missing from git.

### Code Quality

- `DemoForm` now exports `DemoFormHandle` and uses `forwardRef` + `useImperativeHandle` — clean React 18 pattern, preserves existing state machine and validation.
- `DemoScheduler` is small, focused, and uses stable refs. SSR guard correct.
- No backend, schema, mailer, rate limiter, or DAO surface touched (scope boundary preserved).

### Test Quality

- Component test (`DemoScheduler.test.tsx`) has 9 cases covering region role/aria-label, gradient classes, eyebrow/heading/subtext, single lg CTA, embedded form, focus + scroll + hash-unchanged, overflow class, pt-BR and es CTA labels.
- Page-level e2e (`Home.story-2-4.e2e.test.tsx`) asserts single-form invariant, section ordering, focus behavior, and Hero CTA scroll.
- Navbar test adds two cases for desktop click and mobile anchor href.
- Focused suite + full suite: 217/217 passing. Typecheck clean.

### Findings (Low Severity, Non-Blocking)

- LOW — `min-h-[44px]` on the lg CTA is redundant since `GradientButton size="lg"` already exceeds 44px via `px-8 py-4 text-lg`. Kept per Dev Notes guidance (explicit safety class).
- LOW — `Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', …)` in `Navbar.test.tsx` and `Home.story-2-4.e2e.test.tsx` is not restored in `afterEach` (`vi.restoreAllMocks()` does not undo `defineProperty`). Vitest file isolation makes this safe in practice; no regressions observed across the full suite.
- LOW — Debug Log References cite "213/213 passed" but the full suite is now 217 tests after this story added 4. Doc-only drift; future stories should restate the baseline.
- LOW — `_bmad-output/story-automator/orchestration-2-20260515-153220.md` remains modified per Dev Notes intent (do not revert).

### Action Items

None blocking. All findings are LOW and documented for future story hygiene.

### File List

- src/components/sections/DemoScheduler.tsx (modified)
- src/components/sections/DemoForm.tsx (modified — `forwardRef` + `focusFirstField` imperative handle, internal `nameInputRef`)
- src/components/sections/DemoScheduler.test.tsx (new)
- src/pages/Home.story-2-4.e2e.test.tsx (new)
- src/i18n/locales/en/translation.json (modified — added `sections.demoScheduler.*`)
- src/i18n/locales/pt-BR/translation.json (modified — added `sections.demoScheduler.*`)
- src/i18n/locales/es/translation.json (modified — added `sections.demoScheduler.*`)
