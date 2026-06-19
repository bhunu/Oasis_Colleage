import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBars, FaTimes, FaGraduationCap, FaChevronDown, FaSignInAlt, FaLaptopCode, FaClipboardList, FaUserGraduate, FaMoneyCheckAlt, FaShieldAlt, FaLock } from 'react-icons/fa'
import { MdLightMode, MdDarkMode } from 'react-icons/md'
import { useScrollNav } from '../hooks/useScrollNav'
import { useTheme } from '../context/ThemeContext'
import { useLicense } from '../license/LicenseContext'
import sc from '../utils/schoolConfig'

const STAFF_PORTALS = [
  { key: 'web-admin',        label: 'Web Admin',        icon: FaLaptopCode,    desc: 'System administration',    href: '/staff-login?portal=web-admin' },
  { key: 'students-records', label: 'Students Records', icon: FaClipboardList, desc: 'Academic data management', href: '/staff-login?portal=students-records' },
  { key: 'bursar',           label: 'Bursar',           icon: FaMoneyCheckAlt, desc: 'Finance & fee management', href: '/staff-login?portal=bursar' },
]

const STUDENT_PORTAL = { key: 'student-portal', label: 'Student Portal', icon: FaUserGraduate, desc: 'Grades & resources', href: '/login' }

const LOGIN_PORTALS = [...STAFF_PORTALS, STUDENT_PORTAL]

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  {
    label: 'About',
    children: [
      { label: 'About Us',  href: '/about' },
      { label: 'Our Team',  href: '/staff' },
    ],
  },
  {
    label: 'Academics',
    children: [
      { label: 'Academics',   href: '/academics'  },
      { label: 'Admissions',  href: '/admissions' },
      { label: 'Calendar',    href: '/calendar'   },
    ],
  },
  {
    label: 'Campus Life',
    children: [
      { label: 'Campus Life', href: '/campus-life' },
      { label: 'Gallery',     href: '/gallery'     },
      { label: 'News',        href: '/news'        },
    ],
  },
  { label: 'Contact', href: '/contact' },
]

