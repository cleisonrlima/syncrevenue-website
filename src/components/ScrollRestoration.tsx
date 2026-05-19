import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollRestoration() {
  const { pathname, hash } = useLocation()
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (hash) {
      isFirstRun.current = false

      const targetId = decodeURIComponent(hash.slice(1))
      if (!targetId) return

      let cancelled = false
      let timeoutId: number | undefined

      const scrollToHashTarget = (attempt = 0) => {
        if (cancelled) return

        const target = document.getElementById(targetId)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' })
          return
        }

        if (attempt < 30) {
          timeoutId = window.setTimeout(() => scrollToHashTarget(attempt + 1), 100)
        }
      }

      scrollToHashTarget()

      return () => {
        cancelled = true
        if (timeoutId) window.clearTimeout(timeoutId)
      }
    }

    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash])

  return null
}
