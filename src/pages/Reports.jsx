import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { MdSearch as IconSearch, MdPrint as IconPrint } from 'react-icons/md'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CLASSES = ['Form 1A', 'Form 1B', 'Form 2A', 'Form 2B', 'Form 3A', 'Form 3B', 'Form 4A', 'Form 4B']
const CURRENT_TERM = '2-2025'

export default function Reports() {
  const [selectedClass, setSelectedClass] = useState('')
  const [students, setStudents] = useState([])
  const [marksData, setMarksData] = useState([])
  const [examData, setExamData] = useState([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('class')

  useEffect(() => {
    if (!selectedClass) return
    setLoading(true)

    async function load() {
      try {
        const [studSnap, marksSnap, examSnap] = await Promise.all([
          getDocs(query(collection(db, 'students'), where('class', '==', selectedClass))),
          getDocs(query(collection(db, 'marksRecords'), where('class', '==', selectedClass), where('term', '==', CURRENT_TERM))),
          getDocs(query(collection(db, 'examResults'), where('class', '==', selectedClass), where('term', '==', CURRENT_TERM))),
        ])

        setStudents(studSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() })).sort((a, b) => a.fullName?.localeCompare(b.fullName)))
        setMarksData(marksSnap.docs.map(d => d.data()))
        setExamData(examSnap.docs.map(d => d.data()))
      } catch {
        setStudents([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedClass])

  const getStudentAverage = (studentId, dataSet) => {
    const studentMarks = dataSet.filter(m => m.studentId === studentId)
    if (!studentMarks.length) return null
    return studentMarks.reduce((sum, m) => sum + (m.mark || 0), 0) / studentMarks.length
  }

  const subjectAverages = () => {
    const subjects = [...new Set([...marksData, ...examData].map(m => m.subject))]
    return subjects.map(subject => {
      const cw = marksData.filter(m => m.subject === subject)
      const ex = examData.filter(m => m.subject === subject)
      const cwAvg = cw.length ? cw.reduce((s, m) => s + m.mark, 0) / cw.length : null
      const exAvg = ex.length ? ex.reduce((s, m) => s + m.mark, 0) / ex.length : null
      return {
        subject,
        coursework: cwAvg ? Math.round(cwAvg) : 0,
        exam: exAvg ? Math.round(exAvg) : 0,
      }
    })
  }

  const studentReport = (student) => {
    const cwAvg = getStudentAverage(student.registrationId, marksData)
    const exAvg = getStudentAverage(student.registrationId, examData)
    const overall = cwAvg !== null && exAvg !== null
      ? (cwAvg * 0.4 + exAvg * 0.6)
      : cwAvg ?? exAvg ?? null
    return { cwAvg, exAvg, overall }
  }

  const getGrade = (mark) => {
    if (mark === null || mark === undefined) return { grade: '—', color: 'text-gray-400' }
    if (mark >= 80) return { grade: 'A', color: 'text-green-600' }
    if (mark >= 70) return { grade: 'B', color: 'text-blue-600' }
    if (mark >= 60) return { grade: 'C', color: 'text-amber-600' }
    if (mark >= 50) return { grade: 'D', color: 'text-orange-600' }
    return { grade: 'F', color: 'text-red-600' }
  }

  return (
    <div className="space-y-4">
      {/* Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select class…</option>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {selectedClass && (
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
          Select a class to view academic reports.
        </div>
      )}

      {selectedClass && !loading && view === 'class' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">{selectedClass} — Subject Performance</h3>
          {subjectAverages().length === 0 ? (
            <p className="text-gray-500 text-center py-8">No marks uploaded for this class yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={subjectAverages()} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" angle={-35} textAnchor="end" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="coursework" name="Coursework" fill="#378ADD" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exam" name="Exam" fill="#7F77DD" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {selectedClass && !loading && view === 'students' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Student Results — {selectedClass}</h3>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 transition"
            >
              <IconPrint size={14} />
              Print
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
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">CW Avg</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Exam Avg</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Overall</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {students
                    .map(s => ({ ...s, ...studentReport(s) }))
                    .sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1))
                    .map((s, i) => {
                      const gradeInfo = getGrade(s.overall)
                      return (
                        <tr key={s.firestoreId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-6 text-gray-500">{i + 1}</td>
                          <td className="py-3 px-4 font-medium text-gray-900">{s.fullName}</td>
                          <td className="py-3 px-4 text-center text-gray-600">
                            {s.cwAvg !== null ? `${s.cwAvg.toFixed(1)}%` : '—'}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-600">
                            {s.exAvg !== null ? `${s.exAvg.toFixed(1)}%` : '—'}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-gray-900">
                            {s.overall !== null ? `${s.overall.toFixed(1)}%` : '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-bold text-lg ${gradeInfo.color}`}>{gradeInfo.grade}</span>
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

      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}
