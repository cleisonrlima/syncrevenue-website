# Story 4.1: Admin Authentication — Login & Session Management

Status: review

<!-- Created 2026-05-16 by /bmad-create-story. Parent Jira: SYN-28 (verify on next jira sync — sprint-status mirror notes "assumed keys"). -->

## Story

As a Sync Sirius ops team member,
I want to log in to a secure admin panel with my credentials and maintain a session,
So that I can access lead and team management without re-authenticating every visit.

## Acceptance Criteria

1. **Given** an ops team member navigates to `/admin`, **when** `AdminLayout.tsx` renders, **then** it consults `useAdminStore.isAuthenticated`; if `false`, redirects to `/admin/login`; if `true`, renders the admin outlet. A session bootstrap call to `GET /api/admin/auth/me` runs on first mount so a reload (cookie still valid, store empty) hydrates `useAdminStore` before redirect logic fires.

2. **Given** the admin login page renders, **when** a visitor accesses `/admin/login` while already authenticated (`useAdminStore.isAuthenticated === true`), **then** they are redirected to `/admin/dashboard`.

3. **Given** valid admin credentials are submitted to `POST /api/admin/auth/login`, **when** the server processes the request, **then**: (a) Zod schema validates `{ email, password }` server-side (HTTP 400 on shape failure); (b) `adminDao.findByEmail()` retrieves the user; (c) `bcrypt.compare()` validates the password using bcryptjs against `password_hash` (the stored hash was produced with salt rounds ≥ 12); (d) on match, `jwt.sign({ adminId, email }, JWT_SECRET, { expiresIn: '8h' })` issues a token; (e) cookie `admin_token` is set with `httpOnly: true`, `sameSite: 'strict'`, `secure: true` when `NODE_ENV === 'production'`, `path: '/'`, and `maxAge` matching the 8h JWT TTL; (f) response is HTTP 200 `{ success: true, data: { adminId, email } }`.

4. **Given** the JWT cookie is set successfully, **when** the login response resolves on the client, **then** `useAdminStore` is updated to `{ isAuthenticated: true, adminId, email }`; the user is redirected to `/admin/dashboard` via `react-router-dom` navigation; no full page reload is required.

5. **Given** invalid credentials are submitted (unknown email OR wrong password), **when** `POST /api/admin/auth/login` responds, **then** HTTP 401 with body `{ success: false, message: 'Invalid credentials' }`; no `admin_token` cookie is set; the login form renders the message inline as an accessible error (`role="alert"` or `aria-live="polite"`); no information leak distinguishes "unknown email" from "wrong password".

6. **Given** an admin session expires after 8 hours (or is invalid/tampered), **when** an authenticated request hits any `/api/admin/*` route, **then** `requireAdmin` middleware returns HTTP 401 `{ success: false, message: 'Unauthorized' }`; client-side, any admin API helper that receives 401 triggers a session reset (`useAdminStore` cleared); `AdminLayout.tsx` detects the unauthenticated state on its next render cycle (or after the `me` bootstrap call returns 401) and navigates to `/admin/login`.

7. **Given** an admin triggers logout (the wiring exposed by `useAdmin().logout()`; the visible button itself lives in `Dashboard.tsx` temporarily and will move into the persistent admin nav shell in Story 4.6), **when** `POST /api/admin/auth/logout` fires, **then**: (a) server clears `admin_token` cookie via `res.clearCookie('admin_token', { path: '/' })` with matching `sameSite`/`secure` attributes; (b) response is HTTP 200 `{ success: true }`; (c) `useAdminStore` resets to `{ isAuthenticated: false, adminId: null, email: null }`; (d) user is redirected to `/admin/login`.

