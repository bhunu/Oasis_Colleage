import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaLock, FaEye, FaEyeSlash, FaGraduationCap, FaShieldAlt } from 'react-icons/fa'
import { updateDoc, serverTimestamp } from 'firebase/firestore'
import { hashPassword } from '../../utils/hash'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const INPUT = 'w-full bg-white/5 border border-white/10 focus:border-[#C9A84C]/50 focus:outline-none rounded-xl pl-11 pr-12 py-3.5 text-white font-montserrat text-sm placeholder-gray-700 transition-all'

export default function SetPasswordModal({ regNum, otpDoc, onClose }) {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [show1,    setShow1]    = useState(false)
  const [show2,    setShow2]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8)  return setError('Password must be at least 8 characters.')
    if (password !== confirm)  return setError('Passwords do not match.')

    setSaving(true)
    try {
      const hashed = hashPassword(password)
      await updateDoc(otpDoc.ref, {
        password:         hashed,
        hasSetupPassword: true,
        otpUsed:          true,
        updatedAt:        serverTimestamp(),
      })
      toast.success('Password set! Please log in with your student ID and password.')
      navigate('/login')
    } catch (err) {
      console.error('SetPasswordModal error:', err.code, err.message)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
        onClick={e => e.target === e.currentTarget && !saving && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-[400px] bg-[#0D1C35] border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/15 rounded-full flex items-center justify-center shrink-0">
              <FaGraduationCap className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-playfair text-xl font-bold text-white leading-tight">OTP Verified!</h3>
              <p className="font-montserrat text-[10px] text-gray-500 uppercase tracking-wider">
                Student ID: <span className="text-[#C9A84C]">{regNum}</span>
              </p>
            </div>
          </div>

          <p className="font-montserrat text-gray-400 text-xs mb-7 leading-relaxed mt-3">
            Create a secure password. You will use this for all future logins — OTP will no longer be valid after this step.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* New password */}
            <div>
              <label className="font-montserrat text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2 block">
                New Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                <input
                  type={show1 ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  disabled={saving}
                  className={INPUT}
                />
                <button
                  type="button"
                  onClick={() => setShow1(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
                >
                  {show1 ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="font-montserrat text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2 block">
                Confirm Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                <input
                  type={show2 ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={saving}
                  className={INPUT}
                />
                <button
                  type="button"
                  onClick={() => setShow2(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
                >
                  {show2 ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Strength hint */}
            {password.length > 0 && password.length < 8 && (
              <p className="font-montserrat text-[11px] text-amber-400 -mt-2">
                {8 - password.length} more character{8 - password.length !== 1 ? 's' : ''} needed
              </p>
            )}
            {password.length >= 8 && confirm.length > 0 && password !== confirm && (
              <p className="font-montserrat text-[11px] text-red-400 -mt-2">Passwords do not match</p>
            )}
            {password.length >= 8 && confirm.length >= 8 && password === confirm && (
              <p className="font-montserrat text-[11px] text-emerald-400 -mt-2">Passwords match</p>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 font-montserrat text-xs px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-montserrat text-xs font-semibold uppercase tracking-wider py-3.5 rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#C9A84C] hover:bg-yellow-400 disabled:opacity-60 text-[#0A1628] font-montserrat font-bold text-xs uppercase tracking-[0.12em] py-3.5 rounded-xl shadow-lg shadow-[#C9A84C]/20 transition-all flex items-center justify-center gap-2"
              >
                <FaShieldAlt />
                {saving ? 'Setting up…' : 'Set Password'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
