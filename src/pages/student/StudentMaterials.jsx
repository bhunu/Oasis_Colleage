import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, where, updateDoc, doc, increment } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useStudent } from '../../context/StudentContext'
import {
  MdMenuBook, MdAssignment, MdDownload, MdSearch, MdFilterList,
} from 'react-icons/md'

const GOLD = '#C9A84C'

function fmtDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function typeIcon(fileName = '') {
  const ext = fileName.split('.').pop().toLowerCase()
  if (ext === 'pdf')                            return '📄'
  if (['doc', 'docx'].includes(ext))            return '📝'
  if (['ppt', 'pptx'].includes(ext))            return '📊'
  if (['jpg','jpeg','png','webp'].includes(ext)) return '🖼'
  return '📎'
}

function TypeBadge({ type }) {
  return type === 'notes'
    ? <span className="text-[10px] font-semibold font-montserrat px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">Notes</span>
    : <span className="text-[10px] font-semibold font-montserrat px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">Past Paper</span>
}

function MaterialCard({ item, onDownload }) {
  return (
    <div className="bg-[#0D1C35] border border-white/10 rounded-xl p-5 flex flex-col gap-3 hover:border-white/20 transition">
      {/* Icon + type */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl">{typeIcon(item.fileName)}</span>
        <TypeBadge type={item.type} />
      </div>

      {/* Title */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-white font-montserrat leading-snug mb-1">{item.title}</h3>
        {item.description && (
          <p className="text-xs text-gray-500 font-montserrat line-clamp-2">{item.description}</p>
        )}
      </div>

      {/* Meta */}
      <div className="space-y-1 text-xs text-gray-500 font-montserrat">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shrink-0" />
          <span className="font-medium text-gray-400">{item.subject}</span>
        </div>
        <p>{item.term === 'all' ? 'All Terms' : item.term} · {item.year}</p>
        <p>By {item.uploadedBy} · {fmtDate(item.uploadedAt)}</p>
        {item.fileSize && <p>{fmtSize(item.fileSize)} · {item.downloadCount || 0} downloads</p>}
      </div>

      {/* Download */}
      <a
        href={item.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onDownload(item)}
        className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold font-montserrat transition"
        style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}44` }}
        onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}30` }}
        onMouseLeave={e => { e.currentTarget.style.background = `${GOLD}18` }}
      >
        <MdDownload className="text-base" />
        Download
      </a>
    </div>
  )
}

export default function StudentMaterials() {
  const { studentData, firestoreStudent } = useStudent()
  const studentClass = firestoreStudent?.class || firestoreStudent?.className || studentData?.class || ''

  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [typeFilter,    setTypeFilter]    = useState('all')     // 'all' | 'notes' | 'past_paper'
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [termFilter,    setTermFilter]    = useState('all')

  useEffect(() => {
    setLoading(true)
    // Fetch materials for this student's class + materials shared with all classes
    const fetchAll = async () => {
      try {
        // Two queries: targetClass == 'all' and targetClass == studentClass
        const [allSnap, classSnap] = await Promise.all([
          getDocs(query(collection(db, 'studyMaterials'), where('targetClass', '==', 'all'))),
          studentClass
            ? getDocs(query(collection(db, 'studyMaterials'), where('targetClass', '==', studentClass)))
            : Promise.resolve({ docs: [] }),
        ])

        const seen = new Set()
        const docs = []
        for (const snap of [allSnap, classSnap]) {
          for (const d of snap.docs) {
            if (!seen.has(d.id)) {
              seen.add(d.id)
              docs.push({ id: d.id, ...d.data() })
            }
          }
        }
        docs.sort((a, b) => {
          const at = a.uploadedAt?.toMillis?.() ?? 0
          const bt = b.uploadedAt?.toMillis?.() ?? 0
          return bt - at
        })
        setItems(docs)
      } catch {}
      finally { setLoading(false) }
    }
    fetchAll()
  }, [studentClass])

  async function handleDownload(item) {
    try {
      await updateDoc(doc(db, 'studyMaterials', item.id), { downloadCount: increment(1) })
    } catch {}
  }

  // Unique subjects from loaded items
  const subjects = useMemo(() => {
    const s = [...new Set(items.map(i => i.subject).filter(Boolean))].sort()
    return s
  }, [items])

  // Apply filters
  const filtered = useMemo(() => {
    return items.filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter)       return false
      if (subjectFilter !== 'all' && item.subject !== subjectFilter) return false
      if (termFilter !== 'all' && item.term !== 'all' && item.term !== termFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!item.title?.toLowerCase().includes(q) &&
            !item.subject?.toLowerCase().includes(q) &&
            !item.description?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [items, typeFilter, subjectFilter, termFilter, search])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C]/20 border-t-[#C9A84C] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-playfair">Study Materials</h1>
        <p className="text-sm text-gray-500 font-montserrat mt-0.5">
          Notes and past exam papers from your teachers
          {studentClass && <span className="text-[#C9A84C]"> · {studentClass}</span>}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#0D1C35] border border-white/10 rounded-xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or subject…"
            className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm font-montserrat outline-none focus:border-[#C9A84C]/40 placeholder-gray-700"
          />
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 items-center">
          <MdFilterList className="text-gray-600 text-lg" />

          {/* Type */}
          {[['all', 'All Types'], ['notes', 'Notes'], ['past_paper', 'Past Papers']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTypeFilter(v)}
              className={`px-3 py-1 rounded-full text-xs font-medium font-montserrat transition ${
                typeFilter === v ? 'text-[#0A1628]' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              style={typeFilter === v ? { background: GOLD } : {}}
            >
              {l}
            </button>
          ))}

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Subject */}
          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-full text-xs font-montserrat text-gray-400 px-3 py-1 outline-none"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Term */}
          <select
            value={termFilter}
            onChange={e => setTermFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-full text-xs font-montserrat text-gray-400 px-3 py-1 outline-none"
          >
            <option value="all">All Terms</option>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 font-montserrat">
        {filtered.length} material{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <MdMenuBook className="text-6xl text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-montserrat text-sm">
            {items.length === 0
              ? 'No study materials have been uploaded yet.'
              : 'No materials match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <MaterialCard key={item.id} item={item} onDownload={handleDownload} />
          ))}
        </div>
      )}
    </div>
  )
}
