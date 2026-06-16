import { useState, useEffect } from 'react'
import {
  collection, getDocs, query, where, doc, setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { MdAdd, MdDelete, MdSave, MdClose, MdEventNote } from 'react-icons/md'
import toast from 'react-hot-toast'
import { getCurrentTerm } from '../../utils/termHelpers'

const CARD    = 'bg-[#0D1C35] border border-white/10 rounded-xl'
const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/50 font-montserrat'

const { number: CURR_NUM, year: CURR_YEAR } = getCurrentTerm()
const EMPTY = { date: '', timeStart: '', timeEnd: '', subject: '', className: '', venue: '', invigilator: '' }

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

function fmtDate(str) {
  if (!str) return ''
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminExamTimetable() {
  const [term,      setTerm]      = useState(`Term ${CURR_NUM}`)
  const [year,      setYear]      = useState(CURR_YEAR)
  const [entries,   setEntries]   = useState([])
  const [classes,   setClasses]   = useState([])
  const [subjects,  setSubjects]  = useState([])
  const [teachers,  setTeachers]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form,      setForm]      = useState(EMPTY)

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
    getDocs(query(
      collection(db, 'examTimetables'),
      where('term', '==', term),
      where('year', '==', year),
    )).then(snap => {
      setEntries(snap.empty ? [] : (snap.docs[0].data().entries || []))
    }).catch(() => setEntries([]))
  }, [term, year])

  const addEntry = () => {
    if (!form.date || !form.timeStart || !form.timeEnd || !form.subject || !form.className)
      return toast.error('Date, time, subject and class are required.')
    setEntries(prev => [
      ...prev,
      { ...form, id: genId(), time: `${form.timeStart} – ${form.timeEnd}` },
    ])
    setForm(EMPTY)
    setShowModal(false)
  }

  const removeEntry = id => setEntries(prev => prev.filter(e => e.id !== id))

  const handleSave = async () => {
    setSaving(true)
    try {
      const snap = await getDocs(query(
        collection(db, 'examTimetables'),
        where('term', '==', term),
        where('year', '==', year),
      ))
      const ref = snap.empty ? doc(collection(db, 'examTimetables')) : snap.docs[0].ref
      await setDoc(ref, { term, year, entries, updatedAt: serverTimestamp() })
      toast.success('Exam timetable saved')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const sorted = [...entries].sort((a, b) =>
    a.date.localeCompare(b.date) || (a.timeStart || '').localeCompare(b.timeStart || '')
  )

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">Exam Timetable</h1>
          <p className="text-gray-400 font-montserrat text-sm mt-1">Schedule exams with venues and invigilation duties per term.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setForm(EMPTY); setShowModal(true) }}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-montserrat font-semibold text-sm px-4 py-2.5 rounded-xl transition"
          >
            <MdAdd className="text-lg" /> Add Exam
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 disabled:opacity-50 text-[#0A1628] font-montserrat font-bold text-sm px-5 py-2.5 rounded-xl transition"
          >
            <MdSave className="text-lg" /> {saving ? 'Saving…' : 'Save Timetable'}
          </button>
        </div>
      </div>

      {/* Term / Year selectors */}
      <div className="flex flex-wrap gap-4">
        <div className="w-40">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Term</label>
          <select value={term} onChange={e => setTerm(e.target.value)} className={inputCls}>
            <option>Term 1</option><option>Term 2</option><option>Term 3</option>
          </select>
        </div>
        <div className="w-28">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Year</label>
          <input type="number" value={year} min={2020} max={2100}
            onChange={e => setYear(Number(e.target.value))} className={inputCls} />
        </div>
      </div>

      {/* Entries */}
      {sorted.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <MdEventNote className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 font-montserrat text-sm">No exams scheduled for {term} {year}. Click "Add Exam" to start.</p>
        </div>
      ) : (
        <div className={`${CARD} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-montserrat">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  {['Date', 'Time', 'Subject', 'Class', 'Venue', 'Invigilator', ''].map(h => (
                    <th key={h} className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((e, idx) => (
                  <tr key={e.id || idx} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-white whitespace-nowrap">{fmtDate(e.date)}</td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{e.time || `${e.timeStart} – ${e.timeEnd}`}</td>
                    <td className="px-4 py-3 text-white font-semibold">{e.subject}</td>
                    <td className="px-4 py-3 text-gray-400">{e.className}</td>
                    <td className="px-4 py-3 text-gray-400">{e.venue || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{e.invigilator || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeEntry(e.id)} className="text-red-400 hover:text-red-300 transition p-1">
                        <MdDelete className="text-base" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1C35] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-playfair text-lg font-bold text-white">Add Exam</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <MdClose className="text-xl" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className={`${inputCls} [color-scheme:dark]`} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Start</label>
                  <input type="time" value={form.timeStart} onChange={e => setForm(p => ({ ...p, timeStart: e.target.value }))}
                    className={`${inputCls} [color-scheme:dark]`} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">End</label>
                  <input type="time" value={form.timeEnd} onChange={e => setForm(p => ({ ...p, timeEnd: e.target.value }))}
                    className={`${inputCls} [color-scheme:dark]`} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Subject</label>
                <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className={inputCls}>
                  <option value="">Select subject…</option>
                  {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Class</label>
                <select value={form.className} onChange={e => setForm(p => ({ ...p, className: e.target.value }))} className={inputCls}>
                  <option value="">Select class…</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Venue (optional)</label>
                  <input type="text" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))}
                    placeholder="e.g. Hall A" className={inputCls} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Invigilator (optional)</label>
                  <select value={form.invigilator} onChange={e => setForm(p => ({ ...p, invigilator: e.target.value }))} className={inputCls}>
                    <option value="">Select teacher…</option>
                    {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 font-montserrat text-sm hover:bg-white/5 transition">
                Cancel
              </button>
              <button onClick={addEntry}
                className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] text-[#0A1628] font-montserrat font-bold text-sm transition">
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
