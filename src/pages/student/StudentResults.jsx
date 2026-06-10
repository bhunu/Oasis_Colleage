import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, query, where, limit } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import { getCurrentTerm } from '../../utils/termHelpers'
import { MdLock, MdCloudUpload } from 'react-icons/md'
import ClearanceRequiredBlock from '../../components/ClearanceRequiredBlock'

const SCHOOL_ID = 'oasis'

function toTermId(term)  { return term.toLowerCase().replace(/\s+/g, '-') }
function toClassId(cls)  { return (cls || '').toLowerCase().replace(/\s+/g, '-') }

const DEFAULT_O_GRADES = [
  { grade: 'A', min: 75, max: 100 },
  { grade: 'B', min: 65, max: 74 },
  { grade: 'C', min: 50, max: 64 },
  { grade: 'D', min: 40, max: 49 },
  { grade: 'U', min: 0,  max: 39  },
]

const DEFAULT_A_GRADES = [
  { grade: 'A', min: 80, max: 100, points: 5 },
  { grade: 'B', min: 70, max: 79,  points: 4 },
  { grade: 'C', min: 60, max: 69,  points: 3 },
  { grade: 'D', min: 50, max: 59,  points: 2 },
  { grade: 'U', min: 0,  max: 49,  points: 0 },
]

function gradeColorByLetter(grade) {
  if (!grade) return 'text-gray-400'
  const g = grade.toUpperCase()
  if (g.startsWith('A')) return 'text-emerald-400'
  if (g.startsWith('B')) return 'text-emerald-400'
  if (g.startsWith('C')) return 'text-[#C9A84C]'
  if (g.startsWith('D')) return 'text-orange-400'
  return 'text-red-400'
}

const GATED_EXIT_TYPES = ['OLevelCompletion', 'ALevelCompletion', 'Transfer']

