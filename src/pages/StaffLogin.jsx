import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  FaGraduationCap, FaLaptopCode, FaClipboardList, FaMoneyCheckAlt,
  FaChalkboardTeacher,
  FaEye, FaEyeSlash, FaLock, FaEnvelope, FaArrowLeft, FaShieldAlt,
} from 'react-icons/fa'
import SignUpModal from '../components/SignUpModal'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { checkLockStatus, recordFailedAttempt, resetAttempts } from '../utils/loginSecurity'
import { logSecurityEvent } from '../utils/logSecurityEvent'

const PORTALS = {
  'web-admin': {
    label: 'Web Admin',
    icon: FaLaptopCode,
    description: 'School website & system administration',
    gradient: 'from-[#0d1f3c] via-[#0f2a4a] to-[#0A1628]',
    accentBg: 'bg-blue-500/15',
    accentBorder: 'border-blue-400/30',
    accentText: 'text-blue-300',
    badgeClass: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
    orb1: 'bg-blue-500',
    orb2: 'bg-indigo-600',
    allowedRoles: ['admin', 'staff'],
    sessionKey: 'adminSession',
    dashboard: '/admin',
  },
  'students-records': {
    label: 'Students Records',
    icon: FaClipboardList,
    description: 'Academic records & student data management',
    gradient: 'from-[#0d2d1f] via-[#0f3626] to-[#0A1628]',
    accentBg: 'bg-emerald-500/15',
    accentBorder: 'border-emerald-400/30',
    accentText: 'text-emerald-300',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
    orb1: 'bg-emerald-500',
    orb2: 'bg-teal-600',
    allowedRoles: ['Student Admin'],
    sessionKey: 'studentsAdminSession',
    dashboard: '/dashboard',
  },
  'bursar': {
    label: 'School Bursar',
    icon: FaMoneyCheckAlt,
    description: 'Fee collections, expenses & financial reports',
    gradient: 'from-[#032e22] via-[#04382a] to-[#0A1628]',
    accentBg: 'bg-teal-600/15',
    accentBorder: 'border-teal-500/30',
    accentText: 'text-teal-400',
    badgeClass: 'bg-teal-600/20 text-teal-300 border-teal-500/30',
    orb1: 'bg-teal-600',
    orb2: 'bg-emerald-700',
    allowedRoles: ['bursar'],
    sessionKey: 'bursarSession',
    dashboard: '/bursar/dashboard',
  },
  'teacher': {
    label: 'Teacher Portal',
    icon: FaChalkboardTeacher,
    description: 'Attendance, timetable & class management',
    gradient: 'from-[#1a0d33] via-[#1f1040] to-[#0A1628]',
    accentBg: 'bg-violet-500/15',
    accentBorder: 'border-violet-400/30',
    accentText: 'text-violet-300',
    badgeClass: 'bg-violet-500/20 text-violet-200 border-violet-500/30',
    orb1: 'bg-violet-500',
    orb2: 'bg-purple-600',
    allowedRoles: ['teacher'],
    sessionKey: 'teacherSession',
    dashboard: '/teacher/dashboard',
  },
}

const ALL_PORTALS = ['web-admin', 'students-records', 'bursar', 'teacher'].map(k => ({ key: k, ...PORTALS[k] }))

const fadeLeft  = { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 } }
const fadeRight = { initial: { opacity: 0, x:  40 }, animate: { opacity: 1, x: 0 } }
const fadeUp    = { initial: { opacity: 0, y:  24 }, animate: { opacity: 1, y: 0 } }

function formatCountdown(ms) {
  if (ms <= 0) return '0:00'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${String(s).padStart(2, '0')}`
}

function attemptsMessage(remaining) {
  if (remaining <= 0) return 'Account locked for 30 minutes due to multiple failed login attempts.'
  return `Incorrect credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
}

