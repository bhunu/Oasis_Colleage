import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, getDocs, query, where, orderBy, doc, deleteDoc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import {
  FaTimes, FaTrash, FaUserCheck, FaUserSlash,
  FaUsers, FaClock, FaFilter, FaUserGraduate, FaKey, FaBan, FaLockOpen,
} from 'react-icons/fa'
import { MdSearch } from 'react-icons/md'
import toast from 'react-hot-toast'
import { getUsers, updateUser, deleteUser } from '../../firebase/users'

const ROLE_STYLE = {
  admin:           'bg-blue-500/20 text-blue-300 border-blue-500/30',
  staff:           'bg-purple-500/20 text-purple-300 border-purple-500/30',
  teacher:         'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  student:         'bg-gold/20 text-gold border-gold/30',
  'Student Admin': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'Bursar':        'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Secretary':     'bg-violet-500/20 text-violet-300 border-violet-500/30',
}
const roleStyle = (role) => ROLE_STYLE[role] ?? 'bg-white/10 text-gray-300 border-white/20'

function portalStatus(student) {
  const u = student.portalUser
  if (student.locked) return 'locked'
  if (!u) return 'none'
  if (u.hasSetupPassword) return 'active'
  if (u.otpCode && !u.otpUsed) {
    const exp = u.otpExpiresAt
    const expDate = exp?.toDate ? exp.toDate() : exp ? new Date(exp) : null
    if (expDate && expDate > new Date()) return 'otp-pending'
  }
  return 'none'
}

