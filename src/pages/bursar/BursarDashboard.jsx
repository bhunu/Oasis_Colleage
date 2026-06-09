import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import {
  MdAttachMoney, MdWarning, MdReceiptLong, MdTrendingUp,
  MdPointOfSale, MdDescription, MdTableChart, MdBalance,
  MdCheckCircle,
} from 'react-icons/md'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'

/* ── chart theme ── */
const GRID    = { stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '3 3' }
const TICK    = { fill: '#6b7280', fontSize: 11 }
const AXLINE  = { stroke: 'rgba(255,255,255,0.08)' }
const TIP     = {
  contentStyle: { backgroundColor: '#0D1C35', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 12 },
  labelStyle:   { color: '#0F6E56' },
  cursor:       { fill: 'rgba(255,255,255,0.04)' },
}
const TEAL  = '#1D9E75'
const RED   = '#E24B4A'
const BLUE  = '#185FA5'
const GOLD  = '#EF9F27'
const PURP  = '#7F77DD'
const PINK  = '#D4537E'
const NAVY2 = '#378ADD'

/* ── placeholder data ── */
const collectionData = [
  { month: 'Jan', collected: 12400, arrears: 3200 },
  { month: 'Feb', collected: 14800, arrears: 2900 },
  { month: 'Mar', collected: 11200, arrears: 4100 },
  { month: 'Apr', collected: 16500, arrears: 2400 },
  { month: 'May', collected: 18200, arrears: 1800 },
  { month: 'Jun', collected: 9400,  arrears: 5200 },
]
const expenseData = [
  { name: 'Salaries',     value: 42, color: BLUE  },
  { name: 'Utilities',    value: 14, color: GOLD  },
  { name: 'Maintenance',  value: 18, color: TEAL  },
  { name: 'Supplies',     value: 12, color: PURP  },
  { name: 'Other',        value: 14, color: PINK  },
]
const trendData = [
  { term: 'Term 1', income: 48000, expenses: 31000, surplus: 17000 },
  { term: 'Term 2', income: 55000, expenses: 34000, surplus: 21000 },
  { term: 'Term 3', income: 41000, expenses: 29000, surplus: 12000 },
]
const methodData = [
  { month: 'Jan', cash: 5400, bank: 4200, mobile: 2800 },
  { month: 'Feb', cash: 6200, bank: 5100, mobile: 3500 },
  { month: 'Mar', cash: 4800, bank: 3900, mobile: 2500 },
  { month: 'Apr', cash: 7100, bank: 5600, mobile: 3800 },
  { month: 'May', cash: 8200, bank: 6100, mobile: 3900 },
]

