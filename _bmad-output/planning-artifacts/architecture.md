---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/product-brief-syncrevenue-website.md'
  - '_bmad-output/planning-artifacts/product-brief-syncrevenue-website-distillate.md'
  - '_bmad-output/planning-artifacts/implementation-readiness-report-2026-05-13.md'
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-05-13'
project_name: 'syncrevenue-website'
user_name: 'Pri'
date: '2026-05-13'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements — 40 FRs across 5 capability areas:**

- **Site Content & Navigation (FR1–FR8):** 7 public sections (Hero, SyncRevenue, Services/Portfolio, Comparison, Team, Demo Scheduler, Contact) + navbar + footer. All static content, no dynamic data fetching at render time. Component-based architecture; sections map 1:1 to React components.

- **Lead Capture & Conversion (FR9–FR16):** Two form systems — demo request (SyncRevenue-specific) and contact form (general + service dropdown routing to BI/Analytics, OBTs, Custom Dev). Both require client-side Zod validation, API POST endpoints, server-side validation, DB write, and SMTP notification. FR12 (on-page confirmation) and FR16 (locale-aware error messages) apply to both.

- **Localization (FR17–FR22):** i18n is pervasive — every UI component, form label, validation message, error state, and CTA must be locale-aware. Language detection (localStorage → browser → fallback `en`) runs at app initialization. Locale persisted in localStorage. Locale captured and stored on every lead submission.

- **Trust Building (FR23–FR28):** Content-only sections (security statement, client references, Privacy Policy). FR25 (explicit GDS/website data separation) and FR27 (Privacy Policy in all 3 locales) have direct content/routing implications.

- **Admin Operations / Phase 3 (FR29–FR37):** Separate mini-app within same codebase. JWT-authenticated, protected routes, own layout. Leads dashboard (filtered list + status CRUD) + Team CRUD (EN/PT/ES bio management). Isolated from public site routes.

- **Compliance & Data Handling (FR38–FR40):** Secured data store, rate limiting on form endpoints, locale allowlist enforcement. All three are middleware/backend concerns.

**Non-Functional Requirements — Architectural Drivers:**

- **Performance (LCP ≤ 2.5s, FID < 100ms, CLS < 0.1):** Requires code splitting, lazy section loading, optimized asset pipeline, immutable cache headers for hashed assets.
- **Security (10 specific NFRs):** Dedicated auth middleware (JWT), rate limit middleware, helmet middleware, server-side locale validation — all applied at Express layer.
- **Reliability (99.9% uptime, SMTP graceful degradation, no duplicate submissions):** SMTP wrapped in try/catch — DB write must succeed regardless of email outcome. Idempotency consideration on form retry.
- **Accessibility (WCAG 2.1 AA):** Affects all UI components — ARIA patterns, contrast validation, keyboard navigation baked into component design.
- **Architecture Constraints:** SQLite with PostgreSQL-compatible query patterns (DAO/repository abstraction recommended). Locale switching without full page reload (client-side only, no server round-trip).

**Scale & Complexity:**

- Primary domain: Full-stack web (React SPA + Express backend, same monorepo)
- Complexity level: Medium — multi-locale, dual form systems, JWT auth, admin CRUD, 4-phase delivery
- NOT real-time, NOT multi-tenant, NOT microservices — clean monolith is correct
- Estimated architectural components: 7 public sections, 2 form systems, 3 admin pages, ~6 API route groups, 3 middleware layers, 4 DB tables, 3 locale files

### Technical Constraints & Dependencies

- **Monorepo:** SPA + Express in same repo, built as single artifact (`tsc && vite build`)
- **No SSR:** Client-side SPA only — SEO deferred to Phase 2 via meta tags (no hydration complexity)
- **No public API:** All `/api/` endpoints serve frontend only — no external consumers
- **SQLite:** Zero-config, file-based. Requires DAO pattern for future PostgreSQL portability
- **i18n:** i18next + react-i18next. Detection order: localStorage → browser navigator → fallback `en`
- **Rate limiting:** 20 req / 15-min window, applied at Express middleware level on `/api/demo` and `/api/contact`
- **SMTP:** Server-side only, nodemailer. Must be fire-and-forget (non-blocking to API response)
- **Privacy Policy:** Must exist as a routable page in all 3 locales by Phase 1 launch — not a modal

### Cross-Cutting Concerns Identified

1. **i18n** — spans every UI component, form validation, error states, Privacy Policy routing
2. **Authentication** — JWT middleware protects all `/api/admin/*` and `/admin/*` routes
3. **Form validation** — Zod schemas must be shared or mirrored between client (locale-aware) and server (strict)
4. **Security middleware** — helmet, CORS, rate limiting applied globally at Express layer
5. **Locale capture** — locale value must flow from UI state → form payload → DB write on every submission
6. **Error handling** — SMTP failure silent to visitor, 429 rate limit surfaces as user-facing message, form errors display in active locale

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application — React SPA (client) + Express (server) in monorepo. No starter template selection required: the complete technology stack is pre-defined in the product brief and confirmed through PRD analysis.

### Technology Stack — Pre-Defined

**Rationale:** Stack was selected before architecture workflow. All decisions are firm and consistent with project constraints (SQLite zero-config, monorepo deployment, no SSR, trilingual i18n).

**Initialization:**

```bash
# Dev
concurrently "vite" "tsx watch server/index.ts"

# Production build
tsc && vite build

# DB seed (first run)
tsx server/db.seed.ts
```

**Architectural Decisions Established by Stack:**

**Language & Runtime:**
- TypeScript strict mode — full type coverage frontend and backend
- Node.js runtime for Express server
- No separate language boundary between client and server code

**Styling Solution:**
- Tailwind CSS v3 — utility-first, no CSS files
- shadcn/ui — accessible component library (Button, Dialog, Form, Input, Select, Textarea, Toast, Badge, Card, Table, Skeleton, Separator, DropdownMenu)
- Brand design system enforced via Tailwind config (custom color tokens)

**Build Tooling:**
- Vite — frontend bundler, HMR in dev, optimized build in prod
- `tsc` — TypeScript compilation for server
- Output: static assets + `dist/server/index.js` (single deployment artifact)
- Path alias `@/` → `src/` via Vite config

