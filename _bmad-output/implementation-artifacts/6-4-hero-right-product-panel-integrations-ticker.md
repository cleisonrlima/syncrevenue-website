# Story 6.4: Hero Right — Product Panel, Integration Tiles, Live Ticker

Status: ready-for-dev

Epic: 6 — Visual Design Refresh (Claude Design Handoff)

Source design: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` (`.panel`, `.panel-head`, `.panel-mark`, `.chips`, `.ints`, `.int`, `.ints-more`, `.ticker` — lines 141–220, 584–630).

Depends on: Story 6.1 (sober tokens), Story 6.3 (hero layout shell).

## Story

As a visitor scanning the hero,
I want a right-side glass panel that names the SyncRevenue product, lists the three GDS integrations with official wordmarks, and shows a live "mid-office adjustment" ticker,
So that I immediately understand what the product is, that it speaks the GDS protocols I use, and that it's actually running against live ticket flow.

## Acceptance Criteria

1. **Given** the hero right column renders **When** the panel is inspected **Then** an `<aside class="panel">` with `padding:28px 28px 26px; border-radius:14px; background:rgba(255,255,255,.03); border:1px solid var(--line-strong)` is present; below 1024px viewport, the panel stacks below the left copy column with the same grid collapse rule from Story 6.3

2. **Given** the panel head renders **When** inspected **Then** a 44×44 square (`.panel-mark` with `background:var(--accent); border-radius:10px`) contains a 20×20 white dollar-sign SVG (currency stroke icon); to the right, the eyebrow tag reads `SYNCSIRIUS · MOTOR DE COMISSÕES` (`font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:rgba(255,255,255,.5)`) and the product name `SyncRevenue` reads `font-size:22px; font-weight:700`

3. **Given** the panel line paragraph renders **When** inspected **Then** the body copy reads "Sistema especialista que aplica a regra correta de comissão e markup no fluxo mid-office — antes da emissão do bilhete." with `<strong>` on "no fluxo mid-office", per `font-size:14px; line-height:1.55; color:rgba(231,234,247,.78)`

4. **Given** the integrations block renders **When** inspected **Then** an `.ints-label` reads "GDS integrados" (uppercase, `letter-spacing:.1em`), followed by an `.ints-row grid-template-columns:repeat(3,1fr) gap:8px` containing three `.int` tiles (white `background:#fff`, `border-radius:10px`, `min-height:60px`, `padding:14px 10px 12px`) — Amadeus, Sabre, Travelport — each with a top-right green `.live` dot (`background:#5BC98C; width:6px; height:6px`) and the official wordmark centered; Travelport additionally shows a `.int-sub` subtitle "Galileo · Worldspan" with `font-size:9.5px; color:#5B6478` per `Hero.html` line 617

5. **Given** the partner logos are bundled **When** the dev step procures them **Then** local copies of the three official wordmarks live under `public/integrations/` — `amadeus.png`, `sabre.svg`, `travelport.svg` — sourced from the official URLs documented in the chat transcript (`_bmad-output/design-handoffs/syncsirius-website-2026-05-17/chats/chat1.md` lines 307–310); each tile constrains its image via `max-height:22px; max-width:100%; object-fit:contain` so the differing aspect ratios (Amadeus 208×32, Sabre 2000×576, Travelport 195×24) render consistently

6. **Given** the integrations "more" line renders **When** inspected **Then** below the tile row a single line reads "também suportado" plus two mini chips — `NDC` and `IBE próprio` — with `font-family:"JetBrains Mono"; font-size:10.5px; padding:3px 8px; border-radius:5px; background:rgba(255,255,255,.04); white-space:nowrap` (the `white-space:nowrap` is the verifier-mandated fix from the chat transcript line 303)

7. **Given** the live ticker renders below the integrations block **When** inspected **Then** a `.ticker` row shows a green dot (`#5BC98C`), the text "Ticket `<b>PNR-XXXXX</b>` ajustado em mid-office", and a green value chip "+ $X.XXX" — all on a single line at `font-size:12.5px`, with `padding:13px 14px; border-radius:10px; background:rgba(255,255,255,.03); border:1px solid var(--line)`

8. **Given** the ticker is motion-enabled **When** the user has not opted into reduced motion **Then** the PNR number and dollar value cycle through a fixed array of ~6 fabricated entries every 8 seconds with a 200ms fade transition; **And** **When** `prefers-reduced-motion: reduce` is set, the ticker stays on the first entry without animation

