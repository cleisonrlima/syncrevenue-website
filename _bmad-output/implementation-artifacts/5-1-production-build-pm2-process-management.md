# Story 5.1: Production Build & PM2 Process Management

Status: review

<!-- Created 2026-05-19 for Epic 5 (Production Deployment). Parent Jira: TBD (SYN Sprint 4 or SYN Sprint 3). Subtasks: TBD. -->

## Story

As a Sync Sirius operator,
I want the application to build cleanly for production and run under PM2 with auto-restart,
so that the server recovers automatically from crashes and stays available 24/7.

## Acceptance Criteria

1. **Given** `tsc && vite build` is run on the production server, **when** the build completes, **then** `dist/client/` contains hashed static assets + `index.html`; `dist/server/index.js` is the compiled Express server; no TypeScript errors; no missing imports.

2. **Given** `ecosystem.config.js` is committed to the repo, **when** `pm2 start ecosystem.config.js` is run, **then** the Express server starts as a named process (`syncrevenue-website`); PM2 auto-restarts on crash; `pm2 status` shows the process as `online`.

3. **Given** the Express server crashes, **when** PM2 detects the exit, **then** PM2 restarts the process within ≤ 5 seconds; crash is logged to PM2 log file; no manual intervention required.

4. **Given** `pm2 startup` is configured on the host, **when** the server reboots, **then** PM2 and the `syncrevenue-website` process start automatically.

5. **Given** `dist/client/` is served by Express in production, **when** HTTP response headers for a hashed asset are inspected, **then** `Cache-Control: max-age=31536000, immutable` is set for hashed assets; `Cache-Control: no-cache` is set for `index.html`.

## Tasks / Subtasks

- [x] Task 1 — Validate production build is clean (AC: 1)
  - [x] Run `tsc -p tsconfig.server.json && vite build` locally; confirm zero TS errors and no missing imports
  - [x] Verify `dist/client/` contains hashed assets + `index.html`
  - [x] Verify `dist/server/index.js` exists and is runnable
- [x] Task 2 — Create `ecosystem.config.js` at project root (AC: 2, 3, 4)
  - [x] Add `name: 'syncrevenue-website'`, `script: 'dist/server/index.js'`, `autorestart: true`, `watch: false`, `max_memory_restart: '1G'`, `env: { NODE_ENV: 'production' }`, `log_date_format: 'YYYY-MM-DD HH:mm:ss Z'`
  - [x] Commit the file to the repository
- [x] Task 3 — Add `start:prod` script to `package.json` (AC: 1)
  - [x] Add `"start:prod": "node dist/server/index.js"` to `scripts`; verify it does not already exist
- [x] Task 4 — Add Cache-Control header middleware to `server/index.ts` (AC: 5)
  - [x] In the `NODE_ENV === 'production'` static-serve block, replaced bare `express.static(clientDir)` with a version that sets `setHeaders` callback
  - [x] Hashed assets (Vite format: `name-HASH8chars.ext`, regex `/-[A-Za-z0-9_]{8,}\.[a-z0-9]+$/i`) → `Cache-Control: max-age=31536000, immutable`
  - [x] `index.html` → `Cache-Control: no-cache, no-store, must-revalidate`
- [x] Task 5 — Unit-test the Cache-Control logic (AC: 5)
  - [x] Added 6 tests to `server/index.test.ts` covering: index.html (no-cache), hashed JS, hashed CSS, hashed WebP (immutable), og-default.png (no header), robots.txt (no header)
- [x] Task 6 — Verify all existing tests still pass (AC: all)
  - [x] Run `npm run test:run` — 732/732 Vitest tests green (0 failures)
  - [x] Run `tsc --noEmit` — zero errors

## Dev Notes

### Critical Context

This story introduces **two files** and **modifies two files**:

| Action | File | Notes |
|--------|------|-------|
| NEW | `ecosystem.config.js` | Root-level PM2 config; CommonJS format (`module.exports`) |
| UPDATE | `server/index.ts` | Cache-Control headers in static-serve block |
| UPDATE | `package.json` | Add `start:prod` script |
| NEW (optional) | `server/index.test.ts` | Cache-Control setHeaders unit test (if no existing file) |

