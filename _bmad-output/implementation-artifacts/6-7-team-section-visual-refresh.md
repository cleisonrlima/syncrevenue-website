# Story 6.7: Team Section Visual Refresh

Status: ready-for-dev

Epic: 6 — Visual Design Refresh (Claude Design Handoff)

Source design: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` (`.team`, `.tm`, `.tm-photo`, `.tm-status`, `.tm-body`, `.tm-name`, `.tm-role`, `.tm-bio`, `.tm-foot`, `.icon-btn.linkedin`, `.tm-foot-meta` — lines 381–447, 804–857).

Depends on: Story 6.1 (sober tokens), Story 6.6 (`SectionShell` if extracted).

## Story

As a visitor evaluating Sync Sirius's domain credibility,
I want the team section to surface each lead as a horizontal card with their photo, role eyebrow, bio paragraph, LinkedIn icon-button, and an experience meta-tag,
So that I can read who I'd be working with at a glance and click straight through to their LinkedIn — without the section feeling like a generic "Meet the Team" carousel.

## Acceptance Criteria

1. **Given** the team section renders **When** inspected **Then** a `<section class="sec" id="equipe">` exists with the standard `.sec` base (100px vertical padding, `background:var(--ink)`); the `.sec-head` block contains eyebrow "Nossa equipe", heading "Especialistas em <span class='accent'>distribuição aérea</span>", and a subhead about decades of GDS / BSP / back-office experience

2. **Given** the team grid renders **When** inspected **Then** a `.team` container is a `grid-template-columns:repeat(2,1fr); gap:24px; max-width:1080px; margin:0 auto`, collapsing to single column at < 760px

3. **Given** each team card renders **When** inspected **Then** each `<article class="tm">` is a 2-column grid (`grid-template-columns:200px 1fr`) with `border-radius:14px; overflow:hidden; background:rgba(255,255,255,.03); border:1px solid var(--line)`; hover lifts to `border-color:var(--line-strong); background:rgba(255,255,255,.045)`; below 560px viewport the grid collapses to single column (photo stacks on top of body)

4. **Given** each photo cell renders **When** inspected **Then** `.tm-photo` is `aspect-ratio:1/1; min-height:200px; background:#0a0b22; overflow:hidden`; the `<img>` inside uses `width:100%; height:100%; object-fit:cover; filter:saturate(.92)` and `loading="lazy"`; if the image fails to load, a `.tm-photo-fallback` covers the cell with `background:var(--accent)` and the member's initial at `font-size:60px; font-weight:700; color:#fff`

5. **Given** a status pill is overlaid on each photo **When** inspected **Then** `.tm-status` sits bottom-left at `left:12px; bottom:12px` with `padding:5px 10px 5px 9px; border-radius:6px; background:rgba(8,8,28,.75); border:1px solid rgba(255,255,255,.1); font-size:10.5px; font-weight:600; letter-spacing:.04em`; a 6×6 green dot (`#5BC98C`, NOT pulsing — sober palette per chat line 510) precedes the label "disponível"; the dot is rendered via `.tm-status::before`

6. **Given** the body cell renders **When** inspected **Then** `.tm-body` has `padding:26px 26px 22px; display:flex; flex-direction:column`; contains `.tm-name` (`font-size:20px; font-weight:700; letter-spacing:-.02em`), `.tm-role` (`font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:rgba(255,255,255,.55)` — TWO LINES via `<br/>`), `.tm-bio` (`font-size:13.5px; line-height:1.65; color:rgba(231,234,247,.7); flex:1`), and `.tm-foot`

7. **Given** the footer renders **When** inspected **Then** `.tm-foot` is `display:flex; align-items:center; gap:10px; padding-top:14px; border-top:1px solid var(--line); margin-top:auto`; contains a `.icon-btn.linkedin` (34×34, `border-radius:8px; border:1px solid var(--line-strong); color:rgba(255,255,255,.75)`) wrapping the LinkedIn glyph SVG; hover transitions background to `#0A66C2`, border to `#0A66C2`, color to `#fff`; followed by `.tm-foot-meta` (`font-size:11px; color:rgba(255,255,255,.4); margin-left:auto`) showing the experience tag

