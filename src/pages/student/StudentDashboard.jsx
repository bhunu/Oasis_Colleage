import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy, limit, onSnapshot, doc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import { MdLock, MdBarChart, MdReceipt, MdCloudUpload, MdCheckCircle } from 'react-icons/md'

const GOLD = '#C9A84C'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { studentData, portalSettings } = useStudent()

  const [feeAccount,  setFeeAccount]  = useState(null)
  const [results,     setResults]     = useState([])
  const [notifications, setNotifs]   = useState([])
  const [receipts,    setReceipts]    = useState([])
  const [loading,     setLoading]     = useState(true)

  const threshold = portalSettings?.resultsAccessThreshold ?? 75

  useEffect(() => {
    if (!studentData?.regNumber) { setLoading(false); return }

    let pending = 2

    const done = () => { if (--pending === 0) setLoading(false) }

    /* fee account */
    getDocs(query(collection(db, 'feeAccounts'), where('reg_number', '==', studentData.regNumber), limit(1)))
      .then(snap => { if (!snap.empty) setFeeAccount({ id: snap.docs[0].id, ...snap.docs[0].data() }) })
      .catch(() => {}).finally(done)

    /* recent receipts */
    getDocs(query(collection(db, 'receipts'), where('reg_number', '==', studentData.regNumber), orderBy('issuedAt', 'desc'), limit(3)))
      .then(snap => setReceipts(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {}).finally(done)

    /* non-blocking — don't gate loading on these */
    getDocs(query(collection(db, 'academicResults'), where('studentId', '==', studentData.studentId), orderBy('uploadedAt', 'desc'), limit(4)))
      .then(snap => setResults(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})

    getDocs(query(collection(db, 'notifications'), where('forStudent', '==', studentData.regNumber), orderBy('createdAt', 'desc'), limit(5)))
      .then(snap => setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
  }, [studentData?.regNumber])

  const termFees   = feeAccount?.termFees  || 0
  const totalPaid  = feeAccount?.totalPaid || 0
  const balance    = feeAccount?.balance   || 0
  const paidPct    = termFees > 0 ? Math.round((totalPaid / termFees) * 100) : 0
  const resultUnlocked = paidPct >= threshold
  const amountNeeded   = termFees > 0 ? Math.max(0, (threshold / 100) * termFees - totalPaid) : 0

  const fmt = v => `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  const CARD = 'bg-[#0D1C35] border border-white/10 rounded-xl p-5'
  const SKL  = 'animate-pulse bg-white/5 rounded-lg'

  if (loading) {
    return (
      <div className="space-y-5 max-w-4xl">
        <div className={`${SKL} h-24 rounded-xl`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`${SKL} h-36 rounded-xl`} />
          <div className={`${SKL} h-36 rounded-xl`} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className={`${SKL} h-20 rounded-xl`} />
          <div className={`${SKL} h-20 rounded-xl`} />
          <div className={`${SKL} h-20 rounded-xl`} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#0D1C35] to-[#132140] border border-white/10 rounded-xl p-6">
        <p className="text-[10px] font-semibold text-[#C9A84C]/70 uppercase tracking-widest font-montserrat mb-1">
          {portalSettings.currentTerm} · {portalSettings.currentYear}
        </p>
        <h1 className="font-playfair text-2xl font-bold text-white">
          Welcome back, {studentData?.name?.split(' ')[0] || 'Student'}.
        </h1>
        <p className="text-sm text-gray-400 font-montserrat mt-1">{studentData?.class}</p>
      </div>

      {/* Fee status + results preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Fee status card */}
        <div className={`${CARD} cursor-pointer hover:border-[#C9A84C]/30 transition`} onClick={() => navigate('/student/fees')}>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1">Fee Balance</p>
          <p className={`text-3xl font-bold font-playfair ${feeAccount?.balanceType === 'debit' ? 'text-red-400' : feeAccount?.balanceType === 'credit' ? 'text-emerald-400' : 'text-gray-400'}`}>
            {fmt(balance)}
          </p>
          <p className="text-xs text-gray-500 font-montserrat mt-1">{fmt(totalPaid)} paid of {fmt(termFees)}</p>
          {termFees > 0 && (
            <div className="mt-3">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#C9A84C] rounded-full transition-all" style={{ width: `${Math.min(paidPct, 100)}%` }} />
              </div>
              <p className="text-[10px] text-gray-600 font-montserrat mt-1">{paidPct}% paid</p>
            </div>
          )}
        </div>

        {/* Results access card — gated by threshold */}
        <div
          className={`${CARD} cursor-pointer transition ${resultUnlocked ? 'hover:border-emerald-500/30' : 'hover:border-purple-500/30'}`}
          onClick={() => navigate('/student/results')}
        >
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1">My Results</p>

          {resultUnlocked ? (
            <>
              <div className="flex items-center gap-2 mt-1">
                <MdCheckCircle className="text-emerald-400 text-xl" />
                <span className="text-sm text-emerald-400 font-montserrat font-semibold">Results unlocked</span>
              </div>
              <p className="text-xs text-gray-500 font-montserrat mt-2">
                {results.length > 0
                  ? `${results.length} subject${results.length !== 1 ? 's' : ''} available`
                  : 'View your academic results'}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mt-1">
                <MdLock className="text-purple-400 text-xl" />
                <span className="text-sm text-purple-400 font-montserrat font-semibold">Results locked</span>
              </div>
              <div className="mt-2">
                {/* Progress bar with threshold marker */}
                <div className="relative h-1.5 bg-white/10 rounded-full overflow-visible mt-3 mb-1">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.min(paidPct, 100)}%` }} />
                  {/* Threshold marker */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-[#C9A84C] rounded-full"
                    style={{ left: `${threshold}%` }}
                    title={`${threshold}% threshold`}
                  />
                </div>
                <p className="text-[10px] text-gray-500 font-montserrat">
                  Pay {fmt(amountNeeded)} more to unlock ({threshold}% required)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'View Fees',      icon: MdReceipt,     path: '/student/fees' },
          { label: 'Upload Payment', icon: MdCloudUpload, path: '/student/upload-pop' },
          { label: 'My Results',     icon: MdBarChart,    path: '/student/results' },
        ].map(({ label, icon: Icon, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="bg-[#0D1C35] border border-white/10 hover:border-[#C9A84C]/30 hover:bg-[#C9A84C]/5 rounded-xl py-4 flex flex-col items-center gap-2 transition group"
          >
            <Icon className="text-gray-500 group-hover:text-[#C9A84C] text-2xl transition" />
            <span className="text-[10px] text-gray-500 group-hover:text-gray-300 font-montserrat uppercase tracking-widest transition">{label}</span>
          </button>
        ))}
      </div>

      {/* Recent receipts */}
      {receipts.length > 0 && (
        <div className={CARD}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-playfair font-semibold text-white text-base">Recent Payments</h3>
            <button onClick={() => navigate('/student/fees')} className="text-xs text-[#C9A84C] font-montserrat hover:text-yellow-300 transition">View all</button>
          </div>
          <div className="space-y-2">
            {receipts.map(r => (
              <div key={r.id} className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <p className="text-sm text-white font-montserrat">{r.receiptNumber || 'Receipt'}</p>
                  <p className="text-xs text-gray-500 font-montserrat">{r.issuedAt?.toDate ? r.issuedAt.toDate().toLocaleDateString() : '—'}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400 font-montserrat">{fmt(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className={CARD}>
          <h3 className="font-playfair font-semibold text-white text-base mb-3">Notifications</h3>
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className={`p-3 rounded-lg border ${n.read ? 'bg-transparent border-white/5' : 'bg-[#C9A84C]/5 border-[#C9A84C]/20'}`}>
                <p className="text-sm font-montserrat text-white">{n.message || n.title}</p>
                <p className="text-[10px] text-gray-500 font-montserrat mt-0.5">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
