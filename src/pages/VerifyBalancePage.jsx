import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { db } from '../firebase/config'
import { FaGraduationCap } from 'react-icons/fa'
import { MdSchool } from 'react-icons/md'

const TEAL = '#0F6E56'

function fmt(v) {
  return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
}

export default function VerifyBalancePage() {
  const { regNumber } = useParams()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    if (!regNumber) { setLoading(false); setError(true); return }
    Promise.all([
      getDocs(query(collection(db, 'feeAccounts'), where('reg_number', '==', regNumber), limit(1))),
      getDocs(query(collection(db, 'students'),    where('reg_number', '==', regNumber), limit(1))),
    ])
      .then(([accSnap, stuSnap]) => {
        if (accSnap.empty) { setError(true); return }
        const acc = accSnap.docs[0].data()
        const stu = stuSnap.empty ? {} : stuSnap.docs[0].data()
        setData({ ...acc, studentName: stu.fullName || acc.studentName || '—', class: stu.class || acc.class || '—' })
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [regNumber])

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center px-4 py-16">
      <Link to="/" className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 bg-[#C9A84C] rounded-full flex items-center justify-center shadow-lg">
          <FaGraduationCap className="text-[#0A1628] text-xl" />
        </div>
        <div>
          <p className="font-playfair font-bold text-white text-lg leading-tight">Oasis Private College</p>
          <p className="font-montserrat text-[10px] uppercase tracking-[0.2em] text-gray-400">Checheche, Zimbabwe</p>
        </div>
      </Link>

      <div className="w-full max-w-sm bg-[#0D1C35] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3" style={{ backgroundColor: `${TEAL}18` }}>
          <MdSchool size={20} style={{ color: TEAL }} />
          <h1 className="font-playfair font-bold text-white text-base">Fee Balance Verification</h1>
        </div>

        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-3" style={{ borderColor: TEAL }} />
              <p className="font-montserrat text-sm text-gray-400">Loading account…</p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-8">
              <p className="font-montserrat text-sm text-red-400 font-semibold">Account not found</p>
              <p className="font-montserrat text-xs text-gray-500 mt-1">No fee account found for <span className="text-white">{regNumber}</span></p>
            </div>
          )}

          {!loading && data && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: TEAL }}>
                  {(data.studentName || '?')[0]}
                </div>
                <div>
                  <p className="font-montserrat text-sm font-semibold text-white">{data.studentName}</p>
                  <p className="font-montserrat text-xs text-gray-400">{regNumber} &middot; {data.class}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <BalanceRow label="Term Fees"   value={fmt(data.termFees)}   />
                <BalanceRow label="Total Paid"  value={fmt(data.totalPaid)}  color="text-emerald-400" />
              </div>

              <div className="rounded-xl p-4 flex justify-between items-center mt-2" style={{ backgroundColor: `${TEAL}18` }}>
                <span className="font-montserrat text-xs uppercase tracking-widest text-gray-400">Current Balance</span>
                <span className={`font-bold text-xl ${data.balanceType === 'debit' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {data.balanceType === 'debit' ? '-' : ''}{fmt(data.balance || 0)}
                </span>
              </div>

              <div className="rounded-xl px-4 py-2 text-center">
                <span className={`font-montserrat text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
                  data.balanceType === 'debit'  ? 'bg-red-500/15 text-red-400'       :
                  data.balanceType === 'credit' ? 'bg-emerald-500/15 text-emerald-400' :
                  'bg-gray-500/15 text-gray-400'
                }`}>
                  {data.balanceType === 'debit' ? 'Fees Outstanding' : data.balanceType === 'credit' ? 'Overpaid' : 'Fully Paid'}
                </span>
              </div>

              <p className="font-montserrat text-[10px] text-gray-600 text-center pt-2">
                Verified {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} &middot; Oasis Private College
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BalanceRow({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <p className="font-montserrat text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className={`font-montserrat text-sm font-semibold ${color}`}>{value}</p>
    </div>
  )
}
