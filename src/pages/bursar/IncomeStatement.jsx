import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const TEAL = '#0F6E56'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'

function fmt(v) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

function Row({ label, value, bold, color, indent }) {
  return (
    <div className={`flex justify-between py-2 border-b border-white/5 font-montserrat text-sm ${indent ? 'pl-4' : ''}`}>
      <span className={bold ? 'font-semibold text-white' : 'text-gray-400'}>{label}</span>
      <span className={`font-${bold ? 'bold' : 'normal'}`} style={{ color: color || (bold ? '#fff' : '#9ca3af') }}>{fmt(value)}</span>
    </div>
  )
}

export default function IncomeStatement() {
  const [term,        setTerm]        = useState('')
  const [termOptions, setTermOptions] = useState([])
  const [expenses,    setExpenses]    = useState([])
  const [fees,        setFees]        = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, 'expenses')),
      getDocs(collection(db, 'feeAccounts')),
    ]).then(([expSnap, feeSnap]) => {
      const feeData = feeSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      setExpenses(expSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setFees(feeData)
      const opts = [...new Set(feeData.map(f => f.term).filter(Boolean))]
        .sort().reverse()
        .map(t => { const [n, y] = t.split('-'); return n && y ? `Term ${n} ${y}` : t })
      setTermOptions(opts)
      if (opts.length > 0) setTerm(opts[0])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  /* Parse selected term to get matching formats for each collection */
  const [, termNum, termYear] = (term.match(/Term (\d+) (\d+)/) || [])
  const feeAccountTerm = termNum && termYear ? `${termNum}-${termYear}` : null
  const expenseTerm    = termNum ? `Term ${termNum}` : null

  const tuition  = fees
    .filter(f => !feeAccountTerm || f.term === feeAccountTerm)
    .reduce((s, f) => s + Number(f.totalPaid || 0), 0)
  const totalInc = tuition

  const catTotal = (cat) => expenses
    .filter(e => e.category === cat && (!expenseTerm || e.term === expenseTerm))
    .reduce((s, e) => s + Number(e.amount || 0), 0)

  const salaries    = catTotal('Salaries')
  const utilities   = catTotal('Utilities')
  const maintenance = catTotal('Maintenance')
  const supplies    = catTotal('Supplies & Stationery')
  const otherExp    = expenses
    .filter(e => !['Salaries','Utilities','Maintenance','Supplies & Stationery'].includes(e.category)
      && (!expenseTerm || e.term === expenseTerm))
    .reduce((s, e) => s + Number(e.amount || 0), 0)
  const totalExp   = salaries + utilities + maintenance + supplies + otherExp
  const netSurplus = totalInc - totalExp

  const handleCSV = () => {
    const rows = [
      ['Income Statement', term || 'All terms'],
      [],
      ['INCOME'],
      ['Tuition fees collected', tuition],
      ['Total Income', totalInc],
      [],
      ['EXPENSES'],
      ['Salaries', salaries],
      ['Utilities', utilities],
      ['Maintenance', maintenance],
      ['Supplies & Stationery', supplies],
      ['Other expenses', otherExp],
      ['Total Expenses', totalExp],
      [],
      ['Net Surplus', netSurplus],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `income-statement-${(term || 'all').replace(/ /g, '-')}.csv`
    a.click()
    toast.success('CSV exported')
  }

  return (
    <>
      <style>{`@media print { body > * { display:none!important; } #income-stmt { display:block!important; } }`}</style>

      <div id="income-stmt" className="max-w-2xl mx-auto space-y-6">

        {/* Controls */}
        <div className="flex gap-3">
          <select value={term} onChange={e => setTerm(e.target.value)}
            className="bg-white/5 border border-white/10 text-gray-300 rounded-xl px-4 py-2.5 text-sm font-montserrat focus:outline-none flex-1">
            {termOptions.length === 0
              ? <option value="">No terms found</option>
              : termOptions.map(t => <option key={t} value={t}>{t}</option>)
            }
          </select>
          <button onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold font-montserrat text-white border border-white/20 hover:bg-white/5 transition">
            Print
          </button>
          <button onClick={handleCSV}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold font-montserrat text-white transition"
            style={{ backgroundColor: TEAL }}>
            Export CSV
          </button>
        </div>

        {/* Statement card */}
        <div className={CARD}>
          <div className="text-center mb-6 pb-4 border-b border-white/10">
            <h2 className="font-playfair text-xl font-bold text-white">OASIS PRIVATE COLLEGE</h2>
            <p className="text-sm font-montserrat text-gray-400 mt-0.5">Income Statement</p>
            <p className="text-xs font-montserrat text-gray-500 mt-0.5">{term || 'All terms'}</p>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 font-montserrat text-sm py-8">Loading…</p>
          ) : (
            <>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-2">Income</p>
              <Row label="Tuition fees collected" value={tuition} indent />
              <Row label="Total Income"           value={totalInc} bold color={TEAL} />

              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-2 mt-5">Expenses</p>
              {salaries    > 0 && <Row label="Salaries"              value={salaries}    indent />}
              {utilities   > 0 && <Row label="Utilities"             value={utilities}   indent />}
              {maintenance > 0 && <Row label="Maintenance"           value={maintenance} indent />}
              {supplies    > 0 && <Row label="Supplies & Stationery" value={supplies}    indent />}
              {otherExp    > 0 && <Row label="Other expenses"        value={otherExp}    indent />}
              {totalExp === 0 && (
                <p className="pl-4 py-2 text-xs text-gray-600 font-montserrat">No expenses recorded for this term.</p>
              )}
              <Row label="Total Expenses" value={totalExp} bold color="#E24B4A" />

              <div className="mt-4 p-4 rounded-xl flex justify-between items-center"
                style={{ backgroundColor: netSurplus >= 0 ? `${TEAL}18` : '#e24b4a18' }}>
                <span className="font-bold text-white font-montserrat">Net Surplus / (Deficit)</span>
                <span className="font-bold text-xl font-playfair" style={{ color: netSurplus >= 0 ? TEAL : '#E24B4A' }}>{fmt(netSurplus)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
