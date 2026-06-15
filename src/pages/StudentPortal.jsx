import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useNavigate } from 'react-router-dom'
import { MdCheckCircle, MdHourglassEmpty, MdBlock, MdPerson, MdKey } from 'react-icons/md'

function getAccountStatus(user) {
  if (user.hasSetupPassword) return 'active'
  const exp = user.otpExpiresAt
  const expDate = exp?.toDate ? exp.toDate() : exp ? new Date(exp) : null
  if (user.otpCode && expDate && expDate > new Date() && !user.otpUsed) return 'otp-pending'
  return 'no-access'
}

const STATUS = {
  active:      { label: 'Password Set',  cls: 'bg-emerald-100 text-emerald-700', icon: MdCheckCircle },
  'otp-pending': { label: 'OTP Issued',  cls: 'bg-amber-100 text-amber-700',     icon: MdHourglassEmpty },
  'no-access': { label: 'No Access',     cls: 'bg-gray-100 text-gray-500',        icon: MdBlock },
}

export default function StudentPortal() {
  const navigate = useNavigate()
  const [accounts,     setAccounts]     = useState([])
  const [totalStudents,setTotalStudents] = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const [usersSnap, studentsSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'student'))),
          getDocs(collection(db, 'students')),
        ])

        setTotalStudents(studentsSnap.size)

        const studMap = {}
        studentsSnap.docs.forEach(d => { studMap[d.id] = { id: d.id, ...d.data() } })

        const list = usersSnap.docs.map(d => {
          const data = d.data()
          const student = studMap[data.studentId] || null
          return {
            docId: d.id,
            ...data,
            student,
            status: getAccountStatus(data),
          }
        }).sort((a, b) => {
          const order = { active: 0, 'otp-pending': 1, 'no-access': 2 }
          return (order[a.status] ?? 3) - (order[b.status] ?? 3)
        })

        setAccounts(list)
      } catch {
        setAccounts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const counts = {
    active:      accounts.filter(a => a.status === 'active').length,
    'otp-pending': accounts.filter(a => a.status === 'otp-pending').length,
    'no-access': accounts.filter(a => a.status === 'no-access').length,
  }
  const noAccount = Math.max(0, totalStudents - accounts.length)

  const filtered = accounts.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      a.student?.name?.toLowerCase().includes(q) ||
      a.student?.fullName?.toLowerCase().includes(q) ||
      a.student?.reg_number?.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-4">

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Students',   value: totalStudents,        color: 'text-gray-900' },
          { label: 'Password Set',     value: counts['active'],     color: 'text-emerald-600' },
          { label: 'OTP Issued',       value: counts['otp-pending'],color: 'text-amber-600' },
          { label: 'Never Onboarded',  value: noAccount,            color: 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or reg number…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Password set</option>
          <option value="otp-pending">OTP issued</option>
          <option value="no-access">No access</option>
        </select>
        <button
          onClick={() => navigate('/otp-manager')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <MdKey size={16} />
          Generate OTP
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MdPerson size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Portal Accounts</h3>
          </div>
          <span className="text-sm text-gray-500">{filtered.length} account{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
            <p className="text-sm text-gray-500">Loading portal accounts…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            {search || statusFilter !== 'all' ? 'No accounts match your filter.' : 'No portal accounts found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Student</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Reg No</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Class</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Portal Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const st = STATUS[a.status]
                  const Icon = st.icon
                  const s = a.student
                  return (
                    <tr key={a.docId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-6 font-medium text-gray-900">{s?.name || s?.fullName || '—'}</td>
                      <td className="py-3 px-4 text-gray-500 font-mono text-xs">{s?.reg_number || a.studentId}</td>
                      <td className="py-3 px-4">
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">{s?.class || '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>
                          <Icon className="text-sm" />
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {a.status !== 'active' && (
                          <button
                            onClick={() => navigate('/otp-manager', { state: { regNumber: s?.reg_number || '' } })}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                          >
                            Generate OTP →
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {noAccount > 0 && !loading && (
          <div className="px-6 py-3 border-t border-gray-100 bg-red-50 flex items-center justify-between">
            <p className="text-xs text-red-600 font-medium">
              {noAccount} student{noAccount !== 1 ? 's have' : ' has'} never been issued portal access.
            </p>
            <button
              onClick={() => navigate('/otp-manager')}
              className="text-xs text-red-600 hover:text-red-800 font-semibold transition"
            >
              Go to OTP Manager →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
