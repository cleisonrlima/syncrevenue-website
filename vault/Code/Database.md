# Database Module

**Engine:** SQLite via `better-sqlite3` (synchronous)
**Pattern:** Raw SQL + DAO (no ORM). ANSI SQL only — PostgreSQL-portable.

---

## Schema

### `demo_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `name` | TEXT NOT NULL | |
| `email` | TEXT NOT NULL | |
| `company` | TEXT NOT NULL | |
| `phone` | TEXT | optional |
| `role` | TEXT NOT NULL | |
| `gds` | TEXT NOT NULL | CHECK IN (`Amadeus`, `Sabre`, `Galileo`, `Worldspan`, `Other`, `None yet`) |
| `message` | TEXT | optional |
| `locale` | TEXT NOT NULL | CHECK IN (`en`, `pt-BR`, `es`) |
| `status` | TEXT NOT NULL | DEFAULT `pending`; CHECK IN (`pending`, `contacted`, `qualified`) |
| `created_at` | TEXT NOT NULL | DEFAULT `datetime('now')` |
| `updated_at` | TEXT NOT NULL | DEFAULT `datetime('now')` |

### `contacts`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `name` | TEXT NOT NULL | |
| `email` | TEXT NOT NULL | |
| `subject` | TEXT NOT NULL | service dropdown value |
| `message` | TEXT NOT NULL | |
| `locale` | TEXT NOT NULL | CHECK IN (`en`, `pt-BR`, `es`) |
| `read` | INTEGER NOT NULL | DEFAULT 0; CHECK IN (0, 1) |
| `created_at` | TEXT NOT NULL | DEFAULT `datetime('now')` |

### `team_members`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `name` | TEXT NOT NULL | |
| `role_en` | TEXT NOT NULL | |
| `role_pt` | TEXT NOT NULL | |
| `role_es` | TEXT NOT NULL | |
| `bio_en` | TEXT NOT NULL | |
| `bio_pt` | TEXT NOT NULL | |
| `bio_es` | TEXT NOT NULL | |
| `linkedin` | TEXT | optional |
| `photo_url` | TEXT | optional |
| `order_index` | INTEGER NOT NULL | DEFAULT 0; display order |
| `active` | INTEGER NOT NULL | DEFAULT 1; CHECK IN (0, 1) |

### `admin_users`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `email` | TEXT NOT NULL UNIQUE | |
| `password_hash` | TEXT NOT NULL | bcrypt, rounds ≥ 12 |
| `created_at` | TEXT | ISO-8601 |

### `admin_login_attempts` (Story 4.7)
| Column | Type | Notes |
|---|---|---|
| `email` | TEXT PRIMARY KEY | per-email failure counter (separate from credential row to keep security state isolated) |
| `failed_count` | INTEGER NOT NULL | DEFAULT 0; incremented on each failed login |
| `last_failed_at` | TEXT NOT NULL | DEFAULT `datetime('now')`; used with `ADMIN_LOGIN_WINDOW_MS` for rolling-window lockout |

**Lockout policy:** `failed_count ≥ 5` within a 15-minute rolling window from `last_failed_at` ⇒ account locked. Locked attempts still return `401 Invalid credentials` (no information leak) and do NOT bump the counter (avoids permanent lockout by continued knocking). Successful login deletes the row.

---

## DAOs

| File | Domain |
|---|---|
| `server/dao/leads.dao.ts` | demo_requests CRUD |
| `server/dao/contacts.dao.ts` | contact_submissions CRUD |
| `server/dao/team.dao.ts` | team_members CRUD |
| `server/dao/admin.dao.ts` | admin_users lookup |
| `server/dao/admin-login-attempts.dao.ts` | admin_login_attempts counter — `getByEmail`, `recordFailure(email, now?)`, `reset(email)`, `isLocked(email, windowMs, threshold, now?)` |

**Rule:** All SQL in DAO files. No raw SQL in route handlers.

---

## Conventions

- Booleans: `INTEGER 0/1` with CHECK constraint
- Dates: `TEXT` ISO-8601, formatted client-side only
- API JSON: `snake_case` — no transforms from DB rows

---

## Status

> Fill as stories complete

| Story | Schema/DAO Created |
|---|---|
| 2.1 | initSchema in server/db.ts creates all 4 tables (demo_requests, contacts, team_members, admin_users) with CHECK/UNIQUE/defaults; typed DAO factories created for leads, contacts, team, admin; co-located DAO/schema tests pass (37 DB/DAO/schema tests). |
