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
| Sandbox conventions | [[Planning/Sandbox-Conventions]] | — |
| Epics & story status | [[Planning/Epics-Index]] | `_bmad-output/planning-artifacts/epics.md` |
| Full PRD | — | `_bmad-output/planning-artifacts/prd.md` |
| UX spec | — | `_bmad-output/planning-artifacts/ux-design-specification.md` |
| Individual stories | `docs/stories/` | reference path only |
| **Codebase map** | [[Code/Index]] | live file tree |
| Canonical patterns gallery | [[Code/Patterns-Gallery]] | — |
| Frontend components | [[Code/Frontend]] | — |
| Backend / API | [[Code/Backend]] | — |
| Database schema + DAOs | [[Code/Database]] | — |
| i18n / locales | [[Code/i18n]] | — |
| Zustand stores | [[Code/Stores]] | — |
| Admin panel (Phase 3) | [[Code/Admin]] | — |
| Config / env / tooling | [[Code/Config]] | — |

---

## Project Status (2026-05-19)

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
- **Epic 2 — DONE (7/7 stories) + retrospective complete** (Jira: SYN-2 ready to close; SYN Sprint 2 stories 16..22 all Done)
  - 2.1 Backend Infrastructure (4-table schema, DAOs, middleware, mailer)
  - 2.2 Demo Form full stack (api.ts envelope, useRef submit guard, custom Toast)
  - 2.3 Contact Form full stack (subject enum tightening, native `required`)
  - 2.4 DemoScheduler + multi-CTA convergence (`DemoFormHandle.focusFirstField()` imperative handle, single-form invariant)
  - 2.5 SMTP Notification (fire-and-forget, em-dash subjects)
  - 2.6 Form Accessibility & Locale-Aware Validation (`createDemoSchema(t)` / `createContactSchema(t)` factories)
  - 2.7 Security Hardening (per-route `createFormRateLimiter()`, exact 429 body, build-output secret scan)
- Retrospective: `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md`
- **Epic 5 (Phase 4) started 2026-05-19** — Story 5.1 (Production Build & PM2) complete → review. `ecosystem.config.js` committed; `staticCacheHeaders` middleware wired into `express.static`; 732 tests pass.
- Active phase: **Epic 4 (Phase 3) + Epic 5 (Phase 4)** — Story 4.1 done 2026-05-16. Story 4.2 done 2026-05-16. Story 4.7 done 2026-05-16. Story 4.8 done 2026-05-17. Story 4.3 done 2026-05-17. Story 4.4 review 2026-05-17. **Stories 4.5 + 4.6 review 2026-05-19** — 4.5 adds PATCH `/api/admin/team/:id/active` + frontend per-row toggle with optimistic update + revert + per-row `role="alert"` + E2E `tests/e2e/admin-team.spec.ts` toggle scenarios; 4.6 adds GET `/api/admin/dashboard/stats` (new `server/routes/admin/dashboard.ts` + `leadsDao.countStats()` transaction over 4 prepared counts), `src/lib/api.ts` `getAdminDashboardStats` + `AdminDashboardStats` type, full `Dashboard.tsx` rewrite (4 stat cards + Skeleton + retry), persistent nav (Dashboard/Leads/Team `NavLink`s + Logout) added to `AdminLayout.tsx` above `<Outlet />`, new `tests/e2e/admin-dashboard.spec.ts`, EN/PT-BR/ES i18n parity for `admin.nav.*` + `admin.dashboard.stats.*`. Closes Epic 4 primary stories; sprint-status flips trigger post-sprint TEA pass + Epic 4 retrospective per CLAUDE.md after review acceptance.
- Story 3.6 (Story 3.1 Review Follow-ups) — done under accepted fake-data full-stub override. EN/PT-BR/ES team JSON now uses fabricated temporary names, solid-color WebP stubs, and fabricated LinkedIn-style URLs pending manual stakeholder-content swap.
- Quality at Story 3.1 close: **234 tests pass**; `tsc --noEmit` → 0; `npm run build` clean.
- Test Design Epic 1 artifact: `_bmad-output/test-artifacts/test-design/test-design-epic-1.md` (27 risks, 56-scenario gap plan)
- New tooling: Playwright + @axe-core/playwright + @lhci/cli installed. Scaffold under `tests/e2e/` + `lighthouserc*.json` + `.github/workflows/quality.yml`. Run `npm run test:e2e:install` once locally before `npm run test:e2e`.
- Known carry-forward debt (must address):
  - ClientReferences placeholder agency content — gated by `vault/Planning/client-references-allowlist.md` + `ClientReferences.allowlist.test.tsx` (R-B1). Swap before prod deploy.
  - ~~`GradientButton` lacks `loading`/`async-disabled`~~ ✓ landed in Story 2.2.
  - ~~DB tables not yet created~~ ✓ landed in Story 2.1.
  - ~~Admin auth 501 placeholders~~ ✓ landed in Story 4.1 (`/api/admin/auth/login` real + JWT cookie; `/logout` clears cookie; `/me` already wired). Cross-model review complete.
  - ~~Playwright sandbox workaround (`PLAYWRIGHT_BASE_URL=http://127.0.0.1:9`) needs central doc~~ ✓ landed in Story 3.10.
  - ~~`ErrorBoundary` copy still English-only~~ ✓ landed in Story 3.8.
  - 24-month retention deletion automation — Epic 5 candidate.
  - WCAG R-A2 waiver: Electric Blue `#0075F0` is large-text only on light bg — locked in `src/lib/brand-tokens.contrast.test.ts` and `vault/Planning/Architecture-Key.md`
