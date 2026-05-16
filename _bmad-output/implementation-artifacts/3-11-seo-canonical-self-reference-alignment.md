# Story 3.11: SEO Canonical Self-Reference Alignment (Story 3.3 Review Follow-up)

Status: review

<!-- Created from Story 3.3 cross-model review (MEDIUM finding, 2026-05-15). Author: review automation. -->

## Story

As the SyncRevenue SEO owner,
I want each locale's `<link rel="canonical">` and `<meta property="og:url">` to match the corresponding `<link rel="alternate" hreflang="<locale>">` URL (including `?lng=en` for English),
so that search engines see a consistent self-referencing canonical for every language variant and don't dedupe or down-rank the English homepage.

## Background

Story 3.3 shipped per-route head management via `useDocumentMeta` (`src/components/SEO.tsx`). The hook computes an `activeCanonicalLocale(locale)` that returns `undefined` for `en` and the locale string for `pt-BR` / `es`, producing:

| Locale | canonical / og:url           | hreflang alternate                    |
|--------|------------------------------|---------------------------------------|
| en     | `https://syncsirius.com/`    | `https://syncsirius.com/?lng=en`      |
| pt-BR  | `https://syncsirius.com/?lng=pt-BR` | `https://syncsirius.com/?lng=pt-BR` |
| es     | `https://syncsirius.com/?lng=es` | `https://syncsirius.com/?lng=es`   |

PT-BR and ES self-reference correctly. EN does not. Google's hreflang guidance ([source](https://developers.google.com/search/docs/specialty/international/localized-versions#html)) recommends each language version's canonical URL match its own hreflang alternate, so search engines treat the EN variant as a first-class indexable page rather than a duplicate of the `x-default`.

This is a stylistic/SEO-quality deviation, not a functional bug. Address before Story 5.x production launch.

## Acceptance Criteria

1. **Given** the homepage `/` renders in EN, **when** the document `<head>` is inspected, **then** `<link rel="canonical">` and `<meta property="og:url">` both resolve to `https://syncsirius.com/?lng=en` (matching the `hreflang="en"` alternate exactly); PT-BR and ES values remain unchanged (`?lng=pt-BR`, `?lng=es`).

2. **Given** the Privacy page `/privacy` renders in EN, **when** the document `<head>` is inspected, **then** `<link rel="canonical">` and `<meta property="og:url">` both resolve to `https://syncsirius.com/privacy?lng=en`.

3. **Given** the build output exists, **when** `GET /sitemap.xml` is fetched, **then** each `<url>` entry's `<loc>` reflects the chosen canonical convention. Either:
   - **(A)** keep `<loc>` as the no-`lng` URL (current behaviour) and align only the runtime `<link rel="canonical">` to `?lng=en` for EN, OR
   - **(B)** move both `<loc>` and runtime canonical to `?lng=<locale>` consistently for every variant.

   The chosen approach is documented inline at the top of `scripts/generate-seo-assets.mjs` so future readers see the rationale.

4. **Given** automated tests run, **when** the unit and browser SEO suites execute, **then** EN canonical/og:url assertions in `src/components/SEO.test.tsx` and `tests/e2e/seo.spec.ts` (`expectHomeSeo` helper) are updated to expect `https://syncsirius.com/?lng=en` and `https://syncsirius.com/privacy?lng=en`; `scripts/generate-seo-assets.test.mjs` is updated if the `<loc>` convention changes; the full suite stays green (`npm run test:run` = 0 failures).

5. **Given** the change ships, **when** `npm run typecheck && npm run test:run && npm run build` are executed, **then** all three pass; `dist/client/sitemap.xml` and `dist/client/robots.txt` continue to generate with the expected structure; `og:locale` mapping (`en_US`, `pt_BR`, `es_ES`) and the four-tag hreflang block (`en`, `pt-BR`, `es`, `x-default`) remain untouched.

## Tasks / Subtasks

- [x] Subtask 1: Decide and document the `<loc>` convention (AC: 3)
  - [x] Pick approach (A) or (B) above. Default recommendation: (A) — keeps the sitemap `<loc>` clean and only changes runtime canonical/og:url so the per-locale self-reference is correct without touching the sitemap matrix.
  - [x] Record the decision and rationale in a 5-10 line comment block at the top of `scripts/generate-seo-assets.mjs`.

- [x] Subtask 2: Align EN canonical/og:url with hreflang in the runtime SEO hook (AC: 1, 2)
  - [x] Remove or invert `activeCanonicalLocale` in `src/components/SEO.tsx` so EN no longer strips the `?lng=en` query when building `canonicalUrl` for `<link rel="canonical">` and `<meta property="og:url">`.
  - [x] Confirm the alternates loop (`SEO_LOCALES.map(...)`) and the `x-default` link remain unchanged.

- [x] Subtask 3: If approach (B) is chosen, align sitemap `<loc>` (AC: 3)
  - [x] If approach (A), skip this subtask.
  - [x] If approach (B), update `renderSitemap` in `scripts/generate-seo-assets.mjs` so each `<loc>` becomes `canonicalUrl(route, 'en')` style for the default and remove the no-lng `x-default` ambiguity in the `<loc>`.

