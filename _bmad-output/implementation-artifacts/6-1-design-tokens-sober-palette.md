# Story 6.1: Design Tokens — Sober Palette

Status: done

Epic: 6 — Visual Design Refresh (Claude Design Handoff)

Source design: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` (`:root` block, lines 11–23; `.btn` / `.btn-lg` rules, lines 42–49 / 117–119).

## Story

As a designer maintaining brand consistency across the public site,
I want the design tokens to anchor on a single sober accent color instead of the previous gradient-heavy palette,
So that the site reads as serious B2B (Linear/Stripe register) rather than techy-futuristic, while keeping the existing functional surfaces stable.

## Acceptance Criteria

1. **Given** `tailwind.config.ts` and `src/index.css` are inspected **When** the new tokens land **Then** the following CSS variables exist with these exact values in `src/index.css` `:root` — `--navy:#0D0D3A`, `--ink:#0A0B2E`, `--deep-bg:#080820`, `--accent:#3D6FE0`, `--accent-soft:#5B85E8`, `--accent-dim:rgba(61,111,224,.12)`, `--line:rgba(255,255,255,.08)`, `--line-strong:rgba(255,255,255,.14)`, `--slate-token:#7A8099`, `--muted-token:#5C6377`, `--offwhite:#F4F6FA` — AND `tailwind.config.ts` exposes matching aliases under `theme.extend.colors` (see Dev Notes for naming reconciliation: existing `--color-deep` already binds to `#0055F0` so the new dark background uses `--deep-bg`)

2. **Given** the existing `GradientButton` component is preserved unchanged **When** a `solid-accent` variant is added by extending `src/components/ui/Button.tsx` **Then** the variant renders with background `var(--accent)`, hover `var(--accent-soft)` + `translateY(-1px)`, white text, `border-radius:10px` (size `md`) or `14px` (size `lg`), and explicitly NO `bg-gradient-*`, NO `box-shadow` beyond shadcn defaults, NO glow — matching `.btn` / `.btn-lg` (`Hero.html` lines 42–49, 117–119)

3. **Given** `src/lib/brand-tokens.contrast.test.ts` and `src/lib/brand-tokens.contrast.manifest.ts` are updated **When** Vitest runs **Then** assertions cover (a) `#3D6FE0` on `#0D0D3A` contrast ratio is recorded under a NEW waiver `R-A3` documenting it passes AA Large (≥ 3:1) but FAILS AA Normal (≈ 3.97:1) so accent text on navy is reserved for large/decorative usage; (b) `#FFFFFF` on `#0A0B2E` (ink) ≥ 7:1 (AAA Normal); (c) the existing `R-A2` waiver remains intact and is annotated `deprecated-for-new-usage`

4. **Given** `vault/Planning/Architecture-Key.md` is inspected **When** the divergence is recorded **Then** a section titled "Sober Palette Refresh (Epic 6 — 2026-05-17)" documents (a) deliberate departure from UX-DR2 (Electric Blue primary) and UX-DR3 (brand gradient on prominent elements); (b) references handoff source `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html`; (c) states `GradientButton` + `bg-gradient-brand` remain available for legacy and admin surfaces; (d) adds the new `R-A3` waiver entry under "WCAG Contrast Exceptions"

5. **Given** existing public-site components consume the previous tokens **When** the new tokens land **Then** no component visually breaks: old `brand-electric-blue`, `brand-deep` (`#0055F0`), `brand-navy`, `brand-offwhite`, `bg-gradient-brand`, `bg-gradient-dark-section` continue to resolve; `npm test` is fully green; `npm run build` finishes without token-resolution errors; new tokens are additive, removal of legacy tokens is scoped to per-section stories 6.2–6.8

## Tasks / Subtasks

- [x] **Task 1: Add new CSS variables + Tailwind aliases (AC: 1)**
  - [x] Append new `:root` variables to `src/index.css` (placed AFTER the shadcn block so `--accent` wins the cascade — see Dev Agent Record)
  - [x] Map each new variable in `tailwind.config.ts` `theme.extend.colors` using suffix `-token` where name would clash; the sober-accent fill is exposed as `accent-solid` (not `accent`) to avoid clobbering shadcn's `accent: { DEFAULT, foreground }` Tailwind key
  - [x] `npm run typecheck` clean

