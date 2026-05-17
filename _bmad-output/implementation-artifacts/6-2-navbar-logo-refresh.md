# Story 6.2: Navbar & Logo Refresh

Status: ready-for-dev

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

- [ ] Task 0: i18n keys for new nav copy (AC: 4, 8)
  - [ ] Add `nav.links.*` and confirm `nav.cta` exists across `en/`, `pt-BR/`, `es/` translation JSONs
  - [ ] Verify all three locales have identical key shapes via `Sections.i18n.test.tsx`

- [ ] Task 1: Asset placement (AC: 1)
  - [ ] Copy `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/assets/syncsirius-logo-trans.png` to `public/syncsirius-logo-trans.png`
  - [ ] Reference in `Navbar.tsx` via `/syncsirius-logo-trans.png`
  - [ ] Set `width` and `height` HTML attributes to prevent CLS

- [ ] Task 2: Navbar layout & absolute-over-hero (AC: 2, 3)
  - [ ] Update `src/components/layout/Navbar.tsx` to use a hero-overlay variant when on the home route and scroll-y = 0
  - [ ] Sticky transition: keep existing scroll handler, swap bg + border at threshold `hero-height - navbar-height`
  - [ ] Add reduced-motion respect (no transform-based slide-in if `prefers-reduced-motion: reduce`)

- [ ] Task 3: Center anchor links (AC: 4)
  - [ ] Replace current nav-link list with six anchors mapped to `#produto`, `#beneficios`, `#integracoes`, `#seguranca`, `#clientes`, `#contato`
  - [ ] Ensure each target section ID exists (verify against current source; flag missing IDs in dev notes)
  - [ ] Smooth scroll via existing CSS `scroll-behavior:smooth` or programmatic fallback

- [ ] Task 4: Language switcher refresh (AC: 5)
  - [ ] Reuse `useLocaleStore` + `LanguageSwitcher` component from Story 1.3
  - [ ] Restyle trigger to match `.lang` from `Hero.html` (text + caret pseudo-element)

- [ ] Task 5: Primary CTA wiring (AC: 6)
  - [ ] Use `solid-accent` button variant from Story 6.1
  - [ ] Wire click to existing Demo CTA convergence (`DemoFormHandle.focusFirstField()` from Story 2.4)

- [ ] Task 6: Mobile overlay parity (AC: 7)
  - [ ] Verify hamburger overlay from Story 1.4 surfaces new link set
  - [ ] Manual + Playwright check at 375px and 768px viewports

- [ ] Task 7: Tests
  - [ ] Extend `Navbar.test.tsx` for the six-link assertion + locale-switch + sticky transition
  - [ ] Update `tests/e2e/navbar.spec.ts` (or create) to validate absolute-then-sticky transition + anchor scrolling

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

- Status: ready-for-dev
- Completion note: Scaffold upgraded to full dev context 2026-05-17. File paths verified; section IDs catalogued; Demo CTA convergence wiring referenced; locale flow + a11y guardrails enumerated.

## Outstanding Questions for Dev

1. Confirm `Navbar.tsx` scroll-listener approach (existing impl: scroll event with throttle, OR IntersectionObserver on hero). Reuse whichever pattern is current; do NOT swap approaches in this story.
2. Confirm the home-route detection used today by `Navbar.tsx` to decide overlay-vs-sticky. If none exists, add `useLocation()` from React Router.
