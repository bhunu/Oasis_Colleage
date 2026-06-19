import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, query, orderBy, limit,
  getDocs, doc, setDoc,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { MdShield, MdDownload, MdLockOpen, MdLock } from 'react-icons/md'

/* ── Constants ───────────────────────────────────────────────────────── */
const ACTION_COLORS = {
  BRUTE_FORCE_DETECTED:              'bg-red-500/15 text-red-300 border-red-500/30',
  WRONG_ROLE_ACCESS:                 'bg-red-500/15 text-red-300 border-red-500/30',
  UNAUTHORISED_ROUTE_ACCESS:         'bg-amber-500/15 text-amber-300 border-amber-500/30',
  LOGIN_FAILED:                      'bg-amber-500/15 text-amber-300 border-amber-500/30',
  ACCOUNT_LOCKED:                    'bg-orange-500/15 text-orange-300 border-orange-500/30',
  SESSION_EXPIRED:                   'bg-white/10 text-gray-400 border-white/20',
  CONCURRENT_SESSION_KILLED:         'bg-blue-500/15 text-blue-300 border-blue-500/30',
  BROWSER_CLOSED_SESSION_CLEARED:    'bg-white/10 text-gray-400 border-white/20',
}

const ACTIONS = [
  'ALL',
  'BRUTE_FORCE_DETECTED',
  'WRONG_ROLE_ACCESS',
  'UNAUTHORISED_ROUTE_ACCESS',
  'LOGIN_FAILED',
  'ACCOUNT_LOCKED',
  'SESSION_EXPIRED',
  'CONCURRENT_SESSION_KILLED',
]

const PORTAL_LABELS = {
  'web-admin':        'Web Admin',
  'students-records': 'Students Records',
  'bursar':           'Bursar',
  'student-portal':   'Student Portal',
}