**Validation:**
- Zod — shared schema pattern: `createDemoSchema(t: TFunction)` for locale-aware client validation; strict Zod schemas for server-side payload validation on every route

**State Management:**
- Zustand stores: `useModalStore` (demo modal), `useLocaleStore` (active language), `useAdminStore` (admin session)
- No Redux, no Context API for global state — Zustand only

**Code Organization:**
```
server/
├── index.ts / db.ts
├── middleware/ (auth.ts, rateLimit.ts)
├── routes/ (demo.ts, contact.ts, admin/auth.ts, admin/leads.ts, admin/team.ts)
└── schemas/ (demo.schema.ts, contact.schema.ts)
src/
├── main.tsx / App.tsx
├── i18n/ (index.ts, locales/en|pt-BR|es, LanguageSwitcher.tsx)
├── store/ (useModalStore, useLocaleStore, useAdminStore)
├── components/ (ui/, layout/, sections/)
├── pages/ (Home.tsx, admin/Login, Dashboard, Leads, Team)
├── hooks/ (useDemo.ts, useAdmin.ts)
└── lib/ (api.ts, utils.ts)
```

**Development Experience:**
- `concurrently` runs Vite HMR + tsx watch simultaneously in dev
- SQLite file-based — zero setup, instant local dev
- `.env` / `.env.example` pattern — no secrets in source

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data access pattern: Raw SQL + DAO (no ORM) — enforces PostgreSQL portability constraint
- Routing strategy: React Router v7 with nested admin routes — determines entire URL/component tree
- Code splitting: React.lazy + Suspense per section — required for LCP ≤ 2.5s NFR

**Important Decisions (Shape Architecture):**
- Privacy Policy routing: Single `/privacy` route with i18n-driven content
- Process management: PM2 for production server lifecycle
- SMTP strategy: Fire-and-forget (non-blocking) — required by NFR-R2

**Deferred Decisions (Post-MVP):**
- Deployment target: VPS vs Railway vs Render — Phase 4 decision
- SQLite → PostgreSQL migration: DAO pattern enables this when volume warrants
- Admin account self-service recovery: CLI-only for MVP (db.seed.ts)

---

### Data Architecture

**Decision: Raw SQL with DAO/Repository Pattern (no ORM)**
- Rationale: PostgreSQL portability constraint (ex-NFR-SC2). ORM abstraction adds complexity with no benefit at this scale. SQLite direct queries via `better-sqlite3` are synchronous and performant.
- Pattern: Each domain has a dedicated DAO file (`server/dao/leads.dao.ts`, `server/dao/contacts.dao.ts`, `server/dao/team.dao.ts`, `server/dao/admin.dao.ts`). All SQL lives in DAO files — no raw SQL in route handlers.
- Portability: Use ANSI SQL. Avoid SQLite-specific syntax. Column types map to PostgreSQL equivalents.

**Database Schema:**

```sql
-- demo_requests
CREATE TABLE demo_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  gds TEXT NOT NULL CHECK (gds IN ('Amadeus','Sabre','Galileo','Worldspan','Other','None yet')),
  message TEXT,
  locale TEXT NOT NULL CHECK (locale IN ('en','pt-BR','es')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','contacted','qualified')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- contacts
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('en','pt-BR','es')),
  read INTEGER NOT NULL DEFAULT 0 CHECK (read IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- team_members
CREATE TABLE team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role_en TEXT NOT NULL,
  role_pt TEXT NOT NULL,
  role_es TEXT NOT NULL,
  bio_en TEXT NOT NULL,
  bio_pt TEXT NOT NULL,
  bio_es TEXT NOT NULL,
  linkedin TEXT,
  photo_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))
);

-- admin_users
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Data Retention:** Lead records (demo_requests, contacts) deleted after 24 months from created_at. Enforcement via scheduled cleanup or documented manual process at Phase 4.

**Validation:** Zod schemas in `server/schemas/` validate all API payloads server-side before DAO calls. Client uses `createDemoSchema(t: TFunction)` and `createContactSchema(t: TFunction)` for locale-aware error messages.

---

### Authentication & Security

**Decision: JWT in httpOnly Cookie (stateless, 8h expiry)**
- JWT stored in httpOnly cookie — XSS cannot read it. SameSite=Strict.
- Token payload: `{ adminId, email, iat, exp }`. No roles needed (single admin user type).
- Auth middleware (`server/middleware/auth.ts`): verify token → attach `req.admin` → next. 401 on invalid/expired.
- Admin account management: CLI-only via `db.seed.ts`. No password reset UI for Phase 1–3. Document recovery via `db.seed.ts --reset` flag.

**Middleware Stack Order (Express):**
```
helmet() → cors() → express.json() → rateLimit (form routes) → auth (admin routes) → route handlers
```

**Security Constraints Enforced:**
- Helmet: all default headers enabled
- CORS: `origin: process.env.ALLOWED_ORIGIN` (production domain only)
- Rate limit: 20 req / 900,000ms window on `/api/demo` and `/api/contact`
- Locale allowlist: `['en', 'pt-BR', 'es']` — validated in every form schema
- bcrypt: salt rounds = 12 minimum
- No `VITE_`-prefixed secrets — all sensitive env vars server-side only

---

### API & Communication Patterns

**Decision: RESTful Internal API (no GraphQL, no public consumers)**

**Route Map:**
```
POST   /api/demo                    → submit demo request
POST   /api/contact                 → submit contact form
POST   /api/admin/auth/login        → admin login → set cookie
POST   /api/admin/auth/logout       → clear cookie
GET    /api/admin/leads             → list leads (filter: locale, status)
PATCH  /api/admin/leads/:id/status  → update lead status
GET    /api/admin/contacts          → list contacts
GET    /api/admin/team              → list team members
POST   /api/admin/team              → create team member
PUT    /api/admin/team/:id          → update team member
PATCH  /api/admin/team/:id/active   → toggle active/order
```

**Response Shapes:**
```typescript
// Success
{ success: true, data?: T, message?: string }

