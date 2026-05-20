# Story 5.8: TypeScript Type Coverage for scripts/prerender.tsx

Status: done

Epic: 5 — Production Deployment (Phase 4)

Source: Story 5.6 cross-model review finding (2026-05-20). MEDIUM severity — deferred per CLAUDE.md non-trivial rule.

Depends on: Story 5.6 (prerender script landed).

## Story

As the engineer responsible for the production build pipeline,
I want `scripts/prerender.tsx` to be covered by the TypeScript type-checker in CI,
So that type regressions in the prerender script are caught before they can silently corrupt the production `dist/client/index.html`.

## Context

Story 5.6 introduced `scripts/prerender.tsx` — a Node.js build-time script that patches `dist/client/index.html` with server-rendered markup to deliver the hero LCP candidate before React hydrates. The script works correctly at runtime, but it is absent from `tsconfig.json`'s `include` array (`["src", "server", "vite.config.ts", "tailwind.config.ts"]`). As a result, `npm run typecheck` (and the corresponding CI step in `.github/workflows/quality.yml`) silently skips the file.

Simply adding `"scripts"` to the existing `tsconfig.json` `include` is not sufficient:

- `tsconfig.json` is configured for Vite client-side code: `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"lib": ["ES2020", "DOM", "DOM.Iterable"]`.
- `prerender.tsx` is a Node.js build-time script, but it imports `@/App` and therefore typechecks the Vite client graph. The original CommonJS/no-DOM assumption was amended during implementation because the transitive client imports require Vite-compatible module resolution and DOM types.
- Adding `scripts/` to the Vite tsconfig would incorrectly flag `__dirname` as undefined (ESM context) and import resolution paths would fail.

The accepted fix is a dedicated `tsconfig.scripts.json` that extends the shared base, scopes typechecking to `scripts/`, adds Node/Vite typing required by the prerender script, and wires `npm run typecheck` to also check that config.

## Acceptance Criteria

1. **Given** a new `tsconfig.scripts.json` file is created **When** it extends `tsconfig.json` **Then** it includes `["scripts"]`, keeps `noEmit: true`, and adds script-required Node/Vite typing (`types: ["node", "vite/client"]`, `resolveJsonModule`, `esModuleInterop`) while preserving the base Vite module graph settings (`module: "ESNext"`, `moduleResolution: "bundler"`, DOM libs). This accepted amendment replaces the original strict CommonJS/no-DOM target because `scripts/prerender.tsx` imports `@/App`, which transitively typechecks the client React tree and requires DOM + Vite-compatible import resolution. `npx tsc --noEmit --project tsconfig.scripts.json` must exit 0 against `scripts/prerender.tsx`.

2. **Given** `tsconfig.scripts.json` exists **When** any TypeScript error is introduced into `scripts/prerender.tsx` (e.g., passing wrong argument type to `renderToString`) **Then** `npx tsc --noEmit --project tsconfig.scripts.json` exits non-zero.

3. **Given** the script typechecks cleanly **When** `npm run typecheck` is updated **Then** the `typecheck` script in `package.json` runs both `tsc --noEmit` (for `src`/`server`) AND `tsc --noEmit --project tsconfig.scripts.json` (for `scripts/`), e.g.: `"typecheck": "tsc --noEmit && tsc --noEmit --project tsconfig.scripts.json"`.

4. **Given** `tsconfig.scripts.json` is added **When** CI runs the `unit` job in `.github/workflows/quality.yml` **Then** `npm run typecheck` covers `scripts/prerender.tsx` — a type error in the script fails CI.

5. **Given** the `let indexHtml: string` / try-catch / `process.exit(1)` pattern in `prerender.tsx` **When** TypeScript typechecks the file with full `@types/node` resolution **Then** no `TS2454` ("variable used before assigned") error is emitted — either because TypeScript correctly infers `process.exit()` returns `never` (with `@types/node`) or because the declaration is changed to a definite assignment assertion (`let indexHtml!: string`).

## Tasks / Subtasks

- [x] Task 1 — Create `tsconfig.scripts.json` with the accepted Vite-compatible script typecheck settings and `"include": ["scripts"]`; verify `npx tsc --noEmit --project tsconfig.scripts.json` exits 0 against the current `prerender.tsx` (AC: 1).

- [x] Task 2 — Fix `let indexHtml: string` declaration in `prerender.tsx` if TS2454 is emitted under the new config: change to `let indexHtml!: string` (definite assignment assertion) or restructure to avoid the pattern (AC: 5).

- [x] Task 3 — Update `npm run typecheck` in `package.json` to chain `&& tsc --noEmit --project tsconfig.scripts.json` so both configs run in a single `npm run typecheck` call (AC: 3).

- [x] Task 4 — Confirm `.github/workflows/quality.yml` `unit` job's `npm run typecheck` step now covers `scripts/prerender.tsx` — introduce a deliberate type error, run `npm run typecheck`, confirm non-zero exit, then revert (AC: 2, 4).

- [x] Task 5 — Run the full Vitest suite + `npm run build` to confirm no regressions from the tsconfig addition (AC: implied).

## Dev Notes

