# Test Automation Summary - Story 2.7 (Security Hardening)

Generated: 2026-05-15
Frameworks: Vitest 4.1.6, Playwright 1.60.0
Scope: form rate limiting, route isolation, locale allowlists, Helmet/CORS headers, SQL-injection regression coverage, and client bundle secret scanning.

## Generated Tests

### API Tests

- [x] `server/middleware/rateLimit.test.ts` - Verifies the form limiter emits the exact HTTP 429 JSON envelope, draft RateLimit headers, and no legacy `X-RateLimit-*` headers.
- [x] `server/index.rateLimit.test.ts` - Verifies 20 valid submissions succeed before the 21st HTTP 429 for both `/api/demo` and `/api/contact`, and proves demo/contact quotas are independent for the same IP.
- [x] `server/index.test.ts` - Verifies Helmet defaults, restricted CORS, API 404/400/429 envelopes, malformed JSON handling, and route handler SQL-boundary guardrails.
- [x] `server/routes/demo.test.ts` - Verifies invalid demo locales are rejected before insert and SQL-injection-shaped input is stored literally without SQL errors.
- [x] `server/routes/contact.test.ts` - Verifies invalid contact locales/subjects are rejected before insert and SQL-injection-shaped input is stored literally without SQL errors.

### E2E Tests

- [x] `tests/e2e/security-hardening.spec.ts` - Adds Story 2.7 Playwright API integration coverage using an isolated Express app, temp SQLite DB, and deterministic remote IPs for rate-limit, header, locale, route isolation, and SQL safety assertions.
- [x] Existing `tests/e2e/contact-form.spec.ts` retains UI coverage for HTTP 429 contact form handling with semantic locators and no hardcoded waits.

### Bundle Secret Scan

- [x] `scripts/check-client-bundle-secrets.mjs` - Scans generated `dist/client` `.html`, `.js`, `.css`, and `.map` files for forbidden server secret names and seeded secret values after `npm run build`.

## Coverage

- Acceptance Criteria: 6/6 covered by automated tests.
- API endpoints: 2/2 form submission endpoints covered (`POST /api/demo`, `POST /api/contact`).
- Rate-limit behavior: both endpoints covered for 20 allowed requests, 21st-request 429, standard headers, no legacy headers, and per-route isolation.
- Critical error cases: invalid locale, malformed JSON, missing API route, route-level 429, SQL-injection-shaped payloads, and forbidden client-bundle secrets.
- UI features: existing contact 429 e2e coverage retained; Story 2.7 is primarily backend/API security hardening.

## Verification

