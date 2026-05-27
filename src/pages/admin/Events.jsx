import { useEffect, useState } from 'react'
import { MdAdd, MdEdit, MdDelete, MdClose, MdEvent } from 'react-icons/md'
import toast from 'react-hot-toast'
import { getEvents, addEvent, updateEvent, deleteEvent } from '../../firebase/events'

const BLANK = { title: '', date: '', time: '', location: '', description: '', type: '' }
const TYPES  = ['Academic', 'Sports', 'Cultural', 'Community', 'Holiday', 'Other']

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/50 font-montserrat'
const labelCls = 'text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1'

function EventCard({ item, onEdit, onDelete }) {
  const d = item.date ? new Date(item.date + 'T00:00') : null
  return (
    <div className="bg-[#132140] rounded-xl border border-white/10 p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        {d && (
          <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-lg flex flex-col items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-[#C9A84C] uppercase leading-none font-montserrat">
              {d.toLocaleString('default', { month: 'short' })}
            </span>
            <span className="text-sm font-bold text-[#C9A84C] leading-none font-playfair">{d.getDate()}</span>
          </div>
        )}
        <div className="flex gap-1 ml-auto">
          <button onClick={() => onEdit(item)}     className="p-1.5 rounded text-gray-500 hover:bg-white/5   hover:text-[#C9A84C] transition"><MdEdit   className="text-sm" /></button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded text-gray-500 hover:bg-red-900/30 hover:text-red-400   transition"><MdDelete className="text-sm" /></button>
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-100 font-montserrat leading-tight">{item.title}</p>
      {item.location && <p className="text-xs text-gray-500 mt-1 font-montserrat">{item.location}</p>}
      {item.time     && <p className="text-xs text-gray-500 font-montserrat">{item.time}</p>}
      {item.type     && (
        <span className="mt-2 inline-block text-[10px] bg-[#C9A84C]/10 text-[#C9A84C] px-2 py-0.5 rounded-full font-medium font-montserrat">
          {item.type}
        </span>
      )}
    </div>
  )
}

export default function AdminEvents() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)

  const load = () => getEvents().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(BLANK); setOpen(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({ title: item.title ?? '', date: item.date ?? '', time: item.time ?? '', location: item.location ?? '', description: item.description ?? '', type: item.type ?? '' })
    setOpen(true)
  }
  const closePanel = () => { setOpen(false); setEditing(null) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return toast.error('Title and date are required')
    setSaving(true)
    try {
      if (editing) { await updateEvent(editing.id, form); toast.success('Event updated') }
      else         { await addEvent(form);                toast.success('Event added')   }
      await load(); closePanel()
    } catch { toast.error('Failed to save event') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return
    try { await deleteEvent(id); toast.success('Event deleted'); setItems(p => p.filter(i => i.id !== id)) }
    catch { toast.error('Failed to delete') }
  }

  const today    = new Date().toISOString().slice(0, 10)
  const upcoming = items.filter(e => e.date >= today)
  const past     = items.filter(e => e.date <  today)

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-gray-500 font-montserrat">{upcoming.length} upcoming · {past.length} past</p>
        <button onClick={openNew} className="flex items-center gap-2 bg-[#C9A84C] text-[#0A1628] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#D4B96A] transition font-montserrat">
          <MdAdd className="text-base" /> Add Event
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-[#132140] animate-pulse rounded-xl border border-white/10" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#132140] rounded-xl border border-white/10 p-16 text-center">
          <MdEvent className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-montserrat">No events yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-montserrat mb-3">Upcoming</h3>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcoming.map(item => <EventCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-montserrat mb-3">Past</h3>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 opacity-50">
                {past.map(item => <EventCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/60" onClick={closePanel} />
          <div className="w-full max-w-md bg-[#0D1C35] border-l border-white/10 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-sm font-bold text-white font-playfair">{editing ? 'Edit Event' : 'New Event'}</h2>
              <button onClick={closePanel} className="p-1 rounded text-gray-500 hover:text-gray-200"><MdClose className="text-lg" /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className={labelCls}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Time</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                  <option value="">Select type</option>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} resize-none`} />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-[#C9A84C] text-[#0A1628] text-sm font-bold py-3 rounded-lg hover:bg-[#D4B96A] disabled:opacity-60 transition font-montserrat">
                {saving ? 'Saving…' : editing ? 'Update Event' : 'Add Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
