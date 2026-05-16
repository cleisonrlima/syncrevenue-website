## Deferred from: code review of 1-1-project-initialization-dev-environment (2026-05-14)

- Add `secure: false` to Vite proxy config for potential dev TLS — not needed until TLS enabled, revisit with Story 5.2 [vite.config.ts:14-16]

## Deferred from: code review of 1-2-design-system-foundation (2026-05-14)

- Render-blocking `@import` for Google Fonts — `<link rel="preconnect">` + `<link>` in HTML `<head>` would be better for performance [src/index.css:1]
- `fontWeight.heavy: '800'` duplicates Tailwind's built-in `font-extrabold` (font-weight: 800) — adds config bloat with no new capability [tailwind.config.ts:89-91]
- `max-w-2xl` on subtext `<p>` inside unconstrained parent div may have no visible effect depending on layout context [src/components/ui/SectionHeader.tsx:39]
- SectionHeader heading always `<h2>` — no polymorphic `as` prop for correct heading hierarchy when multiple section headers exist on a page [src/components/ui/SectionHeader.tsx:30]
- SectionSkeleton `bg-muted` resolves to shadcn `hsl(210 40% 96.1%)` — nearly invisible on white backgrounds; may want brand-muted contrast on light sections [src/components/sections/SectionSkeleton.tsx:9]
- Focus-visible white ring may blend into light-colored surrounding backgrounds (ring contrast assumes button sits on dark/gradient surface) [src/components/ui/GradientButton.tsx:28]
- Google Fonts URL loads 6 weight-lines (400,500,600,700,800,400i) — 500 and 400i support unused weight-lines; subsetting would save bandwidth [src/index.css:1]
- SectionSkeleton no visual loading indicator when `motion-safe:` suppresses animation — reduced-motion users see static gray rectangle [src/components/sections/SectionSkeleton.tsx:13]
- GradientButton has no loading/busy state for async actions — no spinner, no disabled-while-loading logic [src/components/ui/GradientButton.tsx:19-36]

## Deferred from: code review of 1-4-app-shell-routing-navigation (2026-05-14)

- `<a href="/#hero">` anchor links from non-homepage trigger full page navigation — by-design per spec constraint requiring `<a href="/#section-id">`, defer SPA-aware section nav to future story [src/components/layout/Navbar.tsx, src/components/layout/Footer.tsx]

## Deferred from: code review of 1-4-app-shell-routing-navigation (re-review 2026-05-14)

- ErrorBoundary no recovery path (no retry button) — enhancement, outside current story scope [src/components/ErrorBoundary.tsx]
- No scroll restoration on SPA route change — pre-existing, not introduced by this story
- Navbar test imports `@/i18n` as side-effect — existing pattern used by all tests, not story-specific [src/components/layout/Navbar.test.tsx:6]
- ErrorBoundary fallback "Failed to load section." hardcoded English — requires class→function refactor for `useTranslation`; error-only path, low exposure [src/components/ErrorBoundary.tsx:24]

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