8. **Given** the LinkedIn link **When** clicked **Then** it opens the team member's LinkedIn URL in a new tab (`target="_blank" rel="noopener noreferrer"`) with an explicit `aria-label="Ver <Name> no LinkedIn"`

9. **Given** the existing team data (Story 1.8 / 3.6) **When** the refresh lands **Then** the existing webp photos (`maria-silva.webp`, `lucas-oliveira.webp`) and LinkedIn URLs are reused without modification; the existing `team.members` translation array structure is preserved (any field shape changes require a backwards-compatible migration path)

10. **Given** any locale is active **When** copy is inspected **Then** every string flows through `t()` — keys `team.eyebrow`, `team.heading.text`, `team.heading.accent`, `team.subhead`, `team.statusLabel`, `team.members.0..1.{name,role,bio,linkedinUrl,linkedinLabel,experience}` — present in `en/`, `pt-BR/`, `es/`

## Tasks / Subtasks

- [ ] Task 0: i18n keys (AC: 10)
  - [ ] Audit existing `team.members.*` shape; add missing keys (`linkedinLabel`, `experience`, `statusLabel`)
  - [ ] Three-locale parity snapshot

- [ ] Task 1: Refactor `src/components/sections/Team.tsx` (AC: 1–8)
  - [ ] Use `SectionShell` (from Story 6.6) for the `.sec` + `.sec-head` block
  - [ ] Replace existing card markup with the horizontal `.tm` layout
  - [ ] Map over `team.members` translation array; preserve fallback behavior from Story 1.8
  - [ ] Keep image-load error fallback (initial in `.tm-photo-fallback`) — gracefully degrade

- [ ] Task 2: LinkedIn icon button (AC: 7, 8)
  - [ ] Extract `<LinkedInIconButton href={url} label={ariaLabel} />` as a small subcomponent if reused elsewhere; otherwise inline
  - [ ] Use the exact LinkedIn glyph SVG from `Hero.html` line 830 (currentColor fill so hover swap works via CSS)
  - [ ] Tap target ≥ 34×34 — acceptable per WCAG 2.1 AA when interactive area is larger or visually padded; for stricter AAA, bump to 44×44 inline padding

- [ ] Task 3: Accessibility
  - [ ] Each card uses semantic `<article>` and `<h3>` for the name (heading hierarchy: section `<h2>` from `SectionShell` then card `<h3>`)
  - [ ] Status pill text "disponível" carries meaning — keep as visible label (not just dot)
  - [ ] Status dot is decorative (`::before` is not announced)
  - [ ] LinkedIn link `aria-label` is descriptive ("Ver Maria Silva no LinkedIn")

- [ ] Task 4: Tests
  - [ ] Update `Team.test.tsx` for new horizontal markup
  - [ ] Assert LinkedIn href + rel attributes + aria-label
  - [ ] Snapshot at 375px / 768px / 1280px to confirm responsive collapse
  - [ ] Image-load error fallback test (mock failed image) — initials render

## Dev Notes

- Per chat line 510 (sober palette pass), the pulsing animation on the status dot was explicitly removed — DO NOT re-introduce CSS keyframes
- Story 3.6 accepted fake-data names + solid-color webp stubs for Maria/Lucas pending stakeholder content swap — that swap is still pending as of 2026-05-17; this story uses whatever team content is current at dev time and does not re-open the content question
- If `Team.tsx` already extracts a `TeamMemberCard` subcomponent, refactor it instead of the parent
- The `<br/>` in `.tm-role` (line role on two lines) is part of the prototype; in i18n implementation, use `\n` in the translation string + CSS `white-space:pre-line` to avoid hardcoded markup, OR ship a `roleLine1` + `roleLine2` key pair (cleaner)

## Technical Requirements

