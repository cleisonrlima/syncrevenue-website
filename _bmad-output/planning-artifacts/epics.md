---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# syncrevenue-website - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for syncrevenue-website, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Visitors can view a Hero section presenting SyncRevenue's value proposition and primary CTA
FR2: Visitors can view a SyncRevenue product section describing commission management capabilities, GDS integrations, and the accuracy commitment
FR3: Visitors can view a Services/Portfolio section presenting all Sync Sirius offerings: SyncRevenue, BI/Data Analytics, OBTs, and Custom Development
FR4: Visitors can view a Comparison section contrasting Sync Sirius with legacy and generic alternatives
FR5: Visitors can view a Team section with member names, roles, and bios
FR6: Visitors can access a Contact section with a secondary general inquiry path
FR7: Visitors can navigate between all site sections via a persistent navbar
FR8: Visitors can access a footer with company address, copyright, and navigation links
FR9: Visitors can submit a demo request form for SyncRevenue with contact info, company, role, GDS system, and optional message
FR10: Visitors can submit a general contact form for non-demo inquiries — includes a subject/service dropdown routing to SyncRevenue, BI/Data Analytics, OBTs, Custom Development, or Other
FR11: Visitors interested in BI/Analytics, OBTs, or Custom Development submit a quotation or meeting request via the contact form (FR10) using the service dropdown — no separate form
FR12: Visitors receive an on-page confirmation upon successful form submission
FR13: Sync Sirius team receives an internal email notification on each demo request and contact form submission
FR14: Visitors can submit a free commission audit request with BSP data for leakage analysis (Phase 2)
FR15: Visitors can access a demo scheduling CTA from multiple sections throughout the site
FR16: All form inputs are validated with locale-aware error messages before submission is processed
FR17: Visitors can view the full site in English, Brazilian Portuguese, or Spanish
FR18: The site automatically detects and applies the visitor's preferred language on first load
FR19: Visitors can manually switch the active language at any point
FR20: All UI copy, form labels, validation messages, and error states are displayed in the active language
FR21: The visitor's language preference is persisted across sessions
FR22: Each lead submission is tagged with the locale active at time of submission
FR23: Visitors can view a security statement covering data encryption, certification roadmap, and contract insurance commitment
FR24: Visitors can view client references from recognized US travel agencies as social proof
FR25: The security section explicitly distinguishes data collected by the website from data processed by SyncRevenue
FR26: Visitors can access a Privacy Policy disclosing data collection, storage, and subject rights
FR27: The Privacy Policy is accessible in all three supported languages
FR28: Visitors can view Sync Sirius positioned as a premium Americas specialist, not a generic SaaS vendor
FR29: Admin users can authenticate to a secure admin panel with session management (Phase 3)
FR30: Admin users can view all submitted demo requests in a leads dashboard (Phase 3)
FR31: Admin users can filter leads by locale (en / pt-BR / es) (Phase 3)
FR32: Admin users can filter leads by status (pending / contacted / qualified) (Phase 3)
FR33: Admin users can update the status of individual leads (Phase 3)
FR34: Admin users can view the full message content of each lead submission (Phase 3)
FR35: Admin users can add, edit, and deactivate team member profiles (Phase 3)
FR36: Admin users can manage team member bios independently in English, Portuguese, and Spanish (Phase 3)
FR37: Admin users can set the display order of team members on the public site (Phase 3)
FR38: The system stores all lead submission data in a secured store accessible only to authenticated admins
FR39: The system enforces rate limiting on all form submission endpoints
FR40: The system validates and restricts accepted locale values to the allowlisted set (en / pt-BR / es)

### NonFunctional Requirements

NFR-P1: LCP ≤ 2.5s on 4G mobile — paid ad landing traffic is bounce-sensitive at first load
NFR-P2: FID < 100ms — form interactions must feel immediate
NFR-P3: CLS < 0.1 — no visual instability on load or locale switch
NFR-P4: Form API endpoints (/api/demo, /api/contact) respond in ≤ 3s under normal load
NFR-P5: Static assets served with Cache-Control: max-age=31536000, immutable for hashed assets; no-cache for index.html
NFR-S1: All data in transit encrypted via HTTPS/TLS — no plain HTTP in production
NFR-S2: Lead data accessible only to authenticated admin users (JWT in httpOnly cookie)
NFR-S3: Admin sessions expire after 8 hours — no persistent sessions
NFR-S4: No sensitive environment variables exposed in client bundle (zero VITE_-prefixed secrets)
NFR-S5: Rate limiting: max 20 requests per 15-minute window on /api/demo and /api/contact
NFR-S6: Password hashing: bcrypt, salt rounds ≥ 12
NFR-S7: Security headers (helmet) applied to all server responses
NFR-S8: CORS restricted to production domain only — no wildcard origins
NFR-S9: SQL injection prevented via parameterized queries throughout
NFR-S10: Locale field allowlisted server-side — only en | pt-BR | es accepted
NFR-R1: Demo request form endpoint maintains 99.9% availability — downtime equals lost leads
NFR-R2: SMTP notification failure must not surface as 5xx to the visitor — lead saved to DB regardless of email delivery outcome
NFR-R3: Server process auto-restarts on crash in production (process manager required)
NFR-R4: Form submission must not produce duplicate records on network retry
NFR-A1: WCAG 2.1 AA compliance across all public-facing pages
NFR-A2: All interactive elements operable via keyboard alone
NFR-A3: Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text — brand blue validation required
NFR-A4: All form fields have programmatically associated labels and error messages
NFR-A5: Screen readers can navigate and operate all forms correctly
NFR-A6: Focus indicators visible on all focusable elements
NFR-SC1: MVP traffic (hundreds of leads/month) is within SQLite's operational limits
NFR-SC2: New translation strings added per locale without code changes — JSON files only
NFR-AC1: Query patterns must remain compatible with PostgreSQL to support migration if SQLite becomes a bottleneck
NFR-AC2: Locale switching completes without full page reload (client-side language swap, no server round-trip)

### Additional Requirements

