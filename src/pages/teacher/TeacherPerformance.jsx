import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { SCHOOL_ID } from '../../utils/schoolConfig'
import { getCurrentTerm } from '../../utils/termHelpers'
import { MdBarChart, MdSearch } from 'react-icons/md'

const CARD    = 'bg-[#0D1C35] border border-white/10 rounded-xl'
const VIOLET  = '#7C3AED'
const { number: CURR_NUM, year: CURR_YEAR } = getCurrentTerm()

const DEFAULT_O_GRADES = [
  { grade: 'A', min: 75, max: 100 },
  { grade: 'B', min: 65, max: 74 },
  { grade: 'C', min: 50, max: 64 },
  { grade: 'D', min: 40, max: 49 },
  { grade: 'U', min: 0,  max: 39  },
]

function toTermId(t)  { return t.toLowerCase().replace(/\s+/g, '-') }
function toClassId(c) { return c.toLowerCase().replace(/\s+/g, '-') }

function computeGrade(avg, table) {
  if (avg == null) return '—'
  const n = Math.round(Number(avg))
  return [...table].sort((a, b) => b.min - a.min).find(g => n >= g.min)?.grade ?? '—'
}

const GRADE_CLS = {
  A: 'text-emerald-400', B: 'text-emerald-400', C: 'text-[#C9A84C]',
  D: 'text-orange-400',  U: 'text-red-400',      '—': 'text-gray-500',
}

function termOptions() {
  const opts = []
  for (let t = CURR_NUM; t >= 1; t--) opts.push(`Term ${t} ${CURR_YEAR}`)
  for (let t = 3; t >= 1; t--)        opts.push(`Term ${t} ${CURR_YEAR - 1}`)
  return opts
}

export default function TeacherPerformance() {
  const session = JSON.parse(sessionStorage.getItem('teacherSession') || '{}')
  const TERMS   = useMemo(() => termOptions(), [])

  const [assignments, setAssignments] = useState([])
  const [selClass,    setSelClass]    = useState('')
  const [term,        setTerm]        = useState(TERMS[0] ?? '')
  const [students,    setStudents]    = useState([])
  const [search,      setSearch]      = useState('')
  const [loadingBase, setLoadingBase] = useState(true)
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (!session.uid) { setLoadingBase(false); return }
    getDocs(query(collection(db, 'teacherAssignments'), where('uid', '==', session.uid)))
      .then(snap => {
        const a = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setAssignments(a)
        if (a.length > 0) setSelClass(a[0].className)
      })
      .catch(() => {})
      .finally(() => setLoadingBase(false))
  }, [session.uid])

  useEffect(() => {
    if (!selClass || !term) return
    const termId  = toTermId(term)
    const classId = toClassId(selClass)
    const path    = `schools/${SCHOOL_ID}/terms/${termId}/classes/${classId}/students`
    setLoadingData(true)
    setStudents([])
    getDocs(collection(db, path))
      .then(snap => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoadingData(false))
  }, [selClass, term])

  const uniqueClasses = [...new Set(assignments.map(a => a.className))]

  const filtered = useMemo(() => {
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter(s =>
      (s.name ?? '').toLowerCase().includes(q) ||
      (s.regNumber ?? s.reg_number ?? '').toLowerCase().includes(q)
    )
  }, [students, search])

  const gradeTable = DEFAULT_O_GRADES

  const avg = (s) => {
    const marks = Object.values(s.subjects ?? {}).map(sub => sub.average ?? sub.mark ?? sub).filter(v => typeof v === 'number')
    if (marks.length === 0) return null
    return marks.reduce((a, b) => a + b, 0) / marks.length
  }

  const classAvg = useMemo(() => {
    const avgs = students.map(avg).filter(v => v !== null)
    if (avgs.length === 0) return null
    return avgs.reduce((a, b) => a + b, 0) / avgs.length
  }, [students])

  const r1 = (n) => n == null ? '—' : `${Math.round(n * 10) / 10}%`

  return (
    <div className="space-y-6">

      <div>
        <h1 className="font-playfair text-2xl font-bold text-white">Class Performance</h1>
        <p className="text-gray-400 font-montserrat text-sm mt-1">View exam results for your assigned classes.</p>
      </div>

      {loadingBase ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : uniqueClasses.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <MdBarChart className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 font-montserrat text-sm">No class assignments. Contact your admin.</p>
        </div>
      ) : (
        <>
          {/* Selectors */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[160px]">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Class</label>
              <select value={selClass} onChange={e => setSelClass(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 font-montserrat focus:outline-none">
                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-52">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Term</label>
              <select value={term} onChange={e => setTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 font-montserrat focus:outline-none">
                {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className={`${CARD} p-4 text-center`}>
              <p className="text-2xl font-bold font-playfair text-white">{loadingData ? '…' : students.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-montserrat">Students</p>
            </div>
            <div className={`${CARD} p-4 text-center`}>
              <p className="text-2xl font-bold font-playfair" style={{ color: VIOLET }}>{loadingData ? '…' : r1(classAvg)}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-montserrat">Class Average</p>
            </div>
            <div className={`${CARD} p-4 text-center`}>
              <p className="text-2xl font-bold font-playfair text-[#C9A84C]">
                {loadingData ? '…' : computeGrade(classAvg, gradeTable)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-montserrat">Class Grade</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xs">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search student…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 font-montserrat focus:outline-none"
            />
          </div>

          {/* Table */}
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className={`${CARD} p-10 text-center`}>
              <p className="text-gray-500 font-montserrat text-sm">No results uploaded for {selClass} · {term}.</p>
            </div>
          ) : (
            <div className={`${CARD} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-montserrat">#</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-montserrat">Student</th>
                      {Object.keys(filtered[0]?.subjects ?? {}).map(subj => (
                        <th key={subj} className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-montserrat whitespace-nowrap">{subj}</th>
                      ))}
                      <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-montserrat">Avg</th>
                      <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-montserrat">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((s, i) => {
                      const a = avg(s)
                      const g = computeGrade(a, gradeTable)
                      return (
                        <tr key={s.id} className="hover:bg-white/5 transition">
                          <td className="px-4 py-3 text-gray-600 font-montserrat text-xs">{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="text-white font-montserrat font-semibold text-sm">{s.name ?? '—'}</p>
                            <p className="text-gray-500 font-montserrat text-[10px]">{s.regNumber ?? s.reg_number ?? ''}</p>
                          </td>
                          {Object.entries(s.subjects ?? {}).map(([subj, data]) => {
                            const mark = typeof data === 'object' ? (data.average ?? data.mark ?? null) : data
                            return (
                              <td key={subj} className="px-3 py-3 text-center font-montserrat text-sm text-gray-300">
                                {mark != null ? `${Math.round(mark * 10) / 10}%` : '—'}
                              </td>
                            )
                          })}
                          <td className="px-4 py-3 text-center font-montserrat text-sm text-gray-300">{r1(a)}</td>
                          <td className={`px-4 py-3 text-center font-montserrat font-bold text-sm ${GRADE_CLS[g] ?? 'text-gray-500'}`}>{g}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
