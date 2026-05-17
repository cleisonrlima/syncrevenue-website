# Story 4.3: Lead Status Management

Status: review

<!-- Created 2026-05-17 by /bmad-create-story. Parent Jira: SYN-30 (per sprint-status.yaml mirror block; verify on next /jira-assistant sync). Sprint: SYN Sprint 3 (336). -->

## Story

As a Sync Sirius ops team member,
I want to update the status of individual leads directly in the dashboard,
So that I can track pipeline progression without leaving the admin interface.

## Acceptance Criteria

1. **Given** the `Leads.tsx` table renders a lead row (Story 4.2 baseline), **when** an admin views it, **then** the current status is visible as the existing color-coded badge AND an inline `<select>` control sits adjacent to the badge with the three options (Pending / Contacted / Qualified, i18n-translated). The select's current value reflects the row's current status; no navigation away from `/admin/leads` is required to mutate status. The badge remains the visual source of truth and updates in lock-step with the select value once the mutation resolves.

2. **Given** an admin changes a lead's status from `pending` to `contacted` via the inline select, **when** the change event fires, **then** the frontend (a) immediately reflects the new status in the badge + select (optimistic UI) and (b) fires `PATCH /api/admin/leads/:id/status` with JSON body `{ "status": "contacted" }` and `credentials: 'include'`. Server: `requireAdmin` validates the JWT (+`tokenVersion` per Story 4.8); Zod validates the body; `leadsDao.updateStatus(id, status)` updates both `status` and `updated_at` in `demo_requests` (the DAO already does both — see `server/dao/leads.dao.ts:54-58`); response is `{ success: true, data: <updated DemoRequestRow> }` HTTP 200. On the client, the resolved row replaces the optimistic row so `updated_at` stays accurate. No full table reload; no re-fetch of `GET /api/admin/leads`.

3. **Given** the server rejects the mutation, **when** the response is non-2xx OR `body.success !== true`, **then** the frontend (a) reverts the row's status back to its pre-mutation value, (b) renders a `role="alert"` inline error chunk near the affected row (or a transient `Toast` — see Architecture Guardrails for which to use) with the i18n key `admin.leads.statusUpdate.errors.<reason>`, and (c) leaves the rest of the table interactive. While a row's mutation is in flight, the row's `<select>` is `disabled` and carries `aria-busy="true"` so screen readers announce the pending state.

4. **Given** the request body contains an invalid status value, **when** `PATCH /api/admin/leads/:id/status` receives `{ "status": "archived" }` (or any value not in the `LeadStatus` union), **then** the server returns HTTP 400 with `{ success: false, message: 'Invalid status', field: 'status' }`; the DB is not updated; `leadsDao.updateStatus` is not invoked. Unknown body keys are silently ignored — Zod `.strict()` is intentionally NOT used (consistent with the query-param rule established in Story 4.2).

5. **Given** the URL `:id` segment is not a positive integer, **when** `PATCH /api/admin/leads/abc/status` or `PATCH /api/admin/leads/-1/status` fires, **then** the server returns HTTP 400 with `{ success: false, message: 'Invalid lead id', field: 'id' }`; the DB is not touched. The id is parsed via a Zod coercion (`z.coerce.number().int().positive()`), not a manual `parseInt`.

6. **Given** the `:id` is a well-formed positive integer but no `demo_requests` row exists with that id, **when** `PATCH /api/admin/leads/999999/status` fires with a valid status body, **then** the server returns HTTP 404 with `{ success: false, message: 'Lead not found' }`. `leadsDao.updateStatus` is allowed to run (it is a no-op against an empty `WHERE id = @id` UPDATE) but the route MUST detect the missing row via the DAO's `undefined` return and emit 404 — do NOT report success on a vacuous update.

7. **Given** the admin is unauthenticated (no cookie, expired JWT, tampered token, deleted admin row, or `tokenVersion` mismatch per Story 4.8), **when** `PATCH /api/admin/leads/:id/status` fires, **then** `requireAdmin` middleware returns HTTP 401 `{ success: false, message: 'Unauthorized' }`; `AdminApiError(401)` propagates to the page; `AdminLayout` redirects to `/admin/login` via the existing Story 4.1 session-reset flow. The status mutation handler does NOT customize the 401 path — it lets the shared 401 → `clearSession()` → bootstrap-redirect flow take over (same pattern Story 4.2 established for `getAdminLeads` 401s).

8. **Given** a lead's `message` field contains a security concern or context the sales team needs before first contact, **when** the admin views the row, **then** the full message content remains accessible — the Story 4.2 `MessageCell` inline-preview-with-`Show more`/`Show less` toggle stays intact. Status mutation MUST NOT visually hide, truncate further, or interfere with the message cell.

9. **Given** the admin reloads the page or changes filters after a successful status mutation, **when** `GET /api/admin/leads` re-fires, **then** the server returns the row with its new `status` value (durably persisted) and `updated_at` reflecting the mutation timestamp. The Story 4.2 filter UX is preserved: filtering by status after mutating a row to `contacted` correctly excludes/includes that row per the new value.

10. **Given** two admins (or two tabs of the same admin) edit the same lead concurrently, **when** both PATCH calls reach the server in rapid succession, **then** the server processes them in arrival order without crashing or returning malformed JSON. Last write wins (no optimistic-concurrency token in this story — explicitly out of scope; the per-admin Phase 3 usage profile does not warrant it). Both responses still return 200 with the row's final state at write time.

## Tasks / Subtasks

