import { useState, useEffect, useRef } from 'react'
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import toast from 'react-hot-toast'
import {
  MdAdd, MdDelete, MdClose, MdBook,
  MdSearch, MdExpandMore,
} from 'react-icons/md'

const CATEGORIES = ['Sciences', 'Humanities', 'Commercial', 'Languages', 'Technical', 'Other']

const O_LEVEL_CLASSES = [
  'Form 1A','Form 1B','Form 1C',
  'Form 2A','Form 2B','Form 2C',
  'Form 3A','Form 3B','Form 3C',
  'Form 4A','Form 4B','Form 4C',
]
const A_LEVEL_CLASSES = [
  'Lower 6 Commercials','Lower 6 Arts','Lower 6 Sciences',
  'Upper 6 Commercials','Upper 6 Arts','Upper 6 Sciences',
]

const CATEGORY_COLORS = {
  Sciences:   'bg-blue-500/15 text-blue-400 border-blue-500/25',
  Humanities: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  Commercial: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Languages:  'bg-pink-500/15 text-pink-400 border-pink-500/25',
  Technical:  'bg-orange-500/15 text-orange-400 border-orange-500/25',
  Other:      'bg-gray-500/15 text-gray-400 border-gray-500/25',
}

const sInput = 'w-full bg-white/5 border border-white/10 focus:border-[#C9A84C]/50 focus:outline-none rounded-xl px-4 py-2.5 text-white font-montserrat text-sm placeholder-gray-600 transition-all'
const sLabel = 'block text-[11px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1.5'

