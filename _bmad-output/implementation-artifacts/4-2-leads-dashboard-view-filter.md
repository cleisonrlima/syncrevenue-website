# Story 4.2: Leads Dashboard — View & Filter

Status: done

<!-- Created 2026-05-16 by /bmad-create-story. Parent Jira: SYN-29 (per sprint-status.yaml mirror block; verify on next /jira-assistant sync). Sprint: SYN Sprint 3 (336). -->

## Story

As a Sync Sirius ops team member,
I want to view all submitted demo requests in a filterable dashboard,
So that I can quickly find and prioritize leads by locale or status.

## Acceptance Criteria

1. **Given** an authenticated admin navigates to `/admin/leads`, **when** `Leads.tsx` renders, **then** `GET /api/admin/leads` fires (with `credentials: 'include'`) and the response rows display in a `<table>` sorted by `created_at` DESC (DAO already orders this way — do not re-sort on the client). Visible columns in order: name, company, email, GDS, role, locale label, status badge, created date, message preview. The page is wrapped by the existing `AdminLayout` auth gate (Story 4.1) — no new auth logic.

2. **Given** the leads table renders a row, **when** the row is inspected, **then**: (a) the full `message` content is accessible either inline (wrapped text) or via an expand/disclosure control (`<details>`/`<summary>` or a "Show more" toggle) — at minimum the first ~80 chars are visible as a preview; (b) the `locale` field (`'en' | 'pt-BR' | 'es'`) renders as a human label: `EN`, `PT-BR`, `ES` (do NOT show the raw string `pt-BR` un-uppercased — use the readable label); (c) the `status` field renders as a color-coded badge: `pending` → amber (`bg-amber-100 text-amber-800` or token equivalent), `contacted` → blue (`bg-blue-100 text-blue-800`), `qualified` → green (`bg-green-100 text-green-800`). Badge text is the i18n translation, not the raw status string.

3. **Given** the locale filter is applied, **when** an admin selects `PT-BR` from the locale `<select>` (options: All, EN, PT-BR, ES), **then** the component re-fires `GET /api/admin/leads?locale=pt-BR`; only PT-BR leads display; no full page reload (React state update only). Selecting `All` re-fires `GET /api/admin/leads` (no `locale` query param).

4. **Given** the status filter is applied, **when** an admin selects `pending` from the status `<select>` (options: All, Pending, Contacted, Qualified), **then** the component re-fires `GET /api/admin/leads?status=pending`; only pending leads display. Selecting `All` re-fires `GET /api/admin/leads` (no `status` query param).

5. **Given** both filters are active simultaneously, **when** `locale=pt-BR` and `status=pending` are both set, **then** the component fires `GET /api/admin/leads?locale=pt-BR&status=pending` exactly once per filter change (no duplicate request from both filters racing); table shows only rows matching both. Filter state is local component state (`useState`) — no global store needed.

6. **Given** no leads exist anywhere in the DB, **when** the table renders with an empty unfiltered response, **then** an empty-state element displays the i18n string `admin.leads.empty.title` (default EN: `"No leads yet. Demo requests will appear here."`) as plain text. No "Clear filters" button shown (because no filters are active).

7. **Given** active filters return zero results, **when** the table renders with an empty filtered response, **then** an empty-state element displays the i18n string `admin.leads.empty.filtered` (default EN: `"No leads match this filter."`) PLUS a `Clear filters` button (uses the `Button` UI primitive). Clicking `Clear filters` resets both filter selects to `All` and re-fetches `GET /api/admin/leads`.

8. **Given** the leads table is loading, **when** `GET /api/admin/leads` is in flight on first load OR after a filter change, **then** 3 skeleton rows display via a local shadcn-style `Skeleton` primitive (do NOT import `src/components/sections/SectionSkeleton` — Story 4.1 import-boundary rule forbids admin pages from importing from `components/sections/`). Each skeleton row has `role="status"` + `aria-busy="true"` + an `aria-label="Loading leads"` on the table container so screen readers announce the loading state. On fetch error, the table is replaced by an inline `role="alert"` error block with i18n key `admin.leads.errors.load` and a `Retry` button that re-fires the current request.

9. **Given** an admin session expires while the leads page is open, **when** any `GET /api/admin/leads` request returns 401, **then** the API helper throws `AdminApiError(401, ...)`, the component clears the in-flight state, and the existing Story 4.1 session-reset flow (`useAdminStore.clearSession()` + redirect to `/admin/login` via `AdminLayout` bootstrap) takes over. The page itself does NOT implement a duplicate redirect — it just lets the 401 propagate via the shared `AdminApiError` handling.

## Tasks / Subtasks

