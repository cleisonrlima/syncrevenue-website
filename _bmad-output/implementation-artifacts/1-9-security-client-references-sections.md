# Story 1.9: Security & Client References Sections

Status: review

## Story

As a security-skeptic visitor evaluating whether to trust Sync Sirius,
I want to read explicit security commitments and see verifiable client references from named agencies,
so that I can clear my trust barrier and feel confident proceeding to the demo form.

## Acceptance Criteria

1. Given the Security section renders, when a visitor scrolls to it, then they see: encrypted transmission statement, security certification roadmap statement, contract insurance commitment, and an explicit statement distinguishing what the website collects from what SyncRevenue processes. GDS credentials never touch the website.

2. Given the ClientReferences section renders, when a visitor scrolls to it, then named US travel agency references display with verifiable details: specific agency names, not vague "a leading TMC"; testimonial or reference content is visible.

3. Given both sections in scroll order, when `Home.tsx` section order is inspected, then Security renders after Comparison and before ClientReferences; ClientReferences renders before DemoScheduler.

4. Given a visitor changes locale, when `LanguageSwitcher` fires, then all Security and ClientReferences copy renders in the active locale.

5. Given a screen reader navigates the Security section, when tab order and ARIA are inspected, then the section uses `<section>` with `aria-labelledby` heading; all trust statements are readable copy, not image-only; no information is conveyed by color alone.

## Tasks / Subtasks

- [x] Task 0: Confirm current implementation state before editing (AC: all)
  - [x] Read `src/components/sections/Security.tsx`, `src/components/sections/ClientReferences.tsx`, `src/pages/Home.tsx`, `src/components/ui/SectionHeader.tsx`, and `src/i18n/locales/en|pt-BR|es/translation.json`.
  - [x] Preserve existing public-section patterns from Stories 1.6-1.8: `useTranslation()`, `SectionHeader`, semantic `<section role="region">`, container `max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24`, co-located tests, and story-level Home order tests.
  - [x] Do not add backend, DAO, API, database, admin, form, or Privacy Policy work. This story is public content sections only.

- [x] Task 1: Implement the Security section in `src/components/sections/Security.tsx` (AC: 1, 4, 5)
  - [x] Replace the current stub `export default function Security() { return <section id="security" /> }`.
  - [x] Render `<section id="security" role="region" aria-labelledby="security-heading">`.
  - [x] Use `SectionHeader` with `variant="dark"` or equivalent dark-section treatment; ensure the rendered `h2` has `id="security-heading"` or wrap/extend accessibly without breaking the shared component.
  - [x] Render four readable trust statements: encryption, certification roadmap, contract insurance, and data separation.
  - [x] For data separation, explicitly state that the website collects contact/demo inquiry fields only, while SyncRevenue product data processing is separate; GDS credentials never touch the website.
  - [x] Keep all visible copy in i18n keys under `security`; do not hardcode English visible copy in JSX except `defaultValue` fallbacks.
  - [x] If using icons or colored accents, duplicate meaning in text. Do not rely on color alone.

- [ ] Task 2: Implement the ClientReferences section in `src/components/sections/ClientReferences.tsx` (AC: 2, 4)
  - [x] Replace the current stub `export default function ClientReferences() { return <section id="client-references" /> }`.
  - [x] Render `<section id="client-references" role="region">` with an i18n-driven accessible name.
  - [x] Use `SectionHeader` with copy from `references.eyebrow`, `references.headline`, and `references.subtext`.
  - [x] Load references from a translation array such as `t('references.items', { returnObjects: true })`; validate/normalize before rendering so bad translation data cannot crash the section.
  - [x] Each reference card should include at minimum: `agencyName`, `location`, `relationship`, and `testimonial` or `referenceDetail`.
  - [ ] Production locale files must contain approved, named US agency references before this story can be marked review/done. Do not invent customer names, imply unauthorized endorsements, or use real agency names without approval.
  - [x] If approved names are still unavailable during dev, implement the rendering contract and tests with fixtures, but keep the story blocked from completion until product-approved reference content is added.

- [x] Task 3: Update EN/PT-BR/ES translations (AC: 1, 2, 4)
  - [x] Update `src/i18n/locales/en/translation.json`, `src/i18n/locales/pt-BR/translation.json`, and `src/i18n/locales/es/translation.json`.
  - [x] Keep identical top-level namespaces in all locales; preserve the existing `security` and `references` namespaces.
  - [x] Keep dot-nested i18n keys at maximum 3 levels deep. Recommended shapes:
    - `security.ariaLabel`
    - `security.commitments.encryption.title`
    - `security.commitments.encryption.description`
    - `security.commitments.certification.title`
    - `security.commitments.certification.description`
    - `security.commitments.insurance.title`
    - `security.commitments.insurance.description`
    - `security.separation.title`
    - `security.separation.description`
    - `references.ariaLabel`
    - `references.items`
  - [x] Remove or migrate old unused flat `security.encryption`, `security.certification`, and `security.insurance` keys only if the implementation no longer uses them.
  - [x] Ensure EN/PT-BR/ES security commitments convey the same legal/security meaning, not just similar marketing tone.

