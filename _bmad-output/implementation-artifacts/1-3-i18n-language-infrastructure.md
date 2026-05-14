# Story 1.3: i18n & Language Infrastructure

Status: done

## Story

As a visitor,
I want the site to display content in my language automatically and let me switch at any time,
so that I can engage with Sync Sirius content in English, Brazilian Portuguese, or Spanish.

## Acceptance Criteria

1. **Given** a visitor with `pt-BR` browser language arrives with no stored preference **When** the site loads **Then** i18next detects `navigator.language`, sets active locale to `pt-BR`, and all text renders in PT-BR without user action

2. **Given** a returning visitor who previously selected `es` **When** the site loads **Then** i18next reads `i18nextLng` from localStorage and restores `es` as active locale

3. **Given** a visitor with no stored preference and an unsupported browser language **When** the site loads **Then** i18next falls back to `en`

4. **Given** a visitor clicks 'PT-BR' in LanguageSwitcher **When** the locale change fires **Then** these execute in order: `i18next.changeLanguage('pt-BR')` → `useLocaleStore.setState({ locale: 'pt-BR' })` → `localStorage.setItem('i18nextLng', 'pt-BR')`; all visible text updates without page reload; no layout shift

5. **Given** LanguageSwitcher is rendered **When** inspected for accessibility **Then** `aria-label="Select language"` is set; active locale has `aria-current="true"`; all options are keyboard operable via Tab/Enter

6. **Given** translation files exist at `src/i18n/locales/en|pt-BR|es/translation.json` **When** all three files are compared **Then** they contain identical top-level key sets: `nav`, `hero`, `syncrevenue`, `services`, `comparison`, `team`, `security`, `references`, `privacy`, `forms`, `errors`; dot-nested keys max 3 levels deep; no flat key names

7. **Given** a new translation string is needed **When** it is added only to the JSON files **Then** it is available in all three locales without any TypeScript or component changes

## Tasks / Subtasks

- [x] Task 0: Set up Vitest test infrastructure (prerequisite — no test framework installed yet) (AC: all)
  - [x] Install devDependencies (approved for this story): `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
  - [x] Add `/// <reference types="vitest" />` as first line of `vite.config.ts`; add `test` block inside `defineConfig`: `{ globals: true, environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }`
  - [x] Create `src/test/setup.ts`: single line `import '@testing-library/jest-dom'`
  - [x] Add scripts to `package.json`: `"test": "vitest"` and `"test:run": "vitest run"`
  - [x] Verify: `npm run test:run` exits 0 (no tests yet = pass)

- [x] Task 1: Implement `src/store/useLocaleStore.ts` (AC: 3, 4)
  - [x] Replace `export {}` placeholder with Zustand store (see Dev Notes for exact pattern)
  - [x] Export `Locale` type: `'en' | 'pt-BR' | 'es'` — required by main.tsx and LanguageSwitcher
  - [x] Store shape: `{ locale: Locale; changeLocale: (locale: Locale) => void }`; initial `locale: 'en'` (synced to detected locale in main.tsx after i18n init)
  - [x] Create `src/store/useLocaleStore.test.ts`: test initial state `locale === 'en'`; test `changeLocale` updates locale; test `setState` direct update also works
  - [x] `npm run test:run` — all new tests pass

- [x] Task 2: Implement `src/i18n/index.ts` — i18next initialization (AC: 1, 2, 3)
  - [x] Replace `export {}` placeholder with full i18next init (see Dev Notes for exact code)
  - [x] Use `.use(LanguageDetector).use(initReactI18next).init({...})`
  - [x] Detection order: `['localStorage', 'navigator']`; `caches: ['localStorage']`; `lookupLocalStorage: 'i18nextLng'`
  - [x] `fallbackLng: 'en'`; `supportedLngs: ['en', 'pt-BR', 'es']`
  - [x] `react: { useSuspense: false }` — bundled resources don't need Suspense
  - [x] `interpolation: { escapeValue: false }`
  - [x] `export default i18next`
  - [x] Create `src/i18n/index.test.ts`: test supportedLngs contains all 3 locales; test fallbackLng is 'en'; test all 11 required top-level keys present in EN translations (see Dev Notes for test pattern)
  - [x] `npm run test:run` — all new tests pass

- [x] Task 3: Update `src/main.tsx` — import i18n init and sync store (AC: 1, 2, 3)
  - [x] Add `import './i18n'` as **first import** (before React, BrowserRouter, App, index.css)
  - [x] After i18n import, sync Zustand store with i18next-detected locale (see Dev Notes for exact sync code)
  - [x] Do NOT remove existing React mount code (`ReactDOM.createRoot(...).render(...)`)
  - [x] `npm run typecheck` — zero errors

- [x] Task 4: Populate translation JSON files (AC: 6, 7)
  - [x] `src/i18n/locales/en/translation.json` — replace `{}` with full EN content (see Dev Notes)
  - [x] `src/i18n/locales/pt-BR/translation.json` — replace `{}` with full PT-BR content (see Dev Notes)
  - [x] `src/i18n/locales/es/translation.json` — replace `{}` with full ES content (see Dev Notes)
  - [x] Verify: all 11 top-level keys present in all 3 files with identical nested structure; no flat keys; max 3 levels deep
  - [x] Add to `src/i18n/index.test.ts`: test that all 11 required keys exist in loaded `en` translations
  - [x] `npm run test:run` — all tests pass

- [x] Task 5: Implement `src/i18n/LanguageSwitcher.tsx` (AC: 4, 5)
  - [x] Replace placeholder `export default function LanguageSwitcher() { return <div /> }` with full component (see Dev Notes for exact pattern)
  - [x] Props: `className?: string`
  - [x] Use `useLocaleStore()` for current locale — never `i18next.language` directly in component
  - [x] `handleChange` calls locale flow in exact order: `i18next.changeLanguage(locale)` → `useLocaleStore.setState({ locale })` → `localStorage.setItem('i18nextLng', locale)`
  - [x] Wrapper: `<div role="group" aria-label="Select language" className={...}>`
  - [x] Three `<button type="button">` elements: `EN`, `PT-BR`, `ES`
  - [x] Active button: `aria-current="true"`, highlighted style; inactive: no `aria-current`, muted style; hover: `hover:text-white`
  - [x] Import `cn` from `@/lib/utils` for class merging
  - [x] Create `src/i18n/LanguageSwitcher.test.tsx` (see Dev Notes for test pattern)
  - [x] `npm run test:run` — all tests pass

