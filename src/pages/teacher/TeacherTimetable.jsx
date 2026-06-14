import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { MdCalendarToday } from 'react-icons/md'

const DAYS   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const VIOLET = '#7C3AED'
const CARD   = 'bg-[#0D1C35] border border-white/10 rounded-xl'

export default function TeacherTimetable() {
  const session   = JSON.parse(sessionStorage.getItem('teacherSession') || '{}')
  const [assignments,  setAssignments]  = useState([])
  const [timetables,   setTimetables]   = useState([])
  const [selClass,     setSelClass]     = useState('')
  const [term,         setTerm]         = useState('Term 2')
  const [year,         setYear]         = useState(new Date().getFullYear())
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!session.uid) { setLoading(false); return }
    getDocs(query(collection(db, 'teacherAssignments'), where('uid', '==', session.uid)))
      .then(snap => {
        const a = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setAssignments(a)
        if (a.length > 0) setSelClass(a[0].className)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session.uid])

  useEffect(() => {
    if (!selClass) return
    setTimetables([])
    getDocs(query(
      collection(db, 'timetables'),
      where('className', '==', selClass),
      where('term', '==', term),
      where('year', '==', year)
    )).then(snap => {
      setTimetables(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }).catch(() => {})
  }, [selClass, term, year])

  const schedule = timetables[0]?.schedule || {}
  const classes  = [...new Set(assignments.map(a => a.className))]

  return (
    <div className="space-y-6">

      <div>
        <h1 className="font-playfair text-2xl font-bold text-white">My Timetable</h1>
        <p className="text-gray-400 font-montserrat text-sm mt-1">Weekly class schedule set by admin.</p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[160px]">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Class</label>
          <select value={selClass} onChange={e => setSelClass(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 font-montserrat focus:outline-none">
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="w-36">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Term</label>
          <select value={term} onChange={e => setTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 font-montserrat focus:outline-none">
            <option>Term 1</option><option>Term 2</option><option>Term 3</option>
          </select>
        </div>
        <div className="w-24">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Year</label>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 font-montserrat focus:outline-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <MdCalendarToday className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 font-montserrat text-sm">No class assignments yet. Contact your admin.</p>
        </div>
      ) : timetables.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <MdCalendarToday className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 font-montserrat text-sm">No timetable set for {selClass} · {term} {year}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {DAYS.map(day => (
            <div key={day} className={`${CARD} p-4`}>
              <h3 className="font-playfair font-semibold text-white text-sm mb-3 pb-2 border-b border-white/10">{day}</h3>
              <div className="space-y-2">
                {(schedule[day] || []).length === 0 ? (
                  <p className="text-xs text-gray-600 font-montserrat text-center py-3">Free</p>
                ) : (
                  (schedule[day] || []).map((period, idx) => {
                    const isMyPeriod = !period.teacher || period.teacher === session.name
                    return (
                      <div key={idx} className={`rounded-lg p-2.5 border ${
                        isMyPeriod
                          ? 'bg-violet-500/10 border-violet-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}>
                        <p className="text-xs font-semibold font-montserrat" style={{ color: isMyPeriod ? '#a78bfa' : '#fff' }}>
                          {period.subject}
                        </p>
                        <p className="text-[10px] text-gray-500 font-montserrat">{period.time}</p>
                        {period.teacher && (
                          <p className="text-[10px] text-gray-600 font-montserrat">{period.teacher}</p>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
