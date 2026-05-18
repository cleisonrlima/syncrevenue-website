# Story 6.6: ClientReferences Visual Refresh

Status: review

Epic: 6 — Visual Design Refresh (Claude Design Handoff)

Source design: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` (`.sec`, `.sec-deep`, `.sec-head`, `.sec-eyebrow`, `.sec-h`, `.quotes`, `.quote`, `.quote-mark`, `.quote-pill`, `.quote-body`, `.quote-foot`, `.agency-mark`, `.ref-cta` — lines 278–379, 730–802).

Depends on: Story 6.1 (sober tokens).

## Story

As a security-conscious agency evaluating SyncRevenue,
I want the client references section to surface three named-and-pilled testimonial cards with a clear ghost CTA to request references,
So that I can verify operational experience with peer agencies and request direct contact in one click — without the section feeling like it was painted with stock corporate gradients.

## Acceptance Criteria

1. **Given** the references section renders **When** inspected **Then** a `<section class="sec sec-deep" id="clientes">` exists with `padding:100px 0; background:#0A0B22` (slightly darker than the hero `--ink`); the inner wrap uses `max-width:1320px; padding:0 clamp(20px,4vw,56px)`

2. **Given** the section header renders **When** inspected **Then** a `.sec-head` block is centered with `max-width:760px; margin:0 auto 56px`; contains a `.sec-eyebrow` "Referências de clientes" (uppercase, `letter-spacing:.12em; color:rgba(255,255,255,.5)`) prefixed by a 24×1px horizontal rule pseudo-element; then a `.sec-h` heading "Confiança comprovada por <span class='accent'>agências reais</span>" (`font-size:clamp(1.9rem,3.4vw,2.8rem); font-weight:700`); then a `.sec-sub` paragraph (`max-width:62ch; color:rgba(231,234,247,.65)`)

3. **Given** the references grid renders **When** inspected **Then** a `.quotes` container holds 3 quote cards in a `grid-template-columns:repeat(3,1fr); gap:18px` layout, collapsing to 2 columns at < 960px and 1 column at < 640px

4. **Given** each quote card renders **When** inspected **Then** each `<article class="quote">` has `padding:30px 28px 24px; border-radius:14px; background:rgba(255,255,255,.03); border:1px solid var(--line); display:flex; flex-direction:column`; hover lifts to `border-color:var(--line-strong); background:rgba(255,255,255,.05)`; in the top-right corner sits a decorative `.quote-mark` (Georgia serif, `font-size:64px; color:rgba(255,255,255,.08)`) as a visual quote-cap (decorative, `aria-hidden`)

5. **Given** each card carries a status pill **When** inspected **Then** the pill is `.quote-pill` (`font-size:11px; padding:5px 11px; border-radius:999px; background:rgba(255,255,255,.04); border:1px solid var(--line); color:rgba(255,255,255,.7); text-transform:uppercase; letter-spacing:.04em`); two variants — default and `.muted` (`color:rgba(255,255,255,.55)`); the three pills are "cliente referência" (default), "referência operacional" (muted), "integração multi-GDS" (default)

6. **Given** the card body renders **When** inspected **Then** `.quote-body` displays the testimonial text at `font-size:15px; line-height:1.65; color:rgba(231,234,247,.85)`; the muted variant uses `font-style:italic; color:rgba(231,234,247,.65)` — applied to the middle card (Pacific Sun Voyages) only

7. **Given** the card footer renders **When** inspected **Then** `.quote-foot` is separated by `padding-top:20px; border-top:1px solid var(--line)` and shows a 40×40 `.agency-mark` monogram (`border-radius:10px; background:rgba(255,255,255,.06); border:1px solid var(--line-strong); color:#fff; font-weight:700`) — NEUTRAL fill for all three (no per-brand gradient — chat line 510 explicitly removed per-agency colors); to the right, the agency name (`font-size:14.5px; font-weight:600`) and a `.agency-loc` row with a 11×11 location-pin SVG + city label (`font-size:11.5px; color:rgba(255,255,255,.5)`)

8. **Given** the three references render **When** their content is inspected **Then** they match the existing allowlist (Story 1.9, locked by `ClientReferences.allowlist.test.tsx`) — Atlas Travel Group (Miami, FL), Pacific Sun Voyages (San Diego, CA), Northstar Travel Partners (Minneapolis, MN); no new agency names are introduced; the allowlist test continues to pass unchanged

9. **Given** the section CTA renders **When** inspected **Then** a `.ref-cta` row centers a single ghost-variant button (`padding:12px 22px; border-radius:10px; background:transparent; border:1px solid var(--line-strong); color:#fff; font-size:14px; font-weight:600`) labeled "Solicitar referências" with an arrow SVG that translates 3px on hover; the button links to `#contato`