- Stack pre-defined: React 18 + Vite + TypeScript strict mode + Express + better-sqlite3 + Zod + Zustand + i18next + react-i18next + bcryptjs + jsonwebtoken + nodemailer + Tailwind CSS v3 + shadcn/ui. No starter template needed — greenfield initialization.
- Data access: Raw SQL + DAO/Repository Pattern (no ORM). All SQL in DAO files (server/dao/). Never raw SQL in route handlers. DAO methods return typed objects.
- DB schema: 4 tables — demo_requests, contacts, team_members, admin_users — with exact column definitions and CHECK constraints as specified in architecture.
- Middleware stack order: helmet() → cors() → express.json() → rateLimit (form routes) → auth (admin routes) → route handlers
- JWT in httpOnly cookie, SameSite=Strict, 8-hour expiry. Token payload: { adminId, email, iat, exp }.
- SMTP: fire-and-forget (non-blocking). DB write must succeed before sendMail attempt. SMTP failure logged server-side, never surfaced as 5xx.
- React Router v7 with nested admin routes. Route tree: / (Home), /privacy (Privacy), /admin (AdminLayout wrapper), /admin/login, /admin/dashboard, /admin/leads, /admin/team.
- Code splitting: React.lazy + Suspense per section. Fallback: SectionSkeleton matching section height (prevents CLS per NFR-P3).
- Form state machine: 'idle' | 'submitting' | 'success' | 'error' — consistent across useDemo.ts and useContact.ts.
- Locale flow order (always): i18next.changeLanguage(locale) → useLocaleStore.setState({ locale }) → localStorage.setItem('i18nextLng', locale)
- API response envelope: { success: true, data?: T } | { success: true, message: string } | { success: false, message: string } | { success: false, message: string, field: string }
- Naming: snake_case for all DB columns and API JSON fields (no camelCase transform), PascalCase React components, camelCase hooks with use prefix, use{Domain}Store for Zustand stores
- i18n keys: dot-nested, 3-level max (e.g., forms.demo.emailError). Never flat. Never more than 3 levels.
- Co-located tests: source.test.ts next to source.ts. No __tests__/ directories.
- Date handling: DB stores ISO-8601 TEXT. API sends ISO string as-is. Client formats via Intl.DateTimeFormat in active locale.
- Phase 1 team bios: defined in translation JSON (t('team.members') array). Phase 3: Team.tsx replaced with API call to /api/admin/team.
- Data retention: demo_requests and contacts records deleted after 24 months from created_at. Document in Privacy Policy.
- Dev setup: concurrently "vite" "tsx watch server/index.ts". Vite port 5173, Express port 3001. Vite proxies /api/* → Express.
- PM2 for production process management (Phase 4). ecosystem.config.js committed to repo.
- Admin account management: CLI-only via db.seed.ts for Phase 1–3. No password reset UI.

### UX Design Requirements

UX-DR1: Dark-First Immersive design direction — full navy gradient bg (#0D0D3A → #080820) for hero, navbar, footer, and demo CTA section; alternating white/offwhite (#F4F6FA) for middle sections (SyncRevenue, Services, Comparison, Team)
UX-DR2: Brand color tokens defined as Tailwind CSS custom tokens (CSS variables in tailwind.config.ts): Electric Blue #0075F0 (primary CTA/links), Highlight #00A0F0 (hover/gradient top), Deep #0055F0 (gradient bottom/active), Navy #0D0D3A (dark section bg), Slate #404070 (cards/borders), Muted #8080A0 (placeholders/labels), White #FFFFFF, Offwhite #F4F6FA
UX-DR3: Brand gradient rule: linear-gradient(135deg, #0055F0 0%, #0075F0 50%, #00A0F0 100%) — never flat solid blue on prominent brand elements. Dark section bg: linear-gradient(180deg, #0D0D3A 0%, #080820 100%). Define as bg-gradient-brand Tailwind class.
UX-DR4: GradientButton custom component — primary CTA wrapper on shadcn Button, brand gradient fill, states: default, hover (brighten), active (scale 0.98), disabled (50% opacity, no gradient, cursor-not-allowed), variants: lg (hero/section CTA), md (form submit), sm (navbar). Focus-visible ring in white on dark bg. explicit type="button".
UX-DR5: LanguageSwitcher component — EN/PT-BR/ES toggle in navbar and footer. Active locale highlighted, inactive muted, hover state. Behavior: updates useLocaleStore → i18next.changeLanguage() → localStorage persist. No page reload. No layout shift. aria-label="Select language", aria-current="true" on active locale.
UX-DR6: TrustBar component — full-width strip below hero with 4 trust signal chips: Encrypted transmission · Certification roadmap · Contract insurance · Referenced US agencies. Semi-transparent dark bg. Responsive: horizontal scroll < 480px; 2×2 grid 480–768px; single row > 768px.
UX-DR7: StatRow component — 3-column stat display in hero (99.99% assertivity · 15–25% leakage recovered · Multi-GDS). Numbers use gradient text treatment (bg-gradient-brand + bg-clip-text). Mobile: vertical stack < 640px.
UX-DR8: SectionHeader component — reusable eyebrow + h2 + optional subtext block. Variants: light bg (dark text), dark bg (white text). Used in every content section.
UX-DR9: ComparisonTable component — feature rows comparing Sync Sirius vs legacy tools and generic alternatives (no competitor names). Mobile: horizontal scroll container.
UX-DR10: Fixed section scroll order in Home.tsx: Hero → SyncRevenue → Comparison → Security → ClientReferences → DemoScheduler → Contact. Order is non-negotiable per UX trust-build sequence.
UX-DR11: Button hierarchy enforcement — Primary (GradientButton), Secondary (Button ghost/outline), Tertiary (text link, blue underline on hover), Disabled (50% opacity). Never two primary buttons side-by-side in same view.
UX-DR12: Form patterns — labels always above fields (never placeholder-as-label), required fields marked with asterisk in label, optional fields labeled "(optional)", validation fires on blur per field (not on keystroke, not on submit-only), error message one sentence and specific, submit button full-width mobile / right-aligned desktop, post-submit form replaced by confirmation message in place (no redirect).
UX-DR13: Navbar — sticky top, full-width, dark navy bg. Logo left. Nav links center (hidden < 768px). Language switcher + Demo CTA right. Scroll spy: active section highlighted. Hamburger < 768px → full-screen overlay menu, close on outside click or Escape key.
UX-DR14: Accessibility implementation — skip link "Skip to main content" as first focusable element (hidden until focused), semantic HTML (nav/main/section/footer), all images with alt text, aria-live="polite" on form confirmation region, aria-describedby on field error messages, focus-visible:ring-2 focus-visible:ring-white on dark sections, focus-visible:ring-blue-600 on light sections, tab order follows visual reading order. Validate #0075F0 on white meets WCAG AA (4.5:1 normal text, 3:1 large text/CTA).
UX-DR15: Responsive breakpoints — mobile-first CSS, base styles mobile, md: (768px) upward, lg: (1024px) upward, xl: max-width clamp 1280px centered. rem for font sizes. % / vw for layout widths. Images: width/height attrs set to prevent CLS; lazy-load below fold. font-display: swap.
UX-DR16: Loading states — SectionSkeleton component matching section height for all Suspense fallbacks (required for CLS prevention). 3 row shadcn Skeleton for admin table loading. Form submit: button spinner + "Sending…" text, button disabled. No full-page overlay spinners.
UX-DR17: DemoForm field spec — 8 visible fields: name (required), email (required), company (required), phone (optional), role (required), GDS system dropdown (required, options: Amadeus/Sabre/Galileo/Worldspan/Other/None yet), message (optional), locale (hidden, auto-filled from useLocaleStore). Submit disabled until all required fields pass Zod validation. Confirmation: "Request received! Our team will reach out within 1 business day."
UX-DR18: Feedback patterns — form success: on-page confirmation replaces form, aria-live="polite" wrapper. API failure: shadcn Toast, bottom-right, 5s auto-dismiss, destructive variant. Field validation error: inline red text below field on blur, aria-describedby linked. Rate limit 429: inline error in active locale. Never Toast for field validation. Never modal for errors.
UX-DR19: Typography — Plus Jakarta Sans recommended (final font decision at implementation; exclude Inter/Roboto). H1: 52px / 800 weight on desktop, 32–36px mobile. Gradient text on key hero phrase (bg-gradient-brand + bg-clip-text). font-display: swap. rem units for all font sizes.
UX-DR20: AdminLeadRow component (Phase 3) — lead table row with inline status dropdown/badge. Status badge color-coded: pending (yellow/amber), contacted (blue), qualified (green). Inline update triggers PATCH /api/admin/leads/:id/status.

### FR Coverage Map

```
FR1 → Epic 1 (Hero section)
FR2 → Epic 1 (SyncRevenue product section)
FR3 → Epic 1 (Services/Portfolio section)
FR4 → Epic 1 (Comparison section)
FR5 → Epic 1 (Team section)
FR6 → Epic 1 (Contact section layout)
FR7 → Epic 1 (Navbar)
FR8 → Epic 1 (Footer)
FR9 → Epic 2 (Demo request form)
FR10 → Epic 2 (Contact form)
FR11 → Epic 2 (Contact form service dropdown routing)
FR12 → Epic 2 (On-page form confirmation)
FR13 → Epic 2 (SMTP internal notification)
FR14 → Epic 3 (Commission audit lead magnet)
FR15 → Epic 2 (Demo CTA multiple entry points)
FR16 → Epic 2 (Locale-aware Zod validation)
FR17 → Epic 1 (3-locale site content)
FR18 → Epic 1 (Language auto-detection on first load)
FR19 → Epic 1 (Manual language switcher)
FR20 → Epic 1 (All UI copy in active locale)
FR21 → Epic 1 (Locale persisted in localStorage)
FR22 → Epic 2 (Lead submission tagged with active locale)
FR23 → Epic 1 (Security statement section)
FR24 → Epic 1 (Client references section)
FR25 → Epic 1 (Data separation copy in Security section)
FR26 → Epic 1 (Privacy Policy routable page)
FR27 → Epic 1 (Privacy Policy in all 3 locales)
FR28 → Epic 1 (Premium Americas specialist positioning)
FR29 → Epic 4 (Admin auth + session management)
FR30 → Epic 4 (Leads dashboard)
FR31 → Epic 4 (Leads filter by locale)
FR32 → Epic 4 (Leads filter by status)
FR33 → Epic 4 (Lead status update)
FR34 → Epic 4 (Lead message visible in dashboard)
FR35 → Epic 4 (Team CRUD)
FR36 → Epic 4 (Team bios per locale)
FR37 → Epic 4 (Team display order management)
FR38 → Epic 2 (Secured data store — JWT-only access)
FR39 → Epic 2 (Rate limiting middleware)
FR40 → Epic 2 (Locale allowlist server-side)
```

## Epic List

### Epic 1: Visitor Content Experience (Phase 1 MVP — Part A)
Visitors can navigate and read the complete Sync Sirius marketing site in EN, PT-BR, and ES — all 8 sections visible, locale detection working, trust signals in place, privacy policy accessible. Includes full project initialization, design system, all content-only sections (no forms), and i18n foundation.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR17, FR18, FR19, FR20, FR21, FR23, FR24, FR25, FR26, FR27, FR28

### Epic 2: Lead Capture & Conversion (Phase 1 MVP — Part B)
Visitors can submit demo requests and contact inquiries with locale-aware validation, receive on-page confirmation, and Sync Sirius receives instant SMTP notifications. All lead data securely stored with rate limiting enforced.
**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR15, FR16, FR22, FR38, FR39, FR40

### Epic 3: Content Polish & SEO (Phase 2)
The site gains real team photos and bios, smooth animations and micro-interactions, full SEO metadata (hreflang/OG/sitemap/robots.txt), polished mobile experience, and a commission audit lead magnet for Sofia's journey.
**FRs covered:** FR14

### Epic 4: Admin Operations (Phase 3)
Sync Sirius ops team can manage the full demo pipeline through a secure, JWT-authenticated admin dashboard — view leads by locale/status, triage, update statuses, and manage team content in all three locales.
**FRs covered:** FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37

### Epic 5: Production Deployment (Phase 4)
The site is fully production-ready — deployed on a hosting platform with domain configuration, SSL/TLS, PM2 process management, automated SQLite backups, and uptime monitoring in place.
**FRs covered:** NFR-R3, NFR-S1 (fully realized here)

## Epic 1: Visitor Content Experience (Phase 1 MVP — Part A)

Visitors can navigate and read the complete Sync Sirius marketing site in EN, PT-BR, and ES — all 8 sections visible, locale detection working, trust signals in place, privacy policy accessible. Includes full project initialization, design system, all content-only sections (no forms), and i18n foundation.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR7, FR8, FR17, FR18, FR19, FR20, FR21, FR23, FR24, FR25, FR26, FR27, FR28

### Story 1.1: Project Initialization & Dev Environment

As a developer,
I want the complete project scaffold initialized with all dependencies and tooling configured,
So that I can run the full-stack app locally and begin building features.

**Acceptance Criteria:**

**Given** the repo is freshly cloned
**When** `npm install` is run
**Then** all deps install without errors: React 18, Vite 5, TypeScript strict, Express, better-sqlite3, Zod, Zustand, i18next, react-i18next, Tailwind CSS v3, shadcn/ui, nodemailer, bcryptjs, jsonwebtoken, concurrently, tsx

**Given** the dev environment is configured
**When** `npm run dev` is run
**Then** Vite starts on port 5173 and Express starts on port 3001 via concurrently; React app loads in browser without errors; Vite proxies `/api/*` to Express

**Given** the project structure is initialized
**When** the codebase is inspected
**Then** directory structure matches architecture spec: `server/` (index.ts, db.ts, middleware/, schemas/, dao/, routes/, lib/), `src/` (main.tsx, App.tsx, i18n/, store/, hooks/, lib/, components/ui|layout|sections/, pages/); path alias `@/` → `src/` works in tsconfig.json and vite.config.ts

**Given** TypeScript is configured
**When** `tsc --noEmit` is run
**Then** no errors reported; strict mode enabled

**Given** environment configuration
**When** `.env.example` is inspected
**Then** all required keys are documented with no real values: `PORT`, `DB_PATH`, `JWT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL`, `ALLOWED_ORIGIN`

**Given** the database module loads
**When** `server/db.ts` is imported
**Then** a better-sqlite3 connection is established to `DB_PATH`; the `data/` directory is created if absent; no tables are created yet

**Given** Tailwind and shadcn/ui are configured
**When** the app builds
**Then** `tailwind.config.ts` references shadcn/ui preset; `components.json` is present; `@/` alias resolves; `tsc && vite build` produces `dist/client/` and `dist/server/` without errors

### Story 1.2: Design System Foundation

As a visitor,
I want to experience a visually consistent brand identity across all interactions,
So that I recognize Sync Sirius as a credible, premium specialist from first contact.

**Acceptance Criteria:**

**Given** brand color tokens are configured
**When** `tailwind.config.ts` is inspected
**Then** CSS variables are defined: `--color-electric-blue: #0075F0`, `--color-highlight: #00A0F0`, `--color-deep: #0055F0`, `--color-navy: #0D0D3A`, `--color-slate: #404070`, `--color-muted: #8080A0`, `--color-offwhite: #F4F6FA`; `bg-gradient-brand` applies `linear-gradient(135deg, #0055F0 0%, #0075F0 50%, #00A0F0 100%)`; dark section gradient class applies `linear-gradient(180deg, #0D0D3A 0%, #080820 100%)`

**Given** GradientButton is rendered in default state
**When** a visitor views a primary CTA
**Then** button shows brand gradient background with white text; hover brightens the gradient; active state scales to 0.98; disabled state is 50% opacity with no gradient and `cursor-not-allowed`; `type="button"` is explicit unless overridden; focus-visible shows white ring on dark backgrounds

**Given** GradientButton variant props
**When** rendered with `lg`, `md`, `sm`
**Then** each variant applies appropriate padding and font-size; `lg` is used for hero/section CTAs, `md` for form submit, `sm` for navbar

**Given** SectionHeader is rendered
**When** provided eyebrow, heading, and optional subtext props
**Then** eyebrow renders above h2; optional subtext renders below; `light` variant uses dark text, `dark` variant uses white text

**Given** SectionSkeleton is used as a Suspense fallback
**When** a lazy section is loading
**Then** SectionSkeleton renders a skeleton block with height set via `className` prop; no layout shift occurs when the real section replaces it

**Given** typography is configured
**When** the app renders
**Then** the project font (Plus Jakarta Sans or approved substitute) loads with `font-display: swap`; all font sizes use `rem` units; H1 is 52px/800w on desktop, 32–36px on mobile via Tailwind responsive classes

### Story 1.3: i18n & Language Infrastructure

As a visitor,
I want the site to display content in my language automatically and let me switch at any time,
So that I can engage with Sync Sirius content in English, Brazilian Portuguese, or Spanish.

**Acceptance Criteria:**

**Given** a visitor with `pt-BR` browser language arrives with no stored preference
**When** the site loads
**Then** i18next detects `navigator.language`, sets active locale to `pt-BR`, and all text renders in PT-BR without user action

**Given** a returning visitor who previously selected `es`
**When** the site loads
**Then** i18next reads `i18nextLng` from localStorage and restores `es` as active locale

**Given** a visitor with no stored preference and an unsupported browser language
**When** the site loads
**Then** i18next falls back to `en`

**Given** a visitor clicks 'PT-BR' in LanguageSwitcher
**When** the locale change fires
**Then** these execute in order: `i18next.changeLanguage('pt-BR')` → `useLocaleStore.setState({ locale: 'pt-BR' })` → `localStorage.setItem('i18nextLng', 'pt-BR')`; all visible text updates without page reload; no layout shift

**Given** LanguageSwitcher is rendered
**When** inspected for accessibility
**Then** `aria-label="Select language"` is set; active locale has `aria-current="true"`; all options are keyboard operable via Tab/Enter

**Given** translation files exist at `src/i18n/locales/en|pt-BR|es/translation.json`
**When** all three files are compared
**Then** they contain identical top-level key sets: `nav`, `hero`, `syncrevenue`, `services`, `comparison`, `team`, `security`, `references`, `privacy`, `forms`, `errors`; dot-nested keys max 3 levels deep; no flat key names

**Given** a new translation string is needed
**When** it is added only to the JSON files
**Then** it is available in all three locales without any TypeScript or component changes

### Story 1.4: App Shell, Routing & Navigation

As a visitor,
I want to navigate between site sections via a persistent navbar and access a footer with useful links,
So that I can explore the site freely from any scroll position.

**Acceptance Criteria:**

**Given** the route tree is configured
**When** `App.tsx` is inspected
**Then** routes exist: `/` → `Home.tsx`, `/privacy` → `Privacy.tsx`, `/admin` → `AdminLayout.tsx` (shell only); all public section components are lazy-loaded via `React.lazy` with `Suspense` + `SectionSkeleton` fallbacks

**Given** the Navbar renders at desktop width (> 1024px)
**When** inspected
**Then** Navbar is sticky (`position: fixed; top: 0`), full-width, dark navy bg (`#0D0D3A`); logo renders left; nav links render center; LanguageSwitcher + primary Demo CTA (`GradientButton sm`) render right

**Given** a visitor is on mobile (< 768px)
**When** they tap the hamburger icon
**Then** a full-screen overlay menu appears with all nav links; clicking any link or pressing Escape closes the overlay; menu items have ≥ 44×44px touch targets

**Given** `Home.tsx` renders
**When** page loads
**Then** sections render in approved scroll order: Hero → SyncRevenue → Comparison → Security → ClientReferences → DemoScheduler placeholder → Contact placeholder; each section wrapped in Suspense + SectionSkeleton; placeholder sections render as empty shell divs

**Given** the Footer renders
**When** inspected
**Then** it includes company address, copyright notice, navigation links, LanguageSwitcher, and Privacy Policy link to `/privacy`; footer is not sticky

**Given** a keyboard user loads the page
**When** they press Tab before any other interaction
**Then** the first focusable element is a "Skip to main content" link; it becomes visible on focus and moves focus to the `<main>` element on activation

**Given** semantic HTML structure
**When** the DOM is inspected
**Then** page uses `<nav>`, `<main>`, `<section>`, `<footer>` elements correctly; all sections have appropriate heading hierarchy (h1 in hero, h2 in sections)

### Story 1.5: Hero Section

As a visitor arriving from a paid ad,
I want to immediately see a headline that speaks to my GDS commission pain and a clear call-to-action,
So that I recognize this product is built for me and feel motivated to scroll further.

**Acceptance Criteria:**

**Given** the Hero section renders
**When** a visitor lands on the homepage
**Then** they see: (1) a positioning badge/pill, (2) H1 headline naming GDS, commissions, and travel agencies in the active locale, (3) a subheadline reinforcing the ROI problem, (4) one primary `GradientButton lg` CTA "Schedule a Demo", (5) one secondary tertiary link — never two primary buttons side-by-side

**Given** the Hero renders on a dark background
**When** inspected
**Then** background is `linear-gradient(180deg, #0D0D3A 0%, #080820 100%)`; white text on this background passes WCAG AA contrast ≥ 4.5:1; a radial glow visual treatment appears top-right

**Given** StatRow renders below the headline
**When** a visitor views the hero
**Then** three stats display: 99.99% assertivity, 15–25% leakage recovered, Multi-GDS; numbers use `bg-gradient-brand bg-clip-text text-transparent` treatment; on < 640px viewport stats stack vertically

**Given** TrustBar renders below StatRow
**When** a visitor views the hero
**Then** four trust chips display: "Encrypted transmission", "Certification roadmap", "Contract insurance", "Referenced US agencies"; on < 480px: horizontal scroll; on 480–768px: 2×2 grid; > 768px: single row

**Given** a visitor changes locale
**When** LanguageSwitcher fires
**Then** all hero copy (headline, subheadline, badge, stat labels, trust chip labels, CTA text) updates without page reload; no layout shift

**Given** Hero renders on mobile (< 768px)
**When** viewed at 375px viewport width
**Then** H1 scales to 32–36px; CTA button has ≥ 44×44px touch target; no horizontal overflow

### Story 1.6: SyncRevenue & Services Sections

As a visitor who recognized their pain in the hero,
I want to read about the SyncRevenue product and all Sync Sirius service offerings,
So that I can evaluate whether this company solves my specific GDS reconciliation problem.

**Acceptance Criteria:**

**Given** the SyncRevenue section renders
**When** a visitor scrolls past the hero
**Then** they see: product description of commission management capabilities, GDS integrations (Amadeus, Sabre, Galileo, Worldspan), and accuracy commitment statement; `SectionHeader` is used for eyebrow/h2/subtext

**Given** the Services/Portfolio section renders
**When** a visitor scrolls further
**Then** all four offerings display: SyncRevenue, BI/Data Analytics, OBTs, Custom Development; each with a value proposition statement; a contact path for non-SyncRevenue visitors is indicated

**Given** sections render on light backgrounds
**When** contrast is checked
**Then** SyncRevenue section uses `#FFFFFF` or `#F4F6FA` background; body text on light bg passes WCAG AA contrast ≥ 4.5:1; Electric Blue (#0075F0) accents are validated against WCAG AA

**Given** both sections render on mobile (< 768px)
**When** viewed at 375px viewport
**Then** all content stacks to single column; no horizontal overflow; font sizes remain readable

**Given** a visitor changes locale
**When** LanguageSwitcher fires
**Then** all section copy updates to the new locale without page reload

### Story 1.7: Comparison Section

As a visitor evaluating alternatives to their current manual process,
I want to see a clear feature comparison between Sync Sirius and legacy or generic tools,
So that I understand the specific advantages over spreadsheets and single-GDS solutions.

**Acceptance Criteria:**

**Given** the Comparison section renders
**When** a visitor scrolls to it
**Then** `ComparisonTable` displays feature rows contrasting Sync Sirius against legacy alternatives and generic tools; no competitor brand names are used; `SectionHeader` is used

**Given** ComparisonTable renders on mobile (< 768px)
**When** viewed on a narrow viewport
**Then** the table container scrolls horizontally (overflow-x: auto); no content is clipped without scroll access

**Given** a visitor changes locale
**When** LanguageSwitcher fires
**Then** all table content (row labels, descriptions, column headers) renders in the active locale

**Given** Comparison section position in Home.tsx
**When** section order is inspected
**Then** Comparison renders after SyncRevenue and before Security — non-negotiable per trust-build scroll sequence

### Story 1.8: Team Section

As a visitor evaluating trust in the company behind the product,
I want to see the Sync Sirius team with names, roles, and bios,
So that I know real people with relevant expertise stand behind SyncRevenue.

**Acceptance Criteria:**

**Given** the Team section renders
**When** a visitor scrolls to it
**Then** team members display with name, role, and bio; data is sourced from the active locale's translation JSON (`t('team.members')` array); `SectionHeader` is used; placeholder photo renders if no real photo URL is set

**Given** active locale is `pt-BR`
**When** the Team section renders
**Then** member roles and bios display in PT-BR from the pt-BR translation file; no API call is made (Phase 1 is translation-driven)

**Given** a visitor changes locale
**When** LanguageSwitcher fires
**Then** team member roles and bios re-render in the new locale without page reload

**Given** the Team section renders on mobile
**When** viewed at < 768px
**Then** team member cards stack to single column; all content remains accessible and readable

**Given** translation files are inspected for team data
**When** `team.members` array is checked in all three locale files
**Then** each member entry includes at minimum: `name`, `role`, `bio`, `photo`; EN/PT-BR/ES versions have distinct role and bio content

### Story 1.9: Security & Client References Sections

As a security-skeptic visitor evaluating whether to trust Sync Sirius,
I want to read explicit security commitments and see verifiable client references from named agencies,
So that I can clear my trust barrier and feel confident proceeding to the demo form.

**Acceptance Criteria:**

**Given** the Security section renders
**When** a visitor scrolls to it
**Then** they see: (1) encrypted transmission statement, (2) security certification roadmap statement, (3) contract insurance commitment, (4) explicit statement distinguishing what the website collects (contact info) from what SyncRevenue processes — GDS credentials never touch the website

**Given** the ClientReferences section renders
**When** a visitor scrolls to it
**Then** named US travel agency references display with verifiable details — specific agency names, not vague "a leading TMC"; testimonial or reference content is visible

**Given** both sections in scroll order
**When** `Home.tsx` section order is inspected
**Then** Security renders after Comparison and before ClientReferences; ClientReferences renders before DemoScheduler — trust established before the demo ask

**Given** a visitor changes locale
**When** LanguageSwitcher fires
**Then** all Security and ClientReferences copy renders in the active locale

**Given** a screen reader navigates the Security section
**When** tab order and ARIA are inspected
**Then** section uses `<section>` with `aria-labelledby` heading; all trust statements are in readable copy, not image-only; no information conveyed by color alone

### Story 1.10: Privacy Policy Page

As a visitor from Brazil or California,
I want to access a clear Privacy Policy explaining what data is collected and my rights,
So that I can make an informed decision before submitting my personal information.

**Acceptance Criteria:**

**Given** a visitor navigates to `/privacy`
**When** `Privacy.tsx` renders
**Then** the page displays: data collected (name, email, company, phone, role, GDS system, message), storage method (secured SQLite, admin-only access), data retention (24 months from submission date), data removal contact, LGPD and CCPA coverage; GDS credentials explicitly noted as never collected by the website

**Given** active locale is `pt-BR`
**When** `/privacy` renders
**Then** all content displays in PT-BR from the pt-BR translation file; route is `/privacy` (not `/pt-BR/privacy`) — single route, i18n-driven content

**Given** a visitor changes locale on the Privacy Policy page
**When** LanguageSwitcher fires
**Then** Privacy Policy content updates to the new locale without navigation or page reload; scroll position is not reset

**Given** the Privacy Policy link in the footer
**When** a visitor clicks it
**Then** React Router navigates to `/privacy` without full page reload; browser back returns to home

**Given** the Privacy Policy content
**When** inspected for compliance
**Then** it states: no analytics/tracking cookies at MVP, only functional cookies; lead data deleted after 24 months; all three locale versions convey identical legal commitments

## Epic 2: Lead Capture & Conversion (Phase 1 MVP — Part B)

Visitors can submit demo requests and contact inquiries with locale-aware validation, receive on-page confirmation, and Sync Sirius receives instant SMTP notifications. All lead data securely stored with rate limiting enforced.

**FRs covered:** FR6, FR9, FR10, FR11, FR12, FR13, FR15, FR16, FR22, FR38, FR39, FR40

### Story 2.1: Backend Infrastructure — Database, DAOs & Middleware

As a developer,
I want the complete Express server with middleware stack, all 4 DB tables, DAO layer, and Zod schemas in place,
So that all lead capture API routes have a secure, validated foundation to build on.

**Acceptance Criteria:**

**Given** Express server is initialized
**When** `server/index.ts` is inspected
**Then** middleware stack applies in order: `helmet()` → `cors({ origin: process.env.ALLOWED_ORIGIN })` → `express.json()` → rate limit (per route) → auth (admin routes); no `VITE_`-prefixed secrets exist anywhere in `src/`

**Given** the DB schema is initialized
**When** `server/db.ts` runs
**Then** all 4 tables are created if absent: `demo_requests`, `contacts`, `team_members`, `admin_users` — with exact columns, types, and CHECK constraints per architecture spec; tables use ANSI SQL (no SQLite-specific syntax)

**Given** the DAO layer is implemented
**When** `server/dao/` is inspected
**Then** four DAO files exist: `leads.dao.ts`, `contacts.dao.ts`, `team.dao.ts`, `admin.dao.ts`; all SQL lives in DAO files — no `db.prepare()` calls in route handlers; DAO methods return typed objects

**Given** rate limit middleware is applied
**When** `/api/demo` or `/api/contact` receives > 20 requests in 15 minutes from the same IP
**Then** subsequent requests receive HTTP 429 with `{ success: false, message: string }`

**Given** Zod schemas are implemented
**When** `server/schemas/demo.schema.ts` and `server/schemas/contact.schema.ts` are inspected
**Then** both include strict locale validation: `z.enum(['en', 'pt-BR', 'es'])`; GDS field validates against allowed enum; all required fields are non-empty strings

**Given** security headers are applied
**When** an HTTP response from any Express route is inspected
**Then** Helmet default headers are present; `Access-Control-Allow-Origin` is set to `ALLOWED_ORIGIN` only — no wildcard

**Given** the mailer is implemented
**When** `server/lib/mailer.ts` is inspected
**Then** `sendNotification(subject, body)` wraps `transporter.sendMail()` in `try/catch` that logs errors and never throws; callers do not need to await it for the HTTP response to succeed

### Story 2.2: Demo Request Form — Full Stack

As a visitor ready to learn more about SyncRevenue,
I want to submit a demo request with my contact details and GDS system,
So that the Sync Sirius team can reach out and schedule a personalized demo.

**Acceptance Criteria:**

**Given** the DemoForm renders
**When** a visitor views it
**Then** 8 fields are visible: name (required), email (required), company (required), phone (optional), role (required), GDS system dropdown (required: Amadeus/Sabre/Galileo/Worldspan/Other/None yet), message (optional); locale is auto-filled from `useLocaleStore` as a hidden field; required fields marked with asterisk; optional fields labeled "(optional)"

**Given** a visitor leaves a required field and moves focus away
**When** blur fires on that field
**Then** inline error message appears below the field in the active locale; error uses `text-destructive`; `aria-describedby` links error to field; no Toast for field validation errors

**Given** a visitor has not completed all required fields
**When** they interact with the submit button
**Then** submit button is disabled; no API call is made

**Given** a visitor completes all required fields with valid data and clicks submit
**When** `useDemo` hook fires
**Then** button transitions to `submitting` state (spinner + "Sending…", disabled); `POST /api/demo` fires with `{ name, email, company, phone, role, gds, message, locale }`

**Given** the API receives a valid demo request
**When** `POST /api/demo` is processed
**Then** rate limit runs first; Zod validates server-side (locale allowlist enforced); `leads.dao.ts insertLead()` writes to `demo_requests`; `sendNotification()` fires asynchronously; response is `{ success: true, message: '...' }` HTTP 201 — DB write succeeds regardless of SMTP outcome

**Given** the API returns success
**When** `useDemo` hook receives the response
**Then** form status transitions to `success`; form is replaced in-place by "Request received! Our team will reach out within 1 business day." in active locale; confirmation region has `aria-live="polite"`; no page redirect

**Given** a visitor submits the demo form a second time with the same email within 60 seconds (network retry scenario)
**When** `POST /api/demo` is processed
**Then** server checks `demo_requests` for an existing row with matching `email` AND `created_at` within the last 60 seconds; if duplicate found, returns `{ success: true, message: '...' }` HTTP 200 without inserting a second record; visitor sees the same confirmation as a first submission

**Given** the API returns a non-429 error
**When** `useDemo` hook receives the error
**Then** form status transitions to `error`; shadcn Toast appears bottom-right, destructive, auto-dismisses in 5s; form is not cleared; visitor can retry

**Given** active locale is `pt-BR` throughout interaction
**When** validation errors and confirmation render
**Then** all error messages, labels, and confirmation text display in PT-BR

### Story 2.3: Contact Form — Full Stack

As a visitor with a non-demo inquiry,
I want to submit a contact message with a subject routing to the right service area,
So that the Sync Sirius team can respond to my specific inquiry.

**Acceptance Criteria:**

**Given** the Contact section renders with its form
**When** a visitor scrolls to it
**Then** form contains: name (required), email (required), subject/service dropdown (required: SyncRevenue, BI/Data Analytics, OBTs, Custom Development, Other), message (required); labels above fields; required fields asterisked; `SectionHeader` used

**Given** a visitor selects "BI/Data Analytics" from the subject dropdown and submits
**When** `POST /api/contact` is processed
**Then** the same contact form handles BI/Analytics, OBT, and Custom Dev inquiries — no separate form; subject is included in payload and SMTP notification for team routing

**Given** a visitor submits the contact form with valid data
**When** `POST /api/contact` is processed
**Then** rate limit runs; Zod `contactSchema` validates (locale allowlist enforced); `contacts.dao.ts insertContact()` writes to `contacts` table; `sendNotification()` fires asynchronously; response is `{ success: true, message: '...' }` HTTP 201

**Given** the API returns success
**When** `useContact` hook receives the response
**Then** form replaced in-place by confirmation in active locale; `aria-live="polite"` on confirmation region; no redirect

**Given** field-level validation
**When** a visitor blurs an invalid field
**Then** inline error appears in active locale; no Toast for field errors; submit disabled until all required fields valid

**Given** the API returns 429
**When** `useContact` hook receives the error
**Then** inline error in active locale appears below the form — not a Toast

**Given** the contact form submission writes to DB
**When** the `contacts` row is inspected
**Then** `locale` column holds the value from `useLocaleStore` at time of submission

**Given** a visitor submits the contact form a second time with the same email within 60 seconds (network retry scenario)
**When** `POST /api/contact` is processed
**Then** server checks `contacts` for an existing row with matching `email` AND `created_at` within the last 60 seconds; if duplicate found, returns `{ success: true, message: '...' }` HTTP 200 without inserting a second record

### Story 2.4: DemoScheduler Section & Multiple CTA Entry Points

As a visitor ready to book a demo after reviewing trust signals,
I want to encounter a compelling call-to-action section after the trust content and in the navbar,
So that I can access the demo form from wherever I am in the scroll journey.

**Acceptance Criteria:**

**Given** the DemoScheduler section renders in scroll order
**When** a visitor scrolls past ClientReferences
**Then** a dark-navy DemoScheduler section appears with headline, supporting copy, and primary `GradientButton lg` "Schedule a Demo"; section uses dark gradient background (visual bookend matching hero)

**Given** a visitor clicks "Schedule a Demo" in the hero
**Given** a visitor clicks "Schedule a Demo" in the Navbar
**Given** a visitor clicks "Schedule a Demo" in the DemoScheduler section
**When** any CTA is clicked
**Then** all three route to the same DemoForm; no divergent form paths exist

**Given** the DemoForm is section-embedded
**When** a visitor fills the form
**Then** trust signals remain visible by scrolling up — form is not in a modal that hides context

**Given** DemoScheduler section position in `Home.tsx`
**When** inspected
**Then** DemoScheduler appears after ClientReferences and before Contact

**Given** DemoScheduler renders on mobile (< 768px)
**When** viewed
**Then** CTA button has ≥ 44×44px touch target; no horizontal overflow

### Story 2.5: SMTP Notification — Demo & Contact

As a Sync Sirius team member,
I want to receive an immediate email notification for each demo request and contact form submission,
So that I can respond to qualified leads without checking a dashboard.

**Acceptance Criteria:**

**Given** a valid demo request is submitted
**When** `leads.dao.ts insertLead()` completes
**Then** `sendNotification()` is called asynchronously with subject "New Demo Request — [Company]" and body containing all fields (name, email, company, phone, role, GDS, message, locale, timestamp); HTTP response returns to visitor before `sendMail` resolves

**Given** a valid contact form is submitted
**When** `contacts.dao.ts insertContact()` completes
**Then** `sendNotification()` is called with subject "New Contact — [Subject]" and body containing name, email, subject, message, locale, timestamp

**Given** the SMTP server is unreachable
**When** `transporter.sendMail()` throws
**Then** error is logged server-side; visitor's HTTP response is unaffected (already sent as 201); no 5xx produced; lead record in DB is not rolled back

**Given** SMTP credentials are configured
**When** `server/lib/mailer.ts` is inspected
**Then** all SMTP config (host, port, user, pass) comes from `process.env` only — no credentials in source; `NOTIFY_EMAIL` is the recipient for all notifications

### Story 2.6: Form Accessibility & Locale-Aware Validation

As a visitor using a screen reader or keyboard-only navigation,
I want to complete and submit the demo and contact forms without using a mouse,
So that I have equal access to Sync Sirius's primary conversion path.

**Acceptance Criteria:**

**Given** a keyboard user opens the DemoForm
**When** they press Tab through the form
**Then** focus moves through fields in visual reading order; all fields, dropdowns, and the submit button are reachable via Tab; no unintended focus traps

**Given** each form field renders
**When** the DOM is inspected
**Then** every `<input>`, `<select>`, and `<textarea>` has an associated `<label>` via `htmlFor`/`id` pair; `aria-required="true"` on required fields; `aria-describedby` links each field to its error message element

**Given** `createDemoSchema(t: TFunction)` is called with the active `t` function
**When** validation runs
**Then** error messages use `t('forms.demo.nameError')`, `t('forms.demo.emailError')`, etc.; switching locale before submitting re-validates and shows errors in the new locale

**Given** the form confirmation message renders
**When** a screen reader user submits successfully
**Then** `aria-live="polite"` on confirmation region; screen reader announces confirmation text within ≤ 1s; focus is not lost

**Given** all form interactive elements
**When** focus-visible is active
**Then** focus rings are visible: `focus-visible:ring-2`; ring is `ring-blue-600` on light sections, `ring-white` on dark sections

**Given** the GDS system dropdown renders
**When** a keyboard user interacts with it
**Then** options are navigable via arrow keys; selected option is announced by screen reader; field is clearly labeled

### Story 2.7: Security Hardening — Rate Limiting, Headers & Locale Allowlist

As a Sync Sirius operator,
I want all form submission endpoints protected with rate limiting, security headers, and server-side locale validation,
So that the site is not abused by bots and lead data remains clean and secure.

**Acceptance Criteria:**

**Given** a rate limit test
**When** 21 requests to `POST /api/demo` are sent from the same IP within 15 minutes
**Then** the 21st request receives HTTP 429 with `{ success: false, message: 'Too many requests' }`; the first 20 succeed

**Given** the same applies to `POST /api/contact`
**When** tested identically
**Then** same 429 behavior; rate limit windows on `/api/demo` and `/api/contact` are independent

**Given** a request to `POST /api/demo` with `locale: "fr"`
**When** Zod server-side schema validates
**Then** request is rejected with HTTP 400 and `{ success: false, message: '...', field: 'locale' }`; `fr` is not written to DB

**Given** any Express route is called
**When** HTTP response headers are inspected
**Then** Helmet default headers are present; `Access-Control-Allow-Origin` is `ALLOWED_ORIGIN` env var only — no wildcard

**Given** a SQL-injection attempt in any form field
**When** the DAO executes the query
**Then** better-sqlite3 parameterized queries prevent injection; malicious string is stored as literal text or rejected; no SQL error surfaces to client

**Given** `tsc && vite build` is run
**When** `dist/client/` is inspected
**Then** no `VITE_`-prefixed env vars containing secrets appear in the client bundle

## Epic 3: Content Polish & SEO (Phase 2)

The site gains real team photos and bios, smooth animations and micro-interactions, full SEO metadata (hreflang/OG/sitemap/robots.txt), polished mobile experience, and a commission audit lead magnet for Sofia's journey.

**FRs covered:** FR14

### Story 3.1: Real Team Photos & Bio Content

As a visitor evaluating the people behind SyncRevenue,
I want to see real photos and complete bios for the Sync Sirius team,
So that my trust in the company is grounded in real, verifiable people.

**Acceptance Criteria:**

**Given** real team photos are provided
**When** `Team.tsx` renders
**Then** actual photos display in place of placeholders; images have explicit `width`/`height` attributes to prevent CLS; images below the fold use `loading="lazy"`; each photo has a meaningful `alt` attribute (e.g., "Maria Silva, Head of Operations")

**Given** real bio content is written in all three locales
**When** `team.members` translation keys are updated
**Then** EN, PT-BR, and ES bios contain complete, distinct professional bios; no code changes are required — JSON-only update

**Given** a visitor views the Team section
**When** a team member card renders
**Then** photo, name, role, and bio are all visible; LinkedIn link is present if URL is set; layout remains single-column on mobile

### Story 3.2: Animations & Micro-Interactions

As a visitor scrolling through the Sync Sirius site,
I want subtle, purposeful animations on section entry and interactive elements,
So that the experience feels polished and premium without distracting from the content.

**Acceptance Criteria:**

**Given** Framer Motion is installed
**When** a content section enters the viewport
**Then** the section animates in with a subtle fade + translate-y (20px → 0, opacity 0 → 1, ~400ms ease-out); animation triggers once per section, not on re-scroll

**Given** a visitor has `prefers-reduced-motion: reduce` set
**When** any animation would fire
**Then** animations are suppressed; content renders at final position immediately; no layout shift

**Given** GradientButton hover state
**When** a visitor hovers over any primary CTA
**Then** a smooth brightness/gradient transition fires (~150ms); button does not shift position or change size

**Given** the LanguageSwitcher is used
**When** locale changes and content re-renders
**Then** no flash of untranslated content; no layout shift; scroll position is preserved

**Given** `tsc && vite build` runs with Framer Motion added
**When** bundle is analyzed
**Then** Framer Motion is code-split with the sections that use it (not in the main bundle); LCP ≤ 2.5s is not regressed

### Story 3.3: SEO Metadata — Meta Tags, OG, hreflang & Sitemap

As a potential customer searching for GDS commission recovery tools,
I want the site to appear correctly in search results with proper language signals,
So that Sync Sirius captures organic traffic from EN, PT-BR, and ES markets.

**Acceptance Criteria:**

**Given** the homepage renders
**When** page `<head>` is inspected
**Then** `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">`, and `<meta property="og:url">` are all populated with locale-appropriate content

**Given** the active locale is `pt-BR`
**When** `<head>` is inspected
**Then** `<html lang="pt-BR">` is set; `<link rel="alternate" hreflang="en">`, `<link rel="alternate" hreflang="pt-BR">`, `<link rel="alternate" hreflang="es">`, and `<link rel="alternate" hreflang="x-default">` are all present

**Given** `sitemap.xml` is generated
**When** `/sitemap.xml` is fetched
**Then** it lists public pages (/, /privacy) with all three locale alternates; `lastmod` dates are present

**Given** `robots.txt` exists
**When** `/robots.txt` is fetched
**Then** all crawlers are allowed for public pages; `Disallow: /admin` prevents admin route indexing

**Given** the Privacy Policy page
**When** its `<head>` is inspected
**Then** `<meta name="robots" content="noindex">` is NOT set; locale-appropriate title and meta description are present

### Story 3.4: Mobile UX Polish Pass

As a visitor accessing Sync Sirius on a mobile device,
I want a smooth, visually refined mobile experience,
So that the site feels as premium on my phone as it does on desktop.

**Acceptance Criteria:**

**Given** the site is viewed at 375px viewport
**When** each section is reviewed
**Then** no horizontal overflow; all headings fit without truncation; spacing between sections is generous; card grids stack cleanly to single column

**Given** the hero on mobile
**When** viewed at 375px
**Then** H1 is 32–36px; StatRow stacks vertically; TrustBar is 2×2 grid at 480px or horizontal scroll below; CTA is full-width or near-full-width

**Given** the navbar hamburger overlay on mobile
**When** open
**Then** nav links have ≥ 44px tap targets; overlay closes on outside tap; open/close animation respects `prefers-reduced-motion`

**Given** all form fields on mobile (< 640px)
**When** viewed
**Then** all fields are full-width; no side-by-side fields; submit button is full-width

**Given** a Lighthouse mobile audit is run
**When** results are reviewed
**Then** Performance score ≥ 90; LCP ≤ 2.5s on simulated 4G; CLS < 0.1; no accessibility violations flagged

### Story 3.5: Commission Audit Lead Magnet

As a travel agency back-office manager in the PT-BR market,
I want to submit my BSP data for a free commission leakage analysis,
So that I can bring concrete evidence of recoverable revenue to my director without committing to a demo.

**Acceptance Criteria:**

**Given** Story 3.5 is being implemented
**When** `server/db.ts` is updated
**Then** an `audit_requests` table is created if absent with columns: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `name TEXT NOT NULL`, `email TEXT NOT NULL`, `company TEXT NOT NULL`, `role TEXT NOT NULL`, `gds TEXT NOT NULL`, `notes TEXT`, `locale TEXT NOT NULL CHECK (locale IN ('en','pt-BR','es'))`, `created_at TEXT NOT NULL DEFAULT (datetime('now'))`; rate limiting on `POST /api/audit` uses same 20 req/15-min window as demo and contact endpoints

**Given** a commission audit section is added to the home page
**When** a visitor scrolls to it
**Then** the section explains the free audit offer (30 days BSP data → leakage report); a clear CTA opens or scrolls to the audit request form

**Given** the commission audit form renders
**When** a visitor views it
**Then** fields include: name (required), email (required), company (required), role (required), GDS system (required), notes (optional); locale is captured as hidden field; all patterns match existing forms (label-above, blur-validation, asterisk for required)

**Given** a visitor submits the audit form
**When** `POST /api/audit` is processed
**Then** request is stored in a new `audit_requests` DB table with locale-tagging and rate-limiting matching `demo_requests` patterns; SMTP notification fires to `NOTIFY_EMAIL`; visitor receives in-place confirmation with `aria-live="polite"`

**Given** the audit section position in `Home.tsx`
**When** inspected
**Then** audit section appears after the SyncRevenue section; does not disrupt the Marcus trust-build scroll order

**Given** the audit form on mobile (< 768px)
**When** viewed
**Then** all fields full-width; submit button full-width; keyboard accessible; confirmation is announced by screen reader

### Story 3.6: Story 3.1 Review Follow-ups — Real Team Content & Visual QA

As a Sync Sirius brand owner,
I want the team section to render real, stakeholder-approved photos, names, and verified LinkedIn URLs across EN/PT-BR/ES,
So that the public site presents a credible, accurate team to visitors rather than placeholder identities and initials fallbacks.

This story implements the Critical and Medium review follow-ups recorded against Story 3.1 (file: `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` — "Review Follow-ups (AI)" section). The 3.1 code path already supports real photos, locale-aware bios, and conditional LinkedIn anchors; 3.6 supplies the real content + completes the deferred visual QA pass.

**Acceptance Criteria:**

**Given** stakeholder-approved photo assets are supplied
**When** each photo is committed to `public/team/` (WebP, 320×320, optimized)
**Then** the corresponding locale `team.members[].photo` field in `src/i18n/locales/{en,pt-BR,es}/translation.json` is set to `/team/<file>.webp`; the placeholder initials block stops rendering for those members; `width=320 height=320 loading=lazy` attributes remain on every `<img>`

**Given** real team member identities are confirmed
**When** the EN/PT-BR/ES locale `team.members[]` arrays are updated
**Then** each member entry replaces the placeholder role-as-name (`Sync Sirius Operations Lead`, `Sync Sirius Technology Lead`) with a verified person name; `name`, `role`, and `bio` are locale-distinct (not copy-pasted English); deep-key i18n parity test at `src/i18n/index.test.ts` continues to pass

**Given** real LinkedIn URLs are supplied (when applicable)
**When** each locale `team.members[].linkedinUrl` is populated
**Then** the conditional `<a target="_blank" rel="noopener noreferrer">` renders for members with a URL; the `aria-label` uses the existing `team.linkedinAriaLabel` interpolation key (`View {{name}} on LinkedIn` + locale-translated equivalents); members without a URL keep `linkedinUrl: ""` and render no anchor

**Given** the deferred visual QA pass from Story 3.1
**When** a developer runs the dev server (`npm run dev`) and loads the Team section in EN, PT-BR, and ES
**Then** the real photos render without layout shift; alt text reads as `"{name}, {role}"` per locale; LinkedIn links open in a new tab where set and are absent where not set; the Team section on mobile (< 768px) stays single column; results are recorded as a checklist in the 3.6 story file

**Given** all 3.1 review follow-ups are resolved
**When** the 3.6 story is reviewed
**Then** the unchecked review follow-up list in `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md` (Critical/Critical/Medium items + the deferred visual check) is reconciled — each item linked to the 3.6 commit that closed it; no new code paths are introduced; only content fields and asset files change

**Given** the unit + e2e suites
**When** `npm run typecheck`, `npm test`, and `npm run test:e2e` run
**Then** all 234+ unit tests continue to pass; the Story 3.1 Playwright spec `tests/e2e/team-section.spec.ts` either continues to pass unchanged or its `"no placeholder leak"` and `"initials fallback count"` specs are updated to reflect the new real-photo state (whichever truthfully matches the shipped data)

## Epic 4: Admin Operations (Phase 3)

Sync Sirius ops team can manage the full demo pipeline through a secure, JWT-authenticated admin dashboard — view leads by locale/status, triage, update statuses, and manage team content in all three locales.

**FRs covered:** FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37

### Story 4.1: Admin Authentication — Login & Session Management

As a Sync Sirius ops team member,
I want to log in to a secure admin panel with my credentials and maintain a session,
So that I can access lead and team management without re-authenticating every visit.

**Acceptance Criteria:**

**Given** an ops team member navigates to `/admin`
**When** `AdminLayout.tsx` renders
**Then** it checks `useAdminStore.isAuthenticated`; if false, redirects to `/admin/login`; if true, renders the admin outlet

**Given** the admin login page renders
**When** a visitor accesses `/admin/login` while already authenticated
**Then** they are redirected to `/admin/dashboard`

**Given** valid admin credentials are submitted to `POST /api/admin/auth/login`
**When** the server processes the request
**Then** `admin.dao.ts findByEmail()` retrieves the user; `bcrypt.compare()` validates the password (salt rounds ≥ 12); on match, `jwt.sign({ adminId, email }, JWT_SECRET, { expiresIn: '8h' })` is issued; cookie is set: `httpOnly: true`, `sameSite: 'strict'`, `secure: true` in production

**Given** the JWT cookie is set
**When** `useAdminStore` updates
**Then** `isAuthenticated: true` and `email` are stored; admin is redirected to `/admin/dashboard`

**Given** invalid credentials are submitted
**When** `POST /api/admin/auth/login` responds
**Then** HTTP 401 with `{ success: false, message: 'Invalid credentials' }`; no cookie is set; login form shows inline error

**Given** an admin session expires after 8 hours
**When** an authenticated request hits any `/api/admin/*` route
**Then** `auth.ts` middleware verifies the JWT; if expired or invalid, returns HTTP 401; `AdminLayout.tsx` detects and redirects to `/admin/login`

**Given** an admin clicks "Log out"
**When** `POST /api/admin/auth/logout` fires
**Then** JWT cookie is cleared server-side; `useAdminStore` resets to `isAuthenticated: false`; admin is redirected to `/admin/login`

**Given** `db.seed.ts` is run with `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars
**When** executed
**Then** initial admin user is created in `admin_users` with bcrypt-hashed password (salt ≥ 12); script is idempotent — re-running does not create a duplicate

### Story 4.2: Leads Dashboard — View & Filter

As a Sync Sirius ops team member,
I want to view all submitted demo requests in a filterable dashboard,
So that I can quickly find and prioritize leads by locale or status.

**Acceptance Criteria:**

**Given** an authenticated admin navigates to `/admin/leads`
**When** `Leads.tsx` renders
**Then** all `demo_requests` rows display in a table sorted by `created_at` descending; columns include: name, company, email, GDS, role, locale label, status badge, created date, message preview

**Given** the leads table renders
**When** a row is inspected
**Then** full `message` content is accessible (inline or expandable); locale displays as readable label (EN / PT-BR / ES); status is a color-coded badge: pending (amber), contacted (blue), qualified (green)

**Given** the locale filter is applied
**When** an admin selects "PT-BR"
**Then** `GET /api/admin/leads?locale=pt-BR` fires; only PT-BR leads are shown; no page reload

**Given** the status filter is applied
**When** an admin selects "pending"
**Then** `GET /api/admin/leads?status=pending` fires; only pending leads are shown

**Given** both filters are active simultaneously
**When** locale=PT-BR and status=pending are set
**Then** `GET /api/admin/leads?locale=pt-BR&status=pending` fires; table shows only matching leads

**Given** no leads exist
**When** the table renders
**Then** "No leads yet. Demo requests will appear here." displays as plain text

**Given** active filters return zero results
**When** the table renders
**Then** "No leads match this filter." displays with a "Clear filters" button

**Given** the leads table is loading
**When** `GET /api/admin/leads` is in flight
**Then** 3 skeleton rows display via shadcn Skeleton

### Story 4.3: Lead Status Management

As a Sync Sirius ops team member,
I want to update the status of individual leads directly in the dashboard,
So that I can track pipeline progression without leaving the admin interface.

**Acceptance Criteria:**

**Given** a lead row renders in `AdminLeadRow`
**When** an admin views it
**Then** current status is visible as a color-coded badge; an inline control allows status update without navigating away

**Given** an admin changes a lead's status to "contacted"
**When** the status control fires
**Then** `PATCH /api/admin/leads/:id/status` fires with `{ status: 'contacted' }`; auth middleware validates JWT; DAO updates `status` and `updated_at` in `demo_requests`; response is `{ success: true }` HTTP 200; badge updates immediately without full table reload

**Given** an invalid status value is sent
**When** `PATCH /api/admin/leads/:id/status` receives `{ status: 'archived' }`
**Then** server returns HTTP 400 `{ success: false, message: 'Invalid status' }`; DB is not updated

**Given** the admin is unauthenticated (JWT expired)
**When** `PATCH /api/admin/leads/:id/status` fires
**Then** server returns HTTP 401; `AdminLayout.tsx` redirects to `/admin/login`

**Given** a lead's message field contains a security concern
**When** the admin views the lead row
**Then** full message content is visible — inline or via expand — so sales can see the concern before first contact

### Story 4.4: Team Member Management — Create & Edit

As a Sync Sirius ops team member,
I want to add and edit team member profiles with bios in all three languages,
So that the public Team section reflects the current team without a code deployment.

**Acceptance Criteria:**

**Given** an authenticated admin navigates to `/admin/team`
**When** `Team.tsx` (admin) renders
**Then** all `team_members` rows display ordered by `order_index`; columns include: name, role (EN), active status, display order; edit controls are visible per row

**Given** an admin clicks "Add Team Member"
**When** the add form renders
**Then** fields include: name, role_en, role_pt, role_es, bio_en, bio_pt, bio_es, linkedin (optional), photo_url (optional), order_index; all role and bio fields are required; same label-above, asterisk, blur-validation patterns as public forms

**Given** an admin submits a valid new team member
**When** `POST /api/admin/team` is processed
**Then** auth middleware validates JWT; Zod validates all required fields; `team.dao.ts createMember()` inserts into `team_members`; response is `{ success: true, data: { id } }` HTTP 201; new member appears in admin table

**Given** an admin edits an existing team member
**When** `PUT /api/admin/team/:id` is processed
**Then** all editable fields are updated; `team.dao.ts updateMember()` executes; response is `{ success: true }` HTTP 200

**Given** the public `Team.tsx` section after this story
**When** it renders
**Then** team data is fetched from a public `GET /api/team` endpoint (no auth required); only active members are returned ordered by `order_index`; `Team.tsx` replaces `t('team.members')` with API data; locale-specific role/bio selected based on `useLocaleStore.locale`

**Given** bio_en, bio_pt, or bio_es is empty on submit
**When** form validation runs
**Then** inline error appears below the empty field; form is not submitted

### Story 4.5: Team Member Display Order & Active Toggle

As a Sync Sirius ops team member,
I want to control which team members appear on the public site and in what order,
So that I can manage team presentation without a code deployment.

**Acceptance Criteria:**

**Given** the admin team table renders
**When** an admin views it
**Then** rows are ordered by `order_index` ascending; each row has an active/inactive toggle; inactive members have a visual indicator (muted row or badge)

**Given** an admin toggles a team member to inactive
**When** `PATCH /api/admin/team/:id/active` fires with `{ active: false }`
**Then** `team.dao.ts setActive()` updates the `active` column; response is `{ success: true }` HTTP 200; public `GET /api/team` no longer returns this member; public Team section no longer shows them

**Given** an admin updates `order_index` for a member
**When** `PUT /api/admin/team/:id` fires with new `order_index`
**Then** DB is updated; public `GET /api/team` returns members in new order; public Team section reflects the new order on next load

**Given** an unauthenticated request hits `PATCH /api/admin/team/:id/active`
**When** no valid JWT cookie is present
**Then** HTTP 401 is returned; no DB change is made

**Given** a public visitor loads the Team section
**When** `GET /api/team` is called
**Then** only members with `active = 1` are returned ordered by `order_index`; all locale-specific fields (role_en/pt/es, bio_en/pt/es) are included so client selects correct locale

### Story 4.6: Admin Dashboard & Navigation Shell

As a Sync Sirius ops team member,
I want a clean admin navigation shell and a summary dashboard,
So that I can quickly orient myself and navigate between leads and team management.

**Acceptance Criteria:**

**Given** an authenticated admin navigates to `/admin/dashboard`
**When** `Dashboard.tsx` renders
**Then** summary stats display: total leads count, pending leads count, leads by locale (EN/PT-BR/ES counts)

**Given** the admin layout renders
**When** `AdminLayout.tsx` is inspected
**Then** a persistent admin nav includes links to: Dashboard, Leads, Team; current active page is highlighted; a Logout button is visible

**Given** an admin clicks Logout from any admin page
**When** `POST /api/admin/auth/logout` fires
**Then** cookie is cleared; `useAdminStore` resets; redirect to `/admin/login`

**Given** an admin directly navigates to `/admin/leads` without being authenticated
**When** `AdminLayout.tsx` mounts
**Then** `useAdminStore.isAuthenticated` is false; redirect to `/admin/login` fires before any lead data is fetched; no lead data is exposed

**Given** admin pages are inspected for boundary compliance
**When** imports are reviewed
**Then** admin pages import only from `src/pages/admin/`, `src/components/layout/AdminLayout.tsx`, and `src/components/ui/`; no imports from `src/components/sections/`

## Epic 5: Production Deployment (Phase 4)

The site is fully production-ready — deployed on a hosting platform with domain configuration, SSL/TLS, PM2 process management, automated SQLite backups, and uptime monitoring in place.

**FRs covered:** NFR-R3 (auto-restart), NFR-S1 (HTTPS/TLS) — fully realized here

### Story 5.1: Production Build & PM2 Process Management

As a Sync Sirius operator,
I want the application to build cleanly for production and run under PM2 with auto-restart,
So that the server recovers automatically from crashes and stays available 24/7.

**Acceptance Criteria:**

**Given** `tsc && vite build` is run on the production server
**When** the build completes
**Then** `dist/client/` contains hashed static assets + `index.html`; `dist/server/index.js` is the compiled Express server; no TypeScript errors; no missing imports

**Given** `ecosystem.config.js` is committed to the repo
**When** `pm2 start ecosystem.config.js` is run
**Then** the Express server starts as a named process (`syncrevenue-website`); PM2 auto-restarts on crash; `pm2 status` shows the process as `online`

**Given** the Express server crashes
**When** PM2 detects the exit
**Then** PM2 restarts the process within ≤ 5 seconds; crash is logged to PM2 log file; no manual intervention required

**Given** `pm2 startup` is configured on the host
**When** the server reboots
**Then** PM2 and the `syncrevenue-website` process start automatically

**Given** `dist/client/` is served by Express in production
**When** HTTP response headers for a hashed asset are inspected
**Then** `Cache-Control: max-age=31536000, immutable` is set for hashed assets; `Cache-Control: no-cache` is set for `index.html`

### Story 5.2: Domain Configuration & SSL/TLS

As a Sync Sirius operator,
I want the site served over HTTPS on the production domain with a valid SSL certificate,
So that all data in transit is encrypted and browsers show no security warnings.

**Acceptance Criteria:**

**Given** the production domain is configured
**When** a visitor navigates to `http://[domain]`
**Then** they are redirected to `https://[domain]` — no plain HTTP in production

**Given** a valid SSL certificate is issued
**When** a browser connects to the domain
**Then** certificate is valid (not self-signed, not expired); browser shows no security warnings; `Strict-Transport-Security` header is present (set by Helmet)

**Given** `ALLOWED_ORIGIN` env var is set to the production domain
**When** a CORS preflight is sent from the production domain
**Then** `Access-Control-Allow-Origin` matches the production domain exactly; wildcard `*` is never returned

**Given** the `data/sync_sirius.db` file path
**When** a new build is deployed
**Then** the SQLite data file survives the deploy (stored outside `dist/`); `DB_PATH` points to a persistent location

### Story 5.3: Environment Variable Hardening

As a Sync Sirius operator,
I want all production secrets configured securely in the hosting environment,
So that credentials are never exposed in source code, logs, or the client bundle.

**Acceptance Criteria:**

**Given** the production environment is configured
**When** all required env vars are set via hosting platform secrets or VPS `.env`
**Then** all keys from `.env.example` have production values: `PORT`, `DB_PATH`, `JWT_SECRET` (strong random ≥ 32 chars), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL`, `ALLOWED_ORIGIN`

**Given** `dist/client/` is inspected post-build
**When** all JS bundle files are searched for secrets
**Then** `JWT_SECRET`, `SMTP_PASS`, `DB_PATH`, and other server-only vars do not appear; no `VITE_`-prefixed secret vars exist in the codebase

**Given** server logs in production
**When** logs are reviewed during normal operation
**Then** no passwords, JWT secrets, or SMTP credentials appear in log output

**Given** the `.env` file on the VPS
**When** file permissions are inspected
**Then** `.env` is readable only by the process owner (`chmod 600`); `.env` is in `.gitignore` and not committed

### Story 5.4: SQLite Backup Automation

As a Sync Sirius operator,
I want the SQLite database backed up automatically on a schedule,
So that lead data is not permanently lost if the server fails or the DB file is corrupted.

**Acceptance Criteria:**

**Given** a backup script or cron job is configured
**When** it runs (e.g., daily at 2am server time)
**Then** `sync_sirius.db` is copied to a timestamped backup file in a backup directory outside `dist/`

**Given** backup files accumulate
**When** the backup script runs
**Then** backups older than 30 days are deleted automatically; at least 30 daily backups are retained

**Given** the backup directory
**When** inspected
**Then** backup files are not publicly accessible via HTTP; directory is outside the web root

**Given** a backup failure occurs
**When** the script encounters an error
**Then** the error is logged; the production server continues running — backup failure does not affect site availability

### Story 5.5: Uptime Monitoring & Health Check

As a Sync Sirius operator,
I want automated uptime monitoring with alerts when the site goes down,
So that lead capture downtime is detected and resolved before significant demo requests are lost.

**Acceptance Criteria:**

**Given** a health check endpoint exists
**When** `GET /api/health` is called
**Then** the endpoint returns `{ success: true, status: 'ok', timestamp: '...' }` HTTP 200 if server is running and DB connection is responsive; no auth required; response time < 200ms

**Given** an uptime monitoring service is configured against `GET /api/health`
**When** the monitor is active
**Then** monitor checks every 5 minutes; alert fires to `NOTIFY_EMAIL` within ≤ 5 minutes of the endpoint becoming unreachable

**Given** PM2 crashes and restarts the server
**When** the health check monitor pings during the restart window
**Then** if downtime exceeds the monitoring interval, an alert is sent; once back, monitor resumes without manual reset

**Given** the demo form endpoint under normal production load
**When** `POST /api/demo` is measured
**Then** p95 response time is ≤ 3s; verified via monitoring or load test before go-live
