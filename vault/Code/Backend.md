# Backend Module

**Stack:** Express + better-sqlite3 + Zod + nodemailer
**Entry:** `server/index.ts`

---

## Files

| File | Description |
|---|---|
| `server/index.ts` | Express bootstrap; graceful shutdown with 10s forced exit if `close` hangs |
| `server/db.ts` | SQLite connection singleton; open failure logs and `process.exit(1)` |
| `server/db.seed.ts` | Admin user seed / reset CLI |
| `server/middleware/auth.ts` | JWT cookie verify → `req.admin` |
| `server/middleware/rateLimit.ts` | Rate limiting for form routes |
| `server/routes/demo.ts` | `POST /api/demo` — demo request |
| `server/routes/contact.ts` | `POST /api/contact` — contact form |
| `server/routes/admin/auth.ts` | `POST /api/admin/login`, `POST /api/admin/logout` |
| `server/routes/admin/leads.ts` | `GET/PATCH /api/admin/leads` |
| `server/routes/admin/team.ts` | `GET/POST/PATCH/DELETE /api/admin/team` |

---

## Middleware Stack Order

```
helmet() → cors() → express.json() → rateLimit (form routes) → auth (admin routes) → handlers
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/demo` | — | Submit demo request |
| POST | `/api/contact` | — | Submit contact form |
| POST | `/api/admin/login` | — | Admin login |
| POST | `/api/admin/logout` | JWT | Admin logout |
| GET | `/api/admin/leads` | JWT | List leads (filterable) |
| PATCH | `/api/admin/leads/:id/status` | JWT | Update lead status |
| GET | `/api/admin/team` | JWT | List team members |
| POST | `/api/admin/team` | JWT | Create team member |
| PATCH | `/api/admin/team/:id` | JWT | Update team member |
| DELETE | `/api/admin/team/:id` | JWT | Deactivate team member |
| PATCH | `/api/admin/team/:id/active` | JWT | Toggle active |

---

## API Response Envelope

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "..." }
```

---

## Status

> Fill as stories complete

| Story | Files Created |
|---|---|
| 1.1 | server/index.ts (health check), server/db.ts (connection, WAL, no schema), all placeholder files |
| 2.1 | — |
| 2.2 | — |
