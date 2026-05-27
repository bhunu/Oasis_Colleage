import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaEdit, FaTrash, FaTimes, FaArrowUp, FaArrowDown, FaStar, FaSearch, FaUser } from 'react-icons/fa'
import { DEPARTMENTS, DEPT_STYLES } from '../constants/departments'

const EMPTY_FORM = {
  name: '', title: '', department: 'Leadership', qualification: '',
  description: '', photo: '', order: 99, featured: false,
}

export default function StaffAdminPanel({ staff, addStaff, updateStaff, deleteStaff, reorderStaff, onToast }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDept, setFilterDept] = useState('All')
  const fileRef = useRef()

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, order: staff.length + 1 })
    setPhotoPreview(null)
    setShowForm(true)
  }

  const openEdit = (member) => {
    setEditingId(member.id)
    setForm({
      name: member.name || '',
      title: member.title || '',
      department: member.department || 'Leadership',
      qualification: member.qualification || '',
      description: member.description || '',
      photo: member.photo || '',
      order: member.order || 99,
      featured: member.featured || false,
    })
    setPhotoPreview(member.photo || null)
    setShowForm(true)
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setPhotoPreview(null)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { onToast({ msg: 'Photo too large. Max 5MB.', type: 'error' }); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result)
      setForm(f => ({ ...f, photo: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.title.trim()) return
    if (editingId) {
      updateStaff(editingId, form)
      onToast({ msg: 'Staff member updated successfully.', type: 'success' })
    } else {
      addStaff(form)
      onToast({ msg: 'Staff member added successfully.', type: 'success' })
    }
    closeForm()
  }

  const handleDelete = (id) => {
    const member = staff.find(m => m.id === id)
    deleteStaff(id)
    setDeleteConfirm(null)
    onToast({ msg: `${member?.name || 'Staff member'} removed from directory.`, type: 'success' })
  }

  const handleToggleFeatured = (id) => {
    const member = staff.find(m => m.id === id)
    if (!member) return
    updateStaff(id, { featured: !member.featured })
    onToast({ msg: 'Featured status updated.', type: 'success' })
  }

  const sortedAllIds = [...staff].sort((a, b) => a.order - b.order).map(m => m.id)

  const filteredStaff = staff
    .filter(m => {
      if (filterDept !== 'All' && m.department !== filterDept) return false
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => a.order - b.order)

  const deptCount = new Set(staff.map(m => m.department)).size

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">

      {/* Summary + Add button */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h3 className="font-playfair font-bold text-navy text-xl">Staff Management</h3>
          <p className="text-slate-light text-sm mt-1 font-montserrat">
            {staff.length} staff members · {deptCount} departments · {staff.filter(m => m.featured).length} featured
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-montserrat text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <FaPlus /> Add New Staff Member
        </button>
      </div>

      {/* Add / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="mb-6"
          >
            <div className="bg-cream border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-playfair font-bold text-navy text-lg">
                  {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h4>
                <button onClick={closeForm} className="text-gray-400 hover:text-navy transition-colors">
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Photo + order + featured */}
                <div className="space-y-4">
                  <div>
                    <label className="label-tag text-slate-dark block mb-2">Staff Photo</label>
                    <div className="flex items-center gap-4">
                      <div
                        onClick={() => fileRef.current?.click()}
                        className="w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-gold cursor-pointer transition-colors flex-shrink-0 flex items-center justify-center bg-gray-50"
                      >
                        {photoPreview
                          ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                          : <FaUser className="text-gray-300 text-3xl" />
                        }
                      </div>
                      <div>
                        <button type="button" onClick={() => fileRef.current?.click()}
                          className="text-sm text-gold hover:text-gold-dark font-montserrat font-semibold transition-colors block">
                          {photoPreview ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        <p className="text-xs text-slate-light mt-1">JPG, PNG, WEBP · Max 5MB</p>
                        {photoPreview && (
                          <button type="button" onClick={() => { setPhotoPreview(null); setForm(f => ({ ...f, photo: '' })) }}
                            className="text-xs text-red-400 hover:text-red-600 mt-1 transition-colors">
                            Remove photo
                          </button>
                        )}
                      </div>
                    </div>
                    <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFile} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-tag text-slate-dark block mb-1.5">Display Order</label>
                      <input
                        type="number" min="1" max="999"
                        value={form.order}
                        onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                      />
                    </div>
                    <div>
                      <label className="label-tag text-slate-dark block mb-1.5">Featured</label>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, featured: !f.featured }))}
                        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-montserrat font-semibold transition-all ${
                          form.featured ? 'bg-gold/10 border-gold text-gold' : 'bg-white border-gray-300 text-slate-light'
                        }`}
                      >
                        <FaStar className={form.featured ? 'text-gold' : 'text-gray-300'} />
                        {form.featured ? 'Featured' : 'Not Featured'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Full Name *</label>
                    <input
                      type="text" required placeholder="e.g. Mr. T. Moyo"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                    />
                  </div>
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Title / Role *</label>
                    <input
                      type="text" required placeholder="e.g. Head of Mathematics"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                    />
                  </div>
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Department *</label>
                    <select
                      required value={form.department}
                      onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white"
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Qualification</label>
                    <input
                      type="text" placeholder="e.g. B.Sc Hons, PGCE"
                      value={form.qualification}
                      onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                    />
                  </div>
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Description</label>
                    <textarea
                      rows={3} maxLength={300}
                      placeholder="Brief bio (max 300 characters)"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
                    />
                    <p className="text-xs text-slate-light mt-0.5">{form.description.length}/300</p>
                  </div>
                </div>

                {/* Submit row */}
                <div className="col-span-full flex gap-3">
                  <button type="submit"
                    className="flex-1 bg-gold hover:bg-gold-light text-navy font-montserrat font-bold text-sm py-3 rounded-lg transition-colors shadow-md">
                    {editingId ? 'Save Changes' : 'Add Staff Member'}
                  </button>
                  <button type="button" onClick={closeForm}
                    className="flex-1 border-2 border-gray-200 text-slate hover:text-navy font-montserrat text-sm py-3 rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + dept filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-light text-xs" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['All', ...DEPARTMENTS.filter(d => staff.some(m => m.department === d))].map(d => (
            <button key={d}
              onClick={() => setFilterDept(d)}
              className={`text-xs font-montserrat font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full transition-all ${
                filterDept === d ? 'bg-navy text-white' : 'bg-gray-100 text-slate hover:bg-gray-200'
              }`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Staff list */}
      <div className="space-y-1.5">
        {filteredStaff.length === 0 ? (
          <p className="text-slate-light text-sm text-center py-8">No staff members found.</p>
        ) : (
          filteredStaff.map(member => {
            const deptStyle = DEPT_STYLES[member.department] || { bg: 'bg-gray-500', text: 'text-white' }
            const pos = sortedAllIds.indexOf(member.id)
            return (
              <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
                  {member.photo
                    ? <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    : <FaUser className="text-gray-400 text-xs" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-montserrat font-semibold text-navy text-sm truncate">{member.name}</p>
                  <p className="text-xs text-slate-light truncate">{member.title}</p>
                </div>
                <span className={`hidden md:inline-block ${deptStyle.bg} ${deptStyle.text} text-xs font-montserrat font-semibold px-2 py-0.5 rounded-full flex-shrink-0`}>
                  {member.department}
                </span>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggleFeatured(member.id)}
                    title={member.featured ? 'Remove from featured' : 'Mark as featured'}
                    className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                      member.featured ? 'text-gold bg-gold/10 hover:bg-gold/20' : 'text-gray-300 hover:text-gold hover:bg-gold/10'
                    }`}>
                    <FaStar className="text-xs" />
                  </button>
                  <button onClick={() => reorderStaff(member.id, 'up')} disabled={pos === 0} title="Move up"
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-navy disabled:opacity-25 disabled:cursor-not-allowed rounded hover:bg-gray-200 transition-colors">
                    <FaArrowUp className="text-xs" />
                  </button>
                  <button onClick={() => reorderStaff(member.id, 'down')} disabled={pos === sortedAllIds.length - 1} title="Move down"
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-navy disabled:opacity-25 disabled:cursor-not-allowed rounded hover:bg-gray-200 transition-colors">
                    <FaArrowDown className="text-xs" />
                  </button>
                  <button onClick={() => openEdit(member)} title="Edit"
                    className="w-7 h-7 flex items-center justify-center text-blue-500 hover:text-blue-700 rounded hover:bg-blue-50 transition-colors">
                    <FaEdit className="text-xs" />
                  </button>
                  <button onClick={() => setDeleteConfirm(member.id)} title="Delete"
                    className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors">
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-500 text-xl" />
              </div>
              <h3 className="font-playfair font-bold text-navy text-xl mb-2">Remove Staff Member?</h3>
              <p className="text-slate text-sm mb-1">
                Remove <strong>{staff.find(m => m.id === deleteConfirm)?.name}</strong> from the staff directory?
              </p>
              <p className="text-slate-light text-xs mb-6">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-montserrat font-semibold text-sm py-2.5 rounded-lg transition-colors">
                  Remove
                </button>
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 border-2 border-gray-200 text-slate font-montserrat text-sm py-2.5 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
