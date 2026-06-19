import { useState } from 'react'
import { NavLink, useNavigate, Outlet, Navigate } from 'react-router-dom'
import {
  MdDashboard, MdCalendarToday, MdFactCheck, MdCampaign,
  MdBarChart, MdLogout, MdMenu, MdMenuOpen, MdClose, MdMenuBook,
} from 'react-icons/md'
import { FaChalkboardTeacher } from 'react-icons/fa'
import toast from 'react-hot-toast'
import ThemeToggle from '../../components/ThemeToggle'
import sc from '../../utils/schoolConfig'

const NAV = [
  { to: '/teacher/dashboard',    icon: MdDashboard,     label: 'Dashboard'     },
  { to: '/teacher/timetable',    icon: MdCalendarToday, label: 'Timetable'     },
  { to: '/teacher/attendance',   icon: MdFactCheck,     label: 'Attendance'    },
  { to: '/teacher/announcements',icon: MdCampaign,      label: 'Announcements' },
  { to: '/teacher/performance',  icon: MdBarChart,      label: 'Performance'   },
  { to: '/teacher/materials',    icon: MdMenuBook,      label: 'Study Materials' },
]

const VIOLET = '#7C3AED'

function SidebarLink({ to, icon: Icon, label, onClose }) {
  return (
    <NavLink
      to={to}
      end={to === '/teacher/dashboard'}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-montserrat transition-all border-l-2 pl-[10px] ${
          isActive
            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-transparent dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`text-lg shrink-0 ${isActive ? 'text-violet-500 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500'}`} />
          <span className="flex-1">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function Sidebar({ open, onClose, collapsed }) {
  const navigate  = useNavigate()
  const session   = JSON.parse(sessionStorage.getItem('teacherSession') || '{}')

  const handleLogout = () => {
    sessionStorage.removeItem('teacherSession')
    toast.success('Logged out')
    setTimeout(() => navigate('/staff-login?portal=teacher'), 400)
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />}
      <aside className={`
        fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-200 dark:bg-navy-800 dark:border-white/10
        flex flex-col z-30 transition-all duration-300 overflow-hidden
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        ${collapsed ? 'lg:w-0' : 'lg:w-60'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: VIOLET }}>
            <FaChalkboardTeacher className="text-white text-lg" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight font-playfair">{sc.shortName}</p>
            <p className="text-[10px] uppercase tracking-wider font-montserrat text-violet-500 dark:text-violet-400">Teacher Portal</p>
          </div>
        </div>

        {/* Teacher name */}
        {session.name && (
          <div className="px-5 py-3 border-b border-gray-100 dark:border-white/5 shrink-0">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-montserrat">Signed in as</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white font-montserrat truncate">{session.name}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {NAV.map(({ to, icon, label }) => (
            <SidebarLink key={to} to={to} icon={icon} label={label} onClose={onClose} />
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 border-t border-gray-200 dark:border-white/10 pt-3 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-montserrat text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all w-full border-l-2 border-transparent pl-[10px]"
          >
            <MdLogout className="text-lg text-gray-400 dark:text-gray-500 shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const session = JSON.parse(sessionStorage.getItem('teacherSession') || '{}')
  if (!session.uid) return <Navigate to="/staff-login?portal=teacher" replace />

  const handleSidebarToggle = () => {
    if (window.innerWidth >= 1024) {
      setCollapsed(c => !c)
    } else {
      setSidebarOpen(o => !o)
    }
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-navy overflow-hidden font-sans">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-4 py-4 border-b border-gray-200 bg-white dark:border-white/10 dark:bg-navy-800 shrink-0">
          <button
            onClick={handleSidebarToggle}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
            title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {collapsed ? <MdMenu className="text-2xl" /> : <MdMenuOpen className="text-2xl" />}
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: VIOLET }} />
            <span className="text-sm font-semibold text-gray-900 dark:text-white font-montserrat">Teacher Portal</span>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className={collapsed ? 'max-w-7xl mx-auto [&>*]:mx-auto' : ''}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
