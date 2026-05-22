# Epics & Stories Index

Source: `_bmad-output/planning-artifacts/epics.md`

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[r]` In Review
- `[x]` Done

---

## Epic 1 — Visitor Content Experience (Phase 1 MVP Part A)

| Story | Title | Status |
|---|---|---|
| 1.1 | Project Initialization & Dev Environment | `[x]` |
| 1.2 | Design System Foundation | `[x]` |
| 1.3 | i18n & Language Infrastructure | `[x]` |
| 1.4 | App Shell, Routing & Navigation | `[x]` |
| 1.5 | Hero Section | `[x]` |
| 1.6 | SyncRevenue & Services Sections | `[x]` |
| 1.7 | Comparison Section | `[x]` |
| 1.8 | Team Section | `[x]` |
| 1.9 | Security & Client References Sections | `[x]` |
| 1.10 | Privacy Policy Page | `[x]` |
| 1.11 | Test Infrastructure Baseline (Epic 1 gap closure) | `[x]` |

**Epic 1 Retrospective:** `[x]` done — see `_bmad-output/implementation-artifacts/epic-1-retro-2026-05-15.md`

**Epic 1 Test Design:** `[x]` done — see `_bmad-output/test-artifacts/test-design/test-design-epic-1.md` (27 risks, 56-scenario gap plan). Tier-1 mitigations landed 2026-05-15: deep-key parity test, brand-tokens contrast guard (R-A2), client-references allowlist + test (R-B1), Playwright scaffold (R-O2), axe scan spec (R-O3), Lighthouse CI configs (R-P1/P2/O4), GitHub Actions workflow.

## Epic 2 — Lead Capture & Conversion (Phase 1 MVP Part B)

**Jira:** SYN-2 epic; all 7 stories (SYN-16..22) in active sprint **SYN Sprint 2** (id 302, 2026-05-15 → 2026-06-11).

| Story | Title | Status |
|---|---|---|
| 2.1 | Backend Infrastructure — Database, DAOs & Middleware | `[x]` |
| 2.2 | Demo Request Form — Full Stack | `[x]` |
| 2.3 | Contact Form — Full Stack | `[x]` |
| 2.4 | DemoScheduler Section & Multiple CTA Entry Points | `[x]` |
| 2.5 | SMTP Notification — Demo & Contact | `[x]` |
| 2.6 | Form Accessibility & Locale-Aware Validation | `[x]` |
| 2.7 | Security Hardening — Rate Limiting, Headers & Locale Allowlist | `[x]` |

**Epic 2 Retrospective:** `[x]` done — see `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md`

## Epic 3 — Content Polish & SEO (Phase 2)

**Jira:** SYN-3 epic; all 5 stories (SYN-23..27) registered in active sprint **SYN Sprint 3** (id 336, 2026-05-15 → 2026-05-16). Status: To Do.

| Story | Title | Jira | Status |
|---|---|---|---|
| 3.1 | Real Team Photos & Bio Content | SYN-23 | `[x]` done |
| 3.2 | Animations & Micro-Interactions | SYN-24 | `[x]` done |
| 3.3 | SEO Metadata — Meta Tags, OG, hreflang & Sitemap | SYN-25 | `[x]` done |
| 3.4 | Mobile UX Polish Pass | SYN-26 | `[x]` done |
| 3.5 | Commission Audit Lead Magnet | SYN-27 | `[x]` done |
| 3.6 | Story 3.1 Review Follow-ups — Real Team Content & Visual QA | SYN-92 | `[x]` done |
| 3.7 | Epic 1 Review Polish — Font Loading & UI Primitive Hardening | SYN-93 | `[x]` done |
| 3.8 | ErrorBoundary i18n & Recovery UX | SYN-94 | `[x]` done |
| 3.9 | Architecture & Token Hygiene Docs — Patterns Gallery + WCAG Contrast Manifest | SYN-95 | `[x]` done |
| 3.10 | DX Discipline — `defaultValue` Lint Rule & Sandbox Port-Binding Convention | SYN-96 | `[x]` done |
| 3.11 | SEO Canonical Self-Reference Alignment (Story 3.3 Review Follow-up) | SYN-85 | `[x]` done |

## Epic 4 — Admin Operations (Phase 3)

| Story | Title | Status |
|---|---|---|
| 4.1 | Admin Authentication — Login & Session Management | `[x]` |
| 4.2 | Leads Dashboard — View & Filter | `[x]` |
| 4.3 | Lead Status Management | `[x]` |
| 4.4 | Team Member Management — Create & Edit | `[x]` done |
| 4.5 | Team Member Display Order & Active Toggle | `[x]` done |
| 4.6 | Admin Dashboard & Navigation Shell | `[x]` done |
| 4.7 | Admin Login Throttling & Account Lockout (Story 4.1 review follow-up) | `[x]` done |
| 4.8 | JWT Revocation via Token Versioning (Story 4.1 review follow-up) | `[x]` done |

## Epic 5 — Production Deployment (Phase 4)

| Story | Title | Status |
|---|---|---|
| 5.1 | Production Build & PM2 Process Management | `[x]` done |
| 5.2 | Domain Configuration & SSL/TLS | `[x]` done |
| 5.3 | Environment Variable Hardening | `[x]` done |
| 5.4 | SQLite Backup Automation | `[x]` done |
| 5.5 | Uptime Monitoring & Health Check | `[x]` done |
| 5.6 | Mobile Hero LCP — SSG / Prerender Static Hero (Story 6.13 AC 7 rescope) | `[x]` done — LCP median 2,259ms (↓83% from 2,916ms baseline); lighthouserc.mobile.json reverted to 2,500ms threshold |
| 5.7 | PM2 Cluster Mode & Multi-Core Production Optimization (Story 5.1 review finding) | `[x]` done — opt-in stance; ADR in Architecture-Key.md; ecosystem.config.js cluster directives commented with SQLite-WAL warning |
| 5.8 | Prerender Script Type Coverage (Story 5.6 review finding) | `[x]` done — `tsconfig.scripts.json` added; `npm run typecheck` now chains both configs and covers `scripts/prerender.tsx`; AC2 smoke-test passed; TS2454 auto-resolved by `@types/node` `process.exit: never` |
| 5.9 | Express Trust Proxy Configuration (Story 5.2 review finding) | `[x]` done — `app.set('trust proxy', 1)` enabled in production before HTTP→HTTPS redirect; req.protocol/req.secure/req.ip now resolve via X-Forwarded-* behind reverse proxy; per-client express-rate-limit keying restored; runbook section 4 expanded |
| 5.10 | CI Quality Gate — Build Artifact & Backup Coverage (TEA finding G1/G3/G8) | `[x]` done — `npm run test:backup` wired into `unit` job; new `build-smoke` job runs `npm run build && npm run test:build`; `scripts/test-build-output.mjs` asserts prerendered `<h1>` + `<picture>` inside `#root` against `dist/client/index.html`; runbook section 9 documents post-deploy header `curl` checks (HSTS, Cache-Control, X-Content-Type-Options) + LHCI vs Express caveat |
| 5.11 | Health DAO Unit Tests (TEA finding G2) | `[x]` done — `server/dao/health.dao.test.ts` added (3 unit tests); DAO test parity restored across `server/dao/` |
| 5.12 | Stabilize Pre-Existing Vitest Flakes (TEA v2 finding NG2 — Story 4.7 auth throttling timing + Home RTL waitFor) | `[x]` done — bcrypt mocked in `server/routes/admin/auth.test.ts` (per-test runtime 700-2500ms → 13-21ms); two lockout-window-expiry tests now drive `vi.useFakeTimers()` + `vi.setSystemTime()` + `vi.advanceTimersByTime()`; every `waitFor(() => expect(document.querySelector('#section-id')).toBeInTheDocument())` in `src/pages/Home*.test.tsx` replaced with `await screen.findByRole('region', { name }, { timeout: 5000 })`; 766/766 pass for 3 consecutive `npm run test:run` invocations; `npm run typecheck` exit 0. Zero source-code (`server/`, `src/`) changes outside test files. Cross-model review gate: PASS (zero non-dismissed findings across Blind Hunter / Edge Case Hunter / Acceptance Auditor). |
| 5.13 | Vitest Include Glob for scripts/ Test Files (TEA v2 finding NG1) | `[x]` done — `vite.config.ts:27` `test.include` extended with `'scripts/generate-*.test.mjs'`; 6 SEO-asset tests now discovered and green (`falls back to the default canonical origin when VITE_SITE_URL is unset`, `builds canonical URLs without trailing slash on root and with optional locale query`, `renders sitemap.xml with required schema, two routes, lastmod, and full hreflang matrix`, `renders sitemap with a supplied site URL override`, `renders robots.txt with public allowlist, admin/API disallows, and absolute sitemap directive`, `renders robots.txt with overridden site URL for build-time canonical`); full suite 89 files / 772 passing (independent re-baseline confirmed pristine 766 + exact +6 delta); `scripts/backup.test.mjs` + `scripts/test-build-output.mjs` correctly excluded by narrow glob (micromatch verified); `npm run typecheck` exit 0; SUT module-import is FS-pure (writeSeoAssets only fires on `invokedDirectly`). Cross-model review gate: PASS (zero non-dismissed findings across Blind Hunter / Edge Case Hunter / Acceptance Auditor). |