10. **Given** any locale is active **When** the section copy is inspected **Then** every string flows through `t()` — keys `clientReferences.eyebrow`, `clientReferences.heading.text`, `clientReferences.heading.accent`, `clientReferences.subhead`, `clientReferences.items.0..2.{pill,pillVariant,body,agency,city}`, `clientReferences.cta` — present in `en/`, `pt-BR/`, `es/`

## Tasks / Subtasks

- [x] Task 0: i18n keys — kept `references.*` namespace (NOT `clientReferences.*` as the spec suggested) because `ClientReferences.allowlist.test.tsx` walks `data.references.items` — a rename would break R-B1. Added `references.headlineAccent` (split for accent span) and `pillVariant` per item across en/pt-BR/es. Heading copy rewritten per spec ("Trusted by real / agencies", "Confiança comprovada por / agências reais", "Confianza demostrada por / agencias reales")
- [x] Task 1: `src/components/sections/ClientReferences.tsx` rewritten — sober deep-bg section (`#0A0B22`), centered head with horizontal-rule eyebrow + heading + accent span + subtext, 3-column quotes grid (1/2/3 collapse at 640/960), quote cards with decorative Georgia serif `"` glyph in the corner, status pill + body + footer (monogram + agency name + location with pin SVG), ghost CTA centered linking to `#contato`. Section id changed `client-references` → `clientes` to match Story 6.2 navbar deep-link target
- [x] Task 2: SectionShell NOT extracted — Stories 6.7 and 6.8 will refactor in-place too. Extracting a generic `.sec/.sec-head/.sec-eyebrow` shell across three different visual patterns (deep references / team / forms split-layout) would force premature abstraction; each section has enough local variation (centered vs. left-aligned head, dark vs. mid-tone bg, etc.) that the shared surface is just a `<section>` + `<div class="wrap">` — not enough to factor out. Documented decision; future 6.7/6.8 follow the same in-place pattern
- [x] Task 3: `ClientReferences.allowlist.test.tsx` (R-B1) unchanged — passes verbatim. No agency name additions, no agency name renames
- [x] Task 4: A11y — Georgia serif `"` `aria-hidden`; location pin `aria-hidden`; pill is a `<span>` with the relationship text (carries meaning directly); ghost CTA is an `<a href="#contato">` (not `onClick`)
- [x] Task 5: `ClientReferences.test.tsx` rewritten — 7 tests (region anchor, eyebrow/heading/accent, 3 cards no-gradient, muted pill+italic for Pacific Sun, default for the other two, ghost CTA href, allowlist agency names rendered). Updated cross-cutting tests for the headline copy + section id rename: `Sections.i18n.test.tsx`, `Home.test.tsx`, `Home.story-1-8.e2e.test.tsx`, `Home.story-1-9.e2e.test.tsx`, `tests/e2e/mobile-ux.spec.ts` (Playwright)

## Dev Notes

- Chat history (line 510, dessaturated pass) explicitly removed the per-brand monogram gradients (AT blue / PS purple / NT green) — keep all three on neutral fill per Epic 6 sober palette
- The italic muted variant for "Pacific Sun Voyages" is a deliberate signal that this reference is operationally-available only, not a published testimonial — keep the italic styling
- `SectionShell` extraction is encouraged but not mandated; the dev step's discovery pass should commit to one path before scaffolding 6.7
- The R-B1 ClientReferences allowlist lock is non-negotiable — any new agency name proposal blocks the merge

## Technical Requirements

- **Languages/Frameworks:** TypeScript 5.x, React 18, Tailwind 3.x, i18next + react-i18next
- **State machine:** N/A
- **API contracts:** N/A (testimonials are static translation content)
- **Security:** Agency allowlist invariant (`ClientReferences.allowlist.test.tsx`) MUST stay green; do NOT mutate the locked agency name set
- **Performance:** 3 small cards + inline SVGs; no perf concerns

## Architecture Compliance

- Component naming: `ClientReferences.tsx` refactor in place; if `SectionShell` is extracted it lives at `src/components/layout/SectionShell.tsx`
- i18n keys: `clientReferences.{eyebrow,heading.text,heading.accent,subhead,items.0..2.{pill,pillVariant,body,agency,city},cta}` — verify 3-level depth (`items.0.pill` is 3 — OK)
- Anti-patterns: no per-brand monogram gradients (chat line 510 explicit removal)

## Library / Framework Requirements

- `<Trans>` for the heading's `<span class='accent'>agências reais</span>` slot
- No new icon libraries — inline location-pin SVG
- Reuse `solid-accent` and ghost button tokens from Story 6.1

## File Structure Requirements