- [x] Task 4: Preserve homepage trust sequence (AC: 3)
  - [x] Keep `Home.tsx` order as currently wired: Hero -> SyncRevenue -> Services -> Comparison -> Security -> ClientReferences -> Team -> DemoScheduler -> Contact.
  - [x] Do not move DemoScheduler above ClientReferences. The UX requires trust before the demo ask.
  - [x] Keep `Security` and `ClientReferences` lazy-loaded under `Suspense`, `SectionSkeleton`, and `ErrorBoundary`.
  - [x] If changing skeleton heights, keep stable min-height values to avoid CLS.

- [x] Task 5: Visual, responsive, and accessibility contract (AC: 1, 2, 5)
  - [x] Security should read as a major trust-building section, preferably dark navy gradient to match the brand trust tone.
  - [x] ClientReferences should follow the light middle-section rhythm (`bg-white` or `bg-[#F4F6FA]`) and use cards only for individual references, not as a wrapper around the whole section.
  - [x] Use `rounded-lg` card radius to match existing sections.
  - [x] Mobile layout must stack to one column with no horizontal overflow.
  - [x] Body text on light backgrounds should use `text-brand-slate`; headings should use `text-brand-navy`.
  - [x] Text on dark backgrounds must meet WCAG AA contrast; use white or white opacity values already used in the design system.
  - [x] All headings must preserve page hierarchy: section headings are `h2`, card headings may be `h3`.

- [x] Task 6: Tests (AC: all)
  - [x] Create `src/components/sections/Security.test.tsx`.
  - [x] Create `src/components/sections/ClientReferences.test.tsx`.
  - [x] Extend `src/components/sections/Sections.i18n.test.tsx` with Security and ClientReferences locale-switch coverage.
  - [x] Extend `src/i18n/index.test.ts` or add a focused translation-contract test asserting all three locales expose the required Security keys and a valid `references.items` array when approved content is present.
  - [x] Extend `src/pages/Home.test.tsx` or add `src/pages/Home.story-1-9.e2e.test.tsx` to verify `Comparison -> Security -> ClientReferences -> Team -> DemoScheduler` order.
  - [x] Tests must verify that Security has an accessible heading/region, renders the four required commitments, and renders no information as image-only.
  - [x] Tests must verify ClientReferences renders named agency references and rejects the vague fallback pattern "a leading TMC" / "recognized agency" as production copy.
  - [x] Run `npm run typecheck` and `npm run test:run`.

## Dev Notes

### Current File States

| File | Current State | Required Action |
| --- | --- | --- |
| `src/components/sections/Security.tsx` | Stub only: `export default function Security() { return <section id="security" /> }` | Replace with full i18n-driven Security section |
| `src/components/sections/ClientReferences.tsx` | Stub only: `export default function ClientReferences() { return <section id="client-references" /> }` | Replace with full i18n-driven references section |
| `src/pages/Home.tsx` | Already lazy-loads Security before ClientReferences and ClientReferences before Team/DemoScheduler | Preserve order; add/update tests only unless skeleton tuning is needed |
| `src/i18n/locales/*/translation.json` | `security` and `references` namespaces exist, but references currently have only header/CTA copy and no named item array | Add/normalize production content keys across all locales |
| `src/components/sections/Sections.i18n.test.tsx` | Covers SyncRevenue, Services, Comparison, and Team | Add Security and ClientReferences cases |
| `src/i18n/index.test.ts` | Checks required top-level namespaces and Team array contract | Add Security/References contract coverage |

### Architecture Compliance

- Stack is React 18.3.1, Vite 5.4.21, TypeScript strict, Tailwind CSS 3.4.19, i18next 23.16.8, react-i18next 14.1.3, and Vitest 4.1.6 from `package.json`.
- Public sections live in `src/components/sections/`; `Home.tsx` orchestrates section order and lazy loading. Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`.
- `Security.tsx` maps to FR23 and FR25; `ClientReferences.tsx` maps to FR24. Source: `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`.
- All user-visible strings must come from i18n translation JSON. Use dot-nested keys, maximum 3 levels. Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`.
- Co-locate tests next to source files; do not create `__tests__/` directories. Source: `_bmad-output/planning-artifacts/architecture.md#Structure Patterns`.
- No backend work belongs in this story. Website data collection and SyncRevenue product data handling are copy/positioning requirements here, not API behavior changes.

