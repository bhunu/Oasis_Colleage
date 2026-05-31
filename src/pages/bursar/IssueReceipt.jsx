import { useState } from 'react'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const TEAL  = '#0F6E56'
const INPUT = 'w-full bg-white/5 border border-white/10 focus:border-[#0F6E56]/50 focus:outline-none rounded-xl px-4 py-3 text-white font-montserrat text-sm placeholder-gray-600 transition-all'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'

function getBursarSession() {
  try { return JSON.parse(sessionStorage.getItem('bursarSession') || '{}') } catch { return {} }
}

function fmt(v) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

const METHOD_LABEL = { cash: 'Cash', bank: 'Bank Transfer', mobile: 'Mobile Money' }

export default function IssueReceipt() {
  const session = getBursarSession()
  const [search,    setSearch]   = useState('')
  const [results,   setResults]  = useState([])
  const [receipt,   setReceipt]  = useState(null)
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const [byNum, byName, byId] = await Promise.all([
        getDocs(query(collection(db, 'receipts'), where('receiptNumber', '==', search.trim().toUpperCase()), limit(5))),
        getDocs(query(collection(db, 'receipts'), where('studentName', '>=', search.trim()), where('studentName', '<=', search.trim() + ''), limit(10))),
        getDocs(query(collection(db, 'receipts'), where('studentId', '==', search.trim()), limit(10))),
      ])
      const merged = new Map()
      ;[...byNum.docs, ...byName.docs, ...byId.docs].forEach(d => merged.set(d.id, { id: d.id, ...d.data() }))
      setResults([...merged.values()].sort((a, b) => (b.issuedAt?.seconds || 0) - (a.issuedAt?.seconds || 0)))
    } catch {
      toast.error('Search failed')
    }
    setSearching(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEmail = () => {
    if (!receipt) return
    const subject = encodeURIComponent(`Oasis College Receipt ${receipt.receiptNumber}`)
    const body    = encodeURIComponent(
      `Dear Parent/Guardian,\n\nPlease find below the payment receipt for ${receipt.studentName}.\n\nReceipt No: ${receipt.receiptNumber}\nDate: ${formatDate(receipt.issuedAt)}\nAmount: ${fmt(receipt.amount)}\nPayment Method: ${METHOD_LABEL[receipt.paymentMethod] || receipt.paymentMethod}\n\nThank you.\nOasis Private College Bursar`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  return (
    <>
      {/* Print styles — receipt only */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-receipt { display: block !important; }
          #print-receipt * { color: #000 !important; background: #fff !important; border-color: #ccc !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto space-y-6">

        {/* Search */}
        <div className={CARD}>
          <h3 className="font-playfair font-semibold text-white mb-4">Search Receipts</h3>
          <div className="flex gap-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Student name, ID, or receipt number…"
              className={`${INPUT} flex-1`}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-5 py-3 rounded-xl text-sm font-semibold font-montserrat text-white shrink-0"
              style={{ backgroundColor: TEAL }}
            >
              {searching ? '…' : 'Search'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="mt-3 border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setReceipt(r); setResults([]) }}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition"
                >
                  <p className="text-sm text-white font-montserrat">{r.studentName} — {r.receiptNumber}</p>
                  <p className="text-xs text-gray-500 font-montserrat">{formatDate(r.issuedAt)} · {fmt(r.amount)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Receipt card */}
        {receipt && (
          <>
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
                    <p className="text-white font-semibold mt-0.5">{receipt.receiptNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Date</p>
                    <p className="text-white font-semibold mt-0.5">{formatDate(receipt.issuedAt)}</p>
                  </div>
                </div>

                {/* Student */}
                <div className="bg-white/5 rounded-xl p-4 mb-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Received from</span>
                    <span className="text-white font-semibold">{receipt.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Student ID</span>
                    <span className="text-white">{receipt.studentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Class</span>
                    <span className="text-white">{receipt.class || '—'}</span>
                  </div>
                </div>

                {/* Payment */}
                <div className="space-y-2 text-sm border-t border-white/10 pt-4 mb-5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Description</span>
                    <span className="text-white">{receipt.term || 'Term'} fees</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment method</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      receipt.paymentMethod === 'cash'   ? 'bg-purple-500/20 text-purple-300' :
                      receipt.paymentMethod === 'bank'   ? 'bg-blue-500/20 text-blue-300'    :
                      'bg-teal-500/20 text-teal-300'
                    }`}>
                      {METHOD_LABEL[receipt.paymentMethod] || receipt.paymentMethod}
                    </span>
                  </div>
                  {receipt.reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reference</span>
                      <span className="text-white">{receipt.reference}</span>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="rounded-xl p-4 flex justify-between items-center" style={{ backgroundColor: `${TEAL}18` }}>
                  <span className="font-bold text-white text-base">Amount Paid</span>
                  <span className="font-bold text-2xl" style={{ color: TEAL }}>{fmt(receipt.amount)}</span>
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 mt-5 pt-4 text-xs text-gray-500 text-center">
                  Issued by: <span className="text-gray-400">{receipt.issuedBy || session.name || 'Bursar'}</span>
                  <br />This is an official receipt of Oasis Private College.
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold font-montserrat text-white border border-white/20 hover:bg-white/5 transition"
                >
                  Print
                </button>
                <button
                  onClick={handleEmail}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold font-montserrat text-white border border-white/20 hover:bg-white/5 transition"
                >
                  Email to parent
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold font-montserrat text-white transition"
                  style={{ backgroundColor: TEAL }}
                >
                  Download PDF
                </button>
              </div>
            </div>
          </>
        )}

        {!receipt && results.length === 0 && (
          <div className={`${CARD} text-center py-12`}>
            <p className="text-gray-500 font-montserrat text-sm">Search by student name, registration number, or receipt number to view a receipt.</p>
          </div>
        )}
      </div>
    </>
  )
}
