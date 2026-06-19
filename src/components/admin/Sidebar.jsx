import { NavLink, useNavigate } from 'react-router-dom'
import {
  MdDashboard, MdArticle, MdEvent, MdPeople, MdPhotoLibrary,
  MdLogout, MdManageAccounts, MdKey, MdTune, MdSecurity, MdReceiptLong,
  MdDeleteForever, MdWebAsset, MdAdminPanelSettings, MdPalette,
} from 'react-icons/md'
import { FaGraduationCap, FaChalkboardTeacher, FaLock } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { getUsers } from '../../firebase/users'
import { useLicense } from '../../license/LicenseContext'
import sc from '../../utils/schoolConfig'
import toast from 'react-hot-toast'

// requires: array of feature keys — item shows if ANY one is present (empty = always show)
const MAIN_NAV = [
  { to: '/admin',                 icon: MdDashboard,      label: 'Dashboard',        requires: [] },
  { to: '/admin/website-content', icon: MdWebAsset,       label: 'Website Content',  requires: ['website-content'] },
  { to: '/admin/theme',           icon: MdPalette,        label: 'Theme Colours',    requires: ['website-content'] },
  { to: '/admin/news',            icon: MdArticle,        label: 'News',             requires: [] },
  { to: '/admin/events',          icon: MdEvent,          label: 'Events',           requires: [] },
  { to: '/admin/staff',           icon: MdPeople,         label: 'Staff',            requires: [] },
  { to: '/admin/gallery',         icon: MdPhotoLibrary,   label: 'Gallery',          requires: [] },
  { to: '/admin/users',           icon: MdManageAccounts, label: 'User Management',  requires: ['student-records', 'student-portal', 'teacher-portal', 'bursar'] },
]

