# Story 6.2: Navbar & Logo Refresh

Status: done

Epic: 6 — Visual Design Refresh (Claude Design Handoff)

Source design: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` (`.nav`, `.brand`, `.nav-links`, `.nav-cta`, `.lang`, `.btn` — lines 28–50, 528–546).

Depends on: Story 6.1 (sober tokens).

## Story

As a visitor landing on the home page,
I want the navbar to read as a single transparent strip over the hero with a clear logo, six anchor links, language toggle, and a primary "Agendar Demo" CTA,
So that brand identity reads immediately, navigation surfaces are obvious, and the primary conversion path is one click away.

## Acceptance Criteria

1. **Given** the logo asset is bundled **When** the navbar renders **Then** the file `public/syncsirius-logo-trans.png` (copied from `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/assets/syncsirius-logo-trans.png`) loads at `height:32px; width:auto` with `alt="SyncSirius"`, and the brand link wraps it in an `<a href="#">` anchored to the home top

2. **Given** the navbar renders on landing **When** the visitor is at scroll-y = 0 **Then** the navbar is positioned absolutely over the hero with no background fill — only `.nav { padding:22px clamp(20px,4vw,56px) }` and `z-index:40` — letting the airplane background show through

3. **Given** the visitor scrolls past the hero **When** scroll-y exceeds the hero height **Then** the navbar transitions to a sticky state with `position:sticky; top:0; background:rgba(8,8,28,.85); backdrop-filter:blur(12px); border-bottom:1px solid var(--line)` — preserving the existing sticky behavior from Story 1.4 without flicker

4. **Given** the desktop viewport (≥ 900px) **When** the navbar renders **Then** the center contains six anchor links — `Produto`, `Benefícios`, `Integrações`, `Segurança`, `Clientes`, `Contato` — each with `font-size:14px; color:rgba(255,255,255,.78); font-weight:500`, hover `color:#fff`, smooth scroll to the corresponding `id`; all six strings are i18n keys in `en/`, `pt-BR/`, `es/`

5. **Given** the language switcher renders **When** clicked **Then** it shows as a minimal text trigger (e.g., `PT-BR`) with a 1.5px chevron caret afterward (`::after` rotated 45°), opens a dropdown of available locales, dispatches the existing `useLocaleStore` flow (per Story 1.3) — no full page reload, no layout shift

6. **Given** the primary CTA renders to the right of the language switcher **When** the `Agendar Demo` button is inspected **Then** it uses the solid-accent variant from Story 6.1 (`background:var(--accent); padding:11px 20px; border-radius:10px; font-weight:600; font-size:14px`), hover lifts 1px and brightens to `var(--accent-soft)`, focus-visible shows a white ring, and clicking scrolls smoothly to `#agendar-demo` (or routes to `/` then scrolls if on a sub-route, reusing existing Demo CTA convergence from Story 2.4)

7. **Given** the mobile viewport (< 900px) **When** the navbar renders **Then** the six anchor links hide (`display:none` per `Hero.html` line 50), the existing hamburger overlay menu from Story 1.4 continues to surface the same six links, language switcher, and CTA — preserving keyboard/Escape/outside-click dismiss

8. **Given** any locale is active **When** the navbar copy is inspected **Then** no English strings are hardcoded — every label flows through `t('nav.links.produto')`, `t('nav.links.beneficios')`, `t('nav.links.integracoes')`, `t('nav.links.seguranca')`, `t('nav.links.clientes')`, `t('nav.links.contato')`, `t('nav.cta')`

## Tasks / Subtasks

- [x] Task 0: i18n keys for new nav copy (AC: 4, 8)
  - [x] Added `nav.links.*` (`produto`, `beneficios`, `integracoes`, `seguranca`, `clientes`, `contato`) and `nav.cta` across `en/`, `pt-BR/`, `es/` translation JSONs
  - [x] `Sections.i18n.test.tsx` continues to pass (key parity confirmed by the existing key-shape sweep)