**Epic 5 TEA:** `[x]` v1 done — see `_bmad-output/test-artifacts/test-design/test-design-epic-5.md`. Gate decision: CONDITIONAL PASS. 2 new stories added (5.10, 5.11). Highest v1 risk: G1 (backup tests not in CI, score 9) → Story 5.10.

**Epic 5 TEA v2 re-pass:** `[x]` done — see `_bmad-output/test-artifacts/test-design/test-design-epic-5-v2.md`. Gate decision: PASS with follow-ups (highest v2 score: NG2 = 6, below 9 failure threshold). v1 closures G1/G2/G3/G4/G8 verified line-by-line. 2 new stories added (5.12, 5.13). Highest v2 risk: NG2 (chronic Vitest flakes mask signal across every Epic 5 dev record, score 6) → Story 5.12.

**Epic 5 Retrospective:** `[x]` done — see `_bmad-output/implementation-artifacts/epic-5-retro-2026-05-20.md`. 6 core stories done. 5 follow-up stories (5.7–5.11) queued. Key action items: C1 (test try/finally discipline), C2 (story file housekeeping), C4 (24-month retention job), C5 (ClientReferences content swap), C6 (execute 5.7–5.11).

## Epic 6 — Visual Design Refresh — Claude Design Handoff (Phase 5)

