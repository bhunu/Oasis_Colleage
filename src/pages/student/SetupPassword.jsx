import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc, getDocs, collection, query, where, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import { hashPassword } from '../../utils/hash'
import { FaEye, FaEyeSlash, FaLock, FaGraduationCap } from 'react-icons/fa'
import toast from 'react-hot-toast'

const INPUT = 'w-full bg-white/5 border border-white/10 focus:border-[#C9A84C]/50 focus:outline-none rounded-xl pl-11 pr-12 py-3.5 text-white font-montserrat text-sm placeholder-gray-700 transition-all'

export default function SetupPassword() {
  const navigate        = useNavigate()
  const { studentData } = useStudent()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [show1,     setShow1]     = useState(false)
  const [show2,     setShow2]     = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8)  return setError('Password must be at least 8 characters.')
    if (password !== confirm)  return setError('Passwords do not match.')
    if (!studentData?.studentId) return setError('Session expired. Please log in again.')

    setSaving(true)
    try {
      const snap = await getDocs(
        query(collection(db, 'users'),
          where('studentId',        '==', studentData.studentId),
          where('role',             '==', 'student'),
          where('hasSetupPassword', '==', false),
          limit(1)
        )
      )
      if (snap.empty) throw new Error('Student record not found.')

      await updateDoc(snap.docs[0].ref, {
        password:         hashPassword(password),
        hasSetupPassword: true,
        updatedAt:        serverTimestamp(),
      })

      toast.success('Password set! Welcome to the student portal.')
      navigate('/student/dashboard')
    } catch {
      setError('Failed to set password. Please try again.')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">

        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 bg-[#C9A84C] rounded-full flex items-center justify-center shadow-lg shadow-gold/30">
            <FaGraduationCap className="text-[#0A1628] text-xl" />
          </div>
          <div>
            <div className="font-playfair font-bold text-white text-lg leading-tight">Oasis Private College</div>
            <div className="font-montserrat text-[#C9A84C] text-[10px] uppercase tracking-[0.2em]">Student Portal</div>
          </div>
        </div>

        <div className="bg-[#0D1C35] border border-white/10 rounded-2xl p-8">
          <h2 className="font-playfair text-2xl font-bold text-white mb-1">Set Your Password</h2>
          <p className="font-montserrat text-gray-500 text-xs mb-7 leading-relaxed">
            {studentData?.name ? `Welcome, ${studentData.name.split(' ')[0]}!` : 'Welcome!'} Create a secure password to access your student portal.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="font-montserrat text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2 block">New Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                <input
                  type={show1 ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={INPUT}
                />
                <button type="button" onClick={() => setShow1(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition">
                  {show1 ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-montserrat text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2 block">Confirm Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none" />
                <input
                  type={show2 ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={INPUT}
                />
                <button type="button" onClick={() => setShow2(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition">
                  {show2 ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 font-montserrat text-xs px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-2 bg-[#C9A84C] hover:bg-yellow-400 disabled:opacity-60 text-[#0A1628] font-montserrat font-bold text-xs uppercase tracking-[0.12em] py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {saving ? 'Setting password…' : 'Set Password & Enter Portal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
