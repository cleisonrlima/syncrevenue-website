# SPEC — Sync Sirius Institutional Website

> *Stack:* Vite · React · TypeScript · Tailwind CSS · shadcn/ui · Zod · Zustand · i18next · SQLite (better-sqlite3) · Express (embedded)

-----

## 1. Overview

Institutional website for *Sync Sirius, a Miami-based technology company specialized in solutions for travel agencies (air, ground, and hospitality). The site must convey **trust, technical sophistication, and human credibility* — without feeling automated or generic.

*Company location:* Miami, FL — United States
*Primary audience:* Travel agencies and TMCs in the Americas (US, Brazil, Latin America)
*Default language:* English
*Supported languages:* English (EN), Portuguese (PT-BR), Spanish (ES)

The flagship product is *SyncRevenue*, a commission management tool that directly competes with legacy GDS-native commission tools, with native integration to all major GDS.

-----

## 2. Product Goals

- Position Sync Sirius as the technical reference for commission management in the travel industry
- Generate *qualified leads* via SyncRevenue demo scheduling
- Communicate the full portfolio: SyncRevenue, OBTs, custom development, BI/data/ML
- Convey human proximity (real team, photos, stories)
- Guarantee *data security and sensitive variable handling* from the ground up
- Reach international audiences through multilanguage support

-----

## 3. Stack & Architecture

### 3.1 Frontend

|Technology                          |Usage                                                          |
|------------------------------------|---------------------------------------------------------------|
|*Vite*                            |Build tool, dev server, HMR                                    |
|*React 18 + TypeScript*           |Component-based UI with strict typing                          |
|*Tailwind CSS v3*                 |Utility-first styling                                          |
|*shadcn/ui*                       |Accessible, customizable components (Dialog, Form, Toast, etc.)|
|*Zod*                             |Schema validation on client and server                         |
|*Zustand*                         |Lightweight global state (modals, forms, admin session, locale)|
|*i18next + react-i18next*         |Internationalization (EN default, PT-BR, ES)                   |
|*i18next-browser-languagedetector*|Auto-detect browser language                                   |

### 3.2 Backend (embedded in the same project)

|Technology                                               |Usage                                 |
|---------------------------------------------------------|--------------------------------------|
|*Express* (via Vite plugin in dev / standalone in prod)|Internal REST API                     |
|*better-sqlite3*                                       |Local database, zero-config           |
|*Zod*                                                  |Payload validation on all API routes  |
|*bcryptjs*                                             |Password hashing for admin module     |
|*jsonwebtoken*                                         |Stateless auth for admin              |
|*dotenv / Vite env*                                    |Secure environment variable management|

### 3.3 Folder Structure


sync-sirius/
├── .env                          # Sensitive variables (NEVER commit)
├── .env.example                  # Public template without real values
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── server/
│   ├── index.ts
│   ├── db.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── rateLimit.ts
│   ├── routes/
│   │   ├── demo.ts
│   │   ├── contact.ts
│   │   └── admin/
│   │       ├── auth.ts
│   │       ├── leads.ts
│   │       └── team.ts
│   └── schemas/
│       ├── demo.schema.ts
│       └── contact.schema.ts
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── locales/
│   │   │   ├── en/translation.json
│   │   │   ├── pt-BR/translation.json
│   │   │   └── es/translation.json
│   │   └── LanguageSwitcher.tsx
│   ├── store/
│   │   ├── useModalStore.ts
│   │   ├── useLocaleStore.ts
│   │   └── useAdminStore.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   └── sections/
│   │       ├── Hero.tsx
│   │       ├── SyncRevenue.tsx
│   │       ├── Comparison.tsx
│   │       ├── Services.tsx
│   │       ├── Team.tsx
│   │       ├── DemoScheduler.tsx
│   │       └── Contact.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── admin/
│   │       ├── Login.tsx
│   │       ├── Dashboard.tsx
│   │       ├── Leads.tsx
│   │       └── Team.tsx
│   ├── hooks/
│   │   ├── useDemo.ts
│   │   └── useAdmin.ts
│   └── lib/
│       ├── api.ts
│       └── utils.ts
│
└── public/
    └── assets/


-----

## 4. Internationalization (i18n)

### 4.1 Strategy

