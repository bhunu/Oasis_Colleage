import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const TEAL = '#0F6E56'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'
const GRID  = { stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '3 3' }
const TICK  = { fill: '#6b7280', fontSize: 11 }
const AXLN  = { stroke: 'rgba(255,255,255,0.08)' }
const TIP   = {
  contentStyle: { backgroundColor: '#0D1C35', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 12 },
  labelStyle:   { color: '#0F6E56' },
  cursor:       { fill: 'rgba(255,255,255,0.04)' },
}

const CATEGORIES = ['Salaries', 'Utilities', 'Maintenance', 'Supplies & Stationery', 'Transport', 'Events', 'Other']
const COLORS = ['#185FA5', '#EF9F27', '#1D9E75', '#7F77DD', '#D4537E', '#E24B4A', '#9ca3af']

function fmt(v) { return `$${Number(v || 0).toLocaleString()}` }

export default function BudgetOverview() {
  const [expenses, setExpenses] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getDocs(collection(db, 'expenses'))
      .then(snap => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const byCategory = CATEGORIES.map((cat, i) => ({
    name: cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount || 0), 0),
    color: COLORS[i],
  }))

  const totalExp = byCategory.reduce((s, c) => s + c.total, 0)

  /* placeholder budget allocations */
  const budgets = [
    { cat: 'Salaries',              allocated: 25000, spent: byCategory[0].total || 22400 },
    { cat: 'Utilities',             allocated: 8000,  spent: byCategory[1].total || 7200  },
    { cat: 'Maintenance',           allocated: 12000, spent: byCategory[2].total || 9600  },
    { cat: 'Supplies & Stationery', allocated: 7000,  spent: byCategory[3].total || 6400  },
    { cat: 'Transport',             allocated: 5000,  spent: byCategory[4].total || 3200  },
    { cat: 'Events',                allocated: 4000,  spent: byCategory[5].total || 2800  },
    { cat: 'Other',                 allocated: 6000,  spent: byCategory[6].total || 7200  },
  ]

  return (
    <div className="space-y-6">

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Budget',   value: fmt(67000),     color: '#378ADD' },
          { label: 'Total Spent',    value: fmt(totalExp || 58800), color: '#E24B4A' },
          { label: 'Remaining',      value: fmt(67000 - (totalExp || 58800)), color: TEAL },
          { label: 'Budget Used',    value: `${Math.round((totalExp || 58800) / 67000 * 100)}%`, color: '#EF9F27' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0D1C35] border border-white/10 rounded-xl p-5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1">{label}</p>
            <p className="text-3xl font-bold font-playfair" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-4">Expenses by Category</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={byCategory}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="name" tick={{ ...TICK, fontSize: 10 }} axisLine={AXLN} tickLine={false} />
            <YAxis tick={TICK} axisLine={AXLN} tickLine={false} />
            <Tooltip {...TIP} />
            <Bar dataKey="total" name="Spent" radius={[4,4,0,0]}>
              {byCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Budget vs actual table */}
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-5">Budget vs Actual</h3>
        <div className="space-y-4">
          {budgets.map((b, i) => {
            const pct = Math.min((b.spent / b.allocated) * 100, 100)
            const over = b.spent > b.allocated
            return (
              <div key={b.cat}>
                <div className="flex justify-between text-xs font-montserrat mb-1.5">
                  <span className="text-gray-300">{b.cat}</span>
                  <span className={over ? 'text-red-400' : 'text-gray-400'}>
                    {fmt(b.spent)} / {fmt(b.allocated)}
                    {over && <span className="ml-1 text-red-400">(over budget)</span>}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: over ? '#E24B4A' : COLORS[i] }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
