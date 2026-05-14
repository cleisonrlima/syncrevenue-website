# Config Module

---

## Root Config Files

| File | Purpose |
|---|---|
| `vite.config.ts` | Vite + Express plugin (dev), path alias `@/` → `src/`; Vitest config (globals, jsdom, setupFiles) — imports `defineConfig` from `vitest/config` |
| `tailwind.config.ts` | Tailwind v3 config |
| `tsconfig.json` | TypeScript strict mode |
| `.env` | Secrets — never `VITE_` prefix for server secrets |
| `.env.example` | Template for required vars |

---

## Environment Variables

| Var | Used by | Notes |
|---|---|---|
| `PORT` | server | Express port |
| `JWT_SECRET` | auth middleware | Long random string |
| `SMTP_HOST` | nodemailer | Mail server |
| `SMTP_PORT` | nodemailer | |
| `SMTP_USER` | nodemailer | |
| `SMTP_PASS` | nodemailer | |
| `SMTP_TO` | nodemailer | Notification recipient |
| `ADMIN_EMAIL` | db.seed | Initial admin email |
| `ADMIN_PASSWORD` | db.seed | Initial admin password |

**Rule:** No `VITE_` prefix on secrets — Vite exposes those to the browser bundle.

---

## Dev vs Prod

| Context | Command |
|---|---|
| Dev | `concurrently "vite" "tsx watch server/index.ts"` |
| Build | `tsc && vite build` |
| Prod | `node dist/server/index.js` |
| Seed | `tsx server/db.seed.ts` |

---

## Notes (Story 1.1)

- `react-i18next` pinned to `@14` (latest v17 requires i18next@>=26, spec says i18next@23)
- `@vitejs/plugin-react` pinned to `@4` (latest v6 requires Vite 8)
- `shadcn@latest init` CLI changed in v4.7 — `components.json`, `tailwind.config.ts`, `src/lib/utils.ts` created manually
- `tsconfig.json` has `"ignoreDeprecations": "6.0"` for TS 6.x `baseUrl`
- `tsconfig.server.json` has explicit `"rootDir": "server"` for clean dist output

## Status

| Story | Files Created |
|---|---|
| 1.1 | package.json, tsconfig.json, tsconfig.server.json, vite.config.ts, tailwind.config.ts, postcss.config.js, components.json, index.html, .gitignore, .env.example |
| 1.3 ✓ | vite.config.ts updated (vitest/config import + test block); package.json updated (test + test:run scripts + devDeps); src/test/setup.ts created |
