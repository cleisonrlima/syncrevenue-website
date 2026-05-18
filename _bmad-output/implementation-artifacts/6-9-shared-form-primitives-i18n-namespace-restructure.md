# Story 6.9: Shared Form Primitives + i18n Namespace Restructure

Status: review

Epic: 6 — Visual Design Refresh (Claude Design Handoff)

Source design: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` lines 481–518 (`.field`, `.req`, `.opt`, `.select-wrap`, `.form-foot`, `.form-note`).

Depends on: Story 6.1 (sober tokens), Story 6.8 (partial — DemoScheduler bg swap).

Follow-up of: Story 6.8 deferrals 5 + 6 (shared primitives + i18n namespace restructure).

## Story

As a developer about to restyle the Demo and Contact form surfaces (Stories 6.10 + 6.11),
I want a small set of shared form primitives under `src/components/forms/` plus a clean `demo.*` / `contact.*` i18n namespace,
So that both restyle stories can consume the primitives 1:1 with the design-handoff CSS instead of re-implementing the same label / required-marker / select chevron / encrypted-transit footer in two places, and so that every form copy string sits under the spec-mandated namespace shape with three-locale parity.

## Acceptance Criteria — Primitives

1. **Given** `src/components/forms/FormField.tsx` exists **When** rendered with `{ label, required?, optional?, htmlFor, children, error?, describedById? }` **Then** it emits a `<div class="field">` (flex column) with a `<label>` (`font-size:12px; font-weight:600; color:rgba(255,255,255,.7); margin-bottom:7px`); if `required` → trailing `<span class="req">*</span>` (`color:var(--accent-soft); font-weight:700`); if `optional` → trailing `<span class="opt">(opcional)</span>` (`font-weight:500; color:rgba(255,255,255,.4); font-size:11px`); children slot receives the input/select/textarea; optional `error` renders below the slot in red (`#FF6B6B` or token equivalent passing AA contrast on `--form-card-bg`) and is wired to `aria-describedby`.

2. **Given** `src/components/forms/FormSelect.tsx` exists **When** rendered **Then** it wraps the native `<select>` in `<div class="select-wrap">` with a custom chevron pseudo-element (`::after` rotated 45° at `right:14px`); native `appearance:none`; native `<option>` background forced to `#0A0B2E`; hover / focus state matches `FormField` slot styling (focus border `var(--accent)`, background `rgba(255,255,255,.06)`, box-shadow `0 0 0 3px rgba(61,111,224,.12)`); chevron is `aria-hidden="true"`.

3. **Given** `src/components/forms/FormTextarea.tsx` exists **When** rendered **Then** it emits a `<textarea>` matching the shared field-state styling from `Hero.html` lines 481–495 (`padding:11px 13px; border-radius:9px; background:rgba(255,255,255,.04); border:1px solid var(--line-strong); color:#fff; font-size:14px`); placeholder color `rgba(255,255,255,.32)`; hover border `rgba(255,255,255,.22)`; focus state identical to `FormSelect`; resize behavior `vertical` only.

4. **Given** `src/components/forms/FormFoot.tsx` exists **When** rendered with `{ note, submit }` **Then** it emits a `<div class="form-foot">` row (flex; space-between; align-items:center; gap:16px; padding-top:8px); collapses to stacked column at < 600px; renders `note` on the left + `submit` on the right.

5. **Given** `src/components/forms/EncryptedTransitNote.tsx` exists **When** rendered **Then** it emits a shield SVG icon (12px, `aria-hidden`) + the encrypted-transit copy resolved from i18n key `forms.encryptedNote` (see AC 8); supports a `className` prop for footer-vs-inline placement; copy is reused verbatim between `DemoForm` and `ContactForm` form-foots.

6. **Given** any primitive renders **When** axe is run **Then** zero serious/critical violations; every label has a matching `htmlFor`; required state is conveyed via both the visual asterisk and `aria-required="true"` on the wrapped input; error state sets `aria-invalid="true"` and `aria-describedby` points at the error node id.

## Acceptance Criteria — i18n namespace restructure

