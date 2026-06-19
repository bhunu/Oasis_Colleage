import { useState, useEffect, useMemo } from 'react'
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
import { useTermDates, fmtTermDate, getDaysUntilTermEnd, isTermEnded } from '../../hooks/useTermDates'

/* ── chart theme ── */
const GRID    = { stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '3 3' }
const TICK    = { fill: '#6b7280', fontSize: 11 }
const AXLINE  = { stroke: 'rgba(255,255,255,0.08)' }
const TIP     = {
  contentStyle: { backgroundColor: 'var(--color-navy-800-hex)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 12 },
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

const EXP_PIE_CATS = ['Salaries', 'Utilities', 'Maintenance', 'Supplies & Stationery', 'Transport', 'Events', 'Other']
const PIE_COLORS   = [BLUE, GOLD, TEAL, PURP, PINK, RED, '#9ca3af']

const CARD  = 'bg-navy-800 border border-white/10 rounded-xl p-6'
const HEAD  = 'font-semibold text-white font-playfair'
const TH    = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat'
const TD    = 'py-3 px-4 text-sm text-gray-300 font-montserrat'
const TD_W  = 'py-3 px-4 text-sm text-white font-montserrat'

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-navy-800 border border-white/10 rounded-xl p-5">
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
  const { termStartDate, termEndDate } = useTermDates()
  const [stats, setStats] = useState({ collected: 0, arrears: 0, expenses: 0, surplus: 0, feesPaidFull: 0, creditTotal: 0 })
  const [expenseByCategory, setExpenseByCategory] = useState({})
  const [expByTerm, setExpByTerm] = useState({})
  const [incByTerm, setIncByTerm] = useState({})
  const [receipts, setReceipts] = useState([])
  const [topArrears, setTopArrears] = useState([])
  const [methodData, setMethodData] = useState([])
  const [collectionChartData, setCollectionChartData] = useState([])
  const [loading, setLoading] = useState(true)

  /* income statement — live from Firestore */
  const incomeTotal = stats.collected
  const netSurplus  = incomeTotal - stats.expenses
  const EXP_CATEGORIES = ['Salaries', 'Utilities', 'Maintenance', 'Supplies & Stationery', 'Transport', 'Events', 'Other']

  /* balance sheet — live from Firestore */
  const assets = {
    cash:        stats.collected,               // total fees received
    receivables: stats.arrears,                 // outstanding student fees
    total:       stats.collected + stats.arrears,
  }
  const liabilities = {
    payables: stats.expenses,                   // recorded expenses
    deferred: stats.creditTotal,                // student overpayments (owed back)
    total:    stats.expenses + stats.creditTotal,
  }
  const netPosition = assets.total - liabilities.total

  useEffect(() => {
    let pending = 3
    const done = () => { if (--pending === 0) setLoading(false) }

    /* fee accounts — stats + top arrears */
    getDocs(collection(db, 'feeAccounts'))
      .then(snap => {
        let collected = 0, arrears = 0, creditTotal = 0, feesPaidFull = 0
        const arrearsRows = []
        snap.forEach(d => {
          const data = d.data()
          collected += Number(data.totalPaid || 0)
          if (data.balanceType === 'debit') {
            arrears += Number(data.balance || 0)
            arrearsRows.push({ id: d.id, ...data })
          }
          if (data.balanceType === 'credit') creditTotal += Number(data.balance || 0)
          if (Number(data.termFees || 0) > 0 && Number(data.totalPaid || 0) >= Number(data.termFees || 0)) feesPaidFull++
        })
        arrearsRows.sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
        setStats(prev => ({ ...prev, collected, arrears, creditTotal, feesPaidFull, surplus: collected - prev.expenses }))
        setTopArrears(arrearsRows.slice(0, 5))
      })
      .catch(() => {})
      .finally(done)

    /* expenses — total + grouped by category + grouped by term */
    getDocs(collection(db, 'expenses'))
      .then(snap => {
        let expTotal = 0
        const byCategory = {}
        const byTerm = {}
        snap.forEach(d => {
          const { category = 'Other', amount = 0, term: expTerm = '' } = d.data()
          expTotal += Number(amount)
          byCategory[category] = (byCategory[category] || 0) + Number(amount)
          if (expTerm) byTerm[expTerm] = (byTerm[expTerm] || 0) + Number(amount)
        })
        setExpenseByCategory(byCategory)
        setExpByTerm(byTerm)
        setStats(prev => ({ ...prev, expenses: expTotal, surplus: prev.collected - expTotal }))
      })
      .catch(() => {})
      .finally(done)

    /* receipts — build method chart + collection chart + recent table */
    getDocs(collection(db, 'receipts'))
      .then(snap => {
        const all = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.issuedAt?.seconds ?? 0) - (a.issuedAt?.seconds ?? 0))

        setReceipts(all.slice(0, 5))

        const MONTH_ORDER = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        const monthMap = {}
        all.forEach(r => {
          const ts = r.issuedAt?.toDate ? r.issuedAt.toDate() : (r.issuedAt ? new Date(r.issuedAt) : null)
          if (!ts) return
          const month = ts.toLocaleString('default', { month: 'short' })
          if (!monthMap[month]) monthMap[month] = { month, collected: 0, cash: 0, bank: 0, mobile: 0 }
          const amt = Number(r.amount || 0)
          monthMap[month].collected += amt
          const m = r.paymentMethod || 'cash'
          if (m === 'bank')        monthMap[month].bank   += amt
          else if (m === 'mobile') monthMap[month].mobile += amt
          else                     monthMap[month].cash   += amt
        })
        const sorted = Object.values(monthMap)
          .sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month))
        setMethodData(sorted)
        setCollectionChartData(sorted)

        const termMap = {}
        all.forEach(r => {
          const t = r.term || ''
          if (t) termMap[t] = (termMap[t] || 0) + Number(r.amount || 0)
        })
        setIncByTerm(termMap)
      })
      .catch(() => {})
      .finally(done)
  }, [])

  const fmt = v => `$${Number(v).toLocaleString()}`

  const expensePieData = useMemo(() =>
    EXP_PIE_CATS
      .map((name, i) => ({ name, value: expenseByCategory[name] || 0, color: PIE_COLORS[i] }))
      .filter(d => d.value > 0),
    [expenseByCategory]
  )

  const liveTrendData = useMemo(() => {
    const terms = new Set([...Object.keys(incByTerm), ...Object.keys(expByTerm)])
    return [...terms].filter(Boolean).sort().map(t => ({
      term:     t,
      income:   incByTerm[t]  || 0,
      expenses: expByTerm[t]  || 0,
      surplus:  (incByTerm[t] || 0) - (expByTerm[t] || 0),
    }))
  }, [incByTerm, expByTerm])

  const QUICK = [
    { label: 'Receive payment',  sub: 'Record incoming fees',  path: '/bursar/receive-payment' },
    { label: 'Issue receipt',    sub: 'Print student receipt',  path: '/bursar/issue-receipt' },
    { label: 'Update Fees',      sub: 'Manage fee accounts',   path: '/fees' },
    { label: 'Record expense',   sub: 'Log school expense',    path: '/bursar/record-expense' },
    { label: 'Income statement', sub: 'View P&L statement',    path: '/bursar/income-statement' },
    { label: 'Balance sheet',    sub: 'Assets & liabilities',  path: '/bursar/balance-sheet' },
  ]

  const daysLeft  = getDaysUntilTermEnd(termEndDate)
  const terminated = isTermEnded(termEndDate)

  return (
    <div className="space-y-6">

      {/* ── Term countdown banner ── */}
      {termEndDate && (
        <div className={`flex items-center justify-between gap-4 flex-wrap px-5 py-3.5 rounded-xl border ${
          terminated
            ? 'bg-red-500/10 border-red-500/20'
            : daysLeft !== null && daysLeft <= 7
              ? 'bg-amber-500/10 border-amber-500/20'
              : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <div>
              <p className="font-montserrat text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">Current Term Period</p>
              <p className="font-montserrat text-sm font-semibold text-white">
                {termStartDate ? fmtTermDate(termStartDate) : '—'} → {fmtTermDate(termEndDate)}
              </p>
            </div>
          </div>
          <div className="text-right">
            {terminated ? (
              <p className="font-montserrat text-sm font-bold text-red-400">
                Term ended {Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? 's' : ''} ago
              </p>
            ) : daysLeft === 0 ? (
              <p className="font-montserrat text-sm font-bold text-amber-400">Term ends today</p>
            ) : (
              <p className={`font-montserrat text-sm font-bold ${daysLeft <= 7 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} until term end
              </p>
            )}
            {terminated && (
              <p className="font-montserrat text-[10px] text-red-300 mt-0.5">Outstanding arrears are now overdue</p>
            )}
            {!terminated && daysLeft !== null && daysLeft <= 7 && (
              <p className="font-montserrat text-[10px] text-amber-300 mt-0.5">Collect outstanding fees urgently</p>
            )}
          </div>
        </div>
      )}

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
            className="bg-navy-800 border border-white/10 hover:border-[#0F6E56]/40 hover:bg-[#0F6E56]/5 rounded-xl p-4 text-left transition-all group"
          >
            <p className="font-semibold text-white font-montserrat text-xs group-hover:text-[#1D9E75] transition-colors">{label}</p>
            <p className="text-[10px] text-gray-500 font-montserrat mt-0.5">{sub}</p>
          </button>
        ))}
      </div>

      {/* ── Chart row 1: collections + expense breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1 – Fee collections by month (live) */}
        <div className={CARD}>
          <h3 className={`${HEAD} mb-4`}>Fee Collections by Month</h3>
          {collectionChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[260px]">
              <p className="text-sm text-gray-500 font-montserrat">{loading ? 'Loading…' : 'No payment records yet.'}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={collectionChartData.map((d, i) => ({
                ...d,
                arrears: i === collectionChartData.length - 1 ? stats.arrears : 0,
              }))}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="month" tick={TICK} axisLine={AXLINE} tickLine={false} />
                <YAxis tick={TICK} axisLine={AXLINE} tickLine={false} />
                <Tooltip {...TIP} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11, fontFamily: 'Montserrat' }} />
                <Bar dataKey="collected" name="Collected" fill={TEAL} radius={[4,4,0,0]} />
                <Bar dataKey="arrears"   name="Arrears"   fill={RED}  radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 2 – Expense breakdown (live from Firestore) */}
        <div className={CARD}>
          <h3 className={`${HEAD} mb-4`}>Expense Breakdown</h3>
          {expensePieData.length === 0 ? (
            <div className="flex items-center justify-center h-[260px]">
              <p className="text-sm text-gray-500 font-montserrat">{loading ? 'Loading…' : 'No expenses recorded yet.'}</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                    {expensePieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip {...TIP} formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {expensePieData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-400 font-montserrat">{item.name}: <span className="text-white">{fmt(item.value)}</span></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Chart row 2: income vs expense trend + payment methods ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 3 – Income vs expenses trend (live from Firestore) */}
        <div className={CARD}>
          <h3 className={`${HEAD} mb-4`}>Income vs Expenses Trend</h3>
          {liveTrendData.length === 0 ? (
            <div className="flex items-center justify-center h-[260px]">
              <p className="text-sm text-gray-500 font-montserrat">{loading ? 'Loading…' : 'No multi-term data yet.'}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={liveTrendData}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="term" tick={TICK} axisLine={AXLINE} tickLine={false} />
                <YAxis tick={TICK} axisLine={AXLINE} tickLine={false} />
                <Tooltip {...TIP} formatter={v => fmt(v)} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11, fontFamily: 'Montserrat' }} />
                <Line type="monotone" dataKey="income"   name="Income"   stroke={TEAL}  strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke={RED}   strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="surplus"  name="Surplus"  stroke={NAVY2} strokeWidth={2} strokeDasharray="3 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 4 – Collections by payment method (live from receipts) */}
        <div className={CARD}>
          <h3 className={`${HEAD} mb-4`}>Collections by Payment Method</h3>
          {methodData.length === 0 ? (
            <div className="flex items-center justify-center h-[260px]">
              <p className="text-sm text-gray-500 font-montserrat">{loading ? 'Loading…' : 'No payment records yet.'}</p>
            </div>
          ) : (
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
          )}
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
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Tuition fees collected</span>
              <span className="text-white">{loading ? '…' : fmt(incomeTotal)}</span>
            </div>
            <div className="flex justify-between py-1.5 font-semibold text-white border-b border-[#0F6E56]/40">
              <span>Total Income</span>
              <span style={{ color: TEAL }}>{loading ? '…' : fmt(incomeTotal)}</span>
            </div>

            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest pt-3">Expenses</p>
            {EXP_CATEGORIES.map(cat => {
              const val = expenseByCategory[cat] || 0
              if (!val) return null
              return (
                <div key={cat} className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">{cat}</span>
                  <span className="text-white">{fmt(val)}</span>
                </div>
              )
            })}
            {!loading && stats.expenses === 0 && (
              <p className="text-gray-600 text-[10px] py-2 font-montserrat">No expenses recorded yet.</p>
            )}
            <div className="flex justify-between py-1.5 font-semibold text-white border-b border-red-500/30">
              <span>Total Expenses</span>
              <span className="text-red-400">{loading ? '…' : fmt(stats.expenses)}</span>
            </div>

            <div className="flex justify-between py-2.5 font-bold text-base rounded-lg px-2 mt-2"
              style={{ backgroundColor: netSurplus >= 0 ? `${TEAL}18` : '#e24b4a18' }}>
              <span className="text-white">Net Surplus</span>
              <span style={{ color: netSurplus >= 0 ? TEAL : RED }}>{loading ? '…' : fmt(netSurplus)}</span>
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
              ['Cash in hand',           assets.cash],
              ['Fees receivable (owed)', assets.receivables],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">{k}</span>
                <span className="text-white">{loading ? '…' : fmt(v)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-semibold text-white border-b border-[#0F6E56]/40">
              <span>Total Assets</span><span style={{ color: TEAL }}>{loading ? '…' : fmt(assets.total)}</span>
            </div>

            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest pt-3">Liabilities</p>
            {[
              ['Total expenses',    liabilities.payables],
              ['Deferred (credit)', liabilities.deferred],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">{k}</span>
                <span className="text-white">{loading ? '…' : fmt(v)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-semibold text-white border-b border-red-500/30">
              <span>Total Liabilities</span><span className="text-red-400">{loading ? '…' : fmt(liabilities.total)}</span>
            </div>

            <div className="flex justify-between py-2.5 font-bold text-base rounded-lg px-2 mt-2"
              style={{ backgroundColor: netPosition >= 0 ? `${NAVY2}18` : '#e24b4a18' }}>
              <span className="text-white">Net Position</span>
              <span style={{ color: netPosition >= 0 ? NAVY2 : RED }}>{loading ? '…' : fmt(netPosition)}</span>
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