**Jira:** SYN-202 epic; all 13 stories (SYN-203..210, SYN-328..331, SYN-378) + 113 sub-tasks Done across SYN Sprints; final reconciliation 2026-05-20.

Source bundle: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/`. Sober palette anchored on single accent `#3D6FE0`; no gradients/glows/dot-grids. Visual-only — preserves all existing FR behavior; UX-DR2/DR3 deliberately superseded (divergence documented in `Planning/Architecture-Key.md` after Story 6.1 lands).

| Story | Title | Jira | Status |
|---|---|---|---|
| 6.1 | Design Tokens — Sober Palette | SYN-203 | `[x]` done |
| 6.2 | Navbar & Logo Refresh | SYN-204 | `[x]` done |
| 6.3 | Hero Left — Airplane Background, Copy, KPI Strip | SYN-205 | `[x]` done |
| 6.4 | Hero Right — Product Panel, Integration Tiles, Live Ticker | SYN-206 | `[x]` done |
| 6.5 | Benefits Grid + Trust Strip | SYN-207 | `[x]` done |
| 6.6 | ClientReferences Visual Refresh | SYN-208 | `[x]` done |
| 6.7 | Team Section Visual Refresh | SYN-209 | `[x]` done |
| 6.8 | Demo + Contact Forms Visual Refresh + Locale Parity Sweep | SYN-210 | `[x]` done |
| 6.9 | Shared Form Primitives + i18n Namespace Restructure (6.8 deferral) | SYN-328 | `[x]` done |
| 6.10 | DemoScheduler Grid + DemoForm Restyle + GDS Enum (6.8 deferral) | SYN-329 | `[x]` done |
| 6.11 | Contact Grid + ContactForm Restyle (6.8 deferral) | SYN-330 | `[x]` done |
| 6.12 | Lighthouse + axe + Legacy Cleanup (6.8 deferral) | SYN-331 | `[x]` done |
| 6.13 | Epic 6 Follow-ups — Stragglers + CLS/LCP/Heading-Order (6.12 deferral) | SYN-378 | `[x]` done — AC 7 mobile LCP residual gap rescoped to Story 5.6 (Epic 5) |