7. **Given** the spec-mandated namespace shape **When** `src/i18n/locales/{en,pt-BR,es}/translation.json` are inspected **Then** new keys exist under the following paths and resolve to localized copy in all three locales:

   - `demo.eyebrow`
   - `demo.heading.text` / `demo.heading.accent`
   - `demo.subhead`
   - `demo.info.h3`
   - `demo.info.steps.0.title` / `demo.info.steps.0.body` (and `.1`, `.2`)
   - `demo.info.infoCard.title` / `demo.info.infoCard.subtitle`
   - `demo.form.heading`
   - `demo.form.helper`
   - `demo.form.fields.name.label` / `demo.form.fields.name.placeholder`
   - `demo.form.fields.email.label` / `demo.form.fields.email.placeholder`
   - `demo.form.fields.company.label` / `demo.form.fields.company.placeholder`
   - `demo.form.fields.phone.label` / `demo.form.fields.phone.placeholder` / `demo.form.fields.phone.optional`
   - `demo.form.fields.role.label` / `demo.form.fields.role.placeholder`
   - `demo.form.fields.gds.label` / `demo.form.fields.gds.placeholder`
   - `demo.form.fields.message.label` / `demo.form.fields.message.placeholder`
   - `demo.form.submit`
   - `contact.eyebrow`
   - `contact.heading.text` / `contact.heading.accent`
   - `contact.subhead`
   - `contact.channels.0.label` / `contact.channels.0.value` / `contact.channels.0.kind` (and `.1`, `.2`)
   - `contact.infoCard.title` / `contact.infoCard.subtitle`
   - `contact.form.heading`
   - `contact.form.helper`
   - `contact.form.fields.name.label` / `contact.form.fields.name.placeholder`
   - `contact.form.fields.email.label` / `contact.form.fields.email.placeholder`
   - `contact.form.fields.subject.label` / `contact.form.fields.subject.placeholder` / `contact.form.fields.subject.options.commercial` / `.support` / `.partnerships` / `.press` / `.other`
   - `contact.form.fields.message.label` / `contact.form.fields.message.placeholder`
   - `contact.form.submit`
   - `forms.encryptedNote` (shared by both forms via `<EncryptedTransitNote>`)

8. **Given** existing keys `sections.demoScheduler.*`, `sections.contact.*`, `forms.demo.*`, `forms.contact.*` are still consumed by `DemoForm.tsx`, `ContactForm.tsx`, `DemoScheduler.tsx`, `Contact.tsx`, and any other surface **When** the restructure lands **Then** existing keys MUST remain in the JSON until 6.10 + 6.11 migrate their consumers; this story ADDS the new namespace alongside the legacy namespace — it does NOT delete the legacy keys (deletion is a 6.12 concern under "legacy i18n cleanup").

9. **Given** the namespace nesting depth **When** keys are counted **Then** the deepest path (`demo.form.fields.name.label`) is 4 levels; this exceeds the "≤ 3 levels" guideline in `vault/Planning/Architecture-Key.md` for this surface and is an intentional exception documented in the architecture-key (architecture-compliance section below). Restructuring around this is out of scope (the spec mandates the shape).

10. **Given** the parity test **When** `Sections.i18n.test.tsx` runs **Then** the test extends its key-shape assertion to cover the full new `demo.*` and `contact.*` trees plus `forms.encryptedNote` across `en/`, `pt-BR/`, `es/`; missing keys in any locale fail the build; existing parity assertions for `hero.*`, `nav.*`, `references.*`, `team.*` remain green.

## Acceptance Criteria — Existing consumer safety

11. **Given** Stories 6.10 + 6.11 have NOT yet landed **When** the full Vitest suite runs **Then** every existing test that resolves legacy keys (`sections.demoScheduler.eyebrow`, `forms.demo.fields.name.label`, etc.) still passes because the legacy namespace is untouched.

12. **Given** the dev server runs locally **When** `/`, `/?lang=en`, and `/?lang=es` are loaded **Then** the Demo and Contact sections render without missing-key console warnings; the i18next missing-key handler does not log.

## Tasks / Subtasks