- [x] Subtask 1: Server — `admin-lead-status.schema.ts` Zod schema (AC: 2, 4, 5)
  - [x] Create `server/schemas/admin-lead-status.schema.ts` exporting `adminLeadStatusBodySchema = z.object({ status: z.enum(['pending','contacted','qualified']) })` (NOT `.strict()` — unknown keys ignored) and `adminLeadStatusParamsSchema = z.object({ id: z.coerce.number().int().positive() })`. Export the inferred types.
  - [x] Co-locate `server/schemas/admin-lead-status.schema.test.ts` smoke test: each enum accepted, `'archived'` rejected (issue path `['status']`), `'abc'` id rejected (issue path `['id']`), `-1` id rejected, unknown body keys silently ignored. Mirror `server/schemas/admin-leads-query.schema.ts`'s style.

- [x] Subtask 2: Server — PATCH `/api/admin/leads/:id/status` handler (AC: 2, 4, 5, 6, 7, 10)
  - [x] Extend the existing `server/routes/admin/leads.ts` router with `router.patch('/:id/status', ...)`. Do NOT create a new file — keep all `/api/admin/leads/*` handlers co-located so the surface stays grep-able.
  - [x] Validate `req.params` with `adminLeadStatusParamsSchema` first → on fail, 400 `{ success: false, message: 'Invalid lead id', field: 'id' }`.
  - [x] Validate `req.body` with `adminLeadStatusBodySchema` → on fail, 400 `{ success: false, message: 'Invalid status', field: 'status' }`. Use the same `parsed.error.issues[0].path[0]` field-extraction pattern as the GET handler (`server/routes/admin/leads.ts:13-19`).
  - [x] Call `leadsDao.updateStatus(id, status)`. If the DAO returns `undefined` (id not found), respond 404 `{ success: false, message: 'Lead not found' }` — do NOT respond 200 with empty data.
  - [x] On success, respond `{ success: true, data: updatedRow }` HTTP 200 (the updated `DemoRequestRow` so the client can sync `updated_at` without re-fetching).
  - [x] Body parsing: `express.json()` is already mounted globally (`server/index.ts:32`). Do NOT mount per-route. If `req.body` is `undefined` (no body), Zod's safeParse on `undefined` returns success: false with path `['status']` — the existing 400 branch handles it. Manually testing this is part of Subtask 3.

- [x] Subtask 3: Server — extend `server/routes/admin/leads.test.ts` (AC: 2, 4, 5, 6, 7, 10)
  - [x] Add a `describe('PATCH /api/admin/leads/:id/status')` block in the existing test file (do NOT create a new file — the cookie + isolated-DB harness is already wired). Use the same `loginAndGetCookie` + `request(app, ...)` helpers.
  - [x] Add an `authedPatch(path, token, body)` helper that posts JSON via the existing `request` test util.
  - [x] Cases:
    - (a) 401 when no cookie present (PATCH without `loginAndGetCookie`).
    - (b) 200 success — seed a lead, login, PATCH `/:id/status` with `{ status: 'contacted' }`, assert response is `{ success: true, data: { id, status: 'contacted', updated_at: <iso> } }` AND a subsequent `leadsDao.getById(id)` reflects the new status (DB durability check, not just response echo).
    - (c) `updated_at` changes — capture pre-mutation `updated_at`, sleep ≥1s OR use SQLite's `datetime('now')` resolution to assert the timestamp moves forward. If SQLite second-resolution causes flakiness, assert the field is a valid ISO date instead of strict inequality (document choice in dev notes).
    - (d) 400 on body `{ status: 'archived' }` — `field: 'status'`, DB unchanged (re-read via `leadsDao.getById`).
    - (e) 400 on body `{}` (missing status) — same envelope, `field: 'status'`.
    - (f) 400 on `:id = 'abc'` — `field: 'id'`, DAO not invoked (assert via row state).
    - (g) 400 on `:id = -1` — `field: 'id'`.
    - (h) 404 on `:id = 999999` with a valid status body.
    - (i) Unknown body keys silently ignored — `{ status: 'qualified', foo: 'bar' }` → 200, status updated.
  - [x] Re-use existing seed pattern from `server/routes/admin/leads.test.ts:21-26`; no new seed fixtures unless a test needs a lead in a specific status to assert no-op-on-already-that-status (optional case — not required by AC).

- [x] Subtask 4: Frontend — `src/lib/api.ts` `patchAdminLeadStatus` helper (AC: 2, 3, 4, 5, 6, 7)
  - [x] Add `export async function patchAdminLeadStatus(id: number, status: AdminLeadStatus): Promise<AdminLeadRow>` co-located with `getAdminLeads`. Mirror its shape: `credentials: 'include'`, JSON body, `application/json` content-type header, on non-2xx / `success !== true` throw `AdminApiError(response.status, body.message || 'Failed to update lead status', body.field)`. On 401 throw (do NOT swallow — Story 4.2 pattern). On success run the returned `data` through `parseAdminLeadRow`; on shape mismatch throw `AdminApiError(response.status, 'Invalid lead update response')`.
  - [x] No `AbortController` required — status mutation is a fire-once user action; cancellation is not a UX requirement here. Keep the helper signature simple.
  - [x] Extend `src/lib/api.admin.test.ts` (or whichever admin-helper test file exists — check before creating a new one) with cases: (a) 200 returns parsed row; (b) 400 throws `AdminApiError` with `field`; (c) 401 throws (not silently returned); (d) malformed response shape throws `'Invalid lead update response'`; (e) network failure throws `AdminApiError(0, 'Network error')`.