- [x] Task 6: Typecheck and build verification (AC: all)
  - [x] `npm run typecheck` — zero TypeScript errors
  - [x] `npm run build` — clean build, no errors in `dist/client/` and `dist/server/`
  - [x] `npm run test:run` — all tests pass, no regressions
  - [x] Start dev server; verify in browser: LanguageSwitcher renders with EN/PT-BR/ES buttons; clicking each changes displayed text (any `t()` call visible in App); DevTools → Application → localStorage shows `i18nextLng` updated after click

### Review Findings

- [x] [Review][Patch] Guard localStorage.setItem against private browsing / quota errors [src/i18n/LanguageSwitcher.tsx:63]

## Dev Notes

### CRITICAL: All i18n Files Are Placeholders — Replace Entirely

These files exist but contain only stubs. Replace the ENTIRE file content:

| File | Current Content | Action |
|------|----------------|--------|
| `src/i18n/index.ts` | `export {}` | Replace entirely |
| `src/i18n/LanguageSwitcher.tsx` | `export default function LanguageSwitcher() { return <div /> }` | Replace entirely |
| `src/store/useLocaleStore.ts` | `export {}` | Replace entirely |
| `src/i18n/locales/en/translation.json` | `{}` | Replace entirely |
| `src/i18n/locales/pt-BR/translation.json` | `{}` | Replace entirely |
| `src/i18n/locales/es/translation.json` | `{}` | Replace entirely |
| `src/main.tsx` | Has React mount | ADD imports + sync code; preserve existing mount |

Do NOT touch `src/store/useModalStore.ts` or `src/store/useAdminStore.ts` — they are `export {}` stubs for future stories.

### Package Versions (Locked — Do Not Upgrade)

```
i18next@23.16.8                        # installed
react-i18next@14.1.3                   # installed, pinned for i18next@23 compat
i18next-browser-languagedetector@8.2.1  # installed
zustand@4.5.7                          # installed
```

New devDependencies approved for this story (install with `npm install -D`):
```
vitest
jsdom
@testing-library/react
@testing-library/user-event
@testing-library/jest-dom
```

Do NOT add `@types/...` for Vitest — it ships its own types.

### Architecture Locale Flow — Non-Negotiable Order

```typescript
// Always this exact order when changing locale:
i18next.changeLanguage(locale)              // 1. update i18next (also triggers useTranslation re-render)
useLocaleStore.setState({ locale })          // 2. update Zustand store
localStorage.setItem('i18nextLng', locale)  // 3. explicit persist (even though detector may also write)
```

Never skip step 3. Never reorder. This sequence is enforced by architecture spec.

**Anti-pattern — never do:**
```typescript
// ❌ Wrong: using i18next.language in components
const lang = i18next.language  // use useLocaleStore() instead

// ❌ Wrong: calling changeLocale() instead of the flow
changeLocale('pt-BR')  // convenience method, but locale flow requires 3 explicit steps in LanguageSwitcher

// ❌ Wrong: flat i18n keys
{ "heroHeadline": "...", "formsDemoEmailError": "..." }

// ❌ Wrong: more than 3 levels
{ "forms": { "demo": { "validation": { "email": "..." } } } }  // 4 levels deep
```

### i18next Initialization (src/i18n/index.ts)

```typescript
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en/translation.json'
import ptBR from './locales/pt-BR/translation.json'
import es from './locales/es/translation.json'

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'pt-BR': { translation: ptBR },
      es: { translation: es },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt-BR', 'es'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

export default i18next
```

`react.useSuspense: false` is required — resources are bundled (not fetched async), so Suspense is unnecessary and causes issues with the existing `<Suspense>` wrappers in App.tsx.

Detection order behavior:
1. If `localStorage.getItem('i18nextLng')` exists and is in `['en','pt-BR','es']` → use it (AC2)
2. Else if `navigator.language` matches a supported locale → use it (AC1)
3. Else → use `'en'` fallback (AC3)

### useLocaleStore (src/store/useLocaleStore.ts)

```typescript
import { create } from 'zustand'

export type Locale = 'en' | 'pt-BR' | 'es'

interface LocaleStore {
  locale: Locale
  changeLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: 'en',
  changeLocale: (locale) => set({ locale }),
}))
```

`Locale` type must be exported — used in main.tsx and LanguageSwitcher. Initial `locale: 'en'` is correct; main.tsx syncs it to the i18next-detected locale immediately after init.

### main.tsx Update

```typescript
import './i18n'   // MUST BE FIRST — initializes i18next before anything else evaluates
import i18next from 'i18next'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { useLocaleStore, type Locale } from '@/store/useLocaleStore'

// Sync store with i18next detected locale (runs once at app startup)
const detectedLang = i18next.language
if ((['en', 'pt-BR', 'es'] as string[]).includes(detectedLang)) {
  useLocaleStore.setState({ locale: detectedLang as Locale })
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element (#root) not found in DOM')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

The sync block ensures that when a pt-BR visitor arrives with no localStorage, the Zustand store reflects 'pt-BR' (detected from navigator) — not the default 'en'. Without this sync, components reading `useLocaleStore()` would show 'en' while i18next renders PT-BR text.

### vite.config.ts Update (Vitest)

Add `/// <reference types="vitest" />` as FIRST line, then add `test` block to `defineConfig`:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    outDir: 'dist/client',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

### LanguageSwitcher Component Pattern

