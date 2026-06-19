import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaGraduationCap, FaLock, FaClock, FaBan, FaExclamationTriangle } from 'react-icons/fa'
import { MdEmail, MdPhone, MdClose } from 'react-icons/md'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { useLicense } from './LicenseContext'
import { formatExpiry } from './licenseUtils'

// Portal prefixes that require a valid license
const PORTAL_PREFIXES = [
  '/admin', '/dashboard', '/bursar', '/teacher',
  '/student/', '/staff-login', '/enrol', '/students',
  '/payments', '/fees', '/arrears', '/exams', '/registration',
  '/reports', '/settings', '/end-of-term',
]

function isPortalRoute(pathname) {
  return PORTAL_PREFIXES.some(p => pathname.startsWith(p))
}

// ── Developer admin bypass login ────────────────────────────────────────────
function DevAccess() {
  const [open,    setOpen]    = useState(false)
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass)
      let userData = { name: cred.user.displayName || email.trim(), role: 'admin' }
      try {
        const snap = await getDoc(doc(db, 'users', cred.user.uid))
        if (snap.exists()) userData = snap.data()
      } catch { /* proceed with basic session if Firestore unreachable */ }

      sessionStorage.setItem('adminSession', JSON.stringify({
        uid:   cred.user.uid,
        email: cred.user.email || email.trim(),
        name:  userData.name || cred.user.displayName || email.trim(),
        role:  userData.role || 'admin',
      }))
      navigate('/admin/super-admin')
    } catch {
      setError('Invalid email or password.')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <div className="mt-5 text-center">
        <button
          onClick={() => setOpen(true)}
          className="text-[11px] text-gray-700 hover:text-gray-500 font-montserrat transition-colors"
        >
          Developer / Admin access →
        </button>
      </div>
    )
  }

  return (
    <div className="mt-5 bg-navy border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-500 text-[10px] font-semibold font-montserrat uppercase tracking-widest">Admin Access</p>
        <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-400 transition-colors">
          <MdClose className="text-sm" />
        </button>
      </div>
      <form onSubmit={handleLogin} className="space-y-2.5">
        <input
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-montserrat placeholder-gray-700 focus:outline-none focus:border-gold/40 transition-colors"
        />
        <input
          type="password"
          placeholder="Password"
          value={pass}
          onChange={e => setPass(e.target.value)}
          required
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-montserrat placeholder-gray-700 focus:outline-none focus:border-gold/40 transition-colors"
        />
        {error && <p className="text-red-400 text-[11px] font-montserrat">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-gold/10 border border-gold/20 text-gold rounded-lg text-xs font-bold font-montserrat hover:bg-gold/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <div className="w-3 h-3 border-2 border-gold border-t-transparent rounded-full animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in to Admin Panel'}
        </button>
      </form>
    </div>
  )
}