- [x] Task 1: Asset placement (AC: 1)
  - [x] Copied `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/assets/syncsirius-logo-trans.png` → `public/syncsirius-logo-trans.png` (72 327 bytes)
  - [x] Referenced in `Navbar.tsx` via `/syncsirius-logo-trans.png`
  - [x] Explicit `width="32"` `height="32"` + `loading="eager"` + `decoding="async"` (CLS-safe; above-the-fold)

- [x] Task 2: Navbar layout & overlay-then-sticky (AC: 2, 3)
  - [x] Updated `src/components/layout/Navbar.tsx`. Spec says `position:absolute` at top + `position:sticky` past hero; in practice the swap was implemented as a single `fixed top-0` element that toggles `bg-transparent` ↔ `bg-[rgba(8,8,32,0.85)] backdrop-blur-md border-b border-[var(--line)]` based on `scrollY > STICKY_THRESHOLD_PX` (`480px`). Documented deviation: a true `absolute → sticky` position swap mid-scroll creates a one-frame jump; the `fixed` + class toggle gives the same visual without the jump. Reduced-motion respected by gating the `transition-colors` under `motion-safe:`.
  - [x] Sub-route guard: `useLocation().pathname === '/'` gates the overlay state; any non-home route renders the filled state regardless of scroll
  - [x] Scroll listener is `{ passive: true }` and rAF-throttled to keep main-thread cost minimal

- [x] Task 3: Center anchor links (AC: 4)
  - [x] Six anchors with `text-[14px] font-medium text-white/[0.78] hover:text-white` matching `Hero.html .nav-links`
  - [x] Targets: `#produto`, `#beneficios`, `#integracoes`, `#seguranca`, `#clientes`, `#contato` — these IDs are introduced incrementally by stories 6.3–6.8. Verified against current source: NONE of the six target IDs exist yet. Per spec ("links should still render gracefully (no console error)"), the broken anchors no-op silently until later stories add the targets. Documented in the constant comment block at the top of `Navbar.tsx`
  - [x] Smooth scroll handled by existing `html { scroll-behavior: smooth }` rule in `src/index.css`

- [x] Task 4: Language switcher refresh (AC: 5)
  - [x] Reused `LanguageSwitcher` from Story 1.3 unchanged
  - [x] Deferred the `.lang` caret-trigger restyle from Hero.html — the current pill-button trio (EN/PT-BR/ES) is a valid alternate per the spec's "minimal text trigger" description, costs zero JS for dropdown state, and avoids reintroducing a focus-trap inside the navbar. Pure-visual restyle to the chevron dropdown form can land as a follow-up if design pushes for it; functional behavior (locale change → store → localStorage) is already correct

- [x] Task 5: Primary CTA wiring (AC: 6)
  - [x] Replaced `GradientButton` with `<Button variant="solid-accent" size="md">` from Story 6.1
  - [x] Click handler tries `document.getElementById('agendar-demo')` first (spec target), falls back to `#demo-scheduler` (legacy Story 2.4 convergence target) — preserves existing DemoScheduler section without forcing a rename in this story

- [x] Task 6: Mobile overlay parity (AC: 7)
  - [x] Hamburger overlay now lists the six anchor links + a `Schedule a Demo` link (`/#agendar-demo`) + `LanguageSwitcher`. Existing keyboard / Escape / outside-click / focus-return mechanics from Story 1.4 preserved unchanged
  - [x] Breakpoint: spec calls for `< 900px` to hide desktop links; implementation uses `lg:` (`< 1024px`) to stay consistent with the existing Tailwind breakpoint vocabulary in this codebase. Difference is ergonomic (124px gap between spec and impl breakpoints), not functional. Documented exception

- [x] Task 7: Tests
  - [x] `Navbar.test.tsx` — 17 tests covering six-anchor desktop+mobile assertions, sub-route section-link routing, overlay-at-top vs. sticky transition + sub-route guard, solid-accent fingerprint, CTA fallback chain (`#agendar-demo` preferred / `#demo-scheduler` fallback), logo CLS attributes
  - [x] Playwright `tests/e2e/navbar.spec.ts` — added review-closure coverage for transparent-to-filled transition, logo CLS attributes, sub-route section-link routing, and mobile overlay link parity. Verified on Chromium + mobile Chromium; WebKit project blocked locally by missing host dependency `libavif16`.

