# Frontend Module

**Stack:** Vite + React 18 + TypeScript (strict) + Tailwind CSS v3 (custom UI primitives — no shadcn/ui installed; `components.json` is a leftover CLI config only)
**Entry:** `src/main.tsx` → `src/App.tsx`

---

## Pages

| File | Route | Description |
|---|---|---|
| `src/pages/Home.tsx` | `/` | Public landing page — 7 lazy sections (Hero→SyncRevenue→Comparison→Security→ClientReferences→DemoScheduler→Contact) |
| `src/pages/Privacy.tsx` | `/privacy` | Privacy policy — all content from `privacy.*` i18n keys |
| `src/pages/admin/Login.tsx` | `/admin/login` | Admin login (stub) |
| `src/pages/admin/Dashboard.tsx` | `/admin/dashboard` | Admin dashboard (stub) |
| `src/pages/admin/Leads.tsx` | `/admin/leads` | Admin leads (stub) |
| `src/pages/admin/Team.tsx` | `/admin/team` | Admin team (stub) |

---

## Sections (public landing page)

| Component | FR | Description |
|---|---|---|
| `src/components/sections/Hero.tsx` | FR1 | Value prop, dual CTAs, StatRow + TrustBar; motion-safe variants; `Hero.test.tsx` co-located |
| `src/components/sections/StatRow.tsx` | FR1 | 4-stat row (commission accuracy, agencies, $ recovered, hours saved) — Hero child |
| `src/components/sections/TrustBar.tsx` | FR1 | 5-logo trust strip — Hero child |
| `src/components/sections/SyncRevenue.tsx` | FR2 | SectionHeader + GDS integration list (Amadeus/Sabre/Galileo/Worldspan) + 99.99% accuracy; light bg; `SyncRevenue.test.tsx` co-located |
| `src/components/sections/Services.tsx` | FR3 | 4 service cards + contact hint; light bg; `Services.test.tsx` co-located |
| `src/components/sections/Comparison.tsx` | FR4 | vs. alternatives |
| `src/components/sections/Team.tsx` | FR5 | Team members |
| `src/components/sections/Contact.tsx` | FR6 | Contact form section |
| `src/components/sections/Security.tsx` | FR23–FR25 | Security statement + client refs |
| `src/components/sections/DemoScheduler.tsx` | FR9, FR15 | Dark-gradient bookend section — SectionHeader (variant=dark) + in-section "Schedule a Demo" GradientButton (lg, min-h-44px) that calls `DemoForm.focusFirstField()` and smooth-scrolls the form container; embeds the single `DemoForm` instance (no modal). Hero/Navbar CTAs scroll to `#demo-scheduler`. Tests: `DemoScheduler.test.tsx`, `Home.story-2-4.e2e.test.tsx` |
| `src/components/sections/DemoForm.tsx` | FR9 | `forwardRef<DemoFormHandle>` exposing `focusFirstField()` (focuses the Full Name input via internal `nameInputRef`); state machine, validation, and submit flow unchanged |

---

## Layout Components

| File | Description |
|---|---|
| `src/components/layout/Navbar.tsx` | Sticky fixed nav (`z-50 bg-brand-navy`); desktop: logo + anchor links + LanguageSwitcher + Demo CTA (button `onClick`); mobile: hamburger overlay + Escape/click-to-close + body scroll lock; `aria-expanded` on toggle; `Navbar.test.tsx` co-located (4 tests) |
| `src/components/layout/Footer.tsx` | Block-flow footer; company address, copyright, anchor nav links, Privacy `<Link>`, `<LanguageSwitcher />` |
| `src/components/layout/AdminLayout.tsx` | Shell with `<Outlet />` — no auth guard (deferred to future epic) |

## Shared Components

| File | Description |
|---|---|
| `src/components/sections/SectionSkeleton.tsx` | Suspense fallback — `motion-safe:animate-pulse bg-muted`, height via `className`; `role="status" aria-busy="true"` |
| `src/components/ui/GradientButton.tsx` | Brand CTA button — gradient bg, 3 sizes (lg/md/sm), disabled clears gradient; `motion-safe:active:scale-[0.98]` |
| `src/components/ui/SectionHeader.tsx` | Section header — eyebrow + h2 + optional subtext, light/dark variant |
| `src/components/ui/Toast.tsx` | Toast notifications (custom, Story 2.2) — replaces what shadcn would have generated; repo never ran `npx shadcn add` |

---

## Key Patterns

- Sections lazy-loaded via `React.lazy` + `Suspense` + `ErrorBoundary` (`src/components/ErrorBoundary.tsx`) — chunk failure shows fallback, not white screen
- Nav links to in-page sections: `<a href="/#section-id">` (NOT React Router `<Link>`) — smooth scroll via CSS `scroll-behavior: smooth`
- Nav links to routes: `<Link to="/route">` (React Router)
- Skip link: first DOM element in App.tsx; `sr-only focus:not-sr-only`; targets `<main id="main-content">`
- `<main id="main-content" className="pt-16">` — `pt-16` offsets 64px fixed Navbar
- Locale sourced from `useLocaleStore` — never directly from i18next
- Form state: `'idle' | 'submitting' | 'success' | 'error'` — see [[Architecture-Key]]
- **API envelope strictness** — `src/lib/api.ts` rejects 2xx responses missing `success: true` (Story 2.2)
- **Duplicate-submit ref guard** — `useDemo` / `useContact` use `useRef<boolean>` set synchronously before `await`, restored after settle (Stories 2.2, 2.3)
- **Locale-aware Zod factories** — `createDemoSchema(t)` / `createContactSchema(t)` close over the i18n `t` function; consumers `useMemo` over `[t]` and revalidate touched fields on locale change (Story 2.6)
- **`DemoFormHandle` imperative handle** — `forwardRef` + `useImperativeHandle` exposes `focusFirstField()`; exactly one `DemoForm` on Home enforced by `Home.story-2-4.e2e.test.tsx` (Story 2.4)
- **No shadcn/ui** — custom `GradientButton`, `SectionHeader`, `Toast`; native `<select>` / `<input>` preserved for a11y
- **Stale a11y state reset on value change** — corrected fields clear `aria-invalid` + `aria-describedby` immediately, not on next blur (Stories 2.3, 2.6)