- **Languages/Frameworks:** TypeScript 5.x, React 18, Tailwind 3.x, i18next + react-i18next
- **State machine:** N/A
- **API contracts:** N/A in Phase 5 — team data still flows through `team.members` translation array. (Note: Story 4.4 introduced DB-backed `/api/team` for admin CRUD; the public Team section may or may not consume it yet — confirm during discovery pass)
- **Security:** LinkedIn URLs are public; `rel="noopener noreferrer"` is mandatory on `target="_blank"` links
- **Performance:** Photos use `loading="lazy"` + explicit `width`/`height`; `saturate(.92)` filter is cheap; image-load error fallback ensures no broken-image icon

## Architecture Compliance

- Component naming: `Team.tsx` refactor in place; consider extracting `TeamMemberCard.tsx` if not already
- i18n keys: `team.{eyebrow,heading.{text,accent},subhead,statusLabel,members.0..1.{name,role,bio,linkedinUrl,linkedinLabel,experience}}` — `members.0.role` is 3-level (OK); `members.0.role.line1` would be 4 — use `roleLine1` / `roleLine2` flat OR `\n` + `white-space:pre-line`
- Reuse `SectionShell` from Story 6.6 (if extracted)
- Anti-patterns: NO pulsing keyframes on status dot (sober palette decision)

## Library / Framework Requirements

- Inline LinkedIn glyph SVG from `Hero.html` line 830 (currentColor fill for hover swap)
- Reuse `solid-accent` tokens; no new icon library required

## File Structure Requirements

| File | Change type | Notes |
|---|---|---|
| `src/components/sections/Team.tsx` | UPDATE | Use `SectionShell`; horizontal card grid 2-col → 1-col below 760px |
| `src/components/sections/Team.test.tsx` | UPDATE | New horizontal markup; LinkedIn href + rel + aria-label; image-load fallback |
| `src/components/sections/TeamMemberCard.tsx` | NEW (if extracted) | Photo + status pill + body + LinkedIn footer |
| `src/i18n/locales/{en,pt-BR,es}/translation.json` | UPDATE | Add `team.statusLabel`, `team.members.*.linkedinLabel`, `team.members.*.experience` |
| `public/team/maria-silva.webp` | UNCHANGED | Reuse existing asset |
| `public/team/lucas-oliveira.webp` | UNCHANGED | Reuse existing asset |

## Testing Requirements

- `Team.test.tsx`: 2 cards render horizontal at ≥ 760px, stack at < 560px; LinkedIn link has `target="_blank" rel="noopener noreferrer"` + descriptive `aria-label`; status pill text "disponível" present; image-load error fallback (mock failed image) renders initials with accent background
- `Sections.i18n.test.tsx`: new `team.*` keys parity across three locales
- Playwright axe at 375px / 768px / 1280px — zero serious/critical

## Previous Story Intelligence

- **Story 1.8 (`team-section`)** established `team.members` translation array shape + fallback rendering
- **Story 3.6 (`real-team-photos-bio-content`)** accepted fake-data webp stubs (Maria / Lucas) pending stakeholder content — this story uses whatever is current; do NOT re-open the content question
- **Story 4.4 (`team-member-management-create-edit`)** added DB-backed admin CRUD + public `/api/team` route. If `Team.tsx` already consumes the API, preserve that flow; otherwise stay translation-driven.
- **Story 6.6 (`clientreferences-visual-refresh`)** may have extracted `SectionShell` — reuse if present
- **Story 6.1 (`design-tokens-sober-palette`)** provides `--ink`, `--accent`, `--line`, `--line-strong`. Consume.

## Project Context Reference

- Handoff source: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` lines 381–447 (CSS), 804–857 (markup)
- Chat transcript: line 510 (sober pass — no pulsing dot)
- Vault: `vault/Planning/Architecture-Key.md` for naming + locale flow
- Epics source: `_bmad-output/planning-artifacts/epics.md` line 1524

## Story Completion Status

- Status: ready-for-dev
- Completion note: Scaffold upgraded 2026-05-17. Confirm during dev whether `Team.tsx` currently consumes `/api/team` (Story 4.4) or remains translation-only; preserve whichever flow is live.

## Outstanding Questions for Dev

1. Translation-array vs API-backed data source for the public Team section — confirm at discovery.
2. Two-line role: pick between `\n + white-space:pre-line` and `roleLine1`/`roleLine2` keys. Recommend keys for cleaner i18n.
