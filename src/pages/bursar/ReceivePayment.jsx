import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, getDocs, query, where, doc,
  updateDoc, addDoc, serverTimestamp, getDoc, orderBy, limit,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const TEAL  = '#0F6E56'
const INPUT = 'w-full bg-white/5 border border-white/10 focus:border-[#0F6E56]/50 focus:outline-none rounded-xl px-4 py-3 text-white font-montserrat text-sm placeholder-gray-600 transition-all'
const LABEL = 'block text-[10px] font-semibold uppercase tracking-widest text-gray-500 font-montserrat mb-1.5'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'

function getBursarSession() {
  try { return JSON.parse(sessionStorage.getItem('bursarSession') || '{}') } catch { return {} }
}

async function getNextReceiptNumber() {
  const snap = await getDocs(query(collection(db, 'receipts'), orderBy('issuedAt', 'desc'), limit(1)))
  if (snap.empty) return `RCP-${new Date().getFullYear()}-0001`
  const last = snap.docs[0].data().receiptNumber || ''
  const parts = last.split('-')
  const num = parseInt(parts[parts.length - 1] || '0', 10) + 1
  return `RCP-${new Date().getFullYear()}-${String(num).padStart(4, '0')}`
}

export default function ReceivePayment() {
  const navigate  = useNavigate()
  const session   = getBursarSession()

  const [search,    setSearch]   = useState('')
  const [students,  setStudents] = useState([])
  const [selected,  setSelected] = useState(null)
  const [account,   setAccount]  = useState(null)
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done,      setDone]     = useState(null) // receipt number on success

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    amount: '', date: today, method: 'cash', bankRef: '', mobileRef: '', notes: '',
  })

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const [byName, byId] = await Promise.all([
        getDocs(query(collection(db, 'students'), where('name', '>=', search.trim()), where('name', '<=', search.trim() + ''), limit(10))),
        getDocs(query(collection(db, 'students'), where('regNumber', '==', search.trim()), limit(5))),
      ])
      const merged = new Map()
      ;[...byName.docs, ...byId.docs].forEach(d => merged.set(d.id, { id: d.id, ...d.data() }))
      setStudents([...merged.values()])
    } catch {
      toast.error('Search failed')
    }
    setSearching(false)
  }

  const handleSelect = async (student) => {
    setSelected(student)
    setStudents([])
    setSearch(student.name || student.regNumber)
    try {
      const snap = await getDocs(query(collection(db, 'feeAccounts'), where('studentId', '==', student.id), limit(1)))
      setAccount(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() })
    } catch {
      setAccount(null)
    }
  }

  const fmt = v => `$${Number(v || 0).toLocaleString()}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected)           return toast.error('Please select a student')
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return toast.error('Enter a valid amount')

    setSubmitting(true)
    try {
      const receiptNum = await getNextReceiptNumber()
      const amount     = Number(form.amount)
      const paymentObj = {
        amount,
        date:          form.date,
        method:        form.method,
        reference:     form.method === 'bank' ? form.bankRef : form.method === 'mobile' ? form.mobileRef : '',
        receiptNumber: receiptNum,
        recordedAt:    new Date().toISOString(),
      }

      /* update feeAccounts document */
      if (account) {
        const acctRef   = doc(db, 'feeAccounts', account.id)
        const payments  = [...(account.payments || []), paymentObj]
        const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)
        const balance   = Math.abs((account.termFees || 0) - totalPaid)
        const balanceType = totalPaid >= (account.termFees || 0) ? (totalPaid > (account.termFees || 0) ? 'credit' : 'nil') : 'debit'
        await updateDoc(acctRef, { payments, totalPaid, balance, balanceType })
      }

      /* create receipt */
      await addDoc(collection(db, 'receipts'), {
        receiptNumber: receiptNum,
        studentId:     selected.id,
        studentName:   selected.name || '',
        class:         selected.class || selected.form || '',
        amount,
        paymentMethod: form.method,
        reference:     paymentObj.reference,
        notes:         form.notes,
        term:          'Term 2',
        issuedAt:      serverTimestamp(),
        issuedBy:      session.name || 'Bursar',
      })

      setDone(receiptNum)
      toast.success(`Receipt ${receiptNum} issued`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save payment')
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto">
        <div className={`${CARD} text-center`}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${TEAL}22` }}>
            <span className="text-3xl" style={{ color: TEAL }}>✓</span>
          </div>
          <h2 className="font-playfair text-2xl font-bold text-white mb-1">Payment Received</h2>
          <p className="font-montserrat text-gray-400 text-sm mb-2">
            Receipt <span className="text-white font-semibold">{done}</span> issued for <span className="text-white">{selected?.name}</span>
          </p>
          <p className="font-montserrat text-gray-400 text-sm mb-6">Amount: <span style={{ color: TEAL }} className="font-bold">{fmt(form.amount)}</span></p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/bursar/issue-receipt')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold font-montserrat text-white border border-white/20 hover:bg-white/5 transition"
            >
              Print receipt
            </button>
            <button
              onClick={() => { setDone(null); setSelected(null); setAccount(null); setSearch(''); setForm({ amount: '', date: today, method: 'cash', bankRef: '', mobileRef: '', notes: '' }) }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold font-montserrat text-white transition"
              style={{ backgroundColor: TEAL }}
            >
              Receive another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Student search */}
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-4">Find Student</h3>
        <div className="flex gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name or registration number…"
            className={`${INPUT} flex-1`}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-5 py-3 rounded-xl text-sm font-semibold font-montserrat text-white transition shrink-0"
            style={{ backgroundColor: TEAL }}
          >
            {searching ? '…' : 'Search'}
          </button>
        </div>

        {/* Results dropdown */}
        {students.length > 0 && (
          <div className="mt-2 border border-white/10 rounded-xl overflow-hidden">
            {students.map(s => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition"
              >
                <p className="text-sm text-white font-montserrat">{s.name}</p>
                <p className="text-xs text-gray-500 font-montserrat">{s.regNumber} · {s.class || s.form || '—'}</p>
              </button>
            ))}
          </div>
        )}

        {/* Selected student + balance */}
        {selected && (
          <div className="mt-4 p-4 rounded-xl border border-[#0F6E56]/30 bg-[#0F6E56]/5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-semibold font-montserrat">{selected.name}</p>
                <p className="text-xs text-gray-400 font-montserrat">{selected.regNumber} · {selected.class || selected.form || '—'}</p>
              </div>
              {account && (
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-montserrat uppercase tracking-widest">Balance</p>
                  <p className={`font-bold font-montserrat text-lg ${account.balanceType === 'debit' ? 'text-red-400' : account.balanceType === 'credit' ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {account.balanceType === 'debit' ? '-' : account.balanceType === 'credit' ? '+' : ''}{fmt(account.balance || 0)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment form */}
      <form onSubmit={handleSubmit} className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-5">Payment Details</h3>
        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className={LABEL}>Amount ($)</label>
            <input
              type="number" min="0.01" step="0.01"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Payment Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className={INPUT}
            />
          </div>

          <div className="col-span-2">
            <label className={LABEL}>Payment Method</label>
            <select
              value={form.method}
              onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
              className={INPUT}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank transfer</option>
              <option value="mobile">Mobile money</option>
            </select>
          </div>

          {form.method === 'bank' && (
            <div className="col-span-2">
              <label className={LABEL}>Bank Reference Number</label>
              <input
                value={form.bankRef}
                onChange={e => setForm(f => ({ ...f, bankRef: e.target.value }))}
                placeholder="e.g. TRF-20250529-001"
                className={INPUT}
              />
            </div>
          )}

          {form.method === 'mobile' && (
            <div className="col-span-2">
              <label className={LABEL}>Mobile Money Reference</label>
              <input
                value={form.mobileRef}
                onChange={e => setForm(f => ({ ...f, mobileRef: e.target.value }))}
                placeholder="e.g. EcoCash transaction ID"
                className={INPUT}
              />
            </div>
          )}

          <div className="col-span-2">
            <label className={LABEL}>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Any additional notes…"
              className={`${INPUT} resize-none`}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/bursar/dashboard')}
            className="flex-1 py-3 rounded-xl text-sm font-semibold font-montserrat text-gray-400 border border-white/10 hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selected}
            className="flex-1 py-3 rounded-xl text-sm font-semibold font-montserrat text-white transition disabled:opacity-50"
            style={{ backgroundColor: TEAL }}
          >
            {submitting ? 'Saving…' : 'Confirm & Issue Receipt'}
          </button>
        </div>
      </form>
    </div>
  )
}
