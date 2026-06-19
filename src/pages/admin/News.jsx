import { useEffect, useRef, useState } from 'react'
import { MdAdd, MdEdit, MdDelete, MdClose, MdArticle, MdImage, MdUploadFile } from 'react-icons/md'
import toast from 'react-hot-toast'
import { getNews, addNews, updateNews, deleteNews, uploadNewsImage } from '../../firebase/news'

const BLANK = { title: '', category: 'News', date: '', image: '', imagePath: '', summary: '', content: '' }
const CATEGORIES = ['News', 'Events', 'Achievements', 'Academic', 'Sports', 'Community', 'Announcement']

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gold/50 font-montserrat'
const labelCls = 'text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1'

const CAT_COLORS = {
  News:         'bg-blue-900/40 text-blue-300',
  Events:       'bg-purple-900/40 text-purple-300',
  Achievements: 'bg-yellow-900/40 text-yellow-300',
  Academic:     'bg-teal-900/40 text-teal-300',
  Sports:       'bg-green-900/40 text-green-300',
  Community:    'bg-orange-900/40 text-orange-300',
  Announcement: 'bg-red-900/40 text-red-300',
}

export default function AdminNews() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(BLANK)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(null)
  const fileRef = useRef(null)

  const load = () => getNews().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null); setForm(BLANK)
    setImageFile(null); setImagePreview('')
    setOpen(true)
  }
  const openEdit = (item) => {
    setEditing(item)
    setForm({
      title:     item.title     ?? '',
      category:  item.category  ?? 'News',
      date:      item.date      ?? '',
      image:     item.image     ?? '',
      imagePath: item.imagePath ?? '',
      summary:   item.summary   ?? '',
      content:   item.content   ?? '',
    })
    setImageFile(null)
    setImagePreview(item.image ?? '')
    setOpen(true)
  }
  const closePanel = () => { setOpen(false); setEditing(null); setImageFile(null); setImagePreview('') }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview('')
    setForm(f => ({ ...f, image: '', imagePath: '' }))
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)
    try {
      let payload = { ...form }
      if (imageFile) {
        const { url, path } = await uploadNewsImage(imageFile)
        payload = { ...payload, image: url, imagePath: path }
      }
      if (editing) { await updateNews(editing.id, payload); toast.success('Article updated') }
      else         { await addNews(payload);                 toast.success('Article added')   }
      await load(); closePanel()
    } catch (err) { console.error(err); toast.error('Failed to save article') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, imagePath) => {
    if (confirmingDelete !== id) { setConfirmingDelete(id); return }
    setConfirmingDelete(null)
    try { await deleteNews(id, imagePath); toast.success('Article deleted'); setItems(p => p.filter(i => i.id !== id)) }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-gray-500 font-montserrat">{items.length} article{items.length !== 1 ? 's' : ''}</p>
        <button onClick={openNew} className="flex items-center gap-2 bg-gold text-navy text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#D4B96A] transition font-montserrat">
          <MdAdd className="text-base" /> Add Article
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-navy-light animate-pulse rounded-xl border border-white/10" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-navy-light rounded-xl border border-white/10 p-16 text-center">
          <MdArticle className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-montserrat">No articles yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-navy-light rounded-xl border border-white/10 px-4 py-3 flex items-start gap-4">
              {/* Thumbnail */}
              {item.image ? (
                <img src={item.image} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0 border border-white/10" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <MdImage className="text-gray-600 text-xl" />
                </div>
              )}
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-100 font-montserrat truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {item.category && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium font-montserrat ${CAT_COLORS[item.category] ?? 'bg-white/10 text-gray-300'}`}>
                      {item.category}
                    </span>
                  )}
                  {item.date && <span className="text-[10px] text-gray-500 font-montserrat">{item.date}</span>}
                </div>
                {item.summary && <p className="text-xs text-gray-500 mt-1 line-clamp-1 font-montserrat">{item.summary}</p>}
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(item)} className="p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gold transition"><MdEdit /></button>
                {confirmingDelete === item.id ? (
                  <>
                    <button onClick={() => handleDelete(item.id, item.imagePath)} className="p-2 rounded-lg text-red-400 hover:bg-red-900/30 transition text-xs font-montserrat font-semibold">Delete?</button>
                    <button onClick={() => setConfirmingDelete(null)} className="p-2 rounded-lg text-gray-500 hover:bg-white/5 transition text-xs font-montserrat">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => handleDelete(item.id, item.imagePath)} className="p-2 rounded-lg text-gray-500 hover:bg-red-900/30 hover:text-red-400 transition"><MdDelete /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over */}
      {open && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/60" onClick={closePanel} />
          <div className="w-full max-w-md bg-navy-800 border-l border-white/10 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-sm font-bold text-white font-playfair">{editing ? 'Edit Article' : 'New Article'}</h2>
              <button onClick={closePanel} className="p-1 rounded text-gray-500 hover:text-gray-200"><MdClose className="text-lg" /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className={labelCls}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="Article headline" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Article Image</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {imagePreview ? (
                  <div className="relative mt-1">
                    <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-white/10" />
                    <button type="button" onClick={clearImage}
                      className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-700 text-white rounded-full p-1 transition">
                      <MdClose className="text-sm" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="mt-1 w-full border border-dashed border-white/20 rounded-lg py-6 flex flex-col items-center gap-2 text-gray-500 hover:border-gold/50 hover:text-gold transition">
                    <MdUploadFile className="text-2xl" />
                    <span className="text-xs font-montserrat">Click to upload image</span>
                  </button>
                )}
                {!imagePreview && (
                  <p className="mt-1 text-[10px] text-gray-600 font-montserrat">JPG, PNG, WebP — max 5 MB</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Summary</label>
                <textarea rows={2} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Short excerpt shown on the news card" />
              </div>

              <div>
                <label className={labelCls}>Full Content</label>
                <textarea rows={7} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Full article body…" />
              </div>

              <button type="submit" disabled={saving}
                className="w-full bg-gold text-navy text-sm font-bold py-3 rounded-lg hover:bg-[#D4B96A] disabled:opacity-60 transition font-montserrat">
                {saving ? 'Saving…' : editing ? 'Update Article' : 'Add Article'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
