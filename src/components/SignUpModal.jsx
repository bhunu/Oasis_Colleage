import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaTimes, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaUserTag, FaGraduationCap,
} from 'react-icons/fa'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, serverTimestamp, getDocs, query, collection, where, limit } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const ROLE_OPTIONS = {
  'web-admin':        ['admin', 'staff'],
  'students-records': ['Student Admin', 'Teacher', 'Secretary'],
  'bursar':           ['bursar'],
}

const PORTAL_CONFIG = {
  'web-admin': {
    heading:     'Create Admin Account',
    subheading:  'Web Admin · System Administration',
    btnClass:    'bg-blue-500 hover:bg-blue-400 text-white',
    ringClass:   'focus:border-blue-400/60',
    defaultRole: 'admin',
    active:      true,
  },
  'students-records': {
    heading:     'Staff Registration',
    subheading:  'Students Records · Academic Staff',
    btnClass:    'bg-emerald-500 hover:bg-emerald-400 text-white',
    ringClass:   'focus:border-emerald-400/60',
    defaultRole: 'Student Admin',
    active:      false,
  },
  'bursar': {
    heading:     'Bursar Registration',
    subheading:  'School Bursar · Finance Office',
    btnClass:    'bg-teal-500 hover:bg-teal-400 text-white',
    ringClass:   'focus:border-teal-400/60',
    defaultRole: 'bursar',
    active:      false,
  },
}

export default function SignUpModal({ portalKey, onClose }) {
  const cfg = PORTAL_CONFIG[portalKey] ?? PORTAL_CONFIG['web-admin']

  const [form,       setForm]       = useState({ name: '', email: '', password: '', confirm: '', role: cfg.defaultRole })
  const [showPass,   setShowPass]   = useState(false)
  const [showConf,   setShowConf]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState(false)
  const [adminLocked, setAdminLocked] = useState(false)
  const [checking,   setChecking]   = useState(false)

  // Block web-admin registration if an admin already exists
  useEffect(() => {
    if (portalKey !== 'web-admin') return
    setChecking(true)
    getDocs(query(collection(db, 'users'), where('role', '==', 'admin'), limit(1)))
      .then(snap => setAdminLocked(!snap.empty))
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [portalKey])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim())           { setError('Full name is required.'); return }
    if (!form.email.trim())          { setError('Email address is required.'); return }
    if (form.password.length < 6)    { setError('Password must be at least 6 characters.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }

    setSubmitting(true)
    try {
      const role = form.role || cfg.defaultRole

      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password)

      await setDoc(doc(db, 'users', cred.user.uid), {
        name:      form.name.trim(),
        email:     form.email.trim().toLowerCase(),
        role,
        active:    cfg.active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Sign out immediately — account needs admin activation before use
      await signOut(auth)

      setSuccess(true)
    } catch (err) {
      console.error('SignUp error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.')
      } else {
        setError(err?.message ?? 'Registration failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const roles      = ROLE_OPTIONS[portalKey] ?? [cfg.defaultRole]
  const inputClass = `w-full bg-white/5 border border-white/10 ${cfg.ringClass} focus:outline-none rounded-xl pl-11 pr-4 py-3.5 text-white font-montserrat text-sm placeholder-gray-700 transition-all`
  const labelClass = 'font-montserrat text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2 block'

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      />

      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.3, ease: 'easeOut' } }}
        exit={{   opacity: 0, scale: 0.94, y: 16,  transition: { duration: 0.2 } }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          onClick={e => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-md bg-[#0e1b2e] border border-white/10 rounded-2xl shadow-2xl overflow-y-auto max-h-[95vh]"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-white/10">
            <div>
              <h2 className="font-playfair text-white text-2xl font-bold leading-tight">{cfg.heading}</h2>
              <p className="font-montserrat text-gray-500 text-[11px] mt-1 uppercase tracking-wider">{cfg.subheading}</p>
            </div>
            <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors mt-1 p-1">
              <FaTimes />
            </button>
          </div>

          <div className="px-7 py-6">
            {checking ? (
              <div className="py-10 text-center font-montserrat text-gray-500 text-sm">Checking registration status…</div>
            ) : adminLocked ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
                <div className="w-14 h-14 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaTimes className="text-red-400 text-xl" />
                </div>
                <h3 className="font-playfair text-white text-xl font-bold mb-2">Registration Closed</h3>
                <p className="font-montserrat text-gray-400 text-sm mb-6 leading-relaxed">
                  A Web Admin account already exists.<br />Only one administrator is permitted.
                </p>
                <button onClick={onClose} className="font-montserrat text-xs uppercase tracking-wider text-gold hover:text-yellow-300 transition-colors">
                  Back to Sign In
                </button>
              </motion.div>
            ) : success ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${portalKey === 'bursar' ? 'bg-teal-500/20' : 'bg-emerald-500/20'}`}>
                  <FaGraduationCap className={`text-2xl ${portalKey === 'bursar' ? 'text-teal-400' : 'text-emerald-400'}`} />
                </div>

                {portalKey === 'web-admin' ? (
                  <>
                    <h3 className="font-playfair text-white text-xl font-bold mb-2">Account Created!</h3>
                    <p className="font-montserrat text-gray-400 text-sm mb-5 leading-relaxed">
                      Your Web Admin account is ready. You can now sign in.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-playfair text-white text-xl font-bold mb-2">Registration Submitted</h3>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4 my-4 text-left">
                      <p className="font-montserrat text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">Pending Activation</p>
                      <p className="font-montserrat text-gray-300 text-sm leading-relaxed">
                        Your account is awaiting approval by the <span className="text-white font-semibold">Web Admin</span>. You will be able to sign in once activated.
                      </p>
                    </div>
                    <p className="font-montserrat text-gray-500 text-xs mb-5">
                      Contact the school administrator if you need urgent access.
                    </p>
                  </>
                )}

                <button onClick={onClose} className="font-montserrat text-xs uppercase tracking-wider text-gold hover:text-yellow-300 transition-colors">
                  Back to Sign In
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 font-montserrat text-xs px-4 py-2.5 rounded-xl">
                    {error}
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className={labelClass}>Full Name</label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={set('name')}
                      placeholder="e.g. Tendai Moyo"
                      autoComplete="name"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>Email Address</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      placeholder="you@oasiscollege.ac.zw"
                      autoComplete="new-email"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className={labelClass}>Role</label>
                  <div className="relative">
                    <FaUserTag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                    <select
                      value={form.role}
                      onChange={set('role')}
                      disabled={roles.length === 1}
                      className={`${inputClass} pl-11 [&>option]:bg-navy-800 disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                      required
                      className={`${inputClass} pr-11`}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                      {showPass ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                    <input
                      type={showConf ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={set('confirm')}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      required
                      className={`${inputClass} pr-11`}
                    />
                    <button type="button" onClick={() => setShowConf(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                      {showConf ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {form.confirm.length > 0 && form.password !== form.confirm && (
                    <p className="font-montserrat text-[11px] text-red-400 mt-1.5">Passwords do not match</p>
                  )}
                  {form.confirm.length >= 6 && form.password === form.confirm && (
                    <p className="font-montserrat text-[11px] text-emerald-400 mt-1.5">Passwords match</p>
                  )}
                </div>

                <button type="submit" disabled={submitting}
                  className={`mt-1 ${cfg.btnClass} disabled:opacity-60 font-montserrat font-bold text-xs uppercase tracking-[0.12em] py-3.5 rounded-xl shadow-lg transition-all duration-300`}>
                  {submitting ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