```typescript
import i18next from 'i18next'
import { cn } from '@/lib/utils'
import { useLocaleStore, type Locale } from '@/store/useLocaleStore'

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'pt-BR', label: 'PT-BR' },
  { code: 'es', label: 'ES' },
]

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale } = useLocaleStore()

  const handleChange = (newLocale: Locale) => {
    i18next.changeLanguage(newLocale)              // 1
    useLocaleStore.setState({ locale: newLocale })  // 2
    localStorage.setItem('i18nextLng', newLocale)   // 3
  }

  return (
    <div role="group" aria-label="Select language" className={cn('flex items-center gap-1', className)}>
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          aria-current={locale === code ? 'true' : undefined}
          onClick={() => handleChange(code)}
          className={cn(
            'px-2 py-1 text-sm font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1',
            locale === code
              ? 'text-brand-electric-blue font-semibold'
              : 'text-brand-muted hover:text-white'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
```

Note: `aria-current` is set to `'true'` (string) not `true` (boolean) — ARIA spec for `aria-current` uses string values. Inactive buttons get `undefined` (not `'false'`) so the attribute is omitted entirely.

### Test Patterns

**src/store/useLocaleStore.test.ts:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useLocaleStore } from './useLocaleStore'

describe('useLocaleStore', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'en' })
  })

  it('initializes with en locale', () => {
    expect(useLocaleStore.getState().locale).toBe('en')
  })

  it('changeLocale updates locale', () => {
    useLocaleStore.getState().changeLocale('pt-BR')
    expect(useLocaleStore.getState().locale).toBe('pt-BR')
  })

  it('setState direct update works', () => {
    useLocaleStore.setState({ locale: 'es' })
    expect(useLocaleStore.getState().locale).toBe('es')
  })
})
```

**src/i18n/index.test.ts:**
```typescript
import { describe, it, expect } from 'vitest'
import i18next from 'i18next'
import './index'  // trigger init (idempotent — i18next.init is no-op if already initialized)

const REQUIRED_KEYS = ['nav','hero','syncrevenue','services','comparison','team','security','references','privacy','forms','errors']

describe('i18n initialization', () => {
  it('has three supported locales', () => {
    const langs = i18next.options.supportedLngs as string[]
    expect(langs).toContain('en')
    expect(langs).toContain('pt-BR')
    expect(langs).toContain('es')
  })

  it('fallback language is en', () => {
    expect(i18next.options.fallbackLng).toBe('en')
  })

  it('all required top-level keys exist in EN translations', () => {
    const enData = i18next.getDataByLanguage('en')
    const keys = Object.keys(enData?.translation ?? {})
    REQUIRED_KEYS.forEach(key => expect(keys).toContain(key))
  })

  it('pt-BR translations have same top-level keys as EN', () => {
    const enKeys = Object.keys(i18next.getDataByLanguage('en')?.translation ?? {}).sort()
    const ptKeys = Object.keys(i18next.getDataByLanguage('pt-BR')?.translation ?? {}).sort()
    expect(ptKeys).toEqual(enKeys)
  })

  it('es translations have same top-level keys as EN', () => {
    const enKeys = Object.keys(i18next.getDataByLanguage('en')?.translation ?? {}).sort()
    const esKeys = Object.keys(i18next.getDataByLanguage('es')?.translation ?? {}).sort()
    expect(esKeys).toEqual(enKeys)
  })
})
```

**src/i18n/LanguageSwitcher.test.tsx:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LanguageSwitcher from './LanguageSwitcher'
import { useLocaleStore } from '@/store/useLocaleStore'
import i18next from 'i18next'
import '@/i18n'  // ensure i18next is initialized

vi.mock('i18next', async () => {
  const actual = await vi.importActual<typeof import('i18next')>('i18next')
  return { ...actual, default: { ...actual.default, changeLanguage: vi.fn() } }
})

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'en' })
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders three locale buttons', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'PT-BR' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ES' })).toBeInTheDocument()
  })

  it('active locale button has aria-current="true"', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'PT-BR' })).not.toHaveAttribute('aria-current')
  })

  it('clicking PT-BR executes locale flow in order', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)
    await user.click(screen.getByRole('button', { name: 'PT-BR' }))
    expect(i18next.changeLanguage).toHaveBeenCalledWith('pt-BR')
    expect(useLocaleStore.getState().locale).toBe('pt-BR')
    expect(localStorage.getItem('i18nextLng')).toBe('pt-BR')
  })

  it('wrapper has aria-label="Select language"', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('group', { name: 'Select language' })).toBeInTheDocument()
  })
})
```

### Translation File Content

All three files must have **identical key structure**. Content is localized but keys never change.

#### src/i18n/locales/en/translation.json

