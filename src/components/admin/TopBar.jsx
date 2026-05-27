import { MdMenu, MdNotificationsNone, MdPerson } from 'react-icons/md'

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('adminSession') || '{}') } catch { return {} }
}

export default function AdminTopBar({ onMenuClick, title }) {
  const user = getSession()
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition">
          <MdMenu className="text-xl" />
        </button>
        <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition">
          <MdNotificationsNone className="text-xl" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 bg-[#185FA5] rounded-full flex items-center justify-center">
            <MdPerson className="text-white text-sm" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-slate-800 leading-tight">{user.name || 'Administrator'}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user.role || 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
