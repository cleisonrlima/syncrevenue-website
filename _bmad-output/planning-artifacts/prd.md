---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
releaseMode: phased
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-syncrevenue-website.md'
  - '_bmad-output/planning-artifacts/product-brief-syncrevenue-website-distillate.md'
workflowType: 'prd'
classification:
  projectType: web_app
  domain: B2B SaaS Marketing / Lead Generation
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document — syncrevenue-website

**Author:** Pri  
**Date:** 2026-05-13

---

## Executive Summary

Sync Sirius, Inc. (Miami, FL) is building its institutional website to establish market presence and generate qualified demo pipeline across the Americas. The site is the primary trust-building and lead-generation surface for a company whose flagship product — SyncRevenue — recovers 15–25% of commission revenue that mid-market and enterprise travel agencies lose annually through GDS discrepancies, debit memo disputes, and manual BSP/ARC reconciliation failures.

**Classification:** Web Application (React/Vite SPA + embedded Express) · B2B SaaS Marketing / Lead Generation · Medium complexity · Greenfield

**Target audience:** Agency owners, CEOs, and CFOs at mid-market through enterprise travel agencies and TMCs across the US, Brazil, and Latin America. Secondary: back-office managers and ticketing supervisors who experience the daily pain the product solves.

**Core obstacle:** Security-sensitive buyers must trust Sync Sirius with GDS credentials before any value exchange. The website is the primary instrument for overcoming that obstacle before a human sales touch.

**Primary conversion:** Demo scheduling for SyncRevenue. Secondary conversions (quotation/meeting requests) serve the BI/Data Analytics pillar and supporting services (OBTs, Custom Development). No pricing disclosed — all pricing is a post-demo sales conversation.

### What Makes This Special

Sync Sirius occupies a market position no current competitor holds: Americas-native, multi-GDS, trilingual (EN/PT-BR/ES), serving mid-market through enterprise. GDS-native tools (Amadeus Agency360, Sabre Red 360) are single-GDS locked. TravelWorks and MIDOCO are Europe-oriented and cost-prohibitive for LatAm mid-market. Generic tools (QuickBooks + spreadsheets) have no GDS logic.

The website differentiates through three trust layers: (1) encrypted data handling + security certification roadmap + contract insurance commitment, (2) client success references from recognized US agencies, and (3) a free commission audit lead magnet — 30 days of BSP data analyzed for recoverable leakage — giving high-intent prospects proof of value before committing to a demo.

Premium specialist positioning (not startup, not generic SaaS platform) is the visual and copy anchor throughout. The site signals that Sync Sirius knows the Americas travel agency market specifically, not travel tech in general.

---

## Success Criteria

### User Success

- Visitor arriving from paid ad completes demo request form without friction — primary success action
- Form submission confirmed within the visit session (no drop-off at form)
- Trust signals (security statement, client references, contract insurance) encountered before form — visitor arrives at CTA already informed
- Non-SyncRevenue visitors (BI/Analytics, Custom Dev interest) reach quotation/meeting request path without dead-ending

### Business Success

- **Primary KPI:** 8 qualified demo requests/month by end of month 6 post-launch
- **Market weight:** US and Canada are primary volume targets; Brazil and LATAM secondary at launch
- **Lead tracking:** All demo requests tracked by locale (en / pt-BR / es) and status in admin dashboard
- **Lead magnet:** Free commission audit offered as trust-building entry point; success measured at demo booking, not audit submission
- **Secondary conversions:** Quotation/meeting requests for BI/Analytics and other services tracked separately

### Technical Success

Demo form available 24/7 (99.9% uptime) and page load meeting performance targets (LCP ≤ 2.5s). Full specifications in Non-Functional Requirements.

### Measurable Outcomes

| Metric | Target | Timeframe |
|---|---|---|
| Qualified demos booked | 8/month | Month 6 post-launch |
| Demo form uptime | 99.9% | Continuous |
| LCP page load | ≤ 2.5s | At launch |
| Lead locale split tracked | US/CA/BR/LATAM | Per submission |

---

## Project Scope & Phased Delivery

