import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaGraduationCap, FaLaptopCode, FaClipboardList,
  FaMoneyCheckAlt, FaChalkboardTeacher, FaArrowRight, FaLock,
} from 'react-icons/fa'
import sc from '../utils/schoolConfig'
import { useLicense } from '../license/LicenseContext'

const PORTALS = [
  {
    key:      'web-admin',
    feature:  'web-admin',
    label:    'Web Admin',
    icon:     FaLaptopCode,
    desc:     'School website & system administration',
    href:     '/staff-login?portal=web-admin',
    accentBorder: 'border-blue-400/25 hover:border-blue-400/60',
    accentText:   'text-blue-300',
    iconBg:       'bg-blue-500/15',
  },
  {
    key:      'students-records',
    feature:  'student-records',
    label:    'Students Records',
    icon:     FaClipboardList,
    desc:     'Academic records & student data management',
    href:     '/staff-login?portal=students-records',
    accentBorder: 'border-emerald-400/25 hover:border-emerald-400/60',
    accentText:   'text-emerald-300',
    iconBg:       'bg-emerald-500/15',
  },
  {
    key:      'bursar',
    feature:  'bursar',
    label:    'School Bursar',
    icon:     FaMoneyCheckAlt,
    desc:     'Fee collections, expenses & financial reports',
    href:     '/staff-login?portal=bursar',
    accentBorder: 'border-teal-400/25 hover:border-teal-400/60',
    accentText:   'text-teal-300',
    iconBg:       'bg-teal-500/15',
  },
  {
    key:      'teacher',
    feature:  'teacher-portal',
    label:    'Teacher Portal',
    icon:     FaChalkboardTeacher,
    desc:     'Attendance, timetable & class management',
    href:     '/staff-login?portal=teacher',
    accentBorder: 'border-violet-400/25 hover:border-violet-400/60',
    accentText:   'text-violet-300',
    iconBg:       'bg-violet-500/15',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const card = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function StaffPortalSelect() {
  const { hasFeature } = useLicense()
  return (
    <div className="min-h-screen bg-navy flex flex-col overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgb3BhY2l0eT0iMC4wMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60 pointer-events-none" />

      {/* Orbs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.04] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-blue-600 opacity-[0.05] blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center flex-1 px-6 py-20">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-16"
        >
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center shadow-lg shadow-gold/30">
              <FaGraduationCap className="text-navy text-xl" />
            </div>
            <div>
              <div className="font-playfair font-bold text-white text-xl leading-tight">{sc.name}</div>
              <div className="font-montserrat text-gold text-[10px] uppercase tracking-[0.2em]">{sc.address}</div>
            </div>
          </Link>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/25 mb-6">
            <span className="font-montserrat text-gold text-[10px] font-semibold uppercase tracking-[0.2em]">Staff Access</span>
          </div>
          <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-white mb-3">
            Staff <span className="text-gold">Portal</span>
          </h1>
          <p className="font-montserrat text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
            Select your role to continue to the sign-in page.
          </p>
        </motion.div>

        {/* Portal cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl"
        >
          {PORTALS.map(portal => {
            const Icon = portal.icon
            const unlocked = hasFeature(portal.feature)
            return (
              <motion.div key={portal.key} variants={card}>
                {unlocked ? (
                  <Link
                    to={portal.href}
                    className={`group flex items-start gap-4 p-5 rounded-2xl border bg-white/[0.03] ${portal.accentBorder} transition-all duration-300 hover:bg-white/[0.06] hover:-translate-y-0.5`}
                  >
                    <div className={`w-12 h-12 rounded-xl ${portal.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                      <Icon className={`${portal.accentText} text-lg`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-montserrat text-sm font-bold text-white uppercase tracking-wider mb-1">{portal.label}</div>
                      <div className="font-montserrat text-[11px] text-gray-500 leading-relaxed">{portal.desc}</div>
                    </div>
                    <FaArrowRight className="text-gray-700 group-hover:text-gray-400 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 mt-1 text-sm" />
                  </Link>
                ) : (
                  <div className="relative flex items-start gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.015] opacity-50 cursor-not-allowed select-none">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Icon className="text-gray-600 text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-montserrat text-sm font-bold text-gray-600 uppercase tracking-wider mb-1">{portal.label}</div>
                      <div className="font-montserrat text-[11px] text-gray-700 leading-relaxed">{portal.desc}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <FaLock className="text-gray-700 text-xs mt-1" />
                      <span className="font-montserrat text-[9px] text-gray-700 uppercase tracking-wider">Premium</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        {/* Student portal link — only if student-portal is licensed */}
        {hasFeature('student-portal') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="mt-10 flex items-center gap-3"
          >
            <div className="h-px w-12 bg-white/10" />
            <Link
              to="/login"
              className="font-montserrat text-[10px] uppercase tracking-[0.18em] text-gray-600 hover:text-gold transition-colors flex items-center gap-2"
            >
              <FaGraduationCap className="text-xs" />
              Student Portal Login
            </Link>
            <div className="h-px w-12 bg-white/10" />
          </motion.div>
        )}

        {/* Back to site */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-4"
        >
          <Link
            to="/"
            className="font-montserrat text-[10px] uppercase tracking-wider text-gray-700 hover:text-gray-400 transition-colors"
          >
            ← Back to site
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
