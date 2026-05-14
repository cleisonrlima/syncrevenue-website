import { Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-brand-navy text-white">
      <Outlet />
    </div>
  )
}