- [x] **Task 2: Add `solid-accent` button variant (AC: 2)**
  - [x] Extended `src/components/ui/Button.tsx` with simple `variant`/`size` switch via `cn(...)` (no `cva` — `class-variance-authority` not present in `package.json`; fallback rule from spec applied)
  - [x] Variants: default (legacy preserved) + `solid-accent`
  - [x] Sizes: `sm` / `md` / `lg` with arbitrary-value Tailwind classes for non-stock paddings/radii
  - [x] States: default `bg-[var(--accent)] text-white`, hover `bg-[var(--accent-soft)]` + `motion-safe:hover:-translate-y-px`, disabled neutralizes hover transform + hover background, focus-visible ring matches spec
  - [x] Co-located test `src/components/ui/Button.test.tsx` — variant × size matrix, no `bg-gradient-*`, no `shadow-*` on `solid-accent`, disabled has no transform, focus-visible ring tokens — 9 tests, all green

- [x] **Task 3: Extend contrast test + manifest (AC: 3)**
  - [x] Added `BRAND_TOKENS.accent` and `BRAND_TOKENS.ink` to `src/lib/brand-tokens.contrast.test.ts`
  - [x] New `it('accent on navy carries R-A3 waiver — AA Large only')` — asserts `≥ 3.0` AND `< 4.5`, `toBeCloseTo(3.97, 1)` (measured 4.00:1, within tolerance)
  - [x] New `it('white on ink passes AAA normal text (≥ 7:1)')` — measured 19.09:1
  - [x] Manifest regenerated via `scripts/check-brand-contrast.mjs` — script extended (`TOKENS`, `SURFACES`, `WAIVERS`) to include `accent` + `ink`. Manifest grew 21 → 36 entries, all `accent|*` waivered `R-A3`. Manifest test (`covers every foreground token...exactly once`) updated to include `accent`/`ink` foregrounds and `ink` surface
  - [x] R-A2 inline comment block updated with `R-A2 — deprecated for new dark-section usage (see R-A3, Epic 6)`
  - [x] New manifest-level assertion `accent on navy carries the R-A3 waiver (Epic 6 sober palette)`

- [x] **Task 4: Architecture-Key vault update (AC: 4)**
  - [x] Appended section "## Sober Palette Refresh (Epic 6 — 2026-05-17)" to `vault/Planning/Architecture-Key.md`
  - [x] Documented divergence from UX-DR2 / UX-DR3, handoff source path, `GradientButton` / `bg-gradient-brand` survival rule, full token table, shadcn `--accent` collision rationale, `solid-accent` Button summary, added test coverage list
  - [x] Added `R-A3` block under "## WCAG Contrast Exceptions" (mirrors R-A2 / R-M1 / R-NT1 format); also extended R-NT1 narrative to mention new `ink` surface

- [x] **Task 5: Regression sweep (AC: 5)**
  - [x] `npm run test:run` — 75 files / 572 tests passing (ErrorBoundary deliberately-thrown errors are expected pre-existing noise)
  - [x] `npm run build` — 539 modules transformed, no token resolution errors, no Tailwind warnings; CSS bundle 27.03 kB (was ~26.x kB pre-story — additive growth only)
  - [x] `npm run check:contrast` — 36 manifest entries, 17 AA-normal passes, 24 waivered, 0 unwaivered failures
  - [ ] Manual `npm run dev` smoke deferred — no consumers of the new tokens land in this story (additive only). Visual smoke happens naturally inside stories 6.2–6.8 as each section adopts the new tokens.

### Review Findings

- [x] [Review][Patch] Restore native Button `type` behavior [src/components/ui/Button.tsx:32] — removed the default `type="button"` so the shared Button preserves native form semantics unless a caller passes `type`; explicit non-submit CTA buttons now pass `type="button"`.
- [x] [Review][Patch] Add raw Tailwind alias for `--navy` [tailwind.config.ts:35] — added top-level `navy: var(--navy)` so every new sober-palette root variable has a matching Tailwind alias.

