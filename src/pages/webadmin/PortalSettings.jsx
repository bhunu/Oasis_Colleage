import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { MdAccessTime, MdKey, MdSave } from 'react-icons/md'
import toast from 'react-hot-toast'

const GOLD = '#C9A84C'

const DEFAULTS = {
  sessionTimeoutMinutes: 4,
  otpExpiryHours:        24,
}

function fmtTs(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function SettingsCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-[#0D1C35] border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center shrink-0">
          <Icon className="text-[#C9A84C] text-lg" />
        </div>
        <h3 className="font-playfair font-semibold text-white text-lg">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function PortalSettings() {
  const [values,   setValues]   = useState(DEFAULTS)
  const [meta,     setMeta]     = useState({ updatedAt: null, updatedBy: null })
  const [saving,   setSaving]   = useState({})
  const [loaded,   setLoaded]   = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'portalSettings', 'main'))
      .then(s => {
        if (s.exists()) {
          const data = s.data()
          setValues(prev => ({ ...prev, ...data }))
          setMeta({ updatedAt: data.updatedAt ?? null, updatedBy: data.updatedBy ?? null })
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const save = async (key, value) => {
    setSaving(p => ({ ...p, [key]: true }))
    try {
      const adminName = JSON.parse(sessionStorage.getItem('adminSession') || '{}').name || 'Admin'
      const now       = serverTimestamp()
      await setDoc(doc(db, 'portalSettings', 'main'), {
        [key]: Number(value),
        updatedAt: now,
        updatedBy: adminName,
      }, { merge: true })
      setMeta({ updatedAt: new Date(), updatedBy: adminName })
      toast.success('Setting saved')
    } catch {
      toast.error('Failed to save')
    }
    setSaving(p => ({ ...p, [key]: false }))
  }

  const MetaRow = () => (
    <p className="text-[10px] text-gray-600 font-montserrat mt-4">
      Last updated: <span className="text-gray-500">{fmtTs(meta.updatedAt)}</span>
      {meta.updatedBy && <> · by <span className="text-gray-500">{meta.updatedBy}</span></>}
    </p>
  )

  const FieldRow = ({ label, helper, field, unit, min = 1, max = 9999 }) => (
    <div>
      <label className="block text-sm text-white font-montserrat font-semibold mb-0.5">{label}</label>
      {helper && <p className="text-xs text-gray-500 font-montserrat mb-3">{helper}</p>}
      <div className="flex items-center gap-3">
        <input
          type="number" min={min} max={max}
          value={values[field]}
          onChange={e => setValues(p => ({ ...p, [field]: Number(e.target.value) }))}
          className="w-28 bg-white/5 border border-white/10 focus:border-[#C9A84C]/50 focus:outline-none rounded-xl px-4 py-2.5 text-white font-montserrat text-sm text-right"
        />
        <span className="text-gray-400 font-montserrat text-sm">{unit}</span>
        <button
          onClick={() => save(field, values[field])}
          disabled={saving[field] || !loaded}
          className="ml-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold font-montserrat text-[#0A1628] transition disabled:opacity-50"
          style={{ backgroundColor: GOLD }}
        >
          <MdSave className="text-base" />
          {saving[field] ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )

  if (!loaded) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#0D1C35] border border-white/10 rounded-xl p-6 h-40 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-5">

      {/* Card 1 — Session */}
      <SettingsCard icon={MdAccessTime} title="Student Session Settings">
        <FieldRow
          label="Session timeout"
          helper="Students will be automatically logged out after this many minutes of inactivity. They will be warned 30 seconds before logout."
          field="sessionTimeoutMinutes"
          unit="minutes"
          min={1} max={120}
        />
        <MetaRow />
      </SettingsCard>

      {/* Card 2 — OTP */}
      <SettingsCard icon={MdKey} title="OTP Settings">
        <FieldRow
          label="OTP expiry duration"
          helper="Generated one-time passwords will expire after this many hours. After expiry, students must request a new OTP."
          field="otpExpiryHours"
          unit="hours"
          min={1} max={168}
        />
        <MetaRow />
      </SettingsCard>

    </div>
  )
}
