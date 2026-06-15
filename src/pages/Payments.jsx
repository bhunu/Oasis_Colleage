import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { MdSearch as IconSearch, MdReceipt as IconReceipt, MdDownload as IconDownload } from 'react-icons/md'

export default function Payments() {
  const [receipts,     setReceipts]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [methodFilter, setMethodFilter] = useState('All')
  const [currentTerm,  setCurrentTerm]  = useState('')

  useEffect(() => {
    async function load() {
      try {
        const settingsSnap = await getDoc(doc(db, 'portalSettings', 'main'))
        const term = settingsSnap.exists()
          ? `Term ${settingsSnap.data().currentTerm}`
          : ''
        setCurrentTerm(term)

        if (!term) { setLoading(false); return }

        const snap = await getDocs(
          query(
            collection(db, 'receipts'),
            where('term', '==', term),
            orderBy('issuedAt', 'desc'),
          )
        )
        setReceipts(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })))
      } catch {
        setReceipts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const methods = ['All', ...new Set(receipts.map(r => r.method).filter(Boolean)).values()]

  const filtered = receipts.filter(r => {
    const matchSearch =
      r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      r.reg_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.receiptNumber?.toLowerCase().includes(search.toLowerCase())
    const matchMethod = methodFilter === 'All' || r.method === methodFilter
    return matchSearch && matchMethod
  })

  const totalCollected = filtered.reduce((sum, r) => sum + (r.amount || 0), 0)

  const formatDate = (val) => {
    if (!val) return '—'
    const d = val?.toDate ? val.toDate() : new Date(val)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const methodLabel = (m) => {
    const map = { bank_transfer: 'Bank Transfer', cash: 'Cash', cheque: 'Cheque', online: 'Online', ecocash: 'EcoCash' }
    return map[m] || m || '—'
  }

  const handleExport = () => {
    const rows = [
      ['Date', 'Receipt No', 'Reg Number', 'Student Name', 'Method', 'Amount'],
      ...filtered.map(r => [
        formatDate(r.issuedAt),
        r.receiptNumber || '',
        r.reg_number || '',
        r.studentName || '',
        methodLabel(r.method),
        (r.amount || 0).toFixed(2),
      ]),
    ]
    const csv = rows.map(row => row.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments_${currentTerm.replace(' ', '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Payments This Term</p>
          <p className="text-3xl font-bold text-gray-900">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Collected</p>
          <p className="text-3xl font-bold text-green-600">${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Unique Payers</p>
          <p className="text-3xl font-bold text-blue-600">
            {new Set(filtered.map(r => r.reg_number).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, reg number or receipt…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={methodFilter}
          onChange={e => setMethodFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {methods.map(m => <option key={m}>{m === 'All' ? 'All methods' : methodLabel(m)}</option>)}
        </select>
        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
        >
          <IconDownload size={16} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <IconReceipt size={18} className="text-green-600" />
            <h3 className="font-semibold text-gray-900">
              Payment History{currentTerm ? ` — ${currentTerm}` : ''}
            </h3>
          </div>
          <span className="text-sm text-gray-500">{filtered.length} receipt{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-sm text-gray-500">Loading payments…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            {search || methodFilter !== 'All' ? 'No matching receipts.' : 'No payments recorded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Receipt No</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Student Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Reg No</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.firestoreId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-6 text-gray-600">{formatDate(r.issuedAt)}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs">{r.receiptNumber || '—'}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{r.studentName}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs">{r.reg_number || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{methodLabel(r.method)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">
                      ${(r.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan="5" className="py-3 px-4 text-right font-semibold text-gray-900">Total Collected:</td>
                  <td className="py-3 px-4 text-right font-bold text-green-700">${totalCollected.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
