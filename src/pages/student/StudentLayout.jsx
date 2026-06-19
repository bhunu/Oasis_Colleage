import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import useStudentSessionTimeout from '../../hooks/useStudentSessionTimeout'
import useStudentSessionGuard from '../../hooks/useStudentSessionGuard'
import {
  MdDashboard, MdBarChart, MdReceipt, MdCloudUpload,
  MdPerson, MdLogout, MdMenu, MdMenuOpen, MdClose, MdNotifications,
  MdSchool, MdExitToApp, MdSwapHoriz, MdVerifiedUser, MdCalendarToday, MdMenuBook,
} from 'react-icons/md'
import toast from 'react-hot-toast'
import ThemeToggle from '../../components/ThemeToggle'
import sc from '../../utils/schoolConfig'

const GOLD = 'var(--color-primary-hex)'

const GATED_EXIT_TYPES = ['OLevelCompletion', 'ALevelCompletion', 'Transfer']

const BASE_NAV = [
  { to: '/student/dashboard',             icon: MdDashboard,      label: 'Dashboard'       },
  { to: '/student/results',               icon: MdBarChart,       label: 'My Results'      },
  { to: '/student/fees',                  icon: MdReceipt,        label: 'My Fees'         },
  { to: '/student/timetable',             icon: MdCalendarToday,  label: 'Timetable'       },
  { to: '/student/materials',             icon: MdMenuBook,       label: 'Study Materials' },
  { to: '/student/upload-pop',            icon: MdCloudUpload,    label: 'Upload Payment'  },
  { to: '/student/notifications',         icon: MdNotifications,  label: 'Notifications', notifBadge: true },
  { to: '/student/exeat/my-applications', icon: MdExitToApp,      label: 'Exit Pass',      boarderOnly: true },
  { to: '/student/profile',               icon: MdPerson,         label: 'My Profile'      },
]

export default function StudentLayout({ children }) {
  useStudentSessionTimeout()
  const navigate  = useNavigate()
  const { studentData, logout, isBoarder, firestoreStudent } = useStudent()
  useStudentSessionGuard(studentData?.uid)
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!studentData?.regNumber) return
    const unsub = onSnapshot(
      query(collection(db, 'notifications'), where('forStudent', '==', studentData.regNumber), where('read', '==', false)),
      snap => setUnreadCount(snap.size),
      () => {}
    )
    return unsub
  }, [studentData?.regNumber])

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

  const initials = studentData?.name
    ? studentData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST'

  const handleLogout = () => {
    logout()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-navy overflow-hidden font-sans">

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-[210px] bg-white border-r border-gray-200 dark:bg-navy-800 dark:border-white/10
        flex flex-col z-30 transition-all duration-300 overflow-hidden
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        ${collapsed ? 'lg:w-0' : 'lg:w-[210px]'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-white/10 shrink-0">
          <div className="w-9 h-9 bg-gold rounded-lg flex items-center justify-center shrink-0">
            <MdSchool className="text-navy text-lg" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight font-playfair">{sc.shortName}</p>
            <p className="text-[10px] text-gold/80 dark:text-gold/70 uppercase tracking-wider font-montserrat">Student Portal</p>
          </div>
        </div>

        {/* Student info */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 shrink-0">
          <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center mb-2">
            <span className="text-navy font-bold text-sm font-montserrat">{initials}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white font-montserrat leading-tight truncate">{studentData?.name || 'Student'}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-500 font-montserrat">{studentData?.class || '—'} · {studentData?.regNumber || '—'}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {NAV.filter(item => !item.boarderOnly || isBoarder).map(({ to, icon: Icon, label, notifBadge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/student/dashboard'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-montserrat transition-all border-l-2 pl-[10px] mb-0.5 ${
                  isActive
                    ? 'bg-gold/10 text-gold border-gold'
                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative shrink-0">
                    <Icon className={`text-lg ${isActive ? 'text-gold' : 'text-gray-400 dark:text-gray-500'}`} />
                    {notifBadge && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold text-navy text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 pt-3 border-t border-gray-200 dark:border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-montserrat text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all w-full border-l-2 border-transparent pl-[10px]"
          >
            <MdLogout className="text-lg text-gray-400 dark:text-gray-500 shrink-0" />
            <span className="text-xs">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${collapsed ? 'lg:ml-0' : 'lg:ml-[210px]'}`}>

        {/* Topbar */}
        <div className="h-16 bg-white border-b border-gray-200 dark:bg-navy-800 dark:border-white/10 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) setCollapsed(c => !c)
                else setOpen(o => !o)
              }}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition"
              title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
            >
              {collapsed ? <MdMenu className="text-xl" /> : <MdMenuOpen className="text-xl" />}
            </button>
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-montserrat">
                {studentData?.class || ''} · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => navigate('/student/notifications')} className="relative p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition">
              <MdNotifications size={20} className="text-gray-500 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-gold text-navy text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="w-9 h-9 bg-gold rounded-full flex items-center justify-center shrink-0">
              <span className="text-navy font-bold text-sm font-montserrat">{initials}</span>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className={collapsed ? 'max-w-7xl mx-auto [&>*]:mx-auto' : ''}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
