import { useEffect, useState, useRef } from 'react'
import { MdAdd, MdEdit, MdDelete, MdClose, MdPeople, MdPhotoCamera } from 'react-icons/md'
import toast from 'react-hot-toast'
import { getAdminStaff, addAdminStaff, updateAdminStaff, deleteAdminStaff, uploadStaffPhoto } from '../../firebase/staffAdmin'

const BLANK = { name: '', title: '', department: '', email: '', phone: '', qualification: '', description: '', featured: false }
const DEPARTMENTS = ['Leadership', 'Sciences', 'Humanities', 'Mathematics', 'Commerce', 'Languages', 'Arts', 'Sports', 'Support Staff']

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gold/50 font-montserrat'
const labelCls = 'text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1'

export default function AdminStaff() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileRef = useRef()

  const load = () => getAdminStaff().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(BLANK); setPhotoFile(null); setPhotoPreview(null); setOpen(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name:          item.name          ?? '',
      title:         item.title         ?? '',
      department:    item.department    ?? '',
      email:         item.email         ?? '',
      phone:         item.phone         ?? '',
      qualification: item.qualification ?? '',
      description:   item.description   ?? item.bio ?? '',
      featured:      item.featured      ?? false,
    })
    setPhotoFile(null); setPhotoPreview(item.photoUrl ?? null); setOpen(true)
  }
  const closePanel = () => { setOpen(false); setEditing(null) }

  const handlePhoto = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    setSaving(true)
    try {
      let photoData = editing
        ? { photoUrl: editing.photoUrl ?? '', photoPath: editing.photoPath ?? '' }
        : { photoUrl: '', photoPath: '' }
      if (photoFile) {
        const uploaded = await uploadStaffPhoto(photoFile)
        photoData = { photoUrl: uploaded.url, photoPath: uploaded.path }
      }
      const payload = { ...form, ...photoData }
      if (editing) { await updateAdminStaff(editing.id, payload); toast.success('Staff updated') }
      else         { await addAdminStaff(payload);                 toast.success('Staff added')   }
      await load(); closePanel()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (item) => {
    if (!confirm(`Delete ${item.name}?`)) return
    try { await deleteAdminStaff(item.id, item.photoPath); toast.success('Staff removed'); setItems(p => p.filter(i => i.id !== item.id)) }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-gray-500 font-montserrat">{items.length} staff member{items.length !== 1 ? 's' : ''}</p>
        <button onClick={openNew} className="flex items-center gap-2 bg-gold text-navy text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#D4B96A] transition font-montserrat">
          <MdAdd className="text-base" /> Add Staff
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-44 bg-navy-light animate-pulse rounded-xl border border-white/10" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-navy-light rounded-xl border border-white/10 p-16 text-center">
          <MdPeople className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-montserrat">No staff members yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-navy-light rounded-xl border border-white/10 p-4 flex flex-col items-center text-center gap-2">
              {item.photoUrl ? (
                <img src={item.photoUrl} alt={item.name} className="w-16 h-16 rounded-full object-cover border-2 border-gold/30" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-xl font-bold font-playfair">
                  {item.name?.[0] ?? '?'}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-100 font-montserrat">{item.name}</p>
                <p className="text-xs text-gold font-medium font-montserrat">{item.title}</p>
                {item.department && <p className="text-[10px] text-gray-500 mt-0.5 font-montserrat">{item.department}</p>}
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded text-gray-500 hover:bg-white/5   hover:text-gold transition"><MdEdit   className="text-sm" /></button>
                <button onClick={() => handleDelete(item)} className="p-1.5 rounded text-gray-500 hover:bg-red-900/30 hover:text-red-400   transition"><MdDelete className="text-sm" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/60" onClick={closePanel} />
          <div className="w-full max-w-md bg-navy-800 border-l border-white/10 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-sm font-bold text-white font-playfair">{editing ? 'Edit Staff' : 'New Staff Member'}</h2>
              <button onClick={closePanel} className="p-1 rounded text-gray-500 hover:text-gray-200"><MdClose className="text-lg" /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-gold/30" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-2xl font-bold font-playfair">
                      {form.name?.[0] || <MdPeople />}
                    </div>
                  )}
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-gold rounded-full flex items-center justify-center text-navy shadow">
                    <MdPhotoCamera className="text-xs" />
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                <p className="text-[10px] text-gray-500 font-montserrat">Click camera icon to upload photo</p>
              </div>
              <div><label className={labelCls}>Full Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Job Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Department</label>
                <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className={inputCls}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Qualification</label><input value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} className={inputCls} placeholder="e.g. B.Ed, PGCE (University of Zimbabwe)" /></div>
              <div><label className={labelCls}>Bio / Description</label><textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Short bio shown on the public staff page" /></div>
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                <span className="text-sm text-gray-300 font-montserrat">Featured / Leadership</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, featured: !f.featured }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${form.featured ? 'bg-gold' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.featured ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-gold text-navy text-sm font-bold py-3 rounded-lg hover:bg-[#D4B96A] disabled:opacity-60 transition font-montserrat">
                {saving ? 'Saving…' : editing ? 'Update Staff' : 'Add Staff Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
