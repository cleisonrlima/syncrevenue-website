---
title: "Product Brief Distillate: syncrevenue-website"
type: llm-distillate
source: "product-brief-syncrevenue-website.md"
created: "2026-05-13"
purpose: "Token-efficient context for downstream PRD creation"
---

# Product Brief Distillate — Sync Sirius Institutional Website

## Product Core

- **Company:** Sync Sirius, Inc. — Miami, FL, USA
- **Flagship product:** SyncRevenue — commission management platform for travel agencies
- **Portfolio:** SyncRevenue (primary), OBTs (Online Booking Tools), Custom Development, BI/Data/ML
- **Site purpose:** Lead generation (demo scheduling) + brand positioning. NOT a product portal.
- **Primary conversion action:** Demo request form. Secondary: contact form.
- **Build status:** SyncRevenue built in parallel with the website — pre-launch at time of brief
- **Accuracy claim:** 99.99% commission assertivity — achieved via configurable airline contract engine + expert ops team + AI validation layer

## Target Market

- **Geography:** Americas — US (primary), Brazil, Latin America
- **Segment:** Mid-market through enterprise travel agencies and TMCs. Boutique/micro (1–5 agents) explicitly out of scope for positioning.
- **Buyer persona:** Agency owner / CEO / CFO — P&L pain, wants quantified ROI, security-sensitive before sharing GDS credentials
- **User persona:** Back-office manager / ticketing supervisor — reconciles BSP/ARC manually today, dreads Monday debit memo reports
- **Language split:** EN (US/Canada), PT-BR (Brazil), ES (Latin America) — all three active from Phase 1

## Traffic & Acquisition Strategy

- **Primary channel at launch:** Paid ads
- **Trust mechanism:** Client references from recognized US agencies — testimonials/case studies. These serve as primary trust signal until security certifications are obtained.
- **Lead magnet (Phase 1):** Free commission audit — prospect submits 30 days of BSP data, Sync Sirius delivers leak analysis showing recoverable revenue. High-intent entry before demo commitment.
- **Success metric:** Number of qualified demos booked (tracked via admin dashboard by locale + status)

## Trust & Security Signals

- Security certification roadmap in progress (certifications not yet obtained at launch)
- Contract insurance planned — to be communicated as a commitment on the site
- Data security statement goes on site in Phase 1
- Client references from renowned US agencies = social proof for cold ad traffic
- No pricing page — pricing is a sales conversation post-demo

## Technical Stack (full detail)

**Frontend:**
- Vite + React 18 + TypeScript (strict)
- Tailwind CSS v3 (utility-first)
- shadcn/ui — Button, Dialog, Form, Input, Select, Textarea, Toast, Badge, Card, Table, Skeleton, Separator, DropdownMenu
- Zod (client-side validation, locale-aware via i18next TFunction)
- Zustand stores: `useModalStore`, `useLocaleStore`, `useAdminStore`
- i18next + react-i18next + i18next-browser-languagedetector
- Path aliases: `@/` maps to `src/`

**Backend (embedded, same monorepo):**
- Express (via Vite plugin in dev / standalone in prod)
- better-sqlite3 (zero-config SQLite)
- Zod (server-side payload validation on every route)
- bcryptjs (password hashing, salt rounds ≥ 12)
- jsonwebtoken (stateless admin auth)
- nodemailer/SMTP (email notification on new demo lead — server-side only)
- dotenv + Vite env (no `VITE_` prefix for secrets)

**Dev tooling:**
- `concurrently` — runs `vite` + `tsx watch server/index.ts` in parallel
- Production: `tsc && vite build` → `node dist/server/index.js`
- DB seed: `tsx server/db.seed.ts` — creates initial admin user

**Deployment targets considered:** VPS, Railway, Render (decision deferred to Phase 4)

## Folder Structure (canonical)

