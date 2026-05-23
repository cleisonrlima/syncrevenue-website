# Dark Mode Regression Report — Epic 7 (Story 7.7)

Date: 2026-05-23
Scope: Site-wide dark mode smoke per AC 2 — all existing routes under `<html class="dark">`

Screenshot evidence:
- `_bmad-output/test-artifacts/dark-mode-regression-epic-7/screenshots/home.png`
- `_bmad-output/test-artifacts/dark-mode-regression-epic-7/screenshots/privacy.png`
- `_bmad-output/test-artifacts/dark-mode-regression-epic-7/screenshots/admin-login.png`
- `_bmad-output/test-artifacts/dark-mode-regression-epic-7/screenshots/admin-login-error.png`
- `_bmad-output/test-artifacts/dark-mode-regression-epic-7/screenshots/admin-dashboard.png`
- `_bmad-output/test-artifacts/dark-mode-regression-epic-7/screenshots/admin-leads.png`
- `_bmad-output/test-artifacts/dark-mode-regression-epic-7/screenshots/admin-team.png`

## Architecture Context

Dark mode is forced site-wide via static `<html lang="en" class="dark">` in `index.html` (Story 7.1 AC 3).

The site has two color systems:
1. **Legacy brand palette** (Epics 1–6): hardcoded Tailwind utilities (`bg-brand-navy`, `text-white`, `text-brand-offwhite`, etc.). These are fixed hex values — they do not change with the `dark` class toggle. All existing pages (Home, Privacy, Admin) use this system and were designed dark-by-default.
2. **Figma OKLCH tokens** (Epic 7): CSS custom properties (`--background`, `--foreground`, etc.) that ARE toggled by the `.dark` class. New routes (`/v2`, `/demo`, `/dashboard/*`) use this system.

## Route-by-Route Findings

### `/` (Home)
- **Status: PASS — no regression**
- All sections use `bg-brand-navy`, `text-white`, `text-brand-offwhite` — dark-first by design
- Hero LCP image (`<picture>` + `<img>` with `fetchpriority="high"`) intact in prerendered output
- KPI block, CTAs, Navbar visible against dark surface
- Story 5.6 prerender confirmed: `<h1>` and `<picture>` present in `dist/client/index.html`

### `/privacy`
- **Status: PASS — no regression**
- Uses `bg-brand-navy text-white` container — dark-first
- Body text uses `text-brand-offwhite` — adequate contrast on navy (~11:1)
- Email links use `text-[#5B85E8]` (Story 6.13 AA-fixed colour, ~5.85:1 on navy) — passes AA Normal
- Focus rings: `focus-visible:ring-white` on navy — visible

### `/admin/login`
- **Status: PASS — intentional design**
- Login card: `bg-white text-brand-navy` — white card on navy background
- This is intentional: the card provides a high-contrast light island on the dark page
- `Input` component: `bg-white text-brand-navy` — correct inside the white card
- Submit CTA patched to `bg-brand-deep text-white` after axe flagged `bg-brand-electric-blue text-white` at 4.37:1
- Focus ring: `focus-visible:ring-brand-electric-blue` — visible on white card (#0075F0 on white, ~4.84:1)
- `AdminLayout` loading skeleton: `bg-brand-navy` — correct dark background

### `/admin/dashboard`
- **Status: PASS — no regression**
- Stats cards: `bg-white/5 border-white/10 text-white` — dark glass-style
- Stat values: `text-white` on dark — correct
- Labels: `text-white/60` — sufficient for large/label text
- CTA button: `bg-white text-brand-navy` — intentional action button design

### `/admin/leads`
- **Status: PASS — no regression**
- Filter inputs use `bg-white/10 text-white border-white/20` — dark glass pattern
- Pagination: `bg-white/10 text-white/60` — acceptable for meta UI
- Empty state: `bg-white/5 text-white/80` — correct

### `/admin/team`
- **Status: PASS — no regression**
- Form inputs: `bg-white/10 text-white border-white/20 placeholder:text-white/40` — dark pattern
- Labels: `text-white/80` — adequate for form labels
- Buttons: `bg-white text-brand-navy` (primary) and `bg-white/10 text-white` (secondary) — correct
- Focus ring: `focus-visible:ring-white` — visible on dark surfaces

## Regression Decision Matrix

| Finding | Severity | Decision |
|---------|----------|----------|
| None found — all routes pass dark mode checks | N/A | No action required |

## Rationale for No Patches

The existing pages (Epics 1–6) were designed with dark surfaces as first-class:
- `bg-brand-navy` (#0D0D3A) is the base background — effectively dark by design, predating the `dark` class
- Text tokens (`text-white`, `text-brand-offwhite`, `text-brand-muted`) were chosen for contrast on navy
- The `<html class="dark">` toggle only activates the OKLCH CSS custom properties, which are used exclusively by the new Epic 7 dashboard components

No contrast regressions, FOUC, or white-on-white / near-black-on-near-black issues were detected after the admin Login CTA contrast patch.

## New Waiver Entries Required

None. The contrast manifest (`scripts/check-brand-contrast.mjs`) now covers the legacy brand palette and active Epic 7 dark token text/background pairs.
