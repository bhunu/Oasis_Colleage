import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  FaGraduationCap, FaUserGraduate,
  FaEye, FaEyeSlash, FaLock, FaEnvelope, FaArrowLeft, FaShieldAlt,
} from 'react-icons/fa'
import SetPasswordModal from '../components/auth/SetPasswordModal'
import { hashPassword } from '../utils/hash'
import { getDocs, getDoc, collection, query, where, limit, doc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { checkLockStatus, recordFailedAttempt, resetAttempts } from '../utils/loginSecurity'
import { initStudentSession } from '../hooks/useStudentSessionGuard'

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

export default function Login() {
  const navigate     = useNavigate()
  const { state: locationState } = useLocation()

  const [showPass,   setShowPass]   = useState(false)
  const [form,       setForm]       = useState({ credential: '', password: '' })
  const [authError,  setAuthError]  = useState('')
  const [loading,    setLoading]    = useState(false)
  const [useOTP,     setUseOTP]     = useState(locationState?.tab !== 'returning')
  const [pendingOTP, setPendingOTP] = useState(null)

  const [lockInfo,  setLockInfo]  = useState(null)
  const [countdown, setCountdown] = useState(null)

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

  const clearForm = () => setForm({ credential: '', password: '' })

  const handleFail = async (identifier, msg) => {
    const result = await recordFailedAttempt(identifier, 'student-portal')
    if (result.locked) {
      setLockInfo({ lockedUntil: result.lockedUntil })
      setAuthError('Account locked for 30 minutes due to multiple failed login attempts.')
    } else {
      setAuthError(msg ?? attemptsMessage(result.remaining))
    }
    clearForm()
  }

  // ── First-time OTP login ────────────────────────────────────────────────
  const handleStudentOTP = async () => {
    const regNum = form.credential.trim().toUpperCase()
    const otp    = form.password.trim().toUpperCase()
    if (!regNum || !otp) return setAuthError('Enter your student ID and OTP code.')

    try {
      // Resolve reg_number → Firestore student doc ID
      const studentSnap = await getDocs(
        query(collection(db, 'students'), where('reg_number', '==', regNum), limit(1))
      )
      const studentDocId = studentSnap.empty ? null : studentSnap.docs[0].id

      const snap = await getDocs(
        query(collection(db, 'users'),
          where('studentId', '==', studentDocId ?? regNum),
          where('role',      '==', 'student'),
          where('otpUsed',   '==', false),
          limit(1)
        )
      )
      if (snap.empty) {
        await handleFail(regNum, 'No active OTP found for this student ID. Ask your admin to generate one.')
        return
      }
      const otpDoc  = snap.docs[0]
      const otpData = otpDoc.data()

      if (otpData.otpCode !== otp) {
        await handleFail(regNum, null)
        return
      }
      const expires = otpData.otpExpiresAt?.toDate ? otpData.otpExpiresAt.toDate() : new Date(otpData.otpExpiresAt)
      if (new Date() > expires) {
        await handleFail(regNum, 'This OTP has expired. Ask your admin to generate a new one.')
        return
      }

      clearForm()
      setPendingOTP({ regNum, otpDoc })
    } catch {
      setAuthError('Something went wrong. Please try again.')
      clearForm()
    }
  }

  // ── Returning student password login ───────────────────────────────────
  const handleStudentPassword = async () => {
    const regNum = form.credential.trim().toUpperCase()
    const pass   = form.password
    if (!regNum || !pass) return setAuthError('Enter your student ID and password.')
    try {
      // Resolve reg_number → Firestore student doc ID
      const studentSnap = await getDocs(
        query(collection(db, 'students'), where('reg_number', '==', regNum), limit(1))
      )
      const studentDocId = studentSnap.empty ? null : studentSnap.docs[0].id

      const snap = await getDocs(
        query(collection(db, 'users'),
          where('studentId',        '==', studentDocId ?? regNum),
          where('role',             '==', 'student'),
          where('hasSetupPassword', '==', true),
          limit(1)
        )
      )
      if (snap.empty) {
        await handleFail(regNum, 'No account found. Use "First time (OTP)" if this is your first login.')
        return
      }
      const userDoc  = snap.docs[0]
      const userData = userDoc.data()
      const hashed   = hashPassword(pass)
      if (hashed !== userData.password) {
        await handleFail(regNum, null)
        return
      }
      const uid = userDoc.id

      // Fetch student profile by reg_number field (students use auto-generated doc IDs)
      const profileQuery = await getDocs(
        query(collection(db, 'students'), where('reg_number', '==', regNum), limit(1))
      ).catch(() => null)
      const profileDoc = profileQuery?.empty === false ? profileQuery.docs[0] : null
      const profile    = profileDoc?.data() ?? {}

      sessionStorage.setItem('studentSession', JSON.stringify({
        uid,
        studentId:        regNum,
        studentDocId:     profileDoc?.id ?? null,
        hasSetupPassword: true,
        name:             profile.fullName || userData.name || '',
        class:            profile.class || '',
        dateOfBirth:      profile.dateOfBirth || '',
        guardianName:     profile.guardianName || profile.parentName || '',
        guardianPhone:    profile.guardianPhone || profile.parentPhone || '',
        guardianEmail:    profile.guardianEmail || profile.parentEmail || '',
        email:            profile.email || profile.studentEmail || '',
        phone:            profile.phone || '',
        hasEmail:         profile.hasEmail ?? (!!profile.email || !!profile.studentEmail),
        regNumber:        profile.reg_number || regNum,
      }))

      await initStudentSession(uid).catch(() => {})
      await resetAttempts(regNum, 'student-portal').catch(() => {})
      clearForm()
      navigate('/student/dashboard')
    } catch {
      await handleFail(regNum, 'Something went wrong. Please try again.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    if (lockInfo) return
    setLoading(true)

    try {
      const lockCheck = await checkLockStatus(form.credential.trim(), 'student-portal')
      if (lockCheck.locked) {
        setLockInfo({ lockedUntil: lockCheck.lockedUntil })
        setAuthError('Account is temporarily locked. Try again after the countdown.')
        return
      }

      if (useOTP) {
        await handleStudentOTP()
      } else {
        await handleStudentPassword()
      }
    } catch {
      setAuthError('Something went wrong. Please try again.')
      clearForm()
    } finally {
      setLoading(false)
    }
  }

  const isLocked = !!lockInfo

  return (
    <div className="min-h-screen bg-navy flex overflow-hidden">

      {/* ── Left panel ── */}
      <motion.div
        {...fadeLeft}
        transition={{ duration: 0.55 }}
        className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-[#2a1e05] via-[#1e1905] to-[#0A1628] flex-col justify-between p-14 overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold opacity-[0.07] blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-yellow-600 opacity-[0.07] blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgb3BhY2l0eT0iMC4wMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />

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

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-montserrat font-semibold uppercase tracking-wider mb-10 bg-gold/20 text-gold border-gold/30">
            <FaUserGraduate />
            Student Portal
          </div>

          <h1 className="font-playfair text-5xl xl:text-6xl font-bold text-white leading-[1.1] mb-6">
            Welcome<br />
            <span className="text-gold">Back.</span>
          </h1>

          <p className="font-montserrat text-gray-400 text-sm leading-relaxed max-w-xs">
            Your grades, timetable &amp; learning resources. Sign in with your student ID to continue.
          </p>
        </div>

        {/* Link to staff login */}
        <div className="relative pt-6 border-t border-white/10">
          <p className="font-montserrat text-[10px] uppercase tracking-[0.18em] text-gray-600 mb-3">Staff access</p>
          <Link
            to="/staff-login"
            className="font-montserrat text-[10px] uppercase tracking-widest text-gray-600 hover:text-gold transition-colors flex items-center gap-2"
          >
            <FaShieldAlt className="text-xs" />
            Web Admin · Students Records · Bursar
          </Link>
        </div>
      </motion.div>

      {/* ── Right panel – form ── */}
      <motion.div
        {...fadeRight}
        transition={{ duration: 0.55 }}
        className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 py-16 relative"
      >
        {/* Mobile: logo */}
        <div className="lg:hidden mb-10">
          <Link to="/" className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center shadow-md shadow-gold/30">
              <FaGraduationCap className="text-navy" />
            </div>
            <div className="font-playfair font-bold text-white text-lg leading-tight">Oasis Private College</div>
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-montserrat font-semibold uppercase tracking-wider bg-gold/20 text-gold border-gold/30">
            <FaUserGraduate className="text-sm" />
            Student Portal
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

        <div className="max-w-[380px] w-full mx-auto lg:mx-0">

          <motion.div {...fadeUp} transition={{ delay: 0.25, duration: 0.45 }}>
            <h2 className="font-playfair text-3xl font-bold text-white mb-1">Student Sign In</h2>
            <p className="font-montserrat text-gray-500 text-xs mb-10 leading-relaxed">
              Student Portal &mdash; Grades, timetable &amp; learning resources
            </p>
          </motion.div>

          {/* OTP toggle */}
          <motion.div {...fadeUp} transition={{ delay: 0.3, duration: 0.4 }} className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
            {[
              { label: 'Returning student',  value: false },
              { label: 'First time (OTP)',   value: true  },
            ].map(({ label, value }) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => { setUseOTP(value); setAuthError(''); clearForm() }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold font-montserrat transition-all ${
                  useOTP === value ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </motion.div>

          <motion.form
            {...fadeUp}
            transition={{ delay: 0.32, duration: 0.45 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            {/* Student ID */}
            <div>
              <label className="font-montserrat text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2 block">
                Student Registration Number
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                <input
                  type="text"
                  value={form.credential}
                  onChange={e => setForm(f => ({ ...f, credential: e.target.value }))}
                  placeholder="e.g. R267906"
                  autoComplete="username"
                  disabled={isLocked}
                  className="w-full bg-white/5 border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl pl-11 pr-4 py-3.5 text-white font-montserrat text-sm placeholder-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password / OTP */}
            <div>
              <label className="font-montserrat text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2 block">
                {useOTP ? 'One-Time Passcode (OTP)' : 'Password'}
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                <input
                  type={useOTP ? 'text' : showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={useOTP ? 'e.g. ABCD1234' : '••••••••••'}
                  autoComplete={useOTP ? 'one-time-code' : 'current-password'}
                  disabled={isLocked}
                  className="w-full bg-white/5 border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl pl-11 pr-12 py-3.5 text-white font-montserrat text-sm placeholder-gray-700 transition-all tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {!useOTP && (
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
                  >
                    {showPass ? <FaEyeSlash /> : <FaEye />}
                  </button>
                )}
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
              {loading ? 'Signing in…' : isLocked ? `Locked — ${countdown ?? '…'}` : 'Sign In to Student Portal'}
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

          {/* Mobile: staff link */}
          <div className="lg:hidden mt-8 pt-6 border-t border-white/10 text-center">
            <Link to="/staff-login" className="font-montserrat text-[10px] uppercase tracking-widest text-gray-600 hover:text-gold transition-colors">
              Staff Login (Web Admin · Records · Bursar)
            </Link>
          </div>
        </div>
      </motion.div>

      {pendingOTP && (
        <SetPasswordModal
          regNum={pendingOTP.regNum}
          otpDoc={pendingOTP.otpDoc}
          onClose={() => setPendingOTP(null)}
        />
      )}
    </div>
  )
}
