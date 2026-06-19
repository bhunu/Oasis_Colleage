import { MdLightMode, MdDarkMode } from 'react-icons/md'
import { useTheme } from '../context/ThemeContext'

/**
 * @param {'default'|'ghost'|'pill'} variant
 * @param {string} className  extra classes
 */
export default function ThemeToggle({ variant = 'default', className = '' }) {
  const { dark, toggle } = useTheme()

  if (variant === 'pill') {
    return (
      <button
        onClick={toggle}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium font-montserrat transition-all
          bg-white/10 hover:bg-white/20 text-white dark:bg-white/10 dark:hover:bg-white/20
          ${className}`}
      >
        {dark
          ? <><MdLightMode size={14} /> Light</>
          : <><MdDarkMode  size={14} /> Dark</>
        }
      </button>
    )
  }

  if (variant === 'ghost') {
    return (
      <button
        onClick={toggle}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`p-2 rounded-lg transition-all
          text-gray-500 hover:text-gray-900 hover:bg-gray-100
          dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10
          ${className}`}
      >
        {dark ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
      </button>
    )
  }

  // default — icon button with subtle bg, works on both dark portals and light portals
  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`p-2 rounded-lg transition-all
        text-gray-600 hover:text-gray-900 hover:bg-gray-200
        dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10
        ${className}`}
    >
      {dark ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
    </button>
  )
}

/** Floating fixed button — for public pages with no topbar */
export function FloatingThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all
        bg-white text-gray-700 hover:bg-gray-100
        dark:bg-navy-800 dark:text-gold dark:hover:bg-navy-light
        border border-gray-200 dark:border-white/10"
    >
      {dark ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
    </button>
  )
}
