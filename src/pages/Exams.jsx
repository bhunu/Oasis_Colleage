import { useState, useCallback } from 'react'
import { getCurrentTerm } from '../utils/termHelpers'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { db } from '../firebase/config'
import { doc, writeBatch, serverTimestamp, getDocs, collection, query, where } from 'firebase/firestore'
import toast from 'react-hot-toast'
import {
  MdCloudUpload, MdUploadFile, MdCheckCircle, MdError,
  MdWarning, MdClose, MdVisibility, MdDownload,
} from 'react-icons/md'
import { FaGraduationCap } from 'react-icons/fa'

// ── Constants ─────────────────────────────────────────────────────────────
const SCHOOL_ID = 'oasis'

const CLASSES = [
  'Form 1A','Form 1B','Form 1C',
  'Form 2A','Form 2B','Form 2C',
  'Form 3A','Form 3B','Form 3C',
  'Form 4A','Form 4B','Form 4C',
  'Lower 6 Commercials','Lower 6 Arts','Lower 6 Sciences',
  'Upper 6 Commercials','Upper 6 Arts','Upper 6 Sciences',
]

const { number, year } = getCurrentTerm()
const TERMS = [`Term ${number} ${year}`]

// Reserved columns that are NOT subjects
const NON_SUBJECT = new Set(['regno', 'name', 'comment'])

// ── Helpers ───────────────────────────────────────────────────────────────
function toTermId(term) {
  return term.toLowerCase().replace(/\s+/g, '-')          // "term-2-2025"
}
function toClassId(cls) {
  return cls.toLowerCase().replace(/\s+/g, '-')           // "form-1a"
}

function validateRow(row, subjectCols) {
  const errors = []
  if (!row.regNo?.trim()) errors.push('Reg number missing')
  for (const col of subjectCols) {
    const raw = row.subjects[col]
    if (raw === '' || raw === null || raw === undefined) continue
    const n = Number(raw)
    if (isNaN(n) || n < 0 || n > 100)
      errors.push(`${col}: "${raw}" is not 0–100`)
  }
  return errors
}

// Parse PapaParse result into structured rows + detect subject columns
function parseCSV(results) {
  const raw     = results.data
  if (!raw.length) return { rows: [], subjectCols: [] }

  // Normalise header keys: lowercase + trim
  const headers   = Object.keys(raw[0]).map(h => h.trim())
  const subjectCols = headers.filter(h => !NON_SUBJECT.has(h.toLowerCase()))
    .filter(h => {
      const lo = h.toLowerCase()
      return lo !== 'regno' && lo !== 'comment'
    })

  const rows = raw.map((r, idx) => {
    // Normalise key access (case-insensitive)
    const get = (key) => {
      const found = Object.entries(r).find(([k]) => k.trim().toLowerCase() === key)
      return found ? String(found[1] ?? '').trim() : ''
    }

    const subjects = {}
    for (const col of subjectCols) {
      const raw = Object.entries(r).find(([k]) => k.trim() === col)
      subjects[col] = raw ? String(raw[1] ?? '').trim() : ''
    }

    const row = {
      _idx:    idx + 2,          // 1-based row number in the CSV (row 1 = header)
      regNo:   get('regno'),
      comment: get('comment'),
      subjects,
    }
    row._errors = validateRow(row, subjectCols)
    row._valid  = row._errors.length === 0
    return row
  }).filter(r => r.regNo)  // drop completely blank rows

  return { rows, subjectCols }
}

// Split array into chunks of size n
function chunks(arr, n) {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}


// ── Shared style shortcuts ────────────────────────────────────────────────
const sInput  = 'w-full bg-white/5 border border-white/10 focus:border-[#C9A84C]/50 focus:outline-none rounded-xl px-4 py-2.5 text-white font-montserrat text-sm placeholder-gray-600 transition-all'
const sLabel  = 'block text-[11px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1.5'
const GOLD    = '#C9A84C'
const NAVY    = '#0A1628'
const CARD    = '#0D1C35'

