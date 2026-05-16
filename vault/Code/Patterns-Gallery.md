# Canonical Patterns Gallery

> Single source of truth for project conventions. When a pattern is reused, document it here so the next contributor doesn't rediscover it via grep.
> Cross-references: [[00-Home]] · [[Planning/Architecture-Key]] · [[Code/Index]]

This catalog supersedes the inline summaries previously held in `Planning/Architecture-Key.md`. The Architecture-Key note retains short snippets and the WCAG waivers; this gallery is the authoritative pattern inventory.

---

## 1. Lazy + Suspense + ErrorBoundary trio (sections)

**Where:** Every home-page section that is non-critical for first paint. Established Story 1.4; reused unchanged in Stories 1.5 – 2.4.

```tsx
<ErrorBoundary>
  <Suspense fallback={<SectionSkeleton className="min-h-[400px]" label="Loading section" />}>
    <LazySection />
  </Suspense>
</ErrorBoundary>
```

**File:** `src/pages/Home.tsx` lines 28 – 60 (one trio per section).

**Rejected:**
- Top-level single `ErrorBoundary` wrapping the entire route — no blast-radius isolation; one section error blanks the whole page.
- `React.lazy` without a `Suspense` boundary — throws at render time.

---

## 2. DAO factory + default singleton

**Where:** Every server-side data accessor in `server/dao/`.

```ts
export function createLeadsDao(database: Database = defaultDb): LeadsDao { ... }
export const leadsDao = createLeadsDao()
```

**File:** `server/dao/leads.dao.ts` lines 42 and 107 (and the parallel structure in `contacts.dao.ts`, `team.dao.ts`, `admin.dao.ts`).

**Rejected:**
- Class-based DAO instantiated per request (`new LeadsDao(db)`) — no DI gain in this stack, harder to mock, more ceremony.
- Free functions reading the module-level `db` directly — no injection point, tests cannot swap the DB.

---

## 3. `createApp()` test harness

**Where:** Every server test that needs an Express instance — `server/routes/*.test.ts`, `server/index.test.ts`.

```ts
export function createApp(): Express { /* full middleware + routes */ }
// In tests:
const app = createApp()
await request(app).post('/api/demo').send(payload)
```

**File:** `server/index.ts` line 18 (factory); test consumers in `server/routes/demo.test.ts` etc.

**Rejected:**
- Importing the running `app` instance from `server/index.ts` — couples tests to the `listen()` side effect; multiple test files would race on the port.
- Hand-rolling Express in each test file — duplicates middleware and drifts from production.

---

## 4. Fire-and-forget SMTP via `void sendNotification(...).catch(...)`

**Where:** Every server route that triggers an internal email (`server/routes/demo.ts`, `server/routes/contact.ts`).

```ts
void sendNotification(subject, body).catch(err => console.error('[notify]', err))
res.json({ success: true, ... })
```

**File:** `server/routes/demo.ts` line 36; `server/routes/contact.ts` line 36.

**Rejected:**
- `await sendNotification(...)` before `res.json()` — blocks the 2xx response on SMTP latency, leaks failure surface to the visitor.
- Background queue / job runner — out of scope for a single-process SQLite app; would add infrastructure for no current need.

---

## 5. API envelope `success: true` strictness

**Where:** Every API response — server emits it, client checks it.

```ts
res.json({ success: true, id, ... })
// client:
if (!body.success) throw new Error('API responded without success envelope')
```

**File:** `src/lib/api.ts` lines 31, 36, 41; server route handlers across `server/routes/`.

**Rejected:**
- Bare resource objects (`res.json(row)`) — callers cannot distinguish a 2xx-with-body-error from real success.
- HTTP status alone — middleware can flip 2xx → 4xx late; envelope is the contract.

---

## 6. `useImperativeHandle` multi-CTA convergence

**Where:** Forms or sections that multiple call-sites need to imperatively control (focus, reset, scroll-to). Story 2.4 case: many CTAs scroll to the single `DemoForm` and focus its first field.

```tsx
export type DemoFormHandle = { focusFirstField: () => void }
const DemoForm = forwardRef<DemoFormHandle>(function DemoForm(_props, ref) {
  useImperativeHandle(ref, () => ({ focusFirstField: () => nameInputRef.current?.focus() }))
  ...
})
```

**File:** `src/components/sections/DemoForm.tsx` lines 48 – 63.

**Rejected:**
- Prop-drilling a focus callback down through layout components — couples every intermediate component to the form.
- Duplicating the form per CTA — Story 2.4 explicitly enforces a single `DemoForm` instance via e2e test `Home.story-2-4.e2e.test.tsx`.

---

## 7. `defaultValue` discipline on every `t()` call

**Where:** Every call to `useTranslation()`'s `t()` in the codebase. Every key MUST be paired with a defaultValue.

```tsx
t('errors.sectionLoad', { defaultValue: 'Failed to load section.' })
```

**File:** Every `src/**/*.{ts,tsx}` consumer of `useTranslation`. Tracked as Story 3.10 ESLint enforcement.

