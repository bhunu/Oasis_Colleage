import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getCurrentTerm } from '../utils/termHelpers'
import { MdPrint as IconPrint } from 'react-icons/md'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const SCHOOL_ID = 'oasis'
const { number: CURR_NUM, year: CURR_YEAR } = getCurrentTerm()

function toTermId(t)  { return t.toLowerCase().replace(/\s+/g, '-') }
function toClassId(c) { return c.toLowerCase().replace(/\s+/g, '-') }

function generateTerms() {
  const opts = []
  for (let t = CURR_NUM; t >= 1; t--) opts.push(`Term ${t} ${CURR_YEAR}`)
  for (let t = 3; t >= 1; t--)        opts.push(`Term ${t} ${CURR_YEAR - 1}`)
  return opts
}

function computeGrade(mark) {
  if (mark === null || mark === undefined) return { grade: '—', color: 'text-gray-400' }
  if (mark >= 75) return { grade: 'A', color: 'text-green-600' }
  if (mark >= 65) return { grade: 'B', color: 'text-blue-600' }
  if (mark >= 55) return { grade: 'C', color: 'text-amber-600' }
  if (mark >= 45) return { grade: 'D', color: 'text-orange-500' }
  if (mark >= 35) return { grade: 'E', color: 'text-orange-600' }
  return { grade: 'F', color: 'text-red-600' }
}

const TERMS = generateTerms()