function SidebarLink({ to, icon: Icon, label, badgeCount, onClose }) {
  return (
    <NavLink
      to={to}
      end={to === '/admin'}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-montserrat transition-all ${
          isActive
            ? 'bg-gold/10 text-gold border-l-2 border-gold pl-[10px]'
            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent pl-[10px]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`text-lg shrink-0 ${isActive ? 'text-gold' : 'text-gray-500'}`} />
          <span className="flex-1">{label}</span>
          {badgeCount > 0 && (
            <span className="ml-auto bg-amber-500 text-white text-[9px] font-bold font-montserrat px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
              {badgeCount}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function LockedSidebarLink({ icon: Icon, label }) {
  return (
    <div className="relative group cursor-not-allowed select-none">
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border-l-2 border-transparent pl-[10px] opacity-40 group-hover:opacity-0 transition-opacity">
        <Icon className="text-lg shrink-0 text-gray-500" />
        <span className="flex-1 text-sm font-medium font-montserrat text-gray-500">{label}</span>
        <FaLock className="text-[9px] text-gray-500 shrink-0" />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 rounded-lg border border-gold/20 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[11px] font-semibold font-montserrat text-gold text-center leading-tight">
          Upgrade to Premium to unlock
        </span>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600 font-montserrat px-3 pt-5 pb-1">
      {children}
    </p>
  )
}

export default function AdminSidebar({ open, onClose, collapsed }) {
  const navigate = useNavigate()
  const [pendingCount,   setPendingCount]   = useState(0)
  const [activeOtpCount, setActiveOtpCount] = useState(0)

  const { hasFeature } = useLicense()

  const show   = (requires) => !requires?.length || requires.some(f => hasFeature(f))
  const locked = (requires) => requires?.length > 0 && !requires.some(f => hasFeature(f))

  const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL
  const session = (() => {
    try { return JSON.parse(sessionStorage.getItem('adminSession') || '{}') } catch { return {} }
  })()
  const isSuperAdmin = superAdminEmail && session.email?.toLowerCase() === superAdminEmail.toLowerCase()

  useEffect(() => {
    getUsers()
      .then(users => setPendingCount(users.filter(u => !u.active && u.role !== 'student').length))
      .catch(() => {})

    const now = new Date()
    getDocs(query(collection(db, 'users'), where('role', '==', 'student'), where('otpUsed', '==', false)))
      .then(snap => {
        const count = snap.docs.filter(d => {
          const exp = d.data().otpExpiresAt
          const expDate = exp?.toDate ? exp.toDate() : exp ? new Date(exp) : null
          return expDate && expDate > now
        }).length
        setActiveOtpCount(count)
      })
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('adminSession')
    toast.success('Logged out')
    setTimeout(() => navigate('/'), 400)
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />}
      <aside className={`
        fixed top-0 left-0 h-full w-60 bg-navy-800 border-r border-white/10
        flex flex-col z-30 transition-all duration-300 overflow-hidden
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        ${collapsed ? 'lg:w-0' : 'lg:w-60'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 bg-gold rounded-lg flex items-center justify-center shrink-0">
            <FaGraduationCap className="text-navy text-lg" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight font-playfair">{sc.shortName}</p>
            <p className="text-[10px] text-gold/70 uppercase tracking-wider font-montserrat">Web Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {MAIN_NAV.map(({ to, icon, label, requires }) =>
            show(requires)
              ? <SidebarLink key={to} to={to} icon={icon} label={label} badgeCount={label === 'User Management' ? pendingCount : 0} onClose={onClose} />
              : locked(requires)
                ? <LockedSidebarLink key={to} icon={icon} label={label} />
                : null
          )}

          <SectionLabel>Teaching</SectionLabel>
          {show(['teacher-portal'])
            ? <SidebarLink to="/admin/teacher-accounts" icon={FaChalkboardTeacher} label="Teacher Accounts" onClose={onClose} />
            : <LockedSidebarLink icon={FaChalkboardTeacher} label="Teacher Accounts" />
          }

          <SectionLabel>Student Access</SectionLabel>
          {show(['student-portal'])
            ? <SidebarLink to="/admin/student-otp" icon={MdKey} label="Student OTP Manager" badgeCount={activeOtpCount} onClose={onClose} />
            : <LockedSidebarLink icon={MdKey} label="Student OTP Manager" />
          }

          <SectionLabel>Portal Settings</SectionLabel>
          {show(['student-records', 'student-portal'])
            ? <SidebarLink to="/admin/portal-settings" icon={MdTune} label="Portal Settings" onClose={onClose} />
            : <LockedSidebarLink icon={MdTune} label="Portal Settings" />
          }

          <SectionLabel>System</SectionLabel>
          {show(['student-records', 'student-portal', 'teacher-portal', 'bursar'])
            ? <SidebarLink to="/admin/security-logs" icon={MdSecurity} label="Security Logs" onClose={onClose} />
            : <LockedSidebarLink icon={MdSecurity} label="Security Logs" />
          }
          {show(['bursar'])
            ? <SidebarLink to="/admin/financial-logs" icon={MdReceiptLong} label="Financial Logs" onClose={onClose} />
            : <LockedSidebarLink icon={MdReceiptLong} label="Financial Logs" />
          }
          <SidebarLink to="/admin/license" icon={MdKey} label="License" onClose={onClose} />

          {isSuperAdmin && (
            <>
              <SectionLabel>Danger Zone</SectionLabel>
              <NavLink
                to="/admin/database-reset"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-montserrat transition-all border-l-2 pl-[10px] ${
                    isActive
                      ? 'bg-red-900/30 text-red-400 border-red-600'
                      : 'text-red-600/70 hover:bg-red-900/20 hover:text-red-400 border-transparent'
                  }`
                }
              >
                <MdDeleteForever className="text-lg shrink-0" />
                <span className="flex-1">Database Reset</span>
              </NavLink>
            </>
          )}

          {isSuperAdmin && (
            <>
              <SectionLabel>Developer</SectionLabel>
              <NavLink
                to="/admin/super-admin"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-montserrat transition-all border-l-2 pl-[10px] ${
                    isActive
                      ? 'bg-gold/10 text-gold border-gold'
                      : 'text-gold/60 hover:bg-gold/10 hover:text-gold border-transparent'
                  }`
                }
              >
                <MdAdminPanelSettings className="text-lg shrink-0" />
                <span className="flex-1">Super Admin</span>
                <span className="ml-auto bg-gold text-navy text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">DEV</span>
              </NavLink>
            </>
          )}
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
