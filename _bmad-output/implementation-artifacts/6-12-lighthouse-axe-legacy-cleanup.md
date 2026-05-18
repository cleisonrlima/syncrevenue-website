# Story 6.12: Lighthouse + axe Sweep + Legacy i18n & Token Cleanup

Status: ready-for-dev

Epic: 6 — Visual Design Refresh (Claude Design Handoff) — final story.

Depends on: Stories 6.1 through 6.11 (must all be `done` before this story starts).

Follow-up of: Story 6.8 deferrals 9, 10, 11, 12 (Lighthouse run, axe sweep, legacy i18n cleanup, legacy `--color-*` retirement).

## Story

As the engineer closing Epic 6,
I want a measured Lighthouse + axe pass against the fully refreshed home page plus a clean retirement of the legacy `--color-*` CSS tokens and any orphaned i18n keys,
So that we can ship Epic 6 with documented non-regression on perf / a11y / best-practices / SEO baselines, zero serious/critical a11y violations, and zero dead code in the token + i18n surfaces.

## Acceptance Criteria — Lighthouse regression

1. **Given** the refreshed home page is built (`npm run build`) and served locally **When** `npm run lhci` runs against `/` using both `lighthouserc.json` and `lighthouserc.mobile.json` **Then** the four category scores (performance, accessibility, best-practices, SEO) for both desktop and mobile meet or exceed the pre-Epic-6 baselines recorded in the LHCI config files.

2. **Given** a score regresses below baseline **When** the regression is investigated **Then** either: (a) the underlying cause is fixed in this story; or (b) the baseline is updated in the LHCI config with a documented rationale committed alongside (e.g., "Epic 6 introduced the airplane hero background — perf -3 points justified by stakeholder-approved visual direction; new baseline = X").

3. **Given** the LHCI report is generated **When** the run completes **Then** the report HTML/JSON is captured as a build artifact (committed under `_bmad-output/implementation-artifacts/epic-6-lhci-report-YYYY-MM-DD/` or attached to the PR per project convention).

## Acceptance Criteria — Playwright + axe sweep

4. **Given** `npm run test:e2e` (or the equivalent script that runs axe-injected Playwright specs) runs **When** axe scans the refreshed home page across all sections **Then** zero serious or critical violations on `#hero`, `#beneficios`, `#clients` (ClientReferences), `#team`, `#agendar-demo`, `#contato`.

5. **Given** any moderate-severity axe violation surfaces **When** triaged **Then** either: (a) fixed in this story if the fix is < 1 hour scope; or (b) recorded as a new follow-up story per the CLAUDE.md "Review Findings → New Story" rule.

6. **Given** the axe sweep completes **When** the run is captured **Then** the JSON output is committed as an artifact alongside the LHCI report (same date-stamped folder).

## Acceptance Criteria — Legacy i18n cleanup

7. **Given** the Epic 6 stories have all merged **When** the codebase is searched for callers of legacy keys **Then** the following keys are confirmed unused (zero `t('hero.badge')` / etc. callers in `src/`, `tests/`, `e2e/`):
   - `hero.badge`
   - `hero.stats.*` (all three sub-keys)
   - `hero.tertiaryLink`
   - `references.cta`
   - `sections.demoScheduler.*` (entire subtree — replaced by `demo.*` in Story 6.9)
   - `sections.contact.*` (entire subtree — replaced by `contact.*` in Story 6.9)
   - `forms.demo.*` (entire subtree — replaced by `demo.form.*` in Story 6.9)
   - `forms.contact.*` (entire subtree — replaced by `contact.form.*` in Story 6.9)

8. **Given** the unused keys are confirmed **When** the cleanup lands **Then** they are deleted from `src/i18n/locales/en/translation.json`, `pt-BR/translation.json`, and `es/translation.json`; `Sections.i18n.test.tsx` is updated so the parity check no longer expects these keys.

9. **Given** any key in the AC 7 list still has a consumer **When** the consumer is identified **Then** the consumer is migrated to the new namespace key OR the cleanup for that specific key is deferred to a new follow-up story (per "Review Findings → New Story") with a documented reason.

## Acceptance Criteria — Legacy `--color-*` token retirement

