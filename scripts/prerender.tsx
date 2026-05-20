/**
 * prerender.tsx — Story 5.6 SSG prerender step
 *
 * Runs after `vite build` via `npm run build`. Uses react-dom/server renderToString
 * to server-render the home-page (route `/`) and injects the resulting markup into
 * dist/client/index.html so the browser can paint the Hero LCP candidate before
 * React hydrates.
 *
 * Architecture decision (Story 5.6 Task 6 / AC 5):
 *   - Mechanism: custom Node.js prerender script using react-dom/server renderToString
 *   - Why: vite-plugin-ssg only at v0.1.0 on npm (far from v0.23+ needed); react-snap
 *     requires Puppeteer/Chromium headless browser (heavy dev dep); this script has
 *     zero runtime cost and is transparent to the Vite build pipeline
 *   - i18n locale fan-out: single canonical `/` prerender in `en` (default fallback);
 *     locale switch hydrates client-side after first paint via react-i18next
 *   - Excluded routes: /admin/*, /privacy, /404 — dynamic/auth or already minimal
 *   - Bundle impact: zero (script runs at build time only, not shipped to browser)
 *
 * Run via:   npx tsx --tsconfig tsconfig.json scripts/prerender.tsx
 * Wire via:  See package.json "build" script
 */

import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import en from '@/i18n/locales/en/translation.json'
import App from '@/App'

const PROJECT_ROOT = path.resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// Suppress expected React SSR build-time warnings:
//   1. "useLayoutEffect does nothing on the server" — expected because
//      useDocumentMeta (SEO.tsx) uses useLayoutEffect which is a client-only
//      hook. It will execute correctly after hydration on the client.
//   2. "React does not recognize the `fetchPriority` prop" — React 18 renders
//      `fetchPriority` as `fetchpriority` (lowercase) in SSR HTML, which is
//      the correct HTML attribute. The client reconciles this correctly.
// ---------------------------------------------------------------------------
const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  const message = String(args[0] ?? '')
  if (
    message.includes('useLayoutEffect does nothing on the server') ||
    message.toLowerCase().includes('fetchpriority')
  ) {
    return
  }
  originalConsoleError(...args)
}

// ---------------------------------------------------------------------------
// 1. Initialise i18next synchronously with EN translations only.
//    - No LanguageDetector (browser-only plugin, unavailable in Node.js)
//    - initImmediate: false ensures the init completes synchronously so
//      translation keys resolve before renderToString is called
// ---------------------------------------------------------------------------
i18next
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    lng: 'en',
    fallbackLng: 'en',
    initImmediate: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

// ---------------------------------------------------------------------------
// 2. Render the home-page route to an HTML string.
//    renderToString emits React hydration markers (data-reactroot etc.) so
//    the client-side hydrateRoot call can adopt the pre-rendered DOM without
//    recreating it from scratch.
//    suppressHydrationWarning is already set on the Hero <section> element
//    to absorb any minor client/server attribute mismatches.
//    StaticRouter provides routing context without needing a real browser
//    history API. Location is set to '/' so the Home route renders.
// ---------------------------------------------------------------------------
const appHtml = renderToString(
  React.createElement(
    StaticRouter,
    { location: '/' },
    React.createElement(App)
  )
)

// ---------------------------------------------------------------------------
// 3. Read the Vite-produced dist/client/index.html and inject the rendered
//    markup into the #root div.
// ---------------------------------------------------------------------------
const distIndexPath = path.join(PROJECT_ROOT, 'dist', 'client', 'index.html')

let indexHtml: string
try {
  indexHtml = readFileSync(distIndexPath, 'utf8')
} catch (err) {
  console.error(`[prerender] Could not read ${distIndexPath}`)
  console.error('[prerender] Run `npm run build` before this script, or check outDir in vite.config.ts')
  process.exit(1)
}

// Inject the pre-rendered HTML inside the #root div.
// The placeholder matches the empty <div id="root"></div> that Vite emits.
const injected = indexHtml.replace(
  /<div id="root"><\/div>/,
  `<div id="root">${appHtml}</div>`
)

if (injected === indexHtml) {
  // No replacement happened — the pattern didn't match. Could be already
  // prerendered or the template changed. Warn but don't fail the build.
  console.warn('[prerender] Warning: could not find <div id="root"></div> in dist/client/index.html.')
  console.warn('[prerender] The file may already be prerendered, or the root element pattern has changed.')
  process.exit(0)
}

// ---------------------------------------------------------------------------
// 4. Write the patched HTML back.
// ---------------------------------------------------------------------------
writeFileSync(distIndexPath, injected, 'utf8')

const heroPresent = injected.includes('<h1')
const picturePresent = injected.includes('<picture')
const ctaPresent = injected.includes('Schedule a Demo')
const kpiPresent = injected.includes('+15')

console.log('[prerender] dist/client/index.html patched successfully.')
console.log(`[prerender]   Prerendered HTML size: ${appHtml.length.toLocaleString()} bytes`)
console.log(`[prerender]   <h1> present: ${heroPresent}`)
console.log(`[prerender]   <picture> present: ${picturePresent}`)
console.log(`[prerender]   CTA text present: ${ctaPresent}`)
console.log(`[prerender]   KPI +15 present: ${kpiPresent}`)

if (!heroPresent || !picturePresent) {
  console.error('[prerender] ERROR: Hero content missing from prerendered output. Check Hero.tsx rendering.')
  process.exit(1)
}

console.log('[prerender] Done.')
