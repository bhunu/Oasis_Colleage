import { useState, useEffect } from 'react'
import {
  collection, getDocs, getDoc, query, orderBy, doc, updateDoc,
  setDoc, addDoc, serverTimestamp, where, limit,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { getCurrentTerm } from '../utils/termHelpers'
import ExeatPass from '../components/ExeatPass'
import toast from 'react-hot-toast'
import {
  MdSearch, MdClose, MdPrint, MdCheck, MdBlock, MdOpenInNew,
  MdBadge, MdAdd, MdPersonSearch, MdGroups,
  MdCheckBox, MdCheckBoxOutlineBlank, MdWarning, MdDownload,
} from 'react-icons/md'

const { number: TERM_NUM, year: TERM_YEAR } = getCurrentTerm()

const ADMIN_REASONS = [
  'Sent Home (Fees)',
  'Medical / Sick Leave',
  'Bereavement',
  'Family Emergency / Other',
]

function getAdminName() {
  try { return JSON.parse(sessionStorage.getItem('studentsAdminSession') || '{}').name || 'Administrator' }
  catch { return 'Administrator' }
}

function buildSerial(regNo) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand  = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `OPC-EX-${TERM_YEAR}-T${TERM_NUM}-${regNo}-${rand}`
}

function fmtDate(d) {
  if (!d) return '—'
  try {
    const date = typeof d === 'string' ? new Date(d) : d?.toDate ? d.toDate() : new Date(d)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return String(d) }
}

function fmt(v) {
  return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
}

async function lookupFeeAccount(reg_number) {
  if (!reg_number) return null
  try {
    const snap = await getDocs(
      query(collection(db, 'feeAccounts'), where('reg_number', '==', reg_number), limit(1))
    )
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
  } catch { return null }
}

