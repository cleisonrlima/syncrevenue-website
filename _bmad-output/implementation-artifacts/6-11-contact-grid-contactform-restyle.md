# Story 6.11: Contact 40/60 Grid + ContactForm Restyle + Section ID Rename

Status: ready-for-dev

Epic: 6 — Visual Design Refresh (Claude Design Handoff)

Source design: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` lines 449–518 (CSS) + 1019–1090 (Contact markup).

Depends on: Story 6.1 (sober tokens), Story 6.6 (`SectionShell`), Story 6.9 (shared form primitives + `contact.*` i18n namespace).

Follow-up of: Story 6.8 deferrals 3, 4, 7 (Contact section grid, ContactForm restyle, section id rename).

## Story

As a visitor wanting to reach commercial / support / partnerships / press routing,
I want the "Contato" section to share the same sober 40/60 layout pattern as the demo section, with three labeled channel rows on the left and a clean form-card on the right,
So that the conversion rhythm carries through from hero to demo to contact consistently — without disrupting the Story 2.3 / 2.6 / 2.7 functional surface.

## Acceptance Criteria — Contact section

1. **Given** the section renders **When** inspected **Then** the wrapper is `<section class="sec" id="contato">` (id renamed from `contact`; NOT `sec-deep` to preserve the alternating bg rhythm with `agendar-demo` above); `SectionShell` from Story 6.6 renders eyebrow "Contato", heading "Fale com a <span class='accent'>SyncSirius</span>" (accent span via `<Trans>`), and the subhead about commercial / support / partnerships / press routing.

2. **Given** the section body renders **When** inspected **Then** a `.form-grid` (`grid-template-columns:minmax(0,1fr) minmax(0,1.35fr); gap:40px; align-items:start; max-width:1180px`) holds info-side left + form-card right; collapses to single column at < 900px.

3. **Given** the contact info side renders **When** inspected **Then** a `.channels` flex column (`gap:18px`) displays three `.channel` rows in order: E-mail (mailto link), Telefone (tel link), Sede (static address); each row has a 36×36 accent icon-box on the left (`background:var(--accent-dim); color:var(--accent-soft); border-radius:9px`) + `<div>` with `<strong>` label (`contact.channels.{i}.label`) above value (`contact.channels.{i}.value`); E-mail and Telefone values are wrapped in real `<a>` tags (`mailto:` / `tel:`) preserving the accent text color; Sede value is a static `<span>`.

4. **Given** the info-card renders **When** inspected **Then** below `.channels`, an `.info-card` displays "Tempo médio de resposta" (from `contact.infoCard.title`) + "Menos de 4 horas em dias úteis." (from `contact.infoCard.subtitle`).

5. **Given** the section id rename **When** any in-page nav link or test asserts the section selector **Then** all consumers reference `#contato`; the Navbar 6.2 "Contato" link target is updated.

## Acceptance Criteria — ContactForm restyle

6. **Given** the contact form-card renders **When** inspected **Then** `<form class="form-card" aria-label={t('contact.form.heading')}>` carries the same `.form-card` pattern as Story 6.10 AC 6 (32px padding desktop, 24px < 600px, 14px radius, `rgba(255,255,255,.035)` bg, `--line-strong` border); contains a `.form-head` with `<h3>` (`contact.form.heading`) + helper paragraph (`contact.form.helper`).

7. **Given** the form fields render **When** inspected **Then** the existing field set from Story 2.3 renders in this exact order using Story 6.9 primitives:
   - row 1 (`.form-row` grid 1/1): `FormField` Nome (required) / `FormField` E-mail (required)
   - row 2 (full-width): `FormSelect` Assunto (required) with the existing subject enum from Story 2.3 — `commercial` / `support` / `partnerships` / `press` / `other` — labels resolved from `contact.form.fields.subject.options.*`
   - row 3 (full-width): `FormTextarea` Mensagem (required)

8. **Given** the form-foot renders **When** inspected **Then** `<FormFoot>` carries `<EncryptedTransitNote>` on the left and the solid-accent `.btn-lg` submit button on the right; submit copy from `contact.form.submit` (renders "Enviar mensagem" PT / "Send message" EN / "Enviar mensaje" ES) with a paper-plane SVG (`aria-hidden`) prepended to the label per `Hero.html` line 1086.

