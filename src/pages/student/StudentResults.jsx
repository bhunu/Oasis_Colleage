import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import { MdLock, MdCloudUpload } from 'react-icons/md'
import ClearanceRequiredBlock from '../../components/ClearanceRequiredBlock'

const GATED_EXIT_TYPES = ['OLevelCompletion', 'ALevelCompletion', 'Transfer']

export default function StudentResults() {
  const navigate = useNavigate()
  const { studentData, portalSettings, firestoreStudent } = useStudent()

  const [results,       setResults]       = useState([])
  const [feeAccount,    setFeeAccount]    = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [clearancePass, setClearancePass] = useState(null)
  const [clearanceChecked, setClearanceChecked] = useState(false)

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

    /* academic results — sort in JS to avoid composite index requirement */
    getDocs(query(collection(db, 'academicResults'), where('studentId', '==', studentData.studentId)))
      .then(snap => {
        const sorted = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.uploadedAt?.seconds ?? 0) - (a.uploadedAt?.seconds ?? 0))
        setResults(sorted)
      })
      .catch(() => {}).finally(finish)
  }, [studentData?.regNumber])

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

  const gradeColor = (mark) => {
    if (mark >= 80) return 'text-emerald-400'
    if (mark >= 60) return 'text-[#C9A84C]'
    if (mark >= 50) return 'text-blue-400'
    return 'text-red-400'
  }

  const gradeLetter = (mark) => {
    if (mark >= 80) return 'A'
    if (mark >= 70) return 'B'
    if (mark >= 60) return 'C'
    if (mark >= 50) return 'D'
    return 'F'
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
                  {['Subject','Mark','Grade','Teacher comment'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {termResults.map(r => (
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
                    <td className="py-3 px-4 text-xs text-gray-400 font-montserrat">{r.comment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