// ── Main component ────────────────────────────────────────────────────────
export default function Exams() {
  const [teacher, setTeacher]       = useState('')
  const [className, setClassName]   = useState('')
  const [term, setTerm]             = useState(TERMS[0])
  const [fileName, setFileName]     = useState('')
  const [parsed, setParsed]         = useState(null)   // { rows, subjectCols }
  const [verifying, setVerifying]   = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState('')
  const [uploadDone, setUploadDone] = useState(false)
  const [formErr, setFormErr]       = useState('')

  // ── Dropzone ─────────────────────────────────────────────────────────────
  const onDrop = useCallback((accepted) => {
    const file = accepted[0]
    if (!file) return
    setFileName(file.name)
    setParsed(null)
    setUploadDone(false)

    Papa.parse(file, {
      header:          true,
      skipEmptyLines:  true,
      transformHeader: h => h.trim(),
      complete: async (results) => {
        const { rows, subjectCols } = parseCSV(results)
        if (rows.length === 0) { toast.error('No data rows found in the CSV.'); return }

        // ── Verify every regNo against the students table ─────────────────
        setVerifying(true)
        try {
          const snap = await getDocs(query(collection(db, 'students')))
          const registered = new Set(snap.docs.map(d => d.data().reg_number).filter(Boolean))

          const verified = rows.map(row => {
            const errs = [...row._errors]
            if (row.regNo && !registered.has(row.regNo.trim())) {
              errs.push(`"${row.regNo}" not found in students table`)
            }
            return { ...row, _errors: errs, _valid: errs.length === 0 }
          })

          setParsed({ rows: verified, subjectCols })
        } catch {
          toast.error('Could not verify reg numbers against the students table.')
          setParsed({ rows, subjectCols }) // fall back to unverified preview
        } finally {
          setVerifying(false)
        }
      },
      error: () => toast.error('Could not parse the CSV file.'),
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:   { 'text/csv': ['.csv'], 'text/plain': ['.csv'] },
    multiple: false,
  })

  // ── Upload to Firestore ───────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!teacher.trim())  return setFormErr('Enter teacher name.')
    if (!className)       return setFormErr('Select a class.')
    if (!term)            return setFormErr('Select a term.')
    if (!parsed)          return setFormErr('Upload and preview a CSV first.')
    setFormErr('')

    const validRows = parsed.rows.filter(r => r._valid)
    if (validRows.length === 0) {
      toast.error('No valid rows to upload.')
      return
    }

    const termId  = toTermId(term)
    const classId = toClassId(className)
    const basePath = `schools/${SCHOOL_ID}/terms/${termId}/classes/${classId}/students`

    setUploading(true)
    setProgress(`Preparing ${validRows.length} records…`)

    try {
      const batches = chunks(validRows, 499)
      let uploaded  = 0
      const failedRows = []

      for (let bi = 0; bi < batches.length; bi++) {
        const batch = writeBatch(db)
        for (const row of batches[bi]) {
          const subjects = {}
          for (const [col, val] of Object.entries(row.subjects)) {
            subjects[col] = val === '' ? null : Number(val)
          }
          const ref = doc(db, basePath, row.regNo.trim())
          batch.set(ref, {
            regNo:      row.regNo.trim(),
            className,
            term,
            subjects,
            comment:    row.comment || '',
            uploadedBy: teacher.trim(),
            uploadedAt: serverTimestamp(),
          }, { merge: true })
        }

        try {
          await batch.commit()
          uploaded += batches[bi].length
          setProgress(`Uploading ${uploaded} of ${validRows.length} records…`)
        } catch {
          batches[bi].forEach(r => failedRows.push(r._idx))
        }
      }

      if (failedRows.length === 0) {
        toast.success(`${uploaded} records saved to ${className} — ${term}`)
        setUploadDone(true)
        setProgress('')
      } else {
        toast.error(`Failed rows: ${failedRows.join(', ')}`)
        setProgress(`${uploaded} saved, ${failedRows.length} failed.`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Upload failed. Check your connection and try again.')
      setProgress('')
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setParsed(null); setFileName(''); setUploadDone(false); setProgress('')
  }

  const [downloading, setDownloading] = useState(false)

  const handleDownloadTemplate = async () => {
    if (!className) { toast.error('Select a class first.'); return }
    setDownloading(true)
    try {
      const [studentsSnap, subjectsSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(query(collection(db, 'subjects'), where('classes', 'array-contains', className))),
      ])

      const students = studentsSnap.docs
        .map(d => d.data())
        .filter(s => s.class === className)
        .sort((a, b) => (a.reg_number || '').localeCompare(b.reg_number || ''))

      const subjects = subjectsSnap.docs
        .map(d => d.data().name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))

      if (subjects.length === 0) {
        toast('No subjects assigned to this class yet — add subjects in the Subjects page first.', { icon: '⚠️' })
      }

      const header    = ['regNo', 'name', ...subjects, 'comment'].join(',')
      const emptyCols = subjects.map(() => '').join(',')
      const rows = students.length
        ? students.map(s => `${s.reg_number || ''},"${s.name || s.fullName || ''}",${emptyCols},`)
        : [`R26001,"Student Name",${emptyCols},`]

      const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `${className.replace(/\s+/g, '_')}_marks_template.csv`
      a.click()
      URL.revokeObjectURL(url)

      if (students.length === 0) toast('No students found for this class — blank template downloaded.', { icon: '⚠️' })
    } catch {
      toast.error('Failed to generate template.')
    } finally {
      setDownloading(false)
    }
  }

  const validCount = parsed ? parsed.rows.filter(r => r._valid).length : 0
  const errorCount = parsed ? parsed.rows.filter(r => !r._valid).length : 0
  const canUpload  = parsed && validCount > 0 && errorCount === 0 && !uploading && !uploadDone

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Upload form card ─────────────────────────────────────────────── */}
      <div className={`bg-[${CARD}] bg-[#0D1C35] border border-white/10 rounded-2xl p-8`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C9A84C]/15 rounded-lg flex items-center justify-center">
              <FaGraduationCap className="text-[#C9A84C]" />
            </div>
            <div>
              <h2 className="font-playfair text-xl font-bold text-white leading-tight">End of Term Marks Upload</h2>
              <p className="font-montserrat text-[11px] text-gray-500 uppercase tracking-wider">Oasis Private College · CSV batch upload</p>
            </div>
          </div>
          <button
            onClick={handleDownloadTemplate}
            disabled={downloading}
            className="flex items-center gap-1.5 text-xs font-montserrat font-semibold text-[#C9A84C] hover:text-yellow-300 disabled:opacity-50 transition-colors"
          >
            <MdDownload className="text-base" />
            {downloading ? 'Downloading…' : 'Download Template'}
          </button>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className={sLabel}>Teacher Name *</label>
            <input type="text" value={teacher} onChange={e => setTeacher(e.target.value)}
              placeholder="e.g. Mr. Mabhunu" className={sInput} />
          </div>
          <div>
            <label className={sLabel}>Class *</label>
            <select value={className} onChange={e => setClassName(e.target.value)} className={sInput}>
              <option value="">Select class…</option>
              {CLASSES.map(c => <option key={c} value={c} className="bg-[#0D1C35]">{c}</option>)}
            </select>
          </div>
          <div>
            <label className={sLabel}>Term *</label>
            <select value={term} onChange={e => setTerm(e.target.value)} className={sInput}>
              <option value="">Select term…</option>
              {TERMS.map(t => <option key={t} value={t} className="bg-[#0D1C35]">{t}</option>)}
            </select>
          </div>
        </div>

        {/* Dropzone */}
        {!parsed && !verifying ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl px-8 py-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                : 'border-white/15 hover:border-[#C9A84C]/40 hover:bg-white/[0.02]'
            }`}
          >
            <input {...getInputProps()} />
            <MdCloudUpload className={`text-5xl mx-auto mb-3 transition-colors ${isDragActive ? 'text-[#C9A84C]' : 'text-gray-600'}`} />
            <p className="font-montserrat font-semibold text-white text-sm mb-1">
              {isDragActive ? 'Drop your CSV here…' : 'Drag & drop a CSV file'}
            </p>
            <p className="font-montserrat text-xs text-gray-600">or click to browse — .csv files only</p>
            <p className="font-montserrat text-[10px] text-gray-700 mt-3">
              Required columns: <span className="text-gray-500">regNo, [subjects…], comment (optional)</span>
            </p>
          </div>
        ) : verifying ? (
          <div className="border-2 border-dashed border-[#C9A84C]/30 rounded-xl px-8 py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A84C] mb-4" />
            <p className="font-montserrat text-sm text-white font-semibold mb-1">Verifying registration numbers…</p>
            <p className="font-montserrat text-xs text-gray-500">Checking each reg number against the students table</p>
          </div>
        ) : (
          <div className={`flex items-center justify-between bg-white/5 border ${uploadDone ? 'border-emerald-500/30' : 'border-white/10'} rounded-xl px-5 py-3`}>
            <div className="flex items-center gap-3">
              {uploadDone
                ? <MdCheckCircle className="text-emerald-400 text-xl" />
                : <MdUploadFile className="text-[#C9A84C] text-xl" />}
              <div>
                <p className="font-montserrat text-sm text-white font-semibold">{fileName}</p>
                <p className="font-montserrat text-[11px] text-gray-500">
                  {parsed.rows.length} rows · {validCount} valid
                  {errorCount > 0 && <span className="text-amber-400 ml-1">· {errorCount} errors</span>}
                  {uploadDone && <span className="text-emerald-400 ml-1">· Uploaded ✓</span>}
                </p>
              </div>
            </div>
            <button onClick={reset} className="text-gray-600 hover:text-gray-300 transition-colors p-1">
              <MdClose className="text-base" />
            </button>
          </div>
        )}

        {/* Error / progress */}
        {formErr && (
          <p className="font-montserrat text-xs text-red-400 mt-3">{formErr}</p>
        )}
        {progress && (
          <p className="font-montserrat text-xs text-[#C9A84C] mt-3 animate-pulse">{progress}</p>
        )}

        {/* Action buttons */}
        {parsed && !uploadDone && (
          <div className="flex gap-3 mt-5">
            <button
              onClick={reset}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-montserrat text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-xl transition-all"
            >
              Change File
            </button>
            <button
              onClick={handleUpload}
              disabled={!canUpload}
              className="flex-1 bg-[#C9A84C] hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-[#0A1628] font-montserrat text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-[#C9A84C]/20 transition-all flex items-center justify-center gap-2"
            >
              <MdCloudUpload className="text-base" />
              {uploading ? progress || 'Uploading…' : `Upload ${validCount} Record${validCount !== 1 ? 's' : ''} to Firebase`}
            </button>
          </div>
        )}

        {uploadDone && (
          <button
            onClick={() => { reset(); setTeacher(''); setClassName(''); setTerm('') }}
            className="mt-5 w-full bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-montserrat text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all"
          >
            Upload Another File
          </button>
        )}
      </div>

      {/* ── Preview table ─────────────────────────────────────────────────── */}
      {parsed && (
        <div className="bg-[#0D1C35] border border-white/10 rounded-2xl overflow-hidden">

          {/* Table header bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <MdVisibility className="text-gray-500 text-sm" />
                <span className="font-montserrat text-sm font-semibold text-white">Preview</span>
              </div>
              <div className="flex gap-3 text-xs font-montserrat">
                <span className="flex items-center gap-1 text-emerald-400">
                  <MdCheckCircle className="text-sm" />{validCount} valid
                </span>
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <MdWarning className="text-sm" />{errorCount} error{errorCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            {errorCount > 0 && (
              <p className="font-montserrat text-[11px] text-amber-400">
                Fix all errors before uploading
              </p>
            )}
          </div>

          {/* Scrollable table */}
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-xs font-montserrat">
              <thead className="sticky top-0 bg-[#0A1628] border-b border-white/10 z-10">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-4 py-3 text-gray-500 uppercase tracking-wider">Reg No</th>
                  {parsed.subjectCols.map(col => (
                    <th key={col} className="text-center px-3 py-3 text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 text-gray-500 uppercase tracking-wider">Comment</th>
                  <th className="text-left px-4 py-3 text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsed.rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-white/5 transition-colors ${
                      !row._valid ? 'bg-red-500/8 hover:bg-red-500/12' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-600">{row._idx}</td>
                    <td className={`px-4 py-3 font-mono font-semibold ${row.regNo ? 'text-[#C9A84C]' : 'text-red-400 italic'}`}>
                      {row.regNo || 'missing'}
                    </td>
                    {parsed.subjectCols.map(col => {
                      const val = row.subjects[col]
                      const n   = Number(val)
                      const bad = val !== '' && val !== undefined && (isNaN(n) || n < 0 || n > 100)
                      return (
                        <td key={col} className={`px-3 py-3 text-center font-semibold ${bad ? 'text-red-400' : val ? 'text-white' : 'text-gray-600'}`}>
                          {val === '' || val === undefined ? '—' : val}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-gray-400 max-w-[140px] truncate">{row.comment || '—'}</td>
                    <td className="px-4 py-3">
                      {row._valid ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <MdCheckCircle className="text-sm" /> OK
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400" title={row._errors.join(', ')}>
                          <MdError className="text-sm" />
                          {row._errors[0]}{row._errors.length > 1 ? ` +${row._errors.length - 1}` : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
