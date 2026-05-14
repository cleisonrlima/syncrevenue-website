# Story 1.1: Project Initialization & Dev Environment

Status: in-progress
baseline_commit: a83fb3124a41db1182ed10cfc93f911239333707

## Story

As a developer,
I want the complete project scaffold initialized with all dependencies and tooling configured,
so that I can run the full-stack app locally and begin building features.

## Acceptance Criteria

1. **Given** the repo is freshly cloned, **when** `npm install` is run, **then** all deps install without errors: React 18, Vite 5, TypeScript strict, Express 4, better-sqlite3, Zod 3, Zustand 4, i18next 23, react-i18next, Tailwind CSS v3, shadcn/ui, nodemailer, bcryptjs, jsonwebtoken, concurrently, tsx.

2. **Given** the dev environment is configured, **when** `npm run dev` is run, **then** Vite starts on port 5173 and Express starts on port 3001 via `concurrently`; the React app loads in browser without errors; Vite proxies all `/api/*` requests to Express on port 3001.

3. **Given** the project structure is initialized, **when** the codebase is inspected, **then** directory structure matches the architecture spec exactly (see Dev Notes below); path alias `@/` → `src/` works in both `tsconfig.json` and `vite.config.ts`.

4. **Given** TypeScript is configured, **when** `tsc --noEmit` is run, **then** zero errors are reported; strict mode is enabled.

5. **Given** environment configuration, **when** `.env.example` is inspected, **then** all required keys are documented with no real values: `PORT`, `DB_PATH`, `JWT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL`, `ALLOWED_ORIGIN`.

6. **Given** the database module loads, **when** `server/db.ts` is imported, **then** a better-sqlite3 connection is established to `DB_PATH`; the `data/` directory is created if absent; **no tables are created** (schema deferred to Story 2.1).

7. **Given** Tailwind and shadcn/ui are configured, **when** the app builds, **then** `tailwind.config.ts` references the shadcn/ui preset; `components.json` is present; `@/` alias resolves; `npm run build` (which runs `tsc -p tsconfig.server.json && vite build`) produces `dist/client/` and `dist/server/` without errors.

## Tasks / Subtasks

- [x] Task 1: Initialize project and install all dependencies (AC: 1)
  - [x] Create `package.json` with scripts: `dev`, `build`, `preview`, `typecheck`
  - [x] Install production dependencies (see Dev Notes — exact list)
  - [x] Install dev dependencies (see Dev Notes — exact list)
  - [x] Verify `npm install` completes without errors

- [x] Task 2: Configure TypeScript (AC: 3, 4)
  - [x] Create `tsconfig.json` (strict mode, paths, noEmit: true — used by IDE + `tsc --noEmit`)
  - [x] Create `tsconfig.server.json` (extends base, module: CommonJS, outDir: dist/server, include: ["server"])
  - [x] Verify `tsc --noEmit` passes with zero errors

- [x] Task 3: Configure Vite (AC: 2, 3, 7)
  - [x] Create `vite.config.ts` with @vitejs/plugin-react, `@/` alias, build outDir `dist/client`, proxy `/api` → `http://localhost:3001`
  - [x] Set Vite dev server port to 5173 explicitly

- [x] Task 4: Configure Tailwind CSS v3 + shadcn/ui (AC: 7)
  - [x] Install and configure Tailwind v3 with PostCSS and autoprefixer
  - [x] Create `tailwind.config.ts` referencing shadcn preset (CSS variables)
  - [x] Run `npx shadcn@latest init` — choose: TypeScript, CSS variables, `tailwind.config.ts`, `src/index.css`, `@/components`, `@/lib/utils`
  - [x] Verify `components.json` is generated
  - [x] Add `@/` alias in `components.json` to match tsconfig/vite alias

- [x] Task 5: Create full directory structure with placeholder files (AC: 3)
  - [x] Create all `server/` directories and placeholder index files
  - [x] Create all `src/` directories and placeholder index files
  - [x] Create `data/` in `.gitignore` (DB file should not be committed)

- [x] Task 6: Implement `server/db.ts` (AC: 6)
  - [x] Import `better-sqlite3` and `dotenv/config`
  - [x] Read `DB_PATH` from `process.env`
  - [x] Create parent directory with `fs.mkdirSync(dir, { recursive: true })` if missing
  - [x] Open `new Database(dbPath)` and export as default
  - [x] Add pragma: `db.pragma('journal_mode = WAL')` for concurrent read performance

