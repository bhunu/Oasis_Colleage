import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { db } from '../firebase/config'
import { FaGraduationCap } from 'react-icons/fa'
import { MdSchool } from 'react-icons/md'
import sc from '../utils/schoolConfig'

const TEAL = '#0F6E56'

// C-11 fix: only fetch feeAccounts (not students) and expose no PII.
// The physical receipt already carries the student name and amounts; this
// page only needs to confirm whether the account exists and its status.
export default function VerifyBalancePage() {
  const { regNumber } = useParams()
  const [status,    setStatus]    = useState(null)   // 'debit' | 'credit' | 'nil'
  const [term,      setTerm]      = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(false)

  useEffect(() => {
    if (!regNumber) { setLoading(false); setError(true); return }
    getDocs(query(collection(db, 'feeAccounts'), where('reg_number', '==', regNumber), limit(1)))
      .then(snap => {
        if (snap.empty) { setError(true); return }
        const acc = snap.docs[0].data()
        setStatus(acc.balanceType || 'nil')
        setTerm(acc.term || '')
        if (acc.updatedAt) {
          const d = acc.updatedAt.toDate ? acc.updatedAt.toDate() : new Date(acc.updatedAt)
          setUpdatedAt(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }))
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [regNumber])

  const statusConfig = {
    nil:    { label: 'Fully Paid',        bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: '✓' },
    credit: { label: 'Overpaid',          bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: '✓' },
    debit:  { label: 'Fees Outstanding',  bg: 'bg-red-500/15',     text: 'text-red-400',     icon: '!' },
  }
  const cfg = statusConfig[status] ?? statusConfig.nil

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 py-16">
      <Link to="/" className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center shadow-lg">
          <FaGraduationCap className="text-navy text-xl" />
        </div>
        <div>
          <p className="font-playfair font-bold text-white text-lg leading-tight">{sc.name}</p>
          <p className="font-montserrat text-[10px] uppercase tracking-[0.2em] text-gray-400">{sc.address}</p>
        </div>
      </Link>

      <div className="w-full max-w-sm bg-navy-800 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3" style={{ backgroundColor: `${TEAL}18` }}>
          <MdSchool size={20} style={{ color: TEAL }} />
          <h1 className="font-playfair font-bold text-white text-base">Fee Status Verification</h1>
        </div>

        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-3" style={{ borderColor: TEAL }} />
              <p className="font-montserrat text-sm text-gray-400">Verifying…</p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-8">
              <p className="font-montserrat text-sm text-red-400 font-semibold">Account not found</p>
              <p className="font-montserrat text-xs text-gray-500 mt-2">
                No fee account on record for <span className="text-white font-mono">{regNumber}</span>
              </p>
            </div>
          )}

          {!loading && status !== null && (
            <div className="space-y-5 text-center">
              <div>
                <p className="font-montserrat text-[10px] uppercase tracking-widest text-gray-500 mb-1">Registration Number</p>
                <p className="font-mono font-bold text-white text-lg">{regNumber}</p>
                {term && <p className="font-montserrat text-xs text-gray-400 mt-0.5">{term}</p>}
              </div>

              <div className={`rounded-xl px-4 py-5 flex flex-col items-center gap-2 ${cfg.bg}`}>
                <span className={`text-3xl font-bold ${cfg.text}`}>{cfg.icon}</span>
                <span className={`font-montserrat text-sm font-semibold uppercase tracking-wider ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>

              <p className="font-montserrat text-[10px] text-gray-600 pt-1">
                Verified {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                {' '}&middot;{' '}{sc.name}
              </p>
              {updatedAt && (
                <p className="font-montserrat text-[10px] text-gray-700 mt-0.5">
                  Account last updated: {updatedAt}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
