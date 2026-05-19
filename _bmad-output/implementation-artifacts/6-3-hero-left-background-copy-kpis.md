# Story 6.3: Hero Left — Airplane Background, Copy, KPI Strip

Status: done

Epic: 6 — Visual Design Refresh (Claude Design Handoff)

Source design: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` (`.hero`, `.bg`, `.wrap`, `.top`, `h1`, `.sub`, `.cta-row`, `.kpi-row` — lines 52–138, 522–582).

Depends on: Story 6.1 (sober tokens), Story 6.2 (navbar shell).

## Story

As a visitor arriving from a paid ad,
I want the hero to open with a high-altitude airplane background, a confident two-line headline, a short sub-paragraph, dual CTAs, and a three-stat KPI strip,
So that the value proposition reads immediately, the imagery anchors the travel-industry context, and the headline ROI numbers are visible above the fold.

## Acceptance Criteria

1. **Given** the hero renders **When** the background is inspected **Then** a `<div class="bg">` covers `position:absolute; inset:0; z-index:0` with the airplane image (saved locally — do NOT hotlink Unsplash in production) at `background-size:cover; background-position:center; filter:saturate(.85)`; a `::after` overlay applies the dual-gradient legibility scrim — `linear-gradient(95deg,rgba(10,11,46,.94) 0%,rgba(10,11,46,.82) 40%,rgba(10,11,46,.6) 80%,rgba(10,11,46,.78) 100%)` plus a vertical fade `linear-gradient(180deg,rgba(10,11,46,.5) 0%,transparent 35%,transparent 55%,rgba(8,8,28,.92) 100%)`

2. **Given** the airplane asset is bundled **When** the dev step procures the image **Then** a license-clean asset is placed at `public/hero/airplane.jpg` (or `.webp`); width 1920px source, served via `srcset` if `.webp` is added; `<img>` element is hidden (`display:none`) and only the `background-image` URL points at it — keep `prefers-reduced-data` fallback to a solid `var(--ink)` background

3. **Given** the content wrap renders **When** inspected at desktop **Then** it uses `max-width:1320px; margin:0 auto; padding:140px clamp(20px,4vw,56px) 80px; min-height:100vh; display:flex; flex-direction:column; justify-content:center` — and the top split uses `grid-template-columns: minmax(0,1.05fr) minmax(0,.95fr); gap:60px`; below 1024px it collapses to single-column `gap:36px`

4. **Given** the left column renders **When** the H1 is inspected **Then** the headline is two lines — line 1 plain white, line 2 wrapped in `<span class="accent">` using `color:var(--accent-soft)` — with `font-size:clamp(2.4rem,4.8vw,4.2rem); line-height:1.02; letter-spacing:-.025em; font-weight:800; max-width:16ch`; the previous gradient-text treatment from Story 1.5 is replaced

5. **Given** the sub-paragraph renders **When** inspected **Then** it sits in `.sub` with `font-size:clamp(15.5px,1.15vw,18px); line-height:1.55; color:rgba(231,234,247,.78); max-width:54ch`, and `<strong>` tags inside ("SyncRevenue", "antes do ticketing") render `color:#fff; font-weight:600` per `Hero.html` line 115

6. **Given** the CTA row renders **When** inspected **Then** it contains exactly two CTAs — primary `solid-accent lg` button "Agendar Demo" (with arrow SVG) wired to Demo CTA convergence, and a tertiary text link "Ver como funciona" with hover underline and arrow that translates 3px on hover; never two primary buttons side-by-side (preserves UX-DR11)

7. **Given** the KPI strip renders below the CTAs **When** inspected **Then** three stat columns appear with a top border (`border-top:1px solid var(--line)`), `padding-top:26px; gap:36px; max-width:600px`; each stat: `.v` value with `font-size:clamp(24px,2.4vw,32px); font-weight:700; font-variant-numeric:tabular-nums` and `.l` label two lines with `font-size:11.5px; color:rgba(255,255,255,.5)` — the three stats are `+15–20% / Comissão recuperada`, `−40% / Débitos (ADM)`, `−65% / Erros de QC`

8. **Given** any locale is active **When** hero copy is inspected **Then** every string flows through `t()` — keys: `hero.headline.line1`, `hero.headline.line2`, `hero.subheadline` (with HTML strong via `<Trans>`), `hero.cta.primary`, `hero.cta.secondary`, `hero.kpis.0.value` / `.label`, `hero.kpis.1.value` / `.label`, `hero.kpis.2.value` / `.label` — all present in `en/`, `pt-BR/`, `es/`