// Error
{ success: false, message: string, field?: string }
```

**HTTP Status Codes:**
- 200: successful GET/PATCH
- 201: successful POST (resource created)
- 400: validation error (Zod)
- 401: unauthorized (no/invalid JWT)
- 422: business rule violation
- 429: rate limit exceeded
- 500: server error

**SMTP (Fire-and-Forget):**
```typescript
// Pattern: DB write first, SMTP async — response not blocked by email
try { await transporter.sendMail(options) } catch { /* log, never throw */ }
```
SMTP failure logged server-side, never surfaces as 5xx to visitor. Lead record already committed before sendMail attempt.

---

### Frontend Architecture

**Decision: React Router v7 with Nested Admin Routes**

**Route Tree:**
```
/                     → Home.tsx (lazy sections: Hero, SyncRevenue, Services, Comparison, Team, DemoScheduler, Contact)
/privacy              → Privacy.tsx (single route, i18n-driven content, no locale in URL)
/admin                → AdminLayout.tsx (protected wrapper)
  /admin/login        → Login.tsx (public — redirect if authed)
  /admin/dashboard    → Dashboard.tsx (protected)
  /admin/leads        → Leads.tsx (protected)
  /admin/team         → Team.tsx (protected)
```

**Code Splitting — React.lazy + Suspense per section:**
```typescript
// App.tsx pattern
const Hero = lazy(() => import('@/components/sections/Hero'))
const SyncRevenue = lazy(() => import('@/components/sections/SyncRevenue'))
// ... each section lazy-loaded

// Fallback: Skeleton placeholder matching section height — prevents CLS
<Suspense fallback={<SectionSkeleton />}>
  <Hero />
</Suspense>
```

**Component Structure:**
```
src/components/
├── ui/           → shadcn/ui components (Button, Dialog, Form, etc.)
├── layout/       → Navbar.tsx, Footer.tsx, AdminLayout.tsx
└── sections/     → Hero, SyncRevenue, Services, Comparison, Team, DemoScheduler, Contact, Security
```

**Privacy Policy:** Single `/privacy` route. Content (heading, body paragraphs) loaded from i18n translation keys — no locale-specific routes. Language switcher on page updates content without navigation.

**Locale Flow:** `useLocaleStore` (Zustand) holds active locale. `i18next.changeLanguage(locale)` on store update. `localStorage.setItem('locale', locale)` for persistence. Zero page reload.

---

### Infrastructure & Deployment

**Decision: PM2 for Production Process Management (Phase 4)**
- `pm2 start dist/server/index.js --name syncrevenue-website`
- Auto-restart on crash (NFR-R3)
- Ecosystem file committed to repo (`ecosystem.config.js`)
- Deployment target (VPS/Railway/Render): Phase 4 decision — not blocked

**Build Artifact:**
```
dist/
├── client/          → Vite output (static assets with content hashes)
│   └── index.html   → Cache-Control: no-cache
│   └── assets/      → Cache-Control: max-age=31536000, immutable
└── server/
    └── index.js     → compiled Express server
