import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useNavigate } from 'react-router-dom'
import {
  MdSearch as IconSearch,
  MdPersonAdd as IconUserPlus,
  MdPerson as IconPerson,
  MdArrowBack,
  MdPrint,
} from 'react-icons/md'

export default function Students() {
  const navigate = useNavigate()
  const [students, setStudents]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [classFilter, setClassFilter] = useState('All classes')
  const [selected, setSelected]     = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, 'students'), orderBy('createdAt', 'desc')))
        setStudents(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })))
      } catch {
        setStudents([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Unique classes from loaded data, sorted
  const classOptions = useMemo(() => {
    const unique = [...new Set(students.map(s => s.class).filter(Boolean))].sort()
    return ['All classes', ...unique]
  }, [students])

  const filtered = students.filter(s => {
    const matchSearch =
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.reg_number?.toLowerCase().includes(search.toLowerCase())
    const matchClass = classFilter === 'All classes' || s.class === classFilter
    return matchSearch && matchClass
  })

  // ── Student detail view ───────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="max-w-3xl space-y-4">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white font-montserrat transition-colors"
        >
          <MdArrowBack />
          Back to student list
        </button>

        <div className="bg-[#0D1C35] border border-white/10 rounded-2xl p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#C9A84C]/15 rounded-full flex items-center justify-center">
                <IconPerson size={28} className="text-[#C9A84C]" />
              </div>
              <div>
                <h2 className="font-playfair text-2xl font-bold text-white leading-tight">{selected.fullName}</h2>
                <p className="font-montserrat text-[#C9A84C] text-sm font-semibold tracking-wider">{selected.reg_number || '—'}</p>
              </div>
            </div>
            <span className="bg-[#C9A84C]/15 text-[#C9A84C] text-xs font-montserrat font-semibold px-3 py-1.5 rounded-full border border-[#C9A84C]/30">
              {selected.class}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="font-montserrat text-[9px] uppercase tracking-widest text-gray-600 mb-4">Personal Information</p>
              <div className="space-y-3">
                <Row label="Reg Number"     value={selected.reg_number} />
                <Row label="Date of Birth"  value={selected.dateOfBirth} />
                <Row label="Gender"         value={selected.gender} />
                <Row label="Home Address"   value={selected.homeAddress} />
                <Row label="Student Type"   value={selected.studentType === 'returning' ? 'Returning' : 'New'} />
                <Row label="Enrolment Date" value={selected.enrolmentDate} />
              </div>
            </div>
            <div>
              <p className="font-montserrat text-[9px] uppercase tracking-widest text-gray-600 mb-4">Guardian Information</p>
              <div className="space-y-3">
                <Row label="Guardian Name" value={selected.guardianName} />
                <Row label="Phone"         value={selected.guardianPhone} />
                <Row label="Email"         value={selected.guardianEmail} />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex gap-3">
            <button
              onClick={() => navigate('/fees')}
              className="bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1628] font-montserrat text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all"
            >
              View Fee Account
            </button>
          </div>
        </div>
      </div>
    )
  }

  const printList = () => {
    const label = classFilter === 'All classes' ? 'All Classes' : classFilter
    const rows = filtered.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.fullName || '—'}</td>
        <td class="reg">${s.reg_number || '—'}</td>
        <td>${s.class || '—'}</td>
        <td>${s.gender || '—'}</td>
        <td>${s.guardianName || '—'}</td>
        <td>${s.guardianPhone || '—'}</td>
        <td>${s.enrolmentDate || '—'}</td>
      </tr>`).join('')

    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Student Records — ${label}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #C9A84C; }
    .school  { font-size: 18px; font-weight: bold; color: #0A1628; }
    .sub     { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-top: 2px; }
    .meta    { text-align: right; font-size: 10px; color: #888; line-height: 1.8; }
    .meta b  { color: #1a1a1a; }
    table  { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead  { background: #0A1628; color: #fff; }
    th     { padding: 8px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
    td     { padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: middle; }
    td.reg { font-family: monospace; font-weight: bold; color: #C9A84C; }
    tr:nth-child(even) td { background: #f9f9f9; }
    .footer { margin-top: 20px; font-size: 9px; color: #bbb; text-align: center; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="school">Oasis Private College</div>
      <div class="sub">Checheche, Zimbabwe · Student Records</div>
    </div>
    <div class="meta">
      <div>Filter: <b>${label}</b></div>
      <div>Total: <b>${filtered.length} student${filtered.length !== 1 ? 's' : ''}</b></div>
      <div>Printed: <b>${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</b></div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Full Name</th>
        <th>Reg Number</th>
        <th>Class</th>
        <th>Gender</th>
        <th>Guardian Name</th>
        <th>Guardian Phone</th>
        <th>Enrolled</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Oasis Private College — Confidential Student Record — ${new Date().getFullYear()}</div>
</body>
</html>`)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search by name or reg number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-[#C9A84C]/40 focus:outline-none rounded-xl text-white font-montserrat text-sm placeholder-gray-600 transition-all"
          />
        </div>

        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          className="bg-white/5 border border-white/10 focus:border-[#C9A84C]/40 focus:outline-none rounded-xl px-3 py-2.5 text-gray-300 font-montserrat text-sm transition-all"
        >
          {classOptions.map(c => <option key={c} value={c} className="bg-[#0D1C35]">{c}</option>)}
        </select>

        <button
          onClick={printList}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 text-gray-300 font-montserrat text-xs font-semibold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all"
        >
          <MdPrint size={16} />
          Print List
        </button>

        <button
          onClick={() => navigate('/enrol')}
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1628] font-montserrat text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all"
        >
          <IconUserPlus size={16} />
          Enrol Student
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0D1C35] border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <h3 className="font-playfair font-semibold text-white">Student Records</h3>
          <span className="font-montserrat text-xs text-gray-500">
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A84C] mb-3" />
            <p className="font-montserrat text-sm text-gray-500">Loading students…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center font-montserrat text-sm text-gray-500">
            {search || classFilter !== 'All classes' ? 'No students match your search.' : 'No students enrolled yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <Th>Name</Th>
                  <Th>Reg Number</Th>
                  <Th>Class</Th>
                  <Th>Gender</Th>
                  <Th>Guardian</Th>
                  <Th>Enrolled</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr
                    key={s.firestoreId}
                    onClick={() => setSelected(s)}
                    className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-6 font-montserrat font-semibold text-white text-sm">{s.fullName}</td>
                    <td className="py-3.5 px-4 font-mono text-[#C9A84C] text-xs font-semibold">{s.reg_number || '—'}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-montserrat px-2.5 py-1 rounded-full border border-[#C9A84C]/20">
                        {s.class}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-montserrat text-gray-400 text-sm">{s.gender}</td>
                    <td className="py-3.5 px-4 font-montserrat text-gray-400 text-sm">{s.guardianName}</td>
                    <td className="py-3.5 px-4 font-montserrat text-gray-500 text-sm">{s.enrolmentDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Th({ children }) {
  return (
    <th className="text-left py-3 px-4 first:px-6 font-montserrat text-[10px] uppercase tracking-widest text-gray-500">
      {children}
    </th>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <p className="font-montserrat text-[10px] uppercase tracking-wider text-gray-600 mb-0.5">{label}</p>
      <p className="font-montserrat text-sm text-white">{value || '—'}</p>
    </div>
  )
}
