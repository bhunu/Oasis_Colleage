import { NavLink, useNavigate } from 'react-router-dom'
import { MdDashboard, MdArticle, MdEvent, MdPeople, MdPhotoLibrary, MdLogout, MdSchool } from 'react-icons/md'
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
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />}
      <aside className={`
        fixed top-0 left-0 h-full w-60 bg-white border-r border-slate-200
        flex flex-col z-30 transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-9 h-9 bg-[#185FA5] rounded-lg flex items-center justify-center">
            <MdSchool className="text-white text-xl" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">Oasis College</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Web Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-blue-50 text-[#185FA5]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`text-lg ${isActive ? 'text-[#185FA5]' : 'text-slate-400'}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-5 border-t border-slate-100 pt-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all w-full"
          >
            <MdLogout className="text-lg text-slate-400" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