## Dev Notes

### Spec-vs-code reconciliations (resolved at create-time)

1. **`src/lib/brand-tokens.ts` does NOT exist in the repo.** The handoff's "design tokens" map onto two real files:
   - `src/index.css` — CSS custom properties under `:root` (currently uses `--color-*` prefix)
   - `tailwind.config.ts` — `theme.extend.colors.brand` aliases that consume the CSS vars
   AC1 references `src/index.css` rather than the non-existent `brand-tokens.ts`. If a future story needs a single TS module of tokens, create it in that story — not here.

2. **Token-name clash on `--deep`.** Existing `src/index.css` has `--color-deep:#0055F0` (legacy brand-deep blue). The handoff uses `--deep:#080820` for a near-black bg color. **Resolution:** new variable is named `--deep-bg` to avoid silently shadowing legacy `--color-deep`. Per-section stories 6.2–6.8 may rename this later when legacy tokens retire.

3. **Token-name clashes on `--slate` / `--muted` / `--offwhite`.** Existing `--color-slate:#404070`, `--color-muted:#8080A0`, `--color-offwhite:#F4F6FA`. New handoff values for slate/muted differ (`#7A8099` / `#5C6377`); offwhite is identical. **Resolution:** new vars use `-token` suffix in `:root` and Tailwind alias keys to keep both surfaces live. Track de-duplication in 6.2–6.8 retirement stories.

4. **Contrast math correction (AC3).** Computed ratio of `#3D6FE0` on `#0D0D3A` ≈ **3.97:1** (verify with `contrastRatio` helper in `.contrast.test.ts`). That:
   - PASSES WCAG AA Large text (≥ 3:1) ✅
   - FAILS WCAG AA Normal text (≥ 4.5:1) ❌
   - Is NOT 7:1 AAA either way
   The original scaffold's "≥ 4.5:1 for AA large text" wording was internally contradictory (4.5 = AA Normal / AAA Large, not AA Large). Rewritten AC3 records the real measured value under a new `R-A3` waiver — same pattern as the existing R-A2 / R-M1 family.

### Codebase intelligence

- **Tailwind structure** (`tailwind.config.ts`):
  - `theme.extend.colors.brand.*` maps named aliases to `var(--color-*)` CSS vars (see lines 19–28)
  - Top-level shadcn aliases use `hsl(var(--<name>))` — DO NOT mix that pattern with the new tokens; new tokens are raw hex / rgba, exposed as `var(--<name>)` only (no `hsl()` wrapper)
  - Adding `'gradient-brand'` and `'gradient-dark-section'` under `backgroundImage` (lines 87–90) — leave both intact
- **`src/components/ui/Button.tsx`** is a bare `forwardRef` wrapper today (no variants, no `cva`). Extending it is cheaper than introducing a new file.
- **`src/components/ui/GradientButton.tsx`** uses `bg-gradient-brand` + `hover:brightness-110` — **do not touch** in this story.
- **Contrast manifest auto-generation:** `scripts/check-brand-contrast.mjs` regenerates `brand-tokens.contrast.manifest.ts` (see file header). Check if the script enumerates the audit set from a constant list — if so, extend that list to include `accent`/`ink`; if it greps `--color-*` vars, the new `--accent` etc. may need either the `--color-` prefix or a script update. Prefer to mirror existing convention (rename to `--color-accent`, `--color-ink`, etc.) **only if the script depends on the prefix** — otherwise keep flat names to match handoff source. Decide in Task 3.

### Files this story touches (UPDATE only — no NEW files unless noted)