| File | Change type | Notes |
|---|---|---|
| `src/components/sections/ClientReferences.tsx` | UPDATE | Replace markup with `.sec.sec-deep` + quotes grid + ghost CTA |
| `src/components/sections/ClientReferences.test.tsx` | UPDATE | New markup assertions |
| `src/components/sections/ClientReferences.allowlist.test.tsx` | UNCHANGED | R-B1 lock; must continue to pass |
| `src/components/layout/SectionShell.tsx` | NEW (if extracted) | Reusable `.sec` + `.sec-head` shell |
| `src/components/layout/SectionShell.test.tsx` | NEW (if extracted) | Shell renders eyebrow + heading + subhead + accent slot |
| `src/i18n/locales/{en,pt-BR,es}/translation.json` | UPDATE | Restructure `clientReferences.*` namespace; add `pillVariant`, `cta`, accent split |

## Testing Requirements

- `ClientReferences.test.tsx`: 3 quote cards, decorative quote-mark `aria-hidden`, status pills (default + muted), neutral monogram fill (no gradient classes), ghost CTA `href="#contato"`
- `ClientReferences.allowlist.test.tsx`: MUST stay green — agency names Atlas Travel Group / Pacific Sun Voyages / Northstar Travel Partners unchanged
- `Sections.i18n.test.tsx`: `clientReferences.*` key parity across three locales
- Playwright axe sweep at 320 / 768 / 1280px viewports — zero serious/critical

## Previous Story Intelligence

- **Story 1.9 (`security-client-references-sections`)** introduced the agency allowlist with the `R-B1` regression lock. NEVER add a new agency name in this story.
- **Story 6.1 (`design-tokens-sober-palette`)** provides `--ink`, `--line`, `--line-strong`, `--accent-soft`. Consume.
- The `SectionShell` extraction (if done here) is reused by 6.7 and 6.8 — commit to the path before scaffolding the later stories.

## Project Context Reference

- Handoff source: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` lines 278–379 (CSS), 730–802 (markup)
- Chat transcript: line 510 (sober palette pass — per-brand gradients removed)
- Vault: `vault/Planning/Architecture-Key.md` for R-B1 reference
- Epics source: `_bmad-output/planning-artifacts/epics.md` line 1522

## Story Completion Status

- Status: review
- Completion note: Implemented 2026-05-17. ClientReferences rebuilt to sober quote-card layout; R-B1 allowlist invariant preserved; #clientes anchor wired for navbar deep-link. 599/599 tests green, build clean.

## Outstanding Questions for Dev

1. ~~SectionShell extraction~~ — Resolved NO: each Epic 6 section has enough local variation that a shared shell would be premature abstraction. Documented in Task 2.
2. ~~EN/ES testimonial copy~~ — Resolved: existing Story 1.9 EN/ES copy preserved verbatim under the new card markup.

## Dev Agent Record

### Key Decisions

1. **Kept `references.*` i18n namespace.** R-B1 allowlist test (`data.references.items.agencyName`) would break if renamed to `clientReferences.*` as the spec suggested. Spec ambiguity documented in component header.
2. **Section id rename `client-references` → `clientes`.** Matches Story 6.2 navbar deep-link target. Five existing tests/specs updated to follow.
3. **No SectionShell extraction.** Each section's head structure varies enough (centered/left-aligned, dark/mid bg, with/without accent split) that factoring out doesn't pay.
4. **Neutral monograms (no per-brand gradients)** per chat-history line 510 sober-pass directive.

### File List

| File | Change | Note |
|---|---|---|
| `src/components/sections/ClientReferences.tsx` | UPDATE | Sober quote cards, ghost CTA, #clientes id |
| `src/components/sections/ClientReferences.test.tsx` | UPDATE | 7 fresh tests for new markup |
| `src/components/sections/ClientReferences.allowlist.test.tsx` | UNCHANGED | R-B1 invariant intact |
| `src/i18n/locales/{en,pt-BR,es}/translation.json` | UPDATE | `headlineAccent` + `pillVariant`; new heading copy |
| `src/components/sections/Sections.i18n.test.tsx` | UPDATE | Headline copy assertion follows new shape |
| `src/pages/Home.test.tsx` | UPDATE | `#client-references` → `#clientes` |
| `src/pages/Home.story-1-8.e2e.test.tsx` | UPDATE | `#client-references` → `#clientes` |
| `src/pages/Home.story-1-9.e2e.test.tsx` | UPDATE | New headline copy |
| `tests/e2e/mobile-ux.spec.ts` | UPDATE | `#client-references` → `#clientes` |
| `_bmad-output/implementation-artifacts/6-6-clientreferences-visual-refresh.md` | UPDATE | Status/Dev record |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | UPDATE | Story 6.6 → review |

### Change Log

| Date | Author | Summary |
|---|---|---|
| 2026-05-17 | Claude (Opus 4.7) | Story 6.6 — ClientReferences sober rebuild (deep-bg section, 3 quote cards w/ Pacific Sun italic muted variant, neutral monograms, ghost CTA → #contato). Section id renamed → `clientes`. R-B1 allowlist preserved. SectionShell extraction declined. |