```json
{
  "nav": {
    "demo": "Request Demo",
    "contact": "Contact",
    "home": "Home",
    "privacy": "Privacy Policy"
  },
  "hero": {
    "badge": "Commission Recovery for Travel Agencies",
    "headline": "Commission Management Built for Modern Travel Agencies",
    "subheadline": "Recover 15–25% of commission revenue lost to GDS discrepancies, debit memo disputes, and manual BSP/ARC reconciliation failures.",
    "cta": "Schedule a Demo",
    "stats": {
      "assertivity": "99.99%",
      "assertivityLabel": "Commission Assertivity",
      "leakage": "15–25%",
      "leakageLabel": "Revenue Leakage Recovered",
      "gds": "Multi-GDS",
      "gdsLabel": "Amadeus · Sabre · Galileo · Worldspan"
    },
    "trust": {
      "encryption": "Encrypted Transmission",
      "certification": "Certification Roadmap",
      "insurance": "Contract Insurance",
      "references": "Referenced US Agencies"
    }
  },
  "syncrevenue": {
    "eyebrow": "Our Flagship Product",
    "headline": "Automated Commission Reconciliation",
    "subtext": "SyncRevenue connects to your GDS feeds and automatically identifies commission discrepancies, disputed debit memos, and BSP/ARC reconciliation failures — recovering revenue your team would otherwise miss.",
    "gds": {
      "title": "GDS Integrations",
      "amadeus": "Amadeus",
      "sabre": "Sabre",
      "galileo": "Galileo",
      "worldspan": "Worldspan"
    },
    "accuracy": "99.99% commission assertivity across all integrated GDS platforms."
  },
  "services": {
    "eyebrow": "Our Services",
    "headline": "Complete Revenue Intelligence Suite",
    "subtext": "Whether you need automated reconciliation, data analytics, or custom development, we have the expertise to solve your specific challenge.",
    "syncrevenue": {
      "title": "SyncRevenue",
      "description": "Automated GDS commission reconciliation and recovery for travel agencies."
    },
    "analytics": {
      "title": "BI & Data Analytics",
      "description": "Turn your booking and commission data into actionable intelligence."
    },
    "obts": {
      "title": "Online Booking Tools",
      "description": "Implementation, optimization, and support for OBT platforms."
    },
    "custom": {
      "title": "Custom Development",
      "description": "Bespoke solutions for complex airline distribution and revenue challenges."
    },
    "contact": "Not sure which service fits? Contact us."
  },
  "comparison": {
    "eyebrow": "Why SyncRevenue",
    "headline": "Stop Losing Revenue to Manual Processes",
    "subtext": "See how automated commission management compares to the status quo.",
    "featureHeader": "Feature",
    "syncrevenueHeader": "SyncRevenue",
    "legacyHeader": "Manual / Legacy Tools",
    "features": {
      "reconciliation": "BSP/ARC Reconciliation",
      "debitMemo": "Debit Memo Dispute Management",
      "gdsIntegration": "Multi-GDS Integration",
      "reporting": "Real-Time Commission Reporting",
      "audit": "Automated Audit Trail"
    },
    "yes": "✓",
    "no": "✗",
    "partial": "Partial"
  },
  "team": {
    "eyebrow": "Our Team",
    "headline": "Specialists in Airline Distribution",
    "subtext": "Our team brings decades of GDS, BSP, and travel agency operations experience.",
    "member1": {
      "name": "Team Member Name",
      "role": "Chief Executive Officer",
      "bio": "Airline distribution specialist with expertise in GDS operations and commission management for travel agencies across the Americas."
    },
    "member2": {
      "name": "Team Member Name",
      "role": "Chief Technology Officer",
      "bio": "Technology leader specializing in travel industry data integration, automation, and revenue optimization systems."
    }
  },
  "security": {
    "eyebrow": "Security & Trust",
    "headline": "Your Data is Protected",
    "subtext": "We take the security of your GDS credentials and booking data seriously.",
    "encryption": {
      "title": "Encrypted Transmission",
      "description": "All data transmitted between your systems and SyncRevenue is encrypted in transit using industry-standard protocols."
    },
    "certification": {
      "title": "Certification Roadmap",
      "description": "We are actively pursuing SOC 2 Type II certification. Our security roadmap is transparent and available on request."
    },
    "insurance": {
      "title": "Contract Insurance",
      "description": "Our service agreements include explicit data protection commitments and liability coverage for commission recovery operations."
    },
    "separation": "GDS credentials never touch our website. All data access is scoped exclusively to commission reconciliation — no passenger data, no booking modifications."
  },
  "references": {
    "eyebrow": "Client References",
    "headline": "Trusted by US Travel Agencies",
    "subtext": "References available from recognized US-based travel management companies.",
    "cta": "Request References"
  },
  "privacy": {
    "title": "Privacy Policy",
    "lastUpdated": "Last updated: May 2026",
    "intro": "Sync Sirius, Inc. is committed to protecting your privacy. This policy describes how we collect, use, and protect information submitted through this website.",
    "dataCollection": {
      "title": "Information We Collect",
      "body": "We collect contact information (name, email, company, phone) and usage information submitted through demo request and contact forms."
    },
    "dataUse": {
      "title": "How We Use Your Information",
      "body": "We use your information to respond to demo requests, answer inquiries, and improve our services. We do not sell your data to third parties."
    },
    "dataRetention": {
      "title": "Data Retention",
      "body": "Demo request and contact records are retained for 24 months from submission, then permanently deleted."
    },
    "gdsData": {
      "title": "GDS Credentials & Booking Data",
      "body": "This website does not collect GDS credentials or booking data. All GDS integration for SyncRevenue customers occurs through direct API agreements, not through this website."
    },
    "contact": {
      "title": "Contact Us",
      "body": "For privacy inquiries, contact us at privacy@syncsirius.com."
    }
  },
  "forms": {
    "demo": {
      "title": "Request a Demo",
      "name": "Full Name",
      "namePlaceholder": "Jane Smith",
      "nameError": "Full name is required",
      "email": "Work Email",
      "emailPlaceholder": "jane@agency.com",
      "emailError": "Enter a valid email address",
      "company": "Company",
      "companyPlaceholder": "Travel Agency Name",
      "companyError": "Company name is required",
      "phone": "Phone (optional)",
      "phonePlaceholder": "+1 305 555 0100",
      "role": "Your Role",
      "rolePlaceholder": "Select your role",
      "roleError": "Please select your role",
      "gds": "Primary GDS",
      "gdsPlaceholder": "Select your GDS",
      "gdsError": "Please select your primary GDS",
      "message": "Message (optional)",
      "messagePlaceholder": "Tell us about your commission reconciliation challenges",
      "submit": "Request Demo",
      "submitting": "Sending…",
      "successTitle": "Request Received!",
      "successBody": "Our team will reach out within 1 business day.",
      "errorGeneric": "Something went wrong. Please try again."
    },
    "contact": {
      "title": "Contact Us",
      "name": "Full Name",
      "nameError": "Full name is required",
      "email": "Email Address",
      "emailError": "Enter a valid email address",
      "subject": "Subject",
      "subjectPlaceholder": "How can we help?",
      "subjectError": "Subject is required",
      "message": "Message",
      "messagePlaceholder": "Your message…",
      "messageError": "Message is required",
      "submit": "Send Message",
      "submitting": "Sending…",
      "successTitle": "Message Sent!",
      "successBody": "We'll get back to you as soon as possible.",
      "errorGeneric": "Something went wrong. Please try again."
    }
  },
  "errors": {
    "notFound": "Page not found",
    "notFoundBody": "The page you're looking for doesn't exist.",
    "serverError": "Something went wrong",
    "serverErrorBody": "Please try again or contact us if the problem persists.",
    "rateLimit": "Too many requests. Please wait a moment and try again.",
    "networkError": "Connection error. Please check your connection and try again."
  }
}
```

