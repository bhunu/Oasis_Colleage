import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { MdCalendarToday, MdEventNote } from 'react-icons/md'
import { getCurrentTerm } from '../../utils/termHelpers'

const { number: CURR_NUM, year: CURR_YEAR } = getCurrentTerm()

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const CARD = 'bg-navy-800 border border-white/10 rounded-xl'

function fmtDate(str) {
  if (!str) return ''
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TeacherTimetable() {
  const session = JSON.parse(sessionStorage.getItem('teacherSession') || '{}')

  const [tab,          setTab]          = useState('weekly')
  const [assignments,  setAssignments]  = useState([])
  const [timetables,   setTimetables]   = useState([])
  const [invigEntries, setInvigEntries] = useState([])
  const [selClass,     setSelClass]     = useState('')
  const [term,         setTerm]         = useState(`Term ${CURR_NUM}`)
  const [year,         setYear]         = useState(CURR_YEAR)
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

  // Weekly timetable
  useEffect(() => {
    if (tab !== 'weekly' || !selClass) return
    setTimetables([])
    getDocs(query(
      collection(db, 'timetables'),
      where('className', '==', selClass),
      where('term', '==', term),
      where('year', '==', year),
    )).then(snap => {
      setTimetables(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }).catch(() => {})
  }, [selClass, term, year, tab])

  // Invigilation duties
  useEffect(() => {
    if (tab !== 'invigilation') return
    setInvigEntries([])
    getDocs(query(
      collection(db, 'examTimetables'),
      where('term', '==', term),
      where('year', '==', year),
    )).then(snap => {
      if (!snap.empty) {
        const all = snap.docs[0].data().entries || []
        const mine = all
          .filter(e => e.invigilator === session.name)
          .sort((a, b) => a.date.localeCompare(b.date) || (a.timeStart || '').localeCompare(b.timeStart || ''))
        setInvigEntries(mine)
      }
    }).catch(() => {})
  }, [term, year, tab, session.name])

  const schedule = timetables[0]?.schedule || {}
  const classes  = [...new Set(assignments.map(a => a.className))]

  return (
    <div className="space-y-6">

      <div>
        <h1 className="font-playfair text-2xl font-bold text-white">My Timetable</h1>
        <p className="text-gray-400 font-montserrat text-sm mt-1">Weekly schedule and exam invigilation duties.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {[
          { key: 'weekly',       label: 'Weekly Schedule',    icon: MdCalendarToday },
          { key: 'invigilation', label: 'Invigilation Duties', icon: MdEventNote    },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-montserrat transition-all ${
              tab === key
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Icon className="text-base" /> {label}
          </button>
        ))}
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-4">
        {tab === 'weekly' && classes.length > 0 && (
          <div className="flex-1 min-w-[160px]">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Class</label>
            <select value={selClass} onChange={e => setSelClass(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 font-montserrat focus:outline-none">
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
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
          <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'weekly' ? (
        classes.length === 0 ? (
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
        )
      ) : (
        invigEntries.length === 0 ? (
          <div className={`${CARD} p-12 text-center`}>
            <MdEventNote className="text-4xl text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 font-montserrat text-sm">No invigilation duties for {term} {year}.</p>
          </div>
        ) : (
          <div className={`${CARD} overflow-hidden`}>
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-xs font-semibold text-gray-400 font-montserrat uppercase tracking-wider">
                {invigEntries.length} exam{invigEntries.length !== 1 ? 's' : ''} to invigilate · {term} {year}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-montserrat">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    {['Date', 'Time', 'Class', 'Subject', 'Venue'].map(h => (
                      <th key={h} className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invigEntries.map((e, idx) => (
                    <tr key={e.id || idx} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-white whitespace-nowrap">{fmtDate(e.date)}</td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{e.time || `${e.timeStart} – ${e.timeEnd}`}</td>
                      <td className="px-4 py-3 text-violet-300 font-semibold">{e.className}</td>
                      <td className="px-4 py-3 text-white">{e.subject}</td>
                      <td className="px-4 py-3 text-gray-400">{e.venue || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  )
}
