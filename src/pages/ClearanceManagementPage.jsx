import { useState, useEffect, useCallback } from 'react'
import {
  collection, getDocs, query, where,
  doc, updateDoc, setDoc, addDoc, getDoc, serverTimestamp, limit,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  MdVerifiedUser, MdClose, MdNotifications, MdPerson, MdCheckCircle,
  MdCancel, MdWarning, MdRefresh,
} from 'react-icons/md'
import toast from 'react-hot-toast'
import ClearanceLetter from '../components/ClearanceLetter'

const EXIT_LABELS = {
  OLevelCompletion: 'O Level Graduate',
  ALevelCompletion: 'A Level Graduate',
  Transfer:         'Student Initiated Transfer',
}
const EXIT_COLORS = {
  OLevelCompletion: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  ALevelCompletion: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Transfer:         'bg-amber-500/15 text-amber-400 border-amber-500/30',
}

function getAdminName() {
  try {
    const raw = sessionStorage.getItem('studentsAdminSession')
    return JSON.parse(raw)?.name || 'Admin'
  } catch { return 'Admin' }
}

function generateSerial(year, regNo) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  const rand  = Array.from(bytes, b => chars[b % chars.length]).join('')
  return `OPC-CL-${year}-${regNo}-${rand}`
}

function fmt(v) {
  return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
}