export default function StudentResults() {
  const navigate = useNavigate()
  const { studentData, portalSettings, firestoreStudent } = useStudent()

  const [results,       setResults]       = useState([])
  const [feeAccount,    setFeeAccount]    = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [clearancePass, setClearancePass] = useState(null)
  const [clearanceChecked, setClearanceChecked] = useState(false)
  const [gradeSettings, setGradeSettings] = useState(null)

  /* ── threshold comes in real-time via portalSettings (onSnapshot in context) ── */
  const threshold = portalSettings?.resultsAccessThreshold ?? 75

  useEffect(() => {
    if (!studentData?.regNumber) return
    let done = 0
    const finish = () => { if (++done === 2) setLoading(false) }

    /* fee account — must not be blocked by results query failure */
    getDocs(query(collection(db, 'feeAccounts'), where('reg_number', '==', studentData.regNumber), limit(1)))
      .then(snap => { if (!snap.empty) setFeeAccount({ id: snap.docs[0].id, ...snap.docs[0].data() }) })
      .catch(() => {}).finally(finish)

    /* academic results — direct reads from the uploaded marks path */
    ;(async () => {
      try {
        const regNo   = studentData.regNumber
        const classId = toClassId(studentData.class)

        // Build the current term ID (same logic as Exams.jsx)
        const { number, year } = getCurrentTerm()
        const currentTermStr   = `Term ${number} ${year}`
        const currentTermId    = toTermId(currentTermStr)

        // Collect all term IDs — fall back to just current if listing fails
        let termIds = [currentTermId]
        try {
          const termsSnap = await getDocs(collection(db, 'schools', SCHOOL_ID, 'terms'))
          if (!termsSnap.empty) termIds = termsSnap.docs.map(d => d.id)
        } catch {}

        // One getDoc per term — no index required
        const docSnaps = await Promise.all(
          termIds.map(tid =>
            getDoc(doc(db, 'schools', SCHOOL_ID, 'terms', tid, 'classes', classId, 'students', regNo))
          )
        )

        const rows = []
        docSnaps.forEach(docSnap => {
          if (!docSnap.exists()) return
          const data     = docSnap.data()
          const subjects = data.subjects || {}
          Object.entries(subjects).forEach(([subject, mark]) => {
            if (mark !== null && mark !== undefined && mark !== '') {
              rows.push({
                id:         `${docSnap.ref.path}|${subject}`,
                term:       data.term || currentTermStr,
                subject,
                mark:       Number(mark),
                total:      100,
                comment:    data.comment || '',
                uploadedAt: data.uploadedAt,
              })
            }
          })
        })

        rows.sort((a, b) => (b.uploadedAt?.seconds ?? 0) - (a.uploadedAt?.seconds ?? 0))
        setResults(rows)
      } catch (err) {
        console.error('Results fetch error:', err)
      } finally {
        finish()
      }
    })()
  }, [studentData?.regNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Check clearance pass for gated exit types */
  useEffect(() => {
    const exitType = firestoreStudent?.exitType
    if (!studentData?.regNumber || !GATED_EXIT_TYPES.includes(exitType)) {
      setClearanceChecked(true)
      return
    }
    getDocs(
      query(collection(db, 'clearancePasses'), where('regNo', '==', studentData.regNumber), where('valid', '==', true), limit(1))
    ).then(snap => {
      setClearancePass(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() })
    }).catch(() => setClearancePass(null)).finally(() => setClearanceChecked(true))
  }, [studentData?.regNumber, firestoreStudent?.exitType])

  useEffect(() => {
    getDoc(doc(db, 'config', 'gradeSettings'))
      .then(snap => { if (snap.exists()) setGradeSettings(snap.data()) })
      .catch(() => {})
  }, [])

  const termFees   = feeAccount?.termFees  || 0
  const totalPaid  = feeAccount?.totalPaid || 0
  const paidPct    = termFees > 0 ? (totalPaid / termFees) * 100 : 0
  const resultUnlocked = paidPct >= threshold
  const amountNeeded   = termFees > 0 ? Math.max(0, (threshold / 100) * termFees - totalPaid) : 0
  const fmt = v => `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

  if (loading || !clearanceChecked) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  /* ── Clearance gate (targeted to completing/transferring students only) ── */
  if (GATED_EXIT_TYPES.includes(firestoreStudent?.exitType) && !clearancePass) {
    return (
      <ClearanceRequiredBlock
        studentName={studentData?.name || 'Student'}
        exitType={firestoreStudent.exitType}
      />
    )
  }

  /* ── Fee threshold locked screen ── */
  if (!resultUnlocked) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">

        <div className="w-20 h-20 bg-purple-500/15 rounded-full flex items-center justify-center mx-auto mb-5">
          <MdLock className="text-purple-400 text-4xl" />
        </div>

        <h2 className="font-playfair text-2xl font-bold text-white mb-2">Results Locked</h2>
        <p className="text-gray-400 font-montserrat text-sm mb-6 leading-relaxed">
          You need to pay at least <span className="text-white font-semibold">{threshold}%</span> of your
          term fees to view your results.
        </p>

        {/* Fee progress */}
        <div className="bg-[#0D1C35] border border-white/10 rounded-xl p-5 text-left mb-6">
          <div className="flex justify-between text-xs font-montserrat mb-3">
            <span className="text-gray-400">Your current payment</span>
            <span className="text-white font-semibold">{fmt(totalPaid)} of {fmt(termFees)}</span>
          </div>

          {/* Progress bar with threshold marker */}
          <div className="relative h-3 bg-white/10 rounded-full overflow-visible">
            {/* Paid fill */}
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${Math.min(paidPct, 100)}%` }}
            />
            {/* Threshold marker line */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-5 rounded-full z-10"
              style={{ left: `${threshold}%`, backgroundColor: '#C9A84C' }}
              title={`${threshold}% unlock threshold`}
            />
            {/* Threshold label */}
            <div
              className="absolute -top-6 -translate-x-1/2 text-[9px] font-montserrat font-semibold whitespace-nowrap"
              style={{ left: `${threshold}%`, color: '#C9A84C' }}
            >
              {threshold}% unlock
            </div>
          </div>

          <div className="flex justify-between text-[10px] font-montserrat text-gray-500 mt-3">
            <span>{Math.round(paidPct)}% paid</span>
            <span className="text-purple-400">{threshold}% required</span>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs font-montserrat text-gray-400">
              Amount still needed to unlock:{' '}
              <span className="text-white font-semibold">{fmt(amountNeeded)}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/student/upload-pop')}
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1628] font-montserrat font-bold text-sm px-6 py-3 rounded-xl mx-auto transition"
        >
          <MdCloudUpload className="text-lg" />
          Upload Proof of Payment
        </button>
      </div>
    )
  }

  /* ── Unlocked: show results ── */
  const grouped = results.reduce((acc, r) => {
    const term = r.term || 'Current Term'
    if (!acc[term]) acc[term] = []
    acc[term].push(r)
    return acc
  }, {})

  const isALevel = /^(Lower|Upper)\s*6/i.test(studentData?.class || '')
  const gradeTable = isALevel
    ? (gradeSettings?.aLevel?.length ? gradeSettings.aLevel : DEFAULT_A_GRADES)
    : (gradeSettings?.oLevel?.length ? gradeSettings.oLevel : DEFAULT_O_GRADES)

  const gradeEntry = (mark) => gradeTable.find(g => Number(mark) >= g.min && Number(mark) <= g.max) || gradeTable[gradeTable.length - 1]
  const gradeLetter = (mark) => gradeEntry(mark)?.grade || '—'
  const gradeColor  = (mark) => gradeColorByLetter(gradeLetter(mark))

  /* ── Analysis data (latest mark per subject) ── */
  const latestBySubject = {}
  results.forEach(r => { if (!latestBySubject[r.subject]) latestBySubject[r.subject] = r })
  const subjectList    = Object.values(latestBySubject)
  const subjectsSorted = [...subjectList].sort((a, b) => b.mark - a.mark)
  const overallAvg     = subjectList.length
    ? Math.round(subjectList.reduce((s, r) => s + r.mark, 0) / subjectList.length * 10) / 10
    : null
  const passCount  = subjectList.filter(r => r.mark >= 50).length
  const strongSubs = subjectList.filter(r => r.mark >= 65)
  const weakSubs   = subjectList.filter(r => r.mark < 50)
  const bestSub    = subjectsSorted[0]
  const weakestSub = subjectsSorted[subjectsSorted.length - 1]

  const barColor = (mark) => {
    if (mark >= 65) return '#22c55e'
    if (mark >= 50) return '#C9A84C'
    if (mark >= 40) return '#f97316'
    return '#ef4444'
  }

  return (
    <div className="space-y-6 max-w-3xl">

      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5 w-fit">
        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
        <span className="text-xs font-montserrat text-emerald-400">Results available · {Math.round(paidPct)}% fees paid</span>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-[#0D1C35] border border-white/10 rounded-xl p-12 text-center">
          <p className="text-gray-500 font-montserrat text-sm">
            No results have been uploaded yet. Check back after exams.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([term, termResults]) => (
          <div key={term} className="bg-[#0D1C35] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 bg-white/2">
              <h3 className="font-playfair font-semibold text-white">{term}</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Subject', 'Mark', 'Grade', ...(isALevel ? ['Points'] : []), 'Teacher comment'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {termResults.map(r => {
                  const entry = gradeEntry(r.mark)
                  return (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="py-3 px-4 text-sm text-white font-montserrat">{r.subject || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-lg font-bold font-playfair ${gradeColor(r.mark)}`}>
                          {r.mark ?? '—'}
                        </span>
                        <span className="text-gray-500 text-xs font-montserrat ml-1">/ {r.total || 100}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold font-montserrat ${gradeColor(r.mark)}`}
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          {gradeLetter(r.mark)}
                        </span>
                      </td>
                      {isALevel && (
                        <td className="py-3 px-4">
                          <span className={`text-sm font-bold font-montserrat ${gradeColor(r.mark)}`}>
                            {entry?.points ?? 0}
                          </span>
                          <span className="text-gray-500 text-[10px] font-montserrat ml-1">pts</span>
                        </td>
                      )}
                      <td className="py-3 px-4 text-xs text-gray-400 font-montserrat">{r.comment || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))
      )}

      {/* ── Performance Analysis ── */}
      {subjectList.length > 0 && (
        <div className="bg-[#0D1C35] border border-white/10 rounded-xl overflow-hidden">

          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="font-playfair font-semibold text-white">Performance Analysis</h3>
            <p className="text-[10px] text-gray-500 font-montserrat mt-0.5 uppercase tracking-widest">
              Based on your latest results · {subjectList.length} subject{subjectList.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="p-5 space-y-6">

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-[9px] uppercase tracking-widest text-gray-500 font-montserrat mb-1.5">Overall Average</p>
                <p className={`text-2xl font-bold font-playfair ${gradeColor(overallAvg)}`}>{overallAvg}%</p>
                <span className={`text-[11px] font-bold font-montserrat ${gradeColor(overallAvg)}`}>
                  Grade {gradeLetter(overallAvg)}
                </span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-[9px] uppercase tracking-widest text-gray-500 font-montserrat mb-1.5">Subjects Passed</p>
                <p className={`text-2xl font-bold font-playfair ${
                  passCount === subjectList.length ? 'text-emerald-400'
                  : passCount >= subjectList.length / 2 ? 'text-[#C9A84C]'
                  : 'text-red-400'
                }`}>
                  {passCount}<span className="text-sm text-gray-500 font-montserrat">/{subjectList.length}</span>
                </p>
                <span className="text-[11px] font-montserrat text-gray-500">
                  {passCount === subjectList.length ? 'All passed' : `${subjectList.length - passCount} below 50%`}
                </span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-[9px] uppercase tracking-widest text-gray-500 font-montserrat mb-1.5">Strongest Subject</p>
                <p className="text-sm font-bold text-white font-montserrat leading-tight mb-1 truncate px-1">{bestSub?.subject || '—'}</p>
                <span className="text-[11px] font-bold font-montserrat text-emerald-400">{bestSub?.mark}%</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-[9px] uppercase tracking-widest text-gray-500 font-montserrat mb-1.5">Needs Attention</p>
                <p className="text-sm font-bold text-white font-montserrat leading-tight mb-1 truncate px-1">{weakestSub?.subject || '—'}</p>
                <span className={`text-[11px] font-bold font-montserrat ${gradeColor(weakestSub?.mark)}`}>{weakestSub?.mark}%</span>
              </div>
            </div>

            {/* Subject bars */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-montserrat mb-3">Subject Ranking — Strongest to Weakest</p>
              <div className="space-y-3">
                {subjectsSorted.map((r, idx) => (
                  <div key={r.subject}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] text-gray-600 font-montserrat w-4 shrink-0">#{idx + 1}</span>
                        <span className="text-xs text-gray-200 font-montserrat truncate">{r.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className={`text-xs font-bold font-montserrat ${gradeColor(r.mark)}`}>{r.mark}%</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-montserrat ${gradeColor(r.mark)}`}
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                        >
                          {gradeLetter(r.mark)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${r.mark}%`, backgroundColor: barColor(r.mark) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback callouts */}
            {(strongSubs.length > 0 || weakSubs.length > 0) && (
              <div className="space-y-2">
                {strongSubs.length > 0 && (
                  <div className="flex items-start gap-2.5 bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3.5 py-3">
                    <span className="text-emerald-400 text-base leading-none mt-0.5">✓</span>
                    <p className="text-xs font-montserrat text-emerald-300 leading-relaxed">
                      <span className="font-semibold">Strong performance in: </span>
                      {strongSubs.map(r => r.subject).join(', ')}
                    </p>
                  </div>
                )}
                {weakSubs.length > 0 && (
                  <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 rounded-lg px-3.5 py-3">
                    <span className="text-red-400 text-base leading-none mt-0.5">⚠</span>
                    <p className="text-xs font-montserrat text-red-300 leading-relaxed">
                      <span className="font-semibold">Needs improvement: </span>
                      {weakSubs.map(r => r.subject).join(', ')} — consider extra study or speaking to your teacher
                    </p>
                  </div>
                )}
                {weakSubs.length === 0 && (
                  <div className="flex items-start gap-2.5 bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3.5 py-3">
                    <span className="text-emerald-400 text-base leading-none mt-0.5">🎉</span>
                    <p className="text-xs font-montserrat text-emerald-300 leading-relaxed">
                      <span className="font-semibold">Well done! </span>
                      You have passed all your subjects. Keep up the good work.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
