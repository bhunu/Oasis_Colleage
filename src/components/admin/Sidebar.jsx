import { NavLink, useNavigate } from 'react-router-dom'
import {
  MdDashboard, MdArticle, MdEvent, MdPeople, MdPhotoLibrary,
  MdLogout, MdManageAccounts, MdKey, MdTune, MdSecurity, MdReceiptLong,
  MdCalendarToday,
} from 'react-icons/md'
import { FaGraduationCap, FaChalkboardTeacher } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { getUsers } from '../../firebase/users'
import toast from 'react-hot-toast'

const MAIN_NAV = [
  { to: '/admin',         icon: MdDashboard,      label: 'Dashboard' },
  { to: '/admin/news',    icon: MdArticle,        label: 'News' },
  { to: '/admin/events',  icon: MdEvent,          label: 'Events' },
  { to: '/admin/staff',   icon: MdPeople,         label: 'Staff' },
  { to: '/admin/gallery', icon: MdPhotoLibrary,   label: 'Gallery' },
  { to: '/admin/users',             icon: MdManageAccounts, label: 'User Management' },
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
            ? 'bg-[#C9A84C]/10 text-[#C9A84C] border-l-2 border-[#C9A84C] pl-[10px]'
            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent pl-[10px]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`text-lg shrink-0 ${isActive ? 'text-[#C9A84C]' : 'text-gray-500'}`} />
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

function SectionLabel({ children }) {
  return (
    <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600 font-montserrat px-3 pt-5 pb-1">
      {children}
    </p>
  )
}

export default function AdminSidebar({ open, onClose }) {
  const navigate = useNavigate()
  const [pendingCount,   setPendingCount]   = useState(0)
  const [activeOtpCount, setActiveOtpCount] = useState(0)

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
        fixed top-0 left-0 h-full w-60 bg-[#0D1C35] border-r border-white/10
        flex flex-col z-30 transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 bg-[#C9A84C] rounded-lg flex items-center justify-center shrink-0">
            <FaGraduationCap className="text-[#0A1628] text-lg" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight font-playfair">Oasis College</p>
            <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-wider font-montserrat">Web Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {MAIN_NAV.map(({ to, icon, label }) => (
            <SidebarLink
              key={to}
              to={to}
              icon={icon}
              label={label}
              badgeCount={label === 'User Management' ? pendingCount : 0}
              onClose={onClose}
            />
          ))}

          <SectionLabel>Teaching</SectionLabel>
          <SidebarLink
            to="/admin/teacher-accounts"
            icon={FaChalkboardTeacher}
            label="Teacher Accounts"
            onClose={onClose}
          />
          <SidebarLink
            to="/admin/timetable"
            icon={MdCalendarToday}
            label="Timetables"
            onClose={onClose}
          />

          <SectionLabel>Student Access</SectionLabel>
          <SidebarLink
            to="/admin/student-otp"
            icon={MdKey}
            label="Student OTP Manager"
            badgeCount={activeOtpCount}
            onClose={onClose}
          />

          <SectionLabel>Portal Settings</SectionLabel>
          <SidebarLink
            to="/admin/portal-settings"
            icon={MdTune}
            label="Portal Settings"
            onClose={onClose}
          />

          <SectionLabel>System</SectionLabel>
          <SidebarLink
            to="/admin/security-logs"
            icon={MdSecurity}
            label="Security Logs"
            onClose={onClose}
          />
          <SidebarLink
            to="/admin/financial-logs"
            icon={MdReceiptLong}
            label="Financial Logs"
            onClose={onClose}
          />
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
