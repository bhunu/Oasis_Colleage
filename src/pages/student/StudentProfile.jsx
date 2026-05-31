import { useState } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import toast from 'react-hot-toast'

const INPUT = 'w-full bg-white/5 border border-white/10 focus:border-[#C9A84C]/50 focus:outline-none rounded-xl px-4 py-3 text-white font-montserrat text-sm placeholder-gray-600 transition-all'
const LABEL = 'block text-[10px] font-semibold uppercase tracking-widest text-gray-500 font-montserrat mb-1.5'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'

export default function StudentProfile() {
  const { studentData } = useStudent()
  const [email,     setEmail]     = useState(studentData?.email || '')
  const [phone,     setPhone]     = useState(studentData?.phone || '')
  const [saving,    setSaving]    = useState(false)

  const initials = studentData?.name
    ? studentData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST'

  const handleSave = async () => {
    if (!studentData?.studentId) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'students', studentData.studentId), {
        email:     email.trim(),
        phone:     phone.trim(),
        hasEmail:  email.trim().length > 0,
        updatedAt: serverTimestamp(),
      })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to save')
    }
    setSaving(false)
  }

  const FIELD = (label, value) => (
    <div>
      <label className={LABEL}>{label}</label>
      <p className="text-sm text-gray-300 font-montserrat bg-white/5 border border-white/10 rounded-xl px-4 py-3">
        {value || '—'}
      </p>
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Avatar + name */}
      <div className={CARD}>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-[#C9A84C] rounded-full flex items-center justify-center shrink-0">
            <span className="text-[#0A1628] font-bold text-xl font-montserrat">{initials}</span>
          </div>
          <div>
            <h2 className="font-playfair text-xl font-bold text-white">{studentData?.name || 'Student'}</h2>
            <p className="text-sm text-gray-400 font-montserrat">{studentData?.class} · {studentData?.regNumber}</p>
          </div>
        </div>
      </div>

      {/* Read-only fields */}
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-5">Academic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          {FIELD('Full Name',          studentData?.name)}
          {FIELD('Registration No.',   studentData?.regNumber)}
          {FIELD('Class',              studentData?.class)}
          {FIELD('Date of Birth',      studentData?.dateOfBirth)}
          {FIELD('Guardian Name',      studentData?.guardianName)}
          {FIELD('Guardian Phone',     studentData?.guardianPhone)}
        </div>
      </div>

      {/* Editable contact fields */}
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-5">Contact Information</h3>
        <p className="text-xs text-gray-500 font-montserrat mb-4">
          You can update your personal email and phone number. These are used for portal notifications.
        </p>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={LABEL}>Personal Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Personal Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+263 77 000 0000"
              className={INPUT}
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 px-6 py-3 rounded-xl text-sm font-semibold font-montserrat text-[#0A1628] bg-[#C9A84C] hover:bg-yellow-400 transition disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