- *Default language:* English (en)
- *Supported locales:* en, pt-BR, es
- *Detection order:* localStorage → browser Accept-Language → fallback en
- *Switcher:* Globe icon + dropdown in Navbar (EN · PT · ES)
- Language preference persisted in localStorage

### 4.2 Setup (src/i18n/index.ts)

typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import ptBR from './locales/pt-BR/translation.json';
import es from './locales/es/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en:      { translation: en },
      'pt-BR': { translation: ptBR },
      es:      { translation: es },
    },
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;


### 4.3 Translation File Structure (en/translation.json)

json
{
  "nav": {
    "product": "Product",
    "services": "Services",
    "team": "Team",
    "contact": "Contact",
    "scheduleDemo": "Schedule a Demo"
  },
  "hero": {
    "headline": "Commission Management Built for Modern Travel Agencies",
    "subheadline": "SyncRevenue integrates with every major GDS — giving your agency full visibility and control over commissions.",
    "cta_primary": "Schedule a Demo",
    "cta_secondary": "Explore Solutions",
    "badge": "Miami-based · Serving agencies across the Americas"
  },
  "demo": {
    "title": "See SyncRevenue in Action",
    "subtitle": "Fill out the form and our team will reach out within 1 business day.",
    "fields": {
      "name": "Full Name",
      "email": "Work Email",
      "company": "Agency / Company",
      "phone": "Phone (optional)",
      "role": "Your Role",
      "gds": "Current GDS",
      "message": "Anything you'd like us to know?"
    },
    "submit": "Request a Demo",
    "success": "Request received! Our team will reach out within 1 business day.",
    "gds_options": ["Amadeus", "Sabre", "Galileo", "Worldspan", "Other", "None yet"]
  },
  "validation": {
    "name_required": "Full name is required",
    "email_invalid": "Please enter a valid work email",
    "company_required": "Company name is required"
  },
  "footer": {
    "address": "Miami, FL — United States",
    "rights": "© {{year}} Sync Sirius, Inc. All rights reserved.",
    "privacy": "Privacy Policy",
    "terms": "Terms of Service"
  }
}


### 4.4 Locale-aware Zod Validation

typescript
// src/lib/schemas/demo.schema.ts
import { z } from 'zod';
import type { TFunction } from 'i18next';

export const createDemoSchema = (t: TFunction) =>
  z.object({
    name:    z.string().min(2, t('validation.name_required')),
    email:   z.string().email(t('validation.email_invalid')),
    company: z.string().min(2, t('validation.company_required')),
    phone:   z.string().optional(),
    role:    z.string().optional(),
    gds:     z.enum(['Amadeus', 'Sabre', 'Galileo', 'Worldspan', 'Other', 'None yet']).optional(),
    message: z.string().max(500).optional(),
  });


-----

## 5. Database (SQLite)

### 5.1 Migrations

sql
CREATE TABLE IF NOT EXISTS demo_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  company     TEXT NOT NULL,
  phone       TEXT,
  role        TEXT,
  gds         TEXT,
  message     TEXT,
  locale      TEXT DEFAULT 'en',
  status      TEXT DEFAULT 'pending',
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT,
  message     TEXT NOT NULL,
  locale      TEXT DEFAULT 'en',
  read        INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_members (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  role_en     TEXT NOT NULL,
  role_pt     TEXT,
  role_es     TEXT,
  bio_en      TEXT,
  bio_pt      TEXT,
  bio_es      TEXT,
  linkedin    TEXT,
  photo_url   TEXT,
  order_index INTEGER DEFAULT 0,
  active      INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now'))
);


-----

## 6. Environment Variables

### .env.example

env
PORT=3001
NODE_ENV=development

JWT_SECRET=
JWT_EXPIRES_IN=8h
ADMIN_INITIAL_EMAIL=
ADMIN_INITIAL_PASSWORD=

DB_PATH=./data/sync_sirius.db

SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
NOTIFY_EMAIL=

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=20


> *Rule:* No sensitive variable with VITE_ prefix. Only non-sensitive public values may reach the client bundle.

-----

## 7. Landing Page Sections

### 7.1 Navbar

- Sync Sirius logo (SVG)
- Anchor links: Product · Services · Team · Contact
- Fixed CTA: *“Schedule a Demo”* → opens modal
- Language Switcher: globe icon + dropdown (EN · PT · ES)
- Behavior: transparent at top, solid background on scroll

