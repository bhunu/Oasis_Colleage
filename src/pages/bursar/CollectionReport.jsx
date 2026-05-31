import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const TEAL = '#0F6E56'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'
const TH    = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat'
const TD    = 'py-3 px-4 text-sm text-gray-300 font-montserrat'
const GRID  = { stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '3 3' }
const TICK  = { fill: '#6b7280', fontSize: 11 }
const AXLN  = { stroke: 'rgba(255,255,255,0.08)' }
const TIP   = {
  contentStyle: { backgroundColor: '#0D1C35', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 12 },
  labelStyle: { color: '#0F6E56' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

function fmt(v) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function CollectionReport() {
  const [receipts, setReceipts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [term,     setTerm]     = useState('Term 2 2025')

  useEffect(() => {
    getDocs(collection(db, 'receipts'))
      .then(snap => setReceipts(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /* Group by month */
  const byMonth = MONTHS.map(m => {
    const monthReceipts = receipts.filter(r => {
      if (!r.issuedAt?.toDate) return false
      return r.issuedAt.toDate().toLocaleString('en-US', { month: 'short' }) === m
    })
    return {
      month: m,
      collected: monthReceipts.reduce((s, r) => s + Number(r.amount || 0), 0),
      count:     monthReceipts.length,
    }
  }).filter(m => m.collected > 0)

  const totalCollected = receipts.reduce((s, r) => s + Number(r.amount || 0), 0)

  const handleCSV = () => {
    const header = ['Receipt No.', 'Student', 'Class', 'Amount', 'Method', 'Term', 'Date']
    const rows   = receipts.map(r => [
      r.receiptNumber || r.id,
      r.studentName || '',
      r.class || '',
      r.amount || 0,
      r.paymentMethod || '',
      r.term || '',
      r.issuedAt?.toDate ? r.issuedAt.toDate().toLocaleDateString() : '',
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `collection-report-${term.replace(' ', '-')}.csv`
    a.click()
    toast.success('CSV exported')
  }

  return (
    <div className="space-y-6">

      <div className="flex gap-3">
        <select value={term} onChange={e => setTerm(e.target.value)}
          className="bg-white/5 border border-white/10 text-gray-300 rounded-xl px-4 py-2.5 text-sm font-montserrat focus:outline-none flex-1">
          <option>Term 2 2025</option>
          <option>Term 1 2025</option>
          <option>Term 3 2024</option>
        </select>
        <button onClick={handleCSV}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold font-montserrat text-white transition"
          style={{ backgroundColor: TEAL }}>
          Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Collected', value: fmt(totalCollected), color: TEAL },
          { label: 'No. Receipts',    value: receipts.length,     color: '#378ADD' },
          { label: 'Average Payment', value: receipts.length ? fmt(totalCollected / receipts.length) : '$0.00', color: '#EF9F27' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0D1C35] border border-white/10 rounded-xl p-5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1">{label}</p>
            <p className="text-3xl font-bold font-playfair" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {byMonth.length > 0 && (
        <div className={CARD}>
          <h3 className="font-playfair font-semibold text-white mb-4">Collections by Month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byMonth}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="month" tick={TICK} axisLine={AXLN} tickLine={false} />
              <YAxis tick={TICK} axisLine={AXLN} tickLine={false} />
              <Tooltip {...TIP} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11, fontFamily: 'Montserrat' }} />
              <Bar dataKey="collected" name="Collected" fill={TEAL} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Receipts table */}
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-4">All Receipts</h3>
        {loading ? (
          <p className="text-center text-gray-500 font-montserrat text-sm py-8">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={TH}>Receipt No.</th>
                  <th className={TH}>Student</th>
                  <th className={TH}>Class</th>
                  <th className={TH}>Amount</th>
                  <th className={TH}>Method</th>
                  <th className={TH}>Date</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map(r => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="py-3 px-4 text-sm text-white font-montserrat font-semibold">{r.receiptNumber || r.id.slice(0,8).toUpperCase()}</td>
                    <td className="py-3 px-4 text-sm text-white font-montserrat">{r.studentName || '—'}</td>
                    <td className={TD}>{r.class || '—'}</td>
                    <td className={`${TD} font-semibold`} style={{ color: TEAL }}>{fmt(r.amount)}</td>
                    <td className={TD}>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold font-montserrat ${
                        r.paymentMethod === 'cash'   ? 'bg-purple-500/20 text-purple-300' :
                        r.paymentMethod === 'bank'   ? 'bg-blue-500/20 text-blue-300'    :
                        'bg-teal-500/20 text-teal-300'
                      }`}>{r.paymentMethod || 'cash'}</span>
                    </td>
                    <td className={TD}>{r.issuedAt?.toDate ? r.issuedAt.toDate().toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
                {receipts.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-sm text-gray-500 font-montserrat">No receipts found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