// ── Shared layout shell ─────────────────────────────────────────────────────
function Screen({ icon: Icon, iconColor, title, subtitle, children }) {
  const devName    = import.meta.env.VITE_DEVELOPER_NAME    || 'Oasis Systems'
  const devEmail   = import.meta.env.VITE_DEVELOPER_EMAIL   || 'support@oasissystems.co.zw'
  const devPhone   = import.meta.env.VITE_DEVELOPER_PHONE   || ''

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4 font-montserrat">
      <div className="w-full max-w-md">
        {/* Header badge */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5 bg-navy-800 border border-gold/30 rounded-full px-5 py-2.5">
            <FaGraduationCap className="text-gold text-sm" />
            <span className="text-gold text-xs font-semibold tracking-wider uppercase">{devName}</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-navy-800 border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          <div className={`w-16 h-16 ${iconColor} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
            <Icon className="text-2xl text-white" />
          </div>

          <h1 className="text-xl font-bold text-white mb-2 font-playfair">{title}</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">{subtitle}</p>

          {children}
        </div>

        {/* Contact footer */}
        <div className="mt-6 bg-navy-800 border border-white/10 rounded-xl p-4">
          <p className="text-gray-500 text-xs text-center mb-3 uppercase tracking-wider">Contact to resolve</p>
          <div className="flex flex-col gap-2">
            <a href={`mailto:${devEmail}`}
               className="flex items-center gap-2.5 text-sm text-gray-300 hover:text-gold transition-colors">
              <MdEmail className="text-gold shrink-0" />
              <span>{devEmail}</span>
            </a>
            {devPhone && (
              <a href={`tel:${devPhone}`}
                 className="flex items-center gap-2.5 text-sm text-gray-300 hover:text-gold transition-colors">
                <MdPhone className="text-gold shrink-0" />
                <span>{devPhone}</span>
              </a>
            )}
          </div>
        </div>

        {/* Developer bypass */}
        <DevAccess />
      </div>
    </div>
  )
}

// ── Individual screens ──────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm font-montserrat">Verifying license…</p>
      </div>
    </div>
  )
}

function ExpiredScreen({ data }) {
  const schoolName = data?.schoolName || data?.sch || 'Your school'
  return (
    <Screen
      icon={FaClock}
      iconColor="bg-amber-500/20 border border-amber-500/30"
      title="License Expired"
      subtitle={`The software license for ${schoolName} has expired. All portals are locked until it is renewed.`}
    >
      {data?.exp && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-4">
          <p className="text-amber-400 text-xs uppercase tracking-wider mb-1">Expired on</p>
          <p className="text-white font-semibold text-sm">{formatExpiry(data.exp)}</p>
        </div>
      )}
      <p className="text-gray-500 text-xs">
        Contact the system developer to renew your annual license subscription.
      </p>
    </Screen>
  )
}

function SuspendedScreen({ data }) {
  const schoolName = data?.schoolName || data?.sch || 'Your school'
  return (
    <Screen
      icon={FaBan}
      iconColor="bg-red-500/20 border border-red-500/30"
      title="License Suspended"
      subtitle={`Access to ${schoolName}'s portal has been suspended. Contact the system developer immediately.`}
    >
      <p className="text-gray-500 text-xs">
        This may be due to an outstanding payment or a policy violation.
      </p>
    </Screen>
  )
}

function InvalidScreen() {
  return (
    <Screen
      icon={FaExclamationTriangle}
      iconColor="bg-red-500/20 border border-red-500/30"
      title="Invalid License"
      subtitle="The license token on this deployment is corrupted or was issued for a different system."
    >
      <p className="text-gray-500 text-xs">
        The system developer needs to re-issue and re-deploy a valid license token.
      </p>
    </Screen>
  )
}

function UnlicensedScreen() {
  return (
    <Screen
      icon={FaLock}
      iconColor="bg-gray-500/20 border border-gray-500/30"
      title="Unlicensed Deployment"
      subtitle="No license token has been configured for this deployment. The portals are inaccessible until a valid license is provided."
    >
      <p className="text-gray-500 text-xs">
        If you are the school administrator, contact the system developer to obtain a license.
      </p>
    </Screen>
  )
}

// ── Gate component ──────────────────────────────────────────────────────────
export default function LicenseGate({ children }) {
  const { status, licenseData } = useLicense()
  const { pathname } = useLocation()

  // Public website pages always render — only portal routes are gated
  if (!isPortalRoute(pathname)) return children

  // Super admin panel always accessible — it has its own email-based guard
  if (pathname.startsWith('/admin/super-admin')) return children

  if (status === 'loading')   return <LoadingScreen />
  if (status === 'expired')   return <ExpiredScreen   data={licenseData} />
  if (status === 'suspended') return <SuspendedScreen data={licenseData} />
  if (status === 'invalid')   return <InvalidScreen />
  if (status === 'none')      return <UnlicensedScreen />

  return children
}
