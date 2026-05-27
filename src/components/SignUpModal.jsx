import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaTimes, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaUserTag, FaBook, FaIdCard, FaGraduationCap,
} from 'react-icons/fa'
import { addUser } from '../firebase/users'

const FORMS = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Lower 6', 'Upper 6']
const SUBJECTS = ['Mathematics', 'English', 'Geography', 'History', 'Science', 'Shona', 'ICT', 'Commerce', 'Accounts', 'Other']
const ADMIN_ROLES = ['admin', 'staff']

// Fields and labels per portal
const PORTAL_CONFIG = {
  'web-admin': {
    heading:     'Create Admin Account',
    subheading:  'Web Admin · System Administration',
    credential:  'email',
    extraFields: ['role'],
    btnClass:    'bg-blue-500 hover:bg-blue-400 text-white',
    ringClass:   'focus:border-blue-400/60',
  },
  'students-records': {
    heading:     'Staff Registration',
    subheading:  'Students Records · Academic Staff',
    credential:  'email',
    extraFields: ['subject'],
    btnClass:    'bg-emerald-500 hover:bg-emerald-400 text-white',
    ringClass:   'focus:border-emerald-400/60',
  },
  'student-portal': {
    heading:     'Student Registration',
    subheading:  'Student Portal · New Enrolment',
    credential:  'username',
    extraFields: ['form'],
    btnClass:    'bg-gold hover:bg-yellow-400 text-navy',
    ringClass:   'focus:border-gold/60',
  },
}

function slugify(name) {
  const parts = name.trim().toLowerCase().split(/\s+/)
  if (parts.length < 2) return parts[0] ?? ''
  return `${parts[0]}.${parts[parts.length - 1]}`
}

export default function SignUpModal({ portalKey, onClose }) {
  const cfg = PORTAL_CONFIG[portalKey] ?? PORTAL_CONFIG['student-portal']

  const [form, setForm]       = useState({ name: '', credential: '', password: '', confirm: '', extra: '' })
  const [showPass, setShowPass]   = useState(false)
  const [showConf, setShowConf]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  // Auto-suggest username for students
  useEffect(() => {
    if (cfg.credential === 'username' && form.name) {
      setForm(f => ({ ...f, credential: slugify(f.name) }))
    }
  }, [form.name, cfg.credential])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      const roleMap = { 'web-admin': form.extra || 'staff', 'students-records': 'teacher', 'student-portal': 'student' }
      const payload = {
        name: form.name,
        role: roleMap[portalKey],
        ...(cfg.credential === 'email'    ? { email: form.credential }    : { username: form.credential }),
        ...(cfg.extraFields.includes('subject') ? { subject: form.extra }  : {}),
        ...(cfg.extraFields.includes('form')    ? { form: form.extra }     : {}),
        active: true,
      }
      await addUser(payload)
      setSuccess(true)
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = `w-full bg-white/5 border border-white/10 ${cfg.ringClass} focus:outline-none rounded-xl pl-11 pr-4 py-3 text-white font-montserrat text-sm placeholder-gray-700 transition-all`

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.3, ease: 'easeOut' } }}
        exit={{   opacity: 0, scale: 0.94, y: 16,  transition: { duration: 0.2 } }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          onClick={e => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-md bg-[#0e1b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-white/10">
            <div>
              <h2 className="font-playfair text-white text-2xl font-bold leading-tight">{cfg.heading}</h2>
              <p className="font-montserrat text-gray-500 text-[11px] mt-1 uppercase tracking-wider">{cfg.subheading}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-white transition-colors mt-1 p-1"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          <div className="px-7 py-6">
            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6"
              >
                <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaGraduationCap className="text-emerald-400 text-2xl" />
                </div>
                <h3 className="font-playfair text-white text-xl font-bold mb-2">Account Created!</h3>
                <p className="font-montserrat text-gray-400 text-sm mb-6">
                  Your account has been submitted. An administrator will activate it shortly.
                </p>
                <button
                  onClick={onClose}
                  className="font-montserrat text-xs uppercase tracking-wider text-gold hover:text-yellow-300 transition-colors"
                >
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
                <div className="relative">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Full name"
                    required
                    className={inputClass}
                  />
                </div>

                {/* Email or Username */}
                <div className="relative">
                  {cfg.credential === 'email'
                    ? <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                    : <FaIdCard   className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                  }
                  <input
                    type={cfg.credential === 'email' ? 'email' : 'text'}
                    value={form.credential}
                    onChange={set('credential')}
                    placeholder={cfg.credential === 'email' ? 'Email address' : 'Username (e.g. tendai.moyo)'}
                    required
                    className={inputClass}
                  />
                </div>

                {/* Extra field: role / subject / form */}
                {cfg.extraFields.includes('role') && (
                  <div className="relative">
                    <FaUserTag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                    <select value={form.extra} onChange={set('extra')} className={`${inputClass} pl-11`}>
                      <option value="" className="bg-gray-900">Select role</option>
                      {ADMIN_ROLES.map(r => <option key={r} value={r} className="bg-gray-900 capitalize">{r}</option>)}
                    </select>
                  </div>
                )}

                {cfg.extraFields.includes('subject') && (
                  <div className="relative">
                    <FaBook className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                    <select value={form.extra} onChange={set('extra')} className={`${inputClass} pl-11`}>
                      <option value="" className="bg-gray-900">Select subject</option>
                      {SUBJECTS.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
                    </select>
                  </div>
                )}

                {cfg.extraFields.includes('form') && (
                  <div className="relative">
                    <FaGraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                    <select value={form.extra} onChange={set('extra')} required className={`${inputClass} pl-11`}>
                      <option value="" className="bg-gray-900">Select form / class</option>
                      {FORMS.map(f => <option key={f} value={f} className="bg-gray-900">{f}</option>)}
                    </select>
                  </div>
                )}

                {/* Password */}
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Password"
                    required
                    className={`${inputClass} pr-11`}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                    {showPass ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                  <input
                    type={showConf ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={set('confirm')}
                    placeholder="Confirm password"
                    required
                    className={`${inputClass} pr-11`}
                  />
                  <button type="button" onClick={() => setShowConf(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                    {showConf ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`mt-1 ${cfg.btnClass} disabled:opacity-60 font-montserrat font-bold text-xs uppercase tracking-[0.12em] py-3.5 rounded-xl shadow-lg transition-all duration-300`}
                >
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
