# Story 3.6: Story 3.1 Review Follow-ups — Real Team Content & Visual QA

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Sync Sirius brand owner,
I want the team section to render real, stakeholder-approved photos, names, and verified LinkedIn URLs across EN/PT-BR/ES,
so that the public site presents a credible, accurate team to visitors rather than placeholder identities and initials fallbacks.

This story closes the Critical and Medium review follow-ups recorded against Story 3.1 (`_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` → "Review Follow-ups (AI)" section). The 3.1 component path already supports real photos, locale-aware bios, and conditional LinkedIn anchors — 3.6 supplies the real **content** + completes the deferred visual QA pass. No new code paths. Content fields and asset files only.

## Acceptance Criteria

1. **Given** stakeholder-approved photo assets are supplied, **when** each photo is committed to `public/team/` (WebP, 320×320, optimized), **then** the corresponding locale `team.members[].photo` field in `src/i18n/locales/{en,pt-BR,es}/translation.json` is set to `/team/<file>.webp`; the placeholder initials block stops rendering for those members; `width="320"`, `height="320"`, `loading="lazy"` attributes remain on every `<img>` (no component code change).

2. **Given** real team member identities are confirmed, **when** the EN/PT-BR/ES locale `team.members[]` arrays are updated, **then** each entry replaces the placeholder role-as-name (`Sync Sirius Operations Lead`, `Sync Sirius Technology Lead`) with a verified person name; `name` is identical across the three locales (per existing rule "people's names do not translate"); `role` and `bio` are locale-distinct (not copy-pasted English); the deep-key i18n parity test at `src/i18n/index.test.ts` continues to pass.

3. **Given** real LinkedIn URLs are supplied (where applicable), **when** each locale `team.members[].linkedinUrl` is populated, **then** the conditional `<a target="_blank" rel="noopener noreferrer">` renders for members with a URL; the `aria-label` uses the existing `team.linkedinAriaLabel` interpolation key (`View {{name}} on LinkedIn` / `Ver {{name}} no LinkedIn` / `Ver a {{name}} en LinkedIn`); members without a URL keep `linkedinUrl: ""` and render no anchor.

4. **Given** the deferred visual QA pass from Story 3.1, **when** a developer runs the dev server (`npm run dev`) and loads the Team section in EN, PT-BR, and ES, **then** the real photos render without layout shift; alt text reads as `"{name}, {role}"` per locale; LinkedIn links open in a new tab where set and are absent where not set; the Team section on mobile (< 768px) stays single column; results are recorded as a checklist inside this story file (see Tasks / Subtasks → Task 4).

5. **Given** all Story 3.1 review follow-ups are resolved, **when** Story 3.6 is reviewed, **then** the unchecked review follow-up list in `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` ("Review Follow-ups (AI)" section — both Critical items + the Medium deferred visual check) is reconciled: each item is marked `[x]` and linked to the Story 3.6 commit hash that closed it; no new code paths are introduced; only content fields and asset files change.

6. **Given** the unit + e2e suites, **when** `npm run typecheck`, `npm run test:run`, and `npm run test:e2e` run, **then** all 234+ unit tests continue to pass; the Story 3.1 Playwright spec `tests/e2e/team-section.spec.ts` either continues to pass unchanged OR its placeholder-leak / initials-fallback assertions are updated to reflect the new real-photo state — whichever truthfully matches the shipped data.

## Tasks / Subtasks

- [ ] **Task 1: Place real, stakeholder-approved team photo assets in `public/team/`** (AC: 1)
  - [ ] Confirm with the brand owner the canonical name → file-stem mapping (e.g., `maria-silva` → `public/team/maria-silva.webp`); keep stems `kebab-case`, ASCII-only, no diacritics.
  - [ ] Add each real photo to `public/team/<stem>.webp` — square 1:1 crop, source ≥ 320×320 px, optimized WebP, target ≤ ~40 KB per file.
  - [ ] Verify each file is referenced by a public-relative path (`/team/<stem>.webp`) — never imported through the Vite asset pipeline (Phase 1 team data is JSON-string driven, not bundled).
  - [ ] If a member's real photo is genuinely not available at story time, leave `photo: ""` for that member and explicitly note the gap in the Completion Notes List so the reviewer can decide whether the AC1 reconcile bar is met for the supplied subset; do not invent or ship solid-color placeholder WebPs (those were the original 3.1 review failure).

