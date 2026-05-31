import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  collection, getDocs, query, where, addDoc, updateDoc,
  doc, getDoc, setDoc, serverTimestamp, limit, deleteDoc,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { getStudentByRegNumber } from '../../firebase/students'
import toast from 'react-hot-toast'
import {
  MdKey, MdSettings, MdPrint, MdSearch, MdCheckCircle,
  MdRefresh, MdBlock, MdEmail,
} from 'react-icons/md'
import { FaFilter } from 'react-icons/fa'

const GOLD  = '#C9A84C'
const INPUT = 'w-full bg-white/5 border border-white/10 focus:border-[#C9A84C]/50 focus:outline-none rounded-xl px-4 py-3 text-white font-montserrat text-sm placeholder-gray-600 transition-all'
const LABEL = 'block text-[10px] font-semibold uppercase tracking-widest text-gray-500 font-montserrat mb-1.5'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'
const TH    = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat'
const TD    = 'py-3 px-4 text-sm text-gray-300 font-montserrat'

function generateOTP(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function getOtpStatus(user) {
  if (user.otpUsed) return 'used'
  const exp = user.otpExpiresAt
  const expDate = exp?.toDate ? exp.toDate() : exp ? new Date(exp) : null
  if (!expDate || expDate <= new Date()) return 'expired'
  return 'active'
}

export default function StudentOTPManager() {
  const [tab, setTab] = useState('generate')

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-[#0D1C35] border border-white/10 rounded-xl p-1 w-fit">
        {[
          { key: 'generate', label: 'Generate OTP',    icon: MdKey },
          { key: 'logs',     label: 'Active OTPs',     icon: FaFilter },
          { key: 'settings', label: 'Portal Settings', icon: MdSettings },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-montserrat transition-all ${
              tab === key
                ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon className="text-base" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'generate' && <GenerateOTP />}
      {tab === 'logs'     && <ActiveOTPLogs />}
      {tab === 'settings' && <PortalSettingsInline />}
    </div>
  )
}

/* ── Section A: Generate OTP ──────────────────────────────────────────── */
function GenerateOTP() {
  const location = useLocation()
  const [regNumber,   setRegNumber]   = useState(location.state?.regNumber ?? '')
  const [student,     setStudent]     = useState(null)
  const [settings,    setSettings]    = useState(null)
  const [otpResult,   setOtpResult]   = useState(null)
  const [searching,   setSearching]   = useState(false)
  const [generating,  setGenerating]  = useState(false)
  const [copied,      setCopied]      = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'portalSettings', 'main'))
      .then(s => { if (s.exists()) setSettings(s.data()) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (location.state?.regNumber) handleSearch(location.state.regNumber)
  }, [])

  const handleSearch = async (override) => {
    const val = (override ?? regNumber).trim()
    if (!val) return
    setSearching(true)
    setStudent(null)
    setOtpResult(null)
    try {
      const s = await getStudentByRegNumber(val)
      if (!s) toast.error('No student found with that registration number. Check and try again.')
      else setStudent(s)
    } catch {
      toast.error('Search failed. Please try again.')
    }
    setSearching(false)
  }

  const handleGenerate = async () => {
    if (!student) return
    setGenerating(true)
    try {
      const otp        = generateOTP(8)
      const expiryHrs  = settings?.otpExpiryHours ?? 24
      const expiresAt  = new Date(Date.now() + expiryHrs * 3600 * 1000)

      const existingSnap = await getDocs(
        query(collection(db, 'users'), where('studentId', '==', student.id), where('role', '==', 'student'), limit(1))
      )

      if (!existingSnap.empty) {
        await updateDoc(existingSnap.docs[0].ref, {
          otpCode:      otp,
          otpExpiresAt: expiresAt,
          otpUsed:      false,
          updatedAt:    serverTimestamp(),
        })
      } else {
        await addDoc(collection(db, 'users'), {
          studentId:        student.id,
          role:             'student',
          uid:              null,
          hasSetupPassword: false,
          otpCode:          otp,
          otpExpiresAt:     expiresAt,
          otpUsed:          false,
          createdAt:        serverTimestamp(),
          updatedAt:        serverTimestamp(),
        })
      }

      const adminName = JSON.parse(sessionStorage.getItem('adminSession') || '{}').name || 'Admin'
      await addDoc(collection(db, 'otpLogs'), {
        studentId:   student.id,
        studentName: student.fullName || student.name || '',
        regNumber:   student.reg_number || '',
        class:       student.class || '',
        otpCode:     otp,
        expiresAt,
        generatedAt: serverTimestamp(),
        generatedBy: adminName,
      })

      setOtpResult({ otp, student, expiresAt, expiryHrs })
      toast.success('OTP generated successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate OTP')
    }
    setGenerating(false)
  }

  const copyOtp = () => {
    navigator.clipboard.writeText(otpResult.otp)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setRegNumber('')
    setStudent(null)
    setOtpResult(null)
    setCopied(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Search panel */}
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-1">Generate Student Portal Access</h3>
        <p className="text-xs text-gray-500 font-montserrat mb-5">
          Use this to issue an OTP to students who have no email or need manual access.
        </p>

        <div>
          <label className={LABEL}>Student Registration Number</label>
          <div className="flex gap-2">
            <input
              value={regNumber}
              onChange={e => setRegNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. OC-2025-1248"
              className={`${INPUT} flex-1`}
            />
            <button
              onClick={() => handleSearch()}
              disabled={searching}
              className="px-4 py-3 rounded-xl text-sm font-semibold font-montserrat text-[#0A1628] transition shrink-0 disabled:opacity-50"
              style={{ backgroundColor: GOLD }}
            >
              {searching ? '…' : 'Find'}
            </button>
          </div>
        </div>

        {student && (
          <div className="mt-4 p-4 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-montserrat">Name</span>
              <span className="text-white font-montserrat font-semibold">{student.fullName || student.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-montserrat">Reg No</span>
              <span className="text-white font-montserrat">{student.reg_number || student.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-montserrat">Class</span>
              <span className="text-white font-montserrat">{student.class || '—'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400 font-montserrat">Email</span>
              {student.studentEmail ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-montserrat font-semibold">
                  <MdEmail className="text-xs" /> Has email
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-montserrat font-semibold">
                  No email — manual OTP needed
                </span>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full mt-2 py-3 rounded-xl text-sm font-semibold font-montserrat text-[#0A1628] transition disabled:opacity-50"
              style={{ backgroundColor: GOLD }}
            >
              {generating ? 'Generating…' : 'Generate OTP'}
            </button>
          </div>
        )}
      </div>

      {/* OTP Slip */}
      {otpResult ? (
        <div className={CARD} id="otp-slip">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-playfair font-semibold text-white">OTP Slip</h3>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="text-xs font-montserrat px-3 py-1.5 rounded-lg border border-white/20 text-gray-300 hover:bg-white/5 transition flex items-center gap-1"
              >
                <MdPrint className="text-base" /> Print
              </button>
            </div>
          </div>

          <div className="border border-white/20 rounded-xl p-6 font-montserrat">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 text-center">Student Portal Access</p>
            <p className="text-[11px] text-[#C9A84C]/70 uppercase tracking-widest mb-4 text-center font-playfair font-semibold">Oasis Private College</p>

            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-gray-400">Student</span>
                <span className="text-white font-semibold">{otpResult.student.fullName || otpResult.student.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reg No</span>
                <span className="text-white">{otpResult.student.reg_number || otpResult.student.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Class</span>
                <span className="text-white">{otpResult.student.class || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Valid for</span>
                <span className="text-white">{otpResult.expiryHrs} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expires</span>
                <span className="text-white">{otpResult.expiresAt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl p-4 text-center mb-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">OTP Code</p>
              <p className="font-mono text-3xl font-bold tracking-[0.3em] mb-3" style={{ color: GOLD }}>
                {otpResult.otp}
              </p>
              <button
                onClick={copyOtp}
                className="text-xs font-montserrat text-gray-500 hover:text-[#C9A84C] transition"
              >
                {copied ? '✓ Copied!' : 'Copy to clipboard'}
              </button>
            </div>

            <p className="text-[10px] text-gray-600 leading-relaxed text-center">
              Portal URL: <span className="text-gray-400">/student/login</span><br />
              Go to Student Portal → "First time? Use OTP" → enter Reg No + this code.
            </p>
          </div>

          <button
            onClick={reset}
            className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold font-montserrat text-gray-400 border border-white/10 hover:bg-white/5 transition flex items-center justify-center gap-2"
          >
            <MdRefresh className="text-base" />
            Generate for Another Student
          </button>
        </div>
      ) : (
        <div className={`${CARD} flex items-center justify-center`} style={{ minHeight: 280 }}>
          <p className="text-gray-600 font-montserrat text-sm text-center">
            Search for a student and generate an OTP<br />to see the slip here.
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Section B: Active OTPs log ───────────────────────────────────────── */
function ActiveOTPLogs() {
  const navigate = useNavigate()
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')   // 'all' | 'active' | 'used' | 'expired'
  const [search,  setSearch]  = useState('')
  const [revoking, setRevoking] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [userSnap, studSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role', '==', 'student'))),
        getDocs(collection(db, 'students')),
      ])
      const studMap = {}
      studSnap.docs.forEach(d => { studMap[d.id] = { id: d.id, ...d.data() } })

      const list = userSnap.docs
        .map(d => ({ docId: d.id, ref: d.ref, ...d.data() }))
        .filter(u => u.otpCode)
        .map(u => ({ ...u, student: studMap[u.studentId] || null, status: getOtpStatus(u) }))
        .sort((a, b) => {
          const ta = a.updatedAt?.seconds ?? a.createdAt?.seconds ?? 0
          const tb = b.updatedAt?.seconds ?? b.createdAt?.seconds ?? 0
          return tb - ta
        })

      setRows(list)
    } catch {
      toast.error('Failed to load OTP records')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleRevoke = async (row) => {
    if (!confirm(`Revoke OTP for ${row.student?.fullName ?? row.studentId}? They will no longer be able to use this code.`)) return
    setRevoking(r => ({ ...r, [row.docId]: true }))
    try {
      await updateDoc(row.ref, { otpExpiresAt: new Date(), updatedAt: serverTimestamp() })
      setRows(prev => prev.map(r => r.docId === row.docId
        ? { ...r, otpExpiresAt: new Date(), status: 'expired' }
        : r))
      toast.success('OTP revoked')
    } catch {
      toast.error('Failed to revoke OTP')
    }
    setRevoking(r => ({ ...r, [row.docId]: false }))
  }

  const counts = { all: rows.length, active: 0, used: 0, expired: 0 }
  rows.forEach(r => { counts[r.status] = (counts[r.status] ?? 0) + 1 })

  const filtered = rows.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.student?.fullName?.toLowerCase().includes(q) ||
      r.student?.reg_number?.toLowerCase().includes(q) ||
      r.studentId?.toLowerCase().includes(q)
    )
  })

  const STATUS_STYLES = {
    active:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    used:    'bg-white/10 text-gray-400 border-white/20',
    expired: 'bg-red-500/15 text-red-300 border-red-500/30',
  }

  return (
    <div className={`${CARD} space-y-4`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="font-playfair font-semibold text-white">Active OTPs</h3>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or reg no…"
            className="bg-white/5 border border-white/10 focus:border-[#C9A84C]/50 focus:outline-none rounded-xl px-3 py-2 text-white font-montserrat text-xs placeholder-gray-600 w-52 transition-all"
          />
          <button onClick={load} className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition">
            <MdRefresh className="text-base" />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {(['all', 'active', 'used', 'expired']).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider font-montserrat transition-all capitalize ${
              filter === f
                ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {f} <span className="ml-1 opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 font-montserrat text-sm text-center py-8">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Reg No', 'Name', 'Class', 'Generated', 'Expires', 'Status', 'Actions'].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => {
                const s     = row.student
                const expTs = row.otpExpiresAt?.toDate ? row.otpExpiresAt.toDate() : row.otpExpiresAt ? new Date(row.otpExpiresAt) : null
                const genTs = row.updatedAt?.toDate   ? row.updatedAt.toDate()   : row.createdAt?.toDate ? row.createdAt.toDate() : null
                return (
                  <tr key={row.docId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-[#C9A84C]">{s?.reg_number || row.studentId}</td>
                    <td className="py-3 px-4 text-sm text-white font-montserrat font-medium">{s?.fullName || '—'}</td>
                    <td className={TD}>{s?.class || '—'}</td>
                    <td className={TD}>{genTs ? genTs.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className={TD}>{expTs ? expTs.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-montserrat font-semibold uppercase tracking-wider ${STATUS_STYLES[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {row.status === 'active' && (
                        <button
                          onClick={() => handleRevoke(row)}
                          disabled={revoking[row.docId]}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold font-montserrat text-red-400 border border-red-500/30 hover:bg-red-500/10 transition disabled:opacity-40"
                        >
                          <MdBlock className="text-sm" />
                          {revoking[row.docId] ? '…' : 'Revoke'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-gray-500 font-montserrat">
                    {search ? 'No results match your search.' : `No ${filter === 'all' ? '' : filter + ' '}OTPs found.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Section C: Portal Settings (inline, also available as dedicated page) */
function PortalSettingsInline() {
  const [settings, setSettings] = useState({
    sessionTimeoutMinutes: 4,
    otpExpiryHours:        24,
  })
  const [saving, setSaving] = useState({})
  const [loaded, setLoaded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getDoc(doc(db, 'portalSettings', 'main'))
      .then(s => { if (s.exists()) setSettings(prev => ({ ...prev, ...s.data() })) })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const saveSingle = async (key, value) => {
    setSaving(p => ({ ...p, [key]: true }))
    try {
      const adminName = JSON.parse(sessionStorage.getItem('adminSession') || '{}').name || 'Admin'
      await setDoc(doc(db, 'portalSettings', 'main'), {
        [key]: Number(value),
        updatedAt: serverTimestamp(),
        updatedBy: adminName,
      }, { merge: true })
      toast.success('Saved')
    } catch {
      toast.error('Save failed')
    }
    setSaving(p => ({ ...p, [key]: false }))
  }

  if (!loaded) return <p className="text-gray-500 font-montserrat text-sm">Loading…</p>

  const Row = ({ label, field, unit, helper, min = 1, max = 10000 }) => (
    <div className="flex items-center gap-4 py-4 border-b border-white/10">
      <div className="flex-1">
        <p className="text-sm text-white font-montserrat font-semibold">{label}</p>
        {helper && <p className="text-xs text-gray-500 font-montserrat mt-0.5">{helper}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="number" min={min} max={max}
          value={settings[field]}
          onChange={e => setSettings(p => ({ ...p, [field]: Number(e.target.value) }))}
          className="w-20 bg-white/5 border border-white/10 focus:border-[#C9A84C]/50 focus:outline-none rounded-xl px-3 py-2 text-white font-montserrat text-sm text-right"
        />
        <span className="text-gray-500 font-montserrat text-sm w-16">{unit}</span>
        <button
          onClick={() => saveSingle(field, settings[field])}
          disabled={saving[field]}
          className="px-4 py-2 rounded-lg text-xs font-semibold font-montserrat text-[#0A1628] transition disabled:opacity-50 shrink-0"
          style={{ backgroundColor: GOLD }}
        >
          {saving[field] ? '…' : 'Save'}
        </button>
      </div>
    </div>
  )

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-playfair font-semibold text-white">Portal Settings</h3>
        <button
          onClick={() => navigate('/admin/portal-settings')}
          className="text-xs font-montserrat text-[#C9A84C] hover:underline"
        >
          Full settings page →
        </button>
      </div>
      <p className="text-xs text-gray-500 font-montserrat mb-5">
        Changes take effect immediately for all student sessions.
      </p>

      <Row label="Session timeout" field="sessionTimeoutMinutes" unit="minutes" helper="Auto sign out students after this many minutes of inactivity" min={1} max={120} />
      <Row label="OTP expiry"     field="otpExpiryHours"        unit="hours"   helper="Generated OTPs expire after this many hours" min={1} max={168} />

      <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10">
        <p className="text-[10px] text-gray-500 font-montserrat">
          The <span className="text-[#C9A84C]">Results access gate</span> threshold is managed in Bursar Settings.
        </p>
      </div>
    </div>
  )
}