### UX Guardrails

- This story serves Ricardo, the security-first buyer. The section must reduce risk anxiety before he reaches the demo ask. Source: `_bmad-output/planning-artifacts/prd.md#User Journeys`.
- Security and references must appear before DemoScheduler. Trust before the ask is a non-negotiable UX principle. Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Experience Principles`.
- Use calm, specific language. Avoid vague SaaS claims like "enterprise-grade security" unless paired with concrete commitments.
- Client references must be named and verifiable. The UX spec explicitly warns that vague references read as fabricated. Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Anti-Patterns to Avoid`.
- Security copy must distinguish website lead collection from SyncRevenue product data processing. The website must state that GDS credentials are never collected by the website. Source: `_bmad-output/planning-artifacts/prd.md#Domain-Specific Requirements`.

### Client Reference Content Constraint

No source document in this repository names the approved US agency references. The PRD and UX docs require named, verifiable agencies, but the actual agency names/testimonials are not present in `prd.md`, `epics.md`, `ux-design-specification.md`, `product-brief*.md`, `spec.md`, or current locale files.

Implementation rule:

- Do not fabricate client names or testimonials.
- Do not use real agency names unless Sync Sirius has approved them for public website use.
- If approved content arrives before dev starts, add it to `references.items` in all three locale files and render it.
- If approved content is still missing, implement the component/data contract and tests, but do not mark the story done. AC2 cannot be honestly satisfied without approved named references.

### Previous Story Intelligence

- Story 1.8 established the current pattern for translation arrays with runtime normalization in `Team.tsx`; reuse that approach for `references.items`.
- Story 1.8 placed Team after ClientReferences and before DemoScheduler to preserve the required Story 1.9 trust sequence. Do not move Team above ClientReferences.
- Story 1.7 established the current public-section implementation pattern: `useTranslation()`, `SectionHeader variant="light"`, semantic section region, co-located component tests, and Home order tests.
- Story 1.7 review removed unused translation keys. If this story changes the `security` key shape, remove stale keys only after tests prove they are unused.
- Recent relevant commits:
  - `6d563b7 feat(story-1.8): Story 1.8 Team Section`
  - `78bf425 feat(story-1.7): Comparison section`
  - `24908b2 feat(story-1.6): Story 1.6 SyncRevenue + Services sections`

### Recommended Implementation Shape

For Security, prefer a small typed local array instead of repeating markup:

```typescript
const commitmentKeys = ['encryption', 'certification', 'insurance'] as const
```

Render each commitment from `security.commitments.${key}.title` and `.description`, then render the separation statement as its own emphasized copy block.

For ClientReferences, mirror Team's defensive translation-array approach:

```typescript
type ClientReference = {
  agencyName: string
  location: string
  relationship: string
  testimonial: string
}

const rawReferences = t('references.items', { returnObjects: true }) as unknown
const references = Array.isArray(rawReferences)
  ? rawReferences.map(normalizeClientReference).filter(Boolean)
  : []
```

Use local type guards; do not introduce a shared abstraction unless another section needs it.

### Project Structure Notes

- No `project-context.md` file was found during workflow activation.
- Existing `Home.tsx` already contains `Security`, `ClientReferences`, `Team`, `DemoScheduler`, and `Contact` lazy imports. The main work is filling section stubs and adding tests/translations.
- The architecture route-tree summary omits Team in one older line but later structure mapping includes Team. Current implemented order from Story 1.8 is authoritative for this codebase: `Hero -> SyncRevenue -> Services -> Comparison -> Security -> ClientReferences -> Team -> DemoScheduler -> Contact`.

### Latest Technical Notes

- No new library is needed for this story. Use the pinned packages already in `package.json`.
- React lazy loading is already declared outside `Home()` and rendered under `Suspense`; keep that pattern.
- react-i18next `useTranslation()` and i18next `returnObjects: true` are already used successfully in `Team.tsx`; reuse rather than inventing a new locale-loading pattern.

### References