#### src/i18n/locales/pt-BR/translation.json

Same key structure as EN. All values in Brazilian Portuguese:

```json
{
  "nav": {
    "demo": "Solicitar Demo",
    "contact": "Contato",
    "home": "Início",
    "privacy": "Política de Privacidade"
  },
  "hero": {
    "badge": "Recuperação de Comissões para Agências de Viagem",
    "headline": "Gestão de Comissões para Agências de Viagem Modernas",
    "subheadline": "Recupere 15–25% da receita de comissões perdida em discrepâncias de GDS, disputas de débitos e falhas de reconciliação BSP/ARC.",
    "cta": "Agendar Demo",
    "stats": {
      "assertivity": "99,99%",
      "assertivityLabel": "Assertividade de Comissões",
      "leakage": "15–25%",
      "leakageLabel": "Vazamento de Receita Recuperado",
      "gds": "Multi-GDS",
      "gdsLabel": "Amadeus · Sabre · Galileo · Worldspan"
    },
    "trust": {
      "encryption": "Transmissão Criptografada",
      "certification": "Roadmap de Certificação",
      "insurance": "Seguro Contratual",
      "references": "Agências dos EUA Referenciadas"
    }
  },
  "syncrevenue": {
    "eyebrow": "Nosso Produto Principal",
    "headline": "Reconciliação Automatizada de Comissões",
    "subtext": "O SyncRevenue conecta-se aos seus feeds de GDS e identifica automaticamente discrepâncias de comissões, débitos contestados e falhas de reconciliação BSP/ARC — recuperando receita que sua equipe perderia.",
    "gds": {
      "title": "Integrações GDS",
      "amadeus": "Amadeus",
      "sabre": "Sabre",
      "galileo": "Galileo",
      "worldspan": "Worldspan"
    },
    "accuracy": "99,99% de assertividade de comissões em todas as plataformas GDS integradas."
  },
  "services": {
    "eyebrow": "Nossos Serviços",
    "headline": "Suite Completa de Inteligência de Receita",
    "subtext": "Seja reconciliação automatizada, analytics de dados ou desenvolvimento customizado, temos a expertise para resolver seu desafio específico.",
    "syncrevenue": {
      "title": "SyncRevenue",
      "description": "Reconciliação e recuperação automatizada de comissões GDS para agências de viagem."
    },
    "analytics": {
      "title": "BI & Analytics de Dados",
      "description": "Transforme seus dados de reservas e comissões em inteligência acionável."
    },
    "obts": {
      "title": "Ferramentas de Reserva Online",
      "description": "Implementação, otimização e suporte para plataformas OBT."
    },
    "custom": {
      "title": "Desenvolvimento Customizado",
      "description": "Soluções sob medida para desafios complexos de distribuição aérea e receita."
    },
    "contact": "Não sabe qual serviço é ideal? Entre em contato."
  },
  "comparison": {
    "eyebrow": "Por que SyncRevenue",
    "headline": "Pare de Perder Receita com Processos Manuais",
    "subtext": "Veja como a gestão automatizada de comissões se compara ao status quo.",
    "featureHeader": "Funcionalidade",
    "syncrevenueHeader": "SyncRevenue",
    "legacyHeader": "Manual / Ferramentas Legadas",
    "features": {
      "reconciliation": "Reconciliação BSP/ARC",
      "debitMemo": "Gestão de Disputas de Débitos",
      "gdsIntegration": "Integração Multi-GDS",
      "reporting": "Relatórios de Comissão em Tempo Real",
      "audit": "Trilha de Auditoria Automatizada"
    },
    "yes": "✓",
    "no": "✗",
    "partial": "Parcial"
  },
  "team": {
    "eyebrow": "Nossa Equipe",
    "headline": "Especialistas em Distribuição Aérea",
    "subtext": "Nossa equipe traz décadas de experiência em operações GDS, BSP e agências de viagem.",
    "member1": {
      "name": "Nome do Membro",
      "role": "Diretor Executivo",
      "bio": "Especialista em distribuição aérea com expertise em operações GDS e gestão de comissões para agências de viagem nas Américas."
    },
    "member2": {
      "name": "Nome do Membro",
      "role": "Diretor de Tecnologia",
      "bio": "Líder de tecnologia especializado em integração de dados do setor de viagens, automação e sistemas de otimização de receita."
    }
  },
  "security": {
    "eyebrow": "Segurança & Confiança",
    "headline": "Seus Dados Estão Protegidos",
    "subtext": "Levamos a sério a segurança de suas credenciais GDS e dados de reservas.",
    "encryption": {
      "title": "Transmissão Criptografada",
      "description": "Todos os dados transmitidos entre seus sistemas e o SyncRevenue são criptografados em trânsito usando protocolos padrão da indústria."
    },
    "certification": {
      "title": "Roadmap de Certificação",
      "description": "Estamos ativamente buscando a certificação SOC 2 Tipo II. Nosso roadmap de segurança é transparente e disponível mediante solicitação."
    },
    "insurance": {
      "title": "Seguro Contratual",
      "description": "Nossos contratos de serviço incluem compromissos explícitos de proteção de dados e cobertura de responsabilidade para operações de recuperação de comissões."
    },
    "separation": "Credenciais GDS nunca passam pelo nosso site. Todo acesso a dados é exclusivamente para reconciliação de comissões — sem dados de passageiros, sem modificações de reservas."
  },
  "references": {
    "eyebrow": "Referências de Clientes",
    "headline": "Confiado por Agências de Viagem nos EUA",
    "subtext": "Referências disponíveis de empresas de gestão de viagens reconhecidas nos EUA.",
    "cta": "Solicitar Referências"
  },
  "privacy": {
    "title": "Política de Privacidade",
    "lastUpdated": "Última atualização: Maio de 2026",
    "intro": "A Sync Sirius, Inc. está comprometida em proteger sua privacidade. Esta política descreve como coletamos, usamos e protegemos as informações enviadas por este site.",
    "dataCollection": {
      "title": "Informações que Coletamos",
      "body": "Coletamos informações de contato (nome, e-mail, empresa, telefone) e informações de uso enviadas através dos formulários de solicitação de demo e contato."
    },
    "dataUse": {
      "title": "Como Usamos suas Informações",
      "body": "Usamos suas informações para responder a solicitações de demo, responder a consultas e melhorar nossos serviços. Não vendemos seus dados a terceiros."
    },
    "dataRetention": {
      "title": "Retenção de Dados",
      "body": "Registros de solicitação de demo e contato são retidos por 24 meses a partir do envio e então permanentemente excluídos."
    },
    "gdsData": {
      "title": "Credenciais GDS & Dados de Reservas",
      "body": "Este site não coleta credenciais GDS ou dados de reservas. Toda integração GDS para clientes SyncRevenue ocorre por meio de acordos diretos de API, não por este site."
    },
    "contact": {
      "title": "Fale Conosco",
      "body": "Para dúvidas sobre privacidade, entre em contato pelo e-mail privacy@syncsirius.com."
    }
  },
  "forms": {
    "demo": {
      "title": "Solicitar uma Demo",
      "name": "Nome Completo",
      "namePlaceholder": "Ana Silva",
      "nameError": "Nome completo é obrigatório",
      "email": "E-mail Corporativo",
      "emailPlaceholder": "ana@agencia.com.br",
      "emailError": "Insira um endereço de e-mail válido",
      "company": "Empresa",
      "companyPlaceholder": "Nome da Agência de Viagem",
      "companyError": "Nome da empresa é obrigatório",
      "phone": "Telefone (opcional)",
      "phonePlaceholder": "+55 11 9 0000-0000",
      "role": "Seu Cargo",
      "rolePlaceholder": "Selecione seu cargo",
      "roleError": "Por favor, selecione seu cargo",
      "gds": "GDS Principal",
      "gdsPlaceholder": "Selecione seu GDS",
      "gdsError": "Por favor, selecione seu GDS principal",
      "message": "Mensagem (opcional)",
      "messagePlaceholder": "Conte-nos sobre seus desafios de reconciliação de comissões",
      "submit": "Solicitar Demo",
      "submitting": "Enviando…",
      "successTitle": "Solicitação Recebida!",
      "successBody": "Nossa equipe entrará em contato em até 1 dia útil.",
      "errorGeneric": "Algo deu errado. Por favor, tente novamente."
    },
    "contact": {
      "title": "Entre em Contato",
      "name": "Nome Completo",
      "nameError": "Nome completo é obrigatório",
      "email": "Endereço de E-mail",
      "emailError": "Insira um endereço de e-mail válido",
      "subject": "Assunto",
      "subjectPlaceholder": "Como podemos ajudar?",
      "subjectError": "Assunto é obrigatório",
      "message": "Mensagem",
      "messagePlaceholder": "Sua mensagem…",
      "messageError": "Mensagem é obrigatória",
      "submit": "Enviar Mensagem",
      "submitting": "Enviando…",
      "successTitle": "Mensagem Enviada!",
      "successBody": "Responderemos o mais breve possível.",
      "errorGeneric": "Algo deu errado. Por favor, tente novamente."
    }
  },
  "errors": {
    "notFound": "Página não encontrada",
    "notFoundBody": "A página que você está procurando não existe.",
    "serverError": "Algo deu errado",
    "serverErrorBody": "Por favor, tente novamente ou entre em contato se o problema persistir.",
    "rateLimit": "Muitas solicitações. Por favor, aguarde um momento e tente novamente.",
    "networkError": "Erro de conexão. Verifique sua conexão e tente novamente."
  }
}
```

