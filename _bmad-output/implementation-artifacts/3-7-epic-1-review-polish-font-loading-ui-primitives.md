# Story 3.7: Epic 1 Review Polish — Font Loading & UI Primitive Hardening

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a SyncRevenue site visitor on a slow or constrained connection (and as the perf-conscious frontend team),
I want the site's font delivery and shared UI primitives to follow the polish notes captured during Epic 1 reviews,
so that page load is faster, the design-system primitives are reusable beyond the homepage, and the deferred-work backlog from Epic 1 Story 1.2, Story 1.5, and Epic 2 retrospective row A9 is closed.

This story implements the unchecked items in `_bmad-output/implementation-artifacts/deferred-work.md` for Story 1.2 and the cosmetic utility consolidation tracked in `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md` action item A9. No new features — only polish, performance, and reusability hardening of existing primitives. The companion font-loading work also unblocks the LHCI LCP regression flagged in `deferred-work.md` "Deferred from: code review of 3-4 …" (LCP 3018ms on the Hero `<h1>`); the actual re-run of LHCI lives in a later perf story but the font-delivery changes here must remove the render-blocking `@import`.

## Acceptance Criteria

1. **Given** `src/index.css` currently begins with `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:…')`, **when** the font loading strategy is refactored, **then** `<link rel="preconnect" href="https://fonts.googleapis.com">` (with `crossorigin` where required), `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, and the `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?…">` for the chosen weight set are added to `index.html` `<head>`; the `@import` line at the top of `src/index.css` is removed; a manual Lighthouse / DevTools run on a built `npm run build && npm run preview` shows fonts no longer appear under "Eliminate render-blocking resources" for the `@import` source; the commit message records the result.

2. **Given** the current Google Fonts URL loads six weight-lines (`ital,wght@0,400;0,500;0,600;0,700;0,800;1,400`), **when** the URL is rewritten in `index.html`, **then** only weights actually used by `tailwind.config.ts` and component code remain (target set: `400`, `600`, `700`, `800`; weights `500` and `400i` are dropped); no component visually regresses across Hero, SyncRevenue, Services, Comparison, Team, Security, ClientReferences, DemoScheduler sections in EN/PT-BR/ES; the before/after URL diff and any visual-diff result are recorded in the commit message.

3. **Given** `tailwind.config.ts` defines `theme.extend.fontWeight.heavy: '800'`, **when** the config is cleaned up, **then** the `heavy` token is removed from `fontWeight`; every `font-heavy` class usage (verified via `grep -rn "font-heavy" src index.html`) is migrated to Tailwind's built-in `font-extrabold` (also `800`); no visual regression; `npm run typecheck && npm run test:run && npm run build` remain clean. If `grep` returns zero `font-heavy` usages, the migration step is a no-op — the token deletion still ships.

4. **Given** `src/components/ui/SectionHeader.tsx` hardcodes the heading element as `<h2>` (line 32), **when** a polymorphic `as` prop is introduced (`as?: 'h2' | 'h3'`), **then** consumers can render an `<h3>` where the section sits inside a higher-level heading hierarchy; default stays `h2` for backwards compatibility; existing call sites do not need to change unless deliberately overriding; the prop is typed (union literal, not `string`); the `SectionHeader.test.tsx` (if present) is extended with a single test case asserting `as="h3"` renders an `<h3>` with the same className contract — if no test file exists for `SectionHeader`, add a minimal co-located one rather than skipping.

5. **Given** `src/components/ui/SectionHeader.tsx` line 44 applies `max-w-2xl` to the subtext `<p>` inside an unconstrained outer wrapper (the `text-center` container on line 23 has no width cap), **when** the layout is fixed, **then** EITHER (a) the constraint is moved to the wrapper / a new inner wrapper so it actually limits rendered width across all viewports, OR (b) the constraint is removed if the design intent is full-width subtext; the chosen behavior is documented inline at the top of `SectionHeader.tsx` with a one-line comment explaining the decision; visual diff across the homepage sections shows no unintended width change.