9. **Given** the existing functional surface from Stories 2.3 / 2.6 / 2.7 **When** the restyle lands **Then** all behavior is preserved verbatim: `createContactSchema(t)` Zod schema, subject enum strictness (native HTML `required`), `useContact` hook, fire-and-forget SMTP, rate-limit 429 → inline error path with the exact body from Story 2.7, `aria-live="polite"` confirmation region replacing the form on success.

10. **Given** validation fires on blur **When** a required field is empty or invalid **Then** the locale-aware error renders via `FormField.error`; `aria-describedby` links field → error; submit stays disabled-until-valid; NO Toast for field validation.

## Acceptance Criteria — Test surface

11. **Given** the Contact test file **When** Vitest runs **Then** assertions exist for: section id `#contato`, `.sec` class (NOT `sec-deep`), eyebrow / heading / subhead resolved from `contact.*` keys, `.form-grid` two-column layout, three `.channel` rows present with mailto / tel / static, info-card title / subtitle present.

12. **Given** the ContactForm test surface **When** Vitest runs **Then** all existing Story 2.3 / 2.6 / 2.7 assertions still pass (subject enum lock, submit success/error transitions, 429 inline error, `aria-live="polite"` confirmation); NEW assertions: required asterisk visible on required fields, custom chevron `aria-hidden="true"` on Assunto select, accent focus ring class applied, submit copy includes paper-plane SVG with `aria-hidden`.

13. **Given** the Playwright e2e `contact-form.spec.ts` runs **When** the test walks the form **Then** selectors updated to `#contato` and new field labels; the happy path + 429 + locale-allowlist coverage from Story 2.7 still passes; zero axe serious/critical violations on the contact region.

## Tasks / Subtasks

- [ ] Task 1 — Rewrite `src/components/sections/Contact.tsx` to render `SectionShell` + `.form-grid` two-column layout + `.channels` info-side (Task 2) + `<ContactForm>` right column (AC: 1, 2, 5). Rename id `contact` → `contato`.
- [ ] Task 2 — Render the three `.channel` rows from `contact.channels.0..2.{label,value,kind}` with kind-aware wrapping: `mailto:` for kind=email, `tel:` for kind=phone, static `<span>` for kind=address (AC: 3).
- [ ] Task 3 — Render the `.info-card` resolved from `contact.infoCard.*` (AC: 4).
- [ ] Task 4 — Update Navbar 6.2's "Contato" link target to `#contato` (AC: 5).
- [ ] Task 5 — Rewrite `src/components/sections/ContactForm.tsx` to consume Story 6.9 primitives (`FormField`, `FormSelect`, `FormTextarea`, `FormFoot`, `EncryptedTransitNote`); preserve hook + schema + subject enum (AC: 6, 7, 8, 9, 10).
- [ ] Task 6 — Swap ContactForm's i18n key reads from legacy `forms.contact.fields.*` + `sections.contact.*` to the new `contact.form.fields.*` + `contact.*` namespace (Story 6.9 AC 7) (AC: 7).
- [ ] Task 7 — Update `src/components/sections/Contact.test.tsx` for new layout / id / channels / info-card assertions (AC: 11).
- [ ] Task 8 — Update `src/components/sections/ContactForm.test.tsx` for new asterisk / chevron / focus-ring / paper-plane assertions; preserve all Story 2.3 / 2.6 / 2.7 assertions (AC: 12).
- [ ] Task 9 — Update `tests/e2e/contact-form.spec.ts` selectors + any home-page e2e specs that target `#contact` to use `#contato` (AC: 13). Confirm axe run shows zero serious/critical on the contact region.
- [ ] Task 10 — Full Vitest regression + `npm run build` + targeted Playwright run; confirm green.

## Dev Notes

- The Contact section MUST stay `<section class="sec">` (NOT `sec-deep`) so the alternating dark-bg rhythm with `<section class="sec sec-deep" id="agendar-demo">` above is preserved. Confirm with the Story 6.5 / 6.6 / 6.7 background convention.
- The `<Trans>` component is required for the accent-span in the heading ("SyncSirius"). Match the pattern from Story 6.3 + Story 6.10 hero/demo headings.
- The paper-plane SVG in the submit button comes from `Hero.html` line 1086 — extract once and inline or co-locate with `ContactForm.tsx`. Mark `aria-hidden="true"`.
- The contact channels' kind field determines the wrapping element (`mailto:` / `tel:` / static). The `kind` key in `contact.channels.{i}.kind` is metadata (not displayed); E-mail = "email" / Telefone = "phone" / Sede = "address".
- Section id rename has fanout: search for `#contact` across `src/`, `tests/`, `e2e/`, and any nav config; update all hits.