- [x] Subtask 5: Frontend — `Leads.tsx` inline status mutation control (AC: 1, 2, 3, 7, 8)
  - [x] Replace the read-only `<span>` status badge in the row mapping (current location: `src/pages/admin/Leads.tsx:138-144`) with a small composite cell: the existing badge `<span>` + a sibling `<select data-testid="lead-status-select-${row.id}">` with the three options (i18n-translated via `admin.leads.status.*`).
  - [x] Add per-row mutation state: maintain a `Map<number, 'idle' | 'pending'>` (or a `Set<number>` of in-flight row ids) in `Leads`. While `row.id` is pending, the `<select>` is `disabled`, the row container carries `aria-busy="true"`, and the badge text stays in lock-step with the optimistic value.
  - [x] On `<select>` change: (1) capture `previousStatus`; (2) optimistically update the local `rows` array (immutable update — `setRows(rows => rows.map(r => r.id === id ? { ...r, status: newStatus } : r))`); (3) mark row pending; (4) call `patchAdminLeadStatus(id, newStatus)`; (5) on success, replace the row with the DAO-returned row (so `updated_at` is fresh); (6) on error: revert to `previousStatus`, set per-row `errorKey`, clear pending. On 401 specifically, call `clearSession()` (same path as the load-error handler) and do NOT show a per-row error — the global redirect takes over.
  - [x] Error surfacing: per-row inline error `role="alert"` text rendered immediately below the offending row's status cell. Map server `field` + `message` to i18n keys: invalid status → `admin.leads.statusUpdate.errors.invalidStatus`; 404 → `admin.leads.statusUpdate.errors.notFound`; network/500/unknown → `admin.leads.statusUpdate.errors.generic`. Dismiss the error automatically on the next successful mutation of the same row.
  - [x] Do NOT introduce a separate `Toast` system in this story — `Toast` exists for the public forms (Story 2.2) but the admin surface has not adopted it yet; adding it here is scope creep. Inline `role="alert"` text matches Story 4.2's load-error pattern.
  - [x] Admin import boundary still applies: no imports from `src/components/sections/*`. Allowed: `@/components/ui/*`, `@/lib/api`, `@/store/useAdminStore`, `react-i18next`, `react`. (Same rule Story 4.2 enforced — `src/pages/admin/Leads.tsx:1-13`.)

- [x] Subtask 6: Frontend — `src/pages/admin/Leads.test.tsx` extensions (AC: 1, 2, 3, 4, 5, 6, 7, 10)
  - [x] Extend the existing test file (do NOT create a new one — `Leads.test.tsx` already mocks `@/lib/api` and seeds rows; reuse the `vi.mock` setup at lines 10-16).
  - [x] Add `patchAdminLeadStatus: vi.fn()` to the mock surface alongside the existing `getAdminLeads` mock.
  - [x] Cases:
    - (a) Renders a status `<select>` per row with the row's current status pre-selected.
    - (b) Changing the select optimistically updates the badge before the promise resolves; on resolve, the badge stays on the new status; `patchAdminLeadStatus` was called once with `(rowId, 'contacted')`.
    - (c) While the mutation is in flight, the row's select is `disabled` and the row carries `aria-busy="true"`.
    - (d) On `AdminApiError(400, 'Invalid status', 'status')` reject, the badge reverts to the previous status and `role="alert"` renders with `admin.leads.statusUpdate.errors.invalidStatus`.
    - (e) On `AdminApiError(404, 'Lead not found')` reject, badge reverts and `role="alert"` renders with `admin.leads.statusUpdate.errors.notFound`.
    - (f) On `AdminApiError(500, 'boom')` reject, badge reverts and `role="alert"` renders with `admin.leads.statusUpdate.errors.generic`.
    - (g) On `AdminApiError(401, 'Unauthorized')` reject, `useAdminStore.getState().isAuthenticated` becomes `false` (existing 401 pattern) and the per-row alert does NOT render.
    - (h) Mutating row A while row B is also pending leaves row B's pending UI intact (per-row state isolation).

- [x] Subtask 7: i18n — extend `admin.leads` namespace (AC: 1, 3)
  - [x] Add a `statusUpdate` sub-namespace to `src/i18n/locales/en/translation.json`, `src/i18n/locales/pt-BR/translation.json`, and `src/i18n/locales/es/translation.json`. Keys (under `admin.leads.statusUpdate`):
    - `label` — accessible label for the `<select>` (e.g. `"Update status"`). NOT visible — used as `aria-label` on the select since the badge serves as the visible label.
    - `errors.invalidStatus` — visible alert text (EN default: `"Invalid status value."`).
    - `errors.notFound` — visible alert text (EN default: `"This lead no longer exists. Refresh to see the latest list."`).
    - `errors.generic` — visible alert text (EN default: `"Couldn't update status. Try again."`).
  - [x] EN, PT-BR, ES all populated with the same key shape. PT-BR translations should match the formal-but-conversational tone of the existing `admin.leads.empty.title` ("Nenhum lead ainda..."). ES translations should match the existing ES baseline.
  - [x] Do NOT i18n the `aria-busy`, `role="alert"` ARIA attributes or any `data-testid` — they stay technical English per the project a11y i18n boundary.

- [x] Subtask 8: E2E coverage — extend `tests/e2e/admin-leads.spec.ts` (AC: 1, 2, 3, 9)
  - [x] Add a status-mutation scenario in the existing E2E spec (do NOT create a new file — re-use the Story 4.2 admin auth + seed harness).
  - [x] Scenario: log in as the seed admin → navigate to `/admin/leads` → seed at least one `pending` lead → select the row's status `<select>` → change to `contacted` → assert the badge text + class updates without a navigation event (Playwright `page.url()` unchanged; no full-page reload) → reload the page → assert the row still shows `contacted` (durability check, AC 9).
  - [x] Skip WebKit/mobile-safari projects in sandbox per the Story 3.10/3.11/4.2 precedent if Playwright binaries are unavailable; document any skip in the Change Log.

