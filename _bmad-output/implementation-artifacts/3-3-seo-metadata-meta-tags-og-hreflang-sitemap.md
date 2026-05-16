# Story 3.3: SEO Metadata — Meta Tags, OG, hreflang & Sitemap

Status: done

<!-- Note: Validation completed during create-story. Story is ready for dev-story. -->

## Story

As a potential customer searching for GDS commission recovery tools,
I want the site to appear correctly in search results with proper language signals,
so that Sync Sirius captures organic traffic from EN, PT-BR, and ES markets.

## Acceptance Criteria

1. **Given** the homepage `/` renders in any supported locale, **when** the document `<head>` is inspected, **then** `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">`, `<meta property="og:url">`, `<meta property="og:type" content="website">`, and `<meta property="og:locale">` are all populated with locale-appropriate content sourced from i18n translation keys; values match the active locale within a single render tick (no flash of default locale meta).

2. **Given** the active locale changes (via `LanguageSwitcher`) on `/` or `/privacy`, **when** the page re-renders, **then** `<html lang="...">` updates to the active locale BCP-47 code (`en`, `pt-BR`, `es`), `og:locale` updates to the matching IETF tag (`en_US`, `pt_BR`, `es_ES`), and document `<title>` + `<meta name="description">` switch to the new locale's values without a full page reload.

3. **Given** any supported locale is active on `/`, **when** `<head>` is inspected, **then** four `<link rel="alternate">` tags are present: one each for `hreflang="en"`, `hreflang="pt-BR"`, `hreflang="es"`, and `hreflang="x-default"`; each `href` is an absolute URL built from the canonical site origin and the current path, with a `?lng=<locale>` query parameter for the locale variants (and no `lng` query for `x-default`).

4. **Given** the build output exists, **when** `GET /sitemap.xml` is fetched from the production server, **then** the response status is `200`, `Content-Type` is `application/xml` (or `text/xml`), the body is valid XML conforming to the sitemaps.org schema, it lists exactly two `<url>` entries (`/` and `/privacy`), each entry includes `<lastmod>` in ISO 8601 (YYYY-MM-DD), and each entry includes three `<xhtml:link rel="alternate" hreflang="...">` children for `en`, `pt-BR`, and `es` plus one for `x-default`. Admin routes (`/admin/*`) are absent.

5. **Given** the build output exists, **when** `GET /robots.txt` is fetched from the production server, **then** the response status is `200`, `Content-Type` is `text/plain`, the body contains `User-agent: *`, `Allow: /`, `Disallow: /admin`, `Disallow: /api`, and a `Sitemap:` directive pointing to the absolute canonical `sitemap.xml` URL.

6. **Given** the Privacy Policy page `/privacy`, **when** its `<head>` is inspected in any supported locale, **then** `<meta name="robots" content="noindex">` is NOT present (the page is indexable), locale-appropriate `<title>` and `<meta name="description">` are set, and the same hreflang alternates from AC3 are emitted with `href` paths ending in `/privacy`.

7. **Given** a visitor lands on `/?lng=pt-BR` or `/?lng=es` directly (e.g., from a search result), **when** the page renders, **then** i18next detects the `lng` query parameter and activates the matching locale on first paint, `<html lang>` and all meta/OG/hreflang tags reflect that locale, and the URL is preserved (no client-side rewrite that strips the query).

8. **Given** automated tests run, **when** unit and browser tests cover SEO behavior, **then** they verify: (a) per-route meta hook applies title/description/OG/canonical/hreflang to `document.head`; (b) locale change updates `<html lang>` and meta tags; (c) `?lng=pt-BR` first-paint activates PT-BR with PT-BR meta; (d) `/sitemap.xml` and `/robots.txt` are served with correct status, content-type, and required substrings/structure; (e) `/admin` is absent from `sitemap.xml` and disallowed in `robots.txt`.

## Tasks / Subtasks

