import { useState, useEffect } from 'react'
import {
  collection, getDocs, addDoc, query, where, serverTimestamp, orderBy, limit,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { MdCampaign, MdSend } from 'react-icons/md'
import toast from 'react-hot-toast'

const CARD   = 'bg-navy-800 border border-white/10 rounded-xl'
const VIOLET = '#7C3AED'
const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500/50 font-montserrat'

export default function TeacherAnnouncements() {
  const session = JSON.parse(sessionStorage.getItem('teacherSession') || '{}')

  const [assignments,  setAssignments]  = useState([])
  const [selClass,     setSelClass]     = useState('')
  const [message,      setMessage]      = useState('')
  const [title,        setTitle]        = useState('')
  const [sending,      setSending]      = useState(false)
  const [history,      setHistory]      = useState([])
  const [loadingBase,  setLoadingBase]  = useState(true)

  useEffect(() => {
    if (!session.uid) { setLoadingBase(false); return }
    getDocs(query(collection(db, 'teacherAssignments'), where('uid', '==', session.uid)))
      .then(snap => {
        const a = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setAssignments(a)
        if (a.length > 0) setSelClass(a[0].className)
      })
      .catch(() => {})
      .finally(() => setLoadingBase(false))
  }, [session.uid])

  // Load recent class announcements when class changes
  useEffect(() => {
    if (!selClass) return
    getDocs(query(
      collection(db, 'classAnnouncements'),
      where('className', '==', selClass),
      orderBy('createdAt', 'desc'),
      limit(10)
    )).then(snap => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }).catch(() => {})
  }, [selClass])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return toast.error('Title and message are required.')
    if (!selClass) return toast.error('Select a class first.')

    setSending(true)
    try {
      // Fetch all students in class
      const snap = await getDocs(query(collection(db, 'students'), where('class', '==', selClass)))
      const students = snap.docs.map(d => d.data())

      if (students.length === 0) {
        toast.error('No students found for this class.')
        setSending(false)
        return
      }

      // Create one notification per student
      const notifPayload = {
        type:        'TeacherAnnouncement',
        title:       title.trim(),
        message:     message.trim(),
        className:   selClass,
        teacherName: session.name ?? 'Teacher',
        read:        false,
        createdAt:   serverTimestamp(),
      }

      await Promise.all(
        students.map(s => {
          const reg = s.reg_number ?? s.regNumber ?? s.studentId ?? ''
          if (!reg) return Promise.resolve()
          return addDoc(collection(db, 'notifications'), {
            ...notifPayload,
            forStudent: reg,
          })
        })
      )

      // Also log to classAnnouncements for history
      const ref = await addDoc(collection(db, 'classAnnouncements'), {
        ...notifPayload,
        sentTo: students.length,
      })

      setHistory(prev => [{
        id: ref.id, ...notifPayload, sentTo: students.length,
        createdAt: { toDate: () => new Date() },
      }, ...prev])

      toast.success(`Announcement sent to ${students.length} student${students.length === 1 ? '' : 's'} in ${selClass}.`)
      setTitle('')
      setMessage('')
    } catch { toast.error('Failed to send announcement. Try again.') }
    finally { setSending(false) }
  }

  const uniqueClasses = [...new Set(assignments.map(a => a.className))]

  const fmt = (ts) => {
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return '' }
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="font-playfair text-2xl font-bold text-white">Announcements</h1>
        <p className="text-gray-400 font-montserrat text-sm mt-1">Post a class announcement — sent to all students' notification feed.</p>
      </div>

      {loadingBase ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : uniqueClasses.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <MdCampaign className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 font-montserrat text-sm">No class assignments. Contact your admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Compose */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSend} className={`${CARD} p-6 space-y-4`}>
              <h2 className="font-playfair font-semibold text-white">New Announcement</h2>

              {/* Class selector */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Class</label>
                <select value={selClass} onChange={e => setSelClass(e.target.value)} className={inputCls}>
                  {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Test on Friday"
                  maxLength={120}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type your message to the class…"
                  rows={5}
                  maxLength={1000}
                  className={`${inputCls} resize-none`}
                />
                <p className="text-right text-[10px] text-gray-600 font-montserrat mt-1">{message.length}/1000</p>
              </div>

              <button
                type="submit"
                disabled={sending || !title.trim() || !message.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-montserrat font-bold text-sm text-white disabled:opacity-50 transition"
                style={{ backgroundColor: VIOLET }}
              >
                <MdSend className="text-base" />
                {sending ? 'Sending…' : 'Send to Class'}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="lg:col-span-2">
            <div className={`${CARD} p-5`}>
              <h2 className="font-playfair font-semibold text-white mb-4">Recent — {selClass}</h2>
              {history.length === 0 ? (
                <p className="text-gray-600 font-montserrat text-sm text-center py-6">No announcements sent yet.</p>
              ) : (
                <div className="space-y-3">
                  {history.map(h => (
                    <div key={h.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-sm font-semibold text-white font-montserrat">{h.title}</p>
                      <p className="text-xs text-gray-400 font-montserrat mt-1 line-clamp-2">{h.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-gray-600 font-montserrat">{fmt(h.createdAt)}</p>
                        {h.sentTo != null && (
                          <span className="text-[10px] font-montserrat text-gray-500">{h.sentTo} students</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