```

**Environment Configuration:**
- `.env` for local dev, `.env.example` with all keys documented (no real values)
- Production: env vars injected via hosting platform or `.env` on VPS
- `DB_PATH=./data/sync_sirius.db` — data directory outside dist, survives deploys

---

### Decision Impact Analysis

**Implementation Sequence:**
1. DB schema + migrations (`server/db.ts`, `server/db.seed.ts`)
2. DAO layer (`server/dao/`)
3. Zod schemas — server (`server/schemas/`) + client locale-aware versions
4. Express server + middleware stack
5. API route handlers (demo, contact, admin/*)
6. i18n setup (locales, detection, store)
7. Public sections (Home page, lazy-loaded)
8. Form hooks + submission flow (useDemo, useContact)
9. Admin module (routes, layout, pages) — Phase 3

**Cross-Component Dependencies:**
- Locale store → form schemas → API payload → DB locale field (chain must be consistent)
- Auth middleware → admin routes → admin pages (cookie must be set before protected route access)
- DAO layer ↔ Zod server schemas (same field names, same constraints)
- React Router routes ↔ AdminLayout protected wrapper (redirect logic lives in layout, not router)

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

7 areas where AI agents could make different choices — all resolved below.

---

### Naming Patterns

**Database Naming Conventions:**
- Tables: `snake_case` plural — `demo_requests`, `team_members`, `admin_users`
- Columns: `snake_case` — `created_at`, `order_index`, `photo_url`, `password_hash`
- Primary keys: always `id`
- Foreign keys: `{table_singular}_id` — e.g., `team_member_id`
- Booleans stored as `INTEGER 0/1` with CHECK constraint
- Dates stored as `TEXT` ISO-8601 (`datetime('now')` default)

**API JSON Naming — snake_case throughout (no transform):**
```json
{ "success": true, "data": { "id": 1, "created_at": "2026-05-13T00:00:00Z", "order_index": 0 } }
```
No camelCase in any API response. DAO returns rows as-is from SQLite.

**Code Naming Conventions:**
- React components: `PascalCase` files and exports — `Hero.tsx`, `DemoForm.tsx`, `AdminLayout.tsx`
- Hooks: `camelCase` with `use` prefix — `useDemo.ts`, `useAdmin.ts`, `useLocaleStore.ts`
- Zustand stores: named `use{Domain}Store` — `useModalStore`, `useLocaleStore`, `useAdminStore`
- Server DAOs: `{domain}.dao.ts` — `leads.dao.ts`, `contacts.dao.ts`
- Server routes: `{domain}.ts` — `demo.ts`, `contact.ts`, `admin/leads.ts`
- Zod schemas: `{domain}.schema.ts` — `demo.schema.ts`, `contact.schema.ts`
- Utilities: `camelCase` functions in `src/lib/utils.ts` or `server/lib/`

**API Endpoint Naming:**
- Plural nouns for collections: `/api/admin/leads`, `/api/admin/team`
- Route params: `:id` (not `{id}` or `:leadId`)
- Actions on sub-resources: `/api/admin/leads/:id/status`, `/api/admin/team/:id/active`

---

### Structure Patterns

**Test Organization — Co-located:**
```
src/components/sections/Hero.tsx
src/components/sections/Hero.test.tsx      ← co-located
server/routes/demo.ts
server/routes/demo.test.ts                 ← co-located
server/dao/leads.dao.ts
server/dao/leads.dao.test.ts               ← co-located
```
No `__tests__/` directories. Test file named exactly as source + `.test.ts`/`.test.tsx`.

**i18n File Structure — Dot-nested namespacing:**
```json
{
  "nav": { "demo": "Request Demo", "contact": "Contact" },
  "hero": { "headline": "Commission Management Built for Modern Travel Agencies", "cta": "Schedule a Demo" },
  "forms": {
    "demo": { "name": "Full Name", "emailError": "Enter a valid email address", "submit": "Request Demo" },
    "contact": { "subject": "Subject", "submit": "Send Message" }
  },
  "admin": { "leads": { "title": "Leads" } },
  "privacy": { "title": "Privacy Policy" }
}
```
Keys: `section.element` or `section.subsection.element`. Never flat (`heroHeadline`). Never more than 3 levels deep.

---

### Format Patterns

**API Response Format:**
```typescript
{ success: true, data: T }                              // GET, successful POST/PATCH
{ success: true, message: string }                      // POST with no body response
{ success: false, message: string }                     // General error
{ success: false, message: string, field: string }      // Validation error
```

**Date Handling:**
- DB stores: `TEXT` ISO-8601 (`"2026-05-13T14:30:00"`)
- API sends: ISO string as-is from DB — no server-side formatting
- Client formats via `Intl.DateTimeFormat` in active locale at display time

```typescript
// src/lib/utils.ts — single formatDate utility
export function formatDate(isoString: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(isoString))
}
```

**Boolean Handling:**
- DB: `INTEGER 0/1`
- API JSON: `true/false` — convert in DAO layer when building response objects
- TypeScript: `boolean` — never numeric

---

### Communication Patterns

**Zustand Store Pattern:**
```typescript
// State + actions in same object, immutable updates via spread
set((state) => ({ isOpen: true }))
// Never direct mutation
```

**Form Submission State Machine:**
```typescript
// useDemo.ts and useContact.ts — always use this status enum
const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
// 1. setStatus('submitting') — disables submit button
// 2. POST to API
// 3a. setStatus('success') — inline confirmation replaces form (FR12)
// 3b. setStatus('error') — inline error message below form
```

**Locale Flow — always in this order:**
```typescript
i18next.changeLanguage(locale)             // 1. i18next
useLocaleStore.setState({ locale })        // 2. Zustand store
localStorage.setItem('i18nextLng', locale) // 3. Persist
// Capture in form payload: { ...formData, locale: useLocaleStore.getState().locale }
```

---

### Process Patterns

**Error Handling:**
- Form validation errors: inline via shadcn/ui `<FormMessage>` — never toast
- Form submit success: inline on-page confirmation (replace form with message) — FR12
- Rate limit 429: inline error in active locale — not toast
- SMTP failure: server log only — visitor sees success (DB write already committed)
- Server 500: generic inline error — no technical detail to client
- Admin auth failure: redirect to `/admin/login`

**Loading State Pattern:**
```typescript
// Section lazy loading — Skeleton matches section height (prevents CLS)
<Suspense fallback={<SectionSkeleton className="h-[600px]" />}>
  <Hero />
</Suspense>

// Form submit — button disabled + spinner inside button
<Button disabled={status === 'submitting'}>
  {status === 'submitting' && <Spinner className="mr-2" />}
  {t('forms.demo.submit')}
</Button>

// Admin tables — shadcn Skeleton rows
```

**Zod Schema Pattern:**
```typescript
// Server: strict, no locale dependency
export const demoSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  locale: z.enum(['en', 'pt-BR', 'es']),
})

// Client: locale-aware via TFunction
export const createDemoSchema = (t: TFunction) => z.object({
  name: z.string().min(1, t('forms.demo.nameError')),
  email: z.string().email(t('forms.demo.emailError')),
})
```

---

### Enforcement Guidelines

**All AI Agents MUST:**
- Use `snake_case` for all DB columns and API JSON fields — never transform to camelCase
- Use dot-nested i18n keys — never flat, never more than 3 levels deep
- Co-locate test files — never create `__tests__/` directories
- Put all SQL in DAO files — never raw SQL in route handlers
- Use `{ success, data?, message? }` envelope on every API response
- Send ISO strings from DB as-is — format dates client-side only
- Use `'idle' | 'submitting' | 'success' | 'error'` for all form state
- Import locale from `useLocaleStore` — never directly from i18next in components

**Anti-Patterns — Never Do:**
```typescript
// ❌ camelCase in API response
{ "createdAt": "...", "orderId": 1 }

// ❌ flat i18n keys
{ "heroHeadline": "...", "formsDemoEmailError": "..." }

// ❌ Raw SQL in route handler
app.get('/api/admin/leads', (req, res) => {
  const leads = db.prepare('SELECT * FROM demo_requests').all()
})

// ❌ Toast for form validation errors
toast.error(t('forms.demo.emailError'))

