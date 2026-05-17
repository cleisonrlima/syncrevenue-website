# Story 6.3: Hero Left — Airplane Background, Copy, KPI Strip

Status: ready-for-dev

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

- [ ] Task 0: i18n keys (AC: 8)
  - [ ] Update `hero.*` keys: split current `hero.headline` into `headline.line1` + `headline.line2`; add `cta.secondary`, `kpis.0..2.value/label`
  - [ ] Three-locale parity check via existing Vitest snapshot

- [ ] Task 1: Source the airplane background asset (AC: 1, 2)
  - [ ] Procure license-clean image (purchased stock, in-house photo, or `1351_rev_*.jpg` already in repo root — confirm with stakeholder)
  - [ ] Place at `public/hero/airplane.jpg` (and `airplane.webp` if straightforward)
  - [ ] Update Hero CSS to point at local path

- [ ] Task 2: Refactor `src/components/sections/Hero.tsx` left column (AC: 1, 3, 4, 5, 6, 7)
  - [ ] Replace gradient background with airplane `.bg` + overlay scrim
  - [ ] Update `.top` grid + collapse breakpoint
  - [ ] Update H1: two-line, accent span on line 2, drop `bg-clip-text` gradient
  - [ ] Update sub-paragraph: `<Trans>` with `<strong>` slots
  - [ ] Update CTA row: solid-accent primary + tertiary link with arrow
  - [ ] Replace `StatRow` consumption with new `.kpi-row` markup OR refactor `StatRow.tsx` to render the new visual (decision: refactor `StatRow` in place — fewer touch points)

- [ ] Task 3: Refactor `src/components/sections/StatRow.tsx` (AC: 7)
  - [ ] Remove gradient text treatment
  - [ ] Render top-border + 3 column layout per `.kpi-row` spec
  - [ ] Co-located test updated

- [ ] Task 4: Motion safety
  - [ ] Confirm no auto-animating ken-burns or carousel (per chat history line 71–86 user explicitly removed crossfades)
  - [ ] Background is static — saturate filter only

- [ ] Task 5: Accessibility
  - [ ] Verify white-on-overlay contrast ≥ 4.5:1 (use `Lighthouse` or contrast picker against the strongest tint area)
  - [ ] H1 keeps `<h1>` semantics; accent line is a `<span>` inside the same heading
  - [ ] Primary CTA `<button>` not `<a>`; tertiary `<a>` with explicit `href`

- [ ] Task 6: Tests
  - [ ] Extend `Hero.test.tsx` for two-line headline, kpi values, CTA targets, locale switch parity
  - [ ] Update Playwright `tests/e2e/hero.spec.ts` to assert background image loads, kpi strip visible above 600vh-equivalent fold, axe a11y green

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

- Status: ready-for-dev
- Completion note: Scaffold upgraded to full dev context 2026-05-17. Airplane asset acquisition flagged as Task 1 blocker — coordinate with stakeholder before scaffolding remaining tasks if no license-clean image is at hand.

## Outstanding Questions for Dev

1. Airplane background asset source — must be license-clean. Stakeholder check needed; `1351_rev_*.jpg` candidates in repo root or fresh purchased stock.
2. Confirm whether `StatRow` already has any unit tests (`StatRow.test.tsx`); if missing, add at refactor time.
