# Frontend Module

**Stack:** Vite + React 18 + TypeScript (strict) + Tailwind CSS v3 + shadcn/ui
**Entry:** `src/main.tsx` → `src/App.tsx`

---

## Pages

| File | Route | Description |
|---|---|---|
| `src/pages/Index.tsx` | `/` | Public landing page — all sections |
| `src/pages/Admin.tsx` | `/admin/*` | Admin panel shell |
| `src/pages/PrivacyPolicy.tsx` | `/privacy` | Privacy policy (3 locales) |

---

## Sections (public landing page)

| Component | FR | Description |
|---|---|---|
| `src/components/sections/Hero.tsx` | FR1 | Value prop + primary CTA |
| `src/components/sections/SyncRevenue.tsx` | FR2 | Product description |
| `src/components/sections/Services.tsx` | FR3 | Full portfolio |
| `src/components/sections/Comparison.tsx` | FR4 | vs. alternatives |
| `src/components/sections/Team.tsx` | FR5 | Team members |
| `src/components/sections/Contact.tsx` | FR6 | Contact form section |
| `src/components/sections/Security.tsx` | FR23–FR25 | Security statement + client refs |
| `src/components/sections/DemoScheduler.tsx` | FR9, FR15 | Demo request form + CTA anchor |

---

## Shared Components

| File | Description |
|---|---|
| `src/components/shared/Navbar.tsx` | Persistent nav, language switcher |
| `src/components/shared/Footer.tsx` | Address, copyright, links |
| `src/components/shared/SectionSkeleton.tsx` | Suspense fallback |
| `src/components/ui/` | shadcn/ui primitives (generated) |

---

## Admin Components

| File | Description |
|---|---|
| `src/components/admin/AdminLayout.tsx` | Admin shell + nav |
| `src/components/admin/LeadsTable.tsx` | Leads list + filters |
| `src/components/admin/TeamManager.tsx` | Team CRUD |

---

## Hooks

| File | Description |
|---|---|
| `src/hooks/useDemo.ts` | Demo form state machine |
| `src/hooks/useContact.ts` | Contact form state machine |
| `src/hooks/useAdmin.ts` | Admin data fetching |

---

## Key Patterns

- Sections lazy-loaded via `React.lazy` + `Suspense`
- Form state: `'idle' | 'submitting' | 'success' | 'error'` — see [[Architecture-Key]]
- Locale sourced from `useLocaleStore` — never directly from i18next
- shadcn `<FormMessage>` for all validation errors — never toast

---

## Status

> Fill as stories complete

| Story | Files Created |
|---|---|
| 1.1 | src/main.tsx, src/App.tsx, src/index.css, src/vite-env.d.ts, src/lib/utils.ts, all placeholder components/pages |
| 1.2 | — |