// ❌ Server-side date formatting
res.json({ created_at: format(new Date(row.created_at), 'MMM d, yyyy') })
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
syncrevenue-website/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── components.json                    ← shadcn/ui config
├── ecosystem.config.js                ← PM2 config
│
├── data/
│   └── sync_sirius.db                 ← SQLite file (gitignored)
│
├── server/
│   ├── index.ts                       ← Express app entry, middleware stack, static serve
│   ├── db.ts                          ← better-sqlite3 instance, schema creation
│   ├── db.seed.ts                     ← initial admin user creation
│   │
│   ├── middleware/
│   │   ├── auth.ts                    ← JWT cookie verify → req.admin (FR29, NFR-S2)
│   │   └── rateLimit.ts               ← 20 req/15min on /api/demo + /api/contact (FR39, NFR-S5)
│   │
│   ├── schemas/
│   │   ├── demo.schema.ts             ← Zod: name, email, company, phone, role, gds, message, locale
│   │   └── contact.schema.ts          ← Zod: name, email, subject, message, locale
│   │
│   ├── dao/
│   │   ├── leads.dao.ts               ← demo_requests CRUD + status update (FR30–FR34)
│   │   ├── contacts.dao.ts            ← contacts INSERT + list (FR10)
│   │   ├── team.dao.ts                ← team_members CRUD + order (FR35–FR37)
│   │   └── admin.dao.ts               ← admin_users lookup by email
│   │
│   ├── routes/
│   │   ├── demo.ts                    ← POST /api/demo (FR9, FR13)
│   │   ├── contact.ts                 ← POST /api/contact (FR10, FR11, FR13)
│   │   └── admin/
│   │       ├── auth.ts                ← POST /api/admin/auth/login|logout (FR29)
│   │       ├── leads.ts               ← GET /api/admin/leads, PATCH /:id/status (FR30–FR34)
│   │       ├── contacts.ts            ← GET /api/admin/contacts
│   │       └── team.ts                ← GET/POST/PUT/PATCH /api/admin/team (FR35–FR37)
│   │
│   └── lib/
│       └── mailer.ts                  ← nodemailer transporter + sendNotification() (FR13)
│
└── src/
    ├── main.tsx                       ← React entry, i18n init, React Router provider
    ├── App.tsx                        ← route tree definition
    │
    ├── i18n/
    │   ├── index.ts                   ← i18next init: detection order localStorage→navigator→'en'
    │   ├── LanguageSwitcher.tsx       ← EN/PT-BR/ES toggle component (FR19)
    │   └── locales/
    │       ├── en/
    │       │   └── translation.json   ← all EN copy + form labels + error messages
    │       ├── pt-BR/
    │       │   └── translation.json   ← PT-BR full translation
    │       └── es/
    │           └── translation.json   ← ES full translation
    │
    ├── store/
    │   ├── useModalStore.ts           ← demo modal open/close state
    │   ├── useLocaleStore.ts          ← active locale state + changeLocale action (FR19–FR22)
    │   └── useAdminStore.ts           ← admin session state (logged in, admin email)
    │
    ├── hooks/
    │   ├── useDemo.ts                 ← demo form submit + status state (FR9, FR12, FR16)
    │   ├── useContact.ts              ← contact form submit + status state (FR10, FR12, FR16)
    │   └── useAdmin.ts                ← admin auth + session management (FR29)
    │
    ├── lib/
    │   ├── api.ts                     ← fetch wrappers: postDemo(), postContact(), admin* calls
    │   └── utils.ts                   ← formatDate(), cn() (Tailwind merge)
    │
    ├── components/
    │   ├── ui/                        ← shadcn/ui generated components (do not edit)
    │   │   ├── button.tsx
    │   │   ├── dialog.tsx
    │   │   ├── form.tsx
    │   │   ├── input.tsx
    │   │   ├── select.tsx
    │   │   ├── textarea.tsx
    │   │   ├── toast.tsx
    │   │   ├── badge.tsx
    │   │   ├── card.tsx
    │   │   ├── table.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── separator.tsx
    │   │   └── dropdown-menu.tsx
    │   │
    │   ├── layout/
    │   │   ├── Navbar.tsx             ← persistent nav + language switcher + demo CTA (FR7)
    │   │   ├── Footer.tsx             ← address, copyright, nav links (FR8)
    │   │   └── AdminLayout.tsx        ← admin wrapper: auth check → redirect /admin/login
    │   │
    │   └── sections/
    │       ├── Hero.tsx               ← FR1: value prop + primary CTA
    │       ├── SyncRevenue.tsx        ← FR2: product section + GDS integrations
    │       ├── Services.tsx           ← FR3: portfolio (SyncRevenue + BI + OBTs + Custom Dev)
    │       ├── Comparison.tsx         ← FR4: Sync Sirius vs legacy alternatives
    │       ├── Team.tsx               ← FR5: names, roles, bios (i18n role/bio per locale)
    │       ├── DemoScheduler.tsx      ← FR15: demo CTA section (section-embedded Phase 1; modal Phase 2 option)
    │       ├── Contact.tsx            ← FR6: contact form (subject dropdown for FR11)
    │       ├── Security.tsx           ← FR23–FR25: security statement + data separation
    │       ├── ClientReferences.tsx   ← FR24: US agency testimonials
    │       ├── DemoForm.tsx           ← FR9: demo request form (modal content)
    │       └── SectionSkeleton.tsx    ← Suspense fallback matching section height
    │
    └── pages/
        ├── Home.tsx                   ← all public sections lazy-loaded in order
        ├── Privacy.tsx                ← FR26–FR27: Privacy Policy (i18n content, routable)
        └── admin/
            ├── Login.tsx              ← FR29: admin login form
            ├── Dashboard.tsx          ← FR30: leads overview stats
            ├── Leads.tsx              ← FR30–FR34: leads table + locale/status filters + status CRUD
            └── Team.tsx               ← FR35–FR37: team CRUD + bio per locale + order management
