# Story 1.8: Team Section

Status: done

## Story

As a visitor evaluating trust in the company behind the product,
I want to see the Sync Sirius team with names, roles, and bios,
so that I know real people with relevant expertise stand behind SyncRevenue.

## Acceptance Criteria

1. Given the Team section renders, when a visitor scrolls to it, then team members display with name, role, and bio; data is sourced from the active locale's translation JSON (`t('team.members')` array); `SectionHeader` is used; placeholder photo renders if no real photo URL is set.

2. Given active locale is `pt-BR`, when the Team section renders, then member roles and bios display in PT-BR from the pt-BR translation file; no API call is made because Phase 1 is translation-driven.

3. Given a visitor changes locale, when `LanguageSwitcher` fires, then team member roles and bios re-render in the new locale without page reload.

4. Given the Team section renders on mobile, when viewed at less than 768px, then team member cards stack to single column; all content remains accessible and readable.

5. Given translation files are inspected for team data, when `team.members` array is checked in all three locale files, then each member entry includes at minimum: `name`, `role`, `bio`, `photo`; EN/PT-BR/ES versions have distinct role and bio content.

## Tasks / Subtasks

- [x] Task 0: Confirm current implementation state before editing (AC: all)
  - [x] Read `src/components/sections/Team.tsx`, `src/pages/Home.tsx`, `src/components/ui/SectionHeader.tsx`, `src/i18n/locales/en/translation.json`, `src/i18n/locales/pt-BR/translation.json`, and `src/i18n/locales/es/translation.json`.
  - [x] Preserve existing Story 1.6 and Story 1.7 public-section patterns: `useTranslation()`, `SectionHeader variant="light"`, semantic section region, co-located tests, and the `max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24` container.
  - [x] Do not add server, DAO, API, database, or admin-team work. Phase 1 team data is translation JSON only.

- [x] Task 1: Implement the public Team section in `src/components/sections/Team.tsx` (AC: 1, 2, 4)
  - [x] Replace the current stub `export default function Team() { return <section id="team" /> }`.
  - [x] Render `<section id="team" role="region">` with an i18n-driven accessible name, preferably `team.ariaLabel`.
  - [x] Use `SectionHeader` with `variant="light"` and copy from `team.eyebrow`, `team.headline`, and `team.subtext`.
  - [x] Load members from `t('team.members', { returnObjects: true })`; validate/normalize the returned value so the component does not crash if the translation value is missing or not an array.
  - [x] Render one card per member with photo/placeholder, name, role, and bio. Use semantic `article` cards and make each card's heading the member name.
  - [x] If `member.photo` is an empty string, missing, or otherwise not usable, render an accessible placeholder visual instead of a broken image.
  - [x] Do not hardcode English visible copy in JSX except `defaultValue` fallbacks.

- [x] Task 2: Convert team translations to the required array contract (AC: 1, 2, 3, 5)
  - [x] Update `src/i18n/locales/en/translation.json`, `src/i18n/locales/pt-BR/translation.json`, and `src/i18n/locales/es/translation.json`.
  - [x] Add `team.ariaLabel` in all three locales for the section's accessible region name.
  - [x] Replace the current `team.member1` / `team.member2` object shape with `team.members`, an array of objects.
  - [x] Each object must include `name`, `role`, `bio`, and `photo`. `photo` may be `""` for Phase 1 placeholders.
  - [x] Preserve existing business meaning: airline distribution, GDS operations, commission management, travel data integration, automation, and revenue optimization.
  - [x] EN/PT-BR/ES `role` and `bio` values must be locale-specific strings, not copied English. Names may stay as placeholders until real content arrives in Story 3.1.
  - [x] Keep i18n nesting within the architecture rule: dot-nested keys, maximum 3 levels deep.

- [x] Task 3: Wire Team into the homepage without breaking the trust sequence (AC: 1)
  - [x] Add `const Team = lazy(() => import('@/components/sections/Team'))` to `src/pages/Home.tsx`.
  - [x] Add a `Suspense` + `SectionSkeleton` + `ErrorBoundary` block for Team.
  - [x] Place Team after `ClientReferences` and before `DemoScheduler` unless product/UX explicitly directs otherwise. This preserves the existing non-negotiable `Comparison -> Security -> ClientReferences -> DemoScheduler` trust sequence while still showing Team before the demo ask.
  - [x] Use a `SectionSkeleton` fallback label such as `Loading team` and a height matching the expected Team section.