const PORTAL_STATUS_STYLE = {
  active:        'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'otp-pending': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  locked:        'bg-red-500/15 text-red-400 border-red-500/30',
  none:          'bg-white/10 text-gray-500 border-white/20',
}
const PORTAL_STATUS_LABEL = {
  active:        'Active',
  'otp-pending': 'OTP Pending',
  locked:        '🔒 Locked',
  none:          'Not Activated',
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users,    setUsers]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('all')
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState({})

  /* Students tab state */
  const [students,        setStudents]        = useState([])
  const [studentsLoaded,  setStudentsLoaded]  = useState(false)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentSearch,   setStudentSearch]   = useState('')
  const [activityModal,   setActivityModal]   = useState(null)

  const loadUsers = async () => {
    setLoading(true)
    try { setUsers(await getUsers()) }
    catch { setError('Failed to load users.') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [])

  const loadStudents = useCallback(async () => {
    if (studentsLoaded) return
    setStudentsLoading(true)
    try {
      const [studSnap, userSnap, lockSnap] = await Promise.all([
        getDocs(query(collection(db, 'students'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'student'))),
        getDocs(query(collection(db, 'loginAttempts'), where('portal', '==', 'student'))),
      ])
      const usersMap = {}
      userSnap.docs.forEach(d => {
        const data = d.data()
        if (data.studentId) usersMap[data.studentId] = { docId: d.id, ref: d.ref, ...data }
      })
      // Build map of reg_number (lowercase) → locked bool
      const now = new Date()
      const lockedMap = {}
      lockSnap.docs.forEach(d => {
        const data = d.data()
        const until = data.lockedUntil?.toDate ? data.lockedUntil.toDate() : data.lockedUntil ? new Date(data.lockedUntil) : null
        if (until && until > now) {
          lockedMap[data.identifier?.toUpperCase()] = true
        }
      })
      setStudents(studSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        portalUser: usersMap[d.id] || null,
        locked: lockedMap[d.data().reg_number?.toUpperCase()] ?? false,
      })))
      setStudentsLoaded(true)
    } catch {
      setError('Failed to load student data.')
    }
    setStudentsLoading(false)
  }, [studentsLoaded])

  const handleUnlock = async (student) => {
    setBusy(b => ({ ...b, [student.id]: true }))
    try {
      const identifier = student.reg_number
      const docId = `student__${identifier.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 80)}`
      await setDoc(doc(db, 'loginAttempts', docId), {
        identifier,
        portal:        'student',
        failedAttempts: 0,
        lockedUntil:   null,
        lastFailedAt:  null,
      }, { merge: true })
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, locked: false } : s))
      toast.success(`${student.fullName || student.reg_number} unlocked`)
    } catch {
      setError('Failed to unlock student.')
    }
    setBusy(b => ({ ...b, [student.id]: false }))
  }

  useEffect(() => {
    if (tab === 'students') loadStudents()
  }, [tab, loadStudents])

  /* Non-student user actions */
  const setActive = async (id, value) => {
    setBusy(b => ({ ...b, [id]: true }))
    try {
      await updateUser(id, { active: value })
      setUsers(u => u.map(x => x.id === id ? { ...x, active: value } : x))
    } catch { setError('Failed to update account status.') }
    finally { setBusy(b => ({ ...b, [id]: false })) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    setBusy(b => ({ ...b, [id]: true }))
    try {
      await deleteUser(id)
      setUsers(u => u.filter(x => x.id !== id))
    } catch { setError('Failed to delete user.') }
    finally { setBusy(b => ({ ...b, [id]: false })) }
  }

  /* Student portal revoke */
  const handleRevokePortal = async (student) => {
    const u = student.portalUser
    if (!u) return
    if (!confirm(`Revoke portal access for ${student.fullName || student.name}?\n\nThey will not be able to log in to the student portal.`)) return
    setBusy(b => ({ ...b, [student.id]: true }))
    try {
      await deleteDoc(doc(db, 'users', u.docId))
      setStudents(prev => prev.map(s =>
        s.id === student.id ? { ...s, portalUser: null } : s
      ))
      toast.success(`Portal access revoked for ${student.fullName || student.name}`)
    } catch {
      setError('Failed to revoke portal access.')
    }
    setBusy(b => ({ ...b, [student.id]: false }))
  }

  const nonStudentUsers = users.filter(u => u.role !== 'student')
  const pending  = nonStudentUsers.filter(u => !u.active)
  const active   = nonStudentUsers.filter(u =>  u.active)
  const displayed = tab === 'pending' ? pending : tab === 'active' ? active : nonStudentUsers

  const tabs = [
    { key: 'all',      label: 'All users',  count: nonStudentUsers.length },
    { key: 'pending',  label: 'Pending',    count: pending.length },
    { key: 'active',   label: 'Active',     count: active.length },
    { key: 'students', label: 'Students',   count: students.length, icon: FaUserGraduate },
  ]

  const filteredStudents = students.filter(s => {
    if (!studentSearch.trim()) return true
    const q = studentSearch.toLowerCase()
    return (
      s.fullName?.toLowerCase().includes(q) ||
      s.reg_number?.toLowerCase().includes(q) ||
      s.class?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">

      {/* Header stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatPill label="Total Accounts"      value={nonStudentUsers.length} icon={FaUsers}     color="text-white" />
        <StatPill label="Pending Activation"  value={pending.length}         icon={FaClock}     color="text-amber-400" />
        <StatPill label="Active Accounts"     value={active.length}          icon={FaUserCheck} color="text-emerald-400" />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-300 font-montserrat text-sm px-5 py-3 rounded-xl flex justify-between items-center"
          >
            {error}
            <button onClick={() => setError('')}><FaTimes /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-0 border-b border-white/10">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-montserrat font-semibold uppercase tracking-wider rounded-t-lg border-b-2 transition-all ${
                tab === t.key
                  ? 'text-gold border-gold bg-gold/5'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {t.icon && <t.icon className="text-[10px]" />}
              {t.label}
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                tab === t.key ? 'bg-gold/20 text-gold' : 'bg-white/10 text-gray-500'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Students tab */}
        {tab === 'students' && (
          studentsLoading ? (
            <div className="py-16 text-center font-montserrat text-gray-500 text-sm">Loading students…</div>
          ) : (
            <div>
              {/* Search */}
              <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3">
                <MdSearch className="text-gray-500 text-lg shrink-0" />
                <input
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="262681, name, or class…"
                  className="flex-1 bg-transparent text-white font-montserrat text-sm outline-none placeholder-gray-600"
                />
              </div>

              {filteredStudents.length === 0 ? (
                <div className="py-16 text-center font-montserrat text-gray-500 text-sm">
                  {studentSearch ? 'No students match your search.' : 'No students enrolled yet.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <Th>Reg No</Th>
                        <Th>Name</Th>
                        <Th>Class</Th>
                        <Th>Portal Status</Th>
                        <Th align="right">Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, i) => {
                        const status = portalStatus(student)
                        return (
                          <motion.tr
                            key={student.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                          >
                            <td className="px-5 py-4 font-mono text-xs text-gold">
                              {student.reg_number || '—'}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                                  <span className="text-gold text-[10px] font-bold font-montserrat">
                                    {student.fullName?.charAt(0) || '?'}
                                  </span>
                                </div>
                                <span className="font-montserrat text-white text-sm">{student.fullName || '—'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 font-montserrat text-gray-400 text-sm">{student.class || '—'}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-montserrat font-semibold uppercase tracking-wider ${PORTAL_STATUS_STYLE[status]}`}>
                                {PORTAL_STATUS_LABEL[status]}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {status === 'locked' && (
                                  <ActionBtn
                                    onClick={() => handleUnlock(student)}
                                    disabled={busy[student.id]}
                                    title="Unlock portal access"
                                    colorClass="hover:bg-emerald-500/20 hover:text-emerald-400"
                                    icon={<FaLockOpen className="text-xs" />}
                                    highlight
                                  />
                                )}
                                <ActionBtn
                                  onClick={() => navigate('/admin/student-otp', { state: { regNumber: student.reg_number } })}
                                  title="Generate OTP"
                                  colorClass="hover:bg-gold/20 hover:text-gold"
                                  icon={<FaKey className="text-xs" />}
                                />
                                {(status === 'active' || status === 'otp-pending') && (
                                  <ActionBtn
                                    onClick={() => handleRevokePortal(student)}
                                    disabled={busy[student.id]}
                                    title="Revoke portal access"
                                    colorClass="hover:bg-red-500/20 hover:text-red-400"
                                    icon={<FaBan className="text-xs" />}
                                  />
                                )}
                                <ActionBtn
                                  onClick={() => setActivityModal(student)}
                                  title="View portal activity"
                                  colorClass="hover:bg-blue-500/20 hover:text-blue-400"
                                  icon={<FaFilter className="text-xs" />}
                                />
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        )}

        {/* Standard user tabs */}
        {tab !== 'students' && (
          loading ? (
            <div className="py-16 text-center font-montserrat text-gray-500 text-sm">Loading users…</div>
          ) : displayed.length === 0 ? (
            <div className="py-16 text-center font-montserrat text-gray-500 text-sm">
              {tab === 'pending' ? 'No pending accounts.' : tab === 'active' ? 'No active accounts yet.' : 'No users yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <Th>Name</Th>
                    <Th>Email / Credential</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {displayed.map((user, i) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                              <span className="text-gold text-xs font-bold font-montserrat">
                                {user.name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                            <span className="font-montserrat text-white text-sm">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-montserrat text-gray-400 text-sm">
                          {user.email || user.regNumber || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-montserrat font-semibold uppercase tracking-wider ${roleStyle(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {user.active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-montserrat font-semibold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-montserrat font-semibold uppercase tracking-wider">
                              <FaClock className="text-[8px]" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {user.active ? (
                              <ActionBtn
                                onClick={() => setActive(user.id, false)}
                                disabled={busy[user.id]}
                                title="Deactivate account"
                                colorClass="hover:bg-amber-500/20 hover:text-amber-400"
                                icon={<FaUserSlash className="text-xs" />}
                              />
                            ) : (
                              <ActionBtn
                                onClick={() => setActive(user.id, true)}
                                disabled={busy[user.id]}
                                title="Activate account"
                                colorClass="hover:bg-emerald-500/20 hover:text-emerald-400"
                                icon={<FaUserCheck className="text-xs" />}
                                highlight
                              />
                            )}
                            <ActionBtn
                              onClick={() => handleDelete(user.id, user.name)}
                              disabled={busy[user.id]}
                              title="Delete user"
                              colorClass="hover:bg-red-500/20 hover:text-red-400"
                              icon={<FaTrash className="text-xs" />}
                            />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Portal activity modal */}
      {activityModal && (
        <ActivityModal student={activityModal} onClose={() => setActivityModal(null)} />
      )}
    </div>
  )
}

const STATUS_DOT = {
  Pending:  'bg-amber-400',
  Approved: 'bg-emerald-400',
  Rejected: 'bg-red-400',
}

function ActivityModal({ student, onClose }) {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const reg = student.reg_number
    const docId = student.id

    Promise.all([
      // Clearance / transfer applications
      getDocs(query(collection(db, 'clearanceApplications'), where('regNo', '==', reg))),
      // Exeat applications
      getDocs(query(collection(db, 'exeatApplications'), where('regNo', '==', reg))),
      // OTP generations (keyed by Firestore doc ID)
      getDocs(query(collection(db, 'otpLogs'), where('studentId', '==', docId))),
    ]).then(([clearSnap, exeatSnap, otpSnap]) => {
      const entries = []

      clearSnap.docs.forEach(d => {
        const data = d.data()
        const exitLabel = data.exitType === 'Transfer' ? 'Transfer'
          : data.exitType === 'OLevelCompletion' ? 'O Level Completion'
          : data.exitType === 'ALevelCompletion' ? 'A Level Completion'
          : (data.exitType || 'Clearance')
        entries.push({
          id:        d.id,
          action:    `Clearance application — ${exitLabel}`,
          status:    data.status,
          ts:        data.appliedAt,
          dot:       STATUS_DOT[data.status] || 'bg-gray-500',
        })
      })

      exeatSnap.docs.forEach(d => {
        const data = d.data()
        entries.push({
          id:        d.id,
          action:    `Exeat application — to ${data.destination || 'N/A'}`,
          status:    data.status,
          ts:        data.appliedAt,
          dot:       STATUS_DOT[data.status] || 'bg-gray-500',
        })
      })

      otpSnap.docs.forEach(d => {
        const data = d.data()
        entries.push({
          id:        d.id,
          action:    `OTP generated by ${data.generatedBy || 'Admin'}`,
          status:    null,
          ts:        data.generatedAt,
          dot:       'bg-gold',
        })
      })

      // Account setup from portalUser record
      const pu = student.portalUser
      if (pu?.hasSetupPassword && pu?.updatedAt) {
        entries.push({
          id:     'setup',
          action: 'Password set — portal activated',
          status: null,
          ts:     pu.updatedAt,
          dot:    'bg-emerald-400',
        })
      }

      entries.sort((a, b) => {
        const ta = a.ts?.seconds ?? a.ts?.toDate?.()?.getTime?.() / 1000 ?? 0
        const tb = b.ts?.seconds ?? b.ts?.toDate?.()?.getTime?.() / 1000 ?? 0
        return tb - ta
      })

      setLogs(entries)
    }).catch(err => console.error('Activity load error:', err))
      .finally(() => setLoading(false))
  }, [student.id, student.reg_number, student.portalUser])

  const fmtDate = (ts) => {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-navy-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-playfair font-semibold text-white">Portal Activity</h3>
            <p className="text-xs text-gray-500 font-montserrat mt-0.5">{student.fullName} · {student.reg_number}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-gray-500 font-montserrat text-sm text-center py-8">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-gray-500 font-montserrat text-sm text-center py-8">No portal activity logged for this student.</p>
          ) : (
            <ul className="space-y-1">
              {logs.map(l => (
                <li key={l.id} className="flex items-start gap-3 py-2.5 border-b border-white/5">
                  <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${l.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-200 font-montserrat">{l.action}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-gray-500 font-montserrat">{fmtDate(l.ts)}</p>
                      {l.status && (
                        <span className={`text-[9px] font-montserrat font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
                          ${l.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300'
                          : l.status === 'Rejected' ? 'bg-red-500/20 text-red-300'
                          : 'bg-amber-500/20 text-amber-300'}`}>
                          {l.status}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function StatPill({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex items-center gap-4">
      <Icon className={`text-2xl ${color}`} />
      <div>
        <p className="font-montserrat text-[10px] uppercase tracking-widest text-gray-500">{label}</p>
        <p className={`font-playfair text-2xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  )
}

function Th({ children, align = 'left' }) {
  return (
    <th className={`text-${align} font-montserrat text-[10px] uppercase tracking-widest text-gray-500 px-5 py-3`}>
      {children}
    </th>
  )
}

function ActionBtn({ onClick, disabled, title, colorClass, icon, highlight }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all disabled:opacity-40 ${
        highlight
          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
          : `bg-white/5 text-gray-400 ${colorClass}`
      }`}
    >
      {disabled ? <span className="text-xs animate-spin">⟳</span> : icon}
    </button>
  )
}
