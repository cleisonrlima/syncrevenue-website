## Deferred from: code review of 1-1-project-initialization-dev-environment (2026-05-14)

- Add `secure: false` to Vite proxy config for potential dev TLS — not needed until TLS enabled, revisit with Story 5.2 [vite.config.ts:14-16]

## Deferred from: code review of 1-2-design-system-foundation (2026-05-14)

- [x] Render-blocking `@import` for Google Fonts — moved to `<link rel="preconnect">` + `<link rel="stylesheet">` in `index.html`; `@import` removed from `src/index.css`. Closed by Story 3.7 commit [`fbcb157`](https://github.com/xillinha/syncrevenue-website/commit/fbcb15711776b10bff35a40588439250b1d643d7). [src/index.css, index.html]
- [x] `fontWeight.heavy: '800'` duplicates Tailwind's built-in `font-extrabold` — token removed; no `font-heavy` usages existed to migrate. Closed by Story 3.7 commit [`fbcb157`](https://github.com/xillinha/syncrevenue-website/commit/fbcb15711776b10bff35a40588439250b1d643d7). [tailwind.config.ts]
- [x] `max-w-2xl` on subtext `<p>` — subtext width cap moved into its own wrapper so descriptions stay readable without constraining eyebrow or heading. Closed by Story 3.7 commit [`fbcb157`](https://github.com/xillinha/syncrevenue-website/commit/fbcb15711776b10bff35a40588439250b1d643d7). [src/components/ui/SectionHeader.tsx]
- [x] SectionHeader heading always `<h2>` — added polymorphic `as?: 'h2' | 'h3'` prop (default `h2`); co-located `SectionHeader.test.tsx` covers both levels. Closed by Story 3.7 commit [`fbcb157`](https://github.com/xillinha/syncrevenue-website/commit/fbcb15711776b10bff35a40588439250b1d643d7). [src/components/ui/SectionHeader.tsx, src/components/ui/SectionHeader.test.tsx]
- [x] SectionSkeleton `bg-muted` invisible on white — replaced with `bg-brand-slate/60` (about 3.26:1 against white); reduced-motion users now also receive an `aria-live="polite"` + `sr-only` "Loading…" label. Closed by Story 3.7 commit [`fbcb157`](https://github.com/xillinha/syncrevenue-website/commit/fbcb15711776b10bff35a40588439250b1d643d7). [src/components/sections/SectionSkeleton.tsx]
- [x] Focus-visible white ring may blend on light surroundings — replaced `focus-visible:ring-white` with `focus-visible:ring-brand-deep`; visible on both dark gradient and light surfaces. Closed by Story 3.7 commit [`fbcb157`](https://github.com/xillinha/syncrevenue-website/commit/fbcb15711776b10bff35a40588439250b1d643d7). [src/components/ui/GradientButton.tsx]
- [x] Google Fonts URL loaded 6 weight-lines — trimmed to `400;500;600;700;800` (kept `500` because `font-medium` is used; dropped only `400i` — no italic in code). Closed by Story 3.7 commit [`fbcb157`](https://github.com/xillinha/syncrevenue-website/commit/fbcb15711776b10bff35a40588439250b1d643d7). [index.html]
- [x] SectionSkeleton no visual loading indicator under `motion-safe:` suppression — `aria-live="polite"` + `sr-only` label added; `bg-brand-slate/60` fill provides perceptible static affordance. Closed by Story 3.7 commit [`fbcb157`](https://github.com/xillinha/syncrevenue-website/commit/fbcb15711776b10bff35a40588439250b1d643d7). [src/components/sections/SectionSkeleton.tsx]
- GradientButton has no loading/busy state for async actions — no spinner, no disabled-while-loading logic [src/components/ui/GradientButton.tsx:19-36]

## Deferred from: code review of 1-4-app-shell-routing-navigation (2026-05-14)

- `<a href="/#hero">` anchor links from non-homepage trigger full page navigation — by-design per spec constraint requiring `<a href="/#section-id">`, defer SPA-aware section nav to future story [src/components/layout/Navbar.tsx, src/components/layout/Footer.tsx]

## Deferred from: code review of 1-4-app-shell-routing-navigation (re-review 2026-05-14)

- [x] ErrorBoundary no recovery path (no retry button) — added Retry button via inner `FallbackUI` function component; click resets `hasError` and re-mounts children. Closed by Story 3.8 commit [`fa4fbaf`](https://github.com/xillinha/syncrevenue-website/commit/fa4fbaf). [src/components/ErrorBoundary.tsx]
- [x] No scroll restoration on SPA route change — added `src/components/ScrollRestoration.tsx` (useLocation + useEffect on pathname; preserves in-page anchor for `/#hash`; skips initial mount). Mounted in `App.tsx`. Closed by Story 3.8 commit [`fa4fbaf`](https://github.com/xillinha/syncrevenue-website/commit/fa4fbaf). [src/components/ScrollRestoration.tsx, src/App.tsx]
- Navbar test imports `@/i18n` as side-effect — existing pattern used by all tests, not story-specific [src/components/layout/Navbar.test.tsx:6]
- [x] ErrorBoundary fallback "Failed to load section." hardcoded English — refactored: inner `FallbackUI` function component consumes `useTranslation()`; new keys `errors.sectionLoad` + `errors.retry` added to EN/PT-BR/ES. Closed by Story 3.8 commit [`fa4fbaf`](https://github.com/xillinha/syncrevenue-website/commit/fa4fbaf). [src/components/ErrorBoundary.tsx, src/i18n/locales/*/translation.json]

## Deferred from: code review of 3-4-mobile-ux-polish-pass (2026-05-15)

- AC5 Lighthouse mobile gate never executed — `lighthouserc.mobile.json` `preset: "mobile"` is invalid Lighthouse value (valid: `perf`, `experimental`, `desktop`); `vite preview` start timed out in sandbox; AC5 (Perf≥90, LCP≤2.5s, CLS<0.1, no a11y) unverified — spawn follow-up story to fix config + re-run [lighthouserc.mobile.json]
- AC1 ES locale cross-locale heading-fit test missing — only PT-BR exercised at 375px [tests/e2e/mobile-ux.spec.ts]
- AC4 e2e assertion missing for fields-not-side-by-side <640px — only submit-button width tested [tests/e2e/mobile-ux.spec.ts]
- AC2 TrustBar 2×2 grid at 480-767px not regression-tested at the 480px breakpoint [tests/e2e/mobile-ux.spec.ts]
- AC3 LanguageSwitcher tap-target inside mobile overlay not audited for ≥44px [src/components/layout/LanguageSwitcher.tsx]
- Task 5.4 — class-level unit assertions (`expect(submit).toHaveClass('w-full','sm:w-auto')`) for DemoForm + Contact submit buttons not added; e2e width-ratio only [src/components/sections/DemoForm.test.tsx, Contact.test.tsx]

## Deferred from: code review of 3-4-mobile-ux-polish-pass (resolution pass 2026-05-15)

The 6 review-deferred findings logged above (LHCI config, ES cross-locale, AC4 form-stack, AC2 TrustBar 2x2, AC3 LangSwitcher 44px, Task 5.4 unit class assertions) were folded back into Story 3.4 scope and implemented inline. Closed. See Deferred-Findings Resolution section in `3-4-mobile-ux-polish-pass.md`.

NEW defers surfaced by the now-runnable `npm run lhci:mobile`:

- AC5 a11y `color-contrast` (homepage + /privacy) — LanguageSwitcher active state `text-brand-electric-blue` on `bg-brand-navy` flagged by axe under LHCI; R-A2 brand-token waiver is project-documented but Lighthouse-CI does not honor it. Either configure an LHCI axe baseline/override, or change the active-state token to a contrast-safe color. [src/i18n/LanguageSwitcher.tsx]
- AC5 LCP 3018ms (homepage, mobile 4G emulation) — LCP element is Hero `<h1>`. Depends on Story 3.7 (font loading & UI primitive hardening: drop `@import` in `src/index.css`, add `<link rel="preconnect">` + `<link rel="stylesheet">` in `index.html`, trim weight set). Re-run LHCI after Story 3.7 lands. [src/index.css, index.html, src/components/sections/Hero.tsx]
- TrustBar breakpoint deviation — AC2 specifies 480-767px 2x2 grid; code uses Tailwind default sm: (640-767px). Aligning requires a custom Tailwind breakpoint (`'xs2': '480px'` or similar) and adjusting `TrustBar.tsx`. Not blocking but tracked. [tailwind.config.ts, src/components/sections/TrustBar.tsx]

## Deferred from: code review of 3-6-story-3-1-review-followups-real-team-content-visual-qa (2026-05-16)

- Broken non-empty photo URLs render broken images instead of falling back to initials. `Team.tsx` renders `<img>` for any non-empty `photo` and only uses initials when `photo` is empty; add an `onError` fallback or an asset-decode gate in a future hardening story. [src/components/sections/Team.tsx:94]
