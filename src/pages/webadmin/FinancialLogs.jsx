import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase/config'
import {
  MdReceiptLong, MdDownload, MdTrendingUp, MdTrendingDown,
  MdAccountBalance, MdFilterAlt,
} from 'react-icons/md'

const CARD = 'bg-navy-800 border border-white/10 rounded-xl'

function fmt(v) {
  return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
}

function fmtTs(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function tsMillis(ts) {
  if (!ts) return 0
  if (ts?.toDate) return ts.toDate().getTime()
  return new Date(ts).getTime()
}

function SummaryCard({ icon: Icon, label, value, sub, colorBg, colorText }) {
  return (
    <div className={`${CARD} p-5 flex items-start gap-4`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorBg}`}>
        <Icon className={`text-lg ${colorText}`} />
      </div>
      <div className="min-w-0">
        <p className="font-montserrat text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
        <p className="font-playfair text-xl font-bold text-white">{value}</p>
        {sub && <p className="font-montserrat text-[10px] text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const TYPES = ['ALL', 'PAYMENT_RECEIVED', 'EXPENSE_RECORDED']

export default function FinancialLogs() {
  const [logs,       setLogs]      = useState([])
  const [loading,    setLoading]   = useState(true)
  const [loadError,  setLoadError] = useState(null)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [search,     setSearch]    = useState('')
  const [dateFrom,   setDateFrom]  = useState('')
  const [dateTo,     setDateTo]    = useState('')

  useEffect(() => {
    setLoading(true)
    setLoadError(null)

    Promise.all([
      getDocs(query(collection(db, 'receipts'), orderBy('issuedAt', 'desc'))).catch(() => null),
      getDocs(query(collection(db, 'expenses'), orderBy('recordedAt', 'desc'))).catch(() => null),
    ]).then(([receiptsSnap, expensesSnap]) => {
      const payments = receiptsSnap
        ? receiptsSnap.docs.map(d => ({
            id:            d.id,
            type:          'PAYMENT_RECEIVED',
            timestamp:     d.data().issuedAt,
            amount:        Number(d.data().amount || 0),
            performedBy:   d.data().issuedBy || '',
            studentName:   d.data().studentName || '',
            reg_number:    d.data().reg_number || '',
            class:         d.data().class || '',
            paymentMethod: d.data().paymentMethod || '',
            receiptNumber: d.data().receiptNumber || '',
            paymentDate:   d.data().date || '',
            term:          d.data().term || '',
            notes:         d.data().notes || '',
            reference:     d.data().reference || '',
          }))
        : []

      const expenses = expensesSnap
        ? expensesSnap.docs.map(d => ({
            id:            d.id,
            type:          'EXPENSE_RECORDED',
            timestamp:     d.data().recordedAt,
            amount:        Number(d.data().amount || 0),
            performedBy:   d.data().recordedBy || '',
            description:   d.data().description || '',
            category:      d.data().category || '',
            paymentMethod: d.data().paymentMethod || '',
            reference:     d.data().reference || '',
            date:          d.data().date || '',
            term:          d.data().term || '',
            notes:         d.data().notes || '',
          }))
        : []

      const combined = [...payments, ...expenses].sort(
        (a, b) => tsMillis(b.timestamp) - tsMillis(a.timestamp)
      )
      setLogs(combined)
    }).catch(err => {
      console.error('FinancialLogs fetch error:', err)
      setLoadError(err.message || 'Failed to load financial logs.')
    }).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const s    = search.trim().toLowerCase()
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null
    const to   = dateTo   ? new Date(dateTo   + 'T23:59:59') : null
    return logs.filter(l => {
      if (typeFilter !== 'ALL' && l.type !== typeFilter) return false
      if (from || to) {
        const ts = l.timestamp?.toDate ? l.timestamp.toDate() : l.timestamp ? new Date(l.timestamp) : null
        if (!ts) return false
        if (from && ts < from) return false
        if (to   && ts > to)   return false
      }
      if (s) {
        return (
          l.studentName?.toLowerCase().includes(s)  ||
          l.reg_number?.toLowerCase().includes(s)   ||
          l.receiptNumber?.toLowerCase().includes(s)||
          l.performedBy?.toLowerCase().includes(s)  ||
          l.description?.toLowerCase().includes(s)  ||
          l.category?.toLowerCase().includes(s)     ||
          l.reference?.toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [logs, typeFilter, search, dateFrom, dateTo])

  const paymentsIn  = filtered.filter(l => l.type === 'PAYMENT_RECEIVED')
  const expensesOut = filtered.filter(l => l.type === 'EXPENSE_RECORDED')
  const totalIn     = paymentsIn.reduce((s, l)  => s + l.amount, 0)
  const totalOut    = expensesOut.reduce((s, l) => s + l.amount, 0)
  const net         = totalIn - totalOut

  const exportCsv = () => {
    const headers = [
      'Timestamp', 'Type', 'Performed By', 'Student Name', 'Reg No',
      'Description', 'Category', 'Amount ($)', 'Payment Method',
      'Reference', 'Receipt Number', 'Date', 'Term', 'Notes',
    ]
    const rows = filtered.map(l => [
      fmtTs(l.timestamp),
      l.type             ?? '',
      l.performedBy      ?? '',
      l.studentName      ?? '',
      l.reg_number       ?? '',
      l.description      ?? '',
      l.category         ?? '',
      l.amount           ?? 0,
      l.paymentMethod    ?? '',
      l.reference        ?? '',
      l.receiptNumber    ?? '',
      l.paymentDate || l.date || '',
      l.term             ?? '',
      l.notes            ?? '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`))
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a    = Object.assign(document.createElement('a'), {
      href:     URL.createObjectURL(blob),
      download: `financial-audit-${new Date().toISOString().slice(0, 10)}.csv`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const hasFilter = typeFilter !== 'ALL' || search || dateFrom || dateTo

  const methodLabel = m =>
    m === 'bank'   ? 'Bank Transfer'  :
    m === 'mobile' ? 'Mobile Money'   :
    m ? m.charAt(0).toUpperCase() + m.slice(1) : '—'

  return (
    <div className="space-y-5">

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={MdTrendingUp}
          label="Total Payments In"
          value={fmt(totalIn)}
          sub={`${paymentsIn.length} transaction${paymentsIn.length !== 1 ? 's' : ''}`}
          colorBg="bg-emerald-500/15"
          colorText="text-emerald-400"
        />
        <SummaryCard
          icon={MdTrendingDown}
          label="Total Expenses Out"
          value={fmt(totalOut)}
          sub={`${expensesOut.length} transaction${expensesOut.length !== 1 ? 's' : ''}`}
          colorBg="bg-red-500/15"
          colorText="text-red-400"
        />
        <SummaryCard
          icon={MdAccountBalance}
          label="Net Position"
          value={fmt(Math.abs(net))}
          sub={net >= 0 ? 'surplus' : 'deficit'}
          colorBg={net >= 0 ? 'bg-blue-500/15' : 'bg-amber-500/15'}
          colorText={net >= 0 ? 'text-blue-400' : 'text-amber-400'}
        />
        <SummaryCard
          icon={MdReceiptLong}
          label="Entries Shown"
          value={filtered.length.toLocaleString()}
          sub={filtered.length !== logs.length ? `of ${logs.length} total` : 'all entries'}
          colorBg="bg-white/5"
          colorText="text-gray-300"
        />
      </div>

      {/* Filters + Export */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <MdFilterAlt className="text-gray-600 text-base mr-1" />
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider font-montserrat transition-all ${
                  typeFilter === t
                    ? 'bg-gold/10 text-gold'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t === 'ALL' ? 'All Entries' : t === 'PAYMENT_RECEIVED' ? 'Payments In' : 'Expenses Out'}
              </button>
            ))}
            {hasFilter && (
              <button
                onClick={() => { setTypeFilter('ALL'); setSearch(''); setDateFrom(''); setDateTo('') }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold font-montserrat text-gray-500 hover:text-red-400 transition-all"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold font-montserrat text-gray-300 border border-white/10 hover:bg-white/5 transition whitespace-nowrap"
          >
            <MdDownload className="text-base" />
            Export CSV
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-montserrat text-[10px] uppercase tracking-widest text-gray-600">Date range</span>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="bg-white/5 border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl px-3 py-2 text-gray-300 font-montserrat text-xs transition-all [color-scheme:dark]"
          />
          <span className="text-gray-600 text-xs">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="bg-white/5 border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl px-3 py-2 text-gray-300 font-montserrat text-xs transition-all [color-scheme:dark]"
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, reg, receipt no, description…"
            className="bg-white/5 border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl px-3 py-2 text-white font-montserrat text-xs placeholder-gray-600 w-64 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className={`${CARD} overflow-hidden`}>
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-montserrat text-gray-500 text-sm">Loading financial logs…</p>
          </div>
        ) : loadError ? (
          <div className="py-16 text-center px-6">
            <p className="font-montserrat text-red-400 text-sm font-semibold mb-2">Failed to load financial logs</p>
            <p className="font-montserrat text-gray-600 text-xs max-w-md mx-auto">{loadError}</p>
            <p className="font-montserrat text-gray-700 text-[10px] mt-3">Check the browser console for details.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center font-montserrat text-gray-500 text-sm">
            {hasFilter ? 'No entries match your filter.' : 'No financial transactions have been recorded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-xs font-montserrat">
              <thead className="sticky top-0 bg-navy-800 border-b border-white/10 z-10">
                <tr>
                  {[
                    'Timestamp', 'Type', 'Performed By',
                    'Student / Description', 'Amount', 'Method',
                    'Receipt / Ref', 'Date', 'Notes',
                  ].map(h => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const isPayment = log.type === 'PAYMENT_RECEIVED'
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-white/5 hover:bg-white/[0.025] transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-400 whitespace-nowrap">{fmtTs(log.timestamp)}</td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap ${
                          isPayment
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-300 border-red-500/30'
                        }`}>
                          {isPayment ? 'Payment Received' : 'Expense Recorded'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-gray-300 whitespace-nowrap">{log.performedBy || '—'}</td>

                      <td className="py-3 px-4 max-w-[200px]">
                        {isPayment ? (
                          <>
                            <p className="text-white font-medium truncate">{log.studentName || '—'}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {log.reg_number || ''}
                              {log.class ? ` · ${log.class}` : ''}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-white font-medium truncate">{log.description || '—'}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{log.category || ''}</p>
                          </>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-semibold">
                        <span className={isPayment ? 'text-emerald-300' : 'text-red-300'}>
                          {isPayment ? '+' : '−'}{fmt(log.amount)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-gray-400 whitespace-nowrap">{methodLabel(log.paymentMethod)}</td>

                      <td className="py-3 px-4 max-w-[160px]">
                        {log.receiptNumber && (
                          <p className="text-gold font-semibold">{log.receiptNumber}</p>
                        )}
                        {log.reference && (
                          <p className="text-gray-500 text-[10px] truncate" title={log.reference}>
                            {log.reference}
                          </p>
                        )}
                        {!log.receiptNumber && !log.reference && <span className="text-gray-600">—</span>}
                      </td>

                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {log.paymentDate || log.date || '—'}
                      </td>

                      <td className="py-3 px-4 max-w-[180px]">
                        <span className="text-gray-500 truncate block" title={log.notes || ''}>
                          {log.notes || '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-600 font-montserrat text-right">
        Showing {filtered.length} of {logs.length} entries · from receipts &amp; expenses collections
      </p>
    </div>
  )
}
