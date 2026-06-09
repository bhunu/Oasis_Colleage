import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const TEAL  = '#0F6E56'
const INPUT = 'w-full bg-white/5 border border-white/10 focus:border-[#0F6E56]/50 focus:outline-none rounded-xl px-4 py-3 text-white font-montserrat text-sm placeholder-gray-600 transition-all'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'
const TH    = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat'
const TD    = 'py-3 px-4 text-sm text-gray-300 font-montserrat'
const TD_W  = 'py-3 px-4 text-sm text-white font-montserrat'

function fmt(v) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

export default function BursarStudentAccounts() {
  const navigate = useNavigate()
  const [search,    setSearch]   = useState('')
  const [students,  setStudents] = useState([])
  const [selected,  setSelected] = useState(null)
  const [account,   setAccount]  = useState(null)
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    const term = search.trim()
    if (!term) return
    setSearching(true)
    setStudents([])
    try {
      const regTerm = /^\d+$/.test(term) ? 'R' + term : term.toUpperCase()
      const [byName, byReg] = await Promise.all([
        getDocs(query(
          collection(db, 'students'),
          where('fullName', '>=', term),
          where('fullName', '<=', term + ''),
          limit(10)
        )),
        getDocs(query(
          collection(db, 'students'),
          where('reg_number', '==', regTerm),
          limit(5)
        )),
      ])
      const merged = new Map()
      ;[...byName.docs, ...byReg.docs].forEach(d => merged.set(d.id, { id: d.id, ...d.data() }))
      const results = [...merged.values()]
      setStudents(results)
      if (results.length === 0) toast.error('No student found')
    } catch (err) {
      console.error('Search error:', err)
      setStudents([])
    }
    setSearching(false)
  }

  const handleSelect = async (student) => {
    setSelected(student)
    setStudents([])
    setSearch(student.fullName || student.reg_number || '')
    try {
      const snap = await getDocs(query(
        collection(db, 'feeAccounts'),
        where('reg_number', '==', student.reg_number),
        limit(1)
      ))
      setAccount(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() })
    } catch { setAccount(null) }
  }

  const payments = account?.payments || []

  const ledger = () => {
    let balance = 0
    const rows = []
    const termFee = account?.termFees || 0
    if (termFee > 0) {
      balance += termFee
      rows.push({ date: '—', desc: 'Term fees charged', debit: termFee, credit: 0, balance })
    }
    payments.forEach(p => {
      balance -= Number(p.amount)
      rows.push({ date: p.date || '—', desc: `Payment (${p.method || 'cash'})`, debit: 0, credit: Number(p.amount), balance })
    })
    return rows
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3 text-amber-300 font-montserrat text-xs">
        View only — to record a payment, use Receive Payment.
      </div>

      {/* Search */}
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-4">Find Student Account</h3>
        <div className="flex gap-3">
          <div className="flex-1 flex items-center bg-white/5 border border-white/10 focus-within:border-[#0F6E56]/50 rounded-xl overflow-hidden transition-all">
            <span className="pl-4 pr-3 text-[#0F6E56] font-mono font-bold text-sm shrink-0 border-r border-white/10 py-3">R</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="262681 or student name..."
              className="flex-1 bg-transparent outline-none px-3 py-3 text-white font-montserrat text-sm placeholder-gray-600"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-5 py-3 rounded-xl text-sm font-semibold font-montserrat text-white shrink-0"
            style={{ backgroundColor: TEAL }}
          >
            {searching ? '...' : 'Search'}
          </button>
        </div>
        {students.length > 0 && (
          <div className="mt-2 border border-white/10 rounded-xl overflow-hidden">
            {students.map(s => (
              <button key={s.id} onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition">
                <p className="text-sm text-white font-montserrat">{s.fullName}</p>
                <p className="text-xs text-gray-500 font-montserrat">{s.reg_number} &middot; {s.class || '—'}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Account details */}
      {selected && (
        <>
          <div className={CARD}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-playfair font-semibold text-white text-lg">{selected.fullName}</h3>
                <p className="text-sm text-gray-400 font-montserrat">{selected.reg_number} &middot; {selected.class || '—'}</p>
              </div>
              {account ? (
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-montserrat uppercase tracking-widest">Current Balance</p>
                  <p className={`font-bold text-2xl font-playfair ${
                    account.balanceType === 'debit'  ? 'text-red-400' :
                    account.balanceType === 'credit' ? 'text-emerald-400' :
                    'text-gray-400'
                  }`}>
                    {account.balanceType === 'debit' ? '-' : account.balanceType === 'credit' ? '+' : ''}
                    {fmt(account.balance || 0)}
                  </p>
                  <p className={`text-xs font-montserrat capitalize ${
                    account.balanceType === 'debit' ? 'text-red-400' : account.balanceType === 'credit' ? 'text-emerald-400' : 'text-gray-400'
                  }`}>{account.balanceType || 'nil'}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 font-montserrat">No fee account found</p>
              )}
            </div>

            {account && (
              <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/10">
                {[
                  ['Term Fees',  fmt(account.termFees || 0),  'text-white'],
                  ['Total Paid', fmt(account.totalPaid || 0), 'text-emerald-400'],
                  ['Balance',    fmt(account.balance || 0),   account.balanceType === 'debit' ? 'text-red-400' : 'text-emerald-400'],
                ].map(([label, val, cls]) => (
                  <div key={label}>
                    <p className="text-[10px] text-gray-500 font-montserrat uppercase tracking-widest mb-1">{label}</p>
                    <p className={`text-lg font-bold font-playfair ${cls}`}>{val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {account && (
            <div className={CARD}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-playfair font-semibold text-white">Payment Ledger</h3>
                <button
                  onClick={() => navigate('/bursar/receive-payment')}
                  className="text-xs font-montserrat px-4 py-2 rounded-lg text-white transition"
                  style={{ backgroundColor: TEAL }}
                >
                  + Receive payment
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
                    {ledger().map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className={TD}>{row.date}</td>
                        <td className={TD_W}>{row.desc}</td>
                        <td className={`${TD} text-right text-red-400`}>{row.debit > 0 ? fmt(row.debit) : '—'}</td>
                        <td className={`${TD} text-right text-emerald-400`}>{row.credit > 0 ? fmt(row.credit) : '—'}</td>
                        <td className={`${TD} text-right font-semibold ${row.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {fmt(Math.abs(row.balance))}
                        </td>
                      </tr>
                    ))}
                    {ledger().length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-sm text-gray-500 font-montserrat">
                          No transactions recorded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!selected && (
        <div className={`${CARD} text-center py-12`}>
          <p className="text-gray-500 font-montserrat text-sm">
            Search for a student to view their fee account and payment history.
          </p>
        </div>
      )}
    </div>
  )
}