10. **Given** the Epic 6 sober-palette tokens (`--accent`, `--accent-soft`, `--accent-dim`, `--line`, `--line-strong`, `--ink`, etc.) are the new canonical surface **When** the legacy `--color-*` CSS custom properties from Story 6.1's transitional shim are searched **Then** each remaining `--color-*` token is either: (a) still consumed by ≥ 1 component and retained; or (b) zero-consumers and deleted from `src/index.css` (or the active token source file).

11. **Given** any `--color-*` token is deleted **When** the change lands **Then** `vault/Planning/Architecture-Key.md` token-inventory section is updated to reflect the retirement; the `brand-tokens.contrast.test` continues to pass against the sober palette.

12. **Given** the cleanup completes **When** `npm run build` runs **Then** the build succeeds with zero CSS warnings about undefined CSS vars; bundle size delta from this cleanup is ≥ 0 bytes saved (no regression).

## Acceptance Criteria — Closing the epic

13. **Given** all AC 1–12 are satisfied **When** the story is marked done **Then** `sprint-status.yaml` updates `epic-6` → `done` (all stories 6.1–6.12 also `done`); the Jira epic transitions to Done; the Post-Sprint TEA pass and Post-Epic Retrospective rules from CLAUDE.md fire as the next step (they are NOT part of this story's scope but their trigger condition is met when this story closes).

## Tasks / Subtasks

- [ ] Task 1 — Local production build (`npm run build`) + serve locally; run `npm run lhci` against both desktop + mobile configs; capture report (AC: 1, 3).
- [ ] Task 2 — Triage any LHCI regressions; either fix in-story or update `lighthouserc.json` / `lighthouserc.mobile.json` baselines with a committed rationale (AC: 2).
- [ ] Task 3 — Run `npm run test:e2e` axe sweep across hero / beneficios / clients / team / agendar-demo / contato regions; capture JSON output (AC: 4, 6).
- [ ] Task 4 — Triage axe findings: fix in-story if < 1 hour scope; otherwise create new follow-up story (AC: 5).
- [ ] Task 5 — Search the codebase for callers of each key in AC 7 list; record per-key consumer count (AC: 7).
- [ ] Task 6 — Delete confirmed-unused legacy i18n keys from all three locale JSONs; update `Sections.i18n.test.tsx` parity assertions (AC: 8).
- [ ] Task 7 — Migrate any straggler consumers OR create follow-up story per straggler (AC: 9).
- [ ] Task 8 — Search the codebase for callers of each legacy `--color-*` token; record per-token consumer count (AC: 10).
- [ ] Task 9 — Delete zero-consumer `--color-*` tokens from the active CSS source; update vault docs (AC: 10, 11).
- [ ] Task 10 — Run `npm run build` + verify no CSS warnings; record bundle-size delta (AC: 12).
- [ ] Task 11 — Update `sprint-status.yaml`: set `epic-6` → `done` and the 6.12 entry → `review` then on close → `done` (AC: 13). Jira sync follows per CLAUDE.md.

## Dev Notes

- LHCI baselines are the values currently in `lighthouserc.json` / `lighthouserc.mobile.json` (under `assertions` → `categories:*` minScore). Treat those as the floor.
- The LHCI report folder convention follows the Story 6.x date stamp pattern (e.g., `epic-6-lhci-report-2026-05-XX/`); align with existing implementation-artifact subfolder conventions if any.
- Run axe against a built production bundle (`npm run preview` after `npm run build`) — Playwright's dev-mode runs include source-map / HMR overhead that can produce false positives.
- For the i18n cleanup search, use `rg "t\(['\"](hero\.badge|hero\.stats|hero\.tertiaryLink|references\.cta|sections\.demoScheduler|sections\.contact|forms\.demo|forms\.contact)" -t ts -t tsx` (or equivalent) — capture every callsite even in tests.
- For the `--color-*` token cleanup, list the surviving legacy tokens FIRST from `src/index.css` (or wherever Story 6.1's transitional shim lives), then grep each one across `src/**/*.{ts,tsx,css,scss}`.
- `vault/Planning/Architecture-Key.md` should be updated with: (a) the retired tokens list; (b) the retired i18n keys list; (c) the Epic 6 LHCI baseline values (post-update if any baselines moved).

## Technical Requirements

- **Languages/Frameworks:** TypeScript 5.x, Vite production build, Playwright + `@axe-core/playwright`, Lighthouse CI.
- **State machine:** N/A (no runtime state changes).
- **API contracts:** N/A.
- **Security:** N/A.
- **Performance:** Bundle size delta must be ≥ 0 saved (cleanup story should not bloat); LHCI perf score must meet baseline.

## Architecture Compliance

- No new components or routes.
- Token retirement updates `vault/Planning/Architecture-Key.md` per the project's docs-as-source-of-truth convention.
- i18n cleanup respects the three-locale parity rule.

## Library / Framework Requirements

- Existing: `@lhci/cli`, `@axe-core/playwright` (or whichever axe runner the e2e suite uses).
- No new dependencies.

## File Structure Requirements

| File | Change type | Notes |
|---|---|---|
| `src/i18n/locales/en/translation.json` | UPDATE | Delete confirmed-unused legacy keys |
| `src/i18n/locales/pt-BR/translation.json` | UPDATE | Delete confirmed-unused legacy keys |
| `src/i18n/locales/es/translation.json` | UPDATE | Delete confirmed-unused legacy keys |
| `src/components/Sections.i18n.test.tsx` | UPDATE | Drop legacy keys from parity assertions |
| `src/index.css` (or active token source) | UPDATE | Delete zero-consumer `--color-*` tokens |
| `lighthouserc.json` | UPDATE (conditional) | Updated baselines if any moved, with committed rationale |
| `lighthouserc.mobile.json` | UPDATE (conditional) | Same as above |
| `vault/Planning/Architecture-Key.md` | UPDATE | Retired tokens + keys list; LHCI baselines snapshot |
| `_bmad-output/implementation-artifacts/epic-6-lhci-report-YYYY-MM-DD/` | NEW | LHCI HTML/JSON artifacts |
| `_bmad-output/implementation-artifacts/epic-6-axe-report-YYYY-MM-DD.json` | NEW | axe JSON output |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | UPDATE | epic-6 → done; 6.12 → review/done |

## Testing Requirements

- LHCI: scores meet or exceed baseline on both `lighthouserc.json` and `lighthouserc.mobile.json`.
- axe: zero serious/critical across all six sections.
- `Sections.i18n.test.tsx`: parity assertions updated to reflect deleted keys.
- `brand-tokens.contrast.test`: continues passing against the sober palette after `--color-*` retirement.
- Full Vitest regression run after i18n + token deletions to confirm nothing was a hidden consumer.
- `npm run build`: zero CSS warnings; bundle size delta ≥ 0 bytes saved.

## Previous Story Intelligence

- **Story 6.1** established the sober-palette tokens AND a transitional `--color-*` shim so 6.2–6.8 could migrate incrementally. This story retires the surviving shim entries.
- **Story 6.9** established the new `demo.*` + `contact.*` i18n namespaces alongside the legacy `sections.*` + `forms.*` keys. This story deletes the legacy.
- **Stories 6.10 + 6.11** completed the consumer migration to the new namespace. Their `done` status is a prerequisite for this story's i18n cleanup pass.

## Project Context Reference

- LHCI configs: `lighthouserc.json`, `lighthouserc.mobile.json`.
- axe runner: `tests/e2e/` axe specs + `@axe-core/playwright`.
- Vault: `vault/Planning/Architecture-Key.md` token-inventory + i18n keys sections.
- Epics source: `_bmad-output/planning-artifacts/epics.md` Epic 6 → 6.12 bullet.

## Outstanding Questions for Dev

1. LHCI artifact location convention: under `_bmad-output/implementation-artifacts/` (project-internal) vs `.lighthouseci/` (LHCI default). Confirm with stakeholder before committing artifacts (they may be sensitive or large).
2. Whether the Epic 6 retrospective (`bmad-retrospective`) should reference the LHCI delta + axe results — recommend yes, surface in the retro artifact.
3. Whether any retired legacy i18n keys should be moved to a `deprecated.*` namespace for one release cycle before deletion (no SaaS-tier reason exists to soft-delete static translation keys — recommend hard delete).

## Story Completion Status

- Status: ready-for-dev
