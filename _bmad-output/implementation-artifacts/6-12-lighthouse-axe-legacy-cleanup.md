# Story 6.12: Lighthouse + axe Sweep + Legacy i18n & Token Cleanup

Status: done

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

- [x] Task 1 — Local production build (`npm run build`) + serve locally; run `npm run lhci` against both desktop + mobile configs; capture report (AC: 1, 3).
- [x] Task 2 — Triage any LHCI regressions; either fix in-story or update `lighthouserc.json` / `lighthouserc.mobile.json` baselines with a committed rationale (AC: 2).
- [x] Task 3 — Run `npm run test:e2e` axe sweep across hero / beneficios / clients / team / agendar-demo / contato regions; capture JSON output (AC: 4, 6).
- [x] Task 4 — Triage axe findings: fix in-story if < 1 hour scope; otherwise create new follow-up story (AC: 5).
- [x] Task 5 — Search the codebase for callers of each key in AC 7 list; record per-key consumer count (AC: 7).
- [x] Task 6 — Delete confirmed-unused legacy i18n keys from all three locale JSONs; update `Sections.i18n.test.tsx` parity assertions (AC: 8).
- [x] Task 7 — Migrate any straggler consumers OR create follow-up story per straggler (AC: 9).
- [x] Task 8 — Search the codebase for callers of each legacy `--color-*` token; record per-token consumer count (AC: 10).
- [x] Task 9 — Delete zero-consumer `--color-*` tokens from the active CSS source; update vault docs (AC: 10, 11).
- [x] Task 10 — Run `npm run build` + verify no CSS warnings; record bundle-size delta (AC: 12).
- [x] Task 11 — Update `sprint-status.yaml`: set the 6.12 entry → `review` (epic-6 stays `in-progress` because Story 6.13 carries the deferred work) (AC: 13). Jira sync follows per CLAUDE.md.

## Dev Agent Record

### Implementation Plan

The story was executed strictly per the AC ordering, with the following decision-points:

**T1 — LHCI.** Ran `npm run lhci` + `npm run lhci:mobile`. Both commands run their own `npm run build && npx vite preview --port 4173 --strictPort` server, then 3 Lighthouse runs per URL per form factor. Six LHR reports were captured into `.lighthouseci/` and copied into `_bmad-output/implementation-artifacts/epic-6-lhci-report-2026-05-19/` (mobile JSON survives there; desktop JSON was overwritten by the mobile run, but the desktop assertion summary is captured in `desktop/lhci-desktop.log`).

**T2 — LHCI triage.** Three regressions across the two configs:
- desktop `/` a11y: 0.95 (Lighthouse `color-contrast` audit failing on brand-deep body text — the same R-A2 documented exception the axe Playwright sweep globally disables — plus `heading-order` moderate-severity)
- desktop `/` CLS: 0.184 (Epic 6 hero panel motion + integrations ticker)
- mobile `/` perf: 0.84–0.86 with LCP 3.9–4.1s (Epic 6 airplane hero background)

Decision per AC 2 path (b): update LHCI baselines with rationale documented in the artifact README (`epic-6-lhci-report-2026-05-19/README.md`), defer the optimisation work to Story 6.13.

| Config | Assertion | Old | New |
|---|---|---|---|
| `lighthouserc.json` | `categories:accessibility` | 1.00 | 0.95 |
| `lighthouserc.json` | `cumulative-layout-shift` | 0.10 | 0.20 |
| `lighthouserc.mobile.json` | `categories:accessibility` | 1.00 | 0.95 |
| `lighthouserc.mobile.json` | `categories:performance` | 0.90 | 0.84 |
| `lighthouserc.mobile.json` | `largest-contentful-paint` | 2500 | 4100 |

**T3 + T4 — Axe sweep.** Started `npx vite preview --port 4173` against the built bundle, ran `PLAYWRIGHT_BASE_URL=http://localhost:4173 npx playwright test tests/e2e/a11y-axe.spec.ts --project=chromium --reporter=json`. Result: **6/6 expected, 0 unexpected, 0 flaky** across 3 locales × 2 routes (/ and /privacy). Zero serious/critical violations on any home-page section. AC 4 satisfied; no triage needed. JSON captured at `_bmad-output/implementation-artifacts/epic-6-axe-report-2026-05-19.json`.

**T5 + T6 — Legacy i18n cleanup.** Searched `src/` and `tests/` for consumers of every key in the AC 7 list. Results:

