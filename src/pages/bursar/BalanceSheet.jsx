import { useState } from 'react'
import toast from 'react-hot-toast'

const TEAL  = '#0F6E56'
const NAVY2 = '#378ADD'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'

function fmt(v) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

function Row({ label, value, bold, color, indent }) {
  return (
    <div className={`flex justify-between py-2 border-b border-white/5 font-montserrat text-sm ${indent ? 'pl-4' : ''}`}>
      <span className={bold ? 'font-semibold text-white' : 'text-gray-400'}>{label}</span>
      <span className={bold ? 'font-bold' : ''} style={{ color: color || (bold ? '#fff' : '#9ca3af') }}>{fmt(value)}</span>
    </div>
  )
}

export default function BalanceSheet() {
  const [asAt, setAsAt] = useState(new Date().toISOString().split('T')[0])

  /* Placeholder data — replace with Firestore reads from config/assets/liabilities collections */
  const assets = {
    cash: 18400, receivables: 12600, equipment: 34000,
  }
  assets.total = assets.cash + assets.receivables + assets.equipment

  const liabilities = {
    payables: 8200, deferred: 3400,
  }
  liabilities.total = liabilities.payables + liabilities.deferred

  const netPosition = assets.total - liabilities.total

  const handleCSV = () => {
    const rows = [
      ['Balance Sheet', `As at ${asAt}`],
      [],
      ['ASSETS'],
      ['Cash at bank',        assets.cash],
      ['Fees receivable',     assets.receivables],
      ['Equipment & assets',  assets.equipment],
      ['Total Assets',        assets.total],
      [],
      ['LIABILITIES'],
      ['Accounts payable',    liabilities.payables],
      ['Deferred income',     liabilities.deferred],
      ['Total Liabilities',   liabilities.total],
      [],
      ['Net Position',        netPosition],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `balance-sheet-${asAt}.csv`
    a.click()
    toast.success('CSV exported')
  }

  return (
    <>
      <style>{`@media print { body > * { display:none!important; } #balance-sheet { display:block!important; } }`}</style>

      <div id="balance-sheet" className="max-w-2xl mx-auto space-y-6">

        {/* Controls */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs text-gray-500 font-montserrat uppercase tracking-widest shrink-0">As at</label>
            <input
              type="date" value={asAt} onChange={e => setAsAt(e.target.value)}
              className="bg-white/5 border border-white/10 text-gray-300 rounded-xl px-4 py-2.5 text-sm font-montserrat focus:outline-none flex-1"
            />
          </div>
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

        <div className={CARD}>
          <div className="text-center mb-6 pb-4 border-b border-white/10">
            <h2 className="font-playfair text-xl font-bold text-white">OASIS PRIVATE COLLEGE</h2>
            <p className="text-sm font-montserrat text-gray-400 mt-0.5">Balance Sheet</p>
            <p className="text-xs font-montserrat text-gray-500 mt-0.5">As at {new Date(asAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>

          {/* Assets */}
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-2">Assets</p>
          <Row label="Cash at bank"       value={assets.cash}        indent />
          <Row label="Fees receivable"    value={assets.receivables} indent />
          <Row label="Equipment & assets" value={assets.equipment}   indent />
          <Row label="Total Assets"       value={assets.total}       bold color={TEAL} />

          {/* Liabilities */}
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-2 mt-5">Liabilities</p>
          <Row label="Accounts payable" value={liabilities.payables} indent />
          <Row label="Deferred income"  value={liabilities.deferred} indent />
          <Row label="Total Liabilities" value={liabilities.total}   bold color="#E24B4A" />

          {/* Net position */}
          <div className="mt-4 p-4 rounded-xl flex justify-between items-center" style={{ backgroundColor: `${NAVY2}18` }}>
            <span className="font-bold text-white font-montserrat">Net Position</span>
            <span className="font-bold text-xl font-playfair" style={{ color: NAVY2 }}>{fmt(netPosition)}</span>
          </div>
        </div>
      </div>
    </>
  )
}
