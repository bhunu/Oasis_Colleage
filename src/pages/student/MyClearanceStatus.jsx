import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, limit, deleteDoc, doc, updateDoc, deleteField, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import { MdHourglassEmpty, MdCheckCircle, MdCancel, MdPrint, MdWarning } from 'react-icons/md'
import ClearanceLetter from '../../components/ClearanceLetter'

const STATUS_CONFIG = {
  Pending:  { color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30',  label: 'Under Review' },
  Approved: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Approved' },
  Rejected: { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',       label: 'Rejected' },
}

export default function MyClearanceStatus() {
  const navigate = useNavigate()
  const { studentData, firestoreStudent } = useStudent()
  const regNo  = studentData?.regNumber

  const [application,   setApplication]   = useState(null)
  const [clearancePass, setClearancePass] = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [showLetter,    setShowLetter]    = useState(false)
  const [cancelling,    setCancelling]    = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    if (!regNo) { setLoading(false); return }
    getDocs(
      query(collection(db, 'clearanceApplications'), where('regNo', '==', regNo), limit(1))
    ).then(async snap => {
      if (snap.empty) { setLoading(false); return }
      const app = { id: snap.docs[0].id, ...snap.docs[0].data() }
      setApplication(app)

      if (app.status === 'Approved' && app.clearanceSerial) {
        const passSnap = await getDocs(
          query(collection(db, 'clearancePasses'), where('clearanceSerial', '==', app.clearanceSerial), limit(1))
        )
        if (!passSnap.empty) setClearancePass({ id: passSnap.docs[0].id, ...passSnap.docs[0].data() })
      }
    }).catch(err => console.error('Clearance query error:', err)).finally(() => setLoading(false))
  }, [regNo])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="max-w-lg space-y-6">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-white">My Clearance Status</h2>
          <p className="font-montserrat text-sm text-gray-500 mt-1">Track your clearance application.</p>
        </div>
        <div className="bg-[#0D1C35] border border-white/10 rounded-2xl p-10 text-center">
          <MdHourglassEmpty className="text-gray-600 text-4xl mx-auto mb-3" />
          <p className="font-montserrat text-sm text-gray-500 mb-5">No clearance application found.</p>
          <button
            onClick={() => navigate('/student/clearance/apply')}
            className="bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1628] font-montserrat font-bold text-xs px-5 py-2.5 rounded-xl transition"
          >
            Apply Now
          </button>
        </div>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[application.status] || STATUS_CONFIG.Pending
  const canCancel = firestoreStudent?.cancelTransferEnabled === true && application.status === 'Pending'

  const handleCancelApplication = async () => {
    if (!application?.id || !firestoreStudent?.id || cancelling) return
    setCancelling(true)
    try {
      const batch = writeBatch(db)

      // 1. Delete the clearance application
      batch.delete(doc(db, 'clearanceApplications', application.id))

      // 2. Restore student to Active, remove exitType and cancelTransferEnabled
      batch.update(doc(db, 'students', firestoreStudent.id), {
        status:                'Active',
        exitType:              deleteField(),
        cancelTransferEnabled: false,
      })

      await batch.commit()

      // 3. Delete all related transfer notifications for this student
      const notifSnap = await getDocs(
        query(
          collection(db, 'notifications'),
          where('regNo', '==', regNo),
          where('type',  '==', 'TransferRequest')
        )
      )
      const notifBatch = writeBatch(db)
      notifSnap.docs.forEach(d => notifBatch.delete(d.ref))
      if (!notifSnap.empty) await notifBatch.commit()

      setApplication(null)
      setConfirmCancel(false)
    } catch (err) {
      console.error('Cancel error:', err)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="font-playfair text-2xl font-bold text-white">My Clearance Status</h2>
        <p className="font-montserrat text-sm text-gray-500 mt-1">Track your clearance application.</p>
      </div>

      {/* Status card */}
      <div className={`border rounded-2xl p-6 ${cfg.bg}`}>
        <div className="flex items-center gap-3 mb-4">
          {application.status === 'Approved' && <MdCheckCircle className="text-emerald-400 text-2xl" />}
          {application.status === 'Pending'  && <MdHourglassEmpty className="text-amber-400 text-2xl" />}
          {application.status === 'Rejected' && <MdCancel className="text-red-400 text-2xl" />}
          <span className={`font-montserrat font-bold text-sm uppercase tracking-wider ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>

        {application.status === 'Pending' && (
          <p className="font-montserrat text-xs text-gray-400 leading-relaxed">
            Your clearance application is being reviewed by the school administration. You will be
            notified when a decision is made.
          </p>
        )}

        {application.status === 'Approved' && (
          <p className="font-montserrat text-xs text-gray-400 leading-relaxed">
            Your clearance letter is ready. You may view and print it below. Note: the letter can only
            be printed once.
          </p>
        )}

        {application.status === 'Rejected' && (
          <>
            <p className="font-montserrat text-xs text-red-300 leading-relaxed mb-3">
              {application.rejectionReason || 'Your application was not approved.'}
            </p>
            <p className="font-montserrat text-xs text-gray-500">
              You may reapply by submitting a new application once the issue is resolved.
            </p>
          </>
        )}
      </div>

      {/* Application details */}
      <div className="bg-[#0D1C35] border border-white/10 rounded-2xl p-6 space-y-3">
        <p className="font-montserrat text-[10px] uppercase tracking-widest text-gray-600 mb-3">
          Application Details
        </p>
        <Row label="Student"     value={application.studentName} />
        <Row label="Reg Number"  value={application.regNo} />
        <Row label="Class"       value={application.class} />
        <Row label="Exit Type"   value={application.exitType?.replace(/([A-Z])/g, ' $1').trim()} />
        {application.destinationSchool && <Row label="Destination School" value={application.destinationSchool} />}
        <Row label="Applied"     value={application.appliedAt?.toDate?.()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
        {application.reviewedAt && <Row label="Reviewed" value={application.reviewedAt?.toDate?.()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />}
      </div>

      {/* Cancel application (only when admin has enabled it) */}
      {canCancel && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <MdWarning className="text-red-400 text-xl shrink-0 mt-0.5" />
            <div>
              <p className="font-montserrat text-sm font-semibold text-red-400">Cancel Your Application</p>
              <p className="font-montserrat text-xs text-gray-400 mt-1 leading-relaxed">
                The school has permitted you to cancel this clearance application. Your application will be permanently removed and you will need to reapply if needed.
              </p>
            </div>
          </div>
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="font-montserrat text-xs font-bold text-red-400 border border-red-500/40 hover:bg-red-500/15 px-4 py-2.5 rounded-xl transition"
            >
              Cancel My Application
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="font-montserrat text-xs text-gray-400 flex-1">Are you sure? This cannot be undone.</p>
              <button
                onClick={handleCancelApplication}
                disabled={cancelling}
                className="font-montserrat text-xs font-bold bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl transition"
              >
                {cancelling ? 'Cancelling…' : 'Yes, Cancel It'}
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="font-montserrat text-xs text-gray-400 hover:text-white px-3 py-2.5 rounded-xl bg-white/5 transition"
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      )}

      {/* View letter (approved only, student print limit enforced inside ClearanceLetter) */}
      {application.status === 'Approved' && clearancePass && (
        <>
          <button
            onClick={() => setShowLetter(v => !v)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-montserrat font-bold text-sm px-5 py-3 rounded-xl transition"
          >
            <MdPrint />
            {showLetter ? 'Hide Letter' : 'View / Print Letter'}
          </button>
          {showLetter && (
            <ClearanceLetter clearanceData={clearancePass} mode="student" />
          )}
        </>
      )}

      {(application.status === 'Rejected' || application.status === 'Pending') && (
        <button
          onClick={() => navigate('/student/clearance/apply')}
          className="font-montserrat text-xs text-[#C9A84C] hover:underline"
        >
          {application.status === 'Rejected' ? 'Reapply for Clearance' : 'Edit / Resubmit Application'}
        </button>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
      <span className="font-montserrat text-[10px] uppercase tracking-wider text-gray-600">{label}</span>
      <span className="font-montserrat text-sm text-gray-300">{value || '—'}</span>
    </div>
  )
}
