/**
 * Story 7.1 (AC 4): `cn` re-export at the Figma-convention import path.
 *
 * The Figma 'teste' source imports its classname helper from
 * `@/lib/cn` (matching the shadcn registry convention). The local repo has
 * had the same helper at `@/lib/utils` since Story 1.2 — that file uses the
 * exact same `clsx` + `tailwind-merge` implementation Figma's source ships.
 *
 * Rather than duplicating the implementation, this module re-exports `cn`
 * from `@/lib/utils` so:
 *   - Future Epic 7 ports of shadcn components (stories 7.3 + 7.4) can be
 *     copied 1:1 from the Figma source with the import path intact
 *     (`import { cn } from '@/lib/cn'` works out of the box).
 *   - The 22 existing Epic 1–6 consumers that import from `@/lib/utils`
 *     keep working unchanged (no migration churn in this story).
 *   - Both paths resolve to the same function reference (referential
 *     equality), so test mocks targeting either path remain consistent.
 */
export { cn } from './utils'
