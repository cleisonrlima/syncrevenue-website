# Story 1.10: Privacy Policy Page

Status: done

## Story

As a visitor from Brazil or California,
I want to access a clear Privacy Policy explaining what data is collected and my rights,
so that I can make an informed decision before submitting my personal information.

## Acceptance Criteria

1. Given a visitor navigates to `/privacy`, when `Privacy.tsx` renders, then the page displays: data collected (name, email, company, phone, role, GDS system, message), storage method (secured SQLite, admin-only access), data retention (24 months from submission date), data removal contact, LGPD and CCPA coverage; GDS credentials explicitly noted as never collected by the website.

2. Given active locale is `pt-BR`, when `/privacy` renders, then all content displays in PT-BR from the pt-BR translation file; route is `/privacy` (not `/pt-BR/privacy`) -- single route, i18n-driven content.

3. Given a visitor changes locale on the Privacy Policy page, when `LanguageSwitcher` fires, then Privacy Policy content updates to the new locale without navigation or page reload; scroll position is not reset.

4. Given the Privacy Policy link in the footer, when a visitor clicks it, then React Router navigates to `/privacy` without full page reload; browser back returns to home.

5. Given the Privacy Policy content, when inspected for compliance, then it states: no analytics/tracking cookies at MVP, only functional cookies; lead data deleted after 24 months; all three locale versions convey identical legal commitments.

## Tasks / Subtasks

- [x] Task 0: Confirm current state before editing (AC: all)
  - [x] Read `src/pages/Privacy.tsx`, `src/App.tsx`, `src/components/layout/Footer.tsx`, `src/i18n/LanguageSwitcher.tsx`, `src/i18n/index.ts`, and all three locale files.
  - [x] Preserve the existing route: `App.tsx` already maps `/privacy` to `Privacy`.
  - [x] Preserve the footer `Link to="/privacy"` behavior; do not replace it with a plain anchor.
  - [x] Do not add locale-prefixed routes such as `/pt-BR/privacy`, backend endpoints, database migrations, cookie banners, analytics, or admin work.

- [x] Task 1: Expand the Privacy page component (AC: 1, 2, 3, 5)
  - [x] Replace the current thin paragraph loop in `src/pages/Privacy.tsx` with a complete policy page that renders structured i18n content.
  - [x] Keep all visible policy copy in translation JSON; JSX may use only stable structure and non-visible constants.
  - [x] Render a semantic page with one `h1`, section headings as `h2`, and readable body copy/lists.
  - [x] Include a clear effective/last-updated line from `privacy.lastUpdated`.
  - [x] Add sections for: collected data, purpose/use, storage and access, retention/deletion, cookies, GDS credential exclusion, LGPD rights, CCPA rights, data removal/contact.
  - [x] Keep the page responsive with no horizontal overflow at 375px; use the existing public layout rhythm (`max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8`).

- [x] Task 2: Update privacy translations in EN/PT-BR/ES (AC: 1, 2, 3, 5)
  - [x] Update `src/i18n/locales/en/translation.json`.
  - [x] Update `src/i18n/locales/pt-BR/translation.json`.
  - [x] Update `src/i18n/locales/es/translation.json`.
  - [x] Keep identical `privacy` key structure across all three locales.
  - [x] Ensure the data collected list explicitly covers the AC-required fields: `name`, `email`, `company`, `phone`, `role`, `GDS system`, and `message`.
  - [x] Also disclose fields the implemented forms collect beyond the AC minimum, including contact subject/service selection and active submission locale where applicable.
  - [x] State that lead data is stored in secured SQLite and accessible only to authenticated/admin-only users.
  - [x] State the 24-month retention period from submission date and deletion after that period.
  - [x] State the data removal/privacy contact. Existing source copy uses `privacy@syncsirius.com`; keep that unless the project owner supplies another address.
  - [x] State no analytics/tracking cookies at MVP and only functional cookies in scope.
  - [x] State that GDS credentials are never collected by the website and that SyncRevenue product integrations are separate from website lead collection.
  - [x] Ensure EN/PT-BR/ES convey the same legal commitments, not merely similar marketing copy.

- [x] Task 3: Preserve routing, footer, and locale behavior (AC: 2, 3, 4)
  - [x] Keep `/privacy` as the only privacy route.
  - [x] Keep `Navbar` and `Footer` present around the page through the existing `App` shell.
  - [x] Verify clicking the footer Privacy Policy link uses React Router navigation without a full reload.
  - [x] Verify browser back returns from `/privacy` to `/`.
  - [x] Verify changing language on `/privacy` updates content in place and does not change `window.location.pathname`.
  - [x] Avoid code that calls `window.scrollTo`, changes hash, or remounts the route on language change; scroll position must not reset when only locale changes.

