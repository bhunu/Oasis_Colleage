import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getCountFromServer, getDocs, getDoc, updateDoc, setDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import StatCard from '../components/StatCard'
import {
  MdPeople as IconUsers,
  MdDirectionsWalk as IconDayScholar,
  MdHotel as IconBoarder,
} from 'react-icons/md'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const CHART_GRID   = { stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '3 3' }
const AXIS_TICK    = { fill: '#6b7280', fontSize: 11 }
const AXIS_LINE    = { stroke: 'rgba(255,255,255,0.08)' }
const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: 'var(--color-navy-800-hex)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 12 },
  labelStyle:   { color: 'var(--color-primary-hex)' },
  cursor:       { fill: 'rgba(255,255,255,0.04)' },
}

const LEVEL_ORDER = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Lower 6', 'Upper 6']

function classToLevel(cls = '') {
  const c = cls.trim()
  if (/form\s*1/i.test(c) || /^1[a-z]$/i.test(c)) return 'Form 1'
  if (/form\s*2/i.test(c) || /^2[a-z]$/i.test(c)) return 'Form 2'
  if (/form\s*3/i.test(c) || /^3[a-z]$/i.test(c)) return 'Form 3'
  if (/form\s*4/i.test(c) || /^4[a-z]$/i.test(c)) return 'Form 4'
  if (/lower\s*6|l\.?6/i.test(c) || /^l6/i.test(c)) return 'Lower 6'
  if (/upper\s*6|u\.?6/i.test(c) || /^u6/i.test(c)) return 'Upper 6'
  return null
}

function isMale(g = '') {
  return /^(m|male|boy|boys)$/i.test(String(g).trim())
}


