import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { MdSearch as IconSearch, MdDownload as IconDownload, MdWarning as IconWarn } from 'react-icons/md'

export default function Arrears() {
  const [accounts,    setAccounts]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [classFilter, setClassFilter] = useState('All classes')
  const [currentTerm, setCurrentTerm] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const settingsSnap = await getDoc(doc(db, 'portalSettings', 'main'))
        const term = settingsSnap.exists()
          ? `${settingsSnap.data().currentTerm}-${settingsSnap.data().currentYear}`
          : ''
        setCurrentTerm(term)

        if (!term) { setLoading(false); return }

        const snap = await getDocs(
          query(
            collection(db, 'feeAccounts'),
            where('term', '==', term),
            where('balanceType', '==', 'debit')
          )
        )
        const list = snap.docs
          .map(d => ({ firestoreId: d.id, ...d.data() }))
          .sort((a, b) => (b.balance || 0) - (a.balance || 0))
        setAccounts(list)
      } catch {
        setAccounts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const classes = ['All classes', ...new Set(accounts.map(a => a.class).filter(Boolean)).values()].sort()

  const filtered = accounts.filter(a => {
    const matchSearch =
      a.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      a.reg_number?.toLowerCase().includes(search.toLowerCase())
    const matchClass = classFilter === 'All classes' || a.class === classFilter
    return matchSearch && matchClass
  })

  const totalArrears = filtered.reduce((sum, a) => sum + (a.balance || 0), 0)

  const handleExport = () => {
    const rows = [
      ['Reg Number', 'Name', 'Class', 'Charged', 'Paid', 'Balance Owed'],
      ...filtered.map(a => [
        a.reg_number || '',
        a.studentName || '',
        a.class || '',
        (a.totalCharged || 0).toFixed(2),
        (a.totalPaid || 0).toFixed(2),
        (a.balance || 0).toFixed(2),
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `arrears_term_${currentTerm}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Students in Arrears</p>
          <p className="text-3xl font-bold text-red-600">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Arrears Amount</p>
          <p className="text-3xl font-bold text-red-600">${totalArrears.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Average Per Student</p>
          <p className="text-3xl font-bold text-amber-600">
            ${filtered.length ? (totalArrears / filtered.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {classes.map(c => <option key={c}>{c}</option>)}
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
            <IconWarn size={18} className="text-amber-500" />
            <h3 className="font-semibold text-gray-900">Fees Arrears — Term {currentTerm.replace('-', ' · ')}</h3>
          </div>
          <span className="text-sm text-gray-500">{filtered.length} accounts</span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-sm text-gray-500">Loading arrears…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            {search || classFilter !== 'All classes' ? 'No matching arrears accounts.' : 'No arrears for this term.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Student Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Reg No</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Class</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Charged</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Paid</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Balance Owed</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.firestoreId} className="border-b border-gray-100 hover:bg-red-50/30 transition">
                    <td className="py-3 px-6 text-gray-500">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{a.studentName}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs">{a.reg_number}</td>
                    <td className="py-3 px-4">
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{a.class}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      ${(a.totalCharged || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600">
                      ${(a.totalPaid || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded text-sm font-bold ${
                          (a.balance || 0) > 500
                            ? 'bg-red-100 text-red-700'
                            : (a.balance || 0) > 200
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        ${(a.balance || 0).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan="6" className="py-3 px-4 text-right font-semibold text-gray-900">Total Arrears:</td>
                  <td className="py-3 px-4 text-right font-bold text-red-700 text-base">
                    ${totalArrears.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