const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'
const HEAD  = 'font-semibold text-white font-playfair'
const TH    = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat'
const TD    = 'py-3 px-4 text-sm text-gray-300 font-montserrat'
const TD_W  = 'py-3 px-4 text-sm text-white font-montserrat'

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-[#0D1C35] border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1">{label}</p>
          <p className="text-3xl font-bold text-white font-playfair">{value}</p>
        </div>
        <div className="p-3 rounded-lg shrink-0" style={{ backgroundColor: `${color}22`, color }}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

export default function BursarDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ collected: 0, arrears: 0, expenses: 0, surplus: 0, feesPaidFull: 0 })
  const [receipts, setReceipts] = useState([])
  const [topArrears, setTopArrears] = useState([])
  const [term, setTerm] = useState('Term 2 2025')
  const [loading, setLoading] = useState(true)

  /* income statement mock totals */
  const income = {
    tuition: 47200, examFees: 3800, sportsLevy: 1200, other: 800,
    total: 53000,
  }
  const expenses = {
    salaries: 22400, utilities: 7200, maintenance: 9600, supplies: 6400, other: 7200,
    total: 52800,
  }
  const netSurplus = income.total - expenses.total

  /* balance sheet mock */
  const assets = { cash: 18400, receivables: 12600, equipment: 34000, total: 65000 }
  const liabilities = { payables: 8200, deferred: 3400, total: 11600 }
  const netPosition = assets.total - liabilities.total

  useEffect(() => {
    let pending = 3
    const done = () => { if (--pending === 0) setLoading(false) }

    /* fee accounts — stats: collected, arrears, feesPaidFull + top arrears list */
    getDocs(collection(db, 'feeAccounts'))
      .then(snap => {
        let collected = 0, arrears = 0, feesPaidFull = 0
        const arrearsRows = []
        snap.forEach(d => {
          const data = d.data()
          collected += Number(data.totalPaid || 0)
          if (data.balanceType === 'debit') {
            arrears += Number(data.balance || 0)
            arrearsRows.push({ id: d.id, ...data })
          }
          if (Number(data.termFees || 0) > 0 && Number(data.totalPaid || 0) >= Number(data.termFees || 0)) feesPaidFull++
        })
        arrearsRows.sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
        setStats(prev => ({ ...prev, collected, arrears, feesPaidFull, surplus: collected - prev.expenses }))
        setTopArrears(arrearsRows.slice(0, 5))
      })
      .catch(() => {})
      .finally(done)

    /* expenses */
    getDocs(collection(db, 'expenses'))
      .then(snap => {
        let expTotal = 0
        snap.forEach(d => { expTotal += Number(d.data().amount || 0) })
        setStats(prev => ({ ...prev, expenses: expTotal, surplus: prev.collected - expTotal }))
      })
      .catch(() => {})
      .finally(done)

    /* recent receipts — sort in JS to avoid index requirement */
    getDocs(collection(db, 'receipts'))
      .then(snap => {
        const sorted = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.issuedAt?.seconds ?? 0) - (a.issuedAt?.seconds ?? 0))
          .slice(0, 5)
        setReceipts(sorted)
      })
      .catch(() => {})
      .finally(done)
  }, [])

  const fmt = v => `$${Number(v).toLocaleString()}`

  const QUICK = [
    { label: 'Receive payment',  sub: 'Record incoming fees',  path: '/bursar/receive-payment' },
    { label: 'Issue receipt',    sub: 'Print student receipt',  path: '/bursar/issue-receipt' },
    { label: 'Update Fees',      sub: 'Manage fee accounts',   path: '/fees' },
    { label: 'Record expense',   sub: 'Log school expense',    path: '/bursar/record-expense' },
    { label: 'Income statement', sub: 'View P&L statement',    path: '/bursar/income-statement' },
    { label: 'Balance sheet',    sub: 'Assets & liabilities',  path: '/bursar/balance-sheet' },
  ]

  return (
    <div className="space-y-6">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Fees Collected"     value={loading ? '...' : fmt(stats.collected)}     icon={MdAttachMoney}  color={TEAL} />
        <StatCard label="Fees Paid in Full"  value={loading ? '...' : stats.feesPaidFull}        icon={MdCheckCircle}  color={TEAL} />
        <StatCard label="Outstanding Arrears" value={loading ? '...' : fmt(stats.arrears)}       icon={MdWarning}      color={RED}  />
        <StatCard label="Total Expenses"      value={loading ? '...' : fmt(stats.expenses)}      icon={MdReceiptLong}  color={GOLD} />
        <StatCard label="Net Surplus"         value={loading ? '...' : fmt(stats.surplus)}       icon={MdTrendingUp}   color={BLUE} />
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {QUICK.map(({ label, sub, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="bg-[#0D1C35] border border-white/10 hover:border-[#0F6E56]/40 hover:bg-[#0F6E56]/5 rounded-xl p-4 text-left transition-all group"
          >
            <p className="font-semibold text-white font-montserrat text-xs group-hover:text-[#1D9E75] transition-colors">{label}</p>
            <p className="text-[10px] text-gray-500 font-montserrat mt-0.5">{sub}</p>
          </button>
        ))}
      </div>

      {/* ── Chart row 1: collections + expense breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1 – Fee collections by month */}
        <div className={CARD}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={HEAD}>Fee Collections by Month</h3>
            <select
              value={term}
              onChange={e => setTerm(e.target.value)}
              className="text-xs bg-white/5 border border-white/10 text-gray-400 rounded-lg px-3 py-1.5 font-montserrat focus:outline-none"
            >
              <option>Term 2 2025</option>
              <option>Term 1 2025</option>
              <option>Term 3 2024</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={collectionData}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="month" tick={TICK} axisLine={AXLINE} tickLine={false} />
              <YAxis tick={TICK} axisLine={AXLINE} tickLine={false} />
              <Tooltip {...TIP} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11, fontFamily: 'Montserrat' }} />
              <Bar dataKey="collected" name="Collected" fill={TEAL}  radius={[4,4,0,0]} />
              <Bar dataKey="arrears"   name="Arrears"   fill={RED}   radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2 – Expense breakdown */}
        <div className={CARD}>
          <h3 className={`${HEAD} mb-4`}>Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                {expenseData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip {...TIP} formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {expenseData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-400 font-montserrat">{item.name}: <span className="text-white">{item.value}%</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chart row 2: income vs expense trend + payment methods ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 3 – Income vs expenses trend */}
        <div className={CARD}>
          <h3 className={`${HEAD} mb-4`}>Income vs Expenses Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="term" tick={TICK} axisLine={AXLINE} tickLine={false} />
              <YAxis tick={TICK} axisLine={AXLINE} tickLine={false} />
              <Tooltip {...TIP} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11, fontFamily: 'Montserrat' }} />
              <Line type="monotone" dataKey="income"   name="Income"   stroke={TEAL} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke={RED}  strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="surplus"  name="Surplus"  stroke={NAVY2} strokeWidth={2} strokeDasharray="3 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 4 – Collections by payment method */}
        <div className={CARD}>
          <h3 className={`${HEAD} mb-4`}>Collections by Payment Method</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={methodData}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="month" tick={TICK} axisLine={AXLINE} tickLine={false} />
              <YAxis tick={TICK} axisLine={AXLINE} tickLine={false} />
              <Tooltip {...TIP} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11, fontFamily: 'Montserrat' }} />
              <Bar dataKey="cash"   name="Cash"          fill={PURP}  stackId="a" />
              <Bar dataKey="bank"   name="Bank transfer" fill={NAVY2} stackId="a" />
              <Bar dataKey="mobile" name="Mobile money"  fill={TEAL}  stackId="a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Income statement + balance sheet panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Income Statement */}
        <div className={CARD}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className={HEAD}>Income Statement</h3>
              <p className="text-xs text-gray-500 font-montserrat">Term 2 · 2025</p>
            </div>
            <button
              onClick={() => navigate('/bursar/income-statement')}
              className="text-xs font-montserrat px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: '#0F6E56', color: '#1D9E75' }}
            >
              Full view
            </button>
          </div>

          <div className="space-y-1 text-xs font-montserrat">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest pt-1">Income</p>
            {[
              ['Tuition fees collected', income.tuition],
              ['Exam fees',              income.examFees],
              ['Sports levy',            income.sportsLevy],
              ['Other income',           income.other],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">{k}</span>
                <span className="text-white">{fmt(v)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-semibold text-white border-b border-[#0F6E56]/40">
              <span>Total Income</span><span style={{ color: TEAL }}>{fmt(income.total)}</span>
            </div>

            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest pt-3">Expenses</p>
            {[
              ['Salaries',    expenses.salaries],
              ['Utilities',   expenses.utilities],
              ['Maintenance', expenses.maintenance],
              ['Supplies',    expenses.supplies],
              ['Other',       expenses.other],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">{k}</span>
                <span className="text-white">{fmt(v)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-semibold text-white border-b border-red-500/30">
              <span>Total Expenses</span><span className="text-red-400">{fmt(expenses.total)}</span>
            </div>

            <div className="flex justify-between py-2.5 font-bold text-base rounded-lg px-2 mt-2"
              style={{ backgroundColor: netSurplus >= 0 ? `${TEAL}18` : '#e24b4a18' }}>
              <span className="text-white">Net Surplus</span>
              <span style={{ color: netSurplus >= 0 ? TEAL : RED }}>{fmt(netSurplus)}</span>
            </div>
          </div>
        </div>

        {/* Balance Sheet */}
        <div className={CARD}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className={HEAD}>Balance Sheet</h3>
              <p className="text-xs text-gray-500 font-montserrat">As at today</p>
            </div>
            <button
              onClick={() => navigate('/bursar/balance-sheet')}
              className="text-xs font-montserrat px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: '#0F6E56', color: '#1D9E75' }}
            >
              Full view
            </button>
          </div>

          <div className="space-y-1 text-xs font-montserrat">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest pt-1">Assets</p>
            {[
              ['Cash at bank',         assets.cash],
              ['Fees receivable',      assets.receivables],
              ['Equipment & assets',   assets.equipment],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">{k}</span>
                <span className="text-white">{fmt(v)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-semibold text-white border-b border-[#0F6E56]/40">
              <span>Total Assets</span><span style={{ color: TEAL }}>{fmt(assets.total)}</span>
            </div>

            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest pt-3">Liabilities</p>
            {[
              ['Accounts payable',  liabilities.payables],
              ['Deferred income',   liabilities.deferred],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">{k}</span>
                <span className="text-white">{fmt(v)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-semibold text-white border-b border-red-500/30">
              <span>Total Liabilities</span><span className="text-red-400">{fmt(liabilities.total)}</span>
            </div>

            <div className="flex justify-between py-2.5 font-bold text-base rounded-lg px-2 mt-2"
              style={{ backgroundColor: `${NAVY2}18` }}>
              <span className="text-white">Net Position</span>
              <span style={{ color: NAVY2 }}>{fmt(netPosition)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent receipts + Top Arrears ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Recent receipts */}
      <div className={CARD}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={HEAD}>Recent Receipts</h3>
          <button
            onClick={() => navigate('/bursar/issue-receipt')}
            className="text-xs font-montserrat px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: '#0F6E56', color: '#1D9E75' }}
          >
            + New receipt
          </button>
        </div>

        {receipts.length === 0 ? (
          <p className="text-sm text-gray-500 font-montserrat py-6 text-center">No receipts yet. <button onClick={() => navigate('/bursar/receive-payment')} className="text-[#1D9E75] hover:underline">Receive a payment</button> to generate one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={TH}>Student</th>
                  <th className={TH}>Receipt No.</th>
                  <th className={TH}>Amount</th>
                  <th className={TH}>Method</th>
                  <th className={TH}>Date</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map(r => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className={TD_W}>{r.studentName || '—'}</td>
                    <td className={TD}>{r.receiptNumber || r.id.slice(0, 8).toUpperCase()}</td>
                    <td className={TD} style={{ color: TEAL }}>{fmt(r.amount || 0)}</td>
                    <td className={TD}>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold font-montserrat ${
                        r.paymentMethod === 'cash'   ? 'bg-purple-500/20 text-purple-300' :
                        r.paymentMethod === 'bank'   ? 'bg-blue-500/20 text-blue-300'    :
                        'bg-teal-500/20 text-teal-300'
                      }`}>
                        {r.paymentMethod || 'cash'}
                      </span>
                    </td>
                    <td className={TD}>{r.issuedAt?.toDate ? r.issuedAt.toDate().toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Arrears Students */}
      <div className={CARD}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={HEAD}>Top Arrears Students</h3>
          <button
            onClick={() => navigate('/bursar/arrears')}
            className="text-xs font-montserrat px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: '#0F6E56', color: '#1D9E75' }}
          >
            View all
          </button>
        </div>
        {topArrears.length === 0 ? (
          <p className="text-sm text-gray-500 font-montserrat py-6 text-center">
            {loading ? 'Loading…' : 'No arrears on record.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={TH}>Name</th>
                  <th className={TH}>Class</th>
                  <th className={TH}>Amount Owed</th>
                </tr>
              </thead>
              <tbody>
                {topArrears.map((s) => {
                  const amount = Number(s.balance || 0)
                  return (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className={TD_W}>{s.studentName || '—'}</td>
                      <td className={TD}>{s.class || '—'}</td>
                      <td className={TD}>
                        <span className={`px-2 py-1 rounded-full text-xs font-montserrat font-semibold border ${
                          amount > 500
                            ? 'bg-red-500/15 text-red-400 border-red-500/30'
                            : amount > 200
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-white/5 text-gray-400 border-white/10'
                        }`}>
                          {fmt(amount)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      </div>{/* end grid */}

    </div>
  )
}
