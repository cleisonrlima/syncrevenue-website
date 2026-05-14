# Tech Stack & Folder Structure

## Frontend

| Layer | Choice |
|---|---|
| Build | Vite + React 18 + TypeScript (strict) |
| Styles | Tailwind CSS v3 |
| UI components | shadcn/ui (Button, Dialog, Form, Input, Select, Textarea, Toast, Badge, Card, Table, Skeleton, Separator, DropdownMenu) |
| Validation | Zod (client + server) |
| State | Zustand — `useModalStore`, `useLocaleStore`, `useAdminStore` |
| i18n | i18next + react-i18next + i18next-browser-languagedetector |
| Path alias | `@/` → `src/` |

## Backend (embedded monorepo)

| Layer | Choice |
|---|---|
| Server | Express (via Vite plugin dev / standalone prod) |
| DB | better-sqlite3 (SQLite, zero-config) |
| Auth | jsonwebtoken (stateless JWT) |
| Password | bcryptjs (salt rounds ≥ 12) |
| Email | nodemailer / SMTP |
| Config | dotenv + Vite env (NO `VITE_` prefix for secrets) |

## Dev Tooling

- `concurrently` — runs `vite` + `tsx watch server/index.ts`
- Build: `tsc && vite build` → `node dist/server/index.js`
- DB seed: `tsx server/db.seed.ts`

## Canonical Folder Structure

```
sync-sirius/
├── .env / .env.example
├── vite.config.ts / tailwind.config.ts / tsconfig.json
├── server/
│   ├── index.ts / db.ts
│   ├── middleware/        auth.ts, rateLimit.ts
│   └── routes/            demo.ts, contact.ts, admin/auth.ts, admin/leads.ts, admin/team.ts
├── src/
│   ├── components/        ui/, sections/, admin/, shared/
│   ├── stores/            useModalStore.ts, useLocaleStore.ts, useAdminStore.ts
│   ├── i18n/              en/, pt-BR/, es/ (one file per locale)
│   ├── hooks/
│   ├── lib/               utils.ts, validators.ts
│   └── pages/             Index.tsx, Admin.tsx, PrivacyPolicy.tsx
└── public/
```

## Locales

Supported: `en`, `pt-BR`, `es` — all required Phase 1.
Detection order: localStorage → browser → fallback `en`.
Locale stored on every lead submission.