### `server/index.ts` — Current State & What to Change

The production static-serve block currently reads (lines 68–76):

```typescript
if (process.env.NODE_ENV === 'production') {
  const clientDir = path.resolve(__dirname, '../dist/client')
  if (fs.existsSync(clientDir)) {
    app.use(express.static(clientDir))
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(clientDir, 'index.html'))
    })
  }
}
```

The `express.static(clientDir)` call must gain a `setHeaders` option. The `__dirname` in the compiled output resolves to `dist/server/`, so `path.resolve(__dirname, '../dist/client')` correctly resolves to `dist/client/` at runtime.

**Hash detection pattern** (from architecture gap analysis G1): detect hashed filename by checking for a hex hash segment in the filename. Vite-emitted filenames follow the pattern `name.[hash8].ext`, e.g. `index.abc12345.js`. A reliable regex is `/\.[0-9a-f]{8,}\.[a-z0-9]+$/i` applied to the `filePath` argument of `setHeaders`.

**Exact replacement** for the static-serve line:

```typescript
app.use(
  express.static(clientDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      } else if (/\.[0-9a-f]{8,}\.[a-z0-9]+$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'max-age=31536000, immutable')
      }
    },
  })
)
```

Do **not** remove the `fs.existsSync(clientDir)` guard — it prevents a crash when running the server outside a production build context.

### `ecosystem.config.js` — Exact Content

PM2 ecosystem file must be CommonJS (not ESM) because PM2 reads it with `require()`:

```javascript
module.exports = {
  apps: [
    {
      name: 'syncrevenue-website',
      script: 'dist/server/index.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
```

PM2 `autorestart: true` satisfies AC 3 (auto-restart within ≤5s). The `pm2 startup` command (AC 4) is an operator step documented in the story — it cannot be automated via a committed file but should be called out in the ecosystem file's comments or a README note so operators know to run it on first deploy.

### `package.json` — Script Addition

Current `scripts` block does not include `start:prod`. Add:

```json
"start:prod": "node dist/server/index.js"
```

Place it after the `"build"` script for discoverability. **Do not touch** the `"build"` script — it already runs `tsc -p tsconfig.server.json && vite build && node scripts/generate-seo-assets.mjs`.

### Cache-Control Testing Strategy

Because the `setHeaders` function is a closure passed to `express.static`, the cleanest test approach is to extract it as a named function or test it via a real supertest request against the Express app in a test environment. Options:

1. **Supertest approach**: In a test, serve a mock static file from a temp directory and call `createApp()` — this requires NODE_ENV=production and a `dist/client/` with real files, which is fragile in CI.
2. **Unit-test the setHeaders logic directly**: Extract the `setHeaders` function outside the `if (NODE_ENV === 'production')` block, export it (or expose it via a module), and test it in isolation.
3. **Simplest acceptable approach**: Write a test that calls the extracted `setHeaders` logic with mock `res` and a hashed path vs `index.html` path, asserting `res.setHeader` is called with the correct values.

Recommended: keep `setHeaders` as an inline arrow function in `createApp()` but also export a `cacheControlHeaders(res, filePath)` helper from `server/index.ts` for testability. The test file should be `server/index.test.ts`.

### Architecture Alignment

- Architecture doc G1 resolution (line ~896): "Set in `server/index.ts` via `express.static('dist/client', { setHeaders: ... })`" — this story implements that exact pattern.
- NFR-R3 ("Server process auto-restarts on crash in production") is satisfied by `autorestart: true` in `ecosystem.config.js`.
- NFR-P1 ("Cache-Control: max-age=31536000, immutable" for hashed assets) is satisfied by the `setHeaders` middleware.
- `ecosystem.config.js` appears in architecture file tree at root (line ~607): `├── ecosystem.config.js   ← PM2 config`.

### Build Script Notes

Current `"build"` script: `tsc -p tsconfig.server.json && vite build && node scripts/generate-seo-assets.mjs`

The build compiles server TypeScript with `tsconfig.server.json` (outputs to `dist/server/`) and client with Vite (outputs to `dist/client/`). The `generate-seo-assets.mjs` script runs post-build. No changes needed to the build script.

### PM2 Not a Dependency

