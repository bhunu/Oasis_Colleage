import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { collection, getDocs, doc, getDoc, query, where, limit } from 'firebase/firestore'
import { db } from '../firebase/config'
import { MdArrowBack, MdPerson, MdReceipt } from 'react-icons/md'

const CARD = 'bg-[#0D1C35] border border-white/10 rounded-2xl'
const TH   = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat'
const TD   = 'py-3 px-4 text-sm text-gray-400 font-montserrat'
const TD_W = 'py-3 px-4 text-sm text-white font-montserrat'

function fmt(v) {
  return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
}

function buildLedger(account) {
  let balance = 0
  const rows = []
  const termFee = account?.termFees || 0
  if (termFee > 0) {
    balance += termFee
    rows.push({ date: '—', desc: 'Term fees charged', debit: termFee, credit: 0, balance })
  }
  ;(account?.payments || []).forEach(p => {
    balance -= Number(p.amount)
    rows.push({
      date:   p.date || '—',
      desc:   `Payment · ${p.method || 'cash'}${p.receiptNumber ? ` · ${p.receiptNumber}` : ''}`,
      debit:  0,
      credit: Number(p.amount),
      balance,
    })
  })
  return rows
}

export default function Fees() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get('studentId')

  const [student,  setStudent]  = useState(null)
  const [account,  setAccount]  = useState(null)
  const [term,     setTerm]     = useState('')
  const [loading,  setLoading]  = useState(!!studentId)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!studentId) { setLoading(false); return }

    async function load() {
      try {
        const [stuSnap, settingsSnap] = await Promise.all([
          getDoc(doc(db, 'students', studentId)),
          getDoc(doc(db, 'portalSettings', 'main')),
        ])

        if (!stuSnap.exists()) { setNotFound(true); setLoading(false); return }
        setStudent({ id: stuSnap.id, ...stuSnap.data() })

        if (settingsSnap.exists()) {
          const d = settingsSnap.data()
          setTerm(`${d.currentTerm || 'Term'} · ${d.currentYear || new Date().getFullYear()}`)
        }

        const accSnap = await getDocs(
          query(collection(db, 'feeAccounts'), where('studentId', '==', studentId), limit(1))
        )
        setAccount(accSnap.empty ? null : { id: accSnap.docs[0].id, ...accSnap.docs[0].data() })
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [studentId])

  if (!studentId) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-montserrat text-sm text-gray-500">
          Select a student from the{' '}
          <button onClick={() => navigate('/students')} className="text-[#C9A84C] hover:underline">
            Students page
          </button>{' '}
          to view their fee account.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <BackButton navigate={navigate} />
        <div className={`${CARD} p-10 text-center`}>
          <p className="font-montserrat text-sm text-gray-500">Student not found.</p>
        </div>
      </div>
    )
  }

  const balanceColor =
    account?.balanceType === 'debit'  ? 'text-red-400' :
    account?.balanceType === 'credit' ? 'text-emerald-400' : 'text-gray-400'

  const ledger = buildLedger(account)

  return (
    <div className="space-y-6">
      <BackButton navigate={navigate} />

      {/* Student header */}
      <div className={`${CARD} p-6`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#C9A84C]/15 rounded-full flex items-center justify-center shrink-0">
              <MdPerson size={26} className="text-[#C9A84C]" />
            </div>
            <div>
              <h2 className="font-playfair text-xl font-bold text-white leading-tight">
                {student?.fullName || '—'}
              </h2>
              <p className="font-mono text-[#C9A84C] text-sm font-semibold">{student?.reg_number}</p>
              {student?.class && (
                <span className="inline-block mt-1 bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] text-[10px] font-montserrat font-semibold px-2.5 py-0.5 rounded-full">
                  {student.class}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            {term && (
              <p className="font-montserrat text-[10px] uppercase tracking-widest text-gray-500 mb-1">{term}</p>
            )}
            {account ? (
              <>
                <p className="font-montserrat text-[10px] uppercase tracking-widest text-gray-600 mb-0.5">Balance</p>
                <p className={`font-playfair font-bold text-2xl ${balanceColor}`}>
                  {account.balanceType === 'debit' ? '-' : account.balanceType === 'credit' ? '+' : ''}
                  {fmt(account.balance || 0)}
                </p>
                <p className={`font-montserrat text-xs capitalize mt-0.5 ${balanceColor}`}>
                  {account.balanceType === 'debit' ? 'In arrears' : account.balanceType === 'credit' ? 'Credit' : 'Fully paid'}
                </p>
              </>
            ) : (
              <p className="font-montserrat text-sm text-gray-500">No account found</p>
            )}
          </div>
        </div>

        {account && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/10">
            {[
              ['Term Fees',  fmt(account.termFees  || 0), 'text-white'],
              ['Total Paid', fmt(account.totalPaid || 0), 'text-emerald-400'],
              ['Arrears',    fmt(account.arrears   || 0), account.arrears > 0 ? 'text-red-400' : 'text-gray-500'],
            ].map(([label, val, cls]) => (
              <div key={label}>
                <p className="font-montserrat text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                <p className={`font-playfair font-bold text-xl ${cls}`}>{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment ledger */}
      {account ? (
        <div className={`${CARD} overflow-hidden`}>
          <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10">
            <MdReceipt className="text-[#C9A84C]" />
            <h3 className="font-playfair font-semibold text-white">Payment History</h3>
            {term && <span className="font-montserrat text-xs text-gray-500 ml-auto">{term}</span>}
          </div>

          {ledger.length === 0 ? (
            <p className="px-6 py-10 text-center font-montserrat text-sm text-gray-500">No transactions recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={TH}>Date</th>
                    <th className={TH}>Description</th>
                    <th className={`${TH} text-right`}>Debit</th>
                    <th className={`${TH} text-right`}>Credit</th>
                    <th className={`${TH} text-right`}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className={TD}>{row.date}</td>
                      <td className={TD_W}>{row.desc}</td>
                      <td className={`${TD} text-right text-red-400`}>{row.debit > 0 ? fmt(row.debit) : '—'}</td>
                      <td className={`${TD} text-right text-emerald-400`}>{row.credit > 0 ? fmt(row.credit) : '—'}</td>
                      <td className={`${TD} text-right font-semibold ${row.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {row.balance > 0 ? `-${fmt(row.balance)}` : fmt(Math.abs(row.balance))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className={`${CARD} p-10 text-center`}>
          <p className="font-montserrat text-sm text-gray-500">No fee account has been set up for this student yet.</p>
        </div>
      )}
    </div>
  )
}

function BackButton({ navigate }) {
  return (
    <button
      onClick={() => navigate('/students')}
      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white font-montserrat transition-colors"
    >
      <MdArrowBack />
      Back to students
    </button>
  )
}
