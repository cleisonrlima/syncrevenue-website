import { useEffect, useState } from 'react'

/**
 * Story 7.1 (AC 4): 1:1 port of the Figma 'teste' `useIsMobile` hook
 * (`src/app/components/ui/use-mobile.ts` in the Figma source).
 *
 * Returns `true` when the viewport width is below the 768px Tailwind `md`
 * breakpoint, `false` otherwise. Used by Epic 7 stories (7.2+) to drive
 * the DashboardLayout sidebar collapse behaviour and the Landing carousel
 * mobile / desktop layout switch.
 *
 * Implementation notes:
 *   - SSR-safe: the initial state is `false` (desktop) so the prerender
 *     pass (Story 5.6) emits the desktop layout; the listener registers
 *     in `useEffect` (client-only) and corrects the value on first paint.
 *   - Uses `window.matchMedia('(max-width: 767px)')` rather than reading
 *     `window.innerWidth` directly so the listener fires only on actual
 *     breakpoint crossings (avoids per-pixel resize storms).
 *   - The 767px cutoff (not 768px) matches the Tailwind `md` definition
 *     where `md:` applies at >=768px — so 0..767px is "mobile".
 *   - Cleanup on unmount removes the listener to avoid leaking handlers
 *     when consumers unmount mid-resize.
 */

const MOBILE_BREAKPOINT_QUERY = '(max-width: 767px)'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    // Defensive: matchMedia is missing under non-DOM test environments such
    // as Node without jsdom. The hook returns the SSR-safe default in that
    // case.
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQueryList = window.matchMedia(MOBILE_BREAKPOINT_QUERY)
    const updateMatches = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches)
    }

    // Sync the initial state from the live media query — this corrects the
    // initial `false` if the page actually loaded under a mobile viewport.
    updateMatches(mediaQueryList)

    // Modern browsers use addEventListener('change'); older Safari shipped
    // the deprecated addListener. Use whichever is present.
    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', updateMatches)
      return () => mediaQueryList.removeEventListener('change', updateMatches)
    }

    // Legacy Safari fallback.
    if (typeof mediaQueryList.addListener === 'function') {
      mediaQueryList.addListener(updateMatches)
      return () => mediaQueryList.removeListener(updateMatches)
    }

    return undefined
  }, [])

  return isMobile
}

// Re-export under the Figma source's exact import alias so the Epic 7
// component ports (stories 7.2+) can copy `import { useIsMobile } from
// '@/hooks/use-mobile'` 1:1 from the Figma file without rename churn.
export default useIsMobile
