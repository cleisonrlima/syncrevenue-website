# Story 1.2: Design System Foundation

Status: done

## Story

As a visitor,
I want to experience a visually consistent brand identity across all interactions,
so that I recognize Sync Sirius as a credible, premium specialist from first contact.

## Acceptance Criteria

1. **Given** brand color tokens are configured, **when** `tailwind.config.ts` is inspected, **then** CSS variables are defined: `--color-electric-blue: #0075F0`, `--color-highlight: #00A0F0`, `--color-deep: #0055F0`, `--color-navy: #0D0D3A`, `--color-slate: #404070`, `--color-muted: #8080A0`, `--color-offwhite: #F4F6FA`; `bg-gradient-brand` applies `linear-gradient(135deg, #0055F0 0%, #0075F0 50%, #00A0F0 100%)`; dark section gradient class applies `linear-gradient(180deg, #0D0D3A 0%, #080820 100%)`.

2. **Given** GradientButton is rendered in default state, **when** a visitor views a primary CTA, **then** button shows brand gradient background with white text; hover brightens the gradient; active state scales to 0.98; disabled state is 50% opacity with no gradient and `cursor-not-allowed`; `type="button"` is explicit unless overridden; focus-visible shows white ring on dark backgrounds.

3. **Given** GradientButton variant props, **when** rendered with `lg`, `md`, `sm`, **then** each variant applies appropriate padding and font-size; `lg` is used for hero/section CTAs, `md` for form submit, `sm` for navbar.

4. **Given** SectionHeader is rendered, **when** provided eyebrow, heading, and optional subtext props, **then** eyebrow renders above h2; optional subtext renders below; `light` variant uses dark text, `dark` variant uses white text.

5. **Given** SectionSkeleton is used as a Suspense fallback, **when** a lazy section is loading, **then** SectionSkeleton renders a skeleton block with height set via `className` prop; no layout shift occurs when the real section replaces it.

6. **Given** typography is configured, **when** the app renders, **then** Plus Jakarta Sans loads with `font-display: swap`; all font sizes use `rem` units; H1 is 52px/800w on desktop, 32–36px on mobile via Tailwind responsive classes.

## Tasks / Subtasks

- [x] Task 1: Extend `tailwind.config.ts` with brand tokens and gradient utilities (AC: 1)
  - [x] Add brand color tokens to `extend.colors` referencing CSS variables (see Dev Notes)
  - [x] Add `extend.backgroundImage` entries for `gradient-brand` and `gradient-dark-section`
  - [x] Add `extend.fontFamily.sans` pointing to Plus Jakarta Sans
  - [x] Add `extend.fontWeight` entry `heavy: '800'` for H1 weight

- [x] Task 2: Configure brand CSS variables and font loading in `src/index.css` (AC: 1, 6)
  - [x] Add `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');` as first line before `@tailwind` directives
  - [x] Add all 7 brand CSS custom properties to `:root` block (see Dev Notes for exact values)
  - [x] Verify existing shadcn CSS variables remain intact — do NOT remove them