- [x] Task 4: Accessibility and UX polish (AC: 1, 3, 5)
  - [x] Use semantic landmarks inherited from `App.tsx` (`main#main-content`) and a well-structured article/section layout inside `Privacy.tsx`.
  - [x] Ensure link text for the privacy contact is accessible and has a `mailto:` target if rendered as a link.
  - [x] Keep text contrast WCAG AA on the chosen background.
  - [x] Avoid card nesting; if using cards, use them only for individual policy blocks.
  - [x] Keep body copy calm and specific; this is legal/trust copy, not sales copy.

- [x] Task 5: Tests (AC: all)
  - [x] Add `src/pages/Privacy.test.tsx` or `src/pages/Privacy.story-1-10.e2e.test.tsx`.
  - [x] Test `/privacy` renders required EN commitments: collected fields, secured SQLite/admin-only access, 24-month retention, removal contact, LGPD, CCPA, functional cookies only, and no website collection of GDS credentials.
  - [x] Test `pt-BR` content renders on the same `/privacy` path.
  - [x] Test language switching on `/privacy` updates policy copy without navigation or path change.
  - [x] Test scroll position is not reset by language switching; mock/set `window.scrollY` or spy on `window.scrollTo` as appropriate for jsdom.
  - [x] Test footer Privacy Policy navigation from `/` to `/privacy` and browser back to `/` using `MemoryRouter`/`userEvent`.
  - [x] Extend `src/i18n/index.test.ts` with a privacy translation contract asserting all three locales expose the same required policy sections and critical commitments.
  - [x] Run `npm run typecheck` and `npm run test:run`.

## Dev Notes

### Current File States

| File | Current State | Required Action |
| --- | --- | --- |
| `src/pages/Privacy.tsx` | Existing route page with `useTranslation()`, dark background, `h1`, last updated, intro, and a hardcoded list of five section keys. Content is too thin for Story 1.10. | Expand to full policy structure driven by i18n. |
| `src/App.tsx` | Already wraps app with `Navbar`, `main#main-content`, `ErrorBoundary`, routes `/` and `/privacy`, and renders `Footer`. | Preserve route and shell; add tests only unless a bug is found. |
| `src/components/layout/Footer.tsx` | Uses React Router `<Link to="/privacy">` for privacy navigation. | Preserve client-side navigation. |
| `src/i18n/locales/*/translation.json` | `privacy` namespace exists but omits role, GDS system, message, storage method, LGPD/CCPA rights, cookie statement, and full removal-right language. | Expand the namespace consistently across EN/PT-BR/ES. |
| `src/i18n/LanguageSwitcher.tsx` | Calls `i18next.changeLanguage()`, updates `useLocaleStore`, and writes `i18nextLng` to localStorage. | Reuse as-is; Privacy page should react to i18n changes without route changes. |
| `src/i18n/index.ts` | Supports `en`, `pt-BR`, and `es`; detects localStorage then navigator. | No changes expected. |

### Architecture Compliance

- Stack is React 18.3.1, React Router 7.15.0, Vite 5.4.21, TypeScript strict, Tailwind CSS 3.4.19, i18next 23.16.8, react-i18next 14.1.3, and Vitest 4.1.6 from `package.json`.
- Privacy Policy is a single `/privacy` route with i18n-driven content and no locale in URL. Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`.
- `src/pages/Privacy.tsx` maps to FR26-FR27. Source: `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`.
- All user-visible strings must come from i18n translation JSON. Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`.
- Co-locate tests with source/page files; do not create `__tests__/` directories. Source: `_bmad-output/planning-artifacts/architecture.md#Structure Patterns`.
- No new library is needed. Do not add a legal markdown parser, CMS, cookie consent package, analytics package, or route plugin for this story.

### Required Policy Content

The policy must clearly state:

- Website forms collect personal/contact and inquiry fields only: name, email, company, phone, role, GDS system, message, contact subject/service selection, and active submission locale where applicable.
- The website does not collect GDS credentials or booking data; SyncRevenue product integrations are separate from website lead capture.
- Lead data is stored in secured SQLite and is accessible only through authenticated/admin-only access.
- Lead data from demo requests and contact submissions is retained for 24 months from submission, then deleted.
- Privacy/data removal requests go to `privacy@syncsirius.com` unless product ownership supplies a different address.
- MVP has no analytics/tracking cookies and uses only functional cookies.
- LGPD coverage for Brazil and CCPA coverage for California residents must be named explicitly.
- Data subject/consumer rights must be presented in plain language: access/know, correction, deletion/removal, portability or information where applicable, and contact path for exercising rights.

### Legal and Compliance Guardrails