const CARD_CLASS = 'bg-navy-800 border border-white/10 rounded-xl p-6'
const HEADING    = 'font-semibold text-white font-playfair'
const TH_CLASS   = 'text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat'
const TD_CLASS   = 'py-3 px-4 text-sm text-gray-300 font-montserrat'
const TD_NAME    = 'py-3 px-4 text-sm text-white font-montserrat'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats]               = useState({ totalStudents: null, dayScholars: null, boarders: null })
  const [recentEnrolments, setRecent]   = useState([])
  const [demographics, setDemographics] = useState([])
  const [boardingDemo, setBoardingDemo] = useState([])
  const [batchBanner, setBatchBanner]   = useState(null)
  const [chartLoaded, setChartLoaded]   = useState(false)

  /* ── Auto-batch: set exitType on Term 3 closing day ── */
  useEffect(() => {
    async function runBatch() {
      try {
        const today       = new Date()
        const currentYear = today.getFullYear()

        const [batchSnap, portalSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'batchFlags')),
          getDoc(doc(db, 'settings', 'portalConfig')),
        ])

        if (batchSnap.exists() && batchSnap.data()?.exitTypeBatchYear === currentYear) return

        if (!portalSnap.exists()) return
        const { currentTerm: termId } = portalSnap.data()
        if (!termId) return

        const termSnap = await getDoc(doc(db, 'terms', termId))
        if (!termSnap.exists()) return
        const { termNumber, closingDate } = termSnap.data()
        if (!termNumber || !closingDate) return

        const closing = closingDate.toDate()
        if (termNumber !== 3 || today < closing) return

        let oLevelCount = 0
        let aLevelCount = 0

        const form4Classes  = ['4A', '4B', '4C', 'Form 4']
        const upper6Classes = ['Upper 6 Arts', 'Upper 6 Sciences', 'Upper 6 Commercials']

        const [form4Snap, upper6Snap] = await Promise.all([
          getDocs(query(collection(db, 'students'), where('class', 'in', form4Classes), where('status', '==', 'Active'))),
          getDocs(query(collection(db, 'students'), where('class', 'in', upper6Classes), where('status', '==', 'Active'))),
        ])

        for (const d of form4Snap.docs) {
          await updateDoc(d.ref, { exitType: 'OLevelCompletion', status: 'Completing' })
          oLevelCount++
        }
        for (const d of upper6Snap.docs) {
          await updateDoc(d.ref, { exitType: 'ALevelCompletion', status: 'Completing' })
          aLevelCount++
        }

        await setDoc(doc(db, 'settings', 'batchFlags'), {
          exitTypeBatchYear: currentYear,
          lastBatchRanAt:    serverTimestamp(),
        }, { merge: true })

        if (oLevelCount > 0 || aLevelCount > 0) {
          setBatchBanner({
            oLevelCount, aLevelCount,
            message: `Exit status updated: ${oLevelCount} O Level student(s) and ${aLevelCount} A Level student(s) have been marked as Completing. They will need clearance letters before their results can be released.`,
          })
        }
      } catch (err) {
        console.error('Batch exit type error:', err)
      }
    }
    runBatch()
  }, [])

  useEffect(() => {
    Promise.all([
      getCountFromServer(query(collection(db, 'students'), where('boardingStatus', '==', 'day'))),
      getCountFromServer(query(collection(db, 'students'), where('boardingStatus', '==', 'boarder'))),
      getDocs(query(collection(db, 'students'), orderBy('createdAt', 'desc'))),
    ])
      .then(([day, boarder, allSnap]) => {
        const allStudents = allSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setStats({
          totalStudents: allStudents.length,
          dayScholars:   day.data().count,
          boarders:      boarder.data().count,
        })
        setRecent(allStudents.slice(0, 5))

        const map = {}
        LEVEL_ORDER.forEach(l => { map[l] = { level: l, boys: 0, girls: 0 } })
        allStudents.forEach(s => {
          const level = classToLevel(s.class)
          if (!level) return
          if (isMale(s.gender)) map[level].boys++
          else map[level].girls++
        })
        setDemographics(LEVEL_ORDER.map(l => map[l]).filter(d => d.boys + d.girls > 0))

        const bd = { boarders: { boys: 0, girls: 0 }, day: { boys: 0, girls: 0 } }
        allStudents.forEach(s => {
          const bucket = String(s.boardingStatus || 'day').trim().toLowerCase() === 'boarder' ? 'boarders' : 'day'
          if (isMale(s.gender)) bd[bucket].boys++
          else bd[bucket].girls++
        })
        setBoardingDemo([
          { category: 'Boarders',     boys: bd.boarders.boys, girls: bd.boarders.girls },
          { category: 'Day Scholars', boys: bd.day.boys,      girls: bd.day.girls      },
        ])
        setChartLoaded(true)
      })
      .catch(() => { setStats({ totalStudents: '—', dayScholars: '—', boarders: '—' }); setChartLoaded(true) })
  }, [])

  return (
    <div className="space-y-6">

      {/* Batch exit-type summary banner */}
      {batchBanner && (
        <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl px-5 py-4">
          <div className="flex-1">
            <p className="font-montserrat text-xs font-semibold text-blue-300 mb-0.5 uppercase tracking-wider">
              System: Exit Status Updated
            </p>
            <p className="font-montserrat text-xs text-gray-300 leading-relaxed">{batchBanner.message}</p>
          </div>
          <button onClick={() => setBatchBanner(null)} className="text-gray-500 hover:text-white transition mt-0.5">
            ✕
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Students" value={stats.totalStudents}        icon={IconUsers}       color="blue"   />
        <StatCard label="Day Scholars"   value={stats.dayScholars}          icon={IconDayScholar}  color="gold"   />
        <StatCard label="Boarder Students" value={stats.boarders} icon={IconBoarder} color="purple" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Enrol Student',              sub: 'Add new enrollment',       path: '/enrol' },
          { label: 'Student Reg Forms',          sub: 'Generate registration forms', path: '/access-pass' },
        ].map(({ label, sub, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="bg-navy-800 border border-white/10 hover:border-gold/40 hover:bg-gold/5 rounded-xl p-4 text-left transition-all group"
          >
            <p className="font-semibold text-white font-montserrat text-sm group-hover:text-gold transition-colors">{label}</p>
            <p className="text-xs text-gray-500 font-montserrat mt-0.5">{sub}</p>
          </button>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Demographics */}
        <div className={CARD_CLASS}>
          <div className="flex justify-between items-center mb-1">
            <div>
              <h3 className={HEADING}>Student Demographics</h3>
              <p className="text-[11px] text-gray-500 font-montserrat mt-0.5">Enrolled students by level & gender</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-montserrat">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#3b82f6]" />Boys
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-montserrat">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#f43f5e]" />Girls
              </span>
            </div>
          </div>
          {!chartLoaded ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold" />
            </div>
          ) : demographics.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500 font-montserrat text-sm">No student data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={demographics} layout="vertical" barCategoryGap="30%" barGap={3}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis type="number" domain={[0, 40]} ticks={[0, 10, 20, 30, 40]} tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
                <YAxis dataKey="level" type="category" width={62} tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(value, name) => [value, name === 'boys' ? 'Boys' : 'Girls']}
                />
                <Bar dataKey="boys"  name="Boys"  fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="girls" name="Girls" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Boarding demographics */}
        <div className={CARD_CLASS}>
          <div className="flex justify-between items-center mb-1">
            <div>
              <h3 className={HEADING}>Boarding Demographics</h3>
              <p className="text-[11px] text-gray-500 font-montserrat mt-0.5">Boys & girls by boarding status</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-montserrat">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#3b82f6]" />Boys
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-montserrat">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#f43f5e]" />Girls
              </span>
            </div>
          </div>
          {!chartLoaded ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold" />
            </div>
          ) : boardingDemo.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500 font-montserrat text-sm">No student data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={boardingDemo} barCategoryGap="40%" barGap={4}>
                  <CartesianGrid {...CHART_GRID} />
                  <XAxis dataKey="category" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
                  <YAxis domain={[0, 40]} ticks={[0, 10, 20, 30, 40]} tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(value, name) => [value, name === 'boys' ? 'Boys' : 'Girls']}
                  />
                  <Bar dataKey="boys"  name="Boys"  fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="girls" name="Girls" fill="#f43f5e" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {boardingDemo.map(d => (
                  <div key={d.category} className="bg-white/5 rounded-lg px-4 py-3">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-2">{d.category}</p>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xl font-bold text-[#3b82f6] font-playfair">{d.boys}</p>
                        <p className="text-[10px] text-gray-500 font-montserrat">Boys</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#f43f5e] font-playfair">{d.girls}</p>
                        <p className="text-[10px] text-gray-500 font-montserrat">Girls</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tables row */}
      <div className={CARD_CLASS}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={HEADING}>Recent Enrolments</h3>
          <button onClick={() => navigate('/enrol')} className="text-xs text-gold hover:text-yellow-300 font-montserrat transition-colors">
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
              {recentEnrolments.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 px-4"><div className="h-3.5 w-28 bg-white/8 rounded animate-pulse" /></td>
                    <td className="py-3 px-4"><div className="h-3.5 w-16 bg-white/8 rounded animate-pulse" /></td>
                    <td className="py-3 px-4"><div className="h-3.5 w-24 bg-white/8 rounded animate-pulse" /></td>
                    <td className="py-3 px-4"><div className="h-3.5 w-20 bg-white/8 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : (
                recentEnrolments.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className={TD_NAME}>{s.fullName}</td>
                    <td className={TD_CLASS}>{s.class}</td>
                    <td className={TD_CLASS}><span className="font-mono text-xs">{s.reg_number || '—'}</span></td>
                    <td className={TD_CLASS}>{s.enrolmentDate || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