**Rejected:**
- Bare `t('errors.sectionLoad')` — i18next returns the key string on miss, silently rendering `errors.sectionLoad` in the UI.
- Centralized "english-fallback" lookup table — duplicates the locale JSON and drifts.

---

## 8. `forwardRef` form components

**Where:** Any input or form that the parent needs an imperative ref to. Pair with `useImperativeHandle` (see pattern 6).

```tsx
const Field = forwardRef<HTMLInputElement, Props>(function Field(props, ref) { ... })
```

**File:** `src/components/sections/DemoForm.tsx` line 52.

**Rejected:**
- `document.getElementById` hacks — couples behavior to DOM IDs and breaks under SSR / portal rendering.
- Callback refs without `forwardRef` — the parent can no longer use a standard `useRef<DemoFormHandle>()`.

---

## 9. Co-located tests (never `__tests__/`)

**Where:** Every test file in the project.

```
src/components/sections/Hero.tsx
src/components/sections/Hero.test.tsx
server/dao/leads.dao.ts
server/dao/leads.dao.test.ts
```

**File:** Convention enforced project-wide; see any module under `src/components/` or `server/`.

**Rejected:**
- `__tests__/` directories — lose proximity, orphan tests survive renames, harder to spot missing coverage at a glance.
- Top-level `tests/` mirror tree — only used for Playwright e2e (`tests/e2e/`), never for unit/integration.

---

## 10. i18n key max-depth 3, namespaced

**Where:** Every translation key in `src/i18n/locales/*/translation.json`.

```json
{
  "forms": { "demo": { "name": "Full Name", "submit": "Request demo" } }
}
```

**File:** `src/i18n/locales/en/translation.json`, `pt-BR/`, `es/` — 11 top-level namespaces (`nav`, `hero`, `syncrevenue`, `services`, `comparison`, `team`, `security`, `references`, `privacy`, `forms`, `errors`).

**Rejected:**
- Flat keys (`nav_demo_label`) — defeats namespacing, no structural enforcement.
- 4+ levels (`forms.demo.fields.name.label`) — pure ceremony; key-parity test would explode in surface area.

---

## 11. Locale from `useLocaleStore`, not `i18next.language`

**Where:** Every React component that branches on the active locale.

```tsx
const locale = useLocaleStore(state => state.locale)
```

**File:** `src/components/sections/DemoForm.tsx` line 54, `Contact.tsx` line 37, `CommissionAudit.tsx` line 55. Imperative reads use `useLocaleStore.getState().locale` (`DemoForm.tsx:162`).

**Rejected:**
- Reading `i18next.language` directly — bypasses the Zustand sync; the test harness drives locale via `useLocaleStore.setState({ locale })` and components that read i18next directly will not react.
- `useTranslation().i18n.language` — same problem; couples component to the i18next instance and breaks test ergonomics.

---

## 12. `data-*` markers for test selectors

**Where:** Any DOM element a test needs to query that is not naturally addressable by role / text / label.

```tsx
<button data-testid="mobile-overlay-backdrop" ... />
```

**File:** `src/components/layout/Navbar.tsx` lines 121, 131. Queried by `Navbar.test.tsx`.

**Rejected:**
- Selecting by class name — couples tests to styling; refactoring a class breaks unrelated tests.
- Selecting by text in i18n-rendered components — text changes when locale changes, tests would need parametrization for every assertion.
- Adding ids that survive into prod CSS — `data-testid` is testing-only; ids leak into selectors that designers and a11y consumers also care about.

---

## Anti-Patterns (never do)

### `__tests__/` directories
Test files belong next to the file under test. The project's lint and review process treats any `__tests__/` directory as a regression — see Pattern 9.

### Hand-rolled `fetch()` outside `src/lib/api.ts`
All client-side network calls go through `src/lib/api.ts` so the response-envelope contract (Pattern 5) is enforced in one place. Calling `fetch('/api/...')` directly in a component bypasses the envelope check and the typed payload shapes.

### Hardcoded English copy in user-facing UI
Any visible string in a component, page, or section MUST be sourced from `t(key, { defaultValue: '...' })`. ErrorBoundary's fallback was the last holdout — fixed in Story 3.8. New hardcoded strings fail review (see Pattern 7).

### `camelCase` in API responses
The server emits `snake_case` keys (`created_at`, `is_active`). The client converts at the edge in `src/lib/api.ts`, not in components. Mixed casing in route handlers is a regression.

### Toast for form validation errors
Inline `<FormMessage>` per field, never toast. Toast is reserved for transient app-level notifications and is currently not in use.

### Server-side date formatting
Dates cross the API as ISO strings. The client formats per active locale. Server-side `toLocaleDateString` calls smuggle locale assumptions into the server and break under timezone shifts.

---

## How to add a pattern

1. Append a numbered section using the shape above: name, **Where**, fenced code block, **File** (path + line range as of `master`), **Rejected** (at least one alternative with a one-line reason).
2. Verify the file path and line range against current `master` — stale ranges defeat the gallery's purpose.
3. If the pattern supersedes an inline summary in `Planning/Architecture-Key.md`, leave the summary in place but trust this gallery as the canonical reference.
4. Cross-link from the relevant `Code/*.md` module note if the pattern is module-specific.
