import { useState, useEffect } from 'react'
import { collection, getDocs, doc, getDoc, query, where, limit, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { QRCodeSVG } from 'qrcode.react'
import { getCurrentTerm } from '../utils/termHelpers'
import toast from 'react-hot-toast'
import { MdPrint, MdWarning, MdBlock } from 'react-icons/md'

const { number: TERM_NUM, year: TERM_YEAR } = getCurrentTerm()
const TERM_LABEL = `Term ${TERM_NUM}`

function randomStr(n = 4) {
  const c     = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(n)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => c[b % c.length]).join('')
}

function buildSerial(regNo) {
  return `OA-${String(TERM_YEAR).slice(2)}-T${TERM_NUM}-${regNo}-${randomStr(4)}`
}

function fmtDateTime(d) {
  return (
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

function getAdminName() {
  try { return JSON.parse(sessionStorage.getItem('studentsAdminSession') || '{}').name || 'Administrator' }
  catch { return 'Administrator' }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DeniedRow({ label, value, red }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-red-500/10 last:border-0">
      <span className="font-montserrat text-xs text-gray-500">{label}</span>
      <span className={`font-montserrat text-xs font-semibold ${red ? 'text-red-400' : 'text-white'}`}>{value}</span>
    </div>
  )
}

function PassField({ label, value, mono }) {
  return (
    <div>
      <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-bold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudentAccessPass({ regNo }) {
  const [phase, setPhase]       = useState('loading')   // loading | denied | ready | error
  const [student, setStudent]   = useState(null)
  const [fee, setFee]           = useState(null)
  const [threshold, setThreshold] = useState(75)
  const [serial, setSerial]     = useState('')
  const [issuedAt]              = useState(() => new Date())
  const [saving, setSaving]     = useState(false)
  const adminName               = getAdminName()

  useEffect(() => {
    setPhase('loading')
    async function load() {
      try {
        const [sSnap, cfgSnap] = await Promise.all([
          getDocs(query(collection(db, 'students'), where('reg_number', '==', regNo), limit(1))),
          getDoc(doc(db, 'settings', 'portalConfig')),
        ])

        if (sSnap.empty) { setPhase('error'); return }
        const stu = { id: sSnap.docs[0].id, ...sSnap.docs[0].data() }
        setStudent(stu)

        const thresh = cfgSnap.exists() ? (cfgSnap.data().feeThreshold ?? 75) : 75
        setThreshold(thresh)

        const fSnap = await getDocs(
          query(collection(db, 'feeAccounts'), where('reg_number', '==', regNo), limit(1))
        )
        const feeData = fSnap.empty ? null : fSnap.docs[0].data()
        setFee(feeData)

        const pct = feeData && Number(feeData.totalCharged) > 0
          ? (Number(feeData.totalPaid) / Number(feeData.totalCharged)) * 100
          : 0

        if (pct < thresh) {
          setPhase('denied')
        } else {
          setSerial(buildSerial(regNo))
          setPhase('ready')
        }
      } catch (e) {
        console.error(e)
        setPhase('error')
      }
    }
    load()
  }, [regNo])

  const payPct     = fee && Number(fee.totalCharged) > 0
    ? Math.round((Number(fee.totalPaid) / Number(fee.totalCharged)) * 100)
    : 0
  const fullyPaid  = payPct >= 100
  const accentColor = fullyPaid ? '#22c55e' : '#f59e0b'

  const qrData = `OPC Pass | ${serial} | ${regNo} | ${TERM_LABEL} ${TERM_YEAR}`

  const passage = fullyPaid
    ? `This is to certify that ${student?.fullName}, Registration Number ${regNo}, of ${student?.class}, has paid school fees in full for ${TERM_LABEL} ${TERM_YEAR}. The student is hereby authorized to attend classes, access all school facilities, and sit for examinations for the current term.`
    : `This is to certify that ${student?.fullName}, Registration Number ${regNo}, of ${student?.class}, has paid the required minimum amount towards the ${TERM_LABEL} ${TERM_YEAR} school fees. The student is hereby authorized to attend classes, access school facilities, and sit for examinations for the current term.`

  const handlePrint = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'accessPasses', serial), {
        regNo,
        generatedBy: adminName,
        generatedAt: issuedAt,
        term:        TERM_LABEL,
        year:        TERM_YEAR,
        valid:       true,
      })
      setTimeout(() => window.print(), 150)
    } catch {
      toast.error('Failed to save pass record. Check your connection.')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="bg-[#0D1C35] border border-white/10 rounded-2xl p-10 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A84C] mb-3" />
        <p className="font-montserrat text-sm text-gray-400">Verifying student fee status…</p>
      </div>
    )
  }

  // ── Not Found ─────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="bg-[#0D1C35] border border-red-500/30 rounded-2xl p-8 text-center">
        <MdBlock className="text-red-400 text-4xl mx-auto mb-3" />
        <p className="font-montserrat text-sm font-semibold text-red-400">Student not found</p>
        <p className="font-montserrat text-xs text-gray-500 mt-1">
          No student record matches reg number "<span className="font-mono">{regNo}</span>"
        </p>
      </div>
    )
  }

  // ── Access Denied ─────────────────────────────────────────────────────────
  if (phase === 'denied') {
    const balance = fee ? Number(fee.totalCharged) - Number(fee.totalPaid) : 0
    return (
      <div className="bg-[#0D1C35] border-2 border-red-500/40 rounded-2xl p-7">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center shrink-0">
            <MdWarning className="text-red-400 text-xl" />
          </div>
          <div>
            <h3 className="font-montserrat text-sm font-bold text-red-400 uppercase tracking-wider">Access Denied</h3>
            <p className="font-montserrat text-[11px] text-gray-500">Minimum fee threshold not met</p>
          </div>
        </div>
        <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-5 py-4 mb-4 space-y-1">
          <DeniedRow label="Student Name"   value={student?.fullName} />
          <DeniedRow label="Reg Number"     value={regNo} />
          <DeniedRow label="Amount Paid"    value={`$${Number(fee?.totalPaid || 0).toLocaleString()}`} />
          <DeniedRow label="Balance Due"    value={`$${balance.toLocaleString()}`} red />
          <DeniedRow label="Payment"        value={`${payPct}% paid — minimum ${threshold}% required`} red />
        </div>
        <p className="font-montserrat text-xs text-gray-400 leading-relaxed">
          This student has not met the minimum fee requirement. Please clear the outstanding balance to obtain an access pass.
        </p>
      </div>
    )
  }

  // ── Full Pass ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Print button — ONLY rendered here, never on denied */}
      <div className="flex justify-end print:hidden">
        <button
          onClick={handlePrint}
          disabled={saving}
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 disabled:opacity-60 text-[#0A1628] font-montserrat text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg shadow-[#C9A84C]/20 transition-all"
        >
          <MdPrint className="text-base" />
          {saving ? 'Saving record…' : 'Print Pass'}
        </button>
      </div>

      {/* ── Pass Card (also the print target) ── */}
      <div id="opc-access-pass" className="bg-white" style={{ border: `4px double ${accentColor}`, outline: `2px solid ${accentColor}`, outlineOffset: '-8px', fontFamily: 'Georgia, serif' }}>

        {/* Watermark — hidden on screen, visible on print */}
        <div className="hidden print:flex absolute inset-0 items-center justify-center pointer-events-none select-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
          <span style={{ fontSize: 72, fontWeight: 900, color: '#000', opacity: 0.06, transform: 'rotate(-45deg)', whiteSpace: 'nowrap', letterSpacing: '0.1em', userSelect: 'none' }}>
            OASIS PRIVATE COLLEGE
          </span>
        </div>

        <div className="relative p-8" style={{ zIndex: 1 }}>

          {/* Header */}
          <div className="text-center mb-5 pb-4" style={{ borderBottom: `2px solid ${accentColor}` }}>
            <div className="w-16 h-16 mx-auto mb-2 rounded-full border-2 overflow-hidden flex items-center justify-center bg-gray-50" style={{ borderColor: accentColor }}>
              <img src="/assets/logo.png" alt="OPC" className="w-12 h-12 object-contain" onError={e => { e.currentTarget.parentElement.innerHTML = '<span style="font-size:1.5rem;font-weight:900;color:#1a3a5c">OPC</span>' }} />
            </div>
            <h1 className="font-bold text-base tracking-widest text-gray-900 uppercase" style={{ fontFamily: 'Georgia, serif' }}>
              Oasis Private College
            </h1>
            <p className="text-xs text-gray-500 tracking-wider">Checheche, Zimbabwe</p>
            <div className="mt-2 inline-block px-5 py-1 border border-gray-400">
              <p className="text-xs font-bold tracking-[0.18em] uppercase text-gray-700">Student Facility Access Pass</p>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{TERM_LABEL} — {TERM_YEAR}</p>
          </div>

          {/* Serial & Status row */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-0.5">Pass Serial Number</p>
              <p className="font-mono font-bold text-sm text-gray-900">{serial}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-0.5">Fee Status</p>
              <span
                className="text-[10px] font-bold px-2.5 py-0.5 rounded"
                style={{ backgroundColor: fullyPaid ? '#dcfce7' : '#fef3c7', color: fullyPaid ? '#166534' : '#92400e' }}
              >
                {payPct}% PAID {fullyPaid ? '— PAID IN FULL ✓' : ''}
              </span>
            </div>
          </div>

          {/* Student details */}
          <div className="border border-gray-200 rounded p-4 mb-4 bg-gray-50">
            <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-2">Student Details</p>
            <div className="mb-2">
              <PassField label="Full Name" value={student.fullName} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PassField label="Registration Number" value={regNo} mono />
              <PassField label="Class / Form" value={student.class} />
            </div>
          </div>

          {/* Authorization passage */}
          <div className="rounded p-4 mb-4 border-2" style={{ borderColor: accentColor, backgroundColor: fullyPaid ? '#f0fdf4' : '#fffbeb' }}>
            <p className="text-[8px] uppercase tracking-widest mb-1.5" style={{ color: accentColor }}>Authorization Statement</p>
            <p className="text-[11px] leading-relaxed text-gray-800 italic">{passage}</p>
          </div>

          {/* Security row: details + QR */}
          <div className="flex gap-5 mb-4">
            <div className="flex-1 space-y-2.5">
              <div>
                <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-0.5">Issued</p>
                <p className="text-xs text-gray-800">{fmtDateTime(issuedAt)}</p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-0.5">Authorized By</p>
                <p className="text-xs text-gray-800">{adminName}</p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-0.5">Signature</p>
                <p className="text-gray-300 font-mono text-sm mt-0.5">______________________________</p>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-1">
              <QRCodeSVG value={qrData} size={80} level="M" />
              <p className="text-[7px] text-gray-400 text-center font-mono">Scan to verify</p>
            </div>
          </div>

          {/* Validity notice */}
          <div className="bg-gray-100 rounded px-4 py-2.5 mb-4 space-y-0.5">
            <p className="text-[9px] text-gray-500">• This pass is valid for the current term only.</p>
            <p className="text-[9px] text-gray-500">• Any alterations render this pass invalid.</p>
            <p className="text-[9px] text-gray-500">• Report lost passes immediately to the school office.</p>
          </div>

          {/* Footer: stamp + serial repeat */}
          <div className="flex items-end justify-between pt-3 border-t border-gray-200">
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                <p className="text-[7px] text-gray-400 text-center uppercase leading-tight tracking-wide">School<br />Stamp</p>
              </div>
            </div>
            <p className="text-[8px] text-gray-400 font-mono">{serial}</p>
          </div>

        </div>
      </div>

      {/* Print styles injected once per render */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #opc-access-pass, #opc-access-pass * { visibility: visible !important; }
          #opc-access-pass {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 148mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
          }
        }
      `}</style>

    </div>
  )
}