#### src/i18n/locales/es/translation.json

Same key structure as EN. All values in Spanish:

```json
{
  "nav": {
    "demo": "Solicitar Demo",
    "contact": "Contacto",
    "home": "Inicio",
    "privacy": "Política de Privacidad"
  },
  "hero": {
    "badge": "Recuperación de Comisiones para Agencias de Viajes",
    "headline": "Gestión de Comisiones para Agencias de Viajes Modernas",
    "subheadline": "Recupere el 15–25% de los ingresos por comisiones perdidos en discrepancias de GDS, disputas de débitos y fallos de reconciliación BSP/ARC.",
    "cta": "Programar Demo",
    "stats": {
      "assertivity": "99,99%",
      "assertivityLabel": "Asertividad de Comisiones",
      "leakage": "15–25%",
      "leakageLabel": "Fuga de Ingresos Recuperada",
      "gds": "Multi-GDS",
      "gdsLabel": "Amadeus · Sabre · Galileo · Worldspan"
    },
    "trust": {
      "encryption": "Transmisión Cifrada",
      "certification": "Hoja de Ruta de Certificación",
      "insurance": "Seguro Contractual",
      "references": "Agencias de EE.UU. Referenciadas"
    }
  },
  "syncrevenue": {
    "eyebrow": "Nuestro Producto Principal",
    "headline": "Conciliación Automatizada de Comisiones",
    "subtext": "SyncRevenue se conecta a sus feeds de GDS e identifica automáticamente discrepancias de comisiones, débitos en disputa y fallos de reconciliación BSP/ARC — recuperando ingresos que su equipo perdería.",
    "gds": {
      "title": "Integraciones GDS",
      "amadeus": "Amadeus",
      "sabre": "Sabre",
      "galileo": "Galileo",
      "worldspan": "Worldspan"
    },
    "accuracy": "99,99% de asertividad de comisiones en todas las plataformas GDS integradas."
  },
  "services": {
    "eyebrow": "Nuestros Servicios",
    "headline": "Suite Completa de Inteligencia de Ingresos",
    "subtext": "Ya sea conciliación automatizada, análisis de datos o desarrollo personalizado, tenemos la experiencia para resolver su desafío específico.",
    "syncrevenue": {
      "title": "SyncRevenue",
      "description": "Conciliación y recuperación automatizada de comisiones GDS para agencias de viajes."
    },
    "analytics": {
      "title": "BI y Análisis de Datos",
      "description": "Convierta sus datos de reservas y comisiones en inteligencia accionable."
    },
    "obts": {
      "title": "Herramientas de Reserva Online",
      "description": "Implementación, optimización y soporte para plataformas OBT."
    },
    "custom": {
      "title": "Desarrollo Personalizado",
      "description": "Soluciones a medida para desafíos complejos de distribución aérea e ingresos."
    },
    "contact": "¿No está seguro de qué servicio necesita? Contáctenos."
  },
  "comparison": {
    "eyebrow": "Por qué SyncRevenue",
    "headline": "Deje de Perder Ingresos con Procesos Manuales",
    "subtext": "Vea cómo la gestión automatizada de comisiones se compara con el status quo.",
    "featureHeader": "Funcionalidad",
    "syncrevenueHeader": "SyncRevenue",
    "legacyHeader": "Manual / Herramientas Legadas",
    "features": {
      "reconciliation": "Conciliación BSP/ARC",
      "debitMemo": "Gestión de Disputas de Débitos",
      "gdsIntegration": "Integración Multi-GDS",
      "reporting": "Informes de Comisiones en Tiempo Real",
      "audit": "Historial de Auditoría Automatizado"
    },
    "yes": "✓",
    "no": "✗",
    "partial": "Parcial"
  },
  "team": {
    "eyebrow": "Nuestro Equipo",
    "headline": "Especialistas en Distribución Aérea",
    "subtext": "Nuestro equipo aporta décadas de experiencia en operaciones GDS, BSP y agencias de viajes.",
    "member1": {
      "name": "Nombre del Miembro",
      "role": "Director Ejecutivo",
      "bio": "Especialista en distribución aérea con experiencia en operaciones GDS y gestión de comisiones para agencias de viajes en las Américas."
    },
    "member2": {
      "name": "Nombre del Miembro",
      "role": "Director de Tecnología",
      "bio": "Líder tecnológico especializado en integración de datos de la industria de viajes, automatización y sistemas de optimización de ingresos."
    }
  },
  "security": {
    "eyebrow": "Seguridad y Confianza",
    "headline": "Sus Datos Están Protegidos",
    "subtext": "Tomamos muy en serio la seguridad de sus credenciales GDS y datos de reservas.",
    "encryption": {
      "title": "Transmisión Cifrada",
      "description": "Todos los datos transmitidos entre sus sistemas y SyncRevenue están cifrados en tránsito usando protocolos estándar de la industria."
    },
    "certification": {
      "title": "Hoja de Ruta de Certificación",
      "description": "Estamos buscando activamente la certificación SOC 2 Tipo II. Nuestra hoja de ruta de seguridad es transparente y está disponible a solicitud."
    },
    "insurance": {
      "title": "Seguro Contractual",
      "description": "Nuestros acuerdos de servicio incluyen compromisos explícitos de protección de datos y cobertura de responsabilidad para operaciones de recuperación de comisiones."
    },
    "separation": "Las credenciales GDS nunca tocan nuestro sitio web. Todo acceso a datos está exclusivamente destinado a la conciliación de comisiones — sin datos de pasajeros, sin modificaciones de reservas."
  },
  "references": {
    "eyebrow": "Referencias de Clientes",
    "headline": "Confiado por Agencias de Viajes en EE.UU.",
    "subtext": "Referencias disponibles de empresas de gestión de viajes reconocidas en Estados Unidos.",
    "cta": "Solicitar Referencias"
  },
  "privacy": {
    "title": "Política de Privacidad",
    "lastUpdated": "Última actualización: Mayo de 2026",
    "intro": "Sync Sirius, Inc. está comprometida con la protección de su privacidad. Esta política describe cómo recopilamos, usamos y protegemos la información enviada a través de este sitio web.",
    "dataCollection": {
      "title": "Información que Recopilamos",
      "body": "Recopilamos información de contacto (nombre, correo electrónico, empresa, teléfono) e información de uso enviada a través de los formularios de solicitud de demo y contacto."
    },
    "dataUse": {
      "title": "Cómo Usamos su Información",
      "body": "Usamos su información para responder a solicitudes de demo, responder consultas y mejorar nuestros servicios. No vendemos sus datos a terceros."
    },
    "dataRetention": {
      "title": "Retención de Datos",
      "body": "Los registros de solicitud de demo y contacto se conservan durante 24 meses desde el envío y luego se eliminan permanentemente."
    },
    "gdsData": {
      "title": "Credenciales GDS y Datos de Reservas",
      "body": "Este sitio web no recopila credenciales GDS ni datos de reservas. Toda integración GDS para clientes de SyncRevenue se realiza a través de acuerdos directos de API, no a través de este sitio web."
    },
    "contact": {
      "title": "Contáctenos",
      "body": "Para consultas de privacidad, contáctenos en privacy@syncsirius.com."
    }
  },
  "forms": {
    "demo": {
      "title": "Solicitar una Demo",
      "name": "Nombre Completo",
      "namePlaceholder": "Juan García",
      "nameError": "El nombre completo es obligatorio",
      "email": "Correo Corporativo",
      "emailPlaceholder": "juan@agencia.com",
      "emailError": "Ingrese una dirección de correo válida",
      "company": "Empresa",
      "companyPlaceholder": "Nombre de la Agencia de Viajes",
      "companyError": "El nombre de la empresa es obligatorio",
      "phone": "Teléfono (opcional)",
      "phonePlaceholder": "+52 55 0000 0000",
      "role": "Su Cargo",
      "rolePlaceholder": "Seleccione su cargo",
      "roleError": "Por favor seleccione su cargo",
      "gds": "GDS Principal",
      "gdsPlaceholder": "Seleccione su GDS",
      "gdsError": "Por favor seleccione su GDS principal",
      "message": "Mensaje (opcional)",
      "messagePlaceholder": "Cuéntenos sobre sus desafíos de conciliación de comisiones",
      "submit": "Solicitar Demo",
      "submitting": "Enviando…",
      "successTitle": "¡Solicitud Recibida!",
      "successBody": "Nuestro equipo se pondrá en contacto en un plazo de 1 día hábil.",
      "errorGeneric": "Algo salió mal. Por favor, inténtelo de nuevo."
    },
    "contact": {
      "title": "Contáctenos",
      "name": "Nombre Completo",
      "nameError": "El nombre completo es obligatorio",
      "email": "Dirección de Correo",
      "emailError": "Ingrese una dirección de correo válida",
      "subject": "Asunto",
      "subjectPlaceholder": "¿Cómo podemos ayudarle?",
      "subjectError": "El asunto es obligatorio",
      "message": "Mensaje",
      "messagePlaceholder": "Su mensaje…",
      "messageError": "El mensaje es obligatorio",
      "submit": "Enviar Mensaje",
      "submitting": "Enviando…",
      "successTitle": "¡Mensaje Enviado!",
      "successBody": "Le responderemos lo antes posible.",
      "errorGeneric": "Algo salió mal. Por favor, inténtelo de nuevo."
    }
  },
  "errors": {
    "notFound": "Página no encontrada",
    "notFoundBody": "La página que busca no existe.",
    "serverError": "Algo salió mal",
    "serverErrorBody": "Por favor, inténtelo de nuevo o contáctenos si el problema persiste.",
    "rateLimit": "Demasiadas solicitudes. Por favor, espere un momento e inténtelo de nuevo.",
    "networkError": "Error de conexión. Verifique su conexión e inténtelo de nuevo."
  }
}
```