- [ ] **Task 2: Update `team.members` content in all three locale JSON files** (AC: 1, 2, 3)
  - [ ] In `src/i18n/locales/en/translation.json`, replace each placeholder `name` (`Sync Sirius Operations Lead`, `Sync Sirius Technology Lead`) with the verified real person name; set `role` to the verified English role string; set `bio` to the verified English bio paragraph; set `photo` to `/team/<stem>.webp` for any member whose photo was added in Task 1 (or leave `""` for members with no photo yet); set `linkedinUrl` to the supplied real URL (or `""` if not yet supplied).
  - [ ] In `src/i18n/locales/pt-BR/translation.json`, mirror the changes — `name` IDENTICAL to EN, `role` and `bio` translated to natural PT-BR (must differ string-for-string from EN — the locale-specific role/bio test at `src/i18n/index.test.ts:125-136` enforces this), `photo` and `linkedinUrl` identical to EN.
  - [ ] In `src/i18n/locales/es/translation.json`, mirror the changes — `name` IDENTICAL to EN, `role` and `bio` translated to natural ES (must differ string-for-string from EN AND from PT-BR), `photo` and `linkedinUrl` identical to EN.
  - [ ] Do NOT add new keys, do NOT remove `team.linkedinAriaLabel`, do NOT change array length without coordinated edits across all three locales (parity test will fail). Each locale must keep its `team.linkedinAriaLabel` value (EN `View {{name}} on LinkedIn`, PT-BR `Ver {{name}} no LinkedIn`, ES `Ver a {{name}} en LinkedIn`).
  - [ ] Run `npm run test:run -- src/i18n/index.test.ts` after the JSON edits to confirm deep-key parity and locale-distinct role/bio assertions still pass.

- [ ] **Task 3: Reconcile Story 3.1 Review Follow-ups list** (AC: 5)
  - [ ] Edit `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` "Review Follow-ups (AI)" section (lines 71–73):
    - [ ] Mark the Critical "Supply real, stakeholder-approved team photos…" item `[x]` once at least one real photo + corresponding locale `photo` path is committed; reference the Story 3.6 commit hash and the resulting `public/team/` file list.
    - [ ] Mark the Critical "Replace role-placeholder names…" item `[x]` once EN/PT-BR/ES `name` fields are real person names; reference the Story 3.6 commit hash.
    - [ ] Mark the Medium "Re-run the deferred visual check…" item `[x]` once Task 4 visual QA below is complete; reference the Story 3.6 commit hash and the completed checklist below.
  - [ ] Also update the Task 1 / Task 5 checkboxes inside the same 3.1 file (line 27 `Task 1`, line 67 visual-check subtask under `Task 5`) to reflect the now-supplied real content. Do NOT alter 3.1 ACs, Dev Notes, or Senior Developer Review prose — only the unchecked items and the corresponding boxes.

