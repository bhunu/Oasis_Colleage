import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import toast from 'react-hot-toast'

const TEAL  = '#0F6E56'
const INPUT = 'w-full bg-white/5 border border-white/10 focus:border-[#0F6E56]/50 focus:outline-none rounded-xl px-4 py-3 text-white font-montserrat text-sm placeholder-gray-600 transition-all'
const LABEL = 'block text-[10px] font-semibold uppercase tracking-widest text-gray-500 font-montserrat mb-1.5'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'

const CATEGORIES = ['Salaries', 'Utilities', 'Maintenance', 'Supplies & Stationery', 'Transport', 'Events', 'Other']

function getBursarSession() {
  try { return JSON.parse(sessionStorage.getItem('bursarSession') || '{}') } catch { return {} }
}

export default function RecordExpense() {
  const navigate = useNavigate()
  const session  = getBursarSession()
  const today    = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    description: '', category: 'Utilities', amount: '',
    date: today, paymentMethod: 'cash', reference: '', notes: '',
  })
  const [file,       setFile]       = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description) return toast.error('Enter a description')
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return toast.error('Enter a valid amount')

    setSubmitting(true)
    try {
      let receiptImageUrl = ''
      if (file) {
        const storageRef = ref(storage, `expenses/receipts/${Date.now()}_${file.name}`)
        await uploadBytes(storageRef, file)
        receiptImageUrl = await getDownloadURL(storageRef)
      }
      await addDoc(collection(db, 'expenses'), {
        description:   form.description,
        category:      form.category,
        amount:        Number(form.amount),
        date:          form.date,
        paymentMethod: form.paymentMethod,
        reference:     form.reference,
        receiptImageUrl,
        term:          'Term 2',
        notes:         form.notes,
        recordedAt:    serverTimestamp(),
        recordedBy:    session.name || 'Bursar',
      })
      toast.success('Expense recorded')
      navigate('/bursar/budget')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save expense')
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-6">Expense Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={LABEL}>Description</label>
            <input
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="e.g. Electricity bill – May 2025"
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={INPUT}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className={LABEL}>Amount ($)</label>
            <input
              type="number" min="0.01" step="0.01"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              placeholder="0.00"
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Payment Method</label>
            <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)} className={INPUT}>
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className={LABEL}>Reference / Invoice Number</label>
            <input
              value={form.reference}
              onChange={e => set('reference', e.target.value)}
              placeholder="e.g. INV-2025-0042"
              className={INPUT}
            />
          </div>

          <div className="col-span-2">
            <label className={LABEL}>Upload Receipt Image (optional)</label>
            <div
              className="border-2 border-dashed border-white/10 hover:border-[#0F6E56]/40 rounded-xl p-6 text-center cursor-pointer transition"
              onClick={() => document.getElementById('receipt-file').click()}
            >
              <p className="text-sm text-gray-500 font-montserrat">
                {file ? file.name : 'Click to upload receipt image (JPG, PNG, PDF)'}
              </p>
              <input
                id="receipt-file"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => setFile(e.target.files[0] || null)}
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className={LABEL}>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Any additional notes…"
              className={`${INPUT} resize-none`}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={() => navigate('/bursar/budget')}
            className="flex-1 py-3 rounded-xl text-sm font-semibold font-montserrat text-gray-400 border border-white/10 hover:bg-white/5 transition">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 py-3 rounded-xl text-sm font-semibold font-montserrat text-white transition disabled:opacity-50"
            style={{ backgroundColor: TEAL }}>
            {submitting ? 'Saving…' : 'Save Expense'}
          </button>
        </div>
      </form>
    </div>
  )
}
