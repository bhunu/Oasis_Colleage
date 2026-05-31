import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'

const CARD = 'bg-[#0D1C35] border border-white/10 rounded-xl p-5'
const TH   = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat'
const TD   = 'py-3 px-4 text-sm text-gray-300 font-montserrat'

function fmt(v) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

export default function StudentFees() {
  const navigate = useNavigate()
  const { studentData, portalSettings } = useStudent()
  const [account,  setAccount]  = useState(null)
  const [receipts, setReceipts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!studentData?.studentId) return
    Promise.all([
      getDocs(query(collection(db, 'feeAccounts'), where('studentId', '==', studentData.studentId), limit(1))),
      getDocs(query(collection(db, 'receipts'), where('studentId', '==', studentData.studentId), orderBy('issuedAt', 'desc'))),
    ]).then(([feeSnap, rcptSnap]) => {
      if (!feeSnap.empty) setAccount({ id: feeSnap.docs[0].id, ...feeSnap.docs[0].data() })
      setReceipts(rcptSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [studentData?.studentId])

  const termFees  = account?.termFees  || 0
  const totalPaid = account?.totalPaid || 0
  const balance   = account?.balance   || 0
  const paidPct   = termFees > 0 ? Math.round((totalPaid / termFees) * 100) : 0

  /* build ledger from account payments array + opening charge */
  const ledger = (() => {
    let bal = 0
    const rows = []
    if (termFees > 0) {
      bal = termFees
      rows.push({ date: '—', desc: `${portalSettings.currentTerm} ${portalSettings.currentYear} fees`, debit: termFees, credit: 0, balance: bal })
    }
    ;(account?.payments || []).forEach(p => {
      bal -= Number(p.amount)
      rows.push({ date: p.date || '—', desc: `Payment (${p.method || 'cash'})`, debit: 0, credit: Number(p.amount), balance: bal })
    })
    return rows
  })()

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Fee summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Term Fees',  value: fmt(termFees),  color: 'text-white' },
          { label: 'Total Paid', value: fmt(totalPaid), color: 'text-emerald-400' },
          { label: 'Balance',    value: fmt(balance),   color: account?.balanceType === 'debit' ? 'text-red-400' : 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={CARD}>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1">{label}</p>
            <p className={`text-2xl font-bold font-playfair ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Payment progress */}
      {termFees > 0 && (
        <div className={CARD}>
          <div className="flex justify-between text-xs font-montserrat mb-2">
            <span className="text-gray-400">Payment progress</span>
            <span className="text-white font-semibold">{paidPct}% paid</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#C9A84C] rounded-full" style={{ width: `${Math.min(paidPct, 100)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-montserrat text-gray-600 mt-1">
            <span>{fmt(totalPaid)} paid</span>
            <span>{fmt(termFees)} total</span>
          </div>
        </div>
      )}

      {/* Ledger */}
      <div className="bg-[#0D1C35] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-white/10">
          <h3 className="font-playfair font-semibold text-white">Account Ledger</h3>
          <button
            onClick={() => navigate('/student/upload-pop')}
            className="text-xs font-montserrat px-3 py-1.5 rounded-lg text-[#0A1628] font-semibold transition"
            style={{ backgroundColor: '#C9A84C' }}
          >
            Upload payment proof
          </button>
        </div>
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
                <tr key={i} className="border-b border-white/5">
                  <td className={TD}>{row.date}</td>
                  <td className="py-3 px-4 text-sm text-white font-montserrat">{row.desc}</td>
                  <td className={`${TD} text-right text-red-400`}>{row.debit > 0 ? fmt(row.debit) : '—'}</td>
                  <td className={`${TD} text-right text-emerald-400`}>{row.credit > 0 ? fmt(row.credit) : '—'}</td>
                  <td className={`${TD} text-right font-semibold ${row.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmt(Math.abs(row.balance))}</td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-500 font-montserrat">No transactions recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipts */}
      {receipts.length > 0 && (
        <div className={CARD}>
          <h3 className="font-playfair font-semibold text-white mb-4">Official Receipts</h3>
          <div className="space-y-2">
            {receipts.map(r => (
              <div key={r.id} className="flex justify-between items-center py-2.5 border-b border-white/5">
                <div>
                  <p className="text-sm text-white font-montserrat font-semibold">{r.receiptNumber || r.id.slice(0,8).toUpperCase()}</p>
                  <p className="text-xs text-gray-500 font-montserrat">{r.issuedAt?.toDate ? r.issuedAt.toDate().toLocaleDateString() : '—'} · {r.paymentMethod || 'cash'}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400 font-montserrat">{fmt(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