---

## Status

| Story | Files Implemented |
|---|---|
| 1.1 | src/main.tsx, src/App.tsx, src/index.css, src/vite-env.d.ts, src/lib/utils.ts, all stub components/pages |
| 1.2 | src/components/ui/GradientButton.tsx, src/components/ui/SectionHeader.tsx, src/components/sections/SectionSkeleton.tsx, tailwind.config.ts, src/index.css |
| 1.4 | src/App.tsx (route tree + skip link + `/admin` index redirect), src/components/layout/Navbar.tsx + Navbar.test.tsx, src/components/layout/Footer.tsx (dynamic copyright), src/components/layout/AdminLayout.tsx, src/pages/Home.tsx (ErrorBoundary per section), src/pages/Privacy.tsx (i18n defaultValues), src/index.css (smooth scroll), src/components/ErrorBoundary.tsx (new) |
| 2.2 | src/lib/api.ts (envelope-strict fetch wrapper), src/hooks/useDemo.ts (state machine + ref-guard), src/components/sections/DemoForm.tsx, src/components/ui/Toast.tsx (new — repo never installed shadcn) |
| 2.3 | src/hooks/useContact.ts, src/components/sections/Contact.tsx (native `required`, inline 429, revalidate on change) |
| 2.4 | src/components/sections/DemoForm.tsx (`forwardRef` + `useImperativeHandle` exposing `DemoFormHandle.focusFirstField()`), src/components/sections/DemoScheduler.tsx (dark-gradient bookend, inline CTA, scrolls + focuses sole `DemoForm` instance) |
| 2.6 | `createDemoSchema(t)` / `createContactSchema(t)` factories in `src/hooks/useDemo.ts` + `src/hooks/useContact.ts`; consumer components `useMemo` over `[t]`; touched-field revalidation on locale change |
| 2.7 | Build-output secret scan via `scripts/check-client-bundle-secrets.mjs` (post-`npm run build`); no client code changes — secrets pipeline is build-time |

---

## Testing Infrastructure (added 2026-05-15 — Test Design Epic 1 gap closure)

### Unit / jsdom (Vitest)

- `npm run test:run` — 22 files, 99 tests
- New since baseline:
  - `src/i18n/index.test.ts` — extended with `expectDeepKeyParity()` helper (R-I1)
  - `src/lib/brand-tokens.contrast.test.ts` — WCAG 2.1 AA contrast guard locking the R-A2 Electric Blue exception
  - `src/components/sections/ClientReferences.allowlist.test.tsx` — parses `vault/Planning/client-references-allowlist.md` and asserts every rendered `agencyName` is approved; placeholders fail when `NODE_ENV === 'production'` (R-B1)
- Vitest excludes `tests/e2e/**` (configured in `vite.config.ts`)

### Real-browser e2e (Playwright)

- Config: `playwright.config.ts` — projects: chromium, webkit, mobile-chrome, mobile-webkit
- Specs under `tests/e2e/`:
  - `smoke.spec.ts` — P0-1, `/` and `/privacy` mount, no console errors
  - `a11y-axe.spec.ts` — P0-6 / P1-8 / P1-9, `@axe-core/playwright` WCAG 2.1 AA scan × 2 routes × 3 locales (color-contrast disabled to honor R-A2 exception)
  - `mobile-overlay.spec.ts` — P0-5 / P1-4, hamburger open + Esc close + focus trap (Pixel 7 device)
  - `locale-switch.spec.ts` — P1-1 / P1-2, locale switch happy path on `/` and `/privacy` without navigation; scroll preservation
  - `skip-link.spec.ts` — P1-5, skip-to-main is first tab stop
- Local bootstrap: `npm run test:e2e:install` once → `npm run test:e2e`
- Auto-starts dev server via `webServer` config (or honors `PLAYWRIGHT_BASE_URL` for preview/prod URL)

### Performance gates (Lighthouse CI)

- `lighthouserc.json` — desktop preset, runs against `npx vite preview --port 4173`, asserts perf ≥ 90, a11y = 100, best-practices ≥ 95, LCP ≤ 2500ms, CLS < 0.1, TBT < 200ms
- `lighthouserc.mobile.json` — mobile preset, same web-vitals budgets (covers NFR-P1, NFR-P2, NFR-P3)
- `npm run lhci` / `npm run lhci:mobile`

### CI

- `.github/workflows/quality.yml` — three jobs on PR + push to master/main:
  1. **unit** — `tsc --noEmit` + Vitest
  2. **e2e** — Playwright (chromium + webkit) + axe (needs **unit**)
  3. **lighthouse** — Lighthouse CI desktop + mobile (needs **unit**)
- Playwright HTML report uploaded as artifact on failure

### Risk traceability

All new tests trace to risk IDs documented in `_bmad-output/test-artifacts/test-design/test-design-epic-1.md` (R-A2, R-A3, R-B1, R-I1, R-I2, R-O1, R-O2, R-O3, R-O4, R-P1, R-P2, R-T5).
