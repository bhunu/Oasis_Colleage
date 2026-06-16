import { useState, useEffect } from 'react'
import {
  collection, getDocs, query, where, setDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { getCurrentTerm } from '../../utils/termHelpers'

const { number: CURR_NUM, year: CURR_YEAR } = getCurrentTerm()
import { MdAdd, MdDelete, MdSave, MdClose, MdTableChart } from 'react-icons/md'
import toast from 'react-hot-toast'

const DAYS    = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const CARD    = 'bg-[#0D1C35] border border-white/10 rounded-xl'
const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/50 font-montserrat'

const EMPTY_SCHEDULE = Object.fromEntries(DAYS.map(d => [d, []]))

export default function AdminTimetable() {
  const [classes,   setClasses]   = useState([])
  const [subjects,  setSubjects]  = useState([])
  const [teachers,  setTeachers]  = useState([])
  const [selClass,  setSelClass]  = useState('')
  const [term,      setTerm]      = useState(`Term ${CURR_NUM}`)
  const [year,      setYear]      = useState(CURR_YEAR)
  const [schedule,  setSchedule]  = useState(EMPTY_SCHEDULE)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [addModal,  setAddModal]  = useState(null) // day name or null
  const [periodForm, setPeriodForm] = useState({ timeStart: '', timeEnd: '', subject: '', teacher: '' })

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, 'classes')),
      getDocs(collection(db, 'subjects')),
      getDocs(query(collection(db, 'users'), where('role', '==', 'teacher'))),
    ]).then(([cSnap, sSnap, tSnap]) => {
      setClasses(cSnap.docs.map(d => d.data().name).filter(Boolean).sort())
      setSubjects(sSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setTeachers(tSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selClass) return
    const docId = `${selClass.replace(/\s/g, '_')}_${term.replace(/\s/g, '_')}_${year}`
    getDocs(query(collection(db, 'timetables'), where('className', '==', selClass), where('term', '==', term), where('year', '==', year)))
      .then(snap => {
        if (!snap.empty) {
          setSchedule(snap.docs[0].data().schedule || EMPTY_SCHEDULE)
        } else {
          setSchedule(EMPTY_SCHEDULE)
        }
      })
      .catch(() => setSchedule(EMPTY_SCHEDULE))
  }, [selClass, term, year])

  const classSubjects = subjects
    .filter(s => !selClass || (Array.isArray(s.classes) && s.classes.includes(selClass)))
    .map(s => s.name)

  const addPeriod = () => {
    if (!periodForm.timeStart || !periodForm.timeEnd || !periodForm.subject)
      return toast.error('Start time, end time and subject are required.')
    const time = `${periodForm.timeStart} – ${periodForm.timeEnd}`
    setSchedule(prev => ({
      ...prev,
      [addModal]: [...(prev[addModal] || []), { time, subject: periodForm.subject, teacher: periodForm.teacher }],
    }))
    setPeriodForm({ timeStart: '', timeEnd: '', subject: '', teacher: '' })
    setAddModal(null)
  }

  const removePeriod = (day, idx) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== idx),
    }))
  }

  const handleSave = async () => {
    if (!selClass) return toast.error('Select a class first.')
    setSaving(true)
    try {
      const snap = await getDocs(query(
        collection(db, 'timetables'),
        where('className', '==', selClass),
        where('term', '==', term),
        where('year', '==', year)
      ))
      const docRef = snap.empty
        ? doc(collection(db, 'timetables'))
        : snap.docs[0].ref
      await setDoc(docRef, {
        className: selClass,
        term,
        year,
        schedule,
        updatedAt: serverTimestamp(),
      })
      toast.success('Timetable saved')
    } catch { toast.error('Failed to save timetable') }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">Class Timetables</h1>
          <p className="text-gray-400 font-montserrat text-sm mt-1">Set weekly schedules per class per term.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !selClass}
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 disabled:opacity-50 text-[#0A1628] font-montserrat font-bold text-sm px-5 py-2.5 rounded-xl transition"
        >
          <MdSave className="text-lg" />
          {saving ? 'Saving…' : 'Save Timetable'}
        </button>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Class</label>
          <select value={selClass} onChange={e => setSelClass(e.target.value)} className={inputCls}>
            <option value="">Select class…</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="w-40">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Term</label>
          <select value={term} onChange={e => setTerm(e.target.value)} className={inputCls}>
            <option>Term 1</option>
            <option>Term 2</option>
            <option>Term 3</option>
          </select>
        </div>
        <div className="w-28">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Year</label>
          <input type="number" value={year} min={2020} max={2100}
            onChange={e => setYear(Number(e.target.value))}
            className={inputCls} />
        </div>
      </div>

      {/* Timetable grid */}
      {!selClass ? (
        <div className={`${CARD} p-12 text-center`}>
          <MdTableChart className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 font-montserrat text-sm">Select a class above to view or edit its timetable.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {DAYS.map(day => (
            <div key={day} className={`${CARD} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-playfair font-semibold text-white text-sm">{day}</h3>
                <button
                  onClick={() => { setAddModal(day); setPeriodForm({ timeStart: '', timeEnd: '', subject: '', teacher: '' }) }}
                  className="p-1 rounded-lg text-[#C9A84C] hover:bg-[#C9A84C]/10 transition"
                >
                  <MdAdd className="text-lg" />
                </button>
              </div>

              <div className="space-y-2">
                {(schedule[day] || []).length === 0 ? (
                  <p className="text-xs text-gray-600 font-montserrat text-center py-3">No periods</p>
                ) : (
                  (schedule[day] || []).map((period, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-2.5 group">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white font-montserrat truncate">{period.subject}</p>
                          <p className="text-[10px] text-gray-500 font-montserrat">{period.time}</p>
                          {period.teacher && (
                            <p className="text-[10px] text-gray-600 font-montserrat truncate">{period.teacher}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removePeriod(day, idx)}
                          className="text-red-400 opacity-0 group-hover:opacity-100 transition shrink-0"
                        >
                          <MdDelete className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add period modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1C35] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-playfair text-lg font-bold text-white">Add Period — {addModal}</h2>
              <button onClick={() => setAddModal(null)} className="text-gray-400 hover:text-white"><MdClose className="text-xl" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Time</label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={periodForm.timeStart}
                    onChange={e => setPeriodForm(p => ({ ...p, timeStart: e.target.value }))}
                    className={`${inputCls} flex-1 [color-scheme:dark]`}
                  />
                  <span className="text-gray-500 font-montserrat text-xs shrink-0">to</span>
                  <input
                    type="time"
                    value={periodForm.timeEnd}
                    onChange={e => setPeriodForm(p => ({ ...p, timeEnd: e.target.value }))}
                    className={`${inputCls} flex-1 [color-scheme:dark]`}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Subject</label>
                <select className={inputCls} value={periodForm.subject}
                  onChange={e => setPeriodForm(p => ({ ...p, subject: e.target.value }))}>
                  <option value="">Select subject…</option>
                  {classSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Teacher (optional)</label>
                <select className={inputCls} value={periodForm.teacher}
                  onChange={e => setPeriodForm(p => ({ ...p, teacher: e.target.value }))}>
                  <option value="">Select teacher…</option>
                  {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setAddModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 font-montserrat text-sm hover:bg-white/5 transition">
                  Cancel
                </button>
                <button onClick={addPeriod}
                  className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] text-[#0A1628] font-montserrat font-bold text-sm transition">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