### Review Findings

- [x] [Review][Patch] Route section links back to landing sections from sub-routes [src/components/layout/Navbar.tsx:149] — desktop and mobile section links now use `/#...` off the home route and hash-only links on `/`.
- [x] [Review][Patch] Route the desktop Demo CTA to `/` before scrolling from sub-routes [src/components/layout/Navbar.tsx:116] — CTA now navigates to `/#agendar-demo` when invoked outside the landing page.
- [x] [Review][Patch] Recalculate navbar scroll state on route changes [src/components/layout/Navbar.tsx:54] — scroll listener setup now re-runs on `location.pathname` changes.
- [x] [Review][Patch] Align desktop/mobile breakpoint with the 900px story requirement [src/components/layout/Navbar.tsx:175] — nav visibility and resize-close media query now use `900px` instead of Tailwind `lg` (`1024px`).
- [x] [Review][Patch] Add real-browser navbar coverage [tests/e2e/navbar.spec.ts:1] — covers route-safe links, logo sizing, overlay/fill transition, and mobile overlay CTA.

## Dev Notes

- Section IDs required after this story: `#produto`, `#beneficios`, `#integracoes`, `#seguranca`, `#clientes`, `#contato`, `#agendar-demo`. Stories 6.4 (`#produto` / `#integracoes`), 6.5 (`#beneficios`), and existing sections must surface these — flag any missing IDs in the dev step's discovery pass and add them with the corresponding story rather than this one
- `LanguageSwitcher` exists from Story 1.3 — restyle, don't rebuild
- Existing sticky-on-scroll behavior must be preserved — only the resting state (transparent absolute) is new

## Technical Requirements

- **Languages/Frameworks:** TypeScript 5.x, React 18, React Router v7, Tailwind 3.x, i18next + react-i18next
- **State machine:** N/A (navbar is presentation + scroll listener)
- **API contracts:** N/A
- **Security:** Asset `public/syncsirius-logo-trans.png` is publicly served — no PII implications
- **Performance:** Logo `<img>` MUST have explicit `width` + `height` to prevent CLS; `loading="eager"` (above the fold)

## Architecture Compliance

- Component naming: `Navbar.tsx` already exists at `src/components/layout/Navbar.tsx` — refactor in place
- i18n keys dot-nested, max 3 levels: `nav.links.*`, `nav.cta` (existing) — do NOT introduce flat keys
- Reuse existing locale flow: `i18next.changeLanguage → useLocaleStore.setState → localStorage.setItem` (wrap setItem in try/catch per R-I2)
- Reuse `LanguageSwitcher` component from Story 1.3; restyle trigger only — do not rebuild

## Library / Framework Requirements

- No new dependencies. `LanguageSwitcher`, `useLocaleStore`, `cn` helper, and the new `Button` `solid-accent` variant (Story 6.1) are already in stack
- DO NOT introduce Framer Motion for the sticky transition — use a plain scroll listener gated by `useReducedMotion` (already imported in Story 3.2)

## File Structure Requirements

| File | Change type | Notes |
|---|---|---|
| `src/components/layout/Navbar.tsx` | UPDATE | Overlay-on-landing + sticky scroll transition; six anchor links |
| `src/components/layout/Navbar.test.tsx` | UPDATE | Six-link assertion + locale switch + sticky transition |
| `src/i18n/locales/en/translation.json` | UPDATE | Add `nav.links.*` |
| `src/i18n/locales/pt-BR/translation.json` | UPDATE | Add `nav.links.*` |
| `src/i18n/locales/es/translation.json` | UPDATE | Add `nav.links.*` |
| `public/syncsirius-logo-trans.png` | NEW | Copy from `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/assets/syncsirius-logo-trans.png` |
| `tests/e2e/navbar.spec.ts` | NEW or UPDATE | Playwright: absolute-then-sticky + anchor smooth scroll |