- This story is implementation guidance, not legal advice. Do not invent legal promises beyond the PRD/epic requirements without owner/legal approval.
- Do not claim certified compliance, SOC 2 completion, sale opt-out flows, data-sharing restrictions, or automated deletion jobs unless the implementation/source docs prove them.
- The policy may say Sync Sirius does not sell personal data only if product ownership confirms that remains true; the current locale copy already says it, but tests should focus on story-required commitments.
- If implementation discovers backend retention deletion is not automated yet, the Privacy Policy can still disclose the retention rule, but dev notes should flag any automation gap for the relevant backend/deployment story.

### UX Guardrails

- Privacy Policy is a trust and compliance page for visitors like Ricardo before submitting personal information. It should feel calm, specific, and readable.
- Keep the route inside the normal app shell so global navigation and language switching are available.
- Do not make Privacy a modal; architecture explicitly requires a routable page.
- Keep the page content scannable. Preferred structure: intro, policy sections, rights/contact area.
- Avoid marketing claims inside the policy; this page should explain handling, rights, retention, and contact path.

### Previous Story Intelligence

- Story 1.9 strengthened the trust sequence and added explicit data separation copy. Reuse the same substance in Privacy: website lead capture is separate from SyncRevenue product processing, and GDS credentials never touch the website.
- Story 1.9 also showed that legal/trust content can become blocked if claims require owner-approved specifics. For Story 1.10, do not fabricate compliance posture or data practices beyond source requirements.
- Story 1.8 established translation-array normalization for complex repeated content. For Privacy, prefer a stable explicit object shape or a simple array of sections from translation data. If using arrays from `t(..., { returnObjects: true })`, validate them defensively before rendering.
- Recent commits show the project pattern: focused story tests, i18n contract tests, and `npm run typecheck` plus `npm run test:run` before completion.

### Latest Legal Context Checked

- California OAG CCPA guidance says a notice at collection must list personal-information categories and purposes, and link to a fuller privacy policy describing privacy practices and rights. Source: https://oag.ca.gov/privacy/ccpa
- Brazil government LGPD guidance describes data subject rights including confirmation of processing, access, correction, anonymization/blocking/elimination, portability, consent information, revocation, and review of automated decisions. Source: https://www.gov.br/capes/en/access-to-information/privacy-and-personal-data-protection/rights-of-data-subjects
- ANPD privacy notice guidance uses categories directly relevant to this page: data types, purpose/use, cookies, storage, sharing, deletion, security, and data subject rights. Source: https://www.gov.br/anpd/pt-br/acesso-a-informacao/aviso-de-privacidade/aviso-de-privacidade
- Use these only to strengthen clarity around the story's required content. The repo PRD and epics remain the acceptance source of truth.

### Recommended Implementation Shape

Use a typed section list in `Privacy.tsx` so the structure is explicit and testable:

```typescript
const policySections = [
  'dataCollection',
  'dataUse',
  'storageAccess',
  'dataRetention',
  'cookies',
  'gdsData',
  'lgpdRights',
  'ccpaRights',
  'contact',
] as const
```

If a section needs bullets, keep the body as i18n arrays and render them as `<ul>` after validating `returnObjects: true` output. Do not hardcode English bullet text in JSX.

### Project Structure Notes

- No `project-context.md` file was found during workflow activation.
- Story 1.10 is a public trust/compliance page only. It should not touch `server/`, `data/`, admin routes, or form submission behavior unless tests reveal a routing-shell regression.
- Existing footer and route wiring already satisfy part of AC4; the primary implementation risk is incomplete policy copy and weak tests.
- The architecture route-tree line says Home has lazy sections and `/privacy` is a regular page; do not lazy-load Privacy unless you update tests and preserve route behavior.

### References

