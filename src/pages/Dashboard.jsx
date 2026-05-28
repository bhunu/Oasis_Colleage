import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase/config'
import StatCard from '../components/StatCard'
import {
  MdPeople as IconUsers,
  MdCheckCircle as IconCheckCircle,
  MdWarning as IconAlertTriangle,
  MdDescription as IconFileText,
} from 'react-icons/md'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'

const CHART_GRID   = { stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '3 3' }
const AXIS_TICK    = { fill: '#6b7280', fontSize: 11 }
const AXIS_LINE    = { stroke: 'rgba(255,255,255,0.08)' }
const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#0D1C35', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 12 },
  labelStyle:   { color: '#C9A84C' },
  cursor:       { fill: 'rgba(255,255,255,0.04)' },
}

const mockChartData = {
  feesByClass: [
    { name: 'Form 1A', arrears: 2400, paid: 2400 },
    { name: 'Form 1B', arrears: 1398, paid: 2210 },
    { name: 'Form 2A', arrears: 9800, paid: 2290 },
    { name: 'Form 2B', arrears: 3908, paid: 2000 },
    { name: 'Form 3A', arrears: 4800, paid: 2181 },
    { name: 'Form 3B', arrears: 3800, paid: 2500 },
  ],
  paymentStatus: [
    { name: 'Paid in full', value: 45, color: '#10b981' },
    { name: 'In arrears',   value: 35, color: '#ef4444' },
    { name: 'Partial',      value: 20, color: '#C9A84C' },
  ],
  trendData: [
    { term: 'Term 1', '2023': 12000, '2024': 15000, '2025': 8000 },
    { term: 'Term 2', '2023': 11000, '2024': 13000, '2025': 9500 },
    { term: 'Term 3', '2023': 10000, '2024': 12000, '2025': 0 },
  ],
}

const mockRecentEnrolments = [
  { id: 'OC-2025-0001', name: 'Tatenda Ncube',    class: 'Form 1A', date: '2025-05-28' },
  { id: 'OC-2025-0002', name: 'Chipo Mukwaya',    class: 'Form 2B', date: '2025-05-27' },
  { id: 'OC-2025-0003', name: 'Tinashe Banda',    class: 'Form 3A', date: '2025-05-26' },
  { id: 'OC-2025-0004', name: 'Nomsa Mwangi',     class: 'Form 1B', date: '2025-05-25' },
  { id: 'OC-2025-0005', name: 'Bongani Dlamini',  class: 'Form 4A', date: '2025-05-24' },
]

const mockArrearStudents = [
  { id: 'OC-2024-0145', name: 'Samuel Mwale',     class: 'Form 2A', amount: 850 },
  { id: 'OC-2024-0128', name: 'Grace Moyo',        class: 'Form 3B', amount: 620 },
  { id: 'OC-2024-0156', name: 'David Chikombo',    class: 'Form 1A', amount: 400 },
  { id: 'OC-2024-0142', name: 'Blessing Ncube',    class: 'Form 2B', amount: 280 },
  { id: 'OC-2024-0189', name: 'Joyce Banda',       class: 'Form 3A', amount: 120 },
]

