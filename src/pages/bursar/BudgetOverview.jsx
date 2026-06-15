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
const TH = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat'
const TD = 'py-3 px-4 text-sm font-montserrat'

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
    name:  cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount || 0), 0),
    count: expenses.filter(e => e.category === cat).length,
    color: COLORS[i],
  }))

  const totalExp = byCategory.reduce((s, c) => s + c.total, 0)
  const topCat   = [...byCategory].sort((a, b) => b.total - a.total)[0]

  return (
    <div className="space-y-6">

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Expenses',  value: loading ? '...' : fmt(totalExp),          color: '#E24B4A' },
          { label: 'Expense Entries', value: loading ? '...' : expenses.length,         color: '#EF9F27' },
          { label: 'Top Category',    value: loading ? '...' : (topCat?.total > 0 ? topCat.name : '—'), color: '#7F77DD' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0D1C35] border border-white/10 rounded-xl p-5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1">{label}</p>
            <p className="text-2xl font-bold font-playfair" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-4">Expenses by Category</h3>
        {loading ? (
          <div className="flex items-center justify-center h-[280px]">
            <div className="w-6 h-6 border-2 border-[#0F6E56] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byCategory}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="name" tick={{ ...TICK, fontSize: 10 }} axisLine={AXLN} tickLine={false} />
              <YAxis tick={TICK} axisLine={AXLN} tickLine={false} />
              <Tooltip {...TIP} formatter={v => fmt(v)} />
              <Bar dataKey="total" name="Spent" radius={[4,4,0,0]}>
                {byCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Spending by category table */}
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-4">Spending by Category</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className={TH}>Category</th>
                <th className={TH}>Total Spent</th>
                <th className={TH}>Entries</th>
                <th className={TH}>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.filter(c => c.total > 0).sort((a, b) => b.total - a.total).map(c => (
                <tr key={c.name} className="border-b border-white/5">
                  <td className={TD}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-white">{c.name}</span>
                    </div>
                  </td>
                  <td className={`${TD} font-semibold`} style={{ color: c.color }}>{fmt(c.total)}</td>
                  <td className={`${TD} text-gray-400`}>{c.count}</td>
                  <td className={`${TD} text-gray-400`}>{totalExp > 0 ? Math.round(c.total / totalExp * 100) : 0}%</td>
                </tr>
              ))}
              {!loading && totalExp === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-gray-500 font-montserrat">
                    No expenses recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
