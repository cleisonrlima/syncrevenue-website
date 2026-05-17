# Admin Module (Phase 3)

**Auth:** JWT in httpOnly cookie — SameSite=Strict, 8h expiry, cookie name `admin_token`, payload `{ adminId, email, tokenVersion }` (Story 4.8)
**Route prefix:** `/admin/*` (frontend), `/api/admin/*` (backend)

---

## Frontend

| File | Route | Description |
|---|---|---|
| `src/components/layout/AdminLayout.tsx` | `/admin` shell | Auth gate + `/me` bootstrap + locale-stripped meta head |
| `src/pages/admin/Login.tsx` | `/admin/login` | i18n login form, accessible error via `role="alert"` |
| `src/pages/admin/Dashboard.tsx` | `/admin/dashboard` | Minimal landing + logout button (4.6 moves to nav shell) |
| `src/pages/admin/Leads.tsx` | `/admin/leads` | Leads dashboard (Story 4.2–4.3) — locale + status filters, Skeleton loading, empty/filtered-empty/error states, AbortController per request, status badges (amber/blue/green), message preview + expand, **inline per-row status `<select>` with optimistic update + revert + per-row `role="alert"` error (Story 4.3)**. Admin import boundary: no imports from `components/sections/*` |
| `src/pages/admin/Team.tsx` | `/admin/team` | (Story 4.4) |
| `src/hooks/useAdmin.ts` | — | `login`/`logout`/`bootstrap`, status-code→i18n-key error mapping |
| `src/store/useAdminStore.ts` | — | Zustand render-cache: `isAuthenticated`, `adminId`, `email`, `bootstrapped` — NO persist |
| `src/lib/api.ts` | — | `postAdminLogin`, `postAdminLogout`, `getAdminMe`, `getAdminLeads`, `patchAdminLeadStatus` (Story 4.3), `AdminApiError`, `parseAdminLeadRow`, types `AdminLeadRow`/`AdminLeadStatus`/`AdminLeadLocale` |

## Backend

| File | Endpoints |
|---|---|
| `server/routes/admin/auth.ts` | POST `/api/admin/auth/login`, POST `/api/admin/auth/logout`, GET `/api/admin/auth/me` |
| `server/routes/admin/leads.ts` | GET `/api/admin/leads`, PATCH `/api/admin/leads/:id/status` (Story 4.3) |
| `server/routes/admin/team.ts` | GET/POST/PATCH/DELETE `/api/admin/team` |
| `server/middleware/auth.ts` | `requireAdmin` JWT verify middleware; loads admin by id and rejects `payload.tokenVersion !== row.token_version` (Story 4.8); factory `createRequireAdmin(dao)` for tests; `AUTH_COOKIE_NAME = 'admin_token'` |
| `server/middleware/rateLimit.ts` | `createFormRateLimiter` (15min / 20) + `createAdminLoginRateLimiter` (15min / 5) — independent per-route limiters with `'draft-7'` headers and JSON `{success:false,message:'Too many requests'}` 429 envelope |
| `server/dao/admin.dao.ts` | Admin user lookup (`findByEmail`, `findById`, `create`, `upsert`, `incrementTokenVersion`, `deleteByEmail`); `upsert` of existing row bumps `token_version` (Story 4.8) — same-password reseed also bumps (documented trade-off, single-admin Phase 3) |
| `server/dao/admin-login-attempts.dao.ts` | Per-email failed-login counter (Story 4.7); durable across restarts via `admin_login_attempts` SQLite table |
| `server/schemas/admin-auth.schema.ts` | Zod `loginSchema` |
| `server/schemas/admin-leads-query.schema.ts` | Zod `adminLeadsQuerySchema` — `locale` ∈ {en,pt-BR,es}, `status` ∈ {pending,contacted,qualified}, both optional; unknown query keys ignored |
| `server/schemas/admin-lead-status.schema.ts` | Zod `adminLeadStatusBodySchema` (`status` enum required) + `adminLeadStatusParamsSchema` (`id` coerced int > 0) — Story 4.3 |
| `server/db.seed.ts` | `npm run db:seed` — bcrypt-12-hashed admin upsert from `ADMIN_EMAIL`/`ADMIN_PASSWORD` |

---

## Auth Flow

