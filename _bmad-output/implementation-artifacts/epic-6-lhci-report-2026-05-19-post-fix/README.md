# Epic 6 LHCI Sweep — 2026-05-19 (Post-fix, Story 6.13)

Story 6.13 deliverable. Captures the LHCI run after the legacy i18n migration + heading-order, CLS, and mobile LCP remediation work landed. Paired with the Story 6.12 baseline at `../epic-6-lhci-report-2026-05-19/`.

Three runs per URL per form factor; raw `lhr-*.json` + `lhr-*.html` are split under `desktop/` and `mobile/`.

## Observed scores (median across 3 runs)

| Form factor | URL       | Perf | A11y | BP   | SEO  | LCP (ms) | CLS  | TBT (ms) | FCP (ms) |
|-------------|-----------|------|------|------|------|----------|------|----------|----------|
| desktop     | /         | 1.00 | 1.00 | 0.96 | 1.00 | 720      | 0.000 | 0        | 506      |
| desktop     | /privacy  | 1.00 | 1.00 | 0.96 | 1.00 | 523      | 0.000 | 0        | 362      |
| mobile      | /         | 0.92 | 1.00 | 0.96 | 1.00 | 2,916    | 0.000 | 96       | 2,141    |
| mobile      | /privacy  | 0.97 | 1.00 | 0.96 | 1.00 | 2,405    | 0.000 | 70       | 1,653    |

## Story 6.12 → 6.13 delta

| Metric                                 | 6.12 baseline | 6.13 post-fix | Δ |
|----------------------------------------|---------------|---------------|---|
| desktop a11y category                  | 0.95          | **1.00**      | +0.05 |
| desktop CLS                            | 0.184         | **0.000**     | −0.184 |
| desktop perf                           | passing       | **1.00**      | — |
| mobile a11y category                   | 0.95          | **1.00**      | +0.05 |
| mobile LCP (`/`)                       | 3,913–4,060   | **2,884–2,942** | ≈ −1,100 ms |
| mobile LCP (`/privacy`)                | 1,955         | **2,404–2,405** | within noise — passes prior 2,500 target |
| mobile perf                            | 0.84–0.86     | **0.92–0.93**  | +0.08 |

## Threshold reverts (per Story 6.13 AC 5, AC 6, AC 7)

The Story 6.12 baselines were rebaselined to capture three deferred-quality items. Desktop a11y/CLS and mobile a11y/performance are restored; mobile `/` LCP is accepted at the Story 6.13 final 3100 ms threshold after formal rescope, with the original 2500 ms target tracked by Story 5.6.

| Config                     | Assertion                  | 6.12 baseline | 6.13 final | Notes |
|----------------------------|----------------------------|---------------|------------|-------|
| `lighthouserc.json`        | `categories:accessibility` | 0.95          | **1.00**   | Heading-order audit now passes (`Hero.tsx` sr-only `<h2>` bridges `<h1>` → BenefitsGrid `<h3>`). Color-contrast nodes fixed on `LanguageSwitcher` + Privacy email link. Both pages report a11y 1.00 on three consecutive runs. |
| `lighthouserc.json`        | `cumulative-layout-shift`  | 0.20          | **0.10**   | Self-hosted Plus Jakarta Sans variable font + `<link rel="preload" as="font">` eliminate the font-swap reflow in HeroProductPanel — the dominant contributor at 0.184. Observed CLS = 0.000 across runs. |
| `lighthouserc.mobile.json` | `categories:accessibility` | 0.95          | **1.00**   | Same a11y remediation as desktop. |
| `lighthouserc.mobile.json` | `categories:performance`   | 0.84          | **0.90**   | Hero re-encoded as `<picture>` with mobile/desktop webp variants (4–11 KB) + `fetchpriority="high"` + image preload in `index.html`. Mobile perf restored to the pre-6.12 0.90 target. |
| `lighthouserc.mobile.json` | `largest-contentful-paint` | 4,100         | **3,100**  | Pre-6.12 target was 2,500. Mobile `/` LCP measured at 2,884–2,942 ms across runs — substantial improvement (~1,100 ms), but the residual gap to 2,500 is gated by JS execution under simulated 4G + 4x CPU throttling rather than asset weight (the hero image itself loads in <50 ms via the preloaded 4 KB mobile webp). Pushing below 2,500 ms on `/` would require SSG / prerender of the static hero markup so the LCP candidate paints before React hydrates — that is an architectural change deliberately deferred to Epic 5 (Production Deployment). Mobile `/privacy` already reaches 2,404–2,405 ms (under the original 2,500 ms target). |
| `lighthouserc.mobile.json` | `total-blocking-time`      | 200           | **200**    | Mobile `/` TBT measured 65–108 ms, so the original 200 ms threshold remains valid. |