const STATUS_STYLES = {
  Pending:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const TABS = ['All', 'Pending', 'Approved', 'Rejected']

// ── Shared input styles ───────────────────────────────────────────────────────
const LBL      = 'block text-[9px] uppercase tracking-widest text-gray-500 font-montserrat mb-1'
const INP      = 'w-full bg-white/5 border border-white/10 focus:border-gold/40 focus:outline-none rounded-xl px-4 py-2.5 text-white font-montserrat text-sm placeholder-gray-600'
const INP_DATE = `${INP} [color-scheme:dark]`

// ── Create Pass Modal (single, admin-initiated) ───────────────────────────────
function CreatePassModal({ onClose, onCreated }) {
  const [regNoInput,    setRegNoInput]    = useState('')
  const [student,       setStudent]       = useState(null)
  const [feeAccount,    setFeeAccount]    = useState(null)
  const [searching,     setSearching]     = useState(false)
  const [reason,        setReason]        = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate,    setReturnDate]    = useState('')
  const [destination,   setDestination]  = useState('')
  const [guardianName,  setGuardianName]  = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [notes,         setNotes]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [passData,      setPassData]      = useState(null)
  const [showPass,      setShowPass]      = useState(false)
  const adminName = getAdminName()

  /* Re-run fee lookup whenever reason or student changes */
  useEffect(() => {
    if (reason === 'Sent Home (Fees)' && student?.id) {
      setFeeAccount(null)
      lookupFeeAccount(student.reg_number).then(setFeeAccount)
    } else {
      setFeeAccount(null)
    }
  }, [reason, student?.id])

  const searchStudent = async () => {
    const val = regNoInput.trim().toUpperCase()
    if (!val) { toast.error('Enter a registration number'); return }
    setSearching(true)
    setStudent(null)
    setFeeAccount(null)
    try {
      const snap = await getDocs(
        query(collection(db, 'students'), where('reg_number', '==', val), limit(1))
      )
      if (snap.empty) { toast.error('No student found with that registration number'); return }
      const data = snap.docs[0].data()
      const s = { id: snap.docs[0].id, ...data }
      setStudent(s)
      if (data.guardianName)  setGuardianName(data.guardianName)
      if (data.guardianPhone) setGuardianPhone(data.guardianPhone)
    } catch {
      toast.error('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleIssue = async () => {
    if (!student)              { toast.error('Search for a student first');           return }
    if (!reason)               { toast.error('Select a reason for exit');             return }
    if (!departureDate)        { toast.error('Enter the departure date');             return }
    if (!returnDate)           { toast.error('Enter the expected return date');       return }
    if (returnDate < departureDate) { toast.error('Return date must be after departure'); return }
    if (!destination.trim())   { toast.error('Enter the destination');                return }
    if (!guardianName.trim())  { toast.error('Enter guardian name');                  return }
    if (!guardianPhone.trim()) { toast.error('Enter guardian phone number');          return }

    setLoading(true)
    try {
      const serial      = buildSerial(student.reg_number)
      const now         = serverTimestamp()
      const studentName = student.fullName || '—'
      const cls         = student.class || ''

      const appData = {
        studentName,
        reg_number:   student.reg_number,
        class:        cls,
        studentId:    student.id,
        reason,
        departureDate,
        returnDate,
        destination:  destination.trim(),
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        notes:        notes.trim() || null,
        documentURL:  null,
        documentName: null,
        status:       'Approved',
        source:       'admin',
        passSerial:   serial,
        appliedAt:    now,
        reviewedBy:   adminName,
        reviewedAt:   now,
      }

      const appRef = await addDoc(collection(db, 'exeatApplications'), appData)

      const pass = {
        passSerial:    serial,
        reg_number:    student.reg_number,
        studentName,
        class:         cls,
        reason,
        departureDate,
        returnDate,
        destination:   destination.trim(),
        guardianName:  guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        documentURL:   null,
        documentName:  null,
        photoURL:      student.photoURL || null,
        issuedBy:      adminName,
        issuedAt:      now,
        term:          `Term ${TERM_NUM}`,
        year:          String(TERM_YEAR),
        valid:         true,
        source:        'admin',
      }
      await setDoc(doc(db, 'exeatPasses', serial), pass)

      setPassData({ ...pass, issuedAt: new Date() })
      toast.success('Exit pass issued successfully')
      onCreated({ id: appRef.id, ...appData, appliedAt: new Date(), reviewedAt: new Date() })
    } catch (err) {
      console.error(err)
      toast.error('Failed to issue pass. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* Pass overlay */
  if (showPass && passData) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-start justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:inset-auto print:static">
        <div className="w-full max-w-lg mt-4">
          <div className="flex justify-between mb-3 print:hidden">
            <button onClick={() => setShowPass(false)} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition">
              <MdClose className="text-xl" />
            </button>
          </div>
          <ExeatPass passData={{ ...passData, photoURL: student?.photoURL || null }} allowPrint={true} onPrint={() => window.print()} />
        </div>
      </div>
    )
  }

  const hasArrears = feeAccount && feeAccount.balanceType === 'debit' && (feeAccount.balance || 0) > 0
  const noArrears  = feeAccount && (feeAccount.balanceType !== 'debit' || (feeAccount.balance || 0) <= 0)

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-navy-800 border border-white/10 rounded-2xl overflow-hidden my-4">

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-playfair text-lg font-bold text-white">Issue New Exit Pass</h2>
            <p className="text-xs text-gray-500 font-montserrat">Admin-initiated · not submitted via student portal</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition"><MdClose className="text-xl" /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">

          {/* Success banner */}
          {passData && !showPass && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-emerald-400 font-montserrat">Pass issued successfully</p>
                <p className="text-xs text-gray-400 font-montserrat mt-0.5 font-mono">{passData.passSerial}</p>
              </div>
              <button
                onClick={() => setShowPass(true)}
                className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-montserrat font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition shrink-0"
              >
                <MdPrint className="text-base" /> View & Print Pass
              </button>
            </div>
          )}

          {!passData && (
            <>
              {/* Reason */}
              <div>
                <label className={LBL}>Reason for Exit *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ADMIN_REASONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-montserrat font-semibold text-left transition ${
                        reason === r ? 'bg-gold/15 border-gold/60 text-gold' : 'border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student search */}
              <div>
                <label className={LBL}>Student Registration Number *</label>
                <div className="flex gap-2">
                  <input
                    value={regNoInput}
                    onChange={e => setRegNoInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchStudent()}
                    placeholder="e.g. OPC2024001"
                    className={`${INP} flex-1`}
                  />
                  <button
                    onClick={searchStudent}
                    disabled={searching}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-60 text-white font-montserrat text-xs font-semibold px-4 rounded-xl transition shrink-0"
                  >
                    {searching
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <MdPersonSearch className="text-lg" />
                    }
                    Search
                  </button>
                </div>
              </div>

              {/* Student card */}
              {student && (
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-4 bg-white/5 px-4 py-3">
                    {student.photoURL ? (
                      <img src={student.photoURL} alt={student.name} className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gold/20 border border-white/10 flex items-center justify-center shrink-0">
                        <span className="text-gold font-bold text-lg font-playfair">{(student.fullName || '?')[0]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white font-montserrat">{student.fullName || '—'}</p>
                      <p className="text-xs text-gray-400 font-montserrat">{student.class || '—'} · {student.reg_number}</p>
                      {student.boardingStatus && (
                        <span className="text-[9px] font-semibold text-emerald-400 font-montserrat uppercase tracking-wider">{student.boardingStatus}</span>
                      )}
                    </div>
                    <span className="text-emerald-400 text-xs font-montserrat font-semibold shrink-0">Found ✓</span>
                  </div>

                  {/* Fee balance row — shown only when Sent Home (Fees) is selected */}
                  {reason === 'Sent Home (Fees)' && (
                    <div className="px-4 py-3 border-t border-white/10">
                      {!feeAccount ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-gray-500 font-montserrat">Looking up fee balance…</span>
                        </div>
                      ) : hasArrears ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MdWarning className="text-amber-400 text-base shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-amber-400 font-montserrat">Outstanding balance confirmed</p>
                              <p className="text-[10px] text-gray-500 font-montserrat">
                                Term fees: {fmt(feeAccount.termFees)} · Paid: {fmt(feeAccount.totalPaid)}
                              </p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-red-400 font-playfair">{fmt(feeAccount.balance)}</span>
                        </div>
                      ) : noArrears ? (
                        <div className="flex items-center gap-2">
                          <MdWarning className="text-yellow-500 text-base shrink-0" />
                          <p className="text-xs text-yellow-500 font-montserrat">
                            No outstanding balance found — this student's account appears clear. Confirm before issuing.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* Fee warning for no-student state */}
              {reason === 'Sent Home (Fees)' && !student && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                  <p className="text-xs text-amber-400 font-montserrat font-semibold">
                    ⚠ Balance will be verified automatically when you search the student.
                  </p>
                </div>
              )}

              {/* Travel dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Departure Date *</label>
                  <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className={INP_DATE} />
                </div>
                <div>
                  <label className={LBL}>Expected Return Date *</label>
                  <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={departureDate} className={INP_DATE} />
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className={LBL}>Destination *</label>
                <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. 123 Main St, Harare" className={INP} />
              </div>

              {/* Guardian */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Guardian / Parent Name *</label>
                  <input value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="Full name" className={INP} />
                </div>
                <div>
                  <label className={LBL}>Guardian Phone *</label>
                  <input value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} placeholder="+263…" className={INP} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={LBL}>Additional Notes <span className="normal-case text-gray-600">(optional)</span></label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any extra details for the record…" className={`${INP} resize-none`} />
              </div>

              <div className="border-t border-white/10 pt-4">
                <button
                  onClick={handleIssue}
                  disabled={loading || !student}
                  className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-yellow-400 disabled:opacity-50 text-navy font-montserrat font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition"
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                    : <MdBadge className="text-base" />
                  }
                  {loading ? 'Issuing Pass…' : 'Issue Exit Pass'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Bulk Pass Modal (Sent Home — Fees) ────────────────────────────────────────
function BulkPassModal({ onClose, onCreatedBulk }) {
  const [minBalance,    setMinBalance]    = useState(100)
  const [maxBalance,    setMaxBalance]    = useState('')
  const [finding,       setFinding]       = useState(false)
  const [students,      setStudents]      = useState([])
  const [selected,      setSelected]      = useState(new Set())
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate,    setReturnDate]    = useState('')
  const [issuing,       setIssuing]       = useState(false)
  const [progress,      setProgress]      = useState({ done: 0, total: 0 })
  const [doneList,      setDoneList]      = useState(null)
  const adminName = getAdminName()

  const phase = doneList ? 'done' : issuing ? 'issuing' : students.length > 0 ? 'review' : 'config'

  const findStudents = async () => {
    const min = Number(minBalance) || 0
    const max = maxBalance !== '' ? Number(maxBalance) : Infinity
    if (min < 0) { toast.error('Minimum balance cannot be negative'); return }
    if (max < min) { toast.error('Maximum must be greater than minimum'); return }

    setFinding(true)
    setStudents([])
    setSelected(new Set())
    try {
      const snap = await getDocs(
        query(collection(db, 'feeAccounts'), where('balanceType', '==', 'debit'), orderBy('balance', 'desc'))
      )
      const matching = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => {
          const bal = d.balance || 0
          return bal >= min && bal <= max
        })

      if (matching.length === 0) {
        toast.error(
          maxBalance
            ? `No students with balance between ${fmt(min)} and ${fmt(max)}`
            : `No students with balance ≥ ${fmt(min)}`
        )
        return
      }

      /* Enrich with student records (parallel) */
      const enriched = await Promise.all(
        matching.map(async fee => {
          try {
            const sDoc = await getDoc(doc(db, 'students', fee.studentId))
            const s    = sDoc.exists() ? sDoc.data() : {}
            return {
              studentDocId: fee.studentId,
              regNo:        s.reg_number || fee.studentId,
              studentName:  s.name || fee.studentName || '—',
              class:        s.class || fee.class || '—',
              photoURL:     s.photoURL || null,
              parentName:   s.parentName || 'Parent/Guardian',
              parentPhone:  s.parentPhone || s.parentContact || '—',
              address:      s.address || s.homeAddress || 'Home Address',
              balance:      fee.balance || 0,
            }
          } catch {
            return {
              studentDocId: fee.studentId,
              regNo:        fee.studentId,
              studentName:  fee.studentName || '—',
              class:        fee.class || '—',
              photoURL:     null,
              parentName:   'Parent/Guardian',
              parentPhone:  '—',
              address:      'Home Address',
              balance:      fee.balance || 0,
            }
          }
        })
      )

      setStudents(enriched)
      setSelected(new Set(enriched.map(s => s.regNo)))
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch student balances. Check Firestore index.')
    } finally {
      setFinding(false)
    }
  }

  const toggleAll = () => {
    if (selected.size === students.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(students.map(s => s.regNo)))
    }
  }

  const toggleOne = (regNo) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(regNo) ? next.delete(regNo) : next.add(regNo)
      return next
    })
  }

  const handleBulkIssue = async () => {
    const toIssue = students.filter(s => selected.has(s.regNo))
    if (toIssue.length === 0) { toast.error('Select at least one student'); return }
    if (!departureDate)        { toast.error('Enter the departure date');     return }
    if (!returnDate)           { toast.error('Enter the expected return date'); return }
    if (returnDate < departureDate) { toast.error('Return date must be after departure'); return }

    setIssuing(true)
    setProgress({ done: 0, total: toIssue.length })

    const issued = []
    for (const s of toIssue) {
      try {
        const serial = buildSerial(s.regNo)
        const now    = serverTimestamp()

        const appData = {
          studentName:  s.studentName,
          regNo:        s.regNo,
          class:        s.class,
          studentId:    s.studentDocId,
          reason:       'Sent Home (Fees)',
          departureDate,
          returnDate,
          destination:  s.address,
          guardianName: s.parentName,
          guardianPhone: s.parentPhone,
          notes:        `Outstanding balance: ${fmt(s.balance)}`,
          documentURL:  null,
          documentName: null,
          status:       'Approved',
          source:       'admin-bulk',
          passSerial:   serial,
          appliedAt:    now,
          reviewedBy:   adminName,
          reviewedAt:   now,
        }

        const appRef = await addDoc(collection(db, 'exeatApplications'), appData)

        await setDoc(doc(db, 'exeatPasses', serial), {
          passSerial:    serial,
          regNo:         s.regNo,
          studentName:   s.studentName,
          class:         s.class,
          reason:        'Sent Home (Fees)',
          departureDate,
          returnDate,
          destination:   s.address,
          guardianName:  s.parentName,
          guardianPhone: s.parentPhone,
          documentURL:   null,
          documentName:  null,
          photoURL:      s.photoURL || null,
          issuedBy:      adminName,
          issuedAt:      now,
          term:          `Term ${TERM_NUM}`,
          year:          String(TERM_YEAR),
          valid:         true,
          source:        'admin-bulk',
          outstandingBalance: s.balance,
        })

        issued.push({ id: appRef.id, ...appData, appliedAt: new Date(), reviewedAt: new Date() })
      } catch (err) {
        console.error(`Failed for ${s.regNo}:`, err)
      }
      setProgress(prev => ({ ...prev, done: prev.done + 1 }))
    }

    setDoneList(issued)
    setIssuing(false)
    if (issued.length > 0) {
      toast.success(`${issued.length} exit pass${issued.length > 1 ? 'es' : ''} issued`)
      onCreatedBulk(issued)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-navy-800 border border-white/10 rounded-2xl overflow-hidden my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-playfair text-lg font-bold text-white">Bulk Issue — Sent Home (Fees)</h2>
            <p className="text-xs text-gray-500 font-montserrat">Generate passes for all students within a balance range</p>
          </div>
          <button onClick={onClose} disabled={issuing} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition disabled:opacity-40">
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">

          {/* ── Done summary ── */}
          {phase === 'done' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-5 text-center">
                <p className="text-3xl font-bold text-emerald-400 font-playfair mb-1">{doneList.length}</p>
                <p className="text-sm font-semibold text-emerald-400 font-montserrat">Exit pass{doneList.length !== 1 ? 'es' : ''} issued</p>
                <p className="text-xs text-gray-500 font-montserrat mt-1">All passes saved · QR codes generated · Ready to print</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5 max-h-64 overflow-y-auto">
                {doneList.map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-xs font-semibold text-white font-montserrat">{a.studentName}</p>
                      <p className="text-[10px] text-gray-500 font-montserrat font-mono">{a.passSerial}</p>
                    </div>
                    <span className="text-xs text-emerald-400 font-montserrat">Issued ✓</span>
                  </div>
                ))}
              </div>
              <button onClick={onClose} className="w-full py-3 border border-white/10 text-gray-400 font-montserrat text-xs rounded-xl hover:bg-white/5 transition">
                Close
              </button>
            </div>
          )}

          {/* ── Issuing progress ── */}
          {phase === 'issuing' && (
            <div className="py-8 flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-montserrat font-semibold text-sm">Issuing passes…</p>
                <p className="text-gray-500 font-montserrat text-xs mt-0.5">{progress.done} of {progress.total} complete</p>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-gold rounded-full transition-all duration-300"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Review: student list + dates ── */}
          {phase === 'review' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 font-montserrat">
                  <span className="text-white font-semibold">{students.length}</span> students found ·{' '}
                  <span className="text-gold font-semibold">{selected.size}</span> selected
                </p>
                <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white font-montserrat transition">
                  {selected.size === students.length
                    ? <MdCheckBox className="text-gold text-base" />
                    : <MdCheckBoxOutlineBlank className="text-base" />
                  }
                  {selected.size === students.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              <div className="border border-white/10 rounded-xl divide-y divide-white/5 max-h-60 overflow-y-auto">
                {students.map(s => (
                  <div
                    key={s.regNo}
                    onClick={() => toggleOne(s.regNo)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition"
                  >
                    {selected.has(s.regNo)
                      ? <MdCheckBox className="text-gold text-xl shrink-0" />
                      : <MdCheckBoxOutlineBlank className="text-gray-600 text-xl shrink-0" />
                    }
                    {s.photoURL
                      ? <img src={s.photoURL} alt={s.studentName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      : (
                        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                          <span className="text-gold text-xs font-bold font-playfair">{(s.studentName || '?')[0]}</span>
                        </div>
                      )
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-montserrat font-medium truncate">{s.studentName}</p>
                      <p className="text-[10px] text-gray-500 font-montserrat">{s.class} · <span className="font-mono">{s.regNo}</span></p>
                    </div>
                    <span className="text-sm font-bold text-red-400 font-playfair shrink-0">{fmt(s.balance)}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Departure Date *</label>
                  <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className={INP_DATE} />
                </div>
                <div>
                  <label className={LBL}>Expected Return Date *</label>
                  <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={departureDate} className={INP_DATE} />
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-white/10">
                <button
                  onClick={() => { setStudents([]); setSelected(new Set()) }}
                  className="flex-none px-4 py-2.5 border border-white/10 text-gray-400 font-montserrat text-xs rounded-xl hover:bg-white/5 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={handleBulkIssue}
                  disabled={selected.size === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-gold hover:bg-yellow-400 disabled:opacity-50 text-navy font-montserrat font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition"
                >
                  <MdBadge className="text-base" />
                  Issue {selected.size} Pass{selected.size !== 1 ? 'es' : ''}
                </button>
              </div>
            </>
          )}

          {/* ── Config: balance range input ── */}
          {phase === 'config' && (
            <>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-400 font-montserrat font-semibold">
                  ⚠ This will generate passes for all students whose outstanding balance falls within the range you set. Verify bursar records before proceeding.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Minimum Balance *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-montserrat text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      value={minBalance}
                      onChange={e => setMinBalance(e.target.value)}
                      className={`${INP} pl-8`}
                      placeholder="100"
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 font-montserrat mt-1">Include students with balance ≥ this amount</p>
                </div>
                <div>
                  <label className={LBL}>Maximum Balance <span className="normal-case text-gray-600">(optional)</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-montserrat text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      value={maxBalance}
                      onChange={e => setMaxBalance(e.target.value)}
                      className={`${INP} pl-8`}
                      placeholder="No limit"
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 font-montserrat mt-1">Leave blank to include all above minimum</p>
                </div>
              </div>

              <button
                onClick={findStudents}
                disabled={finding}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-60 text-white font-montserrat font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition"
              >
                {finding
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <MdSearch className="text-base" />
                }
                {finding ? 'Searching…' : 'Find Students'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ app, onClose, onApproved, onRejected }) {
  const [rejecting, setRejecting]             = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading]                 = useState(false)
  const [passData, setPassData]               = useState(null)
  const [showPass, setShowPass]               = useState(false)
  const [photoURL, setPhotoURL]               = useState(null)
  const adminName = getAdminName()

  useEffect(() => {
    if (!app.regNo) return
    getDocs(query(collection(db, 'students'), where('reg_number', '==', app.regNo), limit(1)))
      .then(snap => { if (!snap.empty) setPhotoURL(snap.docs[0].data().photoURL || null) })
      .catch(() => {})
  }, [app.regNo])

  useEffect(() => {
    if (app.status === 'Approved' && app.passSerial) {
      getDoc(doc(db, 'exeatPasses', app.passSerial))
        .then(snap => { if (snap.exists()) setPassData({ id: snap.id, ...snap.data() }) })
        .catch(() => {})
    }
  }, [app.status, app.passSerial])

  const handleApprove = async () => {
    setLoading(true)
    try {
      const serial = buildSerial(app.regNo)
      const now    = serverTimestamp()

      await updateDoc(doc(db, 'exeatApplications', app.id), {
        status:     'Approved',
        reviewedBy: adminName,
        reviewedAt: now,
        passSerial: serial,
      })

      const pass = {
        passSerial:    serial,
        regNo:         app.regNo,
        studentName:   app.studentName,
        class:         app.class,
        reason:        app.reason,
        departureDate: app.departureDate,
        returnDate:    app.returnDate,
        destination:   app.destination,
        guardianName:  app.guardianName,
        guardianPhone: app.guardianPhone,
        documentURL:   app.documentURL  || null,
        documentName:  app.documentName || null,
        photoURL:      photoURL         || null,
        issuedBy:      adminName,
        issuedAt:      now,
        term:          `Term ${TERM_NUM}`,
        year:          String(TERM_YEAR),
        valid:         true,
      }
      await setDoc(doc(db, 'exeatPasses', serial), pass)

      setPassData({ ...pass, issuedAt: new Date() })
      toast.success('Pass generated successfully')
      onApproved(app.id, serial)
    } catch (err) {
      console.error(err)
      toast.error('Failed to approve. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) { toast.error('Please enter a rejection reason'); return }
    setLoading(true)
    try {
      await updateDoc(doc(db, 'exeatApplications', app.id), {
        status:          'Rejected',
        reviewedBy:      adminName,
        reviewedAt:      serverTimestamp(),
        rejectionReason: rejectionReason.trim(),
      })
      toast.success('Application rejected')
      onRejected(app.id, rejectionReason.trim())
    } catch {
      toast.error('Failed to reject. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (showPass && passData) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-start justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:inset-auto print:static">
        <div className="w-full max-w-lg mt-4">
          <div className="flex justify-between mb-3 print:hidden">
            <button onClick={() => setShowPass(false)} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition">
              <MdClose className="text-xl" />
            </button>
          </div>
          <ExeatPass passData={{ ...passData, photoURL }} allowPrint={true} onPrint={() => window.print()} />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-navy-800 border border-white/10 rounded-2xl overflow-hidden my-4">

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-playfair text-lg font-bold text-white">Exeat Application Review</h2>
            <p className="text-xs text-gray-500 font-montserrat">{app.studentName} · {app.regNo}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition">
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[76vh]">

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border font-montserrat ${STATUS_STYLES[app.status]}`}>
              {app.status}
            </span>
            <span className="text-xs text-gray-500 font-montserrat">Applied {fmtDate(app.appliedAt)}</span>
            {app.reviewedBy && (
              <span className="text-xs text-gray-600 font-montserrat">· Reviewed by {app.reviewedBy}</span>
            )}
          </div>

          <div className="flex gap-4 items-start">
            {photoURL ? (
              <img src={photoURL} alt={app.studentName} className="w-16 h-16 rounded-full object-cover border border-white/10 shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gold/20 border border-white/10 flex items-center justify-center shrink-0">
                <span className="text-gold font-bold text-xl font-playfair">{app.studentName?.[0] || '?'}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-white font-montserrat">{app.studentName}</p>
              <p className="text-xs text-gray-400 font-montserrat">{app.class} · {app.regNo}</p>
            </div>
          </div>

          {app.reason === 'Sent Home (Fees)' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-400 font-montserrat font-semibold">
                ⚠ Fee-related exit — verify outstanding balance in the Bursar system before approving.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              ['Reason',          app.reason],
              ['Departure',       fmtDate(app.departureDate)],
              ['Expected Return', fmtDate(app.returnDate)],
              ['Destination',     app.destination],
              ['Guardian Name',   app.guardianName],
              ['Guardian Phone',  app.guardianPhone],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-[9px] uppercase tracking-widest text-gray-500 font-montserrat">{label}</p>
                <p className="text-sm text-white font-montserrat mt-0.5">{val || '—'}</p>
              </div>
            ))}
          </div>

          {app.notes && (
            <div>
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-montserrat">Additional Notes</p>
              <p className="text-sm text-gray-300 font-montserrat mt-0.5 leading-relaxed">{app.notes}</p>
            </div>
          )}

          {app.documentURL ? (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-widest text-gray-500 font-montserrat">Supporting Document</p>
                <p className="text-xs text-white font-montserrat truncate mt-0.5">{app.documentName || 'document'}</p>
              </div>
              <a href={app.documentURL} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-gold font-montserrat hover:underline shrink-0">
                <MdOpenInNew className="text-sm" /> Open
              </a>
            </div>
          ) : (
            <p className="text-xs text-gray-600 font-montserrat italic">No supporting document uploaded.</p>
          )}

          {app.status === 'Pending' && (
            <div className="border-t border-white/10 pt-5 space-y-4">
              {!rejecting ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-montserrat font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition"
                  >
                    <MdCheck className="text-base" />
                    {loading ? 'Approving…' : 'Approve & Generate Pass'}
                  </button>
                  <button
                    onClick={() => setRejecting(true)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-montserrat font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition"
                  >
                    <MdBlock className="text-base" /> Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 font-montserrat">Enter the reason for rejection — this will be shown to the student.</p>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="e.g. Insufficient documentation provided…"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 focus:outline-none rounded-xl px-4 py-3 text-white font-montserrat text-sm placeholder-gray-600 resize-none"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setRejecting(false)} className="flex-1 border border-white/10 text-gray-400 font-montserrat text-xs py-2.5 rounded-xl hover:bg-white/5 transition">
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-montserrat font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition"
                    >
                      {loading ? 'Rejecting…' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {app.status === 'Approved' && passData && (
            <div className="border-t border-white/10 pt-5">
              <button
                onClick={() => setShowPass(true)}
                className="flex items-center justify-center gap-2 w-full bg-gold hover:bg-yellow-400 text-navy font-montserrat font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition"
              >
                <MdPrint className="text-base" /> View & Print Pass
              </button>
            </div>
          )}

          {app.status === 'Rejected' && app.rejectionReason && (
            <div className="border-t border-white/10 pt-4">
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-montserrat">Rejection Reason</p>
              <p className="text-sm text-red-400 font-montserrat mt-1">{app.rejectionReason}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ExeatManagementPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState('All')
  const [search, setSearch]             = useState('')
  const [selected, setSelected]         = useState(null)
  const [showCreate, setShowCreate]     = useState(false)
  const [showBulk, setShowBulk]         = useState(false)

  useEffect(() => {
    getDocs(query(collection(db, 'exeatApplications'), orderBy('appliedAt', 'desc')))
      .then(snap => setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => toast.error('Failed to load exeat applications'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = applications
    .filter(a => activeTab === 'All' || a.status === activeTab)
    .filter(a => {
      const q = search.toLowerCase()
      return !q || a.studentName?.toLowerCase().includes(q) || a.regNo?.toLowerCase().includes(q)
    })

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? applications.length : applications.filter(a => a.status === t).length
    return acc
  }, {})

  const handleApproved = (id, serial) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'Approved', passSerial: serial } : a))
    setSelected(prev => prev?.id === id ? { ...prev, status: 'Approved', passSerial: serial } : prev)
  }
  const handleRejected = (id, reason) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'Rejected', rejectionReason: reason } : a))
    setSelected(prev => prev?.id === id ? { ...prev, status: 'Rejected', rejectionReason: reason } : prev)
  }
  const handleCreated = (app) => {
    setApplications(prev => [app, ...prev])
  }
  const handleCreatedBulk = (apps) => {
    setApplications(prev => [...apps, ...prev])
  }

  const downloadCSV = () => {
    const rows = [
      ['Student', 'Reg No', 'Class', 'Reason', 'Departure', 'Return', 'Applied', 'Status', 'Source'],
      ...filtered.map(a => [
        a.studentName || '',
        a.regNo || '',
        a.class || '',
        a.reason || '',
        fmtDate(a.departureDate),
        fmtDate(a.returnDate),
        fmtDate(a.appliedAt),
        a.status || '',
        a.source || '',
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `exeat-applications-${activeTab.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const TH = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat'
  const TD = 'py-3 px-4 text-sm text-gray-300 font-montserrat'

  return (
    <div className="space-y-6">

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #exeat-print-table, #exeat-print-table * { visibility: visible !important; }
          #exeat-print-table {
            position: absolute; top: 0; left: 0; width: 100%;
            background: #fff !important;
          }
          #exeat-print-table * {
            color: #111 !important;
            background: transparent !important;
            border-color: #ccc !important;
          }
          #exeat-print-table thead tr { background: #f3f4f6 !important; }
          #exeat-print-table thead * { background: #f3f4f6 !important; color: #374151 !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold/15 rounded-lg flex items-center justify-center shrink-0">
            <MdBadge className="text-gold" />
          </div>
          <div>
            <h1 className="font-playfair text-2xl font-bold text-white">Exeat Management</h1>
            <p className="text-xs text-gray-500 font-montserrat mt-0.5">Review student exit pass applications and issue passes</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={downloadCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-40 text-white font-montserrat font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition"
          >
            <MdDownload className="text-base" />
            Download
          </button>
          <button
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-montserrat font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition"
          >
            <MdGroups className="text-base" />
            Bulk Issue — Fees
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-montserrat font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition"
          >
            <MdAdd className="text-base" />
            Issue New Pass
          </button>
        </div>
      </div>

      <div id="exeat-print-table" className="bg-navy-800 border border-white/10 rounded-2xl overflow-hidden">

        {/* Filters + search */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-white/10">
          <div className="flex gap-1 flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-montserrat transition ${
                  activeTab === tab ? 'bg-gold text-navy' : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                {tab}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-navy/20' : 'bg-white/10 text-gray-500'}`}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
            <input
              type="text"
              placeholder="262681 or name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 focus:border-gold/40 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-white font-montserrat text-xs placeholder-gray-600 w-52"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <p className="text-sm text-gray-500 font-montserrat">
              {search ? 'No matching applications found.' : 'No applications in this category.'}
            </p>
            {!search && activeTab === 'All' && (
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 text-xs text-gold font-montserrat font-semibold hover:underline"
              >
                <MdAdd className="text-base" /> Issue a new exit pass
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={TH}>Student</th>
                  <th className={TH}>Reg No</th>
                  <th className={TH}>Class</th>
                  <th className={TH}>Reason</th>
                  <th className={TH}>Departure</th>
                  <th className={TH}>Return</th>
                  <th className={TH}>Applied</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => (
                  <tr
                    key={app.id}
                    onClick={() => setSelected(app)}
                    className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-white font-montserrat font-medium">
                      <div className="flex items-center gap-2">
                        {app.studentName}
                        {app.source === 'admin' && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-montserrat uppercase tracking-wider">Admin</span>
                        )}
                        {app.source === 'admin-bulk' && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-montserrat uppercase tracking-wider">Bulk</span>
                        )}
                      </div>
                    </td>
                    <td className={TD}><span className="font-mono text-xs">{app.regNo}</span></td>
                    <td className={TD}>{app.class}</td>
                    <td className={TD}>{app.reason}</td>
                    <td className={TD}>{fmtDate(app.departureDate)}</td>
                    <td className={TD}>{fmtDate(app.returnDate)}</td>
                    <td className={TD}>{fmtDate(app.appliedAt)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border font-montserrat ${STATUS_STYLES[app.status] || STATUS_STYLES.Pending}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreatePassModal
          onClose={() => setShowCreate(false)}
          onCreated={app => { handleCreated(app); setShowCreate(false) }}
        />
      )}

      {showBulk && (
        <BulkPassModal
          onClose={() => setShowBulk(false)}
          onCreatedBulk={apps => { handleCreatedBulk(apps); setShowBulk(false) }}
        />
      )}

      {selected && (
        <ReviewModal
          app={selected}
          onClose={() => setSelected(null)}
          onApproved={handleApproved}
          onRejected={handleRejected}
        />
      )}
    </div>
  )
}
