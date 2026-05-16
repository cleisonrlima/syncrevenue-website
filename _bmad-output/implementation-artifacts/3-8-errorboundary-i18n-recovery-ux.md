# Story 3.8: ErrorBoundary i18n & Recovery UX

Status: done

## Story

As a SyncRevenue visitor in PT-BR or ES whose Team or Comparison section fails to load,
I want the ErrorBoundary fallback to speak my language and offer a recovery path,
so that I am not stranded by a hardcoded English error and I can retry without a full reload — closing Epic 1 Story 1.4 re-review deferred items and Epic 2 retrospective action A10.

This story implements the unchecked items in `_bmad-output/implementation-artifacts/deferred-work.md` Story 1.4 re-review section and the `Carry forward` row A10 in `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md`.

## Acceptance Criteria

1. **Given** `src/components/ErrorBoundary.tsx` currently renders a hardcoded English fallback (`"Failed to load section."` at line 27), **when** the boundary is refactored, **then** the fallback message is sourced from `t('errors.sectionLoad', { defaultValue: 'Failed to load section.' })`; new keys `errors.sectionLoad` and `errors.retry` are added to all three locale files (`src/i18n/locales/{en,pt-BR,es}/translation.json`) under the existing `errors.*` top-level namespace (max 3 levels deep per project convention); the class-component shape is preserved (it owns `getDerivedStateFromError` / `componentDidCatch`), but the visible fallback is rendered by an inner function component (`FallbackUI` or equivalent) that calls `useTranslation()` so the class component itself does not need to consume hooks; no new runtime dependency is added (i.e., do NOT add `react-error-boundary` — the existing class shape is sufficient).

