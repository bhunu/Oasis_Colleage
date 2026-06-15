import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import toast from 'react-hot-toast'
import { MdUploadFile, MdArrowBack, MdCheckCircle, MdCalendarMonth } from 'react-icons/md'
import { useTermDates, fmtTermDate } from '../../hooks/useTermDates'

const REASONS = [
  'Weekend Visit',
  'Medical / Sick Leave',
  'Family Emergency',
  'Sent Home (Fees)',
  'Bereavement',
  'Other',
]

const DOC_REQUIRED = ['Medical / Sick Leave', 'Bereavement']

const EMPTY = {
  reason: '',
  departureDate: '',
  returnDate: '',
  destination: '',
  guardianName: '',
  guardianPhone: '',
  notes: '',
}

const LABEL = 'block text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1.5'
const INPUT  = 'w-full bg-white/5 border border-white/10 focus:border-[#C9A84C]/50 focus:outline-none rounded-xl px-4 py-2.5 text-white font-montserrat text-sm placeholder-gray-600 transition-all'

export default function ExeatApplicationForm() {
  const navigate = useNavigate()
  const { studentData } = useStudent()
  const { termStartDate, termEndDate } = useTermDates()

  const [form, setForm]             = useState(EMPTY)
  const [file, setFile]             = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [activeExeat, setActiveExeat] = useState(null)

  useEffect(() => {
    if (!studentData?.regNumber) return
    getDocs(query(
      collection(db, 'exeatApplications'),
      where('reg_number', '==', studentData.regNumber),
      where('status', 'in', ['Pending', 'Approved']),
    ))
      .then(snap => { if (!snap.empty) setActiveExeat(snap.docs[0].data()) })
      .catch(() => {})
  }, [studentData?.regNumber])

  const docRequired = DOC_REQUIRED.includes(form.reason)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleFile = e => {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5 MB'); return }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) {
      toast.error('Only PDF, JPG, or PNG files are allowed')
      return
    }
    setFile(f)
  }

  const validate = () => {
    const required = ['reason', 'departureDate', 'returnDate', 'destination', 'guardianName', 'guardianPhone']
    for (const k of required) {
      if (!form[k].trim()) {
        toast.error(`Please fill in: ${k.replace(/([A-Z])/g, ' $1').trim()}`)
        return false
      }
    }
    if (form.returnDate && form.departureDate && new Date(form.returnDate) < new Date(form.departureDate)) {
      toast.error('Return date must be on or after the departure date')
      return false
    }
    if (docRequired && !file) {
      toast.error(`A supporting document is required for "${form.reason}"`)
      return false
    }
    return true
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      let documentURL = null, documentName = null

      if (file) {
        const storageRef = ref(storage, `exeat-docs/${studentData.regNumber}/${Date.now()}-${file.name}`)
        await uploadBytes(storageRef, file)
        documentURL  = await getDownloadURL(storageRef)
        documentName = file.name
      }

      await addDoc(collection(db, 'exeatApplications'), {
        reg_number:      studentData.regNumber,
        studentName:     studentData.name,
        class:           studentData.class,
        studentId:       studentData.studentId,
        uid:             studentData.uid,
        reason:          form.reason,
        departureDate:   form.departureDate,
        returnDate:      form.returnDate,
        destination:     form.destination.trim(),
        guardianName:    form.guardianName.trim(),
        guardianPhone:   form.guardianPhone.trim(),
        notes:           form.notes.trim(),
        documentURL,
        documentName,
        status:          'Pending',
        appliedAt:       serverTimestamp(),
        appliedBy:       studentData.uid,
        reviewedBy:      null,
        reviewedAt:      null,
        passSerial:      null,
        rejectionReason: null,
      })

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Blocked: active exeat already exists ── */
  if (activeExeat) {
    return (
      <div className="max-w-md mx-auto text-center space-y-5 py-16">
        <div className="w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto">
          <MdCalendarMonth className="text-amber-400 text-3xl" />
        </div>
        <div>
          <h2 className="font-playfair text-xl font-bold text-white">Active Exeat Already Exists</h2>
          <p className="font-montserrat text-sm text-gray-400 leading-relaxed mt-2">
            You already have a <span className="text-amber-300 font-semibold">{activeExeat.status}</span> exeat application
            ({activeExeat.reason}). You cannot submit a new one until it is resolved.
          </p>
        </div>
        <button
          onClick={() => navigate('/student/exeat/my-applications')}
          className="font-montserrat text-xs bg-[#C9A84C] text-[#0A1628] font-bold px-5 py-2.5 rounded-xl"
        >
          View My Applications
        </button>
      </div>
    )
  }

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center space-y-5 py-16">
        <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto">
          <MdCheckCircle className="text-emerald-400 text-3xl" />
        </div>
        <div>
          <h2 className="font-playfair text-xl font-bold text-white">Application Submitted</h2>
          <p className="font-montserrat text-sm text-gray-400 leading-relaxed mt-2">
            Your exeat application has been submitted and is awaiting approval from the school administration.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/student/exeat/my-applications')}
            className="font-montserrat text-xs bg-[#C9A84C] text-[#0A1628] font-bold px-5 py-2.5 rounded-xl"
          >
            View My Applications
          </button>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="font-montserrat text-xs border border-white/10 text-gray-400 px-5 py-2.5 rounded-xl hover:bg-white/5"
          >
            Dashboard
          </button>
        </div>
      </div>
    )
  }

  /* ── Form ── */
  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-400 hover:bg-white/5 transition">
          <MdArrowBack className="text-xl" />
        </button>
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">Apply for Exeat</h1>
          <p className="text-xs text-gray-500 font-montserrat mt-0.5">
            Complete all required fields to submit your exit pass application
          </p>
        </div>
      </div>

      {/* Term dates info */}
      {(termStartDate || termEndDate) && (
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <MdCalendarMonth className="text-[#C9A84C] text-lg shrink-0" />
          <p className="font-montserrat text-xs text-gray-400">
            <span className="text-white font-semibold">Current term:</span>{' '}
            {termStartDate ? fmtTermDate(termStartDate) : '—'} → {termEndDate ? fmtTermDate(termEndDate) : '—'}
            {termEndDate && (
              <span className="text-gray-500 ml-2">· Departure and return dates must fall within this term</span>
            )}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-[#0D1C35] border border-white/10 rounded-2xl p-6 space-y-5">

          {/* Reason */}
          <div>
            <label className={LABEL}>Reason for Exit <span className="text-red-400">*</span></label>
            <select name="reason" value={form.reason} onChange={handleChange} className={INPUT}>
              <option value="">Select a reason…</option>
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Departure Date <span className="text-red-400">*</span></label>
              <input
                type="date"
                name="departureDate"
                value={form.departureDate}
                onChange={handleChange}
                min={termStartDate || undefined}
                max={termEndDate   || undefined}
                className={INPUT}
              />
              {termStartDate && termEndDate && (
                <p className="text-[10px] text-gray-600 font-montserrat mt-1">
                  {fmtTermDate(termStartDate)} – {fmtTermDate(termEndDate)}
                </p>
              )}
            </div>
            <div>
              <label className={LABEL}>Expected Return Date <span className="text-red-400">*</span></label>
              <input
                type="date"
                name="returnDate"
                value={form.returnDate}
                onChange={handleChange}
                min={form.departureDate || termStartDate || undefined}
                max={termEndDate || undefined}
                className={INPUT}
              />
              {termEndDate && (
                <p className="text-[10px] text-gray-600 font-montserrat mt-1">
                  Must return by {fmtTermDate(termEndDate)}
                </p>
              )}
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className={LABEL}>Destination / Going To <span className="text-red-400">*</span></label>
            <input
              type="text"
              name="destination"
              value={form.destination}
              onChange={handleChange}
              placeholder="e.g. Home — Harare"
              className={INPUT}
            />
          </div>

          {/* Guardian */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Guardian / Parent Name <span className="text-red-400">*</span></label>
              <input type="text" name="guardianName" value={form.guardianName} onChange={handleChange} placeholder="Full name" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Guardian Phone Number <span className="text-red-400">*</span></label>
              <input type="tel" name="guardianPhone" value={form.guardianPhone} onChange={handleChange} placeholder="+263 77 123 4567" className={INPUT} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={LABEL}>
              Additional Notes <span className="text-gray-600 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional information for the administration…"
              className={`${INPUT} resize-none`}
            />
          </div>

          {/* Document upload */}
          <div>
            <label className={LABEL}>
              Supporting Document
              {docRequired
                ? <span className="text-red-400"> * Required for {form.reason}</span>
                : <span className="text-gray-600 normal-case font-normal"> (optional)</span>}
            </label>
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-white/10 hover:border-[#C9A84C]/40 rounded-xl p-6 cursor-pointer transition-all group">
              <MdUploadFile className={`text-2xl transition-colors ${file ? 'text-[#C9A84C]' : 'text-gray-500 group-hover:text-[#C9A84C]'}`} />
              <span className="text-xs font-montserrat text-center text-gray-500">
                {file ? (
                  <span className="text-[#C9A84C] font-semibold">{file.name}</span>
                ) : (
                  <>Click to upload <span className="text-gray-400">PDF, JPG, or PNG</span> · max 5 MB</>
                )}
              </span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="sr-only" />
            </label>
          </div>

        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#0A1628] font-montserrat font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl transition-all"
        >
          {submitting ? 'Submitting application…' : 'Submit Exeat Application'}
        </button>
      </form>
    </div>
  )
}
