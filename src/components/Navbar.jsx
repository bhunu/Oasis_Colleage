import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBars, FaTimes, FaGraduationCap, FaChevronDown, FaSignInAlt, FaLaptopCode, FaClipboardList, FaUserGraduate } from 'react-icons/fa'
import { useScrollNav } from '../hooks/useScrollNav'

const LOGIN_PORTALS = [
  { key: 'web-admin',        label: 'Web Admin',         icon: FaLaptopCode,    desc: 'System administration' },
  { key: 'students-records', label: 'Students Records',  icon: FaClipboardList, desc: 'Academic data management' },
  { key: 'student-portal',   label: 'Student Portal',    icon: FaUserGraduate,  desc: 'Grades & resources' },
]

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

function DesktopDropdown({ item, isActive }) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)

  const anyChildActive = item.children?.some(c => isActive(c.href))

  const show = () => {
    clearTimeout(timerRef.current)
    setOpen(true)
  }
  const hide = () => {
    timerRef.current = setTimeout(() => setOpen(false), 120)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        className={`flex items-center gap-1 font-montserrat text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded transition-all duration-200 ${
          anyChildActive
            ? 'text-gold bg-gold/10'
            : 'text-gray-300 hover:text-white hover:bg-white/5'
        }`}
      >
        {item.label}
        <FaChevronDown
          className={`text-[10px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 min-w-[160px] bg-navy border border-white/10 rounded-lg shadow-2xl shadow-black/40 overflow-hidden z-50"
          >
            {item.children.map(child => (
              <Link
                key={child.href}
                to={child.href}
                className={`block font-montserrat text-xs font-semibold uppercase tracking-wider px-4 py-2.5 transition-all duration-150 ${
                  isActive(child.href)
                    ? 'text-gold bg-gold/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
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
            : 'text-gray-300 hover:text-white hover:bg-white/5'
        }`}
      >
        {item.label}
        <FaChevronDown
          className={`text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
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
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
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

function LoginDropdown() {
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)

  const show = () => { clearTimeout(timerRef.current); setOpen(true) }
  const hide = () => { timerRef.current = setTimeout(() => setOpen(false), 120) }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <div className="relative hidden md:block" onMouseEnter={show} onMouseLeave={hide}>
      <button
        className="flex items-center gap-1.5 border border-white/20 hover:border-gold/60 text-gray-300 hover:text-gold font-montserrat text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-all duration-300"
      >
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
            className="absolute top-full right-0 mt-2 w-56 bg-navy border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
          >
            {LOGIN_PORTALS.map(portal => {
              const Icon = portal.icon
              return (
                <Link
                  key={portal.key}
                  to={`/login?portal=${portal.key}`}
                  className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors group border-b border-white/5 last:border-0"
                >
                  <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-gold/20 transition-colors">
                    <Icon className="text-gold text-xs" />
                  </div>
                  <div>
                    <div className="font-montserrat text-xs font-semibold text-white uppercase tracking-wide">{portal.label}</div>
                    <div className="font-montserrat text-[10px] text-gray-500 mt-0.5">{portal.desc}</div>
                  </div>
                </Link>
              )
            })}
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

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled || open
            ? 'bg-navy shadow-xl shadow-navy/30'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="w-11 h-11 bg-gold rounded-full flex items-center justify-center shadow-lg">
                <FaGraduationCap className="text-navy text-xl" />
              </div>
              <div className="hidden sm:block">
                <div className="font-playfair font-bold text-white text-lg leading-tight">Oasis Private College</div>
                <div className="font-montserrat text-gold text-xs uppercase tracking-widest leading-none">Checheche, Zimbabwe</div>
              </div>
              <div className="sm:hidden">
                <div className="font-playfair font-bold text-white text-base leading-tight">Oasis College</div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(link =>
                link.children ? (
                  <DesktopDropdown key={link.label} item={link} isActive={isActive} />
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`font-montserrat text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded transition-all duration-200 ${
                      isActive(link.href)
                        ? 'text-gold bg-gold/10'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            {/* CTA + Hamburger */}
            <div className="flex items-center gap-3">
              <LoginDropdown />
              <Link
                to="/admissions"
                className="hidden md:inline-flex items-center bg-gold hover:bg-gold-light text-navy font-montserrat text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Apply Now
              </Link>
              <button
                onClick={() => setOpen(v => !v)}
                className="lg:hidden w-10 h-10 flex items-center justify-center text-white hover:text-gold transition-colors"
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
              className="fixed top-0 right-0 h-full w-80 bg-navy z-40 lg:hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gold rounded-full flex items-center justify-center">
                    <FaGraduationCap className="text-navy" />
                  </div>
                  <span className="font-playfair text-white font-bold">Oasis College</span>
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                  <FaTimes />
                </button>
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
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {link.label}
                      </Link>
                    )
                  )}
                </div>
              </nav>

              <div className="p-6 border-t border-white/10 flex flex-col gap-3">
                <p className="font-montserrat text-[10px] uppercase tracking-[0.15em] text-gray-600">Login Portals</p>
                <div className="flex flex-col gap-1">
                  {LOGIN_PORTALS.map(portal => {
                    const Icon = portal.icon
                    return (
                      <Link
                        key={portal.key}
                        to={`/login?portal=${portal.key}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                          <Icon className="text-gold text-xs" />
                        </div>
                        <span className="font-montserrat text-xs font-semibold text-gray-300 uppercase tracking-wide">{portal.label}</span>
                      </Link>
                    )
                  })}
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