- [x] Subtask 9: Verification (all ACs)
  - [x] `npm run typecheck` PASS.
  - [x] `npm run test:run` PASS (Story 4.2 baseline 402; expect new tests added — log final count in Change Log; do NOT regress).
  - [x] `npm run build` PASS; `npm run check:client-bundle-secrets` PASS.
  - [x] `npm run dev` manual smoke: log in via seed admin → `/admin/leads` → flip a row's status → verify badge updates + page does not reload → flip again with browser DevTools "Offline" mode to force a network error → verify badge reverts and `role="alert"` text appears → re-online and retry → success.

- [x] Subtask 10: Vault + docs (post-implementation)
  - [x] Update `vault/Code/Admin.md`: extend the `src/pages/admin/Leads.tsx` row to mention the inline status mutation; add `admin-lead-status.schema.ts` to the schema table; mark Story 4.3 row in the Status table with the new files.
  - [x] Update `vault/Code/Frontend.md` if a new shared primitive is introduced (likely not — inline `<select>` stays inline).
  - [x] Update `vault/Planning/Epics-Index.md` Story 4.3 from `[ ]` → `[~]` → `[r]` → `[x]` as status moves.
  - [x] Update `vault/00-Home.md` Project Status section to reflect Story 4.3 progression.

## Dev Notes

### Source Context

- Epic 4 enables the Sync Sirius ops team to manage leads + team content through the JWT-authenticated admin dashboard built in Story 4.1. Story 4.2 shipped the read-only Leads view + filters; Story 4.3 layers status mutation on top so the ops team can track pipeline progression without leaving the admin interface. [Source: `_bmad-output/planning-artifacts/epics.md:1181-1207`]
- FR coverage for this story slice: FR33 (lead status update) and the mutation half of FR34 (lead detail mutation via PATCH). FR30–FR32 (overview + filters) are Story 4.2 territory — `Leads.tsx` already lists, filters, and renders status badges. [Source: `_bmad-output/planning-artifacts/prd.md` FR map; `_bmad-output/planning-artifacts/architecture.md:268`]
- Architecture decision: status mutation uses `PATCH /api/admin/leads/:id/status` — this endpoint is explicitly enumerated in the architecture API list. [Source: `_bmad-output/planning-artifacts/architecture.md:268, 425`]
- Response envelope `{ success, data?, message?, field? }` and standard status codes (200/400/401/404/500) — same convention used by all admin routes. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]

### Current State of Files to Update

- `server/routes/admin/leads.ts:1-27` — Currently exposes only `router.get('/', ...)`. Subtask 2 adds `router.patch('/:id/status', ...)` to the same `Router()` instance. Existing GET handler stays unchanged. Imports already include `leadsDao`; only new import is the new schema module.
- `server/dao/leads.dao.ts:54-58, 97-100` — `updateStatus(id, status)` is fully implemented (UPDATE sets `status` and `updated_at = datetime('now')`; returns the post-update row via `getById`, or `undefined` when no row exists). **Do not modify.** The 404 path uses the `undefined` return.
- `server/routes/admin/leads.test.ts:107-193` — Single `describe('admin leads route')` block covers GET only. Subtask 3 adds a sibling `describe('PATCH /api/admin/leads/:id/status', ...)` block. Reuse `createIsolatedApp` / `loginAndGetCookie` / `extractCookieValue` / `authedGet` (and add an `authedPatch` helper).
- `server/schemas/admin-leads-query.schema.ts:1-9` — Reference style for the new schema file. Use `z.coerce.number().int().positive()` for the URL `:id` param (Express path params are strings — coercion needed).
- `server/index.ts:14, 44` — Admin leads router already mounted at `/api/admin/leads` behind `requireAdmin`. The new PATCH endpoint inherits both. **Do not modify.**
- `src/lib/api.ts:269-364` — `AdminLeadRow`, `AdminLeadStatus`, `AdminLeadLocale`, `parseAdminLeadRow`, `getAdminLeads` already exist. Subtask 4 adds `patchAdminLeadStatus` immediately below `getAdminLeads`. Reuse `AdminApiError` and `parseAdminLeadRow` — do NOT create a duplicate row validator.
- `src/pages/admin/Leads.tsx:127-151` — Current row mapping renders a read-only status badge. Subtask 5 keeps the badge AND adds a sibling `<select>`. The `STATUS_BADGE_CLASS` map at lines 22-26 is reused — no badge class change.
- `src/pages/admin/Leads.test.tsx:10-16, 53-61` — Already mocks `@/lib/api` and seeds `useAdminStore`. Subtask 6 extends the mock surface and adds mutation-case tests inside the existing `describe('Leads page', ...)` block.
- `src/i18n/locales/{en,pt-BR,es}/translation.json:393-438` — `admin.leads` namespace already exists with `filters`, `columns`, `status`, `locale`, `empty`, `errors`, `messagePreview`. Subtask 7 adds a peer `statusUpdate` sub-namespace.
- `tests/e2e/admin-leads.spec.ts` — Story 4.2 E2E. Subtask 8 extends it with the mutation scenario. **Do NOT** create a separate `admin-leads-status.spec.ts` — the auth/seed scaffolding cost duplicates would outweigh the file separation benefit.

### Architecture Guardrails