### Previous Story Learnings (1.1 + 1.2)

- `react-i18next@14` pinned for `i18next@23` compatibility — do not touch i18n deps versions
- No test framework was installed in 1.1 or 1.2 — Task 0 must add Vitest before any test writing
- `@vitejs/plugin-react@4` pinned for Vite 5 compat — do not upgrade
- `tailwindcssAnimate` imported as ES module in `tailwind.config.ts` — preserve pattern
- `cn()` from `@/lib/utils` for all class merging in components
- Brand tokens: `text-brand-electric-blue`, `text-brand-muted` — use in LanguageSwitcher active/inactive styles
- `shadcn@latest init` must NOT be re-run

### Architecture Constraints

- Zustand stores named `use{Domain}Store` — `useLocaleStore` is correct
- Import locale from `useLocaleStore` in components — never `i18next.language` directly
- `src/i18n/LanguageSwitcher.tsx` is correct location — do not move to `src/components/`
- `src/store/useLocaleStore.ts` is correct location
- Co-located test files — `useLocaleStore.test.ts` next to `useLocaleStore.ts`, `LanguageSwitcher.test.tsx` next to `LanguageSwitcher.tsx`
- No `__tests__/` directories
- Tailwind v3 only — no v4 features

### Project Structure Notes

- `src/i18n/` directory already exists with correct subdirectory structure — do not recreate
- `src/store/` directory already exists — do not recreate
- TypeScript will need JSON imports to resolve: tsconfig already has `"moduleResolution": "bundler"` which supports JSON imports; no changes needed to tsconfig.json