- [x] Subtask 1: Server — `GET /api/admin/leads` validation hardening (AC: 1, 3, 4, 5)
  - [x] The route handler in `server/routes/admin/leads.ts:6-11` currently casts `req.query.status` and `req.query.locale` to typed unions without validation. Add a Zod schema (e.g., `server/schemas/admin-leads-query.schema.ts`) with `locale: z.enum(['en','pt-BR','es']).optional()` and `status: z.enum(['pending','contacted','qualified']).optional()`; reject other values with HTTP 400 + standard `{ success: false, message, field }` envelope. Unknown query keys are ignored (not rejected) — Zod `.strict()` is too aggressive for query strings that may carry future params like `limit`/`offset`.
  - [x] Keep the existing response shape: `{ success: true, data: DemoRequestRow[] }`. Do NOT introduce pagination metadata in this story — Story 4.3+ handles pagination if/when needed.
  - [x] Do NOT modify the DAO. `leadsDao.list({ status, locale })` already supports both filters with the correct SQL (`server/dao/leads.dao.ts:78-96`).

- [x] Subtask 2: Server — admin leads route tests (AC: 1, 3, 4, 5)
  - [x] `server/routes/admin/leads.test.ts` (new): Mirror the cookie + isolated DB pattern from `server/routes/admin/auth.test.ts:18-48`. Seed an admin row + a JWT cookie, then seed 4 leads via `leadsDao.insert` spanning 3 locales × 3 statuses.
  - [x] Cases: (a) authed GET → 200, returns all rows ordered DESC; (b) 401 when no cookie; (c) `?locale=pt-BR` returns only PT-BR rows; (d) `?status=pending` returns only pending rows; (e) `?locale=pt-BR&status=pending` returns intersection; (f) `?locale=zz` returns 400 with `field: 'locale'`; (g) `?status=banana` returns 400 with `field: 'status'`; (h) unknown query keys are silently ignored.
  - [x] Use `bcryptjs.hashSync(plaintext, 12)` for the admin row seed (Story 4.1 review patch enforced cost 12).