- **GitHub synced** — https://github.com/xillinha/syncrevenue-website (private repo)
- **Epic 6 (Visual Design Refresh) in-progress 2026-05-19** — Stories 6.1 and 6.2 are now `done` after Codex review closure: native Button type behavior restored, raw `navy` Tailwind alias added, navbar section links/CTA route correctly from sub-routes, desktop/mobile breakpoint aligned to 900px, and `tests/e2e/navbar.spec.ts` added. Stories 6.3, 6.4, 6.5, and 6.6 are also `done` after review; 6.6 received a pill-label fix so ClientReferences status chips now use the exact story labels while preserving the agency allowlist. Stories 6.9 and 6.10 are now `done` after review closure: shared form primitives own `aria-describedby` / invalid / required wiring and option background styling, DemoForm restores visible 429 inline guidance, the GDS CHECK migration preserves dependent index/trigger DDL transactionally, demo runtime i18n keys are locked in parity tests, and targeted demo + axe Playwright checks pass. Stories 6.11 and 6.12 are `done` after review. **Story 6.13 is now `done` after review closure:** i18n stragglers migrated, Lighthouse heading-order / color-contrast / CLS / mobile TBT remediations landed, mobile `/` LCP improved from 3,913–4,060 ms baseline to 2,884–2,942 ms via asset optimisation (mobile webp + `<picture>` + media-scoped preload + self-hosted font), and review patches added hash-scroll retry plus docs alignment. Residual ~400 ms gap to the 2,500 ms AC target is FCP-gated under simulated 4G + 4× CPU throttling — formally rescoped to **new Story 5.6 (Mobile Hero LCP — SSG / Prerender Static Hero)** under Epic 5 backlog per CLAUDE.md "Review Findings → New Story" rule. Mobile `lighthouserc.mobile.json` `largest-contentful-paint` final for Epic 6 at 3,100 ms. Post-fix LHCI report: `_bmad-output/implementation-artifacts/epic-6-lhci-report-2026-05-19-post-fix/README.md`. Sober single-accent palette `#3D6FE0`; UX-DR2/DR3 deliberately superseded; all existing functional surfaces (form validation, locale parity, ClientReferences allowlist) preserved. Source: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/`.

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
