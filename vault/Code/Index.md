# Codebase Map — Index

> Updated after every commit. Reflects actual file tree.

**Status:** Story 1.1 complete — scaffold in place, all placeholders created

---

## Modules

| Module | Note | Responsibility |
|---|---|---|
| Frontend | [[Frontend]] | React components, sections, pages, routing |
| Backend | [[Backend]] | Express server, routes, middleware |
| Database | [[Database]] | Schema, DAOs, migrations, seed |
| i18n | [[i18n]] | Locale files, language detection, store |
| Admin | [[Admin]] | Admin panel — auth, leads dashboard, team management |
| Stores | [[Stores]] | Zustand stores (modal, locale, admin) |
| Config | [[Config]] | vite.config, tailwind, tsconfig, env |

---

## File Tree (Story 1.1)

```
syncrevenue-website/
├── package.json                    — scripts, deps (React 18, Vite 5, Express 4, etc.)
├── tsconfig.json                   — base TS config (strict, @/ alias, noEmit)
├── tsconfig.server.json            — server TS config (CommonJS, outDir: dist/server)
├── vite.config.ts                  — Vite 5 config (@/ alias, port 5173, /api proxy)
├── tailwind.config.ts              — Tailwind v3 + shadcn CSS variable preset
├── postcss.config.js               — PostCSS with tailwindcss + autoprefixer
├── components.json                 — shadcn/ui config (slate, CSS vars, @/ aliases)
├── index.html                      — Vite entry HTML
├── .gitignore                      — ignores node_modules, dist, data/, .env, *.db
├── .env.example                    — all required keys, no real values
├── server/
│   ├── index.ts                    — Express app + /api/health + db import
│   ├── db.ts                       — better-sqlite3 connection, WAL pragma, no schema
│   ├── db.seed.ts                  — placeholder (Story 4.1)
│   ├── middleware/auth.ts          — placeholder (Story 4.1)
│   ├── middleware/rateLimit.ts     — placeholder (Story 2.1)
│   ├── schemas/demo.schema.ts      — placeholder (Story 2.1)
│   ├── schemas/contact.schema.ts   — placeholder (Story 2.1)
│   ├── dao/leads.dao.ts            — placeholder (Story 2.1)
│   ├── dao/contacts.dao.ts         — placeholder (Story 2.1)
│   ├── dao/team.dao.ts             — placeholder (Story 4.4)
│   ├── dao/admin.dao.ts            — placeholder (Story 4.1)
│   ├── routes/demo.ts              — placeholder (Story 2.2)
│   ├── routes/contact.ts           — placeholder (Story 2.3)
│   ├── routes/admin/auth.ts        — placeholder (Story 4.1)
│   ├── routes/admin/leads.ts       — placeholder (Story 4.2)
│   ├── routes/admin/contacts.ts    — placeholder (Story 4.2)
│   ├── routes/admin/team.ts        — placeholder (Story 4.4)
│   └── lib/mailer.ts               — placeholder (Story 2.5)
└── src/
    ├── main.tsx                    — React 18 createRoot + BrowserRouter
    ├── App.tsx                     — minimal Routes with "/" placeholder
    ├── index.css                   — Tailwind directives + shadcn CSS vars (slate)
    ├── vite-env.d.ts               — Vite client type reference
    ├── lib/utils.ts                — cn() utility (clsx + tailwind-merge)
    ├── lib/api.ts                  — placeholder (Story 2.2)
    ├── i18n/index.ts               — placeholder (Story 1.3)
    ├── i18n/LanguageSwitcher.tsx   — placeholder (Story 1.3)
    ├── i18n/locales/en/translation.json    — placeholder
    ├── i18n/locales/pt-BR/translation.json — placeholder
    ├── i18n/locales/es/translation.json    — placeholder
    ├── store/useModalStore.ts      — placeholder (Story 2.4)
    ├── store/useLocaleStore.ts     — placeholder (Story 1.3)
    ├── store/useAdminStore.ts      — placeholder (Story 4.1)
    ├── hooks/useDemo.ts            — placeholder (Story 2.2)
    ├── hooks/useContact.ts         — placeholder (Story 2.3)
    ├── hooks/useAdmin.ts           — placeholder (Story 4.1)
    ├── components/ui/              — shadcn components (populated per story)
    ├── components/layout/Navbar.tsx    — placeholder (Story 1.4)
    ├── components/layout/Footer.tsx    — placeholder (Story 1.4)
    ├── components/layout/AdminLayout.tsx — placeholder (Story 4.6)
    ├── components/sections/Hero.tsx    — placeholder (Story 1.5)
    ├── components/sections/SyncRevenue.tsx — placeholder (Story 1.6)
    ├── components/sections/Services.tsx   — placeholder (Story 1.6)
    ├── components/sections/Comparison.tsx — placeholder (Story 1.7)
    ├── components/sections/Team.tsx       — placeholder (Story 1.8)
    ├── components/sections/DemoScheduler.tsx — placeholder (Story 2.4)
    ├── components/sections/Contact.tsx    — placeholder (Story 2.3)
    ├── components/sections/Security.tsx   — placeholder (Story 1.9)
    ├── components/sections/ClientReferences.tsx — placeholder (Story 1.9)
    ├── components/sections/DemoForm.tsx   — placeholder (Story 2.2)
    ├── components/sections/SectionSkeleton.tsx — placeholder (Story 1.2)
    ├── pages/Home.tsx              — placeholder (Story 1.4)
    ├── pages/Privacy.tsx           — placeholder (Story 1.10)
    ├── pages/admin/Login.tsx       — placeholder (Story 4.1)
    ├── pages/admin/Dashboard.tsx   — placeholder (Story 4.6)
    ├── pages/admin/Leads.tsx       — placeholder (Story 4.2)
    └── pages/admin/Team.tsx        — placeholder (Story 4.4)
```

---

## Cross-Module Dependencies

```
src/main.tsx → src/App.tsx → react-router-dom
server/index.ts → server/db.ts → better-sqlite3
src/lib/utils.ts → clsx, tailwind-merge
```
