import { useState, useEffect } from 'react'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { getCurrentTerm } from '../../utils/termHelpers'
import sc, { SCHOOL_ID } from '../../utils/schoolConfig'
import { MdEmojiEvents, MdDownload, MdPrint } from 'react-icons/md'
import { FaTrophy } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { useTermDates, fmtTermDate } from '../../hooks/useTermDates'


const DEFAULT_O_GRADES = [
  { grade: 'A', min: 75, max: 100 },
  { grade: 'B', min: 65, max: 74 },
  { grade: 'C', min: 50, max: 64 },
  { grade: 'D', min: 40, max: 49 },
  { grade: 'U', min: 0,  max: 39 },
]

const DEFAULT_A_GRADES = [
  { grade: 'A', min: 80, max: 100, points: 5 },
  { grade: 'B', min: 70, max: 79,  points: 4 },
  { grade: 'C', min: 60, max: 69,  points: 3 },
  { grade: 'D', min: 50, max: 59,  points: 2 },
  { grade: 'U', min: 0,  max: 49,  points: 0 },
]

const { number: CURR_NUM, year: CURR_YEAR } = getCurrentTerm()

const GRADE_COLORS = {
  A: 'text-emerald-400', B: 'text-emerald-400',
  C: 'text-gold',  D: 'text-orange-400',
  U: 'text-red-400',    '—': 'text-gray-500',
}

const MEDAL_CLS = [
  'bg-gold/20 text-gold border-gold/40',
  'bg-gray-400/15 text-gray-300 border-gray-400/30',
  'bg-orange-700/15 text-orange-400 border-orange-700/30',
]

function toTermId(t)  { return t.toLowerCase().replace(/\s+/g, '-') }
function toClassId(c) { return c.toLowerCase().replace(/\s+/g, '-') }
function r1(n)        { return Math.round(n * 10) / 10 }

function getFormNumber(className) {
  if (!className) return null
  const m = String(className).trim().match(/^(?:Form\s*)?([1-4])/i)
  return m ? m[1] : null
}

function isALevelClass(className) {
  return /^(Lower|Upper)\s*6/i.test(String(className || '').trim())
}

function computeGrade(avg, gradeTable) {
  if (avg === null || avg === undefined) return '—'
  const n = Math.round(Number(avg))
  const sorted = [...gradeTable].sort((a, b) => b.min - a.min)
  return sorted.find(g => n >= g.min)?.grade || '—'
}

function getPoints(mark, gradeTable) {
  const n = Math.round(Number(mark))
  const sorted = [...gradeTable].sort((a, b) => b.min - a.min)
  return sorted.find(g => n >= g.min)?.points ?? 0
}

function generateTermOptions() {
  const opts = []
  for (let t = CURR_NUM; t >= 1; t--) opts.push(`Term ${t} ${CURR_YEAR}`)
  for (let t = 3; t >= 1; t--) opts.push(`Term ${t} ${CURR_YEAR - 1}`)
  return opts
}

const TERMS = generateTermOptions()

const SEL = 'w-full bg-white/5 border border-white/10 focus:border-gold/40 focus:outline-none rounded-xl px-4 py-2.5 text-white font-montserrat text-sm'