**MVP Approach:** Revenue/conversion MVP — launch the minimum that generates qualified demo pipeline. Every Phase 1 feature either drives conversion or builds the trust required for conversion.  
**Resource Requirements:** Small team (1–2 devs). SQLite zero-config + monorepo architecture minimizes infra complexity at launch.

### Phase 1 — MVP

**Journeys supported:** Marcus (CFO paid ad → demo booked), Ricardo (security-skeptic → trust signals → demo booked)

- Full site all sections: Hero, SyncRevenue, Services/Portfolio, Comparison, Team, Demo Scheduler, Contact
- Trilingual i18n (EN / PT-BR / ES) — language detection from localStorage → browser → fallback `en`
- Demo request form — all fields (name, email, company, phone, role, GDS, message, locale), Zod validation, SMTP notification to internal team
- Contact form — secondary conversion path
- Trust/security statement — encrypted data handling, certification roadmap, contract insurance commitment
- Client references from US agencies — social proof section
- Privacy Policy page — LGPD + CCPA compliance, accessible in all three locales
- Security baseline — rate limiting, helmet headers, CORS restricted, no secrets in client bundle
- Responsive — functional on mobile, tablet, desktop

### Phase 2 — Polish

**Journeys supported:** Sofia (organic PT-BR → commission audit request)

- Real team photos and bios replacing placeholders
- Animations and micro-interactions
- SEO: meta tags, OG, hreflang (en/pt-BR/es), sitemap.xml, robots.txt
- Mobile UX review pass — polish beyond functional
- Commission audit lead magnet form (30-day BSP data → leak analysis)

### Phase 3 — Admin

**Journeys supported:** Ana (ops team → lead management)

- Admin login (JWT, httpOnly cookie)
- Leads dashboard: locale filter, status management (pending / contacted / qualified), message visible
- Team CRUD: EN/PT/ES bios, display order, active/inactive toggle
- Email notification on new lead arrival

### Phase 4 — Deploy & Operations

- Production deployment (VPS / Railway / Render — decision deferred)
- Domain + SSL
- SQLite backup automation
- Uptime monitoring

### Risk Mitigation

**Technical:** Monorepo SPA + Express is proven stack. i18n complexity managed via i18next with server-side locale allowlist. Main risk: locale-aware Zod validation — mitigated by `createDemoSchema(t: TFunction)` pattern already defined.

**Market:** 8 demos/month target depends on paid ad performance, not website alone. Website's job is conversion — Sync Sirius controls ad spend and targeting. Risk accepted.

**Resource:** If team is smaller than expected, Phase 3 (admin dashboard) can slip without blocking lead collection — leads captured via SMTP notification to internal team.

---

## User Journeys

### Journey 1: Marcus — The CFO Who Doesn't Know What He's Losing

**Opening Scene:** Marcus is CFO at a 12-person travel agency in Miami. He's seen the paid ad three times this week: "Recovering commissions your agency doesn't know it's missing." He finally clicks. He's skeptical — every SaaS promises ROI. He gives the site 30 seconds.

**Rising Action:** The hero headline lands: "Commission Management Built for Modern Travel Agencies." Not generic fintech. Specifically his world. He scrolls. The comparison section shows exactly what his team does today — spreadsheets, manual BSP pulls, debit memos without context. His back-office manager has complained about this for years. The numbers ($5K–$50K/month in recoverable leakage) make him stop scrolling.

**Climax:** He hits the security section. GDS credentials are sacred — he won't hand them to a startup. He reads: encrypted transmission, certification roadmap, contract insurance commitment, two referenced US agency clients he recognizes. Enough. He clicks "Schedule a Demo."

**Resolution:** Form takes 90 seconds. Confirmation: "Our team will reach out within 1 business day." Marcus returns to his spreadsheet feeling like he's already ahead.

*Reveals:* Hero clarity, GDS-specific pain copy, comparison section, security statement, client references, demo form, confirmation UX, SMTP notification to Sync Sirius team.

---

### Journey 2: Sofia — The Back-Office Manager Who Found the Words for Her Pain

**Opening Scene:** Sofia is a ticketing supervisor in São Paulo. Every Monday she opens the debit memo report and spends hours chasing airline reason codes that make no sense. A colleague in a Sabre user group mentions "some US company doing commission reconciliation." She Googles it in Portuguese.

