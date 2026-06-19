import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import { MdWarning, MdSend, MdCheckCircle } from 'react-icons/md'
import toast from 'react-hot-toast'

export default function TransferRequestForm() {
  const navigate = useNavigate()
  const { studentData, firestoreStudent } = useStudent()

  const [form, setForm] = useState({ destinationSchool: '', transferReason: '', consent: false })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const status    = firestoreStudent?.status
  const exitType  = firestoreStudent?.exitType
  const regNo     = studentData?.regNumber
  const fullName  = studentData?.name || 'Student'

  /* Only Active students may request a transfer */
  if (status && status !== 'Active') {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <p className="font-montserrat text-sm text-gray-400">
            Transfer requests are only available to Active students.
            Your current status is <span className="text-white font-semibold">{status}</span>.
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
          <h2 className="font-playfair text-2xl font-bold text-white mb-3">Transfer Request Submitted</h2>
          <p className="font-montserrat text-sm text-gray-400 leading-relaxed mb-6">
            Your transfer request has been submitted. Your results are now locked pending clearance.
            Please proceed to apply for your clearance letter.
          </p>
          <button
            onClick={() => navigate('/student/clearance/apply')}
            className="bg-gold hover:bg-yellow-400 text-navy font-montserrat font-bold text-sm px-6 py-3 rounded-xl transition"
          >
            Apply for Clearance
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.destinationSchool.trim()) return toast.error('Please enter the destination school.')
    if (!form.transferReason.trim())   return toast.error('Please provide a reason for transfer.')
    if (!form.consent)                 return toast.error('Parent/guardian consent is required.')

    setLoading(true)
    try {
      /* 1. Update student status & exitType */
      await updateDoc(doc(db, 'students', firestoreStudent.id), {
        exitType: 'Transfer',
        status:   'Transferring',
      })

      /* 2. Save clearance application */
      await addDoc(collection(db, 'clearanceApplications'), {
        regNo,
        studentName:       fullName,
        class:             studentData?.class || firestoreStudent?.class || '',
        exitType:          'Transfer',
        destinationSchool: form.destinationSchool.trim(),
        transferReason:    form.transferReason.trim(),
        guardianName:      null,
        guardianPhone:     null,
        declaration:       false,
        status:            'Pending',
        appliedAt:         serverTimestamp(),
        appliedBy:         studentData?.uid || '',
        reviewedBy:        null,
        reviewedAt:        null,
        clearanceSerial:   null,
        rejectionReason:   null,
        feesVerifiedAt:    null,
      })

      /* 3. Notify Student Admin */
      await addDoc(collection(db, 'notifications'), {
        type:        'TransferRequest',
        message:     `${fullName} (${regNo}) has submitted a transfer request to ${form.destinationSchool.trim()}.`,
        forRole:     'StudentAdmin',
        regNo,
        studentName: fullName,
        read:        false,
        createdAt:   serverTimestamp(),
      })

      setDone(true)
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit transfer request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="font-playfair text-2xl font-bold text-white">Transfer Request</h2>
        <p className="font-montserrat text-sm text-gray-500 mt-1">
          Submit a request to transfer to another school.
        </p>
      </div>

      {/* Warning banner */}
      <div className="flex gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-4">
        <MdWarning className="text-amber-400 text-xl shrink-0 mt-0.5" />
        <p className="font-montserrat text-xs text-amber-300 leading-relaxed">
          <strong>Important:</strong> Submitting this form will immediately lock your results until a clearance
          letter is issued. Only proceed if you are certain you wish to transfer. This action cannot be
          undone by yourself — only the school administration can reverse this.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-navy-800 border border-white/10 rounded-2xl p-6 space-y-5">
        <Field label="Destination School Name">
          <input
            type="text"
            placeholder="e.g. Harare High School"
            value={form.destinationSchool}
            onChange={e => setForm(f => ({ ...f, destinationSchool: e.target.value }))}
            className="input-style"
          />
        </Field>

        <Field label="Reason for Transfer">
          <textarea
            rows={4}
            placeholder="Please explain why you are transferring..."
            value={form.transferReason}
            onChange={e => setForm(f => ({ ...f, transferReason: e.target.value }))}
            className="input-style resize-none"
          />
        </Field>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={e => setForm(f => ({ ...f, consent: e.target.checked }))}
            className="mt-1 accent-gold w-4 h-4"
          />
          <span className="font-montserrat text-xs text-gray-400 leading-relaxed">
            My parent or guardian is aware of and has consented to this transfer request.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-yellow-400 disabled:opacity-60 text-navy font-montserrat font-bold text-sm py-3 rounded-xl transition"
        >
          <MdSend className="text-base" />
          {loading ? 'Submitting…' : 'Submit Transfer Request'}
        </button>
      </form>

      <style>{`
        .input-style {
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
        .input-style:focus { border-color: rgb(var(--color-primary) / 0.4); }
        .input-style::placeholder { color: #4b5563; }
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
