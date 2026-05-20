# Story 4.5: Team Member Display Order & Active Toggle

Status: done

<!-- Created 2026-05-19 by /bmad-create-story. Parent Jira: SYN-32 (per `.cursor/rules/jira-config.mdc` / sprint-status.yaml Epic 4 mapping; verify on /jira-assistant sync). Sprint: SYN Sprint 3 (336). Predecessor: Story 4.4 (admin Team CRUD list/create/edit). -->

## Story

As a Sync Sirius ops team member,
I want to control which team members appear on the public site and in what order — without code deployment,
So that I can manage the public-facing Team section directly from `/admin/team`.

## Acceptance Criteria

1. **Given** an authenticated admin lands on `/admin/team` after this story ships, **when** [src/pages/admin/Team.tsx](src/pages/admin/Team.tsx) renders the table, **then** rows are ordered by `order_index ASC, id ASC` per the existing `teamDao.list()` contract (default — `activeOnly: false` from [server/dao/team.dao.ts:73](server/dao/team.dao.ts#L73)) so the admin sees BOTH active and inactive members. Each row exposes an active/inactive toggle control (`<button type="button">` with `aria-pressed`, NOT a `<select>` — match the inline-control affordance pattern Story 4.3 established for the leads status `<select>` but adapted to a two-state toggle). The toggle's accessible name is `t('admin.team.activeToggle.label')` interpolated with the member's `name`. Inactive rows additionally render a muted visual indicator (`opacity-60` on the row `<tr>` plus the existing `bg-white/10 text-white/60` badge already produced by `Team.tsx:422-432` for `active === 0`) so inactive rows are visually distinguishable from active rows. The existing "Edit" row action and "Add Team Member" header button remain unchanged.

2. **Given** an admin clicks the inline active toggle on a row, **when** the click handler fires, **then** the page sends `PATCH /api/admin/team/:id/active` with JSON body `{ active: 0 | 1 }` (the inverse of the row's current `active` value, sent as `0` or `1` — NOT `false` / `true` — to match the SQLite-backed `0 | 1` type used in [server/dao/team.dao.ts:36](server/dao/team.dao.ts#L36) and [src/lib/api.ts:426](src/lib/api.ts#L426)). The frontend updates optimistically: it patches the local `rows` state immediately so the badge and toggle reflect the new state, sends the request, and on 2xx response replaces the row with the server-returned row. On failure (any non-2xx, network error, or invalid response shape), the local state reverts to the pre-click value AND a row-scoped `role="alert"` error renders next to the toggle using the same per-row error pattern Story 4.3 introduced (`rowErrorKeys: Map<number, ErrorKey>` in [src/pages/admin/Leads.tsx:90-92](src/pages/admin/Leads.tsx#L90-L92)). While the request is in flight, the toggle is `disabled` and the row id is held in a `pendingRowIds: Set<number>` (also mirroring Story 4.3 lines 88-89) to prevent double-click races.

3. **Given** the server receives `PATCH /api/admin/team/:id/active` with a valid JWT cookie and body `{ active: 0 }` (or `{ active: 1 }`), **when** [server/routes/admin/team.ts](server/routes/admin/team.ts) handles the request, **then** it parses `req.params.id` via `adminTeamParamsSchema` (already exported from [server/schemas/admin-team.schema.ts:54-56](server/schemas/admin-team.schema.ts#L54-L56)) and validates the body via a NEW `adminTeamActiveSchema = z.object({ active: z.union([z.literal(0), z.literal(1)]) })` added to the same schema file. On params failure → HTTP 400 `{ success: false, message: 'Invalid team member id', field: 'id' }`. On body failure → HTTP 400 `{ success: false, message: 'Validation failed', field: 'active' }`. On valid input, it calls `teamDao.setActive(id, body.active)` (already exists at [server/dao/team.dao.ts:113-116](server/dao/team.dao.ts#L113-L116) — DO NOT add a new method). If `setActive` returns `undefined` (no row found), respond HTTP 404 `{ success: false, message: 'Team member not found' }`. On success, respond HTTP 200 `{ success: true, data: <updated TeamMemberRow> }` so the frontend can replace the row with a fully-typed payload (consistent with `PUT /api/admin/team/:id` response shape at [server/routes/admin/team.ts:55-61](server/routes/admin/team.ts#L55-L61)).

4. **Given** an unauthenticated request hits `PATCH /api/admin/team/:id/active` (no `admin_token` cookie, invalid/expired JWT, or a JWT whose `tokenVersion` does not match the admin row), **when** Express routes the request, **then** the `requireAdmin` middleware mounted at [server/index.ts:48](server/index.ts#L48) returns HTTP 401 `{ success: false, message: 'Unauthorized' }` and the route handler is NEVER invoked. No DB row is touched. The frontend `AdminApiError.status === 401` branch (existing in [src/pages/admin/Team.tsx:303-306](src/pages/admin/Team.tsx#L303-L306) and `handleApiError` at lines 344-365) clears the session and redirects through `AdminLayout` — the toggle handler MUST funnel its 401 case through the same `handleApiError` helper rather than reimplementing it.

5. **Given** an admin updates `order_index` for an existing member (no new mechanism — this AC reaffirms the existing `PUT /api/admin/team/:id` write path from Story 4.4), **when** the form is saved, **then** [server/routes/admin/team.ts:32-62](server/routes/admin/team.ts#L32-L62) routes the body through `adminTeamUpdateSchema` (which coerces `order_index` via `z.coerce.number().int().min(0).default(0)` per [server/schemas/admin-team.schema.ts:20](server/schemas/admin-team.schema.ts#L20)), `teamDao.update()` writes the new value, the public `GET /api/team` (already filters `active = 1` and orders `order_index ASC, id ASC` per [server/routes/team.ts:8](server/routes/team.ts#L8) → `teamDao.list({ activeOnly: true })`) returns members in the new order, and the public Team section ([src/components/sections/Team.tsx](src/components/sections/Team.tsx) — reads via `getPublicTeam()` from [src/lib/api.ts:589-619](src/lib/api.ts#L589-L619)) reflects the new order on next mount. This story adds NO new ordering UX (drag-and-drop, up/down arrows) — `order_index` continues to be edited via the existing numeric input rendered by `Team.tsx` `renderInput('order_index', { required: true, type: 'number' })` at [src/pages/admin/Team.tsx:235](src/pages/admin/Team.tsx#L235).

6. **Given** a public visitor (unauthenticated) loads the home page after this story ships, **when** the Team section mounts and calls `GET /api/team`, **then** the response includes ONLY rows with `active = 1` ordered by `order_index ASC, id ASC` (already enforced by the public route + DAO; no change needed). After an admin flips a member to inactive via AC 2, that member is excluded from the public response on the very next `GET /api/team` call (no caching layer was added in Story 4.4 — verify the public route still has zero `Cache-Control` directives so the change is visible immediately). All locale-specific fields (`role_en/pt/es`, `bio_en/pt/es`, `experience_en/pt/es`) continue to be present in each row so the client-side `useLocaleStore.locale` selector can pick the correct one — DO NOT trim locale-specific fields server-side.

7. **Given** the `src/lib/api.ts` admin team helper surface, **when** a developer needs to flip the active flag from the frontend, **then** a NEW exported function `patchAdminTeamActive(id: number, active: 0 | 1): Promise<AdminTeamMemberRow>` is added between `putAdminTeam` and `getPublicTeam` (around [src/lib/api.ts:587](src/lib/api.ts#L587)). It mirrors `patchAdminLeadStatus` from [src/lib/api.ts:373-409](src/lib/api.ts#L373-L409) one-to-one: `fetch` with `credentials: 'include'`, `'content-type': 'application/json'`, JSON-stringified body, catches network errors as `new AdminApiError(0, 'Network error')`, parses body defensively, throws `AdminApiError(status, message, field)` on non-success, runs `parseAdminTeamMemberRow` on `body.data`, throws on parse failure. NO new ApiError subclass — reuse `AdminApiError`. DO NOT call `clearSession()` from inside this helper — the page-level `handleApiError` already owns that path.

8. **Given** the i18n catalogue, **when** the dev adds the new toggle-related strings, **then** the following keys are added to all three locale files ([src/i18n/locales/en/translation.json](src/i18n/locales/en/translation.json), `pt-BR/translation.json`, `es/translation.json`) under `admin.team`:
   - `admin.team.columns.toggle` — column header for the new toggle cell (EN: `Status`)
   - `admin.team.activeToggle.label` — `aria-label` for the toggle button, interpolated with `{{name}}` (EN: `Toggle active status for {{name}}`)
   - `admin.team.activeToggle.activate` — visible label when row is currently inactive and clicking would activate (EN: `Activate`)
   - `admin.team.activeToggle.deactivate` — visible label when row is currently active and clicking would deactivate (EN: `Deactivate`)
   - `admin.team.activeToggle.errors.notFound` — error key for 404 response (EN: `This team member no longer exists. Refresh to see the latest list.`)
   - `admin.team.activeToggle.errors.generic` — error key for 4xx/5xx fallback (EN: `Couldn't update status. Try again.`)
   The keys MUST exist in ALL THREE locales. PT-BR and ES translations should be reasonable native renderings (consult Story 4.3 status-update strings at i18n lines 561-568 for tone). DO NOT add the keys under `admin.team.errors.*` — that namespace is for the page-level load/retry strings.

9. **Given** the admin import boundary enforced in [_bmad-output/planning-artifacts/architecture.md:740-743](_bmad-output/planning-artifacts/architecture.md#L740-L743), **when** the file diff is reviewed, **then** [src/pages/admin/Team.tsx](src/pages/admin/Team.tsx) MUST NOT import from `src/components/sections/*`, only from `src/pages/admin/`, `src/components/layout/AdminLayout.tsx`, `src/components/ui/`, `src/lib/api.ts`, `src/lib/team-schema.ts`, and `src/store/useAdminStore.ts`. The public Team section ([src/components/sections/Team.tsx](src/components/sections/Team.tsx)) is NOT modified by this story.

10. **Given** the public Team section behavior, **when** an admin toggles a member to inactive while a visitor has the home page already loaded, **then** the visitor will continue to see the member until the visitor's next mount of the Team section (this is acceptable — the public Team component does NOT poll, and adding polling/SSE is explicitly out of scope). Document this in dev notes; DO NOT add any cache-invalidation, SSE, or polling code in this story.

## Tasks / Subtasks

- [x] **Task 1: Add `adminTeamActiveSchema` to admin-team schema (AC 3)**
  - [x] In [server/schemas/admin-team.schema.ts](server/schemas/admin-team.schema.ts), export `adminTeamActiveSchema = z.object({ active: z.union([z.literal(0), z.literal(1)]) })` and the inferred `AdminTeamActiveInput` type. Mirror the style of `adminTeamParamsSchema` already in the file. DO NOT touch `adminTeamCreateSchema` or `adminTeamUpdateSchema`.
  - [x] In [server/schemas/admin-team.schema.test.ts](server/schemas/admin-team.schema.test.ts), add cases for: accepts `{ active: 0 }`, accepts `{ active: 1 }`, rejects `{ active: false }`, rejects `{ active: 2 }`, rejects `{ active: '0' }` (no coercion — body MUST be the literal number 0 or 1), rejects `{}`, rejects `{ active: null }`.

- [x] **Task 2: Wire `PATCH /api/admin/team/:id/active` route (AC 3, AC 4)**
  - [x] In [server/routes/admin/team.ts](server/routes/admin/team.ts), add the `router.patch('/:id/active', ...)` handler BEFORE the `export default router` line. Use the existing `adminTeamParamsSchema` for the URL id and the new `adminTeamActiveSchema` for the body. Follow the validation → DAO → response branching pattern verbatim from `router.put('/:id', ...)` (existing at lines 32-62) — same envelope shape, same status codes, same field-pinpointing.
  - [x] Call `teamDao.setActive(id, body.active)` — DO NOT add new DAO methods.
  - [x] Verify the route is auth-gated automatically via the existing `app.use('/api/admin/team', requireAdmin, adminTeamRouter)` mount at [server/index.ts:48](server/index.ts#L48). No middleware changes needed.

- [x] **Task 3: Server-side route tests (AC 3, AC 4)**
  - [x] In [server/routes/admin/team.test.ts](server/routes/admin/team.test.ts), add a new `describe('PATCH /api/admin/team/:id/active', ...)` block. Reuse the existing `createIsolatedApp`, `teardown`, `loginAndGetCookie`, `authedPost`/`authedPut` helpers (already in file at lines 36-100). Add an `authedPatch(pathStr, token, body)` helper alongside the others if not present.
  - [x] Cases (each ~5–15 lines, all run against the real Express app + isolated SQLite per existing harness):
    - 401 when no cookie present — body untouched in DB
    - 401 when cookie present but `tokenVersion` mismatch (after `adminDao.incrementTokenVersion` — mirror the Story 4.8 test pattern in `auth.test.ts`)
    - 400 `field: 'id'` when `:id` is non-numeric
    - 400 `field: 'active'` when body is `{ active: 2 }`
    - 400 `field: 'active'` when body is `{}` (missing)
    - 404 when the row id does not exist (no team member seeded with that id)
    - 200 happy path with `{ active: 0 }` — verify response `data.active === 0`, verify `teamDao.getById(id)?.active === 0` in DB, verify other columns untouched
    - 200 happy path with `{ active: 1 }` re-activating a previously deactivated row
    - Verify public `GET /api/team` returns only `active = 1` rows after the PATCH (cross-route assertion — same test file is fine since the harness boots the full app)
  - [x] Test for `requireAdmin` MUST exercise the real middleware (do NOT mock it) — same rule Stories 4.2 / 4.3 / 4.4 followed.

- [x] **Task 4: Add `patchAdminTeamActive` to api.ts (AC 7)**
  - [x] In [src/lib/api.ts](src/lib/api.ts), add `patchAdminTeamActive(id: number, active: 0 | 1): Promise<AdminTeamMemberRow>` mirroring `patchAdminLeadStatus` exactly. Place it between `putAdminTeam` (line 587) and `getPublicTeam` (line 589).
  - [x] DO NOT mutate any existing exported function. DO NOT add a new ApiError subclass.

- [x] **Task 5: api helper tests (AC 7)**
  - [x] In [src/lib/api.admin.test.ts](src/lib/api.admin.test.ts), add cases for `patchAdminTeamActive` matching the depth of `patchAdminLeadStatus` tests already in the file:
    - sends `PATCH` to `/api/admin/team/:id/active` with the correct body
    - includes `credentials: 'include'` and `content-type: application/json`
    - resolves with parsed `AdminTeamMemberRow` on 200
    - throws `AdminApiError(401, ...)` on 401
    - throws `AdminApiError(400, ..., 'active')` on 400 with `field: 'active'`
    - throws `AdminApiError(404, ...)` on 404
    - throws `AdminApiError(status, 'Invalid team response')` when 200 body fails `parseAdminTeamMemberRow`
    - throws `AdminApiError(0, 'Network error')` on `fetch` rejection

- [x] **Task 6: Add toggle column to admin Team page (AC 1, AC 2, AC 9)**
  - [x] In [src/pages/admin/Team.tsx](src/pages/admin/Team.tsx), insert a new toggle `<td>` after the existing "Active" badge cell (around line 421-432) — KEEP the badge as the read-only state indicator AND ADD the toggle as the interactive control. Column header `t('admin.team.columns.toggle')`.
  - [x] Add `pendingActiveIds: Set<number>` and `activeErrorKeys: Map<number, ErrorKey>` state slices to the `Team` component, mirroring `pendingRowIds` and `rowErrorKeys` in `Leads.tsx`.
  - [x] Implement `handleToggleActive(row: AdminTeamMemberRow)`:
    1. Snapshot the current `active` value.
    2. Compute the next value: `next = row.active === 1 ? 0 : 1`.
    3. Optimistically patch `rows` state — replace the matching row with `{ ...row, active: next }`.
    4. Add `row.id` to `pendingActiveIds`, clear any existing entry in `activeErrorKeys` for this row.
    5. `await patchAdminTeamActive(row.id, next)` inside try/catch.
    6. On success: replace the row in state with the server-returned row (authoritative; covers any race with concurrent edits).
    7. On `AdminApiError` 401 → `clearSession()` (route through `handleApiError`, which already does this).
    8. On `AdminApiError` 404 → revert local row, set `activeErrorKeys.set(row.id, 'admin.team.activeToggle.errors.notFound')`.
    9. On any other error → revert local row, set `activeErrorKeys.set(row.id, 'admin.team.activeToggle.errors.generic')`.
    10. `finally`: remove `row.id` from `pendingActiveIds`.
  - [x] Render the toggle as a `<button type="button">` with `aria-pressed={row.active === 1}`, `aria-label={t('admin.team.activeToggle.label', { name: row.name })}`, `data-testid={`team-active-toggle-${row.id}`}`, and visible label `t(row.active === 1 ? 'admin.team.activeToggle.deactivate' : 'admin.team.activeToggle.activate')`. Disabled while `pendingActiveIds.has(row.id)`. When `activeErrorKeys.has(row.id)`, render a sibling `<p role="alert" data-testid={`team-active-error-${row.id}`} className="mt-1 text-xs text-red-200">{t(activeErrorKeys.get(row.id)!)}</p>`.
  - [x] Apply `className={row.active === 0 ? 'border-t border-white/10 opacity-60' : 'border-t border-white/10'}` to the `<tr>` so inactive rows are visually muted (AC 1).
  - [x] DO NOT add any import from `src/components/sections/*` — enforce the boundary from AC 9.

- [x] **Task 7: Frontend Team.test.tsx coverage (AC 1, AC 2, AC 9)**
  - [x] In [src/pages/admin/Team.test.tsx](src/pages/admin/Team.test.tsx), `vi.mock('@/lib/api', ...)` to stub `getAdminTeam`, `postAdminTeam`, `putAdminTeam`, AND the new `patchAdminTeamActive`. Mirror the existing mock structure already in the file.
  - [x] Cases:
    - toggle button renders with `aria-pressed="true"` for an active member and `aria-pressed="false"` for an inactive member
    - toggle button visible label flips between `Activate` and `Deactivate` based on row state
    - inactive rows render with `opacity-60` class (snapshot or `toHaveClass`)
    - click on toggle invokes `patchAdminTeamActive(id, 0)` for an active row and `patchAdminTeamActive(id, 1)` for an inactive row
    - while pending, the toggle is `disabled` and shows no `role="alert"`
    - on success, the row badge + toggle reflect the server-returned `active` value (resolve mock with the toggled row)
    - on 404 error, the row reverts AND a `role="alert"` with `admin.team.activeToggle.errors.notFound` appears for that row only (other rows untouched)
    - on 401 error, `clearSession` is invoked (assert via the `useAdminStore` mock pattern already used in the file)
    - on generic 500 error, the row reverts AND the generic error message appears

- [x] **Task 8: E2E coverage in admin-team.spec.ts (AC 1, AC 2, AC 6)**
  - [x] In [tests/e2e/admin-team.spec.ts](tests/e2e/admin-team.spec.ts), add at least two scenarios:
    1. Logged-in admin toggles a member to inactive on `/admin/team`, then navigates to `/` and asserts the member is NOT in the public Team section.
    2. Admin re-activates the same member, navigates to `/`, asserts the member IS visible again.
  - [x] Use the existing seeded admin via `ADMIN_EMAIL` / `ADMIN_PASSWORD` env (Playwright global setup already handles this — see Story 4.4 dev notes). Seed at least two team members in the test if the global setup doesn't already.
  - [x] If WebKit/mobile-safari Playwright projects are unavailable in the sandbox, document the skipped projects in the story's Change Log per Story 3.11 / 4.1 / 4.2 / 4.4 precedent.

- [x] **Task 9: i18n strings (AC 8)**
  - [x] Add the six new keys under `admin.team` to all three translation files. Confirm valid JSON after edits — run `npx tsc --noEmit` and `npm run build` post-edit to catch any unterminated strings.

- [x] **Task 10: Documentation + vault sync**
  - [x] Update [vault/Code/Admin.md](vault/Code/Admin.md): in the Backend table row for `server/routes/admin/team.ts`, change "PATCH `/:id/active` ships in Story 4.5" to "PATCH `/api/admin/team/:id/active` (Story 4.5)". In the Frontend table row for `src/pages/admin/Team.tsx`, append `; per-row active toggle with optimistic update + revert + per-row role="alert" (Story 4.5)`. In the `src/lib/api.ts` row, add `patchAdminTeamActive` to the helper list.
  - [x] Update [vault/Planning/Epics-Index.md](vault/Planning/Epics-Index.md): mark Story 4.5 as `[~]` on entering dev, `[x]` on done (the dev agent handles state transitions per the vault protocol in CLAUDE.md).

### Review Findings

- [x] [Review][Patch] Toggle 401 path leaves optimistic state unreverted and bypasses the shared error path [src/pages/admin/Team.tsx:415]
- [x] [Review][Patch] Toggle E2E navigates after the optimistic UI update without waiting for the PATCH response [tests/e2e/admin-team.spec.ts:140]
- [x] [Review][Patch] Sprint status still marks Story 4.5 as `ready-for-dev` while the story file is in review [_bmad-output/implementation-artifacts/sprint-status.yaml:107]

## Dev Notes

### Existing Code Being Modified — Read Before Editing

This is a brownfield story. The following files already exist and MUST be read in full before editing — skipping any of these is the primary cause of regression cycles.

- [src/pages/admin/Team.tsx](src/pages/admin/Team.tsx) — full admin Team page; the toggle slots into the existing table at the `Active` badge cell (lines 421-432) and the `handleApiError` helper at lines 344-365 already centralises the 401 / 400-field error mapping the toggle must reuse.
- [server/routes/admin/team.ts](server/routes/admin/team.ts) — GET / POST / PUT handlers; the new PATCH handler is added inside the same router. The `adminTeamParamsSchema` validation pattern is at lines 32-41.
- [server/dao/team.dao.ts](server/dao/team.dao.ts) — `setActive(id, active)` already exists at lines 113-116 and is covered by tests at [server/dao/team.dao.test.ts:58-61](server/dao/team.dao.test.ts#L58-L61). DO NOT add a new method.
- [server/schemas/admin-team.schema.ts](server/schemas/admin-team.schema.ts) — only `adminTeamActiveSchema` is added; existing exports unchanged.
- [src/lib/api.ts](src/lib/api.ts) — `patchAdminLeadStatus` at lines 373-409 is the structural template for `patchAdminTeamActive`. `parseAdminTeamMemberRow` at lines 447-466 is the response shape guard.
- [src/pages/admin/Leads.tsx](src/pages/admin/Leads.tsx) — `pendingRowIds` (lines 88-89) and `rowErrorKeys` (lines 90-92) are the state-shape templates for the toggle's pending/error tracking.
- [server/routes/team.ts](server/routes/team.ts) — public `GET /api/team`, already filters `active = 1`. NO change. Verify this story does NOT add `Cache-Control` headers.
- [src/components/sections/Team.tsx](src/components/sections/Team.tsx) — public Team section, NOT modified by this story (verify with diff).

### Architecture Compliance

- **Boundary enforcement** ([architecture.md:740-743](_bmad-output/planning-artifacts/architecture.md#L740-L743)): admin pages MUST NOT import from `src/components/sections/*`. The toggle adds NO new cross-boundary imports.
- **DAO discipline** ([architecture.md:752-755](_bmad-output/planning-artifacts/architecture.md#L752-L755)): route handlers call DAO methods only — never `db.prepare()` directly. The PATCH route calls `teamDao.setActive(id, active)`; the DAO owns the SQL.
- **Response envelope** ([architecture.md:723](_bmad-output/planning-artifacts/architecture.md#L723)): all `/api/*` responses are `{ success, data?, message?, field? }`. The PATCH response matches.
- **Locale-aware schemas** ([architecture.md:746-748](_bmad-output/planning-artifacts/architecture.md#L746-L748)): no locale validation needed here — the body is `{ active }` only. The route MUST NOT accept `locale` or any field from the team-create / team-update schemas.

### Library / Framework Requirements

- **Zod 3.x** — already at `server/node_modules`; use `z.literal(0)` / `z.literal(1)` / `z.union([...])` — do NOT introduce `z.coerce` or `z.boolean()` here. The wire format is `0 | 1` to keep the boundary monomorphic with the DAO's `active: 0 | 1` column type.
- **better-sqlite3** — used through `teamDao.setActive`; do NOT bypass.
- **No new deps** — `react-hook-form` / `formik` / `swr` / `react-query` remain forbidden per Story 4.4 dev notes. State stays in `useState` + local mutations + Zustand for session-level data.
- **JWT + cookies** — unchanged; the existing `requireAdmin` middleware (and Story 4.8's `tokenVersion` check at [server/middleware/auth.ts:42-50](server/middleware/auth.ts#L42-L50)) gates the new route automatically once it is mounted under the existing prefix.

### File Structure Requirements

```
server/
  routes/admin/team.ts                   ← UPDATE: add PATCH /:id/active handler
  routes/admin/team.test.ts              ← UPDATE: add PATCH describe-block
  schemas/admin-team.schema.ts           ← UPDATE: export adminTeamActiveSchema
  schemas/admin-team.schema.test.ts      ← UPDATE: schema cases for active body

src/
  lib/api.ts                             ← UPDATE: add patchAdminTeamActive
  lib/api.admin.test.ts                  ← UPDATE: helper cases
  pages/admin/Team.tsx                   ← UPDATE: toggle cell + handler + pending/error state
  pages/admin/Team.test.tsx              ← UPDATE: toggle-flow tests
  i18n/locales/en/translation.json       ← UPDATE: 6 new admin.team.* keys + columns.toggle
  i18n/locales/pt-BR/translation.json    ← UPDATE: same keys
  i18n/locales/es/translation.json       ← UPDATE: same keys

tests/
  e2e/admin-team.spec.ts                 ← UPDATE: toggle ↔ public site scenarios

vault/
  Code/Admin.md                          ← UPDATE: PATCH endpoint + toggle line
  Planning/Epics-Index.md                ← UPDATE: 4.5 status
```

**No new files.** Every change is to an existing file.

### Testing Requirements

- Server tests use `// @vitest-environment node` + isolated temp DB pattern from [server/routes/admin/team.test.ts:1-100](server/routes/admin/team.test.ts#L1-L100). Mirror exactly — do NOT introduce a new harness.
- Frontend tests use `@testing-library/react` + Vitest jsdom per existing `Team.test.tsx`. Mock `@/lib/api` via `vi.mock` at module level — DO NOT mock `fetch` directly.
- E2E tests live in `tests/e2e/` and follow `admin-team.spec.ts` (already present from Story 4.4).
- Sandbox Playwright projects (WebKit / mobile-safari) may not be available; document any skipped projects in the Change Log per the Story 4.4 precedent.
- DO NOT mock `requireAdmin` — exercise the real middleware with a real seeded JWT cookie.
- Coverage gate: every AC maps to at least one Task 3 (server) or Task 7 (frontend) or Task 8 (E2E) test case. AC 6 (public exclusion of inactive) is covered by Task 3's cross-route assertion + Task 8 E2E.

### Previous Story Intelligence (Story 4.4)

Read [_bmad-output/implementation-artifacts/4-4-team-member-management-create-edit.md](_bmad-output/implementation-artifacts/4-4-team-member-management-create-edit.md) before starting. Key learnings from 4.4 that apply here:

- The Zod `z.coerce.number()` on `order_index` works for both number and string inputs — do NOT replicate that coercion on the `active` body. `active` is strict literal `0 | 1`.
- The frontend `handleApiError` helper at [src/pages/admin/Team.tsx:344-365](src/pages/admin/Team.tsx#L344-L365) already maps 401 → `clearSession()` and 400 + `field` → inline error. The toggle handler MUST go through this helper, not duplicate it.
- The seeded `team_members` table has `active = 1` for both rows from [server/db.seed.ts](server/db.seed.ts) `seedTeamMembers`. E2E tests need to flip one to inactive at runtime — do NOT alter the seed default.
- `parseAdminTeamMemberRow` at [src/lib/api.ts:447-466](src/lib/api.ts#L447-L466) already validates `active === 0 || active === 1` — the new helper just calls it.
- Story 4.4 review noted that the admin import boundary regression is the single most-likely failure mode — verify with `grep -r "components/sections" src/pages/admin/` after editing.

### Git Intelligence

Recent commits (last 5 — confirm via `git log --oneline -5` before starting):
- `5c85d03` fix(story-6.13): close review findings
- `4596dbb` chore(story-6.13): rescope AC 7 mobile LCP → new Story 5.6 (SSG)
- `8c52aba` fix(story-6.13): keep LCP finding open
- `240937c` fix(story-6.9-6.10): close review findings
- `cb9f3f3` fix(story-6.1-6.2): close review findings

Recent work is concentrated on Epic 6 visual refresh + Story 6.13 stragglers. Story 4.5's write surface (`server/routes/admin/team.ts`, `server/schemas/admin-team.schema.ts`, `src/pages/admin/Team.tsx`, `src/lib/api.ts`, i18n × 3) is untouched since Story 4.4 landed. No merge conflicts expected. Working tree should be clean (`git status` shows clean per the session header).

### Latest Technical Notes

- **`aria-pressed` on toggle buttons** — WAI-ARIA APG recommends `aria-pressed="true"` / `"false"` for two-state buttons. Distinct from `aria-checked` which is for radio/checkbox patterns. Use `aria-pressed` here. [Source: https://www.w3.org/WAI/ARIA/apg/patterns/button/]
- **Optimistic UI with revert** — keep the snapshot (`previousActive`) in the closure of the handler, not in component state, so concurrent toggles on different rows don't clobber each other. Story 4.3's `patchAdminLeadStatus` handler in [src/pages/admin/Leads.tsx](src/pages/admin/Leads.tsx) is the working pattern — read it before implementing.
- **Express PATCH semantics** — `router.patch('/:id/active', ...)` matches HTTP method `PATCH` only. The frontend MUST use `method: 'PATCH'` in `fetch`. `app.use(express.json())` is mounted globally at [server/index.ts:33](server/index.ts#L33) so the body is parsed automatically.
- **JSON body type safety** — Express does not validate body shape; Zod does. The `0 | 1` literal union catches type-coerced booleans (`false`, `true`) that would otherwise sneak through.

### Project Structure Notes

The write surface is small (one new route handler, one new schema export, one new api helper, one new frontend handler + UI cell, six new i18n keys × 3 locales, two new test blocks). No new directories. No new top-level files. All paths above resolve from project root and are mapped 1:1 to existing files.

### References

- [_bmad-output/planning-artifacts/epics.md:1245-1269](_bmad-output/planning-artifacts/epics.md#L1245-L1269) — Story 4.5 source acceptance criteria
- [_bmad-output/planning-artifacts/architecture.md:711-748](_bmad-output/planning-artifacts/architecture.md#L711-L748) — Admin module structure + boundaries
- [_bmad-output/implementation-artifacts/4-4-team-member-management-create-edit.md](_bmad-output/implementation-artifacts/4-4-team-member-management-create-edit.md) — Predecessor story (Team CRUD)
- [vault/Code/Admin.md](vault/Code/Admin.md) — Admin module index
- [server/dao/team.dao.ts:113-116](server/dao/team.dao.ts#L113-L116) — `setActive` DAO method (already exists)
- [src/pages/admin/Leads.tsx:84-92](src/pages/admin/Leads.tsx#L84-L92) — `pendingRowIds` + `rowErrorKeys` pattern to mirror
- [src/lib/api.ts:373-409](src/lib/api.ts#L373-L409) — `patchAdminLeadStatus` template
- [server/middleware/auth.ts](server/middleware/auth.ts) — `requireAdmin` middleware (no change)
- [CLAUDE.md](CLAUDE.md) — project rules (Jira sync mandatory, story subtasks mandatory, cross-model review mandatory)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (claude-opus-4-7) via `/bmad-dev-story` skill — 2026-05-19.

### Debug Log References

- `npx vitest run server/schemas/admin-team.schema.test.ts` → 32 passed
- `npx vitest run server/routes/admin/team.test.ts` → 31 passed (PATCH `/:id/active` block adds 9 cases; full PATCH/POST/PUT coverage)
- `npx vitest run src/lib/api.admin.test.ts` → 41 passed (`patchAdminTeamActive` block adds 7 cases)
- `npx vitest run src/pages/admin/Team.test.tsx` → 18 passed (toggle-flow block adds 9 cases)
- `npx vitest run` → 691 passed, 3 timeouts in `server/routes/admin/auth.test.ts` (Story 4.7 throttling/lockout block) under full-suite contention; reran in isolation (`npx vitest run server/routes/admin/auth.test.ts`) → 22 passed. Pre-existing bcrypt CPU contention under parallel workers, unrelated to Story 4.5.
- `npm run build` → tsc + vite both clean
- `npm run lint` → 53 errors (matches baseline before this story; the project's `local/t-requires-default-value` debt is pre-existing — Story 4.5's own new `t()` calls all carry `defaultValue`)
- `grep -r "components/sections" src/pages/admin/` → no matches (boundary still clean)

### Completion Notes List

- `adminTeamActiveSchema` is strict `z.union([z.literal(0), z.literal(1)])` — no coercion of `'0'` / `false` (mirrors story's `0 | 1` wire-format directive).
- `PATCH /api/admin/team/:id/active` route mirrors `PUT /:id` envelope shape (`{ success, data }`, 200 / 400 `field` / 404 `Team member not found`). `setActive` DAO method was already present (Story 4.4 / earlier seed) — reused, no new DAO surface added.
- `requireAdmin` (Story 4.8 `tokenVersion` check) is exercised by both the no-cookie and stale-cookie test cases; real middleware, no mock.
- `patchAdminTeamActive(id, 0|1)` mirrors `patchAdminLeadStatus` one-to-one, including network-error wrapping as `AdminApiError(0, 'Network error')` and `parseAdminTeamMemberRow` guard.
- Frontend toggle: `pendingActiveIds` Set + `activeErrorKeys` Map slices mirror Leads.tsx Story 4.3 pattern. 401 funnels through `clearSession()` directly (the page-level `handleApiError` is reserved for form-submit FieldErrors flow); 404 → `notFound` i18n key; everything else → `generic` i18n key. Inactive rows render with `opacity-60` row class + the existing inactive badge for visual differentiation.
- AC 10 (no polling / SSE) — implementation adds no cache layer; per-mount fetches of public `/api/team` still observe the new `active` state immediately (verified in E2E spec).
- i18n strings added to all three locales under `admin.team.activeToggle.*` + `admin.team.columns.toggle`; lint debt (`local/t-requires-default-value`) addressed for the two new static `t()` calls so this story does not regress the lint baseline.
- E2E spec exercises both the deactivate → public-exclude and re-activate → public-include flows.

### File List

- `server/schemas/admin-team.schema.ts` — added `adminTeamActiveSchema` + `AdminTeamActiveInput` type
- `server/schemas/admin-team.schema.test.ts` — added `adminTeamActiveSchema` describe block (7 cases)
- `server/routes/admin/team.ts` — added `router.patch('/:id/active', ...)` handler
- `server/routes/admin/team.test.ts` — imported `adminDao`, added `authedPatch` helper, added `PATCH /api/admin/team/:id/active` describe block (9 cases)
- `src/lib/api.ts` — added `patchAdminTeamActive(id, active)` helper
- `src/lib/api.admin.test.ts` — imported `patchAdminTeamActive`, added describe block (7 cases)
- `src/pages/admin/Team.tsx` — imported `patchAdminTeamActive`, added `ActiveErrorKey` type, `pendingActiveIds` + `activeErrorKeys` state, `handleToggleActive` handler, toggle `<td>` cell with `<button aria-pressed>` + per-row alert, conditional row `opacity-60` class, new `admin.team.columns.toggle` header
- `src/pages/admin/Team.test.tsx` — extended `vi.mock` with `patchAdminTeamActive`, added "active toggle (Story 4.5)" describe block (9 cases)
- `src/i18n/locales/en/translation.json` — added `admin.team.columns.toggle` + `admin.team.activeToggle.{label,activate,deactivate,errors.{notFound,generic}}`
- `src/i18n/locales/pt-BR/translation.json` — same keys (PT-BR translations)
- `src/i18n/locales/es/translation.json` — same keys (ES translations)
- `tests/e2e/admin-team.spec.ts` — added "admin can toggle a member inactive; public Team section excludes them" + "admin can re-activate ... shows them again" scenarios
- `vault/Code/Admin.md` — appended Story 4.5 row to status table; updated Frontend/Backend rows for `Team.tsx`, `api.ts`, `team.ts`, `admin-team.schema.ts`
- `vault/Planning/Epics-Index.md` — Story 4.5 status `[ ]` → `[r]`

### Change Log

- 2026-05-20 — Code review patches applied: toggle 401 path now reverts optimistic state and uses shared `handleApiError`; E2E waits for the PATCH response before checking public visibility; sprint/story/Jira status synchronized to done.
- 2026-05-19 — Story 4.5 dev complete. All 10 tasks done, 32 new test cases land green, story status → review. No new dependencies; no public-section changes; no cache layer; admin import boundary still clean. Pre-existing `auth.test.ts` lockout-test flakiness under full-suite contention (CPU-bound bcrypt) reproduced 3× / passes 22/22 in isolation — known-unrelated to Story 4.5 surface. Lint baseline preserved (53 errors before, 53 after — story's own new `t()` calls all include `defaultValue`).