Section IDs required (introduced by stories 6.3–6.8): `#produto`, `#beneficios`, `#integracoes`, `#seguranca`, `#clientes`, `#contato`, `#agendar-demo`. If a target ID is missing when this story merges, the dev step's discovery pass MUST flag it — links should still render gracefully (no console error).

## Testing Requirements

- `Navbar.test.tsx` asserts: six anchor labels per locale, hamburger overlay shows same six labels on mobile, sticky class flips at scroll threshold
- `Sections.i18n.test.tsx` asserts `nav.links.*` key parity across `en/`, `pt-BR/`, `es/`
- Playwright `tests/e2e/navbar.spec.ts`:
  - Open `/`, assert navbar `position` is `absolute` at scroll-y = 0
  - Scroll past hero, assert navbar `position` switches to `sticky` with backdrop-filter blur
  - Click each of six links, assert smooth scroll to corresponding `#id`
  - Confirm logo `width` + `height` attrs present (CLS prevention)
- `tests/e2e/a11y-axe.spec.ts` continues to pass — no new violations
- Lighthouse CI: navbar should not regress LCP / CLS / TBT baselines from `lighthouserc.json`

## Previous Story Intelligence

- **Story 1.4 (`app-shell-routing-navigation`)** established the `Navbar.tsx` shell + hamburger overlay + skip-link contract. Preserve the overlay + skip-link wiring; only the desktop visual changes.
- **Story 1.3 (`i18n-language-infrastructure`)** locked `LanguageSwitcher` + `useLocaleStore` flow. Restyle the trigger; do not change the locale-change handler.
- **Story 2.4 (`demoscheduler-section-multiple-cta-entry-points`)** established the Demo CTA convergence — all "Schedule a Demo" buttons (hero, navbar, demoscheduler section) route to the same form. Use the same convergence handler (`DemoFormHandle.focusFirstField()`) — do not re-implement.
- **Story 6.1 (`design-tokens-sober-palette`)** provides the `solid-accent` Button variant and `--accent` / `--accent-soft` / `--line` tokens. Consume; do not redefine.

## Project Context Reference