- [x] Subtask 4: Update unit and e2e assertions (AC: 4)
  - [x] `src/components/SEO.test.tsx`: change EN `canonicalLink()` and `meta[property="og:url"]` expectations to `https://syncsirius.com/?lng=en`.
  - [x] `tests/e2e/seo.spec.ts`: update the `og:url` ternary in `expectHomeSeo` so EN expects `?lng=en`; add/update the privacy EN assertion to `https://syncsirius.com/privacy?lng=en`.
  - [x] `scripts/generate-seo-assets.test.mjs`: only touch if approach (B) is taken.

- [x] Subtask 5: Static `index.html` defaults (AC: 1)
  - [x] Decide whether the pre-hydration `<link rel="canonical">` and `<meta property="og:url">` in `index.html` should also carry `?lng=en` to match runtime, or stay as the no-lng `x-default` and let hydration overwrite. Document the choice in the SEO hook comment block.

- [x] Subtask 6: Verification (AC: 5)
  - [x] Run `npm run typecheck`.
  - [x] Run `npm run test:run`.
  - [x] Run `npm run build`; manually inspect `dist/client/sitemap.xml` and `dist/client/index.html` for the agreed values.
  - [x] Update `vault/Code/Frontend.md` (SEO module note) and `vault/Planning/Architecture-Key.md` if the canonical convention is recorded as a project rule.

## Dev Notes

### Source Context

- Story 3.3 review identified this as a MEDIUM finding (cross-model review by Claude on 2026-05-15). [Source: `_bmad-output/implementation-artifacts/3-3-seo-metadata-meta-tags-og-hreflang-sitemap.md` Change Log entry]
- Google's hreflang and canonical guidance: each language variant should self-reference; the `x-default` is a fallback signal, not the canonical for the default locale. [Source: https://developers.google.com/search/docs/specialty/international/localized-versions]
- Current implementation: `src/components/SEO.tsx:72` `activeCanonicalLocale(locale)` returns `undefined` for `en`. This is the single source of the EN mismatch.

### Architecture Guardrails

- **No new runtime dependencies.** This is a one-line change in `src/components/SEO.tsx` plus test/assertion updates.
- **Do not change the four-tag hreflang block.** Alternates (`en`, `pt-BR`, `es`, `x-default`) must remain exactly as Story 3.3 emits them. Only canonical and `og:url` change.
- **Do not alter the `og:locale` map.** `en → en_US`, `pt-BR → pt_BR`, `es → es_ES` stays.
- **Do not introduce locale path prefixes or subdomains.** The `?lng=<locale>` discriminator remains the only URL signal of locale variant.

### References

- [Source: `src/components/SEO.tsx:72`] — `activeCanonicalLocale` (origin of mismatch)
- [Source: `src/components/SEO.tsx:103`] — runtime canonical link upsert
- [Source: `tests/e2e/seo.spec.ts:50-53`] — current EN `og:url` assertion
- [Source: `src/components/SEO.test.tsx:90-93`] — current EN canonical assertion
- [Source: `scripts/generate-seo-assets.mjs`] — sitemap `<loc>` rendering

## Dev Agent Record

### Change Log

- 2026-05-16 — Implementation (Claude Opus 4.7 1M):
  - Removed `activeCanonicalLocale` helper in `src/components/SEO.tsx`; `useDocumentMeta` now calls `getCanonicalUrl(path, locale)` directly so EN renders `<link rel="canonical">` and `<meta property="og:url">` as `https://syncsirius.com/?lng=en` (matches `hreflang="en"` alternate). PT-BR and ES unchanged.
  - Added approach-(A) decision comment block at the top of `scripts/generate-seo-assets.mjs` and to the SEO helper file. Sitemap `<loc>` stays no-lng (doubles as x-default); static `index.html` pre-hydration tags stay no-lng (acts as x-default before hydration).
  - Updated `src/components/SEO.test.tsx` EN canonical / og:url expectations to `?lng=en`.
  - Updated `tests/e2e/seo.spec.ts` `expectHomeSeo` so EN/PT-BR/ES og:url + canonical all expect `?lng=<locale>`; added EN canonical/og:url assertion to privacy page test.
  - `scripts/generate-seo-assets.test.mjs` untouched (approach A chosen).
  - Vault: added SEO canonical self-reference convention to `vault/Code/Frontend.md` (Key Patterns) and `vault/Planning/Architecture-Key.md` (Canonical Frontend Patterns section).
  - Verification: `npm run typecheck` PASS, `npm run test:run` PASS (326/326), `npm run build` PASS; `dist/client/sitemap.xml` matches expected approach-A output (4 hreflang alternates per route, no-lng `<loc>`). e2e Playwright suite not run in this step.
  - Status: review (awaiting cross-model code-review per CLAUDE.md).

### Implementation Notes

- Approach (A) selected as recommended in Subtask 1 default. Subtask 3 (sitemap `<loc>` changes) intentionally skipped.
- Pre-hydration `index.html` left at no-lng URL per Subtask 5 — minimizes drift between built static head and SSR-less expected SEO, and keeps the static file usable as a true x-default snapshot for crawlers that read it before JS hydrates.