const CARD_CLASS = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'
const HEADING    = 'font-semibold text-white font-playfair'
const TH_CLASS   = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat'
const TD_CLASS   = 'py-3 px-4 text-sm text-gray-300 font-montserrat'
const TD_NAME    = 'py-3 px-4 text-sm text-white font-montserrat'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalStudents: 285, feesPaidFull: 198, feesArrears: 87, marksUploaded: 92 })

  useEffect(() => {
    setStats({ totalStudents: 285, feesPaidFull: 198, feesArrears: 87, marksUploaded: 92 })
  }, [])

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Students"   value={stats.totalStudents}                       icon={IconUsers}         color="blue"   />
        <StatCard label="Fees Paid in Full" value={stats.feesPaidFull}                       icon={IconCheckCircle}   color="green"  />
        <StatCard label="Fees in Arrears"   value={`$${(87 * 450).toLocaleString()}`}        icon={IconAlertTriangle} color="red"    />
        <StatCard label="Marks Uploaded"    value={`${stats.marksUploaded}%`}                icon={IconFileText}      color="purple" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Enrol Student', sub: 'Add new enrollment',  path: '/enrol' },
          { label: 'Update Fees',   sub: 'Manage fee accounts', path: '/fees' },
        ].map(({ label, sub, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="bg-[#0D1C35] border border-white/10 hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/5 rounded-xl p-4 text-left transition-all group"
          >
            <p className="font-semibold text-white font-montserrat text-sm group-hover:text-[#C9A84C] transition-colors">{label}</p>
            <p className="text-xs text-gray-500 font-montserrat mt-0.5">{sub}</p>
          </button>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Fees by class */}
        <div className={CARD_CLASS}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={HEADING}>Fees Arrears by Class</h3>
            <select className="text-xs bg-white/5 border border-white/10 text-gray-400 rounded-lg px-3 py-1.5 font-montserrat focus:outline-none focus:border-[#C9A84C]/40">
              <option>Term 2 2025</option>
              <option>Term 1 2025</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockChartData.feesByClass} layout="vertical">
              <CartesianGrid {...CHART_GRID} />
              <XAxis type="number" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
              <YAxis dataKey="name" type="category" width={75} tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11, fontFamily: 'Montserrat' }} />
              <Bar dataKey="arrears" fill="#ef4444" radius={[0, 4, 4, 0]} />
              <Bar dataKey="paid"    fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment status */}
        <div className={CARD_CLASS}>
          <h3 className={`${HEADING} mb-4`}>Payment Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={mockChartData.paymentStatus} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value">
                {mockChartData.paymentStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-2">
            {mockChartData.paymentStatus.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-400 font-montserrat">{item.name}: <span className="text-white">{item.value}%</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className={CARD_CLASS}>
        <h3 className={`${HEADING} mb-4`}>Fees Arrears Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={mockChartData.trendData}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="term" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11, fontFamily: 'Montserrat' }} />
            <Line type="monotone" dataKey="2023" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="2024" stroke="#3b82f6" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="2025" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent enrolments */}
        <div className={CARD_CLASS}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={HEADING}>Recent Enrolments</h3>
            <button onClick={() => navigate('/enrol')} className="text-xs text-[#C9A84C] hover:text-yellow-300 font-montserrat transition-colors">
              Enrol new
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={TH_CLASS}>Name</th>
                  <th className={TH_CLASS}>Class</th>
                  <th className={TH_CLASS}>Reg ID</th>
                  <th className={TH_CLASS}>Date</th>
                </tr>
              </thead>
              <tbody>
                {mockRecentEnrolments.map((s, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className={TD_NAME}>{s.name}</td>
                    <td className={TD_CLASS}>{s.class}</td>
                    <td className={TD_CLASS}>{s.id}</td>
                    <td className={TD_CLASS}>{s.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top arrears */}
        <div className={CARD_CLASS}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={HEADING}>Top Arrears Students</h3>
            <button className="text-xs text-[#C9A84C] hover:text-yellow-300 font-montserrat transition-colors">
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={TH_CLASS}>Name</th>
                  <th className={TH_CLASS}>Class</th>
                  <th className={TH_CLASS}>Amount Owed</th>
                </tr>
              </thead>
              <tbody>
                {mockArrearStudents.map((s, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className={TD_NAME}>{s.name}</td>
                    <td className={TD_CLASS}>{s.class}</td>
                    <td className={TD_CLASS}>
                      <span className={`px-2 py-1 rounded-full text-xs font-montserrat font-semibold border ${
                        s.amount > 500
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : s.amount > 200
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-white/5 text-gray-400 border-white/10'
                      }`}>
                        ${s.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