```

---

### Architectural Boundaries

**API Boundary — Express serves all `/api/*`:**
- Public routes (no auth): `POST /api/demo`, `POST /api/contact`
- Protected routes (JWT cookie required): all `/api/admin/*`
- Static serving: Express serves `dist/client/` in production; Vite proxy in dev
- All routes return `{ success, data?, message? }` — no HTML from API routes

**Frontend/Backend Boundary:**
- `src/lib/api.ts` is the sole bridge — all fetch calls live here
- No direct DB access from frontend
- No environment secrets in `src/` (no `VITE_`-prefixed secrets)

**Admin Boundary:**
- `/admin/*` routes: AdminLayout checks `useAdminStore.isAuthenticated` → redirect to `/admin/login` if false
- `/api/admin/*` routes: `auth.ts` middleware verifies JWT cookie → 401 if missing/invalid
- Admin pages import only from `src/pages/admin/`, `src/components/layout/AdminLayout.tsx`, `src/components/ui/`
- Admin pages never import from `src/components/sections/`

**i18n Boundary:**
- All user-visible strings come from `t('key.path')` — never hardcoded in components
- Locale value flows: `useLocaleStore` → form payload → API → DB `locale` column
- Server locale validation: `z.enum(['en', 'pt-BR', 'es'])` in every schema — rejects unlisted values

**Data Access Boundary:**
- Route handlers call DAO methods only — never `db.prepare()` directly
- DAO files are the only files that import `db` from `server/db.ts`
- DAO methods return typed objects (not raw SQLite row objects)

---

### Requirements to Structure Mapping

**FR1–FR8 (Site Content & Navigation):**
- `src/pages/Home.tsx` — orchestrates section order, lazy-loads all sections
- `src/components/sections/Hero.tsx` → FR1
- `src/components/sections/SyncRevenue.tsx` → FR2
- `src/components/sections/Services.tsx` → FR3
- `src/components/sections/Comparison.tsx` → FR4
- `src/components/sections/Team.tsx` → FR5
- `src/components/sections/Contact.tsx` → FR6
- `src/components/layout/Navbar.tsx` → FR7
- `src/components/layout/Footer.tsx` → FR8

**FR9–FR16 (Lead Capture):**
- `src/components/sections/DemoForm.tsx` + `src/hooks/useDemo.ts` → FR9, FR12, FR16
- `src/components/sections/Contact.tsx` + `src/hooks/useContact.ts` → FR10, FR11, FR12, FR16
- `server/routes/demo.ts` + `server/dao/leads.dao.ts` + `server/lib/mailer.ts` → FR13
- `src/components/sections/DemoScheduler.tsx` + `src/components/layout/Navbar.tsx` → FR15

**FR17–FR22 (Localization):**
- `src/i18n/index.ts` → FR18 (auto-detect), FR21 (persist)
- `src/i18n/LanguageSwitcher.tsx` → FR19 (manual switch)
- `src/i18n/locales/*/translation.json` → FR17, FR20
- `src/store/useLocaleStore.ts` → FR19, FR22 (locale in payload)

**FR23–FR28 (Trust):**
- `src/components/sections/Security.tsx` → FR23, FR25
- `src/components/sections/ClientReferences.tsx` → FR24
- `src/pages/Privacy.tsx` → FR26, FR27

**FR29–FR37 (Admin — Phase 3):**
- `src/pages/admin/Login.tsx` + `src/hooks/useAdmin.ts` → FR29
- `server/routes/admin/auth.ts` + `server/middleware/auth.ts` → FR29
- `src/pages/admin/Leads.tsx` + `server/routes/admin/leads.ts` + `server/dao/leads.dao.ts` → FR30–FR34
- `src/pages/admin/Team.tsx` + `server/routes/admin/team.ts` + `server/dao/team.dao.ts` → FR35–FR37

**FR38–FR40 (Compliance):**
- `server/middleware/auth.ts` → FR38 (JWT-protected data access)
- `server/middleware/rateLimit.ts` → FR39
- `server/schemas/demo.schema.ts` + `server/schemas/contact.schema.ts` → FR40 (locale allowlist)

---

### Integration Points

**Internal Data Flow (form submission):**
```
User fills form
  → createDemoSchema(t) validates client-side (locale-aware errors)
  → useDemo.ts setStatus('submitting')
  → src/lib/api.ts postDemo({ ...data, locale: useLocaleStore.locale })
  → POST /api/demo
  → rateLimit middleware (FR39)
  → demoSchema.parse(body) server-side (FR40 locale check)
  → leads.dao.ts insertLead() → demo_requests table
  → mailer.ts sendNotification() fire-and-forget (FR13)
  → res.json({ success: true, message: '...' })
  → useDemo.ts setStatus('success')
  → inline confirmation shown (FR12)
```

**Admin auth flow:**
```
POST /api/admin/auth/login
  → admin.dao.ts findByEmail()
  → bcrypt.compare(password, hash)
  → jwt.sign({ adminId, email }, JWT_SECRET, { expiresIn: '8h' })
  → res.cookie('token', jwt, { httpOnly: true, sameSite: 'strict' })
  → frontend: useAdminStore.setState({ isAuthenticated: true })
  → redirect to /admin/dashboard