```
sync-sirius/
├── .env / .env.example
├── vite.config.ts / tailwind.config.ts / tsconfig.json
├── server/
│   ├── index.ts / db.ts
│   ├── middleware/ (auth.ts, rateLimit.ts)
│   ├── routes/ (demo.ts, contact.ts, admin/auth.ts, admin/leads.ts, admin/team.ts)
│   └── schemas/ (demo.schema.ts, contact.schema.ts)
└── src/
    ├── main.tsx / App.tsx
    ├── i18n/ (index.ts, locales/en|pt-BR|es, LanguageSwitcher.tsx)
    ├── store/ (useModalStore, useLocaleStore, useAdminStore)
    ├── components/ (ui/, layout/Navbar+Footer, sections/Hero+SyncRevenue+Comparison+Services+Team+DemoScheduler+Contact)
    ├── pages/ (Home.tsx, admin/Login+Dashboard+Leads+Team)
    ├── hooks/ (useDemo.ts, useAdmin.ts)
    └── lib/ (api.ts, utils.ts)
```

## Database Schema (SQLite)

- `demo_requests`: id, name, email, company, phone, role, gds, message, locale, status (default 'pending'), created_at, updated_at
- `contacts`: id, name, email, subject, message, locale, read (0/1), created_at
- `team_members`: id, name, role_en/pt/es, bio_en/pt/es, linkedin, photo_url, order_index, active
- `admin_users`: id, email, password_hash, created_at
- **Locale stored per lead** — enables market segmentation: US / Brazil / LATAM

## Environment Variables

```
PORT=3001 / NODE_ENV
JWT_SECRET / JWT_EXPIRES_IN=8h
ADMIN_INITIAL_EMAIL / ADMIN_INITIAL_PASSWORD
DB_PATH=./data/sync_sirius.db
SMTP_HOST / SMTP_PORT=465 / SMTP_USER / SMTP_PASS / NOTIFY_EMAIL
RATE_LIMIT_WINDOW_MS=900000 / RATE_LIMIT_MAX=20
```

## Security Checklist (full)

- `.env` in `.gitignore`; `.env.example` documented with no real values
- No secret with `VITE_` prefix (never reaches client bundle)
- JWT in httpOnly cookie (XSS mitigation)
- Rate limiting on `/api/demo` and `/api/contact` (15min window, 20 req max)
- Zod validation on every API endpoint
- Prepared statements via better-sqlite3 (SQL injection prevention)
- Security headers via helmet
- CORS restricted to production domain only
- bcryptjs salt rounds ≥ 12
- SMTP credentials server-side only
- Locale allowlisted server-side: `en | pt-BR | es`

## i18n Setup

- Detection order: `localStorage` → browser `navigator` → fallback `en`
- Language persisted in `localStorage`
- Three locale files: `src/i18n/locales/en/translation.json`, `pt-BR/translation.json`, `es/translation.json`
- Zod schemas locale-aware: `createDemoSchema(t: TFunction)` injects translated error messages
- GDS enum (server + client): `Amadeus | Sabre | Galileo | Worldspan | Other | None yet`

## Approved Copy (English, from spec)

- Hero headline: "Commission Management Built for Modern Travel Agencies"
- Hero subheadline: "SyncRevenue integrates with every major GDS — giving your agency full visibility and control over commissions."
- Hero badge: "Miami-based · Serving agencies across the Americas"
- Demo success: "Request received! Our team will reach out within 1 business day."
- Footer address: "Miami, FL — United States"
- Copyright: "© {{year}} Sync Sirius, Inc. All rights reserved."

## Design System

**Brand colors (from logo):**
- Electric Blue: `#0075F0` — primary CTA, links
- Highlight: `#00A0F0` — hover states, gradient top
- Deep: `#0055F0` — gradient bottom, active states
- Navy: `#0D0D3A` — dark bg (navbar, footer, dark sections)
- Slate: `#404070` — cards, borders, dividers
- Muted: `#8080A0` — placeholder text, labels
- White: `#FFFFFF` / Offwhite: `#F4F6FA`