| File | Change type | Reason |
|---|---|---|
| `src/index.css` | UPDATE | Add new `:root` vars |
| `tailwind.config.ts` | UPDATE | Add Tailwind aliases |
| `src/components/ui/Button.tsx` | UPDATE | Add `solid-accent` variant + sizes |
| `src/components/ui/Button.test.tsx` | NEW | Co-located test for variants |
| `src/lib/brand-tokens.contrast.test.ts` | UPDATE | New assertions for accent / ink / R-A3 |
| `src/lib/brand-tokens.contrast.manifest.ts` | UPDATE (or via script) | Add R-A3 entries |
| `vault/Planning/Architecture-Key.md` | UPDATE | Document divergence + R-A3 |

### Behaviors that must NOT regress

- `GradientButton` API + visual output unchanged
- `bg-gradient-brand`, `bg-gradient-dark-section` continue to resolve and render
- `text-brand-electric-blue`, `text-brand-deep`, `text-brand-navy`, `text-brand-slate`, `text-brand-muted`, `text-brand-offwhite` all keep current hex resolutions
- `BRAND_CONTRAST_MANIFEST` `it('every entry without a waiver passes WCAG AA normal text', …)` stays green — new R-A3 entry MUST include a waiver field
- `Sections.i18n.test.tsx` and all admin tests stay green

## Technical Requirements

- **Languages/Frameworks:** TypeScript 5.x, React 18, Tailwind 3.x, Vite 5.x
- **Test framework:** Vitest + `@testing-library/react` (existing)
- **State machine:** N/A (no form / async work in this story)
- **API contracts:** N/A
- **Security:** N/A (visual-only)
- **Performance:** No new runtime dependencies. Tailwind JIT picks up new aliases automatically — verify build size delta is negligible

## Architecture Compliance

- **Naming Rules (`vault/Planning/Architecture-Key.md`):** React components `PascalCase`; co-located tests; no `__tests__/` dir
- **`i18n` keys:** N/A — no copy lands in this story (copy comes in 6.2–6.8)
- **Form State Machine:** N/A
- **Anti-Patterns to avoid:** No camelCase Tailwind keys; no inline color hexes in components — use the new aliases
- **WCAG:** R-A2 / R-M1 / R-NT1 patterns must be respected when adding R-A3. Follow same waiver shape (`id` + `reason`)

## Library / Framework Requirements

- Use existing `class-variance-authority` if pulling in `cva` for Button variants — already a transitive shadcn dep. If not present, prefer a simple `variant`/`size` switch via `cn(...)` to avoid adding a dep for a single component.
- Do **not** add `clsx`, `tailwind-variants`, `cva-react`, or any new color library. The repo already standardizes on `cn` from `@/lib/utils`.
- Vitest version pinned in `package.json` — no upgrades needed.

## File Structure Requirements

- Co-locate `Button.test.tsx` alongside `Button.tsx` under `src/components/ui/`
- Do NOT introduce `src/styles/` — the project keeps a single `src/index.css` entry
- Do NOT introduce `src/lib/brand-tokens.ts` — see Dev Notes reconciliation #1

## Testing Requirements

- Every new variant × size combination on `Button` has a render assertion
- Disabled state asserts no `translate` / `scale` classes
- Contrast test:
  - `it('accent on navy carries R-A3 waiver — AA Large only')` — uses existing `contrastRatio` helper
  - `it('white on ink passes AAA normal text (≥ 7:1)')`
- Manifest test must remain green (waiver-coverage assertion).
- `npm run check:contrast` must continue to produce a manifest identical to the committed file.

## Previous Story Intelligence

- **Story 3.7 (`epic-1-review-polish-font-loading-ui-primitives`)** introduced `class-variance-authority` patterns and the `cn` helper convention — match those conventions when extending `Button`.
- **Story 3.9 (`architecture-token-hygiene-docs`)** locked the WCAG waiver structure (`R-A2`, `R-M1`, `R-NT1`). Mirror that exact shape for `R-A3` (id + reason on the waiver object, manifest entry shape).
- **Story 3.10 (`dx-discipline-defaultvalue-lint-sandbox-convention`)** asserted lint-clean default-value patterns. Keep `Button` variant default to `default` (current behavior) so existing call sites don't change.
- **Epic 1 retrospective** (`epic-1-retro-2026-05-15.md`) documents brand-token conventions — read before touching `tailwind.config.ts`.