- [x] Task 4: Visual, responsive, and accessibility contract (AC: 1, 4)
  - [x] Use a light middle-section background, preferably `bg-[#F4F6FA]` if it follows `ClientReferences`/adjacent section rhythm after current stubs are expanded.
  - [x] Team card border radius should match existing cards (`rounded-lg`, 8px) and avoid wrapping the whole section in a decorative card.
  - [x] Cards stack as `grid-cols-1` below `md` and may become `md:grid-cols-2` or `lg:grid-cols-3` depending on member count.
  - [x] Body copy uses `text-brand-slate`; names/headings use `text-brand-navy`. Do not use `text-brand-electric-blue` for normal body text on a white/offwhite background.
  - [x] Photos or placeholders must have stable dimensions/aspect ratio to prevent CLS. Real `<img>` elements must include meaningful `alt`, `width`, `height`, and `loading="lazy"` because Team is below the fold.
  - [x] Placeholder visuals must not be announced as fake photos. Use either `aria-hidden="true"` for decorative initials/avatar treatment or a concise accessible label for "Photo placeholder".

- [x] Task 5: Tests (AC: all)
  - [x] Create `src/components/sections/Team.test.tsx`.
  - [x] Test the section renders with `id="team"` and an accessible region name.
  - [x] Test `SectionHeader` copy renders from i18n/default values.
  - [x] Test all member names, roles, and bios render from `team.members`.
  - [x] Test placeholder rendering when `photo` is empty, and image rendering with meaningful alt text when `photo` is provided.
  - [x] Test the mobile-first layout classes include a single-column base and responsive multi-column breakpoint.
  - [x] Extend `src/components/sections/Sections.i18n.test.tsx` with a Team case verifying PT-BR or ES role/bio updates after `i18next.changeLanguage`.
  - [x] Extend `src/pages/Home.test.tsx` or add `src/pages/Home.story-1-8.e2e.test.tsx` to verify Team appears after `ClientReferences` and before `DemoScheduler`, while `Comparison -> Security -> ClientReferences` order remains intact.
  - [x] Add or update a translation-contract test to assert all three locale files expose `team.members` arrays with `name`, `role`, `bio`, and `photo`.
  - [x] Run `npm run typecheck` and `npm run test:run`.

## Dev Notes

### Current File States

| File | Current State | Required Action |
| --- | --- | --- |
| `src/components/sections/Team.tsx` | Stub only: `export default function Team() { return <section id="team" /> }` | Replace with full i18n-driven Team section |
| `src/pages/Home.tsx` | Lazy-loads Hero, SyncRevenue, Services, Comparison, Security, ClientReferences, DemoScheduler, Contact. Team is not imported or rendered. | Add Team lazy import and Suspense block |
| `src/components/ui/SectionHeader.tsx` | Reusable eyebrow/h2/subtext component with light/dark variants | Use as-is |
| `src/i18n/locales/*/translation.json` | `team` namespace exists but uses `member1` and `member2`; no `members` array and no `photo` field | Convert to `team.members` array in all three locales |
| `src/components/sections/Sections.i18n.test.tsx` | Covers SyncRevenue, Services, and Comparison locale switching | Add Team locale-switch coverage |
| `src/pages/Home.test.tsx` | Verifies SyncRevenue -> Services -> Comparison -> Security order | Extend for Team placement without weakening existing order assertions |

### Architecture Compliance