### References

- Locale flow and Zustand store pattern: [architecture.md — Communication Patterns](../_bmad-output/planning-artifacts/architecture.md#communication-patterns)
- i18n file structure and key namespacing: [architecture.md — Structure Patterns](../_bmad-output/planning-artifacts/architecture.md#structure-patterns)
- LanguageSwitcher UX spec: [ux-design-specification.md — Custom Components](../_bmad-output/planning-artifacts/ux-design-specification.md#custom-components) (UX-DR5)
- Directory structure: [architecture.md — Directory Structure](../_bmad-output/planning-artifacts/architecture.md)
- Enforcement guidelines (anti-patterns): [architecture.md — Enforcement Guidelines](../_bmad-output/planning-artifacts/architecture.md#enforcement-guidelines)
- Story AC source: [epics.md — Story 1.3](../_bmad-output/planning-artifacts/epics.md#story-13-i18n--language-infrastructure)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (create-story)

### Debug Log References

None.

### Completion Notes List

- Vitest 4.x requires `import { defineConfig } from 'vitest/config'` instead of `vite` for the `test` block to typecheck; `/// <reference types="vitest" />` alone does not augment types in this version.
- `i18next.options.fallbackLng` is normalized to `['en']` (array) internally; test uses `toContain` not `toBe`.
- `passWithNoTests: true` added to vitest config so `npm run test:run` exits 0 before any tests exist.
- All 12 tests pass across 3 test files: `useLocaleStore.test.ts`, `index.test.ts`, `LanguageSwitcher.test.tsx`.
- Dev server verified at http://localhost:5174; build clean at `dist/client/`.

### File List

- `vite.config.ts`
- `package.json`
- `src/test/setup.ts` (new)
- `src/store/useLocaleStore.ts`
- `src/store/useLocaleStore.test.ts` (new)
- `src/i18n/index.ts`
- `src/i18n/index.test.ts` (new)
- `src/i18n/LanguageSwitcher.tsx`
- `src/i18n/LanguageSwitcher.test.tsx` (new)
- `src/main.tsx`
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/pt-BR/translation.json`
- `src/i18n/locales/es/translation.json`

### Change Log

- 2026-05-14: Story created — i18n infrastructure, Vitest setup, LanguageSwitcher, locale store, all three translation files.
- 2026-05-14: Story implemented — Vitest infrastructure, useLocaleStore, i18next init, main.tsx sync, EN/PT-BR/ES translations, LanguageSwitcher with tests. All ACs satisfied. Status → review.