## Technical Requirements

- **Languages/Frameworks:** TypeScript 5.x, React 18, Tailwind 3.x, i18next, Zod, react-hook-form, `@hookform/resolvers/zod`.
- **State machine:** EXISTING `'idle' | 'submitting' | 'success' | 'error'`. Preserved verbatim.
- **API contracts:** `POST /api/contact` unchanged.
- **Security:** Rate-limit + locale allowlist + helmet headers preserved (Story 2.7).
- **Performance:** No new runtime dependencies; bundle delta ≤ 1 KB gzipped after consuming Story 6.9 primitives.

## Architecture Compliance

- Component naming: `Contact.tsx`, `ContactForm.tsx` — refactor in place.
- i18n keys: consumes Story 6.9's new `contact.*` namespace. Legacy `sections.contact.*` + `forms.contact.*` are NOT deleted here.
- Reuse: `SectionShell` (6.6), all 6.9 primitives, flat-accent `Button` (6.1).
- Anti-patterns to avoid: NO Toast for field validation; NO new subject enum values (locked by Story 2.3); NO date formatting server-side.

## Library / Framework Requirements

- Existing: `react-hook-form` + `@hookform/resolvers/zod`; `zod`; shadcn `Toast` (transport-error only).
- `<Trans>` for accent span ("SyncSirius").
- No new dependencies.

## File Structure Requirements

| File | Change type | Notes |
|---|---|---|
| `src/components/sections/Contact.tsx` | UPDATE | SectionShell + 40/60 grid + channels + info-card; id rename |
| `src/components/sections/Contact.test.tsx` | UPDATE | New layout / id / channels / info-card assertions |
| `src/components/sections/ContactForm.tsx` | UPDATE | Consume 6.9 primitives; swap to `contact.form.*` i18n keys |
| `src/components/sections/ContactForm.test.tsx` | UPDATE | New asterisk / chevron / focus-ring / paper-plane assertions; preserve all prior |
| `src/components/Navbar.tsx` | UPDATE | "Contato" link target → `#contato` |
| `tests/e2e/contact-form.spec.ts` | UPDATE | Selectors → `#contato` |
| Various home-page e2e specs | UPDATE | `#contact` → `#contato` |

## Testing Requirements

- `Contact.test.tsx`: id, `.sec` class (NOT `sec-deep`), `.form-grid`, `.channels` rows = 3 with kind-aware wrappers, `.info-card` content.
- `ContactForm.test.tsx`: all Stories 2.3 / 2.6 / 2.7 prior assertions PRESERVED; new asterisk + chevron a11y + focus-ring + paper-plane assertions.
- Playwright `contact-form.spec.ts`: happy path + 429 + locale-allowlist coverage + a11y axe sweep on the contact region.
- Full Vitest regression + `npm run build`.

## Previous Story Intelligence

- **Story 2.3** locked the contact subject enum + functional surface. VISUAL refresh ONLY — DO NOT touch enum, schema, hook, or route.
- **Story 2.6** locked locale-aware error messages via `createContactSchema(t)`.
- **Story 2.7** locked 429 inline-error body + locale allowlist server-side.
- **Story 6.1** provides tokens. **Story 6.6** provides `SectionShell`.
- **Story 6.9** provides the form primitives + new `contact.*` i18n namespace.

## Project Context Reference

- Handoff source: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html` lines 1019–1090 (Contact markup).
- Vault: `vault/Planning/Architecture-Key.md` → Form State Machine + Error Handling Rules.
- Epics source: `_bmad-output/planning-artifacts/epics.md` Epic 6 → 6.11 bullet.

## Outstanding Questions for Dev

1. The `contact.channels.{i}.kind` shape: should `kind` be a string discriminator (`"email"` / `"phone"` / `"address"`) or an index-based switch in the component? Recommendation: explicit discriminator key for forward-flexibility (e.g., adding WhatsApp later). Confirm during implementation.
2. Whether to add `rel="noopener"` or similar attributes to `mailto:` / `tel:` links — these are not standard for those protocols but some lint rules flag missing rel attrs. Document the choice.
3. Section id rename impact on any sitemap.xml deep-link entries (Story 3.3 SEO). Check `public/sitemap.xml` for `#contact` references and update.

## Story Completion Status

- Status: ready-for-dev
