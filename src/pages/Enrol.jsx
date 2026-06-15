import { useState, useEffect } from 'react'
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { addStudent } from '../firebase/students'
import { generateRegNumber } from '../utils/generateRegNumber'
import { sendOtpEmail } from '../utils/sendOtpEmail'
import BulkImport from '../components/BulkImport'
import toast from 'react-hot-toast'
import { MdCheckCircle, MdContentCopy, MdPersonAdd, MdUploadFile, MdEmail } from 'react-icons/md'
import { FaGraduationCap } from 'react-icons/fa'

function generateOTP(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}


const EMPTY_FORM = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  class: '',
  studentEmail: '',
  guardianName: '',
  guardianPhone: '',
  guardianEmail: '',
  homeAddress: '',
  enrolmentDate: new Date().toISOString().split('T')[0],
  studentType: 'new',
  boardingStatus: 'day',
}

function validate(data) {
  const errors = {}
  const nameRegex = /^[a-zA-Z]+([ '-][a-zA-Z]+)+$/

  if (!data.fullName.trim())
    errors.fullName = 'Full name is required.'
  else if (!nameRegex.test(data.fullName.trim()))
    errors.fullName = 'Enter first and last name (letters only).'

  if (!data.dateOfBirth)
    errors.dateOfBirth = 'Date of birth is required.'
  else {
    const age = Math.floor((Date.now() - new Date(data.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))
    if (age < 10 || age > 30)
      errors.dateOfBirth = 'Age must be between 10 and 30 years.'
  }

  if (!data.gender)       errors.gender   = 'Select a gender.'
  if (!data.class)        errors.class    = 'Select a class.'

  if (!data.guardianName.trim())
    errors.guardianName = 'Guardian name is required.'
  else if (data.guardianName.trim().length < 3)
    errors.guardianName = 'Enter a valid guardian name.'

  if (!data.guardianPhone.trim())
    errors.guardianPhone = 'Phone number is required.'
  else if (!/^[+0-9][\d\s-]{6,14}$/.test(data.guardianPhone.trim()))
    errors.guardianPhone = 'Enter a valid phone number.'

  if (!data.guardianEmail.trim())
    errors.guardianEmail = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guardianEmail.trim()))
    errors.guardianEmail = 'Enter a valid email address.'

  if (data.studentEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.studentEmail.trim()))
    errors.studentEmail = 'Enter a valid student email address.'

  if (!data.homeAddress.trim())
    errors.homeAddress = 'Home address is required.'
  else if (data.homeAddress.trim().length < 5)
    errors.homeAddress = 'Address is too short.'

  if (!data.enrolmentDate)
    errors.enrolmentDate = 'Enrolment date is required.'

  return errors
}

const iCls = (err) =>
  `w-full bg-white/5 border ${err ? 'border-red-500/60' : 'border-white/10'} focus:border-[#C9A84C]/50 focus:outline-none rounded-xl px-4 py-2.5 text-white font-montserrat text-sm placeholder-gray-600 transition-all [&>option]:bg-[#0D1C35] [&>option]:text-white`

const lCls = 'block text-[11px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1.5'
const eCls = 'text-red-400 text-[11px] font-montserrat mt-1'