export default function Reports() {
  const [classes,      setClasses]      = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTerm,  setSelectedTerm]  = useState(`Term ${CURR_NUM} ${CURR_YEAR}`)
  const [students,     setStudents]     = useState([])      // from students collection
  const [marksDocs,    setMarksDocs]    = useState([])      // from schools/.../students subcollection
  const [loading,      setLoading]      = useState(false)
  const [loaded,       setLoaded]       = useState(false)
  const [view,         setView]         = useState('class')

  /* Load class list on mount */
  useEffect(() => {
    getDocs(collection(db, 'students'))
      .then(snap => {
        const cls = [...new Set(snap.docs.map(d => d.data().class).filter(Boolean))].sort()
        setClasses(cls)
      })
      .catch(() => {})
  }, [])

  /* Load data when class or term changes */
  useEffect(() => {
    if (!selectedClass || !selectedTerm) return
    setLoading(true)
    setLoaded(false)

    const termId  = toTermId(selectedTerm)
    const classId = toClassId(selectedClass)

    Promise.all([
      getDocs(query(collection(db, 'students'), where('class', '==', selectedClass))),
      getDocs(collection(db, `schools/${SCHOOL_ID}/terms/${termId}/classes/${classId}/students`)),
    ])
      .then(([studSnap, marksSnap]) => {
        const studs = studSnap.docs
          .map(d => ({ firestoreId: d.id, ...d.data() }))
          .sort((a, b) => (a.name || a.fullName || '').localeCompare(b.name || b.fullName || ''))
        const marks = marksSnap.docs.map(d => ({ docId: d.id, ...d.data() }))
        setStudents(studs)
        setMarksDocs(marks)
        setLoaded(true)
      })
      .catch(() => {
        setStudents([])
        setMarksDocs([])
      })
      .finally(() => setLoading(false))
  }, [selectedClass, selectedTerm])

  /* ── Derived: subject class averages (for bar chart) ── */
  const subjectAverages = () => {
    const subjectMap = {}
    marksDocs.forEach(doc => {
      const subs = doc.subjects || {}
      Object.entries(subs).forEach(([name, val]) => {
        if (val === null || val === undefined || val === '' || isNaN(Number(val))) return
        if (!subjectMap[name]) subjectMap[name] = []
        subjectMap[name].push(Number(val))
      })
    })
    return Object.entries(subjectMap)
      .map(([subject, vals]) => ({
        subject,
        average: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        count:   vals.length,
      }))
      .sort((a, b) => a.average - b.average) // weakest subjects first
  }

  /* ── Derived: student rankings ── */
  const studentRankings = () => {
    // Build a lookup by reg_number
    const marksLookup = {}
    marksDocs.forEach(doc => {
      marksLookup[doc.regNo || doc.docId] = doc.subjects || {}
    })

    return students
      .map(s => {
        const regNo = s.reg_number || s.firestoreId
        const subs  = marksLookup[regNo] || {}
        const vals  = Object.values(subs).filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v))).map(Number)
        const avg   = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
        return { ...s, regNo, avg }
      })
      .sort((a, b) => {
        if (a.avg === null && b.avg === null) return 0
        if (a.avg === null) return 1
        if (b.avg === null) return -1
        return b.avg - a.avg
      })
  }

  const chartData = subjectAverages()
  const rankings  = studentRankings()
  const hasMarks  = marksDocs.length > 0

  return (
    <div className="space-y-4">

      {/* ── Selector bar ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-end">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[140px]"
            >
              <option value="">Select class…</option>
              {classes.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[160px]"
            >
              {TERMS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {selectedClass && loaded && (
            <div className="flex gap-2">
              <button
                onClick={() => setView('class')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === 'class' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Class Summary
              </button>
              <button
                onClick={() => setView('students')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === 'students' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Student Results
              </button>
            </div>
          )}
        </div>
      </div>

      {!selectedClass && (
        <div className="bg-white rounded-lg border border-gray-200 py-16 text-center text-gray-500">
          Select a class and term to view academic reports.
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* ── Class Summary view ── */}
      {selectedClass && loaded && !loading && view === 'class' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">{selectedClass} — Subject Performance</h3>
          <p className="text-xs text-gray-400 mb-6">{selectedTerm} · {marksDocs.length} student record{marksDocs.length !== 1 ? 's' : ''} uploaded</p>

          {!hasMarks ? (
            <p className="text-gray-500 text-center py-10">
              No marks uploaded for <strong>{selectedClass}</strong> — <strong>{selectedTerm}</strong> yet.
              <br />
              <span className="text-xs text-gray-400 mt-1 block">Use the End of Term Marks Upload page to upload a CSV file.</span>
            </p>
          ) : (
            <>
              {/* Bar chart */}
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" angle={-35} textAnchor="end" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name, props) => [`${value}%`, `Class Average (${props.payload.count} students)`]}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 3" label={{ value: 'Pass (50%)', fill: '#ef4444', fontSize: 11 }} />
                  <Bar dataKey="average" name="Class Average" radius={[4, 4, 0, 0]}
                    fill="#378ADD"
                    label={{ position: 'top', fontSize: 10, formatter: v => `${v}%` }}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Subject summary table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Subject</th>
                      <th className="text-center py-2.5 px-4 font-semibold text-gray-600">Students</th>
                      <th className="text-center py-2.5 px-4 font-semibold text-gray-600">Class Avg</th>
                      <th className="text-center py-2.5 px-4 font-semibold text-gray-600">Pass Rate</th>
                      <th className="py-2.5 px-4 font-semibold text-gray-600">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map(sub => {
                      /* Recompute pass rate for table */
                      const vals = marksDocs.flatMap(d => {
                        const v = (d.subjects || {})[sub.subject]
                        return v !== null && v !== undefined && v !== '' && !isNaN(Number(v)) ? [Number(v)] : []
                      })
                      const passRate = vals.length ? Math.round((vals.filter(v => v >= 50).length / vals.length) * 100) : 0
                      const isWeak   = sub.average < 50
                      return (
                        <tr key={sub.subject} className={`border-b border-gray-100 ${isWeak ? 'bg-red-50' : ''}`}>
                          <td className="py-2.5 px-4 font-medium text-gray-900">{sub.subject}</td>
                          <td className="py-2.5 px-4 text-center text-gray-500">{sub.count}</td>
                          <td className={`py-2.5 px-4 text-center font-bold ${isWeak ? 'text-red-600' : 'text-gray-800'}`}>{sub.average}%</td>
                          <td className={`py-2.5 px-4 text-center ${passRate < 50 ? 'text-red-500' : 'text-green-600'}`}>{passRate}%</td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${sub.average}%`, backgroundColor: sub.average >= 70 ? '#22c55e' : sub.average >= 50 ? '#f59e0b' : '#ef4444' }}
                                />
                              </div>
                              <span className={`text-xs font-semibold w-14 ${isWeak ? 'text-red-500' : sub.average >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                                {isWeak ? 'Weak' : sub.average >= 70 ? 'Strong' : 'Fair'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Student Results view ── */}
      {selectedClass && loaded && !loading && view === 'students' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-900">Student Results — {selectedClass}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{selectedTerm} · ranked by overall average</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 transition"
            >
              <IconPrint size={14} /> Print
            </button>
          </div>

          {students.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No students found in {selectedClass}.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Student Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Reg No</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Overall Avg</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Grade</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((s, i) => {
                    const { grade, color } = computeGrade(s.avg)
                    const isFail = s.avg !== null && s.avg < 50
                    const medal  = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                    const status = s.avg === null ? { label: 'No Data', cls: 'bg-gray-100 text-gray-500' }
                      : s.avg >= 70 ? { label: 'Distinction', cls: 'bg-green-100 text-green-700' }
                      : s.avg >= 60 ? { label: 'Merit', cls: 'bg-blue-100 text-blue-700' }
                      : s.avg >= 50 ? { label: 'Pass', cls: 'bg-amber-100 text-amber-700' }
                      : { label: 'Fail', cls: 'bg-red-100 text-red-700' }
                    return (
                      <tr key={s.firestoreId} className={`border-b border-gray-100 hover:bg-gray-50 ${isFail ? 'bg-red-50/60' : i < 3 ? 'bg-amber-50/40' : ''}`}>
                        <td className="py-3 px-6 text-gray-600 font-semibold">
                          {medal && <span className="mr-1">{medal}</span>}
                          {i + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">{s.name || s.fullName || '—'}</td>
                        <td className="py-3 px-4 text-gray-500 font-mono text-xs">{s.regNo}</td>
                        <td className={`py-3 px-4 text-center font-semibold ${isFail ? 'text-red-600' : 'text-gray-900'}`}>
                          {s.avg !== null ? `${s.avg}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-bold text-lg ${color}`}>{grade}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${status.cls}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
