import { useState, useEffect } from 'react'
import {
  collection, getDocs, addDoc, query, where, serverTimestamp, getDoc, doc,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { parseTermNumber } from '../../utils/termHelpers'
import { MdFactCheck, MdCheckCircle, MdCancel, MdAccessTime, MdChevronLeft } from 'react-icons/md'
import toast from 'react-hot-toast'

const DAYS   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const CARD   = 'bg-navy-800 border border-white/10 rounded-xl'
const VIOLET = '#7C3AED'

const STATUS_CFG = {
  present: { label: 'Present', color: '#10b981', icon: MdCheckCircle, bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  absent:  { label: 'Absent',  color: '#ef4444', icon: MdCancel,      bg: 'bg-red-500/10 border-red-500/30 text-red-400' },
  late:    { label: 'Late',    color: '#f59e0b', icon: MdAccessTime,  bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
}

const todayStr = () => new Date().toISOString().slice(0, 10) // YYYY-MM-DD

export default function TeacherAttendance() {
  const session = JSON.parse(sessionStorage.getItem('teacherSession') || '{}')

  const [termNum,       setTermNum]       = useState(null)
  const [termYear,      setTermYear]      = useState(null)
  const [assignments,   setAssignments]   = useState([])
  const [selClass,      setSelClass]      = useState('')
  const [periods,       setPeriods]       = useState([])   // today's timetable periods
  const [selPeriod,     setSelPeriod]     = useState(null) // {subject, time, index}
  const [students,      setStudents]      = useState([])
  const [records,       setRecords]       = useState({})   // { [studentId]: 'present'|'absent'|'late' }
  const [markedPeriods, setMarkedPeriods] = useState([])   // already submitted today
  const [loadingBase,   setLoadingBase]   = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving,        setSaving]        = useState(false)

  const today     = DAYS[new Date().getDay()]
  const dateToday = todayStr()

  // Load current term from portalSettings (source of truth set by admin)
  useEffect(() => {
    getDoc(doc(db, 'portalSettings', 'main')).then(snap => {
      if (!snap.exists()) return
      const { currentTerm, currentYear } = snap.data()
      setTermNum(parseTermNumber(currentTerm))
      setTermYear(Number(currentYear))
    }).catch(() => {})
  }, [])

  // Load assignments + today's timetable on class change
  useEffect(() => {
    if (!session.uid) { setLoadingBase(false); return }
    getDocs(query(collection(db, 'teacherAssignments'), where('uid', '==', session.uid)))
      .then(snap => {
        const a = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setAssignments(a)
        if (a.length > 0 && !selClass) setSelClass(a[0].className)
      })
      .catch(() => {})
      .finally(() => setLoadingBase(false))
  }, [session.uid])

  // When class changes: load today's periods + already marked
  useEffect(() => {
    if (!selClass || !termNum || !termYear) return
    setPeriods([])
    setSelPeriod(null)
    setMarkedPeriods([])

    // Get the current term's timetable for this class
    getDocs(query(
      collection(db, 'timetables'),
      where('className', '==', selClass),
      where('term', '==', `Term ${termNum}`),
      where('year', '==', termYear),
    )).then(snap => {
        if (snap.empty) return
        const schedule = snap.docs[0].data().schedule || {}
        const dayPeriods = (schedule[today] || []).map((p, i) => ({ ...p, index: i }))
        setPeriods(dayPeriods)
      })
      .catch(() => {})

    // Check which periods already marked today
    getDocs(query(
      collection(db, 'attendance'),
      where('className', '==', selClass),
      where('date', '==', dateToday),
    )).then(snap => {
      setMarkedPeriods(snap.docs.map(d => d.data().subject + '::' + d.data().time))
    }).catch(() => {})
  }, [selClass, today, dateToday, termNum, termYear])

  // When period selected: load students
  useEffect(() => {
    if (!selPeriod || !selClass) return
    setLoadingStudents(true)
    setStudents([])
    setRecords({})

    getDocs(query(collection(db, 'students'), where('class', '==', selClass)))
      .then(snap => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.fullName ?? a.studentName ?? a.surname ?? '').localeCompare(b.fullName ?? b.studentName ?? b.surname ?? ''))
        setStudents(list)
        // Default all to present
        const init = {}
        list.forEach(s => { init[s.id] = 'present' })
        setRecords(init)
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false))
  }, [selPeriod, selClass])

  const setStatus = (studentId, status) => {
    setRecords(prev => ({ ...prev, [studentId]: status }))
  }

  const markAll = (status) => {
    const next = {}
    students.forEach(s => { next[s.id] = status })
    setRecords(next)
  }

  const handleSubmit = async () => {
    if (!selPeriod || students.length === 0) return
    const alreadyDone = markedPeriods.includes(selPeriod.subject + '::' + selPeriod.time)
    if (alreadyDone) return toast.error('Attendance already submitted for this period today.')

    setSaving(true)
    try {
      const rollRecords = students.map(s => ({
        studentId:   s.id,
        reg_number:  s.reg_number ?? s.studentId ?? '',
        studentName: s.fullName || s.studentName || `${s.surname ?? ''} ${s.firstName ?? ''}`.trim() || '',
        status:      records[s.id] ?? 'present',
      }))

      await addDoc(collection(db, 'attendance'), {
        date:        dateToday,
        className:   selClass,
        subject:     selPeriod.subject,
        time:        selPeriod.time,
        teacherUid:  session.uid,
        teacherName: session.name ?? '',
        records:     rollRecords,
        markedAt:    serverTimestamp(),
      })

      setMarkedPeriods(prev => [...prev, selPeriod.subject + '::' + selPeriod.time])
      toast.success(`Attendance submitted for ${selPeriod.subject} (${selPeriod.time})`)
      setSelPeriod(null)
    } catch { toast.error('Failed to save attendance. Try again.') }
    finally { setSaving(false) }
  }

  const uniqueClasses = [...new Set(assignments.map(a => a.className))]

  const presentCount = students.filter(s => records[s.id] === 'present').length
  const absentCount  = students.filter(s => records[s.id] === 'absent').length
  const lateCount    = students.filter(s => records[s.id] === 'late').length

  // ─── Period selection view ─────────────────────────────────────────────────
  if (!selPeriod) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">Mark Attendance</h1>
          <p className="text-gray-400 font-montserrat text-sm mt-1">
            {today} · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Class selector */}
        {uniqueClasses.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {uniqueClasses.map(c => (
              <button key={c} onClick={() => setSelClass(c)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold font-montserrat border transition ${
                  selClass === c
                    ? 'text-white border-violet-500'
                    : 'text-gray-400 border-white/10 hover:border-white/20'
                }`}
                style={selClass === c ? { backgroundColor: `${VIOLET}22` } : {}}>
                {c}
              </button>
            ))}
          </div>
        )}

        {loadingBase ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : uniqueClasses.length === 0 ? (
          <div className={`${CARD} p-12 text-center`}>
            <MdFactCheck className="text-4xl text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 font-montserrat text-sm">No class assignments. Contact your admin.</p>
          </div>
        ) : periods.length === 0 ? (
          <div className={`${CARD} p-12 text-center`}>
            <MdFactCheck className="text-4xl text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 font-montserrat text-sm">No periods scheduled for {selClass} on {today}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 font-montserrat">
              {selClass} — Select a period to mark attendance
            </p>
            {periods.map((period, i) => {
              const key     = period.subject + '::' + period.time
              const isDone  = markedPeriods.includes(key)
              return (
                <button key={i}
                  onClick={() => !isDone && setSelPeriod(period)}
                  disabled={isDone}
                  className={`w-full text-left ${CARD} p-4 flex items-center justify-between gap-4 transition ${
                    isDone ? 'opacity-60 cursor-not-allowed' : 'hover:border-violet-500/40 cursor-pointer'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-white font-montserrat">{period.subject}</p>
                    <p className="text-xs text-gray-500 font-montserrat mt-0.5">{period.time}</p>
                    {period.teacher && (
                      <p className="text-xs text-gray-600 font-montserrat">{period.teacher}</p>
                    )}
                  </div>
                  {isDone ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-montserrat shrink-0">
                      <MdCheckCircle className="text-base" /> Submitted
                    </span>
                  ) : (
                    <span className="text-xs font-semibold font-montserrat shrink-0" style={{ color: VIOLET }}>
                      Mark Roll →
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ─── Roll-call view ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setSelPeriod(null)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition">
          <MdChevronLeft className="text-xl" />
        </button>
        <div>
          <h1 className="font-playfair text-xl font-bold text-white">
            {selPeriod.subject} — {selClass}
          </h1>
          <p className="text-gray-400 font-montserrat text-sm">{today} · {selPeriod.time}</p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Present', count: presentCount, color: '#10b981' },
          { label: 'Absent',  count: absentCount,  color: '#ef4444' },
          { label: 'Late',    count: lateCount,     color: '#f59e0b' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`${CARD} p-3 text-center`}>
            <p className="text-2xl font-bold font-playfair" style={{ color }}>{count}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-montserrat">{label}</p>
          </div>
        ))}
      </div>

      {/* Bulk mark buttons */}
      <div className="flex gap-2">
        <button onClick={() => markAll('present')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold font-montserrat bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition">
          All Present
        </button>
        <button onClick={() => markAll('absent')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold font-montserrat bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition">
          All Absent
        </button>
      </div>

      {/* Students list */}
      {loadingStudents ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className={`${CARD} p-10 text-center`}>
          <p className="text-gray-500 font-montserrat text-sm">No students found for {selClass}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student, idx) => {
            const name   = student.fullName || student.studentName || `${student.surname ?? ''} ${student.firstName ?? ''}`.trim() || 'Unknown'
            const regNum = student.reg_number ?? student.studentId ?? ''
            const status = records[student.id] ?? 'present'

            return (
              <div key={student.id} className={`${CARD} p-3 flex items-center gap-3`}>
                <span className="w-7 h-7 rounded-full bg-white/5 text-gray-500 text-xs flex items-center justify-center font-montserrat shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white font-montserrat">{name}</p>
                  {regNum && <p className="text-[10px] text-gray-500 font-montserrat">{regNum}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {Object.entries(STATUS_CFG).map(([s, cfg]) => {
                    const Icon = cfg.icon
                    const active = status === s
                    return (
                      <button key={s} onClick={() => setStatus(student.id, s)}
                        title={cfg.label}
                        className={`p-1.5 rounded-lg border text-base transition ${
                          active ? cfg.bg : 'border-transparent text-gray-600 hover:text-gray-400'
                        }`}>
                        <Icon />
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Submit */}
      {students.length > 0 && (
        <div className="sticky bottom-4">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-montserrat font-bold text-sm text-white disabled:opacity-50 transition"
            style={{ backgroundColor: VIOLET }}
          >
            {saving ? 'Submitting…' : `Submit Attendance (${students.length} students)`}
          </button>
        </div>
      )}
    </div>
  )
}
