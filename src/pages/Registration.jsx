import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  MdSearch as IconSearch,
  MdPrint as IconPrint,
  MdBadge as IconBadge,
} from 'react-icons/md'

export default function Registration() {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('All classes')
  const [printTarget, setPrintTarget] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [studSnap, classSnap] = await Promise.all([
          getDocs(query(collection(db, 'students'), orderBy('createdAt', 'desc'))),
          getDocs(collection(db, 'classes')),
        ])
        setStudents(studSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() })))
        const names = classSnap.docs.map(d => d.data().name).filter(Boolean).sort()
        setClasses(['All classes', ...names])
      } catch {
        setStudents([])
        setClasses(['All classes'])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = students.filter(s => {
    const matchSearch =
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.reg_number?.toLowerCase().includes(search.toLowerCase())
    const matchClass = classFilter === 'All classes' || s.class === classFilter
    return matchSearch && matchClass
  })

  const handlePrint = (student) => {
    setPrintTarget(student)
    setTimeout(() => window.print(), 200)
  }

  return (
    <>
      {/* Print-only card */}
      {printTarget && (
        <div className="hidden print:block fixed inset-0 bg-white flex items-center justify-center p-8">
          <IDCard student={printTarget} />
        </div>
      )}

      <div className="space-y-4 print:hidden">
        {/* Toolbar */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or registration ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {classes.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Grid of ID cards */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Registration ID Cards</h3>
            <span className="text-sm text-gray-500">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-sm text-gray-500">Loading…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500">No students found.</div>
          ) : (
            <div className="p-6 grid grid-cols-3 gap-4">
              {filtered.map(s => (
                <div key={s.firestoreId} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                  <IDCard student={s} />
                  <div className="px-4 pb-3">
                    <button
                      onClick={() => handlePrint(s)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 transition"
                    >
                      <IconPrint size={14} />
                      Print Card
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function IDCard({ student }) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-4 m-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
          <IconBadge size={14} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-bold leading-none">OASIS COLLEGE</p>
          <p className="text-xs opacity-75 leading-none">Chechecha, Zimbabwe</p>
        </div>
      </div>
      <div className="bg-white/10 rounded p-3 mb-3">
        <p className="text-xs opacity-75 mb-1">STUDENT NAME</p>
        <p className="font-bold text-sm leading-tight">{student.fullName}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/10 rounded p-2">
          <p className="text-xs opacity-75">CLASS</p>
          <p className="font-semibold text-xs">{student.class}</p>
        </div>
        <div className="bg-white/10 rounded p-2">
          <p className="text-xs opacity-75">REG. ID</p>
          <p className="font-bold text-xs font-mono">{student.reg_number}</p>
        </div>
      </div>
      {student.enrolmentDate && (
        <p className="text-xs opacity-60 mt-2 text-right">Enrolled: {student.enrolmentDate}</p>
      )}
    </div>
  )
}