- Story and AC: `_bmad-output/planning-artifacts/epics.md#Story 1.10: Privacy Policy Page`
- FR26-FR27: `_bmad-output/planning-artifacts/epics.md#Functional Requirements`
- Compliance requirements: `_bmad-output/planning-artifacts/prd.md#Domain-Specific Requirements`
- Privacy route architecture: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`
- Requirements mapping: `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`
- Current code: `src/pages/Privacy.tsx`, `src/App.tsx`, `src/components/layout/Footer.tsx`, `src/i18n/LanguageSwitcher.tsx`, `src/i18n/index.ts`, `src/i18n/locales/*/translation.json`
- Prior story context: `_bmad-output/implementation-artifacts/1-9-security-client-references-sections.md`
- External legal context checked: California OAG CCPA page (https://oag.ca.gov/privacy/ccpa), Brazil CAPES LGPD rights page (https://www.gov.br/capes/en/access-to-information/privacy-and-personal-data-protection/rights-of-data-subjects), Brazil ANPD Privacy Notice page (https://www.gov.br/anpd/pt-br/acesso-a-informacao/aviso-de-privacidade/aviso-de-privacidade)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test:run -- src/pages/Privacy.test.tsx src/i18n/index.test.ts` (red phase): failed against pre-story implementation due missing structured article/sections and incomplete policy commitments.
- `npm run test:run -- src/pages/Privacy.test.tsx src/i18n/index.test.ts` (green phase): 14 tests passed.
- `npm run typecheck`: passed.
- `npm run test:run`: 19 test files passed, 84 tests passed.
- `npm run test:run -- src/pages/Privacy.story-1-10.e2e.test.tsx src/pages/Privacy.test.tsx src/i18n/index.test.ts` (QA automation): 17 tests passed.
- `npm run test:run` (QA automation): 20 test files passed, 87 tests passed.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Validation note: current `Privacy.tsx` and locale content are insufficient for AC1/AC5; implementation must expand both page structure and translations.
- Validation note: route and footer link already exist; implementation should preserve them and prove behavior with tests.
- Implemented a structured, semantic Privacy page driven by the shared `privacy.sections` i18n contract, with one h1, h2 policy sections, bullet support, and an accessible `mailto:` privacy contact.
- Expanded EN, PT-BR, and ES policy copy with identical legal commitments for collected lead fields, secured SQLite/admin-only access, 24-month retention/deletion, functional cookies only, GDS credential exclusion, LGPD rights, CCPA rights, and data removal contact.
- Added page tests for English commitments, PT-BR on the single `/privacy` route, in-place language switching without path/scroll reset, and footer client-side navigation/back behavior.
- Added an i18n translation contract test that verifies all three locales expose the same required privacy sections and critical policy commitments.
- QA automation generated a Story 1.10 E2E visitor-flow test covering the `/privacy` route, EN/PT-BR/ES locale switching, scroll/path preservation, required policy commitments, footer navigation, and browser back behavior.
- QA automation summary saved to `_bmad-output/implementation-artifacts/tests/test-summary.md`.

### File List

- `_bmad-output/implementation-artifacts/1-10-privacy-policy-page.md`
- `_bmad-output/implementation-artifacts/tests/test-summary.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/pages/Privacy.tsx`
- `src/pages/Privacy.story-1-10.e2e.test.tsx`
- `src/pages/Privacy.test.tsx`
- `src/i18n/index.test.ts`
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/pt-BR/translation.json`
- `src/i18n/locales/es/translation.json`

### Change Log

- 2026-05-15: Expanded the Privacy Policy page and locale policy content to satisfy Story 1.10 compliance, routing, locale, accessibility, and test requirements.
- 2026-05-15: Added QA-generated Story 1.10 E2E coverage and test automation summary.
- 2026-05-15: Senior Developer Review (AI) completed — 0 critical findings; 2 medium findings auto-fixed (indexed React keys for translation body items in `Privacy.tsx`; tightened 24-month retention regex in `src/i18n/index.test.ts`). Story status promoted to done.

## Senior Developer Review (AI)

**Reviewer:** xillinha
**Date:** 2026-05-15
**Outcome:** Approve

### Summary

All five Acceptance Criteria validated against implementation. AC1 fully covered: collected data fields (name, email, company, phone, role, GDS system, message) plus storage method (secured SQLite, admin-only), 24-month retention from submission date, data removal contact (`privacy@syncsirius.com`), LGPD/CCPA explicit, GDS credential exclusion explicit. AC2 verified: `/privacy` single-route i18n-driven content. AC3 verified: in-place locale switch with no path change and no `window.scrollTo` invocation. AC4 verified: footer `<Link to="/privacy">` client-side navigation and browser back returns to `/`. AC5 verified: "no analytics or tracking cookies" / "only functional cookies" disclosed in all three locales with parallel legal commitments.

### Git vs Story File List

- Story File List matches modified/created source files. The story-automator orchestration file under `_bmad-output/story-automator/` is excluded from review scope per workflow rules.

### Findings

- 🔴 CRITICAL: 0
- 🟡 MEDIUM (2, auto-fixed):
  - `src/pages/Privacy.tsx` — body-item React keys derived from translation text; replaced with `${sectionKey}-body-${index}` to defend against duplicate-string collisions if locale copy ever repeats.
  - `src/i18n/index.test.ts` — privacy contract retention assertion `/24/` was too weak; tightened to `/24\s+(months|meses)/i` so the test would actually fail if retention copy regressed.
- 🟢 LOW (1, not fixed): `Privacy.tsx` single-item branch still maps over a 1-element array. Cosmetic; behavior is correct.

### Quality Checks

- `npm run typecheck` — pass
- `npm run test:run` — 20 files / 87 tests pass
- Coverage maps 1:1 to AC1-AC5 across unit, page-level, and E2E story tests.