export default function StaffLogin() {
  const [searchParams] = useSearchParams()
  const rawKey   = searchParams.get('portal') || 'web-admin'
  const portalKey = PORTALS[rawKey] ? rawKey : 'web-admin'
  const portal   = PORTALS[portalKey]
  const Icon     = portal.icon

  const navigate = useNavigate()

  const [showPass,   setShowPass]   = useState(false)
  const [form,       setForm]       = useState({ email: '', password: '' })
  const [showSignUp, setShowSignUp] = useState(false)
  const [authError,  setAuthError]  = useState('')
  const [loading,    setLoading]    = useState(false)
  const [lockInfo,   setLockInfo]   = useState(null)
  const [countdown,  setCountdown]  = useState(null)

  // Countdown ticker
  useEffect(() => {
    if (!lockInfo?.lockedUntil) { setCountdown(null); return }
    const tick = () => {
      const rem = lockInfo.lockedUntil - Date.now()
      if (rem <= 0) { setCountdown(null); setLockInfo(null); return }
      setCountdown(formatCountdown(rem))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [lockInfo?.lockedUntil])

  // Reset lock and errors when the user switches portals
  useEffect(() => {
    setLockInfo(null)
    setAuthError('')
    setCountdown(null)
  }, [portalKey])

  const clearForm = () => setForm({ email: '', password: '' })

  const handleFail = async (identifier, msg) => {
    const result = await recordFailedAttempt(identifier, portalKey)
    if (result.locked) {
      setLockInfo({ lockedUntil: result.lockedUntil })
      setAuthError('Account locked for 30 minutes due to multiple failed login attempts.')
    } else {
      setAuthError(msg ?? attemptsMessage(result.remaining))
    }
    clearForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    if (lockInfo) return

    const { email, password } = form
    if (!email || !password) return setAuthError('Enter your email and password.')

    setLoading(true)
    try {
      const lockCheck = await checkLockStatus(email, portalKey)
      if (lockCheck.locked) {
        setLockInfo({ lockedUntil: lockCheck.lockedUntil })
        setAuthError('Account is temporarily locked. Try again after the countdown.')
        return
      }

      let cred
      try {
        cred = await signInWithEmailAndPassword(auth, email, password)
      } catch (err) {
        if (
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/wrong-password'     ||
          err.code === 'auth/user-not-found'
        ) {
          await handleFail(email, null)
        } else {
          setAuthError('Something went wrong. Please try again.')
          clearForm()
        }
        return
      }

      // Verify role in Firestore
      const userSnap = await getDoc(doc(db, 'users', cred.user.uid))
      if (!userSnap.exists() || !portal.allowedRoles.includes(userSnap.data().role)) {
        await logSecurityEvent({
          uid:           cred.user.uid,
          identifier:    email,
          action:        'WRONG_ROLE_ACCESS',
          attemptedRole: portalKey,
          actualRole:    userSnap.exists() ? userSnap.data().role : 'none',
        })
        await signOut(auth)
        setAuthError(`Access denied. This portal is for ${portal.label} only.`)
        clearForm()
        return
      }

      const userData = userSnap.data()

      if (!userData.active) {
        await signOut(auth)
        setAuthError('Your account is not yet activated. Contact the administrator.')
        clearForm()
        return
      }

      await resetAttempts(email, portalKey).catch(() => {})

      // Store session
      const sessionPayload = {
        name:  userData.name  || cred.user.displayName || '',
        role:  userData.role,
        email: userData.email || cred.user.email || '',
        uid:   cred.user.uid,
      }
      sessionStorage.setItem(portal.sessionKey, JSON.stringify(sessionPayload))

      clearForm()
      navigate(portal.dashboard)
    } finally {
      setLoading(false)
    }
  }

  const isLocked = !!lockInfo

  return (
    <div className="min-h-screen bg-navy flex overflow-hidden">

      {/* ── Left panel – branding ── */}
      <motion.div
        key={portalKey + '-left'}
        {...fadeLeft}
        transition={{ duration: 0.55 }}
        className={`hidden lg:flex lg:w-[45%] relative bg-gradient-to-br ${portal.gradient} flex-col justify-between p-14 overflow-hidden`}
      >
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full ${portal.orb1} opacity-[0.07] blur-3xl`} />
        <div className={`absolute -bottom-24 -left-24 w-72 h-72 rounded-full ${portal.orb2} opacity-[0.07] blur-3xl`} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgb3BhY2l0eT0iMC4wMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />

        {/* Logo */}
        <div className="relative">
          <Link to="/" className="flex items-center gap-3 mb-14">
            <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center shadow-lg shadow-gold/30">
              <FaGraduationCap className="text-navy text-xl" />
            </div>
            <div>
              <div className="font-playfair font-bold text-white text-xl leading-tight">Oasis Private College</div>
              <div className="font-montserrat text-gold text-[10px] uppercase tracking-[0.2em]">Checheche, Zimbabwe</div>
            </div>
          </Link>

          <motion.div
            key={portalKey + '-badge'}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-montserrat font-semibold uppercase tracking-wider mb-10 ${portal.badgeClass}`}
          >
            <Icon />
            {portal.label}
          </motion.div>

          <motion.h1
            key={portalKey + '-heading'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-playfair text-5xl xl:text-6xl font-bold text-white leading-[1.1] mb-6"
          >
            Staff<br />
            <span className={portal.accentText}>Portal.</span>
          </motion.h1>

          <p className="font-montserrat text-gray-400 text-sm leading-relaxed max-w-xs">
            {portal.description}. Sign in with your assigned credentials to continue.
          </p>
        </div>

        {/* Portal switcher */}
        <div className="relative">
          <p className="font-montserrat text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-5">Switch portal</p>
          <div className="flex items-end gap-5">
            {ALL_PORTALS.map(p => {
              const PIcon = p.icon
              const active = p.key === portalKey
              return (
                <Link
                  key={p.key}
                  to={`/staff-login?portal=${p.key}`}
                  className={`flex flex-col items-center gap-2 transition-all duration-300 ${active ? 'opacity-100 scale-110' : 'opacity-35 hover:opacity-65'}`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${active ? `${p.accentBg} ${p.accentBorder}` : 'bg-white/5 border-white/10'}`}>
                    <PIcon className={active ? p.accentText : 'text-gray-400'} />
                  </div>
                  <span className="font-montserrat text-[9px] uppercase tracking-wider text-gray-500 text-center leading-tight max-w-[56px]">
                    {p.label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Link to student portal */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <Link
              to="/login"
              className="font-montserrat text-[10px] uppercase tracking-widest text-gray-600 hover:text-gold transition-colors flex items-center gap-2"
            >
              <FaGraduationCap className="text-xs" />
              Student Portal Login
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Right panel – form ── */}
      <motion.div
        key={portalKey + '-right'}
        {...fadeRight}
        transition={{ duration: 0.55 }}
        className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 py-16 relative"
      >
        {/* Mobile: logo + badge */}
        <div className="lg:hidden mb-10">
          <Link to="/" className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center shadow-md shadow-gold/30">
              <FaGraduationCap className="text-navy" />
            </div>
            <div className="font-playfair font-bold text-white text-lg leading-tight">Oasis Private College</div>
          </Link>
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-montserrat font-semibold uppercase tracking-wider ${portal.badgeClass}`}>
            <Icon className="text-sm" />
            {portal.label}
          </div>
        </div>

        {/* Desktop: back link */}
        <Link
          to="/"
          className="hidden lg:flex items-center gap-2 text-gray-500 hover:text-white font-montserrat text-xs uppercase tracking-wider mb-14 transition-colors group w-fit"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" />
          Back to site
        </Link>

        {/* Form card */}
        <div className="max-w-[380px] w-full mx-auto lg:mx-0">

          <motion.div {...fadeUp} transition={{ delay: 0.25, duration: 0.45 }}>
            <h2 className="font-playfair text-3xl font-bold text-white mb-1">Sign In</h2>
            <p className="font-montserrat text-gray-500 text-xs mb-10 leading-relaxed">
              {portal.label} &mdash; {portal.description}
            </p>
          </motion.div>

          <motion.form
            {...fadeUp}
            transition={{ delay: 0.32, duration: 0.45 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            {/* Email */}
            <div>
              <label className="font-montserrat text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2 block">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@oasiscollege.ac.zw"
                  autoComplete="new-email"
                  disabled={isLocked}
                  className="w-full bg-white/5 border border-white/10 focus:border-opacity-60 focus:outline-none rounded-xl pl-11 pr-4 py-3.5 text-white font-montserrat text-sm placeholder-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="font-montserrat text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2 block">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  disabled={isLocked}
                  className="w-full bg-white/5 border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl pl-11 pr-12 py-3.5 text-white font-montserrat text-sm placeholder-gray-700 transition-all tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Remember / sign up */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="accent-gold w-3.5 h-3.5 rounded" />
                <span className="font-montserrat text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Remember me</span>
              </label>
              <div className="flex items-center gap-3">
                <button type="button" className="font-montserrat text-xs text-gold hover:text-yellow-300 transition-colors">
                  Forgot password?
                </button>
                <>
                  <span className="text-gray-700 text-xs">·</span>
                  <button
                    type="button"
                    onClick={() => setShowSignUp(true)}
                    className="font-montserrat text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Sign up
                  </button>
                </>
              </div>
            </div>

            {/* Error / lockout */}
            {(isLocked || authError) && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border font-montserrat text-xs px-4 py-3 rounded-xl ${
                  isLocked
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {isLocked
                  ? countdown
                    ? `Account temporarily locked. Try again in ${countdown}.`
                    : 'Account unlocked. You may try again.'
                  : authError}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="mt-3 bg-gold hover:bg-yellow-400 disabled:opacity-60 text-navy font-montserrat font-bold text-xs uppercase tracking-[0.12em] py-4 rounded-xl shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <FaShieldAlt />
              {loading ? 'Signing in…' : isLocked ? `Locked — ${countdown ?? '…'}` : `Sign In to ${portal.label}`}
            </button>
          </motion.form>

          <motion.p
            {...fadeUp}
            transition={{ delay: 0.45, duration: 0.45 }}
            className="font-montserrat text-[10px] text-gray-700 text-center mt-8 leading-relaxed"
          >
            Protected by school-grade security. Unauthorised access is prohibited.<br />
            Need help? Contact{' '}
            <Link to="/contact" className="text-gold hover:underline">support</Link>.
          </motion.p>

          {/* Mobile portal switcher */}
          <div className="lg:hidden mt-10 pt-8 border-t border-white/10">
            <p className="font-montserrat text-[10px] uppercase tracking-[0.15em] text-gray-600 mb-4">Switch portal</p>
            <div className="flex gap-3">
              {ALL_PORTALS.map(p => {
                const PIcon = p.icon
                const active = p.key === portalKey
                return (
                  <Link
                    key={p.key}
                    to={`/staff-login?portal=${p.key}`}
                    className={`flex-1 flex flex-col items-center gap-2 py-3 px-1 rounded-xl border transition-all ${
                      active ? `${p.accentBg} ${p.accentBorder}` : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <PIcon className={active ? p.accentText : 'text-gray-500'} />
                    <span className="font-montserrat text-[8px] uppercase tracking-wider text-center leading-tight text-gray-500">
                      {p.label}
                    </span>
                  </Link>
                )
              })}
            </div>
            <div className="mt-4 text-center">
              <Link to="/login" className="font-montserrat text-[10px] uppercase tracking-widest text-gray-600 hover:text-gold transition-colors">
                Student Portal Login
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {showSignUp && (
        <SignUpModal portalKey={portalKey} onClose={() => setShowSignUp(false)} />
      )}
    </div>
  )
}
