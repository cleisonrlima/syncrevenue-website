# Architecture — Key Decisions

Source: `_bmad-output/planning-artifacts/architecture.md`

---

## Core Decisions

### Data
- **Raw SQL + DAO pattern** (no ORM). Use ANSI SQL only — SQLite now, PostgreSQL-portable.
- DAO files: `server/dao/leads.dao.ts`, `contacts.dao.ts`, `team.dao.ts`, `admin.dao.ts`
- All SQL lives in DAO files — NEVER raw SQL in route handlers

### Auth (Phase 3)
- JWT in **httpOnly cookie** — cookie name `admin_token`, SameSite=Strict, 8h expiry, `secure` only in production
- Payload: `{ adminId, email, tokenVersion, iat, exp }` (Story 4.8 adds `tokenVersion`)
- Auth middleware (`requireAdmin`): verify → load `admin_users` by `adminId` → strict `payload.tokenVersion === row.token_version` → `req.admin = { adminId, email }` → next. 401 on invalid/expired/missing-row/stale-tokenVersion (legacy tokens missing the claim fail by `undefined !== <number>`), 500 when `JWT_SECRET` missing
- **JWT revocation (Story 4.8)**: `admin_users.token_version INTEGER NOT NULL DEFAULT 0`. `adminDao.upsert` bumps the counter whenever the row already exists (i.e., every `npm run db:seed` against an existing admin). Trade-off: a same-password re-seed ALSO bumps and revokes outstanding tokens — simpler than diff-detection and avoids a timing channel on hash existence. Acceptable for Phase 3 (single admin, low frequency). DB read per protected request — admin traffic is single-digit RPS; no cache layer.
- Admin account: CLI-only via `npm run db:seed` (reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` env, bcrypt salt 12, idempotent upsert). No UI password reset Phase 1–3
- bcrypt: **bcryptjs** package (NOT `bcrypt`); use `bcrypt.compareSync`/`hashSync` to keep route handlers synchronous
- Invalid credentials: same 401 + `'Invalid credentials'` for unknown email AND wrong password (no info leak)
- **Login throttling (Story 4.7)**:
  - **Per-IP**: `express-rate-limit` 5 / 15min on `POST /api/admin/auth/login`. 6th attempt → 429 `{success:false,message:'Too many requests'}`. Limiter instance independent of the form limiters (no cross-route exhaustion).
  - **Per-email**: durable counter in `admin_login_attempts` table — 5 failures within a rolling 15-min window (relative to `last_failed_at`) ⇒ account locked. Locked attempts respond with the SAME `401 'Invalid credentials'` (no `'Account locked'` message) — locked-account, unknown-email, and wrong-password are indistinguishable by status, body, and timing (lockout branch runs the dummy bcrypt compare for timing parity).
  - Locked-account responses do NOT increment the counter (prevents permanent lockout via continued knocking). Successful login resets the counter atomically before issuing the cookie. Counter persists across server restarts.
- Frontend admin session: Zustand store is a render cache only — NO `persist` middleware. Cookie + `GET /me` is the truth. `AdminLayout` calls `useAdmin().bootstrap()` on mount to hydrate the store from `/me` before rendering protected routes.
- Status-code → i18n key mapping on the client (not raw API message): 401 → `admin.login.errors.invalidCredentials`, network → `admin.login.errors.network`.

### Middleware Stack (Express)
```
helmet() → cors() → express.json() → rateLimit (form routes) → auth (admin routes) → route handlers
```

### Routing
- React Router v7 with nested admin routes
- Admin lives under `/admin/*` — separate layout, JWT-gated

### API
- RESTful internal API, no public consumers, no GraphQL
- All routes under `/api/*`

---

## Naming Rules (STRICT)

| Context | Convention |
|---|---|
| DB tables | `snake_case` plural — `demo_requests`, `team_members` |
| DB columns | `snake_case` — `created_at`, `order_index`, `password_hash` |
| API JSON | `snake_case` — no transforms, no camelCase ever |
| React components | `PascalCase` — `Hero.tsx`, `DemoForm.tsx` |
| Hooks | `use` prefix camelCase — `useDemo.ts` |
| Zustand stores | `use{Domain}Store` |
| DAOs | `{domain}.dao.ts` |
| Zod schemas | `{domain}.schema.ts` |

---

## API Response Envelope
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "..." }
```
Always this shape. No exceptions.

---

## i18n Keys
Dot-nested, max 3 levels: `section.element` or `section.subsection.element`
```json
{ "forms": { "demo": { "emailError": "..." } } }
```
Never flat (`heroHeadline`). Never 4+ levels.

### Exception — Story 6.9 (2026-05-17): `demo.form.fields.*.label` / `contact.form.fields.*.label`
The `demo.*` and `contact.*` namespaces introduced in Story 6.9 reach 4 levels at the field-label leaf (e.g. `demo.form.fields.name.label`, `demo.form.fields.phone.optional`, `contact.form.fields.subject.options.commercial`). This depth is intentional and driven by the Hero.html design-handoff spec shape (`Hero.html` lines 481–518, 860–1085) — restructuring around the 3-level rule would lose the spec's `section → form → fields → field → attribute` mental model. Restricted to the form-field subtree of `demo.*` and `contact.*` only. No other surface may exceed 3 levels.

---

## Form State Machine
```typescript
'idle' | 'submitting' | 'success' | 'error'
```
All form hooks use this exact union. Success replaces form inline (FR12). Errors inline below form — never toast for validation.

---

## Locale Flow (always this order)
```typescript
i18next.changeLanguage(locale)
useLocaleStore.setState({ locale })
localStorage.setItem('i18nextLng', locale)
```
Capture locale in every form payload. Source locale from `useLocaleStore` in components — never directly from i18next.

---

## Loading Patterns
- Section lazy load: `<Suspense fallback={<SectionSkeleton className="h-[600px]" />}>`
- Form submit: button disabled + spinner inside button
- Admin tables: shadcn Skeleton rows

---

## Error Handling Rules
- Form validation: inline via `<FormMessage>` — never toast
- Submit success: inline confirmation replaces form
- Rate limit 429: inline error in active locale
- SMTP failure: server log only — visitor sees success
- Server 500: generic inline error — no technical detail to client
- Admin auth failure: redirect to `/admin/login`

---

## Test Structure
Co-located — never `__tests__/` directories:
```
src/components/sections/Hero.tsx
src/components/sections/Hero.test.tsx
server/dao/leads.dao.ts
server/dao/leads.dao.test.ts
```

---

## Anti-Patterns (NEVER DO)
- camelCase in API responses
- Flat i18n keys
- Raw SQL in route handlers
- Toast for form validation errors
- Server-side date formatting (format client-side only)
- `VITE_` prefix on secrets

---

## WCAG Contrast Exceptions (documented waivers)

### R-A2 — Electric Blue `#0075F0` body-text contrast

- **Measured contrast on white:** 4.37 : 1 (fails WCAG AA for normal-weight body text ≥ 4.5 : 1)
- **Discovered:** Story 1.6 review (eyebrow rendered in `text-brand-electric-blue` regressed contrast on light bg)
- **Decision:** `#0075F0` is reserved for **large-text only** (≥ 18pt or ≥ 14pt bold), **gradient stops**, and **decorative accents**. Body text on `bg-white` / `bg-brand-offwhite` MUST use `text-brand-deep` (`#0055F0`, ≈ 4.7 : 1).
- **Authorized by:** Pri (Project Lead), 2026-05-15.
- **Enforcement:** `src/lib/brand-tokens.contrast.test.ts` locks the exception. Any new component using `text-brand-electric-blue` for normal-weight body must fail review.
- **Source artifacts:** `_bmad-output/implementation-artifacts/1-6-syncrevenue-services-sections.md` (review section), `_bmad-output/test-artifacts/test-design/test-design-epic-1.md` (R-A2).

### Brand-deep `#0055F0` is the default eyebrow / accent body color on light backgrounds.

### R-A2 family extension — `highlight #00A0F0` and `electric-blue` on dark surfaces

- **Same family as R-A2.** `#00A0F0` measures 2.66:1 on offwhite and 2.88:1 on white — even lighter than electric-blue. Reserve for the gradient stops and decorative accents that use it today (`tailwind.config.ts` `gradient-brand`). Body text never resolves to `text-brand-highlight`.
- **`electric-blue` on `navy`** measures 4.23:1 — fails AA Normal, passes AA Large. Same reservation: gradient stops, hairlines, decorative accents on dark surfaces only.
- **Enforcement:** `src/lib/brand-tokens.contrast.manifest.ts` carries the R-A2 waiver for these pairs; the manifest test fails if a new pair drifts in without a waiver.

### R-M1 — `muted #8080A0` is helper-text only

- **Measured contrast:** 3.81:1 on white, 3.52:1 on offwhite — passes AA Large (≥ 3:1), fails AA Normal (≥ 4.5:1).
- **Decision:** `text-brand-muted` is reserved for de-emphasized helper text, meta labels, and form hints. Normal-weight body text uses `text-brand-slate` or `text-brand-navy`.
- **Enforcement:** manifest waiver `R-M1` on `muted → white` and `muted → offwhite`.

### R-NT1 — structural non-text pairs

- Token combinations that are not used for text in production: `offwhite ↔ white` (surface-on-surface), `deep → navy` and `slate → navy` (light-surface accent tokens never applied on dark surfaces).
- These appear in the manifest because the text-surface audit includes every brand foreground on `white`, `offwhite`, `navy`, and `ink`; they carry `R-NT1` waivers so the test enforcement remains strict for genuine body-text pairs without false positives here.
- Epic 6 extension: `ink ↔ navy` (both dark surfaces, never text-on-text), `ink → white|offwhite` (ink is a dark-surface token; never foreground on light), legacy `highlight|muted|deep|slate → ink` (legacy light-surface foregrounds never paired with the new `ink` dark surface).

### R-A3 — Sober accent `#3D6FE0` on dark surfaces (Epic 6)

- **Measured contrast:** ≈ 4.00:1 on navy `#0D0D3A` (spec target ≈ 3.97:1), ≈ 4.13:1 on ink `#0A0B2E`.
- **Passes:** WCAG AA Large (≥ 3:1).
- **Fails:** WCAG AA Normal (< 4.5:1).
- **Decision:** `#3D6FE0` is the sober brand accent introduced by the Anthropic Claude design handoff (Epic 6 — 2026-05-17). Reserve for **large/decorative usage on dark surfaces** — Hero CTA buttons, KPI numerals, icon accents, hairlines. Body text on dark surfaces continues to use `white` / `offwhite` (both ≥ 17:1 on navy/ink — AAA).
- **Light-surface usage:** `accent → white` measures ≈ 4.62:1 (passes AA Normal by a thin margin). Manifest still flags it under `R-A3` so designers default to large/decorative usage; promotion to body text on light surfaces is deferred to a later Epic 6 light-surface pass.
- **Authorized by:** Pri (Project Lead), 2026-05-17 (Epic 6 design handoff acceptance).
- **Enforcement:** `src/lib/brand-tokens.contrast.test.ts` `accent on navy carries R-A3 waiver — AA Large only` locks the exception. Manifest entries `accent|*` all carry the `R-A3` waiver and are regenerated by `scripts/check-brand-contrast.mjs`.

---

## Sober Palette Refresh (Epic 6 — 2026-05-17)

Source design: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/project/Hero.html`.

The Anthropic Claude design handoff repositions the public site from techy-futuristic (electric blue gradients on every prominent surface — UX-DR2 / UX-DR3) toward a sober Linear/Stripe register. Story 6.1 lands the foundational tokens additively; per-section retirements happen in stories 6.2–6.8.

**Deliberate divergences from prior architecture decisions:**

- **UX-DR2 — Electric Blue (`#0075F0`) primary accent.** Superseded for new dark-section surfaces by `--accent: #3D6FE0` (sober mid-blue). The electric-blue token is NOT deleted — admin and legacy public surfaces keep it until per-section stories 6.2–6.8 swap them.
- **UX-DR3 — Brand gradient (`bg-gradient-brand`) on prominent CTAs.** Superseded for new CTAs by the `solid-accent` Button variant (flat fill, hover `--accent-soft`, motion-safe `-translate-y-px`). `GradientButton` + `bg-gradient-brand` + `bg-gradient-dark-section` REMAIN available and untouched — used by admin login, current public CTAs, and any future legacy surface.

**New `:root` tokens (`src/index.css`, placed AFTER the shadcn block to win cascade):**

| Token | Value | Purpose |
|---|---|---|
| `--navy` | `#0D0D3A` | Mirror of legacy `--color-navy`; spec-named for handoff alignment. |
| `--ink` | `#0A0B2E` | New dark text-bearing surface (deeper than navy, lifts body contrast into AAA). |
| `--deep-bg` | `#080820` | Near-black page background. Renamed from handoff's `--deep` to avoid clash with legacy `--color-deep: #0055F0`. |
| `--accent` | `#3D6FE0` | Sober brand accent. **Overrides shadcn's `--accent` HSL token** (unused in `src/` at the time of writing — see note below). |
| `--accent-soft` | `#5B85E8` | Hover state for sober accent surfaces. |
| `--accent-dim` | `rgba(61,111,224,0.12)` | Tint for selected/active backgrounds, badge fills. |
| `--line` | `rgba(255,255,255,0.08)` | Hairline divider on dark surfaces. |
| `--line-strong` | `rgba(255,255,255,0.14)` | Stronger divider variant. |
| `--slate-token` | `#7A8099` | New mid-tone label (cooler than legacy `--color-slate: #404070`). |
| `--muted-token` | `#5C6377` | New helper-text token. |
| `--offwhite` | `#F4F6FA` | Identical to legacy `--color-offwhite`; spec-named for handoff alignment. |

**Tailwind aliases (`tailwind.config.ts theme.extend.colors`):** flat names where unique (`ink`, `line`, `line-strong`, `accent-soft`, `accent-dim`, `deep-bg`), `-token` suffix where collision exists (`slate-token`, `muted-token`, `offwhite-token`). The sober-accent fill itself is exposed as `accent-solid` (rather than `accent`) to avoid clobbering shadcn's `accent: { DEFAULT, foreground }` Tailwind key; component code that wants the raw value uses `bg-[var(--accent)]` directly (see `Button.tsx` `solid-accent` variant).

**shadcn `--accent` collision — documented:**

- shadcn ships `--accent: 210 40% 96.1%` (HSL component string for `hsl(var(--accent))` consumers) and `--accent-foreground: 222.2 47.4% 11.2%` in the `:root` shadcn block.
- The new sober-palette `--accent: #3D6FE0` is declared AFTER the shadcn block in the same `:root`, so the brand value wins the cascade for any `var(--accent)` consumer.
- shadcn's `bg-accent` / `text-accent` / `border-accent` Tailwind utilities (which expect HSL component values) consequently resolve to `hsl(#3D6FE0)` — invalid CSS, would silently fail.
- **At the time of writing there are zero consumers of those shadcn-accent utilities in `src/`** (verified via `grep`). The collision creates no current visual regression; the brand value is the one we actually want. Per-section stories 6.2–6.8 fully supersede shadcn theming for the public site. If a future need for the shadcn accent surfaces, rename to `--shadcn-accent` and update the corresponding shadcn alias in `tailwind.config.ts`.

**`solid-accent` Button variant (`src/components/ui/Button.tsx`):**

- Sizes: `sm` / `md` / `lg`. `md` → `padding:11px 20px; font-size:14px; border-radius:10px`. `lg` → `padding:15px 26px; font-size:15px; border-radius:14px`. Matches `Hero.html` `.btn` / `.btn-lg`.
- States: default `bg-[var(--accent)]`, hover `bg-[var(--accent-soft)]` + motion-safe `-translate-y-px`, disabled `opacity-50` + no transform, focus-visible `ring-2 ring-white/60 ring-offset-2`.
- Explicitly NO `bg-gradient-*`, NO box-shadow, NO glow.
- `GradientButton` is preserved unchanged for legacy / admin surfaces.

**Test coverage added:**

- `src/components/ui/Button.test.tsx` — variant × size matrix, disabled-state no-transform, focus-visible ring tokens, no-gradient assertion.
- `src/lib/brand-tokens.contrast.test.ts` — R-A3 waiver (accent on navy AA Large only), white-on-ink AAA, manifest waiver presence assertion.
- `scripts/check-brand-contrast.mjs` — extended TOKENS / SURFACES / WAIVERS for `accent` + `ink`. Manifest regen is now 36 entries (was 21).

### Epic 6 closing inventory (Story 6.12 — 2026-05-19)

**Legacy `--color-*` shim — RETAINED in full.** Direct `var(--color-*)` consumers across `src/**/*.{ts,tsx,css}` outside `src/index.css`: zero. But the Tailwind `brand-*` utility namespace defined in `tailwind.config.ts:21-27` (`brand.electric-blue → var(--color-electric-blue)`, `brand.deep → var(--color-deep)`, `brand.navy`, `brand.highlight`, `brand.slate`, `brand.muted`, `brand.offwhite`) is heavily consumed via `bg-brand-*` / `text-brand-*` / `border-brand-*` classes across `App.tsx`, `LanguageSwitcher.tsx`, `Footer.tsx`, `ErrorBoundary.tsx`, `NotFound.tsx`, `Privacy.tsx`, `SectionHeader.tsx`, `Security.tsx`, `Services.tsx`, `Comparison.tsx`, `SyncRevenue.tsx`, `SectionSkeleton.tsx`, `CommissionAudit.tsx`, `DemoForm.tsx`, `ContactForm.tsx` (incomplete list — every one of the seven tokens has indirect consumers). Per Story 6.12 AC 10 path (a) all seven `--color-*` tokens stay in `src/index.css`. Retiring the shim requires first migrating the Tailwind `brand-*` utility consumers to the sober-palette tokens (`accent`, `ink`, `accent-soft`, `slate-token`, `muted-token`, `offwhite`); that refactor is not yet scoped.

**Retired legacy i18n keys (Story 6.12 — all three locales):** `hero.badge`, `hero.stats.*` (subtree), `hero.tertiaryLink`, `sections.demoScheduler.*` (subtree). Verified zero consumers in `src/`, `tests/` before deletion. Net 69 lines removed; `Sections.i18n.test.tsx` parity suite unchanged (the deleted keys were already excluded from its assertions; tree-shape comparisons cover only `demo.*` and `contact.*`).

**Deferred i18n stragglers (tracked in Story 6.13):** `references.cta` (1 consumer in `ClientReferences.tsx:195`), `forms.demo.*` (2 consumers in `CommissionAudit.tsx:270,291`), `forms.contact.*` (many consumers in `useContact.ts` + `ContactForm.tsx`).

**Epic 6 LHCI baselines (post-bump, captured 2026-05-19 — see `_bmad-output/implementation-artifacts/epic-6-lhci-report-2026-05-19/README.md` for rationale):**

| Config | Assertion | Pre-Epic-6 | Post-6.12 |
|---|---|---|---|
| `lighthouserc.json` | `categories:performance` | 0.90 | 0.90 |
| `lighthouserc.json` | `categories:accessibility` | 1.00 | 0.95 |
| `lighthouserc.json` | `cumulative-layout-shift` (max) | 0.10 | 0.20 |
| `lighthouserc.mobile.json` | `categories:performance` | 0.90 | 0.84 |
| `lighthouserc.mobile.json` | `categories:accessibility` | 1.00 | 0.95 |
| `lighthouserc.mobile.json` | `largest-contentful-paint` (max ms) | 2500 | 4100 |

Story 6.13 ACs require reverting each bump after the corresponding optimisation lands.

---

## Canonical Frontend Patterns (from Epic 1 retro)

> Full catalog: [[Code/Patterns-Gallery]]. The summaries below remain for quick reference; the gallery is the source of truth.


### Lazy + Suspense + ErrorBoundary trio (sections)

```tsx
<ErrorBoundary>
  <Suspense fallback={<SectionSkeleton className="min-h-[400px]" label="Loading section" />}>
    <LazySection />
  </Suspense>
</ErrorBoundary>
```

- Established Story 1.4. Reused unchanged in all seven downstream content sections.
- Prevents white-screen on chunk-load failure; prevents CLS via SectionSkeleton; bounds blast radius of any single section error.
- ErrorBoundary fallback copy intentionally English ("Failed to load section.") — class component cannot use `useTranslation`. Accepted limitation (R-T1, score 3).

### Translation array normalization

`t(key, { returnObjects: true })` returns `unknown`. Every consumer must guard:

```ts
const raw = t('section.items', { returnObjects: true })
const items = Array.isArray(raw) ? (raw as Item[]) : []
```

Centralize via `useTranslatedArray<T>(key)` helper when the third consumer appears (R-T3).

### SectionHeader subtext color override

Use `[&>p:first-of-type]:text-brand-deep` — never unscoped `[&>p]` (regressed in stories 1.6, 1.7, 1.9). DOM-shape dependent; covered by `SectionHeader` render test.

### Motion-safe + reduced-motion

Wrap all animated classes in `motion-safe:` Tailwind variant. Verified against `prefers-reduced-motion: reduce` in P1-7 spec.

### Locale flow (canonical order — already documented above)

`i18next.changeLanguage(locale) → useLocaleStore.setState({ locale }) → localStorage.setItem('i18nextLng', locale)`. Wrap the `setItem` call in `try/catch` for private-browsing / quota errors (R-I2).

### SSG / Prerender — Home-page Hero (Story 5.6)

**Chosen mechanism:** Custom Node.js prerender script `scripts/prerender.tsx`, executed by `tsx` after `vite build`, using `react-dom/server` `renderToString` + `StaticRouter`.

**Why this over alternatives:**
- `vite-plugin-ssg` — only at v0.1.0 on npm (far from the v0.23+ needed for React 18 support). Rejected.
- `react-snap` — requires Puppeteer/Chromium as a dev dep; heavy (~300MB Chromium download per CI runner). Rejected.
- `vite-plugin-prerender-spa-plugin` — requires eject from Vite defaults, adds complexity. Rejected.
- Custom `tsx` script — zero new runtime deps; runs synchronously at build time; full control over i18n init; transparent to the Express SSR-free server topology. **Selected.**

**i18n locale fan-out:** Single canonical `/` prerendered in `en` (default fallback). The client-side locale switch via `react-i18next` handles PT-BR / ES after hydration. Per-locale prerender (`/pt-BR/`, `/es/`) was considered but rejected — adds build complexity for marginal SEO benefit (canonical `useDocumentMeta` + `?lng=` hreflang already cover SEO; the additional prerender routes would require Express routing changes).

**Hydration strategy:** `main.tsx` switched from `ReactDOM.createRoot` to `ReactDOM.hydrateRoot` when `rootElement.innerHTML.trim().length > 0` (pre-rendered markup present); falls back to `createRoot` for dev server and clean `index.html` builds.

**`import.meta.env` SSR-safety fix:** `src/lib/seo.ts` `resolveSiteUrl()` uses `import.meta.env?.VITE_SITE_URL` (optional chaining) so the module can be imported in the Node.js prerender context where `import.meta.env` is `undefined`.

**Excluded routes:** `/admin/*` (auth-required, dynamic), `/privacy` (already minimal, no LCP candidate), `/404` (error page). Only `/` is prerendered.

**Bundle impact:** Zero. `tsx` is already a dev dependency; no new dependencies added. The prerender script is not shipped to the browser.

**Build-time delta:** ~3-4 seconds for the `renderToString` + file write step (within the ≤ 30s constraint).

**Measured LCP improvement (Story 5.6 — 2026-05-20):**

| Metric | Before SSG | After SSG | Target | Status |
|---|---|---|---|---|
| LCP (median 3 runs, LHCI 4G+4×CPU) | ~2,916 ms | **2,259 ms** | < 2,500 ms | ✅ |
| FCP (median 3 runs) | ~2,141 ms | **1,659 ms** | < 2,000 ms | ✅ |
| CLS | 0.000 | 0.000 | < 0.10 | ✅ |
| TBT | 96 ms | 72 ms | < 200 ms | ✅ |
| Performance score | ~84% | **97-98%** | ≥ 90% | ✅ |

LHCI reports: `_bmad-output/implementation-artifacts/story-5-6-lhci-report-2026-05-20/`

**SSR warnings at build time (expected, benign):**
- `useLayoutEffect does nothing on the server` — from `useDocumentMeta` (SEO.tsx); runs correctly after hydration client-side.
- React `fetchPriority` prop casing — React 18 server renderer emits `fetchpriority` (lowercase, correct HTML); the JSX prop name `fetchPriority` triggers a cosmetic warning. Browser handles both correctly.

### SEO canonical / hreflang self-reference (Story 3.11)

Per Google's `Localized versions` guidance: every language variant's `<link rel="canonical">` and `<meta property="og:url">` must match its own `<link rel="alternate" hreflang="<locale>">` URL exactly — **including the default locale**.

- Runtime `useDocumentMeta` (`src/components/SEO.tsx`) calls `getCanonicalUrl(path, locale)` for every locale, including `en` (yields `?lng=en`).
- Sitemap `<loc>` (`scripts/generate-seo-assets.mjs`) stays as the no-lng URL — it doubles as the `x-default` signal. Do not duplicate `?lng=` into `<loc>`.
- Static `index.html` keeps the no-lng URL in the pre-hydration `<link rel="canonical">` / `<meta property="og:url">` (acts as x-default before JS hydrates); hydration overwrites with `?lng=en`.
- Approach (B) — moving sitemap `<loc>` to `?lng=<locale>` per variant — was rejected to keep the sitemap matrix terse.
