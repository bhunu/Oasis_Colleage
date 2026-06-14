import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  MdDashboard, MdCalendarToday, MdFactCheck, MdCampaign,
  MdBarChart, MdLogout, MdMenu, MdClose,
} from 'react-icons/md'
import { FaChalkboardTeacher } from 'react-icons/fa'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/teacher/dashboard',    icon: MdDashboard,     label: 'Dashboard'     },
  { to: '/teacher/timetable',    icon: MdCalendarToday, label: 'Timetable'     },
  { to: '/teacher/attendance',   icon: MdFactCheck,     label: 'Attendance'    },
  { to: '/teacher/announcements',icon: MdCampaign,      label: 'Announcements' },
  { to: '/teacher/performance',  icon: MdBarChart,      label: 'Performance'   },
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
            ? 'bg-violet-500/10 text-violet-300 border-violet-500'
            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`text-lg shrink-0 ${isActive ? 'text-violet-400' : 'text-gray-500'}`} />
          <span className="flex-1">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function Sidebar({ open, onClose }) {
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
        fixed top-0 left-0 h-full w-60 bg-[#0D1C35] border-r border-white/10
        flex flex-col z-30 transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: VIOLET }}>
            <FaChalkboardTeacher className="text-white text-lg" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight font-playfair">Oasis College</p>
            <p className="text-[10px] uppercase tracking-wider font-montserrat" style={{ color: '#a78bfa' }}>Teacher Portal</p>
          </div>
        </div>

        {/* Teacher name */}
        {session.name && (
          <div className="px-5 py-3 border-b border-white/5 shrink-0">
            <p className="text-xs text-gray-500 font-montserrat">Signed in as</p>
            <p className="text-sm font-semibold text-white font-montserrat truncate">{session.name}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {NAV.map(({ to, icon, label }) => (
            <SidebarLink key={to} to={to} icon={icon} label={label} onClose={onClose} />
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 border-t border-white/10 pt-3 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-montserrat text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all w-full border-l-2 border-transparent pl-[10px]"
          >
            <MdLogout className="text-lg text-gray-500 shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#0A1628] overflow-hidden font-sans">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-[#0D1C35] shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white transition">
            <MdMenu className="text-2xl" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: VIOLET }} />
            <span className="text-sm font-semibold text-white font-montserrat">Teacher Portal</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
