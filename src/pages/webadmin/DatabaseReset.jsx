import { useState, useRef, useEffect } from 'react'
import { collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase/config'
import {
  MdWarning, MdDeleteForever, MdCheckCircle, MdLoop, MdBlock,
  MdCheckBox, MdCheckBoxOutlineBlank, MdIndeterminateCheckBox,
} from 'react-icons/md'
import toast from 'react-hot-toast'

// ── Collection groups ─────────────────────────────────────────────────────────

const GROUPS = [
  {
    key: 'students',
    label: 'Student Records',
    emoji: '🎓',
    collections: [
      { name: 'students',        label: 'Students — enrollments, profiles, guardian contacts' },
      { name: 'marksRecords',    label: 'Academic marks records' },
      { name: 'academicResults', label: 'Academic results' },
      { name: 'attendance',      label: 'Attendance records' },
    ],
  },
  {
    key: 'financial',
    label: 'Financial',
    emoji: '💰',
    collections: [
      { name: 'feeAccounts',     label: 'Fee accounts & outstanding balances' },
      { name: 'receipts',        label: 'Payment receipts' },
      { name: 'expenses',        label: 'Expense records' },
      { name: 'proofOfPayments', label: 'Proof of payment submissions' },
      { name: 'financialLogs',   label: 'Financial audit trail' },
      { name: 'assets',          label: 'Asset records' },
    ],
  },
  {
    key: 'applications',
    label: 'Applications & Passes',
    emoji: '📋',
    collections: [
      { name: 'clearanceApplications', label: 'Clearance applications' },
      { name: 'clearancePasses',       label: 'Issued clearance passes' },
      { name: 'exeatApplications',     label: 'Exeat applications' },
    ],
  },
  {
    key: 'timetables',
    label: 'Timetables & Teaching',
    emoji: '📅',
    collections: [
      { name: 'timetables',         label: 'Class timetables' },
      { name: 'examTimetables',     label: 'Exam timetables' },
      { name: 'classes',            label: 'Class definitions' },
      { name: 'subjects',           label: 'Subject definitions' },
      { name: 'teacherAssignments', label: 'Teacher subject assignments' },
      { name: 'studyMaterials',     label: 'Study materials (notes & past papers)' },
    ],
  },
  {
    key: 'comms',
    label: 'Communications',
    emoji: '💬',
    collections: [
      { name: 'notifications',      label: 'Student notifications' },
      { name: 'classAnnouncements', label: 'Class announcements' },
      { name: 'contactEnquiries',   label: 'Contact form enquiries' },
    ],
  },
  {
    key: 'website',
    label: 'Website Content',
    emoji: '🌐',
    collections: [
      { name: 'staff',         label: 'Staff directory' },
      { name: 'events',        label: 'School events' },
      { name: 'calendarEvents',label: 'Calendar events' },
      { name: 'news',          label: 'News articles' },
      { name: 'gallery',       label: 'Photo gallery' },
    ],
  },
  {
    key: 'system',
    label: 'System & Logs',
    emoji: '🔒',
    collections: [
      { name: 'otpLogs',       label: 'OTP activity logs' },
      { name: 'loginAttempts', label: 'Login attempt records' },
      { name: 'securityLogs',  label: 'Security event logs' },
    ],
  },
  {
    key: 'config',
    label: 'Configuration',
    emoji: '⚙️',
    collections: [
      { name: 'config',         label: 'Grade settings & system configuration' },
      { name: 'portalSettings', label: 'Portal settings' },
    ],
  },
]

const USERS_ITEM = {
  name: '__users__',
  label: 'User accounts — staff, teachers, students',
  note: 'Web Admin accounts are always kept',
}

const ALL_NAMES = [
  ...GROUPS.flatMap(g => g.collections.map(c => c.name)),
  USERS_ITEM.name,
]

const CONFIRM_PHRASE = 'CONFIRM DELETE'

// ── Firestore helpers ─────────────────────────────────────────────────────────

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
  const snap    = await getDocs(collection(db, 'users'))
  const toDelete = snap.docs.filter(d => d.data().role !== 'web_admin')
  for (const d of toDelete) {
    try { const s = await getDocs(collection(db, 'users', d.id, 'otpSecret'));     for (const x of s.docs) await deleteDoc(x.ref) } catch {}
    try { const s = await getDocs(collection(db, 'users', d.id, 'activeSessions')); for (const x of s.docs) await deleteDoc(x.ref) } catch {}
  }
  for (let i = 0; i < toDelete.length; i += 400) {
    const batch = writeBatch(db)
    toDelete.slice(i, i + 400).forEach(d => batch.delete(d.ref))
    await batch.commit()
  }
  return toDelete.length
}

// ── Small UI atoms ────────────────────────────────────────────────────────────

function IndeterminateCheckbox({ checked, indeterminate, onChange, className = '' }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={`w-4 h-4 accent-red-500 cursor-pointer rounded ${className}`}
    />
  )
}

