import { NavLink, useNavigate } from 'react-router-dom'
import { MdDashboard, MdArticle, MdEvent, MdPeople, MdPhotoLibrary, MdLogout } from 'react-icons/md'
import { FaGraduationCap } from 'react-icons/fa'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/admin',         icon: MdDashboard,    label: 'Dashboard' },
  { to: '/admin/news',    icon: MdArticle,      label: 'News' },
  { to: '/admin/events',  icon: MdEvent,        label: 'Events' },
  { to: '/admin/staff',   icon: MdPeople,       label: 'Staff' },
  { to: '/admin/gallery', icon: MdPhotoLibrary, label: 'Gallery' },
]

export default function AdminSidebar({ open, onClose }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    sessionStorage.removeItem('adminSession')
    toast.success('Logged out')
    setTimeout(() => navigate('/login?portal=web-admin'), 400)
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
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-[#C9A84C] rounded-lg flex items-center justify-center shrink-0">
            <FaGraduationCap className="text-[#0A1628] text-lg" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight font-playfair">Oasis College</p>
            <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-wider font-montserrat">Web Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
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
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 border-t border-white/10 pt-3">
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
