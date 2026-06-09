import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useStudent } from '../../context/StudentContext'
import useStudentSessionTimeout from '../../hooks/useStudentSessionTimeout'
import useStudentSessionGuard, { endStudentSession } from '../../hooks/useStudentSessionGuard'
import {
  MdDashboard, MdBarChart, MdReceipt, MdCloudUpload,
  MdPerson, MdLogout, MdMenu, MdClose, MdNotifications,
  MdSchool, MdExitToApp, MdSwapHoriz, MdVerifiedUser,
} from 'react-icons/md'
import toast from 'react-hot-toast'

const GOLD = '#C9A84C'

const GATED_EXIT_TYPES = ['OLevelCompletion', 'ALevelCompletion', 'Transfer']

const BASE_NAV = [
  { to: '/student/dashboard',             icon: MdDashboard,   label: 'Dashboard'      },
  { to: '/student/results',               icon: MdBarChart,    label: 'My Results'     },
  { to: '/student/fees',                  icon: MdReceipt,     label: 'My Fees'        },
  { to: '/student/upload-pop',            icon: MdCloudUpload, label: 'Upload Payment' },
  { to: '/student/exeat/my-applications', icon: MdExitToApp,   label: 'Exit Pass',     boarderOnly: true },
  { to: '/student/profile',               icon: MdPerson,      label: 'My Profile'     },
]

export default function StudentLayout({ children }) {
  useStudentSessionTimeout()
  const navigate  = useNavigate()
  const { studentData, logout, isBoarder, firestoreStudent } = useStudent()
  const [open, setOpen] = useState(false)

  const exitType    = firestoreStudent?.exitType
  const status      = firestoreStudent?.status
  const isGated     = GATED_EXIT_TYPES.includes(exitType)
  const isActive    = !status || status === 'Active'
  const cancelEnabled = firestoreStudent?.cancelTransferEnabled === true

  const NAV = [
    ...BASE_NAV,
    ...(isActive ? [{ to: '/student/transfer', icon: MdSwapHoriz, label: 'Transfer Request' }] : []),
    ...(isGated  ? [{ to: '/student/clearance/apply',  icon: MdVerifiedUser, label: 'Apply Clearance' }] : []),
    ...(isGated  ? [{ to: '/student/clearance/status', icon: MdVerifiedUser, label: 'My Clearance' }] : []),
  ]

  // Concurrent session guard — signs out if another device kills this session
  useStudentSessionGuard(studentData?.uid ?? null)

  const initials = studentData?.name
    ? studentData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST'

  const handleLogout = async () => {
    await endStudentSession(studentData?.uid)
    logout()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-[#0A1628] overflow-hidden font-sans">

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-[210px] bg-[#0D1C35] border-r border-white/10
        flex flex-col z-30 transition-transform duration-300 overflow-y-auto
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 bg-[#C9A84C] rounded-lg flex items-center justify-center shrink-0">
            <MdSchool className="text-[#0A1628] text-lg" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight font-playfair">Oasis College</p>
            <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-wider font-montserrat">Student Portal</p>
          </div>
        </div>

        {/* Student info */}
        <div className="px-5 py-4 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 bg-[#C9A84C] rounded-full flex items-center justify-center mb-2">
            <span className="text-[#0A1628] font-bold text-sm font-montserrat">{initials}</span>
          </div>
          <p className="text-sm font-semibold text-white font-montserrat leading-tight truncate">{studentData?.name || 'Student'}</p>
          <p className="text-[10px] text-gray-500 font-montserrat">{studentData?.class || '—'} · {studentData?.regNumber || '—'}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          {NAV.filter(item => !item.boarderOnly || isBoarder).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/student/dashboard'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-montserrat transition-all border-l-2 pl-[10px] mb-0.5 ${
                  isActive
                    ? 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]'
                    : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`text-lg shrink-0 ${isActive ? 'text-[#C9A84C]' : 'text-gray-500'}`} />
                  <span className="text-xs">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 pt-3 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-montserrat text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all w-full border-l-2 border-transparent pl-[10px]"
          >
            <MdLogout className="text-lg text-gray-500 shrink-0" />
            <span className="text-xs">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-[210px] min-w-0 overflow-hidden">

        {/* Topbar */}
        <div className="h-16 bg-[#0D1C35] border-b border-white/10 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-white/5">
              <MdMenu className="text-xl" />
            </button>
            <div>
              <p className="text-[11px] text-gray-500 font-montserrat">
                {studentData?.class || ''} · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition">
              <MdNotifications size={20} className="text-gray-400" />
            </button>
            <div className="w-9 h-9 bg-[#C9A84C] rounded-full flex items-center justify-center shrink-0">
              <span className="text-[#0A1628] font-bold text-sm font-montserrat">{initials}</span>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
