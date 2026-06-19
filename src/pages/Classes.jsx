import { useState, useEffect } from 'react'
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, serverTimestamp, query, where, getCountFromServer,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import toast from 'react-hot-toast'
import {
  MdAdd, MdDelete, MdClose, MdClass,
  MdSearch, MdPeople,
} from 'react-icons/md'

const LEVEL_GROUPS = [
  { label: 'Form 1',   prefix: 'Form 1' },
  { label: 'Form 2',   prefix: 'Form 2' },
  { label: 'Form 3',   prefix: 'Form 3' },
  { label: 'Form 4',   prefix: 'Form 4' },
  { label: 'Lower 6',  prefix: 'Lower 6' },
  { label: 'Upper 6',  prefix: 'Upper 6' },
  { label: 'Other',    prefix: null },
]

const LEVEL_COLORS = {
  'Form 1':  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'Form 2':  'bg-purple-500/15 text-purple-400 border-purple-500/25',
  'Form 3':  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'Form 4':  'bg-amber-500/15 text-amber-400 border-amber-500/25',
  'Lower 6': 'bg-pink-500/15 text-pink-400 border-pink-500/25',
  'Upper 6': 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  'Other':   'bg-gray-500/15 text-gray-400 border-gray-500/25',
}

function getLevel(name = '') {
  for (const g of LEVEL_GROUPS) {
    if (g.prefix && name.startsWith(g.prefix)) return g.label
  }
  return 'Other'
}

const sInput = 'w-full bg-white/5 border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl px-4 py-2.5 text-white font-montserrat text-sm placeholder-gray-600 transition-all'
const sLabel = 'block text-[11px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1.5'

export default function Classes() {
  const [classes,   setClasses]   = useState([])
  const [counts,    setCounts]    = useState({})
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [name,      setName]      = useState('')
  const [saving,    setSaving]    = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => { loadClasses() }, [])

  async function loadClasses() {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'classes')))
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.name.localeCompare(b.name))
      setClasses(list)
      loadCounts(list)
    } catch {
      toast.error('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  async function loadCounts(list) {
    const entries = await Promise.all(
      list.map(async cls => {
        try {
          const snap = await getCountFromServer(
            query(collection(db, 'students'), where('class', '==', cls.name))
          )
          return [cls.id, snap.data().count]
        } catch {
          return [cls.id, 0]
        }
      })
    )
    setCounts(Object.fromEntries(entries))
  }

  async function handleAdd(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { toast.error('Enter a class name'); return }
    if (classes.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('A class with that name already exists')
      return
    }
    setSaving(true)
    try {
      const ref = await addDoc(collection(db, 'classes'), {
        name: trimmed,
        createdAt: serverTimestamp(),
      })
      const newClass = { id: ref.id, name: trimmed }
      setClasses(prev => [...prev, newClass].sort((a, b) => a.name.localeCompare(b.name)))
      setCounts(prev => ({ ...prev, [ref.id]: 0 }))
      setName('')
      setShowForm(false)
      toast.success(`Class "${trimmed}" added`)
    } catch {
      toast.error('Failed to add class')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDel) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'classes', confirmDel.id))
      setClasses(prev => prev.filter(c => c.id !== confirmDel.id))
      setCounts(prev => { const n = { ...prev }; delete n[confirmDel.id]; return n })
      toast.success(`Class "${confirmDel.name}" deleted`)
      setConfirmDel(null)
    } catch {
      toast.error('Failed to delete class')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = LEVEL_GROUPS.map(g => ({
    ...g,
    items: filtered.filter(c => getLevel(c.name) === g.label),
  })).filter(g => g.items.length > 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold/15 rounded-lg flex items-center justify-center shrink-0">
            <MdClass className="text-gold" />
          </div>
          <div>
            <h1 className="font-playfair text-2xl font-bold text-white">Classes</h1>
            <p className="text-xs text-gray-500 font-montserrat mt-0.5">
              {classes.length} class{classes.length !== 1 ? 'es' : ''} registered
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
            <input
              type="text"
              placeholder="Search classes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 focus:border-gold/40 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-white font-montserrat text-xs placeholder-gray-600 w-44 transition-all"
            />
          </div>
          <button
            onClick={() => { setShowForm(true); setName('') }}
            className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-montserrat font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition"
          >
            <MdAdd className="text-base" /> Add Class
          </button>
        </div>
      </div>

      {/* Add Class Form */}
      {showForm && (
        <div className="bg-navy-800 border border-gold/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-playfair text-base font-bold text-white">New Class</h2>
              <p className="text-xs text-gray-500 font-montserrat mt-0.5">e.g. Form 3B, Lower 6 Sciences</p>
            </div>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 transition">
              <MdClose className="text-lg" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className={sLabel}>Class Name *</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Form 3B"
                className={sInput}
              />
            </div>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 bg-gold hover:bg-yellow-400 disabled:opacity-50 text-navy font-montserrat font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition shrink-0"
            >
              {saving
                ? <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                : <MdAdd className="text-base" />}
              {saving ? 'Adding…' : 'Add'}
            </button>
          </form>

          {/* Quick-add chips */}
          <div className="mt-4">
            <p className="text-[10px] text-gray-600 font-montserrat uppercase tracking-widest mb-2">Quick add</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Form 1A','Form 1B','Form 1C',
                'Form 2A','Form 2B','Form 2C',
                'Form 3A','Form 3B','Form 3C',
                'Form 4A','Form 4B','Form 4C',
                'Lower 6 Commercials','Lower 6 Arts','Lower 6 Sciences',
                'Upper 6 Commercials','Upper 6 Arts','Upper 6 Sciences',
              ]
                .filter(n => !classes.some(c => c.name === n))
                .map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setName(n)}
                    className="text-[10px] font-montserrat font-semibold px-2.5 py-1 rounded-full border border-white/10 text-gray-400 hover:border-gold/40 hover:text-gold transition"
                  >
                    {n}
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Classes grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <MdClass className="text-4xl text-gray-700 mx-auto" />
          <p className="text-sm text-gray-500 font-montserrat">
            {search ? 'No classes match your search.' : 'No classes added yet. Click "Add Class" to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest font-montserrat mb-3 px-1">
                {group.label} <span className="text-gray-700">· {group.items.length}</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {group.items.map(cls => (
                  <div
                    key={cls.id}
                    className="bg-navy-800 border border-white/10 rounded-xl px-4 py-4 flex flex-col gap-3 group hover:border-white/20 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border font-montserrat ${LEVEL_COLORS[getLevel(cls.name)]}`}>
                        {cls.name}
                      </span>
                      <button
                        onClick={() => setConfirmDel(cls)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <MdDelete className="text-base" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <MdPeople className="text-sm shrink-0" />
                      <span className="text-xs font-montserrat">
                        {counts[cls.id] ?? '…'} student{counts[cls.id] !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-playfair text-lg font-bold text-white mb-2">Delete Class?</h3>
            <p className="text-sm text-gray-400 font-montserrat mb-1">
              You are about to delete <span className="text-white font-semibold">{confirmDel.name}</span>.
            </p>
            {(counts[confirmDel.id] || 0) > 0 && (
              <p className="text-xs text-amber-400 font-montserrat bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
                ⚠ This class has {counts[confirmDel.id]} enrolled student{counts[confirmDel.id] !== 1 ? 's' : ''}. Deleting the class will not remove those students.
              </p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmDel(null)}
                className="flex-1 border border-white/10 text-gray-400 font-montserrat text-xs py-2.5 rounded-xl hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-montserrat font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
