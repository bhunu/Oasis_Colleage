import { useLocation } from 'react-router-dom'
import { MdNotifications, MdMenu, MdMenuOpen } from 'react-icons/md'
import ThemeToggle from '../ThemeToggle'

const PAGE_INFO = {
  '/bursar/dashboard':        { title: 'Dashboard',             subtitle: 'Financial overview' },
  '/bursar/receive-payment':  { title: 'Receive Payment',       subtitle: 'Record incoming fees' },
  '/bursar/issue-receipt':    { title: 'Issue Receipt',         subtitle: 'Print & share receipts' },
  '/bursar/student-accounts': { title: 'Student Accounts',      subtitle: 'Fee account ledger' },
  '/bursar/arrears':          { title: 'Arrears',               subtitle: 'Outstanding balances' },
  '/bursar/budget':           { title: 'Budget Overview',       subtitle: 'Income & expenditure' },
  '/bursar/record-expense':   { title: 'Record Expense',        subtitle: 'Log school expenses' },
  '/bursar/expense-categories':{ title: 'Expense Categories',  subtitle: 'Manage categories' },
  '/bursar/income-statement': { title: 'Income Statement',      subtitle: 'Revenue & expenses' },
  '/bursar/balance-sheet':    { title: 'Balance Sheet',         subtitle: 'Assets & liabilities' },
  '/bursar/collection-report':{ title: 'Fee Collection Report', subtitle: 'Collection analysis' },
  '/bursar/print-reports':    { title: 'Print Reports',         subtitle: 'Export & print' },
  '/bursar/settings':         { title: 'Settings',              subtitle: 'System configuration' },
}

function getBursarSession() {
  try { return JSON.parse(sessionStorage.getItem('bursarSession') || '{}') } catch { return {} }
}

function termLabel() {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const d = new Date()
  return `${days[d.getDay()]}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · Term 2`
}

export default function BursarTopbar({ onMenuClick, collapsed }) {
  const location = useLocation()
  const info     = PAGE_INFO[location.pathname] ?? { title: 'Bursar Portal', subtitle: '' }
  const session  = getBursarSession()

  const initials = session.name
    ? session.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SB'

  return (
    <div className="h-16 bg-white border-b border-gray-200 dark:bg-navy-800 dark:border-white/10 flex items-center justify-between px-6 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition"
          title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {collapsed ? <MdMenu className="text-xl" /> : <MdMenuOpen className="text-xl" />}
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white font-playfair leading-tight">{info.title}</h1>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-montserrat">{termLabel()}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition">
          <MdNotifications size={20} className="text-gray-500 dark:text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#0F6E56' }}
          >
            <span className="text-white font-bold text-sm font-montserrat">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-white font-montserrat leading-tight">
              {session.name || 'School Bursar'}
            </p>
            <p className="text-[11px] font-montserrat" style={{ color: '#0F6E56' }}>Bursar</p>
          </div>
        </div>
      </div>
    </div>
  )
}
