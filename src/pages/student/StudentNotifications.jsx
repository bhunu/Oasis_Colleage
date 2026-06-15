import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import { MdNotifications, MdDoneAll, MdHourglassEmpty } from 'react-icons/md'

const CARD = 'bg-[#0D1C35] border border-white/10 rounded-xl'

function fmtDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function StudentNotifications() {
  const { studentData } = useStudent()
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [markingAll,    setMarkingAll]    = useState(false)

  useEffect(() => {
    if (!studentData?.regNumber) { setLoading(false); return }
    getDocs(
      query(
        collection(db, 'notifications'),
        where('forStudent', '==', studentData.regNumber),
        orderBy('createdAt', 'desc'),
      )
    )
      .then(snap => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [studentData?.regNumber])

  const markRead = async (id) => {
    await updateDoc(doc(db, 'notifications', id), { read: true }).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read)
    if (!unread.length) return
    setMarkingAll(true)
    try {
      const batch = writeBatch(db)
      unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }))
      await batch.commit()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch {}
    setMarkingAll(false)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">Notifications</h1>
          <p className="font-montserrat text-xs text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-xs font-montserrat font-semibold text-[#C9A84C] hover:text-yellow-300 transition disabled:opacity-50"
          >
            <MdDoneAll className="text-base" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white/5 rounded-xl h-16" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <MdHourglassEmpty className="text-gray-600 text-4xl mx-auto mb-3" />
          <p className="font-montserrat text-sm text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              className={`${CARD} px-5 py-4 flex items-start gap-4 cursor-pointer transition hover:border-white/20 ${
                !n.read ? 'border-[#C9A84C]/30 bg-[#C9A84C]/5' : ''
              }`}
            >
              <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${!n.read ? 'bg-[#C9A84C]' : 'bg-transparent'}`} />
              <div className="flex-1 min-w-0">
                <p className={`font-montserrat text-sm leading-snug ${!n.read ? 'text-white' : 'text-gray-400'}`}>
                  {n.message}
                </p>
                {n.createdAt && (
                  <p className="font-montserrat text-[10px] text-gray-600 mt-1">{fmtDate(n.createdAt)}</p>
                )}
              </div>
              <MdNotifications className={`text-lg shrink-0 mt-0.5 ${!n.read ? 'text-[#C9A84C]' : 'text-gray-700'}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