function fmtTs(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function truncate(str, n = 40) {
  if (!str) return '—'
  return str.length > n ? str.slice(0, n) + '…' : str
}

function timeUntil(date) {
  const rem = date - Date.now()
  if (rem <= 0) return 'Expired'
  const m = Math.floor(rem / 60000)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m remaining`
  return `${m}m ${Math.floor((rem % 60000) / 1000)}s remaining`
}

/* ── Main component ──────────────────────────────────────────────────── */
export default function SecurityLogs() {
  const [view, setView] = useState('events') // 'events' | 'locked'

  return (
    <div className="space-y-5">
      {/* Top-level tab switcher */}
      <div className="flex gap-1 bg-navy-800 border border-white/10 rounded-xl p-1 w-fit">
        <TabBtn active={view === 'events'} onClick={() => setView('events')} icon={MdShield} label="Security Events" />
        <TabBtn active={view === 'locked'} onClick={() => setView('locked')} icon={MdLock}   label="Locked Accounts" />
      </div>

      {view === 'events' && <EventsTab />}
      {view === 'locked' && <LockedAccountsTab />}
    </div>
  )
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-montserrat transition-all ${
        active
          ? 'bg-gold/10 text-gold'
          : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      <Icon className="text-base" />
      {label}
    </button>
  )
}

/* ── Security Events tab ─────────────────────────────────────────────── */
function EventsTab() {
  const [logs,         setLogs]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [actionFilter, setActionFilter] = useState('ALL')
  const [search,       setSearch]       = useState('')

  useEffect(() => {
    setLoading(true)
    const q = query(collection(db, 'securityLogs'), orderBy('timestamp', 'desc'), limit(200))
    const unsubscribe = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsubscribe()
  }, [])

  const filtered = logs.filter(l => {
    const matchAction = actionFilter === 'ALL' || l.action === actionFilter
    const matchSearch = !search.trim() || (
      l.uid?.toLowerCase().includes(search.toLowerCase()) ||
      l.identifier?.toLowerCase().includes(search.toLowerCase()) ||
      l.role?.toLowerCase().includes(search.toLowerCase()) ||
      l.url?.toLowerCase().includes(search.toLowerCase())
    )
    return matchAction && matchSearch
  })

  const highRisk = filtered.filter(l =>
    l.action === 'BRUTE_FORCE_DETECTED' || l.action === 'WRONG_ROLE_ACCESS'
  ).length

  const exportCsv = () => {
    const headers = ['Timestamp', 'Action', 'UID', 'Identifier', 'Role', 'Actual Role', 'URL', 'User Agent']
    const rows = filtered.map(l => [
      fmtTs(l.timestamp), l.action ?? '', l.uid ?? '', l.identifier ?? '',
      l.role ?? '', l.actualRole ?? '', l.url ?? '', l.userAgent ?? '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`))
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a    = Object.assign(document.createElement('a'), {
      href:     URL.createObjectURL(blob),
      download: `security-logs-${new Date().toISOString().slice(0, 10)}.csv`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          {highRisk > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-montserrat font-semibold">
              <MdShield className="text-sm" />
              {highRisk} high-risk event{highRisk !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search UID, email, URL…"
            className="bg-white/5 border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl px-3 py-2 text-white font-montserrat text-xs placeholder-gray-600 w-52 transition-all"
          />
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold font-montserrat text-gray-300 border border-white/10 hover:bg-white/5 transition"
          >
            <MdDownload className="text-base" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Action filter tabs */}
      <div className="flex flex-wrap gap-1">
        {ACTIONS.map(a => (
          <button
            key={a}
            onClick={() => setActionFilter(a)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider font-montserrat transition-all ${
              actionFilter === a
                ? 'bg-gold/10 text-gold'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {a === 'ALL' ? 'All' : a.replace(/_/g, ' ').toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-navy-800 border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center font-montserrat text-gray-500 text-sm">Loading security logs…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center font-montserrat text-gray-500 text-sm">
            {search || actionFilter !== 'ALL' ? 'No events match your filter.' : 'No security events recorded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[65vh]">
            <table className="w-full text-xs font-montserrat">
              <thead className="sticky top-0 bg-navy-800 border-b border-white/10">
                <tr>
                  {['Timestamp', 'Action', 'User / ID', 'Attempted Role', 'URL', 'Agent'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const isHighRisk = log.action === 'BRUTE_FORCE_DETECTED' || log.action === 'WRONG_ROLE_ACCESS'
                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${isHighRisk ? 'bg-red-500/[0.04]' : ''}`}
                    >
                      <td className="py-3 px-4 text-gray-400 whitespace-nowrap">{fmtTs(log.timestamp)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-semibold uppercase tracking-wider ${ACTION_COLORS[log.action] ?? 'bg-white/10 text-gray-400 border-white/20'}`}>
                          {log.action?.replace(/_/g, ' ') ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300 max-w-[140px]">
                        <p className="truncate">{log.identifier || log.uid || '—'}</p>
                        {log.actualRole && <p className="text-[9px] text-gray-600 mt-0.5">actual: {log.actualRole}</p>}
                      </td>
                      <td className="py-3 px-4 text-gray-400">{log.role ?? '—'}</td>
                      <td className="py-3 px-4 text-gray-500 max-w-[160px]">
                        <span title={log.url}>{truncate(log.url, 50)}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-[120px]">
                        <span title={log.userAgent}>{truncate(log.userAgent, 30)}</span>
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
        Showing {filtered.length} of {logs.length} events · Real-time updates active
      </p>
    </div>
  )
}

/* ── Locked Accounts tab ─────────────────────────────────────────────── */
function LockedAccountsTab() {
  const [accounts, setAccounts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [unlocking, setUnlocking] = useState({})
  const [, setTick] = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'loginAttempts'))
      const now  = new Date()
      const locked = snap.docs
        .map(d => ({ id: d.id, ref: d.ref, ...d.data() }))
        .filter(r => {
          const until = r.lockedUntil?.toDate ? r.lockedUntil.toDate() : r.lockedUntil ? new Date(r.lockedUntil) : null
          return until && until > now
        })
        .sort((a, b) => {
          const ta = a.lockedUntil?.toDate ? a.lockedUntil.toDate() : new Date(a.lockedUntil)
          const tb = b.lockedUntil?.toDate ? b.lockedUntil.toDate() : new Date(b.lockedUntil)
          return tb - ta
        })
      setAccounts(locked)
    } catch {
      setAccounts([])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Live countdown tick every second
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const handleUnlock = async (account) => {
    setUnlocking(u => ({ ...u, [account.id]: true }))
    try {
      await setDoc(account.ref, {
        failedAttempts: 0,
        lockedUntil:    null,
        lastFailedAt:   null,
      }, { merge: true })
      setAccounts(prev => prev.filter(a => a.id !== account.id))
    } catch {
      // silently fail — reload will fix it
    }
    setUnlocking(u => ({ ...u, [account.id]: false }))
  }

  const handleUnlockAll = async () => {
    if (!confirm(`Unlock all ${accounts.length} locked account${accounts.length !== 1 ? 's' : ''}?`)) return
    for (const account of accounts) await handleUnlock(account)
  }

  if (loading) {
    return (
      <div className="bg-navy-800 border border-white/10 rounded-xl py-16 text-center font-montserrat text-gray-500 text-sm">
        Loading locked accounts…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {accounts.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-montserrat font-semibold">
              <MdLock className="text-sm" />
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} currently locked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-montserrat font-semibold">
              No locked accounts
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-2 rounded-xl text-xs font-semibold font-montserrat text-gray-300 border border-white/10 hover:bg-white/5 transition"
          >
            Refresh
          </button>
          {accounts.length > 1 && (
            <button
              onClick={handleUnlockAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold font-montserrat text-navy transition hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary-hex)' }}
            >
              <MdLockOpen className="text-base" />
              Unlock All
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-navy-800 border border-white/10 rounded-xl overflow-hidden">
        {accounts.length === 0 ? (
          <div className="py-16 text-center font-montserrat text-gray-500 text-sm">
            No accounts are currently locked.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-montserrat">
              <thead className="border-b border-white/10">
                <tr>
                  {['Identifier', 'Portal', 'Failed Attempts', 'Locked Until', 'Time Remaining', 'Action'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map(account => {
                  const until    = account.lockedUntil?.toDate ? account.lockedUntil.toDate() : new Date(account.lockedUntil)
                  const stillLocked = until > new Date()
                  return (
                    <tr key={account.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="text-white font-medium">{account.identifier || '—'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {PORTAL_LABELS[account.portal] ?? account.portal ?? '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-semibold">
                          {account.failedAttempts ?? '—'} attempts
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 whitespace-nowrap">{fmtTs(account.lockedUntil)}</td>
                      <td className="py-3.5 px-4">
                        {stillLocked ? (
                          <span className="text-amber-300 font-medium tabular-nums">{timeUntil(until)}</span>
                        ) : (
                          <span className="text-gray-500">Expired</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleUnlock(account)}
                          disabled={unlocking[account.id]}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold font-montserrat text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 transition disabled:opacity-40"
                        >
                          <MdLockOpen className="text-sm" />
                          {unlocking[account.id] ? 'Unlocking…' : 'Unlock'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-600 font-montserrat">
        Unlocking resets the failed attempt counter immediately. The user can log in again right away.
      </p>
    </div>
  )
}
