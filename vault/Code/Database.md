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
| `role` | TEXT NOT NULL | |
| `gds` | TEXT NOT NULL | |
| `message` | TEXT | optional |
| `locale` | TEXT NOT NULL | `en` / `pt-BR` / `es` |
| `status` | TEXT NOT NULL | `pending` / `contacted` / `qualified` |
| `created_at` | TEXT | ISO-8601, `datetime('now')` default |

### `contact_submissions`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `name` | TEXT NOT NULL | |
| `email` | TEXT NOT NULL | |
| `company` | TEXT | optional |
| `subject` | TEXT NOT NULL | service dropdown value |
| `message` | TEXT NOT NULL | |
| `locale` | TEXT NOT NULL | |
| `created_at` | TEXT | ISO-8601 |

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
| `photo_url` | TEXT | |
| `order_index` | INTEGER NOT NULL | display order |
| `is_active` | INTEGER NOT NULL | 0/1 CHECK constraint |
| `created_at` | TEXT | ISO-8601 |

### `admin_users`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `email` | TEXT NOT NULL UNIQUE | |
| `password_hash` | TEXT NOT NULL | bcrypt, rounds ≥ 12 |
| `created_at` | TEXT | ISO-8601 |

---

## DAOs

| File | Domain |
|---|---|
| `server/dao/leads.dao.ts` | demo_requests CRUD |
| `server/dao/contacts.dao.ts` | contact_submissions CRUD |
| `server/dao/team.dao.ts` | team_members CRUD |
| `server/dao/admin.dao.ts` | admin_users lookup |

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
| 2.1 | — |
