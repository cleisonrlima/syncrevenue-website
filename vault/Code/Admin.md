# Admin Module (Phase 3)

**Auth:** JWT in httpOnly cookie — SameSite=Strict, 8h expiry, cookie name `admin_token`
**Route prefix:** `/admin/*` (frontend), `/api/admin/*` (backend)

---

## Frontend

| File | Route | Description |
|---|---|---|
| `src/components/layout/AdminLayout.tsx` | `/admin` shell | Auth gate + `/me` bootstrap + locale-stripped meta head |
| `src/pages/admin/Login.tsx` | `/admin/login` | i18n login form, accessible error via `role="alert"` |
| `src/pages/admin/Dashboard.tsx` | `/admin/dashboard` | Minimal landing + logout button (4.6 moves to nav shell) |
| `src/pages/admin/Leads.tsx` | `/admin/leads` | (Story 4.2) |
| `src/pages/admin/Team.tsx` | `/admin/team` | (Story 4.4) |
| `src/hooks/useAdmin.ts` | — | `login`/`logout`/`bootstrap`, status-code→i18n-key error mapping |
| `src/store/useAdminStore.ts` | — | Zustand render-cache: `isAuthenticated`, `adminId`, `email`, `bootstrapped` — NO persist |
| `src/lib/api.ts` | — | `postAdminLogin`, `postAdminLogout`, `getAdminMe`, `AdminApiError` |

## Backend

| File | Endpoints |
|---|---|
| `server/routes/admin/auth.ts` | POST `/api/admin/auth/login`, POST `/api/admin/auth/logout`, GET `/api/admin/auth/me` |
| `server/routes/admin/leads.ts` | GET/PATCH `/api/admin/leads` |
| `server/routes/admin/team.ts` | GET/POST/PATCH/DELETE `/api/admin/team` |
| `server/middleware/auth.ts` | `requireAdmin` JWT verify middleware; `AUTH_COOKIE_NAME = 'admin_token'` |
| `server/dao/admin.dao.ts` | Admin user lookup (`findByEmail`, `findById`, `create`, `upsert`) |
| `server/schemas/admin-auth.schema.ts` | Zod `loginSchema` |
| `server/db.seed.ts` | `npm run db:seed` — bcrypt-12-hashed admin upsert from `ADMIN_EMAIL`/`ADMIN_PASSWORD` |

---

## Auth Flow

1. POST `/api/admin/auth/login` → Zod validate → `adminDao.findByEmail` → `bcrypt.compareSync` → `jwt.sign` 8h → set `admin_token` cookie (`httpOnly`, `sameSite: 'strict'`, `secure` in prod, `maxAge` 8h)
2. All `/api/admin/{leads,contacts,team}` routes → `requireAdmin` middleware → JWT verify → `req.admin = { adminId, email }`. 401 on miss/expiry/tamper, 500 if `JWT_SECRET` missing.
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
| 4.2 | — |
| 4.3 | — |
| 4.4 | — |
| 4.5 | — |
| 4.6 | — |