- [ ] **Task 4: Visual QA pass across EN / PT-BR / ES** (AC: 4)
  - [ ] Start the dev server: `npm run dev` (or `npm run dev:client` if the full server is unavailable in sandbox; document which variant was used in Completion Notes).
  - [ ] Locale EN, desktop ≥ 1024px: real photos render in 3-column grid; no layout shift on initial load (visually verify no jump); alt text in DevTools Accessibility tab reads `"{name}, {role}"` per card; LinkedIn anchor present where `linkedinUrl !== ""`; click target opens `target="_blank"` (new tab) with `rel="noopener noreferrer"`.
  - [ ] Locale PT-BR, desktop: same checks; role and bio text are Portuguese (visually verify — not English carried through); LinkedIn `aria-label` reads "Ver {{name}} no LinkedIn" when inspected in the Accessibility tree.
  - [ ] Locale ES, desktop: same checks; role and bio text are Spanish; LinkedIn `aria-label` reads "Ver a {{name}} en LinkedIn".
  - [ ] Mobile viewport (< 768px, e.g., DevTools "iPhone 12 Pro" 390×844): grid collapses to single column for all three locales; photos remain 320×320 with no overflow; LinkedIn anchor (where present) remains tappable and labeled.
  - [ ] Reduced motion: with `prefers-reduced-motion: reduce` toggled in DevTools, the Team section still renders fully; no animation regression.
  - [ ] Record the results inline below as a checklist (replace this bullet sub-list with `[x]` / `[ ]` per check + a one-line note when complete):
    - [ ] EN desktop: photos render, alt composed, LinkedIn behavior correct
    - [ ] PT-BR desktop: photos render, alt composed, locale strings correct, LinkedIn aria-label localized
    - [ ] ES desktop: photos render, alt composed, locale strings correct, LinkedIn aria-label localized
    - [ ] EN mobile: single column, no overflow, LinkedIn tappable
    - [ ] PT-BR mobile: single column, no overflow, LinkedIn tappable
    - [ ] ES mobile: single column, no overflow, LinkedIn tappable
    - [ ] Reduced motion: no regression

- [ ] **Task 5: Update e2e spec if (and only if) shipped data invalidates current assertions** (AC: 6)
  - [ ] Read `tests/e2e/team-section.spec.ts` end-to-end and identify the assertions still tied to the placeholder fallback state — primary suspects: the test at line 74 (`renders graceful initials placeholders while real photos are unavailable`) and any `[data-team-photo-placeholder="true"]` selector usage (line 15 `TEAM_PLACEHOLDER` constant).
  - [ ] If, after Task 1+2, every member in every locale now has a real photo: rewrite the placeholder-state test to assert the inverse — every `<img>` inside `[data-team-grid="true"]` has a non-empty `src` that does NOT match `data:` and the placeholder selector returns zero elements. Keep all other assertions in the spec untouched.
  - [ ] If only some members have real photos (mixed state): keep the placeholder-state test but tighten its assertion to "fewer placeholder elements than total members" rather than "all placeholders" — and add a complementary assertion that at least one `<img src="/team/...">` is present.
  - [ ] Do NOT delete the spec, do NOT remove the locale-content assertions, do NOT loosen the `target="_blank"` / `rel="noopener noreferrer"` checks.
  - [ ] Run `npm run test:e2e -- tests/e2e/team-section.spec.ts --project=chromium` and capture the result (pass/fail/skipped-because-sandbox) in Completion Notes List. Sandbox-blocked runs are an acceptable known limitation per Story 3.1 Dev Agent Record line 167 — note it explicitly rather than claiming green.

- [ ] **Task 6: Verify before marking implementation complete** (AC: 6)
  - [ ] `npm run typecheck` — must pass with zero errors.
  - [ ] `npm run test:run -- src/components/sections/Team.test.tsx src/i18n/index.test.ts` — focused suite must remain green.
  - [ ] `npm run test:run` — full unit suite (234+ tests) must remain green; if total count increases or decreases, note the delta in Completion Notes.
  - [ ] `npm run build` — must succeed; record the Team chunk size delta (Story 3.1 baseline: Team chunk 2.57 kB).
  - [ ] `git diff --check` — no whitespace errors.

## Dev Notes

### Source Context