**Epic 6 Retrospective:** pending — not yet authored. Per CLAUDE.md "Post-Epic Retrospective (Mandatory)" rule, `bmad-retrospective` must run against the completed epic (SYN-202 closed 2026-05-20). Outstanding action: create `_bmad-output/implementation-artifacts/epic-6-retro-YYYY-MM-DD.md`.

## Epic 7 — Figma 'teste' SaaS Import — Dashboard Suite + Dark Theme (Phase 6)

**Jira:** [SYN-488](https://xillinha.atlassian.net/browse/SYN-488) (Epic) + stories SYN-489..496 + 50 sub-tasks SYN-497..546 — all To Do; full sync 2026-05-22.

Source: Figma Make file `https://www.figma.com/make/66Wb2MAv5PLOBSJLoFM3E3/teste` (fileKey `66Wb2MAv5PLOBSJLoFM3E3`). Imports a 7-page SaaS product surface (Landing variant + DemoForm + 5-page Dashboard suite) and a ~40-component shadcn-style UI library on top of an OKLCH dark-theme token system. New routes coexist with the existing public marketing site; dark theme applied site-wide (re-skinning `/`, `/privacy`, `/admin/*`); brand copy reconciled from "SyncSyrius" / insurance domain → "SyncRevenue / Sync Sirius" / travel-agency-commission domain. Full breakdown in `_bmad-output/planning-artifacts/epics.md` (Epic 7 section).

| Story | Title | Jira | Status |
|---|---|---|---|
| 7.1 | Foundation — Deps, Token Backport, Dark Mode Default, Base Utilities | SYN-489 | `[x]` done — code review patches complete 2026-05-22. Fixed Tailwind v3 animation compatibility, alpha-capable shadcn token colors, `ImageWithFallback` `src` retry behavior, and `useIsMobile` listener fallback. Full suite passes (94 files / 801 tests), typecheck passes, build passes, contrast passes, and audit has no high/critical advisories. |
| 7.2 | Routes / Layout Scaffold — `/v2`, `/demo`, `/dashboard/*` + DashboardLayout Shell | SYN-490 | `[ ]` not started |
| 7.3 | Dashboard Pages — Overview, Revenue Recovery, Payouts, Insights, Settings | SYN-491 | `[ ]` not started |
| 7.4 | Landing at `/v2` + DemoForm at `/demo` | SYN-492 | `[ ]` not started |
| 7.5 | i18n Extraction for Epic 7 Pages — en / pt-BR / es | SYN-493 | `[ ]` not started |
| 7.6 | Brand Copy Rewrite — SyncSyrius/Insurance → SyncRevenue/Travel Commission | SYN-494 | `[ ]` not started |
| 7.7 | Prerender Exclusions + Site-Wide Dark Mode Regression Sweep | SYN-495 | `[ ]` not started |
| 7.8 | New-Route Smoke Tests + Vitest Coverage Floor | SYN-496 | `[ ]` not started |

**Implementation order:** 7.1 → 7.2 → 7.3 → 7.4 → 7.5 → 7.6 → 7.7 → 7.8.

**Epic 7 Retrospective:** pending — runs after all 8 stories Done.

**Epic 7 TEA pass:** pending — runs as single sprint pass over all 8 stories per CLAUDE.md "Post-Sprint TEA" rule (NOT per-story).