- [x] Task 3: Implement `GradientButton` component (AC: 2, 3)
  - [x] Create `src/components/ui/GradientButton.tsx`
  - [x] Extend `React.ButtonHTMLAttributes<HTMLButtonElement>`; prop `size?: 'lg' | 'md' | 'sm'` (default `'md'`)
  - [x] Apply `type="button"` as default (can be overridden via `...props`)
  - [x] Default: `bg-gradient-brand text-white font-semibold rounded-lg transition-all`
  - [x] Hover: `hover:brightness-110`
  - [x] Active: `active:scale-[0.98]`
  - [x] Disabled: `disabled:bg-none disabled:bg-brand-slate disabled:opacity-50 disabled:cursor-not-allowed`
  - [x] Focus: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`
  - [x] Size `lg`: `px-8 py-4 text-lg` — hero/section CTAs
  - [x] Size `md`: `px-6 py-3 text-base` — form submit
  - [x] Size `sm`: `px-4 py-2 text-sm` — navbar
  - [x] Use `cn()` from `@/lib/utils` for class merging

- [x] Task 4: Implement `SectionHeader` component (AC: 4)
  - [x] Create `src/components/ui/SectionHeader.tsx`
  - [x] Props: `eyebrow: string`, `heading: string`, `subtext?: string`, `variant?: 'light' | 'dark'` (default `'light'`), `className?: string`
  - [x] Eyebrow: `text-sm font-semibold uppercase tracking-widest mb-2`; light variant: `text-brand-electric-blue`; dark variant: `text-brand-highlight`
  - [x] Heading: `<h2>` with `text-3xl lg:text-4xl font-bold mb-4`; light: `text-brand-navy`; dark: `text-white`
  - [x] Subtext (optional): `text-lg max-w-2xl mx-auto`; light: `text-brand-slate`; dark: `text-white/80`
  - [x] Wrapper: `<div className={cn('text-center', className)}>`
  - [x] Use `cn()` from `@/lib/utils`

- [x] Task 5: Implement `SectionSkeleton` component (AC: 5)
  - [x] Update `src/components/sections/SectionSkeleton.tsx` from placeholder
  - [x] Props: `className?: string`
  - [x] Render: `<div className={cn('w-full animate-pulse rounded-md bg-muted', className)} />`
  - [x] No shadcn Skeleton import needed — Tailwind `animate-pulse` + `bg-muted` achieves the same effect
  - [x] Caller controls height via `className` (e.g., `<SectionSkeleton className="h-[600px]" />`)

- [x] Task 6: Verify build and type-check (AC: all)
  - [x] Run `npm run typecheck` — zero errors
  - [x] Run `npm run build` — no errors in `dist/client/` and `dist/server/`
  - [x] Verify in browser dev tools that Plus Jakarta Sans network request fires with 200
  - [x] Visually confirm gradient renders correctly by temporarily adding `<GradientButton>Test</GradientButton>` to `App.tsx`, checking browser, then removing

## Dev Notes

### CRITICAL: What Already Exists (Do Not Duplicate)

- `tailwind.config.ts` — exists with shadcn/ui CSS variable colors + accordion animations. **ADD to it, do not replace it.**
- `src/index.css` — exists with Tailwind directives + shadcn `:root` and `.dark` CSS variable blocks. **Add brand vars and font import; preserve all existing shadcn vars.**
- `src/lib/utils.ts` — has `cn()` (clsx + tailwind-merge). **Always import from `@/lib/utils`, never rewrite.**
- `src/components/sections/SectionSkeleton.tsx` — exists as placeholder (`export default function SectionSkeleton() { return <div /> }`). **Replace it.**
- `components.json` — shadcn config already set up. **Do NOT run `npx shadcn@latest init` again.**
- No shadcn components installed yet (`src/components/ui/` is empty). GradientButton and SectionHeader are **custom components**, not shadcn — create them directly without the CLI.

### `tailwind.config.ts` Changes (ADD to extend block)

```typescript
// Add inside theme.extend — alongside existing colors, borderRadius, keyframes, animation
colors: {
  // ... keep existing shadcn color tokens ...
  brand: {
    'electric-blue': 'var(--color-electric-blue)',
    highlight: 'var(--color-highlight)',
    deep: 'var(--color-deep)',
    navy: 'var(--color-navy)',
    slate: 'var(--color-slate)',
    muted: 'var(--color-muted)',
    offwhite: 'var(--color-offwhite)',
  },
},
backgroundImage: {
  'gradient-brand': 'linear-gradient(135deg, #0055F0 0%, #0075F0 50%, #00A0F0 100%)',
  'gradient-dark-section': 'linear-gradient(180deg, #0D0D3A 0%, #080820 100%)',
},
fontFamily: {
  sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
},
```

Note: hex values in `backgroundImage` are acceptable — `tailwind.config.ts` is the single source of truth for gradient definitions. Components use `bg-gradient-brand` class, never inline hex.

### `src/index.css` Changes

```css
/* Add as FIRST line — before @tailwind directives */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Brand color tokens — add INSIDE the existing :root block alongside shadcn vars */
    --color-electric-blue: #0075F0;
    --color-highlight: #00A0F0;
    --color-deep: #0055F0;
    --color-navy: #0D0D3A;
    --color-slate: #404070;
    --color-muted: #8080A0;
    --color-offwhite: #F4F6FA;

    /* ... keep all existing shadcn CSS vars (--background, --foreground, etc.) ... */
  }
}
```

`font-display: swap` is handled by the `&display=swap` parameter in the Google Fonts URL — no additional CSS needed.

### Typography Patterns (Document for Downstream Stories)

H1 responsive pattern (implemented in Story 1.5 Hero, documented here):
- Mobile: `text-[2rem] md:text-[2.25rem]` (32px → 36px)
- Desktop: `lg:text-[3.25rem]` (52px)
- Weight: `font-extrabold` (800)
- Combined: `text-[2rem] md:text-[2.25rem] lg:text-[3.25rem] font-extrabold`

All font sizes must use `rem` units — never `px` in component className. Use Tailwind's built-in scale or `text-[Xrem]` for custom sizes.

### GradientButton — Disabled State Detail

The disabled state must remove the gradient (background-image) and show a flat color. In Tailwind v3:
- `disabled:bg-none` → sets `background-image: none` (removes gradient)
- `disabled:bg-brand-slate` → sets `background-color` to the slate token

Both `bg-none` and `bg-brand-slate` apply simultaneously when disabled. The gradient (`backgroundImage`) wins over `backgroundColor` by default when both are set — that's why `bg-none` must explicitly clear it on disabled. Tailwind v3 supports `disabled:` variant for both `background-image` and `background-color` natively.

### GradientButton — type="button" Default

HTML buttons inside forms default to `type="submit"`. Since GradientButton is used as a CTA (not always in a form), default to `type="button"` in the component. The prop spread (`...props`) allows callers to override with `type="submit"` when needed for form submit buttons.

```typescript
<button type={props.type ?? 'button'} ...>
```

Or simply set `type="button"` and let `...props` override — but place `type="button"` BEFORE `{...props}` so spread wins:
```typescript
<button type="button" {...props} disabled={disabled} className={cn(...)}>
```

### Component Anti-Patterns to Avoid

- **No hardcoded hex values in component files** — use Tailwind tokens only (`text-brand-navy`, `bg-gradient-brand`, etc.)
- **No direct CSS in component files** — no `style={{}}` props with color values
- **No shadcn Button import** in GradientButton — it's a custom component built from a raw `<button>` element
- **No reinventing `cn()`** — always import from `@/lib/utils`
- **No Tailwind v4 features** — project is pinned to v3; no `@theme` directive, no `@utility`

### Verification Steps

After implementation, verify in browser:
1. `bg-gradient-brand` class renders the correct blue gradient
2. `GradientButton lg` renders large padding + gradient + correct hover/active states
3. `SectionHeader dark` variant shows white heading on dark bg
4. `SectionSkeleton className="h-[400px]"` renders a pulsing grey block at 400px height
5. Font in DevTools Network tab: `fonts.googleapis.com/...Plus+Jakarta+Sans...` → 200

### Architecture Constraints (Non-Negotiable)

- Tailwind v3 only — do not upgrade or change version
- shadcn CSS variable pattern preserved — existing `hsl(var(--*))` tokens must continue working
- Mobile-first CSS — base styles mobile, `md:` / `lg:` overrides upward
- `cn()` from `@/lib/utils` for all class merging
- `src/components/ui/` is the correct location for GradientButton and SectionHeader
- `src/components/sections/` is the correct location for SectionSkeleton

### Previous Story Learnings (1.1)

- `shadcn@latest init` CLI (v4.7+) changed its API — do NOT re-run it. `components.json` is already correct.
- `react-i18next@14` pinned for `i18next@23` compat — do not touch i18n deps in this story
- `@vitejs/plugin-react@4` pinned for Vite 5 compat — do not upgrade
- `concurrently` + `tsx` are in devDependencies — correct, do not move
- `tailwindcss-animate` is imported as ES module in `tailwind.config.ts` (`import tailwindcssAnimate from 'tailwindcss-animate'`) — preserve this pattern
- DB path resolved relative to `__dirname` — no impact on this story

### File List

- `tailwind.config.ts` (UPDATE — add brand colors, gradients, fontFamily)
- `src/index.css` (UPDATE — add font import and brand CSS variables)
- `src/components/ui/GradientButton.tsx` (NEW)
- `src/components/ui/SectionHeader.tsx` (NEW)
- `src/components/sections/SectionSkeleton.tsx` (UPDATE from placeholder)

### References

- Brand color tokens and gradients: [ux-design-specification.md — Color System](../_bmad-output/planning-artifacts/ux-design-specification.md#color-system)
- GradientButton spec: [ux-design-specification.md — Custom Components](../_bmad-output/planning-artifacts/ux-design-specification.md#custom-components)
- Typography: [ux-design-specification.md — Typography System](../_bmad-output/planning-artifacts/ux-design-specification.md#typography-system)
- Responsive strategy: [ux-design-specification.md — Responsive Strategy](../_bmad-output/planning-artifacts/ux-design-specification.md#responsive-strategy)
- SectionSkeleton usage: [architecture.md — Loading State Pattern](../_bmad-output/planning-artifacts/architecture.md#loading-state-pattern)
- Component strategy: [ux-design-specification.md — Component Implementation Strategy](../_bmad-output/planning-artifacts/ux-design-specification.md#component-implementation-strategy)
- Story AC source: [epics.md — Story 1.2](../_bmad-output/planning-artifacts/epics.md#story-12-design-system-foundation)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation proceeded without blockers.

### Completion Notes List

- Tailwind config extended with `brand.*` color tokens (CSS variable refs), `backgroundImage` for `gradient-brand` and `gradient-dark-section`, `fontFamily.sans` (Plus Jakarta Sans), `fontWeight.heavy: '800'`.
- `src/index.css` updated: Google Fonts `@import` added as first line; all 7 brand CSS custom properties added inside existing `:root` block; shadcn vars preserved intact.
- `GradientButton.tsx` created as raw `<button>` (no shadcn dependency); uses `disabled:` Tailwind variants (not JS conditional) per Dev Notes guidance; `type="button"` default with spread override.
- `SectionHeader.tsx` created with light/dark variant support; all text uses brand tokens, no hardcoded hex.
- `SectionSkeleton.tsx` replaced from placeholder — uses `animate-pulse bg-muted` with caller-controlled height via `className`.
- `npm run typecheck` — 0 errors. `npm run build` — clean. Dev server started, CSS served confirmed Plus Jakarta Sans import, gradient-brand, all disabled/hover/active/focus classes present in output.

### File List

- `tailwind.config.ts` (updated)
- `src/index.css` (updated)
- `src/components/ui/GradientButton.tsx` (new)
- `src/components/ui/SectionHeader.tsx` (new)
- `src/components/sections/SectionSkeleton.tsx` (updated)

### Review Findings

- [x] [Review][Decision] Disabled button WCAG contrast vs spec opacity-50 — resolved: spec as-is. WCAG exempts disabled controls. [src/components/ui/GradientButton.tsx:27]
- [x] [Review][Patch] H1 responsive typography configuration — AC 6 requires "H1 is 52px/800w on desktop, 32–36px on mobile." Add h1 fontSize extension to tailwind.config.ts and/or @layer base rule in index.css. [tailwind.config.ts, src/index.css]
- [x] [Review][Patch] Add `motion-safe:` prefix to `active:scale-[0.98]` — missing prefers-reduced-motion guard for vestibular accessibility. [src/components/ui/GradientButton.tsx:26]
- [x] [Review][Patch] Add ARIA loading state to SectionSkeleton — no `role="status"`, `aria-label="loading"`, or `aria-busy="true"` for screen reader users. [src/components/sections/SectionSkeleton.tsx:8-10]
- [x] [Review][Patch] Add `motion-safe:` prefix to `animate-pulse` — missing prefers-reduced-motion guard for vestibular accessibility. [src/components/sections/SectionSkeleton.tsx:9]
- [x] [Review][Defer] Render-blocking `@import` for web font — `<link rel="preconnect">` + `<link>` in HTML `<head>` is best practice. [src/index.css:1]
- [x] [Review][Defer] `fontWeight.heavy: '800'` duplicates Tailwind `font-extrabold` — adds config bloat. [tailwind.config.ts:89-91]
- [x] [Review][Defer] `max-w-2xl` on subtext `<p>` may be unreachable — parent div has no width constraint. [src/components/ui/SectionHeader.tsx:39]
- [x] [Review][Defer] Heading level hardcoded as `<h2>` — no polymorphic `as` prop for heading hierarchy. [src/components/ui/SectionHeader.tsx:30]
- [x] [Review][Defer] `bg-muted` nearly invisible on light backgrounds — shadcn `210 40% 96.1%` vs white background. [src/components/sections/SectionSkeleton.tsx:9]
- [x] [Review][Defer] Focus-visible white ring may be invisible on non-gradient backgrounds — ring blends on light surrounds. [src/components/ui/GradientButton.tsx:28]

### Re-Review Findings (2026-05-14)

- [x] [Review][Patch] h1 base rule missing `leading-*` — `text-[3.25rem]` (52px) at browser default line-height (~1.2) produces tight ascenders/descenders on multi-line headings. Add `leading-tight` or `leading-[1.1]`. [src/index.css:69-71]
- [x] [Review][Patch] SectionSkeleton static `aria-label="Loading"` across all instances — screen reader navigating multiple skeletons gets no context. Add optional `label` prop for customization. [src/components/sections/SectionSkeleton.tsx:11]
- [x] [Review][Defer] Google Fonts URL loads 6 weight-lines (400,500,600,700,800,400i) — 500 and 400i unused; subsetting would save bandwidth. [src/index.css:1]
- [x] [Review][Defer] SectionSkeleton no visual loading indicator when `motion-safe:` suppresses animation — reduced-motion users see static gray rectangle. [src/components/sections/SectionSkeleton.tsx:13]
- [x] [Review][Defer] GradientButton has no loading/busy state for async actions (no spinner, no disabled-while-loading logic). [src/components/ui/GradientButton.tsx:19-36]

### Change Log

- 2026-05-14: Implemented Story 1.2 Design System Foundation — brand tokens, gradient utilities, GradientButton, SectionHeader, SectionSkeleton.
- 2026-05-14: Re-review — all ACs pass (Acceptance Auditor: zero violations). 4 prior patches implemented.
