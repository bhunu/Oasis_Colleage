import { useState, useEffect, useCallback } from 'react'
import {
  FaGraduationCap, FaPlus, FaCopy, FaCheck, FaKey,
  FaSchool, FaToggleOn, FaToggleOff, FaSync,
  FaUserGraduate, FaChalkboardTeacher, FaMoneyCheckAlt, FaLock,
} from 'react-icons/fa'
import {
  MdVerified, MdWarning, MdBlock, MdTimer, MdInfo,
  MdClose, MdContentCopy, MdSchool, MdDateRange,
  MdPeople, MdEmail, MdPhone, MdAdminPanelSettings,
  MdWebAsset, MdReceiptLong, MdSubdirectoryArrowRight,
} from 'react-icons/md'
import toast from 'react-hot-toast'
import { signLicense, daysUntilExpiry, formatExpiry, expiryFromDate } from '../../license/licenseUtils'
import { useLicense } from '../../license/LicenseContext'
import {
  getLicenses, addLicense, updateLicense,
  suspendLicense, reactivateLicense,
} from '../../firebase/licenses'
import { getStoredLicense, saveStoredLicense } from '../../firebase/licenseConfig'

// ── Plans ─────────────────────────────────────────────────────────────────────
const PLANS = [
  { value: 'basic',      label: 'Basic',      desc: 'Website + content tools',  max: null, tier: 1 },
  { value: 'premium-s',  label: 'Premium S',  desc: 'Up to 150 students',       max: 150,  tier: 2 },
  { value: 'premium-m',  label: 'Premium M',  desc: 'Up to 300 students',       max: 300,  tier: 2 },
  { value: 'premium-l',  label: 'Premium L',  desc: 'Up to 500 students',       max: 500,  tier: 2 },
  { value: 'premium-xl', label: 'Premium XL', desc: 'Unlimited students',       max: null, tier: 2 },
]

// ── Feature groups ────────────────────────────────────────────────────────────
const FEATURE_GROUPS = [
  {
    key:    'web-admin',
    label:  'Web Admin — Content Tools',
    desc:   'Dashboard · News · Events · Gallery · Staff profiles',
    icon:   MdAdminPanelSettings,
    always: true,
    tier:   1,
    children: [
      { key: 'website-content', label: 'Website Content Editor', desc: 'Edit homepage, about, admissions & campus life pages from the admin panel' },
    ],
  },
  {
    key:      'student-records',
    label:    'Student Records',
    desc:     'Enrolment, results, fees, access passes and student data management',
    icon:     MdPeople,
    tier:     2,
    children: [],
  },
  {
    key:      'student-portal',
    label:    'Student Self-Service Portal',
    desc:     'Students log in to view results, fees, notifications and more',
    icon:     FaUserGraduate,
    tier:     2,
    children: [
      { key: 'exeat',     label: 'Exeat Applications', desc: 'Students submit leave / exeat requests online' },
      { key: 'clearance', label: 'Clearance Forms',    desc: 'Digital clearance application submissions'    },
    ],
  },
  {
    key:      'teacher-portal',
    label:    'Teacher Portal',
    desc:     'Attendance tracking, timetable, class materials & performance',
    icon:     FaChalkboardTeacher,
    tier:     2,
    children: [],
  },
  {
    key:      'bursar',
    label:    'Bursar & Finance',
    desc:     'Payment collection, expenses, receipts and financial reports',
    icon:     FaMoneyCheckAlt,
    tier:     2,
    children: [],
  },
]

// Flat key lists — used to auto-populate features when a plan is selected
const ALL_FEATURE_KEYS   = FEATURE_GROUPS.flatMap(g => [g.key, ...g.children.map(c => c.key)])
const BASIC_FEATURE_KEYS = FEATURE_GROUPS.filter(g => g.tier === 1).flatMap(g => [g.key, ...g.children.map(c => c.key)])

const STATUS_META = {
  active:    { label: 'Active',    dot: 'bg-emerald-400', text: 'text-emerald-300', icon: MdVerified  },
  expired:   { label: 'Expired',   dot: 'bg-amber-400',   text: 'text-amber-300',  icon: MdTimer     },
  suspended: { label: 'Suspended', dot: 'bg-red-400',     text: 'text-red-400',    icon: MdBlock     },
}

function getTokenStatus(lic) {
  if (lic.status === 'suspended') return 'suspended'
  const days = daysUntilExpiry(lic.expiresAt)
  if (days !== null && days < 0) return 'expired'
  return 'active'
}

