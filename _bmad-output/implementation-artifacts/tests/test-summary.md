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