**Gradients:**
- Brand: `linear-gradient(135deg, #0055F0 0%, #0075F0 50%, #00A0F0 100%)` — CTAs, icons, dividers
- Dark section: `linear-gradient(180deg, #0D0D3A 0%, #080820 100%)`

**Visual identity rules:**
- Never flat solid blue — always use gradient where brand color is prominent
- Logo: full color on dark navy only, or full color + navy wordmark on white/offwhite
- Never place logo on mid-tone background

## Open Decisions (unresolved at brief stage)

- **Font family:** Candidates: Syne, DM Sans, Outfit, Plus Jakarta Sans. NOT Inter or Roboto. Decision deferred to implementation.
- **Comparison table column labels:** Options: "Legacy Tool A/B", "Traditional Solutions", "Other Platforms", or blank with icons/badges. Deferred to copy stage.
- **Product screenshots/mockups in SyncRevenue section:** Intent noted; assets not yet created (SyncRevenue built in parallel).
- **Demo volume target:** 6-month demo booking target not yet defined — set before launch.
- **Deployment target:** VPS vs Railway vs Render — Phase 4 decision.

## Rejected Ideas (do not re-propose)

- **Naming competitors in UI:** Rejected — legal/brand risk. "Legacy Tool A/B" framing adopted.
- **VITE_ prefix for secrets:** Rejected — security rule. All sensitive env vars server-side only.
- **Mocking DB in tests:** Not addressed in spec but SQLite zero-config means integration-style testing is preferred — no mock layer needed.
- **Pricing page:** Rejected for scope — pricing is a post-demo sales conversation.
- **Blog/content marketing infrastructure:** Out of scope for all phases in brief.
- **Customer portal / authenticated agency access:** Out of scope for website entirely.

## Competitive Intelligence (for PRD positioning)

**GDS-native tools (Amadeus Agency360, Sabre Red 360):**
- Locked to single GDS — no cross-GDS view
- Reporting only, no active commission recovery or dispute management
- SyncRevenue directly displaces: multi-GDS unified + accuracy guarantee

**TravelWorks:**
- CRM/ERP with Sabre-centric commission tracking
- $100–133/user/month — heavy for mid-market LatAm
- No bilingual support, no LatAm focus

**MIDOCO:**
- ERP-first, European market oriented
- Per-transaction fees penalize high-volume agencies
- No ES/PT support

**NTT DATA TACS:**
- Enterprise-grade, airline-side implementation focus
- High cost + complexity, not SaaS, not agency-side SMB/mid-market

**Generic tools (QuickBooks/Xero + spreadsheets):**
- No GDS logic, no debit memo dispute support, fully manual
- This is the status quo SyncRevenue directly replaces

**Market gap SyncRevenue owns:** Americas (US + Brazil + LATAM) + multi-GDS + EN/PT-BR/ES + all sizes. No current competitor holds this combination.

## Market Data Points (for sales/content use)

- GDS market: ~$6.19B in 2025, growing to $16.44B by 2032
- Hotels paid ~$2.1B in commissions to TMCs via GDS in 2024
- 71% of corporate travel buyers paid transaction-based TMC fees in 2024 — margin pressure is acute
- Agency bookings projected +125% by 2030 (post-pandemic recovery)
- Commission leakage estimate: 15–25% of total commission revenue is recoverable
- Per-agency monthly loss range: $5,000–$50,000 from untracked discrepancies
- Avg debit memo: $269; 500+ airline reason codes make dispute resolution opaque

## Phase Roadmap

- **Phase 1 (MVP):** Foundation setup, full landing page all sections, i18n EN/PT-BR/ES, Express + SQLite, demo form functional, security baseline, trust/security statement on site
- **Phase 2:** Real team photos/bios, animations, SEO (meta/OG/hreflang/sitemap), mobile review
- **Phase 3:** Admin module — JWT auth, leads dashboard (status + locale filter), team CRUD (EN/PT/ES per member), email notifications on new lead
- **Phase 4:** Deploy (VPS/Railway/Render), domain + SSL, SQLite backup automation, uptime monitoring