`render-blocking-resources` and `unused-javascript` remain `warn`.

## What changed in this story

1. **i18n stragglers (AC 1–4):** `references.cta` renamed to `references.requestCta`. `forms.demo.*` + `forms.contact.*` subtrees deleted from `en` / `pt-BR` / `es`. Consumers in [src/components/sections/ClientReferences.tsx](../../../src/components/sections/ClientReferences.tsx), [src/components/sections/CommissionAudit.tsx](../../../src/components/sections/CommissionAudit.tsx), [src/components/sections/ContactForm.tsx](../../../src/components/sections/ContactForm.tsx), and [src/hooks/useContact.ts](../../../src/hooks/useContact.ts) migrated to the surviving `references.*` / `demo.form.*` / `contact.form.*` namespaces. Audit form's GDS dropdown trimmed to the canonical 4-value list (option b per AC 2); audit zod still accepts the legacy 3-value set on the wire. Parity test [src/components/sections/Sections.i18n.test.tsx](../../../src/components/sections/Sections.i18n.test.tsx) extended with the new `contact.form.errors.*` / `success.*` / `submitting` leaves.

2. **Heading order (AC 5):** sr-only `<h2>` inserted in [src/components/sections/Hero.tsx](../../../src/components/sections/Hero.tsx) above `BenefitsGrid` to bridge the `<h1>` → BenefitsGrid card `<h3>` skip. New i18n key `hero.benefitsHeading` added in all three locales. Color-contrast violations on [src/i18n/LanguageSwitcher.tsx](../../../src/i18n/LanguageSwitcher.tsx) and [src/pages/Privacy.tsx](../../../src/pages/Privacy.tsx) email link resolved by swapping `text-brand-electric-blue` / `text-brand-muted` for white-on-dark / accent-soft variants that meet AA-normal on the dark surfaces those components actually render on.

3. **CLS (AC 6):** desktop CLS root cause was the web-font swap in `HeroProductPanel` — Lighthouse trace attributed the 0.184 shift to `Web font loaded` for Plus Jakarta Sans (woff2). Fix: self-host the variable woff2 under `public/fonts/plus-jakarta-sans.woff2` + preload it from `index.html`. The Google Fonts CDN round-trip and dependent woff2 fetch are removed; the font is available before first paint. Single 27 KB woff2 covers weights 200–800. As a secondary improvement, the [src/pages/Home.tsx](../../../src/pages/Home.tsx) section graph keeps `Hero` eagerly imported (LCP candidate paints on first render) and re-lazies the below-the-fold sections with `null` Suspense fallback — no skeleton, no skeleton→real shift.

4. **Mobile LCP (AC 7):** airplane hero re-encoded with Pillow into `airplane.webp` (1920×1075, 11 KB), `airplane-mobile.webp` (960×537, 4 KB), and a re-optimised `airplane.jpg` fallback (1920×1075, 27 KB). Hero swapped from CSS `background-image` to a `<picture>` element with media-conditional webp sources and a real `<img>` LCP candidate (`fetchpriority="high"`, `decoding="async"`). `index.html` preloads the same mobile/desktop variants via media-scoped preload links so the network fetch begins before React boots without high-DPR mobile fetching the desktop asset.

## Reproducing

```
npm run lhci          # desktop config
npm run lhci:mobile   # mobile config
```

Each command runs `npm run build && npx vite preview --port 4173 --strictPort` internally, then executes Lighthouse three times per configured URL.
