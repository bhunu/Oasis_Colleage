import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, where, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import { MdCheckCircle, MdSend, MdInfo, MdSchedule } from 'react-icons/md'
import toast from 'react-hot-toast'
import { useTermDates, fmtTermDate, isTermEnded } from '../../hooks/useTermDates'

const EXIT_LABELS = {
  OLevelCompletion: 'O Level Completion',
  ALevelCompletion: 'A Level Completion',
  Transfer:         'Transfer',
}

const GATED_EXIT_TYPES = ['OLevelCompletion', 'ALevelCompletion', 'Transfer']

export default function ClearanceApplicationForm() {
  const { studentData, firestoreStudent } = useStudent()

  const exitType   = firestoreStudent?.exitType
  const regNo      = studentData?.regNumber
  const fullName   = studentData?.name || 'Student'
  const studentClass = studentData?.class || firestoreStudent?.class || ''

  const { termEndDate } = useTermDates()
  const termHasEnded = isTermEnded(termEndDate)

  const [form, setForm]       = useState({
    guardianName:  firestoreStudent?.guardianName  || studentData?.guardianName  || '',
    guardianPhone: firestoreStudent?.guardianPhone || studentData?.guardianPhone || '',
    declaration: false,
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [feeError, setFeeError] = useState(null)

  // Block resubmission if a Pending or Approved application already exists
  useEffect(() => {
    if (!regNo) return
    getDocs(query(collection(db, 'clearanceApplications'), where('regNo', '==', regNo), limit(1)))
      .then(snap => { if (!snap.empty) setDone(true) })
      .catch(() => {})
  }, [regNo])

  /* Not a gated student — no clearance form needed */
  if (!GATED_EXIT_TYPES.includes(exitType)) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <p className="font-montserrat text-sm text-gray-400">
            Clearance applications are only available to students who are completing O Level, A Level, or transferring.
          </p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8">
          <MdCheckCircle className="text-emerald-400 text-5xl mx-auto mb-4" />
          <h2 className="font-playfair text-2xl font-bold text-white mb-3">Application Submitted</h2>
          <p className="font-montserrat text-sm text-gray-400 leading-relaxed">
            Your clearance application has been submitted successfully. You will be notified once your
            clearance letter is ready.
          </p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFeeError(null)
    if (!form.guardianName.trim())  return toast.error('Guardian name is required.')
    if (!form.guardianPhone.trim()) return toast.error('Guardian phone is required.')
    if (!form.declaration)          return toast.error('You must confirm the student declaration.')

    setLoading(true)
    try {
      /* Fee check on submit */
      const feeSnap = await getDocs(
        query(collection(db, 'feeAccounts'), where('studentId', '==', studentData.studentId), limit(1))
      )
      let totalOwed = 0
      if (!feeSnap.empty) {
        const fee    = feeSnap.docs[0].data()
        const termFees   = fee.termFees   || 0
        const totalPaid  = fee.totalPaid  || 0
        const arrears    = fee.arrears    || 0
        totalOwed = Math.max(0, termFees - totalPaid) + arrears
      }

      if (totalOwed > 0) {
        setFeeError(`Your application could not be submitted. You have an outstanding balance of $${Number(totalOwed).toLocaleString(undefined, { minimumFractionDigits: 2 })}. Please settle your fees with the bursar and return to apply again.`)
        setLoading(false)
        return
      }

      /* Get destination school from latest transfer application if Transfer type */
      let destinationSchool = null
      let transferReason    = null
      if (exitType === 'Transfer') {
        const prevApp = await getDocs(
          query(collection(db, 'clearanceApplications'), where('regNo', '==', regNo), where('exitType', '==', 'Transfer'), limit(1))
        )
        if (!prevApp.empty) {
          destinationSchool = prevApp.docs[0].data().destinationSchool || null
          transferReason    = prevApp.docs[0].data().transferReason    || null
        }
      }

      await addDoc(collection(db, 'clearanceApplications'), {
        regNo,
        studentName:       fullName,
        class:             studentClass,
        exitType,
        destinationSchool,
        transferReason,
        guardianName:      form.guardianName.trim(),
        guardianPhone:     form.guardianPhone.trim(),
        declaration:       true,
        status:            'Pending',
        appliedAt:         serverTimestamp(),
        appliedBy:         studentData?.uid || '',
        reviewedBy:        null,
        reviewedAt:        null,
        clearanceSerial:   null,
        rejectionReason:   null,
        feesVerifiedAt:    null,
      })

      setDone(true)
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="font-playfair text-2xl font-bold text-white">Clearance Application</h2>
        <p className="font-montserrat text-sm text-gray-500 mt-1">
          Apply for your school clearance letter.
        </p>
      </div>

      {/* Term gate — block before term ends */}
      {termEndDate && !termHasEnded && (
        <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-4">
          <MdSchedule className="text-amber-400 text-xl shrink-0 mt-0.5" />
          <div>
            <p className="font-montserrat text-sm font-bold text-amber-400 mb-1">Too early to apply</p>
            <p className="font-montserrat text-xs text-amber-300 leading-relaxed">
              Clearance applications can only be submitted after the term ends on{' '}
              <span className="font-bold">{fmtTermDate(termEndDate)}</span>.
              Please return after that date to complete your clearance.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
        <MdInfo className="text-blue-400 text-lg shrink-0 mt-0.5" />
        <p className="font-montserrat text-xs text-blue-300 leading-relaxed">
          Clearance is only issued when all school fees including arrears are fully paid. Your fee
          balance will be automatically verified when you submit this form.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0D1C35] border border-white/10 rounded-2xl p-6 space-y-5">

        {/* Read-only fields */}
        <ReadRow label="Exit Type"     value={EXIT_LABELS[exitType] || exitType} />
        <ReadRow label="Student Name"  value={fullName} />
        <ReadRow label="Reg Number"    value={regNo} />
        <ReadRow label="Class"         value={studentClass} />
        {exitType === 'Transfer' && firestoreStudent?.destinationSchool && (
          <ReadRow label="Destination School" value={firestoreStudent.destinationSchool} />
        )}

        <div className="border-t border-white/10 pt-5 space-y-5">
          <Field label="Parent / Guardian Name">
            <input
              type="text"
              placeholder="e.g. Mr John Doe"
              value={form.guardianName}
              onChange={e => setForm(f => ({ ...f, guardianName: e.target.value }))}
              className="inp"
            />
          </Field>

          <Field label="Parent / Guardian Phone">
            <input
              type="tel"
              placeholder="e.g. +263 77 123 4567"
              value={form.guardianPhone}
              onChange={e => setForm(f => ({ ...f, guardianPhone: e.target.value }))}
              className="inp"
            />
          </Field>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.declaration}
              onChange={e => setForm(f => ({ ...f, declaration: e.target.checked }))}
              className="mt-1 accent-[#C9A84C] w-4 h-4"
            />
            <span className="font-montserrat text-xs text-gray-400 leading-relaxed">
              I confirm that I have returned all school property including library books, sports equipment,
              and any borrowed items.
            </span>
          </label>
        </div>

        {feeError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="font-montserrat text-xs text-red-300 leading-relaxed">{feeError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (termEndDate ? !termHasEnded : false)}
          className="w-full flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#0A1628] font-montserrat font-bold text-sm py-3 rounded-xl transition"
        >
          <MdSend className="text-base" />
          {loading
            ? 'Checking fees & submitting…'
            : termEndDate && !termHasEnded
              ? `Available after ${fmtTermDate(termEndDate)}`
              : 'Submit Clearance Application'}
        </button>
      </form>

      <style>{`
        .inp {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .inp:focus { border-color: rgba(201,168,76,0.4); }
        .inp::placeholder { color: #4b5563; }
      `}</style>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block font-montserrat text-[10px] uppercase tracking-widest text-gray-500 mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}

function ReadRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <span className="font-montserrat text-[10px] uppercase tracking-wider text-gray-600">{label}</span>
      <span className="font-montserrat text-sm text-gray-300">{value || '—'}</span>
    </div>
  )
}
