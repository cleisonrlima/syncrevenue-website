# Story 6.5: Benefits Grid + Trust Strip

Status: ready-for-dev

Epic: 6 — Visual Design Refresh (Claude Design Handoff)

Source design: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` (`.benefits`, `.ben`, `.ben-head`, `.ben-ico`, `.ben-metric`, `.trust`, `.trust .item`, `.trust .sep` — lines 222–271, 633–725).

Depends on: Story 6.1 (sober tokens), Story 6.3 (hero wrap context).

## Story

As a visitor scanning below the hero,
I want a 6-card benefits grid that names each SyncRevenue capability with an icon, a metric chip, a tight headline, and a single sentence of proof — followed by a slim trust strip,
So that I can scan the value props in under 15 seconds and walk away with three quantified outcomes (+15-20%, −40% ADM, −65% QC) burned in.

## Story Context (architectural placement)

The current site has `SyncRevenue.tsx` and `Services.tsx` sections (Story 1.6) carrying the "what the product does" copy. This story does NOT delete those; it introduces a new `<section id="beneficios">` with the 6-card grid living INSIDE the same hero wrap (per `Hero.html` line 634 nesting under `.wrap`). The 6 cards are an inline expansion of the hero panel's value proposition — not a replacement for the standalone product section. Final placement decision (inline in hero vs separate section) is logged in the dev step's discovery pass, defaulting to inline-in-hero to match the prototype.

## Acceptance Criteria

1. **Given** the hero wrap renders **When** scrolled to the benefits region **Then** a `<div class="benefits" id="beneficios">` containers a 3-column grid (`grid-template-columns:repeat(3,1fr); gap:16px`), collapsing to 2 columns at < 960px and 1 column at < 560px

2. **Given** each benefit card renders **When** inspected **Then** each `<article class="ben">` has `padding:24px 22px 22px; border-radius:14px; background:rgba(255,255,255,.03); border:1px solid var(--line)`; hover lifts to `border-color:var(--line-strong); background:rgba(255,255,255,.045)` (transition 150ms)

3. **Given** a card head renders **When** inspected **Then** the head is a flex row (`justify-content:space-between; align-items:flex-start`) with a 38×38 `.ben-ico` (`background:var(--accent-dim); color:var(--accent-soft); border-radius:10px`) holding an 18px stroke SVG, and a `.ben-metric` chip on the right (`font-size:11.5px; padding:5px 9px; border-radius:6px; border:1px solid var(--line)`); two metric variants exist — `.ben-metric.blue` (`color:var(--accent-soft); background:var(--accent-dim); border-color:transparent`) and default neutral

4. **Given** the six cards render **When** their content is inspected **Then** the cards (in order) carry the following data — icon name (lucide-react or inline SVG), metric chip variant + label, h3 title, body paragraph — exactly as specified in `Hero.html` lines 636–700:

   | # | Icon | Metric chip | Title | Body |
   |---|------|-------------|-------|------|
   | 1 | clock / circle-clock | `antes do ticket` (neutral) | Comissão correta na emissão | Determina POS, comissão e markup automaticamente em mid-office, eliminando retrabalho do rate desk depois da venda. |
   | 2 | list-bullet | `multi-fonte` (blue) | GDS, NDC e IBE — agnóstico | Funciona com Amadeus, Sabre, Galileo, Worldspan, conteúdo NDC e motores de busca próprios. Uma única regra serve a todos. |
   | 3 | document | `48h` (neutral/amber accent kept neutral per sober palette) | Gestão de contratos | Envie os PDFs dos contratos de cia aérea — nossa equipe estrutura as regras na base de conhecimento em até 48 horas. |
   | 4 | chart-line-up | `+15–20%` (neutral) | ROI imediato | Ganho líquido de 15–20% sobre a receita de comissões assim que entra em produção — sem mudar processo do front-office. |
   | 5 | shield-check | `−40% ADM` (neutral) | Menos disputas, menos ADM | Aplicar a regra certa antes da emissão derruba débitos contestados e reduz em até 65% as exceções que chegam ao QC. |
   | 6 | bar-chart | `pós-emissão` (blue) | Analytics para negociar | Relatórios de performance por cia aérea, contrato e POS — munição com dado para a próxima rodada de negociação. |

5. **Given** card typography renders **When** inspected **Then** h3 uses `font-size:15px; font-weight:700; letter-spacing:-.01em; line-height:1.25; color:#fff`; body p uses `font-size:13px; line-height:1.55; color:rgba(231,234,247,.72)`

