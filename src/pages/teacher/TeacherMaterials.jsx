import { useState, useEffect, useRef } from 'react'
import {
  collection, addDoc, getDocs, deleteDoc, doc, query,
  where, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import {
  MdUpload, MdDelete, MdMenuBook, MdAssignment, MdInsertDriveFile,
  MdDownload, MdClose, MdCheckCircle, MdWarning,
} from 'react-icons/md'
import toast from 'react-hot-toast'

const VIOLET = '#7C3AED'
const CARD   = 'bg-navy-800 border border-white/10 rounded-xl'
const TERMS  = ['Term 1', 'Term 2', 'Term 3']
const TYPES  = [
  { value: 'notes',      label: 'Notes',           icon: MdMenuBook,   color: 'text-violet-400' },
  { value: 'past_paper', label: 'Past Exam Paper',  icon: MdAssignment, color: 'text-amber-400'  },
]

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg', 'image/png', 'image/webp',
]
const MAX_MB = 20

function fmtSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function typeIcon(fileName = '') {
  const ext = fileName.split('.').pop().toLowerCase()
  if (['pdf'].includes(ext))                 return { icon: '📄', color: 'text-red-400' }
  if (['doc', 'docx'].includes(ext))         return { icon: '📝', color: 'text-blue-400' }
  if (['ppt', 'pptx'].includes(ext))         return { icon: '📊', color: 'text-orange-400' }
  if (['jpg','jpeg','png','webp'].includes(ext)) return { icon: '🖼', color: 'text-teal-400' }
  return { icon: '📎', color: 'text-gray-400' }
}

// ── Upload form ───────────────────────────────────────────────────────────────