1. POST `/api/admin/auth/login` → **per-IP rate limiter (5 / 15min)** → Zod validate → JWT secret check → **per-email lockout check (5 fails / 15min, durable via `admin_login_attempts`)** → `adminDao.findByEmail` → `bcrypt.compareSync` (with `DUMMY_PASSWORD_HASH` timing-equalization on miss AND on lockout branch) → on success: `adminLoginAttemptsDao.reset(email)` → `jwt.sign` 8h → set `admin_token` cookie (`httpOnly`, `sameSite: 'strict'`, `secure` in prod, `maxAge` 8h). On fail: `adminLoginAttemptsDao.recordFailure(email)` → 401 `Invalid credentials`.
2. All `/api/admin/{leads,contacts,team}` routes → `requireAdmin` middleware → JWT verify → `adminDao.findById(payload.adminId)` → strict `payload.tokenVersion === row.token_version` check → `req.admin = { adminId, email }`. 401 on miss/expiry/tamper/missing-row/stale-tokenVersion (incl. legacy tokens missing the claim), 500 if `JWT_SECRET` missing. (Story 4.8)
3. POST `/api/admin/auth/logout` → `clearCookie` (matching attributes) → always 200 (idempotent)
4. GET `/api/admin/auth/me` → `requireAdmin` → returns `{ adminId, email }` or 401
5. Frontend `AdminLayout` mounts → if `!bootstrapped`, call `useAdmin().bootstrap()` → `getAdminMe()` → set or clear session
6. Frontend invalid-credentials path: 401 maps to `admin.login.errors.invalidCredentials` i18n key (no info leak between unknown-email and wrong-password)

### Session truth model

Cookie + `/me` is source of truth. Zustand store is a render cache — no `persist`. Reload re-bootstraps via `/me`. Any 401 from admin API → `clearSession()`.

---

## Lead Filters (FR31, FR32)

- By locale: `en`, `pt-BR`, `es`
- By status: `pending`, `contacted`, `qualified`

---

## Team Management (FR35–FR37)

- Create / edit / deactivate members
- Bio fields per locale: `bio_en`, `bio_pt`, `bio_es`
- `order_index` controls display order on public site
- `is_active` (0/1) toggles public visibility

---

## Status

| Story | Files Created |
|---|---|
| 4.1 | `server/schemas/admin-auth.schema.ts`, `server/db.seed.ts`, `server/routes/admin/auth.ts` (login/logout impl), `src/store/useAdminStore.ts`, `src/hooks/useAdmin.ts`, `src/lib/api.ts` (admin helpers), `src/components/layout/AdminLayout.tsx` (auth gate), `src/pages/admin/Login.tsx`, `src/pages/admin/Dashboard.tsx`, i18n `admin` namespace × 3 locales, `tests/e2e/admin-auth.spec.ts` |
| 4.2 | `server/schemas/admin-leads-query.schema.ts`, `server/routes/admin/leads.ts` (Zod-hardened query), `server/routes/admin/leads.test.ts`, `src/lib/api.ts` (`getAdminLeads`, `parseAdminLeadRow`, lead types), `src/components/ui/Skeleton.tsx` + `Skeleton.test.tsx`, `src/pages/admin/Leads.tsx` (full dashboard), `src/pages/admin/Leads.test.tsx`, i18n `admin.leads` namespace × 3 locales, `tests/e2e/admin-leads.spec.ts` |
| 4.3 | `server/schemas/admin-lead-status.schema.ts` + smoke test, extended `server/routes/admin/leads.ts` (PATCH `/:id/status` handler — Zod params + body validation, 404 on missing row, returns updated row), extended `server/routes/admin/leads.test.ts` (+9 PATCH cases), `src/lib/api.ts` `patchAdminLeadStatus` helper, extended `src/lib/api.admin.test.ts` (+7 cases), extended `src/pages/admin/Leads.tsx` (inline `<select>` with optimistic update + revert + per-row `role="alert"`, per-row pending Set + Map, 401 → `clearSession`), extended `src/pages/admin/Leads.test.tsx` (+8 mutation cases), i18n `admin.leads.statusUpdate` namespace × 3 locales, extended `tests/e2e/admin-leads.spec.ts` (mutation + reload durability scenario) |
| 4.4 | — |
| 4.5 | — |
| 4.6 | — |
| 4.7 | `server/dao/admin-login-attempts.dao.ts` + `admin-login-attempts.dao.test.ts`, `admin_login_attempts` table in `server/db.ts` `initSchema`, `createAdminLoginRateLimiter` + cross-route independence test in `server/middleware/rateLimit.ts` / `rateLimit.test.ts`, per-IP limiter mount + per-email lockout branch in `server/routes/admin/auth.ts`, 6 new lockout cases (IP 429, email 401, lockout-with-correct-password, window-elapsed reset, partial-failure reset, persistence-across-restart) in `server/routes/admin/auth.test.ts` |
| 4.8 | `token_version` column on `admin_users` (+ ALTER migration in `server/db.ts`), `incrementTokenVersion` / `deleteByEmail` + upsert bump in `server/dao/admin.dao.ts`, `tokenVersion` claim in `server/routes/admin/auth.ts` login JWT, per-request `findById` + strict-equality version check in `server/middleware/auth.ts` (factory `createRequireAdmin`); new tests: stale-cookie-after-reseed, post-reseed re-login, deleted-row, legacy-token rejection across `dao/admin.dao.test.ts`, `middleware/auth.test.ts`, `routes/admin/auth.test.ts`, `db.seed.test.ts`; `index.test.ts` /me cookie test refactored to seed real row |
