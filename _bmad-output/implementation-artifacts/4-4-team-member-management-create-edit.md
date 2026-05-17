# Story 4.4: Team Member Management — Create & Edit

Status: review

<!-- Created 2026-05-17 by /bmad-create-story. Parent Jira: SYN-31 (per `.cursor/rules/jira-config.mdc` Epic 4 mapping; verify on /jira-assistant sync). Sprint: SYN Sprint 3 (336). -->

## Story

As a Sync Sirius ops team member,
I want to add and edit team member profiles with bios in all three languages,
So that the public Team section reflects the current team without a code deployment.

## Acceptance Criteria

1. **Given** an authenticated admin navigates to `/admin/team`, **when** `src/pages/admin/Team.tsx` renders, **then** the page calls the existing `GET /api/admin/team` endpoint, awaits the response, and renders ALL `team_members` rows (active AND inactive — the admin sees the full inventory; the public surface is filtered separately) ordered by `order_index ASC, id ASC` per the DAO contract. Columns: name, role (EN), active status (read-only indicator in this story — the toggle ships in Story 4.5), display order (`order_index`), and an "Edit" row action. An "Add Team Member" button sits above the table. While the initial fetch is in flight, a `Skeleton` loading state renders (same primitive Story 4.2 introduced for Leads). On failure, an inline `role="alert"` block with a Retry button renders (mirror Story 4.2's `admin.leads.errors.load` pattern, scoped to the `admin.team` namespace).

2. **Given** an admin clicks "Add Team Member", **when** the create form mounts, **then** an in-page form (no modal, no separate route — keep DOM simple, same convention as the inline filter UX in Leads) renders fields in this order: `name` (text, required), `role_en` (text, required), `role_pt` (text, required), `role_es` (text, required), `bio_en` (textarea, required), `bio_pt` (textarea, required), `bio_es` (textarea, required), `linkedin` (URL, optional), `photo_url` (URL, optional), `order_index` (number, required, defaults to `0`). Labels sit above inputs; required fields show an asterisk; field-level errors render below the input on blur AND on submit (mirror `DemoForm.tsx` `handleBlur` / `validateAll` pattern — DO NOT introduce a new form abstraction; reuse `useState`-based local validation per existing Story 2.2 form patterns). All visible labels, placeholders, helper text, and error messages are i18n-keyed under `admin.team.form.*`.

3. **Given** an admin submits a valid new team member, **when** the form posts, **then** the frontend fires `POST /api/admin/team` with JSON body `{ name, role_en, role_pt, role_es, bio_en, bio_pt, bio_es, linkedin?, photo_url?, order_index }` and `credentials: 'include'`. Server: `requireAdmin` validates the JWT + `tokenVersion` (per Story 4.8); Zod (`adminTeamCreateSchema`) validates the body; `teamDao.create(input)` inserts into `team_members` and returns the row via `getById(lastInsertRowid)`; response is `{ success: true, data: <TeamMemberRow> }` HTTP **201**. The frontend prepends the new row into the local rows array (no full re-fetch — same client-state-pump pattern Story 4.3 used after PATCH) and closes the create form. The DAO's existing defaults are honored: `active` defaults to `1`, `linkedin` and `photo_url` default to `null` when omitted. [Source: `server/dao/team.dao.ts:55-90`]

4. **Given** an admin opens "Edit" on a row, **when** the edit form mounts, **then** it renders the same fields as the create form pre-populated with the row's current values (the row is read straight from local state — no extra `GET /api/admin/team/:id` round-trip). On submit, the frontend fires `PUT /api/admin/team/:id` with JSON body containing ALL editable fields (`name`, `role_en`, `role_pt`, `role_es`, `bio_en`, `bio_pt`, `bio_es`, `linkedin`, `photo_url`, `order_index`). Server: `requireAdmin` → Zod (`adminTeamUpdateSchema`) → `teamDao.update(id, patch)` → response `{ success: true, data: <TeamMemberRow> }` HTTP **200**. The frontend replaces the row in local state with the server's returned row and collapses the edit form. NOTE: the `active` flag is intentionally NOT part of the create/edit body in this story — Story 4.5 owns the active toggle via `PATCH /api/admin/team/:id/active`. If the body contains `active`, the schema silently strips it (unknown-key tolerance, same convention as Story 4.3's `adminLeadStatusBodySchema`).

5. **Given** the public `src/components/sections/Team.tsx` renders after this story lands, **when** the component mounts, **then** it fetches team data from a new **public** endpoint `GET /api/team` (no auth required; mounted at `/api/team` in `server/index.ts` — distinct from the auth-gated `/api/admin/team`). The server returns ONLY `active = 1` rows via `teamDao.list({ activeOnly: true })`, ordered by `order_index ASC, id ASC`. Response envelope: `{ success: true, data: TeamMemberPublicRow[] }`. The client picks the locale-specific `role` / `bio` based on `useLocaleStore.locale`: `en` → `role_en` / `bio_en`; `pt-BR` → `role_pt` / `bio_pt`; `es` → `role_es` / `bio_es`. The existing render shape (photo or initials placeholder, name, role, bio, optional LinkedIn link) is preserved — only the data source changes. `t('team.members')` is no longer consumed by `Team.tsx`; the i18n key STAYS in the locale JSON for now (Story 4.5/4.6 may prune it once the DB-backed flow is verified in staging).

6. **Given** `GET /api/team` returns zero rows (fresh DB, all members inactive, network race), **when** the public Team section renders, **then** it falls back to the existing render-nothing branch (`members.length > 0` guard at `src/components/sections/Team.tsx:80`) — no error state, no Skeleton flash on the public surface (the section just renders header + eyebrow + subtext with no grid). The intro copy (`SectionHeader`) always renders. Public surface NEVER shows a loading skeleton — that is admin UX only; public users see eventual content or nothing, never a half-rendered shell.

7. **Given** any required field (`name`, `role_en`, `role_pt`, `role_es`, `bio_en`, `bio_pt`, `bio_es`, `order_index`) is empty or whitespace-only on submit, **when** the admin clicks "Save", **then** the Zod schema rejects with field-keyed issues; the server returns HTTP 400 `{ success: false, message: 'Validation failed', field: <first-invalid-field-name> }`; the client maps each `issue.path[0]` to an inline error below the offending input and focuses the first invalid field. Whitespace-only strings fail validation via `z.string().trim().min(1)` — same convention as `demo.schema.ts`.

8. **Given** the admin provides a `linkedin` or `photo_url` value, **when** Zod parses the body, **then** both URLs are validated with `z.string().trim().url()`; an invalid URL returns HTTP 400 with `field: 'linkedin'` or `field: 'photo_url'`. An empty string is accepted and coerced to `null` (mirror `demo.schema.ts:10,13`'s `.or(z.literal('')).transform(v => v ? v : undefined)` pattern). `order_index` must be a non-negative integer (`z.coerce.number().int().min(0)`); negative or non-integer values return 400.

9. **Given** an unauthenticated request hits `POST /api/admin/team` or `PUT /api/admin/team/:id` (no cookie, expired JWT, tampered token, deleted admin row, `tokenVersion` mismatch per Story 4.8), **when** the request fires, **then** `requireAdmin` middleware returns HTTP 401 `{ success: false, message: 'Unauthorized' }`. The route handler is never invoked. The client throws `AdminApiError(401)` → `AdminLayout`'s session-bootstrap path takes over (same 401 flow Story 4.2/4.3 established — call `clearSession()` and let the layout redirect to `/admin/login`).

10. **Given** `PUT /api/admin/team/:id` is called with an `:id` that does not exist OR is not a positive integer, **when** the request reaches the handler, **then**: (a) invalid id → HTTP 400 `{ success: false, message: 'Invalid team member id', field: 'id' }` via `z.coerce.number().int().positive()` on `req.params.id`; (b) non-existent id → HTTP 404 `{ success: false, message: 'Team member not found' }`. The DAO's `update` returns the row from `getById(id)` after the UPDATE; a `undefined` return indicates the id is not in the table — the route MUST detect this and emit 404 (do NOT report 200 on a vacuous UPDATE — same rule Story 4.3 enforced for the leads PATCH).

11. **Given** the existing public Team section was previously driven by `t('team.members')` and the DB table starts empty on a fresh checkout, **when** `npm run db:seed` runs, **then** `server/db.seed.ts` ALSO seeds the `team_members` table IF AND ONLY IF the table is empty — populating two default rows mirroring the current EN/PT/ES content from `src/i18n/locales/{en,pt-BR,es}/translation.json#team.members` so a freshly cloned repo + seeded DB still shows the public team grid without manual admin work. The seed is idempotent: re-running `npm run db:seed` against an already-seeded `team_members` table is a no-op (counted via `SELECT COUNT(*) FROM team_members`). Exported helper `seedTeamMembers({ dao? })` follows the `seedAdminUser` shape so tests can inject an in-memory DAO. CLI run logs `team members seeded: <n>` or `team members already seeded (n=<count>)`.

12. **Given** the `<select>` / inline-form admin pattern from Story 4.3 set the visual conventions, **when** the new form renders, **then**: inputs use the existing `.rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white` Tailwind class set (mirror Leads filters at `src/pages/admin/Leads.tsx:281-320`); the textarea uses `min-h-[6rem]`; the Save button reuses `<Button>` from `@/components/ui/Button` (NO new admin button primitive); per-form error envelope reuses inline `role="alert"` text. NO `Toast` adoption (same rule Story 4.3 followed — Toast remains public-form-only until Story 4.6 design-system decision).

## Tasks / Subtasks

- [x] Subtask 1: Server — `admin-team.schema.ts` Zod schemas (AC: 3, 4, 7, 8, 10)
  - [x] Create `server/schemas/admin-team.schema.ts` exporting `adminTeamCreateSchema`, `adminTeamUpdateSchema`, `adminTeamParamsSchema` + inferred types.
  - [x] Co-locate `server/schemas/admin-team.schema.test.ts` — 22/22 pass.

- [x] Subtask 2: Server — extend `server/routes/admin/team.ts` with POST + PUT handlers (AC: 1, 3, 4, 7, 8, 9, 10)
  - [ ] Extend the existing `Router()` with `router.post('/', ...)` and `router.put('/:id', ...)`. Do NOT create a new router file — keep all `/api/admin/team/*` handlers in one place (same grep-ability rule Story 4.3 followed for leads).
  - [ ] `POST /`: body-validate with `adminTeamCreateSchema` → on fail 400 with `field: <first-invalid-field>`; on success call `teamDao.create(parsed.data)` → respond `{ success: true, data: row }` HTTP **201** (NOT 200 — `Location` header optional but the 201 is per the architecture's REST convention).
  - [ ] `PUT /:id`: validate `req.params` with `adminTeamParamsSchema` first → 400 `field: 'id'`; then body-validate with `adminTeamUpdateSchema` → 400 `field: <first-invalid-field>`; call `teamDao.update(id, parsed.data)` → if returns `undefined`, respond 404 `{ message: 'Team member not found' }`; on success respond `{ success: true, data: row }` HTTP 200.
  - [ ] Body parsing already global (`express.json()` at `server/index.ts:32`); no per-route mount.
  - [ ] Existing GET `/` handler (line 6) stays unchanged.

- [x] Subtask 3: Server — public `GET /api/team` endpoint (AC: 5, 6)
  - [ ] Create `server/routes/team.ts` (public, NO `requireAdmin`) exporting an Express `Router` with `router.get('/', ...)` → `teamDao.list({ activeOnly: true })` → respond `{ success: true, data: rows }` HTTP 200. NO query params; NO filters; NO pagination (single-page public render).
  - [ ] Mount in `server/index.ts` at `app.use('/api/team', teamRouter)` — BEFORE the `'/api'` 404 fallback (line 48) and BEFORE the admin mounts (cosmetic ordering — public routes group first).
  - [ ] The response row shape MUST match the existing `TeamMemberRow` (no field renames, no field omissions, no PII concerns — `team_members` rows are intended for public display; there is no sensitive column). Document this in the route file with a one-line comment: "Public surface: all columns are display fields; no PII filtering needed."

- [x] Subtask 4: Server — `server/routes/admin/team.test.ts` (NEW) + `server/routes/team.test.ts` (NEW) (AC: 3, 4, 7, 8, 9, 10, 5, 6)
  - [ ] Create `server/routes/admin/team.test.ts` mirroring the `server/routes/admin/leads.test.ts` harness: `createIsolatedApp()` (in-memory SQLite + real `requireAdmin` middleware), `loginAndGetCookie(app)`, `authedPost(app, path, cookie, body)`, `authedPut(app, path, cookie, body)`. DO NOT mock `requireAdmin` — exercise the full auth chain like Stories 4.2/4.3.
  - [ ] POST cases: (a) 401 no-cookie; (b) 201 success with full body, response is `{ success: true, data: { id, name, role_en, …, active: 1 } }` + DB durability via `teamDao.getById`; (c) 400 missing `name` → `field: 'name'`; (d) 400 missing each required role/bio (parameterized); (e) 400 invalid `linkedin` URL → `field: 'linkedin'`; (f) 400 invalid `photo_url` URL; (g) empty-string `linkedin` accepted, stored as `null`; (h) `order_index: '2'` (string) coerced to `2`; (i) 400 `order_index: -1`; (j) `active: 0` in body silently ignored, row stored with `active: 1`; (k) unknown body keys ignored.
  - [ ] PUT cases: (a) 401 no-cookie; (b) 200 success — seed a member, PUT new values, response reflects updates, DB durability check; (c) 400 invalid `:id` → `field: 'id'`; (d) 404 `:id = 999999`; (e) 400 missing required field same as POST; (f) `active` field in body silently stripped (UPDATE does not flip the active column).
  - [ ] Create `server/routes/team.test.ts`: spin up `createApp()` (the public route does NOT require auth, so no cookie harness needed; use isolated DB via the same in-memory pattern); seed via `teamDao.create()` (one active row, one inactive row); GET `/api/team` returns ONLY the active row; assert `data.length === 1`; assert sorting (seed two active rows out-of-order, assert response order matches `order_index ASC`).
  - [ ] If the test harness's `createIsolatedApp` lives in `server/routes/admin/leads.test.ts` only (not exported), refactor it into `server/routes/admin/test-helpers.ts` (NEW) and import from both test files. If extraction is non-trivial, copy-paste is acceptable for this story — document the duplication in dev notes and add a follow-up to Story 4.6 to consolidate.

- [x] Subtask 5: Server — extend `server/db.seed.ts` with `seedTeamMembers` (AC: 11)
  - [ ] Add exported `seedTeamMembers({ dao? }: { dao?: TeamDao } = {})` returning `{ inserted: number; skipped: number }`. Behavior: query `dao.list()`; if length > 0, return `{ inserted: 0, skipped: <count> }` (idempotent no-op). Otherwise insert two rows mirroring the EN/PT/ES content currently in `src/i18n/locales/{en,pt-BR,es}/translation.json#team.members` (Maria Silva + Lucas Oliveira) — embed the constants in a `DEFAULT_TEAM_MEMBERS: TeamMemberInput[]` const inside `db.seed.ts` (do NOT read the i18n JSON at runtime — i18n files are client assets, importing them from the server breaks the build boundary).
  - [ ] Extend the CLI `runFromCli` path: after `seedAdminUser`, call `seedTeamMembers` and log `team members seeded: <n>` or `team members already seeded (n=<count>)`. Exit code stays 0 on idempotent run.
  - [ ] Add tests in `server/db.seed.test.ts` (extend or create): (a) inserts 2 rows on empty table; (b) returns `skipped: 2` on second run; (c) inserted rows pass `teamDao.list({ activeOnly: true })` round-trip and surface in `GET /api/team`.

- [x] Subtask 6: Frontend — `src/lib/api.ts` admin team helpers + types (AC: 1, 3, 4, 5, 9, 10)
  - [ ] Add exported types co-located with the admin lead types:
    - `AdminTeamMemberRow` — full shape mirroring server `TeamMemberRow` (`id, name, role_en, role_pt, role_es, bio_en, bio_pt, bio_es, linkedin: string|null, photo_url: string|null, order_index: number, active: 0|1`).
    - `AdminTeamMemberInput` — same minus `id` and `active`.
    - `PublicTeamMemberRow` — alias of `AdminTeamMemberRow` (server returns the same shape on `/api/team`).
  - [ ] Add `parseAdminTeamMemberRow(value: unknown): AdminTeamMemberRow | null` runtime validator (mirror `parseAdminLeadRow` style: per-field `typeof` guards; numeric `active` accepts only `0|1`).
  - [ ] Add helpers (mirror `getAdminLeads` / `patchAdminLeadStatus`):
    - `getAdminTeam(options?: { signal?: AbortSignal }): Promise<AdminTeamMemberRow[]>` — GET `/api/admin/team`.
    - `postAdminTeam(input: AdminTeamMemberInput): Promise<AdminTeamMemberRow>` — POST → 201 expected; on `response.status === 201 && body.success === true` parse `body.data` via `parseAdminTeamMemberRow` and return.
    - `putAdminTeam(id: number, input: AdminTeamMemberInput): Promise<AdminTeamMemberRow>` — PUT.
    - `getPublicTeam(): Promise<PublicTeamMemberRow[]>` — GET `/api/team` with `credentials: 'omit'` (it's a public endpoint — DO NOT send the admin cookie); on network failure throw a NEW lightweight `PublicTeamError(status, message)` class (do NOT reuse `AdminApiError` — public callers must not trip the admin 401 → `clearSession()` flow).
  - [ ] All admin helpers throw `AdminApiError` on non-2xx / `success !== true` / shape mismatch / network failure, mirroring `patchAdminLeadStatus`. 401 throws (no soft-resolve).
  - [ ] Extend `src/lib/api.admin.test.ts` with cases for each helper: 200/201 success returns parsed row(s); 400 throws with `field`; 401 throws; malformed response throws `'Invalid team response'`; network failure throws `AdminApiError(0, 'Network error')`. Public helper: 200 returns rows; 500 throws `PublicTeamError`; network failure throws `PublicTeamError(0, 'Network error')`.

- [x] Subtask 7: Frontend — `src/pages/admin/Team.tsx` admin page (AC: 1, 2, 3, 4, 7, 9, 10, 12)
  - [ ] Replace the current `<main />` stub with a full page (mirror `src/pages/admin/Leads.tsx` skeleton — main wrapper, `max-w-6xl`, h1 from i18n, then content).
  - [ ] State: `rows: AdminTeamMemberRow[] | null`, `loading`, `errorKey`, `refetchToken`, `mode: { kind: 'list' } | { kind: 'create' } | { kind: 'edit', id: number }`, per-form `formValues` + `formErrors` maps, `isSubmitting` flag.
  - [ ] `useEffect` initial fetch via `getAdminTeam({ signal })` — abort on unmount (same `AbortController` pattern Story 4.2 fixed in review).
  - [ ] List mode: render a `<table>` with columns Name / Role (EN) / Active / Order / Actions. Active is read-only here — render badge using i18n keys `admin.team.active.yes` / `admin.team.active.no` (Story 4.5 will turn it into a toggle). Actions column has an "Edit" button per row.
  - [ ] "Add Team Member" button above the table — switches `mode` to `{ kind: 'create' }` and resets `formValues` to defaults (`order_index: 0`, all strings empty).
  - [ ] Create / Edit form: shared subcomponent `TeamMemberForm` co-located at top of file (NOT a separate file — single-use, scope is `Team.tsx` only — same convention `MessageCell` follows in `Leads.tsx`). Props: `initialValues`, `submitLabel`, `onSubmit(values)`, `onCancel`, `isSubmitting`. Fields render in the AC-2 order; required inputs show asterisk; per-field error renders below the input on blur AND on submit; on submit, calls `onSubmit(values)` only if local validation passes (validate via the same Zod create schema via dynamic import from `@/lib/team-schema.ts` — see Subtask 8 below). On submit failure, focus the first invalid field via a ref map.
  - [ ] Submit handlers: create → `postAdminTeam(values)` → prepend new row → switch to `{ kind: 'list' }`; edit → `putAdminTeam(id, values)` → replace row in state → switch to `{ kind: 'list' }`. On `AdminApiError(401)` from either, call `clearSession()` (no per-form alert). On `AdminApiError(400, msg, field)`, set `formErrors[field] = i18nKey`. On other errors, set a form-level `role="alert"` with `admin.team.errors.generic`.
  - [ ] Admin import boundary: NO imports from `src/components/sections/*`. Allowed: `@/components/ui/*`, `@/lib/api`, `@/store/useAdminStore`, `react-i18next`, `react`. (Same rule Story 4.2/4.3 followed.)

- [x] Subtask 8: Frontend — shared client-side validation `src/lib/team-schema.ts` (AC: 7, 8, 12)
  - [ ] Create `src/lib/team-schema.ts` exporting `createAdminTeamSchema(t: TFunction)` that builds a Zod schema mirroring `adminTeamCreateSchema` shape but with `t()`-driven error messages (`admin.team.form.errors.required`, `admin.team.form.errors.url`, `admin.team.form.errors.orderIndex`). This isolates the client-side validation from server schema imports (server schemas live in `server/` — importing from client breaks the bundle boundary; `npm run check:client-bundle-secrets` would not flag this but it would still bloat the client bundle with `server/` modules).
  - [ ] Export `AdminTeamFormValues` type matching the form state shape (all strings, `order_index` stored as string in the form state to handle in-progress typing, coerced on submit).
  - [ ] Smoke test `src/lib/team-schema.test.ts`: t-stub returning keys; assert each required field validation; URL field validation; order_index coercion + non-negative integer.

- [x] Subtask 9: Frontend — `src/pages/admin/Team.test.tsx` (NEW) (AC: 1, 2, 3, 4, 7, 9, 10)
  - [ ] Mock `@/lib/api` per `Leads.test.tsx:10-16` pattern; seed `useAdminStore` as authenticated.
  - [ ] Cases: (a) renders list of seeded rows ordered by `order_index`; (b) clicking "Add Team Member" reveals the form; (c) submitting empty form shows required-field errors AND does NOT call `postAdminTeam`; (d) submitting a valid form calls `postAdminTeam` with the right payload, prepends the new row to the table, returns to list mode; (e) editing a row pre-populates the form and calls `putAdminTeam` on submit; (f) 400 `field: 'linkedin'` response from `postAdminTeam` renders the URL error below the LinkedIn input and keeps the form open; (g) 401 from `postAdminTeam` calls `clearSession` and does NOT render a form-level alert; (h) initial fetch error renders `role="alert"` + Retry; Retry re-fires `getAdminTeam`.

- [x] Subtask 10: Frontend — replace `src/components/sections/Team.tsx` data source (AC: 5, 6)
  - [ ] Replace `useTranslation`-backed `t('team.members')` consumption with a `useEffect`-fetched call to `getPublicTeam()`. State: `members: PublicTeamMemberRow[] | null`. Loading state: render header + eyebrow + subtext only; NO Skeleton on public surface. Error: same — fall through to the empty-grid branch (NEVER render an alert to public users).
  - [ ] Pick locale-specific `role` and `bio` based on `useLocaleStore.locale`:
    - `en` → `role_en`, `bio_en`
    - `pt-BR` → `role_pt`, `bio_pt`
    - `es` → `role_es`, `bio_es`
  - [ ] Reuse existing render helpers (`isUsablePhoto`, `getInitials`, `isNonEmptyString`, `aria-labelledby`, LinkedIn button). The shape adapter: build a local `displayMember = { name, role, bio, photo: photo_url ?? '', linkedinUrl: linkedin ?? '' }` then run through existing `normalizeTeamMember` (or inline the same checks).
  - [ ] Section keys `team.eyebrow`, `team.headline`, `team.subtext`, `team.ariaLabel`, `team.linkedinAriaLabel` STAY in i18n — only `team.members` becomes API-driven. Do NOT delete `team.members` from the JSON files in this story (preserves rollback path).
  - [ ] Update `src/components/sections/Team.test.tsx`: mock `getPublicTeam`; cases for (a) successful render with two members; (b) empty response → header-only render; (c) locale switch (`en` → `pt-BR`) updates rendered `role` and `bio` strings; (d) network failure → header-only render (no thrown error escapes to ErrorBoundary).

- [x] Subtask 11: i18n — extend `admin.team` namespace + add public Team fallback keys (AC: 1, 2, 7, 8, 12)
  - [ ] Add `admin.team.*` namespace to EN, PT-BR, ES `translation.json` files:
    - `title` — "Team Members" / "Membros da Equipe" / "Miembros del Equipo"
    - `add` — "Add Team Member" / etc.
    - `columns.{name,role,active,order,actions}`
    - `active.{yes,no}`
    - `form.{title.create,title.edit,labels.{name,role_en,role_pt,role_es,bio_en,bio_pt,bio_es,linkedin,photo_url,order_index},required,placeholders.{linkedin,photo_url},submit.create,submit.edit,cancel}`
    - `form.errors.{required,url,orderIndex,generic}`
    - `errors.{load,retry,generic}`
    - `empty` — "No team members yet. Click Add Team Member to create the first one."
  - [ ] EN, PT-BR, ES all populated with the same key shape. PT-BR tone matches `admin.leads.empty.title` ("Nenhum membro…"). ES tone matches `admin.leads` ES baseline.
  - [ ] Do NOT i18n `aria-busy`, `role="alert"`, `data-testid` — technical English per the project a11y i18n boundary.
  - [ ] `team.members` i18n key (public section) STAYS — preserves rollback path. New `team.empty` defaultValue string may be added if a public empty state copy is needed (NOT required by AC — public empty falls back to header-only render).

- [x] Subtask 12: E2E coverage — `tests/e2e/admin-team.spec.ts` (NEW) + extend `tests/e2e/sections.spec.ts` if it covers Team (AC: 1, 3, 4, 5, 9)
  - [ ] Create `tests/e2e/admin-team.spec.ts`: log in as seed admin → navigate to `/admin/team` → assert list renders (after `npm run db:seed` runs the team-members seed) → click "Add Team Member" → fill all required fields → submit → assert new row appears in the table → click "Edit" on the new row → change `role_en` → submit → assert updated value renders → reload page → assert change persists.
  - [ ] Add a public-surface scenario: navigate to `/` (un-authenticated) → assert `data-team-grid="true"` renders with at least the seeded members → switch locale to `pt-BR` via the existing locale switcher → assert `role_pt` content renders (assert against the seeded PT bio text).
  - [ ] Skip WebKit / mobile-safari per the precedent if Playwright binaries are unavailable; document any skips in the Change Log.

- [x] Subtask 13: Verification (all ACs)
  - [x] `npm run typecheck` → 0 errors.
  - [x] `npm run test:run` → **74 files, 560/560 pass** (4.3 baseline 69/474 → +5 files / +86 tests).
  - [x] `npm run build` clean; `dist/client/assets/index-Bee3a-T_.js` 426.82 kB / 128.47 kB gzip.
  - [x] `npm run check:client-bundle-secrets` → `Client bundle secret scan passed.`
  - [ ] `npm run dev` manual smoke — deferred to cross-model review per CLAUDE.md.

- [x] Subtask 14: Vault + docs (post-implementation)
  - [x] `vault/Code/Admin.md` — Frontend row for `Team.tsx`, Backend rows for `team.ts` (POST/PUT) + new public `team.ts`, `admin-team.schema.ts` schema row, `team-schema.ts` client row, Status row Story 4.4 populated.
  - [x] `vault/Planning/Epics-Index.md` Story 4.4 → `[r]` review.
  - [x] `vault/00-Home.md` Project Status reflects 4.4 review state.
  - [x] `.cursor/rules/jira-config.mdc` Epic 4 row updated with status + subtask range note.

## Dev Notes

### Source Context

- Epic 4 enables the Sync Sirius ops team to manage leads + team content through the JWT-authenticated admin dashboard built in Story 4.1. Stories 4.1–4.3 covered admin auth + the read-only Leads dashboard + inline lead-status mutation. Story 4.4 introduces the first **content** management surface (team members) — including the create + edit half (4.5 layers active toggle + order management on top). [Source: `_bmad-output/planning-artifacts/epics.md:1213-1244`]
- FR coverage for this story slice: FR35 (admin add/edit/deactivate team members — this story owns add/edit; 4.5 owns deactivate), FR36 (per-locale bio management), and the create/edit half of FR37 (order_index is editable here; reorder UX is 4.5). [Source: `_bmad-output/planning-artifacts/prd.md:310-312`]
- Architecture API surface: `GET /api/admin/team`, `POST /api/admin/team`, `PUT /api/admin/team/:id`, `PATCH /api/admin/team/:id/active` (last one is Story 4.5). [Source: `_bmad-output/planning-artifacts/architecture.md:270-273`]
- Architecture G3 risk note: "Phase 1 team section — bios in DB (Phase 3) vs translation files. Phase 1: team members defined as array in `t('team.members')` translation key. Phase 3: `Team.tsx` replaced with API call to `/api/admin/team`. Phase switch isolated to one component." — Story 4.4 is exactly that phase switch, but routed through the NEW public `/api/team` endpoint (not the auth-gated `/api/admin/team` — the architecture line is slightly out of date; AC 5 + 6 govern). [Source: `_bmad-output/planning-artifacts/architecture.md:898`]
- Response envelope `{ success, data?, message?, field? }` and standard status codes (200/201/400/401/404/500) — same convention used by all admin routes. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]

### Current State of Files to Update

- `server/routes/admin/team.ts:1-11` — Currently exposes only `router.get('/', ...)` returning ALL members (no `activeOnly`). Subtask 2 adds POST + PUT to the same `Router()` instance; GET stays unchanged. Imports already include `teamDao`; only new imports are the new schema module exports.
- `server/dao/team.dao.ts:33-108` — `TeamDao` interface already has `list`, `getById`, `create`, `update`, `setActive`. `create` honors defaults (`active: 1`, `order_index: 0`, nullable optional `linkedin` + `photo_url`); `update` uses whitelisted `ALLOWED_PATCH_KEYS` and returns the post-update row via `getById`. **Do not modify the DAO.** All Story 4.4 needs is route + schema + frontend work.
- `server/db.ts:51-64` — `team_members` table schema is established: `name`, `role_en`, `role_pt`, `role_es`, `bio_en`, `bio_pt`, `bio_es` are `TEXT NOT NULL`; `linkedin`, `photo_url` are nullable; `order_index INTEGER NOT NULL DEFAULT 0`; `active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))`. No migration needed for Story 4.4.
- `server/db.seed.ts:1-52` — Currently seeds the admin user only. Subtask 5 extends `runFromCli` and adds `seedTeamMembers`. Keep the file under 150 lines; if the constants grow, extract `DEFAULT_TEAM_MEMBERS` to `server/db.seed.team-members.ts`.
- `server/routes/admin/leads.test.ts:1-300` — Reference harness style for `createIsolatedApp` / `loginAndGetCookie` / `authedGet` / `authedPatch`. Subtask 4 needs the same scaffolding for team — either extract to `server/routes/admin/test-helpers.ts` OR copy. The right call is contextual; if extraction touches the existing test file's structure non-trivially, copy and defer the consolidation. [Source: `server/routes/admin/leads.test.ts:28-62`]
- `server/index.ts:1-46` — Admin team router is mounted at `/api/admin/team` behind `requireAdmin` (line 46). Subtask 3 ADDS a new public mount at `/api/team` BEFORE the `/api` 404 fallback (line 48). Order: `/api/health` → `/api/demo` → `/api/contact` → `/api/audit` → `/api/team` (NEW) → `/api/admin/*` → `/api` 404 fallback.
- `src/components/sections/Team.tsx:1-142` — Public Team section currently consumes `t('team.members', { returnObjects: true })` and runs each item through `normalizeTeamMember`. Subtask 10 replaces the data source with `getPublicTeam()`; the render path (photo or initials, name, role, bio, optional LinkedIn) stays identical. The `members.length > 0` guard at line 80 handles the empty-grid fallback for AC 6.
- `src/pages/admin/Team.tsx:1` — Currently a one-line `export default function Team() { return <main /> }`. Subtask 7 replaces with the full page.
- `src/lib/api.ts:269-402` — `AdminApiError`, `AdminLeadStatus`, `parseAdminLeadRow`, `getAdminLeads`, `patchAdminLeadStatus` already established. Subtask 6 adds team types + helpers immediately below the lead helpers. Reuse `AdminApiError` for admin helpers; add a new `PublicTeamError` for the public helper (rationale in Architecture Guardrails below).
- `src/components/sections/Team.test.tsx` — Existing test file consumes the i18n path. Subtask 10 rewrites it against the mocked `getPublicTeam`.
- `src/i18n/locales/{en,pt-BR,es}/translation.json` — `admin` namespace already exists with `login`, `dashboard`, `logout`, `leads`. Subtask 11 adds a peer `team` sub-namespace under `admin`.
- `tests/e2e/admin-leads.spec.ts` — Reference E2E for Playwright + admin auth + seed harness; new `admin-team.spec.ts` mirrors its setup pattern.

### Architecture Guardrails

- **Reuse, do NOT reinvent.** `teamDao.create()`, `teamDao.update()`, `teamDao.list({ activeOnly: true })` are all in place — Story 4.4 wires routes + schemas + frontend on top of them. NO new DAO methods. NO new SQL in route handlers. [Source: `server/dao/team.dao.ts:55-108`]
- **POST returns 201, PUT returns 200.** Per the architecture's REST conventions and HTTP semantics: a successful POST that creates a resource returns 201 (with the created resource in `data` — `Location` header optional, not required). A successful PUT returns 200 with the updated resource. The frontend MUST handle 201 from POST — using `response.ok` (which is true for both 200 and 201) is correct; do NOT hard-code `response.status === 200` for the POST helper. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- **Public endpoint = NEW class of error.** `AdminApiError` is admin-scoped — the page handlers in `Leads.tsx`/`Team.tsx` (admin) trip `clearSession()` on `err.status === 401`. The PUBLIC Team section MUST NEVER trip session clearing on a failure — there is no admin session in scope. That's why Subtask 6 introduces `PublicTeamError` instead of reusing `AdminApiError`. Also: `getPublicTeam()` uses `credentials: 'omit'` so the admin cookie is never sent on a public endpoint (defense in depth — the endpoint doesn't read the cookie, but transmitting it on a public route is a credential-leak smell).
- **NO public Skeleton.** Public surfaces should not flash loading states — Skeletons are admin UX only (Story 4.2 established this scope). The public Team section renders header + (eventual) grid OR header + no grid. Never half-rendered.
- **NO i18n JSON imports from the server.** `server/db.seed.ts` MUST NOT `import` from `src/i18n/locales/*.json`. Server modules ship via `tsx` / `tsc` — pulling client JSON would bloat the seed and create a directional dependency violation. Inline the two default members as a `DEFAULT_TEAM_MEMBERS` constant in `db.seed.ts` (or a co-located `db.seed.team-members.ts`).
- **NO new shared UI primitives.** The admin form reuses `<Button>` and `<Label>` from `@/components/ui/*`. Inputs and textareas use native HTML elements with Tailwind classes mirroring the Leads filters. Toast is NOT adopted for admin (same rule Story 4.3 followed — Toast adoption for admin is a Story 4.6 decision).
- **Admin import boundary (HARD RULE).** `src/pages/admin/**` MUST NOT import from `src/components/sections/`. No new imports outside the existing allow-list. (Story 4.1 review-patch added this rule.) [Source: `_bmad-output/implementation-artifacts/4-1-admin-authentication-login-session-management.md`]
- **a11y i18n boundary.** `role="alert"`, `aria-busy`, `aria-label`, `aria-labelledby`, and `data-testid` values are technical English — NOT i18n'd. Visible labels, helper text, error messages, and badge text ARE i18n'd. [Source: project memory `feedback_a11y_i18n_boundary.md`]
- **`active` is read-only in this story.** AC 4 + 12 + Subtask 7 enforce: the create/edit form has NO active toggle; the admin table shows active as a read-only badge. Story 4.5 introduces the toggle via `PATCH /api/admin/team/:id/active`. If `active` is sent in a POST/PUT body, the schema silently strips it (consistent with the unknown-key-tolerance rule from Story 4.3).
- **`order_index` is editable here but reorder UX is Story 4.5.** Story 4.4 lets the admin manually type an integer into a number input. Story 4.5 may add drag-to-reorder or up/down buttons. Don't pre-build that in 4.4.
- **PUT semantics: full replacement on the editable subset.** PUT body MUST include ALL editable fields (`name`, role × 3, bio × 3, optional URLs, `order_index`). Partial-update via PUT is incorrect REST semantics (that's PATCH). The DAO's `update()` is whitelisted-key-only — passing a partial body works at the DAO layer, but the route's Zod schema enforces full-body semantics by marking required fields as required.
- **Response shape stability.** GET returns `{ success: true, data: TeamMemberRow[] }`. POST returns `{ success: true, data: TeamMemberRow }` (singular). PUT returns the same singular shape. Public GET returns `{ success: true, data: TeamMemberRow[] }`. Use `parseAdminTeamMemberRow` on the client; do NOT introduce per-helper shape parsers.
- **401 envelope is owned by middleware.** `requireAdmin` returns `{ success: false, message: 'Unauthorized' }`. Do NOT customize the team route's 401 path.
- **No rate limiting on the public `/api/team` endpoint in this story.** The single-page-cached public surface does not warrant per-IP throttling; admin-API-wide hardening is out of scope. Document this and let Story 5.x or a future security story revisit.
- **No client-side re-fetch after a mutation.** Both POST and PUT return the row; the admin page updates local state from the response. Re-fetching `GET /api/admin/team` after each mutation is wasteful and breaks immediate-feedback UX (same rule Story 4.3 enforced).
- **Form validation: client-side mirror of server schema, not a fork.** `src/lib/team-schema.ts` is the client mirror of `adminTeamCreateSchema` with i18n error messages. The server schema is the authority — if they diverge, the server always wins on submit. Local validation is for UX, not security.

### Previous Story Intelligence

- **Story 4.1** delivered the admin auth foundation: `requireAdmin` middleware, JWT cookie, session bootstrap, `AdminApiError` pattern. Story 4.4 reuses all of it — no auth work. [Source: `_bmad-output/implementation-artifacts/4-1-admin-authentication-login-session-management.md`]
- **Story 4.2** established: `getAdminLeads` + `parseAdminLeadRow` helper pattern; `AdminApiError` 401 throw + `clearSession()` flow; inline `role="alert"` + Retry pattern; admin import boundary; AbortController-per-fetch in the page-level effect. Story 4.4 mirrors all of these for team. [Source: `_bmad-output/implementation-artifacts/4-2-leads-dashboard-view-filter.md`]
- **Story 4.3** established: per-row mutation state via `Set`/`Map`; optimistic-with-revert UI; per-row `role="alert"`; PATCH endpoint co-located in the existing admin router; Zod params + body validation pattern with `field` in the error envelope; unknown-key tolerance (Zod default, NOT `.strict()`); 404-on-vacuous-update. Story 4.4 reuses ALL of these patterns. [Source: `_bmad-output/implementation-artifacts/4-3-lead-status-management.md`]
- **Story 4.7** added per-IP + per-email rate limiting to `/api/admin/auth/login` only. It does NOT apply to `/api/admin/team/*`. No rate limiting on team mutations in this story. [Source: `_bmad-output/implementation-artifacts/4-7-admin-login-throttling-lockout.md`]
- **Story 4.8** added `tokenVersion` claim + per-request `findById` strict equality check in `requireAdmin`. Story 4.4 inherits the stricter 401 path — if an admin is reseeded mid-session, POST/PUT will 401 just like Story 4.3's PATCH. The 401 handling in admin team helpers MUST `throw` so the page's `clearSession()` path runs. [Source: `_bmad-output/implementation-artifacts/4-8-jwt-revocation-after-password-reseed.md`]
- **CLAUDE.md — Cross-Model Review.** If Claude implements 4.4, the review pass must run under a non-Claude agent (Codex). Manual `/bmad-dev-story` is acceptable per the user's automator-disabled preference. [Source: `CLAUDE.md`, project memory `feedback_cross_model_review.md`, `feedback_automator_disabled.md`]
- **CLAUDE.md — Story Subtasks Mandatory.** Parent Jira SYN-31 + child Sub-tasks (one per top-level Subtask above, 14 total) must exist after `/jira-assistant` sync. Idempotent if some already exist. [Source: `CLAUDE.md`]
- **CLAUDE.md — Git commit + push after every story.** After implementation completes, commit + push to remote unconditionally. [Source: `CLAUDE.md`]
- **CLAUDE.md — AC over Dev Notes scope.** If a dev note hedges ("could be deferred to a future story"), the AC wins. Public `GET /api/team` + replacing the public Team data source — both are AC requirements (AC 5), so they ship in this story even though the architecture's G3 risk note hints at deferral. [Source: project memory `feedback_ac_over_dev_notes_scope.md`]

### Git Intelligence

- Recent commits (last 5): `164dfa4` fix story-4.3 review fixes; `d148414` chore mark SYN-30 REVIEW; `9baf111` feat story-4.3 admin lead status PATCH; `4d3b24b` docs jira-config Epic 4 mapping; `49cbe56` chore story-4.8 to done. Recent work is concentrated on Story 4.3 status mutation + Epic 4 admin hardening. Story 4.4's write surface (`server/routes/admin/team.ts`, `server/routes/team.ts` NEW, `server/schemas/admin-team.schema.ts` NEW, `server/db.seed.ts`, `src/pages/admin/Team.tsx`, `src/components/sections/Team.tsx`, `src/lib/api.ts`, i18n × 3) is untouched since Stories 1.8 / 3.1 landed the public Team section. No merge conflicts expected.
- Uncommitted state on this branch: Epic 6 design-handoff artifacts (`_bmad-output/design-handoffs/`, `_bmad-output/implementation-artifacts/6-*.md`, vault index updates) — those are unrelated to Story 4.4's write surface. They should NOT be touched as part of this story.
- New file creation expected: `server/routes/team.ts` (public), `server/routes/team.test.ts`, `server/routes/admin/team.test.ts`, `server/schemas/admin-team.schema.ts`, `server/schemas/admin-team.schema.test.ts`, `src/lib/team-schema.ts`, `src/lib/team-schema.test.ts`, `src/pages/admin/Team.test.tsx`, `tests/e2e/admin-team.spec.ts`. Possibly: `server/routes/admin/test-helpers.ts` (test harness extraction).

### Latest Technical Notes

- **Zod URL validation**: `z.string().trim().url()` validates absolute URLs (http/https/etc.). For LinkedIn URLs specifically, consider tightening to `.startsWith('https://')` in a future story; this story accepts any valid URL per the existing pattern. To accept empty string as "no URL", use `.optional().or(z.literal('')).transform(v => v ? v : null)` — mirror `demo.schema.ts:10,13`. [Source: https://zod.dev/?id=strings]
- **Zod coercion for `order_index`**: `z.coerce.number().int().min(0)` accepts both `2` and `"2"` (HTML number inputs return strings). The JSON body from `fetch` carries the input as a number if the form converts before send; coerce defensively to tolerate both. Reject `-1`, `1.5`, `"abc"`. [Source: https://zod.dev/?id=coercion-for-primitives]
- **HTTP 201 vs 200 on POST**: RFC 9110 §15.3.2 — 201 is the correct response for a POST that creates a resource. Return the created resource in `data` (the body — `Location` header is conventional but optional). The frontend `fetch` check is `response.ok` (true for 200–299), so handling 201 just works in the helper. [Source: RFC 9110]
- **React form validation pattern**: For this story, use `useState<FormValues>` + `useState<FieldErrors>` + per-field `onBlur` running the field-scoped schema — same shape as `DemoForm.tsx` (`handleBlur`, `validateAll`). Do NOT pull in `react-hook-form` (NOT installed; would be a new dep — forbidden by the no-new-deps rule). Do NOT pull in `formik` (same reason). [Source: `src/components/sections/DemoForm.tsx:89-100`]
- **Public endpoint caching**: `GET /api/team` is a public read endpoint; setting `Cache-Control: public, max-age=60` would reduce origin load. Out of scope for this story (no perf requirement set); document as a follow-up.
- **Express route ordering**: When mounting `/api/team` (public) and `/api/admin/team` (auth-gated), Express matches the longest prefix first regardless of mount order — `/api/admin/team/...` will route to the admin router, not the public router. Still, mount the public router BEFORE the admin router cosmetically (consistency with `/api/demo`, `/api/contact`, `/api/audit` grouping).

### Testing Requirements

- Server tests use `// @vitest-environment node` + isolated temp DB pattern from `server/routes/admin/auth.test.ts:18-48` and `server/routes/admin/leads.test.ts:28-62`. Mirror exactly — do NOT introduce a new test harness.
- Frontend tests use `@testing-library/react` + Vitest jsdom per `Leads.test.tsx`. Mock `@/lib/api` via `vi.mock` at module level — DO NOT mock fetch directly.
- E2E tests live in `tests/e2e/` and follow `tests/e2e/admin-leads.spec.ts`. The global setup already seeds an admin via `ADMIN_EMAIL`/`ADMIN_PASSWORD`; Subtask 5 ensures team members are also seeded so the E2E can navigate to a non-empty list.
- Sandbox Playwright projects (WebKit/mobile-safari) may not be available; document any skipped projects in the Change Log per Story 3.11/4.1/4.2 precedent.
- Do NOT mock `requireAdmin` in the team route tests — exercise the real middleware with a real seeded JWT cookie (same rule Story 4.2/4.3 followed).
- Public `getPublicTeam` tests at the API helper layer use `vi.stubGlobal('fetch', vi.fn())`; the route-level test exercises the real Express app via `supertest` against an in-memory DB.
- Coverage gate: every AC must map to at least one Subtask 4 (server) or Subtask 9 (frontend admin) or Subtask 10 (frontend public) test case. AC 11 (seed idempotency) is covered by Subtask 5 tests. AC 5 + 6 (public endpoint behavior) are covered by Subtask 4 (server) + Subtask 10 (client).

### Project Structure Notes

Expected write surface:

```
server/
  routes/team.ts                          ← NEW (public GET /api/team)
  routes/team.test.ts                     ← NEW
  routes/admin/team.ts                    ← UPDATE: add POST + PUT
  routes/admin/team.test.ts               ← NEW (admin POST/PUT/GET coverage)
  routes/admin/test-helpers.ts            ← NEW (optional — extract from leads.test.ts if low-friction)
  schemas/admin-team.schema.ts            ← NEW
  schemas/admin-team.schema.test.ts       ← NEW (smoke)
  db.seed.ts                              ← UPDATE: seedTeamMembers + CLI logging
  db.seed.test.ts                         ← UPDATE: seedTeamMembers cases
  index.ts                                ← UPDATE: mount /api/team public router

src/
  pages/admin/Team.tsx                    ← REWRITE: full admin page
  pages/admin/Team.test.tsx               ← NEW
  components/sections/Team.tsx            ← REWRITE: API-backed; locale-specific role/bio
  components/sections/Team.test.tsx       ← REWRITE: against mocked getPublicTeam
  lib/api.ts                              ← UPDATE: types + helpers + PublicTeamError
  lib/api.admin.test.ts                   ← UPDATE: admin team helper cases
  lib/team-schema.ts                      ← NEW (client-side Zod mirror with t() messages)
  lib/team-schema.test.ts                 ← NEW
  i18n/locales/en/translation.json        ← UPDATE: admin.team namespace
  i18n/locales/pt-BR/translation.json     ← UPDATE: admin.team namespace
  i18n/locales/es/translation.json        ← UPDATE: admin.team namespace

tests/e2e/
  admin-team.spec.ts                      ← NEW (admin CRUD + public surface scenario)

vault/
  Code/Admin.md                           ← UPDATE: Team page + team route + schema + status row
  Code/Backend.md                         ← UPDATE: optional (if module map needs it)
  Code/Database.md                        ← UPDATE: seed convention extension
  Planning/Epics-Index.md                 ← UPDATE: Story 4.4 progression
  00-Home.md                              ← UPDATE: project status reflects 4.4 progression

.cursor/rules/jira-config.mdc             ← UPDATE: Epic 4 row for 4.4 + subtask range when synced
```

No structural conflicts with `_bmad-output/planning-artifacts/architecture.md`. No new top-level directories.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md:1213-1244`] — Story 4.4 ACs (BDD form)
- [Source: `_bmad-output/planning-artifacts/architecture.md:270-273`] — Admin team API surface
- [Source: `_bmad-output/planning-artifacts/architecture.md:898`] — G3 phase-switch risk note
- [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`] — Response envelope + HTTP semantics
- [Source: `_bmad-output/planning-artifacts/prd.md:310-312`] — FR35/FR36/FR37
- [Source: `server/routes/admin/team.ts:1-11`] — Existing router to extend
- [Source: `server/routes/admin/leads.ts:1-65`] — Reference handler style (param + body Zod validation, 404-on-vacuous-update, field-keyed error envelope)
- [Source: `server/dao/team.dao.ts:1-108`] — DAO contract (reuse as-is)
- [Source: `server/db.ts:51-64`] — `team_members` schema
- [Source: `server/db.seed.ts:1-52`] — Seed pattern to extend
- [Source: `server/middleware/auth.ts`] — `requireAdmin` JWT + tokenVersion middleware
- [Source: `server/routes/admin/leads.test.ts:28-62`] — Test harness pattern (createIsolatedApp + loginAndGetCookie)
- [Source: `server/schemas/admin-leads-query.schema.ts`] — Reference schema style
- [Source: `server/schemas/admin-lead-status.schema.ts`] — Reference param-coercion schema style
- [Source: `server/schemas/demo.schema.ts:6-15`] — URL/optional-empty-string transform pattern
- [Source: `src/lib/api.ts:269-402`] — Admin lead helpers (pattern to mirror)
- [Source: `src/pages/admin/Leads.tsx:1-389`] — Admin page pattern + admin import boundary
- [Source: `src/pages/admin/Leads.test.tsx`] — Frontend admin test pattern
- [Source: `src/components/sections/Team.tsx:1-142`] — Public Team section to rewrite
- [Source: `src/components/sections/DemoForm.tsx:89-100, 200-310`] — Public-form validation pattern to mirror for admin form
- [Source: `src/i18n/locales/en/translation.json:114-135, 393-444`] — `team.members` + `admin` namespaces
- [Source: `_bmad-output/implementation-artifacts/4-2-leads-dashboard-view-filter.md`] — Story 4.2 patterns
- [Source: `_bmad-output/implementation-artifacts/4-3-lead-status-management.md`] — Story 4.3 patterns
- [Source: `_bmad-output/implementation-artifacts/4-8-jwt-revocation-after-password-reseed.md`] — Story 4.8 401 implications
- [Source: `CLAUDE.md`] — Cross-model review, story subtasks, jira sync, commit+push, vault rules

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — `claude-opus-4-7[1m]` — 2026-05-17.

### Debug Log References

- `npx vitest run server/schemas/admin-team.schema.test.ts` → **22/22 pass** (Subtask 1).
- `npx vitest run server/routes/admin/team.test.ts server/routes/team.test.ts` → **26/26 pass** (Subtasks 2/3/4).
- `npx vitest run server/db.seed.test.ts` → **13/13 pass** (Subtask 5; 6 pre-existing admin-seed + 4 new team-seed cases + 3 pre-existing token_version cases).
- `npx vitest run src/lib/api.admin.test.ts` → **34/34 pass** (Subtask 6; 20 pre-existing + 14 new team helpers).
- `npx vitest run src/lib/team-schema.test.ts` → **13/13 pass** (Subtask 8).
- `npx vitest run src/pages/admin/Team.test.tsx` → **9/9 pass** (Subtask 9).
- `npx vitest run src/components/sections/Team.test.tsx` → **5/5 pass** (Subtask 10).
- `npx vitest run src/components/sections/Sections.i18n.test.tsx src/pages/Home.story-1-8.e2e.test.tsx` → **8/8 pass** (regression fixes after replacing public Team data source).
- `npm run typecheck` → 0 errors.
- `npm run test:run` → **74 files, 560/560 pass** (baseline post-4.3: 69 files / 474 tests → +5 files / +86 tests).
- `npm run build` → clean; `dist/client/assets/index-Bee3a-T_.js` 426.82 kB / 128.47 kB gzip.
- `npm run check:client-bundle-secrets` → `Client bundle secret scan passed.`
- `npm run test:e2e` → NOT executed in sandbox (Playwright binaries not present). New spec `tests/e2e/admin-team.spec.ts` ships alongside the existing admin-leads spec and will run in CI.
- `npm run dev` manual smoke — deferred to cross-model review per CLAUDE.md.

### Completion Notes List

- Server: new `server/schemas/admin-team.schema.ts` exposes `adminTeamCreateSchema`, `adminTeamUpdateSchema`, `adminTeamParamsSchema`. Required string fields trimmed `.min(1)`; URL fields accept valid URL or empty string (coerced to `null`); `order_index` coerced int `.min(0)` defaulting to `0`. The `active` key is silently stripped — Story 4.5 owns the toggle.
- Server: `server/routes/admin/team.ts` now exposes `GET /` (unchanged), `POST /` (Zod body → `teamDao.create()` → 201 with row), and `PUT /:id` (params Zod → body Zod → `teamDao.update()` → 200 / 404 on missing row). Field-keyed 400 envelopes mirror the leads PATCH handler.
- Server: new `server/routes/team.ts` — unauthenticated public router mounted at `/api/team` in `server/index.ts`; returns only `active = 1` rows via `teamDao.list({ activeOnly: true })`. Mount order: `/api/health` → `/api/demo` → `/api/contact` → `/api/audit` → `/api/team` → `/api/admin/*` → `/api` 404 fallback.
- Server: route tests use the existing isolated-DB harness pattern (in-memory SQLite + real `requireAdmin` middleware + real seeded JWT cookie). 16 admin team cases + 4 public team cases.
- Server: `server/db.seed.ts` now exports `DEFAULT_TEAM_MEMBERS` + `seedTeamMembers({ dao? })`. `runFromCli` calls `seedAdminUser` then `seedTeamMembers` and logs the inserted/skipped count. Embeds default Maria + Lucas constants — does NOT read i18n JSON from the server (boundary rule).
- Frontend: `src/lib/api.ts` adds admin team types (`AdminTeamMemberRow`, `AdminTeamMemberInput`, `PublicTeamMemberRow`), runtime validator `parseAdminTeamMemberRow`, helpers `getAdminTeam` / `postAdminTeam` (handles 201) / `putAdminTeam` / `getPublicTeam`, and new `PublicTeamError` class (public callers must never trip the admin `clearSession()` flow). Public helper uses `credentials: 'omit'`.
- Frontend: `src/lib/team-schema.ts` — `createAdminTeamSchema(t)` mirrors `adminTeamCreateSchema` shape with i18n-keyed error messages. `AdminTeamFormValues` keeps `order_index` as a string for in-progress typing; transform coerces and yields a `null`-or-URL `linkedin` / `photo_url` for the submit payload.
- Frontend: rewrote `src/pages/admin/Team.tsx` (replaced the `<main />` stub). Per-row `Edit` button switches to edit mode; "Add Team Member" reveals create mode; shared in-file `TeamMemberForm` handles both create and edit. Submit handlers update local state from the response (no refetch); 401 → `clearSession()` (no inline alert); 400 with `field` → inline error on offending input; other errors → form-level `role="alert"` with `admin.team.form.errors.generic`. Honors admin import boundary.
- Frontend: rewrote `src/components/sections/Team.tsx` to consume `getPublicTeam()` and pick `role` / `bio` from `useLocaleStore.locale` (`en` / `pt-BR` / `es`). Empty array → header-only render; network failure → header-only render (catches `PublicTeamError` without propagating to `ErrorBoundary`). No Skeleton on the public surface. `team.members` i18n key retained for rollback.
- i18n: new `admin.team` namespace × EN / PT-BR / ES — list columns, badges, action labels, form labels, placeholders, submit/cancel, error keys (`required`, `url`, `orderIndex`, `generic`), load/retry, empty. PT-BR / ES tone matches `admin.leads` baseline. ARIA attrs + `data-testid` stay technical English.
- E2E: new `tests/e2e/admin-team.spec.ts` — admin scenario logs in, lists seeded rows, creates a row with timestamped name, edits it, reloads, and asserts durability; public scenario asserts seeded names render in the public Team region and a PT-BR locale switch reveals the seeded PT bio.
- Regression sweep: `src/components/sections/Sections.i18n.test.tsx` and `src/pages/Home.story-1-8.e2e.test.tsx` previously relied on `t('team.members')` — both now mock `@/lib/api`'s `getPublicTeam` with a stable fixture and drive locale via `useLocaleStore.setState`. Public team headline / eyebrow / subtext still come from i18n (untouched).
- Architecture decisions enforced: no new dependencies, admin import boundary preserved, no new shared UI primitives, no Toast for admin, no client-side refetch after mutation, `active` toggle deferred to Story 4.5, public endpoint never sends admin cookies, server never imports from `src/i18n/locales/*`.

### File List

**Added**
- `server/schemas/admin-team.schema.ts`
- `server/schemas/admin-team.schema.test.ts`
- `server/routes/admin/team.test.ts`
- `server/routes/team.ts`
- `server/routes/team.test.ts`
- `src/lib/team-schema.ts`
- `src/lib/team-schema.test.ts`
- `src/pages/admin/Team.test.tsx`
- `tests/e2e/admin-team.spec.ts`

**Modified**
- `server/routes/admin/team.ts` (POST + PUT handlers appended; GET unchanged)
- `server/index.ts` (`/api/team` public router mount)
- `server/db.seed.ts` (`DEFAULT_TEAM_MEMBERS`, `seedTeamMembers`, CLI logging extension)
- `server/db.seed.test.ts` (4 new `seedTeamMembers` cases)
- `src/lib/api.ts` (team types, parser, helpers, `PublicTeamError`)
- `src/lib/api.admin.test.ts` (14 new team helper cases)
- `src/pages/admin/Team.tsx` (full page replacement)
- `src/components/sections/Team.tsx` (API-driven; locale-specific role/bio)
- `src/components/sections/Team.test.tsx` (rewritten against mocked `getPublicTeam`)
- `src/components/sections/Sections.i18n.test.tsx` (mock `getPublicTeam` + drive `useLocaleStore`)
- `src/pages/Home.story-1-8.e2e.test.tsx` (mock `getPublicTeam` with stable PT/EN/ES fixture)
- `src/i18n/locales/en/translation.json` (`admin.team.*`)
- `src/i18n/locales/pt-BR/translation.json` (`admin.team.*`)
- `src/i18n/locales/es/translation.json` (`admin.team.*`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (`4-4-team-member-management-create-edit`: backlog → ready-for-dev → in-progress → review; `last_updated` 2026-05-17)
- `_bmad-output/implementation-artifacts/4-4-team-member-management-create-edit.md` (Status, Tasks/Subtasks checks, Dev Agent Record, Change Log)
- `vault/Code/Admin.md` (Team page + admin team route + public team route + admin-team schema + team-schema client + Status row Story 4.4)
- `vault/Planning/Epics-Index.md` (Story 4.4 → `[r]`)
- `vault/00-Home.md` (Story 4.4 review marker)
- `.cursor/rules/jira-config.mdc` (Story 4.4 row + sub-task range)

### Change Log

| Date | Author | Change |
|---|---|---|
| 2026-05-17 | Claude Opus 4.7 (1M context) | Story 4.4 implemented end-to-end: `admin-team.schema.ts` (Zod create/update/params) + smoke test, POST/PUT handlers on `server/routes/admin/team.ts` with field-keyed 400s + 404-on-vacuous-update, new public `server/routes/team.ts` mounted at `/api/team`, isolated-DB route tests for admin + public, `seedTeamMembers` + CLI logging in `server/db.seed.ts`, admin/public team types + helpers + `PublicTeamError` in `src/lib/api.ts`, client i18n Zod mirror `src/lib/team-schema.ts`, full admin `Team.tsx` page with shared in-file `TeamMemberForm` + per-row Edit + optimistic local state, `Team.tsx` public section now consumes `getPublicTeam` with locale-specific role/bio, `admin.team` i18n × EN/PT-BR/ES, new admin team E2E spec, regression mocks added to `Sections.i18n.test.tsx` + `Home.story-1-8.e2e.test.tsx`. typecheck 0; full suite 74 files / 560 tests pass (+5 files / +86 tests vs Story 4.3 baseline); build clean; secret scan passed. Status → review. |
