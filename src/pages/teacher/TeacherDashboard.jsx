import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useNavigate } from 'react-router-dom'
import { MdCalendarToday, MdFactCheck, MdCampaign, MdBarChart, MdPeople } from 'react-icons/md'

const CARD   = 'bg-[#0D1C35] border border-white/10 rounded-xl p-5'
const VIOLET = '#7C3AED'
const DAYS   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TeacherDashboard() {
  const navigate  = useNavigate()
  const session   = JSON.parse(sessionStorage.getItem('teacherSession') || '{}')
  const [assignments, setAssignments] = useState([])
  const [todayPeriods, setTodayPeriods] = useState([])
  const [loading, setLoading] = useState(true)

  const today = DAYS[new Date().getDay()]

  useEffect(() => {
    if (!session.uid) { setLoading(false); return }

    getDocs(query(collection(db, 'teacherAssignments'), where('uid', '==', session.uid)))
      .then(async snap => {
        const myAssignments = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setAssignments(myAssignments)

        // Load today's periods from timetables for assigned classes
        const classNames = [...new Set(myAssignments.map(a => a.className))]
        if (classNames.length === 0) return

        const ttSnap = await getDocs(query(collection(db, 'timetables'),
          where('className', 'in', classNames.slice(0, 10))
        ))

        const periods = []
        ttSnap.forEach(d => {
          const data = d.data()
          const dayPeriods = data.schedule?.[today] || []
          dayPeriods.forEach(p => {
            if (!p.teacher || p.teacher === session.name) {
              periods.push({ ...p, className: data.className })
            }
          })
        })
        setTodayPeriods(periods.sort((a, b) => a.time.localeCompare(b.time)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session.uid])

  const uniqueClasses = [...new Set(assignments.map(a => a.className))]

  const QUICK = [
    { label: 'Mark Attendance',  icon: MdFactCheck,     path: '/teacher/attendance',    color: VIOLET },
    { label: 'View Timetable',   icon: MdCalendarToday, path: '/teacher/timetable',     color: '#0F6E56' },
    { label: 'Post Announcement',icon: MdCampaign,      path: '/teacher/announcements', color: '#EF9F27' },
    { label: 'Class Performance',icon: MdBarChart,      path: '/teacher/performance',   color: '#378ADD' },
  ]

  return (
    <div className="space-y-6">

      {/* Greeting */}
      <div>
        <h1 className="font-playfair text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          {session.name?.split(' ')[0] ?? 'Teacher'}.
        </h1>
        <p className="text-gray-400 font-montserrat text-sm mt-1">{today} · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className={CARD}>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1">Assigned Classes</p>
          <p className="text-3xl font-bold text-white font-playfair">{loading ? '…' : uniqueClasses.length}</p>
        </div>
        <div className={CARD}>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1">Today's Periods</p>
          <p className="text-3xl font-bold font-playfair" style={{ color: VIOLET }}>{loading ? '…' : todayPeriods.length}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK.map(({ label, icon: Icon, path, color }) => (
          <button key={path} onClick={() => navigate(path)}
            className="bg-[#0D1C35] border border-white/10 hover:border-violet-500/30 rounded-xl p-4 text-left transition-all group">
            <div className="p-2.5 rounded-lg w-fit mb-2" style={{ backgroundColor: `${color}22` }}>
              <Icon className="text-lg" style={{ color }} />
            </div>
            <p className="text-xs font-semibold text-white font-montserrat">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Today's schedule */}
        <div className="bg-[#0D1C35] border border-white/10 rounded-xl p-5">
          <h3 className="font-playfair font-semibold text-white mb-4">Today's Schedule</h3>
          {loading ? (
            <p className="text-sm text-gray-500 font-montserrat py-4 text-center">Loading…</p>
          ) : todayPeriods.length === 0 ? (
            <p className="text-sm text-gray-500 font-montserrat py-4 text-center">No periods scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {todayPeriods.map((p, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: VIOLET }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white font-montserrat">{p.subject}</p>
                    <p className="text-xs text-gray-500 font-montserrat">{p.className} · {p.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned classes */}
        <div className="bg-[#0D1C35] border border-white/10 rounded-xl p-5">
          <h3 className="font-playfair font-semibold text-white mb-4">Your Classes</h3>
          {loading ? (
            <p className="text-sm text-gray-500 font-montserrat py-4 text-center">Loading…</p>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-gray-500 font-montserrat py-4 text-center">No class assignments yet. Contact your admin.</p>
          ) : (
            <div className="space-y-2">
              {assignments.map(a => (
                <div key={a.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5">
                  <MdPeople className="text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white font-montserrat">{a.className}</p>
                    <p className="text-xs text-gray-500 font-montserrat">{(a.subjects || []).join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
