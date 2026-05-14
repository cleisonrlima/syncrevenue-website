# Admin Module (Phase 3)

**Auth:** JWT in httpOnly cookie — SameSite=Strict, 8h expiry
**Route prefix:** `/admin/*` (frontend), `/api/admin/*` (backend)

---

## Frontend

| File | Route | Description |
|---|---|---|
| `src/pages/Admin.tsx` | `/admin/*` | Admin shell |
| `src/components/admin/AdminLayout.tsx` | — | Nav + layout |
| `src/components/admin/LeadsTable.tsx` | — | Filterable leads list |
| `src/components/admin/TeamManager.tsx` | — | Team CRUD |
| `src/components/admin/LoginForm.tsx` | `/admin/login` | Auth form |

## Backend

| File | Endpoints |
|---|---|
| `server/routes/admin/auth.ts` | POST `/api/admin/login`, POST `/api/admin/logout` |
| `server/routes/admin/leads.ts` | GET/PATCH `/api/admin/leads` |
| `server/routes/admin/team.ts` | GET/POST/PATCH/DELETE `/api/admin/team` |
| `server/middleware/auth.ts` | JWT verify middleware |
| `server/dao/admin.dao.ts` | Admin user lookup |

---

## Auth Flow

1. POST `/api/admin/login` → verify credentials → set httpOnly cookie
2. All `/api/admin/*` routes (except login) → `auth` middleware → verify JWT → `req.admin`
3. POST `/api/admin/logout` → clear cookie
4. Frontend: redirect to `/admin/login` on 401

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
| 4.1 | — |
| 4.2 | — |
| 4.3 | — |
| 4.4 | — |
| 4.5 | — |
| 4.6 | — |