- [x] Task 7: Implement minimal `server/index.ts` (AC: 2)
  - [x] Import `dotenv/config` as first line (before other imports)
  - [x] Create Express app with `express.json()` middleware
  - [x] Add placeholder health check: `GET /api/health` → `{ success: true, status: 'ok' }`
  - [x] Listen on `process.env.PORT || 3001`
  - [x] Import and connect `server/db.ts` to confirm DB connection on startup

- [x] Task 8: Create minimal React entry points (AC: 2)
  - [x] `src/main.tsx`: React 18 `createRoot`, wrap in `BrowserRouter` from react-router-dom v7
  - [x] `src/App.tsx`: minimal router with `<Routes>` — single `<Route path="/" element={<div>Hello</div>}/>` placeholder
  - [x] `src/index.css`: Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`) + shadcn CSS variable block

- [x] Task 9: Create `.env` and `.env.example` (AC: 5)
  - [x] `.env.example` with all keys and no real values (see Dev Notes)
  - [x] `.env` with local dev defaults (gitignored): `PORT=3001`, `DB_PATH=./data/sync_sirius.db`, dummy JWT_SECRET for local dev
  - [x] Confirm `.env` is in `.gitignore`

- [x] Task 10: Configure npm scripts and verify full build (AC: 2, 7)
  - [x] `"dev": "concurrently \"vite\" \"tsx watch server/index.ts\""` 
  - [x] `"build": "tsc -p tsconfig.server.json && vite build"`
  - [x] `"typecheck": "tsc --noEmit"`
  - [x] Run `npm run build` and confirm `dist/client/` and `dist/server/index.js` are produced

## Dev Notes

### Dependencies — Exact Install Commands

```bash
# Production
npm install react@18 react-dom@18 react-router-dom@7
npm install express@4 better-sqlite3 dotenv
npm install zod@3 zustand@4
npm install i18next@23 react-i18next i18next-browser-languagedetector
npm install nodemailer bcryptjs jsonwebtoken
npm install express-rate-limit helmet cors cookie-parser
npm install concurrently tsx
```

**CRITICAL: Tailwind v3 must be explicit — do NOT install `tailwindcss` without the `@3` pin, as shadcn CLI defaults may pull v4 which breaks this project's config.**

### tsconfig.json (base — IDE + tsc --noEmit)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "server", "vite.config.ts", "tailwind.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### tsconfig.server.json (server compilation to dist/)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "dist/server",
    "noEmit": false,
    "declaration": false
  },
  "include": ["server"],
  "exclude": ["node_modules", "dist", "src"]
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    outDir: 'dist/client',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
```

### server/db.ts

```typescript
import 'dotenv/config'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = process.env.DB_PATH || './data/sync_sirius.db'
const dbDir = path.dirname(path.resolve(dbPath))

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
// Schema creation deferred to Story 2.1
export default db
```

### .env.example

```
PORT=3001
DB_PATH=./data/sync_sirius.db
JWT_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
NOTIFY_EMAIL=
ALLOWED_ORIGIN=http://localhost:5173
```

### Complete Required Directory Structure

Create these directories now (with empty placeholder files so git tracks them). All implementation in subsequent stories.

