# Codebase Map — Index

> Updated after every commit. Reflects actual file tree.

**Status:** Epic 1 complete (10/10 stories done + retrospective). Epic 2 complete. Epic 3 complete. Epic 6 in-progress: Stories 6.9 and 6.10 now done after review closure; shared form primitives, demo grid/form restyle, GDS enum reconciliation, hardened DB migration, and demo/a11y Playwright coverage are current.

**New since Story 1.4:**
- Section components implemented (no longer placeholders): `Hero.tsx`, `SyncRevenue.tsx`, `Services.tsx`, `Comparison.tsx`, `Team.tsx`, `Security.tsx`, `ClientReferences.tsx` + `StatRow.tsx`, `TrustBar.tsx`
- Privacy page implemented: `pages/Privacy.tsx` + tests
- 404 page: `pages/NotFound.tsx`
- Test files added: `Hero.test.tsx`, `SyncRevenue.test.tsx`, `Services.test.tsx`, `Comparison.test.tsx`, `Team.test.tsx`, `Security.test.tsx`, `ClientReferences.test.tsx`, `Sections.i18n.test.tsx`, `Story16.responsive.test.tsx`, `Home.test.tsx`, `Home.story-1-6.e2e.test.tsx`, `Home.story-1-7.e2e.test.tsx`, `Home.story-1-8.e2e.test.tsx`, `Home.story-1-9.e2e.test.tsx`, `Privacy.test.tsx`, `Privacy.story-1-10.e2e.test.tsx`
- Total: 20 test files, 87/87 tests pass

**New since Epic 1 retrospective (Test Design Epic 1 gap closure, 2026-05-15):**
- Test artifacts: `_bmad-output/test-artifacts/test-design/test-design-epic-1.md` (full risk + coverage plan)
- New unit tests: `src/i18n/index.test.ts` deep-key parity (+2), `src/lib/brand-tokens.contrast.test.ts` R-A2 lock (+6), `src/components/sections/ClientReferences.allowlist.test.tsx` R-B1 (+4). Total: 22 files, **99/99 pass**.
- Playwright real-browser e2e scaffold under `tests/e2e/` (smoke, axe a11y, mobile overlay, locale switch, skip link, hero/navbar visual refresh). Run `npm run test:e2e:install` then `npm run test:e2e`.
- Lighthouse CI configs: `lighthouserc.json` (desktop), `lighthouserc.mobile.json`. Run `npm run lhci` or `npm run lhci:mobile`.
- GitHub Actions: `.github/workflows/quality.yml` — unit + Playwright + Lighthouse CI on PR/push to master.
- Vault: `vault/Planning/client-references-allowlist.md` (R-B1 single source of truth).

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
| Patterns | [[Code/Patterns-Gallery]] | Canonical patterns catalog + anti-patterns counter-examples |

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
    ├── main.tsx                    — React 18 createRoot + BrowserRouter + i18n import + Zustand locale sync
    ├── App.tsx                     — full route tree: /, /privacy, /admin/*; skip link + <main id="main-content"> (Story 1.4 ✓)
    ├── index.css                   — Tailwind directives + shadcn CSS vars (slate) + scroll-behavior: smooth (Story 1.4 ✓)
    ├── vite-env.d.ts               — Vite client type reference
    ├── lib/utils.ts                — cn() utility (clsx + tailwind-merge)
    ├── lib/api.ts                  — placeholder (Story 2.2)
    ├── i18n/index.ts               — i18next init (LanguageDetector, react-i18next, bundled resources) ✓
    ├── i18n/index.test.ts          — supportedLngs, fallback, 11-key checks ✓
    ├── i18n/LanguageSwitcher.tsx   — EN/PT-BR/ES button group, locale change flow ✓
    ├── i18n/LanguageSwitcher.test.tsx — render, aria-current, click flow tests ✓
    ├── i18n/locales/en/translation.json    — EN strings (11 namespaces) ✓
    ├── i18n/locales/pt-BR/translation.json — PT-BR strings ✓
    ├── i18n/locales/es/translation.json    — ES strings ✓
    ├── test/setup.ts               — @testing-library/jest-dom import ✓
    ├── store/useModalStore.ts      — placeholder (Story 2.4)
    ├── store/useLocaleStore.ts     — Locale type + Zustand store (locale, changeLocale) ✓
    ├── store/useLocaleStore.test.ts — init, changeLocale, setState tests ✓
    ├── store/useAdminStore.ts      — placeholder (Story 4.1)
    ├── hooks/useDemo.ts            — placeholder (Story 2.2)
    ├── hooks/useContact.ts         — placeholder (Story 2.3)
    ├── hooks/useAdmin.ts           — placeholder (Story 4.1)
    ├── components/ui/GradientButton.tsx    — brand CTA button (Story 1.2 ✓)
    ├── components/ui/SectionHeader.tsx     — eyebrow+heading+subtext (Story 1.2 ✓)
    ├── components/ui/              — shadcn components (populated per story)
    ├── components/ErrorBoundary.tsx        — class ErrorBoundary for lazy section crash isolation (Story 1.4 ✓)
    ├── components/layout/Navbar.tsx    — sticky nav + mobile hamburger overlay + body scroll lock + a11y (Story 1.4 ✓)
    ├── components/layout/Navbar.test.tsx — 4 tests: toggle, Escape close, aria-expanded, overlay link click (Story 1.4 ✓)
    ├── components/layout/Footer.tsx    — footer: address, dynamic copyright, nav links, Privacy link, LanguageSwitcher (Story 1.4 ✓)
    ├── components/layout/AdminLayout.tsx — shell with <Outlet />, no auth guard (Story 1.4 ✓)
    ├── components/sections/Hero.tsx    — placeholder (Story 1.5)
    ├── components/sections/SyncRevenue.tsx — placeholder (Story 1.6)
    ├── components/sections/Services.tsx   — placeholder (Story 1.6)
    ├── components/sections/Comparison.tsx — placeholder (Story 1.7)
    ├── components/sections/Team.tsx       — API-backed team cards + composed alt + optional LinkedIn + experience meta (Story 1.8 → 3.1 → 6.7 ✓)
    ├── components/sections/DemoScheduler.tsx — placeholder (Story 2.4)
    ├── components/sections/Contact.tsx    — placeholder (Story 2.3)
    ├── components/sections/Security.tsx   — placeholder (Story 1.9)
    ├── components/sections/ClientReferences.tsx — placeholder (Story 1.9)
    ├── components/sections/DemoForm.tsx   — placeholder (Story 2.2)
    ├── components/sections/SectionSkeleton.tsx — Suspense fallback (Story 1.2 ✓)
    ├── pages/Home.tsx              — 7 lazy sections via React.lazy + Suspense + ErrorBoundary + SectionSkeleton (Story 1.4 ✓)
    ├── pages/Privacy.tsx           — i18n-driven privacy page, all privacy.* keys (Story 1.4 ✓)
    ├── pages/admin/Login.tsx       — placeholder (Story 4.1)
    ├── pages/admin/Dashboard.tsx   — placeholder (Story 4.6)
    ├── pages/admin/Leads.tsx       — placeholder (Story 4.2)
    └── pages/admin/Team.tsx        — team CRUD including localized experience meta fields (Story 4.4 → 6.7 ✓)
```

---

## Cross-Module Dependencies

```
src/main.tsx → src/App.tsx → react-router-dom
server/index.ts → server/db.ts → better-sqlite3
src/lib/utils.ts → clsx, tailwind-merge
```