### 7.2 Hero

- Headline focused on SyncRevenue
- Primary CTA: “Schedule a Demo”
- Secondary CTA: “Explore Solutions”
- GDS logos: Amadeus, Sabre, Galileo, Worldspan
- Badge: “Miami-based · Serving agencies across the Americas”

### 7.3 SyncRevenue (flagship product)

- What it is: commission management for travel agencies
- Key differentiators:
  - Integration with *all* major GDS
  - Modern, intuitive interface
  - Competitive pricing
  - Dedicated onboarding and bilingual support
  - Built for the Americas market
- Product screenshots or UI mockups
- Emphasis on financial data security

### 7.4 Comparison Table

> Competitors are *not named*. Columns use generic labels.

|Feature              |SyncRevenue|Legacy Tool A|Legacy Tool B|
|---------------------|-----------|-------------|-------------|
|Multi-GDS Integration|✅ All GDS  |⚠️ Single GDS |⚠️ Limited    |
|Custom Reports       |✅          |✅            |⚠️            |
|Americas Market Focus|✅          |❌            |⚠️            |
|Dedicated Onboarding |✅          |❌            |⚠️            |
|OBT Integration      |✅          |⚠️            |❌            |
|EN + ES + PT Support |✅          |❌            |❌            |
|Modern Interface     |✅          |❌            |⚠️            |

*Column label options (choose at copy stage):*

- “Legacy Tool A / B”
- “Traditional Solutions”
- “Other Platforms”
- Simply leave headers blank and use icons/badges to indicate “competitor” tier

### 7.5 Other Services

- *OBTs (Online Booking Tools)*
- *Custom Development*
- *BI, Data & Machine Learning*

### 7.6 Team

- Photo grid: name, role (served in active locale), LinkedIn
- Data from GET /api/team?locale=en

### 7.7 Demo Scheduler

- Modal form with locale-aware Zod validation
- POST /api/demo with locale field auto-populated
- shadcn/ui Toast feedback + SMTP confirmation email

### 7.8 Contact / Footer

- Form: name, email, subject, message
- Address: Miami, FL — United States
- Copyright: © 2025 Sync Sirius, Inc.
- Links: Privacy Policy · Terms of Service

-----

## 8. Admin Module (/admin)

- JWT in httpOnly cookie
- React ProtectedRoute
- Dashboard: leads by status + locale filter
- Team CRUD: EN/PT/ES fields per member

-----

## 9. Security — Checklist

- [ ] .env in .gitignore, .env.example documented
- [ ] No secret with VITE_ prefix
- [ ] JWT in httpOnly cookie
- [ ] Rate limiting on /api/demo and /api/contact
- [ ] Zod validation on every endpoint
- [ ] Prepared statements via better-sqlite3
- [ ] Security headers via helmet
- [ ] CORS restricted to production domain
- [ ] Passwords with bcryptjs (salt rounds ≥ 12)
- [ ] SMTP credentials never in client bundle
- [ ] locale allowlisted server-side (en | pt-BR | es)

-----

## 10. Design System

### 10.1 Brand Colors (extracted from Sync Sirius logo)

The logo uses a vibrant electric blue gradient — from deep royal blue to bright sky blue — on a deep navy background.


Primary Electric Blue:  #0075F0   — main icon/brand blue
Blue Highlight:         #00A0F0   — gradient top / light accent
Blue Deep:              #0055F0   — gradient bottom / depth
Navy Background:        #0D0D3A   — dark backgrounds, cards, navbar
Slate Mid:              #404070   — secondary text, borders, muted UI
Silver Blue:            #8080A0   — subtle labels, placeholders
White:                  #FFFFFF   — text on dark, light surfaces


### 10.2 Tailwind Tokens (tailwind.config.ts)

typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Core blues — from logo gradient
          electric:  '#0075F0',   // primary CTA, links, icon color
          highlight: '#00A0F0',   // hover states, gradient top
          deep:      '#0055F0',   // gradient bottom, active states
          // Backgrounds
          navy:      '#0D0D3A',   // dark bg — sections, navbar, footer
          slate:     '#404070',   // cards, borders, dividers
          muted:     '#8080A0',   // placeholder text, subtle labels
          // Neutral
          white:     '#FFFFFF',
          offwhite:  '#F4F6FA',   // light section backgrounds
        },
      },
      backgroundImage: {
        // Logo-matching gradient — use on hero, icons, highlights
        'brand-gradient': 'linear-gradient(135deg, #0055F0 0%, #0075F0 50%, #00A0F0 100%)',
        // Dark section gradient
        'brand-dark': 'linear-gradient(180deg, #0D0D3A 0%, #080820 100%)',
      },
      fontFamily: {
        // Defined at implementation stage — avoid Inter/Roboto
        // Candidates: 'Syne', 'DM Sans', 'Outfit', 'Plus Jakarta Sans'
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)', 'sans-serif'],
      },
    },
  },
} satisfies Config;


### 10.3 Usage Guidelines

|Context                      |Color                               |
|-----------------------------|------------------------------------|
|Primary CTA buttons          |brand-gradient or brand.electric|
|Navbar (scrolled) / Footer   |brand.navy                        |
|Dark section backgrounds     |brand-dark gradient               |
|Card borders / dividers      |brand.slate                       |
|Body text on dark bg         |white                             |
|Body text on light bg        |brand.navy                        |
|Muted / placeholder text     |brand.muted                       |
|Hover on interactive elements|brand.highlight                   |
|Active / pressed states      |brand.deep                        |

### 10.4 Visual Identity Rules

- *Logo version on dark bg:* full color (electric blue gradient icon + white wordmark)
- *Logo version on light bg:* full color icon + navy wordmark
- *Never* place the logo on a mid-tone background — use only dark navy or white/offwhite
- The electric blue gradient from the logo icon should appear consistently as a motif: CTA buttons, section dividers, feature icons, active indicators
- Avoid solid flat blue — always use the gradient where brand color is prominent

### 10.5 shadcn/ui Components

Button · Dialog · Form · Input · Select · Textarea · Toast · Badge · Card · Table · Skeleton · Separator · DropdownMenu

-----

## 11. Scripts & Setup

bash
npm install
npm run dev       # frontend + backend concurrently
npm run build     # production build
npm run start     # production server
npm run db:seed   # create initial admin user


json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"tsx watch server/index.ts\"",
    "build": "tsc && vite build",
    "start": "node dist/server/index.js",
    "db:seed": "tsx server/db.seed.ts"
  }
}


-----

## 12. Development Phases

### Phase 1 — Foundation (MVP)

- [ ] Vite + React + TS + Tailwind + shadcn/ui
- [ ] Path aliases (@/)
- [ ] i18next: EN, PT-BR, ES + LanguageSwitcher
- [ ] Express + SQLite + migrations
- [ ] .env + security baseline
- [ ] Full landing page, all text via i18n
- [ ] Demo form functional

### Phase 2 — Content & Polish

- [ ] Team section with real data
- [ ] Animations and micro-interactions
- [ ] SEO: meta, OG, hreflang, sitemap
- [ ] Mobile review

### Phase 3 — Admin

- [ ] JWT auth (httpOnly cookie)
- [ ] Leads dashboard with locale filter
- [ ] Team CRUD (EN/PT/ES)
- [ ] Email notifications on new lead

### Phase 4 — Production

- [ ] Deploy (VPS / Railway / Render)
- [ ] Domain + SSL
- [ ] SQLite backup automation
- [ ] Uptime monitoring

-----

## 13. Technical Decisions & Rationale

|Decision                     |Rationale                                                        |
|-----------------------------|-----------------------------------------------------------------|
|*Single project*           |One deploy, no cross-service CORS                                |
|*SQLite*                   |Zero-config, no infra cost                                       |
|*JWT in httpOnly cookie*   |XSS mitigation                                                   |
|*Zod server + client*      |Single schema, single source of truth                            |
|*Zustand*                  |Lightweight, no boilerplate                                      |
|*shadcn/ui*                |Full control, no version lock-in                                 |
|*i18next*                  |Industry standard, robust detection + fallback                   |
|*locale in DB*           |Market segmentation: US / Brazil / LATAM                         |
|*No competitor names in UI*|Avoids legal/brand risk; “Legacy Tool A/B” is cleaner positioning|

-----

Spec v1.2 — Sync Sirius, Inc. · Miami, FL
Updated: brand colors from logo · comparison table anonymized