- Stack: React 18.3.1, Vite 5.4.21, TypeScript strict, Tailwind CSS 3.4.19, i18next 23.16.8, react-i18next 14.1.3. Source: `package.json`.
- Public sections live under `src/components/sections/`; `Home.tsx` orchestrates public section order and lazy-loading. Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`.
- `Team.tsx` maps to FR5: public names, roles, and bios. Source: `_bmad-output/planning-artifacts/prd.md#Site Content & Navigation`.
- Phase 1 team bios are translation JSON. Phase 3 replaces public `Team.tsx` with API data from `/api/admin/team` / `/api/team`; do not implement that now. Source: `_bmad-output/planning-artifacts/architecture.md#Gap Analysis Results`.
- Use dot-nested i18n keys, max 3 levels deep. Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`.
- Keep all implementation client-only. No `fetch`, no `/api/team`, no admin page changes, no `server/dao/team.dao.ts`.

### UX Guardrails

- Purpose: give skeptical visitors evidence that real Sync Sirius specialists stand behind SyncRevenue.
- Tone: calm, concrete, travel-agency operational credibility. Avoid generic SaaS team-card copy.
- Use `SectionHeader` because UX-DR8 requires it in every content section.
- Middle sections should use alternating white/offwhite rhythm. Team is listed as a light middle section alongside SyncRevenue, Services, and Comparison.
- Text contrast must meet WCAG AA. Use brand navy/slate on light backgrounds; avoid electric blue for normal paragraph text.
- Do not use real-looking stock portraits. If real photos are not provided, use intentional placeholders. Story 3.1 is responsible for real team photos and complete bios.

### Project Structure Notes

- No `project-context.md` file was found during workflow activation.
- Planning tension: older Story 1.4 / UX-DR10 fixed order omitted Team (`Hero -> SyncRevenue -> Comparison -> Security -> ClientReferences -> DemoScheduler -> Contact`), while FR5 and Story 1.8 require Team and architecture lists Team as a public section. To avoid regressing Story 1.9's trust sequence, add Team after `ClientReferences` and before `DemoScheduler` unless a human product/UX decision says otherwise.
- Existing `Home.tsx` already includes Services between SyncRevenue and Comparison from Story 1.6. Preserve Services.
- Existing section stubs for Security, ClientReferences, and DemoScheduler are empty shells. Team tests should not rely on their future visible copy.

### Previous Story Intelligence

- Story 1.7 established the current public-section implementation pattern:
  - `useTranslation()` inside section components.
  - `SectionHeader variant="light"`.
  - `section id="..." role="region"` with i18n-driven accessible name.
  - Container: `max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24`.
  - Co-located component tests plus story-level Home flow tests.
- Story 1.7 extended all locale files in one change and verified locale switching through `Sections.i18n.test.tsx` and `Home.story-1-7.e2e.test.tsx`; follow that pattern for Team.
- Story 1.7 review removed dead translation keys. Do not leave old `team.member1` / `team.member2` keys unless they are still intentionally used.
- Recent commits:
  - `78bf425 feat(story-1.7): Comparison section` changed Comparison, i18n, section i18n tests, and Home tests.
  - `24908b2 feat(story-1.6): Story 1.6 SyncRevenue + Services sections` changed SyncRevenue, Services, i18n tests, responsive tests, and Home tests.

### Latest Technical Notes

- React official docs state `lazy` declarations should be outside components and rendered under `Suspense` with a fallback. Current `Home.tsx` already follows this pattern; keep it intact. Source: https://react.dev/reference/react/lazy and https://react.dev/reference/react/Suspense
- react-i18next official docs use `useTranslation` to access `t` inside functional components. Source: https://react.i18next.com/latest/usetranslation-hook
- i18next official docs support returning objects/arrays through `t(key, { returnObjects: true })`. Use this for `team.members`. Source: https://www.i18next.com/translation-function/objects-and-arrays

### Recommended Implementation Shape

```typescript
type TeamMember = {
  name: string
  role: string
  bio: string
  photo: string
}

