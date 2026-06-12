import { useState } from 'react'
import Tesseract from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import { MdCloudUpload, MdCheckCircle } from 'react-icons/md'
import toast from 'react-hot-toast'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href

const INPUT    = 'w-full bg-white/5 border border-white/10 focus:border-[#C9A84C]/50 focus:outline-none rounded-xl px-4 py-3 text-white font-montserrat text-sm placeholder-gray-600 transition-all'
const INPUT_RO = 'w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-white font-montserrat text-sm transition-all cursor-not-allowed opacity-70'
const LABEL    = 'block text-[10px] font-semibold uppercase tracking-widest text-gray-500 font-montserrat mb-1.5'
const CARD     = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'

function extractAmount(text) {
  const patterns = [
    /(?:USD|US\$|\$|ZWL|ZWG|R)\s*(\d{1,6}(?:[.,]\d{2})?)/gi,
    /(\d{1,6}(?:[.,]\d{2}))\s*(?:USD|ZWL|ZWG)/gi,
    /(?:amount|paid|total|value|payment)[^\d]{0,10}(\d{1,6}(?:[.,]\d{2})?)/gi,
  ]
  const found = []
  for (const pat of patterns) {
    let m
    pat.lastIndex = 0
    while ((m = pat.exec(text)) !== null) {
      const val = parseFloat(m[1].replace(',', '.'))
      if (val > 0 && val < 500000) found.push(val)
    }
  }
  return found.length ? Math.max(...found) : null
}

async function ocrImage(source) {
  const { data: { text } } = await Tesseract.recognize(source, 'eng', { logger: () => {} })
  return text
}

async function pdfToCanvas(file) {
  const buffer = await file.arrayBuffer()
  const pdf    = await pdfjsLib.getDocument({ data: buffer }).promise
  const page   = await pdf.getPage(1)
  const vp     = page.getViewport({ scale: 2.5 })
  const canvas = document.createElement('canvas')
  canvas.width  = vp.width
  canvas.height = vp.height
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
  return canvas
}

export default function StudentUploadPOP() {
  const { studentData, portalSettings } = useStudent()
  const [file,       setFile]       = useState(null)
  const [amount,     setAmount]     = useState('')
  const [amountSrc,  setAmountSrc]  = useState(null)  // 'ocr' | null
  const [extracting, setExtracting] = useState(false)
  const [date,       setDate]       = useState(new Date().toISOString().split('T')[0])
  const [method,     setMethod]     = useState('bank')
  const [reference,  setReference]  = useState('')
  const [notes,      setNotes]      = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [done,       setDone]       = useState(false)

  const handleFileChange = async (e) => {
    const selected = e.target.files[0]
    if (!selected) return
    setFile(selected)
    setAmount('')
    setAmountSrc(null)
    setExtracting(true)

    try {
      let text = ''
      if (selected.type === 'application/pdf') {
        const canvas = await pdfToCanvas(selected)
        text = await ocrImage(canvas)
      } else {
        text = await ocrImage(selected)
      }
      const extracted = extractAmount(text)
      if (extracted !== null) {
        setAmount(extracted.toFixed(2))
        setAmountSrc('ocr')
      }
    } catch {
      // OCR failed silently
    }
    setExtracting(false)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Select a file to upload')
    if (!studentData?.studentId) return

    setUploading(true)
    try {
      const storageRef = ref(storage, `proofOfPayments/${studentData.studentId}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      await addDoc(collection(db, 'proofOfPayments'), {
        studentId:    studentData.studentId,
        studentName:  studentData.name || '',
        class:        studentData.class || '',
        fileUrl:      url,
        fileName:     file.name,
        amount:       amount ? Number(amount) : null,
        amountSource: amountSrc,
        date,
        method,
        reference,
        notes,
        term:         portalSettings.currentTerm,
        status:       'pending',
        uploadedAt:   serverTimestamp(),
      })

      setDone(true)
      toast.success('Proof of payment uploaded successfully')
    } catch (err) {
      console.error(err)
      toast.error('Upload failed. Please try again.')
    }
    setUploading(false)
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-5">
          <MdCheckCircle className="text-emerald-400 text-4xl" />
        </div>
        <h2 className="font-playfair text-2xl font-bold text-white mb-2">Upload Successful</h2>
        <p className="text-gray-400 font-montserrat text-sm mb-6">
          Your proof of payment has been submitted. The bursar will review and update your account within 1 business day.
        </p>
        <button
          onClick={() => setDone(false)}
          className="bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1628] font-montserrat font-bold text-sm px-6 py-3 rounded-xl transition"
        >
          Upload another
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleUpload} className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-2">Upload Proof of Payment</h3>
        <p className="text-xs text-gray-500 font-montserrat mb-6">
          Upload a bank receipt, mobile money confirmation, or any payment proof. Accepted: JPG, PNG, PDF.
        </p>

        {/* File drop area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-4 ${
            file ? 'border-[#C9A84C]/50 bg-[#C9A84C]/5' : 'border-white/10 hover:border-white/20'
          }`}
          onClick={() => document.getElementById('pop-file').click()}
        >
          <MdCloudUpload className={`text-4xl mx-auto mb-2 ${file ? 'text-[#C9A84C]' : 'text-gray-600'}`} />
          <p className="text-sm font-montserrat text-gray-400">
            {file ? file.name : 'Click to select file'}
          </p>
          {file && <p className="text-xs text-gray-600 font-montserrat mt-1">{(file.size / 1024).toFixed(0)} KB</p>}
          <input id="pop-file" type="file" accept="image/*,.pdf" className="hidden"
            onChange={handleFileChange} />
        </div>

        <div className="grid grid-cols-2 gap-4">

          {/* Amount — system-filled, read-only */}
          <div>
            <label className={LABEL}>Amount Paid ($)</label>
            {extracting ? (
              <div className={`${INPUT_RO} flex items-center gap-2`}>
                <span className="w-3.5 h-3.5 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-gray-500 text-xs">Reading receipt…</span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={amount ? `$${amount}` : '—'}
                  className={INPUT_RO}
                />
                {amountSrc === 'ocr' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-semibold uppercase tracking-widest text-[#C9A84C] font-montserrat">
                    Auto-detected
                  </span>
                )}
              </div>
            )}
            {file && !extracting && !amount && (
              <p className="text-[10px] text-amber-500/80 font-montserrat mt-1">
                Amount not detected — bursar will confirm on review.
              </p>
            )}
          </div>

          <div>
            <label className={LABEL}>Payment Date</label>
            <input type="date" value={date}
              onChange={e => setDate(e.target.value)} className={INPUT} />
          </div>

          <div className="col-span-2">
            <label className={LABEL}>Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className={INPUT}>
              <option value="bank">Bank Transfer</option>
              <option value="mobile">Mobile Money (EcoCash)</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className={LABEL}>Transaction Reference (optional)</label>
            <input value={reference} onChange={e => setReference(e.target.value)}
              placeholder="Bank ref / EcoCash transaction ID" className={INPUT} />
          </div>

          <div className="col-span-2">
            <label className={LABEL}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="Any additional notes…" className={`${INPUT} resize-none`} />
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading || !file || extracting}
          className="w-full mt-5 py-3 rounded-xl text-sm font-semibold font-montserrat text-[#0A1628] bg-[#C9A84C] hover:bg-yellow-400 transition disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : extracting ? 'Reading receipt…' : 'Submit Proof of Payment'}
        </button>
      </form>
    </div>
  )
}
