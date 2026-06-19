import { MdMenu, MdMenuOpen, MdNotificationsNone } from 'react-icons/md'
import { FaGraduationCap } from 'react-icons/fa'
import ThemeToggle from '../ThemeToggle'
import { useLicense } from '../../license/LicenseContext'

const PLAN_BADGE = {
  'basic':      { label: 'Basic',      cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  'premium-s':  { label: 'Premium S',  cls: 'bg-gold/15 text-gold border-gold/30' },
  'premium-m':  { label: 'Premium M',  cls: 'bg-gold/15 text-gold border-gold/30' },
  'premium-l':  { label: 'Premium L',  cls: 'bg-gold/15 text-gold border-gold/30' },
  'premium-xl': { label: 'Premium XL', cls: 'bg-gold/15 text-gold border-gold/30' },
  'developer':  { label: 'Dev',        cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
}

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('adminSession') || '{}') } catch { return {} }
}

export default function AdminTopBar({ onMenuClick, title, collapsed }) {
  const user = getSession()
  const { licenseData, status } = useLicense()
  const plan = licenseData?.plan
  const badge = plan ? PLAN_BADGE[plan] : null

  return (
    <header className="h-16 bg-white border-b border-gray-200 dark:bg-navy-800 dark:border-white/10 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-gray-400 hover:bg-white/5 transition"
          title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {collapsed ? <MdMenu className="text-xl" /> : <MdMenuOpen className="text-xl" />}
        </button>
        <h1 className="text-base font-bold text-gray-900 dark:text-white font-playfair">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition">
          <MdNotificationsNone className="text-xl" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center shrink-0">
            <FaGraduationCap className="text-navy text-sm" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-white leading-tight font-montserrat">{user.name || 'Administrator'}</p>
              {badge && status === 'valid' && (
                <span className={`text-[9px] font-bold font-montserrat px-1.5 py-0.5 rounded-full border leading-none ${badge.cls}`}>
                  {badge.label}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gold/70 capitalize font-montserrat">{user.role || 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
