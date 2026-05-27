import { useEffect, useState } from 'react'
import { MdAdd, MdEdit, MdDelete, MdClose, MdArticle } from 'react-icons/md'
import toast from 'react-hot-toast'
import { getNews, addNews, updateNews, deleteNews } from '../../firebase/news'

const BLANK = { title: '', category: '', summary: '', content: '', date: '' }
const CATEGORIES = ['Announcement', 'Academic', 'Sports', 'Events', 'Community', 'General']

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/50 font-montserrat'
const labelCls = 'text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1'

export default function AdminNews() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)

  const load = () => getNews().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(BLANK); setOpen(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({ title: item.title ?? '', category: item.category ?? '', summary: item.summary ?? '', content: item.content ?? '', date: item.date ?? '' })
    setOpen(true)
  }
  const closePanel = () => { setOpen(false); setEditing(null) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)
    try {
      if (editing) { await updateNews(editing.id, form); toast.success('Article updated') }
      else         { await addNews(form);                toast.success('Article added')   }
      await load(); closePanel()
    } catch { toast.error('Failed to save article') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this article?')) return
    try { await deleteNews(id); toast.success('Article deleted'); setItems(p => p.filter(i => i.id !== id)) }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-gray-500 font-montserrat">{items.length} article{items.length !== 1 ? 's' : ''}</p>
        <button onClick={openNew} className="flex items-center gap-2 bg-[#C9A84C] text-[#0A1628] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#D4B96A] transition font-montserrat">
          <MdAdd className="text-base" /> Add Article
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-[#132140] animate-pulse rounded-xl border border-white/10" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#132140] rounded-xl border border-white/10 p-16 text-center">
          <MdArticle className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-montserrat">No articles yet. Add your first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-[#132140] rounded-xl border border-white/10 px-5 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-100 font-montserrat truncate">{item.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  {item.category && <span className="text-[10px] bg-[#C9A84C]/10 text-[#C9A84C] px-2 py-0.5 rounded-full font-medium font-montserrat">{item.category}</span>}
                  {item.date     && <span className="text-[10px] text-gray-500 font-montserrat">{item.date}</span>}
                </div>
                {item.summary && <p className="text-xs text-gray-500 mt-1 line-clamp-1 font-montserrat">{item.summary}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(item)} className="p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-[#C9A84C] transition"><MdEdit /></button>
                <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg text-gray-500 hover:bg-red-900/30 hover:text-red-400 transition"><MdDelete /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/60" onClick={closePanel} />
          <div className="w-full max-w-md bg-[#0D1C35] border-l border-white/10 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-sm font-bold text-white font-playfair">{editing ? 'Edit Article' : 'New Article'}</h2>
              <button onClick={closePanel} className="p-1 rounded text-gray-500 hover:text-gray-200"><MdClose className="text-lg" /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className={labelCls}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Summary</label>
                <textarea rows={2} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Content</label>
                <textarea rows={7} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className={`${inputCls} resize-none`} />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-[#C9A84C] text-[#0A1628] text-sm font-bold py-3 rounded-lg hover:bg-[#D4B96A] disabled:opacity-60 transition font-montserrat">
                {saving ? 'Saving…' : editing ? 'Update Article' : 'Add Article'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
