# Frontend Module

**Stack:** Vite + React 18 + TypeScript (strict) + Tailwind CSS v3 + shadcn/ui
**Entry:** `src/main.tsx` → `src/App.tsx`

---

## Pages

| File | Route | Description |
|---|---|---|
| `src/pages/Home.tsx` | `/` | Public landing page — 7 lazy sections (Hero→SyncRevenue→Comparison→Security→ClientReferences→DemoScheduler→Contact) |
| `src/pages/Privacy.tsx` | `/privacy` | Privacy policy — all content from `privacy.*` i18n keys |
| `src/pages/admin/Login.tsx` | `/admin/login` | Admin login (stub) |
| `src/pages/admin/Dashboard.tsx` | `/admin/dashboard` | Admin dashboard (stub) |
| `src/pages/admin/Leads.tsx` | `/admin/leads` | Admin leads (stub) |
| `src/pages/admin/Team.tsx` | `/admin/team` | Admin team (stub) |

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

## Layout Components

| File | Description |
|---|---|
| `src/components/layout/Navbar.tsx` | Sticky fixed nav (`z-50 bg-brand-navy`); desktop: logo + anchor links + LanguageSwitcher + Demo CTA (button `onClick`); mobile: hamburger overlay + Escape/click-to-close + body scroll lock; `aria-expanded` on toggle; `Navbar.test.tsx` co-located (4 tests) |
| `src/components/layout/Footer.tsx` | Block-flow footer; company address, copyright, anchor nav links, Privacy `<Link>`, `<LanguageSwitcher />` |
| `src/components/layout/AdminLayout.tsx` | Shell with `<Outlet />` — no auth guard (deferred to future epic) |

## Shared Components

| File | Description |
|---|---|
| `src/components/sections/SectionSkeleton.tsx` | Suspense fallback — `motion-safe:animate-pulse bg-muted`, height via `className`; `role="status" aria-busy="true"` |
| `src/components/ui/GradientButton.tsx` | Brand CTA button — gradient bg, 3 sizes (lg/md/sm), disabled clears gradient; `motion-safe:active:scale-[0.98]` |
| `src/components/ui/SectionHeader.tsx` | Section header — eyebrow + h2 + optional subtext, light/dark variant |
| `src/components/ui/` | shadcn/ui primitives (generated per story) |

---

## Key Patterns

- Sections lazy-loaded via `React.lazy` + `Suspense` + `ErrorBoundary` (`src/components/ErrorBoundary.tsx`) — chunk failure shows fallback, not white screen
- Nav links to in-page sections: `<a href="/#section-id">` (NOT React Router `<Link>`) — smooth scroll via CSS `scroll-behavior: smooth`
- Nav links to routes: `<Link to="/route">` (React Router)
- Skip link: first DOM element in App.tsx; `sr-only focus:not-sr-only`; targets `<main id="main-content">`
- `<main id="main-content" className="pt-16">` — `pt-16` offsets 64px fixed Navbar
- Locale sourced from `useLocaleStore` — never directly from i18next
- Form state: `'idle' | 'submitting' | 'success' | 'error'` — see [[Architecture-Key]]

---

## Status

| Story | Files Implemented |
|---|---|
| 1.1 | src/main.tsx, src/App.tsx, src/index.css, src/vite-env.d.ts, src/lib/utils.ts, all stub components/pages |
| 1.2 | src/components/ui/GradientButton.tsx, src/components/ui/SectionHeader.tsx, src/components/sections/SectionSkeleton.tsx, tailwind.config.ts, src/index.css |
| 1.4 | src/App.tsx (route tree + skip link + `/admin` index redirect), src/components/layout/Navbar.tsx + Navbar.test.tsx, src/components/layout/Footer.tsx (dynamic copyright), src/components/layout/AdminLayout.tsx, src/pages/Home.tsx (ErrorBoundary per section), src/pages/Privacy.tsx (i18n defaultValues), src/index.css (smooth scroll), src/components/ErrorBoundary.tsx (new) |
