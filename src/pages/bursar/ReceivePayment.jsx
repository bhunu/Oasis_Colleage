import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, getDocs, query, where, doc,
  updateDoc, addDoc, serverTimestamp, orderBy, limit,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'

const TEAL  = '#0F6E56'
const INPUT = 'w-full bg-white/5 border border-white/10 focus:border-[#0F6E56]/50 focus:outline-none rounded-xl px-4 py-3 text-white font-montserrat text-sm placeholder-gray-600 transition-all'
const LABEL = 'block text-[10px] font-semibold uppercase tracking-widest text-gray-500 font-montserrat mb-1.5'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'

const METHOD_LABEL = { cash: 'Cash', bank: 'Bank Transfer', mobile: 'Mobile Money' }

function getBursarSession() {
  try { return JSON.parse(sessionStorage.getItem('bursarSession') || '{}') } catch { return {} }
}

function fmt(v) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

function formatDate(ts) {
  if (!ts) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function getNextReceiptNumber() {
  const snap = await getDocs(query(collection(db, 'receipts'), orderBy('issuedAt', 'desc'), limit(1)))
  if (snap.empty) return `RCP-${new Date().getFullYear()}-0001`
  const last  = snap.docs[0].data().receiptNumber || ''
  const parts = last.split('-')
  const num   = parseInt(parts[parts.length - 1] || '0', 10) + 1
  return `RCP-${new Date().getFullYear()}-${String(num).padStart(4, '0')}`
}

export default function ReceivePayment() {
  const navigate   = useNavigate()
  const session    = getBursarSession()

  const [search,      setSearch]     = useState('')
  const [students,    setStudents]   = useState([])
  const [selected,    setSelected]   = useState(null)
  const [account,     setAccount]    = useState(null)
  const [searching,   setSearching]  = useState(false)
  const [submitting,  setSubmitting] = useState(false)
  const [receiptData, setReceiptData] = useState(null)   // set on success

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    amount: '', date: today, method: 'cash', bankRef: '', mobileRef: '', notes: '',
  })

  const handleSearch = async () => {
    const term = search.trim()
    if (!term) return
    setSearching(true)
    setStudents([])
    try {
      // Auto-prepend R when user types only digits (e.g. "262681" → "R262681")
      const regTerm = /^\d+$/.test(term) ? 'R' + term : term.toUpperCase()
      const [byName, byReg] = await Promise.all([
        getDocs(query(
          collection(db, 'students'),
          where('fullName', '>=', term),
          where('fullName', '<=', term + ''),
          limit(10)
        )),
        getDocs(query(
          collection(db, 'students'),
          where('reg_number', '==', regTerm),
          limit(5)
        )),
      ])
      const merged = new Map()
      ;[...byName.docs, ...byReg.docs].forEach(d => merged.set(d.id, { id: d.id, ...d.data() }))
      const results = [...merged.values()]
      setStudents(results)
      if (results.length === 0) toast.error('No student found')
    } catch (err) {
      console.error('Search error:', err)
      toast.error('Search failed')
    }
    setSearching(false)
  }

  const handleSelect = async (student) => {
    setSelected(student)
    setStudents([])
    setSearch(student.fullName || student.reg_number || '')
    try {
      const snap = await getDocs(query(
        collection(db, 'feeAccounts'),
        where('reg_number', '==', student.reg_number),
        limit(1)
      ))
      setAccount(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() })
    } catch {
      setAccount(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected) return toast.error('Please select a student')
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return toast.error('Enter a valid amount')

    setSubmitting(true)
    try {
      const receiptNum = await getNextReceiptNumber()
      const amount     = Number(form.amount)
      const reference  = form.method === 'bank' ? form.bankRef : form.method === 'mobile' ? form.mobileRef : ''
      const paymentObj = {
        amount,
        date:          form.date,
        method:        form.method,
        reference,
        receiptNumber: receiptNum,
        recordedAt:    new Date().toISOString(),
      }

      if (account) {
        const acctRef    = doc(db, 'feeAccounts', account.id)
        const payments   = [...(account.payments || []), paymentObj]
        const totalPaid  = payments.reduce((s, p) => s + Number(p.amount), 0)
        const balance    = Math.abs((account.termFees || 0) - totalPaid)
        const balanceType = totalPaid >= (account.termFees || 0)
          ? (totalPaid > (account.termFees || 0) ? 'credit' : 'nil')
          : 'debit'
        await updateDoc(acctRef, { payments, totalPaid, balance, balanceType })
      }

      await addDoc(collection(db, 'receipts'), {
        receiptNumber: receiptNum,
        studentId:     selected.id,
        studentName:   selected.fullName || '',
        regNumber:     selected.reg_number || '',
        class:         selected.class || '',
        amount,
        paymentMethod: form.method,
        reference,
        notes:         form.notes,
        term:          'Term 2',
        issuedAt:      serverTimestamp(),
        issuedBy:      session.name || 'Bursar',
      })

      // Build receipt data for immediate display
      setReceiptData({
        receiptNumber: receiptNum,
        studentName:   selected.fullName || '',
        regNumber:     selected.reg_number || '',
        class:         selected.class || '',
        amount,
        paymentMethod: form.method,
        reference,
        notes:         form.notes,
        term:          'Term 2',
        issuedAt:      new Date(),
        issuedBy:      session.name || 'Bursar',
      })

      toast.success(`Receipt ${receiptNum} issued`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save payment')
    }
    setSubmitting(false)
  }

  const handlePrint = () => window.print()

  const resetForm = () => {
    setReceiptData(null)
    setSelected(null)
    setAccount(null)
    setSearch('')
    setForm({ amount: '', date: today, method: 'cash', bankRef: '', mobileRef: '', notes: '' })
  }

  // ── Success: show printable receipt ──────────────────────────────────────
  if (receiptData) {
    return (
      <>
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #print-receipt, #print-receipt * { visibility: visible !important; }
            #print-receipt { position: absolute; top: 0; left: 0; width: 100%; }
            #print-receipt * { color: #000 !important; background: #fff !important; border-color: #ccc !important; }
            .no-print { display: none !important; }
          }
        `}</style>

        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-playfair text-xl font-bold text-white">Payment Confirmed</h2>
            <button
              onClick={resetForm}
              className="font-montserrat text-xs text-gray-400 hover:text-white px-4 py-2 border border-white/10 rounded-xl transition"
            >
              Receive another payment
            </button>
          </div>

          {/* Printable receipt */}
          <div id="print-receipt" className={CARD}>
            <div className="border border-white/20 rounded-xl p-8 font-montserrat">
              {/* Header */}
              <div className="text-center border-b border-white/10 pb-5 mb-5">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: TEAL }}>
                  <span className="text-white font-bold text-xl">O</span>
                </div>
                <h2 className="font-playfair text-xl font-bold text-white tracking-wide">OASIS PRIVATE COLLEGE</h2>
                <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mt-0.5">Checheche, Zimbabwe</p>
                <div className="mt-3 inline-flex px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: `${TEAL}22`, color: TEAL }}>
                  Official Receipt
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Receipt No.</p>
                  <p className="text-white font-semibold mt-0.5">{receiptData.receiptNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Date</p>
                  <p className="text-white font-semibold mt-0.5">{formatDate(receiptData.issuedAt)}</p>
                </div>
              </div>

              {/* Student */}
              <div className="bg-white/5 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Received from</span>
                  <span className="text-white font-semibold">{receiptData.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reg Number</span>
                  <span className="text-white">{receiptData.regNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Class</span>
                  <span className="text-white">{receiptData.class || '—'}</span>
                </div>
              </div>

              {/* Payment details */}
              <div className="space-y-2 text-sm border-t border-white/10 pt-4 mb-5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Description</span>
                  <span className="text-white">{receiptData.term} fees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment method</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                    receiptData.paymentMethod === 'cash'   ? 'bg-purple-500/20 text-purple-300' :
                    receiptData.paymentMethod === 'bank'   ? 'bg-blue-500/20 text-blue-300'    :
                    'bg-teal-500/20 text-teal-300'
                  }`}>
                    {METHOD_LABEL[receiptData.paymentMethod] || receiptData.paymentMethod}
                  </span>
                </div>
                {receiptData.reference && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reference</span>
                    <span className="text-white">{receiptData.reference}</span>
                  </div>
                )}
                {receiptData.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Notes</span>
                    <span className="text-white">{receiptData.notes}</span>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="rounded-xl p-4 flex justify-between items-center" style={{ backgroundColor: `${TEAL}18` }}>
                <span className="font-bold text-white text-base">Amount Paid</span>
                <span className="font-bold text-2xl" style={{ color: TEAL }}>{fmt(receiptData.amount)}</span>
              </div>

              {/* QR code */}
              <div className="border-t border-white/10 mt-5 pt-5 flex flex-col items-center gap-2">
                <QRCodeSVG
                  value={`${window.location.origin}/verify-balance/${receiptData.regNumber}`}
                  size={96}
                  bgColor="transparent"
                  fgColor="#000000"
                  level="M"
                />
                <p className="font-montserrat text-[10px] text-gray-500 uppercase tracking-widest">Scan to verify balance</p>
              </div>

              {/* Footer */}
              <div className="border-t border-white/10 mt-4 pt-4 text-xs text-gray-500 text-center">
                Issued by: <span className="text-gray-400">{receiptData.issuedBy}</span>
                <br />This is an official receipt of Oasis Private College.
              </div>
            </div>

            {/* Print actions */}
            <div className="no-print flex gap-3 mt-5">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 rounded-xl text-sm font-semibold font-montserrat text-white transition"
                style={{ backgroundColor: TEAL }}
              >
                Print Receipt
              </button>
              <button
                onClick={resetForm}
                className="flex-1 py-3 rounded-xl text-sm font-semibold font-montserrat text-gray-400 border border-white/10 hover:bg-white/5 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Payment form ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Student search */}
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-4">Find Student</h3>
        <div className="flex gap-3">
          <div className="flex-1 flex items-center bg-white/5 border border-white/10 focus-within:border-[#0F6E56]/50 rounded-xl overflow-hidden transition-all">
            <span className="pl-4 pr-3 text-[#0F6E56] font-mono font-bold text-sm shrink-0 border-r border-white/10 py-3">R</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="262681 or student name..."
              className="flex-1 bg-transparent outline-none px-3 py-3 text-white font-montserrat text-sm placeholder-gray-600"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-5 py-3 rounded-xl text-sm font-semibold font-montserrat text-white transition shrink-0"
            style={{ backgroundColor: TEAL }}
          >
            {searching ? '...' : 'Search'}
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
                <p className="text-sm text-white font-montserrat">{s.fullName}</p>
                <p className="text-xs text-gray-500 font-montserrat">{s.reg_number} &middot; {s.class || '—'}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Payment form */}
      <form onSubmit={handleSubmit} className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-5">Payment Details</h3>

        {!selected && (
          <div className="mb-5 flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            <span className="text-amber-400 text-lg shrink-0">&#9650;</span>
            <p className="font-montserrat text-xs text-amber-300">
              Search for and select a student above before confirming payment.
            </p>
          </div>
        )}

        {selected && (
          <div className="mb-5 flex items-center justify-between bg-[#0F6E56]/10 border border-[#0F6E56]/30 rounded-xl px-4 py-3">
            <div>
              <p className="font-montserrat text-sm font-semibold text-white">{selected.fullName}</p>
              <p className="font-montserrat text-xs text-gray-400">{selected.reg_number} &middot; {selected.class || '—'}</p>
            </div>
            {account && (
              <p className={`font-montserrat text-sm font-bold ${account.balanceType === 'debit' ? 'text-red-400' : 'text-emerald-400'}`}>
                Balance: {account.balanceType === 'debit' ? '-' : ''}{fmt(account.balance || 0)}
              </p>
            )}
            <button
              type="button"
              onClick={() => { setSelected(null); setAccount(null); setSearch('') }}
              className="text-gray-500 hover:text-red-400 transition font-montserrat text-xs ml-3"
            >
              Change
            </button>
          </div>
        )}

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
              placeholder="Any additional notes..."
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
            className="flex-1 py-3 rounded-xl text-sm font-semibold font-montserrat text-white transition cursor-not-allowed"
            style={{ backgroundColor: selected ? TEAL : '#374151' }}
          >
            {submitting ? 'Saving...' : !selected ? 'Select a student first' : 'Confirm & Issue Receipt'}
          </button>
        </div>
      </form>
    </div>
  )
}
