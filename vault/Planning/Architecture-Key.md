# Architecture — Key Decisions

Source: `_bmad-output/planning-artifacts/architecture.md`

---

## Core Decisions

### Data
- **Raw SQL + DAO pattern** (no ORM). Use ANSI SQL only — SQLite now, PostgreSQL-portable.
- DAO files: `server/dao/leads.dao.ts`, `contacts.dao.ts`, `team.dao.ts`, `admin.dao.ts`
- All SQL lives in DAO files — NEVER raw SQL in route handlers

### Auth (Phase 3)
- JWT in **httpOnly cookie** — SameSite=Strict, 8h expiry
- Payload: `{ adminId, email, iat, exp }`
- Auth middleware: verify → `req.admin` → next. 401 on invalid/expired
- Admin account: CLI-only via `db.seed.ts`. No UI password reset Phase 1–3

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

---

## Canonical Frontend Patterns (from Epic 1 retro)

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