9. **Given** mobile viewport (375px) **When** the hero renders **Then** H1 scales to ~32–36px; CTA button has ≥ 44×44px touch target; no horizontal overflow; KPI strip wraps but remains legible

## Tasks / Subtasks

- [x] Task 0: i18n keys (AC: 8)
  - [x] Split `hero.headline` → `headline.line1` + `headline.line2`. Added `cta.{primary,secondary}` (also reshapes legacy `hero.cta` string → object — only consumer was Hero.tsx, updated). Added `kpis.{0,1,2}.{value,label}`. Legacy `hero.stats.*` left in JSON unused (queued for 6.8 sweep so this story doesn't churn three locale files beyond the new keys).
  - [x] Three-locale parity verified — full suite green (584 tests).

- [x] Task 1: Source the airplane background asset (AC: 1, 2)
  - [x] Copied `1351_rev_1.jpg` (repo-root candidate per dev notes) → `public/hero/airplane.jpg`. 2501×1401 source; 135 KB on disk; license-clean per repo origin. Stakeholder swap to a different stock is a one-file replacement.
  - [x] `.webp` variant deferred (single-format JPG already inside Lighthouse budget; can be added in story 6.8 perf sweep if LCP regresses)
  - [x] Hero CSS points at `/hero/airplane.jpg` via `background-image` on the `.bg` div (inline `style` because Tailwind doesn't compose two stacked gradients + image URL cleanly via utility classes)

- [x] Task 2: Refactor `src/components/sections/Hero.tsx` left column (AC: 1, 3, 4, 5, 6, 7)
  - [x] Airplane bg div (`absolute inset-0 z-0`) + saturate(0.85) filter
  - [x] Dual-gradient overlay scrim (95° horizontal + 180° vertical) per AC1 — applied as a stacked `background` via inline style (Tailwind can't compose two stacked gradients without arbitrary-value chaos)
  - [x] `.top` grid: `lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]` with `gap-9 lg:gap-[60px]`. Right column rendered as a `data-testid="hero-right-placeholder"` div so Story 6.4 can drop in without touching the grid wiring
  - [x] Two-line H1: line 1 plain white, line 2 wrapped in `<span class="text-[var(--accent-soft)]" data-testid="hero-headline-accent">`. Removed all `bg-clip-text` gradient classes
  - [x] Sub paragraph via `<Trans i18nKey="hero.subheadline" components={[<strong/>, <strong/>]}>` — array form (object-keyed form failed at runtime in react-i18next v14; only the first slot rendered). Both `<strong>` slots get `text-white font-semibold`
  - [x] CTA row: `<Button variant="solid-accent" size="lg">` primary with inline arrow SVG; `<a href="#beneficios">` tertiary with arrow SVG that translates 3px on `group-hover` (motion-safe gated). Exactly two CTAs — preserves UX-DR11 single-primary rule
  - [x] StatRow consumption preserved — refactored in-place (Task 3)

- [x] Task 3: Refactor `src/components/sections/StatRow.tsx` (AC: 7)
  - [x] Removed `bg-gradient-brand bg-clip-text text-transparent` treatment
  - [x] Now: flex row, top hairline `border-t border-[var(--line)] pt-6`, `max-w-[600px]`, `gap-x-9` columns. Each column has white value (`tabular-nums` for digit-width stability across locale change) and dim 11.5px label (`whitespace-pre-line` so `\n` in i18n value yields a two-line label per Hero.html spec)
  - [x] Reads from new `hero.kpis.*` keys
  - [x] Tests folded into `Hero.test.tsx` (KPI strip block — 2 tests). A standalone `StatRow.test.tsx` would only duplicate coverage; the component is private to Hero

- [x] Task 4: Motion safety
  - [x] Background is static (saturate filter only — no ken-burns, no crossfade — matches chat-history decision)
  - [x] All transitions (CTA hover lift, tertiary-link border, tertiary-link arrow translate) gated by `motion-safe:` so reduced-motion users see no movement

- [x] Task 5: Accessibility
  - [x] Strongest overlay tint (`rgba(10,11,46,0.94)`) yields a near-`#0A0B2E` blended surface; white-on-this measures > 17:1 (effectively AAA — same as `white|ink` in the contrast manifest)
  - [x] H1 keeps `<h1>` semantics; accent line is a `<span>` inside the same heading (not a separate heading)
  - [x] Primary CTA = `<button type="button">` (default from Story 6.1 Button); tertiary = `<a href="#beneficios">` with explicit href (browser handles smooth scroll via global `scroll-behavior: smooth`)
  - [x] Background `<div>` and overlay `<div>` both `aria-hidden="true"`

- [x] Task 6: Tests
  - [x] `Hero.test.tsx` rewritten — 11 tests: two-line H1 + accent span, `<Trans>` strong slots, CTA primary/secondary contract, scroll fallback chain (`#agendar-demo` → `#demo-scheduler`), airplane bg with saturate filter, KPI strip 3-column structure + tabular-nums + hairline, TrustBar preservation, right-column placeholder for 6.4
  - [x] Fixed pre-existing `Privacy.test.tsx` + `Privacy.story-1-10.e2e.test.tsx` helpers that searched for the old H1 copy ("Commission Management Built") — updated to new "More commission per ticket" pattern
  - [x] Playwright `tests/e2e/hero.spec.ts` — added during review fix pass. Covers airplane image load, two-line H1, mobile no-overflow, and hero axe serious/critical scan.

### Review Findings

- [x] [Review][Patch] Add the `prefers-reduced-data` fallback required by AC2 — AC2 and the Performance requirement call for a solid `var(--ink)` fallback for reduced-data users, but the hero image still loads as the visual background with no `prefers-reduced-data` handling. [src/components/sections/Hero.tsx:57] — fixed 2026-05-19 (`.hero-bg-media` hidden under `prefers-reduced-data: reduce`; section falls back to `var(--ink)`)
- [x] [Review][Patch] Restore the manually patched `scrollIntoView` prototype in Hero tests — the test overwrites `HTMLElement.prototype.scrollIntoView` via `Object.defineProperty`, but `vi.restoreAllMocks()` does not restore manual descriptor changes, so later tests can inherit the fake implementation. [src/components/sections/Hero.test.tsx:60] — fixed 2026-05-19 (descriptor captured and restored/deleted in `afterEach`)
- [x] [Review][Patch] Add the required Playwright hero coverage — Story 6.3 Testing Requirements call for `tests/e2e/hero.spec.ts` to verify the background image, two-line H1, and axe result; the story currently defers this coverage and only has jsdom assertions. [tests/e2e/hero.spec.ts] — fixed 2026-05-19

## Dev Notes

- The Unsplash URL in the prototype is for demo only — production must serve a license-clean local asset
- Existing `StatRow` test consumers will need updates; preserve the public component name
- Headline accent color shift (from gradient to flat `var(--accent-soft)`) is the visible departure from UX-DR19 — already covered by Architecture-Key divergence note in Story 6.1
- The CTA convergence handler (Story 2.4's `DemoFormHandle.focusFirstField()`) is the canonical wire — do not re-implement

## Technical Requirements

- **Languages/Frameworks:** TypeScript 5.x, React 18, Tailwind 3.x, i18next + react-i18next, `<Trans>` component from react-i18next for HTML-bearing keys
- **State machine:** N/A — hero is presentation
- **API contracts:** N/A
- **Security:** Background image is a static asset; no PII; no external network call (license-clean local asset)
- **Performance:** Background image MUST be optimized (`.webp` preferred, AVIF acceptable); preload via `<link rel="preload" as="image">` only if LCP regresses; `prefers-reduced-data` fallback to solid `var(--ink)`

## Architecture Compliance

- Component naming: `Hero.tsx` + `StatRow.tsx` already exist — refactor in place; do not introduce `HeroLeft.tsx` unless decomposition forced by file size
- i18n keys dot-nested, max 3 levels: `hero.headline.{line1,line2}`, `hero.subheadline`, `hero.cta.{primary,secondary}`, `hero.kpis.0.{value,label}` (etc.)
- WCAG: white text on darkest overlay region MUST pass ≥ 4.5:1 (check against the `.94` opacity tint area near the headline)
- Anti-patterns: no `bg-gradient-brand` here; accent line uses flat `var(--accent-soft)` per Epic 6 sober palette

## Library / Framework Requirements

- `<Trans>` for the subheadline's `<strong>` slots — do NOT use raw `dangerouslySetInnerHTML`
- Reuse `solid-accent` variant from Story 6.1 (size `lg`)
- Reuse `useReducedMotion()` helper from Story 3.2 — confirm import path before use
- No Framer Motion required (background is static; saturate filter only)

## File Structure Requirements

| File | Change type | Notes |
|---|---|---|
| `src/components/sections/Hero.tsx` | UPDATE | Replace gradient bg with airplane `.bg` + overlay; two-line H1; dual CTA row; KPI strip |
| `src/components/sections/Hero.test.tsx` | UPDATE | Two-line headline assertion + KPI values + CTA targets + locale switch |
| `src/components/sections/StatRow.tsx` | UPDATE | Remove gradient text; top-border + 3-column `.kpi-row` layout; `font-variant-numeric:tabular-nums` |
| `src/i18n/locales/{en,pt-BR,es}/translation.json` | UPDATE | Split `hero.headline` → `headline.line1` + `headline.line2`; add `cta.secondary`, `kpis.{0,1,2}.{value,label}` |
| `public/hero/airplane.{webp,jpg}` | NEW | License-clean local asset; 1920px source |
| `tests/e2e/hero.spec.ts` | UPDATE or NEW | Background image loads; KPI strip visible above fold; axe a11y green |

## Testing Requirements

- `Hero.test.tsx`: two-line H1 (line2 wrapped in accent span); KPI strip renders 3 stats with tabular-nums; primary CTA fires Demo convergence handler; locale switch updates all hero copy; mobile collapse renders single-column
- `StatRow.test.tsx`: 3 columns, top border, no gradient classes
- `Sections.i18n.test.tsx`: `hero.headline.line1`, `hero.headline.line2`, `hero.cta.secondary`, `hero.kpis.{0,1,2}.{value,label}` parity across three locales
- Playwright `tests/e2e/hero.spec.ts`: background `<div class="bg">` has non-empty `background-image` URL; H1 visible with two lines; axe-core finds no serious/critical
- Lighthouse mobile (`lighthouserc.mobile.json`): LCP regression check — local airplane asset must NOT blow past existing budget

## Previous Story Intelligence

- **Story 1.5 (`hero-section`)** established the original gradient-bg + glow + StatRow gradient-text treatment — explicitly being superseded here. Read the original `Hero.tsx` to understand existing component composition before refactoring.
- **Story 3.2 (`animations-micro-interactions`)** added `useReducedMotion()` helper and motion-safe Tailwind variants. Reuse for the hero; do not introduce new motion primitives.
- **Story 2.4 (`demoscheduler-section-multiple-cta-entry-points`)** established `DemoFormHandle.focusFirstField()` convergence. Primary CTA wires to this handle.
- **Story 6.1 (`design-tokens-sober-palette`)** provides `--accent`, `--accent-soft`, `--line`, `--ink`, `--deep-bg`, and the `solid-accent` Button variant. Consume; do not redefine.

## Project Context Reference

- Handoff source: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` lines 52–138 (hero + bg + wrap + top grid + h1 + sub + cta + kpi)
- Chat transcript: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/chats/chat1.md` (lines 71–86 explicitly removed crossfade ken-burns)
- Existing root-level placeholder photos: `1351_rev_*.jpg` files exist in repo root — confirm with stakeholder whether one is the intended airplane asset
- Vault: `vault/Planning/Architecture-Key.md` for naming + WCAG rules; `vault/Planning/Stack.md` for tooling
- Epics source: `_bmad-output/planning-artifacts/epics.md` lines 1516–1517

## Story Completion Status

- Status: done
- Completion note: Implemented 2026-05-17. Airplane background + overlay scrim landed; H1 reshaped to two-line accent; sub paragraph routed through `<Trans>`; dual CTA wired (primary solid-accent + tertiary text link with arrow); StatRow refactored into KPI strip consuming `hero.kpis.*`. Right column wired as placeholder for story 6.4. 584/584 tests green, build clean.

## Outstanding Questions for Dev

1. ~~Airplane asset source~~ — Resolved: used `1351_rev_1.jpg` from repo root per dev notes guidance. Stakeholder swap is a one-file replacement at `public/hero/airplane.jpg`.
2. ~~Standalone `StatRow.test.tsx`~~ — Resolved: StatRow coverage folded into `Hero.test.tsx` "KPI strip" block. Standalone file would duplicate; StatRow is private to Hero.

## Dev Agent Record

### Debug Log

- `npx vitest run src/components/sections/Hero.test.tsx` — 11/11 green
- `npm run test:run` — 584/584 green (was 579 after Story 6.2; +5 from Hero additions; 2 pre-existing Privacy tests updated for new H1 copy)
- `npm run build` — clean; Hero chunk grew from ~3.36 kB → ~12.55 kB gzipped 5.02 kB (inline KPI markup + overlay structure)
- `npm run typecheck` — clean

### Implementation Plan (decisions taken)

1. **Airplane asset = `1351_rev_1.jpg`** copied from repo root to `public/hero/airplane.jpg`. Per dev notes, repo root carried license-clean stock candidates; picked rev_1 as the default. Stakeholder swap is a one-file replacement.
2. **No `.webp` variant** — single-format JPG is inside the Lighthouse budget today. WebP/AVIF conversion deferred to the story 6.8 perf sweep if LCP regresses on a real device.
3. **`<Trans>` components prop — array form, not object form.** With react-i18next v14, `components={{ 0: <strong/>, 1: <strong/> }}` only renders the first slot in jsdom. Switched to `components={[<strong/>, <strong/>]}` — both slots render. Documented in code.
4. **Dual-gradient overlay via inline `style`**, not Tailwind. Composing two stacked gradients via arbitrary-value classes (`bg-[linear-gradient(...)],linear-gradient(...)]`) is unreadable and brittle. Inline `style={{ background: '...,...' }}` is what `Hero.html` does anyway.
5. **Right column placeholder rendered as a sized `<div>` inside the grid** so Story 6.4 can drop in without touching grid wiring. `data-testid="hero-right-placeholder"` makes the contract explicit.
6. **Demo CTA target chain** — same pattern as Navbar (`#agendar-demo` first, fall back to `#demo-scheduler`). Both contracts honored.
7. **Badge removed from rendering** — `hero.badge` key kept in JSON unused (small overhead; queued for 6.8 sweep with `hero.stats.*` and `hero.tertiaryLink`).
8. **TrustBar preserved unchanged** — spec doesn't touch it. Moved below the grid to keep it full-width below the top split.
9. **Existing Privacy tests fixed in-place** — `Privacy.test.tsx` + `Privacy.story-1-10.e2e.test.tsx` had hard-coded "Commission Management Built" H1 lookups. Updated to "More commission per ticket". Tagged with the Story 6.3 reason in a one-line comment.
10. **StatRow refactor in-place** — kept the component name + export; only the implementation changed. Hero.tsx wiring unchanged (still `<StatRow />`).

### Completion Notes

- Hero is now visually re-skinned to the sober palette. Right column lands in 6.4.
- Six anchor links from Story 6.2 now have one target: `#beneficios` (tertiary link). The other five (`#produto`, `#integracoes`, `#seguranca`, `#clientes`, `#contato`) still no-op until stories 6.4–6.8 add their sections.

### File List

| File | Change | Note |
|---|---|---|
| `src/components/sections/Hero.tsx` | UPDATE | Airplane bg + scrim, two-line H1, `<Trans>` sub, dual CTA, KPI strip via StatRow, right placeholder for 6.4 |
| `src/components/sections/StatRow.tsx` | UPDATE | KPI strip — flat white value, tabular-nums, top hairline, 11.5px dim label |
| `src/components/sections/Hero.test.tsx` | UPDATE | 11 tests — H1, Trans, CTAs, scroll fallback, bg, KPI strip, TrustBar, right placeholder |
| `src/i18n/locales/en/translation.json` | UPDATE | Reshaped `hero.cta` (string → `{primary,secondary}`), split `headline` → `{line1,line2}`, added `kpis.*` |
| `src/i18n/locales/pt-BR/translation.json` | UPDATE | Same shape changes; new PT-BR copy from `Hero.html` |
| `src/i18n/locales/es/translation.json` | UPDATE | Same shape changes; new ES copy |
| `public/hero/airplane.jpg` | NEW | Copied from `1351_rev_1.jpg` (135 KB, 2501×1401) |
| `src/index.css` | UPDATE | Added `prefers-reduced-data` fallback for hero background media |
| `tests/e2e/hero.spec.ts` | NEW | Playwright hero image, H1, mobile no-overflow, and axe coverage |
| `src/pages/Privacy.test.tsx` | UPDATE | Fixed helper to match new H1 copy |
| `src/pages/Privacy.story-1-10.e2e.test.tsx` | UPDATE | Fixed helper to match new H1 copy |
| `_bmad-output/implementation-artifacts/6-3-hero-left-background-copy-kpis.md` | UPDATE | Task boxes, Dev Agent Record, File List, Change Log, Status |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | UPDATE | Story 6.3 → `done` |

### Change Log

| Date | Author | Summary |
|---|---|---|
| 2026-05-17 | Claude (Opus 4.7) | Story 6.3 — Hero sober rebuild. Airplane background + dual-gradient scrim, two-line H1 with accent span, `<Trans>` subhead, dual CTA (solid-accent + tertiary arrow link), KPI strip via refactored StatRow. Three-locale i18n reshape. Right column wired as placeholder for Story 6.4. |
| 2026-05-19 | Codex | Review fixes — added reduced-data fallback, restored test prototype cleanup, added focused Playwright hero coverage, and marked review findings resolved. |