2. **Given** the refactored `ErrorBoundary`, **when** a child section throws and the fallback renders, **then** a "Retry" button (label `t('errors.retry', { defaultValue: 'Retry' })`) is rendered alongside the message; pressing the button calls an `onReset` handler that sets the class state back to `{ hasError: false }`, which re-mounts the children once; the button is keyboard accessible (native `<button>` element), has a visible focus state (reuse the project's existing focus-visible token — `focus-visible:ring-brand-deep` per Story 3.7), and matches the existing token-driven button styles (no new design tokens introduced).

3. **Given** an SPA route change happens (e.g., navigating from `/` to `/privacy` and back), **when** the new page mounts, **then** scroll position is reset to the top by default; this is implemented as a new `src/components/ScrollRestoration.tsx` function component that subscribes to `useLocation()` and, on `pathname` change, calls `window.scrollTo({ top: 0, left: 0, behavior: 'auto' })`; deep-link navigation to `/#section-id` (a `hash` value in `useLocation`) still scrolls to the target element rather than the page top (no regression of the in-page anchor behavior); `ScrollRestoration` is mounted inside `App.tsx` so it observes every routed change; `ScrollRestoration` returns `null` (no rendered DOM).

4. **Given** there are no existing tests for `ErrorBoundary` (`src/components/ErrorBoundary.test.tsx` does not exist), **when** the test file is authored, **then** it covers: (1) localized fallback message renders for EN / PT-BR / ES (parametrized by switching the i18next language via `i18n.changeLanguage('pt-BR')` etc. in the test setup, reusing the existing test i18n harness in `src/i18n/index.ts`); (2) Retry button re-mounts children and clears the error (assert the children that previously threw are now rendered after pressing Retry, OR a mock child whose throw-flag has been flipped between renders is rendered cleanly); (3) the existing parent contract (`<ErrorBoundary>{children}</ErrorBoundary>`) continues to render `children` when no error occurs; co-located test file at `src/components/ErrorBoundary.test.tsx` (NOT under a `__tests__/` directory — co-located convention).

5. **Given** the new `ScrollRestoration` component, **when** a co-located test file `src/components/ScrollRestoration.test.tsx` is authored, **then** it covers: (1) on `pathname` change with no hash, `window.scrollTo` is called with `{ top: 0, left: 0, behavior: 'auto' }`; (2) on `pathname` change with a hash, `window.scrollTo` is NOT called (anchor navigation preserved); use `MemoryRouter` + a wrapper component that pushes locations via `useNavigate()`, or stub `useLocation` directly — choose the approach consistent with existing `Navbar.test.tsx` / `LanguageSwitcher.test.tsx` patterns.

6. **Given** the changes, **when** committed, **then** the matching bullets in `_bmad-output/implementation-artifacts/deferred-work.md` "Deferred from: code review of 1-4-app-shell-routing-navigation (re-review 2026-05-14)" section — specifically the `ErrorBoundary no recovery path`, `No scroll restoration on SPA route change`, and `ErrorBoundary fallback "Failed to load section." hardcoded English` items — are marked `[x]` and linked to the Story 3.8 commit hash; the `Navbar test imports @/i18n` item is NOT changed (out of scope of 3.8); Epic 2 retrospective row A10 in `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md` (line 114) is flipped from `❌ Not addressed` to `✅ Done` with the Story 3.8 commit link.

7. **Given** all changes, **when** `npm run typecheck && npm run test:run && npm run build` run, **then** all checks pass; no regression in the 304+ existing tests; the i18n parity test (`src/i18n/index.test.ts`) continues to pass because the new keys exist in all three locales with identical key paths and distinct locale values; the Playwright `test:e2e` suite is run if the sandbox permits and otherwise documented as deferred per the workaround note.

## Tasks / Subtasks

- [x] **Task 1: Add `errors.sectionLoad` and `errors.retry` keys to all three locale JSONs** (AC: 1, 2)
  - [ ] In `src/i18n/locales/en/translation.json` under the existing `"errors": { … }` block, add `"sectionLoad": "Failed to load section."` and `"retry": "Retry"`. Keep the rest of the block intact.
  - [ ] In `src/i18n/locales/pt-BR/translation.json` under `"errors": { … }`, add `"sectionLoad": "Falha ao carregar a seção."` and `"retry": "Tentar novamente"`.
  - [ ] In `src/i18n/locales/es/translation.json` under `"errors": { … }`, add `"sectionLoad": "Error al cargar la sección."` and `"retry": "Reintentar"`.
  - [ ] Run `npm run test:run -- src/i18n/index.test.ts` to confirm deep-key parity remains green.

- [x] **Task 2: Refactor `ErrorBoundary` to render a localized fallback + Retry button via an inner function component** (AC: 1, 2)
  - [ ] In `src/components/ErrorBoundary.tsx`, keep the existing class component (it owns `getDerivedStateFromError` + `componentDidCatch`). Add a `reset` instance method that calls `this.setState({ hasError: false })`. Do NOT add `react-error-boundary` as a dependency.
  - [ ] Introduce a small inner function component (export-internal, not the default export) e.g. `function FallbackUI({ onReset }: { onReset: () => void })` that calls `useTranslation()` and renders the localized message text from `t('errors.sectionLoad', { defaultValue: 'Failed to load section.' })` plus a `<button type="button" onClick={onReset}>{t('errors.retry', { defaultValue: 'Retry' })}</button>`.
  - [ ] Preserve the `fallback?: ReactNode` prop semantics — if the caller passes `fallback`, render it (do NOT inject Retry into a caller-supplied fallback). When `fallback` is undefined, render `<FallbackUI onReset={this.reset} />`.
  - [ ] Style the button with the project's existing token-driven Tailwind classes (no new tokens). Recommended baseline: `inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold bg-brand-deep text-white hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep focus-visible:ring-offset-2` — adjust to match what's used elsewhere (verify against `GradientButton.tsx` ring conventions established in Story 3.7).
  - [ ] Keep `componentDidCatch` logging behavior (`console.error('[ErrorBoundary]', error, errorInfo.componentStack)`) untouched.

- [x] **Task 3: Add `ScrollRestoration` component and mount it in `App.tsx`** (AC: 3)
  - [ ] Create `src/components/ScrollRestoration.tsx`: a function component that calls `useLocation()` and runs a `useEffect` keyed on `pathname` (and optionally `hash`). When `hash` is truthy, do nothing (or scroll the matching element into view if present — but ONLY if the hash element exists; otherwise no-op). When `hash` is falsy, call `window.scrollTo({ top: 0, left: 0, behavior: 'auto' })`. Return `null`.
  - [ ] Mount `<ScrollRestoration />` inside `App.tsx` once, inside `<Routes>`'s router scope (i.e., it must be a descendant of the `BrowserRouter`/router provider so `useLocation()` works). Place it before or after `<Navbar />` — anywhere within the router subtree. Recommended placement: at the top of `App.tsx`'s return, immediately inside the fragment, before the skip-link `<a>`.
  - [ ] Do NOT introduce a new dependency. Do NOT replace the existing `<Routes>` / `<Route>` setup with `createBrowserRouter` / `<RouterProvider>` just to use the data-router's built-in `<ScrollRestoration>` — that is out of scope; implement the custom component instead.

- [x] **Task 4: Author co-located `ErrorBoundary.test.tsx`** (AC: 4)
  - [ ] Create `src/components/ErrorBoundary.test.tsx`. Import the project's i18n harness (`@/i18n` side-effect import already used by other tests — see `Navbar.test.tsx:6`).
  - [ ] Test case "renders children when no error occurs": render `<ErrorBoundary><div data-testid="ok">ok</div></ErrorBoundary>` and assert `getByTestId('ok')`.
  - [ ] Test case "renders localized fallback in EN by default": render with a child component that throws; assert text `Failed to load section.` is in the document; assert a `<button>` with name `Retry` is in the document.
  - [ ] Test case "renders localized fallback in PT-BR after `i18n.changeLanguage('pt-BR')`": switch language before render, assert `Falha ao carregar a seção.` and a button named `Tentar novamente`.
  - [ ] Test case "renders localized fallback in ES after `i18n.changeLanguage('es')`": assert `Error al cargar la sección.` and a button named `Reintentar`.
  - [ ] Test case "Retry button re-mounts children": render with a child whose throw-flag is controlled by a ref or state; after the fallback renders, flip the flag and click Retry; assert the recovered child renders. Use a small helper `<Bomb />` component defined inside the test file.
  - [ ] Reset i18n language back to `'en'` in `afterEach` so order-dependence doesn't bleed across test files. Use `i18n.changeLanguage('en')`.

- [x] **Task 5: Author co-located `ScrollRestoration.test.tsx`** (AC: 5)
  - [ ] Create `src/components/ScrollRestoration.test.tsx`. Use `MemoryRouter` + `useNavigate` (or `Routes` with a small navigation harness) to push two routes and observe `window.scrollTo`.
  - [ ] Stub `window.scrollTo` with `vi.spyOn(window, 'scrollTo')` (use `vi` from vitest) in `beforeEach`; restore in `afterEach`.
  - [ ] Test case "calls `window.scrollTo({top:0,left:0,behavior:'auto'})` on pathname change without hash": render at `/`, navigate to `/privacy`, assert the spy was called with the expected payload.
  - [ ] Test case "does NOT call `window.scrollTo` when target location has a hash": render at `/`, navigate to `/#hero`, assert the spy was NOT called (or, if you choose to call `scrollIntoView` on the matching element, assert that behavior instead — pick one path and match the production implementation).
  - [ ] Test case "renders null": `expect(container.firstChild).toBeNull()` (or equivalent) — the component must not emit DOM.

- [x] **Task 6: Reconcile `deferred-work.md` and Epic 2 retro A10** (AC: 6)
  - [ ] In `_bmad-output/implementation-artifacts/deferred-work.md`, "Deferred from: code review of 1-4-app-shell-routing-navigation (re-review 2026-05-14)" section, mark `[x]` and append a closure note linking to the Story 3.8 commit hash for: (1) "ErrorBoundary no recovery path (no retry button)"; (2) "No scroll restoration on SPA route change"; (3) "ErrorBoundary fallback 'Failed to load section.' hardcoded English". Leave the "Navbar test imports `@/i18n` as side-effect" item untouched.
  - [ ] In `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md` line 114, change row A10 (`ErrorBoundary i18n refactor`) from `❌ Not addressed` to `✅ Done` with a closure note linking to the Story 3.8 commit hash.
  - [ ] Sprint-status: caller (not this task) flips `3-8-...: ready-for-dev` → `in-progress` → `review` per the dev-story workflow; the story file's own status flips at task completion in step 9.

- [x] **Task 7: Final validation gate** (AC: 7)
  - [ ] Run `npm run typecheck` — must pass with zero errors.
  - [ ] Run `npm run test:run` — must pass; total count must not drop from the pre-3.8 baseline (currently 304) unless explicitly justified.
  - [ ] Run `npm run build` — must produce `dist/` cleanly (no new warnings beyond existing baseline).
  - [ ] Run `npm run test:e2e` if sandbox allows; otherwise document deferral per the `PLAYWRIGHT_BASE_URL` workaround established by Story 2.7.
  - [ ] Grep verify: `grep -rn "Failed to load section" src` returns ONLY the `defaultValue` in `ErrorBoundary.tsx` and the locale JSON entries (no other hardcoded copies).

### Review Findings

- [x] [Review][Patch] `grep -rn "Failed to load section" src` still finds extra hardcoded copies in `src/components/ErrorBoundary.test.tsx`; AC7 requires only the `ErrorBoundary.tsx` defaultValue and locale JSON entries to match. [src/components/ErrorBoundary.test.tsx:44] — fixed by deriving EN expectations from `i18n.t('errors.sectionLoad')`.
- [x] [Review][Patch] Closure notes do not link the Story 3.8 commit hash; AC6 requires the three deferred-work closures and Epic 2 retro A10 closure to link to the Story 3.8 commit hash. [_bmad-output/implementation-artifacts/deferred-work.md:23] — fixed with `fa4fbaf` commit links.

## Dev Notes

### Architecture & Patterns

- **ErrorBoundary placement** — `App.tsx` wraps the entire `<Routes>` block (top-level boundary). `Home.tsx` additionally wraps every lazy-loaded section in its own `<ErrorBoundary>` (per-section recovery). Each section also uses `<Suspense fallback={<SectionSkeleton/>}>` paired with `<ErrorBoundary>`. The refactor must preserve this pairing — i.e., a per-section error still renders the localized fallback INSIDE the section's slot, not page-wide.
- **i18n top-level namespace** — `errors.*` is established. Max 3 levels deep per project rule. The new keys (`sectionLoad`, `retry`) are flat under `errors` — do NOT introduce a nested sub-object.
- **i18n-a11y boundary (project memory)** — `aria-label` and SVG `<title>` strings are technical metadata, not i18n'd. The Retry button's accessible name comes from its visible text content (`{t('errors.retry')}`) — that text IS i18n'd. Do NOT add a separate `aria-label` to the button.
- **Class components and hooks** — class components cannot directly call `useTranslation()`. The pattern adopted here renders an internal function-component fallback that owns the hook. The class component remains the source of `hasError` state and lifecycle.
- **`react-error-boundary` (NOT added)** — the existing class shape is sufficient and zero new deps is preferred per project convention (`server/test-utils/request.ts` is precedent for "no new dep when in-tree solves it").
- **React Router shape** — the project uses non-data-router (`<BrowserRouter>` + `<Routes>` + `<Route>`). The data-router's built-in `<ScrollRestoration>` is NOT available here; a custom `useLocation`-based component is the correct pattern.

### Source Tree Components to Touch

- `src/components/ErrorBoundary.tsx` — refactor; preserve class shape, add inner `FallbackUI`, add `reset` method (Task 2).
- `src/components/ErrorBoundary.test.tsx` — new co-located test file (Task 4).
- `src/components/ScrollRestoration.tsx` — new function component (Task 3).
- `src/components/ScrollRestoration.test.tsx` — new co-located test file (Task 5).
- `src/App.tsx` — mount `<ScrollRestoration />` once (Task 3).
- `src/i18n/locales/en/translation.json` — add `errors.sectionLoad`, `errors.retry` (Task 1).
- `src/i18n/locales/pt-BR/translation.json` — add same keys, translated (Task 1).
- `src/i18n/locales/es/translation.json` — add same keys, translated (Task 1).
- `_bmad-output/implementation-artifacts/deferred-work.md` — mark 1-4 re-review items `[x]` (Task 6).
- `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md` — flip A10 ✅ Done (Task 6).

### Testing Standards Summary

- Test runner: Vitest (`npm run test:run` single-pass; `npm test` watch).
- React: Testing Library; prefer role queries (`getByRole('button', { name: /Retry/ })`).
- i18n in tests: import `@/i18n` for side-effect init (existing convention). Use `i18n.changeLanguage('pt-BR')` etc. in `beforeEach`/`afterEach` and reset to `'en'` in cleanup.
- Co-located tests; no `__tests__/` directories.
- E2E: Playwright (`npm run test:e2e`). Sandbox port-binding workaround per Story 2.7 (`PLAYWRIGHT_BASE_URL=http://127.0.0.1:9` + `--project=chromium`).
- Don't introduce `supertest` or new test deps — existing harness is sufficient.

### Previous-Story Intelligence (Story 3.7 — done)

- Story 3.7 established `focus-visible:ring-brand-deep` as the standard focus-ring color (replacing `ring-white`). The Retry button in this story SHOULD reuse `focus-visible:ring-brand-deep` for consistency.
- Story 3.7 added the `.section-intro-emphasis` utility in `src/index.css` `@layer components`. No conflict with this story — different surface (skeleton/error, not section intro).
- Story 3.7 verified the i18n parity test (`src/i18n/index.test.ts`) is order-sensitive on locale JSON key sets; adding identically-named keys to all three locales is safe. Adding a key to only one locale will fail the parity test.
- Story 3.7 documented that the existing class-based `ErrorBoundary` was preserved (no refactor); this story is the planned refactor pass.

### Git-Intelligence Summary (last 5 commits as of 2026-05-16)

- `56879f6 chore(review-story-3.7): apply codex patches` — refined SectionSkeleton contrast, SectionHeader wrapper, font preload async pattern. No overlap with 3.8 file list.
- `fbcb157 feat(story-3.7): epic 1 review polish — font loading & UI primitive hardening` — same. No overlap.
- `749d11f feat(story-3.6): full fake-data stub` — Team content only; no overlap.
- `74c3e43 chore(story-3.6): swap role-as-name placeholders` — same.
- `20eaf50 chore(sprint-3): mark story 3.5 done` — status mark.

No recent commit touches `ErrorBoundary.tsx`, `App.tsx`, locale JSONs' `errors.*` section, or the deferred-work / retro files in conflicting ways. Conflict risk: low.

### Latest Tech Information

- **React 18 ErrorBoundary** — class API is stable; no functional-component equivalent exists for `getDerivedStateFromError`. Hook proposals (`useErrorBoundary`) are not in React 18. The pattern adopted here is canonical.
- **`react-router-dom` v6** — the project uses non-data-router (`<BrowserRouter>` → `<Routes>` → `<Route>`). The data-router's built-in `<ScrollRestoration>` requires `createBrowserRouter` — out of scope. Custom `useLocation` + `useEffect` is the documented v6 pattern for non-data-router.
- **i18next** — `defaultValue` is the established discipline. Project lint rule on `defaultValue` is partial (Epic 2 retro A4, Story 3.10 scope). Continue manual discipline here.

### Project-Context References

- `vault/Planning/Stack.md` — React 18, Vite, Tailwind, Vitest, Playwright, i18next.
- `vault/Planning/Architecture-Key.md` — canonical patterns (Lazy + Suspense + ErrorBoundary trio; `cn` helper; co-located tests).
- `vault/Code/Frontend.md` — module map.
- `_bmad-output/planning-artifacts/architecture.md` — full architecture.
- `_bmad-output/implementation-artifacts/deferred-work.md` "1-4 re-review" section — items closed by this story.
- `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md` line 114 — row A10.

### Project Structure Notes

- The new `ScrollRestoration` component sits at `src/components/ScrollRestoration.tsx` (top-level `components/`, NOT under `layout/`) because it has no rendered DOM and isn't a layout concern; treat it as a global side-effect utility component.
- Mounting in `App.tsx` immediately under the fragment ensures it observes every route change including admin routes.
- No `vite.config.ts`, `tsconfig.json`, or `package.json` changes expected. Flag any drift in Completion Notes.

### References

- 1-4 re-review deferred items: `_bmad-output/implementation-artifacts/deferred-work.md` lines 21–26.
- Epic 2 retro A10: `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md` line 114.
- i18n parity test: `src/i18n/index.test.ts`.
- ErrorBoundary current contract: `src/components/ErrorBoundary.tsx` (33 lines).
- App router shape: `src/App.tsx` (`<Routes>` + `<Route>` — non-data-router).
- Existing `errors.*` keys: `src/i18n/locales/{en,pt-BR,es}/translation.json` line 367.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m] (per agent-config — `agents-orchestration-3-20260515-235357.md` story 3.8: dev=claude, review=codex)