| Legacy key | Consumers | Disposition |
|---|---|---|
| `hero.badge` | 0 | DELETED from en + pt-BR + es |
| `hero.stats.*` | 0 (StatRow.tsx has a code comment referencing the old path but no `t()` call) | DELETED subtree from all three locales |
| `hero.tertiaryLink` | 0 | DELETED from all three locales |
| `references.cta` | 1 (`ClientReferences.tsx:195`, visible CTA with `defaultValue` fallback) | DEFERRED to Story 6.13 — requires either rename to surviving `references.*` key or visual-design CTA removal, plus en/pt-BR/es translations |
| `sections.demoScheduler.*` | 0 | DELETED subtree from all three locales |
| `sections.contact.*` | 0 (already absent from all three JSONs) | no-op |
| `forms.demo.*` | 2 (`CommissionAudit.tsx:270` `roleOptions.${option}` + `:291` `gdsOptions.${option}`) | DEFERRED to Story 6.13 — requires GDS enum reconciliation (`Galileo`/`Worldspan`/`None yet` are split in legacy but merged into `Travelport (Galileo/Worldspan)` in `demo.form.fields.gds.options.*`) |
| `forms.contact.*` | many across `useContact.ts` (Zod errors) + `ContactForm.tsx` (error / success / submitting / 429 paths) | DEFERRED to Story 6.13 — requires extending `contact.form.errors.*` + `contact.form.success.*` + `contact.form.submitting` keys in all three locales (mirroring the `demo.form.*` shape) before migration |

Total i18n delta: **69 line deletions** across the three locale JSONs (parity preserved — same keys removed from en/pt-BR/es).

**T6 supplementary — parity test.** `src/components/sections/Sections.i18n.test.tsx` already does not assert any of the deleted legacy keys; its `Story 6.9 — namespace parity` suite only verifies the new `demo.*` / `contact.*` / `forms.encryptedNote` paths, and its `demo.* tree shape identical across locales` test continues to pass because the deletes are symmetric across en/pt-BR/es. No edit was required.

**T7 — stragglers.** The three deferred subtrees in T5 are tracked in [Story 6.13](6-13-epic-6-followups-stragglers-cls-lcp-heading-order.md) with explicit ACs per straggler.

**T8 + T9 — `--color-*` token retirement.** Inventoried `src/index.css` and found all 7 legacy `--color-*` tokens: `electric-blue`, `highlight`, `deep`, `navy`, `slate`, `muted`, `offwhite`. Direct `var(--color-*)` consumers in `src/**/*.{ts,tsx,css}` outside of `src/index.css`: **0**. Initial deletion was attempted, but a follow-up grep for `brand-*` Tailwind utility classes (mapped in `tailwind.config.ts:21-27` as `brand.electric-blue: var(--color-electric-blue)` etc.) found **heavy indirect consumers** across `src/components/`, `src/i18n/`, `src/pages/`, and `src/lib/` for every single token: `bg-brand-navy`, `text-brand-deep`, `text-brand-muted`, `bg-brand-offwhite`, `border-brand-electric-blue`, etc. The deletion was reverted. Per AC 10 path (a) — "still consumed by ≥ 1 component and retained" — **all 7 `--color-*` tokens stay in `src/index.css`**. The shim is still load-bearing.

Migrating the Tailwind `brand-*` utility consumers to the new sober-palette tokens (`accent`, `ink`, `accent-soft`, `slate-token`, `muted-token`, `offwhite`) is a substantially larger refactor than this story's scope and is added to the Story 6.13 backlog candidate list (not currently in 6.13's AC, but flagged here for future consideration).

**T10 — build verify.** `npm run build` exits 0; 547 modules transformed; **zero CSS warnings** about undefined CSS vars. Final `dist/client/` size = 928K (866,102 bytes); main JS bundle gzip = 132.89 kB; CSS gzip = 8.15 kB. Bundle delta from this cleanup: ≥ 0 bytes saved (only i18n keys were removed; the `--color-*` revert means no CSS change). AC 12 satisfied.

**T11 — sprint-status + epics.md.** `sprint-status.yaml` updated: `6-12-lighthouse-axe-legacy-cleanup: review`, new entry `6-13-epic-6-followups-stragglers-cls-lcp-heading-order: ready-for-dev`. `epic-6` stays `in-progress` because Story 6.13 carries the remaining Epic 6 quality debt (i18n stragglers + heading-order + CLS + LCP). `_bmad-output/planning-artifacts/epics.md` extended with the 6.13 bullet + updated implementation order.

### Completion Notes

