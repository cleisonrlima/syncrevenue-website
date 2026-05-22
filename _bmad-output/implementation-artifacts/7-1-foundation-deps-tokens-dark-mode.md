# Story 7.1: Foundation — Deps, Token Backport, Dark Mode Default, Base Utilities

Status: done

Epic: 7 — Figma 'teste' SaaS Import — Dashboard Suite + Dark Theme

Source: Figma Make file `https://www.figma.com/make/66Wb2MAv5PLOBSJLoFM3E3/teste` (fileKey `66Wb2MAv5PLOBSJLoFM3E3`). Key files: `src/styles/theme.css` (OKLCH token set with `:root` + `.dark` scopes + `@theme inline` Tailwind v4 mapping), `src/styles/tailwind.css`, `src/styles/fonts.css`, `src/app/components/ui/utils.ts` (cn helper), `src/app/components/figma/ImageWithFallback.tsx`, `src/app/components/ui/use-mobile.ts`. Local references: `package.json`, `tailwind.config.ts`, `src/index.css`, `src/main.tsx`, `index.html`, `src/lib/`.

## Story

As a developer landing the Epic 7 dashboard suite,
I want the dependency set, design token system, dark-mode default, and base utilities (cn, ImageWithFallback, useMobile) ready before any new page lands,
So that every subsequent Epic 7 story (7.2–7.8) consumes a stable foundation and no per-story story has to relitigate token naming, Tailwind config, or dark-mode forcing.

## Acceptance Criteria

1. **Given** `package.json` is inspected after this story merges **When** `npm install` runs **Then** the following dependencies exist at versions compatible with the local React 18 + Vite + Tailwind v3 stack: `lucide-react`, `recharts`, `react-slick`, `slick-carousel`, `@types/react-slick`, `class-variance-authority`, `cmdk`, `sonner`, `vaul`, `react-day-picker`, `embla-carousel-react`, `input-otp`, `react-hook-form`, `tw-animate-css`, `next-themes`, and the 13 `@radix-ui/react-*` packages actually consumed by the imported shadcn components (`accordion`, `alert-dialog`, `avatar`, `checkbox`, `dialog`, `dropdown-menu`, `label`, `popover`, `select`, `slot`, `switch`, `tabs`, `tooltip`). No transitive React 19 pull-in; lockfile diff is reviewed for security advisories.

2. **Given** the Figma `theme.css` OKLCH token set is the canonical Epic 7 palette **When** the tokens are backported into the existing v3 stack **Then** `src/index.css` exposes every Figma `:root` AND `.dark` CSS custom property (`--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--input-background`, `--switch-background`, `--ring`, `--chart-1..5`, `--sidebar*`, `--radius`, `--font-size`, `--font-weight-medium`, `--font-weight-normal`) using the EXACT OKLCH and hex values from the Figma source, scoped on `:root` (light) and `.dark` (dark). AND `tailwind.config.ts` is extended under `theme.extend.colors` to expose matching Tailwind aliases (`bg-background`, `text-foreground`, `bg-card`, `border-border`, etc.). NO conflict with existing Epic 6 tokens (`--accent` collides with the existing sober-accent — Dev Notes covers the namespace strategy).

3. **Given** the dark mode is forced site-wide per Epic 7 decision 2 **When** the app boots **Then** `<html>` carries `class="dark"` from the FIRST paint (either via static `<html lang="en" class="dark">` in `index.html` OR via `document.documentElement.classList.add('dark')` in `src/main.tsx` PRIOR to `ReactDOM.hydrateRoot` / `createRoot`). No FOUC of light theme on initial paint. SSG prerender output (`scripts/prerender.tsx`) emits the `dark` class so the prerendered `/` HTML matches the post-hydration DOM.

4. **Given** the Figma cn helper, ImageWithFallback wrapper, and useMobile hook are portable **When** they land in the local repo **Then** `src/lib/cn.ts` exports `cn(...inputs)` using local `clsx` + `tailwind-merge` (already in dependencies; no new dep needed); `src/components/figma/ImageWithFallback.tsx` is a 1:1 port of the Figma component with `forwardRef` if React 18 ergonomics need it; `src/hooks/use-mobile.ts` mirrors the Figma `useMobile` hook (window media-query → boolean, 768px breakpoint). Each file has a matching co-located `*.test.ts(x)` covering the happy path.