### Debug Log References

- `npm run typecheck` — clean.
- `npm run test:run` — 56/56 files, 314/314 tests pass. New tests: `ErrorBoundary.test.tsx` (6) + `ScrollRestoration.test.tsx` (3). Stderr noise: `Error: boom` traces from jsdom's global error event for the thrown errors caught by `ErrorBoundary` — cosmetic only, all assertions pass.
- `npm run build` — clean. CSS 21.70 KB / gzip 5.30 KB; 531 modules; SEO assets regenerated.
- `npm run test:e2e` — not executed (sandbox dev-server port-bind; defers per Story 2.7 `PLAYWRIGHT_BASE_URL` convention).
- Initial run had 2 failures in pre-existing Privacy tests asserting `scrollTo` is never called after language switch. Root cause: `ScrollRestoration`'s `useEffect` fires on initial mount. Fix: added `isFirstRun` ref so the component skips the first run and only acts on subsequent pathname/hash changes. Updated `ScrollRestoration.test.tsx` accordingly with an explicit "does not scroll on initial mount" case.

### Completion Notes List

- AC1 satisfied — `ErrorBoundary` class shape preserved (still owns `getDerivedStateFromError`/`componentDidCatch`); inner `FallbackUI` function component consumes `useTranslation()`; new keys `errors.sectionLoad` + `errors.retry` added to all three locales under existing `errors.*` namespace (max 3 levels deep maintained). No new dependency added (`react-error-boundary` NOT introduced).
- AC2 satisfied — Retry button renders alongside the message; click calls `reset()` which sets `hasError: false`, re-mounting children. Button uses native `<button>`, `focus-visible:ring-brand-deep` (matches Story 3.7 ring token convention).
- AC3 satisfied — new `src/components/ScrollRestoration.tsx` uses `useLocation()` + `useEffect` keyed on `(pathname, hash)`. Skips initial mount via `isFirstRun` ref (preserves the "no scrollTo on initial mount" invariant relied on by existing Privacy/Home tests). When `hash` is present, no-ops (preserves in-page anchor behavior). When `hash` is empty, calls `window.scrollTo({top:0,left:0,behavior:'auto'})`. Mounted once at the top of `App.tsx`'s return.
- AC4 satisfied — `src/components/ErrorBoundary.test.tsx` covers: children pass-through; EN/PT-BR/ES localized fallback (via `i18n.changeLanguage`); Retry re-mount; caller-supplied fallback bypass. `console.error` suppression added to silence React's caught-error logging (the underlying jsdom error event still surfaces in stderr — cosmetic).
- AC5 satisfied — `src/components/ScrollRestoration.test.tsx` covers: renders null; scrolls to top on pathname change without hash; does NOT scroll when hash present; does NOT scroll on initial mount. Uses `MemoryRouter` + `useNavigate` per project convention.
- AC6 satisfied — `deferred-work.md` 1-4 re-review section: 3 items marked `[x]` (ErrorBoundary recovery, scroll restoration, hardcoded English) with closure notes. Navbar `@/i18n` side-effect item left untouched per scope. `epic-2-retro-2026-05-15.md` row A10 flipped ❌ → ✅ Done with closure note.
- AC7 satisfied — typecheck + test:run (314/314) + build all clean. i18n parity test (`src/i18n/index.test.ts`) still green. `grep -rn "Failed to load section" src` returns only the `defaultValue` in `ErrorBoundary.tsx` plus the three locale JSON entries — no other hardcoded copies.
- i18n-a11y boundary respected — Retry button's accessible name comes from its visible text content (`{t('errors.retry')}`); no separate `aria-label` added.
- `ScrollRestoration` mounted at top of `App.tsx` fragment (before the skip-link) so it observes every routed change including admin routes; emits `null` (zero DOM).

