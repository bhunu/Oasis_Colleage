import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'
import { MdCheckCircle, MdCancel, MdOpenInNew, MdHourglassEmpty } from 'react-icons/md'
import { getNextReceiptNumber } from '../../utils/receiptCounter'

const CARD  = 'bg-navy-800 border border-white/10 rounded-xl p-6'
const TEAL  = '#0F6E56'

const STATUS_BADGE = {
  pending:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border border-red-500/30',
}

function getBursarSession() {
  try { return JSON.parse(sessionStorage.getItem('bursarSession') || '{}') } catch { return {} }
}


function fmt(v) {
  return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
}

function fmtDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ReviewPOP() {
  const session = getBursarSession()

  const [pops,       setPops]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('pending')
  const [rejectId,   setRejectId]   = useState(null)
  const [reason,     setReason]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getDocs(query(collection(db, 'proofOfPayments'), orderBy('uploadedAt', 'desc')))
      .then(snap => setPops(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => toast.error('Failed to load submissions'))
      .finally(() => setLoading(false))
  }, [])

  const handleApprove = async (pop) => {
    setSubmitting(true)
    try {
      const receiptNum = await getNextReceiptNumber()

      // Find and credit the student's active fee account
      const accSnap = await getDocs(query(
        collection(db, 'feeAccounts'),
        where('reg_number', '==', pop.reg_number),
        limit(1)
      ))

      if (!accSnap.empty) {
        const acctDoc  = accSnap.docs[0]
        const acctData = acctDoc.data()
        const paymentEntry = {
          amount:        pop.amount,
          date:          new Date().toISOString().split('T')[0],
          method:        pop.method || 'online',
          reference:     pop.reference || '',
          receiptNumber: receiptNum,
          recordedAt:    new Date().toISOString(),
        }
        const payments   = [...(acctData.payments || []), paymentEntry]
        const totalPaid  = payments.reduce((s, p) => s + Number(p.amount), 0)
        const balance    = Math.abs((acctData.termFees || 0) - totalPaid)
        const balanceType = totalPaid >= (acctData.termFees || 0)
          ? (totalPaid > (acctData.termFees || 0) ? 'credit' : 'nil')
          : 'debit'

        await updateDoc(doc(db, 'feeAccounts', acctDoc.id), {
          payments, totalPaid, balance, balanceType,
          updatedBy: session.name || 'Bursar',
          updatedAt: serverTimestamp(),
        })
      }

      // Create an official receipt
      await addDoc(collection(db, 'receipts'), {
        receiptNumber: receiptNum,
        studentName:   pop.studentName || '',
        reg_number:    pop.reg_number  || '',
        class:         pop.class       || '',
        amount:        pop.amount,
        paymentMethod: pop.method      || 'online',
        reference:     pop.reference   || '',
        notes:         'Auto-generated from approved proof of payment',
        term:          pop.term        || '',
        issuedAt:      serverTimestamp(),
        issuedBy:      session.name    || 'Bursar',
      })

      // Mark POP approved with receipt number
      await updateDoc(doc(db, 'proofOfPayments', pop.id), {
        status:        'approved',
        receiptNumber: receiptNum,
        reviewedBy:    session.name || 'Bursar',
        reviewedAt:    serverTimestamp(),
      })

      setPops(prev => prev.map(p =>
        p.id === pop.id ? { ...p, status: 'approved', receiptNumber: receiptNum } : p
      ))
      toast.success(`POP approved — Receipt ${receiptNum} issued`)
    } catch {
      toast.error('Failed to approve')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (pop) => {
    if (!reason.trim()) return toast.error('Enter a rejection reason')
    setSubmitting(true)
    try {
      await updateDoc(doc(db, 'proofOfPayments', pop.id), {
        status:          'rejected',
        rejectionReason: reason.trim(),
        reviewedBy:      session.name || 'Bursar',
        reviewedAt:      serverTimestamp(),
      })
      setPops(prev => prev.map(p => p.id === pop.id ? { ...p, status: 'rejected', rejectionReason: reason.trim() } : p))
      setRejectId(null)
      setReason('')
      toast.success('POP rejected')
    } catch {
      toast.error('Failed to reject')
    } finally {
      setSubmitting(false)
    }
  }

  const visible = pops.filter(p => filter === 'all' ? true : p.status === filter)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">Proof of Payment Review</h1>
          <p className="font-montserrat text-xs text-gray-500 mt-0.5">
            Review and act on student-uploaded payment proofs
          </p>
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-montserrat uppercase tracking-wider transition-all ${
                filter === f
                  ? 'bg-[#0F6E56] text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {f}
              {f !== 'all' && (
                <span className="ml-1.5 opacity-60">
                  ({pops.filter(p => p.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-600 font-montserrat text-sm">Loading…</div>
      ) : visible.length === 0 ? (
        <div className={`${CARD} text-center py-12`}>
          <MdHourglassEmpty className="text-4xl text-gray-700 mx-auto mb-3" />
          <p className="font-montserrat text-gray-500 text-sm">No {filter === 'all' ? '' : filter} submissions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map(pop => (
            <div key={pop.id} className={CARD}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-playfair font-semibold text-white text-sm">{pop.studentName || '—'}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-montserrat ${STATUS_BADGE[pop.status] || STATUS_BADGE.pending}`}>
                      {pop.status}
                    </span>
                  </div>
                  <p className="font-montserrat text-xs text-gray-500">
                    {pop.reg_number} · {pop.class} · {pop.term}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-playfair font-bold text-white text-lg">{pop.amount ? fmt(pop.amount) : '—'}</p>
                  <p className="font-montserrat text-[10px] text-gray-600 capitalize">{pop.method} · {fmtDate(pop.uploadedAt)}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-3 flex-wrap">
                {pop.fileUrl && (
                  <a
                    href={pop.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-montserrat text-[#0F6E56] hover:text-emerald-400 transition"
                  >
                    <MdOpenInNew className="text-sm" />
                    View file
                  </a>
                )}
                {pop.reference && (
                  <span className="font-montserrat text-xs text-gray-500">Ref: {pop.reference}</span>
                )}
                {pop.notes && (
                  <span className="font-montserrat text-xs text-gray-600 italic">{pop.notes}</span>
                )}
              </div>

              {pop.status === 'rejected' && pop.rejectionReason && (
                <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <p className="font-montserrat text-[10px] text-red-400 font-semibold uppercase tracking-widest mb-0.5">Rejection Reason</p>
                  <p className="font-montserrat text-xs text-gray-300">{pop.rejectionReason}</p>
                </div>
              )}

              {pop.status === 'pending' && rejectId !== pop.id && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleApprove(pop)}
                    disabled={submitting}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold font-montserrat px-4 py-2 rounded-lg transition"
                  >
                    <MdCheckCircle className="text-sm" />
                    Approve
                  </button>
                  <button
                    onClick={() => { setRejectId(pop.id); setReason('') }}
                    disabled={submitting}
                    className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold font-montserrat px-4 py-2 rounded-lg transition"
                  >
                    <MdCancel className="text-sm" />
                    Reject
                  </button>
                </div>
              )}

              {pop.status === 'pending' && rejectId === pop.id && (
                <div className="mt-4 space-y-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 font-montserrat">
                    Rejection reason (shown to student)
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={2}
                    placeholder="e.g. Amount doesn't match, unclear image, wrong reference…"
                    className="w-full bg-white/5 border border-red-500/30 focus:border-red-500/60 focus:outline-none rounded-xl px-4 py-3 text-white font-montserrat text-sm placeholder-gray-600 resize-none transition"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(pop)}
                      disabled={submitting || !reason.trim()}
                      className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold font-montserrat px-4 py-2 rounded-lg transition"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => { setRejectId(null); setReason('') }}
                      className="bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-semibold font-montserrat px-4 py-2 rounded-lg transition border border-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {pop.status !== 'pending' && pop.reviewedBy && (
                <p className="font-montserrat text-[10px] text-gray-600 mt-3">
                  Reviewed by {pop.reviewedBy} · {fmtDate(pop.reviewedAt)}
                  {pop.receiptNumber && (
                    <span className="ml-2 text-emerald-500">· Receipt {pop.receiptNumber}</span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
