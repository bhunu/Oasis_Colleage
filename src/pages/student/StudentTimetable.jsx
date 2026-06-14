import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import { getCurrentTerm } from '../../utils/termHelpers'
import { MdCalendarToday } from 'react-icons/md'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const CARD = 'bg-[#0D1C35] border border-white/10 rounded-xl'
const { number: CURR_NUM, year: CURR_YEAR } = getCurrentTerm()

export default function StudentTimetable() {
  const { studentData } = useStudent()
  const className = studentData?.class ?? ''

  const [term,      setTerm]      = useState(`Term ${CURR_NUM}`)
  const [year,      setYear]      = useState(CURR_YEAR)
  const [timetable, setTimetable] = useState(null)
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    if (!className) return
    setLoading(true)
    setTimetable(null)
    getDocs(query(
      collection(db, 'timetables'),
      where('className', '==', className),
      where('term',      '==', term),
      where('year',      '==', year)
    )).then(snap => {
      if (!snap.empty) setTimetable(snap.docs[0].data())
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [className, term, year])

  const schedule = timetable?.schedule ?? {}

  return (
    <div className="space-y-6">

      <div>
        <h1 className="font-playfair text-2xl font-bold text-white">My Timetable</h1>
        <p className="text-gray-400 font-montserrat text-sm mt-1">
          {className} — weekly schedule
        </p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-4">
        <div className="w-36">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Term</label>
          <select value={term} onChange={e => setTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 font-montserrat focus:outline-none">
            <option>Term 1</option>
            <option>Term 2</option>
            <option>Term 3</option>
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
      ) : !timetable ? (
        <div className={`${CARD} p-12 text-center`}>
          <MdCalendarToday className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 font-montserrat text-sm">
            No timetable available for {className} · {term} {year}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {DAYS.map(day => (
            <div key={day} className={`${CARD} p-4`}>
              <h3 className="font-playfair font-semibold text-white text-sm mb-3 pb-2 border-b border-white/10">{day}</h3>
              <div className="space-y-2">
                {(schedule[day] || []).length === 0 ? (
                  <p className="text-xs text-gray-600 font-montserrat text-center py-3">Free</p>
                ) : (
                  (schedule[day] || []).map((period, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                      <p className="text-xs font-semibold text-white font-montserrat">{period.subject}</p>
                      <p className="text-[10px] text-gray-500 font-montserrat">{period.time}</p>
                      {period.teacher && (
                        <p className="text-[10px] text-gray-600 font-montserrat">{period.teacher}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
