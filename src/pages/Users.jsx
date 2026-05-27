import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FaUserPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaUsers } from 'react-icons/fa'
import { getUsers, addUser, updateUser, deleteUser } from '../firebase/users'
import PageHero from '../components/PageHero'

const ROLES = ['admin', 'teacher', 'student', 'staff']

const emptyForm = { name: '', email: '', role: 'student' }

export default function Users() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState(emptyForm)
  const [adding, setAdding]     = useState(false)
  const [editId, setEditId]     = useState(null)
  const [editData, setEditData] = useState({})
  const [error, setError]       = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setUsers(await getUsers())
    } catch (e) {
      setError('Failed to load users. Check your Firebase config.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setAdding(true)
    try {
      await addUser(form)
      setForm(emptyForm)
      await load()
    } catch {
      setError('Failed to add user.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return
    try {
      await deleteUser(id)
      setUsers(u => u.filter(x => x.id !== id))
    } catch {
      setError('Failed to delete user.')
    }
  }

  const startEdit = (user) => {
    setEditId(user.id)
    setEditData({ name: user.name, email: user.email, role: user.role })
  }

  const cancelEdit = () => { setEditId(null); setEditData({}) }

  const handleUpdate = async (id) => {
    try {
      await updateUser(id, editData)
      setUsers(u => u.map(x => x.id === id ? { ...x, ...editData } : x))
      cancelEdit()
    } catch {
      setError('Failed to update user.')
    }
  }

  const roleBadge = (role) => {
    const map = {
      admin:   'bg-blue-500/20 text-blue-300 border-blue-500/30',
      teacher: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      student: 'bg-gold/20 text-gold border-gold/30',
      staff:   'bg-purple-500/20 text-purple-300 border-purple-500/30',
    }
    return map[role] ?? 'bg-white/10 text-gray-300 border-white/20'
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <PageHero
        title="User Management"
        subtitle="Manage system users — admins, teachers, and students"
        icon={FaUsers}
      />

      <div className="max-w-5xl mx-auto px-6 py-12">

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-300 font-montserrat text-sm px-5 py-3 rounded-xl flex justify-between items-center">
            {error}
            <button onClick={() => setError('')}><FaTimes /></button>
          </div>
        )}

        {/* Add user form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8"
        >
          <h2 className="font-playfair text-white text-xl font-bold mb-5">Add New User</h2>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="flex-1 bg-white/5 border border-white/10 text-white font-montserrat text-sm placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-gold/50"
            />
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className="flex-1 bg-white/5 border border-white/10 text-white font-montserrat text-sm placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-gold/50"
            />
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="bg-white/5 border border-white/10 text-white font-montserrat text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-gold/50"
            >
              {ROLES.map(r => <option key={r} value={r} className="bg-gray-900">{r}</option>)}
            </select>
            <button
              type="submit"
              disabled={adding}
              className="bg-gold hover:bg-yellow-400 disabled:opacity-60 text-navy font-montserrat font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <FaUserPlus />
              {adding ? 'Adding…' : 'Add User'}
            </button>
          </form>
        </motion.div>

        {/* Users table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-playfair text-white text-xl font-bold">All Users</h2>
            <span className="font-montserrat text-xs text-gray-500">{users.length} total</span>
          </div>

          {loading ? (
            <div className="py-16 text-center font-montserrat text-gray-500 text-sm">Loading users…</div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center font-montserrat text-gray-500 text-sm">No users yet. Add one above.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left font-montserrat text-[10px] uppercase tracking-widest text-gray-500 px-6 py-3">Name</th>
                    <th className="text-left font-montserrat text-[10px] uppercase tracking-widest text-gray-500 px-6 py-3">Email</th>
                    <th className="text-left font-montserrat text-[10px] uppercase tracking-widest text-gray-500 px-6 py-3">Role</th>
                    <th className="text-right font-montserrat text-[10px] uppercase tracking-widest text-gray-500 px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-6 py-4">
                        {editId === user.id ? (
                          <input
                            value={editData.name}
                            onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                            className="bg-white/10 border border-white/20 text-white font-montserrat text-sm rounded-lg px-3 py-1.5 focus:outline-none w-full"
                          />
                        ) : (
                          <span className="font-montserrat text-white text-sm">{user.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editId === user.id ? (
                          <input
                            type="email"
                            value={editData.email}
                            onChange={e => setEditData(d => ({ ...d, email: e.target.value }))}
                            className="bg-white/10 border border-white/20 text-white font-montserrat text-sm rounded-lg px-3 py-1.5 focus:outline-none w-full"
                          />
                        ) : (
                          <span className="font-montserrat text-gray-400 text-sm">{user.email}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editId === user.id ? (
                          <select
                            value={editData.role}
                            onChange={e => setEditData(d => ({ ...d, role: e.target.value }))}
                            className="bg-white/10 border border-white/20 text-white font-montserrat text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                          >
                            {ROLES.map(r => <option key={r} value={r} className="bg-gray-900">{r}</option>)}
                          </select>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-montserrat font-semibold uppercase tracking-wider ${roleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editId === user.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdate(user.id)}
                              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                              title="Save"
                            >
                              <FaCheck className="text-xs" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20 transition-colors"
                              title="Cancel"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(user)}
                              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-gold/20 hover:text-gold transition-colors"
                              title="Edit"
                            >
                              <FaEdit className="text-xs" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
