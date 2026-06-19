import { useState, useEffect } from 'react'
import { MdVerified, MdTimer, MdBlock, MdInfo, MdClose } from 'react-icons/md'
import { FaCheck, FaLock } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { useLicense } from '../../license/LicenseContext'
import { getStoredLicense, saveStoredLicense } from '../../firebase/licenseConfig'
import { formatExpiry } from '../../license/licenseUtils'

const PLAN_LABELS = {
  'basic':      'Basic',
  'premium-s':  'Premium S',
  'premium-m':  'Premium M',
  'premium-l':  'Premium L',
  'premium-xl': 'Premium XL',
}

const FEATURE_LABELS = {
  'web-admin':       'Web Admin — Content Tools',
  'website-content': 'Website Content Editor',
  'student-records': 'Student Records',
  'student-portal':  'Student Self-Service Portal',
  'exeat':           'Exeat Applications',
  'clearance':       'Clearance Forms',
  'teacher-portal':  'Teacher Portal',
  'bursar':          'Bursar & Finance',
}

const STATUS_META = {
  valid:     { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Active',          Icon: MdVerified },
  expired:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   label: 'Expired',         Icon: MdTimer    },
  suspended: { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     label: 'Suspended',       Icon: MdBlock    },
  invalid:   { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     label: 'Invalid Token',   Icon: MdBlock    },
  none:      { bg: 'bg-white/5',        border: 'border-white/10',       text: 'text-gray-400',    label: 'Not Configured',  Icon: MdInfo     },
  loading:   { bg: 'bg-white/5',        border: 'border-white/10',       text: 'text-gray-500',    label: 'Loading…',        Icon: MdInfo     },
}

export default function LicensePage() {
  const { status, licenseData } = useLicense()
  const [token,    setToken]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [noSecret, setNoSecret] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const needsLicense = status !== 'valid' && status !== 'loading'

  useEffect(() => {
    getStoredLicense().then(stored => {
      if (!stored?.secret && !import.meta.env.VITE_LICENSE_SECRET) setNoSecret(true)
    }).catch(() => {
      if (!import.meta.env.VITE_LICENSE_SECRET) setNoSecret(true)
    })
  }, [])

  const handleApply = async () => {
    if (!token.trim()) {
      toast.error('Paste the license token first')
      return
    }

    // Resolve secret: Firestore first, then env var
    let secret = null
    try {
      const stored = await getStoredLicense()
      secret = stored?.secret || null
    } catch { /* ignore */ }
    if (!secret) secret = import.meta.env.VITE_LICENSE_SECRET || null

    if (!secret) {
      toast.error('License secret not configured. Contact Oasis Systems.', { duration: 6000 })
      return
    }

    setSaving(true)
    try {
      await saveStoredLicense({ token: token.trim(), secret })
      toast.success('License applied — reloading…')
      setTimeout(() => window.location.reload(), 1400)
    } catch (e) {
      toast.error('Failed to save: ' + e.message)
      setSaving(false)
      setShowForm(false)
    }
  }

  const sm = STATUS_META[status] || STATUS_META.none
  const StatusIcon = sm.Icon
  const features = Array.isArray(licenseData?.features) ? licenseData.features : []

  return (
    <div className="max-w-2xl space-y-5">

      {/* Current status card */}
      <div className={`rounded-xl border p-5 ${sm.bg} ${sm.border}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-montserrat text-[10px] text-gray-500 uppercase tracking-widest mb-1">License Status</p>
            <p className={`font-bold text-xl font-playfair ${sm.text}`}>{sm.label}</p>
            {licenseData?.schoolName && (
              <p className="text-gray-400 text-sm font-montserrat mt-0.5">{licenseData.schoolName}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {licenseData?.plan && (
                <span className="text-xs font-semibold font-montserrat text-gray-300 bg-white/10 px-2 py-0.5 rounded-full">
                  {PLAN_LABELS[licenseData.plan] || licenseData.plan}
                </span>
              )}
              {licenseData?.maxStudents != null && (
                <span className="text-xs text-gray-500 font-montserrat">
                  Up to {licenseData.maxStudents.toLocaleString()} students
                </span>
              )}
              {licenseData?.exp && (
                <span className="text-xs text-gray-500 font-montserrat">
                  Expires {formatExpiry(licenseData.exp)}
                </span>
              )}
            </div>
          </div>
          <StatusIcon className={`text-4xl shrink-0 ${sm.text}`} />
        </div>
      </div>

      {/* Active features */}
      {features.length > 0 && (
        <div className="bg-navy-800 rounded-xl border border-white/10 p-5">
          <p className="font-montserrat text-[10px] text-gray-500 uppercase tracking-widest mb-3">Included Modules</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {features.map(key => (
              <div key={key} className="flex items-center gap-2.5 py-1.5 px-3 bg-white/5 rounded-lg">
                <span className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <FaCheck className="text-[8px] text-emerald-400" />
                </span>
                <span className="text-xs text-gray-300 font-montserrat">{FEATURE_LABELS[key] || key}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply / upgrade token */}
      <div className="bg-navy-800 rounded-xl border border-white/10 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-playfair text-white font-bold mb-0.5">
              {needsLicense ? 'Apply License Token' : 'Upgrade / Replace License'}
            </h3>
            <p className="font-montserrat text-xs text-gray-500 leading-relaxed">
              {needsLicense
                ? 'Paste the token sent by Oasis Systems and click Apply.'
                : 'Have a new or upgraded token? Paste it below to activate it.'}
            </p>
          </div>
          {!needsLicense && (
            <button
              onClick={() => { setShowForm(v => !v); setToken('') }}
              className="shrink-0 ml-4 text-xs font-semibold font-montserrat text-gold hover:text-[#d4b05a] transition-colors"
            >
              {showForm ? 'Cancel' : 'Apply New Token'}
            </button>
          )}
        </div>

        {(needsLicense || showForm) && (
          <div className="mt-5 space-y-4">
            {noSecret && (
              <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <MdInfo className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-300 text-xs font-montserrat leading-relaxed">
                  License secret not configured. Contact <strong>Oasis Systems</strong> to complete your initial setup before applying tokens.
                </p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 font-montserrat mb-2">
                License Token
              </label>
              <textarea
                rows={4}
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiJ9…"
                spellCheck={false}
                className="w-full bg-white/5 border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl px-4 py-3 text-white font-mono text-xs placeholder-gray-700 transition-all resize-none"
              />
            </div>

            <button
              onClick={handleApply}
              disabled={saving || noSecret || !token.trim()}
              className="w-full py-3 bg-gold hover:bg-[#d4b05a] disabled:opacity-50 text-navy rounded-xl font-bold font-montserrat text-sm transition-all flex items-center justify-center gap-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Applying…' : 'Apply License'}
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
