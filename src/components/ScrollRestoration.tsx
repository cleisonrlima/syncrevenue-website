import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollRestoration() {
  const { pathname, hash } = useLocation()
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash])

  return null
}