9. **Given** any locale is active **When** the panel copy is inspected **Then** every string flows through `t()` — keys `hero.panel.tag`, `hero.panel.name` (literal "SyncRevenue" — invariant), `hero.panel.line` (with `<Trans>` strong slot), `hero.panel.intsLabel`, `hero.panel.intsMore.prefix`, `hero.panel.intsMore.ndc`, `hero.panel.intsMore.ibe`, `hero.panel.ticker.label` (with `<Trans>` bold PNR slot) — present in `en/`, `pt-BR/`, `es/`

10. **Given** mobile viewport (< 1024px) **When** the panel stacks below the copy **Then** the tiles row stays 3-column at ≥ 560px; below 560px the tiles row may stack to a single column (CSS choice — Hero.html does not collapse, but mobile audit may require it) — final decision logged in the dev step's discovery pass

## Tasks / Subtasks

- [ ] Task 0: i18n keys (AC: 9)
  - [ ] Add `hero.panel.*` namespace across `en/`, `pt-BR/`, `es/`
  - [ ] Add `hero.panel.ticker.entries.*` array for the rotating ticker copy

- [ ] Task 1: Procure partner logos (AC: 5)
  - [ ] Download and license-check Amadeus (`amadeus-logo-dark-sky.png`), Sabre (`sabre-logo-black.svg`), Travelport (`travelport-logo.svg`)
  - [ ] Place under `public/integrations/`
  - [ ] Confirm trademark usage policy with stakeholder (chat line 279 notes "respeita os trademarks" via monogram fallback if needed)
  - [ ] If a logo is blocked: fall back to the stylized monogram chip from `Hero v3.html` (gradients OFF per Epic 6 sober palette — solid neutral fill)

- [ ] Task 2: Build `HeroProductPanel.tsx` (new component, sub-component of Hero) (AC: 1–7)
  - [ ] File path: `src/components/sections/HeroProductPanel.tsx` + co-located test
  - [ ] Composes the panel head, line, integrations block, "também suportado" line, ticker
  - [ ] Imports the dollar-sign icon SVG (inline for now; consider lucide-react if already in stack)
  - [ ] Renders `<img>` for each partner logo with `loading="eager"` (above the fold) + width/height attrs to prevent CLS

- [ ] Task 3: Ticker animation (AC: 8)
  - [ ] Local state hook cycles through entries every 8s
  - [ ] Respect `useReducedMotion()` (already available from Story 3.2 motion features) — disable cycling when reduced
  - [ ] Test: vitest fake timers asserting cycle + reduced-motion bypass

- [ ] Task 4: Integrate into `Hero.tsx` right column (AC: 1, 10)
  - [ ] Replace existing right-column content (previously absent or different) with `<HeroProductPanel />`
  - [ ] Ensure grid collapse from Story 6.3 stacks panel below copy on mobile

- [ ] Task 5: Accessibility
  - [ ] Each partner logo has descriptive `alt` ("Amadeus", "Sabre", "Travelport — Galileo and Worldspan")
  - [ ] Ticker is wrapped in `aria-live="polite"` so screen readers announce new ticket entries
  - [ ] Ticker value's `+$` prefix is read via visually-hidden span ("positive adjustment of $X")

- [ ] Task 6: Tests
  - [ ] `HeroProductPanel.test.tsx` covers: tile render, live dot present, Travelport sub-text, ticker initial entry, cycling under fake timers, reduced-motion bypass, locale switch parity
  - [ ] Extend `Hero.test.tsx` to assert panel mounts inside the right column

## Dev Notes

- Verifier history (chat lines 286–343) demonstrates the Sabre logo's 2000×576 aspect ratio caused issues with `max-width:60px`; final solution uses `max-height:22px max-width:100%; object-fit:contain` — keep that exact constraint
- Cross-origin image loading worked in the prototype but failed under html-to-image screenshots — local hosting solves both legibility and screenshot tooling
- The PNR + dollar values are fabricated demo data — confirm with marketing that "+$8,420 / PNR-44128" pattern is acceptable for public display; if not, sub in a copy variant ("Ticket recente ajustado em mid-office" without specific numbers)
- The `bgcolor:#fff` on integration tiles is intentional — partner wordmarks render against white in their brand guidelines

## Technical Requirements

- **Languages/Frameworks:** TypeScript 5.x, React 18, Tailwind 3.x, react-i18next `<Trans>` for HTML-bearing keys
- **State machine:** Local ticker cycle state — `useState<number>` index + `useEffect` timer; cycle paused under `prefers-reduced-motion: reduce`
- **API contracts:** N/A (ticker data is in-memory translation array, not server-backed)
- **Security:** Partner wordmarks are publicly served static assets; trademark policy confirmed with stakeholder before merge
- **Performance:** Partner images `loading="eager"` (above the fold), explicit `width` + `height`; cycling cap = 1 timer instance regardless of remounts (cleanup on unmount)