```
server/
├── index.ts              ← minimal Express + health check (this story)
├── db.ts                 ← DB connection, no tables (this story)
├── db.seed.ts            ← placeholder (Story 4.1)
├── middleware/
│   ├── auth.ts           ← placeholder (Story 4.1)
│   └── rateLimit.ts      ← placeholder (Story 2.1)
├── schemas/
│   ├── demo.schema.ts    ← placeholder (Story 2.1)
│   └── contact.schema.ts ← placeholder (Story 2.1)
├── dao/
│   ├── leads.dao.ts      ← placeholder (Story 2.1)
│   ├── contacts.dao.ts   ← placeholder (Story 2.1)
│   ├── team.dao.ts       ← placeholder (Story 4.4)
│   └── admin.dao.ts      ← placeholder (Story 4.1)
├── routes/
│   ├── demo.ts           ← placeholder (Story 2.2)
│   ├── contact.ts        ← placeholder (Story 2.3)
│   └── admin/
│       ├── auth.ts       ← placeholder (Story 4.1)
│       ├── leads.ts      ← placeholder (Story 4.2)
│       ├── contacts.ts   ← placeholder (Story 4.2)
│       └── team.ts       ← placeholder (Story 4.4)
└── lib/
    └── mailer.ts         ← placeholder (Story 2.5)

src/
├── main.tsx              ← React 18 entry + BrowserRouter (this story)
├── App.tsx               ← minimal Routes placeholder (this story)
├── index.css             ← Tailwind directives + shadcn CSS vars (this story)
├── i18n/
│   ├── index.ts          ← placeholder (Story 1.3)
│   ├── LanguageSwitcher.tsx ← placeholder (Story 1.3)
│   └── locales/
│       ├── en/translation.json   ← placeholder (Story 1.3)
│       ├── pt-BR/translation.json ← placeholder (Story 1.3)
│       └── es/translation.json   ← placeholder (Story 1.3)
├── store/
│   ├── useModalStore.ts    ← placeholder (Story 2.4)
│   ├── useLocaleStore.ts   ← placeholder (Story 1.3)
│   └── useAdminStore.ts    ← placeholder (Story 4.1)
├── hooks/
│   ├── useDemo.ts          ← placeholder (Story 2.2)
│   ├── useContact.ts       ← placeholder (Story 2.3)
│   └── useAdmin.ts         ← placeholder (Story 4.1)
├── lib/
│   ├── api.ts              ← placeholder (Story 2.2)
│   └── utils.ts            ← cn() utility (this story — shadcn needs it)
├── components/
│   ├── ui/                 ← shadcn generated (populated via CLI per story)
│   ├── layout/
│   │   ├── Navbar.tsx      ← placeholder (Story 1.4)
│   │   ├── Footer.tsx      ← placeholder (Story 1.4)
│   │   └── AdminLayout.tsx ← placeholder (Story 4.6)
│   └── sections/
│       ├── Hero.tsx           ← placeholder (Story 1.5)
│       ├── SyncRevenue.tsx    ← placeholder (Story 1.6)
│       ├── Services.tsx       ← placeholder (Story 1.6)
│       ├── Comparison.tsx     ← placeholder (Story 1.7)
│       ├── Team.tsx           ← placeholder (Story 1.8)
│       ├── DemoScheduler.tsx  ← placeholder (Story 2.4)
│       ├── Contact.tsx        ← placeholder (Story 2.3)
│       ├── Security.tsx       ← placeholder (Story 1.9)
│       ├── ClientReferences.tsx ← placeholder (Story 1.9)
│       ├── DemoForm.tsx       ← placeholder (Story 2.2)
│       └── SectionSkeleton.tsx ← placeholder (Story 1.2)
└── pages/
    ├── Home.tsx             ← placeholder (Story 1.4)
    ├── Privacy.tsx          ← placeholder (Story 1.10)
    └── admin/
        ├── Login.tsx        ← placeholder (Story 4.1)
        ├── Dashboard.tsx    ← placeholder (Story 4.6)
        ├── Leads.tsx        ← placeholder (Story 4.2)
        └── Team.tsx         ← placeholder (Story 4.4)
```

### shadcn/ui Initialization

