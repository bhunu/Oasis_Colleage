import { useState, useEffect } from 'react'
import {
  collection, getDocs, query, where, orderBy,
  doc, setDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../firebase/config'
import toast from 'react-hot-toast'
import { MdSave as IconSave, MdCheckCircle as IconCheck } from 'react-icons/md'

const CLASSES = ['Form 1A', 'Form 1B', 'Form 2A', 'Form 2B', 'Form 3A', 'Form 3B', 'Form 4A', 'Form 4B']
const SUBJECTS = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Shona', 'Religious Studies', 'Physical Education']
const CURRENT_TERM = '2-2025'

export default function Coursework() {
  const [user] = useAuthState(auth)
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!selectedClass) return
    setLoading(true)
    setSaved(false)
    setMarks({})

    async function loadStudents() {
      try {
        const snap = await getDocs(query(collection(db, 'students'), where('class', '==', selectedClass), orderBy('fullName')))
        const list = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }))
        setStudents(list)

        // Try to load existing marks
        if (selectedSubject) {
          const marksId = `${selectedClass}_${selectedSubject}_${CURRENT_TERM}`.replace(/\s+/g, '_')
          const marksSnap = await getDocs(query(collection(db, 'marksRecords'), where('classId', '==', marksId)))
          const existing = {}
          marksSnap.docs.forEach(d => {
            const data = d.data()
            existing[data.studentId] = data.mark
          })
          setMarks(existing)
        }
      } catch (e) {
        toast.error('Failed to load students')
      } finally {
        setLoading(false)
      }
    }
    loadStudents()
  }, [selectedClass, selectedSubject])

  const handleMark = (studentId, value) => {
    const num = Math.min(100, Math.max(0, Number(value)))
    setMarks(prev => ({ ...prev, [studentId]: isNaN(num) ? '' : num }))
    setSaved(false)
  }

  const getGrade = (mark) => {
    if (mark >= 80) return { grade: 'A', color: 'text-green-600' }
    if (mark >= 70) return { grade: 'B', color: 'text-blue-600' }
    if (mark >= 60) return { grade: 'C', color: 'text-amber-600' }
    if (mark >= 50) return { grade: 'D', color: 'text-orange-600' }
    return { grade: 'F', color: 'text-red-600' }
  }

  const handleSave = async () => {
    if (!selectedClass || !selectedSubject) {
      toast.error('Select a class and subject first')
      return
    }
    setSaving(true)
    try {
      const batch = []
      for (const student of students) {
        const mark = marks[student.registrationId]
        if (mark === undefined || mark === '') continue
        const docId = `${student.registrationId}_${selectedSubject}_${CURRENT_TERM}`.replace(/\s+/g, '_')
        batch.push(setDoc(doc(db, 'marksRecords', docId), {
          studentId: student.registrationId,
          studentName: student.fullName,
          class: selectedClass,
          classId: `${selectedClass}_${selectedSubject}_${CURRENT_TERM}`.replace(/\s+/g, '_'),
          subject: selectedSubject,
          term: CURRENT_TERM,
          mark: Number(mark),
          uploadedBy: user?.email || 'admin',
          uploadedAt: serverTimestamp(),
        }))
      }
      await Promise.all(batch)
      setSaved(true)
      toast.success(`Marks saved for ${selectedClass} — ${selectedSubject}`)
    } catch (e) {
      toast.error('Failed to save marks')
    } finally {
      setSaving(false)
    }
  }

  const enteredCount = students.filter(s => marks[s.registrationId] !== undefined && marks[s.registrationId] !== '').length

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Select Class &amp; Subject</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select class…</option>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select subject…</option>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSave}
              disabled={saving || !selectedClass || !selectedSubject || enteredCount === 0}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saved ? <IconCheck size={16} /> : <IconSave size={16} />}
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save Marks'}
            </button>
          </div>
        </div>
      </div>

      {/* Marks Table */}
      {selectedClass && selectedSubject && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-900">{selectedClass} — {selectedSubject}</h3>
              <p className="text-xs text-gray-500">Term {CURRENT_TERM.replace('-', ' — ')} · Coursework marks out of 100</p>
            </div>
            <span className="text-sm text-gray-500">{enteredCount}/{students.length} entered</span>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No students in {selectedClass}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Student Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Reg. ID</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Mark / 100</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const mark = marks[s.registrationId]
                    const gradeInfo = mark !== undefined && mark !== '' ? getGrade(Number(mark)) : null
                    return (
                      <tr key={s.firestoreId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-6 text-gray-500">{i + 1}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{s.fullName}</td>
                        <td className="py-3 px-4 text-gray-500 font-mono text-xs">{s.registrationId}</td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={mark ?? ''}
                            onChange={e => handleMark(s.registrationId, e.target.value)}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-center text-sm"
                            placeholder="—"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          {gradeInfo && (
                            <span className={`font-bold text-lg ${gradeInfo.color}`}>{gradeInfo.grade}</span>
                          )}
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

      {!selectedClass && (
        <div className="bg-white rounded-lg border border-gray-200 py-16 text-center text-gray-500">
          Select a class and subject above to enter coursework marks.
        </div>
      )}
    </div>
  )
}