PM2 is installed globally on the server (`npm install -g pm2`). Do **not** add `pm2` to `package.json` dependencies or devDependencies. This is by design — PM2 is an infrastructure-level tool, not a project dependency.

### Files NOT to Touch

- `vite.config.ts` — no changes needed
- `tsconfig.json` / `tsconfig.server.json` — no changes needed
- Any route files, DAOs, or schema files
- Any test files except the new Cache-Control unit test

### Previous Story Context

Last completed stories in Epic 4 (4.5, 4.6) established the admin dashboard routes and navigation. No direct code overlap with this story. The `server/index.ts` was last modified to add `adminDashboardRouter` (Story 4.6) — review current file state before editing to ensure imports are preserved.

### Testing Standards

- Run `npm run test:run` after all changes — all Vitest tests must remain green
- Run `tsc --noEmit` — zero TypeScript errors
- E2E tests are not required for this story (no UI behavior change visible to browsers in dev mode; Cache-Control is a production-only header)
- The `check:client-bundle-secrets` script (`npm run check:client-bundle-secrets`) should still pass after build

### Project Structure Notes

```
syncrevenue-website/
├── ecosystem.config.js          ← NEW: PM2 config (CommonJS)
├── package.json                 ← UPDATE: add start:prod script
├── server/
│   ├── index.ts                 ← UPDATE: Cache-Control setHeaders + export helper
│   └── index.test.ts            ← NEW (if doesn't exist): Cache-Control unit test
```

### References

- [Source: architecture.md#Infrastructure & Deployment] — PM2 decision, ecosystem.config.js location, Cache-Control pattern
- [Source: architecture.md#Gap Analysis G1] — exact `setHeaders` resolution for Cache-Control
- [Source: epics.md#Story 5.1] — all 5 acceptance criteria verbatim
- [Source: server/index.ts lines 68–76] — current production static-serve block to modify

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Regex fix: initial `/\.[0-9a-f]{8,}\.[a-z0-9]+$/i` missed Vite hashes because Vite uses dash-separated alphanumeric hashes (`name-HASH8.ext`), not dot-separated hex. Fixed to `/-[A-Za-z0-9_]{8,}\.[a-z0-9]+$/i`. Verified against all actual `dist/client/assets/` filenames.

### Completion Notes List

- **Task 1**: `npm run build` (`tsc -p tsconfig.server.json && vite build && generate-seo-assets.mjs`) completed clean. `dist/client/` contains 17 hashed asset chunks + `index.html`. `dist/server/index.js` present.
- **Task 2**: `ecosystem.config.js` created at project root in CommonJS format. Includes `name`, `script`, `autorestart: true`, `watch: false`, `max_memory_restart: '1G'`, `env.NODE_ENV: 'production'`, `log_date_format`. First-deploy instructions in file comments.
- **Task 3**: `"start:prod": "node dist/server/index.js"` added to `package.json` `scripts` (placed after `build`). Did not exist previously.
- **Task 4**: `staticCacheHeaders(res, filePath)` exported function added to `server/index.ts` before `createApp`. `express.static(clientDir, { setHeaders: staticCacheHeaders })` replaces bare call. Regex uses Vite's actual hash format `/-[A-Za-z0-9_]{8,}\.[a-z0-9]+$/i`.
- **Task 5**: 6 tests added to `server/index.test.ts` in new `staticCacheHeaders` describe block using `vi.fn()` mock for `res.setHeader`. All 6 pass.
- **Task 6**: 732/732 tests pass. `tsc --noEmit` → zero errors. `npm run build` clean.
- AC 2/3/4 (PM2 auto-restart, ≤5s recovery, `pm2 startup` persistence): these are infrastructure-level runtime behaviors validated by `autorestart: true` in `ecosystem.config.js`. Cannot be unit-tested without PM2 installed. Operator must run `pm2 startup && pm2 save` on first deploy (documented in ecosystem.config.js comments).

### File List

- `ecosystem.config.js` — NEW: PM2 process manager configuration
- `package.json` — UPDATED: added `start:prod` script
- `server/index.ts` — UPDATED: exported `staticCacheHeaders` helper + `express.static` setHeaders
- `server/index.test.ts` — UPDATED: added 6 `staticCacheHeaders` unit tests
