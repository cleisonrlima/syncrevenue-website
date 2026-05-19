# Story 5.6: Mobile Hero LCP — SSG / Prerender Static Hero (Story 6.13 AC 7 rescope)

Status: backlog

Epic: 5 — Production Deployment (Phase 4)

Source: Story 6.13 AC 7 rescope (per CLAUDE.md "Review Findings → New Story" rule). Created 2026-05-19.

Depends on: Story 6.13 (asset-side LCP optimisation already landed — preloaded webp `<picture>`, self-hosted variable font, eager `Hero` import).

Blocks: full pre-6.12 mobile `largest-contentful-paint` threshold revert in `lighthouserc.mobile.json`.

## Story

As the engineer carrying the residual Epic 6 mobile LCP gap into Production Deployment,
I want the static home-page hero markup prerendered at build time so the LCP candidate paints before React hydrates,
So that mobile `/` LCP under simulated 4G + 4× CPU throttling falls below 2,500 ms and `lighthouserc.mobile.json` `largest-contentful-paint` can finally return to the original Epic 1 baseline of 2,500 ms.

## Context

Story 6.13 fully optimised the asset path:

- mobile webp variant — 4 KB (loads in <50 ms on simulated 4G)
- Media-scoped `<link rel="preload">` entries for the mobile and desktop hero variants so the network fetch starts before React boots
- `<picture>` element with `fetchpriority="high"`, `decoding="async"`
- self-hosted Plus Jakarta Sans variable font preload (CLS went 0.184 → 0.000)
- Hero re-imported eagerly in `src/pages/Home.tsx`, all below-fold sections re-lazied

After all that, mobile `/` measures (median across 3 runs):

| Metric | Observed | Target | Gap |
|---|---|---|---|
| FCP | 2,141 ms | < 2,000 ms | ~141 ms |
| LCP | 2,916 ms | < 2,500 ms | ~416 ms |
| TBT | 96 ms | < 200 ms | ✅ |
| CLS | 0.000 | < 0.10 | ✅ |

LCP ≥ FCP by construction. The residual 416 ms gap is gated by JS execution before first paint — React bootstrap, i18n init, ErrorBoundary mount — not by asset weight. Pushing below 2,500 ms requires the browser to paint the hero before React runs, which means the static hero markup must be present in `dist/client/index.html` at build time (SSG / prerender).

## Acceptance Criteria

1. **Given** the production build pipeline **When** `npm run build` (or its SSG successor) runs **Then** `dist/client/index.html` contains the rendered static markup for the `Hero` section inline — the `<h1>`, subhead `<p>`, CTA row, KPI strip (`StatRow`), and the hero `<picture>` element with the `<img>` LCP candidate — such that a browser can paint the LCP candidate without executing any JavaScript.

2. **Given** the SSG step lands **When** Lighthouse mobile is run against the prerendered home page (`npm run lhci:mobile` against the production preview) **Then** mobile `/` LCP median across 3 runs is **< 2,500 ms**; mobile `/` FCP median is < 2,000 ms; mobile `categories:performance` remains ≥ 0.90.

3. **Given** the LCP target is hit **When** `lighthouserc.mobile.json` is updated **Then** `largest-contentful-paint` `maxNumericValue` is restored from **3,100 → 2,500**; `npm run lhci:mobile` exits 0 against the restored threshold.

4. **Given** the home page is hydrated client-side after the static paint **When** the React tree mounts **Then** all interactive behaviour works identically to the pre-SSG behaviour: i18n locale switch via `LanguageSwitcher`, scroll-to-section CTA in `Hero.tsx`, smooth-scroll, ErrorBoundary fallback, dynamic state in `HeroProductPanel`. No hydration mismatch warnings reported in console during a manual smoke test on `/` and `/privacy`. Existing Vitest + Playwright suites pass without modification.

5. **Given** an SSG approach is selected **When** the choice is documented **Then** an ADR-style note in `vault/Planning/Architecture-Key.md` captures: (a) the chosen prerender mechanism (e.g. `vite-plugin-ssg`, `react-snap`, `vite-plugin-prerender-spa-plugin`, or a custom static-render step that emits `dist/client/index.html` with the hero pre-rendered), (b) why that mechanism over the alternatives considered, (c) how the i18n locale fan-out is handled (single canonical `/` prerender with the locale switch hydrating client-side is acceptable per the current architecture), (d) how dynamic-only sections (forms, scheduler) are excluded from the prerender step.