6. **Given** the trust strip renders below the benefits grid **When** inspected **Then** a `.trust` flex row (`margin-top:42px; gap:18px 28px; align-items:center`) holds 4 items separated by 3×3 round dots — each item is an inline SVG + label at `font-size:11.5px; color:rgba(255,255,255,.5)`; item labels: "Transmissão criptografada", "Roadmap de certificação", "Seguro contratual", "Agências dos EUA referenciadas"

7. **Given** the existing `TrustBar.tsx` component (Story 1.5) **When** the trust strip is reimplemented **Then** `TrustBar.tsx` is refactored to render this new inline strip (NOT a new component) — preserving the public API and i18n keys (`hero.trustBar.items.0..3`); the previous "horizontal scroll / 2×2 / single row" responsive split is replaced with a single wrap-allowed flex row

8. **Given** any locale is active **When** copy is inspected **Then** every string flows through `t()` — keys under `hero.benefits.0..5.{metric,title,body}` for the six cards (existing `hero.trustBar.items.*` reused for the trust strip)

9. **Given** the benefits grid is in the keyboard tab order **When** a user tabs through **Then** the cards themselves are not focusable (no `tabindex`), but if any card later contains a link/CTA (currently none) it would carry visible focus per design system

## Tasks / Subtasks

- [ ] Task 0: i18n keys (AC: 8)
  - [ ] Add `hero.benefits.0..5.{metric,title,body}` to `en/`, `pt-BR/`, `es/`
  - [ ] Three-locale snapshot parity check

- [ ] Task 1: Build `BenefitsGrid.tsx` component (AC: 1–5)
  - [ ] File: `src/components/sections/BenefitsGrid.tsx` + co-located test
  - [ ] Data-driven render: `BENEFITS: Array<{iconKey, metric, metricVariant, key}>` to keep markup tight
  - [ ] Icons: prefer lucide-react if already in stack, otherwise inline stroke SVGs from `Hero.html`

- [ ] Task 2: Refactor `TrustBar.tsx` for inline strip (AC: 6, 7)
  - [ ] Replace previous responsive variants with the new flex-wrap row
  - [ ] Keep existing i18n key surface (`hero.trustBar.items.0..3`)
  - [ ] Add separator dots between items (decorative, `aria-hidden="true"`)
  - [ ] Update existing `TrustBar` tests for new markup

- [ ] Task 3: Wire into `Hero.tsx` (AC: 1)
  - [ ] Mount `<BenefitsGrid />` after the `.top` block inside `.wrap`
  - [ ] Mount refactored `<TrustBar />` after `<BenefitsGrid />`
  - [ ] Ensure section anchor `#beneficios` is on the benefits grid wrapper for navbar deep-link

