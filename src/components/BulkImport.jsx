import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { addStudent, getStudents } from '../firebase/students'
import { generateRegNumber } from '../utils/generateRegNumber'
import { sendOtpEmail } from '../utils/sendOtpEmail'
import toast from 'react-hot-toast'
import {
  MdUploadFile, MdDownload, MdCheckCircle, MdError,
  MdWarning, MdClose, MdCloudUpload, MdEmail,
} from 'react-icons/md'

function generateOTP(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ── Required column headers (must match exactly) ──────────────────────────
const REQUIRED_COLS  = ['fullName', 'dateOfBirth', 'gender', 'class', 'guardianName', 'guardianPhone', 'guardianEmail', 'homeAddress']
const OPTIONAL_COLS  = ['enrolmentDate', 'studentType', 'boardingStatus', 'studentEmail']
const ALL_COLS       = [...REQUIRED_COLS, ...OPTIONAL_COLS]

const VALID_CLASSES = [
  'Form 1A','Form 1B','Form 1C','Form 2A','Form 2B','Form 2C',
  'Form 3A','Form 3B','Form 3C','Form 4A','Form 4B','Form 4C',
  'Lower 6 Commercials','Lower 6 Arts','Lower 6 Sciences',
  'Upper 6 Commercials','Upper 6 Arts','Upper 6 Sciences',
]

// ── Download Excel template ───────────────────────────────────────────────
export function downloadTemplate() {
  const sample = [{
    fullName:      'Tatenda Ncube',
    dateOfBirth:   '2010-03-15',
    gender:        'Male',
    class:         'Form 1A',
    guardianName:  'John Ncube',
    guardianPhone: '+263771234567',
    guardianEmail: 'john.ncube@email.com',
    homeAddress:   '12 Mbare Road, Harare',
    enrolmentDate:  new Date().toISOString().split('T')[0],
    studentType:    'new',
    boardingStatus: 'day',
    studentEmail:   'tatenda.ncube@gmail.com',
  }]

  const ws = XLSX.utils.json_to_sheet(sample, { header: ALL_COLS })

  // Style the header row with notes
  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'C9A84C' } } }
  ALL_COLS.forEach((col, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i })
    if (ws[cell]) ws[cell].s = headerStyle
  })

  // Column widths
  ws['!cols'] = ALL_COLS.map(c => ({ wch: Math.max(c.length + 4, 18) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Students')
  XLSX.writeFile(wb, 'oasis_students_template.xlsx')
}

// ── Row validator ─────────────────────────────────────────────────────────
function validateRow(row, idx) {
  const errs = []
  const nameRegex = /^[a-zA-Z]+([ '-][a-zA-Z]+)+$/

  if (!row.fullName?.trim())                        errs.push('Full name missing')
  else if (!nameRegex.test(row.fullName.trim()))    errs.push('Invalid full name')

  if (!row.dateOfBirth)                             errs.push('Date of birth missing')
  else {
    const age = Math.floor((Date.now() - new Date(row.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))
    if (isNaN(age) || age < 10 || age > 30)         errs.push('Age must be 10–30')
  }

  if (!['Male','Female'].includes(row.gender))      errs.push('Gender must be Male or Female')

  if (!VALID_CLASSES.includes(row.class))           errs.push('Invalid class')

  if (!row.guardianName?.trim())                    errs.push('Guardian name missing')

  if (!row.guardianPhone?.trim())                   errs.push('Phone missing')
  else if (!/^[+0-9][\d\s\-]{6,14}$/.test(row.guardianPhone.trim())) errs.push('Invalid phone')

  if (row.guardianEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.guardianEmail.trim())) errs.push('Invalid email')

  if (!row.homeAddress?.trim())                     errs.push('Address missing')

  if (row.studentEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.studentEmail.trim()))
    errs.push('Invalid student email')

  return errs
}

// ── Parse xlsx date serial to YYYY-MM-DD ─────────────────────────────────
function parseDate(val) {
  if (!val) return ''
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val)
    if (!d) return ''
    return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`
  }
  // Already a string
  const d = new Date(val)
  if (isNaN(d)) return String(val)
  return d.toISOString().split('T')[0]
}

// ── Main component ────────────────────────────────────────────────────────
export default function BulkImport() {
  const [rows, setRows]           = useState([])   // { ...data, _errors[], _status }
  const [importing, setImporting] = useState(false)
  const [done, setDone]           = useState(false)
  const [fileName, setFileName]   = useState('')

  const processFile = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const raw  = XLSX.utils.sheet_to_json(ws, { defval: '' })

        if (raw.length === 0) { toast.error('The file is empty.'); return }

        // Check required columns exist
        const missing = REQUIRED_COLS.filter(c => !(c in raw[0]))
        if (missing.length > 0) {
          toast.error(`Missing columns: ${missing.join(', ')}`)
          return
        }

        const parsed = raw.map((r, i) => {
          const row = {
            fullName:      String(r.fullName   || '').trim(),
            dateOfBirth:   parseDate(r.dateOfBirth),
            gender:        String(r.gender     || '').trim(),
            class:         String(r.class      || '').trim(),
            guardianName:  String(r.guardianName  || '').trim(),
            guardianPhone: String(r.guardianPhone || '').trim(),
            guardianEmail: String(r.guardianEmail || '').trim().toLowerCase(),
            homeAddress:   String(r.homeAddress   || '').trim(),
            enrolmentDate:  parseDate(r.enrolmentDate) || new Date().toISOString().split('T')[0],
            studentType:    String(r.studentType    || 'new').trim().toLowerCase(),
            boardingStatus: String(r.boardingStatus || 'day').trim().toLowerCase(),
            studentEmail:   String(r.studentEmail   || '').trim().toLowerCase(),
          }
          const errs = validateRow(row, i)
          return { ...row, _errors: errs, _status: errs.length === 0 ? 'valid' : 'error' }
        })

        // Detect duplicates against already-uploaded students (match by fullName + dateOfBirth)
        const existing = await getStudents()
        const existingKeys = new Set(
          existing.map(s => `${s.fullName?.trim().toLowerCase()}|${s.dateOfBirth}`)
        )
        const deduplicated = parsed.map(row => {
          if (row._status === 'valid') {
            const key = `${row.fullName.toLowerCase()}|${row.dateOfBirth}`
            if (existingKeys.has(key)) return { ...row, _status: 'duplicate' }
          }
          return row
        })

        setRows(deduplicated)
        setFileName(file.name)
        setDone(false)
      } catch {
        toast.error('Could not read the file. Make sure it is a valid .xlsx or .xls file.')
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => { if (accepted[0]) processFile(accepted[0]) },
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
    multiple: false,
  })

  const validRows     = rows.filter(r => r._status === 'valid')
  const errorRows     = rows.filter(r => r._status === 'error')
  const importedRows  = rows.filter(r => r._status === 'imported')
  const duplicateRows = rows.filter(r => r._status === 'duplicate')

  const handleImport = async () => {
    if (validRows.length === 0) return
    setImporting(true)
    let success = 0, failed = 0

    let otpEmailed = 0

    for (const row of validRows) {
      try {
        const reg_number = await generateRegNumber()

        const studentDocRef = await addStudent({
          reg_number,
          fullName:      row.fullName,
          dateOfBirth:   row.dateOfBirth,
          gender:        row.gender,
          class:         row.class,
          studentEmail:  row.studentEmail || '',
          guardianName:  row.guardianName,
          guardianPhone: row.guardianPhone,
          guardianEmail: row.guardianEmail,
          homeAddress:   row.homeAddress,
          enrolmentDate:  row.enrolmentDate,
          studentType:    row.studentType,
          boardingStatus: row.boardingStatus,
        })

        await addDoc(collection(db, 'feeAccounts'), {
          reg_number,
          studentName:  row.fullName,
          class:        row.class,
          term:         '2-2025',
          status:       'open',
          totalCharged: 0, totalPaid: 0, balance: 0, balanceType: 'nil',
          createdAt: serverTimestamp(),
        })

        let otpSent = false
        if (row.studentEmail) {
          const otp       = generateOTP(8)
          const expiryHrs = 24
          const expiresAt = new Date(Date.now() + expiryHrs * 3600 * 1000)

          await addDoc(collection(db, 'users'), {
            studentId:        studentDocRef.id,
            name:             row.fullName,
            email:            row.studentEmail,
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
            await sendOtpEmail({ studentName: row.fullName, email: row.studentEmail, regNumber: reg_number, otpCode: otp, expiryHours: expiryHrs })
            otpSent = true
            otpEmailed++
          } catch (emailErr) {
            console.error(`OTP email failed for ${row.fullName}:`, emailErr)
          }
        }

        setRows(prev => prev.map(r =>
          r === row ? { ...r, _status: 'imported', _regNumber: reg_number, _otpSent: otpSent } : r
        ))
        success++
      } catch {
        setRows(prev => prev.map(r =>
          r === row ? { ...r, _status: 'failed' } : r
        ))
        failed++
      }
    }

    setImporting(false)
    setDone(true)
    if (success > 0) toast.success(`${success} student${success > 1 ? 's' : ''} imported successfully!`)
    if (failed > 0)  toast.error(`${failed} student${failed > 1 ? 's' : ''} failed to import.`)
  }

  const reset = () => { setRows([]); setFileName(''); setDone(false) }

  // ── Dropzone (no file loaded) ──────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className="space-y-5">
        {/* Template download notice */}
        <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/25 rounded-xl px-5 py-4">
          <p className="font-montserrat text-xs text-white font-semibold mb-1">Required column headers</p>
          <p className="font-montserrat text-[11px] text-gray-400 mb-3">
            Your Excel file must contain these exact column names in the first row:
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {REQUIRED_COLS.map(c => (
              <code key={c} className="bg-[#C9A84C]/20 text-[#C9A84C] text-[10px] font-mono px-2 py-0.5 rounded">{c}</code>
            ))}
            {OPTIONAL_COLS.map(c => (
              <code key={c} className="bg-white/5 text-gray-400 text-[10px] font-mono px-2 py-0.5 rounded">{c} <span className="text-gray-600">(optional)</span></code>
            ))}
          </div>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold text-[#C9A84C] hover:text-yellow-300 transition-colors"
          >
            <MdDownload className="text-base" />
            Download Template (.xlsx)
          </button>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl px-8 py-14 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-white/15 hover:border-[#C9A84C]/40 hover:bg-white/[0.02]'
          }`}
        >
          <input {...getInputProps()} />
          <MdCloudUpload className={`text-5xl mx-auto mb-3 transition-colors ${isDragActive ? 'text-[#C9A84C]' : 'text-gray-600'}`} />
          <p className="font-montserrat font-semibold text-white text-sm mb-1">
            {isDragActive ? 'Drop the file here…' : 'Drag & drop your Excel file'}
          </p>
          <p className="font-montserrat text-xs text-gray-600">or click to browse — .xlsx / .xls accepted</p>
        </div>
      </div>
    )
  }

  // ── Preview table ──────────────────────────────────────────────────────
  const statusIcon = (r) => {
    if (r._status === 'imported')  return <MdCheckCircle className="text-emerald-400 text-base shrink-0" />
    if (r._status === 'failed')    return <MdError className="text-red-400 text-base shrink-0" />
    if (r._status === 'error')     return <MdWarning className="text-amber-400 text-base shrink-0" />
    if (r._status === 'duplicate') return <MdCheckCircle className="text-blue-400 text-base shrink-0" />
    return <MdCheckCircle className="text-emerald-400/40 text-base shrink-0" />
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <MdUploadFile className="text-gray-400 text-base" />
            <span className="font-montserrat text-xs text-gray-400">{fileName}</span>
          </div>
          <div className="flex gap-3 text-xs font-montserrat">
            <span className="text-emerald-400">{validRows.length} valid</span>
            {errorRows.length > 0 && <span className="text-amber-400">{errorRows.length} errors</span>}
            {duplicateRows.length > 0 && <span className="text-blue-400">{duplicateRows.length} duplicate{duplicateRows.length > 1 ? 's' : ''}</span>}
            {importedRows.length > 0 && <span className="text-emerald-400">{importedRows.length} imported</span>}
          </div>
        </div>
        <button onClick={reset} className="text-gray-600 hover:text-gray-300 transition-colors p-1">
          <MdClose className="text-base" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0A1628] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs font-montserrat">
            <thead className="sticky top-0 bg-[#0D1C35] border-b border-white/10">
              <tr>
                <th className="text-left px-3 py-2.5 text-gray-500 uppercase tracking-wider w-8">#</th>
                <th className="text-left px-3 py-2.5 text-gray-500 uppercase tracking-wider">Full Name</th>
                <th className="text-left px-3 py-2.5 text-gray-500 uppercase tracking-wider">D.O.B</th>
                <th className="text-left px-3 py-2.5 text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="text-left px-3 py-2.5 text-gray-500 uppercase tracking-wider">Class</th>
                <th className="text-left px-3 py-2.5 text-gray-500 uppercase tracking-wider">Guardian</th>
                <th className="text-left px-3 py-2.5 text-gray-500 uppercase tracking-wider">Reg #</th>
                <th className="text-left px-3 py-2.5 text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={`border-b border-white/5 ${row._status === 'error' ? 'bg-red-500/5' : row._status === 'imported' ? 'bg-emerald-500/5' : row._status === 'duplicate' ? 'bg-blue-500/5' : ''}`}>
                  <td className="px-3 py-2.5 text-gray-600">{i + 1}</td>
                  <td className="px-3 py-2.5 text-white">{row.fullName || <span className="text-red-400 italic">missing</span>}</td>
                  <td className="px-3 py-2.5 text-gray-400">{row.dateOfBirth}</td>
                  <td className="px-3 py-2.5 text-gray-400">{row.gender}</td>
                  <td className="px-3 py-2.5 text-gray-400">{row.class}</td>
                  <td className="px-3 py-2.5 text-gray-400">{row.guardianName}</td>
                  <td className="px-3 py-2.5 text-[#C9A84C] font-semibold">{row._regNumber || '—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {statusIcon(row)}
                      {row._status === 'error' && (
                        <span className="text-amber-400 text-[10px]" title={row._errors.join(', ')}>
                          {row._errors[0]}{row._errors.length > 1 ? ` +${row._errors.length - 1}` : ''}
                        </span>
                      )}
                      {row._status === 'imported'  && <span className="text-emerald-400">Imported</span>}
                      {row._status === 'valid'     && <span className="text-gray-500">Ready</span>}
                      {row._status === 'failed'    && <span className="text-red-400">Failed</span>}
                      {row._status === 'duplicate' && <span className="text-blue-400">Already uploaded</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action bar */}
      {!done && (
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-montserrat text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-xl transition-all"
          >
            Change File
          </button>
          {validRows.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex-1 bg-[#C9A84C] hover:bg-yellow-400 disabled:opacity-60 text-[#0A1628] font-montserrat text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <MdCloudUpload className="text-base" />
              {importing ? 'Importing…' : `Import ${validRows.length} Student${validRows.length > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}

      {done && (
        <button
          onClick={reset}
          className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-montserrat text-xs font-semibold uppercase tracking-wider py-3 rounded-xl transition-all"
        >
          Import Another File
        </button>
      )}
    </div>
  )
}