// ── Tab button ────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-montserrat font-semibold uppercase tracking-wider transition-all ${
        active ? 'bg-[#C9A84C] text-[#0A1628]' : 'text-gray-400 hover:text-white'
      }`}
    >
      <Icon className="text-sm" />
      {label}
    </button>
  )
}

export default function Enrol() {
  const [tab, setTab]           = useState('single')
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [errors, setErrors]     = useState({})
  const [loading, setLoading]   = useState(false)
  const [enrolled, setEnrolled] = useState(null)
  const [copied, setCopied]     = useState(false)
  const [portalTerm, setPortalTerm] = useState('')
  const [classes, setClasses]   = useState([])

  useEffect(() => {
    getDoc(doc(db, 'portalSettings', 'main')).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        const term = d.currentTerm || '1'
        const year = d.currentYear || String(new Date().getFullYear())
        setPortalTerm(`${term}-${year}`)
      }
    })

    getDocs(collection(db, 'classes')).then(snap => {
      const names = snap.docs.map(d => d.data().name).filter(Boolean).sort()
      if (names.length > 0) setClasses(names)
    })
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const copyReg = () => {
    navigator.clipboard.writeText(enrolled.regNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const printCard = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Student Registration Card</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { border: 2px solid #C9A84C; border-radius: 14px; padding: 40px 36px; max-width: 360px; width: 100%; text-align: center; }
    .school-name { font-size: 15px; font-weight: bold; color: #0A1628; margin-bottom: 2px; }
    .school-sub  { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 20px; }
    hr { border: none; border-top: 1px solid #e5e5e5; margin: 16px 0; }
    .lbl  { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #aaa; margin-bottom: 4px; }
    .val  { font-size: 16px; font-weight: bold; color: #1a1a1a; margin-bottom: 14px; }
    .reg  { font-size: 40px; font-weight: bold; color: #C9A84C; letter-spacing: 6px; margin: 18px 0 10px; }
    .note { font-size: 10px; color: #999; margin-top: 18px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="school-name">Oasis Private College</div>
    <div class="school-sub">Checheche, Zimbabwe</div>
    <hr>
    <div class="lbl">Student Name</div>
    <div class="val">${enrolled.name}</div>
    <div class="lbl">Class</div>
    <div class="val">${enrolled.class}</div>
    <hr>
    <div class="lbl">Registration Number</div>
    <div class="reg">${enrolled.regNumber}</div>
    <div class="note">Keep this number safe.<br>It is used to log in to the Student Portal.</div>
  </div>
</body>
</html>`
    const win = window.open('', '_blank', 'width=480,height=640')
    win.document.open()
    win.document.close()
    const iframe = win.document.createElement('iframe')
    iframe.style.cssText = 'border:none;width:100%;height:100%;position:fixed;top:0;left:0'
    iframe.srcdoc = html
    win.document.body.style.margin = '0'
    win.document.body.appendChild(iframe)
    iframe.onload = () => { win.focus(); win.print(); win.close() }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('Please fix the errors before submitting.')
      return
    }

    setLoading(true)
    try {
      const reg_number   = await generateRegNumber()
      const fullName     = formData.fullName.trim()
      const studentEmail = formData.studentEmail.trim().toLowerCase()

      const studentDocRef = await addStudent({
        reg_number,
        fullName,
        dateOfBirth:   formData.dateOfBirth,
        gender:        formData.gender,
        class:         formData.class,
        ...(studentEmail ? { studentEmail } : {}),
        guardianName:  formData.guardianName.trim(),
        guardianPhone: formData.guardianPhone.trim(),
        guardianEmail: formData.guardianEmail.trim().toLowerCase(),
        homeAddress:   formData.homeAddress.trim(),
        enrolmentDate:  formData.enrolmentDate,
        studentType:    formData.studentType,
        boardingStatus: formData.boardingStatus,
      })

      await addDoc(collection(db, 'feeAccounts'), {
        studentId:    reg_number,
        reg_number,
        studentName:  fullName,
        class:        formData.class,
        term:         portalTerm,
        status:       'open',
        totalCharged: 0,
        totalPaid:    0,
        balance:      0,
        balanceType:  'nil',
        createdAt:    serverTimestamp(),
        updatedAt:    serverTimestamp(),
      })

      let otpSentToEmail = false
      let otpFallback    = null

      if (studentEmail) {
        const otp        = generateOTP(8)
        const expiryHrs  = 24
        const expiresAt  = new Date(Date.now() + expiryHrs * 3600 * 1000)

        const userDocRef = await addDoc(collection(db, 'users'), {
          studentId:        reg_number,
          name:             fullName,
          email:            studentEmail,
          role:             'student',
          active:           false,
          uid:              null,
          hasSetupPassword: false,
          otpCode:          otp,
          otpExpiresAt:     expiresAt,
          otpUsed:          false,
          createdAt:        serverTimestamp(),
          updatedAt:        serverTimestamp(),
        })

        try {
          await sendOtpEmail({ studentName: fullName, email: studentEmail, regNumber: reg_number, otpCode: otp, expiryHours: expiryHrs })
          otpSentToEmail = true
          toast.success(`OTP sent to ${studentEmail}`)
        } catch (emailErr) {
          console.error('OTP email failed:', emailErr)
          toast.error('Student enrolled but OTP email could not be sent. Share the code below with the student.')
          otpFallback = otp
          updateDoc(userDocRef, { otpEmailFailed: true }).catch(() => {})
        }
      }

      setEnrolled({ regNumber: reg_number, name: fullName, class: formData.class, studentEmail: studentEmail || null, otpSentToEmail, otpFallback })
      setFormData(EMPTY_FORM)
      setErrors({})
      toast.success(`${fullName} enrolled successfully!`)
    } catch (err) {
      console.error('Enrol error:', err)
      toast.error('Failed to enrol student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (enrolled) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-[#0D1C35] border border-white/10 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-5">
            <MdCheckCircle className="text-emerald-400 text-3xl" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-white mb-1">Student Enrolled!</h2>
          <p className="font-montserrat text-gray-500 text-sm mb-4">
            The student has been successfully added to the records system.
          </p>

          {enrolled.otpSentToEmail && (
            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 mb-6 text-left">
              <MdEmail className="text-emerald-400 text-lg mt-0.5 shrink-0" />
              <div>
                <p className="font-montserrat text-emerald-300 text-xs font-semibold">OTP Sent via Email</p>
                <p className="font-montserrat text-gray-400 text-xs mt-0.5">
                  Login credentials were sent to <span className="text-white">{enrolled.studentEmail}</span>
                </p>
              </div>
            </div>
          )}

          {enrolled.studentEmail && !enrolled.otpSentToEmail && enrolled.otpFallback && (
            <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl px-4 py-4 mb-6 text-left">
              <p className="font-montserrat text-amber-300 text-xs font-semibold mb-1">Email Not Sent — Share Login Code Manually</p>
              <p className="font-montserrat text-gray-400 text-xs mb-3">
                The OTP could not be emailed to <span className="text-white">{enrolled.studentEmail}</span>. Share this one-time code with the student directly.
              </p>
              <p className="font-playfair text-2xl font-bold text-amber-300 tracking-widest text-center py-2 bg-amber-500/10 rounded-lg">
                {enrolled.otpFallback}
              </p>
              <p className="font-montserrat text-[10px] text-gray-600 text-center mt-2">
                This code is saved in Firestore and will not be shown again after you leave this screen.
              </p>
            </div>
          )}

          <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl px-6 py-6 mb-6 text-left">
            <div className="flex items-center gap-2 justify-center mb-4 pb-4 border-b border-[#C9A84C]/20">
              <FaGraduationCap className="text-[#C9A84C]" />
              <div className="text-center">
                <p className="font-playfair font-bold text-white text-sm leading-tight">Oasis Private College</p>
                <p className="font-montserrat text-[9px] uppercase tracking-widest text-[#C9A84C]/60">Checheche, Zimbabwe</p>
              </div>
            </div>
            <div className="mb-3">
              <p className="font-montserrat text-[9px] uppercase tracking-widest text-gray-600 mb-0.5">Student Name</p>
              <p className="font-montserrat font-semibold text-white text-sm">{enrolled.name}</p>
            </div>
            <div className="mb-4 pb-4 border-b border-[#C9A84C]/20">
              <p className="font-montserrat text-[9px] uppercase tracking-widest text-gray-600 mb-0.5">Class</p>
              <p className="font-montserrat font-semibold text-white text-sm">{enrolled.class}</p>
            </div>
            <div className="text-center">
              <p className="font-montserrat text-[9px] uppercase tracking-widest text-[#C9A84C]/70 mb-1">Registration Number</p>
              <p className="font-playfair text-4xl font-bold text-[#C9A84C] tracking-widest mb-3">{enrolled.regNumber}</p>
              <button
                onClick={copyReg}
                className="inline-flex items-center gap-1.5 text-xs font-montserrat text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors"
              >
                <MdContentCopy className="text-sm" />
                {copied ? 'Copied!' : 'Copy to clipboard'}
              </button>
            </div>
          </div>

          <p className="font-montserrat text-xs text-gray-600 mb-6">
            Keep this number safe — the student will use it to log in to the Student Portal.
          </p>

          <div className="flex gap-3">
            <button
              onClick={printCard}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-montserrat text-xs font-semibold uppercase tracking-wider py-3 rounded-xl transition-all"
            >
              Print Card
            </button>
            <button
              onClick={() => setEnrolled(null)}
              className="flex-1 bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1628] font-montserrat text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <MdPersonAdd />
              Enrol Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main page ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl">
      <div className="bg-[#0D1C35] border border-white/10 rounded-2xl p-8">

        {/* Header + Tabs */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="font-playfair text-2xl font-bold text-white mb-1">Enrol Student</h2>
            <p className="font-montserrat text-gray-500 text-xs uppercase tracking-wider">
              {tab === 'single' ? 'Fill in all required fields marked *' : 'Upload an Excel file with multiple students'}
            </p>
          </div>
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            <TabBtn active={tab === 'single'} onClick={() => setTab('single')} icon={MdPersonAdd}  label="Single"      />
            <TabBtn active={tab === 'bulk'}   onClick={() => setTab('bulk')}   icon={MdUploadFile} label="Bulk Import" />
          </div>
        </div>

        {/* Bulk Import */}
        {tab === 'bulk' && <BulkImport />}

        {/* Single Student Form */}
        {tab === 'single' && (
          <form onSubmit={handleSubmit} noValidate className="space-y-8">

            <section>
              <h3 className="font-montserrat text-[10px] font-semibold text-[#C9A84C]/70 uppercase tracking-widest mb-4 pb-2 border-b border-white/10">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lCls}>Full Name *</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                    placeholder="e.g. Tatenda Ncube" className={iCls(errors.fullName)} />
                  {errors.fullName && <p className={eCls}>{errors.fullName}</p>}
                </div>
                <div>
                  <label className={lCls}>Date of Birth *</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange}
                    className={iCls(errors.dateOfBirth)} />
                  {errors.dateOfBirth && <p className={eCls}>{errors.dateOfBirth}</p>}
                </div>
                <div>
                  <label className={lCls}>Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={iCls(errors.gender)}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.gender && <p className={eCls}>{errors.gender}</p>}
                </div>
                <div>
                  <label className={lCls}>Class *</label>
                  <select name="class" value={formData.class} onChange={handleChange} className={iCls(errors.class)}>
                    <option value="">Select class</option>
                    {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.class && <p className={eCls}>{errors.class}</p>}
                </div>
                <div className="col-span-2">
                  <label className={lCls}>
                    Student Personal Email
                    <span className="normal-case text-gray-700 tracking-normal font-normal ml-2">(optional — OTP login code will be sent here)</span>
                  </label>
                  <input type="email" name="studentEmail" value={formData.studentEmail} onChange={handleChange}
                    placeholder="e.g. student@gmail.com" className={iCls(errors.studentEmail)} />
                  {errors.studentEmail && <p className={eCls}>{errors.studentEmail}</p>}
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-montserrat text-[10px] font-semibold text-[#C9A84C]/70 uppercase tracking-widest mb-4 pb-2 border-b border-white/10">
                Guardian Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lCls}>Guardian Name *</label>
                  <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange}
                    placeholder="e.g. John Ncube" className={iCls(errors.guardianName)} />
                  {errors.guardianName && <p className={eCls}>{errors.guardianName}</p>}
                </div>
                <div>
                  <label className={lCls}>Phone Number *</label>
                  <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange}
                    placeholder="e.g. +263771234567" className={iCls(errors.guardianPhone)} />
                  {errors.guardianPhone && <p className={eCls}>{errors.guardianPhone}</p>}
                </div>
                <div className="col-span-2">
                  <label className={lCls}>Guardian Email *</label>
                  <input type="email" name="guardianEmail" value={formData.guardianEmail} onChange={handleChange}
                    placeholder="e.g. guardian@email.com" className={iCls(errors.guardianEmail)} />
                  {errors.guardianEmail && <p className={eCls}>{errors.guardianEmail}</p>}
                </div>
                <div className="col-span-2">
                  <label className={lCls}>Home Address *</label>
                  <input type="text" name="homeAddress" value={formData.homeAddress} onChange={handleChange}
                    placeholder="e.g. 12 Mbare Road, Harare" className={iCls(errors.homeAddress)} />
                  {errors.homeAddress && <p className={eCls}>{errors.homeAddress}</p>}
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-montserrat text-[10px] font-semibold text-[#C9A84C]/70 uppercase tracking-widest mb-4 pb-2 border-b border-white/10">
                Enrolment Details
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lCls}>Enrolment Date *</label>
                  <input type="date" name="enrolmentDate" value={formData.enrolmentDate} onChange={handleChange}
                    className={iCls(errors.enrolmentDate)} />
                  {errors.enrolmentDate && <p className={eCls}>{errors.enrolmentDate}</p>}
                </div>
                <div>
                  <label className={lCls}>Student Type *</label>
                  <div className="flex gap-6 mt-2">
                    {[['new', 'New student'], ['returning', 'Returning student']].map(([val, lbl]) => (
                      <label key={val} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="studentType" value={val}
                          checked={formData.studentType === val} onChange={handleChange}
                          className="accent-[#C9A84C] w-4 h-4" />
                        <span className="font-montserrat text-sm text-gray-300">{lbl}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lCls}>Boarding Status *</label>
                  <select name="boardingStatus" value={formData.boardingStatus} onChange={handleChange}
                    className={iCls()}>
                    <option value="day">Day Scholar</option>
                    <option value="boarder">Boarder</option>
                  </select>
                </div>
              </div>
            </section>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setFormData(EMPTY_FORM); setErrors({}) }}
                className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-montserrat text-xs font-semibold uppercase tracking-wider py-3.5 rounded-xl transition-all">
                Clear Form
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-[#C9A84C] hover:bg-yellow-400 disabled:opacity-60 text-[#0A1628] font-montserrat text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl shadow-lg shadow-[#C9A84C]/20 transition-all flex items-center justify-center gap-2">
                <MdPersonAdd className="text-base" />
                {loading ? 'Enrolling…' : 'Enrol Student'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  )
}