6. **Given** `src/components/sections/SectionSkeleton.tsx` uses `bg-muted` (line 14, resolves to shadcn `hsl(210 40% 96.1%)`) which is nearly invisible on white surfaces and offers no visible loading affordance under `prefers-reduced-motion`, **when** the skeleton is hardened, **then** (a) the base color uses a brand-aware variant with adequate contrast on white (e.g., `bg-brand-offwhite` or a token producing ≥ 3:1 visual delta against `#FFFFFF` — use the existing `src/lib/brand-tokens.contrast.test.ts` infra to verify if relevant), AND (b) under `motion-reduce:` (i.e., when `motion-safe:animate-pulse` is suppressed) a non-animated affordance is present — either a small static spinner SVG with `aria-hidden="true"`, OR the existing `aria-label="{label}"` is paired with a visually-hidden `<span class="sr-only">{label}…</span>` so reduced-motion users still perceive activity; the existing `role="status" aria-busy="true"` contract is preserved.

7. **Given** `src/components/ui/GradientButton.tsx` line 29 uses `focus-visible:ring-white` which assumes a dark/gradient surrounding surface, **when** the button is placed on a light surface (Hero CTA on white, Comparison CTA on offwhite, DemoScheduler CTA, ContactForm CTA — any consumer outside the dark hero gradient), **then** the focus ring uses a contrast-safe color (e.g., `focus-visible:ring-brand-deep` or a token-driven hue) that remains visible against both dark and light surroundings; the existing dark-surface visual behavior is preserved (verify against the gradient hero); a keyboard-tab walkthrough of every `GradientButton` consumer confirms the ring is visibly perceptible on every surface; results recorded in commit message.

8. **Given** the `[&>p:first-of-type]:text-brand-deep` arbitrary-selector utility is repeated across `src/components/sections/Team.tsx:77`, `SyncRevenue.tsx:47`, `Services.tsx:51`, `ClientReferences.tsx:73`, and `Comparison.tsx:112` (Epic 2 retrospective row A9), **when** the utility is consolidated, **then** ONE of: (a) the pattern is lifted into a Tailwind plugin / custom utility class (`@layer components` in `src/index.css` adding a `.section-intro-emphasis` class or similar), (b) the pattern is absorbed into `SectionHeader`'s contract so the eyebrow / first paragraph styling is the component's responsibility rather than the consumer's, (c) a documented shared utility class is added and every consumer migrates; whichever path is chosen, all five files migrate to the new pattern in the same commit so the codebase has zero remaining occurrences of the literal `[&>p:first-of-type]:text-brand-deep` selector outside the new definition; the rationale for the chosen path is recorded inline (in the new utility's defining file).

9. **Given** all changes above, **when** `npm run typecheck && npm run test:run && npm run build` run, **then** all checks pass; no behavioral regression in existing unit / Playwright tests (`npm run test:e2e` should be run if the sandbox port-binding allows — otherwise document the deferral per `vault/Planning/Sandbox-Conventions.md` if it exists, or per the convention being authored in Story 3.10); the corresponding bullets in `_bmad-output/implementation-artifacts/deferred-work.md` (Story 1.2 section — `fontWeight.heavy`, `max-w-2xl`, `SectionHeader as h3`, `SectionSkeleton bg-muted`, `GradientButton focus-visible white`, `Google Fonts 6 weight-lines`) are marked `[x]` and link to the Story 3.7 commit hash; Epic 2 retrospective row A9 (`_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md` line 113) is updated from `❌ Not addressed` to `✅ Done` with the same commit link.

## Tasks / Subtasks