export default function Subjects() {
  const [subjects, setSubjects]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [deleting, setDeleting]   = useState(null)

  const [form, setForm]         = useState({ name: '', code: '', category: '', classes: [] })
  const [saving, setSaving]     = useState(false)
  const [formErr, setFormErr]   = useState({})
  const [showClassDrop, setShowClassDrop] = useState(false)
  const classDropRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (classDropRef.current && !classDropRef.current.contains(e.target))
        setShowClassDrop(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleClass(cls) {
    setForm(f => ({
      ...f,
      classes: f.classes.includes(cls)
        ? f.classes.filter(c => c !== cls)
        : [...f.classes, cls],
    }))
  }

  function toggleGroup(group) {
    const all = group === 'olevel' ? O_LEVEL_CLASSES : A_LEVEL_CLASSES
    const allSelected = all.every(c => form.classes.includes(c))
    setForm(f => ({
      ...f,
      classes: allSelected
        ? f.classes.filter(c => !all.includes(c))
        : [...new Set([...f.classes, ...all])],
    }))
  }

  useEffect(() => { fetchSubjects() }, [])

  async function fetchSubjects() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'subjects'))
      setSubjects(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
      )
    } catch {
      toast.error('Failed to load subjects.')
    } finally {
      setLoading(false)
    }
  }

  function validate() {
    const errs = {}
    if (!form.name.trim())     errs.name     = 'Subject name is required'
    if (!form.category)        errs.category = 'Select a category'
    return errs
  }

  async function handleAdd(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFormErr(errs); return }

    const duplicate = subjects.find(
      s => s.name.toLowerCase() === form.name.trim().toLowerCase()
    )
    if (duplicate) { setFormErr({ name: 'A subject with this name already exists' }); return }

    setSaving(true)
    try {
      const docRef = await addDoc(collection(db, 'subjects'), {
        name:      form.name.trim(),
        code:      form.code.trim().toUpperCase(),
        category:  form.category,
        classes:   form.classes,
        createdAt: serverTimestamp(),
      })
      setSubjects(prev => [...prev, { id: docRef.id, name: form.name.trim(), code: form.code.trim().toUpperCase(), category: form.category, classes: form.classes }]
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
      )
      toast.success(`"${form.name.trim()}" added successfully`)
      setForm({ name: '', code: '', category: '', classes: [] })
      setFormErr({})
      setShowForm(false)
    } catch {
      toast.error('Failed to save subject.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(subject) {
    setDeleting(subject.id)
    try {
      await deleteDoc(doc(db, 'subjects', subject.id))
      setSubjects(prev => prev.filter(s => s.id !== subject.id))
      toast.success(`"${subject.name}" removed`)
    } catch {
      toast.error('Failed to delete subject.')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = subjects.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.code?.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'All' || s.category === catFilter
    return matchSearch && matchCat
  })

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(s => s.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">Subjects</h1>
          <p className="font-montserrat text-xs text-gray-500 mt-0.5">
            {subjects.length} subject{subjects.length !== 1 ? 's' : ''} offered at Oasis Private College
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormErr({}) }}
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1628] font-montserrat text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all"
        >
          <MdAdd className="text-base" />
          Add Subject
        </button>
      </div>

      {/* Add subject form */}
      {showForm && (
        <div className="bg-[#0D1C35] border border-[#C9A84C]/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <MdBook className="text-[#C9A84C]" />
              <h3 className="font-montserrat text-sm font-bold text-white uppercase tracking-wider">New Subject</h3>
            </div>
            <button onClick={() => { setShowForm(false); setFormErr({}) }} className="text-gray-600 hover:text-gray-300 transition-colors">
              <MdClose />
            </button>
          </div>

          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="col-span-1">
                <label className={sLabel}>Subject Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics"
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErr(f => ({ ...f, name: '' })) }}
                  className={sInput}
                  autoFocus
                />
                {formErr.name && <p className="font-montserrat text-[10px] text-red-400 mt-1">{formErr.name}</p>}
              </div>
              <div>
                <label className={sLabel}>Short Code <span className="normal-case text-gray-600">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. MATH"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  className={sInput}
                  maxLength={8}
                />
              </div>
              <div>
                <label className={sLabel}>Category *</label>
                <select
                  value={form.category}
                  onChange={e => { setForm(f => ({ ...f, category: e.target.value })); setFormErr(f => ({ ...f, category: '' })) }}
                  className={sInput}
                >
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0D1C35]">{c}</option>)}
                </select>
                {formErr.category && <p className="font-montserrat text-[10px] text-red-400 mt-1">{formErr.category}</p>}
              </div>
            </div>

            {/* Classes multi-select */}
            <div className="mb-5" ref={classDropRef}>
              <label className={sLabel}>
                Classes <span className="normal-case text-gray-600">(optional — select which classes take this subject)</span>
              </label>

              {/* Trigger */}
              <button
                type="button"
                onClick={() => setShowClassDrop(v => !v)}
                className={`w-full flex items-center justify-between bg-white/5 border ${showClassDrop ? 'border-[#C9A84C]/50' : 'border-white/10 hover:border-white/20'} rounded-xl px-4 py-2.5 text-left transition-all`}
              >
                <span className="font-montserrat text-sm text-gray-400">
                  {form.classes.length === 0
                    ? 'Select classes…'
                    : `${form.classes.length} class${form.classes.length !== 1 ? 'es' : ''} selected`}
                </span>
                <MdExpandMore className={`text-gray-500 text-lg transition-transform ${showClassDrop ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown panel */}
              {showClassDrop && (
                <div className="mt-1 bg-[#0A1628] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 relative">
                  <div className="grid grid-cols-2 divide-x divide-white/5">

                    {/* O Level */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                        <span className="font-montserrat text-[9px] font-bold uppercase tracking-widest text-[#C9A84C]">O Level</span>
                        <button
                          type="button"
                          onClick={() => toggleGroup('olevel')}
                          className="font-montserrat text-[9px] text-gray-500 hover:text-[#C9A84C] transition-colors uppercase tracking-wider"
                        >
                          {O_LEVEL_CLASSES.every(c => form.classes.includes(c)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {O_LEVEL_CLASSES.map(cls => (
                          <label key={cls} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={form.classes.includes(cls)}
                              onChange={() => toggleClass(cls)}
                              className="accent-[#C9A84C] w-3 h-3 rounded"
                            />
                            <span className="font-montserrat text-[11px] text-gray-400 group-hover:text-white transition-colors">{cls}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* A Level */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                        <span className="font-montserrat text-[9px] font-bold uppercase tracking-widest text-blue-400">A Level</span>
                        <button
                          type="button"
                          onClick={() => toggleGroup('alevel')}
                          className="font-montserrat text-[9px] text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-wider"
                        >
                          {A_LEVEL_CLASSES.every(c => form.classes.includes(c)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        {A_LEVEL_CLASSES.map(cls => (
                          <label key={cls} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={form.classes.includes(cls)}
                              onChange={() => toggleClass(cls)}
                              className="accent-[#C9A84C] w-3 h-3 rounded"
                            />
                            <span className="font-montserrat text-[11px] text-gray-400 group-hover:text-white transition-colors">{cls}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected pills */}
              {form.classes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.classes.map(cls => (
                    <span
                      key={cls}
                      className="inline-flex items-center gap-1 bg-[#C9A84C]/10 border border-[#C9A84C]/25 text-[#C9A84C] font-montserrat text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                    >
                      {cls}
                      <button type="button" onClick={() => toggleClass(cls)} className="hover:text-white transition-colors leading-none">
                        <MdClose className="text-xs" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormErr({}); setForm({ name: '', code: '', category: '', classes: [] }) }}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-montserrat text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#C9A84C] hover:bg-yellow-400 disabled:opacity-60 text-[#0A1628] font-montserrat text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all"
              >
                {saving ? 'Saving…' : 'Save Subject'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm" />
          <input
            type="text"
            placeholder="Search subjects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-[#C9A84C]/40 focus:outline-none rounded-xl text-white font-montserrat text-sm placeholder-gray-600 transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`font-montserrat text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                catFilter === cat
                  ? 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/40'
                  : 'bg-white/5 text-gray-500 border-white/10 hover:text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Subject list */}
      <div className="bg-[#0D1C35] border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A84C] mb-3" />
            <p className="font-montserrat text-sm text-gray-500">Loading subjects…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <MdBook className="text-4xl text-gray-700 mx-auto mb-3" />
            <p className="font-montserrat text-sm text-gray-500">
              {search || catFilter !== 'All' ? 'No subjects match your filter.' : 'No subjects added yet.'}
            </p>
            {!search && catFilter === 'All' && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 font-montserrat text-xs text-[#C9A84C] hover:text-yellow-300 transition-colors"
              >
                + Add your first subject
              </button>
            )}
          </div>
        ) : (
          <div>
            {Object.entries(grouped).map(([category, items], gi) => (
              <div key={category}>
                <div className={`px-6 py-2.5 ${gi > 0 ? 'border-t border-white/5' : ''} bg-white/[0.02]`}>
                  <span className={`font-montserrat text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${CATEGORY_COLORS[category]}`}>
                    {category}
                  </span>
                  <span className="font-montserrat text-[10px] text-gray-600 ml-2">{items.length} subject{items.length !== 1 ? 's' : ''}</span>
                </div>
                {items.map((subject, idx) => (
                  <div
                    key={subject.id}
                    className={`flex items-center justify-between px-6 py-3.5 ${idx < items.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/[0.02] transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                        <MdBook className="text-gray-500 text-sm" />
                      </div>
                      <div>
                        <p className="font-montserrat text-sm font-semibold text-white">{subject.name}</p>
                        {subject.code && (
                          <p className="font-mono text-[10px] text-gray-600">{subject.code}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(subject)}
                      disabled={deleting === subject.id}
                      className="text-gray-700 hover:text-red-400 disabled:opacity-40 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                      title="Remove subject"
                    >
                      <MdDelete className="text-base" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