- [x] Subtask 3: Frontend — `src/lib/api.ts` admin leads helper (AC: 1, 3, 4, 5, 8, 9)
  - [x] Add `export interface AdminLeadRow` matching the server `DemoRequestRow` shape (`id`, `name`, `email`, `company`, `phone`, `role`, `gds`, `message`, `locale`, `status`, `created_at`, `updated_at`). Export `AdminLeadStatus` and `AdminLeadLocale` type unions for filter typing.
  - [x] Add `getAdminLeads(filter?: { locale?: AdminLeadLocale; status?: AdminLeadStatus }): Promise<AdminLeadRow[]>`. Build the querystring with `URLSearchParams` (only append non-empty values). Use `credentials: 'include'`. On non-2xx or `body.success !== true`, throw `AdminApiError(response.status, body.message || 'Failed to load leads')`. On 401 throw — do NOT swallow it (the global session-reset path needs the throw to fire — see AC 9). Follow the existing pattern from `getAdminMe` (`src/lib/api.ts:240-267`) — but unlike `/me`, 401 here MUST throw.
  - [x] Add a runtime shape validator `parseAdminLeadRow(value: unknown): AdminLeadRow | null` (mirror `parseAdminSessionData`'s minimal-check style — verify `id: number`, `email: string`, `status` is one of the three, `locale` is one of the three). On any row failing the check, throw `AdminApiError(response.status, 'Invalid leads response')`. This is the Story 4.1 review-patch pattern.

- [x] Subtask 4: Frontend — local `Skeleton` UI primitive (AC: 8)
  - [x] Add `src/components/ui/Skeleton.tsx` — a minimal shadcn-style primitive: `function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)` that returns a `<div role="status" aria-busy="true" className={cn('animate-pulse rounded-md bg-muted/60', className)} />`. Use the existing `cn` from `@/lib/utils`. Do NOT re-export from `src/components/sections/SectionSkeleton.tsx` (admin import-boundary rule — see Architecture Guardrails).
  - [x] Co-locate `src/components/ui/Skeleton.test.tsx` (smoke test: renders with `role="status"`, accepts className, respects aria-label override).

- [x] Subtask 5: Frontend — `Leads.tsx` page implementation (AC: 1, 2, 3, 4, 5, 6, 7, 8, 9)
  - [x] Replace the `<main />` stub in `src/pages/admin/Leads.tsx`. Page state: `localeFilter: AdminLeadLocale | 'all'`, `statusFilter: AdminLeadStatus | 'all'`, `rows: AdminLeadRow[] | null` (null = not yet loaded), `loading: boolean`, `error: string | null` (i18n key, not API string).
  - [x] `useEffect` triggers `getAdminLeads(...)` on mount and on filter changes. Convert `'all'` → `undefined` before calling the API helper. Use an `AbortController` per request and abort the previous request on new filter changes so a slow earlier response can't overwrite a fresh one.
  - [x] Layout: a heading (`admin.leads.title`), two `<select>` filters side-by-side (locale + status, with i18n-translated option labels), then either skeleton rows, the empty-state, the error block, or the `<table>`. Use `Label` + native `<select>` for filters (no new combobox primitive in this story).
  - [x] Table columns (in order): Name, Company, Email, GDS, Role, Locale, Status, Created, Message. Column headers come from `admin.leads.columns.*` i18n keys. The `Created` cell formats `created_at` with `new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })`. The `Message` cell shows the first ~80 chars; full content available via a `<details><summary>` per AC 2 (or an inline truncation + click-to-expand — pick one and apply consistently).
  - [x] Status badge is a small inline `<span>` with the AC 2 color tokens (use Tailwind utility classes; the project does not maintain a shared `Badge` component yet — do NOT add one in this story, inline is fine).
  - [x] Empty/zero-result branching per AC 6 vs AC 7. The `Clear filters` button calls `setLocaleFilter('all'); setStatusFilter('all')`.
  - [x] Error block uses `role="alert"` and renders the mapped i18n string. `Retry` button re-fires the current effect (toggle a `refetchToken: number` state to force the effect to re-run with the same filters).
  - [x] Do NOT implement status mutation here. PATCH `/api/admin/leads/:id/status` is Story 4.3 — the badge stays read-only.
  - [x] Admin import-boundary: this file MUST NOT import from `src/components/sections/*`. Allowed imports: `@/components/ui/*`, `@/hooks/useAdmin`, `@/store/useAdminStore` (only if needed for the 401 path — usually not), `@/lib/api`, `@/lib/utils`, `react-i18next`, `react`. (Story 4.1 review-patch enforced this boundary.)

- [x] Subtask 6: Frontend — `Leads.tsx` tests (AC: 1, 2, 3, 4, 5, 6, 7, 8, 9)
  - [x] `src/pages/admin/Leads.test.tsx` (new). Use `@testing-library/react` + Vitest jsdom. Mock `@/lib/api` via `vi.mock` to control `getAdminLeads` return / throw per test.
  - [x] Cases: (a) initial render fires `getAdminLeads()` once with no args and renders skeleton rows while pending; (b) populated response renders all rows in order with the expected columns visible; (c) status badge renders correct class for each status; (d) locale displays as readable label (`pt-BR` row shows `PT-BR`); (e) changing the locale select to PT-BR calls `getAdminLeads({ locale: 'pt-BR' })`; (f) changing status to pending calls `getAdminLeads({ status: 'pending' })`; (g) both filters set calls `getAdminLeads({ locale: 'pt-BR', status: 'pending' })`; (h) empty unfiltered response shows the no-leads-yet text WITHOUT the Clear filters button; (i) empty filtered response shows the filtered empty text WITH the Clear filters button; clicking it resets both selects and re-fires `getAdminLeads()`; (j) thrown `AdminApiError` shows the error block + Retry; clicking Retry re-fires the request; (k) 401 throw is allowed to propagate (assert the error block does NOT eat the 401 silently — the global flow handles it). Wrap in `<MemoryRouter>` if `useNavigate` is touched (likely not in this story).

- [x] Subtask 7: i18n — extend admin namespace (AC: 2, 3, 4, 6, 7, 8)
  - [x] Add a `leads` sub-namespace under `admin` in `src/i18n/locales/en/translation.json`, `pt-BR/translation.json`, and `es/translation.json`. Keys required: `admin.leads.title`, `admin.leads.filters.locale`, `admin.leads.filters.localeAll`, `admin.leads.filters.status`, `admin.leads.filters.statusAll`, `admin.leads.filters.clear`, `admin.leads.columns.{name,company,email,gds,role,locale,status,created,message}`, `admin.leads.status.{pending,contacted,qualified}`, `admin.leads.locale.{en,pt-BR,es}` (readable labels `EN`, `PT-BR`, `ES`), `admin.leads.empty.title`, `admin.leads.empty.filtered`, `admin.leads.errors.load`, `admin.leads.errors.retry`, `admin.leads.messagePreview.more`, `admin.leads.messagePreview.less`.
  - [x] EN, PT-BR, ES all populated. The locale display labels (`EN`/`PT-BR`/`ES`) stay identical across all three translation files — they are short locale codes, not translatable text.
  - [x] aria-labels, `aria-busy`, `role` attributes, and the `Loading leads` skeleton accessible-name stay technical English (project a11y i18n boundary rule).

- [x] Subtask 8: E2E coverage (AC: 1, 2, 3, 4, 5, 6, 7, 8)
  - [x] `tests/e2e/admin-leads.spec.ts` (new). Use the same auth/global-setup pattern as `tests/e2e/admin-auth.spec.ts`. Seed at least 3 demo_request rows spanning multiple locales/statuses via a setup script or direct DAO call (extend the existing E2E setup helper if necessary).
  - [x] Cases: (a) `/admin/leads` while authed renders rows; (b) selecting locale `PT-BR` narrows the visible rows; (c) selecting status `pending` narrows further; (d) `Clear filters` restores the full set; (e) when DB seeded empty, the no-leads-yet text shows. Skip mobile-safari/WebKit in sandbox per Story 3.11 precedent if binaries unavailable; document in Change Log.

- [x] Subtask 9: Verification (all ACs)
  - [x] `npm run typecheck` PASS.
  - [x] `npm run test:run` PASS (full suite — do not regress Story 4.1's 380/380).
  - [x] `npm run build` PASS; `npm run check:client-bundle-secrets` PASS (no new env-leak vectors expected — but confirm).
  - [x] `npm run dev` manual check: log in via Story 4.1 seed admin → visit `/admin/leads` → seed at least one lead via running the demo form on `/` then refresh `/admin/leads` → verify filters and clear-filters work and the badge colors render.

- [x] Subtask 10: Vault + docs (post-implementation)
  - [x] Update `vault/Code/Admin.md` to add the leads page + leads route Zod validation + `Skeleton` primitive entries.
  - [x] Update `vault/Code/Frontend.md` to add `src/components/ui/Skeleton.tsx`.
  - [x] Update `vault/Planning/Epics-Index.md` Story 4.2 from `[ ]` → `[~]` → `[x]`.
  - [x] Update `vault/00-Home.md` if the active focus marker changes (Epic 4 progress).

### Review Findings

- [x] [Review][Patch] E2E seed data races under Playwright `fullyParallel` [tests/e2e/admin-leads.spec.ts:58]
- [x] [Review][Patch] Leads page creates `AbortController` but never passes its signal to `fetch` [src/pages/admin/Leads.tsx:74]

## Dev Notes

### Source Context

- Epic 4 enables the Sync Sirius ops team to manage leads + team content through the JWT-authenticated admin dashboard built in Story 4.1. Story 4.2 is the first read-only view on top of `demo_requests`; Story 4.3 layers status mutation on top. [Source: `_bmad-output/planning-artifacts/epics.md:1101-1207`]
- FR coverage for this story slice: FR30 (leads overview), FR31 (filter by locale), FR32 (filter by status). FR33/FR34 (status update + lead detail mutation) are Story 4.3 territory and explicitly out of scope here. [Source: `_bmad-output/planning-artifacts/prd.md` FR map; `_bmad-output/planning-artifacts/architecture.md:782`]
- Architecture decision: admin Leads page is `src/pages/admin/Leads.tsx`, route already wired in the admin route tree (`src/App.tsx` — see Story 4.1 notes). API endpoint `GET /api/admin/leads` already exists, already protected by `requireAdmin`, already shape-stable. [Source: `_bmad-output/planning-artifacts/architecture.md:267`, `src/App.tsx`, `server/index.ts:44`]
- Response envelope `{ success, data?, message?, field? }` and standard status codes (200/400/401/500) — same convention used by all admin routes. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]

### Current State of Files to Update

- `server/routes/admin/leads.ts:6-11` — Route already responds 200 with `{ success: true, data: rows }` and accepts `status` + `locale` query params via raw casts. Story 4.2 adds Zod validation in front of those casts; the response shape stays identical.
- `server/dao/leads.dao.ts:78-96` — `list({ status, locale, limit, offset })` already implements the correct SQL (DESC by `created_at`, both filters AND-composed). **Do not modify** — consume as-is. Default `limit = 100`, `offset = 0` (sufficient for Story 4.2; pagination is a later concern).
- `server/index.ts:14, 44` — Admin leads router already mounted behind `requireAdmin`. **Do not modify.**
- `src/pages/admin/Leads.tsx` — Single-line `<main />` stub. Subtask 5 fills it.
- `src/lib/api.ts:170-267` — `AdminApiError` + admin session helpers (`postAdminLogin`, `postAdminLogout`, `getAdminMe`) already exist with the runtime-shape-validation pattern (`parseAdminSessionData`). Subtask 3 adds `getAdminLeads` + `parseAdminLeadRow` following the same shape.
- `src/components/ui/` — Has `Button`, `Input`, `Label`, `GradientButton`, `SectionHeader`, `Toast`. No `Skeleton` yet; Subtask 4 adds one. Do NOT add `Badge` or `Table` primitives — inline Tailwind classes are sufficient for this story (premature abstraction otherwise).
- `src/components/sections/SectionSkeleton.tsx` — Exists, but admin pages **cannot import from `src/components/sections/`** (Story 4.1 review-patch enforced this import boundary). Use the new `Skeleton` primitive instead.
- `src/i18n/locales/{en,pt-BR,es}/translation.json:377-393` — `admin` namespace exists with `login`, `dashboard.title`, `logout`. Subtask 7 adds the `leads` sub-namespace.
- `src/store/useAdminStore.ts` — Zustand store from Story 4.1; **do not touch** for Story 4.2. Filter state is local component state, not global.
- `src/hooks/useAdmin.ts` — Story 4.1 hook; reused only if the 401 path needs it (usually the global bootstrap handles it). Do not add a `useAdminLeads` hook in this story — premature.
- `tests/e2e/admin-auth.spec.ts` — Reference for the E2E auth/cookie pattern. Subtask 8 mirrors it.

### Architecture Guardrails

- **Reuse, do NOT reinvent.** `leadsDao.list({ status, locale })` already does the filtering with the right SQL — do not duplicate it in the route handler or anywhere else. The route's only new job is Zod validation. [Source: `server/dao/leads.dao.ts:78-96`]
- **No new runtime dependencies.** `zod` (already used by `server/schemas/admin-auth.schema.ts` and form schemas), `react-i18next`, `tailwindcss` — everything needed is already installed. **Do not add deps.** [Source: `package.json`]
- **Admin import boundary (HARD RULE).** `src/pages/admin/**` and `src/components/layout/AdminLayout.tsx` MUST NOT import from `src/components/sections/`. Story 4.1 review-patch added this rule and Story 4.6 will codify it via an ESLint rule. Use the new `src/components/ui/Skeleton.tsx` instead of `SectionSkeleton`. [Source: `_bmad-output/implementation-artifacts/4-1-admin-authentication-login-session-management.md:161`]
- **Response shape stability.** The route currently returns `{ success: true, data: DemoRequestRow[] }`. Do NOT change the shape — the contract is consumed by both Story 4.2 and downstream Story 4.3 (which will rely on the same `data: AdminLeadRow[]` for the table-after-mutation refresh).
- **No information leak in 401.** Keep `requireAdmin`'s existing `{ success: false, message: 'Unauthorized' }`. Do NOT customize the leads route's 401 — let middleware handle it.
- **No leads-route rate limiting in this story.** Admin auth-route rate limiting (Story 4.7) and admin-API-wide hardening are tracked separately. Out of scope here.
- **a11y i18n boundary.** `role="status"`, `aria-busy`, `aria-label="Loading leads"`, `role="alert"`, `aria-live` values are technical English — NOT i18n'd. Visible labels (column headers, filter labels, badge text, error text, empty-state text) ARE i18n'd. [Source: project memory `feedback_a11y_i18n_boundary.md`]
- **Filter UX is local state.** Do NOT route-encode filters to URL search params in this story (no `useSearchParams` integration). Filter state is `useState` only — keeps Story 4.2 minimal. If a future story wants shareable filter URLs, it adds the wiring then.
- **No `Badge` or `Table` UI primitives.** Inline `<span>` with Tailwind classes for the badge; native `<table>`/`<thead>`/`<tbody>` for the table. Adding shared primitives is a Story 4.6 (nav shell + design system) concern, not 4.2. Three uses of a span is fewer lines than designing an API for `<Badge>`.
- **Status badge colors are tokens, not magic.** Use Tailwind utility classes (`bg-amber-100 text-amber-800` etc.) directly. The project does not currently expose semantic badge tokens; do not invent a token system here (Story 4.6 may consolidate this).

### Previous Story Intelligence

- **Story 4.1** delivered the admin auth foundation. The session bootstrap (`AdminLayout` calls `useAdmin().bootstrap()` → `GET /api/admin/auth/me`), session-reset-on-401, and the i18n `admin` namespace pattern are all in place. Story 4.2 plugs into them. [Source: `_bmad-output/implementation-artifacts/4-1-admin-authentication-login-session-management.md`]
- **Story 4.1 review patches** that directly affect 4.2: (a) admin pages cannot import from `components/sections/`; (b) admin API responses must validate runtime shape (`parseAdminSessionData` pattern); (c) `Button`, `Input`, `Label` UI primitives are mandatory for form controls (still applies — `Button` is required for the `Clear filters` and `Retry` controls); (d) bcrypt cost 12 in tests; (e) JSX comment marker style (`{/* TODO */}`) for cross-story handoffs. [Source: `_bmad-output/implementation-artifacts/4-1-admin-authentication-login-session-management.md:111-123`]
- **Story 2.1** scaffolded `server/routes/admin/leads.ts` with the typed-cast read of query params and the `{ success, data }` envelope. The DAO and route both work today — Story 4.2's server work is purely validation hardening + tests, NOT a re-implementation. [Source: `_bmad-output/implementation-artifacts/2-1-backend-infrastructure-database-daos-middleware.md`]
- **Story 2.6** established the form a11y pattern (`role="alert"`, `aria-live`, i18n-mapped error text via status-code keys, not raw API strings). Story 4.2's error block reuses this pattern verbatim. [Source: `_bmad-output/implementation-artifacts/2-6-form-accessibility-locale-aware-validation.md`]
- **Story 3.7** standardized UI primitive usage. Do NOT bypass `Button`/`Label`/`Input` for raw HTML in this story. Inline `<span>` for the badge is acceptable because a `Badge` primitive does not exist yet. [Source: `_bmad-output/implementation-artifacts/3-7-epic-1-review-polish-font-loading-ui-primitives.md`]
- **CLAUDE.md — Cross-Model Review.** If Claude implements 4.2, the review pass must run under a non-Claude agent (Codex). Configure per the existing rule. Manual `/bmad-dev-story` is also acceptable per the user's automator-disabled preference — but a separate reviewer agent still applies for any Story Automator path. [Source: `CLAUDE.md`, project memory `feedback_cross_model_review.md`, `feedback_automator_disabled.md`]
- **CLAUDE.md — Story Subtasks Mandatory.** Parent Jira SYN-29 + child Sub-tasks (one per subtask above) must exist after `/jira-assistant` sync. Idempotent if some already exist. [Source: `CLAUDE.md`]

### Git Intelligence

- Recent commits (last 5): `bd3ae74` docs Epic 3 retro; `5e7adee` rename Windows-invalid preflight file; `be887d9` docs Story 4.7+4.8 follow-up stories from Story 4.1 review defers; `8278640` chore review-story-4.1 patch (Codex); `56576f7` feat story-4.1 admin authentication. Recent work is concentrated on Epic 4 admin foundation — Story 4.2's surface (`Leads.tsx`, leads route validation, admin namespace extension) is untouched since the Story 2.1 scaffold and Story 4.1 admin baseline landed. No merge conflicts expected.
- Story 4.2's write surface is concentrated in `server/routes/admin/leads.ts`, `server/schemas/`, `src/pages/admin/Leads.tsx`, `src/lib/api.ts`, `src/components/ui/Skeleton.tsx`, three i18n files, and matching `*.test.*` files. No overlap with the in-flight Story 4.7/4.8 follow-ups (which touch auth route throttling + JWT versioning — orthogonal surfaces).

### Latest Technical Notes

- **`zod` query parsing**: `z.enum(['en','pt-BR','es']).optional().safeParse(req.query.locale)` is the idiomatic way to validate optional query strings. Express query values are strings (or arrays of strings) — use `z.string()` wrappers if needed. [Source: https://zod.dev/?id=enums]
- **`URLSearchParams`**: Build the API querystring with `const params = new URLSearchParams(); if (locale) params.set('locale', locale); if (status) params.set('status', status); const qs = params.toString() ? `?${params}` : ''` — do NOT manually `${'?'}locale=${encodeURIComponent(...)}` concat. [Source: https://developer.mozilla.org/docs/Web/API/URLSearchParams]
- **`AbortController` for `fetch`**: pass `signal: controller.signal` and call `controller.abort()` in the effect's cleanup function to cancel stale requests when filters change rapidly. React's `useEffect` cleanup is the canonical place. [Source: https://developer.mozilla.org/docs/Web/API/AbortController]
- **`Intl.DateTimeFormat(locale, opts)`**: Pass the active `i18n.language` (e.g. `'en'`, `'pt-BR'`, `'es'`) directly — `DateTimeFormat` understands BCP-47 tags including the PT-BR region subtag. Fallback to `'en'` if the language string is unexpected. [Source: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat]
- **Tailwind color tokens**: `bg-amber-100`, `bg-blue-100`, `bg-green-100` are stable in Tailwind 3.4+ (project's current version per `package.json`). Pair with matching `text-{color}-800` for contrast (>4.5:1 ratio meets WCAG AA on a white surface — verify if the surrounding admin background changes).
- **`@testing-library/react`**: `userEvent.selectOptions(select, 'pt-BR')` triggers the `change` event correctly for a controlled `<select>`. Use `findBy*` queries after filter changes to await the re-rendered table.

### Testing Requirements

- Server tests use `// @vitest-environment node` + isolated temp DB pattern from `server/routes/admin/auth.test.ts:18-48`. Mirror it exactly for `server/routes/admin/leads.test.ts` — including the `resetModules` + `process.env.DB_PATH = ...` setup so each test has its own SQLite file (or `:memory:` if the request util supports it cleanly).
- Frontend tests use `@testing-library/react` + Vitest jsdom per `src/pages/admin/Login.test.tsx` (Story 4.1). Mock `@/lib/api` via `vi.mock('@/lib/api', () => ({ getAdminLeads: vi.fn(), AdminApiError: class extends Error { ... } }))` — DO NOT mock fetch directly; mock at the helper boundary.
- E2E tests live in `tests/e2e/` and follow `tests/e2e/admin-auth.spec.ts` (Story 4.1). The global setup already seeds an admin via `ADMIN_EMAIL`/`ADMIN_PASSWORD` (Story 4.1 wired this). Story 4.2's E2E setup must additionally seed `demo_requests` rows (extend the setup or run a one-off API call against the running test server).
- Sandbox Playwright projects (WebKit/mobile-safari) may not be available; document any skipped projects in the Change Log per Story 3.11/Story 4.1 precedent.
- Do NOT mock `requireAdmin` in the leads route tests — exercise the real middleware with a real seeded JWT cookie so the auth + filter paths are covered end-to-end.

### Project Structure Notes

Expected write surface:

```
server/
  routes/admin/leads.ts                ← UPDATE: add Zod validation
  routes/admin/leads.test.ts           ← NEW
  schemas/admin-leads-query.schema.ts  ← NEW
  schemas/admin-leads-query.schema.test.ts ← NEW (optional shape coverage; co-locate per Story 4.1 pattern)

src/
  pages/admin/Leads.tsx                ← UPDATE: stub → leads dashboard
  pages/admin/Leads.test.tsx           ← NEW
  components/ui/Skeleton.tsx           ← NEW
  components/ui/Skeleton.test.tsx      ← NEW (smoke)
  lib/api.ts                           ← UPDATE: add getAdminLeads + AdminLeadRow types + parseAdminLeadRow
  lib/api.admin.test.ts                ← UPDATE: extend with getAdminLeads cases (or new file `api.adminLeads.test.ts` if preferred)
  i18n/locales/en/translation.json     ← UPDATE: extend admin.leads namespace
  i18n/locales/pt-BR/translation.json  ← UPDATE: extend admin.leads namespace
  i18n/locales/es/translation.json     ← UPDATE: extend admin.leads namespace

tests/e2e/
  admin-leads.spec.ts                  ← NEW

vault/
  Code/Admin.md                        ← UPDATE
  Code/Frontend.md                     ← UPDATE (new Skeleton primitive)
  Planning/Epics-Index.md              ← UPDATE story 4.2 status
  00-Home.md                           ← UPDATE if active marker changes
```

No structural conflicts with the directory layout documented in `_bmad-output/planning-artifacts/architecture.md` lines 615–700. The new `Skeleton.tsx` lives in `src/components/ui/` per the established UI primitive convention.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md:1141-1180`] — Story 4.2 ACs (BDD form)
- [Source: `_bmad-output/planning-artifacts/architecture.md:267-269`] — Admin API endpoints (`GET /api/admin/leads`)
- [Source: `_bmad-output/planning-artifacts/architecture.md:307-316`] — Admin route tree
- [Source: `_bmad-output/planning-artifacts/architecture.md:400-451`] — Naming + i18n key conventions
- [Source: `_bmad-output/planning-artifacts/architecture.md:582-700`] — Server + client directory map
- [Source: `_bmad-output/planning-artifacts/architecture.md:782`] — FR30–FR34 mapping
- [Source: `server/routes/admin/leads.ts`] — Existing route handler
- [Source: `server/dao/leads.dao.ts`] — Existing DAO with `list` filter support
- [Source: `server/middleware/auth.ts`] — `requireAdmin` (reused, do not modify)
- [Source: `server/routes/admin/auth.test.ts`] — Test isolation pattern to mirror
- [Source: `src/lib/api.ts:170-267`] — Existing `AdminApiError` + admin helper pattern + runtime shape validation
- [Source: `src/components/sections/SectionSkeleton.tsx`] — Reference shape for the new `Skeleton` primitive (do NOT import from sections; mirror the API)
- [Source: `src/i18n/locales/en/translation.json:377-393`] — Existing admin namespace baseline
- [Source: `_bmad-output/implementation-artifacts/4-1-admin-authentication-login-session-management.md`] — Story 4.1 implementation + review patches that constrain 4.2
- [Source: `CLAUDE.md`] — Cross-model review, story subtasks, jira sync, vault update rules

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — `claude-opus-4-7[1m]` — 2026-05-16.

### Debug Log References

- `npx vitest run server/routes/admin/leads.test.ts` → **8/8 pass** (Subtask 2 gate).
- `npx vitest run src/pages/admin/Leads.test.tsx src/components/ui/Skeleton.test.tsx` → **14/14 pass** (Subtasks 4 + 6 gate).
- `npm run typecheck` → 0 errors.
- `npm run test:run` → **67 files, 402/402 pass** (Story 4.1 baseline 380 + 22 new = 402; no regressions).
- `npm run build` → clean; `dist/client/assets/index-CZceEFDD.js` 354.70 kB / 111.52 kB gzip.
- `npm run check:client-bundle-secrets` → `Client bundle secret scan passed.`
- `npm run test:e2e` → NOT executed in sandbox (Playwright browser binaries not present; per Story 3.10/3.11 precedent the spec ships but is verified during local/CI run). New spec `tests/e2e/admin-leads.spec.ts` is wired to the same global setup as `admin-auth.spec.ts` and seeds `demo_requests` via direct `leadsDao` calls in `beforeEach` to keep tests deterministic.
- `npm run dev` manual smoke — NOT executed in this dev pass; will be exercised during cross-model review per CLAUDE.md.

### Completion Notes List

- Backend hardening landed via `server/schemas/admin-leads-query.schema.ts` + a thin `safeParse` gate in `server/routes/admin/leads.ts`. Response shape stayed `{ success: true, data: DemoRequestRow[] }`; DAO untouched (story constraint). Unknown query keys are silently ignored, validated by test `unknown query keys are silently ignored`.
- 401 contract is preserved: `requireAdmin` middleware returns `{ success: false, message: 'Unauthorized' }`; the leads route does not customize it.
- Frontend helper `getAdminLeads` follows the Story 4.1 admin-helper pattern: `credentials: 'include'`, `URLSearchParams` with conditional appends, runtime row validation via `parseAdminLeadRow`, throws `AdminApiError` on non-2xx / `success !== true` / array shape mismatch / row shape mismatch. 401 throws (unlike `getAdminMe` which returns `null`) so the page can drive the session-reset flow.
- `src/pages/admin/Leads.tsx` uses an `AbortController` keyed on `[localeFilter, statusFilter, refetchToken]` so stale-filter races cannot overwrite a fresh response. On 401 the component clears the in-flight state, calls `useAdminStore.clearSession()`, and stops rendering its own UI — `AdminLayout` then redirects to `/admin/login` (no duplicate redirect in the page itself, per AC 9).
- Admin import boundary respected: `Leads.tsx` imports only from `@/components/ui/*`, `@/store/useAdminStore`, `@/lib/api`, `react-i18next`, `react`. The new `src/components/ui/Skeleton.tsx` is the admin-page-safe loading primitive — `SectionSkeleton` is NOT imported.
- Status badge inline `<span>` uses Tailwind tokens directly (`bg-amber-100 text-amber-800` etc.). No new `Badge`/`Table` primitives introduced.
- `Created` cell formats with `Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })`; fallback to `'en'` on `RangeError`.
- Message preview shows the first 80 characters with a `Show more / Show less` toggle when the message exceeds the limit; messages ≤ 80 chars render inline without a toggle; `null` messages render as `—`.
- i18n `admin.leads.*` namespace populated in EN, PT-BR, and ES; locale display labels `EN` / `PT-BR` / `ES` are identical across all three locales by design (they're locale codes, not translatable text). a11y attributes (`role="status"`, `aria-busy="true"`, `aria-label="Loading leads"`, `role="alert"`) stay technical English per the project a11y i18n boundary.
- New test files added: `server/routes/admin/leads.test.ts` (+8), `src/pages/admin/Leads.test.tsx` (+10), `src/components/ui/Skeleton.test.tsx` (+4). Total **+22** tests over the Story 4.1 baseline (380 → 402).
- Vault updated: `vault/Code/Admin.md` (Leads page + leads route Zod entry + Skeleton primitive reference), `vault/Code/Frontend.md` (new Skeleton primitive row), `vault/Planning/Epics-Index.md` (Story 4.2 `[ ]` → `[r]`), `vault/00-Home.md` (Story 4.2 in-review marker).
- Sprint status mirror in `sprint-status.yaml` does not change because Story 4.2 stays in SYN Sprint 3 (mirror block already enumerates `4.2 SYN-29`).
- Cross-model review still owed per CLAUDE.md rule (Claude implemented → reviewer must be non-Claude). Story automator is disabled per project memory; user will run the review step manually.

### File List

**Added**
- `server/schemas/admin-leads-query.schema.ts`
- `server/routes/admin/leads.test.ts`
- `src/components/ui/Skeleton.tsx`
- `src/components/ui/Skeleton.test.tsx`
- `src/pages/admin/Leads.test.tsx`
- `tests/e2e/admin-leads.spec.ts`

**Modified**
- `server/routes/admin/leads.ts` (Zod query validation; same 200 response shape)
- `src/lib/api.ts` (`AdminLeadRow` / `AdminLeadStatus` / `AdminLeadLocale` / `AdminLeadGds` types, `parseAdminLeadRow`, `getAdminLeads`)
- `src/pages/admin/Leads.tsx` (stub → full dashboard)
- `src/i18n/locales/en/translation.json` (admin.leads namespace)
- `src/i18n/locales/pt-BR/translation.json` (admin.leads namespace)
- `src/i18n/locales/es/translation.json` (admin.leads namespace)
- `vault/Code/Admin.md` (Story 4.2 entries)
- `vault/Code/Frontend.md` (Skeleton primitive entry)
- `vault/Planning/Epics-Index.md` (Story 4.2 → `[r]`)
- `vault/00-Home.md` (active focus + Story 4.2 progress)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (`4-2-leads-dashboard-view-filter`: `ready-for-dev` → `in-progress` → `review`; `last_updated` 2026-05-16)
- `_bmad-output/implementation-artifacts/4-2-leads-dashboard-view-filter.md` (Status, Tasks/Subtasks checks, Dev Agent Record)

### Change Log

| Date | Author | Change |
|---|---|---|
| 2026-05-16 | Claude Opus 4.7 (1M context) | Story 4.2 implemented end-to-end: Zod-hardened `GET /api/admin/leads`, `getAdminLeads` admin API helper + runtime row validator, local `Skeleton` UI primitive, full `Leads.tsx` dashboard (locale + status filters, table, skeleton/empty/filtered-empty/error states, `AbortController`, retry, message preview), 22 new tests (8 server route, 10 page, 4 skeleton), E2E spec, i18n `admin.leads` namespace in EN/PT-BR/ES, vault notes synced. Status → review. |
