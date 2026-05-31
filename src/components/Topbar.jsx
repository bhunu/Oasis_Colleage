import { useLocation } from 'react-router-dom'
import { MdNotifications as IconBell } from 'react-icons/md'

const pageInfo = {
  '/dashboard':     { title: 'Dashboard',              subtitle: 'Overview' },
  '/enrol':         { title: 'Enrol Student',          subtitle: 'Add new student' },
  '/students':      { title: 'Student Records',        subtitle: 'View all students' },
  '/exams':         { title: 'End of Term Exams',      subtitle: 'Exam schedules' },
  '/reports':       { title: 'Academic Reports',       subtitle: 'Performance analysis' },
  '/fees':          { title: 'Fees Accounts',          subtitle: 'Student fee tracking' },
  '/arrears':       { title: 'Fees Arrears',           subtitle: 'Outstanding balances' },
  '/payments':      { title: 'Payments',               subtitle: 'Payment tracking' },
  '/end-of-term':   { title: 'End of Term Procedure',  subtitle: 'Term closing process' },
  '/student-portal':{ title: 'Student Portal',         subtitle: 'Student account view' },
  '/settings':      { title: 'Settings',               subtitle: 'System configuration' },
  '/otp-manager':   { title: 'Student OTP Manager',   subtitle: 'Portal access & settings' },
}

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('studentsAdminSession') || '{}') } catch { return {} }
}

export default function Topbar() {
  const location = useLocation()
  const info     = pageInfo[location.pathname] ?? { title: 'Dashboard', subtitle: '' }
  const session  = getSession()

  const initials = session.name
    ? session.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SA'

  const todayLabel = () => {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const d = new Date()
    return `${days[d.getDay()]}, ${d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · Term 2`
  }

  return (
    <div className="h-16 bg-[#0D1C35] border-b border-white/10 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-xl font-bold text-white font-playfair leading-tight">{info.title}</h1>
        <p className="text-[11px] text-gray-500 font-montserrat">{todayLabel()}</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-white/10 rounded-lg transition">
          <IconBell size={20} className="text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#C9A84C] rounded-full" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#C9A84C] rounded-full flex items-center justify-center shrink-0">
            <span className="text-[#0A1628] font-bold text-sm font-montserrat">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white font-montserrat leading-tight">{session.name || 'Admin'}</p>
            <p className="text-[11px] text-[#C9A84C]/70 font-montserrat">{session.role || 'Student Admin'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
