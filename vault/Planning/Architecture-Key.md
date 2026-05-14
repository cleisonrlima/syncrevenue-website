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