// ── small helpers ────────────────────────────────────────────────────────────
function StatusBadge({ lic }) {
  const st   = getTokenStatus(lic)
  const meta = STATUS_META[st] || STATUS_META.active
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

function DaysChip({ lic }) {
  const days = daysUntilExpiry(lic.expiresAt)
  if (days === null) return <span className="text-gray-500 text-xs">No expiry</span>
  if (days < 0)     return <span className="text-amber-400 text-xs">Expired {Math.abs(days)}d ago</span>
  if (days <= 30)   return <span className="text-amber-400 text-xs font-semibold">{days}d left ⚠</span>
  return <span className="text-gray-400 text-xs">{days}d left</span>
}

function CopyButton({ text, size = 'sm' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => toast.error('Copy failed — select and copy manually'))
  }
  return (
    <button onClick={copy}
      className={`flex items-center gap-1.5 ${size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
        rounded-lg font-medium transition-all
        ${copied
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          : 'bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20'}`}>
      {copied ? <FaCheck className="text-xs" /> : <FaCopy className="text-xs" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ── Stat cards row ───────────────────────────────────────────────────────────
function StatsRow({ licenses }) {
  const active    = licenses.filter(l => getTokenStatus(l) === 'active').length
  const expiring  = licenses.filter(l => { const d = daysUntilExpiry(l.expiresAt); return d !== null && d >= 0 && d <= 30 }).length
  const expired   = licenses.filter(l => getTokenStatus(l) === 'expired').length
  const suspended = licenses.filter(l => getTokenStatus(l) === 'suspended').length

  const cards = [
    { label: 'Total Schools',   value: licenses.length, color: 'text-blue-300',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
    { label: 'Active',          value: active,           color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Expiring ≤30d',   value: expiring,         color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
    { label: 'Expired',         value: expired,          color: 'text-red-300',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
    { label: 'Suspended',       value: suspended,        color: 'text-gray-400',    bg: 'bg-gray-500/10',    border: 'border-gray-500/20'    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-4`}>
          <p className={`text-2xl font-bold font-playfair ${c.color}`}>{c.value}</p>
          <p className="text-gray-500 text-xs mt-0.5 font-montserrat">{c.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── License card ─────────────────────────────────────────────────────────────
function LicenseCard({ lic, onViewToken, onSuspend, onReactivate, onRenew, onUpgrade }) {
  const st = getTokenStatus(lic)
  return (
    <div className="bg-navy-800 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center shrink-0">
            <MdSchool className="text-gold" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate font-playfair">{lic.schoolName}</p>
            <p className="text-gray-500 text-xs font-montserrat truncate">{lic.schoolId}</p>
          </div>
        </div>
        <StatusBadge lic={lic} />
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-400 font-montserrat">
        <div>
          <span className="text-gray-600 block">Plan</span>
          <span className="text-gray-200">{PLANS.find(p => p.value === lic.plan)?.label || lic.plan}</span>
        </div>
        <div>
          <span className="text-gray-600 block">Max Students</span>
          <span className="text-gray-200">{lic.maxStudents?.toLocaleString() || '—'}</span>
        </div>
        <div>
          <span className="text-gray-600 block">Expiry</span>
          <span className="text-gray-200">{formatExpiry(lic.expiresAt)}</span>
        </div>
        <div>
          <span className="text-gray-600 block">Remaining</span>
          <DaysChip lic={lic} />
        </div>
      </div>

      {lic.contactEmail && (
        <p className="text-gray-500 text-xs mb-3 truncate font-montserrat">
          <MdEmail className="inline mr-1" />{lic.contactEmail}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
        <button onClick={() => onViewToken(lic)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gold/10 text-gold border border-gold/20 rounded-lg text-xs font-medium hover:bg-gold/20 transition-all font-montserrat">
          <FaKey className="text-[10px]" /> Token
        </button>
        <button onClick={() => onRenew(lic)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-all font-montserrat">
          <FaSync className="text-[10px]" /> Renew
        </button>
        <button onClick={() => onUpgrade(lic)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-lg text-xs font-medium hover:bg-violet-500/20 transition-all font-montserrat">
          <FaGraduationCap className="text-[10px]" /> Plan
        </button>
        {st === 'suspended'
          ? (
            <button onClick={() => onReactivate(lic)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-all font-montserrat">
              <FaToggleOn className="text-[10px]" /> Reactivate
            </button>
          ) : (
            <button onClick={() => onSuspend(lic)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-all font-montserrat">
              <FaToggleOff className="text-[10px]" /> Suspend
            </button>
          )
        }
      </div>
    </div>
  )
}

// ── Issue License Form ───────────────────────────────────────────────────────
function IssueForm({ onClose, onIssued }) {
  const secret = import.meta.env.VITE_SUPER_ADMIN_SECRET

  const oneYearFromNow = () => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split('T')[0]
  }

  const [form, setForm] = useState({
    schoolName:   '',
    schoolId:     '',
    contactEmail: '',
    contactPhone: '',
    plan:         'basic',
    expiryDate:   oneYearFromNow(),
    features:     BASIC_FEATURE_KEYS,
    notes:        '',
  })
  const [token,      setToken]      = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving,     setSaving]     = useState(false)

  const selectedPlan = PLANS.find(p => p.value === form.plan) || PLANS[0]
  const isBasicPlan  = selectedPlan.tier === 1

  // Any key change that affects the token payload clears the generated token
  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (['schoolName', 'schoolId', 'plan', 'expiryDate'].includes(k)) setToken('')
  }

  // Selecting a plan auto-populates the correct feature set
  const selectPlan = (planValue) => {
    const plan = PLANS.find(p => p.value === planValue)
    setForm(f => ({
      ...f,
      plan:     planValue,
      features: plan?.tier === 1 ? BASIC_FEATURE_KEYS : ALL_FEATURE_KEYS,
    }))
    setToken('')
  }

  // Toggle a parent group — cascades to all its children
  const toggleGroup = (groupKey) => {
    const group = FEATURE_GROUPS.find(g => g.key === groupKey)
    if (group?.always) return
    const childKeys = group?.children.map(c => c.key) || []
    const isOn = form.features.includes(groupKey)
    setToken('') // features changed — old token is stale
    if (isOn) {
      set('features', form.features.filter(k => k !== groupKey && !childKeys.includes(k)))
    } else {
      set('features', [...new Set([...form.features, groupKey, ...childKeys])])
    }
  }

  // Toggle a child — only works when its parent is checked
  const toggleChild = (parentKey, childKey) => {
    if (!form.features.includes(parentKey)) return
    const isOn = form.features.includes(childKey)
    setToken('') // features changed — old token is stale
    set('features', isOn
      ? form.features.filter(k => k !== childKey)
      : [...form.features, childKey])
  }

  const resolvedSchoolId = () => {
    if (form.schoolId) return form.schoolId
    return form.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      || 'school-' + Date.now().toString(36)
  }

  const autoId = () => {
    const slug = form.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (slug) set('schoolId', slug)
  }

  const generateToken = async () => {
    if (!form.schoolName || !form.expiryDate) {
      toast.error('School name and expiry date are required')
      return
    }
    if (!secret) {
      toast.error('VITE_SUPER_ADMIN_SECRET is not set in .env')
      return
    }
    setGenerating(true)
    try {
      const payload = {
        schoolId:     resolvedSchoolId(),
        schoolName:   form.schoolName,
        contactEmail: form.contactEmail,
        plan:         form.plan,
        maxStudents:  selectedPlan.max,
        features:     form.features,
        iss:          'OasisSystems',
        iat:          Math.floor(Date.now() / 1000),
        exp:          expiryFromDate(form.expiryDate + 'T23:59:59'),
      }
      const jwt = await signLicense(payload, secret)
      setToken(jwt)
      toast.success('Token generated')
    } catch (err) {
      toast.error('Failed to generate token: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const saveAndClose = async () => {
    if (!token) { toast.error('Generate the token first'); return }
    setSaving(true)
    try {
      await addLicense({
        schoolId:     form.schoolId,
        schoolName:   form.schoolName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        plan:         form.plan,
        maxStudents:  selectedPlan.max,
        features:     form.features,
        expiresAt:    expiryFromDate(form.expiryDate + 'T23:59:59'),
        notes:        form.notes,
        token,
      })
      toast.success(`License for ${form.schoolName} saved`)
      onIssued()
    } catch (err) {
      toast.error('Firestore error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-navy-800 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center">
              <FaPlus className="text-gold text-sm" />
            </div>
            <div>
              <h2 className="text-white font-bold font-playfair">Issue New License</h2>
              <p className="text-gray-500 text-xs font-montserrat">Generate a JWT token for a school deployment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-white transition">
            <MdClose className="text-lg" />
          </button>
        </div>

        <div className="p-6 space-y-5 font-montserrat">
          {/* School details */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-3">School Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">School Name *</label>
                <input
                  value={form.schoolName}
                  onChange={e => set('schoolName', e.target.value)}
                  onBlur={autoId}
                  placeholder="e.g. Sunrise Academy"
                  className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">School ID (auto-generated)</label>
                <input
                  value={form.schoolId}
                  onChange={e => set('schoolId', e.target.value)}
                  placeholder="sunrise-academy"
                  className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Contact Email</label>
                <input
                  value={form.contactEmail}
                  onChange={e => set('contactEmail', e.target.value)}
                  type="email"
                  placeholder="admin@school.ac.zw"
                  className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Contact Phone</label>
                <input
                  value={form.contactPhone}
                  onChange={e => set('contactPhone', e.target.value)}
                  placeholder="+263..."
                  className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/50"
                />
              </div>
            </div>
          </section>

          {/* Plan */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-3">Plan</p>

            {/* Tier 1 — Basic */}
            <div className="mb-2">
              <p className="text-[9px] text-gray-700 uppercase tracking-widest font-semibold mb-1.5 font-montserrat pl-1">Tier 1</p>
              {PLANS.filter(p => p.tier === 1).map(plan => (
                <button key={plan.value} type="button" onClick={() => selectPlan(plan.value)}
                  className={`w-full rounded-xl p-3 text-left border transition-all ${
                    form.plan === plan.value
                      ? 'bg-gold/10 border-gold/40 text-gold'
                      : 'bg-navy border-white/10 text-gray-400 hover:border-white/20'
                  }`}>
                  <p className="font-semibold text-sm">{plan.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{plan.desc}</p>
                </button>
              ))}
            </div>

            {/* Tier 2 — Premium */}
            <div>
              <p className="text-[9px] text-gray-700 uppercase tracking-widest font-semibold mb-1.5 font-montserrat pl-1">Tier 2 — All portals included</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLANS.filter(p => p.tier === 2).map(plan => (
                  <button key={plan.value} type="button" onClick={() => selectPlan(plan.value)}
                    className={`rounded-xl p-3 text-left border transition-all ${
                      form.plan === plan.value
                        ? 'bg-gold/10 border-gold/40 text-gold'
                        : 'bg-navy border-white/10 text-gray-400 hover:border-white/20'
                    }`}>
                    <p className="font-semibold text-sm">{plan.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{plan.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Expiry */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-3">License Expiry</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Expiry Date *</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={e => set('expiryDate', e.target.value)}
                  className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50 [color-scheme:dark]"
                />
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Modules & Features</p>
              {isBasicPlan
                ? <span className="text-[10px] text-blue-400 font-semibold font-montserrat">Basic — content tools only</span>
                : <span className="text-[10px] text-gray-600">{form.features.length} / {ALL_FEATURE_KEYS.length} selected</span>
              }
            </div>
            <div className="space-y-2">
              {FEATURE_GROUPS.map(group => {
                const Icon        = group.icon
                const isLockedOut = isBasicPlan && group.tier === 2
                const groupOn     = isLockedOut ? false : form.features.includes(group.key)
                const isAlways    = group.always
                const parentDisabled = (!groupOn && !isAlways) || isLockedOut

                return (
                  <div key={group.key} className={isLockedOut ? 'opacity-40' : ''}>
                    {/* Parent row */}
                    <div
                      onClick={() => !isLockedOut && toggleGroup(group.key)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                        ${isLockedOut
                          ? 'bg-navy border-white/5 cursor-not-allowed'
                          : isAlways
                            ? 'bg-gold/10 border-gold/30 cursor-default'
                            : groupOn
                              ? 'bg-gold/10 border-gold/30 cursor-pointer hover:bg-gold/15'
                              : 'bg-navy border-white/10 cursor-pointer hover:border-white/20'
                        }`}>
                      {/* Checkbox */}
                      <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        groupOn || isAlways ? 'bg-gold border-gold' : 'border-gray-600'
                      }`}>
                        {(groupOn || isAlways) && <FaCheck className="text-[9px] text-navy" />}
                      </span>
                      {/* Icon */}
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        groupOn || isAlways ? 'bg-gold/20' : 'bg-white/5'
                      }`}>
                        <Icon className={`text-sm ${groupOn || isAlways ? 'text-gold' : 'text-gray-500'}`} />
                      </span>
                      {/* Label + desc */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold ${groupOn || isAlways ? 'text-gold' : 'text-gray-400'}`}>
                            {group.label}
                          </span>
                          {isAlways && (
                            <span className="flex items-center gap-1 text-[9px] bg-gold/20 text-gold px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                              <FaLock className="text-[7px]" /> Always
                            </span>
                          )}
                          {isLockedOut && (
                            <span className="flex items-center gap-1 text-[9px] bg-white/5 text-gray-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                              <FaLock className="text-[7px]" /> Premium only
                            </span>
                          )}
                          {!isLockedOut && !isAlways && group.tier === 2 && (
                            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                              Premium
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${groupOn || isAlways ? 'text-gold/60' : 'text-gray-600'}`}>
                          {group.desc}
                        </p>
                      </div>
                    </div>

                    {/* Children (indented) */}
                    {group.children.length > 0 && (
                      <div className={`ml-4 mt-1 space-y-1 transition-opacity ${parentDisabled ? 'opacity-30 pointer-events-none' : ''}`}>
                        {group.children.map(child => {
                          const childOn = !isLockedOut && form.features.includes(child.key)
                          return (
                            <div key={child.key}
                              onClick={() => !isLockedOut && toggleChild(group.key, child.key)}
                              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all
                                ${isLockedOut ? 'cursor-not-allowed' : 'cursor-pointer'}
                                ${childOn
                                  ? 'bg-emerald-500/10 border-emerald-500/20'
                                  : 'bg-navy border-white/5 hover:border-white/15'
                                }`}>
                              <MdSubdirectoryArrowRight className="text-gray-600 text-sm shrink-0" />
                              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                childOn ? 'bg-emerald-500 border-emerald-500' : 'border-gray-700'
                              }`}>
                                {childOn && <FaCheck className="text-[7px] text-white" />}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className={`text-xs font-medium ${childOn ? 'text-emerald-300' : 'text-gray-500'}`}>
                                  {child.label}
                                </span>
                                <p className="text-[10px] text-gray-600 mt-0.5">{child.desc}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Notes */}
          <section>
            <label className="text-gray-400 text-xs mb-1 block">Internal Notes (not in token)</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Payment reference, deployment server, etc."
              className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/50 resize-none"
            />
          </section>

          {/* Secret warning */}
          {!secret && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <MdWarning className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-300 text-xs">
                <strong>VITE_SUPER_ADMIN_SECRET</strong> is not set in your .env file. Add it before generating tokens.
              </p>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generateToken}
            disabled={generating || !secret}
            className="w-full py-2.5 bg-gold text-navy rounded-lg font-bold text-sm hover:bg-[#d4b05a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {generating
              ? <><div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" /> Generating…</>
              : <><FaKey /> Generate Token</>}
          </button>

          {/* Token output */}
          {token && (
            <section className="bg-navy border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <MdVerified /> Token Generated
                </p>
                <CopyButton text={token} />
              </div>
              <textarea
                readOnly
                value={token}
                rows={4}
                className="w-full bg-transparent text-gray-400 text-xs font-mono resize-none focus:outline-none break-all"
              />
              <div className="mt-3 border-t border-white/5 pt-3">
                <p className="text-gray-600 text-xs font-semibold mb-1.5">Deployment instructions:</p>
                <div className="space-y-1 text-gray-600 text-xs">
                  <p>1. Add to the school's <code className="text-gray-400">.env</code> file:</p>
                  <div className="bg-black/30 rounded-lg p-2 font-mono text-gray-400 text-[10px] leading-relaxed">
                    <p>VITE_LICENSE_TOKEN={token.substring(0, 30)}…</p>
                    <p>VITE_LICENSE_SECRET=&lt;your VITE_SUPER_ADMIN_SECRET&gt;</p>
                    <p>VITE_IS_DEVELOPER_INSTANCE=</p>
                  </div>
                  <p className="mt-1">2. Rebuild and redeploy the school's app.</p>
                </div>
              </div>
            </section>
          )}

          {/* Save to Firestore */}
          <div className="flex gap-3 pt-2 border-t border-white/10">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 text-gray-300 rounded-lg font-medium text-sm hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button onClick={saveAndClose} disabled={!token || saving}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                : 'Save License Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Token Viewer Modal ───────────────────────────────────────────────────────
function TokenModal({ lic, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl font-montserrat">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-bold font-playfair">{lic.schoolName}</h3>
            <p className="text-gray-500 text-xs mt-0.5">License Token</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-white transition">
            <MdClose className="text-lg" />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs">JWT Token (HS256)</p>
            <CopyButton text={lic.token || ''} />
          </div>
          <textarea
            readOnly
            value={lic.token || '(token not stored)'}
            rows={5}
            className="w-full bg-navy border border-white/10 rounded-lg p-3 text-gray-400 text-xs font-mono resize-none focus:outline-none"
          />
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-400">
            <div><span className="text-gray-600">Expires</span><br/><span className="text-gray-200">{formatExpiry(lic.expiresAt)}</span></div>
            <div><span className="text-gray-600">Plan</span><br/><span className="text-gray-200 capitalize">{lic.plan}</span></div>
            <div><span className="text-gray-600">Max Students</span><br/><span className="text-gray-200">{lic.maxStudents?.toLocaleString()}</span></div>
            <div><span className="text-gray-600">Status</span><br/><StatusBadge lic={lic} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Upgrade Modal ────────────────────────────────────────────────────────────
function UpgradeModal({ lic, onClose, onUpgraded }) {
  const secret = import.meta.env.VITE_SUPER_ADMIN_SECRET

  const [selectedPlanValue, setSelectedPlanValue] = useState(lic.plan)
  const [token,      setToken]      = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving,     setSaving]     = useState(false)

  const newPlan     = PLANS.find(p => p.value === selectedPlanValue) || PLANS[0]
  const currentPlan = PLANS.find(p => p.value === lic.plan)
  const isBasic     = newPlan.tier === 1
  const newFeatures = isBasic ? BASIC_FEATURE_KEYS : ALL_FEATURE_KEYS

  const handleSelectPlan = (value) => {
    setSelectedPlanValue(value)
    setToken('') // plan changed — old token stale
  }

  const generateUpgrade = async () => {
    if (!secret) { toast.error('VITE_SUPER_ADMIN_SECRET not set'); return }
    setGenerating(true)
    try {
      const payload = {
        schoolId:     lic.schoolId,
        schoolName:   lic.schoolName,
        contactEmail: lic.contactEmail,
        plan:         newPlan.value,
        maxStudents:  newPlan.max,
        features:     newFeatures,
        iss:          'OasisSystems',
        iat:          Math.floor(Date.now() / 1000),
        exp:          lic.expiresAt, // keep existing expiry
      }
      setToken(await signLicense(payload, secret))
      toast.success('Upgrade token generated')
    } catch (e) {
      toast.error('Failed: ' + e.message)
    } finally {
      setGenerating(false)
    }
  }

  const saveUpgrade = async () => {
    if (!token) { toast.error('Generate the upgrade token first'); return }
    setSaving(true)
    try {
      await updateLicense(lic.id, {
        plan:        newPlan.value,
        maxStudents: newPlan.max,
        features:    newFeatures,
        token,
        upgradedAt:  Math.floor(Date.now() / 1000),
      })
      toast.success(`${lic.schoolName} upgraded to ${newPlan.label}`)
      onUpgraded()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl font-montserrat max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-navy-800 z-10">
          <div>
            <h3 className="text-white font-bold font-playfair">Change Plan</h3>
            <p className="text-gray-500 text-xs">{lic.schoolName} · currently on <span className="text-gold">{currentPlan?.label || lic.plan}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-white transition">
            <MdClose className="text-lg" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Tier 1 */}
          <div>
            <p className="text-[9px] text-gray-700 uppercase tracking-widest font-semibold mb-1.5 pl-1">Tier 1</p>
            {PLANS.filter(p => p.tier === 1).map(plan => (
              <button key={plan.value} type="button" onClick={() => handleSelectPlan(plan.value)}
                className={`w-full rounded-xl p-3 text-left border transition-all ${
                  selectedPlanValue === plan.value
                    ? 'bg-gold/10 border-gold/40 text-gold'
                    : 'bg-navy border-white/10 text-gray-400 hover:border-white/20'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{plan.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{plan.desc}</p>
                  </div>
                  {lic.plan === plan.value && (
                    <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">Current</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Tier 2 */}
          <div>
            <p className="text-[9px] text-gray-700 uppercase tracking-widest font-semibold mb-1.5 pl-1">Tier 2 — All portals included</p>
            <div className="grid grid-cols-2 gap-2">
              {PLANS.filter(p => p.tier === 2).map(plan => (
                <button key={plan.value} type="button" onClick={() => handleSelectPlan(plan.value)}
                  className={`rounded-xl p-3 text-left border transition-all ${
                    selectedPlanValue === plan.value
                      ? 'bg-gold/10 border-gold/40 text-gold'
                      : 'bg-navy border-white/10 text-gray-400 hover:border-white/20'
                  }`}>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <p className="font-semibold text-sm">{plan.label}</p>
                    {lic.plan === plan.value && (
                      <span className="text-[10px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded-full">Current</span>
                    )}
                  </div>
                  <p className="text-xs opacity-70 mt-0.5">{plan.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Summary of change */}
          {selectedPlanValue !== lic.plan && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 font-montserrat">
              <p className="font-semibold mb-1">Plan change summary</p>
              <p className="text-blue-400/70">
                {currentPlan?.label || lic.plan} → {newPlan.label}
                {newPlan.max ? ` · ${newPlan.max} student limit` : ' · Unlimited students'}
              </p>
              {isBasic && !PLANS.find(p => p.value === lic.plan)?.tier === 1 && (
                <p className="text-amber-400 mt-1">⚠ Downgrade — portal access will be removed</p>
              )}
            </div>
          )}

          <button onClick={generateUpgrade} disabled={generating || !secret || selectedPlanValue === lic.plan}
            className="w-full py-2.5 bg-gold text-navy rounded-lg font-bold text-sm hover:bg-[#d4b05a] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {generating
              ? <><div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />Generating…</>
              : <><FaKey />Generate Upgrade Token</>
            }
          </button>

          {token && (
            <div className="bg-navy border border-emerald-500/20 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-emerald-400 text-xs font-semibold">New Token</p>
                <CopyButton text={token} />
              </div>
              <textarea readOnly value={token} rows={3}
                className="w-full bg-transparent text-gray-500 text-[10px] font-mono resize-none focus:outline-none break-all" />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-white/5 text-gray-300 rounded-lg font-medium text-sm hover:bg-white/10 transition-all">Cancel</button>
            <button onClick={saveUpgrade} disabled={!token || saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Save Upgrade
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Renew Modal ──────────────────────────────────────────────────────────────
function RenewModal({ lic, onClose, onRenewed }) {
  const secret = import.meta.env.VITE_SUPER_ADMIN_SECRET
  const oneYearFromNow = () => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split('T')[0]
  }
  const [expiryDate,  setExpiryDate]  = useState(oneYearFromNow())
  const [token,       setToken]       = useState('')
  const [generating,  setGenerating]  = useState(false)
  const [saving,      setSaving]      = useState(false)

  const generateRenewal = async () => {
    if (!expiryDate) { toast.error('Select a new expiry date'); return }
    if (!secret) { toast.error('VITE_SUPER_ADMIN_SECRET not set'); return }
    setGenerating(true)
    try {
      const payload = {
        schoolId:     lic.schoolId,
        schoolName:   lic.schoolName,
        contactEmail: lic.contactEmail,
        plan:         lic.plan,
        maxStudents:  lic.maxStudents,
        features:     lic.features || [],
        iss:          'OasisSystems',
        iat:          Math.floor(Date.now() / 1000),
        exp:          expiryFromDate(expiryDate + 'T23:59:59'),
      }
      setToken(await signLicense(payload, secret))
      toast.success('Renewal token generated')
    } catch (e) {
      toast.error('Failed: ' + e.message)
    } finally {
      setGenerating(false)
    }
  }

  const saveRenewal = async () => {
    if (!token) { toast.error('Generate the renewal token first'); return }
    setSaving(true)
    try {
      await updateLicense(lic.id, {
        expiresAt: expiryFromDate(expiryDate + 'T23:59:59'),
        status:    'active',
        token,
        renewedAt: Math.floor(Date.now() / 1000),
      })
      toast.success('License renewed')
      onRenewed()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl font-montserrat">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-bold font-playfair">Renew License</h3>
            <p className="text-gray-500 text-xs">{lic.schoolName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-white transition"><MdClose className="text-lg" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">New Expiry Date</label>
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
              className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50 [color-scheme:dark]" />
          </div>
          <button onClick={generateRenewal} disabled={generating || !secret}
            className="w-full py-2.5 bg-gold text-navy rounded-lg font-bold text-sm hover:bg-[#d4b05a] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {generating ? <><div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />Generating…</> : <><FaKey />Generate Renewal Token</>}
          </button>
          {token && (
            <div className="bg-navy border border-emerald-500/20 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-emerald-400 text-xs font-semibold">New Token</p>
                <CopyButton text={token} />
              </div>
              <textarea readOnly value={token} rows={3}
                className="w-full bg-transparent text-gray-500 text-[10px] font-mono resize-none focus:outline-none break-all" />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-white/5 text-gray-300 rounded-lg font-medium text-sm hover:bg-white/10 transition-all">Cancel</button>
            <button onClick={saveRenewal} disabled={!token || saving}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Save Renewal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Settings section ─────────────────────────────────────────────────────────
function SettingsSection() {
  const secret = import.meta.env.VITE_SUPER_ADMIN_SECRET || ''
  const [show, setShow] = useState(false)
  return (
    <div className="bg-navy-800 border border-white/10 rounded-xl p-5 font-montserrat">
      <div className="flex items-center gap-2 mb-4">
        <MdInfo className="text-gold" />
        <h3 className="text-white font-semibold font-playfair">Deployment Reference</h3>
      </div>
      <div className="space-y-3 text-sm">
        <div className="bg-navy rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-gray-400 text-xs">Signing Secret (VITE_SUPER_ADMIN_SECRET)</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setShow(s => !s)} className="text-gray-500 hover:text-gray-300 text-xs transition">
                {show ? 'Hide' : 'Show'}
              </button>
              {secret && <CopyButton text={secret} />}
            </div>
          </div>
          <p className={`font-mono text-xs break-all ${show ? 'text-gray-300' : 'text-gray-700 select-none'}`}>
            {show ? (secret || '(not set)') : '•'.repeat(Math.max(secret.length, 20))}
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p className="text-amber-400 text-xs font-semibold mb-1">School deployment .env template</p>
          <pre className="text-gray-400 text-[10px] font-mono leading-relaxed">{
`VITE_LICENSE_TOKEN=<paste generated token>
VITE_LICENSE_SECRET=<copy value above>
VITE_IS_DEVELOPER_INSTANCE=
VITE_SCHOOL_NAME=<school name>
VITE_DEVELOPER_NAME=Oasis Systems
VITE_DEVELOPER_EMAIL=mabhunure@gmail.com`
          }</pre>
        </div>
      </div>
    </div>
  )
}

// ── This School section ──────────────────────────────────────────────────────
function ThisSchoolSection() {
  const { status, licenseData } = useLicense()
  const [token,   setToken]   = useState('')
  const [secret,  setSecret]  = useState(import.meta.env.VITE_LICENSE_SECRET || '')
  const [showSec, setShowSec] = useState(false)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    getStoredLicense().then(stored => {
      if (stored?.token)  setToken(stored.token)
      if (stored?.secret) setSecret(stored.secret)
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!token.trim() || !secret.trim()) {
      toast.error('Both token and secret are required')
      return
    }
    setSaving(true)
    try {
      await saveStoredLicense({ token: token.trim(), secret: secret.trim() })
      toast.success('License saved — reloading to apply…')
      setTimeout(() => window.location.reload(), 1400)
    } catch (e) {
      toast.error('Save failed: ' + e.message)
      setSaving(false)
    }
  }

  const statusMeta = {
    valid:     { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Active',         Icon: MdVerified },
    expired:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   label: 'Expired',        Icon: MdTimer    },
    suspended: { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     label: 'Suspended',      Icon: MdBlock    },
    invalid:   { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     label: 'Invalid Token',  Icon: MdBlock    },
    none:      { bg: 'bg-white/5',        border: 'border-white/10',       text: 'text-gray-400',    label: 'Not Configured', Icon: MdInfo     },
    loading:   { bg: 'bg-white/5',        border: 'border-white/10',       text: 'text-gray-500',    label: 'Loading…',       Icon: MdInfo     },
  }
  const sm = statusMeta[status] || statusMeta.none
  const StatusIcon = sm.Icon

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Current status */}
      <div className={`rounded-xl border p-5 ${sm.bg} ${sm.border}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-montserrat text-[10px] text-gray-500 uppercase tracking-widest mb-1">Current License</p>
            <p className={`font-bold text-lg font-playfair ${sm.text}`}>{sm.label}</p>
            {licenseData?.schoolName && (
              <p className="text-gray-400 text-sm font-montserrat mt-0.5">
                {licenseData.schoolName}
                {licenseData.plan && <span className="text-gray-600"> · {licenseData.plan}</span>}
              </p>
            )}
            {licenseData?.exp && (
              <p className="text-gray-500 text-xs font-montserrat mt-0.5">Expires: {formatExpiry(licenseData.exp)}</p>
            )}
          </div>
          <StatusIcon className={`text-3xl shrink-0 ${sm.text}`} />
        </div>
      </div>

      {/* Paste form */}
      <div className="bg-navy-800 rounded-xl border border-white/10 p-5">
        <h3 className="font-playfair text-white font-bold mb-1">Paste License</h3>
        <p className="font-montserrat text-xs text-gray-500 mb-5 leading-relaxed">
          Paste the JWT token and secret issued from the Schools tab. After saving the page reloads
          and the new license activates immediately — no rebuild needed.
        </p>

        <div className="space-y-4">
          {/* Token */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 font-montserrat mb-2">
              License Token (JWT)
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

          {/* Secret */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 font-montserrat mb-2">
              License Secret
            </label>
            <div className="relative">
              <input
                type={showSec ? 'text' : 'password'}
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="OasisSystems-Zim-License-Key-…"
                spellCheck={false}
                className="w-full bg-white/5 border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl px-4 pr-14 py-3 text-white font-mono text-xs placeholder-gray-700 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowSec(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs font-montserrat transition"
              >
                {showSec ? 'Hide' : 'Show'}
              </button>
            </div>
            {import.meta.env.VITE_LICENSE_SECRET && (
              <p className="text-[10px] text-gray-600 mt-1 font-montserrat">
                Pre-filled from VITE_LICENSE_SECRET in .env
              </p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-gold hover:bg-[#d4b05a] disabled:opacity-60 text-navy rounded-xl font-bold font-montserrat text-sm transition-all flex items-center justify-center gap-2"
          >
            {saving && <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Saving…' : 'Apply License'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Panel ───────────────────────────────────────────────────────────────
export default function SuperAdminPanel() {
  const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL
  const session = (() => {
    try { return JSON.parse(sessionStorage.getItem('adminSession') || '{}') } catch { return {} }
  })()

  const [tab,            setTab]            = useState('schools')
  const [licenses,       setLicenses]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [showIssue,      setShowIssue]      = useState(false)
  const [viewToken,      setViewToken]      = useState(null)
  const [renewTarget,    setRenewTarget]    = useState(null)
  const [upgradeTarget,  setUpgradeTarget]  = useState(null)

  const fetchLicenses = useCallback(async () => {
    setLoading(true)
    try {
      setLicenses(await getLicenses())
    } catch (e) {
      toast.error('Failed to load licenses: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLicenses() }, [fetchLicenses])

  // Guard: only accessible by the developer
  if (!superAdminEmail || session.email?.toLowerCase() !== superAdminEmail.toLowerCase()) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
          <MdBlock className="text-red-400 text-2xl" />
        </div>
        <h2 className="text-white font-bold font-playfair mb-2">Access Denied</h2>
        <p className="text-gray-500 text-sm font-montserrat">
          This panel is restricted to the system developer account.
        </p>
      </div>
    )
  }

  const handleSuspend = async (lic) => {
    if (!window.confirm(`Suspend license for ${lic.schoolName}? Their portals will be locked immediately.`)) return
    try {
      await suspendLicense(lic.id)
      toast.success(`${lic.schoolName} suspended`)
      fetchLicenses()
    } catch (e) { toast.error(e.message) }
  }

  const handleReactivate = async (lic) => {
    try {
      await reactivateLicense(lic.id)
      toast.success(`${lic.schoolName} reactivated`)
      fetchLicenses()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center">
              <FaGraduationCap className="text-gold text-sm" />
            </div>
            <h1 className="text-xl font-bold text-white font-playfair">Super Admin</h1>
          </div>
          <p className="text-gray-500 text-sm font-montserrat">
            Oasis Systems — SaaS License Management
          </p>
        </div>
        <button onClick={() => setShowIssue(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold text-navy rounded-lg font-bold text-sm hover:bg-[#d4b05a] transition-all font-montserrat shrink-0">
          <FaPlus className="text-xs" /> Issue License
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-800 rounded-xl p-1 mb-6 w-fit border border-white/10 font-montserrat">
        {[['schools', 'Schools'], ['this-school', 'This School'], ['settings', 'Settings']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-gold/10 text-gold border border-gold/20'
                : 'text-gray-500 hover:text-gray-300'
            }`}>{label}</button>
        ))}
      </div>

      {/* Schools tab */}
      {tab === 'schools' && (
        <>
          <StatsRow licenses={licenses} />

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : licenses.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <FaSchool className="text-4xl mx-auto mb-3 opacity-30" />
              <p className="font-montserrat">No licenses issued yet. Click "Issue License" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {licenses.map(lic => (
                <LicenseCard key={lic.id}
                  lic={lic}
                  onViewToken={setViewToken}
                  onSuspend={handleSuspend}
                  onReactivate={handleReactivate}
                  onRenew={setRenewTarget}
                  onUpgrade={setUpgradeTarget}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* This School tab */}
      {tab === 'this-school' && <ThisSchoolSection />}

      {/* Settings tab */}
      {tab === 'settings' && <SettingsSection />}

      {/* Modals */}
      {showIssue && (
        <IssueForm
          onClose={() => setShowIssue(false)}
          onIssued={() => { setShowIssue(false); fetchLicenses() }}
        />
      )}
      {viewToken && <TokenModal lic={viewToken} onClose={() => setViewToken(null)} />}
      {renewTarget && (
        <RenewModal
          lic={renewTarget}
          onClose={() => setRenewTarget(null)}
          onRenewed={() => { setRenewTarget(null); fetchLicenses() }}
        />
      )}
      {upgradeTarget && (
        <UpgradeModal
          lic={upgradeTarget}
          onClose={() => setUpgradeTarget(null)}
          onUpgraded={() => { setUpgradeTarget(null); fetchLicenses() }}
        />
      )}
    </div>
  )
}
