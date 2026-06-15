import { useEffect, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { MdDelete, MdPhotoLibrary, MdCloudUpload } from 'react-icons/md'
import toast from 'react-hot-toast'
import { getGallery, uploadPhoto, deletePhoto } from '../../firebase/gallery'

const CATEGORIES = ['general', 'events', 'sports', 'academic', 'cultural', 'sports-events']
const CAT_LABEL  = { general: 'General', events: 'Events', sports: 'Sports', academic: 'Academic', cultural: 'Cultural', 'sports-events': 'Sports Events' }

export default function AdminGallery() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState('general')
  const [caption, setCaption]   = useState('')
  const [filter, setFilter]     = useState('All')
  const [confirmingDelete, setConfirmingDelete] = useState(null)

  const load = () => getGallery().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return
    setUploading(true)
    const tid = toast.loading(`Uploading ${accepted.length} photo${accepted.length > 1 ? 's' : ''}…`)
    try {
      await Promise.all(accepted.map(f => uploadPhoto(f, category, caption)))
      toast.success('Uploaded!', { id: tid })
      setCaption('')
      await load()
    } catch {
      toast.error('Upload failed', { id: tid })
    } finally {
      setUploading(false)
    }
  }, [category, caption])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    disabled: uploading,
  })

  const handleDelete = async (item) => {
    if (confirmingDelete !== item.id) { setConfirmingDelete(item.id); return }
    setConfirmingDelete(null)
    try { await deletePhoto(item.id, item.path); toast.success('Photo deleted'); setItems(p => p.filter(i => i.id !== item.id)) }
    catch { toast.error('Failed to delete') }
  }

  const allTabs  = ['All', ...CATEGORIES]
  const filtered = filter === 'All' ? items : items.filter(i => i.category === filter)

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <div className="bg-[#132140] rounded-xl border border-white/10 p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="text-xs font-semibold text-gray-400 font-montserrat uppercase tracking-wider">Category:</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]/50 font-montserrat"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-400 font-montserrat uppercase tracking-wider block mb-1.5">
            Description <span className="normal-case text-gray-600 font-normal">(optional — applies to all photos in this upload)</span>
          </label>
          <textarea
            rows={2}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="e.g. Students competing at the 2026 Annual Sports Day…"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/50 font-montserrat resize-none"
          />
        </div>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-white/10 hover:border-white/20'
          } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <input {...getInputProps()} />
          <MdCloudUpload className="text-3xl text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-montserrat">
            {uploading ? 'Uploading…' : isDragActive ? 'Drop photos here' : 'Drag & drop photos, or click to select'}
          </p>
          <p className="text-[10px] text-gray-600 mt-1 font-montserrat">JPG, PNG, WEBP · Multiple files allowed</p>
        </div>
      </div>

      {/* Album filter tabs */}
      <div className="flex flex-wrap gap-2">
        {allTabs.map(a => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium font-montserrat transition ${
              filter === a
                ? 'bg-[#C9A84C] text-[#0A1628]'
                : 'bg-[#132140] border border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200'
            }`}
          >
            {a === 'All' ? 'All' : CAT_LABEL[a]}
            <span className="ml-1.5 opacity-60">
              {a === 'All' ? items.length : items.filter(i => i.category === a).length}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => <div key={i} className="aspect-square bg-[#132140] animate-pulse rounded-xl border border-white/10" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#132140] rounded-xl border border-white/10 p-16 text-center">
          <MdPhotoLibrary className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-montserrat">
            {filter === 'All' ? 'No photos yet. Upload some above.' : `No photos in ${filter} album.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
              <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-[#0A1628]/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <p className="text-[#C9A84C] text-[10px] font-medium font-montserrat px-2 text-center leading-tight">{CAT_LABEL[item.category] ?? item.category}</p>
                {confirmingDelete === item.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(item)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-white text-[10px] font-montserrat font-semibold transition"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(null)}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-[10px] font-montserrat transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleDelete(item)} className="p-2 bg-red-900/80 hover:bg-red-700 rounded-full transition">
                    <MdDelete className="text-white text-sm" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