```

**External Integrations:**
- SMTP (nodemailer): outbound only, fire-and-forget, `server/lib/mailer.ts`
- No webhooks, no third-party APIs, no CDN integration in Phase 1

---

### Development Workflow Integration

**Dev server (two processes via `concurrently`):**
- Vite dev server: port 5173, HMR, proxies `/api/*` → Express
- Express (`tsx watch`): port 3001, auto-reload on server changes

**Production build:**
```bash
tsc && vite build
# Output: dist/client/ (static) + dist/server/ (compiled Express)
node dist/server/index.js   # or: pm2 start ecosystem.config.js
```

**DB initialization (first deploy):**
```bash
tsx server/db.seed.ts   # creates tables + initial admin user from env vars
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are compatible. React 18 + Vite 5 + TypeScript strict + Express 4 + better-sqlite3 + Zod 3 + Zustand 4 + i18next 23 + bcryptjs + jsonwebtoken + nodemailer have no known version conflicts. No contradictory decisions found across all 6 architecture sections.

**Pattern Consistency:**
- `snake_case` DB/API naming consistent from schema → DAO → route handler → JSON response
- `PascalCase` component naming consistent across all 11 section components + layout components
- Dot-nested i18n keys consistent: 3-level max enforced, no flat keys
- Form state machine (`idle | submitting | success | error`) consistent across `useDemo.ts` and `useContact.ts`

**Structure Alignment:**
All architectural boundaries (API, admin, i18n, data access) are reflected in the directory structure. DAO boundary (only DAO files import `db`) is structurally enforced. Admin isolation (no cross-imports from sections) is structurally defined.

---

### Requirements Coverage Validation ✅

**Functional Requirements — All 40 FRs covered:**

| FR Range | Coverage | Implementation |
|---|---|---|
| FR1–FR8 (Content & Nav) | ✅ Full | 7 section components + Navbar + Footer |
| FR9–FR16 (Lead Capture) | ✅ Full | DemoForm + Contact + hooks + routes + DAO + mailer |
| FR17–FR22 (i18n) | ✅ Full | i18n init + 3 locale files + locale store + detection |
| FR23–FR28 (Trust) | ✅ Full | Security + ClientReferences + Privacy page |
| FR29–FR37 (Admin/Phase 3) | ✅ Full | admin routes + admin DAO + admin pages |
| FR38–FR40 (Compliance) | ✅ Full | auth middleware + rateLimit + Zod locale enum |

**Non-Functional Requirements — All 24 NFRs covered:**

| Category | Status | Key Decisions |
|---|---|---|
| Performance (P1–P5) | ✅ | React.lazy + Suspense + SectionSkeleton + Cache-Control in express.static |
| Security (S1–S10) | ✅ | helmet + CORS + rate limit + JWT httpOnly + bcrypt≥12 + Zod + prepared stmts |
| Reliability (R1–R4) | ✅ | SMTP fire-and-forget + PM2 auto-restart + client-side submit disable |
| Accessibility (A1–A6) | ✅ | shadcn/ui ARIA baseline + WCAG 2.1 AA target for all components |
| Scalability (SC1–SC4) | ✅ | DAO pattern + JSON-only translations + client-side locale switch |

---

### Gap Analysis Results

**Critical Gaps: None**

**Minor Gaps — Resolved inline:**

| Gap | Resolution |
|---|---|
| G1: Cache-Control not mapped to file | Set in `server/index.ts` via `express.static('dist/client', { setHeaders: (res, path) => { if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); else res.setHeader('Cache-Control', 'max-age=31536000, immutable') } })` |
| G2: NFR-R4 duplicate submission | Server-side: on POST /api/demo and POST /api/contact, check for existing row with same `email` AND `created_at` within 60 seconds before inserting. Return HTTP 200 (not 201) if duplicate found. Implemented in leads.dao.ts and contacts.dao.ts. |
| G3: Phase 1 Team section — bios in DB (Phase 3) vs translation files | Phase 1: team members defined as array in `t('team.members')` translation key. Phase 3: `Team.tsx` replaced with API call to `/api/admin/team`. Phase switch isolated to one component. |

---

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed (40 FRs, 24 NFRs, 4 phases, 3 locales)
- [x] Scale and complexity assessed (medium, monolith, ~8 demos/month target)
- [x] Technical constraints identified (SQLite portability, no SSR, no public API)
- [x] Cross-cutting concerns mapped (i18n, auth, validation, locale capture, error handling)

**Architectural Decisions**
- [x] Critical decisions documented (raw SQL + DAO, React Router v7, React.lazy, PM2, SMTP fire-and-forget, single /privacy route)
- [x] Technology stack fully specified (versions verified, pre-defined in product brief)
- [x] Integration patterns defined (API route map, data flow, auth flow)
- [x] Performance considerations addressed (LCP target, code splitting, cache headers)

**Implementation Patterns**
- [x] Naming conventions established (DB/API snake_case, PascalCase components, camelCase hooks)
- [x] Structure patterns defined (co-located tests, i18n dot-nested, DAO boundary)
- [x] Communication patterns specified (Zustand pattern, form state machine, locale flow)
- [x] Process patterns documented (error handling, loading states, Zod schema pattern)

**Project Structure**
- [x] Complete directory structure defined (file-level tree, 40+ files specified)
- [x] Component boundaries established (admin isolation, data access boundary, i18n boundary)
- [x] Integration points mapped (form submission flow, admin auth flow)
- [x] Requirements to structure mapping complete (all 40 FRs mapped to specific files)

---

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level:** High — all 16 checklist items confirmed, no critical gaps, 3 minor gaps resolved inline.

**Key Strengths:**
- Pre-defined stack eliminates technology decision risk
- All 40 FRs mapped to specific file locations — agents have unambiguous targets
- DAO boundary + PostgreSQL-compatible SQL enables future migration without rework
- i18n pervasive from day 1 — no retrofit risk
- Admin module cleanly isolated — Phase 3 implementation won't touch Phase 1 code

**Areas for Future Enhancement:**
- Phase 4: add DB backup automation, uptime monitoring, HTTPS/SSL config
- Phase 2: SEO additions (meta/OG/hreflang/sitemap) — additive only, no architectural changes
- Post-MVP: PostgreSQL migration path when monthly demo volume warrants it

---

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented in this file
- Use implementation patterns from Step 5 consistently — refer to anti-patterns section
- Respect file boundaries: all SQL in DAO, all fetch in api.ts, all i18n strings in translation JSON
- Refer to FR → file mapping in Step 6 for any questions about where code belongs

**Implementation Sequence:**
1. DB schema + seed (`server/db.ts`, `server/db.seed.ts`)
2. DAO layer (`server/dao/`)
3. Zod schemas (`server/schemas/` + client `createDemoSchema`/`createContactSchema`)
4. Express server + middleware stack (`server/index.ts`, `server/middleware/`)
5. API route handlers (`server/routes/`)
6. i18n setup (`src/i18n/`)
7. Public sections + Home page (`src/components/sections/`, `src/pages/Home.tsx`)
8. Form hooks + submission flow (`src/hooks/`)
9. Admin module — Phase 3 (`src/pages/admin/`, `server/routes/admin/`)

---

## Appendix A: Epic 2 Implementation Variances

These items diverge from the original architecture spec above. They reflect what actually shipped in Epic 2 (Stories 2.1–2.7) and have been verified against the codebase as of 2026-05-15. Treat the variances below as the authoritative current state.

### A.1 UI Primitives — Custom + Native, Not shadcn/ui

The original architecture spec (Tech Stack, Component Tree, UX-DR18) anticipated shadcn/ui primitives (`Button`, `Form`, `FormMessage`, `Toast`, `Skeleton`, `Select`, `Dialog`, etc.). The shipped repo uses:

- Custom `GradientButton` (`src/components/ui/GradientButton.tsx`) with `loading` / `aria-busy` / `disabled-while-async` state (Story 2.2).
- Custom `SectionHeader` (`src/components/ui/SectionHeader.tsx`) with variant pattern from Epic 1.
- Custom `Toast` (`src/components/ui/Toast.tsx`) — introduced in Story 2.2 because shadcn was never installed.
- Native `<select>` and `<input>` elements with custom Tailwind styling — Story 2.6 explicitly preserved native widgets for accessibility parity.

`components.json` exists at the repo root as a leftover shadcn CLI config, but **no shadcn components were ever installed**: no `@radix-ui/*` dependencies, no `src/components/ui/` shadcn-generated folder, and no `<FormMessage>` component. Only `tailwindcss-animate` remains in `package.json` as a cosmetic carryover. `src/components/ui/` ships exactly three hand-written components — `GradientButton.tsx`, `SectionHeader.tsx`, `Toast.tsx`. Form validation errors render inline via `<p role="alert" aria-live="polite">` next to the field. API failures render via the custom `Toast`. Rate-limit 429 errors render inline (Contact) or via Toast (Demo) per UX-DR18.

### A.2 Rate Limiter — Per-Route Factory, Not Shared Singleton

`server/middleware/rateLimit.ts` exports `createFormRateLimiter(overrides?: Partial<Options>)`. **Each POST route instantiates its own limiter**:

- `server/routes/demo.ts` — `const demoRateLimiter = createFormRateLimiter()`
- `server/routes/contact.ts` — `const contactRateLimiter = createFormRateLimiter()`

This was discovered in Story 2.7 review: a shared singleton violated AC2's independent-window requirement (one form's quota draining the other). The factory pattern restores per-form windows. The 429 response body is **exactly** `{ success: false, message: 'Too many requests' }` — tests assert the exact string.

### A.3 Client / Server Zod Separation

| Layer | Location | Pattern |
|---|---|---|
| Server | `server/schemas/demo.schema.ts`, `server/schemas/contact.schema.ts` | Strict Zod schemas, no i18n, exact payload validation before DAO calls. |
| Client | `src/hooks/useDemo.ts` exports `createDemoSchema(t: TFunction)`; `src/hooks/useContact.ts` exports `createContactSchema(t: TFunction)` | Factory closes over the i18n `t` function so error messages re-render on locale switch. |

**No cross-boundary imports.** A forensic source-walk test introduced in Story 2.1 enforces this. Client schemas do not import from `server/schemas/*`. The original architecture implied a single shared schema layer; the shipped reality is two independent layers with parallel field definitions.

`contactSchema.subject` is a Zod **enum allowlist** (`CONTACT_SUBJECT_VALUES`: `SyncRevenue`, `BI/Data Analytics`, `OBTs`, `Custom Development`, `Other`), not a free string. Tightened in Story 2.3 review.

### A.4 `createApp()` Factory + Test Harness

`server/index.ts` exports `createApp(): Express`. Binding is gated by `require.main === module`. This enables:

- **`server/test-utils/request.ts`** — invokes the Express app directly through `IncomingMessage`/`ServerResponse` without a port bind. No `supertest` dependency.
- Ephemeral-port integration tests that never collide with the dev server.

Every server test file starts with `// @vitest-environment node` because the default Vitest project environment is `jsdom`.

### A.5 DAO Factory Pattern

Each DAO module exports both a factory and a default singleton:

```
export function createLeadsDao(database: Database = defaultDb): LeadsDao { ... }
export const leadsDao = createLeadsDao()
```

Applies to `leads.dao.ts`, `contacts.dao.ts`, `team.dao.ts`, `admin.dao.ts`. Tests inject an in-memory SQLite database; production uses the default singleton. The original architecture treated DAOs as plain singletons.

### A.6 Multi-CTA Convergence via Imperative Handle

`DemoForm.tsx` is wrapped in `forwardRef<DemoFormHandle>` and exposes `focusFirstField()` via `useImperativeHandle`. There is **exactly one** `DemoForm` instance on the Home page — enforced by `Home.story-2-4.e2e.test.tsx`. All CTAs (Hero, Navbar, DemoScheduler inline) scroll to and focus this single instance. `scrollIntoView` is polyfilled in jsdom tests via `Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', ...)`.

### A.7 Fire-and-Forget SMTP

HTTP route handlers do **not** await `sendNotification`:

```
void sendNotification(subject, body).catch(err => console.error(...))
```

The 200 response is returned immediately after the DAO insert. SMTP failure does not fail the user request. Tests assert this with `mockReturnValueOnce(new Promise(() => undefined))` — the response resolves while SMTP hangs. SMTP subjects use the em-dash `—`, not the ASCII hyphen.

### A.8 API Envelope Strictness

`src/lib/api.ts` is the only client fetch wrapper. It rejects 2xx responses whose JSON body lacks `success: true`. Two-XX status alone is not sufficient. Added in Story 2.2 review.

### A.9 Duplicate-Submit Ref Guard

Form hooks (`useDemo`, `useContact`) gate submission with a `useRef<boolean>` flag set synchronously before `await`, restored after settle. This prevents the race where double-clicks fire two requests before React commits `submitting` state.

### A.10 Build-Output Secret Scan

`scripts/check-client-bundle-secrets.mjs` runs post-build, walks `dist/client`, and asserts no seeded sentinel values (`JWT_SECRET=client-bundle-jwt-secret-sentinel`, etc.) appear in the bundle. Confirms `VITE_*` discipline at the build artifact level, not just at source.

### A.11 Forensic Source-Walk Tests

Story 2.1 introduced tests that walk:

- `src/**/*` — assert no occurrences of secret-shaped strings (`JWT_SECRET`, `SMTP_PASS`, etc.) or any `process.env.X` outside the explicit `VITE_*` allowlist.
- `server/routes/**/*` — assert no `db.prepare(` calls; route handlers must go through DAO.

These run as part of the standard test suite and catch architectural drift mechanically.

### A.12 Admin Auth — Still 501 Placeholders

`POST /api/admin/auth/login`, `/logout`, and `/me` return 501 from Story 2.1. The middleware (`requireAdmin`) is wired but auth issuance is deferred to Epic 4 / Story 4.1. The 2.1 review caught and fixed the bug where `/me` was mounted on the public router without `requireAdmin`.

### A.13 JSON 404 / 500 Fallthrough

Unmatched `/api/*` requests return JSON `{ success: false, message: '...' }` — not the Express default HTML error page. Added in Story 2.1 review.

### A.14 Items Not Yet Reconciled

The original architecture document above still contains shadcn/ui references that should be read with §A.1 in mind. A full rewrite of those passages is deferred; this appendix is the authoritative override.