- Story 3.6 closes the unchecked **Review Follow-ups (AI)** trio carried out of Story 3.1's senior review on 2026-05-16 (Codex). It is the content-only completion story for FR5 in Phase 2. [Source: `_bmad-output/planning-artifacts/epics.md#Story 3.6: Story 3.1 Review Follow-ups — Real Team Content & Visual QA` lines 905–937; `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md:69-73`]
- Phase boundary unchanged from Story 3.1: this is the **JSON content + asset swap** step. Backend admin team route (`server/routes/admin/team.ts`), DAO (`server/dao/team.dao.ts`), and admin Team page (`src/pages/admin/Team.tsx`) remain Phase 3 territory and MUST NOT be touched. [Source: `_bmad-output/planning-artifacts/architecture.md` G3 row line 898; `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` Architecture Guardrails lines 99–108]
- FR5 explicitly includes real photos + LinkedIn as Phase 2 polish, not deferred to Phase 3. [Source: `_bmad-output/planning-artifacts/prd.md` line 268; `_bmad-output/planning-artifacts/epics.md` lines 777–787]

### Previous Story Intelligence (Story 3.1)

- Story 3.1 wired the full code path: `TeamMember.linkedinUrl: string`, composed `<img alt>="${member.name}, ${member.role}"`, conditional `<a target="_blank" rel="noopener noreferrer" aria-label={t('team.linkedinAriaLabel', { name })}>`, `.trim()` normalization on `photo` and `linkedinUrl`, `team.linkedinAriaLabel` interpolation key in all three locales, and deep-parity tests for `linkedinUrl` typeof string. All shipped and green. [Source: `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` Dev Agent Record + Senior Review sections]
- 3.1 senior review removed the brand-blue solid-color placeholder WebPs and reset locale `photo` fields to `""` because solid-color squares were not real photos and failed AC1 truthfully. Do NOT reintroduce that pattern under any guise (no synthetic gradients, no avatar SVGs, no generated initials baked as PNG/WebP). Real human portraits only — or the existing initials fallback. [Source: `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` Senior Review line 204, Change Log line 220]
- 3.1 left interim placeholder NAMES in JSON (`Sync Sirius Operations Lead`, `Sync Sirius Technology Lead`) because real names require stakeholder confirmation. Story 3.6 is the moment that confirmation lands. If the brand owner provides only one real person at story time, the other member's locale entry should be REMOVED from the array (in all three locales coordinated) rather than left as a placeholder — the array length must remain identical across locales for parity. [Source: `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` Senior Review line 205]
- Story 1.8 e2e (`src/pages/Home.story-1-8.e2e.test.tsx`) was already updated by 3.1 to assert the current fallback state. If real photos now render, that file likely needs the SAME treatment as `tests/e2e/team-section.spec.ts` — re-read it; do not skip. [Source: `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` File List line 191]

### Current State of Files to Update

- **`public/team/`** — directory currently empty (`ls public/team/` returns nothing). Add real `.webp` files here. Vite serves `public/` at site root without hashing — paths in JSON stay `/team/<stem>.webp` literal.
- **`src/i18n/locales/en/translation.json`** — `team.members` array at lines 120–135 currently shows two entries with placeholder names, `photo: ""`, `linkedinUrl: ""`. Update names, role, bio, photo, linkedinUrl per Task 2. `team.linkedinAriaLabel` at line 119 is already correctly set — do not touch.
- **`src/i18n/locales/pt-BR/translation.json`** — mirror structure; update parallel fields with PT-BR translations for role/bio.
- **`src/i18n/locales/es/translation.json`** — mirror structure; update parallel fields with ES translations.
- **`src/i18n/index.test.ts`** — DO NOT change assertions. The existing tests at lines 103–123 (per-member structural shape), 125–136 (locale-specific role/bio), and the `linkedinUrl` typeof string assertion already cover the new content correctly. Only run the suite — do not edit it.
- **`src/components/sections/Team.tsx`** — DO NOT EDIT. 3.1 component is correct. If you find yourself reaching for this file, stop and re-read the AC.
- **`src/components/sections/Team.test.tsx`** — DO NOT EDIT. Component-level coverage is locale-mocked and independent of real content.
- **`tests/e2e/team-section.spec.ts`** — review per Task 5. Lines 15 (`TEAM_PLACEHOLDER` constant), 74 (placeholder-fallback test) are the candidates for update IF real photos now ship.
- **`src/pages/Home.story-1-8.e2e.test.tsx`** — review per Task 5 same logic; this is a unit-level e2e harness, not a Playwright spec.
- **`_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md`** — edit only the three unchecked Review Follow-ups items (lines 71–73), the Task 1 checkbox (line 27 area), and the Task 5 deferred visual subtask (line 67). Append a final Change Log row under the existing one (line 220) to record the 3.6 commit hash, author, and content delta — do not rewrite prior rows.

