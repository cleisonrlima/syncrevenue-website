# Story 5.8: TypeScript Type Coverage for scripts/prerender.tsx

Status: todo

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
- `prerender.tsx` is a Node.js script: it uses `__dirname`, `process`, `fs`, `path`, and React SSR APIs (`react-dom/server`, `StaticRouter`). These require `"module": "CommonJS"` (or `"Node16"`) and `"moduleResolution": "node"` (or `"node16"`), not Vite's bundler resolution.
- Adding `scripts/` to the Vite tsconfig would incorrectly flag `__dirname` as undefined (ESM context) and import resolution paths would fail.

The correct fix is a dedicated `tsconfig.scripts.json` that extends the shared base but overrides module/resolution settings for the Node.js target, plus wiring `npm run typecheck` to also check that config.

## Acceptance Criteria

1. **Given** a new `tsconfig.scripts.json` file is created **When** it extends `tsconfig.json` **Then** it overrides: `"module": "CommonJS"`, `"moduleResolution": "node"`, `"outDir": undefined` (type-check only via `noEmit: true`), `"lib": ["ES2020"]` (no DOM), and `"include": ["scripts"]` — such that `npx tsc --noEmit --project tsconfig.scripts.json` exits 0 against `scripts/prerender.tsx`.

2. **Given** `tsconfig.scripts.json` exists **When** any TypeScript error is introduced into `scripts/prerender.tsx` (e.g., passing wrong argument type to `renderToString`) **Then** `npx tsc --noEmit --project tsconfig.scripts.json` exits non-zero.

3. **Given** the script typechecks cleanly **When** `npm run typecheck` is updated **Then** the `typecheck` script in `package.json` runs both `tsc --noEmit` (for `src`/`server`) AND `tsc --noEmit --project tsconfig.scripts.json` (for `scripts/`), e.g.: `"typecheck": "tsc --noEmit && tsc --noEmit --project tsconfig.scripts.json"`.

4. **Given** `tsconfig.scripts.json` is added **When** CI runs the `unit` job in `.github/workflows/quality.yml` **Then** `npm run typecheck` covers `scripts/prerender.tsx` — a type error in the script fails CI.

5. **Given** the `let indexHtml: string` / try-catch / `process.exit(1)` pattern in `prerender.tsx` **When** TypeScript typechecks the file with full `@types/node` resolution **Then** no `TS2454` ("variable used before assigned") error is emitted — either because TypeScript correctly infers `process.exit()` returns `never` (with `@types/node`) or because the declaration is changed to a definite assignment assertion (`let indexHtml!: string`).

## Tasks / Subtasks

- [ ] Task 1 — Create `tsconfig.scripts.json` with correct Node.js module/resolution settings and `"include": ["scripts"]`; verify `npx tsc --noEmit --project tsconfig.scripts.json` exits 0 against the current `prerender.tsx` (AC: 1).

- [ ] Task 2 — Fix `let indexHtml: string` declaration in `prerender.tsx` if TS2454 is emitted under the new config: change to `let indexHtml!: string` (definite assignment assertion) or restructure to avoid the pattern (AC: 5).

- [ ] Task 3 — Update `npm run typecheck` in `package.json` to chain `&& tsc --noEmit --project tsconfig.scripts.json` so both configs run in a single `npm run typecheck` call (AC: 3).

- [ ] Task 4 — Confirm `.github/workflows/quality.yml` `unit` job's `npm run typecheck` step now covers `scripts/prerender.tsx` — introduce a deliberate type error, run `npm run typecheck`, confirm non-zero exit, then revert (AC: 2, 4).

- [ ] Task 5 — Run the full Vitest suite + `npm run build` to confirm no regressions from the tsconfig addition (AC: implied).

## Dev Notes

- `@types/node` is already in `devDependencies` (`^25.7.0`), so Node.js global types are available.
- The `tsconfig.scripts.json` should use `"types": ["node"]` explicitly to avoid pulling in DOM types.
- `__dirname` is available in Node.js CJS context. With `"module": "CommonJS"` and `@types/node`, TypeScript correctly types it. tsx injects the `__dirname` shim at runtime for .tsx files, so there is no runtime issue — this story is purely about compile-time coverage.
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

## Testing Requirements

- `npx tsc --noEmit --project tsconfig.scripts.json` exits 0.
- `npm run typecheck` covers both `src`/`server` and `scripts/` in one command.
- Full Vitest suite (747+ tests) passes without modification.
- `npm run build` exits 0.