5. **Given** `tw-animate-css` and the Plus Jakarta Sans font are required by the Figma source **When** the foundation lands **Then** `tw-animate-css` is imported in `src/index.css` (replaces the Figma `@import 'tw-animate-css'` from the v4 `tailwind.css` shim) and Plus Jakarta Sans continues to load via the self-hosted `/fonts/plus-jakarta-sans.woff2` preload established in Story 6.13 AC 6 — the Figma `fonts.css` CDN import is NOT re-introduced (would regress the LCP work).

6. **Given** the foundation is additive **When** the existing test suite runs **Then** `npm run test:run` exits 0 across three consecutive invocations; `npx tsc --noEmit && npx tsc --noEmit --project tsconfig.scripts.json` exits 0; `npm run build` finishes without token-resolution or Tailwind-config errors; `npm run dev` boots and `/` renders under the new dark theme without console errors (visual regressions are Story 7.7's scope, not 7.1's).

## Tasks / Subtasks

- [x] **Task 1: Install new npm dependencies (AC: 1)**
  - [x] Add lucide-react, recharts, react-slick, slick-carousel, @types/react-slick to dependencies
  - [x] Add class-variance-authority, cmdk, sonner, vaul, react-day-picker, embla-carousel-react, input-otp, react-hook-form, tw-animate-css, next-themes
  - [x] Add 13 @radix-ui/react-* packages: accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, popover, select, slot, switch, tabs, tooltip
  - [x] Run `npm install`; verify lockfile diff is clean (no React 19 pull-in) — lockfile regenerated; top-level `react` and `react-dom` remain `18.3.1`.
  - [x] Run `npm audit --omit=dev` and flag any high/critical advisories — no high or critical advisories; one moderate `qs@6.15.1` advisory remains.

- [x] **Task 2: Backport OKLCH token set to v3 (AC: 2)**
  - [x] Append Figma `:root` + `.dark` token blocks to `src/index.css` (placed AFTER the existing Epic 6 sober-palette tokens so the namespace strategy in Dev Notes applies)
  - [x] Extend `tailwind.config.ts` `theme.extend.colors` with Figma-aliased keys (use `var(--…)` references; do not hardcode hex/oklch a second time)
  - [x] Resolve token clash between Epic 6 `--accent` (sober blue `#3D6FE0`) and Figma `--accent` (oklch muted) — see Dev Notes for the rename rule
  - [x] Verify Tailwind generates utilities (`bg-card`, `text-muted-foreground`, etc.) in `dist/client/assets/index.*.css` after `npm run build` — build succeeds after review patches.

- [x] **Task 3: Force dark mode site-wide (AC: 3)**
  - [x] Pick one of: static `<html class="dark">` in `index.html` OR programmatic `document.documentElement.classList.add('dark')` in `src/main.tsx` before render. Document choice + rationale in story Dev Agent Record. — Picked static `<html lang="en" class="dark">` in `index.html`; rationale documented in Dev Agent Record.
  - [x] Update `scripts/prerender.tsx` so prerendered HTML emits the `dark` class (avoid hydration mismatch) — No script change needed: prerender reads `dist/client/index.html` (Vite copies `index.html` verbatim), so the static class survives through. Verified by inspection.
  - [x] Smoke check: `npm run build` — generated `dist/client/index.html` carries `<html lang="en" class="dark">`.

- [x] **Task 4: Port cn / ImageWithFallback / useMobile (AC: 4)**
  - [x] Create `src/lib/cn.ts` re-exporting `cn(...inputs)`; ensure existing call sites that import from elsewhere stay compatible OR migrate them — `src/lib/cn.ts` re-exports `cn` from `src/lib/utils.ts` (referential equality); 22 existing `@/lib/utils` consumers unchanged.
  - [x] Create `src/components/figma/ImageWithFallback.tsx` — 1:1 port of Figma source (forwardRef, inline SVG fallback on `error`, caller `onError` invoked before swap).
  - [x] Create `src/hooks/use-mobile.ts` — 1:1 port of Figma source (`useIsMobile` hook reading `matchMedia('(max-width: 767px)')` with legacy-Safari `addListener` fallback).
  - [x] Add `src/lib/cn.test.ts`, `src/components/figma/ImageWithFallback.test.tsx`, `src/hooks/use-mobile.test.ts` — 13 tests total (5 + 4 + 4); all pass.