function DesktopDropdown({ item, isActive, scrolled }) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)
  const anyChildActive = item.children?.some(c => isActive(c.href))

  const show = () => { clearTimeout(timerRef.current); setOpen(true) }
  const hide = () => { timerRef.current = setTimeout(() => setOpen(false), 120) }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const linkClass = (active) => {
    const base = 'flex items-center gap-1 font-montserrat text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded transition-all duration-200'
    if (active) return `${base} text-gold bg-gold/10`
    if (scrolled) return `${base} text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5`
    return `${base} text-gray-200 hover:text-white hover:bg-white/10 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5`
  }

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button className={linkClass(anyChildActive)}>
        {item.label}
        <FaChevronDown className={`text-[10px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 min-w-[160px] bg-white border border-gray-200 dark:bg-navy dark:border-white/10 rounded-lg shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50"
          >
            {item.children.map(child => (
              <Link
                key={child.href}
                to={child.href}
                className={`block font-montserrat text-xs font-semibold uppercase tracking-wider px-4 py-2.5 transition-all duration-150 ${
                  isActive(child.href)
                    ? 'text-gold bg-gold/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5'
                }`}
              >
                {child.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MobileAccordion({ item, isActive }) {
  const [open, setOpen] = useState(false)
  const anyChildActive = item.children?.some(c => isActive(c.href))

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between font-montserrat text-sm font-semibold uppercase tracking-wider px-4 py-3 rounded-lg transition-all ${
          anyChildActive
            ? 'bg-gold/15 text-gold'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5'
        }`}
      >
        {item.label}
        <FaChevronDown className={`text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-4 flex flex-col gap-0.5 pb-1">
              {item.children.map(child => (
                <Link
                  key={child.href}
                  to={child.href}
                  className={`font-montserrat text-sm font-medium uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all ${
                    isActive(child.href)
                      ? 'bg-gold/15 text-gold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
                  }`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LoginDropdown({ scrolled }) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)
  const { hasFeature } = useLicense()

  const show = () => { clearTimeout(timerRef.current); setOpen(true) }
  const hide = () => { timerRef.current = setTimeout(() => setOpen(false), 120) }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const btnClass = scrolled
    ? 'flex items-center gap-1.5 border border-gray-300 hover:border-gold/60 text-gray-700 hover:text-gold dark:border-white/20 dark:hover:border-gold/60 dark:text-gray-300 dark:hover:text-gold font-montserrat text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-all duration-300'
    : 'flex items-center gap-1.5 border border-white/20 hover:border-gold/60 text-gray-200 hover:text-gold dark:text-gray-300 dark:hover:text-gold font-montserrat text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-all duration-300'

  return (
    <div className="relative hidden md:block" onMouseEnter={show} onMouseLeave={hide}>
      <button className={btnClass}>
        <FaSignInAlt className="text-xs" />
        Login
        <FaChevronDown className={`text-[10px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-60 bg-white border border-gray-200 dark:bg-navy dark:border-white/10 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden z-50"
          >
            <div className="px-4 pt-3 pb-1">
              <span className="font-montserrat text-[9px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-600">Staff</span>
            </div>
            <Link
              to="/staff-portal"
              className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-gold/20 transition-colors">
                <FaShieldAlt className="text-gold text-xs" />
              </div>
              <div>
                <div className="font-montserrat text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Staff Portal</div>
                <div className="font-montserrat text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Web Admin · Records · Bursar · Teacher</div>
              </div>
            </Link>

            {hasFeature('student-portal') ? (
              <>
                <div className="border-t border-gray-100 dark:border-white/10 mx-4" />
                <div className="px-4 pt-3 pb-1">
                  <span className="font-montserrat text-[9px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-600">Student</span>
                </div>
                {(() => {
                  const Icon = STUDENT_PORTAL.icon
                  return (
                    <Link
                      to={STUDENT_PORTAL.href}
                      className="flex items-start gap-3 px-4 py-3 pb-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-gold/20 transition-colors">
                        <Icon className="text-gold text-xs" />
                      </div>
                      <div>
                        <div className="font-montserrat text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">{STUDENT_PORTAL.label}</div>
                        <div className="font-montserrat text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{STUDENT_PORTAL.desc}</div>
                      </div>
                    </Link>
                  )
                })()}
              </>
            ) : (
              <>
                <div className="border-t border-gray-100 dark:border-white/10 mx-4" />
                <div className="px-4 pt-3 pb-1">
                  <span className="font-montserrat text-[9px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-600">Student</span>
                </div>
                <div className="flex items-start gap-3 px-4 py-3 pb-4 opacity-40 cursor-not-allowed select-none">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FaUserGraduate className="text-gray-400 text-xs" />
                  </div>
                  <div className="flex-1">
                    <div className="font-montserrat text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">{STUDENT_PORTAL.label}</div>
                    <div className="font-montserrat text-[10px] text-gray-400 dark:text-gray-600 mt-0.5 flex items-center gap-1">
                      <FaLock className="text-[8px]" /> Premium plan required
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Navbar() {
  const scrolled = useScrollNav(40)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { dark, toggle } = useTheme()
  const { hasFeature } = useLicense()

  useEffect(() => {
    setOpen(false)
    document.body.style.overflow = ''
  }, [location])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const isActive = (href) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)

  const navLinkClass = (active) => {
    const base = 'font-montserrat text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded transition-all duration-200'
    if (active) return `${base} text-gold bg-gold/10`
    if (scrolled) return `${base} text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5`
    return `${base} text-gray-200 hover:text-white hover:bg-white/10 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5`
  }

  const headerBg = scrolled || open
    ? 'bg-white/95 backdrop-blur-sm shadow-xl shadow-gray-200/50 dark:bg-navy dark:shadow-navy/30'
    : 'bg-transparent'

  const logoTitleClass = scrolled
    ? 'font-playfair font-bold text-gray-900 dark:text-white text-lg leading-tight'
    : 'font-playfair font-bold text-white text-lg leading-tight'

  const logoSubClass = 'font-montserrat text-gold text-xs uppercase tracking-widest leading-none'

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${headerBg}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="w-11 h-11 bg-gold rounded-full flex items-center justify-center shadow-lg">
                <FaGraduationCap className="text-navy text-xl" />
              </div>
              <div className="hidden sm:block">
                <div className={logoTitleClass}>{sc.name}</div>
                <div className={logoSubClass}>{sc.address}</div>
              </div>
              <div className="sm:hidden">
                <div className={logoTitleClass.replace('text-lg', 'text-base')}>{sc.shortName}</div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(link =>
                link.children ? (
                  <DesktopDropdown key={link.label} item={link} isActive={isActive} scrolled={scrolled} />
                ) : (
                  <Link key={link.href} to={link.href} className={navLinkClass(isActive(link.href))}>
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            {/* CTA + Theme Toggle + Hamburger */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggle}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  scrolled
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10'
                    : 'text-gray-200 hover:text-white hover:bg-white/10 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10'
                }`}
              >
                {dark ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
              </button>

              <LoginDropdown scrolled={scrolled} />

              <Link
                to="/admissions"
                className="hidden md:inline-flex items-center bg-gold hover:bg-gold-light text-navy font-montserrat text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Apply Now
              </Link>

              <button
                onClick={() => setOpen(v => !v)}
                className={`lg:hidden w-10 h-10 flex items-center justify-center transition-colors ${
                  scrolled
                    ? 'text-gray-700 hover:text-gray-900 dark:text-white dark:hover:text-gold'
                    : 'text-white hover:text-gold'
                }`}
                aria-label="Toggle menu"
              >
                {open ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-30 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-navy z-40 lg:hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gold rounded-full flex items-center justify-center">
                    <FaGraduationCap className="text-navy" />
                  </div>
                  <span className="font-playfair text-gray-900 dark:text-white font-bold">{sc.shortName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Theme toggle inside mobile drawer */}
                  <button
                    onClick={toggle}
                    title={dark ? 'Light mode' : 'Dark mode'}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-all"
                  >
                    {dark ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
                  </button>
                  <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                    <FaTimes />
                  </button>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-1">
                  {NAV_LINKS.map(link =>
                    link.children ? (
                      <MobileAccordion key={link.label} item={link} isActive={isActive} />
                    ) : (
                      <Link
                        key={link.href}
                        to={link.href}
                        className={`font-montserrat text-sm font-semibold uppercase tracking-wider px-4 py-3 rounded-lg transition-all ${
                          isActive(link.href)
                            ? 'bg-gold/15 text-gold'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5'
                        }`}
                      >
                        {link.label}
                      </Link>
                    )
                  )}
                </div>
              </nav>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex flex-col gap-3">
                <p className="font-montserrat text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600">Login</p>
                <div className="flex flex-col gap-0.5">
                  <Link
                    to="/staff-portal"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                      <FaShieldAlt className="text-gold text-xs" />
                    </div>
                    <span className="font-montserrat text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Staff Portal</span>
                  </Link>
                  <div className="border-t border-gray-100 dark:border-white/10 mx-3 my-1" />
                  {hasFeature('student-portal') ? (
                    (() => {
                      const Icon = STUDENT_PORTAL.icon
                      return (
                        <Link
                          to={STUDENT_PORTAL.href}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                            <Icon className="text-gold text-xs" />
                          </div>
                          <span className="font-montserrat text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{STUDENT_PORTAL.label}</span>
                        </Link>
                      )
                    })()
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-40 cursor-not-allowed select-none">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                        <FaUserGraduate className="text-gray-400 text-xs" />
                      </div>
                      <span className="font-montserrat text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-wide">{STUDENT_PORTAL.label}</span>
                      <FaLock className="text-[9px] text-gray-400 dark:text-gray-600 ml-auto" />
                    </div>
                  )}
                </div>
                <Link
                  to="/admissions"
                  className="w-full flex items-center justify-center bg-gold hover:bg-gold-light text-navy font-montserrat text-sm font-bold uppercase tracking-wider py-3 rounded shadow-lg transition-all mt-1"
                >
                  Apply Now
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