**Rising Action:** The site loads in PT-BR. That alone signals she's in the right place. She reads the SyncRevenue section and for the first time sees her exact job described by someone else: manual BSP reconciliation, debit memo disputes, commission leakage. She's not the decision-maker — her boss controls spending. But she can bring evidence.

**Climax:** She sees the free commission audit offer. 30 days of BSP data → a report showing exactly how much the agency is leaking. Low commitment. High proof. She fills the form.

**Resolution:** She brings the audit results to her director. The numbers justify a demo conversation. Sofia becomes the internal champion who books the demo for her boss.

*Reveals:* PT-BR locale functional from first load, SyncRevenue section copy matching back-office pain, commission audit lead magnet form (Phase 2), locale tracked per lead submission.

---

### Journey 3: Ricardo — The Owner Who Needs More Than a Promise

**Opening Scene:** Ricardo owns a boutique corporate travel agency in Toronto. He's been burned before — a vendor promised secure data handling, then had a breach. His agency's Amadeus credentials are not negotiable. He clicked the ad because the problem is real. He will not click "Book a Demo" without answers.

**Rising Action:** He reads the hero. Convinced on the problem. Scrolls to security section. Encrypted transmission — good. Security certification roadmap — *roadmap*, not certified yet. He pauses. Insurance commitment — interesting, but vague. He's not leaving. He goes looking for proof from people, not the company.

**Climax:** Client references section. Two US agencies he can verify. He reads what they say. If people he could call are already using this, the risk is lower. He scrolls back to the demo form and types: "Before the demo, I need to understand your exact data handling protocol for GDS credentials."

**Resolution:** Form submitted. Sync Sirius team receives the lead with his specific concern visible in the message field. First sales contact is prepared — not surprised.

*Reveals:* Security section prominent and specific, client references verifiable, message field in demo form, lead message visible in admin dashboard, lead status tracking so sales can prioritize security-flagged leads.

---

### Journey 4: Ana — The Sync Sirius Ops Team Member Managing the Pipeline

**Opening Scene:** Ana is on the Sync Sirius commercial team in Miami. Three demo requests came in overnight — one from the US, one from Brazil, one from Canada. She opens the admin dashboard.

**Rising Action:** She logs in via JWT-secured admin login. Dashboard shows all leads sorted by created date, with locale flags visible. She filters by "pending." Updates Marcus's status to "contacted." Routes Sofia's lead to the ops team for audit delivery. Flags Ricardo's lead for the technical founder — security concern in message.

**Climax:** New team member joins. Ana adds the bio in English, Portuguese, and Spanish. Sets display order. Saves. The team section on the live site updates immediately.

**Resolution:** Pipeline is clean. No lead missed. Locale data confirms Brazil is generating more inbound than expected — useful signal for ad spend allocation.

*Reveals:* Admin login (JWT, httpOnly cookie), leads dashboard (locale filter, status update, message visible), team CRUD (EN/PT/ES bios, display order, active/inactive), locale analytics in dashboard.

---

### Journey Requirements Summary

| Capability | Revealed By |
|---|---|
| Hero + comparison copy (GDS-specific) | Marcus, Ricardo |
| Security section + client references | Marcus, Ricardo |
| Demo request form + SMTP notification | Marcus, Ricardo |
| PT-BR locale from first load | Sofia |
| Lead locale tracking per submission | Sofia, Ana |
| Free commission audit lead magnet | Sofia |
| Message field + dashboard visibility | Ricardo, Ana |
| Admin auth + leads dashboard | Ana |
| Lead status management + locale filter | Ana |
| Team CRUD (trilingual) | Ana |

---

## Domain-Specific Requirements

### Compliance & Regulatory

- **Privacy Policy required at launch** — LGPD (Brazil) and CCPA (California) mandate disclosure when collecting personal data (name, email, company, phone, role, GDS system, message) from US/CA/BR visitors. Must include: data collected, storage method, and data removal contact. Accessible in all three locales.
- **LGPD:** No cookie consent banner required at MVP — no tracking/analytics cookies in scope, only functional cookies.
- **CCPA:** Privacy Policy satisfies disclosure obligation at MVP level for California residents.
- **CAN-SPAM:** Not a site-level requirement — site sends no outbound email to leads. Sync Sirius team handles follow-up manually; sales team owns CAN-SPAM compliance.
- **Data retention:** Lead data (demo_requests, contacts) retained for 24 months from submission date, then deleted. Retention period must be disclosed in Privacy Policy.

