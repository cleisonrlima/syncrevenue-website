# Story 6.13: Epic 6 Follow-ups — Legacy i18n Stragglers + CLS/LCP/Heading-Order Optimisation

Status: ready-for-dev

Epic: 6 — Visual Design Refresh (Claude Design Handoff). Post-epic follow-up materialising deferred work from Story 6.12.

Source: Story 6.12 deferred items (per CLAUDE.md "Review Findings → New Story" rule). Created 2026-05-19.

## Story

As the engineer carrying Epic 6's residual quality debt,
I want to migrate the three legacy i18n key subtrees that Story 6.12 had to defer, fix the Lighthouse `heading-order` audit failure, and tighten desktop CLS / mobile LCP so the temporary baseline relaxations from Story 6.12 can be reverted,
So that Epic 6 closes with the original LHCI thresholds intact and no transitional i18n shim remains in the codebase.

## Acceptance Criteria — Legacy i18n straggler migration

1. **Given** Story 6.12 deferred `references.cta` (1 consumer in [src/components/sections/ClientReferences.tsx:195](src/components/sections/ClientReferences.tsx#L195)) **When** this story lands **Then** the consumer is either migrated to a new key in the surviving `references.*` namespace (preserving en/pt-BR/es translations) or the CTA is removed from the component if the visual design no longer requires it; in both cases `references.cta` is gone from all three locale JSONs.

2. **Given** Story 6.12 deferred `forms.demo.*` (2 consumers in [src/components/sections/CommissionAudit.tsx:270,291](src/components/sections/CommissionAudit.tsx#L270) — `roleOptions.*` and `gdsOptions.*`) **When** this story lands **Then** the consumers are migrated to `demo.form.fields.role.options.*` and `demo.form.fields.gds.options.*` respectively; any GDS option that exists in the old namespace but not the new one (`Galileo`, `Worldspan`, `None yet` — the new namespace combines them into `Travelport (Galileo/Worldspan)`) is reconciled by either extending the new namespace or trimming `CommissionAudit`'s `GDS_OPTIONS` array, with the choice documented inline; the entire `forms.demo.*` subtree is deleted from all three locale JSONs.

3. **Given** Story 6.12 deferred `forms.contact.*` (multiple consumers across [src/hooks/useContact.ts](src/hooks/useContact.ts) + [src/components/sections/ContactForm.tsx](src/components/sections/ContactForm.tsx) covering `nameError`, `emailError`, `subjectError`, `messageError`, `errorRateLimit`, `errorGeneric`, `successTitle`, `successBody`, `submitting`) **When** this story lands **Then** the new `contact.form.*` namespace is extended with parallel `errors.*` + `success.*` + `submitting` keys in all three locales, the consumers are migrated to the new keys, and the entire `forms.contact.*` subtree is deleted; the `Sections.i18n.test.tsx` parity assertions cover the new keys.

4. **Given** all three subtrees are deleted **When** vitest runs **Then** the `Story 6.9 — namespace parity for demo.*, contact.*, forms.encryptedNote` suite continues to pass and the demo.* + contact.* tree shape comparison still finds en/pt-BR/es identical.

## Acceptance Criteria — Lighthouse remediation

5. **Given** Story 6.12 observed Lighthouse a11y at 0.95 on `/` (desktop + mobile) and 0.96 on `/privacy`, with the `heading-order` audit explicitly flagged as the moderate-severity contributor **When** this story lands **Then** the heading hierarchy on both pages is corrected so the Lighthouse `heading-order` audit passes; the Lighthouse a11y category score returns to 1.0 on both URLs and both form factors; the `categories:accessibility` minScore in `lighthouserc.json` and `lighthouserc.mobile.json` is reverted from 0.95 back to 1.0.

6. **Given** Story 6.12 observed desktop CLS = 0.184 on `/` (Epic 6 hero panel motion + integrations ticker) **When** this story lands **Then** the CLS contributors are identified (likely the ticker rotation reflowing layout, or hero panel motion shifting siblings) and either fixed by reserved-space placeholders or removed; observed CLS on desktop `/` falls back below 0.10; the `cumulative-layout-shift` `maxNumericValue` in `lighthouserc.json` is reverted from 0.20 back to 0.10.

7. **Given** Story 6.12 observed mobile LCP between 3.9s and 4.1s on `/` (Epic 6 airplane hero background asset weight) **When** this story lands **Then** the airplane hero asset is optimised (resize for mobile breakpoint, modern format `avif`/`webp`, `<link rel="preload">` for the LCP image, or a mobile-only lower-resolution variant); observed mobile LCP falls below 2.5s on `/`; the `largest-contentful-paint` `maxNumericValue` in `lighthouserc.mobile.json` is reverted from 4100 back to 2500, and `categories:performance` minScore from 0.84 back to 0.90.

8. **Given** the baseline reverts in AC 5–7 land **When** `npm run lhci` and `npm run lhci:mobile` are re-run **Then** both commands exit 0 against the reverted thresholds; the new LH report folder `_bmad-output/implementation-artifacts/epic-6-lhci-report-YYYY-MM-DD/` documents the post-fix scores alongside the Story 6.12 baseline reference.

## Tasks / Subtasks

- [ ] Task 1 — Migrate `references.cta` consumer in `ClientReferences.tsx`; either rename to a surviving `references.*` key (with translations) or delete the CTA if design no longer requires it; delete `references.cta` from all three locale JSONs (AC: 1).
- [ ] Task 2 — Migrate `CommissionAudit.tsx` `roleOptions` consumer (line 270) to `demo.form.fields.role.options.*` (AC: 2).
- [ ] Task 3 — Reconcile `CommissionAudit.tsx` `gdsOptions` consumer (line 291): decide whether to extend `demo.form.fields.gds.options.*` with `Galileo` / `Worldspan` / `None yet` separately OR to trim `GDS_OPTIONS` to the new shape; implement the choice (AC: 2).
- [ ] Task 4 — Extend `contact.form.errors.*` + `contact.form.success.*` + `contact.form.submitting` keys in all three locales, mirroring the existing `demo.form.errors.*` / `demo.form.success.*` / `demo.form.submitting` shape (AC: 3).
- [ ] Task 5 — Migrate `useContact.ts` Zod error messages to `contact.form.errors.*` (AC: 3).
- [ ] Task 6 — Migrate `ContactForm.tsx` error / success / submitting consumers to the new `contact.form.*` keys (AC: 3).
- [ ] Task 7 — Delete `forms.demo.*` and `forms.contact.*` subtrees from all three locale JSONs (AC: 2, 3).
- [ ] Task 8 — Extend `Sections.i18n.test.tsx` parity REQUIRED_PATHS list with the new `contact.form.errors.*` + `contact.form.success.*` paths (AC: 4).
- [ ] Task 9 — Run vitest full regression to confirm no remaining consumers of the deleted subtrees (AC: 4).
- [ ] Task 10 — Investigate Lighthouse `heading-order` audit findings on `/` and `/privacy`; restructure heading levels so the audit passes (AC: 5).
- [ ] Task 11 — Diagnose desktop CLS = 0.184 on `/` via Lighthouse layout-shift detail; fix the contributor(s) via reserved-space placeholders or motion-tuning (AC: 6).
- [ ] Task 12 — Optimise mobile LCP on `/`: convert the airplane hero asset to `avif`/`webp`, add `<link rel="preload">`, and/or ship a mobile-specific lower-resolution variant (AC: 7).
- [ ] Task 13 — Re-run `npm run lhci` + `npm run lhci:mobile`; capture the new report under a fresh date-stamped folder; confirm scores meet the reverted thresholds (AC: 8).
- [ ] Task 14 — Revert `lighthouserc.json` and `lighthouserc.mobile.json` baselines back to the pre-6.12 values; commit alongside the post-fix LH report (AC: 5, 6, 7).

## Dev Notes

- The `Story 6.9` namespace already defines the canonical shapes for `demo.form.errors.*` / `demo.form.success.*` etc. Mirror that shape exactly when extending `contact.form.*` — both DemoForm and ContactForm should share an isomorphic key tree.
- For AC 3, the simplest implementation is to copy the `demo.form.errors` block under `contact.form` and translate the labels appropriate for contact (e.g., subject errors instead of role / GDS errors).
- For Lighthouse `heading-order`, the most common cause on this codebase has been section headlines using `<h2>` followed by a sub-block using `<h4>` (skipping `<h3>`). Inspect the audit's failing nodes via the LH HTML report to find the exact selector.
- For mobile LCP, the airplane hero asset path is in the Hero section (Story 6.3). Check the original `<img>` or `background-image` URL and its current pixel weight via the LH "Largest Contentful Paint element" audit detail.
- The Story 6.12 LHCI artifact folder (`_bmad-output/implementation-artifacts/epic-6-lhci-report-2026-05-19/`) and its README document the baselines that need reverting and the rationale that needs invalidating.

## Technical Requirements

- **Languages/Frameworks:** TypeScript 5.x, react-i18next, Vite, Lighthouse CI.
- **State machine:** N/A.
- **API contracts:** N/A — only client-side i18n and asset optimisation.
- **Security:** N/A.
- **Performance:** Restore the pre-6.12 LHCI thresholds; CLS < 0.10 on desktop `/`, LCP < 2500 ms on mobile `/`, a11y = 1.00 on both URLs both form factors.

## Architecture Compliance

- i18n cleanup respects the three-locale parity rule (see `Sections.i18n.test.tsx`).
- Asset optimisation must not require new dependencies — `vite-plugin-image-optimizer` or a build-time `sharp` step is acceptable only if no other path achieves the target; default to manual asset re-encoding for the airplane hero.

## File Structure Requirements

| File | Change type | Notes |
|---|---|---|
| `src/components/sections/ClientReferences.tsx` | UPDATE | Migrate or remove the `references.cta` consumer |
| `src/components/sections/CommissionAudit.tsx` | UPDATE | Migrate `forms.demo.roleOptions/gdsOptions` consumers to `demo.form.fields.role.options.*` / `demo.form.fields.gds.options.*` |
| `src/hooks/useContact.ts` | UPDATE | Migrate Zod error messages to `contact.form.errors.*` |
| `src/components/sections/ContactForm.tsx` | UPDATE | Migrate error / success / submitting consumers to `contact.form.*` |
| `src/i18n/locales/en/translation.json` | UPDATE | Add `contact.form.errors.*` / `success.*` / `submitting`; delete `forms.demo.*`, `forms.contact.*`, `references.cta` |
| `src/i18n/locales/pt-BR/translation.json` | UPDATE | Same as en |
| `src/i18n/locales/es/translation.json` | UPDATE | Same as en |
| `src/components/sections/Sections.i18n.test.tsx` | UPDATE | Extend REQUIRED_CONTACT_PATHS with new `errors.*` / `success.*` / `submitting` leaves |
| `src/components/sections/Hero*.tsx` (or equivalent) | UPDATE | Heading hierarchy fix + airplane hero asset optimisation |
| `lighthouserc.json` | UPDATE | Revert a11y minScore 0.95 → 1.0, CLS 0.20 → 0.10 |
| `lighthouserc.mobile.json` | UPDATE | Revert a11y 0.95 → 1.0, perf 0.84 → 0.90, LCP 4100 → 2500 |
| `_bmad-output/implementation-artifacts/epic-6-lhci-report-YYYY-MM-DD/` | NEW | Post-fix LH reports |

## Testing Requirements

- Full vitest regression run after every subtree deletion to catch hidden consumers.
- `Sections.i18n.test.tsx` parity for the extended `contact.form.errors.*` / `success.*` / `submitting` keys across en/pt-BR/es.
- Playwright `tests/e2e/a11y-axe.spec.ts` continues to pass with zero serious/critical violations.
- `npm run lhci` and `npm run lhci:mobile` both pass against the reverted thresholds.

## Previous Story Intelligence

- **Story 6.12** deferred these three subtrees and bumped the LHCI baselines. This story repays the debt.
- **Story 6.9** established the new `demo.*` / `contact.*` namespaces but only covered the visible form labels — error/success/submitting strings were left in `forms.*`. This story finishes the migration.
- **Story 6.10** consumed the new `demo.form.*` keys in `DemoForm.tsx`; the same shape should be mirrored under `contact.form.*` for symmetry.

## Outstanding Questions for Dev

1. For the airplane hero asset optimisation, confirm with the designer whether a mobile-specific lower-resolution variant is acceptable, or whether the same asset must serve all breakpoints (which would force a more aggressive single-file compression target).
2. For AC 3, confirm the translation copy for the new `contact.form.errors.*` / `success.*` strings — they may already exist in the design handoff; if not, the dev may have to draft and request copy review.
3. The `Galileo` / `Worldspan` / `None yet` GDS option reconciliation in AC 2 has business implications (the demo form intentionally combined these in Story 6.9). Confirm whether `CommissionAudit`'s audit form should follow the same combination, or whether the audit funnel needs the finer granularity.

## Story Completion Status

- Status: ready-for-dev