- [ ] Task 4: Accessibility
  - [ ] Each card uses `<article>` with `<h3>` for title (proper heading hierarchy after hero's `<h1>`)
  - [ ] Metric chip is decorative — supplements but does not replace the title's meaning
  - [ ] Trust strip SVGs `aria-hidden="true"` (label carries the meaning)

- [ ] Task 5: Tests
  - [ ] `BenefitsGrid.test.tsx`: renders 6 cards, correct titles per locale, hover state, blue vs neutral metric variant, `#beneficios` id present
  - [ ] `TrustBar.test.tsx`: 4 items, separator dots are aria-hidden, no horizontal overflow at 320px
  - [ ] Extend `Sections.i18n.test.tsx` if needed for new key coverage

## Dev Notes

- The "amber" metric variant in the source CSS (`Hero.html` line 254) was a holdover from Hero v2's two-product layout (`SyncBI` amber badge); per Epic 6 sober palette, treat amber as neutral — no new color token
- The trust strip's dotted separators are pure decoration — they're inside a flex container that wraps, so they may end up on different rows; that's acceptable per the prototype
- The benefits grid is currently the only home-page surface that names the "+15–20% / −40% ADM / −65% QC" stats outside the KPI strip (Story 6.3) — keep the wording consistent across both surfaces

## Technical Requirements

- **Languages/Frameworks:** TypeScript 5.x, React 18, Tailwind 3.x, i18next + react-i18next
- **State machine:** N/A (presentation only)
- **API contracts:** N/A
- **Security:** N/A
- **Performance:** Six small SVG icons — inline; no network requests; no CLS impact

## Architecture Compliance

- Component naming: `BenefitsGrid.tsx` NEW under `src/components/sections/`; `TrustBar.tsx` refactor in place
- i18n keys: `hero.benefits.0..5.{metric,title,body}` (3-level OK); existing `hero.trustBar.items.*` reused (do NOT rename)
- Anti-patterns: no `bg-gradient-*`; no "amber" custom token (chat instruction — treat amber as neutral)
- Heading hierarchy: hero `<h1>` already exists → benefits cards use `<h3>` (skip h2 inside the hero wrap is intentional per prototype since this is nested under the hero, not a standalone section)

## Library / Framework Requirements

- If `lucide-react` is already in stack: use icons `Clock`, `List`, `FileText`, `LineChart`, `ShieldCheck`, `BarChart3`. Confirm with `npm ls lucide-react` before deciding.
- Otherwise: inline stroke SVGs from `Hero.html`
- Reuse `solid-accent` tokens (Story 6.1) for the `.ben-ico` accent-dim bg / accent-soft fg

## File Structure Requirements

| File | Change type | Notes |
|---|---|---|
| `src/components/sections/BenefitsGrid.tsx` | NEW | 6-card grid, data-driven from translation array |
| `src/components/sections/BenefitsGrid.test.tsx` | NEW | 6 cards render, blue vs neutral metric variant, `#beneficios` id |
| `src/components/sections/TrustBar.tsx` | UPDATE | Refactor to inline strip with dot separators; keep public API + i18n keys |
| `src/components/sections/TrustBar.test.tsx` | UPDATE | 4 items, separator dots `aria-hidden`, no horizontal overflow at 320px |
| `src/components/sections/Hero.tsx` | UPDATE | Mount `<BenefitsGrid />` then `<TrustBar />` after `.top` block; ensure `#beneficios` anchor lands on grid wrapper |
| `src/i18n/locales/{en,pt-BR,es}/translation.json` | UPDATE | Add `hero.benefits.0..5.{metric,title,body}` |

## Testing Requirements

- `BenefitsGrid.test.tsx`: 6 cards in order, titles match active locale, blue vs neutral metric variants, `#beneficios` id on grid wrapper, hover state class toggling (via class-presence assertion)
- `TrustBar.test.tsx`: 4 items + 3 separator dots (`aria-hidden="true"`), wraps without overflow at 320px viewport
- `Sections.i18n.test.tsx`: `hero.benefits.*` parity across `en/`, `pt-BR/`, `es/`
- Playwright `tests/e2e/a11y-axe.spec.ts`: no new violations after benefits + trust mount
- Lighthouse: no regression in mobile baseline

## Previous Story Intelligence

- **Story 1.5 (`hero-section`)** introduced `TrustBar` with horizontal-scroll / 2×2 / single-row responsive variants — that responsive split is being replaced with a single wrap-allowed flex row. Preserve i18n keys.
- **Story 6.1 (`design-tokens-sober-palette`)** provides `--accent`, `--accent-soft`, `--accent-dim`, `--line`, `--line-strong`. Consume.
- **Story 6.3 (`hero-left-background-copy-kpis`)** establishes the `.wrap` container that benefits + trust mount inside. Confirm padding doesn't collide with the new grid.

## Project Context Reference

- Handoff source: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` lines 222–271 (CSS), 633–725 (markup)
- Chat transcript: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/chats/chat1.md` (sober pass removed amber holdover)
- Vault: `vault/Planning/Architecture-Key.md`
- Epics source: `_bmad-output/planning-artifacts/epics.md` line 1520

## Story Completion Status

- Status: ready-for-dev
- Completion note: Scaffold upgraded 2026-05-17. Benefit copy is canonical PT-BR; EN + ES translations to be drafted at i18n key creation.

## Outstanding Questions for Dev

1. Final placement decision (inline-in-hero `.wrap` vs standalone section) — default inline; flag if discovery surfaces a reason to break out.
2. lucide-react availability — `npm ls lucide-react` before Task 1.