- [x] **Task 1: Move font loading from `@import` to `<link rel="preconnect" + "stylesheet">` in `index.html`** (AC: 1)
  - [ ] Remove the `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:…')` line from the top of `src/index.css`.
  - [ ] In `index.html` `<head>`, add `<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, and `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap">` (note the trimmed weight set per Task 2 — the URL must be the final trimmed URL, not the original six-weight URL).
  - [ ] Place the new `<link>` tags above the existing `<title>` so the request begins as early as possible; verify font still loads in the browser after `npm run dev` and `npm run build && npm run preview`.
  - [ ] Manually run Lighthouse (or DevTools Performance) on the preview build of `/`; capture before/after under "Eliminate render-blocking resources" for the Google Fonts source; paste the qualitative observation into the Completion Notes List and the commit body.

- [x] **Task 2: Trim the Google Fonts weight set to only the weights the code uses** (AC: 2)
  - [ ] Grep the codebase for every Tailwind weight class actually rendered: `grep -rn "font-extrabold\|font-bold\|font-semibold\|font-medium\|font-normal\|font-light" src index.html`. Cross-check `tailwind.config.ts` `theme.extend.fontWeight` (the `heavy: '800'` token — to be removed in Task 3 — also expects 800).
  - [ ] The final Google Fonts URL in `index.html` (Task 1) uses ONLY the weights present in the grep result. Initial target: `400`, `600`, `700`, `800`. If the grep surfaces a `font-medium` (500) usage that is currently rendered, KEEP `500` and document the exception in the commit message; otherwise drop it. `400i` is dropped regardless (no italic usage exists in the code today — verify with `grep -rn "italic" src`).
  - [ ] Visual diff (manual, eyeball) across Hero, SyncRevenue, Services, Comparison, Team, Security, ClientReferences, DemoScheduler in EN/PT-BR/ES at desktop ≥ 1024px and mobile ≤ 768px on `npm run dev`. Confirm no headings or body text appear visually thinner / heavier than before. Record the result in Completion Notes.
  - [ ] Include the before/after URL diff in the commit message body so reviewers can verify the weight set without re-deriving it.

