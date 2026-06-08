import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { getCurrentTerm } from '../../utils/termHelpers'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import toast from 'react-hot-toast'
import {
  MdSearch, MdClose, MdPrint, MdDownload, MdWarning,
  MdArrowUpward, MdArrowDownward, MdPerson,
} from 'react-icons/md'
import { FaGraduationCap } from 'react-icons/fa'

// ── Constants & helpers ───────────────────────────────────────────────────────
const SCHOOL_ID   = 'oasis'
const { number: CURR_NUM, year: CURR_YEAR } = getCurrentTerm()

function getAdminName() {
  try { return JSON.parse(sessionStorage.getItem('adminSession') || '{}').name || 'Administrator' }
  catch { return 'Administrator' }
}

function toTermId(t)  { return t.toLowerCase().replace(/\s+/g, '-') }
function toClassId(c) { return c.toLowerCase().replace(/\s+/g, '-') }
function r1(n)        { return Math.round(n * 10) / 10 }
function fmtAvg(n)    { return n === null || n === undefined ? '—' : `${r1(n)}%` }

function generateTermOptions() {
  const opts = []
  for (let t = CURR_NUM; t >= 1; t--) opts.push(`Term ${t} ${CURR_YEAR}`)
  for (let t = 3; t >= 1; t--)       opts.push(`Term ${t} ${CURR_YEAR - 1}`)
  return opts
}

function computeGrade(avg) {
  if (avg === null) return '—'
  if (avg >= 75) return 'A'
  if (avg >= 65) return 'B'
  if (avg >= 55) return 'C'
  if (avg >= 45) return 'D'
  if (avg >= 35) return 'E'
  return 'F'
}

const GRADE_COLORS = {
  A: 'text-emerald-400', B: 'text-blue-400', C: 'text-[#C9A84C]',
  D: 'text-orange-400',  E: 'text-red-400',  F: 'text-red-600', '—': 'text-gray-500',
}