Run after Tailwind is configured:
```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate** (brand colors added in Story 1.2)
- CSS variables: **Yes**
- Tailwind config path: `tailwind.config.ts`
- Components path: `@/components/ui`
- Utility function path: `@/lib/utils`
- React server components: **No**
- Write configuration: **Yes**

**Do NOT install any shadcn components during this story.** Components are installed in Story 1.2 (design system) and subsequent stories.

`src/lib/utils.ts` is created by shadcn init — it contains `cn()` (clsx + tailwind-merge). Do not modify.

### package.json scripts

```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"tsx watch server/index.ts\"",
    "build": "tsc -p tsconfig.server.json && vite build",
    "typecheck": "tsc --noEmit",
    "preview": "vite preview"
  }
}
```

### Architecture Constraints (Non-Negotiable)

- **Tailwind v3 only** — architecture explicitly requires v3, not v4. `tailwindcss@3` in install.
- **React Router v7** — install `react-router-dom@7`. Use library mode (not framework/remix mode).
- **No VITE_ secrets** — `.env` vars without `VITE_` prefix stay server-side. `PORT`, `DB_PATH`, `JWT_SECRET`, etc. must never appear in `src/`.
- **dotenv/config import must be first** in any server entry file — before other imports that use `process.env`.
- **data/ directory must be gitignored** — SQLite file is runtime data, not source.
- **No tables in db.ts** — schema creation belongs in Story 2.1 (`server/db.ts` only opens connection).

### Placeholder File Convention

For placeholder files needed to create the directory structure, use a minimal typed export:

```typescript
// server/middleware/auth.ts (placeholder)
export {}
```

For React placeholder components:
```typescript
// src/components/sections/Hero.tsx (placeholder)
export default function Hero() { return <section id="hero" /> }
```

For JSON placeholder:
```json
{}
```

### .gitignore Essentials

```
node_modules/
dist/
data/
.env
*.db
```

### Project Structure Notes

- This story creates the monorepo root — no separate packages, single `package.json` at root
- Server TypeScript compiles to CommonJS (Node.js runtime) via `tsconfig.server.json`
- Client TypeScript uses Vite's bundler module resolution (ESM)
- Both share `tsconfig.json` for strict mode and IDE support
- `@/` alias resolves to `src/` in both Vite (via `resolve.alias`) and TypeScript (via `paths`)
- The alias does NOT apply to server code — server imports use relative paths

### References

- Stack specification: [architecture.md — Technology Stack Pre-Defined](../_bmad-output/planning-artifacts/architecture.md#technology-stack--pre-defined)
- Directory structure: [architecture.md — Complete Project Directory Structure](../_bmad-output/planning-artifacts/architecture.md#complete-project-directory-structure)
- Naming conventions: [architecture.md — Naming Patterns](../_bmad-output/planning-artifacts/architecture.md#naming-patterns)
- Dev workflow: [architecture.md — Development Workflow Integration](../_bmad-output/planning-artifacts/architecture.md#development-workflow-integration)
- Story AC source: [epics.md — Story 1.1](../_bmad-output/planning-artifacts/epics.md#story-11-project-initialization--dev-environment)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `react-i18next` latest (v17) requires `i18next@>=26`; pinned `react-i18next@14` to stay on `i18next@23`.
- `@vitejs/plugin-react` latest (v6) requires Vite 8; pinned `@vitejs/plugin-react@4` for Vite 5 compat.
- `shadcn@latest init` CLI changed API (v4.7 no longer accepts `--style`/`--base-color`); created `components.json`, `tailwind.config.ts`, and `src/lib/utils.ts` manually per shadcn v2 schema.
- `tsconfig.json`: added `"ignoreDeprecations": "6.0"` to silence TS 6.x `baseUrl` deprecation.
- `tsconfig.server.json`: added explicit `"rootDir": "server"` to fix TS5011 rootDir error.
- `src/vite-env.d.ts`: added `/// <reference types="vite/client" />` to fix CSS side-effect import error.

### Completion Notes List

- All 10 tasks completed. All 7 ACs satisfied.
- `tsc --noEmit` → 0 errors (strict mode, `@/` alias working).
- `npm run build` → `dist/client/index.html` + `dist/server/index.js` produced cleanly.
- Pinned `react-i18next@14` (not latest v17) for `i18next@23` compatibility.
- Pinned `@vitejs/plugin-react@4` (not latest v6) for Vite 5 compatibility.
- shadcn/ui configured manually: `components.json`, `tailwind.config.ts` with CSS variables, `src/lib/utils.ts` with `cn()`.
- Added `tailwindcss-animate`, `clsx`, `tailwind-merge` as additional deps required by shadcn setup.
- Full directory structure created with all placeholder files as spec'd.

### File List

