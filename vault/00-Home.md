# SyncRevenue Website — Project Home

**Company:** Sync Sirius, Inc. — Miami, FL
**Product:** SyncRevenue — commission management platform for travel agencies
**Site goal:** Lead gen (demo requests) + brand positioning. NOT a product portal.
**Primary CTA:** Demo request form. Secondary: contact form.

---

## Quick Navigation

| Topic | Vault Note | Source Doc |
|---|---|---|
| Tech stack & folder structure | [[Planning/Stack]] | `_bmad-output/planning-artifacts/product-brief-syncrevenue-website-distillate.md` |
| Architecture decisions | [[Planning/Architecture-Key]] | `_bmad-output/planning-artifacts/architecture.md` |
| Epics & story status | [[Planning/Epics-Index]] | `_bmad-output/planning-artifacts/epics.md` |
| Full PRD | — | `_bmad-output/planning-artifacts/prd.md` |
| UX spec | — | `_bmad-output/planning-artifacts/ux-design-specification.md` |
| Individual stories | `docs/stories/` | reference path only |
| **Codebase map** | [[Code/Index]] | live file tree |
| Frontend components | [[Code/Frontend]] | — |
| Backend / API | [[Code/Backend]] | — |
| Database schema + DAOs | [[Code/Database]] | — |
| i18n / locales | [[Code/i18n]] | — |
| Zustand stores | [[Code/Stores]] | — |
| Admin panel (Phase 3) | [[Code/Admin]] | — |
| Config / env / tooling | [[Code/Config]] | — |

---

## Project Status (2026-05-15)

- Planning complete (PRD, Architecture, UX, Epics all green)
- Story 1.1 **done** — scaffold verified; post-review fixes: DB open failure exits process, graceful shutdown 10s cap, `.env.example` `DB_PATH` aligned with server cwd
- Story 1.2 **done** — design system foundation: brand tokens, GradientButton, SectionHeader, SectionSkeleton, Plus Jakarta Sans font; review patches applied: h1 base typography, motion-safe guards, ARIA loading state
- Story 1.3 **done** — i18n infrastructure: Vitest setup, useLocaleStore, i18next init (EN/PT-BR/ES), LanguageSwitcher, main.tsx sync; 12 tests passing; review patch: localStorage.setItem guarded with try/catch for private browsing/quota errors
- Story 1.4 **done** — App shell, routing & navigation + all review patches: fixed `<a><button>` nesting, `/admin` index redirect, dynamic copyright year, body scroll lock, i18n defaultValues, ErrorBoundary for lazy sections, SSR guard, SVG titles, overlay nav link test; 16 tests pass, typecheck clean
- Story 1.5 **done** — Hero section: StatRow (4 stats), TrustBar (5 logos), dual CTAs, motion-safe variants; review fixes applied (ba5e1c7)
- Active phase: **Epic 1 (Phase 1 MVP Part A)** — Story 1.6 (SyncRevenue + Services sections) **in progress** (codex dev session running)
- `tsc --noEmit` → 0 errors; `npm run build` → `dist/client/` + `dist/server/` clean
- **GitHub synced** — https://github.com/xillinha/syncrevenue-website (private repo)

---

## Target Market

- **Geography:** Americas — US (primary), Brazil, Latin America
- **Segment:** Mid-market to enterprise travel agencies and TMCs
- **Buyer:** Agency owner / CEO / CFO
- **User:** Back-office manager / ticketing supervisor
- **Languages:** EN (default), PT-BR, ES — all three active Phase 1

---

## Key Rules (read before any implementation)

- Read [[Planning/Stack]] before any code work — canonical folder structure is defined there
- Read [[Planning/Architecture-Key]] before any backend or auth work
- Read [[Code/Index]] to orient in the codebase (once implementation starts)
- Stories live in `docs/stories/` — reference path only, don't dump content in chat
- Source of truth for FRs: `_bmad-output/planning-artifacts/epics.md`

## Vault Update Protocol

After every story step → update [[Planning/Epics-Index]] status + relevant [[Code/]] note.
After every commit → update this file's Project Status + [[Code/Index]] file tree.
