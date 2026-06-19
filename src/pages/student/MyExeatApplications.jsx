import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import ExeatPass from '../../components/ExeatPass'
import { MdAdd, MdClose, MdArrowBack, MdHourglassEmpty } from 'react-icons/md'

const STATUS_STYLES = {
  Pending:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
}

function fmtDate(d) {
  if (!d) return '—'
  try {
    const date = typeof d === 'string' ? new Date(d) : d?.toDate ? d.toDate() : new Date(d)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return String(d) }
}

export default function MyExeatApplications() {
  const navigate = useNavigate()
  const { studentData } = useStudent()

  const [applications, setApplications] = useState([])
  const [loading, setLoading]           = useState(true)
  const [viewPass, setViewPass]         = useState(null)
  const [passLoading, setPassLoading]   = useState(false)

  useEffect(() => {
    if (!studentData?.regNumber) return
    getDocs(query(collection(db, 'exeatApplications'), where('reg_number', '==', studentData.regNumber)))
      .then(snap => {
        const sorted = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.appliedAt?.seconds ?? 0) - (a.appliedAt?.seconds ?? 0))
        setApplications(sorted)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [studentData?.regNumber])

  const handleViewPass = async (passSerial) => {
    setPassLoading(true)
    try {
      const snap = await getDoc(doc(db, 'exeatPasses', passSerial))
      if (snap.exists()) setViewPass({ id: snap.id, ...snap.data() })
      else toast?.error?.('Pass record not found')
    } catch {}
    setPassLoading(false)
  }

  return (
    <div className="max-w-3xl space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/student/dashboard')} className="p-2 rounded-lg text-gray-400 hover:bg-white/5 transition">
            <MdArrowBack className="text-xl" />
          </button>
          <div>
            <h1 className="font-playfair text-2xl font-bold text-white">My Exeat Applications</h1>
            <p className="text-xs text-gray-500 font-montserrat mt-0.5">Track your exit pass requests</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/student/exeat/apply')}
          className="flex items-center gap-2 bg-gold text-navy font-montserrat font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition hover:bg-yellow-400"
        >
          <MdAdd className="text-base" />
          New Application
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-navy-800 border border-white/10 rounded-2xl p-12 text-center">
          <MdHourglassEmpty className="text-gray-600 text-4xl mx-auto mb-3" />
          <p className="font-montserrat text-sm text-gray-500">You have not submitted any exeat applications yet.</p>
          <button
            onClick={() => navigate('/student/exeat/apply')}
            className="mt-4 font-montserrat text-xs bg-gold text-navy font-bold px-5 py-2.5 rounded-xl"
          >
            Apply Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className="bg-navy-800 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border font-montserrat ${STATUS_STYLES[app.status] || STATUS_STYLES.Pending}`}>
                      {app.status}
                    </span>
                    <span className="text-[11px] text-gray-500 font-montserrat">{fmtDate(app.appliedAt)}</span>
                  </div>
                  <p className="text-sm font-semibold text-white font-montserrat">{app.reason}</p>
                  <p className="text-xs text-gray-400 font-montserrat mt-0.5">
                    {fmtDate(app.departureDate)} → {fmtDate(app.returnDate)}
                    {app.destination && <> · {app.destination}</>}
                  </p>
                  {app.status === 'Pending' && (
                    <p className="text-[11px] text-amber-400/80 font-montserrat mt-1.5">
                      Awaiting review by school administration.
                    </p>
                  )}
                  {app.status === 'Rejected' && app.rejectionReason && (
                    <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <p className="text-[11px] text-red-400 font-montserrat">
                        <span className="font-semibold">Rejection reason:</span> {app.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
                {app.status === 'Approved' && app.passSerial && (
                  <button
                    onClick={() => handleViewPass(app.passSerial)}
                    disabled={passLoading}
                    className="shrink-0 font-montserrat text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl font-semibold transition"
                  >
                    {passLoading ? '…' : 'View Pass'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pass viewer — screen only, no print button for students */}
      {viewPass && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg mt-4">
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setViewPass(null)}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
              >
                <MdClose className="text-xl" />
              </button>
            </div>
            {/* allowPrint={false} — students cannot print */}
            <ExeatPass passData={viewPass} allowPrint={false} />
          </div>
        </div>
      )}
    </div>
  )
}