6. **Given** the new build step adds a dependency **When** it lands **Then** the dependency is dev-only (does not ship to the runtime bundle); the client-side bundle-size impact on `dist/client/assets/index-*.js` is **≤ 0 bytes** (no client-side cost — the prerender step runs at build time only); the build-time delta is **≤ 30 seconds** on the LH CI worker.

7. **Given** Story 6.13 left a partial AC 7 closure on the books **When** Story 5.6 lands **Then** the Story 6.13 file `_bmad-output/implementation-artifacts/6-13-epic-6-followups-stragglers-cls-lcp-heading-order.md` AC 7 amendment is updated to record the resolution path (link back to Story 5.6, link to the post-SSG LHCI report).

## Tasks / Subtasks

- [ ] Task 1 — Survey SSG/prerender options for a Vite + React SPA (`vite-plugin-ssg`, `react-snap`, `vite-plugin-prerender-spa-plugin`, `vike`, custom puppeteer step) and pick the lowest-friction one that does NOT require migrating away from the existing Vite + Express deployment topology (AC: 5).

- [ ] Task 2 — Add the chosen prerender dependency as a **devDependency**; wire it into `npm run build` (or as a follow-up `build:prerender` step the LH CI workflow runs) so `dist/client/index.html` contains the static hero markup (AC: 1, 6).

- [ ] Task 3 — Verify the prerender output by inspecting `dist/client/index.html` after a clean build — confirm `<h1>` text, subhead, CTA row, StatRow numbers, and `<picture>` element are present BEFORE the React hydration script tags (AC: 1).

- [ ] Task 4 — Handle the i18n locale fan-out per ADR decision in Task 5: either prerender only the canonical `/` (locale switches client-side after hydration) or prerender per-locale variants (`/pt-BR/`, `/es/`) — document the choice in the ADR (AC: 5).

- [ ] Task 5 — Smoke-test the prerendered output for hydration mismatches: `npm run dev` and manually load `/` in all three locales; check console for React hydration warnings; verify locale switch + scroll-to-CTA + form submit work identically (AC: 4).

- [ ] Task 6 — Write ADR / Architecture-Key entry under `vault/Planning/Architecture-Key.md` documenting the prerender mechanism, rationale, locale fan-out approach, and exclusion of dynamic-only sections (AC: 5).

- [ ] Task 7 — Run `npm run lhci:mobile` against the new build; capture the 3-run mobile LCP / FCP / TBT / CLS observations; store the report under `_bmad-output/implementation-artifacts/story-5-6-lhci-report-YYYY-MM-DD/` (AC: 2).

- [ ] Task 8 — Revert `lighthouserc.mobile.json` `largest-contentful-paint` from 3,100 → 2,500; re-run `npm run lhci:mobile` and confirm exit 0 against the restored threshold (AC: 3).

- [ ] Task 9 — Run the full Vitest suite + Playwright e2e suite to confirm zero regressions from the prerender step (AC: 4).

- [ ] Task 10 — Update Story 6.13 AC 7 amendment with the resolution link + post-SSG LHCI report reference (AC: 7).

## Dev Notes

- The asset side (mobile webp, preload, `<picture>`, fetchpriority, self-hosted font) is already optimal — do NOT redo it. Story 6.13 already shaved ~1,100 ms from the baseline.
- The current bottleneck is the React hydration order: `dist/client/index.html` ships as an empty `<div id="root">`. The browser parses HTML → fetches `/src/main.tsx` → parses + executes React → mounts `Home` → renders `Hero` → THEN the `<picture>` element exists and the `<img>` becomes the LCP candidate. SSG short-circuits this by emitting the rendered HTML at build time.
- Hydration mismatch is the biggest risk — server-rendered HTML must match the client-side first render exactly. Watch for: timestamp-dependent renders (none currently in `Hero`), random IDs (none), conditional rendering based on `window` (the `handleDemoCta` callback reads `window.top !== window` but only on click — safe at first render).
- The i18n init in `src/main.tsx` reads `i18next` async and `src/i18n/index.ts` currently uses `fallbackLng: 'en'` — for the prerender step, the default `en` translation strings must be present in the static HTML so the LCP candidate paints the visible h1 text without hydration drift. If locale-specific prerender routes are added, initialise i18next synchronously per route before rendering. If the prerender renders without i18n initialised, the `<h1>` paints empty and the LCP candidate becomes a later element.
- The `useDocumentMeta` hook in `Home.tsx` is React-only (`useEffect`); the prerender step does not need to execute it — SEO meta tags can be emitted directly into the static HTML via the prerender step's hook system, OR the existing `useDocumentMeta` post-hydration overwrite is acceptable (search engines run JS).
- `vite-plugin-ssg` (formerly `vite-ssg`) is the most-Vite-native option and supports per-locale prerender out of the box. `react-snap` runs Puppeteer post-build and works on any SPA but adds a Chromium dep. Both are dev-only.

