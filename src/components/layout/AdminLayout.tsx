import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

export default function AdminLayout() {
  useEffect(() => {
    document
      .querySelectorAll(
        [
          'meta[name="description"]',
          'meta[property^="og:"]',
          'link[rel="canonical"]',
          'link[rel="alternate"][hreflang]',
        ].join(',')
      )
      .forEach(element => element.remove())
    document.title = 'Sync Sirius Admin'
  }, [])

  return (
    <div className="min-h-screen bg-brand-navy text-white">
      <Outlet />
    </div>
  )
}
