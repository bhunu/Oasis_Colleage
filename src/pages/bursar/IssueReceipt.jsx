import { useState } from 'react'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import sc from '../../utils/schoolConfig'

const TEAL  = '#0F6E56'
const INPUT = 'w-full bg-white/5 border border-white/10 focus:border-[#0F6E56]/50 focus:outline-none rounded-xl px-4 py-3 text-white font-montserrat text-sm placeholder-gray-600 transition-all'
const CARD  = 'bg-navy-800 border border-white/10 rounded-xl p-6'

const METHOD_LABEL = { cash: 'Cash', bank: 'Bank Transfer', mobile: 'Mobile Money' }

function getBursarSession() {
  try { return JSON.parse(sessionStorage.getItem('bursarSession') || '{}') } catch { return {} }
}

function fmt(v) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

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
      const term    = search.trim()
      const regTerm = /^\d+$/.test(term) ? 'R' + term : term.toUpperCase()
      const [byNum, byName, byReg] = await Promise.all([
        getDocs(query(collection(db, 'receipts'), where('receiptNumber', '==', term.toUpperCase()), limit(5))),
        getDocs(query(collection(db, 'receipts'), where('studentName', '>=', term), where('studentName', '<=', term + ''), limit(10))),
        getDocs(query(collection(db, 'receipts'), where('reg_number', '==', regTerm), limit(10))),
      ])
      const merged = new Map()
      ;[...byNum.docs, ...byName.docs, ...byReg.docs].forEach(d => merged.set(d.id, { id: d.id, ...d.data() }))
      const list = [...merged.values()].sort((a, b) => (b.issuedAt?.seconds || 0) - (a.issuedAt?.seconds || 0))
      setResults(list)
      if (list.length === 0) toast.error('No receipts found')
    } catch (err) {
      console.error(err)
      toast.error('Search failed')
    }
    setSearching(false)
  }

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

      <div className="max-w-2xl mx-auto space-y-6">

        {/* Search */}
        <div className={CARD}>
          <h3 className="font-playfair font-semibold text-white mb-1">Reprint Receipt</h3>
          <p className="font-montserrat text-xs text-gray-500 mb-4">
            Search for a previously issued receipt to reprint it.
          </p>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center bg-white/5 border border-white/10 focus-within:border-[#0F6E56]/50 rounded-xl overflow-hidden transition-all">
              <span className="pl-4 pr-3 text-[#0F6E56] font-mono font-bold text-sm shrink-0 border-r border-white/10 py-3">R</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="262681, student name, or receipt number..."
                className="flex-1 bg-transparent outline-none px-3 py-3 text-white font-montserrat text-sm placeholder-gray-600"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-5 py-3 rounded-xl text-sm font-semibold font-montserrat text-white shrink-0"
              style={{ backgroundColor: TEAL }}
            >
              {searching ? '...' : 'Search'}
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
                  <p className="text-xs text-gray-500 font-montserrat">{formatDate(r.issuedAt)} &middot; {fmt(r.amount)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Receipt */}
        {receipt && (
          <div id="print-receipt" className={CARD}>
            <div className="border border-white/20 rounded-xl p-8 font-montserrat">
              <div className="text-center border-b border-white/10 pb-5 mb-5">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: TEAL }}>
                  <span className="text-white font-bold text-xl">O</span>
                </div>
                <h2 className="font-playfair text-xl font-bold text-white tracking-wide">{sc.name.toUpperCase()}</h2>
                <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mt-0.5">{sc.address}</p>
                <div className="mt-3 inline-flex px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: `${TEAL}22`, color: TEAL }}>
                  Official Receipt
                </div>
              </div>

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

              <div className="bg-white/5 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Received from</span>
                  <span className="text-white font-semibold">{receipt.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reg Number</span>
                  <span className="text-white">{receipt.reg_number || receipt.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Class</span>
                  <span className="text-white">{receipt.class || '—'}</span>
                </div>
              </div>

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

              <div className="rounded-xl p-4 flex justify-between items-center" style={{ backgroundColor: `${TEAL}18` }}>
                <span className="font-bold text-white text-base">Amount Paid</span>
                <span className="font-bold text-2xl" style={{ color: TEAL }}>{fmt(receipt.amount)}</span>
              </div>

              {/* QR code */}
              <div className="border-t border-white/10 mt-5 pt-5 flex flex-col items-center gap-2">
                <QRCodeSVG
                  value={`${window.location.origin}/verify-balance/${receipt.regNumber || receipt.studentId}`}
                  size={96}
                  bgColor="transparent"
                  fgColor="#000000"
                  level="M"
                />
                <p className="font-montserrat text-[10px] text-gray-500 uppercase tracking-widest">Scan to verify balance</p>
              </div>

              <div className="border-t border-white/10 mt-4 pt-4 text-xs text-gray-500 text-center">
                Issued by: <span className="text-gray-400">{receipt.issuedBy || session.name || 'Bursar'}</span>
                <br />This is an official receipt of {sc.name}.
              </div>
            </div>

            <div className="no-print flex gap-3 mt-5">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl text-sm font-semibold font-montserrat text-white transition"
                style={{ backgroundColor: TEAL }}
              >
                Print Receipt
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold font-montserrat text-gray-400 border border-white/10 hover:bg-white/5 transition"
              >
                Back to search
              </button>
            </div>
          </div>
        )}

        {!receipt && results.length === 0 && (
          <div className={`${CARD} text-center py-12`}>
            <p className="text-gray-500 font-montserrat text-sm">
              Search by student name, registration number, or receipt number to reprint a receipt.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