export default function ClearanceManagementPage() {
  const [applications,    setApplications]    = useState([])
  const [notifications,   setNotifications]   = useState([])
  const [loading,         setLoading]         = useState(true)
  const [selected,        setSelected]        = useState(null)
  const [selectedFee,     setSelectedFee]     = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showNotifs,      setShowNotifs]      = useState(false)
  const [working,         setWorking]         = useState(false)
  const [rejectReason,    setRejectReason]    = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [issuedLetter,    setIssuedLetter]    = useState(null)

  const adminName = getAdminName()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [appSnap, notifSnap] = await Promise.all([
        getDocs(query(collection(db, 'clearanceApplications'), where('status', '==', 'Pending'))),
        getDocs(query(collection(db, 'notifications'),          where('forRole', '==', 'StudentAdmin'))),
      ])
      const sorted = appSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.appliedAt?.toMillis?.() || 0) - (a.appliedAt?.toMillis?.() || 0))
      // Keep only the latest application per student (by regNo)
      const seen = new Set()
      const apps = sorted.filter(app => {
        if (seen.has(app.reg_number)) return false
        seen.add(app.reg_number)
        return true
      })
      setApplications(apps)

      const unread = notifSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(n => !n.read)
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      setNotifications(unread)
    } catch (err) {
      console.error('Clearance load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const openReview = useCallback(async (app) => {
    setSelected(app)
    setShowRejectInput(false)
    setRejectReason('')
    setIssuedLetter(null)

    try {
      const [feeSnap, stuSnap] = await Promise.all([
        getDocs(query(collection(db, 'feeAccounts'), where('reg_number', '==', app.reg_number), limit(1))),
        getDocs(query(collection(db, 'students'), where('reg_number', '==', app.reg_number), limit(1))),
      ])
      setSelectedFee(!feeSnap.empty ? feeSnap.docs[0].data() : null)
      setSelectedStudent(!stuSnap.empty ? { id: stuSnap.docs[0].id, ...stuSnap.docs[0].data() } : null)
    } catch { setSelectedFee(null) }
  }, [])

  const handleIssueClearance = async () => {
    if (!selected || working) return
    setWorking(true)
    try {
      const year = new Date().getFullYear()

      // Verify the generated serial is unique before writing — prevents silent overwrite on collision
      let serial = null
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateSerial(year, selected.reg_number)
        const existing  = await getDoc(doc(db, 'clearancePasses', candidate))
        if (!existing.exists()) { serial = candidate; break }
      }
      if (!serial) throw new Error('Could not generate a unique clearance serial. Please try again.')

      const now = serverTimestamp()

      const portalSnap = await getDoc(doc(db, 'settings', 'portalConfig'))
      const term = portalSnap.exists() ? portalSnap.data().currentTerm  || 'Term 1' : 'Term 1'
      const yr   = portalSnap.exists() ? portalSnap.data().currentYear  || String(year) : String(year)

      /* Update application */
      await updateDoc(doc(db, 'clearanceApplications', selected.id), {
        status:          'Approved',
        reviewedBy:      adminName,
        reviewedAt:      now,
        clearanceSerial: serial,
        feesVerifiedAt:  now,
      })

      /* Save clearance pass */
      await setDoc(doc(db, 'clearancePasses', serial), {
        clearanceSerial:   serial,
        reg_number:        selected.reg_number,
        studentName:       selected.studentName,
        class:             selected.class || '',
        exitType:          selected.exitType,
        destinationSchool: selected.destinationSchool || null,
        transferReason:    selected.transferReason    || null,
        guardianName:      selected.guardianName,
        guardianPhone:     selected.guardianPhone,
        issuedBy:          adminName,
        issuedAt:          now,
        term,
        year:              yr,
        valid:             true,
        totalFees:         selectedFee?.termFees || 0,
        arrears:           selectedFee?.arrears  || 0,
        feesVerifiedAt:    now,
        studentPrintCount:  0,
        adminPrintCount:    0,
        adminDownloadCount: 0,
      })

      /* Update student status */
      if (selectedStudent?.id) {
        await updateDoc(doc(db, 'students', selectedStudent.id), { status: 'Cleared' })
      }

      /* Notify student */
      await addDoc(collection(db, 'notifications'), {
        type:        'ClearanceReady',
        reg_number:  selected.reg_number,
        studentName: selected.studentName,
        message:     'Your clearance letter is ready. You may now view and print it from your portal.',
        forStudent:  selected.reg_number,
        read:        false,
        createdAt:   now,
      })

      toast.success('Clearance letter issued successfully.')
      loadData()

      /* Load the issued letter to show in modal */
      const passSnap = await getDocs(
        query(collection(db, 'clearancePasses'), where('clearanceSerial', '==', serial), limit(1))
      )
      if (!passSnap.empty) {
        setIssuedLetter({ id: passSnap.docs[0].id, ...passSnap.docs[0].data() })
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to issue clearance. Please try again.')
    } finally {
      setWorking(false)
    }
  }

  const handleReject = async () => {
    if (!selected || working) return
    if (rejectReason.trim().length < 20) return toast.error('Rejection reason must be at least 20 characters.')
    setWorking(true)
    try {
      await updateDoc(doc(db, 'clearanceApplications', selected.id), {
        status:          'Rejected',
        reviewedBy:      adminName,
        reviewedAt:      serverTimestamp(),
        rejectionReason: rejectReason.trim(),
      })

      await addDoc(collection(db, 'notifications'), {
        type:        'ClearanceRejected',
        forStudent:  selected.reg_number,
        studentName: selected.studentName,
        message:     `Your clearance application was not approved. Reason: ${rejectReason.trim()}`,
        read:        false,
        createdAt:   serverTimestamp(),
      })

      toast.success('Application rejected.')
      setSelected(null)
      loadData()
    } catch {
      toast.error('Failed to reject application.')
    } finally {
      setWorking(false)
    }
  }

  const handleCancelTransferToggle = async (enable) => {
    if (!selectedStudent?.id || working) return
    setWorking(true)
    try {
      await updateDoc(doc(db, 'students', selectedStudent.id), {
        cancelTransferEnabled: enable,
      })
      setSelectedStudent(s => ({ ...s, cancelTransferEnabled: enable }))
      toast.success(enable ? 'Cancel transfer enabled for this student.' : 'Cancel transfer disabled.')
    } catch { toast.error('Failed to update.') }
    finally { setWorking(false) }
  }

  const markNotifRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true })
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch {}
  }

  const termFees  = selectedFee?.termFees || 0
  const totalPaid = selectedFee?.totalPaid || 0
  const arrears   = selectedFee?.arrears   || 0
  const outstanding = Math.max(0, termFees - totalPaid) + arrears

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-white">Clearance Management</h2>
          <p className="font-montserrat text-sm text-gray-500 mt-1">
            Review and issue student clearance letters.
          </p>
        </div>
        <div className="flex items-center gap-3">
        {/* Refresh button */}
        <button
          onClick={loadData}
          disabled={loading}
          title="Refresh"
          className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition disabled:opacity-50"
        >
          <MdRefresh size={20} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
        {/* Notifications bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition"
          >
            <MdNotifications size={20} className="text-gray-400" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] min-h-[18px] px-1">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-navy-800 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-montserrat text-xs font-semibold text-white">Notifications</span>
                <button onClick={() => setShowNotifs(false)}><MdClose className="text-gray-500" /></button>
              </div>
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center font-montserrat text-xs text-gray-500">No new notifications</p>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => { markNotifRead(n.id); setShowNotifs(false) }}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 transition"
                    >
                      <p className="font-montserrat text-xs text-gray-300 leading-relaxed">{n.message}</p>
                      <p className="font-montserrat text-[10px] text-gray-600 mt-1">
                        {n.createdAt?.toDate?.()?.toLocaleDateString('en-GB')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Applications table */}
      <div className="bg-navy-800 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <h3 className="font-playfair font-semibold text-white">Pending Applications</h3>
          <span className="font-montserrat text-xs text-gray-500">{applications.length} pending</span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold mb-3" />
            <p className="font-montserrat text-sm text-gray-500">Loading applications…</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center font-montserrat text-sm text-gray-500">
            No pending clearance applications.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Student Name', 'Reg No', 'Class', 'Exit Type', 'Applied', 'Fee Status', 'Action'].map(h => (
                    <th key={h} className="text-left py-3 px-4 first:px-6 font-montserrat text-[10px] uppercase tracking-widest text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3.5 px-6 font-montserrat font-semibold text-white text-sm">{app.studentName}</td>
                    <td className="py-3.5 px-4 font-mono text-gold text-xs font-semibold">{app.reg_number}</td>
                    <td className="py-3.5 px-4 font-montserrat text-gray-400 text-sm">{app.class || '—'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center border rounded-full text-[10px] font-montserrat font-semibold px-2.5 py-1 ${EXIT_COLORS[app.exitType] || 'bg-white/5 text-gray-400 border-white/10'}`}>
                        {EXIT_LABELS[app.exitType] || app.exitType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-montserrat text-gray-500 text-xs">
                      {app.appliedAt?.toDate?.()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-montserrat text-xs text-gray-500">—</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => openReview(app)}
                        className="bg-gold hover:bg-yellow-400 text-navy font-montserrat font-bold text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        Review & Issue
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-navy border border-white/10 rounded-2xl w-full max-w-2xl my-8 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <MdVerifiedUser className="text-gold text-xl" />
                <h3 className="font-playfair font-bold text-white">Review Clearance Application</h3>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/10 rounded-lg transition">
                <MdClose className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gold/15 rounded-full flex items-center justify-center shrink-0">
                  {selectedStudent?.photoURL
                    ? <img src={selectedStudent.photoURL} className="w-full h-full rounded-full object-cover" alt="" />
                    : <MdPerson size={28} className="text-gold" />
                  }
                </div>
                <div>
                  <h4 className="font-playfair text-lg font-bold text-white">{selected.studentName}</h4>
                  <p className="font-mono text-gold text-sm">{selected.reg_number}</p>
                  <span className={`inline-flex items-center border rounded-full text-[10px] font-montserrat font-semibold px-2.5 py-0.5 mt-1 ${EXIT_COLORS[selected.exitType] || ''}`}>
                    {EXIT_LABELS[selected.exitType] || selected.exitType}
                  </span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Class"         value={selected.class} />
                <InfoRow label="Guardian Name" value={selected.guardianName} />
                <InfoRow label="Guardian Phone" value={selected.guardianPhone} />
                {selected.destinationSchool && <InfoRow label="Destination School" value={selected.destinationSchool} />}
                <InfoRow label="Declaration"   value={selected.declaration ? '✓ Confirmed' : '—'} />
                <InfoRow label="Applied"       value={selected.appliedAt?.toDate?.()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
              </div>

              {/* Fee summary */}
              <div className="bg-navy-800 border border-white/10 rounded-xl p-4 space-y-2">
                <p className="font-montserrat text-[10px] uppercase tracking-widest text-gray-600 mb-3">Fee Account Summary</p>
                <FeeRow label="Current Term Fees"  value={fmt(termFees)} />
                <FeeRow label="Amount Paid"         value={fmt(totalPaid)} />
                <FeeRow label="Arrears"             value={fmt(arrears)} />
                <div className="border-t border-white/10 pt-2 mt-2">
                  <FeeRow label="Total Outstanding" value={outstanding > 0 ? fmt(outstanding) : '$0.00'} />
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-montserrat text-[10px] uppercase text-gray-600">Status</span>
                    {outstanding > 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-400 font-montserrat text-xs font-bold">
                        <MdWarning className="text-base" /> OUTSTANDING BALANCE
                      </span>
                    ) : selectedFee ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-montserrat text-xs font-bold">
                        <MdCheckCircle className="text-base" /> FULLY CLEARED
                      </span>
                    ) : (
                      <span className="font-montserrat text-xs text-gray-500">No fee account found</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cancel Transfer toggle (Transfer students only) */}
              {selected.exitType === 'Transfer' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-montserrat text-xs font-semibold text-amber-400">Cancel Transfer Control</p>
                    <p className="font-montserrat text-[10px] text-gray-500 mt-0.5">
                      Allow this student to cancel their own transfer request.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelTransferToggle(!selectedStudent?.cancelTransferEnabled)}
                    disabled={working}
                    className={`font-montserrat text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                      selectedStudent?.cancelTransferEnabled
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    }`}
                  >
                    {selectedStudent?.cancelTransferEnabled ? 'Disable Cancel' : 'Enable Cancel Transfer'}
                  </button>
                </div>
              )}

              {/* Action buttons */}
              {!issuedLetter && (
                <div className="flex gap-3 flex-wrap">
                  {!showRejectInput ? (
                    <>
                      <button
                        onClick={handleIssueClearance}
                        disabled={working}
                        className="flex items-center gap-2 bg-gold hover:bg-yellow-400 disabled:opacity-60 text-navy font-montserrat font-bold text-sm px-5 py-3 rounded-xl transition"
                      >
                        <MdVerifiedUser />
                        {working ? 'Issuing…' : 'Issue Clearance Letter'}
                      </button>
                      <button
                        onClick={() => setShowRejectInput(true)}
                        className="flex items-center gap-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-montserrat text-xs font-semibold px-4 py-3 rounded-xl transition"
                      >
                        <MdCancel /> Reject
                      </button>
                    </>
                  ) : (
                    <div className="w-full space-y-3">
                      <div className="flex gap-2 items-start text-amber-400 text-xs font-montserrat">
                        <MdWarning className="shrink-0 mt-0.5" />
                        <span>Rejection is for disciplinary or property-related reasons only. Enter reason below (min 20 characters).</span>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Enter rejection reason…"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-red-500/40 focus:outline-none rounded-xl px-4 py-3 text-white font-montserrat text-sm placeholder-gray-600 resize-none"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleReject}
                          disabled={working || rejectReason.trim().length < 20}
                          className="bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-montserrat font-bold text-xs px-4 py-2.5 rounded-xl transition"
                        >
                          {working ? 'Rejecting…' : 'Confirm Reject'}
                        </button>
                        <button
                          onClick={() => { setShowRejectInput(false); setRejectReason('') }}
                          className="font-montserrat text-xs text-gray-400 hover:text-white px-4 py-2.5 rounded-xl bg-white/5 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Show issued letter for admin to print/download */}
              {issuedLetter && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-montserrat text-sm font-semibold">
                    <MdCheckCircle /> Clearance letter issued successfully.
                  </div>
                  <ClearanceLetter clearanceData={issuedLetter} mode="admin" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="font-montserrat text-[10px] uppercase tracking-wider text-gray-600 mb-0.5">{label}</p>
      <p className="font-montserrat text-sm text-white">{value || '—'}</p>
    </div>
  )
}

function FeeRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="font-montserrat text-[10px] uppercase tracking-wider text-gray-600">{label}</span>
      <span className="font-montserrat text-sm text-white">{value}</span>
    </div>
  )
}