## Git Intelligence Summary

Recent token-touching commits (last 5):
- `b944318` feat(story-4.4): admin team CRUD — touched admin layout only, no token changes
- `9baf111` feat(story-4.3): lead status — admin only
- `4d3b24b` docs(jira-config): Epic 4 mapping
- Prior Epic 3 sweeps established the contrast waiver pattern (commits referenced in `_bmad-output/implementation-artifacts/3-9-architecture-token-hygiene-docs.md`)

No conflicting in-flight branches detected — master is the working branch.

## Project Context Reference

- Handoff bundle: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/`
- Primary canonical design: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` lines 11–23 (tokens), 42–49 (.btn), 117–119 (.btn-lg)
- Vault entry points: `vault/Planning/Architecture-Key.md` (waivers, naming rules), `vault/Planning/Stack.md` (tooling)
- Epics source: `_bmad-output/planning-artifacts/epics.md` lines 1499–1528 (Epic 6 overview), lines 205+ (Epic 6 detailed)

## Story Completion Status

- Status: done
- Completion note: Story file rewritten 2026-05-17 with full developer context, spec-vs-code reconciliations resolved at create-time, contrast math validated, R-A3 waiver introduced. Per-section follow-up retirement of legacy tokens deferred to stories 6.2–6.8.

## Outstanding Questions for Dev

1. ~~Confirm `scripts/check-brand-contrast.mjs` audit set is extensible~~ — Resolved: script `TOKENS` / `SURFACES` / `WAIVERS` are plain top-of-file constants; extended in-place rather than touching the manifest by hand. Audit set now covers `accent` + `ink` and produces 36 entries.
2. ~~`class-variance-authority` already-resolved-or-not~~ — Resolved: `npm ls class-variance-authority` reports `(empty)`. Took the spec fallback (simple `variant`/`size` switch via `cn(...)`) and avoided adding a dep for a single component.

## Dev Agent Record

### Debug Log

- `npm run typecheck` — clean after each touch
- `npx vitest run src/components/ui/Button.test.tsx` — 9/9 green
- `npx vitest run src/lib/brand-tokens.contrast.test.ts` — 13/13 green
- `npm run test:run` — 572/572 green
- `npm run build` — clean
- `npm run check:contrast` — 36 entries, 0 unwaivered failures

### Implementation Plan (decisions taken)

1. **Token placement in `src/index.css`** — the new `--accent` collides with shadcn's `--accent: 210 40% 96.1%`. Same `:root`, last declaration wins. Placed the new sober-palette block AFTER the shadcn block so `var(--accent)` resolves to `#3D6FE0` for our consumers. shadcn's `bg-accent` Tailwind utility (which expects HSL component values) consequently resolves to `hsl(#3D6FE0)` (invalid CSS) — but `grep` confirms zero consumers in `src/` today, so no current regression. Documented as deliberate exception in `vault/Planning/Architecture-Key.md` → Sober Palette Refresh.
2. **Tailwind alias key for the sober accent** — used `accent-solid` (rather than flat `accent`) to avoid clobbering shadcn's `accent: { DEFAULT, foreground }` Tailwind theme key. Component code that wants the raw value uses `bg-[var(--accent)]` directly (see `Button.tsx` `solid-accent` variant). Other unique new tokens kept flat names per spec (`ink`, `line`, `line-strong`, `accent-soft`, `accent-dim`, `deep-bg`). Clash tokens used `-token` suffix (`slate-token`, `muted-token`, `offwhite-token`).
3. **Button variant strategy** — `class-variance-authority` is NOT in `package.json` (`npm ls` returned empty), so applied the spec fallback: simple discriminated switch via `cn(...)`. Kept the `default` variant byte-identical to the prior `Button` so all existing call sites (admin Login, Team, Leads) render unchanged. Added a defensive default of `type="button"` — verified all five existing call sites already pass `type` explicitly, so no behavior change.
4. **Sober-accent button sizes** — `Hero.html` spec values are non-stock (`11px`/`15px` padding-y, `26px` padding-x, `10px`/`14px` radii). Used arbitrary-value Tailwind classes (`py-[11px]`, `px-[26px]`, `rounded-[10px]`, etc.) rather than extending the Tailwind theme — keeps the surface local to this one component.
5. **Hover lift gated by `motion-safe:`** — followed the canonical-pattern from Architecture-Key (`motion-safe:` wrapping for all animated classes). Disabled state additionally pins `disabled:hover:translate-y-0` + `disabled:hover:bg-[var(--accent)]` so a disabled button never lifts or darkens.
6. **Contrast script extension** — rather than hand-edit the auto-generated manifest, extended the TOKENS / SURFACES / WAIVERS constants at the top of `scripts/check-brand-contrast.mjs` and re-ran. Manifest grew 21 → 36 (added `ink` surface plus `accent` and `ink` foregrounds). All `accent|*` carry the new `R-A3` waiver; surface-on-surface ink/navy carries `R-NT1`; legacy foregrounds on `ink` carry `R-NT1` (never paired in production).
7. **R-A3 waiver scope** — applied to `accent` on every surface, even `accent|white` which measured 4.62:1 (passes AA Normal). Reason: the spec reserves the sober accent for large/decorative usage by intent; default-waivering all four pairs keeps designers from drifting toward body-text usage. A future Epic 6 light-surface contrast pass can relax it.
8. **Default-variant byte equivalence** — kept the legacy `Button` default class string byte-identical so the lone existing `Button` consumer pattern (admin Login button with full className override) keeps rendering identically. No visual delta on any existing surface.