export default function PrizeGivingPage() {
  const [tab,           setTab]          = useState('olevel')
  const [selectedTerm,  setSelectedTerm] = useState(`Term ${CURR_NUM} ${CURR_YEAR}`)
  const [selectedForm,  setSelectedForm] = useState('1')
  const [aFilter,       setAFilter]      = useState('all')
  const [aClasses,      setAClasses]     = useState([])
  const [topN,          setTopN]         = useState(10)
  const [useCustom,     setUseCustom]    = useState(false)
  const [customN,       setCustomN]      = useState('')
  const [loading,       setLoading]      = useState(false)
  const [loaded,        setLoaded]       = useState(false)
  const [rankings,      setRankings]     = useState([])
  const [champions,     setChampions]    = useState([])
  const [gradeSettings, setGradeSettings] = useState(null)
  const { termStartDate, termEndDate } = useTermDates()

  useEffect(() => {
    getDoc(doc(db, 'config', 'gradeSettings'))
      .then(s => { if (s.exists()) setGradeSettings(s.data()) })
      .catch(() => {})

    getDocs(collection(db, 'students'))
      .then(snap => {
        const cls = [...new Set(snap.docs.map(d => d.data().class).filter(Boolean))].sort()
        setAClasses(cls.filter(c => isALevelClass(c)))
      })
      .catch(() => {})
  }, [])

  const isALevel   = tab === 'alevel'
  const gradeTable = isALevel
    ? (gradeSettings?.aLevel?.length ? gradeSettings.aLevel : DEFAULT_A_GRADES)
    : (gradeSettings?.oLevel?.length ? gradeSettings.oLevel : DEFAULT_O_GRADES)

  const effectiveTopN = useCustom && parseInt(customN) > 0 ? parseInt(customN) : topN

  const handleLoad = async () => {
    setLoading(true)
    setLoaded(false)
    try {
      const termId   = toTermId(selectedTerm)
      const studSnap = await getDocs(collection(db, 'students'))
      const all      = studSnap.docs.map(d => ({ id: d.id, ...d.data() }))

      const filtered = isALevel
        ? all.filter(s => {
            if (!isALevelClass(s.class)) return false
            if (aFilter === 'lower6') return /^Lower\s*6/i.test(s.class)
            if (aFilter === 'upper6') return /^Upper\s*6/i.test(s.class)
            if (aFilter !== 'all')   return s.class === aFilter
            return true
          })
        : all.filter(s => getFormNumber(s.class) === selectedForm && !isALevelClass(s.class))

      if (filtered.length === 0) {
        toast.error('No students found for this selection')
        setLoading(false)
        return
      }

      const classSet = [...new Set(filtered.map(s => s.class).filter(Boolean))]

      // Fetch marks for every class in parallel
      const marksByRegNo = {}
      await Promise.all(classSet.map(async cls => {
        try {
          const snap = await getDocs(
            collection(db, `schools/${SCHOOL_ID}/terms/${termId}/classes/${toClassId(cls)}/students`)
          )
          snap.docs.forEach(d => {
            const data = d.data()
            marksByRegNo[data.regNo || d.id] = data.subjects || {}
          })
        } catch {}
      }))

      // Build per-student stats
      const computed = filtered.map(s => {
        const regNo    = s.reg_number || s.id
        const subjects = marksByRegNo[regNo] || {}
        const marks    = Object.entries(subjects)
          .filter(([, v]) => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
          .map(([sub, v]) => ({ subject: sub, mark: Number(v) }))

        const avg         = marks.length ? r1(marks.reduce((a, m) => a + m.mark, 0) / marks.length) : null
        const totalPoints = marks.reduce((a, m) => a + getPoints(m.mark, gradeTable), 0)

        return {
          regNo,
          name: s.name || s.fullName || '—',
          class: s.class || '—',
          marks,
          avg,
          totalPoints,
          grade:    computeGrade(avg, gradeTable),
          hasMarks: marks.length > 0,
        }
      })

      // Sort: A Level → points desc, O Level → avg desc; no-marks sink to bottom
      computed.sort((a, b) => {
        if (!a.hasMarks && !b.hasMarks) return 0
        if (!a.hasMarks) return 1
        if (!b.hasMarks) return -1
        return isALevel ? b.totalPoints - a.totalPoints : b.avg - a.avg
      })
      computed.forEach((s, i) => { s.rank = i + 1 })

      // Subject champions (tie-aware)
      const subjectMap = {}
      computed.forEach(student => {
        student.marks.forEach(({ subject, mark }) => {
          if (!subjectMap[subject] || mark > subjectMap[subject].mark) {
            subjectMap[subject] = {
              subject,
              mark,
              grade:   computeGrade(mark, gradeTable),
              points:  isALevel ? getPoints(mark, gradeTable) : null,
              winners: [{ name: student.name, class: student.class }],
            }
          } else if (mark === subjectMap[subject].mark) {
            subjectMap[subject].winners.push({ name: student.name, class: student.class })
          }
        })
      })

      setRankings(computed)
      setChampions(Object.values(subjectMap).sort((a, b) => a.subject.localeCompare(b.subject)))
      setLoaded(true)
      toast.success(`Loaded ${filtered.length} students across ${classSet.length} class${classSet.length !== 1 ? 'es' : ''}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const topRankings = rankings.filter(s => s.hasMarks).slice(0, effectiveTopN)

  const levelLabel = isALevel
    ? (aFilter === 'all' ? 'All A Level' : aFilter === 'lower6' ? 'Lower 6' : aFilter === 'upper6' ? 'Upper 6' : aFilter)
    : `Form ${selectedForm}`

  const exportCSV = () => {
    const header  = ['Rank', 'Name', 'Class', isALevel ? 'Total Points' : 'Average %', 'Grade'].join(',')
    const rows    = topRankings.map(s =>
      [s.rank, `"${s.name}"`, `"${s.class}"`, isALevel ? s.totalPoints : (s.avg ?? ''), s.grade].join(',')
    )
    const subHeader = '\nSubject Champions\nSubject,Mark,Grade,Winner(s)'
    const subRows   = champions.map(c =>
      [`"${c.subject}"`, c.mark, c.grade, `"${c.winners.map(w => `${w.name} (${w.class})`).join(' / ')}"`].join(',')
    )
    const blob = new Blob([[header, ...rows, subHeader, ...subRows].join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `PrizeGiving-${isALevel ? 'ALevel' : `Form${selectedForm}`}-${selectedTerm.replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #prize-report, #prize-report * { visibility: visible !important; }
          #prize-report { position: fixed; top: 0; left: 0; right: 0; padding: 10mm; background: white; color: black; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 10mm; }
        }
      `}</style>

      <div className="space-y-6 max-w-[1200px]">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gold/15 rounded-lg flex items-center justify-center shrink-0">
              <MdEmojiEvents className="text-gold text-xl" />
            </div>
            <div>
              <h1 className="font-playfair text-2xl font-bold text-white">Prize Giving Rankings</h1>
              <p className="text-xs text-gray-500 font-montserrat mt-0.5">Top students and subject champions for prize giving day</p>
            </div>
          </div>
          {loaded && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-montserrat font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition"
              >
                <MdDownload className="text-base" /> Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-montserrat font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition"
              >
                <MdPrint className="text-base" /> Print
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-navy-800 border border-white/10 rounded-xl p-1 w-fit no-print">
          {[['olevel', 'O Level (Forms 1–4)'], ['alevel', 'A Level']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setLoaded(false) }}
              className={`px-5 py-2 rounded-lg text-sm font-montserrat font-semibold transition-all ${
                tab === key ? 'bg-gold text-navy-800' : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-navy-800 border border-white/10 rounded-2xl p-5 no-print">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

            {/* Form / A Level filter */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-montserrat mb-1.5">
                {isALevel ? 'A Level Group' : 'Form Level'}
              </label>
              {isALevel ? (
                <select value={aFilter} onChange={e => { setAFilter(e.target.value); setLoaded(false) }} className={SEL}>
                  <option value="all"    className="bg-navy-800">All A Level</option>
                  <option value="lower6" className="bg-navy-800">Lower 6 Only</option>
                  <option value="upper6" className="bg-navy-800">Upper 6 Only</option>
                  {aClasses.map(c => <option key={c} value={c} className="bg-navy-800">{c}</option>)}
                </select>
              ) : (
                <select value={selectedForm} onChange={e => { setSelectedForm(e.target.value); setLoaded(false) }} className={SEL}>
                  <option value="1" className="bg-navy-800">Form 1</option>
                  <option value="2" className="bg-navy-800">Form 2</option>
                  <option value="3" className="bg-navy-800">Form 3</option>
                  <option value="4" className="bg-navy-800">Form 4</option>
                </select>
              )}
            </div>

            {/* Term */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-montserrat mb-1.5">Term</label>
              <select value={selectedTerm} onChange={e => { setSelectedTerm(e.target.value); setLoaded(false) }} className={SEL}>
                {TERMS.map(t => <option key={t} value={t} className="bg-navy-800">{t}</option>)}
              </select>
            </div>

            {/* Top N */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-montserrat mb-1.5">Top N Students</label>
              <div className="flex gap-2">
                <select
                  value={useCustom ? 'custom' : String(topN)}
                  onChange={e => {
                    if (e.target.value === 'custom') { setUseCustom(true); setCustomN('') }
                    else { setUseCustom(false); setTopN(Number(e.target.value)) }
                  }}
                  className={useCustom ? 'w-28 bg-white/5 border border-white/10 focus:border-gold/40 focus:outline-none rounded-xl px-3 py-2.5 text-white font-montserrat text-sm' : SEL}
                >
                  <option value="5"      className="bg-navy-800">Top 5</option>
                  <option value="10"     className="bg-navy-800">Top 10</option>
                  <option value="15"     className="bg-navy-800">Top 15</option>
                  <option value="20"     className="bg-navy-800">Top 20</option>
                  <option value="custom" className="bg-navy-800">Custom…</option>
                </select>
                {useCustom && (
                  <input
                    type="number"
                    min="1"
                    placeholder="N"
                    value={customN}
                    onChange={e => setCustomN(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 focus:border-gold/40 focus:outline-none rounded-xl px-3 py-2.5 text-white font-montserrat text-sm text-center"
                  />
                )}
              </div>
            </div>

            {/* Load */}
            <div className="flex items-end">
              <button
                onClick={handleLoad}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-yellow-400 disabled:opacity-50 text-navy font-montserrat font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition"
              >
                {loading && <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />}
                {loading ? 'Loading…' : 'Load Rankings'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loaded && (
          <div id="prize-report" className="space-y-6">

            {/* Print header */}
            <div className="hidden print:block mb-4">
              <p className="font-bold text-xl">{sc.name} — Prize Giving Rankings</p>
              <p className="text-sm">
                {levelLabel} · {selectedTerm}
                {termStartDate && termEndDate ? ` · ${fmtTermDate(termStartDate)} – ${fmtTermDate(termEndDate)}` : ''}
                {' · Top '}{effectiveTopN}
              </p>
              <hr className="my-2" />
            </div>

            {/* Overall Top N */}
            <div className="bg-navy-800 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="font-playfair font-bold text-white text-lg">
                  Top {topRankings.length} — {levelLabel}
                </h2>
                <p className="text-xs text-gray-500 font-montserrat mt-0.5">
                  {isALevel ? 'Ranked by total A Level points' : 'Ranked by overall average'} · {selectedTerm}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">Rank</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">Student</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">Class</th>
                      <th className="text-center py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">
                        {isALevel ? 'Points' : 'Average'}
                      </th>
                      <th className="text-center py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">Grade</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">Reg No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRankings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-sm text-gray-500 font-montserrat">
                          No marks uploaded for this term.
                        </td>
                      </tr>
                    ) : topRankings.map((s, idx) => {
                      const isMedal = idx < 3
                      return (
                        <tr key={s.regNo} className={`border-b border-white/5 ${isMedal ? 'bg-gold/5' : ''}`}>
                          <td className="py-3 px-4">
                            {isMedal ? (
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border font-montserrat ${MEDAL_CLS[idx]}`}>
                                {['🥇 1st', '🥈 2nd', '🥉 3rd'][idx]}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 font-montserrat font-semibold">#{s.rank}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-white font-montserrat font-medium">{s.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-400 font-montserrat">{s.class}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-sm font-bold font-montserrat ${isMedal ? 'text-gold' : 'text-white'}`}>
                              {isALevel ? `${s.totalPoints} pts` : `${s.avg}%`}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-center text-sm font-bold font-montserrat ${GRADE_COLORS[s.grade] || 'text-white'}`}>
                            {s.grade}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500 font-mono">{s.regNo}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subject Champions */}
            {champions.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <FaTrophy className="text-gold text-lg" />
                  <div>
                    <h2 className="font-playfair font-bold text-white text-lg">Subject Champions — {levelLabel}</h2>
                    <p className="text-xs text-gray-500 font-montserrat">Best student per subject · {champions.length} subjects</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {champions.map(c => (
                    <div
                      key={c.subject}
                      className="bg-navy-800 border border-white/10 hover:border-gold/30 rounded-2xl p-4 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 font-montserrat">
                          Best in
                        </p>
                        <div className="flex items-center gap-1.5">
                          {isALevel && c.points !== null && (
                            <span className="text-[10px] font-bold font-montserrat text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                              {c.points} pts
                            </span>
                          )}
                          <span className={`text-xs font-bold font-montserrat ${GRADE_COLORS[c.grade] || 'text-white'}`}>
                            {c.grade}
                          </span>
                        </div>
                      </div>

                      <p className="font-playfair font-bold text-white text-base mb-0.5">{c.subject}</p>
                      <p className="text-gold font-bold font-montserrat text-xl mb-3">{c.mark}%</p>

                      <div className="space-y-1.5 border-t border-white/10 pt-3">
                        {c.winners.map((w, i) => (
                          <div key={i} className="flex items-center justify-between gap-2">
                            <p className="text-sm text-white font-montserrat font-medium truncate flex-1">{w.name}</p>
                            <span className="text-[10px] text-gray-500 font-montserrat shrink-0 bg-white/5 px-2 py-0.5 rounded-full">
                              {w.class}
                            </span>
                          </div>
                        ))}
                        {c.winners.length > 1 && (
                          <p className="text-[10px] text-amber-400 font-montserrat font-semibold mt-1">⚡ {c.winners.length} students tied</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Empty state */}
        {!loaded && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mb-4">
              <MdEmojiEvents className="text-gold text-3xl" />
            </div>
            <p className="text-gray-400 font-montserrat text-sm font-semibold">
              Select a form/level, term and top N, then click Load Rankings
            </p>
            <p className="text-gray-600 font-montserrat text-xs mt-1">
              Overall rankings and subject champions will appear here
            </p>
          </div>
        )}

      </div>
    </>
  )
}