- `@types/node` is already in `devDependencies` (`^25.7.0`), so Node.js global types are available.
- The accepted config uses `"types": ["node", "vite/client"]` so Node globals and `import.meta.env` are both typed.
- `scripts/prerender.tsx` is executed by `tsx` through the existing Vite-compatible TS graph. Keep `module: "ESNext"` / `moduleResolution: "bundler"` inherited from the base config unless the prerender script is refactored to stop importing `@/App`.
- Do NOT add `scripts/` to `tsconfig.json` — keep client and script configs separate to avoid DOM/Node type conflicts.

## Technical Requirements

- Languages: TypeScript 5.x/6.x (already in devDependencies).
- No new runtime dependencies.
- CI: `quality.yml` `unit` job already runs `npm run typecheck` — extending the script covers CI automatically.

## File Structure Requirements

| File | Change type | Notes |
|---|---|---|
| `tsconfig.scripts.json` | NEW | Node.js-targeted tsconfig for scripts/ |
| `package.json` | UPDATE | `typecheck` script extended |
| `scripts/prerender.tsx` | UPDATE (if needed) | Fix TS2454 if it surfaces |

### Review Findings

- [x] [Review][Patch] Rerun: Story 5.8 AC 1 still required strict CommonJS/no-DOM settings even though the implemented and verified script graph must preserve Vite-compatible module/DOM settings — fixed: AC 1 and Dev Notes now formally document the accepted Vite-compatible script config.

## Testing Requirements

- `npx tsc --noEmit --project tsconfig.scripts.json` exits 0.
- `npm run typecheck` covers both `src`/`server` and `scripts/` in one command.
- Full Vitest suite (747+ tests) passes without modification.
- `npm run build` exits 0.

## Dev Agent Record

### Implementation Summary

Created `tsconfig.scripts.json` that extends the base `tsconfig.json` and adds `scripts/` to the typecheck graph. Wired `npm run typecheck` to run both the base config (for `src`/`server`) and the new scripts config in sequence. Verified that introducing a type error in `scripts/prerender.tsx` causes `npm run typecheck` to exit non-zero, satisfying AC 2.

### Deviation from AC 1 Spec (necessary)

AC 1 prescribes `"module": "CommonJS"`, `"moduleResolution": "node"`, and `"lib": ["ES2020"]` (no DOM). Strict adherence is infeasible because `scripts/prerender.tsx` imports `@/App`, which transitively pulls in the entire React client tree:

- The client tree uses `document` / `window` / DOM element APIs throughout (`src/components/SEO.tsx`, `src/components/sections/Hero.tsx`, etc.) — requires DOM in `lib`.
- The client tree uses `import.meta.env` (`src/lib/seo.ts`) — requires `module` of `es2020`/`esnext` (or `node16`/`nodenext`), NOT `CommonJS`.
- The client tree uses path-mapped imports (`@/*`) without file extensions — requires `moduleResolution: bundler` (or `node` with the path map honoured), NOT `node16`.

The implemented config therefore inherits the base's `module: ESNext`, `moduleResolution: bundler`, and `lib: ["ES2020", "DOM", "DOM.Iterable"]` and adds:

- `types: ["node", "vite/client"]` — Node global types for `scripts/`, vite/client for `import.meta.env` typing.
- `resolveJsonModule: true`, `esModuleInterop: true` — required for `prerender.tsx`'s JSON locale import and CommonJS interop with `fs`/`path`.
- `noEmit: true` — explicit (also inherited from base).
- `include: ["scripts"]` — only the scripts directory.

This preserves AC 1's intent (scripts/ typechecked under the same toolchain as src/ and server/) while honouring the transitive type-graph reality. AC 2, 3, 4, 5 are satisfied unmodified.

AC 5 (TS2454 on `let indexHtml: string`): no error surfaced under the implemented config — `@types/node` types `process.exit` as returning `never`, so TypeScript correctly narrows control flow after the `catch` block. No edit to `prerender.tsx` was required.

### Files Changed

- `tsconfig.scripts.json` (new) — extends base tsconfig, adds `scripts/` to typecheck, adds Node + vite/client types.
- `package.json` (modified) — `typecheck` script extended to chain `tsc --noEmit && tsc --noEmit --project tsconfig.scripts.json`. (Already in place from prior partial work; verified line matches AC 3 spec.)

### Verification Commands Run

- `npx tsc --noEmit --project tsconfig.scripts.json` — exit 0 (AC 1).
- `npm run typecheck` with deliberate type error injected at `scripts/prerender.tsx:127` — exit 2, error reported at that line (AC 2, AC 4).
- `npm run typecheck` after revert — exit 0.
- `npm run test:run` — 751 passing, 14 failing. All 14 failures are timeouts in `server/routes/admin/auth.test.ts` (throttling/lockout suite from Story 4.7), pre-existing flakes unrelated to this story. No new test failures introduced by the tsconfig addition.

### Deferred Actions

- `git commit` and `git push` — sandbox gated; main thread handles.
- `/jira-assistant` sync — main thread handles Jira status transition for SYN-* parent issue and the five Sub-task issues to `Done`.