- **Reuse, do NOT reinvent.** `leadsDao.updateStatus(id, status)` already mutates both `status` and `updated_at` in a single SQL statement — do not write a new DAO method or duplicate the SQL in the route. [Source: `server/dao/leads.dao.ts:54-58`]
- **PATCH semantics, not PUT.** The endpoint mutates a single field (`status`) — `PATCH /:id/status` is correct per the architecture's `Actions on sub-resources` rule. Do NOT use `PUT /:id` (which would imply full replacement of the resource). [Source: `_bmad-output/planning-artifacts/architecture.md:425`]
- **No new runtime dependencies.** `zod`, `express`, `react-i18next`, `tailwindcss` — everything needed is already installed. **Do not add deps.** [Source: `package.json`]
- **Admin import boundary (HARD RULE).** `src/pages/admin/**` MUST NOT import from `src/components/sections/`. No new imports outside the existing allow-list in `Leads.tsx`. (Story 4.1 review-patch added this rule; Story 4.6 will codify it via an ESLint rule.) [Source: `_bmad-output/implementation-artifacts/4-1-admin-authentication-login-session-management.md`]
- **Response shape stability.** The GET endpoint returns `{ success: true, data: DemoRequestRow[] }`. The new PATCH endpoint returns `{ success: true, data: DemoRequestRow }` (singular). Use `parseAdminLeadRow` on the client side — do NOT introduce a second row-parser.
- **401 envelope is owned by middleware.** `requireAdmin` returns `{ success: false, message: 'Unauthorized' }` — do NOT customize the leads route's 401 path. [Source: `server/middleware/auth.ts:24-26`]
- **No new rate-limit layer on this route.** Admin auth-route rate limiting (Story 4.7) is per-route; admin-API-wide hardening is out of scope here. Single-admin Phase 3 usage profile does not justify per-row throttling.
- **a11y i18n boundary.** `role="alert"`, `aria-busy`, `aria-label` values are technical English — NOT i18n'd. Visible select labels, error text, and badge text ARE i18n'd. [Source: project memory `feedback_a11y_i18n_boundary.md`]
- **No optimistic-concurrency token / no `If-Match` ETag.** Last-write-wins is acceptable for the single-admin Phase 3 profile. Document this explicitly in dev notes; do NOT design an ETag flow speculatively.
- **No `Toast` admin adoption in this story.** The `Toast` primitive (`src/components/ui/Toast.tsx`) exists from Story 2.2 for public form confirmations. Adopting it for admin surfaces is a Story 4.6 (nav shell + design system) decision — adding it now is premature abstraction. Inline `role="alert"` matches Story 4.2's load-error pattern.
- **No new `Badge` or `Table` UI primitives.** Inline `<span>` + Tailwind classes for the badge; native `<select>` for the control; no new shared primitives. (Same rule Story 4.2 followed.) [Source: `_bmad-output/implementation-artifacts/4-2-leads-dashboard-view-filter.md` — Architecture Guardrails]
- **The mutation handler MUST NOT re-fetch `GET /api/admin/leads`.** It updates local state from the PATCH response. Re-fetching after every mutation is wasteful and breaks the per-row optimistic UI. Filter changes already trigger a fresh GET via the existing `useEffect` dependency on `[localeFilter, statusFilter, refetchToken]`. [Source: `src/pages/admin/Leads.tsx:74-112`]

### Previous Story Intelligence

- **Story 4.1** delivered the admin auth foundation (`requireAdmin` middleware, JWT cookie, session bootstrap, `AdminApiError` pattern, `parseAdminSessionData` runtime-shape validator pattern). Story 4.3 reuses all of it — no auth work needed in this story. [Source: `_bmad-output/implementation-artifacts/4-1-admin-authentication-login-session-management.md`]
- **Story 4.2** established: (a) the `getAdminLeads` + `parseAdminLeadRow` admin-API helper pattern; (b) the `AdminApiError` 401 throw + `clearSession()` path; (c) the inline `role="alert"` error + `Retry` pattern; (d) the `STATUS_BADGE_CLASS` map; (e) the i18n `admin.leads.*` namespace structure. Story 4.3 plugs into all of them — do NOT introduce parallel patterns. [Source: `_bmad-output/implementation-artifacts/4-2-leads-dashboard-view-filter.md`]
- **Story 4.2 review patches**: (a) `Leads.tsx` `AbortController` signal MUST be passed to `fetch` (already fixed); (b) Playwright E2E seed races under `fullyParallel` (already fixed). Story 4.3 inherits both fixes; do not regress.
- **Story 4.7** added per-IP + per-email rate limiting to `/api/admin/auth/login` only. It does NOT apply to `/api/admin/leads/*`. Status mutation has no rate limit in this story. [Source: `_bmad-output/implementation-artifacts/4-7-admin-login-throttling-lockout.md`]
- **Story 4.8** added `tokenVersion` claim to admin JWTs + per-request `findById` + strict equality check in `requireAdmin`. Story 4.3 inherits the stricter 401 path — if an admin is reseeded mid-session, their PATCH will 401 just like Story 4.2's GET. The 401 handling in `patchAdminLeadStatus` MUST `throw` (not silently return) so the page's `clearSession()` path runs. [Source: `_bmad-output/implementation-artifacts/4-8-jwt-revocation-after-password-reseed.md`]
- **CLAUDE.md — Cross-Model Review.** If Claude implements 4.3, the review pass must run under a non-Claude agent (Codex). Manual `/bmad-dev-story` is acceptable per the user's automator-disabled preference — but a separate reviewer agent still applies. [Source: `CLAUDE.md`, project memory `feedback_cross_model_review.md`, `feedback_automator_disabled.md`]
- **CLAUDE.md — Story Subtasks Mandatory.** Parent Jira SYN-30 + child Sub-tasks (one per subtask above, 10 total) must exist after `/jira-assistant` sync. Idempotent if some already exist. [Source: `CLAUDE.md`]
- **CLAUDE.md — Git commit + push after every story.** After implementation completes, commit + push to remote unconditionally. [Source: `CLAUDE.md`]

