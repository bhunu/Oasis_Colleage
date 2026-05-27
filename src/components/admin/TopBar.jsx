import { MdMenu, MdNotificationsNone } from 'react-icons/md'
import { FaGraduationCap } from 'react-icons/fa'

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('adminSession') || '{}') } catch { return {} }
}

export default function AdminTopBar({ onMenuClick, title }) {
  const user = getSession()
  return (
    <header className="h-16 bg-[#0D1C35] border-b border-white/10 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-white/5 transition"
        >
          <MdMenu className="text-xl" />
        </button>
        <h1 className="text-base font-bold text-white font-playfair">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-gray-400 hover:bg-white/5 transition">
          <MdNotificationsNone className="text-xl" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 bg-[#C9A84C] rounded-full flex items-center justify-center shrink-0">
            <FaGraduationCap className="text-[#0A1628] text-sm" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-white leading-tight font-montserrat">{user.name || 'Administrator'}</p>
            <p className="text-[10px] text-[#C9A84C]/70 capitalize font-montserrat">{user.role || 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