- `npm run typecheck` -> passed.
- `npm run test:run` -> passed: 43 files, 232 tests.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:9 npm run test:e2e -- tests/e2e/security-hardening.spec.ts --project=chromium` -> passed: 1 file, 1 test.
- `npm run build` -> passed.
- `JWT_SECRET=client-bundle-jwt-secret-sentinel SMTP_PASS=client-bundle-smtp-pass-sentinel SMTP_USER=client-bundle-smtp-user-sentinel NOTIFY_EMAIL=client-bundle-notify-email-sentinel@example.com npm run check:client-bundle-secrets` -> passed.

## Files Touched

- `tests/e2e/security-hardening.spec.ts`
- `tests/e2e/security-test-env.ts`
- `_bmad-output/implementation-artifacts/tests/test-summary.md`

## Checklist Validation

- [x] API tests generated.
- [x] E2E tests generated for the Story 2.7 security path.
- [x] Tests use standard Vitest and Playwright APIs.
- [x] Tests cover happy paths.
- [x] Tests cover critical error cases.
- [x] All generated tests run successfully.
- [x] Tests use proper locators where UI is exercised.
- [x] Tests have clear descriptions.
- [x] No hardcoded waits or sleeps.
- [x] Tests are independent and do not depend on execution order.
- [x] Test summary created.
- [x] Tests saved to appropriate directories.
- [x] Summary includes coverage metrics.

---

# Test Automation Summary - Story 3.1 (Real Team Photos & Bio Content)

Generated: 2026-05-15
Frameworks: Playwright 1.60.0 (Vitest 4.1.6 already covers component + i18n unit layer)
Scope: public Team section real-photo render, composed alt text, CLS attributes, conditional LinkedIn anchor, mobile single-column layout, and locale-distinct role copy.
Story file: `_bmad-output/implementation-artifacts/3-1-real-team-photos-bio-content.md`

## Generated Tests

### E2E Tests

- [x] `tests/e2e/team-section.spec.ts` — 7 specs covering Story 3.1 UI invariants:
  | # | Scope | Tag | AC |
  |---|-------|-----|----|
  | 1 | Team region renders with 2 article cards | `@P0` | AC1, AC3 |
  | 2 | Every `<img>` uses composed `"{name}, {role}"` alt | `@P0` | AC1 (a11y) |
  | 3 | Every `<img>` declares `width="320"`, `height="320"`, `loading="lazy"`, `src=/team/*.webp` | `@P0` | AC1 (CLS) |
  | 4 | No placeholder initials block renders when photos present | `@P1` | AC3 |
  | 5 | No LinkedIn anchor renders when `linkedinUrl === ""` (current data) | `@P1` | AC3 |
  | 6 | Mobile viewport (375×800) renders a single-column grid | `@P1` | AC3 |
  | 7 | Role text differs string-for-string across en / pt-BR / es | `@P1` | AC2 |

### API Tests

Not applicable — Story 3.1 is JSON content + minor component extension. No backend endpoint added or changed (Phase 1 boundary: `Team.tsx` reads i18n, never the admin API). Existing security and contact-form API E2Es remain in place untouched.

## Coverage

- AC1 (real photos, alt text, CLS attributes) — covered by specs 1–3.
- AC2 (locale-distinct bios) — role-text divergence covered by spec 7; full bio string divergence + `linkedinUrl` parity already enforced by `src/i18n/index.test.ts` (deep-key parity + `expect(member.role).not.toBe(...)`). No duplication added at the E2E layer.
- AC3 (visible photo, name, role, bio, conditional LinkedIn link, responsive grid) — covered by specs 1, 4, 5, 6.
- AC4 (deep-key parity for `linkedinUrl`) — unit-level only by design. `npm run test:run -- src/i18n/index.test.ts` is the canonical gate; no value duplicating a JSON-shape check inside Playwright.
- AC5 (build/typecheck/test pass) — already gated by `npm run typecheck && npm run test:run && npm run build` per the story; no E2E mirror needed.

### Intentionally NOT covered at E2E

- **LinkedIn-present anchor rendering** — current production i18n ships `linkedinUrl: ""` for every member, so the "present" path has no live data without mocking the i18n bundle in the browser. Path is fully covered by the unit test in `src/components/sections/Team.test.tsx` (`target`, `rel`, aria-label). When real LinkedIn URLs ship, invert or remove spec 5.
- **Visual photo content** — interim placeholder webp images ship today (solid brand-blue 320×320). E2E asserts presence + attributes; no pixel comparison. Visual regression deferred per Story 3.1 Task 5 (pending real stakeholder photos).

## Verification

- `npx playwright test team-section --project=chromium --reporter=list` → **7 passed (12.9s)**.
- Chromium binary installed via `npx playwright install chromium` (113 MiB). Webkit / mobile-chrome / mobile-webkit projects configured in `playwright.config.ts` but not exercised in this run; re-run `npm run test:e2e` to fan out across all four projects.

## Files Touched

- `tests/e2e/team-section.spec.ts` (new)
- `_bmad-output/implementation-artifacts/tests/test-summary.md` (Story 3.1 section appended)

## Checklist Validation

- [x] API tests generated (N/A — no backend surface).
- [x] E2E tests generated.
- [x] Tests use standard Playwright APIs.
- [x] Tests cover happy path.
- [x] Tests cover critical regression cases (placeholder leak, `href="#"` leak, CLS attribute drop, locale homogenization).
- [x] All generated tests run successfully.
- [x] Tests use proper locators (id, role, data-attr, semantic class).
- [x] Tests have clear descriptions.
- [x] No hardcoded waits or sleeps (Playwright auto-waits + `networkidle`).
- [x] Tests are independent (each spec navigates fresh).
- [x] Test summary updated.
- [x] Tests saved to `tests/e2e/`.
- [x] Summary includes coverage metrics.

## Next Steps

- E2E runs via existing `npm run test:e2e` script — already wired into CI per repo convention.
- When real LinkedIn URLs ship into the i18n JSON, swap spec 5 (anchor absent) for a positive assertion: every member has an anchor with `target="_blank"` + `rel="noopener noreferrer"`.
- When real human portraits ship, add a lightweight visual-regression snapshot (`toHaveScreenshot`) on `#team` at desktop and mobile viewports.

---

# Test Automation Summary - Story 3.2 (Animations & Micro-Interactions)

Generated: 2026-05-16
Frameworks: Vitest 4.1.6, Playwright 1.60.0
Scope: reduced-motion rendering, one-shot section entry, GradientButton hover layout stability, locale switch scroll preservation, and Motion bundle isolation.
Story file: `_bmad-output/implementation-artifacts/3-2-animations-micro-interactions.md`

## Generated Tests

### API Tests

Not applicable — Story 3.2 is public UI animation and interaction polish. No backend endpoint or service behavior was added or changed.

### E2E Tests

- [x] `tests/e2e/animations.spec.ts` — covers reduced-motion final-state rendering for an animated below-the-fold section and primary CTA hover bounding-box stability within 1px.
- [x] `tests/e2e/locale-switch.spec.ts` — covers `/` locale switching without navigation plus scroll preservation to a below-the-fold section within 50px.

### Unit Tests

- [x] `src/components/sections/MotionSection.test.tsx` — covers semantic section passthrough, reduced-motion plain-section fallback, one-shot `useInView` options (`once: true`, `amount: 0.2`), and child stability across view-state changes.
- [x] `src/components/ui/GradientButton.test.tsx` — covers targeted hover transition classes, stable size classes, no hover layout classes, and preserved focus/disabled styling.

## Coverage

- AC1 (one-shot section entry animation) — covered by `MotionSection.test.tsx` asserting the `useInView` one-shot options; production behavior is also exercised through the animated section chunks.
- AC2 (reduced motion final-state rendering) — covered by unit fallback assertions and `animations.spec.ts` reduced-motion browser scenario.
- AC3 (CTA hover paint-only transition) — covered by `GradientButton.test.tsx` and `animations.spec.ts` bounding-box stability.
- AC4 (locale switch stability on `/`) — covered by `locale-switch.spec.ts` pathname and scroll-preservation checks.
- AC5 (bundle isolation) — covered by `npm run build` plus main chunk string inspection; `motionFeatures-*.js` is emitted as a separate async chunk and no Motion runtime identifiers were found in `index-*.js`.
- AC6 (automated test coverage) — covered across focused unit and Playwright specs.

## Verification

- `npm run typecheck` -> passed.
- `npm run test:run -- src/components/sections/MotionSection.test.tsx src/components/ui/GradientButton.test.tsx` -> passed: 2 files, 8 tests.
- `npm run test:run` -> passed: 45 files, 242 tests.
- `npm run build` -> passed.
- `npx playwright test tests/e2e/animations.spec.ts tests/e2e/locale-switch.spec.ts --list` -> passed: 20 tests discovered across chromium, webkit, mobile-chrome, and mobile-webkit.
- `npm run test:e2e -- tests/e2e/animations.spec.ts tests/e2e/locale-switch.spec.ts` -> blocked before test execution: configured `npm run dev` web server exited with code 1.
- `npm run dev` -> blocked by sandbox: `Error: listen EPERM: operation not permitted /tmp/tsx-1001/30.pipe`.
- `npx vite --host 127.0.0.1 --port 5173` -> blocked by sandbox: `Error: listen EPERM: operation not permitted 127.0.0.1:5173`.

## Files Touched

- `src/components/sections/MotionSection.test.tsx`
- `tests/e2e/animations.spec.ts`
- `tests/e2e/locale-switch.spec.ts`
- `_bmad-output/implementation-artifacts/tests/test-summary.md`

## Checklist Validation

- [x] API tests generated (N/A — no API surface).
- [x] E2E tests generated for UI animation and locale workflows.
- [x] Tests use standard Vitest and Playwright APIs.
- [x] Tests cover happy paths.
- [x] Tests cover critical regression cases: reduced motion, hover layout stability, one-shot viewport behavior, and locale scroll preservation.
- [ ] All generated Playwright tests run successfully in this sandbox (blocked by local server listen permissions before execution).
- [x] Tests use proper locators and semantic assertions.
- [x] Tests have clear descriptions.
- [x] No hardcoded waits or sleeps.
- [x] Tests are independent and do not depend on execution order.
- [x] Test summary updated.
- [x] Tests saved to appropriate directories.
- [x] Summary includes coverage metrics.

## Next Steps

- Re-run `npm run test:e2e -- tests/e2e/animations.spec.ts tests/e2e/locale-switch.spec.ts` in an environment that permits local server binding.
- Re-run `npm run lhci` and `npm run lhci:mobile` where Chromium and preview-server binding are available.

---

# Test Automation Summary - Story 3.3 (SEO Metadata — Meta Tags, OG, hreflang & Sitemap)

Generated: 2026-05-15
Frameworks: Vitest 4.1.6, Playwright 1.60.0
Scope: per-route head management, locale-aware title/description/OG/canonical/hreflang, `<html lang>` updates on locale change, querystring locale activation on first paint, indexable Privacy page, build-time `sitemap.xml` and `robots.txt`, admin-route head cleanup.
Story file: `_bmad-output/implementation-artifacts/3-3-seo-metadata-meta-tags-og-hreflang-sitemap.md`

## Generated Tests

### Unit Tests (already in story scope)

- [x] `src/lib/seo.test.ts` — `getCanonicalUrl`, locale-to-`og:locale` map, supported-locale guard, dev-only `VITE_SITE_URL` fallback warn-once.
- [x] `src/components/SEO.test.tsx` — `useDocumentMeta` writes title/description/OG/canonical/hreflang for active locale; `i18n.changeLanguage('pt-BR')` updates managed tags without duplication (count constant by `data-seo="managed"`).
- [x] `src/i18n/index.test.ts` — i18next detection order includes `querystring` first, `lookupQuerystring: 'lng'`, `caches: ['localStorage']` only.

### E2E Tests

- [x] `tests/e2e/seo.spec.ts` — extended for ES coverage and locale-aware Privacy:
  | # | Scope | AC |
  |---|-------|----|
  | 1 | Home EN + PT-BR head tags via switcher | AC1, AC2, AC3 |
  | 2 | Home switcher cycles EN → PT-BR → ES with correct `og:locale` | AC2 |
  | 3 | `?lng=pt-BR` first paint activates PT-BR | AC7 |
  | 4 | `?lng=es` first paint activates ES | AC7 |
  | 5 | `/privacy` indexable + alternates (en + pt-BR + es + x-default) | AC6 |
  | 6 | `/privacy?lng=pt-BR` PT-BR title/description/og:url/og:locale | AC6 |
  | 7 | `/privacy?lng=es` ES title/description/og:url/og:locale | AC6 |
  | 8 | `/admin` strips public canonical, OG, hreflang on hydration | AC4 (sitemap exclusion mirror) |
- [x] `tests/e2e/seo-assets.spec.ts` — extended:
  - sitemap.xml status 200, content-type, sitemaps.org + xhtml namespaces, exactly 2 `<url>` entries, ISO `<lastmod>`, all four hreflang alternates per URL for both `/` and `/privacy` (8 `<xhtml:link>` total), no `/admin`.
  - robots.txt status 200, content-type, `User-agent: *`, `Allow: /`, `Disallow: /admin`, `Disallow: /api`, absolute `Sitemap:` directive.
  - Spec is gated on `PLAYWRIGHT_BASE_URL` so it exercises `npm run preview` (dist/client), not the dev server.
- [x] `tests/e2e/locale-switch.spec.ts` — already extended in story scope to assert `html[lang]` + `document.title` change on locale switch.

### API Tests

Not applicable — Story 3.3 is frontend + static-asset only. No backend endpoint added or changed; SEO assets are served via `express.static` over `dist/client` per existing `server/index.ts`.

## Coverage

- AC1 (locale-aware home head tags) — `seo.spec.ts` specs 1, 2 + `SEO.test.tsx`.
- AC2 (locale change updates `<html lang>`, `og:locale`, title, description without reload) — `seo.spec.ts` spec 2 + `locale-switch.spec.ts` + `SEO.test.tsx`.
- AC3 (four `<link rel="alternate" hreflang>` on `/`) — `seo.spec.ts` spec 1 + `SEO.test.tsx`.
- AC4 (`/sitemap.xml` schema, two URLs, lastmod, four alternates per URL, `/admin` absent) — `seo-assets.spec.ts`.
- AC5 (`/robots.txt` directives + sitemap pointer) — `seo-assets.spec.ts`.
- AC6 (Privacy indexable, locale-aware, hreflang) — `seo.spec.ts` specs 5–7.
- AC7 (querystring `?lng=` first paint for PT-BR and ES) — `seo.spec.ts` specs 3, 4.
- AC8 (automated test coverage) — covered by the combined unit + e2e set above.

### Intentionally not duplicated

- Bundle-isolation regression (`SEO.tsx` must not pull Motion or sections into main chunk) is exercised by `npm run build` chunk inspection per Story 3.2 conventions; not re-asserted at the e2e layer.
- ES home meta on locale-switch already covered by spec 2; no separate `?lng=es` privacy querystring duplicate beyond spec 7.
- og:image asset existence (`dist/client/og-default.png`) is verified by `npm run build` per the story's Task 7; e2e asserts the OG meta `content` URL only.

## Verification

- `npm run typecheck` → passed.
- `npm run test:run -- src/lib/seo.test.ts src/components/SEO.test.tsx src/i18n/index.test.ts` → passed: 3 files, 21 tests.
- `npx playwright test tests/e2e/seo.spec.ts tests/e2e/seo-assets.spec.ts --list` → 40 tests discovered across chromium, webkit, mobile-chrome, mobile-webkit (8 specs × 4 projects + 2 asset specs × 4 projects, asset specs auto-skip without `PLAYWRIGHT_BASE_URL`).
- `npm run test:e2e -- tests/e2e/seo.spec.ts` → blocked: configured `npm run dev` web server cannot bind in this sandbox (`listen EPERM` on `/tmp/tsx-1001/*.pipe` and `127.0.0.1:5173`), same blocker recorded for Story 3.2.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npx playwright test tests/e2e/seo-assets.spec.ts` → blocked: `npm run preview` requires the same local socket binding that the sandbox denies.
- `npm run lhci` / `npm run lhci:mobile` → blocked by the same sandbox constraint (LHCI auto-starts a preview server).

## Files Touched

- `tests/e2e/seo.spec.ts` (added ES and locale-aware Privacy specs)
- `tests/e2e/seo-assets.spec.ts` (added per-URL hreflang assertions and total `<xhtml:link>` count)
- `_bmad-output/implementation-artifacts/tests/test-summary.md` (Story 3.3 section appended)

## Checklist Validation

- [x] API tests generated (N/A — no API surface).
- [x] E2E tests generated for SEO head, locale querystring, Privacy locale variants, and static asset emission.
- [x] Tests use standard Vitest and Playwright APIs.
- [x] Tests cover happy paths.
- [x] Tests cover critical regressions: ES locale path, locale-aware Privacy meta, per-URL sitemap hreflang count, admin head cleanup, robots disallow.
- [ ] All generated Playwright tests run successfully in this sandbox (blocked by local server `listen EPERM`; specs parse and list cleanly).
- [x] Tests use proper locators (roles, semantic CSS, request fixture).
- [x] Tests have clear descriptions.
- [x] No hardcoded waits or sleeps.
- [x] Tests are independent and do not depend on execution order.
- [x] Test summary updated.
- [x] Tests saved to `tests/e2e/`.
- [x] Summary includes coverage metrics.

## Next Steps

- Re-run `npm run test:e2e -- tests/e2e/seo.spec.ts` in an environment that permits local server binding.
- Re-run `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npx playwright test tests/e2e/seo-assets.spec.ts` against `npm run preview` so `dist/client/sitemap.xml` and `dist/client/robots.txt` are exercised end-to-end.
- Re-run `npm run lhci` and `npm run lhci:mobile` where Chromium and preview-server binding are available; SEO category gates already cover hreflang/sitemap discoverability.