## Technical Requirements

- **Languages/Frameworks:** TypeScript 5.x, React 18, Vite 5, react-i18next, Lighthouse CI.
- **State machine:** N/A — SSR rendering only.
- **API contracts:** N/A — client-side only.
- **Security:** prerender step runs at build time; no runtime exposure; no new secrets.
- **Performance:** mobile `/` LCP < 2,500 ms, FCP < 2,000 ms, perf ≥ 0.90.

## Architecture Compliance

- Prerender dependency MUST be a `devDependency` — no runtime cost.
- Existing Express SSR-free server topology preserved — `dist/server/index.js` still serves `dist/client/index.html` as a static asset.
- i18n parity rule respected — if per-locale prerender chosen, all three locales (en / pt-BR / es) get equal coverage.

## File Structure Requirements

| File | Change type | Notes |
|---|---|---|
| `package.json` | UPDATE | Add prerender dev dependency + npm script |
| `vite.config.ts` | UPDATE (likely) | Wire prerender plugin into the build step |
| `src/main.tsx` | UPDATE (likely) | Make i18n init synchronous for prerender + add hydration entry |
| `lighthouserc.mobile.json` | UPDATE | `largest-contentful-paint` 3,100 → 2,500 |
| `vault/Planning/Architecture-Key.md` | UPDATE | New ADR entry on prerender mechanism + locale handling |
| `_bmad-output/implementation-artifacts/story-5-6-lhci-report-YYYY-MM-DD/` | NEW | Post-SSG LHCI artifact folder |
| `_bmad-output/implementation-artifacts/6-13-epic-6-followups-stragglers-cls-lcp-heading-order.md` | UPDATE | AC 7 amendment back-link to Story 5.6 resolution |

## Testing Requirements

- Vitest full regression: zero new failures.
- Playwright e2e full regression on `/`, `/privacy`: zero new failures, no hydration mismatch warnings in console.
- Manual smoke test in all three locales: locale switch + scroll-to-section + form submission work identically.
- LHCI mobile run: 3 runs, median LCP < 2,500 ms; restored threshold passes.

## Previous Story Intelligence

- **Story 6.3** introduced the airplane hero asset + headline + CTA row.
- **Story 6.13** asset-optimised the hero (mobile webp + preload + `<picture>` + self-hosted font), shaved ~1,100 ms from the baseline, and rescoped the remaining ~400 ms gap to this story.
- **Story 5.1** (Production Build & PM2) will wrap this story's build step into the production deploy — coordinate so the prerender step runs cleanly in the PM2 deploy pipeline.

## Outstanding Questions for Dev

1. Which prerender mechanism — `vite-plugin-ssg`, `react-snap`, `vite-plugin-prerender-spa-plugin`, `vike`, or a custom puppeteer step? Recommendation: `vite-plugin-ssg` for tightest Vite integration; fall back to `react-snap` if SSG plugin compatibility issues with current Vite + React 18 config.
2. Per-locale prerender or single canonical `/` prerender with client-side locale hydration? Recommendation: single canonical `/` prerender in `en` (default fallback per current i18n config) — locale switch hydrates client-side after first paint. Per-locale prerender adds build complexity for marginal SEO benefit (the SEO meta + hreflang tags already cover this via `useDocumentMeta` post-hydration).
3. Does the SSG mechanism interfere with the existing `_bmad-output/implementation-artifacts/epic-6-lhci-report-*/` artifact convention? If LHCI artifacts move into a different folder under SSG, adjust the `story-5-6-lhci-report-*` naming.

## Story Completion Status

- Status: backlog