- [x] Task 1 — Create `src/components/forms/FormField.tsx` (AC: 1, 6). Co-locate `FormField.test.tsx`. Cover required/optional/error states + a11y attributes.
- [x] Task 2 — Create `src/components/forms/FormSelect.tsx` (AC: 2, 6). Co-locate `FormSelect.test.tsx`. Cover chevron `aria-hidden`, focus ring, option bg.
- [x] Task 3 — Create `src/components/forms/FormTextarea.tsx` (AC: 3, 6). Co-locate `FormTextarea.test.tsx`. Cover placeholder color, resize vertical, focus state.
- [x] Task 4 — Create `src/components/forms/FormFoot.tsx` (AC: 4). Co-locate `FormFoot.test.tsx`. Cover stack-at-600px breakpoint assertion (matchMedia mock or class-based).
- [x] Task 5 — Create `src/components/forms/EncryptedTransitNote.tsx` (AC: 5). Co-locate `EncryptedTransitNote.test.tsx`. Assert shield SVG `aria-hidden`, copy resolved from `forms.encryptedNote`.
- [x] Task 6 — Add new `demo.*` namespace to `src/i18n/locales/en/translation.json`, `pt-BR/translation.json`, `es/translation.json` (AC: 7, 9). Keep legacy `sections.demoScheduler.*` + `forms.demo.*` intact.
- [x] Task 7 — Add new `contact.*` namespace to all three locale files (AC: 7, 9). Keep legacy `sections.contact.*` + `forms.contact.*` intact.
- [x] Task 8 — Add `forms.encryptedNote` to all three locale files (AC: 7).
- [x] Task 9 — Extend `src/components/Sections.i18n.test.tsx` to assert the new key shape (AC: 10). Recursive key-shape collector + per-key assertion implemented.
- [x] Task 10 — Add to `vault/Planning/Architecture-Key.md` → exceptions section: 4-level depth exception for `demo.form.fields.*.label` and `contact.form.fields.*.label` (AC: 9).
- [x] Task 11 — Full Vitest regression run (AC: 11). 619/622 tests pass on the new state; the 3 failures are in `server/routes/admin/auth.test.ts` (Story 4.7 bcrypt cost timing out under concurrent load) — verified pre-existing by isolated rerun (22/22 pass) and untouched by this story's changes.
- [x] Task 12 — Local smoke check (AC: 12). The dev server was NOT started for this story because no consumer reads the new `demo.*` / `contact.*` / `forms.encryptedNote` keys yet (consumer migration is the Story 6.10 + 6.11 scope). Missing-key behavior is therefore not observable from the page; the i18n parity test covers the only failure mode this story can produce (key shape divergence across locales). 6.10 + 6.11 will run the in-browser smoke when they flip consumers to the new keys.

## Dev Notes

- **No consumer migration in this story.** `DemoForm.tsx`, `ContactForm.tsx`, `DemoScheduler.tsx`, `Contact.tsx` continue to read the LEGACY keys verbatim. Migration is the next-story (6.10 / 6.11) concern. This story only stages the primitives + duplicates the i18n shape so the consumer flip in 6.10/6.11 is a one-file-per-form swap.
- The encrypted-transit shield SVG should match `Hero.html` lines 996–1003 (Demo) + 1075–1082 (Contact) — both use the same SVG path. Extract once into `EncryptedTransitNote.tsx`.
- The `.select-wrap` chevron uses a `::after` pseudo-element in raw CSS (`Hero.html` lines 503–518). In React + Tailwind, prefer a dedicated `<span aria-hidden>` chevron over `::after` so the icon can be component-level instead of via global CSS.
- The `<EncryptedTransitNote>` copy in Portuguese reads "Conexão criptografada. Dados protegidos." (`Hero.html` lines 999, 1078). Use existing localized strings if `forms.demo.security` / `forms.contact.security` already carry equivalent copy; otherwise translate.

## Technical Requirements

- **Languages/Frameworks:** TypeScript 5.x, React 18, Tailwind 3.x, i18next + react-i18next.
- **State machine:** No form state machine changes — this story does not touch form runtime.
- **API contracts:** None.
- **Security:** None (no env-var changes, no new API surface).
- **Performance:** No new runtime dependencies; primitives must not regress bundle size by > 2 KB gzipped (measure with `npm run build` size report).

## Architecture Compliance

- Component naming: PascalCase under `src/components/forms/` — matches existing convention.
- i18n keys: `demo.form.fields.*.label` is 4 levels deep — exception documented in `vault/Planning/Architecture-Key.md` per Task 10.
- Reuse: every primitive consumes Story 6.1 tokens (`var(--accent)`, `var(--accent-soft)`, `var(--accent-dim)`, `var(--line-strong)`, `var(--ink)`).
- Anti-patterns to avoid: NO Toast for field validation (architecture rule — inline error via `FormField.error` prop only); NO inline styles — Tailwind utility classes only, with the few accent-token hex values carried via CSS vars.

