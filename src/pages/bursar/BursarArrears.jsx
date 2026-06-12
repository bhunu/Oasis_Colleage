import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useTermDates, fmtTermDate, isTermEnded } from '../../hooks/useTermDates'

const TEAL = '#0F6E56'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'
const TH    = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat'
const TD    = 'py-3 px-4 text-sm text-gray-300 font-montserrat'
const TD_W  = 'py-3 px-4 text-sm text-white font-montserrat'

function fmt(v) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

export default function BursarArrears() {
  const navigate = useNavigate()
  const { termEndDate } = useTermDates()
  const [accounts, setAccounts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('')

  useEffect(() => {
    getDocs(query(collection(db, 'feeAccounts'), where('balanceType', '==', 'debit')))
      .then(snap => {
        setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.balance || 0) - (a.balance || 0)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = accounts.filter(a =>
    !filter ||
    (a.studentName || '').toLowerCase().includes(filter.toLowerCase()) ||
    (a.studentId   || '').toLowerCase().includes(filter.toLowerCase())
  )

  const totalArrears = accounts.reduce((s, a) => s + Number(a.balance || 0), 0)

  const termEnded = isTermEnded(termEndDate)

  return (
    <div className="space-y-6">

      {/* Post-term banner */}
      {termEnded && termEndDate && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3.5">
          <div className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-pulse" />
          <p className="font-montserrat text-sm text-red-300">
            <span className="font-bold">Term ended {fmtTermDate(termEndDate)}.</span>{' '}
            All outstanding balances below are post-term arrears.
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total in Arrears', value: accounts.length, color: '#E24B4A' },
          { label: 'Total Amount',     value: fmt(totalArrears), color: '#E24B4A' },
          { label: 'Avg per Student',  value: accounts.length ? fmt(totalArrears / accounts.length) : '$0.00', color: '#EF9F27' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0D1C35] border border-white/10 rounded-xl p-5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1">{label}</p>
            <p className="text-3xl font-bold font-playfair" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={CARD}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-playfair font-semibold text-white">Students in Arrears</h3>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter by name or ID…"
            className="bg-white/5 border border-white/10 focus:border-[#0F6E56]/50 focus:outline-none rounded-xl px-4 py-2 text-white font-montserrat text-xs placeholder-gray-600 transition-all w-56"
          />
        </div>

        {loading ? (
          <p className="text-center text-gray-500 font-montserrat text-sm py-8">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={TH}>Student</th>
                  <th className={TH}>ID</th>
                  <th className={TH}>Class</th>
                  <th className={TH}>Term Fees</th>
                  <th className={TH}>Paid</th>
                  <th className={TH}>Arrears</th>
                  <th className={TH}>Status</th>
                  <th className={TH}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className={TD_W}>{a.studentName || '—'}</td>
                    <td className={TD}>{a.reg_number || a.studentId || '—'}</td>
                    <td className={TD}>{a.class || a.form || '—'}</td>
                    <td className={TD}>{fmt(a.termFees || 0)}</td>
                    <td className={TD + ' text-emerald-400'}>{fmt(a.totalPaid || 0)}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold font-montserrat text-red-400">{fmt(a.balance || 0)}</span>
                    </td>
                    <td className="py-3 px-4">
                      {termEnded ? (
                        <span className="text-[10px] font-semibold font-montserrat px-2 py-0.5 rounded-full border bg-red-500/15 text-red-400 border-red-500/30">
                          Post-term
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold font-montserrat px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-400 border-amber-500/30">
                          Active
                        </span>
                      )}
                    </td>
                    <td className={TD}>
                      <button
                        onClick={() => navigate(`/bursar/receive-payment?reg=${encodeURIComponent(a.reg_number || a.studentId || '')}`)}
                        className="text-xs font-montserrat px-3 py-1.5 rounded-lg text-white transition"
                        style={{ backgroundColor: TEAL }}
                      >
                        Receive payment
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-gray-500 font-montserrat">
                      {accounts.length === 0 ? 'No arrears found — all accounts are up to date.' : 'No matching students.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
