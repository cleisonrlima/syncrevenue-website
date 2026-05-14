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
