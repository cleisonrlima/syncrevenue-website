import {
  forwardRef,
  useEffect,
  useState,
  type ImgHTMLAttributes,
  type SyntheticEvent,
} from 'react'

/**
 * Story 7.1 (AC 4): 1:1 port of the Figma 'teste' `ImageWithFallback`
 * component (`src/app/components/figma/ImageWithFallback.tsx` in the
 * Figma source).
 *
 * Behaviour:
 *   - Renders a normal `<img>` element with whatever `src` and other
 *     `ImgHTMLAttributes` the caller provides.
 *   - When the browser fires an `error` event on the image (network
 *     failure, 404, CORS issue, etc.), the component swaps the `src` to
 *     an inline data-URI SVG placeholder so the layout does not collapse
 *     and the user still sees a visual affordance. The fallback marker
 *     also adds a `data-fallback="true"` attribute so consumers (and
 *     tests) can assert the swap happened.
 *
 * Notes:
 *   - `forwardRef` is used because the Figma source ships the component as
 *     a forwardRef and Epic 7 dashboard pages will mount it inside
 *     animated containers (motion ref propagation).
 *   - The fallback SVG is inlined (no external asset) so the swap never
 *     triggers another network request that could itself fail.
 *   - The caller's own `onError` (if any) is invoked BEFORE the fallback
 *     swap so external observability (logging, metrics) still fires.
 */

const FALLBACK_SVG_DATA_URI =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true">' +
      '<rect width="88" height="88" rx="8" fill="#1f2937" />' +
      '<path d="M24 32h40v24H24z" fill="none" stroke="#6b7280" stroke-width="2" />' +
      '<circle cx="32" cy="40" r="3" fill="#6b7280" />' +
      '<path d="M28 52l8-8 8 8 12-12 8 8" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />' +
      '</svg>',
  )

export type ImageWithFallbackProps = ImgHTMLAttributes<HTMLImageElement>

export const ImageWithFallback = forwardRef<HTMLImageElement, ImageWithFallbackProps>(
  function ImageWithFallback(
    { src, onError, alt, ...rest },
    ref,
  ) {
    const [didFallback, setDidFallback] = useState(false)

    useEffect(() => {
      setDidFallback(false)
    }, [src])

    const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
      // Invoke caller-provided onError first so external logging / metrics fire
      // before the swap completes and any reactive observer sees the fallback
      // src on the next render.
      onError?.(event)
      setDidFallback(true)
    }

    return (
      <img
        ref={ref}
        // Use the fallback once we have swapped; otherwise pass the caller's
        // src through unchanged so the browser does its normal cache behaviour.
        src={didFallback ? FALLBACK_SVG_DATA_URI : src}
        // Preserve caller `alt` semantics. When the fallback is active we
        // intentionally keep the same alt — the swap is a visual recovery, not
        // a semantic change.
        alt={alt}
        data-fallback={didFallback ? 'true' : undefined}
        onError={didFallback ? undefined : handleError}
        {...rest}
      />
    )
  },
)

ImageWithFallback.displayName = 'ImageWithFallback'

export default ImageWithFallback