### Architecture Guardrails

- **No backend work, no DB schema, no admin route.** This story is JSON content + static asset addition only. [Source: `_bmad-output/planning-artifacts/architecture.md` line 898; `vault/Planning/Architecture-Key.md` Phase boundaries]
- **No new i18n top-level keys, no key shape changes.** Stay inside the existing `team.*` namespace. Do not add `team.members[].avatarSvg`, `team.members[].twitterUrl`, or any new field. The 3.1 code path only reads `name`, `role`, `bio`, `photo`, `linkedinUrl`. [Source: `vault/Planning/Architecture-Key.md` i18n Keys; `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` Architecture Guardrails]
- **A11y / i18n boundary.** Visible content (name, role, bio) is i18n'd. The `team.linkedinAriaLabel` interpolation key is also i18n'd (visible text in the accessibility tree). Filenames in `/team/` are technical metadata — kebab-case ASCII only, NOT translated. [Source: auto-memory `feedback_a11y_i18n_boundary.md`; `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` Architecture Guardrails]
- **CLS rules unchanged.** Every `<img>` retains `width="320" height="320" loading="lazy"` from the 3.1 component path. Real-photo WebPs must be square (1:1) to honor the reserved layout box — non-square images will visually distort but not break CLS metrics. Prefer 1:1 source crops. [Source: `_bmad-output/planning-artifacts/epics.md` line 779]
- **WCAG R-A2 color waiver unchanged.** No new color tokens, no new gradient surfaces, no new button variants in this story. Content-only change cannot regress the contrast lock. [Source: `vault/Planning/Architecture-Key.md` R-A2; `src/lib/brand-tokens.contrast.test.ts`]
- **Co-located test pattern unchanged.** Do not create `__tests__/` directories. [Source: `vault/Planning/Architecture-Key.md` Test Structure]
- **Locale parity is a HARD invariant.** If you change array length in one locale, change it in all three in the same commit. The deep-parity test will block CI otherwise. [Source: `src/i18n/index.test.ts:55-61`]

### Library/Framework Requirements

- No new dependencies. No new shadcn imports. No Framer Motion. This story has zero `package.json` delta. [Source: `vault/Planning/Stack.md`; `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` Library/Framework Requirements]
- Image format: WebP only. No JPG fallback needed in Phase 2 (Vite + modern browser target). Optimize with `cwebp -q 80` or equivalent — target ≤ ~40 KB per 320×320 portrait. [Source: `vault/Planning/Stack.md`; `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` Task 1 guidance]
- `i18next` + `react-i18next` unchanged. JSON-only edits — no code touches the hook surface. [Source: `vault/Code/i18n.md`]

### File Structure Requirements

- Photo assets: `public/team/<kebab-case-stem>.webp` — stems ASCII-only, no diacritics, derived from real names (e.g., real name "María Silva" → file stem `maria-silva`). The visible `name` JSON field DOES keep diacritics; only the filename strips them.
- Locale files: existing paths — `src/i18n/locales/{en,pt-BR,es}/translation.json`. Update only — no new files.
- Story 3.1 file: existing path `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` — edit existing unchecked items + append Change Log row only.
- No new component files, no new test files, no new route files, no new server files.

### Testing Requirements