function ProgressRow({ item }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="shrink-0">
        {item.status === 'pending'  && <div className="w-4 h-4 rounded-full border border-gray-600" />}
        {item.status === 'running'  && <MdLoop className="text-amber-400 text-base animate-spin" />}
        {item.status === 'done'     && <MdCheckCircle className="text-emerald-400 text-base" />}
        {item.status === 'skipped'  && <MdBlock className="text-gray-600 text-base" />}
      </div>
      <p className={`flex-1 text-sm font-montserrat truncate ${
        item.status === 'running' ? 'text-amber-300' :
        item.status === 'done'    ? 'text-gray-200'  :
        item.status === 'skipped' ? 'text-gray-600'  : 'text-gray-500'
      }`}>{item.label}</p>
      {item.status === 'done' && (
        <span className="text-xs text-gray-500 font-montserrat shrink-0">
          {item.count === 0 ? 'empty' : `-${item.count}`}
        </span>
      )}
      {item.status === 'skipped' && (
        <span className="text-xs text-gray-600 font-montserrat shrink-0">kept</span>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DatabaseReset() {
  const [step,     setStep]     = useState('select')   // 'select' | 'confirm' | 'running' | 'done'
  const [selected, setSelected] = useState(new Set(ALL_NAMES))
  const [phrase,   setPhrase]   = useState('')
  const [progress, setProgress] = useState([])
  const [totalDeleted, setTotalDeleted] = useState(0)

  // ── Selection helpers ───────────────────────────────────────────────────────

  function toggle(name) {
    setSelected(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })
  }

  function toggleGroup(names) {
    const allOn = names.every(n => selected.has(n))
    setSelected(prev => {
      const n = new Set(prev)
      allOn ? names.forEach(x => n.delete(x)) : names.forEach(x => n.add(x))
      return n
    })
  }

  function selectAll()   { setSelected(new Set(ALL_NAMES)) }
  function deselectAll() { setSelected(new Set()) }

  const selectedCount = selected.size

  // ── Execution ───────────────────────────────────────────────────────────────

  function buildProgressItems() {
    const items = []
    for (const g of GROUPS) {
      for (const col of g.collections) {
        items.push({ name: col.name, label: col.label, status: selected.has(col.name) ? 'pending' : 'skipped', count: 0 })
      }
    }
    items.push({ name: '__users__', label: USERS_ITEM.label, status: selected.has('__users__') ? 'pending' : 'skipped', count: 0 })
    return items
  }

  function updateItem(name, patch) {
    setProgress(prev => prev.map(x => x.name === name ? { ...x, ...patch } : x))
  }

  async function runReset() {
    setStep('running')
    setProgress(buildProgressItems())
    let total = 0

    for (const g of GROUPS) {
      for (const col of g.collections) {
        if (!selected.has(col.name)) continue
        updateItem(col.name, { status: 'running' })
        try {
          const count = await clearCollection(col.name)
          total += count
          updateItem(col.name, { status: 'done', count })
        } catch {
          updateItem(col.name, { status: 'done', count: 0 })
        }
      }
    }

    if (selected.has('__users__')) {
      updateItem('__users__', { status: 'running' })
      try {
        const count = await clearNonAdminUsers()
        total += count
        updateItem('__users__', { status: 'done', count })
      } catch (err) {
        toast.error(`Failed to clear users: ${err.message}`)
        updateItem('__users__', { status: 'done', count: 0 })
      }
    }

    setTotalDeleted(total)
    setStep('done')
  }

  // ── Step: Select ────────────────────────────────────────────────────────────
  if (step === 'select') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-red-700/30 flex items-center justify-center shrink-0">
            <MdWarning className="text-red-400 text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-playfair">Database Reset</h1>
            <p className="text-sm text-red-400/70 font-montserrat">Select which tables to clear</p>
          </div>
        </div>

        {/* Global controls */}
        <div className="bg-[#0D1C35] border border-white/10 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-400 font-montserrat">
            <span className="font-bold text-white">{selectedCount}</span> of {ALL_NAMES.length} tables selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs font-montserrat text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-900/20 transition"
            >
              Select all
            </button>
            <button
              onClick={deselectAll}
              className="text-xs font-montserrat text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-white/5 transition"
            >
              Deselect all
            </button>
          </div>
        </div>

        {/* Groups */}
        <div className="space-y-3">
          {GROUPS.map(group => {
            const names     = group.collections.map(c => c.name)
            const numOn     = names.filter(n => selected.has(n)).length
            const allOn     = numOn === names.length
            const someOn    = numOn > 0 && !allOn

            return (
              <div key={group.key} className="bg-[#0D1C35] border border-white/10 rounded-xl overflow-hidden">
                {/* Group header */}
                <label className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-white/5 transition border-b border-white/5">
                  <IndeterminateCheckbox
                    checked={allOn}
                    indeterminate={someOn}
                    onChange={() => toggleGroup(names)}
                  />
                  <span className="text-base">{group.emoji}</span>
                  <span className="flex-1 text-sm font-semibold text-white font-montserrat">{group.label}</span>
                  <span className="text-xs text-gray-500 font-montserrat">
                    {numOn}/{names.length}
                  </span>
                </label>

                {/* Items */}
                <div className="divide-y divide-white/5">
                  {group.collections.map(col => (
                    <label key={col.name} className="flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-white/[0.03] transition">
                      <input
                        type="checkbox"
                        checked={selected.has(col.name)}
                        onChange={() => toggle(col.name)}
                        className="w-4 h-4 accent-red-500 cursor-pointer shrink-0"
                      />
                      <span className="text-sm text-gray-400 font-montserrat">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Users — special */}
          <div className="bg-[#0D1C35] border border-amber-900/40 rounded-xl overflow-hidden">
            <label className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-white/5 transition">
              <input
                type="checkbox"
                checked={selected.has('__users__')}
                onChange={() => toggle('__users__')}
                className="w-4 h-4 accent-red-500 cursor-pointer shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-amber-300 font-montserrat block">👤 User Accounts</span>
                <span className="text-xs text-gray-500 font-montserrat">{USERS_ITEM.label}</span>
                <span className="text-xs text-amber-600 font-montserrat block mt-0.5">⚠ {USERS_ITEM.note}</span>
              </div>
            </label>
          </div>
        </div>

        {/* Action bar */}
        <div className="sticky bottom-0 bg-[#0A1628] border-t border-white/10 -mx-4 px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="px-5 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm font-montserrat hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <div className="flex-1" />
          {selectedCount === 0 ? (
            <p className="text-sm text-gray-600 font-montserrat">No tables selected</p>
          ) : (
            <button
              onClick={() => setStep('confirm')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold font-montserrat transition"
            >
              <MdDeleteForever className="text-lg" />
              Clear {selectedCount} table{selectedCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Step: Confirm ───────────────────────────────────────────────────────────
  if (step === 'confirm') {
    const confirmed = phrase.trim() === CONFIRM_PHRASE

    // Build a readable summary
    const selectedCols = GROUPS.flatMap(g =>
      g.collections.filter(c => selected.has(c.name)).map(c => c.label)
    )
    if (selected.has('__users__')) selectedCols.push(USERS_ITEM.label + ' (web admins kept)')

    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-[#0D1C35] border border-red-800/40 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-red-700/20 flex items-center justify-center shrink-0">
              <MdDeleteForever className="text-red-400 text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-playfair">Confirm Deletion</h1>
              <p className="text-sm text-gray-500 font-montserrat">{selectedCount} table{selectedCount !== 1 ? 's' : ''} will be permanently cleared</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-black/30 rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-500 font-montserrat mb-3">
              Tables to be cleared
            </p>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {selectedCols.map((label, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-400 font-montserrat">
                  <span className="text-red-600 shrink-0 mt-0.5">✕</span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Phrase input */}
          <div>
            <p className="text-sm text-gray-400 font-montserrat mb-2">
              Type <span className="font-bold text-red-300 tracking-wider">{CONFIRM_PHRASE}</span> to enable the delete button
            </p>
            <input
              type="text"
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white font-montserrat text-sm outline-none focus:border-red-600/60 placeholder-gray-700 tracking-wider"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('select'); setPhrase('') }}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm font-montserrat hover:bg-white/5 transition"
            >
              Back
            </button>
            <button
              onClick={runReset}
              disabled={!confirmed}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold font-montserrat transition flex items-center justify-center gap-2 ${
                confirmed
                  ? 'bg-red-700 hover:bg-red-600 text-white'
                  : 'bg-red-900/20 text-red-900 cursor-not-allowed'
              }`}
            >
              <MdDeleteForever className="text-lg" />
              Delete {selectedCount} table{selectedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Running ─────────────────────────────────────────────────────────────────
  if (step === 'running') {
    const done  = progress.filter(x => x.status === 'done' || x.status === 'skipped').length
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
          <div className="h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="space-y-0 max-h-96 overflow-y-auto">
            {progress.filter(x => x.status !== 'skipped').map(item => <ProgressRow key={item.name} item={item} />)}
          </div>
        </div>
      </div>
    )
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  const cleared = progress.filter(x => x.status === 'done')
  const kept    = progress.filter(x => x.status === 'skipped')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-[#0D1C35] border border-emerald-700/40 rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-emerald-700/20 flex items-center justify-center shrink-0">
            <MdCheckCircle className="text-emerald-400 text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-playfair">Done</h1>
            <p className="text-sm text-gray-500 font-montserrat">
              {totalDeleted.toLocaleString()} document{totalDeleted !== 1 ? 's' : ''} deleted across {cleared.length} table{cleared.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {cleared.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-600 font-montserrat mb-2">Cleared</p>
            <div className="space-y-0 max-h-64 overflow-y-auto">
              {cleared.map(item => <ProgressRow key={item.name} item={item} />)}
            </div>
          </div>
        )}

        {kept.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-600 font-montserrat mb-2">Kept (not selected)</p>
            <div className="space-y-0 max-h-40 overflow-y-auto">
              {kept.map(item => <ProgressRow key={item.name} item={item} />)}
            </div>
          </div>
        )}

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