### Technical Constraints

- **Lead data isolation:** Website collects contact info only. GDS credentials never touch the website — this distinction must be explicit in trust copy and Privacy Policy.
- **Data storage:** Lead data stored in secured SQLite with no public API exposure. Admin access JWT-gated only.
- **SMTP scope:** Notification email goes to Sync Sirius internal address (`NOTIFY_EMAIL`) only — no outbound email to leads from the site.

### Risk Mitigations

- **Missing Privacy Policy = legal exposure** in Brazil and California — must be live at Phase 1 launch, not deferred.
- **Trust copy must clearly separate** what the website collects from what SyncRevenue processes — conflating the two increases security-skeptic drop-off.

---

## Web App Technical Requirements

### Architecture

Single-page application (SPA) — Vite + React 18 + TypeScript, embedded Express backend (same monorepo). No server-side rendering. Three locales served from same SPA via i18next language detection.

- **Routing:** React Router client-side. Language detected via localStorage → browser navigator → fallback `en`. No locale subdomains.
- **Backend:** Express embedded, runs as separate process. API routes under `/api/`. No public API — all endpoints serve the frontend only.
- **Build:** `tsc && vite build` → static assets + `dist/server/index.js`. Single deployment artifact.

### Browser Support

Modern browsers only (Chrome, Firefox, Safari, Edge — latest 2 versions each). IE11 and legacy mobile browsers not supported. B2B audience operates on modern corporate devices.

### Responsive Design

Breakpoints: mobile (< 768px), tablet (768–1024px), desktop (> 1024px). Phase 1 must be functional on mobile. Polished mobile experience is Phase 2.

### SEO

**Phase 2 — not MVP scope.** Phase 1 traffic is paid ads (direct URL), not organic search. Phase 2 adds: meta tags, OG, hreflang (en/pt-BR/es), sitemap.xml, robots.txt.

### Accessibility

