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
| 4.4 | Team Member Management — Create & Edit | `[r]` review |
| 4.5 | Team Member Display Order & Active Toggle | `[ ]` |
| 4.6 | Admin Dashboard & Navigation Shell | `[ ]` |
| 4.7 | Admin Login Throttling & Account Lockout (Story 4.1 review follow-up) | `[r]` review |
| 4.8 | JWT Revocation via Token Versioning (Story 4.1 review follow-up) | `[x]` done |

## Epic 5 — Production Deployment (Phase 4)

| Story | Title | Status |
|---|---|---|
| 5.1 | Production Build & PM2 Process Management | `[ ]` |
| 5.2 | Domain Configuration & SSL/TLS | `[ ]` |
| 5.3 | Environment Variable Hardening | `[ ]` |
| 5.4 | SQLite Backup Automation | `[ ]` |
| 5.5 | Uptime Monitoring & Health Check | `[ ]` |

## Epic 6 — Visual Design Refresh — Claude Design Handoff (Phase 5)

Source bundle: `_bmad-output/design-handoffs/syncsirius-website-2026-05-17/`. Sober palette anchored on single accent `#3D6FE0`; no gradients/glows/dot-grids. Visual-only — preserves all existing FR behavior; UX-DR2/DR3 deliberately superseded (divergence documented in `Planning/Architecture-Key.md` after Story 6.1 lands).

| Story | Title | Status |
|---|---|---|
| 6.1 | Design Tokens — Sober Palette | `[ ]` |
| 6.2 | Navbar & Logo Refresh | `[ ]` |
| 6.3 | Hero Left — Airplane Background, Copy, KPI Strip | `[ ]` |
| 6.4 | Hero Right — Product Panel, Integration Tiles, Live Ticker | `[ ]` |
| 6.5 | Benefits Grid + Trust Strip | `[ ]` |
| 6.6 | ClientReferences Visual Refresh | `[ ]` |
| 6.7 | Team Section Visual Refresh | `[ ]` |
| 6.8 | Demo + Contact Forms Visual Refresh + Locale Parity Sweep | `[ ]` |
