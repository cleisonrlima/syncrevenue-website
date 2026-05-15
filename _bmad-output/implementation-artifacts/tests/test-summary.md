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