- [x] Task 1: Introduce canonical site origin configuration (AC: 1, 3, 4, 5)
  - [x] Add `VITE_SITE_URL` to `.env.example` with placeholder `https://syncsirius.com` and a comment that it MUST be the public production origin without trailing slash. `VITE_` prefix is acceptable here because the canonical URL is public, not a secret (Architecture rule: `VITE_` prefix is only forbidden on secrets).
  - [x] Read it once in `src/lib/seo.ts` via `import.meta.env.VITE_SITE_URL`; fall back to `https://syncsirius.com` if undefined so dev/test environments work without env wiring. Do NOT throw at module load — log a single dev-only `console.warn` when the fallback is used.
  - [x] Expose a `getCanonicalUrl(path: string, lng?: Locale): string` helper that joins origin + path and appends `?lng=<locale>` only when `lng` is provided; never emit a trailing slash on root (`/` stays `/`).

- [x] Task 2: Add locale-aware SEO content to i18n catalogs (AC: 1, 2, 6)
  - [x] Add a new top-level `seo` namespace key tree to each of `src/i18n/locales/en/translation.json`, `pt-BR/translation.json`, `es/translation.json` with the shape:
    ```json
    "seo": {
      "home":    { "title": "...", "description": "...", "ogTitle": "...", "ogDescription": "..." },
      "privacy": { "title": "...", "description": "...", "ogTitle": "...", "ogDescription": "..." }
    }
    ```
  - [x] Keep `title` ≤ 60 chars and `description` ≤ 160 chars per locale; reuse the brand voice from existing `hero.headline` and `hero.subheadline` keys. `ogTitle` / `ogDescription` may equal `title` / `description` if no platform-specific copy is needed yet.
  - [x] Do NOT introduce technical metadata (e.g., `og:type`, `og:image` alt strings, hreflang codes) into i18n JSON — those are technical constants and live in TypeScript (matches the i18n / a11y boundary already established: technical metadata is not i18n'd).
  - [x] Do not change existing translation keys; add only new keys. Verify all three files stay structurally aligned (same key set in all three).

- [x] Task 3: Build per-route head management without adding `react-helmet-async` (AC: 1, 2, 6, 8)
  - [x] Create `src/components/SEO.tsx` exporting a `useDocumentMeta({ titleKey, descriptionKey, ogTitleKey, ogDescriptionKey, path })` hook that imperatively manages `<head>` via direct DOM (set `document.title`, upsert `<meta>` and `<link>` tags by selector). Do not add `react-helmet`, `react-helmet-async`, or any new runtime dependency.
  - [x] On mount and whenever `i18n.language` changes (subscribe via `useTranslation` + `useEffect` dependency on `i18n.resolvedLanguage`), the hook MUST upsert: `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">`, `<meta property="og:url">`, `<meta property="og:type" content="website">`, `<meta property="og:locale">`, `<link rel="canonical">`, and four `<link rel="alternate" hreflang="...">` tags.
  - [x] Use a stable `data-seo="managed"` attribute on every tag the hook owns so re-mounts replace rather than duplicate, and so unit tests can assert the exact managed set.
  - [x] `og:image` MUST point to an absolute URL (`${VITE_SITE_URL}/og-default.png`). If no asset exists yet, add a placeholder note to the story File List and create a `public/og-default.png` of 1200×630 (a flat brand-navy PNG with the wordmark is acceptable Phase 2 — coordinate with design before adding photography).
  - [x] `og:locale` mapping: `en → en_US`, `pt-BR → pt_BR`, `es → es_ES`. Hard-code this map in `src/lib/seo.ts` next to the supported locales array.

- [x] Task 4: Maintain `<html lang>` and apply SEO hook to public routes (AC: 1, 2, 6, 7)
  - [x] In `src/main.tsx`, after the existing locale detection block, subscribe `i18next.on('languageChanged', (lng) => { document.documentElement.lang = lng })` and set the initial value from `i18next.resolvedLanguage ?? 'en'`. This must run exactly once at app bootstrap.
  - [x] In `src/i18n/index.ts`, extend `detection.order` to `['querystring', 'localStorage', 'navigator']` and add `lookupQuerystring: 'lng'`. Do NOT add `querystring` to `caches` — only `localStorage` should persist (preserves existing behavior). Verify `supportedLngs: ['en', 'pt-BR', 'es']` continues to gate detection.
  - [x] In `src/pages/Home.tsx`, call `useDocumentMeta({ titleKey: 'seo.home.title', descriptionKey: 'seo.home.description', ogTitleKey: 'seo.home.ogTitle', ogDescriptionKey: 'seo.home.ogDescription', path: '/' })` at the top of the component, before the existing lazy-section tree.
  - [x] In `src/pages/Privacy.tsx`, call the hook with the `seo.privacy.*` keys and `path: '/privacy'`.
  - [x] Do NOT call the hook from any `/admin/*` route or layout. Admin routes must remain free of canonical/OG tags and must not appear in alternates.

- [x] Task 5: Generate `sitemap.xml` and `robots.txt` (AC: 4, 5, 8)
  - [x] Add `public/robots.txt` (static file, served by Vite + Express static middleware):
    ```
    User-agent: *
    Allow: /
    Disallow: /admin
    Disallow: /api
    Sitemap: https://syncsirius.com/sitemap.xml
    ```
    The `Sitemap:` URL must use the canonical origin. If `VITE_SITE_URL` will differ in production, prefer generating `robots.txt` at build time (see next subtask) instead of hard-coding.
  - [x] Add a build-time generator `scripts/generate-seo-assets.mjs` (Node, no new deps — use `node:fs`, `node:path`, `node:url`) that:
    - Reads `process.env.VITE_SITE_URL` (or falls back to `https://syncsirius.com`).
    - Writes `dist/client/robots.txt` and `dist/client/sitemap.xml` AFTER the Vite build emits.
    - `sitemap.xml` lists `/` and `/privacy` with `xmlns:xhtml="http://www.w3.org/1999/xhtml"`, `<lastmod>` set to the current build date (`new Date().toISOString().slice(0, 10)`), and four `<xhtml:link rel="alternate" hreflang="...">` per URL (`en`, `pt-BR`, `es`, `x-default`).
    - Treats the on-disk `public/robots.txt` as a dev/static fallback only; the build-time generator overwrites the copy in `dist/client/robots.txt` so the production `Sitemap:` line always reflects the build's `VITE_SITE_URL`.
  - [x] Wire it into `package.json` `build` script: `"build": "tsc -p tsconfig.server.json && vite build && node scripts/generate-seo-assets.mjs"`. Do not move it earlier in the chain — it must run after `vite build` so it can write into `dist/client`.
  - [x] Do not add `sitemap.xml` to `public/` (otherwise Vite copies a stale version that overrides the generated one).

- [x] Task 6: Tests (AC: 8)
  - [x] Add `src/components/SEO.test.tsx`: render a stub component that calls `useDocumentMeta` inside `I18nextProvider`; assert `document.title`, `<meta name="description">`, `<meta property="og:*">`, `<link rel="canonical">`, and all four `<link rel="alternate">` tags are present and locale-correct. Trigger `i18n.changeLanguage('pt-BR')` and assert the tags update without duplication (count managed tags by `data-seo="managed"` and assert the set size stays constant).
  - [x] Add `src/lib/seo.test.ts`: unit-test `getCanonicalUrl`, locale-to-`og:locale` map, and the supported-locale guard.
  - [x] Add `tests/e2e/seo.spec.ts`: visit `/`, assert `html[lang]`, `title`, `meta[name="description"]`, `meta[property^="og:"]`, and all four `link[rel="alternate"][hreflang]` are present and locale-correct in EN and PT-BR; visit `/?lng=pt-BR` and assert PT-BR is active on first paint; visit `/privacy` and assert no `meta[name="robots"][content*="noindex"]` exists.
  - [x] Add `tests/e2e/seo-assets.spec.ts`: fetch `/sitemap.xml` and `/robots.txt` from the running preview/dev server; assert status `200`, expected `Content-Type`, body contains the required URLs/directives, and `/admin` is absent from both. If running the unit suite cannot exercise built `dist/client`, use Playwright's `request` fixture against `npm run preview` (Vite preview server serves `dist/client`); document the command in the spec header.
  - [x] Extend `tests/e2e/locale-switch.spec.ts` (do not duplicate): after switching locale on `/`, assert `document.documentElement.getAttribute('lang')` updates to the new BCP-47 code and `document.title` changes.

- [x] Task 7: Verification (AC: all)
  - [x] Run `npm run typecheck`.
  - [x] Run `npm run test:run`.
  - [x] Run `npm run build`; verify `dist/client/robots.txt` and `dist/client/sitemap.xml` exist with expected content; verify `dist/client/og-default.png` is present.
  - [x] Run `npm run lhci` and `npm run lhci:mobile` if the environment permits; otherwise document the exact blocker in the Dev Agent Record (do not weaken thresholds).
  - [x] Manually load `dist/client/index.html` to confirm the static head defaults (title/description/OG fallbacks) remain in place and are overwritten by the SEO hook on hydration.

## Dev Notes

### Source Context

- Phase 2 explicitly defers SEO from MVP: "Phase 2 adds: meta tags, OG, hreflang (en/pt-BR/es), sitemap.xml, robots.txt." Story 3.3 closes that gap. [Source: `_bmad-output/planning-artifacts/prd.md:101`; `_bmad-output/planning-artifacts/prd.md:249`]
- The architecture explicitly chose "No SSR: Client-side SPA only — SEO deferred to Phase 2 via meta tags (no hydration complexity)" and confirmed Phase 2 SEO additions are "additive only, no architectural changes." [Source: `_bmad-output/planning-artifacts/architecture.md:57`; `_bmad-output/planning-artifacts/architecture.md:945`]
- Routing is client-side React Router with no locale subdomains and no `/pt-br/` path prefix — locale is detected via localStorage → navigator. hreflang alternates therefore must use a URL discriminator (`?lng=<locale>`) so each language has a unique canonical URL for search engines. [Source: `_bmad-output/planning-artifacts/prd.md:235`; `src/i18n/index.ts:11`]
- Performance budgets remain in force: LCP ≤ 2.5s, FID < 100ms, CLS < 0.1. Head-tag manipulation must be synchronous and cheap; do not add a runtime dependency that would inflate the main bundle. [Source: `_bmad-output/planning-artifacts/prd.md:326`; `_bmad-output/implementation-artifacts/3-2-animations-micro-interactions.md:81`]

### Previous Story Intelligence

- Story 3.2 wired Motion into below-the-fold sections via `MotionSection` and kept Motion out of the main bundle (`index-*.js`). Do not break that isolation: the SEO hook must stay free of Motion imports and must not pull section components into the main chunk through transitive imports. [Source: `_bmad-output/implementation-artifacts/3-2-animations-micro-interactions.md:101`; `_bmad-output/implementation-artifacts/3-2-animations-micro-interactions.md:106`]
- Story 3.2 confirmed the canonical locale flow (`i18next.changeLanguage → useLocaleStore.setState → localStorage.setItem`) and the existing `LanguageSwitcher` already preserves scroll position. Tap into `i18next.on('languageChanged', ...)` rather than rewriting `LanguageSwitcher` — the existing flow is the proven path. [Source: `vault/Planning/Architecture-Key.md:174`; `src/i18n/LanguageSwitcher.tsx`]
- The `i18n/a11y boundary` rule established in prior stories: aria-labels, SVG titles, skip-link copy, and SectionSkeleton labels are technical metadata, NOT i18n'd. Apply the same boundary here: hreflang codes, `og:type`, `og:locale` IETF tags, sitemap XML structure, and `robots.txt` directives are technical metadata and stay in TypeScript / build scripts. Only `seo.<route>.title`, `description`, and OG copy live in i18n JSON. [Source: `~/.claude/projects/-home-xillinha-Projects-syncrevenue-website/memory/feedback_a11y_i18n_boundary.md`]
- AC-over-Dev-Notes scope: every AC must be implemented in this story even if a Dev Note suggests deferral. There are no deferrals here — sitemap, robots.txt, OG image placeholder, and indexable Privacy page must all land in Story 3.3. [Source: `~/.claude/projects/-home-xillinha-Projects-syncrevenue-website/memory/feedback_ac_over_dev_notes_scope.md`]

### Current State of Files to Update

- `index.html` (root) currently has only `<title>SyncRevenue</title>` and viewport/charset meta. Add static default `<meta name="description">`, OG defaults, and a `<link rel="canonical">` placeholder so crawlers that don't execute JS still get a complete head; runtime hook overwrites them. [Source: `index.html`]
- `src/main.tsx` imports `./i18n`, detects language, and renders `<App>`. Subscribe to `i18next.on('languageChanged', ...)` for `<html lang>` here — main.tsx already owns the bootstrap-time locale wiring. [Source: `src/main.tsx`]
- `src/i18n/index.ts` configures i18next with `detection.order: ['localStorage', 'navigator']` and `caches: ['localStorage']`. Add `'querystring'` to `order` (FIRST, so a fresh inbound link wins) and add `lookupQuerystring: 'lng'`. Do not add it to `caches`. [Source: `src/i18n/index.ts:11`]
- `src/pages/Home.tsx` is a thin orchestrator that lazy-loads sections and wraps each in `ErrorBoundary` + `Suspense` + `SectionSkeleton`. Add the SEO hook call at the top; do not modify the lazy section wiring. [Source: `src/pages/Home.tsx`]
- `src/pages/Privacy.tsx` renders policy content from i18n keys. Add the SEO hook call at the top. Confirm Privacy is intentionally indexable per AC6 — the existing implementation has no `noindex` meta and must stay that way. [Source: `src/pages/Privacy.tsx`]
- `server/index.ts` already serves `dist/client` via `express.static` and falls back to `index.html` for any non-`/api` GET. Static files in `dist/client` (including the generated `sitemap.xml` and `robots.txt`) are matched by `express.static` BEFORE the SPA fallback, so no new route handlers are required. Verify in tests rather than assume. [Source: `server/index.ts:62`]
- `package.json` build script is `tsc -p tsconfig.server.json && vite build`. Append `&& node scripts/generate-seo-assets.mjs` so the SEO assets land in `dist/client` after the Vite output. [Source: `package.json:8`]

### Architecture Guardrails

- **No new runtime deps.** Do not add `react-helmet`, `react-helmet-async`, `sitemap`, `xmlbuilder`, or any other library. The hook is a 50-line file using `document.head`; the generator is a build-time Node script using `node:fs`.
- **No main-bundle Motion or section imports from the SEO module.** `src/components/SEO.tsx` must import only from `react`, `react-i18next`, and `@/lib/seo`. It must not import any section component or `MotionSection`.
- **No `_blank` or `noopener` patterns here** — SEO is read-only on the document head and does not introduce links.
- **Do NOT add locale subdomains, locale path prefixes, or rewrite the router.** The site keeps a single URL per route. Locale variation in hreflang is expressed via `?lng=<locale>`; the i18n detector treats that as authoritative on first paint.
- **Do NOT mark `/privacy` as `noindex`.** The PRD treats it as a public page. AC6 makes this explicit. Any addition of `<meta name="robots" content="noindex">` fails review.
- **Do NOT alter API response shapes or admin routes.** Story 3.3 is frontend + static-asset only; no server/route/DAO changes other than verifying static-serve ordering.
- **Keep `og:locale` codes correct.** Google and Facebook expect IETF underscore form: `en_US`, `pt_BR`, `es_ES`. BCP-47 hyphens are for `<html lang>` and hreflang only.
- **Sitemap structure must validate against sitemaps.org schema** (root `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`). XML namespaces are non-negotiable for hreflang alternates inside a sitemap.
- **Static head defaults in `index.html` are English.** Per the existing limitation that ErrorBoundary fallback copy is English (R-T1), the pre-hydration head defaults are also intentionally English; the runtime hook localizes on hydration. Document this in the SEO hook comment.

### Library/Framework Requirements

- React 18.3.1 + react-i18next 14.x — use `useTranslation` and `i18next.on('languageChanged', ...)`. `react-i18next` already exposes the i18n instance via `useTranslation().i18n` — no need to import from `i18next` inside the hook. [Source: `package.json`; `src/i18n/index.ts`]
- `i18next-browser-languagedetector` 8.x supports the `querystring` detector out of the box — confirmed by the package's [`README`](https://github.com/i18next/i18next-browser-languageDetector#detector-options). Adding `'querystring'` to `detection.order` and `lookupQuerystring: 'lng'` is the supported API.
- Vite 5 copies everything under `public/` to `dist/client` as-is; this is how `robots.txt` (dev fallback) is served. Files emitted directly into `dist/client` by a post-build script are also served by `express.static` in production. [Source: `vite.config.ts`; `server/index.ts:62`]
- React Router v7 client-side routing means there is no SSR head-injection; head management must happen via `useEffect` or direct DOM upsert. Both are acceptable; choose direct DOM upsert in `useDocumentMeta` to avoid stale heads during route transitions.

### Testing Requirements

- Co-located unit tests are mandatory; never create `__tests__/` directories. [Source: `vault/Planning/Architecture-Key.md:103`]
- Vitest + Testing Library for unit tests; Playwright for e2e; axe/Lighthouse for a11y/perf. Use Playwright's `request` fixture for `sitemap.xml` / `robots.txt` assertions so the spec exercises the actual HTTP response. [Source: `vault/Code/Frontend.md:91`]
- Playwright config auto-starts `npm run dev` unless `PLAYWRIGHT_BASE_URL` is provided. Sandbox environments may block this — if `npm run dev` fails with `listen EPERM` (as in Story 3.2), document it in the Dev Agent Record and still run typecheck/unit/build. [Source: `playwright.config.ts:28`; `_bmad-output/implementation-artifacts/3-2-animations-micro-interactions.md:164`]
- Lighthouse SEO category gates LCP/CLS but does not enforce the specific hreflang/sitemap requirements — those are exercised by `tests/e2e/seo*.spec.ts`. Do not weaken existing Lighthouse thresholds. [Source: `lighthouserc.json`]
- For the e2e sitemap/robots spec, prefer `npm run preview` (which serves `dist/client`) over `npm run dev` because the build-time generator writes to `dist/client`, not to the Vite dev server. If using `PLAYWRIGHT_BASE_URL`, point it at `http://localhost:4173` (Vite preview default) for that single spec.

### Project Structure Notes

- Expected NEW files:
  - `src/components/SEO.tsx` (hook + minimal component)
  - `src/components/SEO.test.tsx`
  - `src/lib/seo.ts` (canonical URL helper, locale maps, constants)
  - `src/lib/seo.test.ts`
  - `scripts/generate-seo-assets.mjs`
  - `public/robots.txt` (dev fallback; production copy is generated)
  - `public/og-default.png` (1200×630 brand placeholder)
  - `tests/e2e/seo.spec.ts`
  - `tests/e2e/seo-assets.spec.ts`
- Expected UPDATED files:
  - `index.html` (static head defaults)
  - `src/main.tsx` (`languageChanged` subscription)
  - `src/i18n/index.ts` (`querystring` detector)
  - `src/pages/Home.tsx` (hook call)
  - `src/pages/Privacy.tsx` (hook call)
  - `src/i18n/locales/en/translation.json`, `pt-BR/translation.json`, `es/translation.json` (new `seo` keys)
  - `package.json` (build script chains post-build generator)
  - `.env.example` (`VITE_SITE_URL`)
  - `tests/e2e/locale-switch.spec.ts` (extended assertion for `html[lang]` + title)
  - `playwright.config.ts` (only if a dedicated `preview` webServer block is needed for the sitemap/robots spec; otherwise leave untouched)
- Do not move section components, do not change the public route tree, do not introduce SSR, do not add new admin routes.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md:817`] — Story 3.3 ACs in epic
- [Source: `_bmad-output/planning-artifacts/prd.md:101`] — Phase 2 SEO scope
- [Source: `_bmad-output/planning-artifacts/prd.md:249`] — SEO deferred to Phase 2
- [Source: `_bmad-output/planning-artifacts/architecture.md:57`] — SPA SEO via meta tags decision
- [Source: `_bmad-output/planning-artifacts/architecture.md:945`] — Phase 2 SEO is additive only
- [Source: `vault/Planning/Architecture-Key.md:174`] — canonical locale flow
- [Source: `src/i18n/index.ts:11`] — current i18next detection config
- [Source: `src/main.tsx`] — bootstrap-time locale wiring
- [Source: `src/pages/Home.tsx`] — public route entry
- [Source: `src/pages/Privacy.tsx`] — privacy page entry
- [Source: `server/index.ts:62`] — express.static + SPA fallback ordering
- [Source: `package.json:8`] — current build chain
- [Source: `_bmad-output/implementation-artifacts/3-2-animations-micro-interactions.md:101`] — main-bundle isolation precedent
- [Source: `https://www.sitemaps.org/protocol.html`] — sitemap.xml schema
- [Source: `https://developers.google.com/search/docs/specialty/international/localized-versions`] — hreflang requirements
- [Source: `https://github.com/i18next/i18next-browser-languageDetector#detector-options`] — querystring detector option

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Red phase: `npm run test:run -- src/lib/seo.test.ts src/components/SEO.test.tsx` failed because `src/lib/seo.ts` and `src/components/SEO.tsx` did not exist yet.
- Green/refactor targeted validation: `npm run test:run -- src/lib/seo.test.ts src/components/SEO.test.tsx src/i18n/index.test.ts` passed (21 tests).
- Full validation: `npm run typecheck` passed.
- Full validation: `npm run test:run` passed (47 files, 251 tests).
- Build validation: `npm run build` passed and generated `dist/client/robots.txt`, `dist/client/sitemap.xml`, and copied `dist/client/og-default.png`.
- Static asset verification: inspected generated `robots.txt`, `sitemap.xml`, `og-default.png` metadata, and `dist/client/index.html` static head defaults.
- Browser/Lighthouse blocker: local server binding is blocked in this sandbox. `npm run dev` fails with `Error: listen EPERM: operation not permitted /tmp/tsx-1001/30.pipe`; direct `npx vite --host 127.0.0.1` fails with `Error: listen EPERM: operation not permitted 127.0.0.1:5173`. Playwright and LHCI require a local dev/preview server, so those runtime browser checks were not executable here.

### Completion Notes List

- Added public canonical origin configuration and TypeScript SEO helpers for canonical URLs, supported locales, `og:locale`, and `og:image`.
- Added locale-aware SEO translation keys for home and privacy in EN, PT-BR, and ES while preserving i18n key parity.
- Added a no-dependency `useDocumentMeta` hook that manages title, description, OG tags, canonical link, and hreflang alternates with `data-seo="managed"` tags.
- Wired `<html lang>` updates, querystring locale detection (`?lng=`), and route-level SEO hook calls for `/` and `/privacy`.
- Added admin-route head cleanup so direct `/admin/*` hydration does not retain public canonical/OG/hreflang tags from the SPA shell.
- Added build-time SEO asset generation for `sitemap.xml` and `robots.txt`, plus static `public/robots.txt` fallback and `public/og-default.png` placeholder.
- Added unit and browser test coverage for SEO helpers, head management, locale switching, page metadata, direct querystring locale activation, privacy indexability, admin cleanup, and generated SEO assets.

### File List

- `.env.example`
- `index.html`
- `package.json`
- `public/og-default.png`
- `public/robots.txt`
- `scripts/generate-seo-assets.mjs`
- `src/components/SEO.test.tsx`
- `src/components/SEO.tsx`
- `src/components/layout/AdminLayout.tsx`
- `src/i18n/index.test.ts`
- `src/i18n/index.ts`
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/es/translation.json`
- `src/i18n/locales/pt-BR/translation.json`
- `src/lib/seo.test.ts`
- `src/lib/seo.ts`
- `src/main.tsx`
- `src/pages/Home.story-1-6.e2e.test.tsx`
- `src/pages/Home.tsx`
- `src/pages/Privacy.tsx`
- `scripts/generate-seo-assets.test.mjs`
- `tests/e2e/locale-switch.spec.ts`
- `tests/e2e/seo-assets.spec.ts`
- `tests/e2e/seo.spec.ts`

### Change Log

- 2026-05-16: Implemented Story 3.3 SEO metadata, hreflang, canonical URL, sitemap, robots, OG image placeholder, locale detection, and test coverage; documented sandbox blocker for browser/Lighthouse server-bound checks.
- 2026-05-15 (review): Cross-model review (Claude reviewer). Findings: HIGH — `tests/e2e/seo-assets.spec.ts` was skipped by default (gated on `PLAYWRIGHT_BASE_URL`), leaving AC8(d) sitemap/robots structural assertions out of `npm run test:run`. Auto-patched: refactored `scripts/generate-seo-assets.mjs` to export `renderSitemap`, `renderRobots`, `canonicalUrl`, `resolveSiteUrl`, and `writeSeoAssets` (CLI entry preserved via `import.meta.url === process.argv[1]` guard); added `scripts/generate-seo-assets.test.mjs` covering sitemap schema, two-URL structure, full hreflang matrix (8 `<xhtml:link>` total), `lastmod` ISO format, absence of `/admin`, robots directives, and `VITE_SITE_URL` override paths. Suite now: 48 files, 257 tests passing. MEDIUM (deferred to Story 3.11) — EN canonical/og:url omits `?lng=en` while the `hreflang="en"` alternate emits it; deviates from self-referencing canonical convention. LOW — `useDocumentMeta` deps include the stable i18next instance reference; benign.
