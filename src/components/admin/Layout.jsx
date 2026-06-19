import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AdminSidebar       from './Sidebar'
import AdminTopBar        from './TopBar'
import Dashboard          from '../../pages/admin/Dashboard'
import AdminNews          from '../../pages/admin/News'
import AdminEvents        from '../../pages/admin/Events'
import AdminStaff         from '../../pages/admin/Staff'
import AdminGallery       from '../../pages/admin/Gallery'
import AdminUsers         from '../../pages/admin/Users'
import StudentOTPManager  from '../../pages/webadmin/StudentOTPManager'
import PortalSettings     from '../../pages/webadmin/PortalSettings'
import SecurityLogs       from '../../pages/webadmin/SecurityLogs'
import FinancialLogs      from '../../pages/webadmin/FinancialLogs'
import TeacherAccounts    from '../../pages/admin/TeacherAccounts'
import DatabaseReset      from '../../pages/webadmin/DatabaseReset'
import WebsiteContent     from '../../pages/webadmin/WebsiteContent'
import ThemeCustomizer    from '../../pages/webadmin/ThemeCustomizer'
import SuperAdminPanel    from '../../pages/superadmin/SuperAdminPanel'
import LicensePage        from '../../pages/webadmin/LicensePage'

const TITLES = {
  '/admin':                    'Dashboard',
  '/admin/website-content':    'Website Content',
  '/admin/theme':              'Theme & Brand Colours',
  '/admin/news':               'News & Announcements',
  '/admin/events':             'Events Calendar',
  '/admin/staff':              'Staff Directory',
  '/admin/gallery':            'Photo Gallery',
  '/admin/users':              'User Management',
  '/admin/student-otp':        'Student OTP Manager',
  '/admin/portal-settings':    'Portal Settings',
  '/admin/security-logs':      'Security Logs',
  '/admin/financial-logs':     'Financial Audit Logs',
  '/admin/teacher-accounts':   'Teacher Accounts',
  '/admin/database-reset':     'Database Reset',
  '/admin/license':            'System License',
  '/admin/super-admin':        'Super Admin — License Management',
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()

  const handleSidebarToggle = () => {
    if (window.innerWidth >= 1024) {
      setCollapsed(c => !c)
    } else {
      setSidebarOpen(o => !o)
    }
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-navy overflow-hidden font-sans">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopBar
          title={TITLES[pathname] ?? 'Admin'}
          onMenuClick={handleSidebarToggle}
          collapsed={collapsed}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className={collapsed ? 'max-w-7xl mx-auto [&>*]:mx-auto' : ''}>
          <Routes>
            <Route path="/admin"                   element={<Dashboard />} />
            <Route path="/admin/website-content"  element={<WebsiteContent />} />
            <Route path="/admin/theme"            element={<ThemeCustomizer />} />
            <Route path="/admin/news"    element={<AdminNews />} />
            <Route path="/admin/events"  element={<AdminEvents />} />
            <Route path="/admin/staff"   element={<AdminStaff />} />
            <Route path="/admin/gallery"          element={<AdminGallery />} />
            <Route path="/admin/users"            element={<AdminUsers />} />
            <Route path="/admin/student-otp"      element={<StudentOTPManager />} />
            <Route path="/admin/portal-settings"  element={<PortalSettings />} />
            <Route path="/admin/security-logs"    element={<SecurityLogs />} />
            <Route path="/admin/financial-logs"   element={<FinancialLogs />} />
            <Route path="/admin/teacher-accounts" element={<TeacherAccounts />} />
            <Route path="/admin/database-reset"   element={<DatabaseReset />} />
            <Route path="/admin/license"          element={<LicensePage />} />
            <Route path="/admin/super-admin"      element={<SuperAdminPanel />} />
            <Route path="*"                        element={<Navigate to="/admin" replace />} />
          </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}
