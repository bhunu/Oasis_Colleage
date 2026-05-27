import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AdminSidebar from './Sidebar'
import AdminTopBar  from './TopBar'
import Dashboard    from '../../pages/admin/Dashboard'
import AdminNews    from '../../pages/admin/News'
import AdminEvents  from '../../pages/admin/Events'
import AdminStaff   from '../../pages/admin/Staff'
import AdminGallery from '../../pages/admin/Gallery'

const TITLES = {
  '/admin':         'Dashboard',
  '/admin/news':    'News & Announcements',
  '/admin/events':  'Events Calendar',
  '/admin/staff':   'Staff Directory',
  '/admin/gallery': 'Photo Gallery',
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopBar
          title={TITLES[pathname] ?? 'Admin'}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            <Route path="/admin"         element={<Dashboard />} />
            <Route path="/admin/news"    element={<AdminNews />} />
            <Route path="/admin/events"  element={<AdminEvents />} />
            <Route path="/admin/staff"   element={<AdminStaff />} />
            <Route path="/admin/gallery" element={<AdminGallery />} />
            <Route path="*"              element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