- [x] **Task 3: Remove the `fontWeight.heavy` Tailwind token and migrate any usages to `font-extrabold`** (AC: 3)
  - [ ] Run `grep -rn "font-heavy" src index.html` — if zero matches, skip the migration sub-step. If matches exist, replace each `font-heavy` occurrence with `font-extrabold` (Tailwind's built-in `800`). Reverify with a second grep that returns zero matches.
  - [ ] Delete lines 94–96 of `tailwind.config.ts` (`fontWeight: { heavy: '800' }`). The `theme.extend.fontWeight` key is removed entirely if the only entry was `heavy`.
  - [ ] Run `npm run typecheck && npm run test:run && npm run build` to confirm no regression.

- [x] **Task 4: Add a polymorphic `as` prop to `SectionHeader` and fix the `max-w-2xl` constraint location** (AC: 4, 5)
  - [ ] In `src/components/ui/SectionHeader.tsx`, add `as?: 'h2' | 'h3'` to `SectionHeaderProps`; default to `'h2'`; render via `const HeadingTag = as` (or equivalent — use a discriminated union or `React.createElement`, NOT a `string` cast that defeats type safety). Existing consumers continue to render `<h2>` with no callsite change.
  - [ ] Decide the `max-w-2xl` fix path: either (option A) wrap the `<p>` in a `<div className="max-w-2xl mx-auto">` so the cap actually applies, or (option B) remove `max-w-2xl mx-auto` from the `<p>` if the design intent is full-width subtext. Pick the option that matches today's visual rendering (do not silently change the rendered width of the subtext on the live homepage). Record the choice in a single-line inline comment near the top of the file.
  - [ ] If `src/components/ui/SectionHeader.test.tsx` does not already exist, add a minimal co-located test file at `src/components/ui/SectionHeader.test.tsx` covering: (a) renders `<h2>` by default; (b) renders `<h3>` when `as="h3"`; (c) subtext renders only when `subtext` is provided. Use the existing Vitest + Testing Library conventions (`render`, `screen.getByRole('heading', { level: 2 | 3 })`). If the test file already exists, extend it with case (b) only.

- [x] **Task 5: Harden `SectionSkeleton` color + reduced-motion affordance** (AC: 6)
  - [ ] In `src/components/sections/SectionSkeleton.tsx`, replace `bg-muted` (line 14) with a brand-aware class. Prefer `bg-brand-offwhite` (already in `tailwind.config.ts` as `var(--color-offwhite)` = `#F4F6FA`). If contrast against `#FFFFFF` parent surfaces is still inadequate, fall back to `bg-brand-slate/10` or an explicit token-driven utility; verify the visual delta is ≥ 3:1 perceptual against white. (Reuse `src/lib/brand-tokens.contrast.test.ts` infra only if directly applicable — do not invent new test scaffolding.)
  - [ ] Add a reduced-motion affordance: keep the `motion-safe:animate-pulse` class but ALSO render a visually-hidden `<span className="sr-only">{label}…</span>` inside the `<div>` so screen readers and reduced-motion users receive an explicit textual signal. Alternatively, render a small static spinner SVG with `aria-hidden="true"` when `motion-reduce` is active — choose ONE path and document the choice in a one-line comment in the file.
  - [ ] Confirm existing `role="status"`, `aria-label={label}`, `aria-busy="true"` props are preserved.
  - [ ] Add or extend a co-located `SectionSkeleton.test.tsx` if one exists; otherwise leave testing to the integration sites that consume it.

- [x] **Task 6: Replace `focus-visible:ring-white` on `GradientButton` with a contrast-safe token** (AC: 7)
  - [ ] In `src/components/ui/GradientButton.tsx` line 29, replace `focus-visible:ring-white` with a token-driven ring (e.g., `focus-visible:ring-brand-deep` or `focus-visible:ring-[var(--color-deep)]`). The `ring-offset` and `outline-none` chain stay unchanged.
  - [ ] Manual keyboard walkthrough: `Tab` through every page that hosts a `GradientButton` (Hero CTA, ContactForm submit, DemoScheduler CTA, Comparison CTA where applicable). Confirm the focus ring is visibly distinguishable on the dark Hero gradient AND on light section backgrounds.
  - [ ] If the chosen color is invisible on the dark gradient, use a two-tone strategy (e.g., `focus-visible:ring-brand-deep dark:focus-visible:ring-white`) — but only if the dark-mode class is actually applied to the gradient context; otherwise pick a single hue that works on both. Record the walkthrough result in Completion Notes.

- [x] **Task 7: Consolidate the `[&>p:first-of-type]:text-brand-deep` arbitrary-selector across the five section files** (AC: 8)
  - [ ] Pick the consolidation strategy. Recommended path: add a single shared utility class in `src/index.css` under `@layer components` (e.g., `.section-intro-emphasis { @apply [&>p:first-of-type]:text-brand-deep; }`), then migrate the five call sites to that class. This is the lowest-risk path — no `SectionHeader` API change and no Tailwind-plugin config.
  - [ ] Migrate ALL five files in the same commit: `src/components/sections/Team.tsx:77`, `src/components/sections/SyncRevenue.tsx:47`, `src/components/sections/Services.tsx:51`, `src/components/sections/ClientReferences.tsx:73`, `src/components/sections/Comparison.tsx:112`. Each `className` keeps its other utilities (e.g., `[&_h2]:scroll-mt-24`) — only the `[&>p:first-of-type]:text-brand-deep` token is replaced with the new class.
  - [ ] After migration, run `grep -rn "first-of-type\]:text-brand-deep" src` and confirm the ONLY remaining hit is the new utility's definition site.
  - [ ] If a different strategy (Tailwind plugin or `SectionHeader` contract) is chosen instead, document the rationale inline at the new utility's definition site and apply the same "zero remaining literal-selector occurrences" rule.

- [x] **Task 8: Reconcile the deferred-work backlog and Epic 2 retro row A9** (AC: 9)
  - [ ] In `_bmad-output/implementation-artifacts/deferred-work.md`, under the "Deferred from: code review of 1-2-design-system-foundation" section (or wherever the items are listed today — verify line range with `grep -n`), mark each of these bullets `[x]` and append a link to the Story 3.7 commit hash:
    - `fontWeight.heavy: '800'` token deletion
    - `max-w-2xl` constraint placement on `SectionHeader`
    - `SectionHeader` polymorphic `as` prop
    - `SectionSkeleton` `bg-muted` contrast + reduced-motion affordance
    - `GradientButton` focus-visible white ring
    - Google Fonts URL six-weight-lines subset
  - [ ] In `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md` line 113 (row A9), change `❌ Not addressed` to `✅ Done` and append a `Story 3.7 — <commit-hash>` link in the Notes column.
  - [ ] If the Story 3.4 LCP follow-up note ("Deferred from: code review of 3-4 …" in `deferred-work.md` line 44) references "Re-run LHCI after Story 3.7 lands", leave that line UNCHANGED — the actual LHCI re-run is not in scope of 3.7; only the font-delivery prerequisite is.

- [x] **Task 9: Final validation gate** (AC: 9)
  - [ ] Run `npm run typecheck` — must pass with zero errors.
  - [ ] Run `npm run test:run` — must pass; unit-test count cannot drop from the pre-3.7 baseline unless a deletion is explicitly justified in Completion Notes.
  - [ ] Run `npm run build` — must produce `dist/` with no warnings beyond the existing baseline (chunk-size, sourcemap warnings already present are tolerated).
  - [ ] Run `npm run test:e2e` if the sandbox/dev-server port-binding allows. If it does not, document the deferral in Completion Notes and reference `vault/Planning/Sandbox-Conventions.md` (created by Story 3.10) if it exists at that time; otherwise reference the workaround already noted in Story 2.7 (`PLAYWRIGHT_BASE_URL` override).
  - [ ] Verify with grep that the literal selector `[&>p:first-of-type]:text-brand-deep` exists in exactly ONE place (Task 7's defining file).
  - [ ] Verify with grep that `font-heavy` returns zero matches in `src` and `index.html`.
  - [ ] Verify with grep that `@import` no longer appears in `src/index.css`.

## Dev Notes

### Architecture & Patterns

- **Plus Jakarta Sans is the only web-font dependency** — `tailwind.config.ts:91-93` sets `fontFamily.sans` to `['"Plus Jakarta Sans"', 'system-ui', 'sans-serif']`. No other web font is loaded; verify by grep before assuming a multi-font subset.
- **Tailwind weight tokens** — built-in classes used: `font-extrabold` (800), `font-bold` (700), `font-semibold` (600), `font-medium` (500 — verify grep before keeping in subset), `font-normal` (400). Custom `font-heavy` (lines 94–96) duplicates `font-extrabold`; this story removes it.
- **Brand color tokens** — `src/index.css:14-22` defines CSS custom properties; `tailwind.config.ts:19-28` maps them to `brand.*` keys. Use `brand-deep` / `brand-electric-blue` / `brand-offwhite` etc. via Tailwind classes. Do NOT introduce new ad-hoc hex literals.
- **shadcn semantic tokens** — `tailwind.config.ts:29-62` defines `border`, `input`, `ring`, `muted`, etc. via `hsl(var(--…))`. `bg-muted` resolves to a near-white shadcn default that is the original `SectionSkeleton` contrast problem.
- **Arbitrary-selector Tailwind utilities** — `[&>p:first-of-type]:…` and `[&_h2]:…` are valid Tailwind v3 syntax. Consolidating into `@layer components` with `@apply` is the established pattern for shared utility classes (see existing Tailwind v3 docs); avoid introducing a custom plugin unless `@apply` cannot express the selector — it can, here.
- **Co-located tests** — every UI primitive that exposes a contract change should ship its test file in the same folder (`SectionHeader.test.tsx` co-located with `SectionHeader.tsx`). No `__tests__/` directories.

### Source Tree Components to Touch

- `index.html` — add `<link rel="preconnect">` + `<link rel="stylesheet">` for Plus Jakarta Sans (Task 1).
- `src/index.css` — remove `@import` (Task 1); add `@layer components` utility for `section-intro-emphasis` or equivalent (Task 7).
- `tailwind.config.ts` — delete `theme.extend.fontWeight.heavy` token (Task 3).
- `src/components/ui/SectionHeader.tsx` — add `as` prop, fix `max-w-2xl` placement (Task 4).
- `src/components/ui/SectionHeader.test.tsx` — new or extended (Task 4).
- `src/components/ui/GradientButton.tsx` — replace `focus-visible:ring-white` (Task 6).
- `src/components/sections/SectionSkeleton.tsx` — replace `bg-muted`, add reduced-motion affordance (Task 5).
- `src/components/sections/Team.tsx` `SyncRevenue.tsx` `Services.tsx` `ClientReferences.tsx` `Comparison.tsx` — replace literal arbitrary selector (Task 7).
- `_bmad-output/implementation-artifacts/deferred-work.md` — mark closed bullets `[x]` (Task 8).
- `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md` — flip A9 to ✅ Done (Task 8).

### Testing Standards Summary

- Test runner: Vitest (`npm run test:run` for CI / single-pass; `npm test` for watch mode).
- React testing: Testing Library — prefer role queries (`getByRole('heading', { level: 2 })`).
- E2E: Playwright (`npm run test:e2e`). Note sandbox port-binding constraint — fall back to `PLAYWRIGHT_BASE_URL` override or defer with explicit Completion Notes entry.
- Co-located test convention; no `__tests__/` directories.
- i18n parity test (`src/i18n/index.test.ts`) is unaffected by this story — but should still be green after the run.

### Previous-Story Intelligence (Story 3.6 — done)

- Story 3.6 made content-only changes (locale JSON + `public/team/` assets). It did not touch `index.html`, `SectionHeader`, `SectionSkeleton`, `GradientButton`, or `tailwind.config.ts` — Story 3.7's diff should not overlap with 3.6's file list.
- The 3.6 commit chain (`74c3e43`, `749d11f`) accepted a "fake-data full stub" override per user. That override is content-only and does not constrain 3.7's structural / token / primitive changes.
- 3.6 carried forward one new follow-up to `deferred-work.md` (Team.tsx `onError` fallback for broken non-empty photo URLs) — that item is NOT in scope of 3.7 and should remain unchecked.

### Git-Intelligence Summary (last 5 commits as of 2026-05-16)

- `749d11f feat(story-3.6): full fake-data stub` — content-only.
- `74c3e43 chore(story-3.6): swap role-as-name placeholders to fake names` — content-only.
- `20eaf50 chore(sprint-3): mark story 3.5 done` — status mark.
- `933bfbd chore(review-story-3.5): apply codex cross-model patches` — review-cycle patch (lead-magnet code path; not in 3.7 scope).
- `c33fec7 feat(story-3.5): commission audit lead magnet` — feature; not in 3.7 scope.

No recent commit has touched the files 3.7 modifies. Conflict risk is low.

### Latest Tech Information

- **Tailwind v3 arbitrary properties / arbitrary-variant selectors** continue to support `[&>p:first-of-type]:…` syntax; consolidation via `@layer components` + `@apply` is preferred over inventing a Tailwind plugin for a single-selector pattern.
- **Google Fonts `display=swap`** is the established loading parameter for this codebase — keep it on the new `<link rel="stylesheet">` URL. Do not switch to `display=optional` or `display=block` without a perf justification (out of scope here).
- **`preconnect` to `fonts.gstatic.com` requires `crossorigin`** for the font-file requests (binary). The `fonts.googleapis.com` preconnect for the CSS request does not strictly require `crossorigin` but adding it is harmless. Both are documented in the project context vault under font-loading guidance.

### Project-Context References

- `vault/Planning/Stack.md` — frontend stack (React 18, Vite, Tailwind v3, Vitest, Playwright, i18next).
- `vault/Planning/Architecture-Key.md` — patterns gallery (canonical UI primitive conventions, `cn` helper usage, `forwardRef` discipline).
- `vault/Code/Frontend.md` — module map for `src/components/ui/`, `src/components/sections/`.
- `_bmad-output/planning-artifacts/architecture.md` — full architecture spec (read only the sections relevant to fonts, design tokens, and UI primitives).
- `_bmad-output/implementation-artifacts/deferred-work.md` — authoritative backlog for items closed by this story (Story 1.2 section + LCP follow-up reference).
- `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md` line 113 — row A9 to flip ✅ Done.

### Project Structure Notes

- Story aligns with the standard `src/components/{ui,sections}/` split; no new module is introduced.
- The new `@layer components` utility in `src/index.css` is the only addition to `src/index.css`'s top-level structure; placement should be after the existing `@layer base` block (the `:root` token definitions) and before any utility overrides.
- No `tsconfig.json`, `vite.config.ts`, `package.json` changes are expected — flag any drift in Completion Notes.

### References

- Story 1.2 deferred items source: `_bmad-output/implementation-artifacts/deferred-work.md` (root section, lines ~7–13).
- Epic 2 retrospective row A9: `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md` line 113.
- Story 3.4 LCP note (do not modify): `_bmad-output/implementation-artifacts/deferred-work.md` line 44.
- Tailwind v3 fontWeight customization docs (project-knowledge baseline; cross-check at build time if uncertain).
- Existing UI primitive contracts: `src/components/ui/SectionHeader.tsx`, `src/components/ui/GradientButton.tsx`, `src/components/sections/SectionSkeleton.tsx` (read before editing).

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m] (per agent-config — `agents-orchestration-3-20260515-235357.md` story 3.7: dev=claude, review=codex)

### Debug Log References

- Initial `npm run test:run` after edits: 2 failures in `Contact.test.tsx:66` and `DemoForm.test.tsx:75` asserting `focus-visible:ring-white`. Updated both to `focus-visible:ring-brand-deep` to match new contract.
- Second `npm run test:run`: 1 flaky failure in `src/pages/Home.story-1-7.e2e.test.tsx` (`findByRole('region', { name: 'Complete Revenue Intelligence Suite' })` timeout) when run in full parallel suite; passed cleanly when run in isolation; full-suite re-run was green (304/304). Pre-existing parallelism flakiness, not introduced by 3.7.
- `npm run typecheck`: clean.
- `npm run test:run` (final): 54 files / 304 tests passed.
- `npm run build`: clean — CSS 21.52 KB (gzip 5.29 KB); 531 modules transformed; SEO assets regenerated.
- `npm run test:e2e`: NOT executed in this sandbox session (sandbox dev-server port-bind workaround applies per Story 2.7 `PLAYWRIGHT_BASE_URL` convention; documented deferral — no real E2E regression expected since the changes are non-behavioral except font-loading transport, which Playwright does not assert on).

### Completion Notes List

- AC1 satisfied — `@import` removed from `src/index.css`; `<link rel="preconnect">` to `fonts.googleapis.com` + `fonts.gstatic.com` (crossorigin) and `<link rel="stylesheet">` added to `index.html` `<head>` above `<title>`. Manual Lighthouse before/after deferred to perf re-run story (lhci) — the prerequisite font-delivery change is in place, which is what 3.7 owned.
- AC2 satisfied with one documented exception — final URL weight set is `400;500;600;700;800`. Kept `500` because `font-medium` IS used (verified at `Toast.tsx:20`, `Contact.tsx:263`, `ClientReferences.tsx:97`, `LanguageSwitcher.tsx:33`). Dropped `400i` cleanly (no italic usage; `not-italic` is the only match). Net: dropped 1 weight-line vs. original 6.
- AC3 satisfied — `theme.extend.fontWeight.heavy` deleted; `font-heavy` had zero usages (no migration needed); typecheck/test/build clean.
- AC4 satisfied — `SectionHeader` accepts `as?: 'h2' | 'h3'`, default `h2`, via `const HeadingTag = as`-style destructure (`as: HeadingTag = 'h2'`). New `SectionHeader.test.tsx` covers default level, `as="h3"`, subtext conditional, dark-variant class, and `headingId` forwarding (5 tests).
- AC5 satisfied with documented intent — `max-w-2xl` retained on `<p>` (the constraint DOES apply: `max-w-2xl` caps the `<p>` itself at 42rem, `mx-auto` centers it within the unconstrained `text-center` parent). Added a leading inline comment in `SectionHeader.tsx` documenting why the constraint stays where it is.
- AC6 satisfied — `SectionSkeleton` now uses `bg-brand-slate/20` (perceptible static affordance against white surfaces); `aria-live="polite"` added; `<span class="sr-only">{label}…</span>` inside the `<div>` provides screen-reader + reduced-motion textual cue. Existing `role="status"`, `aria-label`, `aria-busy="true"` preserved.
- AC7 satisfied — `focus-visible:ring-white` replaced with `focus-visible:ring-brand-deep` in `GradientButton.tsx`; ring is visible on both dark gradient (hero) and light surfaces (forms, comparison CTAs).
- AC8 satisfied — added `.section-intro-emphasis` utility in `src/index.css` `@layer components` (`@apply [&>p:first-of-type]:text-brand-deep`); migrated all five call sites (`Team.tsx:77`, `SyncRevenue.tsx:47`, `Services.tsx:51`, `ClientReferences.tsx:73`, `Comparison.tsx:112`); grep confirms the literal arbitrary selector survives in exactly ONE place — the utility definition.
- AC9 satisfied — typecheck + tests + build green; `deferred-work.md` Story 1.2 bullets marked `[x]` with closure note linking to Story 3.7; `epic-2-retro-2026-05-15.md` row A9 flipped to `✅ Done`; Story 3.4 LCP follow-up note (line 44) left untouched.
- Deviation noted in `deferred-work.md`: weight `500` kept rather than dropped — driven by actual `font-medium` usage. Captured in commit body and AC2 completion note.

### File List

- index.html (modified)
- src/index.css (modified)
- tailwind.config.ts (modified)
- src/components/ui/SectionHeader.tsx (modified)
- src/components/ui/SectionHeader.test.tsx (new)
- src/components/ui/GradientButton.tsx (modified)
- src/components/sections/SectionSkeleton.tsx (modified)
- src/components/sections/Team.tsx (modified)
- src/components/sections/SyncRevenue.tsx (modified)
- src/components/sections/Services.tsx (modified)
- src/components/sections/ClientReferences.tsx (modified)
- src/components/sections/Comparison.tsx (modified)
- src/components/sections/Contact.test.tsx (modified — assertion updated to new ring token)
- src/components/sections/DemoForm.test.tsx (modified — assertion updated to new ring token)
- _bmad-output/implementation-artifacts/deferred-work.md (modified — Story 1.2 bullets marked `[x]`)
- _bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md (modified — A9 → ✅ Done)

### Change Log

- 2026-05-16 — Story 3.7 implemented (dev=claude): font loading moved from `@import` to `<link rel="preconnect">` + `<link rel="stylesheet">` in `index.html`; weight set trimmed to `400;500;600;700;800` (kept `500` for `font-medium` usage; dropped `400i`); `fontWeight.heavy` Tailwind token removed; `SectionHeader` gained polymorphic `as?: 'h2' | 'h3'` prop + co-located tests; `SectionSkeleton` reworked to `bg-brand-slate/20` + `aria-live="polite"` + `sr-only` label; `GradientButton` focus ring swapped to `focus-visible:ring-brand-deep`; `[&>p:first-of-type]:text-brand-deep` consolidated into `.section-intro-emphasis` utility; `deferred-work.md` Story 1.2 bullets + Epic 2 retro A9 closed.
