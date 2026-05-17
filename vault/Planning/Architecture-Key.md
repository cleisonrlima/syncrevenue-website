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
- These appear in the manifest because the text-surface audit includes every brand foreground on `white`, `offwhite`, and `navy`; they carry `R-NT1` waivers so the test enforcement remains strict for genuine body-text pairs without false positives here.

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

### SEO canonical / hreflang self-reference (Story 3.11)

Per Google's `Localized versions` guidance: every language variant's `<link rel="canonical">` and `<meta property="og:url">` must match its own `<link rel="alternate" hreflang="<locale>">` URL exactly — **including the default locale**.

- Runtime `useDocumentMeta` (`src/components/SEO.tsx`) calls `getCanonicalUrl(path, locale)` for every locale, including `en` (yields `?lng=en`).
- Sitemap `<loc>` (`scripts/generate-seo-assets.mjs`) stays as the no-lng URL — it doubles as the `x-default` signal. Do not duplicate `?lng=` into `<loc>`.
- Static `index.html` keeps the no-lng URL in the pre-hydration `<link rel="canonical">` / `<meta property="og:url">` (acts as x-default before JS hydrates); hydration overwrites with `?lng=en`.
- Approach (B) — moving sitemap `<loc>` to `?lng=<locale>` per variant — was rejected to keep the sitemap matrix terse.
