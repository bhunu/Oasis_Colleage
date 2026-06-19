import { useLocation } from 'react-router-dom'
import { MdNotifications as IconBell, MdMenu, MdMenuOpen } from 'react-icons/md'
import ThemeToggle from './ThemeToggle'
import { useLicense } from '../license/LicenseContext'

const PLAN_BADGE = {
  'basic':      { label: 'Basic',      cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  'premium-s':  { label: 'Premium S',  cls: 'bg-gold/15 text-gold border-gold/30' },
  'premium-m':  { label: 'Premium M',  cls: 'bg-gold/15 text-gold border-gold/30' },
  'premium-l':  { label: 'Premium L',  cls: 'bg-gold/15 text-gold border-gold/30' },
  'premium-xl': { label: 'Premium XL', cls: 'bg-gold/15 text-gold border-gold/30' },
  'developer':  { label: 'Dev',        cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
}

const pageInfo = {
  '/dashboard':     { title: 'Dashboard',              subtitle: 'Overview' },
  '/enrol':         { title: 'Enrol Student',          subtitle: 'Add new student' },
  '/students':      { title: 'Student Records',        subtitle: 'View all students' },
  '/classes':       { title: 'Classes',               subtitle: 'Manage school classes' },
  '/exams':         { title: 'End of Term Exams',      subtitle: 'Exam schedules' },
  '/reports':             { title: 'Academic Reports',          subtitle: 'Performance analysis' },
  '/class-performance':   { title: 'Class Performance & Rankings', subtitle: 'Rankings, subject analysis and academic overview' },
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

export default function Topbar({ onToggle, collapsed }) {
  const location = useLocation()
  const info     = pageInfo[location.pathname] ?? { title: 'Dashboard', subtitle: '' }
  const session  = getSession()
  const { licenseData, status } = useLicense()
  const plan  = licenseData?.plan
  const badge = plan ? PLAN_BADGE[plan] : null
  const maxStudents = licenseData?.maxStudents ?? null

  const initials = session.name
    ? session.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SA'

  const todayLabel = () => {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const d = new Date()
    return `${days[d.getDay()]}, ${d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · Term 2`
  }

  return (
    <div className="h-16 bg-white border-b border-gray-200 dark:bg-navy-800 dark:border-white/10 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition"
          title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {collapsed ? <MdMenu className="text-xl" /> : <MdMenuOpen className="text-xl" />}
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white font-playfair leading-tight">{info.title}</h1>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-montserrat">{todayLabel()}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition">
          <IconBell size={20} className="text-gray-500 dark:text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gold rounded-full" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold rounded-full flex items-center justify-center shrink-0">
            <span className="text-navy font-bold text-sm font-montserrat">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white font-montserrat leading-tight">{session.name || 'Admin'}</p>
              {badge && status === 'valid' && (
                <span className={`text-[9px] font-bold font-montserrat px-1.5 py-0.5 rounded-full border leading-none ${badge.cls}`}>
                  {badge.label}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gold/80 dark:text-gold/70 font-montserrat leading-tight">
              {session.role || 'Student Admin'}
              {maxStudents != null && (
                <span className="text-gray-500 dark:text-gray-600"> · max {maxStudents.toLocaleString()} students</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
