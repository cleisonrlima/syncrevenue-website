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
- **Epic 1 — DONE (11/11 stories) + retrospective complete** (Jira: SYN-1 closed; all stories Done in SYN Sprint 1)
  - 1.1 Project Initialization & Dev Environment
  - 1.2 Design System Foundation (brand tokens, GradientButton, SectionHeader, SectionSkeleton)
  - 1.3 i18n & Language Infrastructure (Vitest, useLocaleStore, i18next, LanguageSwitcher; EN/PT-BR/ES full parity)
  - 1.4 App Shell, Routing & Navigation (sticky Navbar, mobile overlay, ErrorBoundary, skip link, Footer)
  - 1.5 Hero Section (StatRow, TrustBar, dual CTAs, motion-safe)
  - 1.6 SyncRevenue & Services Sections (light-bg rhythm, eyebrow override pattern)
  - 1.7 Comparison Section (semantic table, mobile horizontal scroll, no competitor names)
  - 1.8 Team Section (i18n array contract, placeholder photo handling)
  - 1.9 Security & ClientReferences (user-authorized placeholder agency names — swap before prod)
  - 1.10 Privacy Policy Page (`/privacy`, in-place locale switch, LGPD/CCPA, 24-month retention disclosure)
  - 1.11 Test Infrastructure Baseline (Epic 1 gap closure — Playwright, Lighthouse CI, axe, R-A2/R-B1 locks)
- Retrospective: `_bmad-output/implementation-artifacts/epic-1-retro-2026-05-15.md`
- Active phase: **Epic 2 (Phase 1 MVP Part B)** — backend infrastructure, forms, SMTP, security hardening
- **Active Jira sprint:** SYN Sprint 2 (id 302), 2026-05-15 → 2026-06-11. Story 2.1 in review; 2.2–2.7 still To Do.
- Story 2.1 (Backend Infrastructure) → **review**: 4-table schema init, typed DAOs, full middleware stack (helmet/cors/rate-limit/JWT cookie auth), strict Zod schemas, fire-and-forget Nodemailer.
- Quality: **156/156 tests pass** (+57 server tests from Story 2.1); `tsc --noEmit` → 0 errors
- Test Design Epic 1 artifact: `_bmad-output/test-artifacts/test-design/test-design-epic-1.md` (27 risks, 56-scenario gap plan)
- New tooling: Playwright + @axe-core/playwright + @lhci/cli installed. Scaffold under `tests/e2e/` + `lighthouserc*.json` + `.github/workflows/quality.yml`. Run `npm run test:e2e:install` once locally before `npm run test:e2e`.
- Known carry-forward debt (must address):
  - ClientReferences placeholder agency content — **now gated** by `vault/Planning/client-references-allowlist.md` + `ClientReferences.allowlist.test.tsx` (R-B1). Swap markers before production deploy.
  - GradientButton lacks `loading`/`async-disabled` state — Story 2.2 will need it
  - ~~DB tables not yet created (`server/db.ts` opens connection only) — Story 2.1 deliverable~~ ✓ landed in Story 2.1
  - 24-month retention deletion automation undocumented — assign in Story 2.1 or 5.x
  - WCAG R-A2 waiver: Electric Blue `#0075F0` is large-text only on light bg — locked in `src/lib/brand-tokens.contrast.test.ts` and `vault/Planning/Architecture-Key.md`
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
