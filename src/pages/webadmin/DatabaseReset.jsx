import { useState } from 'react'
import { collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase/config'
import {
  MdWarning, MdDeleteForever, MdCheckCircle, MdLoop, MdBlock,
} from 'react-icons/md'
import toast from 'react-hot-toast'

// Every collection that exists in the database.
// users is handled separately — web_admin documents are preserved.
const COLLECTIONS = [
  { name: 'students',               label: 'Students — enrollments, profiles, guardian contacts' },
  { name: 'feeAccounts',            label: 'Fee accounts & outstanding balances' },
  { name: 'receipts',               label: 'Payment receipts' },
  { name: 'expenses',               label: 'Expense records' },
  { name: 'proofOfPayments',        label: 'Proof of payment submissions' },
  { name: 'financialLogs',          label: 'Financial audit trail' },
  { name: 'notifications',          label: 'Student notifications' },
  { name: 'clearanceApplications',  label: 'Clearance applications' },
  { name: 'clearancePasses',        label: 'Issued clearance passes' },
  { name: 'exeatApplications',      label: 'Exeat applications' },
  { name: 'marksRecords',           label: 'Academic marks records' },
  { name: 'academicResults',        label: 'Academic results' },
  { name: 'attendance',             label: 'Attendance records' },
  { name: 'timetables',             label: 'Class timetables' },
  { name: 'examTimetables',         label: 'Exam timetables' },
  { name: 'teacherAssignments',     label: 'Teacher subject assignments' },
  { name: 'classAnnouncements',     label: 'Class announcements' },
  { name: 'classes',                label: 'Class definitions' },
  { name: 'subjects',               label: 'Subject definitions' },
  { name: 'staff',                  label: 'Staff directory' },
  { name: 'events',                 label: 'School events' },
  { name: 'calendarEvents',         label: 'Calendar events' },
  { name: 'news',                   label: 'News articles' },
  { name: 'gallery',                label: 'Photo gallery' },
  { name: 'contactEnquiries',       label: 'Contact form enquiries' },
  { name: 'otpLogs',                label: 'OTP activity logs' },
  { name: 'loginAttempts',          label: 'Login attempt records' },
  { name: 'securityLogs',           label: 'Security event logs' },
  { name: 'assets',                 label: 'Asset records' },
  { name: 'config',                 label: 'Grade settings & system configuration' },
  { name: 'portalSettings',         label: 'Portal settings' },
]

const CONFIRM_PHRASE = 'DELETE ALL DATA'

async function clearCollection(name) {
  const snap = await getDocs(collection(db, name))
  if (snap.empty) return 0
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db)
    snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref))
    await batch.commit()
  }
  return snap.docs.length
}

async function clearNonAdminUsers() {
  const snap = await getDocs(collection(db, 'users'))
  const toDelete = snap.docs.filter(d => d.data().role !== 'web_admin')

  for (const d of toDelete) {
    // Delete known subcollections before removing parent
    try {
      const otpSnap = await getDocs(collection(db, 'users', d.id, 'otpSecret'))
      for (const sub of otpSnap.docs) await deleteDoc(sub.ref)
    } catch {}
    try {
      const sessSnap = await getDocs(collection(db, 'users', d.id, 'activeSessions'))
      for (const sub of sessSnap.docs) await deleteDoc(sub.ref)
    } catch {}
  }

  for (let i = 0; i < toDelete.length; i += 400) {
    const batch = writeBatch(db)
    toDelete.slice(i, i + 400).forEach(d => batch.delete(d.ref))
    await batch.commit()
  }
  return toDelete.length
}

// ── Status row displayed during / after execution ────────────────────────────