WCAG 2.1 AA compliance target across all public-facing pages. Implementation notes:
- Validate brand blues (#0075F0 on white) against WCAG AA contrast ratios
- shadcn/ui components are accessibility-aware by default — maintain ARIA patterns when customizing
- i18next locale switching must not break focus or cause layout shift

---

## Functional Requirements

### Site Content & Navigation

- **FR1:** Visitors can view a Hero section presenting SyncRevenue's value proposition and primary CTA
- **FR2:** Visitors can view a SyncRevenue product section describing commission management capabilities, GDS integrations, and the accuracy commitment
- **FR3:** Visitors can view a Services/Portfolio section presenting all Sync Sirius offerings: SyncRevenue, BI/Data Analytics, OBTs, and Custom Development
- **FR4:** Visitors can view a Comparison section contrasting Sync Sirius with legacy and generic alternatives
- **FR5:** Visitors can view a Team section with member names, roles, and bios
- **FR6:** Visitors can access a Contact section with a secondary general inquiry path
- **FR7:** Visitors can navigate between all site sections via a persistent navbar
- **FR8:** Visitors can access a footer with company address, copyright, and navigation links

### Lead Capture & Conversion

- **FR9:** Visitors can submit a demo request form for SyncRevenue with contact info, company, role, GDS system, and optional message
- **FR10:** Visitors can submit a general contact form for non-demo inquiries — includes a subject/service dropdown routing to SyncRevenue, BI/Data Analytics, OBTs, Custom Development, or Other
- **FR11:** Visitors interested in BI/Analytics, OBTs, or Custom Development submit a quotation or meeting request via the contact form (FR10) using the service dropdown — no separate form
- **FR12:** Visitors receive an on-page confirmation upon successful form submission
- **FR13:** Sync Sirius team receives an internal email notification on each demo request and contact form submission
- **FR14:** Visitors can submit a free commission audit request with BSP data for leakage analysis *(Phase 2)*
- **FR15:** Visitors can access a demo scheduling CTA from multiple sections throughout the site
- **FR16:** All form inputs are validated with locale-aware error messages before submission is processed

### Localization & Internationalization

- **FR17:** Visitors can view the full site in English, Brazilian Portuguese, or Spanish
- **FR18:** The site automatically detects and applies the visitor's preferred language on first load
- **FR19:** Visitors can manually switch the active language at any point
- **FR20:** All UI copy, form labels, validation messages, and error states are displayed in the active language
- **FR21:** The visitor's language preference is persisted across sessions
- **FR22:** Each lead submission is tagged with the locale active at time of submission

### Trust Building

- **FR23:** Visitors can view a security statement covering data encryption, certification roadmap, and contract insurance commitment
- **FR24:** Visitors can view client references from recognized US travel agencies as social proof
- **FR25:** The security section explicitly distinguishes data collected by the website from data processed by SyncRevenue
- **FR26:** Visitors can access a Privacy Policy disclosing data collection, storage, and subject rights
- **FR27:** The Privacy Policy is accessible in all three supported languages
- **FR28:** Visitors can view Sync Sirius positioned as a premium Americas specialist, not a generic SaaS vendor

### Admin Operations *(Phase 3)*

- **FR29:** Admin users can authenticate to a secure admin panel with session management
- **FR30:** Admin users can view all submitted demo requests in a leads dashboard
- **FR31:** Admin users can filter leads by locale (en / pt-BR / es)
- **FR32:** Admin users can filter leads by status (pending / contacted / qualified)
- **FR33:** Admin users can update the status of individual leads
- **FR34:** Admin users can view the full message content of each lead submission
- **FR35:** Admin users can add, edit, and deactivate team member profiles
- **FR36:** Admin users can manage team member bios independently in English, Portuguese, and Spanish
- **FR37:** Admin users can set the display order of team members on the public site

### Compliance & Data Handling

- **FR38:** The system stores all lead submission data in a secured store accessible only to authenticated admins
- **FR39:** The system enforces rate limiting on all form submission endpoints
- **FR40:** The system validates and restricts accepted locale values to the allowlisted set (en / pt-BR / es)

---

## Non-Functional Requirements

### Performance

- LCP ≤ 2.5s on 4G mobile — paid ad landing traffic is bounce-sensitive at first load
- FID < 100ms — form interactions must feel immediate
- CLS < 0.1 — no visual instability on load or locale switch
- Form API endpoints (`/api/demo`, `/api/contact`) respond in ≤ 3s under normal load
- Static assets served with `Cache-Control: max-age=31536000, immutable` for hashed assets; `no-cache` for `index.html`

### Security

- All data in transit encrypted via HTTPS/TLS — no plain HTTP in production
- Lead data accessible only to authenticated admin users (JWT in httpOnly cookie)
- Admin sessions expire after 8 hours — no persistent sessions
- No sensitive environment variables exposed in client bundle (zero `VITE_`-prefixed secrets)
- Rate limiting: max 20 requests per 15-minute window on `/api/demo` and `/api/contact`
- Password hashing: bcrypt, salt rounds ≥ 12
- Security headers (helmet) applied to all server responses
- CORS restricted to production domain only — no wildcard origins
- SQL injection prevented via parameterized queries throughout
- Locale field allowlisted server-side — only `en | pt-BR | es` accepted

### Reliability

- Demo request form endpoint maintains 99.9% availability — downtime equals lost leads
- SMTP notification failure must not surface as 5xx to the visitor — lead saved to DB regardless of email delivery outcome
- Server process auto-restarts on crash in production (process manager required)
- Form submission must not produce duplicate records on network retry

### Accessibility

- WCAG 2.1 AA compliance across all public-facing pages
- All interactive elements operable via keyboard alone
- Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text — brand blue validation required
- All form fields have programmatically associated labels and error messages
- Screen readers can navigate and operate all forms correctly
- Focus indicators visible on all focusable elements

### Scalability

- MVP traffic (hundreds of leads/month) is within SQLite's operational limits — no scaling infrastructure needed at launch
- New translation strings added per locale without code changes — JSON files only

### Architecture Constraints

- Query patterns must remain compatible with PostgreSQL to support migration if SQLite becomes a bottleneck post-launch
- Locale switching completes without full page reload (client-side language swap, no server round-trip)