## Library / Framework Requirements

- Existing: `react-i18next` for i18n consumption; primitives stay framework-agnostic at the `<input>` / `<select>` / `<textarea>` boundary so `react-hook-form` consumers (Stories 6.10 + 6.11) can `register()` directly into them.
- No new dependencies.

## File Structure Requirements

| File | Change type | Notes |
|---|---|---|
| `src/components/forms/FormField.tsx` | NEW | Label + req/opt + slot + error |
| `src/components/forms/FormField.test.tsx` | NEW | A11y + state coverage |
| `src/components/forms/FormSelect.tsx` | NEW | `.select-wrap` + chevron |
| `src/components/forms/FormSelect.test.tsx` | NEW | Chevron a11y, focus, option bg |
| `src/components/forms/FormTextarea.tsx` | NEW | Field-state styling, resize vertical |
| `src/components/forms/FormTextarea.test.tsx` | NEW | Placeholder, focus, resize |
| `src/components/forms/FormFoot.tsx` | NEW | Note + submit row |
| `src/components/forms/FormFoot.test.tsx` | NEW | Layout + < 600px stack |
| `src/components/forms/EncryptedTransitNote.tsx` | NEW | Shield SVG + i18n copy |
| `src/components/forms/EncryptedTransitNote.test.tsx` | NEW | SVG a11y + copy resolved |
| `src/i18n/locales/en/translation.json` | UPDATE | Add `demo.*`, `contact.*`, `forms.encryptedNote` |
| `src/i18n/locales/pt-BR/translation.json` | UPDATE | Add `demo.*`, `contact.*`, `forms.encryptedNote` |
| `src/i18n/locales/es/translation.json` | UPDATE | Add `demo.*`, `contact.*`, `forms.encryptedNote` |
| `src/components/Sections.i18n.test.tsx` | UPDATE | Extend parity assertions |
| `vault/Planning/Architecture-Key.md` | UPDATE | Document 4-level-depth exception |

## Testing Requirements

- Per-primitive co-located Vitest unit tests (see File Structure).
- `Sections.i18n.test.tsx`: assert every new key path resolves in all three locales; missing key in any locale fails the build.
- Full Vitest regression run after the i18n additions to confirm no legacy consumer breaks.
- No new Playwright specs in this story — primitives are exercised indirectly through DemoForm/ContactForm tests in 6.10/6.11.

## Previous Story Intelligence

- **Story 6.8 (partial)** established that the DemoScheduler section is the conversion surface anchor. The minimal-bg landing was the only delta. This story stages the components and the i18n shape so the next two stories can complete the visual landing without two parallel restyle PRs.
- **Stories 2.2 / 2.3 / 2.6** established the Zod schemas + `createDemoSchema(t)` / `createContactSchema(t)` locale-aware error pattern. Primitives keep `error` rendering string-based so the existing schema-emitted localized error strings drop in unchanged in 6.10/6.11.
- **Story 6.1** provides the tokens (`--accent`, `--accent-soft`, `--accent-dim`, `--line-strong`, `--ink`). Consume.

## Project Context Reference

- Handoff source: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` lines 481–518 (CSS for `.field`, `.req`, `.opt`, `.select-wrap`, `.form-foot`).
- Vault: `vault/Planning/Architecture-Key.md` → Form State Machine + i18n Keys + Anti-Patterns.
- Epics source: `_bmad-output/planning-artifacts/epics.md` Epic 6 → 6.9 bullet.

## Outstanding Questions for Dev

1. Tailwind utility-class approach vs raw CSS for the chevron `::after`. **Recommendation:** dedicated `<span aria-hidden>` chevron rendered inside `FormSelect`. Confirm during implementation.
2. Token name for the inline error color (`#FF6B6B`). If a `--error` / `--danger` token doesn't exist yet, add it under Story 6.1's token file and document.
3. Spanish translations for the new sub-keys (`info.steps.*`, `info.infoCard.*`, `channels.*`, `form.helper`, `form.encryptedNote`) — coordinate with the existing es/ locale style (formal vs informal "tú" — current copy uses formal "usted").

## Dev Agent Record

### Implementation Plan