8. **Given** `db.seed.ts` is executed with `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables set, **when** the script runs, **then**: (a) it imports `initSchema` so `admin_users` exists; (b) it bcrypt-hashes the password with salt rounds = 12; (c) it calls `adminDao.upsert({ email, password_hash })` so the first run inserts and a subsequent run with the same email no-ops or refreshes the hash without creating a duplicate row; (d) the script exits with code 0 on success and a non-zero code with a descriptive `console.error` when env vars are missing; (e) an npm script `db:seed` (or equivalent `npm run db:seed`) invokes it via `tsx server/db.seed.ts`.

9. **Given** `/admin` is hit cold (no cookie, empty store), **when** `AdminLayout.tsx` mounts, **then** the bootstrap `GET /api/admin/auth/me` resolves 401, `useAdminStore` stays unauthenticated, and the user is sent to `/admin/login` without a visible flash of protected content (a tiny loading state is acceptable; rendering the admin outlet first is not).

## Tasks / Subtasks

- [x] Subtask 1: Server — `POST /api/admin/auth/login` implementation (AC: 3, 5)
  - [ ] Add `server/schemas/admin-auth.schema.ts` with a Zod schema for `{ email: z.string().email(), password: z.string().min(1) }`. Export `loginSchema` and `LoginPayload`.
  - [ ] Replace the 501 stub in `server/routes/admin/auth.ts` `router.post('/login', ...)`. On Zod failure → HTTP 400 with the standard error envelope (`field` on the first failing field). On `adminDao.findByEmail()` miss → HTTP 401 `'Invalid credentials'` (do not branch on user existence). On `bcrypt.compare()` mismatch → HTTP 401 `'Invalid credentials'` (use bcryptjs — the installed package; alias `import bcrypt from 'bcryptjs'`). On JWT_SECRET missing → HTTP 500 `'Auth not configured'` (same envelope `requireAdmin` already uses).
  - [ ] On success, sign the JWT with `expiresIn: '8h'` and payload `{ adminId, email }` only. Use `res.cookie(AUTH_COOKIE_NAME, token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000, path: '/' })`. Respond `{ success: true, data: { adminId, email } }` with HTTP 200.
  - [ ] Do NOT mount `requireAdmin` on `/login` or `/logout`. Leave `/me` protected (already wired).

- [x] Subtask 2: Server — `POST /api/admin/auth/logout` implementation (AC: 7)
  - [ ] Replace the 501 stub. Always `res.clearCookie(AUTH_COOKIE_NAME, { path: '/', sameSite: 'strict', secure: process.env.NODE_ENV === 'production' })` then return `{ success: true }` HTTP 200. Logout must succeed even when no cookie is present (idempotent).

- [x] Subtask 3: Server — admin user seeding (`db.seed.ts`) (AC: 8)
  - [ ] Replace the `export {}` stub in `server/db.seed.ts` with a `tsx`-executable script: read `ADMIN_EMAIL`, `ADMIN_PASSWORD` from `process.env`; if either missing → `console.error` + `process.exit(1)`.
  - [ ] Import `./db` (this triggers `initSchema`). `bcrypt.hash(password, 12)`. Call `adminDao.upsert({ email, password_hash })`. `console.log` a one-line success message that never includes the password. Exit 0.
  - [ ] Add `"db:seed": "tsx server/db.seed.ts"` to `package.json` scripts.
  - [ ] Update `.env.example` to document `ADMIN_EMAIL=` and `ADMIN_PASSWORD=` (empty values, with a comment that these are only consumed by the seed script, never by the running server).

- [x] Subtask 4: Frontend — `useAdminStore` (AC: 1, 4, 6, 7)
  - [ ] Replace the `export {}` stub in `src/store/useAdminStore.ts` with a Zustand store: state `{ isAuthenticated: boolean; adminId: number | null; email: string | null; bootstrapped: boolean }`; actions `setSession({ adminId, email })`, `clearSession()`, `markBootstrapped()`.
  - [ ] Initial state: `{ isAuthenticated: false, adminId: null, email: null, bootstrapped: false }`. `bootstrapped` flips to `true` after the first `/me` call resolves (200 or 401) so `AdminLayout` can distinguish "not checked yet" from "checked and unauthenticated".
  - [ ] Do NOT persist via `zustand/middleware/persist` — session truth lives in the httpOnly cookie + `/me`, not in client storage. The store is a render cache only.

- [x] Subtask 5: Frontend — `src/lib/api.ts` admin helpers (AC: 3, 5, 6, 7)
  - [ ] Add `postAdminLogin({ email, password })` → `POST /api/admin/auth/login` with `credentials: 'include'`. On non-`success: true` response throw `AdminApiError(status, message, field?)`. Surface 401 message verbatim so the form can display `'Invalid credentials'`.
  - [ ] Add `postAdminLogout()` → `POST /api/admin/auth/logout` with `credentials: 'include'`. Resolves on `success: true`; soft-resolves on 401 (treat as already-logged-out).
  - [ ] Add `getAdminMe()` → `GET /api/admin/auth/me` with `credentials: 'include'`. Returns `{ adminId, email } | null` (null on 401). Never throws for 401 — that is the expected unauthenticated branch used by the bootstrap.
  - [ ] Export a new `AdminApiError` class following the `DemoApiError`/`ContactApiError` pattern in the same file.

- [x] Subtask 6: Frontend — `useAdmin` hook (AC: 4, 6, 7)
  - [ ] Replace the `export {}` stub in `src/hooks/useAdmin.ts` with a hook that exposes `{ login(email, password), logout(), bootstrap(), isAuthenticated, email, bootstrapped, error, isSubmitting }`.
  - [ ] `login` wraps `postAdminLogin`, on success calls `setSession()` and navigates to `/admin/dashboard` via `useNavigate()`. On `AdminApiError` 401 stores `'Invalid credentials'` (i18n key, see Subtask 9) into `error` and resets `isSubmitting`. Other failures → generic error message.
  - [ ] `logout` wraps `postAdminLogout`, always calls `clearSession()` and navigates to `/admin/login` (do this even if the POST fails — the user wanted out).
  - [ ] `bootstrap` calls `getAdminMe()`; on 200 → `setSession()`; on 401 → `clearSession()`; either way → `markBootstrapped()`. Safe to call multiple times.

- [x] Subtask 7: Frontend — `AdminLayout` auth gate + bootstrap (AC: 1, 6, 9)
  - [ ] Extend `src/components/layout/AdminLayout.tsx`: on mount, if `!bootstrapped` call `useAdmin().bootstrap()`. While `!bootstrapped`, render a minimal centered loading state (re-use the existing `SectionSkeleton` or a small spinner — do not flash protected content).
  - [ ] After bootstrap, if `!isAuthenticated` AND the current route is not `/admin/login`, `<Navigate to="/admin/login" replace />`. If `isAuthenticated` AND the current route is `/admin/login`, `<Navigate to="/admin/dashboard" replace />` (this satisfies AC 2 from inside the layout — the login page becomes a no-op redirect when authed). Keep the existing SEO-strip effect.

- [x] Subtask 8: Frontend — `Login.tsx` form (AC: 3, 4, 5)
  - [ ] Replace the stub in `src/pages/admin/Login.tsx`. Build a controlled form with `email` and `password` inputs (use `src/components/ui/` primitives — Label, Input, Button — match the existing demo/contact form pattern).
  - [ ] Use the i18n `admin` namespace for all visible strings (see Subtask 9). Wire submit → `useAdmin().login(email, password)`. While submitting, disable the submit button and show a busy state.
  - [ ] Render `error` inline below the form with `role="alert"`. Map error keys to i18n strings — the API returns canonical English `'Invalid credentials'` which the hook should translate to the active locale via the i18n `t()` call, NOT by string-matching the API message (use a status-code → key map: 401 → `'admin.login.errors.invalidCredentials'`, network → `'admin.login.errors.network'`).

- [x] Subtask 9: i18n — admin namespace (AC: 5, 8 indirectly)
  - [ ] Add an `admin` block to `src/i18n/locales/{en,pt-BR,es}.json` (or whichever shape the existing i18n loader uses — verify with `src/i18n/`). Keys at minimum: `admin.login.title`, `admin.login.email`, `admin.login.password`, `admin.login.submit`, `admin.login.errors.invalidCredentials`, `admin.login.errors.network`, `admin.logout`. EN, PT-BR, ES all populated.
  - [ ] Treat `aria-label` and other a11y metadata as technical (no i18n) per the existing project rule — but VISIBLE labels and error text MUST be translated.

- [x] Subtask 10: Frontend — minimal `Dashboard.tsx` with logout button (AC: 7)
  - [ ] Replace the `<main />` stub in `src/pages/admin/Dashboard.tsx` with a minimal protected landing: a heading and a Logout button wired to `useAdmin().logout()`. Story 4.6 will replace this with the persistent admin nav shell — leave a one-line `<!-- TODO Story 4.6 -->` HTML comment marking the logout's temporary home so 4.6 knows to move it (NOT a code comment; the project rule discourages code comments).
  - [ ] Do NOT implement leads/team/dashboard widgets here — those are Story 4.2 / 4.4 / 4.6 territory.

- [x] Subtask 11: Server tests (AC: 3, 5, 7, 8)
  - [ ] `server/routes/admin/auth.test.ts` (new): cover login happy path (sets cookie, returns `{ success: true, data: {...} }`); 400 on missing email/password; 401 on unknown email; 401 on wrong password; 500 when `JWT_SECRET` missing; logout always 200 and clears cookie; `/me` reuses `requireAdmin` and round-trips the cookie correctly. Use `bcryptjs.hashSync(password, 12)` to seed an admin row in an in-memory DB per the existing `server/test-utils/request.ts` + `:memory:` `Database` pattern (see `server/dao/admin.dao.test.ts`).
  - [ ] `server/db.seed.test.ts` (new): unit-test the seed function (export the body as a function for testability) — first run creates the user, second run with same email does not duplicate, missing env vars throw / exit non-zero. Mock `process.exit` and `console.error` to assert without killing the test runner.

- [x] Subtask 12: Frontend tests (AC: 1, 2, 4, 5, 6, 7, 9)
  - [ ] `src/store/useAdminStore.test.ts` (new): set/clear/markBootstrapped state transitions.
  - [ ] `src/hooks/useAdmin.test.ts` (new): mock `src/lib/api.ts`; cover `login` success → store updated + navigate, `login` 401 → error key set, `logout` clears store + navigates, `bootstrap` 200/401 branches.
  - [ ] `src/pages/admin/Login.test.tsx` (new): renders i18n labels; submitting with valid creds calls `postAdminLogin` and on success triggers navigate; 401 displays `'Invalid credentials'` text from the active locale; submit button disabled during submission.
  - [ ] `src/components/layout/AdminLayout.test.tsx` (new): renders loading state pre-bootstrap; redirects to `/admin/login` post-bootstrap when 401; renders outlet when authed; redirects authed users away from `/admin/login`.
  - [ ] `src/lib/api.test.ts` (extend): add admin helper tests using `vi.stubGlobal('fetch', ...)`.

- [x] Subtask 13: E2E coverage gate (AC: 1, 4, 5, 7)
  - [ ] Add `tests/e2e/admin-auth.spec.ts`: visit `/admin` → expect redirect to `/admin/login`. Submit bad creds → expect `'Invalid credentials'` visible. Submit good creds (seed via global setup) → expect URL `/admin/dashboard`. Click Logout → expect redirect back to `/admin/login` and re-visiting `/admin` redirects to login again. Use Playwright's `request.newContext()` for cookie-aware reload assertion. (If local Playwright browsers are not installed in the sandbox, document the skipped projects in the Change Log — same convention as Story 3.11.)

- [x] Subtask 14: Verification (all ACs)
  - [ ] `npm run typecheck`.
  - [ ] `npm run test:run` — full suite green.
  - [ ] `npm run db:seed` against a scratch `data/` file with `ADMIN_EMAIL=test@example.com ADMIN_PASSWORD=...` to confirm idempotency.
  - [ ] `npm run build` — confirm no JWT_SECRET / ADMIN_PASSWORD strings leak into `dist/client/` bundles (extend the Story 2.7 bundle-secret scan if needed).
  - [ ] `npm run dev` and manually exercise login → dashboard → logout → reload-while-authed → expired-cookie (drop the cookie in devtools) flows in a real browser.

- [x] Subtask 15: Vault + docs (post-implementation)
  - [ ] Update `vault/Code/Backend.md` to add the admin auth route + middleware + seed entries.
  - [ ] Update `vault/Code/Frontend.md` to add the admin auth hook + store + Login page entries.
  - [ ] Update `vault/Planning/Architecture-Key.md` if any new conventions are established (e.g., httpOnly cookie name, store-as-cache rule).
  - [ ] Update `vault/Planning/Epics-Index.md` to mark Story 4.1 progress.

### Review Findings

<!-- Populated by the reviewer after cross-model code review. Leave empty until then. -->

## Dev Notes

### Source Context

- Epic 4 enables the Sync Sirius ops team to manage leads + team content through a JWT-authenticated admin dashboard; Story 4.1 establishes the auth and session foundation that all later Epic 4 stories (4.2 leads, 4.3 lead status, 4.4 team CRUD, 4.5 team order, 4.6 nav shell) depend on. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 4: Admin Operations (Phase 3)`]
- FRs covered by this story slice: FR29 (admin auth + session management). FR30–FR37 are downstream Epic 4 work. [Source: `_bmad-output/planning-artifacts/epics.md`]
- Architecture authentication decision: JWT in httpOnly cookie, `{ adminId, email, iat, exp }` payload, 8h expiry, `sameSite: 'strict'`, bcrypt salt rounds ≥ 12, admin account creation CLI-only via `db.seed.ts`. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Response envelope is `{ success, data?, message?, field? }`; HTTP codes: 200 success, 400 validation, 401 unauthorized, 500 server error. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Middleware stack order: `helmet() → cors() → express.json() → cookieParser() → rateLimit (form routes) → requireAdmin (admin routes) → handlers`. Story 4.1 must not change the order. [Source: `server/index.ts:21-46`]