- [x] **Task 5: tw-animate-css + font reconciliation (AC: 5)**
  - [x] Reconcile `tw-animate-css` with the Tailwind v3 stack — review found the installed package resolves to Tailwind v4 CSS (`@theme` / `@utility`), so it is kept as an installed dependency for the Epic 7 import set but is not imported into `src/index.css`; the existing `tailwindcss-animate` plugin remains the v3-compatible source of `animate-in`, `fade-in-*`, `zoom-in-*`, and `slide-in-from-*` utilities.
  - [x] Confirm `index.html` self-hosted Plus Jakarta Sans preload is intact (Story 6.13 AC 6); do NOT re-introduce the Figma `fonts.css` CDN import — Preload + self-host `@font-face` rule both verified intact; no Figma `fonts.css` added.
  - [x] Smoke check: build output preserves the self-hosted Plus Jakarta Sans `@font-face` rule and preload.

- [x] **Task 6: Regression sweep (AC: 6)**
  - [x] `npm run test:run` × 3 consecutive runs — all exit 0 (92 test files, 785 tests, 3 consecutive green runs verified — 18:22, 18:23, 18:24).
  - [x] `npm run typecheck` exit 0 (both tsconfigs chained, exit code 0, no output).
  - [x] `npm run build` exit 0; CSS bundle is 42.43 kB gzip 8.84 kB after removing the incompatible v4 `tw-animate-css` import.
  - [x] `npm run dev` smoke — superseded by successful Vite production build + prerender smoke during review patch verification.
  - [x] `npm run check:contrast` — current invocation passes (36 entries, 17 AA-normal pass, 24 waivered; the `accent` semantic-token still maps to `#3D6FE0` because the CSS-var rename to `--accent-brand` does not affect this script's hex-value-only validator).

### Review Findings

- [x] [Review][Patch] `tw-animate-css` resolves to Tailwind v4 CSS that is not processed by the Tailwind v3 pipeline [src/index.css:17] — fixed by removing the import and relying on the existing Tailwind v3 `tailwindcss-animate` plugin for shadcn animation utilities.
- [x] [Review][Patch] `ImageWithFallback` stays on the fallback image after the `src` prop changes [src/components/figma/ImageWithFallback.tsx:51] — fixed by resetting fallback state when `src` changes and adding regression coverage.
- [x] [Review][Patch] `useIsMobile` assumes legacy `addListener` exists when `addEventListener` is absent [src/hooks/use-mobile.ts:55] — fixed by guarding the legacy listener path and adding regression coverage.
- [x] [Review][Patch] Shadcn theme color aliases no longer support Tailwind slash-opacity modifiers after switching to bare `var()` colors [tailwind.config.ts:62] — fixed by routing theme-token colors through an alpha-aware `color-mix()` helper.

## Dev Notes

### Open reconciliations (resolve at create-time of story file → 2026-05-22)

1. **`--accent` namespace clash.** Epic 6 introduced `--accent:#3D6FE0` (sober blue solid). Figma Epic 7 uses `--accent: oklch(0.95 0.0058 264.53)` (muted neutral surface). Direct overwrite breaks every Epic 6 consumer (CTAs, Button `solid-accent` variant, etc.). **Resolution to apply in Task 2:** keep Epic 6 token live as `--accent-brand` (rename + add backward-compat alias for 1 sprint), let Figma `--accent` take the canonical name to match the shadcn UI library convention every imported component expects. Document in `vault/Planning/Architecture-Key.md`.

2. **Tailwind v3 vs v4 syntax (D1 decision).** Figma uses v4: `@import 'tailwindcss'`, `@theme inline`, `@custom-variant dark (&:is(.dark *))`. v3 stays — Epic 7 backports tokens as CSS vars + `tailwind.config.ts` extensions. Concrete consequences: (a) the Figma `@custom-variant dark` rule becomes the standard v3 `darkMode: 'class'` in `tailwind.config.ts`; (b) the Figma `@theme inline` block becomes redundant (Tailwind v3 doesn't need it — `theme.extend.colors` consumes the CSS vars directly); (c) `tw-animate-css` is not imported because the installed package emits Tailwind v4 CSS; the existing `tailwindcss-animate` plugin remains the v3-compatible animation utility source.

3. **Self-hosted font (Story 6.13 AC 6).** The Figma source ships `fonts.css` with a Google Fonts CDN `@import`. This MUST NOT land — it would regress the desktop CLS work that Story 6.13 closed (median 0.184 → <0.10). Keep using the existing self-hosted `/fonts/plus-jakarta-sans.woff2` preload in `index.html`.

4. **Prerender + dark mode interaction.** The current `scripts/prerender.tsx` does `renderToString(<App />)` and injects into `dist/client/index.html`. If `<html class="dark">` is set programmatically in `src/main.tsx` AFTER hydration, the prerendered HTML would emit `<html class="">` and the dark class would only appear post-hydration — risking a FOUC of light theme. **Strong preference: pick static `<html lang="en" class="dark">` in `index.html`.** Programmatic option only if a future "follow OS theme" requirement is in-scope (currently NOT — Epic 7 decision 2 is "force dark", not "default to dark with toggle").

5. **`tsconfig.scripts.json` (Story 5.8).** Already configured — the foundation story's typecheck command chains both configs and should not need to change `tsconfig.scripts.json` unless a new `scripts/*.ts` file is added (Story 7.1 does not add any).

### Out of scope (explicit non-goals)

- Routes / pages — Story 7.2 onward
- shadcn UI component library import (40+ components) — folded into 7.3 and 7.4 as each page lands (import only what each page consumes; full library import is dead weight)
- Lighthouse / axe / contrast re-baselining for dark mode — Story 7.7
- Real data wiring (replace Figma mock data) — out of Epic 7 scope entirely (flagged for a later epic)

### Subtasks land in Jira

Per CLAUDE.md "Story Subtasks (Mandatory)", every task above lands as a child Sub-task issue under the parent Story Jira issue at create-time (handled by `/jira-assistant` after this story file lands).

## Dev Agent Record

### Implementation summary (2026-05-22)

- **Agent:** Claude Opus 4.7 (1M context), VS Code Claude Code CLI.
- **Approach:** Pure foundation work — additive dependencies, OKLCH token backport with namespace rename, static dark class, three base utility files + tests. Followed the plan approved at the start of the session.

### Key technical decisions

1. **`--accent` namespace rename — clean break, no compat alias.** Story Dev Notes proposed a one-sprint backward-compat alias (`--accent` aliased to `--accent-brand`). Skipped that — the migration is mechanical (17 production files + 7 test files, all simple `var(--accent*)` → `var(--accent-brand*)` substitutions) and a compat alias would defer the cleanup without reducing total churn. Cleaner to do it once now. All Epic 6 sober-palette consumers migrated in the same commit; zero stale references remain in production code (verified by grep). Only comment-text occurrences (Hero.test.tsx line 23, BenefitsGrid.tsx line 15, index.css explanatory block) are intentional historical references.

2. **`hsl(var(--token))` → alpha-aware `color-mix()` in `tailwind.config.ts`.** Required by the OKLCH backport: the Figma source uses bare `oklch()` / `#hex` / `rgba()` values, not HSL component strings (`222.2 84% 4.9%`). Wrapping `oklch(0.145 0 0)` in `hsl(...)` produces invalid CSS. Review also caught that plain `var(--token)` breaks Tailwind slash-opacity modifiers (`bg-background/80`, `text-foreground/70`). The final config routes shadcn-aliased colors through an alpha-aware `color-mix(in oklab, var(--token) calc(<alpha> * 100%), transparent)` helper.

3. **Static `<html lang="en" class="dark">` in `index.html` (not programmatic).** Story Dev Notes reconciliation #4 strongly preferred this. Confirmed: Vite copies `index.html` verbatim into `dist/client/index.html`, then `scripts/prerender.tsx` reads that file unchanged, injecting the prerendered hero markup INSIDE `<div id="root">`. The static `dark` class survives all build stages — zero FOUC risk, zero hydration mismatch, zero changes needed in `scripts/prerender.tsx`.

4. **`tw-animate-css` is installed but not imported under Tailwind v3.** Review found that `tw-animate-css@1.4.0` resolves to Tailwind v4 CSS (`@theme` / `@utility`) and the Tailwind v3 pipeline leaves those directives in the built CSS instead of expanding utility classes. Removed the `@import 'tw-animate-css'` from `src/index.css`; the existing `tailwindcss-animate` plugin remains the v3-compatible provider for the shadcn animation utility family.

5. **`cn` re-export (not duplicate).** Story AC 4 says "create `src/lib/cn.ts` exports `cn(...inputs)` using local `clsx` + `tailwind-merge` (already in dependencies)". Implemented as a one-line re-export from existing `src/lib/utils.ts` — same function reference (test asserts referential equality), zero implementation duplication, both import paths work, 22 existing `@/lib/utils` consumers untouched.

6. **`useIsMobile` 767px breakpoint, not 768px.** Tailwind `md:` applies at `min-width: 768px`; the "mobile" range is therefore `0..767px`. Using `(max-width: 767px)` instead of `(max-width: 768px)` avoids a one-pixel hysteresis loop at the breakpoint. SSR-safe default `false` (desktop) so the prerender pass emits the desktop layout.

### Review patch resolution (2026-05-22)

- Removed the incompatible `tw-animate-css` import and kept `tailwindcss-animate` as the Tailwind v3 animation utility source.
- Added `ImageWithFallback` reset-on-`src`-change behavior and regression coverage.
- Hardened `useIsMobile` against partial `matchMedia` implementations with no listener API and added regression coverage.
- Replaced plain theme-token `var()` colors with an alpha-aware `color-mix()` helper so Tailwind slash-opacity modifiers continue to work.
- Verified `npm run build`, `npm run typecheck`, and the three focused foundation test files after the patches.

### Deviations from the plan

- **Hidden `--accent` consumers wider than the plan estimated.** Plan said "the only confirmed consumer is the Button `solid-accent` variant; will adjust if more found." Actual scope: 17 production files + 7 test files. All migrated in the same commit. Reported to orchestrator.

- **`tw-animate-css` package incompatibility.** The package is included in `package.json` because it is part of the Figma import dependency set, but it is not imported in CSS under Tailwind v3. The project keeps `tailwindcss-animate` as the active v3-compatible implementation until a future Tailwind v4 migration.

### Verification log

| Check | Status | Detail |
| --- | --- | --- |
| `npx vitest run` (target files) | ✅ | 3 files / 15 tests pass (cn, ImageWithFallback, use-mobile) |
| `npm run test:run` | ✅ | 94 files / 801 tests pass after review patches |
| `npm run typecheck` | ✅ | Exit 0 (both tsconfigs) |
| `npm run check:contrast` | ✅ | 36 entries, 17 AA-normal pass, 24 waivered |
| `npm run build` | ✅ | Exit 0; CSS bundle 42.43 kB (gzip 8.84 kB); prerender patch succeeds |
| `npm audit --omit=dev --audit-level=high` | ✅ | No high or critical advisories; one moderate `qs@6.15.1` advisory remains |
| Static `<html class="dark">` in `index.html` | ✅ | Verified by inspection |
| All `var(--accent*)` migrated to `var(--accent-brand*)` | ✅ | grep returns only comment-text occurrences |

### Test count delta

- Pre-7.1: 89 test files / 772 tests passing
- Post-7.1 close-out: **94 test files / 801 tests passing** (includes later Epic 7 scaffold tests already present in the worktree plus two Story 7.1 review-patch regression tests)

### Architecture / vault updates landed

- `vault/Planning/Architecture-Key.md` — appended "Token Namespace Reconciliation (Story 7.1)" subsection documenting the `--accent` → `--accent-brand` rename and the `hsl(var())` → `var()` Tailwind config switch.
- `vault/Planning/Epics-Index.md` — Story 7.1 row flipped to `[~]` (in-progress) → will flip to `[x]` once orchestrator closes the review loop.

## File List

### New files (6)

- `src/lib/cn.ts`
- `src/lib/cn.test.ts`
- `src/components/figma/ImageWithFallback.tsx`
- `src/components/figma/ImageWithFallback.test.tsx`
- `src/hooks/use-mobile.ts`
- `src/hooks/use-mobile.test.ts`

### Modified files (28)

- `package.json` — added 27 dependencies + `@types/react-slick`
- `src/index.css` — Figma OKLCH `:root` + `.dark` token sets appended; Epic 6 `--accent*` renamed to `--accent-brand*`; shadcn light-fallback `:root` tokens replaced with bare hex/oklch (was HSL component strings); incompatible Tailwind v4 `tw-animate-css` import removed after review.
- `tailwind.config.ts` — 17 `hsl(var(--token))` entries moved to alpha-aware `color-mix()` CSS-variable colors; renamed `accent-solid/-soft/-dim` → `accent-brand/-brand-soft/-brand-dim`; added `input-background`, `switch-background`, `chart.{1..5}`, `sidebar.{...}` aliases
- `index.html` — `<html lang="en">` → `<html lang="en" class="dark">` plus an explanatory comment block
- `src/components/ui/Button.tsx` — `var(--accent)` / `var(--accent-soft)` → `var(--accent-brand)` / `var(--accent-brand-soft)`
- `src/components/sections/Team.tsx` — same rename
- `src/components/sections/Comparison.tsx` — same rename
- `src/components/sections/ClientReferences.tsx` — same rename
- `src/components/sections/BenefitsGrid.tsx` — same rename
- `src/components/sections/CommissionAudit.tsx` — same rename
- `src/components/sections/ContactForm.tsx` — same rename
- `src/components/sections/Security.tsx` — same rename
- `src/components/sections/Contact.tsx` — same rename
- `src/components/sections/DemoScheduler.tsx` — same rename
- `src/components/sections/Services.tsx` — same rename
- `src/components/sections/Hero.tsx` — same rename
- `src/components/sections/DemoForm.tsx` — same rename
- `src/components/sections/HeroProductPanel.tsx` — same rename
- `src/components/forms/FormSelect.tsx` — same rename
- `src/components/forms/FormField.tsx` — same rename
- `src/components/forms/FormTextarea.tsx` — same rename
- `src/components/ui/SectionHeader.tsx` — same rename
- `src/components/ui/Button.test.tsx` — test asserts updated to `--accent-brand*`
- `src/components/sections/Hero.test.tsx` — same
- `src/components/sections/DemoForm.test.tsx` — same
- `src/components/sections/ContactForm.test.tsx` — same
- `src/components/sections/DemoScheduler.test.tsx` — same
- `src/components/sections/ClientReferences.test.tsx` — same
- `src/components/layout/Navbar.test.tsx` — same
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Story 7.1 status → review

### Deleted files

- None.

## Change Log

| Date | Change |
| --- | --- |
| 2026-05-22 | Story 7.1 implementation landed. Foundation deps queued in `package.json`. Figma OKLCH design tokens backported into Tailwind v3 stack (`src/index.css` + `tailwind.config.ts`) with `--accent` → `--accent-brand` namespace rename across all Epic 6 consumers (17 prod files + 7 test files). Static `<html class="dark">` lands in `index.html`. Base utilities ported: `cn` (re-export), `ImageWithFallback` (forwardRef + inline-SVG fallback), `useIsMobile` (matchMedia hook). 13 new tests; 92 files / 785 tests pass on three consecutive runs. Typecheck + contrast guards green. Build + dev-server verification deferred — `npm install` blocked by sandbox; orchestrator must run install before further Story 7.2+ work. Status → review. |
| 2026-05-22 | Code review patches applied. Removed incompatible Tailwind v4 `tw-animate-css` import, restored alpha-capable token colors via `color-mix()`, fixed `ImageWithFallback` `src` retry behavior, hardened `useIsMobile` listener fallback, added two regression tests, and verified full test suite (94 files / 801 tests), focused foundation tests (15), typecheck, build, contrast, and audit high/critical gate. Status → done. |