function studentStatus(avg) {
  if (avg === null)  return { label: 'No Data', cls: 'bg-gray-500/10 text-gray-500 border-gray-500/20' }
  if (avg >= 70)     return { label: 'Distinction', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
  if (avg >= 60)     return { label: 'Merit', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' }
  if (avg >= 50)     return { label: 'Pass', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
  return              { label: 'Fail', cls: 'bg-red-500/15 text-red-400 border-red-500/30' }
}

function subjectStatus(avg) {
  if (avg >= 70) return { label: 'Strong', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
  if (avg >= 50) return { label: 'Fair',   cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
  return          { label: 'Weak',   cls: 'bg-red-500/15 text-red-400 border-red-500/30' }
}

function subjectBarColor(avg) {
  if (avg >= 70) return '#22c55e'
  if (avg >= 50) return '#f59e0b'
  return '#ef4444'
}

function getClassRating(avg) {
  if (avg >= 75) return { label: 'EXCELLENT', tier: 'emerald', remark: 'This class is performing exceptionally well above the school standard.' }
  if (avg >= 60) return { label: 'GOOD',      tier: 'blue',   remark: 'This class is performing well above the school standard.' }
  if (avg >= 50) return { label: 'AVERAGE',   tier: 'amber',  remark: 'This class is meeting the minimum standard. There is room for improvement.' }
  if (avg >= 40) return { label: 'BELOW AVERAGE', tier: 'orange', remark: 'This class is performing below the school standard. Targeted support is recommended.' }
  return { label: 'POOR', tier: 'red', remark: 'This class requires immediate academic intervention.' }
}

const TIER = {
  emerald: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', banner: 'bg-emerald-500/5 border-emerald-500/20' },
  blue:    { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',           banner: 'bg-blue-500/5 border-blue-500/20' },
  amber:   { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',        banner: 'bg-amber-500/5 border-amber-500/20' },
  orange:  { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',     banner: 'bg-orange-500/5 border-orange-500/20' },
  red:     { badge: 'bg-red-500/15 text-red-400 border-red-500/30',              banner: 'bg-red-500/5 border-red-500/20' },
}

const RANK_ROW = {
  1: 'bg-[#C9A84C]/10 border-l-2 border-[#C9A84C]',
  2: 'bg-gray-400/5 border-l-2 border-gray-400/40',
  3: 'bg-orange-700/5 border-l-2 border-orange-700/30',
}

const RANK_BADGE = {
  1: 'text-[#C9A84C] font-bold text-base',
  2: 'text-gray-300 font-bold text-base',
  3: 'text-orange-400 font-bold text-base',
}

const TERMS = generateTermOptions()
const TH = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat whitespace-nowrap select-none'
const TD = 'py-3 px-4 text-sm text-gray-300 font-montserrat'

// ── Student Subject Breakdown Modal ──────────────────────────────────────────
function StudentBreakdownModal({ student, rank, classTotal, onClose }) {
  const chartData = student.marks
    .sort((a, b) => a.subject.localeCompare(b.subject))
    .map(m => ({
      subject: m.subject.length > 9 ? m.subject.slice(0, 9) + '…' : m.subject,
      fullSubject: m.subject,
      mark: m.mark,
    }))

  const status = studentStatus(student.avg)

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0D1C35] border border-white/10 rounded-2xl overflow-hidden my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            {student.photoURL ? (
              <img src={student.photoURL} alt={student.name} className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 border border-white/10 flex items-center justify-center shrink-0">
                <MdPerson className="text-[#C9A84C] text-2xl" />
              </div>
            )}
            <div>
              <p className="text-white font-bold font-montserrat text-sm">{student.name}</p>
              <p className="text-gray-400 font-montserrat text-xs">{student.regNo} · {student.class}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition">
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[78vh]">

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Overall Average', value: fmtAvg(student.avg), accent: true },
              { label: 'Grade', value: student.grade, accent: true },
              { label: 'Rank in Class', value: student.avg !== null ? `#${rank} of ${classTotal}` : '—', accent: false },
            ].map(({ label, value, accent }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-[9px] uppercase tracking-widest text-gray-500 font-montserrat mb-1">{label}</p>
                <p className={`text-xl font-bold font-playfair ${accent ? (GRADE_COLORS[student.grade] || 'text-white') : 'text-white'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border font-montserrat ${status.cls}`}>
              {status.label}
            </span>
          </div>

          {/* Bar chart */}
          {chartData.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-montserrat mb-3">Marks per Subject</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="subject"
                      tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'Montserrat' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'Montserrat' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: '#0D1C35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'Montserrat', fontSize: 12 }}
                      labelStyle={{ color: '#fff' }}
                      itemStyle={{ color: '#C9A84C' }}
                      formatter={(value, name, props) => [value, props.payload.fullSubject]}
                    />
                    <ReferenceLine
                      y={50}
                      stroke="#ef4444"
                      strokeDasharray="4 3"
                      label={{ value: 'Pass line (50)', fill: '#ef4444', fontSize: 9, fontFamily: 'Montserrat' }}
                    />
                    <Bar dataKey="mark" radius={[4, 4, 0, 0]} fill="#C9A84C" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Subject table */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-montserrat mb-3">Subject Breakdown</p>
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">Subject</th>
                    <th className="text-center py-2.5 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">Mark</th>
                    <th className="text-center py-2.5 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">Grade</th>
                    <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {student.marks.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-sm text-gray-500 font-montserrat">No marks recorded</td></tr>
                  ) : (
                    [...student.marks].sort((a, b) => b.mark - a.mark).map(({ subject, mark }) => {
                      const g = computeGrade(mark)
                      const isFail = mark < 50
                      return (
                        <tr key={subject} className={`border-b border-white/5 ${isFail ? 'bg-red-500/5' : ''}`}>
                          <td className="py-2.5 px-4 text-sm text-white font-montserrat">{subject}</td>
                          <td className={`py-2.5 px-4 text-sm text-center font-bold font-montserrat ${isFail ? 'text-red-400' : 'text-white'}`}>{mark}</td>
                          <td className={`py-2.5 px-4 text-sm text-center font-bold font-montserrat ${GRADE_COLORS[g]}`}>{g}</td>
                          <td className="py-2.5 px-4">
                            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border font-montserrat ${subjectStatus(mark).cls}`}>
                              {subjectStatus(mark).label}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ClassPerformancePage() {
  const [classes,      setClasses]      = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTerm,  setSelectedTerm]  = useState(`Term ${CURR_NUM} ${CURR_YEAR}`)
  const [loading,      setLoading]      = useState(false)
  const [loaded,       setLoaded]       = useState(false)
  const [rankings,     setRankings]     = useState([])
  const [subjectStats, setSubjectStats] = useState([])
  const [summary,      setSummary]      = useState(null)
  const [sortCol,      setSortCol]      = useState('rank')
  const [sortDir,      setSortDir]      = useState('asc')
  const [search,       setSearch]       = useState('')
  const [selected,     setSelected]     = useState(null)

  /* Load class list on mount */
  useEffect(() => {
    getDocs(collection(db, 'students'))
      .then(snap => {
        const cls = [...new Set(snap.docs.map(d => d.data().class).filter(Boolean))].sort()
        setClasses(cls)
      })
      .catch(() => {})
  }, [])

  /* Load and compute results */
  const handleLoad = async () => {
    if (!selectedClass) { toast.error('Select a class'); return }
    if (!selectedTerm)  { toast.error('Select a term');  return }
    setLoading(true)
    setLoaded(false)
    try {
      const termId  = toTermId(selectedTerm)
      const classId = toClassId(selectedClass)

      const [studSnap, marksSnap] = await Promise.all([
        getDocs(query(collection(db, 'students'), where('class', '==', selectedClass))),
        getDocs(collection(db, `schools/${SCHOOL_ID}/terms/${termId}/classes/${classId}/students`)),
      ])

      if (studSnap.empty) { toast.error('No students found for this class.'); return }

      /* Build student map */
      const studMap = {}
      studSnap.docs.forEach(d => {
        const data = d.data()
        const key  = data.reg_number || d.id
        studMap[key] = {
          docId:    d.id,
          name:     data.name || data.fullName || '—',
          regNo:    key,
          class:    data.class || selectedClass,
          photoURL: data.photoURL || null,
          subjects: {},
          comment:  '',
        }
      })

      /* Overlay uploaded marks */
      marksSnap.docs.forEach(d => {
        const data = d.data()
        const key  = data.regNo || d.id
        if (studMap[key]) {
          studMap[key].subjects = data.subjects || {}
          studMap[key].comment  = data.comment  || ''
        }
      })

      /* Compute per-student stats */
      const computed = Object.values(studMap).map(s => {
        const marks = Object.entries(s.subjects)
          .filter(([, v]) => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
          .map(([sub, v]) => ({ subject: sub, mark: Number(v) }))

        const avg = marks.length
          ? r1(marks.reduce((sum, m) => sum + m.mark, 0) / marks.length)
          : null

        const sorted = [...marks].sort((a, b) => b.mark - a.mark)
        return {
          ...s,
          marks,
          avg,
          grade:       computeGrade(avg),
          bestSubject: sorted[0]?.subject                         || '—',
          worstSubject: sorted[sorted.length - 1]?.subject       || '—',
        }
      })

      /* Sort: students with marks first (by avg desc), then no-marks at bottom */
      computed.sort((a, b) => {
        if (a.avg === null && b.avg === null) return 0
        if (a.avg === null) return 1
        if (b.avg === null) return -1
        return b.avg - a.avg
      })
      computed.forEach((s, i) => { s.rank = i + 1 })

      /* Class summary */
      const withMarks = computed.filter(s => s.avg !== null)
      const classAvg  = withMarks.length
        ? r1(withMarks.reduce((sum, s) => sum + s.avg, 0) / withMarks.length)
        : 0
      const passRate = withMarks.length
        ? r1((withMarks.filter(s => s.avg >= 50).length / withMarks.length) * 100)
        : 0
      const highest = withMarks.length ? Math.max(...withMarks.map(s => s.avg)) : 0

      /* Subject stats */
      const allSubs = new Set(computed.flatMap(s => s.marks.map(m => m.subject)))
      const subStats = [...allSubs].map(subject => {
        const vals = computed.flatMap(s => s.marks.filter(m => m.subject === subject).map(m => m.mark))
        const avg  = vals.length ? r1(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
        return {
          subject,
          avg,
          highest:   vals.length ? Math.max(...vals) : 0,
          lowest:    vals.length ? Math.min(...vals) : 0,
          passRate:  vals.length ? r1((vals.filter(m => m >= 50).length / vals.length) * 100) : 0,
          failCount: vals.filter(m => m < 50).length,
          count:     vals.length,
        }
      }).sort((a, b) => a.avg - b.avg)  // weakest first

      setRankings(computed)
      setSubjectStats(subStats)
      setSummary({ total: computed.length, classAvg, passRate, highest })
      setLoaded(true)
      toast.success(`Loaded ${computed.length} students`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load results.')
    } finally {
      setLoading(false)
    }
  }

  /* Sorting */
  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const sortedRankings = useMemo(() => {
    const copy = [...rankings]
    copy.sort((a, b) => {
      let av, bv
      switch (sortCol) {
        case 'name': av = a.name;     bv = b.name;     break
        case 'avg':  av = a.avg ?? -1; bv = b.avg ?? -1; break
        case 'rank': av = a.rank;     bv = b.rank;     break
        default:     return 0
      }
      if (typeof av === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return copy
  }, [rankings, sortCol, sortDir])

  const filteredRankings = useMemo(() => {
    if (!search.trim()) return sortedRankings
    const q = search.toLowerCase()
    return sortedRankings.filter(s =>
      s.name.toLowerCase().includes(q) || s.regNo.toLowerCase().includes(q)
    )
  }, [sortedRankings, search])

  /* CSV export */
  const exportCSV = () => {
    const header = ['Rank', 'Name', 'Reg No', 'Average', 'Grade', 'Best Subject', 'Weakest Subject'].join(',')
    const rows = rankings.map(s =>
      [s.rank, `"${s.name}"`, s.regNo, s.avg ?? '', s.grade, `"${s.bestSubject}"`, `"${s.worstSubject}"`].join(',')
    )
    const safeName  = selectedClass.replace(/\s+/g, '-')
    const safeTerm  = selectedTerm.replace(/\s+/g, '-')
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `ClassReport-${safeName}-${safeTerm}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const adminName   = getAdminName()
  const today       = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const rating      = summary ? getClassRating(summary.classAvg) : null
  const weakSubs    = subjectStats.filter(s => s.avg < 50)
  const avgColor    = !summary ? '' : summary.classAvg >= 70 ? 'text-emerald-400' : summary.classAvg >= 50 ? 'text-amber-400' : 'text-red-400'

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="ml-1 text-gray-600">↕</span>
    return sortDir === 'asc'
      ? <MdArrowUpward className="inline ml-1 text-[#C9A84C] text-xs" />
      : <MdArrowDownward className="inline ml-1 text-[#C9A84C] text-xs" />
  }

  return (
    <>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #class-perf-report, #class-perf-report * { visibility: visible !important; }
          #class-perf-report {
            position: fixed; top: 0; left: 0; right: 0;
            padding: 10mm; background: white; color: black;
          }
          .print-watermark { display: flex !important; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 10mm; }
        }
      `}</style>

      <div className="space-y-6 max-w-[1400px]">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C9A84C]/15 rounded-lg flex items-center justify-center shrink-0">
              <MdSearch className="text-[#C9A84C]" />
            </div>
            <div>
              <h1 className="font-playfair text-2xl font-bold text-white">Class Performance</h1>
              <p className="text-xs text-gray-500 font-montserrat mt-0.5">Rankings, subject analysis and academic overview</p>
            </div>
          </div>
          {loaded && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-montserrat font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition"
              >
                <MdDownload className="text-base" /> Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1628] font-montserrat font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition"
              >
                <MdPrint className="text-base" /> Print Report
              </button>
            </div>
          )}
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="bg-[#0D1C35] border border-white/10 rounded-2xl p-5 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-montserrat mb-1.5">Class</label>
              <select
                value={selectedClass}
                onChange={e => { setSelectedClass(e.target.value); setLoaded(false) }}
                className="w-full bg-white/5 border border-white/10 focus:border-[#C9A84C]/40 focus:outline-none rounded-xl px-4 py-2.5 text-white font-montserrat text-sm"
              >
                <option value="">Select class…</option>
                {classes.map(c => <option key={c} value={c} className="bg-[#0D1C35]">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-montserrat mb-1.5">Term</label>
              <select
                value={selectedTerm}
                onChange={e => { setSelectedTerm(e.target.value); setLoaded(false) }}
                className="w-full bg-white/5 border border-white/10 focus:border-[#C9A84C]/40 focus:outline-none rounded-xl px-4 py-2.5 text-white font-montserrat text-sm"
              >
                {TERMS.map(t => <option key={t} value={t} className="bg-[#0D1C35]">{t}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleLoad}
                disabled={loading || !selectedClass}
                className="w-full flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 disabled:opacity-50 text-[#0A1628] font-montserrat font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-[#0A1628]/30 border-t-[#0A1628] rounded-full animate-spin" />
                  : null
                }
                {loading ? 'Loading…' : 'Load Results'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Loaded content ─────────────────────────────────────────────── */}
        {loaded && summary && (
          <div id="class-perf-report" className="space-y-6">

            {/* Print watermark */}
            <div
              className="print-watermark hidden fixed inset-0 items-center justify-center pointer-events-none select-none overflow-hidden"
              style={{ zIndex: 0 }}
              aria-hidden="true"
            >
              <span style={{ fontSize: 80, fontWeight: 900, color: '#000', opacity: 0.04, transform: 'rotate(-45deg)', whiteSpace: 'nowrap', letterSpacing: '0.15em' }}>
                CONFIDENTIAL
              </span>
            </div>

            {/* Print header (hidden on screen) */}
            <div className="hidden print:block mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#C9A84C] rounded-lg flex items-center justify-center shrink-0">
                  <FaGraduationCap className="text-[#0A1628]" />
                </div>
                <div>
                  <p className="font-bold text-lg">Oasis Private College</p>
                  <p className="text-xs text-gray-500">Checheche, Zimbabwe</p>
                </div>
              </div>
              <p className="font-bold text-base mt-2">Class Performance Report — {selectedClass} · {selectedTerm}</p>
              <hr className="my-2 border-gray-300" />
            </div>

            {/* ── Summary cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Students',  value: summary.total,          sub: 'in selected class',      cls: 'text-white' },
                { label: 'Class Average',   value: `${summary.classAvg}%`, sub: 'overall average mark',   cls: avgColor },
                { label: 'Pass Rate',       value: `${summary.passRate}%`, sub: 'students avg ≥ 50',      cls: summary.passRate >= 50 ? 'text-emerald-400' : 'text-red-400' },
                { label: 'Highest Average', value: `${summary.highest}%`,  sub: 'top student overall avg', cls: 'text-[#C9A84C]' },
              ].map(({ label, value, sub, cls }) => (
                <div key={label} className="bg-[#0D1C35] border border-white/10 rounded-2xl p-5">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-montserrat mb-1">{label}</p>
                  <p className={`text-3xl font-bold font-playfair ${cls}`}>{value}</p>
                  <p className="text-[10px] text-gray-600 font-montserrat mt-1">{sub}</p>
                </div>
              ))}
            </div>

            {/* ── Class rating banner ─────────────────────────────────────── */}
            {rating && (
              <div className={`border rounded-2xl px-6 py-5 flex flex-wrap items-center justify-between gap-4 ${TIER[rating.tier].banner}`}>
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-bold px-5 py-2 rounded-xl border font-montserrat tracking-widest ${TIER[rating.tier].badge}`}>
                    {rating.label}
                  </span>
                  <div>
                    <p className="text-white font-montserrat font-semibold text-sm">Class Performance Rating</p>
                    <p className="text-gray-400 font-montserrat text-xs mt-0.5">{rating.remark}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-4xl font-bold font-playfair ${TIER[rating.tier].badge.split(' ').find(c => c.startsWith('text-'))}`}>
                    {summary.classAvg}%
                  </p>
                  <p className="text-[10px] text-gray-500 font-montserrat uppercase tracking-widest mt-0.5">Class Average</p>
                </div>
              </div>
            )}

            {/* ── Subject performance table ───────────────────────────────── */}
            <div className="bg-[#0D1C35] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="font-playfair font-bold text-white text-lg">Subject Performance</h2>
                <p className="text-xs text-gray-500 font-montserrat mt-0.5">Sorted weakest to strongest · {subjectStats.length} subjects</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className={TH}>Subject</th>
                      <th className={`${TH} text-center`}>Highest</th>
                      <th className={`${TH} text-center`}>Lowest</th>
                      <th className={`${TH} text-center`}>Class Avg</th>
                      <th className={`${TH} text-center`}>Pass Rate</th>
                      <th className={TH}>Performance</th>
                      <th className={TH}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectStats.length === 0 ? (
                      <tr><td colSpan={7} className="py-10 text-center text-sm text-gray-500 font-montserrat">No marks data found for this term.</td></tr>
                    ) : (
                      subjectStats.map(sub => {
                        const st = subjectStatus(sub.avg)
                        return (
                          <tr key={sub.subject} className={`border-b border-white/5 ${sub.avg < 50 ? 'bg-red-500/5' : ''}`}>
                            <td className="py-3 px-4 text-sm text-white font-montserrat font-medium">{sub.subject}</td>
                            <td className="py-3 px-4 text-sm text-emerald-400 font-montserrat font-semibold text-center">{sub.highest}</td>
                            <td className="py-3 px-4 text-sm text-red-400 font-montserrat font-semibold text-center">{sub.lowest}</td>
                            <td className={`py-3 px-4 text-sm font-bold font-montserrat text-center ${sub.avg >= 50 ? 'text-white' : 'text-red-400'}`}>
                              {r1(sub.avg)}%
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300 font-montserrat text-center">{r1(sub.passRate)}%</td>
                            <td className="py-3 px-4 w-40">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(sub.avg, 100)}%`, backgroundColor: subjectBarColor(sub.avg) }}
                                  />
                                </div>
                                <span className="text-[10px] text-gray-500 font-montserrat w-8 text-right">{r1(sub.avg)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border font-montserrat ${st.cls}`}>
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Underperforming subjects panel ─────────────────────────── */}
            {weakSubs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MdWarning className="text-red-400 text-lg" />
                  <h2 className="font-playfair font-bold text-white text-base">Underperforming Subjects</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {weakSubs.map(sub => (
                    <div key={sub.subject} className="bg-red-500/8 border border-red-500/25 rounded-xl px-4 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-red-400 font-montserrat">{sub.subject}</p>
                        <span className="text-lg font-bold text-red-400 font-playfair">{r1(sub.avg)}%</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-montserrat mb-1">
                        {sub.failCount} student{sub.failCount !== 1 ? 's' : ''} failed · {r1(sub.passRate)}% pass rate
                      </p>
                      <p className="text-[10px] text-amber-400 font-montserrat font-semibold">
                        ⚠ Recommend remedial classes for {sub.subject}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Student rankings table ──────────────────────────────────── */}
            <div className="bg-[#0D1C35] border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-white/10">
                <div>
                  <h2 className="font-playfair font-bold text-white text-lg">Student Rankings</h2>
                  <p className="text-xs text-gray-500 font-montserrat mt-0.5">
                    {rankings.length} students · click a row to view subject breakdown
                  </p>
                </div>
                <div className="relative no-print">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or reg…"
                    className="bg-white/5 border border-white/10 focus:border-[#C9A84C]/40 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-white font-montserrat text-xs placeholder-gray-600 w-56"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className={`${TH} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('rank')}>
                        Rank <SortIcon col="rank" />
                      </th>
                      <th className={`${TH} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('name')}>
                        Student Name <SortIcon col="name" />
                      </th>
                      <th className={TH}>Reg No</th>
                      <th className={`${TH} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('avg')}>
                        Overall Avg <SortIcon col="avg" />
                      </th>
                      <th className={TH}>Grade</th>
                      <th className={TH}>Best Subject</th>
                      <th className={TH}>Weakest Subject</th>
                      <th className={TH}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRankings.length === 0 ? (
                      <tr><td colSpan={8} className="py-10 text-center text-sm text-gray-500 font-montserrat">No matching students found.</td></tr>
                    ) : (
                      filteredRankings.map(s => {
                        const st     = studentStatus(s.avg)
                        const isFail = s.avg !== null && s.avg < 50
                        const rowCls = RANK_ROW[s.rank] || (isFail ? 'bg-red-500/5 border-l-2 border-transparent' : 'border-l-2 border-transparent')
                        return (
                          <tr
                            key={s.regNo}
                            onClick={() => setSelected(s)}
                            className={`border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors ${rowCls}`}
                          >
                            <td className="py-3 px-4">
                              <span className={RANK_BADGE[s.rank] || 'text-sm font-semibold text-gray-400 font-montserrat'}>
                                {s.rank <= 3 ? ['🥇','🥈','🥉'][s.rank - 1] : null}{' '}
                                #{s.rank}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-white font-montserrat font-medium">{s.name}</td>
                            <td className={`${TD} font-mono`}>{s.regNo}</td>
                            <td className={`py-3 px-4 text-sm font-bold font-montserrat ${isFail ? 'text-red-400' : 'text-white'}`}>
                              {fmtAvg(s.avg)}
                            </td>
                            <td className={`py-3 px-4 text-sm font-bold font-montserrat ${GRADE_COLORS[s.grade]}`}>{s.grade}</td>
                            <td className="py-3 px-4 text-xs text-gray-400 font-montserrat max-w-[120px] truncate">{s.bestSubject}</td>
                            <td className="py-3 px-4 text-xs text-gray-400 font-montserrat max-w-[120px] truncate">{s.worstSubject}</td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border font-montserrat ${st.cls}`}>
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print footer */}
            <div className="hidden print:block mt-6 pt-4 border-t border-gray-200 text-[10px] text-gray-400">
              <p>Generated by Oasis Private College Management System on {today} by {adminName}</p>
              <p>Class: {selectedClass} · Term: {selectedTerm} · Total students: {summary.total}</p>
            </div>

          </div>
        )}

        {/* Empty state */}
        {!loaded && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-[#C9A84C]/10 rounded-2xl flex items-center justify-center mb-4">
              <MdSearch className="text-[#C9A84C] text-3xl" />
            </div>
            <p className="text-gray-400 font-montserrat text-sm font-semibold">Select a class and term, then click Load Results</p>
            <p className="text-gray-600 font-montserrat text-xs mt-1">Rankings, subject analysis and ratings will appear here</p>
          </div>
        )}
      </div>

      {/* ── Student breakdown modal ─────────────────────────────────────── */}
      {selected && (
        <StudentBreakdownModal
          student={selected}
          rank={selected.rank}
          classTotal={rankings.filter(s => s.avg !== null).length}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