function ProgressRow({ item }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="mt-0.5 shrink-0">
        {item.status === 'pending'  && <div className="w-4 h-4 rounded-full border border-gray-600" />}
        {item.status === 'running'  && <MdLoop className="text-amber-400 text-base animate-spin" />}
        {item.status === 'done'     && <MdCheckCircle className="text-emerald-400 text-base" />}
        {item.status === 'skipped'  && <MdBlock className="text-gray-600 text-base" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium font-montserrat truncate ${
          item.status === 'pending' ? 'text-gray-500' :
          item.status === 'running' ? 'text-amber-300' :
          item.status === 'done'    ? 'text-gray-200' : 'text-gray-600'
        }`}>{item.label}</p>
      </div>
      <div className="shrink-0 text-right">
        {item.status === 'done' && (
          <span className="text-xs font-montserrat text-gray-500">
            {item.count === 0 ? 'empty' : `-${item.count} docs`}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DatabaseReset() {
  const [step, setStep] = useState(1)       // 1 = warning, 2 = confirm, 'running', 'done'
  const [phrase, setPhrase] = useState('')
  const [progress, setProgress] = useState([])
  const [totalDeleted, setTotalDeleted] = useState(0)

  const allItems = [
    ...COLLECTIONS.map(c => ({ ...c, status: 'pending', count: 0 })),
    { name: '__users__', label: 'User accounts — staff, teachers, students (web admins kept)', status: 'pending', count: 0 },
  ]

  function initProgress() {
    setProgress(allItems)
  }

  function updateItem(name, patch) {
    setProgress(prev => prev.map(x => x.name === name ? { ...x, ...patch } : x))
  }

  async function runReset() {
    setStep('running')
    initProgress()
    let total = 0

    for (const col of COLLECTIONS) {
      updateItem(col.name, { status: 'running' })
      try {
        const count = await clearCollection(col.name)
        total += count
        updateItem(col.name, { status: 'done', count })
      } catch (err) {
        updateItem(col.name, { status: 'done', count: 0 })
      }
    }

    // Users — partial delete
    updateItem('__users__', { status: 'running' })
    try {
      const count = await clearNonAdminUsers()
      total += count
      updateItem('__users__', { status: 'done', count })
    } catch (err) {
      toast.error(`Failed to clear users: ${err.message}`)
      updateItem('__users__', { status: 'done', count: 0 })
    }

    setTotalDeleted(total)
    setStep('done')
  }

  // ── Step 1: Warning ─────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-red-950/40 border border-red-700/50 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-red-700/30 flex items-center justify-center shrink-0">
              <MdWarning className="text-red-400 text-2xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-red-300 font-playfair">Database Reset</h1>
              <p className="text-sm text-red-400/70 font-montserrat">This action cannot be undone</p>
            </div>
          </div>

          <p className="text-gray-300 text-sm font-montserrat leading-relaxed mb-6">
            This will permanently delete <strong className="text-red-300">all data</strong> from the
            database. The only records that will be preserved are Web Admin user accounts.
            All students, staff, financial records, timetables, results, and settings will be erased.
          </p>

          <div className="bg-black/30 rounded-xl p-4 mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-500 font-montserrat mb-3">
              The following will be permanently deleted
            </p>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {COLLECTIONS.map(c => (
                <div key={c.name} className="flex items-start gap-2 text-xs text-gray-400 font-montserrat">
                  <span className="text-red-600 shrink-0 mt-0.5">✕</span>
                  {c.label}
                </div>
              ))}
              <div className="flex items-start gap-2 text-xs text-gray-400 font-montserrat">
                <span className="text-amber-600 shrink-0 mt-0.5">~</span>
                User accounts — staff, teachers, students <span className="text-amber-500">(web admins kept)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm font-montserrat hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold font-montserrat transition"
            >
              I understand — proceed
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2: Confirm phrase ──────────────────────────────────────────────────
  if (step === 2) {
    const confirmed = phrase.trim() === CONFIRM_PHRASE
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-[#0D1C35] border border-red-800/40 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-red-700/20 flex items-center justify-center shrink-0">
              <MdDeleteForever className="text-red-400 text-2xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-playfair">Final Confirmation</h1>
              <p className="text-sm text-gray-500 font-montserrat">Type the phrase below to unlock the reset button</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-400 font-montserrat mb-3">
              Type <span className="font-bold text-red-300 tracking-wider">{CONFIRM_PHRASE}</span> to confirm
            </p>
            <input
              type="text"
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white font-montserrat text-sm outline-none focus:border-red-600/60 placeholder-gray-700 tracking-wider"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); setPhrase('') }}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm font-montserrat hover:bg-white/5 transition"
            >
              Back
            </button>
            <button
              onClick={runReset}
              disabled={!confirmed}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold font-montserrat transition flex items-center justify-center gap-2 ${
                confirmed
                  ? 'bg-red-700 hover:bg-red-600 text-white cursor-pointer'
                  : 'bg-red-900/20 text-red-900 cursor-not-allowed'
              }`}
            >
              <MdDeleteForever className="text-lg" />
              Reset Database
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Running ─────────────────────────────────────────────────────────────────
  if (step === 'running') {
    const done  = progress.filter(x => x.status === 'done').length
    const total = progress.length
    const pct   = total > 0 ? Math.round((done / total) * 100) : 0

    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-[#0D1C35] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <MdLoop className="text-amber-400 text-3xl animate-spin" />
            <div>
              <h1 className="text-xl font-bold text-white font-playfair">Clearing database…</h1>
              <p className="text-sm text-gray-500 font-montserrat">Do not close this tab</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="space-y-0 max-h-96 overflow-y-auto">
            {progress.map(item => <ProgressRow key={item.name} item={item} />)}
          </div>
        </div>
      </div>
    )
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-[#0D1C35] border border-emerald-700/40 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-700/20 flex items-center justify-center shrink-0">
            <MdCheckCircle className="text-emerald-400 text-2xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-playfair">Database cleared</h1>
            <p className="text-sm text-gray-500 font-montserrat">
              {totalDeleted.toLocaleString()} document{totalDeleted !== 1 ? 's' : ''} deleted
            </p>
          </div>
        </div>

        <div className="space-y-0 max-h-96 overflow-y-auto mb-8">
          {progress.map(item => <ProgressRow key={item.name} item={item} />)}
        </div>

        <p className="text-xs text-gray-600 font-montserrat mb-4">
          Web admin accounts were preserved. You can now re-enrol students, re-configure settings, and restart the academic year.
        </p>

        <a
          href="/admin"
          className="block w-full py-2.5 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-semibold font-montserrat text-center hover:bg-[#C9A84C]/20 transition"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  )
}