## Architecture Compliance

- Component naming: `HeroProductPanel.tsx` is NEW under `src/components/sections/`; PascalCase; co-located test
- i18n keys dot-nested ≤ 3 levels: `hero.panel.{tag,name,line,intsLabel}`, `hero.panel.intsMore.{prefix,ndc,ibe}`, `hero.panel.ticker.{label,entries}` — verify `intsMore` and `ticker` nodes do NOT exceed 3-level depth (`ticker.entries.0` is 3 — OK; `ticker.entries.0.pnr` would be 4 — restructure if needed)
- Anti-patterns: no `bg-gradient-*` inside the panel — sober palette; no `<img>` hotlinks to partner CDNs in production

## Library / Framework Requirements

- `<Trans>` for ticker label (bold PNR slot) and panel line (strong "no fluxo mid-office" slot)
- Reuse `useReducedMotion()` from Story 3.2 — gate ticker cycle
- If `lucide-react` is already in `package.json`, use its `DollarSign` icon for the panel mark; otherwise inline SVG (do NOT add lucide-react just for this)
- No new ticker library — plain `useEffect` + `setInterval` with cleanup; no `react-use`, no `framer-motion`

## File Structure Requirements

| File | Change type | Notes |
|---|---|---|
| `src/components/sections/HeroProductPanel.tsx` | NEW | Panel head + line + integrations block + ticker |
| `src/components/sections/HeroProductPanel.test.tsx` | NEW | Render + ticker cycle (fake timers) + reduced-motion bypass + locale parity |
| `src/components/sections/Hero.tsx` | UPDATE | Mount `<HeroProductPanel />` in the right column established by 6.3 |
| `src/i18n/locales/{en,pt-BR,es}/translation.json` | UPDATE | Add `hero.panel.*` namespace including `ticker.entries` array |
| `public/integrations/amadeus.png` | NEW | Official wordmark (max-height 22px render) |
| `public/integrations/sabre.svg` | NEW | Official wordmark |
| `public/integrations/travelport.svg` | NEW | Official wordmark |

## Testing Requirements

- `HeroProductPanel.test.tsx`:
  - 3 tiles render with non-empty `<img>` src
  - Each tile shows a `.live` green dot
  - Travelport tile shows "Galileo · Worldspan" subtitle
  - Ticker initial entry renders
  - Vitest `vi.useFakeTimers()`: advance 8s → ticker index advances → entry text updates
  - With `prefers-reduced-motion: reduce` mocked, ticker stays on entry 0 across 24s of fake time
  - Locale switch: panel copy updates for `pt-BR` / `en` / `es`
- `Hero.test.tsx`: panel mounts in right column at desktop; collapses below copy at < 1024px
- Playwright `tests/e2e/hero.spec.ts`: panel visible above the fold at 1280px viewport; tiles all render

## Previous Story Intelligence

- **Story 6.3 (`hero-left-background-copy-kpis`)** establishes the `.top` grid (`1.05fr / .95fr`) that the panel slots into. Confirm the grid collapse breakpoint matches before mounting (`< 1024px` → single column).
- **Story 3.2 (`animations-micro-interactions`)** added `useReducedMotion()` — reuse.
- **Story 6.1 (`design-tokens-sober-palette`)** provides `--accent`, `--line-strong`, `--accent-dim`. Consume.

## Project Context Reference

- Handoff source: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` lines 141–220 (panel + integrations + ticker), 584–630 (right column markup), 286–343 (verifier feedback on Sabre logo sizing), 510 (sober palette pass — no gradients in panel)
- Chat transcript: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/chats/chat1.md` lines 273 (Travelport merge decision), 279 (trademark policy fallback), 286–343 (Sabre aspect-ratio constraint), 303 (`white-space:nowrap` chip fix)
- Vault: `vault/Planning/Architecture-Key.md` for i18n + naming + motion-safe rules
- Epics source: `_bmad-output/planning-artifacts/epics.md` line 1518

## Story Completion Status

- Status: ready-for-dev
- Completion note: Scaffold upgraded 2026-05-17. Partner-logo trademark policy is a soft blocker — confirm with stakeholder before downloading official wordmarks; monogram fallback path captured in Task 1.

## Outstanding Questions for Dev

1. Trademark usage policy — confirm with stakeholder before bundling Amadeus / Sabre / Travelport wordmarks publicly.
2. Ticker copy approval — fabricated `+$8,420 / PNR-44128` style data must be cleared with marketing before going public.
3. Mobile breakpoint for tile-row collapse (3 → 1 column below 560px) — confirm during discovery pass.