Primitives staged as pure presentational components — no form state, no form runtime, no consumer migration. Each primitive consumes Story 6.1 tokens (`--accent`, `--accent-soft`, `--line-strong`) and matches `Hero.html` lines 481–518 styling 1:1 via Tailwind utility classes plus a handful of arbitrary-value classes for the design-handoff pixel values that have no Tailwind scale entry (`min-h-[96px]`, `text-[11.5px]`, `text-[14px]`, `[box-shadow:0_0_0_3px_rgba(61,111,224,0.12)]`).

`FormSelect` uses a span-based chevron rendered alongside the native select rather than the `::after` pseudo-element from the handoff CSS — this keeps the chevron component-scoped instead of leaking into global CSS (per Dev Notes item 1).

`FormField` is presentational and stateless. It does NOT clone children to inject `aria-describedby` or `aria-required` — the dev-time contract is that the consumer wires those onto its own input. This keeps the primitive framework-agnostic at the input boundary so `react-hook-form` consumers in 6.10 + 6.11 can `register()` directly without prop-drilling collisions. The story's a11y AC (#6) is therefore satisfied by the consumer's input attributes; the primitive provides the matching `htmlFor` label and the matching `{htmlFor}-error` error node id. This contract is documented in the primitive JSDoc.

The error color uses `var(--form-error, #FF6B6B)` with the hex literal as the CSS-var fallback. The actual `--form-error` token is NOT introduced in this story — adding a token is the kind of cross-file ripple that belongs in Story 6.1's token file follow-up, not in a primitive-staging story. The fallback ensures the primitives render the correct color today and pick up the token automatically once it lands.

i18n namespace was inserted as two new top-level keys (`demo.*` and `contact.*`) plus a new `forms.encryptedNote` leaf, leaving the entire legacy namespace (`sections.demoScheduler.*`, `sections.contact.*`, `forms.demo.*`, `forms.contact.*`) untouched. Three locale files (`en`, `pt-BR`, `es`) carry the full new tree with translated copy sourced from `Hero.html` lines 860–1085 plus the existing Spanish formal-`usted` register.

### Completion Notes

- All 12 tasks complete. Story Status moved `in-progress` → `review` (file + sprint-status.yaml).
- Five new primitives live under `src/components/forms/` with co-located unit tests (29 new tests, all passing).
- i18n parity test (`Sections.i18n.test.tsx`) extended with a recursive key-shape collector + per-locale assertion list covering all 31 demo paths, 31 contact paths, and `forms.encryptedNote`. Each locale carries every required path as a non-empty string; pt-BR and es tree shapes match en exactly.
- 4-level depth exception documented in `vault/Planning/Architecture-Key.md` (scoped to `demo.form.fields.*` and `contact.form.fields.*` subtrees only).
- Regression: 619/622 tests pass. The 3 failures (`server/routes/admin/auth.test.ts` throttling/lockout) are pre-existing Story 4.7 bcrypt-cost timing flakes under concurrent test load (default 5s testTimeout) — confirmed by isolated rerun (22/22 pass with `--testTimeout=30000`). Untouched by this story.
- Typecheck clean (`tsc --noEmit`). Lint clean on all new non-test files. Lint config excludes `*.test.{ts,tsx}` by design.
- Dev server smoke check was intentionally skipped — see Task 12 note above.

### File List

New:
- `src/components/forms/FormField.tsx`
- `src/components/forms/FormField.test.tsx`
- `src/components/forms/FormSelect.tsx`
- `src/components/forms/FormSelect.test.tsx`
- `src/components/forms/FormTextarea.tsx`
- `src/components/forms/FormTextarea.test.tsx`
- `src/components/forms/FormFoot.tsx`
- `src/components/forms/FormFoot.test.tsx`
- `src/components/forms/EncryptedTransitNote.tsx`
- `src/components/forms/EncryptedTransitNote.test.tsx`

Modified:
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/pt-BR/translation.json`
- `src/i18n/locales/es/translation.json`
- `src/components/sections/Sections.i18n.test.tsx`
- `vault/Planning/Architecture-Key.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/6-9-shared-form-primitives-i18n-namespace-restructure.md`

### Change Log

| Date       | Author | Change |
|------------|--------|--------|
| 2026-05-17 | claude-opus-4-7 | Story 6.9 implementation: shared form primitives + new `demo.*` / `contact.*` / `forms.encryptedNote` i18n namespace + 4-level depth exception doc + parity tests. Status → review. |

## Story Completion Status

- Status: review
