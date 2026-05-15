# Test Automation Summary - Story 2.6 (Form Accessibility & Locale-Aware Validation)

Generated: 2026-05-15
Frameworks: Vitest 4.1.6, Playwright 1.60.0
Scope: demo and contact form accessibility, locale-aware validation, keyboard operation, native select behavior, and success live-region focus.

## Generated Tests

### API Tests

- [x] Not applicable for Story 2.6. This story hardens client-side form accessibility and validation without changing API endpoints, payloads, persistence, or SMTP behavior.

### Component and Hook Tests

- [x] `src/components/sections/DemoForm.test.tsx` - Verifies label associations, `aria-required`, stable `aria-describedby` error IDs, focus ring classes, locale-switch revalidation, visual Tab order, disabled invalid submit behavior, success live-region focus, localized success copy, and non-429 toast behavior.
- [x] `src/components/sections/Contact.test.tsx` - Verifies label associations, native required fields, `aria-required`, stable `aria-describedby` error IDs, focus ring classes, fixed subject option values, locale-switch revalidation, visual Tab order, success live-region focus, 429 inline error behavior, and non-429 inline retry behavior.
- [x] `src/hooks/useDemo.test.ts` - Verifies `createDemoSchema(t)` localized messages, role/GDS/locale allowlists, valid submission flow, invalid submission guard, duplicate submit guard, and retryable API failure state.
- [x] `src/hooks/useContact.test.ts` - Verifies fixed contact subject options, `createContactSchema(t)` localized messages, subject/locale allowlists, valid submission flow, invalid submission guard, duplicate submit guard, retryable API failure state, and 429 state for inline rendering.

### E2E Tests

- [x] `tests/e2e/demo-request.spec.ts` - Extends demo workflow coverage with success `role="status"` focus assertions, `tabindex="-1"`, keyboard Tab sequence, native GDS select keyboard operation, and localized payload/confirmation checks.
- [x] `tests/e2e/contact-form.spec.ts` - Extends contact workflow coverage with success `role="status"` focus assertions, `tabindex="-1"`, keyboard Tab sequence, inline 429 handling, fixed subject options, and localized payload/confirmation checks.
- [x] Existing `tests/e2e/a11y-axe.spec.ts` remains as axe coverage; Story 2.6 keyboard and focus behavior is covered by explicit Playwright assertions rather than axe alone.

## Coverage

- Acceptance Criteria: 6/6 covered by automated tests.
- API endpoints: 0 changed; API test generation not applicable for this client-side story.
- UI forms: 2/2 covered (`DemoForm`, `Contact`).
- Client schema factories: 2/2 covered (`createDemoSchema(t)`, `createContactSchema(t)`).
- Critical error cases: invalid local validation, locale-switched visible errors, non-429 demo API failure, contact 429 inline error, invalid hook submission guards, duplicate submit guards.
- Accessibility behaviors: explicit labels, required semantics, stable error descriptions, visible focus classes, keyboard Tab order, native select keyboard operation, `role="status"` live regions, deterministic success focus.

## Verification

- `npm run typecheck` -> passed.
- `npm run test:run -- src/components/sections/DemoForm.test.tsx src/components/sections/Contact.test.tsx src/hooks/useDemo.test.ts src/hooks/useContact.test.ts` -> passed: 4 files, 33 tests.
- `npm run test:run` -> passed: 43 files, 227 tests.
- `npm run test:e2e -- tests/e2e/demo-request.spec.ts tests/e2e/contact-form.spec.ts` -> blocked before browser execution because the sandbox prevents the configured local dev server from starting.
- `npm run dev` -> confirms the same sandbox blocker: `tsx watch server/index.ts` fails with `listen EPERM /tmp/tsx-1001/30.pipe`.

## Files Touched

- `src/components/sections/DemoForm.test.tsx`
- `src/components/sections/Contact.test.tsx`
- `src/hooks/useDemo.test.ts`
- `src/hooks/useContact.test.ts`
- `tests/e2e/demo-request.spec.ts`
- `tests/e2e/contact-form.spec.ts`
- `_bmad-output/implementation-artifacts/tests/test-summary.md`

## Checklist Validation

- [x] API tests generated if applicable. Not applicable for this client-only story.
- [x] E2E tests generated for UI behavior.
- [x] Tests use standard Vitest, Testing Library, user-event, and Playwright APIs.
- [x] Tests cover happy paths.
- [x] Tests cover critical error cases.
- [ ] All generated tests run successfully in this sandbox. Vitest and typecheck passed; Playwright execution is blocked by local listener restrictions before tests start.
- [x] Tests use semantic and accessible locators.
- [x] Tests have clear descriptions.
- [x] No hardcoded waits or sleeps.
- [x] Tests are independent and do not depend on execution order.
- [x] Test summary created.
- [x] Tests saved to appropriate directories.
- [x] Summary includes coverage metrics.

## Next Steps

Run the focused Playwright checks in CI or a local shell that allows localhost listeners:

```bash
npm run test:e2e -- tests/e2e/demo-request.spec.ts tests/e2e/contact-form.spec.ts
```