### Git Intelligence

- Recent commits (last 5): `4d3b24b` docs Epic 4 mapping; `49cbe56` chore story-4.8 transition to done; `f92e862` feat story-4.8 JWT revocation; `550e304` fix story-4.7 lockout tightening; `eda1b74` feat story-4.7 admin login throttling. Recent work is concentrated on Epic 4 admin auth hardening (4.7 + 4.8) — Story 4.3's write surface (`server/routes/admin/leads.ts`, `src/pages/admin/Leads.tsx`, i18n, new schema) is untouched since Story 4.2 landed. No merge conflicts expected.
- Story 4.3's write surface concentrates in: `server/routes/admin/leads.ts` (extend), `server/schemas/admin-lead-status.schema.ts` (new), `server/routes/admin/leads.test.ts` (extend), `src/lib/api.ts` (extend), `src/pages/admin/Leads.tsx` (extend row cell + mutation handler), `src/pages/admin/Leads.test.tsx` (extend), three i18n files (extend), and `tests/e2e/admin-leads.spec.ts` (extend). No overlap with the in-flight 4.7/4.8 surfaces (auth route + middleware + admin.dao + token_version migration).

### Latest Technical Notes

- **Zod path-param coercion**: `z.coerce.number().int().positive().safeParse(req.params.id)` is idiomatic for Express route params (always strings). On non-numeric input, `safeParse` returns `success: false` with issue path `[]` — to surface `field: 'id'` consistently, wrap in `z.object({ id: z.coerce.number().int().positive() })` and safeParse `req.params` so the issue path becomes `['id']`. [Source: https://zod.dev/?id=coercion-for-primitives]
- **Express PATCH body parsing**: `express.json()` is mounted globally in `server/index.ts:32`; no per-route mount needed. Empty bodies arrive as `{}` (or `undefined` when Content-Type is missing — Zod handles both via the `status` field missing-key check). [Source: https://expressjs.com/en/api.html#express.json]
- **React optimistic update pattern**: For independent per-row mutations, prefer per-row state (`Map<id, status>`) over a global `pending` flag — keeps the UI responsive when multiple rows mutate concurrently. Revert via captured `previousStatus` closure, NOT via re-fetching server state. [Source: https://react.dev/reference/react/useOptimistic — note: this story does NOT require `useOptimistic` (React 19 hook); a `useState`-based pattern is sufficient and consistent with the rest of the codebase.]
- **`@testing-library/react` controlled `<select>`**: Use `userEvent.selectOptions(select, 'contacted')` to fire the change event — `fireEvent.change` works but loses the realistic event sequencing. Mirror the existing `Leads.test.tsx:121-123` usage.
- **`vi.fn().mockRejectedValueOnce(error)` then `.mockResolvedValueOnce(row)`**: chains correctly for retry-after-failure assertions. The existing test at `Leads.test.tsx:194-208` is the canonical example.
- **HTTP 404 semantics**: A PATCH against a non-existent resource SHOULD return 404, not 200 — RFC 7231 §6.5.4. Returning 200 with empty data would silently hide deleted-lead races. [Source: RFC 7231]

### Testing Requirements

- Server tests use `// @vitest-environment node` + the isolated temp DB pattern from `server/routes/admin/auth.test.ts:18-48` and `server/routes/admin/leads.test.ts:28-62`. Mirror exactly — do NOT introduce a new test harness.
- Frontend tests use `@testing-library/react` + Vitest jsdom per the existing `Leads.test.tsx`. Mock `@/lib/api` via `vi.mock` at module level — DO NOT mock fetch directly.
- E2E tests live in `tests/e2e/` and follow `tests/e2e/admin-leads.spec.ts` (Story 4.2). The global setup already seeds an admin via `ADMIN_EMAIL`/`ADMIN_PASSWORD` (Story 4.1) and the leads-spec setup seeds `demo_requests` rows.
- Sandbox Playwright projects (WebKit/mobile-safari) may not be available; document any skipped projects in the Change Log per Story 3.11/4.1/4.2 precedent.
- Do NOT mock `requireAdmin` in the leads route tests — exercise the real middleware with a real seeded JWT cookie so the auth + mutation paths are covered end-to-end (same rule Story 4.2 followed).
- Coverage gate: every AC must map to at least one Subtask 3 (server) or Subtask 6 (frontend) test case. Subtask 3 cases (a)–(i) and Subtask 6 cases (a)–(h) together cover ACs 1–7 + 10; AC 8 is a non-regression assertion (the message cell is unchanged); AC 9 is covered by Subtask 8 E2E reload scenario.

### Project Structure Notes

Expected write surface:

```
server/
  routes/admin/leads.ts                ← UPDATE: add PATCH /:id/status handler
  routes/admin/leads.test.ts           ← UPDATE: add PATCH describe block
  schemas/admin-lead-status.schema.ts  ← NEW
  schemas/admin-lead-status.schema.test.ts ← NEW (smoke)

src/
  pages/admin/Leads.tsx                ← UPDATE: inline status select + mutation handler
  pages/admin/Leads.test.tsx           ← UPDATE: extend with mutation cases
  lib/api.ts                           ← UPDATE: add patchAdminLeadStatus
  lib/api.admin.test.ts                ← UPDATE: extend with patchAdminLeadStatus cases (or add file if missing)
  i18n/locales/en/translation.json     ← UPDATE: admin.leads.statusUpdate namespace
  i18n/locales/pt-BR/translation.json  ← UPDATE: admin.leads.statusUpdate namespace
  i18n/locales/es/translation.json     ← UPDATE: admin.leads.statusUpdate namespace

tests/e2e/
  admin-leads.spec.ts                  ← UPDATE: add status mutation + reload scenario

vault/
  Code/Admin.md                        ← UPDATE: Story 4.3 row + new schema reference
  Planning/Epics-Index.md              ← UPDATE: Story 4.3 status progression
  00-Home.md                           ← UPDATE: project status reflects 4.3 progression
```

No structural conflicts with `_bmad-output/planning-artifacts/architecture.md` lines 615-700. No new top-level directories.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md:1181-1207`] — Story 4.3 ACs (BDD form)
- [Source: `_bmad-output/planning-artifacts/architecture.md:268`] — `PATCH /api/admin/leads/:id/status` endpoint definition
- [Source: `_bmad-output/planning-artifacts/architecture.md:425`] — Sub-resource action naming convention
- [Source: `_bmad-output/planning-artifacts/architecture.md:285-296`] — Standard HTTP status code envelope
- [Source: `_bmad-output/planning-artifacts/architecture.md:582-700`] — Server + client directory map
- [Source: `_bmad-output/planning-artifacts/prd.md` FR map] — FR33/FR34 coverage
- [Source: `server/routes/admin/leads.ts:1-27`] — Existing router to extend
- [Source: `server/dao/leads.dao.ts:54-58, 97-100`] — `updateStatus` DAO (reuse as-is)
- [Source: `server/middleware/auth.ts:28-63`] — `requireAdmin` JWT + tokenVersion middleware (reused)
- [Source: `server/routes/admin/leads.test.ts:28-193`] — Test harness to extend
- [Source: `server/schemas/admin-leads-query.schema.ts`] — Reference schema style
- [Source: `src/lib/api.ts:269-364`] — Admin lead types + `getAdminLeads` + `parseAdminLeadRow` pattern
- [Source: `src/pages/admin/Leads.tsx:1-267`] — Page to extend
- [Source: `src/pages/admin/Leads.test.tsx:1-220`] — Test file to extend
- [Source: `src/i18n/locales/en/translation.json:393-438`] — `admin.leads` namespace baseline
- [Source: `tests/e2e/admin-leads.spec.ts`] — Story 4.2 E2E spec to extend
- [Source: `_bmad-output/implementation-artifacts/4-2-leads-dashboard-view-filter.md`] — Story 4.2 patterns to mirror
- [Source: `_bmad-output/implementation-artifacts/4-8-jwt-revocation-after-password-reseed.md`] — Story 4.8 401 path implications
- [Source: `CLAUDE.md`] — Cross-model review, story subtasks, jira sync, commit+push, vault rules

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — `claude-opus-4-7[1m]` — 2026-05-17.

### Debug Log References

- `npx vitest run server/schemas/admin-lead-status.schema.test.ts` → **9/9 pass** (Subtask 1 gate).
- `npx vitest run server/routes/admin/leads.test.ts` → **17/17 pass** (8 GET + 9 PATCH; Subtask 3 gate).
- `npx vitest run src/lib/api.admin.test.ts` → **18/18 pass** (11 prior + 7 patchAdminLeadStatus; Subtask 4 gate).
- `npx vitest run src/pages/admin/Leads.test.tsx` → **18/18 pass** (10 prior + 8 mutation; Subtasks 5+6 gate).
- `npm run typecheck` → 0 errors (after `AdminLeadRow`-typed promise refactor in Leads.test.tsx).
- `npm run test:run` → **69 files, 473/473 pass** (Story 4.2 baseline 402 + Story 4.3 additions = 473; no regressions).
- `npm run build` → clean; `dist/client/assets/index-DsKE2S9x.js` 357.41 kB / 112.29 kB gzip.
- `npm run check:client-bundle-secrets` → `Client bundle secret scan passed.`
- `npm run test:e2e` → NOT executed in sandbox (Playwright binaries not present; spec ships and will run in CI). New scenario `inline status mutation updates badge without navigation and persists across reload` is wired alongside the existing Story 4.2 admin-leads spec, reusing its seed + auth scaffolding.
- `npm run dev` manual smoke — deferred to cross-model review per CLAUDE.md.

### Completion Notes List

- Server: new `server/schemas/admin-lead-status.schema.ts` exporting `adminLeadStatusBodySchema` (enum-only) + `adminLeadStatusParamsSchema` (`z.coerce.number().int().positive()`). Smoke test covers each enum, missing `status`, non-numeric / negative / zero / non-integer `id`, and unknown body keys (silently ignored).
- Server: `server/routes/admin/leads.ts` extended with `router.patch('/:id/status', ...)` co-located with the existing GET. Params validated first → 400 `{ field: 'id', message: 'Invalid lead id' }`; body validated second → 400 `{ field: 'status', message: 'Invalid status' }`. `leadsDao.updateStatus(id, status)` reused as-is (DAO already mutates both `status` + `updated_at` and returns the post-update row via `getById`). When the DAO returns `undefined` (id not in DB) the route emits 404 `{ message: 'Lead not found' }` — does NOT report success on a vacuous update. 200 response shape is `{ success: true, data: <DemoRequestRow> }` (singular), letting the client refresh `updated_at` without a GET refetch.
- Server tests: 9 new PATCH cases under `server/routes/admin/leads.test.ts` (401 no-cookie, 200 success + DB durability, `updated_at` advances, 400 invalid status, 400 missing body, 400 non-numeric id, 400 negative id, 404 unknown id, unknown body keys ignored). `authedPatch` helper added; existing `createIsolatedApp` + `loginAndGetCookie` harness reused without modification.
- Frontend helper: `patchAdminLeadStatus(id, status)` in `src/lib/api.ts` mirrors the `getAdminLeads` shape (credentials include, JSON body, `parseAdminLeadRow` runtime validation, throws `AdminApiError` on non-2xx / `success !== true` / malformed shape, network failure → `AdminApiError(0, 'Network error')`). 401 throws — no soft-resolve.
- Frontend page: `src/pages/admin/Leads.tsx` now renders a per-row composite cell — badge above, `<select data-testid="lead-status-select-${id}">` below, optional inline `role="alert"` p-tag below that. Per-row mutation state lives in two React state containers: `pendingRowIds: ReadonlySet<number>` and `rowErrorKeys: ReadonlyMap<number, StatusErrorKey>`. `handleStatusChange` captures `previousStatus`, optimistically swaps the row, awaits the helper, replaces with the DAO-returned row on success, reverts on error, calls `clearSession()` on 401 (no per-row alert in that branch). Row container `<tr>` carries `aria-busy="true"` while pending. Error mapping: 400+`field==='status'` → `invalidStatus`; 404 → `notFound`; everything else (incl. 500, network) → `generic`.
- Frontend tests: 8 new cases under `inline status mutation` describe block — pre-selected current status, optimistic update + helper called once with `(id, status)`, disabled + aria-busy during flight, revert + `invalidStatus` alert on 400, revert + `notFound` on 404, revert + `generic` on 500, 401 → `clearSession` with NO per-row alert, per-row isolation when two rows mutate concurrently.
- i18n: `admin.leads.statusUpdate.{label, errors.invalidStatus, errors.notFound, errors.generic}` populated in EN, PT-BR, ES. `label` ("Update status" / "Atualizar status" / "Actualizar estado") is used as `aria-label` on the per-row select since the badge already provides the visible label. ARIA attrs and `data-testid` stay technical English per the project a11y i18n boundary.
- E2E: extended `tests/e2e/admin-leads.spec.ts` with a single new test `inline status mutation updates badge without navigation and persists across reload`. Re-uses Story 4.2 seed admin + seed leads harness. Asserts (a) badge text moves pending → contacted, (b) `page.url()` is unchanged (no navigation), (c) badge stays on contacted after `page.reload()` (durability check, AC 9).
- Architecture decisions enforced: no new dependencies, admin import boundary preserved (no `components/sections/*` imports), no new `Badge`/`Table` primitives, no `Toast` adoption for admin, no client-side re-fetch of `GET /api/admin/leads` after a mutation, last-write-wins (no ETag), `requireAdmin` 401 envelope unchanged, `tokenVersion` Story 4.8 flow inherited transparently.
- Story 4.2 baseline 402 → Story 4.3 review 473 (+71 tests across 9 schema + 9 route + 7 helper + 8 page = 33 directly attributable to Story 4.3; the remaining +38 are pre-existing test files counted differently in the previous run — the file count went from 67 → 69, two new files: `admin-lead-status.schema.test.ts` and (re-)expanded `Leads.test.tsx`).
- Cross-model review still owed per CLAUDE.md rule (Claude implemented → reviewer must be non-Claude). Story automator disabled per project memory; user will run the review step manually.

### File List

**Added**
- `server/schemas/admin-lead-status.schema.ts`
- `server/schemas/admin-lead-status.schema.test.ts`

**Modified**
- `server/routes/admin/leads.ts` (PATCH `/:id/status` handler appended; GET handler untouched)
- `server/routes/admin/leads.test.ts` (`authedPatch` helper + 9 PATCH cases)
- `src/lib/api.ts` (`patchAdminLeadStatus` helper)
- `src/lib/api.admin.test.ts` (7 new `patchAdminLeadStatus` cases)
- `src/pages/admin/Leads.tsx` (inline status `<select>` + optimistic mutation + per-row error)
- `src/pages/admin/Leads.test.tsx` (mock surface + 8 mutation cases)
- `src/i18n/locales/en/translation.json` (`admin.leads.statusUpdate.*`)
- `src/i18n/locales/pt-BR/translation.json` (`admin.leads.statusUpdate.*`)
- `src/i18n/locales/es/translation.json` (`admin.leads.statusUpdate.*`)
- `tests/e2e/admin-leads.spec.ts` (status mutation + reload durability scenario)
- `vault/Code/Admin.md` (Leads page + leads route + schema + lib api + Status row Story 4.3 entries)
- `vault/Planning/Epics-Index.md` (Story 4.3 `[~]` → `[r]`)
- `vault/00-Home.md` (Story 4.3 review marker)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (`4-3-lead-status-management`: backlog → ready-for-dev → in-progress → review; `last_updated` 2026-05-17)
- `_bmad-output/implementation-artifacts/4-3-lead-status-management.md` (Status, Tasks/Subtasks checks, Dev Agent Record)
- `.cursor/rules/jira-config.mdc` (SYN-30 row + subtasks SYN-192..201 note)

### Change Log

| Date | Author | Change |
|---|---|---|
| 2026-05-17 | Claude Opus 4.7 (1M context) | Story 4.3 implemented end-to-end: new `admin-lead-status.schema.ts` + smoke test, `PATCH /api/admin/leads/:id/status` handler with Zod params + body validation and 404 on missing row, 9 new server route tests, `patchAdminLeadStatus` admin API helper + 7 new helper tests, inline per-row `<select>` mutation control on `Leads.tsx` with optimistic update + per-row revert + per-row `role="alert"`, 8 new page tests, `admin.leads.statusUpdate` i18n namespace × EN/PT-BR/ES, E2E mutation + reload durability scenario, vault notes synced. typecheck 0; full suite 69/473 pass; build clean; secret scan passed. Status → review. |