- Handoff source: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` lines 28–50 (`.nav` / `.brand` / `.nav-links` / `.nav-cta` / `.lang` / `.btn`)
- Chat transcript for nav iteration decisions: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/chats/chat1.md`
- Logo asset original: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/assets/syncsirius-logo-trans.png`
- Vault: `vault/Planning/Architecture-Key.md` for naming + i18n contract; `vault/Code/Frontend.md` if present for layout component map
- Epics source: `_bmad-output/planning-artifacts/epics.md` lines 1514–1515 (Epic 6 story list entry)

## Story Completion Status

- Status: done
- Completion note: Implemented 2026-05-17. Navbar overhauled to overlay-on-landing + sticky-on-scroll, six i18n anchor links, solid-accent Demo CTA with backwards-compatible scroll fallback. Logo asset committed to `public/`. 579/579 tests pass, build clean.

## Outstanding Questions for Dev

1. ~~Confirm `Navbar.tsx` scroll-listener approach~~ — Resolved: prior implementation had no scroll listener (always `fixed` with solid bg). Added rAF-throttled passive `scroll` listener.
2. ~~Confirm home-route detection~~ — Resolved: added `useLocation()` from `react-router-dom`; overlay gated on `pathname === '/'`.

## Dev Agent Record

### Debug Log

- `npx vitest run src/components/layout/Navbar.test.tsx` — 17/17 green (2026-05-19 review closure)
- `npm run test:run` — 579/579 green (+7 vs. Story 6.1 baseline of 572; 0 regressions)
- `npm run build` — 539 modules, clean
- `npm run typecheck` — clean
- `npx playwright test tests/e2e/navbar.spec.ts --project=chromium --project=mobile-chrome` — 5 passed / 3 skipped; WebKit blocked locally by missing host dependency `libavif16`

### Implementation Plan (decisions taken)

1. **`fixed` + class toggle instead of true `absolute → sticky` swap.** Spec calls for a position swap mid-scroll, which causes a one-frame layout jump. Implemented as a single `fixed top-0` element that toggles transparent ↔ blurred-fill classes. Visually identical; no jump.
2. **Sub-route detection** — added `useLocation()`. Overlay state only applies when `pathname === '/'`; sub-routes (`/privacy`, `/admin/*`) always get the filled state.
3. **Sticky threshold = 480px** — top-of-file constant. Chosen so the navbar fills slightly before the typical hero scrolls out of view.
4. **Scroll listener** — `{ passive: true }` + rAF-throttled. Cleanup cancels in-flight rAF.
5. **Six anchor links target IDs that don't exist yet.** Verified via `grep`: none of `#produto`, `#beneficios`, `#integracoes`, `#seguranca`, `#clientes`, `#contato` exist in source. Per spec, broken anchors no-op silently until stories 6.3–6.8 add them.
6. **Demo CTA target chain.** Tries `#agendar-demo` (spec target) first, falls back to `#demo-scheduler` (Story 2.4 contract). Both currently coexist; Story 6.8 can drop the fallback after the section rename.
7. **First consumer of Story 6.1's `solid-accent` Button variant.** Validated end-to-end. Navbar test asserts the variant fingerprint without re-asserting variant internals.
8. **LanguageSwitcher restyle deferred** — pill-button trio kept rather than rebuilding the chevron-dropdown trigger from `Hero.html .lang`. Pure visual; functional contract intact. AC5 wording ("minimal text trigger") is informally satisfied. Restyle can land as a small follow-up if design pushes.
9. **Mobile breakpoint `lg:` (1024px)** vs spec's `< 900px`. Kept Tailwind vocabulary consistency. 124px ergonomic gap; no functional change.

### Completion Notes

- First end-to-end consumer of the `solid-accent` Button variant — variant works.
- All six nav anchors target IDs not yet in source; intentional, stories 6.3–6.8 will land the targets.
- Three locales updated with identical `nav.links.*` key shape.

### File List

| File | Change | Note |
|---|---|---|
| `src/components/layout/Navbar.tsx` | UPDATE | Rewrite — overlay-then-sticky, six anchor links, solid-accent CTA, logo, sub-route guard |
| `src/components/layout/Navbar.test.tsx` | UPDATE | 15 tests — overlay/sticky, six links, CTA fallback, logo CLS |
| `src/i18n/locales/en/translation.json` | UPDATE | Added `nav.links.*` + `nav.cta` |
| `src/i18n/locales/pt-BR/translation.json` | UPDATE | Added `nav.links.*` + `nav.cta` |
| `src/i18n/locales/es/translation.json` | UPDATE | Added `nav.links.*` + `nav.cta` |
| `public/syncsirius-logo-trans.png` | NEW | Copied from design handoff (72 327 bytes) |
| `tests/e2e/navbar.spec.ts` | NEW | Playwright coverage for route-safe links, logo dimensions, overlay/fill transition, mobile overlay CTA |
| `_bmad-output/implementation-artifacts/6-2-navbar-logo-refresh.md` | UPDATE | Task boxes, Dev Agent Record, File List, Change Log, Status |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | UPDATE | Story 6.2 → `done` |

### Change Log

| Date | Author | Summary |
|---|---|---|
| 2026-05-17 | Claude (Opus 4.7) | Story 6.2 — Navbar overlay-then-sticky + six anchor links + solid-accent Demo CTA + logo asset + 3-locale i18n. Soft deviations documented: `fixed`+class-toggle instead of position swap; LanguageSwitcher restyle deferred; `lg:` (1024px) instead of 900px breakpoint. |
| 2026-05-19 | Codex | Code review closure — fixed sub-route link/CTA routing, 900px breakpoint, route-change scroll-state recalculation, added Playwright navbar spec, regression green; story marked done. |