### Completion Notes

- Story is purely additive — no legacy tokens removed, no existing component class strings rewritten. Visual regression risk is bounded to the shadcn `--accent` collision (no consumers).
- The new `solid-accent` Button variant has zero consumers in `src/` yet — first consumer lands in story 6.3 (Hero CTA refresh).
- `vault/Code/Index.md` and `vault/00-Home.md` updates deferred to the per-section stories that actually introduce new files. This story only touched existing modules (no new module to map).

### File List

| File | Change | Note |
|---|---|---|
| `src/index.css` | UPDATE | New sober-palette `:root` block placed after shadcn block |
| `tailwind.config.ts` | UPDATE | Added 10 sober-palette aliases under `theme.extend.colors` |
| `src/components/ui/Button.tsx` | UPDATE | Added `variant` + `size` props; `solid-accent` + sizes; default kept byte-identical |
| `src/components/ui/Button.test.tsx` | NEW | 10 tests — variant × size matrix, disabled, focus-visible, no-gradient guard, native type preservation |
| `src/lib/brand-tokens.contrast.test.ts` | UPDATE | Added `accent` + `ink` tokens, R-A3 test, white-on-ink AAA test, R-A2 deprecation note, manifest pair-coverage extension |
| `src/lib/brand-tokens.contrast.manifest.ts` | UPDATE (script) | Regenerated — 21 → 36 entries, 0 unwaivered failures |
| `scripts/check-brand-contrast.mjs` | UPDATE | Extended `TOKENS` (+`accent`, +`ink`), `SURFACES` (+`ink`), `WAIVERS` (+R-A3 family, +R-NT1 entries for new pairs) |
| `vault/Planning/Architecture-Key.md` | UPDATE | New "Sober Palette Refresh" section + R-A3 block under WCAG Exceptions |
| `_bmad-output/implementation-artifacts/6-1-design-tokens-sober-palette.md` | UPDATE | Task checkboxes, Dev Agent Record, File List, Change Log, Status |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | UPDATE | Story 6.1 → `done` |

### Change Log

| Date | Author | Summary |
|---|---|---|
| 2026-05-17 | Claude (Opus 4.7) | Story 6.1 implementation — sober palette tokens, `solid-accent` Button variant, R-A3 contrast waiver, Architecture-Key vault entry, full regression green. |
| 2026-05-19 | Codex | Code review closure — restored native Button type behavior, added raw `navy` Tailwind alias, refreshed contrast manifest date, regression green; story marked done. |