- `package.json`
- `tsconfig.json`
- `tsconfig.server.json`
- `vite.config.ts`
- `tailwind.config.ts`
- `postcss.config.js`
- `components.json`
- `index.html`
- `.gitignore`
- `.env.example`
- `.env`
- `server/index.ts`
- `server/db.ts`
- `server/db.seed.ts`
- `server/middleware/auth.ts`
- `server/middleware/rateLimit.ts`
- `server/schemas/demo.schema.ts`
- `server/schemas/contact.schema.ts`
- `server/dao/leads.dao.ts`
- `server/dao/contacts.dao.ts`
- `server/dao/team.dao.ts`
- `server/dao/admin.dao.ts`
- `server/routes/demo.ts`
- `server/routes/contact.ts`
- `server/routes/admin/auth.ts`
- `server/routes/admin/leads.ts`
- `server/routes/admin/contacts.ts`
- `server/routes/admin/team.ts`
- `server/lib/mailer.ts`
- `src/vite-env.d.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/lib/utils.ts`
- `src/lib/api.ts`
- `src/i18n/index.ts`
- `src/i18n/LanguageSwitcher.tsx`
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/pt-BR/translation.json`
- `src/i18n/locales/es/translation.json`
- `src/store/useModalStore.ts`
- `src/store/useLocaleStore.ts`
- `src/store/useAdminStore.ts`
- `src/hooks/useDemo.ts`
- `src/hooks/useContact.ts`
- `src/hooks/useAdmin.ts`
- `src/components/layout/Navbar.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/AdminLayout.tsx`
- `src/components/sections/Hero.tsx`
- `src/components/sections/SyncRevenue.tsx`
- `src/components/sections/Services.tsx`
- `src/components/sections/Comparison.tsx`
- `src/components/sections/Team.tsx`
- `src/components/sections/DemoScheduler.tsx`
- `src/components/sections/Contact.tsx`
- `src/components/sections/Security.tsx`
- `src/components/sections/ClientReferences.tsx`
- `src/components/sections/DemoForm.tsx`
- `src/components/sections/SectionSkeleton.tsx`
- `src/pages/Home.tsx`
- `src/pages/Privacy.tsx`
- `src/pages/admin/Login.tsx`
- `src/pages/admin/Dashboard.tsx`
- `src/pages/admin/Leads.tsx`
- `src/pages/admin/Team.tsx`

## Change Log

- 2026-05-14: Story 1.1 implemented — full project scaffold, all deps, tooling, directory structure, and build verified (claude-sonnet-4-6)
- 2026-05-14: Code review completed — 3-layer adversarial review (Blind Hunter + Edge Case Hunter + Acceptance Auditor). 1 decision-needed, 14 patch, 1 defer, 20 dismissed.

### Review Findings

- [x] [Review][Patch] Add comment block to `.env.example` documenting that non-secret defaults (PORT, DB_PATH, SMTP_PORT, ALLOWED_ORIGIN) are for dev convenience [.env.example:1-9]

- [x] [Review][Patch] Move `concurrently` and `tsx` from `dependencies` to `devDependencies` [package.json:20,24]
- [x] [Review][Patch] Pin `@types/react` and `@types/react-dom` to `^18.x` to match `react@^18.3.1` runtime [package.json:40-41]
- [x] [Review][Patch] Wrap `new Database(dbPath)` in try/catch with error logging [server/db.ts:13]
- [x] [Review][Patch] Remove `fs.existsSync` guard; `mkdirSync({ recursive: true })` already handles existing dirs and avoids TOCTOU race [server/db.ts:9-11]
- [x] [Review][Patch] Add graceful shutdown handler (SIGTERM/SIGINT) that calls `db.close()` before exit [server/index.ts:13-14]
- [x] [Review][Patch] Check `db.pragma('journal_mode = WAL')` return value; warn if journal_mode is not 'wal' [server/db.ts:14]
- [x] [Review][Patch] Add `--kill-others-on-fail` to `concurrently` in dev script to prevent orphaned Vite when tsx crashes [package.json:9]
- [x] [Review][Patch] Replace `document.getElementById('root')!` with null-check that throws descriptive error [src/main.tsx:8]
- [x] [Review][Patch] Remove dead Tailwind content paths (`./pages/**`, `./components/**`, `./app/**`) — only `./src/**` needed [tailwind.config.ts:5-8]
- [x] [Review][Patch] Add `*.log`, `.env.*`, `.DS_Store`, `Thumbs.db` to `.gitignore` [.gitignore:1-5]
- [x] [Review][Patch] Replace `require('tailwindcss-animate')` with `import` in `tailwind.config.ts` [tailwind.config.ts:80]
- [x] [Review][Patch] Resolve `DB_PATH` relative to `__dirname` instead of CWD [server/db.ts:5]
- [x] [Review][Patch] Add `'error'` listener on `app.listen()` for `EADDRINUSE` [server/index.ts:13]
- [x] [Review][Patch] Add comment above `ignoreDeprecations: "6.0"` noting it silences `baseUrl` deprecation only [tsconfig.json:15]
- [x] [Review][Patch] Support nullable `document.getElementById` return in `src/vite-env.d.ts` or handle in `main.tsx` [src/main.tsx:8]

- [x] [Review][Defer] Add `secure: false` to Vite proxy config for potential dev TLS — not needed until TLS enabled, revisit with Story 5.2 [vite.config.ts:14-16]