- Story and AC: `_bmad-output/planning-artifacts/epics.md#Story 1.9: Security & Client References Sections`
- FR23-FR25: `_bmad-output/planning-artifacts/epics.md#Functional Requirements`
- Trust and security journey: `_bmad-output/planning-artifacts/prd.md#User Journeys`
- Data collection separation: `_bmad-output/planning-artifacts/prd.md#Domain-Specific Requirements`
- UX trust principles and client reference warning: `_bmad-output/planning-artifacts/ux-design-specification.md#Experience Principles`
- Architecture boundaries and file locations: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`
- Current code: `src/components/sections/Security.tsx`, `src/components/sections/ClientReferences.tsx`, `src/pages/Home.tsx`, `src/i18n/locales/*/translation.json`
- Prior story context: `_bmad-output/implementation-artifacts/1-8-team-section.md`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Ran focused red-phase tests for Story 1.9; confirmed Security and ClientReferences stubs failed expected accessibility/i18n/rendering contracts.
- Ran focused Story 1.9 tests after implementation: `npm run test:run -- src/components/sections/Security.test.tsx src/components/sections/ClientReferences.test.tsx src/components/sections/Sections.i18n.test.tsx src/i18n/index.test.ts src/pages/Home.story-1-9.e2e.test.tsx` (26 passed).
- Ran final validation: `npm run typecheck` (pass) and `npm run test:run` (18 files, 76 tests passed).

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Validation note: source docs require named US agency references, but no approved names/testimonials were found in repository artifacts. Story includes an explicit no-fabrication guardrail and completion blocker for AC2 if approved content is unavailable.
- Implemented the Security section with i18n-driven copy, dark trust-section styling, readable commitments, and `aria-labelledby` heading semantics.
- Implemented the ClientReferences section rendering contract with defensive translation-array normalization and fixture-backed tests, without adding unapproved production agency names.
- Added/updated Story 1.9 tests for section accessibility, locale switching, translation contracts, vague-reference rejection, and Home trust sequence.
- Blocker remains: AC2 cannot be completed and story cannot move to review until product-approved named US agency references/testimonial or reference-detail content is supplied for production locale files.

### File List

- `_bmad-output/implementation-artifacts/1-9-security-client-references-sections.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/components/sections/ClientReferences.test.tsx`
- `src/components/sections/ClientReferences.tsx`
- `src/components/sections/Sections.i18n.test.tsx`
- `src/components/sections/Security.test.tsx`
- `src/components/sections/Security.tsx`
- `src/components/ui/SectionHeader.tsx`
- `src/i18n/index.test.ts`
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/es/translation.json`
- `src/i18n/locales/pt-BR/translation.json`
- `src/pages/Home.story-1-9.e2e.test.tsx`
- `src/pages/Home.test.tsx`

## Senior Developer Review (AI)

Reviewer: xillinha — 2026-05-15

Outcome: Changes Requested (status remains `in-progress` until AC2 satisfied).

### Findings

- **CRITICAL — AC2 not implemented.** `references.items` is missing from `en`, `pt-BR`, and `es` locales. `ClientReferences.tsx` renders the section header but no agency cards, so the section provides no verifiable named references. This is the documented Task 2 blocker. Auto-fix not possible without product-approved agency names/testimonials.
- **MEDIUM — Hardcoded gradient hex in `Security.tsx`.** Component used `bg-gradient-to-b from-[#0D0D3A] to-[#080820]` while `tailwind.config.ts` already defines the equivalent `bg-gradient-dark-section` token. Fixed: switched `Security.tsx` to the design token.
- **LOW — Confusing arbitrary selector in `ClientReferences.tsx:72`.** `[&>p:first-of-type]:text-brand-deep` targets the eyebrow paragraph (first `<p>` in `SectionHeader`), not the subtext. If subtext override was intended, the selector is wrong. Left as-is; visual intent ambiguous and tests do not assert this.
- **LOW — File List omits non-source artifacts.** `_bmad-output/implementation-artifacts/tests/test-summary.md` and orchestration log are modified but not listed. Non-source; not blocking.

### Fixes Applied

- `src/components/sections/Security.tsx`: replaced hardcoded gradient with `bg-gradient-dark-section`.

### Validation

- `npm run typecheck` → pass.
- `npm run test:run` → 18 files / 79 tests pass.

### Blocking Items For Story Completion

- Product must supply approved US travel agency references (`agencyName`, `location`, `relationship`, and one of `testimonial` / `referenceDetail`) for all three locales under `references.items` before AC2 can be satisfied and the story moved to `review`/`done`.

## Change Log

| Date | Author | Notes |
| --- | --- | --- |
| 2026-05-15 | create-story workflow | Created Story 1.9 implementation context and marked ready-for-dev. |
| 2026-05-15 | Codex | Implemented Security and ClientReferences rendering contract, translations, tests, and Home order coverage; left story in-progress because approved public client references are still missing. |
| 2026-05-15 | story-automator-review | Adversarial review completed. Fixed Security gradient hex → `bg-gradient-dark-section` token. Confirmed AC2 blocker (no approved `references.items`) keeps status `in-progress`. Tests 79/79, typecheck clean. |
| 2026-05-15 | xillinha (user) | User explicitly authorized fake placeholder agency references (Atlas Travel Group, Pacific Sun Voyages, Northstar Travel Partners) for all three locales under `references.items` with note "I'll change this in another moment". Production content swap deferred. Status → `review`, sprint-status → `review`. Tests 79/79, typecheck clean. |
