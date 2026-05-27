import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHero from '../components/PageHero'
import GalleryCard from '../components/GalleryCard'
import Lightbox from '../components/Lightbox'
import AdminPIN from '../components/AdminPIN'
import Toast from '../components/Toast'
import { useGallery } from '../hooks/useGallery'
import { usePIN } from '../hooks/usePIN'
import { FaPlus, FaEdit, FaTrash, FaTimes, FaImages, FaUpload } from 'react-icons/fa'

const CATEGORIES = ['all', 'sports', 'sports-events', 'cultural', 'academic', 'events', 'general']
const CAT_LABEL = { all: 'All', sports: 'Sports', 'sports-events': 'Sports Events', cultural: 'Cultural', academic: 'Academic', events: 'Events', general: 'General' }

export default function Gallery() {
  const { photos, addPhoto, updatePhoto, deletePhoto, getByCategory } = useGallery()
  const { unlocked } = usePIN()
  const fileRef = useRef()

  const [activeCat, setActiveCat] = useState('all')
  const [lightbox, setLightbox] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toast, setToast] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploadForm, setUploadForm] = useState({ caption: '', category: 'general', src: '' })
  const [editForm, setEditForm] = useState(null)

  const filtered = getByCategory(activeCat)

  const openLightbox = (photo) => setLightbox(photo)
  const lightboxIndex = lightbox ? filtered.findIndex(p => p.id === lightbox.id) : -1
  const lightboxPrev = () => lightboxIndex > 0 && setLightbox(filtered[lightboxIndex - 1])
  const lightboxNext = () => lightboxIndex < filtered.length - 1 && setLightbox(filtered[lightboxIndex + 1])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setToast({ msg: 'File too large. Max 5MB.', type: 'error' }); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target.result)
      setUploadForm(f => ({ ...f, src: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = (e) => {
    e.preventDefault()
    if (!uploadForm.src || !uploadForm.caption) return
    addPhoto(uploadForm)
    setShowUpload(false)
    setUploadForm({ caption: '', category: 'general', src: '' })
    setPreview(null)
    setToast({ msg: 'Photo uploaded successfully!', type: 'success' })
  }

  const closeUpload = () => {
    setShowUpload(false)
    setUploadForm({ caption: '', category: 'general', src: '' })
    setPreview(null)
  }

  const handleEdit = (e) => {
    e.preventDefault()
    updatePhoto(editingPhoto.id, editForm)
    setEditingPhoto(null)
    setToast({ msg: 'Photo updated.', type: 'success' })
  }

  const handleDelete = (id) => {
    deletePhoto(id)
    setDeleteConfirm(null)
    if (lightbox?.id === id) setLightbox(null)
    setToast({ msg: 'Photo deleted.', type: 'success' })
  }

  return (
    <>
      <PageHero
        title="Photo Gallery"
        subtitle="A window into life at Oasis Private College — sport, culture, academics, and events."
        breadcrumb={[{ label: 'Gallery' }]}
        image="https://images.unsplash.com/photo-1517971071642-34a2d3ecc9cd?w=1920&q=80"
      />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <section className="section-padding bg-cream">
        <div className="container-max">

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`font-montserrat text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full transition-all duration-200 ${
                    activeCat === cat
                      ? 'bg-navy text-white shadow-lg'
                      : 'bg-white text-slate hover:bg-gold/10 hover:text-navy border border-gray-200'
                  }`}
                >
                  {CAT_LABEL[cat]} {cat !== 'all' && `(${getByCategory(cat).length})`}
                </button>
              ))}
            </div>
            <AdminPIN />
          </div>

          {/* Admin panel */}
          {unlocked && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-montserrat text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
                >
                  <FaUpload /> Upload Photo
                </button>
                <button
                  onClick={() => setShowAdmin(v => !v)}
                  className="flex items-center gap-2 bg-navy hover:bg-navy-light text-white font-montserrat text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
                >
                  <FaImages /> {showAdmin ? 'Close' : 'Manage Photos'}
                </button>
              </div>

              {/* Manage panel */}
              <AnimatePresence>
                {showAdmin && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
                      <h3 className="font-playfair font-bold text-navy text-lg mb-5">Manage Photos ({photos.length})</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {photos.map(photo => (
                          <div key={photo.id} className="group relative">
                            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                              <img src={photo.src} alt={photo.caption} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-xs text-slate mt-1 line-clamp-2">{photo.caption}</p>
                            <div className="flex gap-1 mt-1">
                              <button onClick={() => { setEditingPhoto(photo); setEditForm({ caption: photo.caption, category: photo.category }) }}
                                className="flex-1 text-xs text-blue-500 hover:text-blue-700 flex items-center justify-center gap-1 py-1 bg-blue-50 rounded transition-colors">
                                <FaEdit className="text-xs" /> Edit
                              </button>
                              <button onClick={() => setDeleteConfirm(photo.id)}
                                className="flex-1 text-xs text-red-400 hover:text-red-600 flex items-center justify-center gap-1 py-1 bg-red-50 rounded transition-colors">
                                <FaTrash className="text-xs" /> Del
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Gallery grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-light">
              <FaImages className="text-5xl mx-auto mb-4 opacity-30" />
              <p>No photos in this category yet.</p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filtered.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <GalleryCard photo={photo} onClick={() => openLightbox(photo)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <Lightbox
        photo={lightbox}
        onClose={() => setLightbox(null)}
        onPrev={lightboxPrev}
        onNext={lightboxNext}
        hasPrev={lightboxIndex > 0}
        hasNext={lightboxIndex < filtered.length - 1}
      />

      {/* Upload photo modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) closeUpload() }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-playfair font-bold text-navy text-xl">Upload New Photo</h3>
                  <p className="text-slate-light text-xs font-montserrat mt-0.5">Recommended: landscape images, max 5MB, JPG/PNG/WEBP</p>
                </div>
                <button onClick={closeUpload} className="text-gray-400 hover:text-navy transition-colors ml-4 flex-shrink-0">
                  <FaTimes className="text-lg" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleUpload} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image picker */}
                <div>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-gold rounded-xl cursor-pointer transition-colors aspect-video flex items-center justify-center overflow-hidden bg-gray-50"
                  >
                    {preview
                      ? <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                      : (
                        <div className="text-center p-6">
                          <FaUpload className="text-gray-400 text-3xl mx-auto mb-2" />
                          <p className="text-gray-400 text-sm font-montserrat">Click to select image</p>
                        </div>
                      )
                    }
                  </div>
                  <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFile} />
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Caption *</label>
                    <textarea
                      rows={4}
                      required
                      maxLength={200}
                      value={uploadForm.caption}
                      onChange={e => setUploadForm(f => ({ ...f, caption: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
                      placeholder="Describe this photo..."
                    />
                    <p className="text-xs text-slate-light mt-1">{uploadForm.caption.length}/200</p>
                  </div>
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Category</label>
                    <select
                      value={uploadForm.category}
                      onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white"
                    >
                      {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={!uploadForm.src || !uploadForm.caption}
                    className="w-full bg-gold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-navy font-montserrat font-bold uppercase tracking-wider text-sm py-3 rounded-lg transition-colors shadow-lg"
                  >
                    Upload Photo
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit photo modal */}
      <AnimatePresence>
        {editingPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-playfair font-bold text-navy text-xl">Edit Photo</h3>
                <button onClick={() => setEditingPhoto(null)} className="text-gray-400 hover:text-navy"><FaTimes /></button>
              </div>
              <img src={editingPhoto.src} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="label-tag text-slate-dark block mb-1.5">Caption</label>
                  <textarea rows={3} maxLength={200} value={editForm?.caption || ''} onChange={e=>setEditForm(f=>({...f,caption:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none" />
                </div>
                <div>
                  <label className="label-tag text-slate-dark block mb-1.5">Category</label>
                  <select value={editForm?.category || 'general'} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white">
                    {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-gold hover:bg-gold-light text-navy font-montserrat font-bold text-sm py-2.5 rounded-lg transition-colors">Save</button>
                  <button type="button" onClick={() => setEditingPhoto(null)} className="flex-1 border-2 border-gray-200 text-slate font-montserrat text-sm py-2.5 rounded-lg transition-colors">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-500 text-xl" />
              </div>
              <h3 className="font-playfair font-bold text-navy text-xl mb-2">Delete Photo?</h3>
              <p className="text-slate text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-montserrat font-semibold text-sm py-2.5 rounded-lg">Delete</button>
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 border-2 border-gray-200 text-slate font-montserrat text-sm py-2.5 rounded-lg">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
