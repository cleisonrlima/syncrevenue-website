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
| 2.1 | Backend Infrastructure — Database, DAOs & Middleware | `[r]` |
| 2.2 | Demo Request Form — Full Stack | `[ ]` |
| 2.3 | Contact Form — Full Stack | `[ ]` |
| 2.4 | DemoScheduler Section & Multiple CTA Entry Points | `[ ]` |
| 2.5 | SMTP Notification — Demo & Contact | `[ ]` |
| 2.6 | Form Accessibility & Locale-Aware Validation | `[ ]` |
| 2.7 | Security Hardening — Rate Limiting, Headers & Locale Allowlist | `[ ]` |

## Epic 3 — Content Polish & SEO (Phase 2)

| Story | Title | Status |
|---|---|---|
| 3.1 | Real Team Photos & Bio Content | `[ ]` |
| 3.2 | Animations & Micro-Interactions | `[ ]` |
| 3.3 | SEO Metadata — Meta Tags, OG, hreflang & Sitemap | `[ ]` |
| 3.4 | Mobile UX Polish Pass | `[ ]` |
| 3.5 | Commission Audit Lead Magnet | `[ ]` |

## Epic 4 — Admin Operations (Phase 3)

| Story | Title | Status |
|---|---|---|
| 4.1 | Admin Authentication — Login & Session Management | `[ ]` |
| 4.2 | Leads Dashboard — View & Filter | `[ ]` |
| 4.3 | Lead Status Management | `[ ]` |
| 4.4 | Team Member Management — Create & Edit | `[ ]` |
| 4.5 | Team Member Display Order & Active Toggle | `[ ]` |
| 4.6 | Admin Dashboard & Navigation Shell | `[ ]` |

## Epic 5 — Production Deployment (Phase 4)

| Story | Title | Status |
|---|---|---|
| 5.1 | Production Build & PM2 Process Management | `[ ]` |
| 5.2 | Domain Configuration & SSL/TLS | `[ ]` |
| 5.3 | Environment Variable Hardening | `[ ]` |
| 5.4 | SQLite Backup Automation | `[ ]` |
| 5.5 | Uptime Monitoring & Health Check | `[ ]` |