const rawMembers = t('team.members', { returnObjects: true }) as unknown
const members = Array.isArray(rawMembers) ? rawMembers.filter(isTeamMember) : []
```

- Keep `TeamMember` and any `isTeamMember` guard local to `Team.tsx` unless reuse emerges.
- For placeholders, derive initials from `name` only if the placeholder name is acceptable in the active locale. Otherwise render a neutral icon/shape with `aria-hidden="true"`.
- If the array is unexpectedly empty, render no cards or a non-prominent fallback only if product copy exists in translations. Do not invent visible English error text.

### References

- Story and AC: `_bmad-output/planning-artifacts/epics.md#Story 1.8: Team Section`
- FR5: `_bmad-output/planning-artifacts/prd.md#Site Content & Navigation`
- Phase 1 translation source / Phase 3 API switch: `_bmad-output/planning-artifacts/architecture.md#Gap Analysis Results`
- Public section structure: `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`
- UX-DR1, UX-DR8, UX-DR14, UX-DR15: `_bmad-output/planning-artifacts/epics.md#UX Design Requirements`
- Current code: `src/components/sections/Team.tsx`, `src/pages/Home.tsx`, `src/components/ui/SectionHeader.tsx`, `src/i18n/locales/*/translation.json`
- Prior story context: `_bmad-output/implementation-artifacts/1-7-comparison-section.md`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-15: Targeted red run confirmed missing Team implementation, homepage wiring, and `team.members` locale contract.
- 2026-05-15: `npm run typecheck` passed.
- 2026-05-15: `npm run test:run` passed: 14 test files, 58 tests.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Implemented translation-driven Team section with guarded `team.members` normalization, SectionHeader, semantic region, article cards, stable photo/image handling, and decorative placeholders for empty photos.
- Converted EN/PT-BR/ES team data from `member1`/`member2` objects to locale-specific `team.members` arrays with `name`, `role`, `bio`, and `photo`.
- Added Team to the homepage after ClientReferences and before DemoScheduler, preserving the existing trust sequence.
- Added Team component tests, locale-switch coverage, Home sequence coverage, and translation-contract tests.

### File List

- `_bmad-output/implementation-artifacts/1-8-team-section.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/components/sections/Sections.i18n.test.tsx`
- `src/components/sections/Team.test.tsx`
- `src/components/sections/Team.tsx`
- `src/i18n/index.test.ts`
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/es/translation.json`
- `src/i18n/locales/pt-BR/translation.json`
- `src/pages/Home.test.tsx`
- `src/pages/Home.story-1-8.e2e.test.tsx`
- `src/pages/Home.tsx`

## Senior Developer Review (AI)

**Reviewer:** xillinha
**Date:** 2026-05-15
**Outcome:** Approve

### Summary

All five Acceptance Criteria are implemented with verifiable evidence. `Team.tsx` renders an i18n-driven section with `SectionHeader`, semantic region, article cards, image/placeholder branching, and stable dimensions to prevent CLS. Translation contract converted from `member1`/`member2` to `team.members` arrays across EN/PT-BR/ES with locale-specific role and bio strings. Homepage wires Team after `ClientReferences` and before `DemoScheduler` while preserving the `Comparison -> Security -> ClientReferences` trust order. `npm run typecheck` clean; `npm run test:run` reports 15 test files / 61 tests passing.

### Findings

| Severity | File | Issue | Resolution |
| --- | --- | --- | --- |
| MEDIUM | `_bmad-output/implementation-artifacts/1-8-team-section.md` | `src/pages/Home.story-1-8.e2e.test.tsx` was added to the repository but omitted from the Dev Agent Record File List. | File List updated during this review to include the new e2e test file. |

### Notes

- AC1: `Team.tsx` reads `t('team.members', { returnObjects: true })`, guards with `Array.isArray` + `normalizeTeamMember`, renders placeholder div when `photo` is empty.
- AC2/AC3: Locale switching covered by `Sections.i18n.test.tsx` (rerender) and `Home.story-1-8.e2e.test.tsx` (real `LanguageSwitcher` click + `i18next.changeLanguage`).
- AC4: Grid uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`; cards use `rounded-lg`; bio uses `text-brand-slate`, name uses `text-brand-navy`. No `text-brand-electric-blue` on body text.
- AC5: `src/i18n/index.test.ts` asserts each locale exposes a non-empty `team.members` array with `name`, `role`, `bio`, `photo`, and that PT-BR/ES role/bio differ from EN.
- Placeholder visuals carry `aria-hidden="true"` and a `data-team-photo-placeholder` hook for tests; real `<img>` declares `width`, `height`, `alt`, and `loading="lazy"`.

## Change Log

| Date | Author | Notes |
| --- | --- | --- |
| 2026-05-15 | create-story workflow | Created Story 1.8 implementation context and marked ready for dev. |
| 2026-05-15 | dev-story workflow | Implemented Team section, homepage placement, locale member arrays, and validation tests; marked ready for review. |
| 2026-05-15 | senior-dev-review (AI) | Approved Story 1.8; added `src/pages/Home.story-1-8.e2e.test.tsx` to File List; status moved to done. |
