import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaCheck, FaTimes, FaTrash, FaUserCheck, FaUserSlash,
  FaUsers, FaClock, FaFilter,
} from 'react-icons/fa'
import { getUsers, updateUser, deleteUser } from '../../firebase/users'

const ROLE_STYLE = {
  admin:          'bg-blue-500/20 text-blue-300 border-blue-500/30',
  staff:          'bg-purple-500/20 text-purple-300 border-purple-500/30',
  teacher:        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  student:        'bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30',
  'Student Admin':'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'Teacher':      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Bursar':       'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Secretary':    'bg-violet-500/20 text-violet-300 border-violet-500/30',
}

const roleStyle = (role) => ROLE_STYLE[role] ?? 'bg-white/10 text-gray-300 border-white/20'

export default function AdminUsers() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('all')   // 'all' | 'pending' | 'active'
  const [error, setError]     = useState('')
  const [busy, setBusy]       = useState({})       // { [id]: true } while saving

  const load = async () => {
    setLoading(true)
    try {
      setUsers(await getUsers())
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const setActive = async (id, value) => {
    setBusy(b => ({ ...b, [id]: true }))
    try {
      await updateUser(id, { active: value })
      setUsers(u => u.map(x => x.id === id ? { ...x, active: value } : x))
    } catch {
      setError('Failed to update account status.')
    } finally {
      setBusy(b => ({ ...b, [id]: false }))
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    setBusy(b => ({ ...b, [id]: true }))
    try {
      await deleteUser(id)
      setUsers(u => u.filter(x => x.id !== id))
    } catch {
      setError('Failed to delete user.')
    } finally {
      setBusy(b => ({ ...b, [id]: false }))
    }
  }

  const pending  = users.filter(u => !u.active)
  const active   = users.filter(u =>  u.active)
  const displayed = tab === 'pending' ? pending : tab === 'active' ? active : users

  const tabs = [
    { key: 'all',     label: 'All users',    count: users.length },
    { key: 'pending', label: 'Pending',       count: pending.length },
    { key: 'active',  label: 'Active',        count: active.length },
  ]

  return (
    <div className="space-y-5">

      {/* Header stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatPill label="Total Accounts" value={users.length}   icon={FaUsers}     color="text-white" />
        <StatPill label="Pending Activation" value={pending.length} icon={FaClock} color="text-amber-400" />
        <StatPill label="Active Accounts" value={active.length} icon={FaUserCheck} color="text-emerald-400" />
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
                  ? 'text-[#C9A84C] border-[#C9A84C] bg-[#C9A84C]/5'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {t.label}
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                tab === t.key ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-white/10 text-gray-500'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
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
                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center shrink-0">
                            <span className="text-[#C9A84C] text-xs font-bold font-montserrat">
                              {user.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="font-montserrat text-white text-sm">{user.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4 font-montserrat text-gray-400 text-sm">
                        {user.email || user.regNumber || '—'}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-montserrat font-semibold uppercase tracking-wider ${roleStyle(user.role)}`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {user.active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-montserrat font-semibold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-montserrat font-semibold uppercase tracking-wider">
                            <FaClock className="text-[8px]" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
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
        )}
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