function UploadForm({ session, classes }) {
  const fileRef  = useRef(null)
  const [form,     setForm]     = useState({ title: '', description: '', type: 'notes', subject: '', targetClass: 'all', term: 'Term 1', year: new Date().getFullYear() })
  const [file,     setFile]     = useState(null)
  const [progress, setProgress] = useState(null)   // 0-100 or null
  const [done,     setDone]     = useState(false)

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error('File type not allowed. Use PDF, Word, PowerPoint, or image.')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum ${MAX_MB} MB.`)
      return
    }
    setFile(f)
    setDone(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file)         return toast.error('Please select a file.')
    if (!form.title.trim()) return toast.error('Title is required.')
    if (!form.subject.trim()) return toast.error('Subject is required.')

    const safeName   = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `studyMaterials/${Date.now()}_${safeName}`
    const storageRef  = ref(storage, storagePath)
    const uploadTask  = uploadBytesResumable(storageRef, file)

    setProgress(0)

    uploadTask.on(
      'state_changed',
      snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      err  => { toast.error(`Upload failed: ${err.message}`); setProgress(null) },
      async () => {
        try {
          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref)
          await addDoc(collection(db, 'studyMaterials'), {
            ...form,
            year:          Number(form.year),
            fileUrl,
            fileName:      file.name,
            fileSize:      file.size,
            fileType:      file.type,
            storagePath,
            uploadedBy:    session.name || 'Teacher',
            uploadedByUid: session.uid  || '',
            uploadedAt:    serverTimestamp(),
            downloadCount: 0,
          })
          toast.success('Material uploaded successfully!')
          setFile(null)
          setProgress(null)
          setDone(true)
          setForm(f => ({ ...f, title: '', description: '' }))
          if (fileRef.current) fileRef.current.value = ''
        } catch (err) {
          toast.error(`Save failed: ${err.message}`)
          setProgress(null)
        }
      }
    )
  }

  const uploading = progress !== null && progress < 100

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      {/* Type */}
      <div>
        <label className="text-xs text-gray-400 font-montserrat uppercase tracking-widest mb-2 block">Material Type</label>
        <div className="flex gap-3">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, type: t.value }))}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium font-montserrat transition ${
                form.type === t.value
                  ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                  : 'border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              <t.icon className={`text-base ${form.type === t.value ? t.color : 'text-gray-600'}`} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs text-gray-400 font-montserrat uppercase tracking-widest mb-1.5 block">Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Form 4 Physics Notes – Waves"
          className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-montserrat outline-none focus:border-violet-500/60 placeholder-gray-700"
        />
      </div>

      {/* Subject */}
      <div>
        <label className="text-xs text-gray-400 font-montserrat uppercase tracking-widest mb-1.5 block">Subject *</label>
        <input
          type="text"
          value={form.subject}
          onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          placeholder="e.g. Physics, Mathematics, History"
          className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-montserrat outline-none focus:border-violet-500/60 placeholder-gray-700"
        />
      </div>

      {/* Class + Term + Year */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-400 font-montserrat uppercase tracking-widest mb-1.5 block">Target Class</label>
          <select
            value={form.targetClass}
            onChange={e => setForm(f => ({ ...f, targetClass: e.target.value }))}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-montserrat outline-none focus:border-violet-500/60 appearance-none"
          >
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-montserrat uppercase tracking-widest mb-1.5 block">Term</label>
          <select
            value={form.term}
            onChange={e => setForm(f => ({ ...f, term: e.target.value }))}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-montserrat outline-none focus:border-violet-500/60 appearance-none"
          >
            <option value="all">All Terms</option>
            {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-montserrat uppercase tracking-widest mb-1.5 block">Year</label>
          <input
            type="number"
            value={form.year}
            onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
            min={2020} max={2040}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-montserrat outline-none focus:border-violet-500/60"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs text-gray-400 font-montserrat uppercase tracking-widest mb-1.5 block">Description (optional)</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={2}
          placeholder="Brief description of the material..."
          className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-montserrat outline-none focus:border-violet-500/60 placeholder-gray-700 resize-none"
        />
      </div>

      {/* File picker */}
      <div>
        <label className="text-xs text-gray-400 font-montserrat uppercase tracking-widest mb-1.5 block">File (PDF, Word, PowerPoint, Image — max {MAX_MB} MB)</label>
        <div
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
            file ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/10 hover:border-white/20'
          }`}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">{typeIcon(file.name).icon}</span>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-200 font-montserrat truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-gray-500 font-montserrat">{fmtSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                className="ml-auto text-gray-500 hover:text-red-400 transition"
              >
                <MdClose />
              </button>
            </div>
          ) : (
            <div>
              <MdUpload className="text-3xl text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-montserrat">Click to select file</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp" onChange={handleFile} className="hidden" />
        </div>
      </div>

      {/* Progress */}
      {progress !== null && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 font-montserrat mb-1">
            <span>{progress < 100 ? 'Uploading…' : 'Saving…'}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {done && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-montserrat">
          <MdCheckCircle /> Uploaded! Upload another or switch to "My Uploads" to manage.
        </div>
      )}

      <button
        type="submit"
        disabled={uploading || !file}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold font-montserrat transition ${
          uploading || !file
            ? 'bg-violet-900/20 text-violet-800 cursor-not-allowed'
            : 'bg-violet-600 hover:bg-violet-500 text-white'
        }`}
      >
        <MdUpload className="text-base" />
        {uploading ? `Uploading ${progress}%…` : 'Upload Material'}
      </button>
    </form>
  )
}

// ── My uploads list ──────────────────────────────────────────────────────────

function MyUploads({ session }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (!session.uid) { setLoading(false); return }
    getDocs(query(collection(db, 'studyMaterials'), where('uploadedByUid', '==', session.uid)))
      .then(snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        docs.sort((a, b) => {
          const at = a.uploadedAt?.toMillis?.() ?? 0
          const bt = b.uploadedAt?.toMillis?.() ?? 0
          return bt - at
        })
        setItems(docs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session.uid])

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title}"? Students will lose access to this file.`)) return
    setDeleting(item.id)
    try {
      if (item.storagePath) {
        try { await deleteObject(ref(storage, item.storagePath)) } catch {}
      }
      await deleteDoc(doc(db, 'studyMaterials', item.id))
      setItems(prev => prev.filter(x => x.id !== item.id))
      toast.success('Material deleted.')
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <p className="text-gray-500 text-sm font-montserrat">Loading…</p>
  if (items.length === 0) return (
    <div className="text-center py-16">
      <MdMenuBook className="text-5xl text-gray-700 mx-auto mb-3" />
      <p className="text-gray-500 font-montserrat text-sm">You haven't uploaded any materials yet.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {items.map(item => {
        const { icon } = typeIcon(item.fileName)
        const typeInfo = TYPES.find(t => t.value === item.type)
        return (
          <div key={item.id} className={`${CARD} p-4 flex items-start gap-4`}>
            <span className="text-2xl mt-0.5 shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-sm font-semibold text-white font-montserrat truncate">{item.title}</p>
                <span className={`text-[10px] font-semibold font-montserrat px-1.5 py-0.5 rounded-full ${
                  item.type === 'notes' ? 'bg-violet-500/20 text-violet-300' : 'bg-amber-500/20 text-amber-300'
                }`}>{typeInfo?.label}</span>
              </div>
              <p className="text-xs text-gray-500 font-montserrat">
                {item.subject} · {item.targetClass === 'all' ? 'All Classes' : item.targetClass} · {item.term === 'all' ? 'All Terms' : item.term} {item.year}
              </p>
              {item.description && <p className="text-xs text-gray-600 font-montserrat mt-0.5 truncate">{item.description}</p>}
              <p className="text-[11px] text-gray-600 font-montserrat mt-1">
                {fmtSize(item.fileSize)} · {fmtDate(item.uploadedAt)} · {item.downloadCount || 0} downloads
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition"
                title="Preview"
              >
                <MdDownload className="text-lg" />
              </a>
              <button
                onClick={() => handleDelete(item)}
                disabled={deleting === item.id}
                className="p-2 rounded-lg hover:bg-red-900/20 text-gray-500 hover:text-red-400 transition"
                title="Delete"
              >
                <MdDelete className="text-lg" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TeacherMaterials() {
  const session = JSON.parse(sessionStorage.getItem('teacherSession') || '{}')
  const [tab,     setTab]     = useState('upload')
  const [classes, setClasses] = useState([])

  useEffect(() => {
    if (!session.uid) return
    getDocs(query(collection(db, 'teacherAssignments'), where('uid', '==', session.uid)))
      .then(snap => {
        const cls = [...new Set(snap.docs.map(d => d.data().className).filter(Boolean))]
        setClasses(cls)
      })
      .catch(() => {})
  }, [session.uid])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-playfair">Study Materials</h1>
        <p className="text-sm text-gray-500 font-montserrat mt-0.5">Upload notes and past exam papers for your students</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {[['upload', 'Upload New'], ['my', 'My Uploads']].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`px-5 py-2 rounded-lg text-sm font-medium font-montserrat transition ${
              tab === v ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
            style={tab === v ? { background: VIOLET } : {}}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={CARD + ' p-6'}>
        {tab === 'upload'
          ? <UploadForm session={session} classes={classes} />
          : <MyUploads  session={session} />
        }
      </div>
    </div>
  )
}