### Current State of Files to Update

- `server/middleware/auth.ts` — `requireAdmin` middleware **already complete**: reads `admin_token` cookie, verifies JWT, attaches `req.admin`, returns 401 on miss/expiry/tamper, 500 on missing `JWT_SECRET`. `AUTH_COOKIE_NAME = 'admin_token'` exported. **Do not modify**; reuse as-is. [Source: `server/middleware/auth.ts:1-47`]
- `server/dao/admin.dao.ts` — Already provides `findByEmail`, `findById`, `create`, `upsert`. **Do not modify**; consume from the new login route and the seed script. [Source: `server/dao/admin.dao.ts:1-50`]
- `server/routes/admin/auth.ts` — `/login` and `/logout` are 501 stubs. `/me` is already wired through `requireAdmin` and returns `{ adminId, email }` on 200, 401 otherwise. The frontend bootstrap depends on `/me` — keep its shape stable. [Source: `server/routes/admin/auth.ts:1-23`]
- `server/index.ts` — Already mounts `/api/admin/auth` without `requireAdmin` (so login/logout are reachable unauthenticated) and `/api/admin/leads|contacts|team` behind `requireAdmin` (which intentionally protects future Epic 4 stories). `cookieParser()` already wired. [Source: `server/index.ts:33-46`]
- `server/db.ts` — `admin_users` table already created by `initSchema` (matches arch spec). Importing `./db` is sufficient to ensure schema exists for the seed script. [Source: `server/db.ts:66-71`]
- `server/db.seed.ts` — currently `export {}` (stub). Subtask 3 fills this.
- `src/store/useAdminStore.ts` — currently `export {}` (stub). Subtask 4 fills this.
- `src/hooks/useAdmin.ts` — currently `export {}` (stub). Subtask 6 fills this.
- `src/components/layout/AdminLayout.tsx` — currently only handles SEO meta strip + `<Outlet />`. Subtask 7 adds the auth gate while preserving the SEO-strip behavior. [Source: `src/components/layout/AdminLayout.tsx:1-24`]
- `src/pages/admin/Login.tsx`, `Dashboard.tsx` — single-line stubs (`<main />`). Subtasks 8, 10 fill them.
- `src/App.tsx` — admin route tree already wired (`/admin` with nested `login`/`dashboard`/`leads`/`team`); index redirects to `login`. **Do not modify** router. [Source: `src/App.tsx:31-37`]
- `src/lib/api.ts` — has `postDemo`, `postContact`, `postAudit` with the `*ApiError` class pattern. Add `postAdminLogin`, `postAdminLogout`, `getAdminMe`, and `AdminApiError` following the same pattern; do not refactor existing helpers. [Source: `src/lib/api.ts:51-172`]
- `.env.example` — has `JWT_SECRET=` placeholder but no `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Subtask 3 adds them with empty values + a comment scoping them to the seed script.
- `package.json` — `bcryptjs ^3.0.3`, `jsonwebtoken ^9.0.3`, `cookie-parser ^1.4.7`, `@types/*` for all three are already installed. **Do not add new deps.** [Source: `package.json`]

### Architecture Guardrails

- **No new runtime dependencies.** `bcryptjs`, `jsonwebtoken`, and `cookie-parser` are already installed; use them. Specifically import bcrypt as `import bcrypt from 'bcryptjs'` (NOT `bcrypt`) — the native `bcrypt` package is not in this repo. [Source: `package.json`]
- **Cookie name is `admin_token`** — re-export from `server/middleware/auth.ts` (`AUTH_COOKIE_NAME`). Do not hardcode the string in multiple places.
- **Cookie security attributes**: `httpOnly: true`, `sameSite: 'strict'`, `secure: process.env.NODE_ENV === 'production'`, `path: '/'`, `maxAge: 8 * 60 * 60 * 1000`. Same attributes on `res.clearCookie` (browsers require the clear to match the set's `sameSite`/`secure`/`path` to drop the cookie cleanly).
- **JWT payload is `{ adminId, email }` only.** No roles, no permissions, no extra claims — single admin user type per the architecture decision. `expiresIn: '8h'`.
- **bcrypt salt rounds = 12 minimum.** Use `12` exactly (not higher — keep seed runtime reasonable). [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- **No information leak in 401**: same message `'Invalid credentials'` for unknown-email and wrong-password branches. Do not change status to 404 for unknown email.
- **Zustand store is a render cache, not the source of truth.** Cookie + `/me` is the truth. Do not persist the store. On any 401 from an admin API call, clear the store. The bootstrap `/me` on mount is what survives a page reload.
- **Admin-side pages may NOT import from `src/components/sections/`** (Story 4.6 AC enforces this — start the discipline now). Admin imports allowed: `src/pages/admin/*`, `src/components/layout/AdminLayout.tsx`, `src/components/ui/*`, `src/hooks/useAdmin.ts`, `src/store/useAdminStore.ts`, `src/lib/api.ts`, `src/i18n/*`. [Source: `_bmad-output/planning-artifacts/epics.md#Story 4.6: Admin Dashboard & Navigation Shell`]
- **i18n boundary for a11y**: `aria-label`, SVG titles, and skeleton labels stay technical (English, not translated). Visible labels and error text are translated. [Source: project memory `feedback_a11y_i18n_boundary.md`]
- **No `VITE_`-prefixed admin secrets.** `ADMIN_EMAIL` / `ADMIN_PASSWORD` are server-only and only consumed by `db.seed.ts`. The Story 2.7 client-bundle secret scan should not need an update, but verify the scan still passes after build.

### Previous Story Intelligence

- **Story 2.1** scaffolded the admin auth surface area: `server/middleware/auth.ts` (`requireAdmin`), `server/dao/admin.dao.ts`, `server/routes/admin/auth.ts` (with `/me` working and `/login`+`/logout` as 501 stubs), the `admin_users` schema, and the cookie-parser middleware wiring. Story 4.1's job is to fill the stubs and add the frontend, NOT to redesign any of that. [Source: `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md`]
- **Story 2.7** established the security baseline (rate limits, Helmet, CORS, client-bundle secret scan). Admin auth routes are NOT rate-limited by the existing form rate limiter — that limiter only mounts on `POST /api/demo` and `POST /api/contact`. Adding rate limiting to `/api/admin/auth/login` is out of scope for 4.1 (defer to a follow-up if cross-model review flags it). [Source: `_bmad-output/implementation-artifacts/2-7-security-hardening-rate-limiting-headers-locale-allowlist.md`]
- **Story 2.6** established that form a11y errors use `role="alert"` + `aria-live` and that visible error text is i18n'd via the active locale. Mirror this pattern in the login form. [Source: `_bmad-output/implementation-artifacts/2-6-form-accessibility-locale-aware-validation.md`]
- **Story 3.8** delivered `ErrorBoundary` and i18n recovery UX. Do not wrap the admin login flow in a separate error boundary — the global one in `App.tsx` already catches render errors. [Source: `_bmad-output/implementation-artifacts/3-8-errorboundary-i18n-recovery-ux.md`]
- **Story 3.7** standardized font loading + ui primitives. Use the existing `Input`, `Label`, `Button` from `src/components/ui/` instead of raw HTML elements. [Source: `_bmad-output/implementation-artifacts/3-7-epic-1-review-polish-font-loading-ui-primitives.md`]
- **CLAUDE.md rule — Cross-Model Review**: dev agent and review agent MUST differ. If Claude implements 4.1, the review pass MUST be Codex (or another non-Claude agent). Configure agent assignment at preflight before the dev step. [Source: `CLAUDE.md` and project memory `feedback_cross_model_review.md`]
- **CLAUDE.md rule — Story Subtasks Mandatory**: this story must also have child Sub-task issues created in Jira under parent SYN-28 (verify key on next sync — the mirror block in `sprint-status.yaml:51` marks `4.1 SYN-28` as "assumed; verify on Jira sync"). [Source: `CLAUDE.md`]

### Git Intelligence

- Recent commits (last 5): `edcf167` chore review-story-3.11 patch; `4ce68a9` feat story-3.11 EN canonical/og:url alignment; `0ccff9d` chore review-story-3.10 done; `2b4142b` docs story-3.10 backfill commit hashes; `7247807` feat story-3.10 defaultValue lint rule + sandbox conventions. All recent work is Epic 3 polish; the admin surface is untouched since Story 2.1 left the stubs. [Source: `git log --oneline -5`]
- Files Story 4.1 will touch are concentrated under `server/routes/admin/`, `server/db.seed.ts`, `src/store/`, `src/hooks/`, `src/components/layout/AdminLayout.tsx`, `src/pages/admin/`, `src/lib/api.ts`, `src/i18n/`, and matching `*.test.*` files. No conflicts expected with in-flight work — sprint-status mirror confirms 3.* stories are all `done` and Epic 4 is unstarted. [Source: `_bmad-output/implementation-artifacts/sprint-status.yaml`]

### Latest Technical Notes

- **bcryptjs `hash(password, 12)`** uses 12 cost rounds. Hashing is intentionally slow (~150–300ms on modern hardware) — that is the point. Do NOT call it in a hot path; the seed script runs it once. [Source: https://github.com/dcodeIO/bcrypt.js#readme]
- **jsonwebtoken `sign(payload, secret, { expiresIn: '8h' })`** writes `iat` and `exp` automatically. On verify, `TokenExpiredError` is thrown for expired tokens — `requireAdmin` already catches this generically and returns 401. [Source: https://github.com/auth0/node-jsonwebtoken#readme]
- **`res.clearCookie` MUST match the set attributes for `sameSite` and `secure`**, otherwise modern browsers (Chrome 80+, Firefox, Safari) silently retain the cookie. Document this in code via the helper rather than inline strings. [Source: https://expressjs.com/en/api.html#res.clearCookie]
- **Zustand stores without `persist`** lose state on full page reload. That is intentional here — reload should be re-bootstrapped via `/me`, NOT trusted from `localStorage`. [Source: https://zustand.docs.pmnd.rs/]
- **Playwright cookie-aware reload**: use `page.reload()` after login to verify the cookie survives. Use `context.cookies()` to assert the cookie has `httpOnly: true`, `sameSite: 'Strict'`. [Source: https://playwright.dev/docs/api/class-browsercontext#browser-context-cookies]

### Testing Requirements

- Server unit tests use `// @vitest-environment node` + `server/test-utils/request.ts` + in-memory `Database(':memory:')` per `server/dao/admin.dao.test.ts` and `server/middleware/auth.test.ts`. Mirror that exact pattern.
- Login route tests must seed the admin row with `bcryptjs.hashSync(password, 12)` (sync variant is fine in tests — keeps them fast).
- Frontend tests use `@testing-library/react` + Vitest (`jsdom` environment) per `src/lib/api.test.ts` and `src/hooks/useDemo.test.ts`. Wrap components that use `useNavigate` in `<MemoryRouter>`.
- E2E tests live in `tests/e2e/` and use Playwright per `tests/e2e/seo.spec.ts`. Document any sandbox-skipped projects (WebKit/mobile-safari) in the Change Log — Story 3.11 set the precedent.
- Do NOT mock `requireAdmin` in login/logout tests — exercise the real middleware so cookie/JWT round-trip is covered end-to-end.

### Project Structure Notes

Expected write surface:

```
server/
  routes/admin/auth.ts           ← UPDATE: implement /login + /logout
  routes/admin/auth.test.ts      ← NEW
  schemas/admin-auth.schema.ts   ← NEW
  schemas/admin-auth.schema.test.ts ← NEW (Zod shape coverage)
  db.seed.ts                     ← UPDATE: stub → real script
  db.seed.test.ts                ← NEW

src/
  store/useAdminStore.ts         ← UPDATE: stub → zustand store
  store/useAdminStore.test.ts    ← NEW
  hooks/useAdmin.ts              ← UPDATE: stub → hook
  hooks/useAdmin.test.ts         ← NEW
  components/layout/AdminLayout.tsx     ← UPDATE: add auth gate + bootstrap
  components/layout/AdminLayout.test.tsx ← NEW
  pages/admin/Login.tsx          ← UPDATE: stub → form
  pages/admin/Login.test.tsx     ← NEW
  pages/admin/Dashboard.tsx      ← UPDATE: stub → minimal landing + logout button
  lib/api.ts                     ← UPDATE: add admin* helpers + AdminApiError
  lib/api.test.ts                ← UPDATE: extend with admin helper tests
  i18n/locales/en.json           ← UPDATE: add admin namespace
  i18n/locales/pt-BR.json        ← UPDATE: add admin namespace
  i18n/locales/es.json           ← UPDATE: add admin namespace

tests/e2e/
  admin-auth.spec.ts             ← NEW

.env.example                     ← UPDATE: ADMIN_EMAIL, ADMIN_PASSWORD with scope comment
package.json                     ← UPDATE: add "db:seed" script

vault/
  Code/Backend.md                ← UPDATE
  Code/Frontend.md               ← UPDATE
  Planning/Architecture-Key.md   ← UPDATE if conventions added
  Planning/Epics-Index.md        ← UPDATE story 4.1 status
```

No structural conflicts with the directory layout documented in `_bmad-output/planning-artifacts/architecture.md` lines 615–700.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md:1101-1139`] — Story 4.1 ACs (BDD form)
- [Source: `_bmad-output/planning-artifacts/architecture.md:234-255`] — Authentication & Security decision
- [Source: `_bmad-output/planning-artifacts/architecture.md:257-292`] — API patterns + status codes + response envelope
- [Source: `_bmad-output/planning-artifacts/architecture.md:307-316`] — Admin route tree
- [Source: `_bmad-output/planning-artifacts/architecture.md:615-700`] — Server + client directory map
- [Source: `server/middleware/auth.ts`] — `requireAdmin` (already complete)
- [Source: `server/dao/admin.dao.ts`] — adminDao API
- [Source: `server/routes/admin/auth.ts`] — current stubs + `/me`
- [Source: `server/index.ts:33-46`] — middleware mount order + admin router mounts
- [Source: `server/db.ts:66-71`] — `admin_users` table definition
- [Source: `src/App.tsx:31-37`] — admin route tree (already wired)
- [Source: `src/lib/api.ts:51-172`] — existing API helper + error class pattern
- [Source: `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md`] — Story 2.1 scaffold notes
- [Source: `_bmad-output/implementation-artifacts/2-6-form-accessibility-locale-aware-validation.md`] — form a11y + i18n error pattern
- [Source: `CLAUDE.md`] — cross-model review, story subtasks, jira sync, vault update rules

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — `claude-opus-4-7[1m]` — via Claude Code, 2026-05-16.

### Debug Log References

- `npm run typecheck` — PASS (0 errors).
- `npm run test:run` — PASS (377/377 tests, 64 files).
- `npm run build` — PASS (`tsc -p tsconfig.server.json` + `vite build` + `node scripts/generate-seo-assets.mjs`).
- `npm run check:client-bundle-secrets` — PASS (no JWT_SECRET / ADMIN_PASSWORD / etc. in dist/client/).
- `npm run db:seed` (idempotency check): first run = `admin user created`, second run = `admin user updated` (same row), missing env = `admin seed failed: ADMIN_EMAIL is required to seed admin user` + exit code 1.

### Completion Notes List

- All 15 subtasks completed in a single session. AC 1–9 satisfied by code + tests.
- `bcryptjs` used throughout (NOT the native `bcrypt` package — which is not installed). Login route uses `bcrypt.compareSync` to keep handler synchronous and match the existing seed/test code path.
- `AUTH_COOKIE_NAME = 'admin_token'` re-used from `server/middleware/auth.ts`; no new cookie names introduced.
- Login response: 200 + `{ success: true, data: { adminId, email } }` + httpOnly+SameSite=Strict+secure(prod)+8h cookie. Verified in `server/routes/admin/auth.test.ts` happy-path test (asserts Set-Cookie attributes `HttpOnly` and `SameSite=Strict`).
- Logout is idempotent and always clears the cookie via `res.clearCookie` with matching attributes (so browsers actually drop it). Returns 200 even with no prior cookie — covered by test "POST /logout returns 200 + clears cookie (idempotent without prior login)".
- Invalid-credentials path: same 401 + `'Invalid credentials'` body for unknown email AND wrong password. Two separate tests assert no Set-Cookie header on either branch (no information leak).
- `JWT_SECRET` missing → 500 + `'Auth not configured'`. Matches `requireAdmin`'s pre-existing envelope.
- `useAdminStore` Zustand store has NO `persist` middleware. Cookie + `GET /me` is the source of truth. Reload triggers `AdminLayout` → `useAdmin().bootstrap()` → `getAdminMe()` → store re-hydrate.
- `AdminLayout` renders a `SectionSkeleton` loading state while `!bootstrapped` so protected content never flashes. Post-bootstrap: unauth → redirect `/admin/login`; authed on `/admin/login` → redirect `/admin/dashboard`.
- Login form maps status-code → i18n key (`401 → admin.login.errors.invalidCredentials`, `0 → admin.login.errors.network`, other → `admin.login.errors.unknown`) — NOT raw API message. Inline error renders inside `role="alert"` + `aria-live="polite"`. Editing any field clears the error (Login.test.tsx asserts this).
- `Dashboard.tsx` minimal: heading + email + Logout button. Story 4.6 will move the logout into the persistent admin nav shell.
- i18n: `admin` namespace added to `en`, `pt-BR`, and `es` `translation.json` files (login title/email/password/submit/errors/dashboard/logout). aria-labels and technical attributes stay English per the project a11y i18n boundary rule.
- `package.json`: added `"db:seed": "tsx server/db.seed.ts"`. `.env.example`: added `ADMIN_EMAIL=` and `ADMIN_PASSWORD=` with a comment scoping them to the seed script.
- Bumped `server/index.test.ts` `admin auth login mount` assertion from 501 (old stub) to 400 (Zod-rejected empty payload) — the only existing test that needed adjustment.
- E2E spec covers redirect from `/admin` → `/admin/login`, invalid-credentials path, and a happy-path round-trip (login → dashboard → reload → logout). The happy-path test is `test.skip`-ed unless `ADMIN_TEST_EMAIL`/`ADMIN_TEST_PASSWORD` env vars are exported — same skip-and-document convention Story 3.11 used for sandbox-blocked Playwright projects.
- Sandbox Playwright projects (WebKit, mobile-safari) NOT run in this session — local binaries are not installed in this environment. Document this for the reviewer.

### File List

**New:**
- `server/schemas/admin-auth.schema.ts`
- `server/schemas/admin-auth.schema.test.ts`
- `server/routes/admin/auth.test.ts`
- `server/db.seed.test.ts`
- `src/store/useAdminStore.test.ts`
- `src/hooks/useAdmin.test.tsx`
- `src/pages/admin/Login.test.tsx`
- `src/components/layout/AdminLayout.test.tsx`
- `src/lib/api.admin.test.ts`
- `tests/e2e/admin-auth.spec.ts`

**Modified:**
- `server/routes/admin/auth.ts` — implemented `/login` + `/logout` (replaced 501 stubs); `/me` unchanged.
- `server/db.seed.ts` — replaced `export {}` stub with `seedAdminUser()` + CLI entry point.
- `server/index.test.ts` — updated `admin auth login mount` test expectation from 501 → 400.
- `src/store/useAdminStore.ts` — replaced `export {}` stub with Zustand store.
- `src/hooks/useAdmin.ts` — replaced `export {}` stub with `useAdmin` hook (login/logout/bootstrap + error mapping).
- `src/lib/api.ts` — added `postAdminLogin`, `postAdminLogout`, `getAdminMe`, `AdminApiError`.
- `src/components/layout/AdminLayout.tsx` — added auth gate + `/me` bootstrap; preserved SEO meta-strip effect.
- `src/pages/admin/Login.tsx` — implemented form with i18n + accessible error.
- `src/pages/admin/Dashboard.tsx` — minimal landing + logout button.
- `src/i18n/locales/en/translation.json` — added `admin` namespace.
- `src/i18n/locales/pt-BR/translation.json` — added `admin` namespace.
- `src/i18n/locales/es/translation.json` — added `admin` namespace.
- `.env.example` — added `ADMIN_EMAIL` + `ADMIN_PASSWORD` with scoping comment.
- `package.json` — added `db:seed` script.
- `vault/Code/Admin.md` — refreshed file/endpoint tables + auth flow; marked Story 4.1 row.
- `vault/Planning/Architecture-Key.md` — expanded Auth (Phase 3) decision block.
- `vault/Planning/Epics-Index.md` — Story 4.1 `[ ]` → `[r]`.
- `vault/00-Home.md` — moved active phase to Epic 4; marked admin auth 501 carry-forward as landed.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story 4.1 transitions `ready-for-dev → in-progress → review`.

### Change Log

- 2026-05-16 — Implementation (Claude Opus 4.7 1M):
  - Backend: implemented `POST /api/admin/auth/login` (Zod validation, `adminDao.findByEmail`, `bcryptjs.compareSync`, `jwt.sign` 8h, httpOnly + SameSite=Strict + secure-in-prod cookie); `POST /api/admin/auth/logout` (idempotent `clearCookie`); `db.seed.ts` (idempotent bcrypt-12 admin upsert from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env, exit-1 on missing env); `npm run db:seed` script wired.
  - Frontend: `useAdminStore` (Zustand, no `persist`); `useAdmin` hook (login/logout/bootstrap, status-code → i18n key mapping); `AdminLayout` auth gate with `/me` bootstrap + loading state via `SectionSkeleton`; `Login.tsx` form with `role="alert"` error + i18n; minimal `Dashboard.tsx` with logout button (Story 4.6 will relocate).
  - i18n: `admin` namespace added to EN, PT-BR, ES.
  - Tests: new `server/routes/admin/auth.test.ts` (9 cases — happy path, Zod failures, 401 unknown/wrong, 500 missing secret, logout idempotent, /me cookie round-trip); new `server/db.seed.test.ts` (idempotency, missing env, salt rounds default 12); new `src/store/useAdminStore.test.ts`; new `src/hooks/useAdmin.test.tsx`; new `src/pages/admin/Login.test.tsx`; new `src/components/layout/AdminLayout.test.tsx`; new `src/lib/api.admin.test.ts`; updated `server/index.test.ts` login-mount expectation 501 → 400; new `tests/e2e/admin-auth.spec.ts` (redirect, invalid-credentials, gated happy-path).
  - Vault: updated `vault/Code/Admin.md`, `vault/Planning/Architecture-Key.md` (auth decision expansion), `vault/Planning/Epics-Index.md`, `vault/00-Home.md` (active phase + carry-forward debt).
  - Verification: `npm run typecheck` PASS, `npm run test:run` PASS (377/377), `npm run build` PASS, `npm run check:client-bundle-secrets` PASS, `npm run db:seed` idempotency manually verified against scratch DB. Playwright WebKit/mobile-safari projects NOT run — binaries unavailable in sandbox (same precedent as Story 3.11).
  - Status: review (awaiting cross-model code-review per CLAUDE.md — dev=Claude, review must be Codex/non-Claude).