- Run order before marking review: `npm run typecheck` → `npm run test:run` → `npm run build` → `npm run test:e2e` (if sandbox allows; document if blocked).
- The relevant deep-parity test (`src/i18n/index.test.ts`) is the canary for JSON edits. If it fails, the JSON has a structural drift — fix the JSON, never the test.
- Component-level Team tests (`src/components/sections/Team.test.tsx`) are locale-mocked with synthetic fixtures; they do not exercise real JSON content. No expected change here. Treat any failure as a sign you accidentally touched `Team.tsx` — revert.
- The Story 1.8 e2e harness (`src/pages/Home.story-1-8.e2e.test.tsx`) DOES exercise the real i18next instance + boot path; it WILL react to JSON content changes. Re-read its assertions against the new shipped content; update only the assertions that became stale because real photos now render — do not loosen unrelated checks (locale strings, accessibility tree).
- Visual QA (Task 4) is part of AC fulfillment, not an optional gate. Without the recorded checklist in this file, AC 4 cannot be marked complete.
- Do not introduce snapshot tests. Do not introduce new Playwright specs. [Source: `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` Testing Requirements]

### Project Structure Notes

- `public/team/` already exists as an empty directory (created during Story 3.1 — verified via `ls public/`). No filesystem additions other than image files inside it.
- `vault/Code/Frontend.md` and `vault/Code/i18n.md` reference the Team section as a JSON-driven Phase 1/2 component; this story does not change the module map. After commit, run the vault-update protocol to update `vault/Planning/Epics-Index.md` story 3.6 row `[ ]` → `[x]` and `vault/00-Home.md` project status section per `CLAUDE.md` Vault Update Protocol. [Source: `vault/Planning/Epics-Index.md`; `CLAUDE.md` Obsidian Vault section]
- No detected conflict with the unified project structure.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 3.6: Story 3.1 Review Follow-ups — Real Team Content & Visual QA` lines 905–937]
- [Source: `_bmad-output/planning-artifacts/prd.md` FR5, lines 99 and 268]
- [Source: `_bmad-output/planning-artifacts/architecture.md` G3 row line 898] — Phase 1/2 vs Phase 3 boundary
- [Source: `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md`] — full 3.1 record, Senior Review, unchecked Review Follow-ups
- [Source: `_bmad-output/implementation-artifacts/1-8-team-section.md`] — original Team contract
- [Source: `src/components/sections/Team.tsx`] — current implementation (DO NOT EDIT)
- [Source: `src/i18n/locales/{en,pt-BR,es}/translation.json`] — current `team.members` content (TARGET)
- [Source: `src/i18n/index.test.ts`] — i18n parity and team content tests (DO NOT EDIT)
- [Source: `tests/e2e/team-section.spec.ts`] — Playwright spec (update IF shipped data invalidates fallback assertions)
- [Source: `src/pages/Home.story-1-8.e2e.test.tsx`] — Story 1.8 e2e harness (update IF shipped data invalidates fallback assertions)
- [Source: `vault/Planning/Architecture-Key.md`] — i18n key rules, locale flow, R-A2 waiver, anti-patterns
- [Source: `vault/Code/i18n.md`] — i18n module map

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — manual dev-story execution (automator disabled by user 2026-05-16)

### Debug Log References

- `npm run typecheck` — clean
- `npm run test:run` — 299/299 pass (53 files)
- Playwright `tests/e2e/team-section.spec.ts` NOT executed (sandbox limitation per Story 3.1 Dev Agent Record line 167). Spec still asserts `TEAM_PLACEHOLDER` count = 2; since `photo: ""` remains for both members, current assertions stay valid — no spec update required.

### Completion Notes List

⚠️ **FAKE-DATA INTERIM STATE — user-directed override (2026-05-16).**

User explicitly requested fake team list with no photos and no LinkedIn URLs, with intent to swap real content manually later. AC1 (real photos), AC3 (real LinkedIn URLs), AC4 (visual QA), AC5 (3.1 reconcile to "real" state) are **NOT met** under fake-data interim. AC2 partially met — names were swapped from role-as-name placeholders to plausible person names, but they are NOT verified real people.

Concrete state after this commit:
- EN/PT-BR/ES `team.members[].name` set to `Maria Silva` (member 0) and `Lucas Oliveira` (member 1) — identical across locales per i18n parity rule. **These are fabricated names, not stakeholder-approved identities.**
- `role` and `bio` fields unchanged from prior state in all three locales — already locale-distinct (PT-BR ≠ EN ≠ ES) and already AC-compliant for locale-distinct rule.
- `photo: ""` retained for both members in all three locales. `public/team/` directory remains empty.
- `linkedinUrl: ""` retained for both members. No `<a>` anchor renders.
- `data-team-photo-placeholder="true"` initials block still renders for both members (acceptable fallback path from Story 3.1).
- `Home.story-1-8.e2e.test.tsx` heading assertions updated to new names (lines 50, 53).

Tasks status under fake-data interim:
- **Task 1 (real photos):** NOT done. Skipped per user override.
- **Task 2 (locale content swap):** PARTIAL — names swapped to fake values; role/bio/photo/linkedinUrl unchanged.
- **Task 3 (reconcile 3.1 review follow-ups):** NOT done. The "real names" Critical item in 3.1 cannot be marked `[x]` truthfully against fabricated names.
- **Task 4 (visual QA EN/PT-BR/ES):** NOT done. Manual QA still pending; no photos to verify.
- **Task 5 (e2e spec update):** done in scope — `Home.story-1-8.e2e.test.tsx` heading assertions updated; Playwright spec preserved unchanged because `data-team-photo-placeholder` still renders 2 members.
- **Task 6 (verification gates):** typecheck clean; 299/299 unit tests pass; `npm run build` not executed (deferred — content swap should not affect build); `git diff --check` clean.

Story remains `in-progress`. Do NOT mark `review`. User must:
1. Replace `Maria Silva` / `Lucas Oliveira` with stakeholder-approved real person names in all three locale JSON files (keep names identical across locales).
2. Drop real photo WebPs into `public/team/` and set `photo: "/team/<stem>.webp"` per member, per locale.
3. Set `linkedinUrl` to real verified URLs (or leave `""` for members without LinkedIn).
4. Re-run Task 3 (reconcile 3.1 follow-ups) once names are real.
5. Re-run Task 4 (visual QA across EN/PT-BR/ES desktop + mobile) once photos are present.
6. Update Playwright spec `tests/e2e/team-section.spec.ts` per Task 5 branch logic if `photo` values become non-empty (placeholder selector count drops below 2).

### File List

- `src/i18n/locales/en/translation.json` — `team.members[0].name`, `team.members[1].name` swapped
- `src/i18n/locales/pt-BR/translation.json` — `team.members[0].name`, `team.members[1].name` swapped
- `src/i18n/locales/es/translation.json` — `team.members[0].name`, `team.members[1].name` swapped
- `src/pages/Home.story-1-8.e2e.test.tsx` — heading assertions updated to new names (lines 50, 53)

### Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-05-16 | Claude Opus 4.7 (1M context) | Story file drafted — content-only completion of Story 3.1 review follow-ups; six ACs, six tasks (assets, locales, 3.1 reconcile, visual QA, e2e spec, verification); zero code changes to `Team.tsx` or test scaffolds. |
| 2026-05-16 | Claude Opus 4.7 (1M context) | FAKE-DATA INTERIM: swapped role-as-name placeholders to plausible fabricated names (Maria Silva / Lucas Oliveira) across EN/PT-BR/ES locales; photos and LinkedIn URLs intentionally left empty per user override; updated Home.story-1-8.e2e.test.tsx heading assertions; 299/299 unit tests pass. Story stays in-progress — user will swap to stakeholder-approved real content manually. |