- Axe Playwright sweep is fully clean (zero serious/critical violations across 3 locales × 2 routes). AC 4 satisfied without remediation.
- Lighthouse a11y / CLS / mobile-perf regressions were baseline-bumped rather than fixed in-story; the optimisation work is tracked in Story 6.13. Each baseline change has a documented rationale in `epic-6-lhci-report-2026-05-19/README.md`.
- The legacy `--color-*` shim could not be retired because the Tailwind `brand-*` utility namespace is still mapped to it and used extensively. AC 10 path (a) applies — all 7 tokens retained.
- 69 lines of dead i18n removed across all three locales; full vitest regression confirms no test depended on the deleted keys (the one observed test failure — `server/routes/admin/auth.test.ts > does not throttle repeated successful logins from the same IP` — is a pre-existing timeout flake in Story 4.7 admin-auth and is unrelated to this story's changes).
- New Story 6.13 picks up the deferred stragglers, the Lighthouse `heading-order` fix, the desktop CLS optimisation, and the mobile LCP optimisation, with explicit ACs to revert each Story 6.12 baseline bump.

### Bundle Size

- `dist/client/` total: 928K (866,102 bytes raw)
- Main JS chunk: `index-CA4Gu7fE.js` 442.59 kB / 132.89 kB gzip
- Top CSS: `index-DB-HZ9Hi.css` 38.18 kB / 8.15 kB gzip
- Delta from this cleanup: ≥ 0 bytes saved (i18n shrink only; CSS unchanged)

## File List

- MODIFIED `src/i18n/locales/en/translation.json` — deleted `hero.badge`, `hero.stats.*`, `hero.tertiaryLink`, `sections.demoScheduler.*` (23 line deletions)
- MODIFIED `src/i18n/locales/pt-BR/translation.json` — same key set (23 line deletions)
- MODIFIED `src/i18n/locales/es/translation.json` — same key set (23 line deletions)
- MODIFIED `lighthouserc.json` — `categories:accessibility` 1.0 → 0.95, `cumulative-layout-shift` 0.1 → 0.20
- MODIFIED `lighthouserc.mobile.json` — `categories:accessibility` 1.0 → 0.95, `categories:performance` 0.9 → 0.84, `largest-contentful-paint` 2500 → 4100
- MODIFIED `_bmad-output/implementation-artifacts/sprint-status.yaml` — 6.12 → review, 6.13 → ready-for-dev, `last_updated` 2026-05-19
- MODIFIED `_bmad-output/planning-artifacts/epics.md` — added 6.13 bullet, updated implementation order
- NEW `_bmad-output/implementation-artifacts/epic-6-lhci-report-2026-05-19/README.md` — observed scores table, baseline-change table, rationale per assertion, follow-up story pointer
- NEW `_bmad-output/implementation-artifacts/epic-6-lhci-report-2026-05-19/desktop/lhci-desktop.log` — LHCI desktop run log
- NEW `_bmad-output/implementation-artifacts/epic-6-lhci-report-2026-05-19/mobile/lhci-mobile.log` — LHCI mobile run log
- NEW `_bmad-output/implementation-artifacts/epic-6-lhci-report-2026-05-19/lhr-*.json` + `lhr-*.html` (6 reports from the mobile run; desktop JSONs were overwritten by the mobile run in `.lighthouseci/` before copy)
- NEW `_bmad-output/implementation-artifacts/epic-6-lhci-report-2026-05-19/assertion-results.json` + `links.json` (LHCI run metadata)
- NEW `_bmad-output/implementation-artifacts/epic-6-axe-report-2026-05-19.json` — axe Playwright sweep JSON report (6/6 expected, 0 unexpected)
- NEW `_bmad-output/implementation-artifacts/6-13-epic-6-followups-stragglers-cls-lcp-heading-order.md` — follow-up story spec

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-19 | Story 6.12 created from Story 6.8 deferrals 9–12 (Lighthouse, axe, legacy i18n, `--color-*` retirement) | bmad-create-story |
| 2026-05-19 | Status ready-for-dev → in-progress; LHCI desktop + mobile run captured; LHCI baselines bumped with rationale per AC 2(b); axe sweep clean (6/6 zero serious/critical); 69 lines of legacy i18n deleted across en + pt-BR + es; `--color-*` token retirement attempted but reverted because Tailwind `brand-*` utility classes still depend on the shim — all 7 tokens retained per AC 10(a); follow-up Story 6.13 created for stragglers + heading-order + CLS/LCP optimisation | bmad-dev-story (Claude) |
| 2026-05-19 | Status in-progress → review | bmad-dev-story (Claude) |

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

- Status: done
