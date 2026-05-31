import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const TEAL = '#0F6E56'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'
const TH    = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat'
const TD    = 'py-3 px-4 text-sm text-gray-300 font-montserrat'
const TIP   = {
  contentStyle: { backgroundColor: '#0D1C35', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 12 },
  labelStyle: { color: '#0F6E56' },
}

const CATEGORIES = ['Salaries', 'Utilities', 'Maintenance', 'Supplies & Stationery', 'Transport', 'Events', 'Other']
const COLORS = ['#185FA5', '#EF9F27', '#1D9E75', '#7F77DD', '#D4537E', '#E24B4A', '#9ca3af']

function fmt(v) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

export default function ExpenseCategories() {
  const [expenses, setExpenses] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [catExp,   setCatExp]   = useState([])

  useEffect(() => {
    getDocs(collection(db, 'expenses'))
      .then(snap => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const byCategory = CATEGORIES.map((cat, i) => ({
    name:  cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount || 0), 0),
    count: expenses.filter(e => e.category === cat).length,
    color: COLORS[i],
  })).filter(c => c.total > 0)

  const handleCategory = (cat) => {
    setSelected(cat)
    setCatExp(expenses.filter(e => e.category === cat.name).sort((a, b) => new Date(b.date) - new Date(a.date)))
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className={CARD}>
          <h3 className="font-playfair font-semibold text-white mb-4">Spending Distribution</h3>
          {loading ? (
            <p className="text-gray-500 font-montserrat text-sm text-center py-8">Loading…</p>
          ) : byCategory.length === 0 ? (
            <p className="text-gray-500 font-montserrat text-sm text-center py-8">No expenses recorded yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byCategory} cx="50%" cy="50%" outerRadius={90} paddingAngle={2} dataKey="total"
                    onClick={handleCategory}>
                    {byCategory.map((e, i) => <Cell key={i} fill={e.color} cursor="pointer" />)}
                  </Pie>
                  <Tooltip {...TIP} formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {byCategory.map((c, i) => (
                  <button
                    key={c.name}
                    onClick={() => handleCategory(c)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition text-left ${selected?.name === c.name ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-xs text-gray-300 font-montserrat flex-1">{c.name}</span>
                    <span className="text-xs text-white font-montserrat font-semibold">{fmt(c.total)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Category stats */}
        <div className={CARD}>
          <h3 className="font-playfair font-semibold text-white mb-4">
            {selected ? `${selected.name} — ${selected.count} expense${selected.count !== 1 ? 's' : ''}` : 'All Categories'}
          </h3>
          {selected ? (
            <div className="overflow-y-auto max-h-80">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={TH}>Date</th>
                    <th className={TH}>Description</th>
                    <th className={`${TH} text-right`}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {catExp.map(e => (
                    <tr key={e.id} className="border-b border-white/5">
                      <td className={TD}>{e.date || '—'}</td>
                      <td className="py-3 px-4 text-sm text-white font-montserrat">{e.description || '—'}</td>
                      <td className={`${TD} text-right text-red-400`}>{fmt(e.amount)}</td>
                    </tr>
                  ))}
                  {catExp.length === 0 && (
                    <tr><td colSpan={3} className="py-4 text-center text-sm text-gray-500 font-montserrat">No expenses in this category</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              {CATEGORIES.map((cat, i) => {
                const c = byCategory.find(b => b.name === cat)
                return (
                  <div key={cat} className="flex justify-between items-center py-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-sm text-gray-300 font-montserrat">{cat}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-white font-montserrat">{c ? fmt(c.total) : '$0.00'}</span>
                      <span className="text-xs text-gray-600 font-montserrat ml-2">{c?.count || 0} items</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