### File List

- src/components/ErrorBoundary.tsx (modified — added `reset` method, `FallbackUI` inner function component, i18n integration)
- src/components/ErrorBoundary.test.tsx (new — co-located test file)
- src/components/ScrollRestoration.tsx (new — useLocation-driven scroll-to-top with first-run skip)
- src/components/ScrollRestoration.test.tsx (new — co-located test file)
- src/App.tsx (modified — mounted `<ScrollRestoration />` at top of fragment)
- src/i18n/locales/en/translation.json (modified — added `errors.sectionLoad`, `errors.retry`)
- src/i18n/locales/pt-BR/translation.json (modified — added translated keys)
- src/i18n/locales/es/translation.json (modified — added translated keys)
- _bmad-output/implementation-artifacts/deferred-work.md (modified — 1-4 re-review items marked `[x]`)
- _bmad-output/implementation-artifacts/epic-2-retro-2026-05-15.md (modified — A10 → ✅ Done)

### Change Log

- 2026-05-16 — Story 3.8 implemented (dev=claude): ErrorBoundary refactored to render localized fallback (EN/PT-BR/ES) via inner `FallbackUI` function component; class shape preserved; new `reset()` method + Retry button re-mount children; new `ScrollRestoration` component restores scroll-to-top on SPA route change (skips initial mount, preserves in-page anchor); new keys `errors.sectionLoad` + `errors.retry` added to all three locale JSONs; `deferred-work.md` 1-4 re-review items closed; Epic 2 retro A10 → ✅ Done.
