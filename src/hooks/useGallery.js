import { useState, useCallback } from 'react'

const STORAGE_KEY = 'oasis_gallery_photos_v3'

const SAMPLE_PHOTOS = [
  { id: '1',  src: '/soccer-team.jpg',       caption: 'Oasis soccer team — a proud tradition of football excellence and sportsmanship.',                                category: 'sports',   date: '2026-04-15' },
  { id: '2',  src: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80', caption: 'Netball squad training hard ahead of the provincial championships — champions in the making!', category: 'sports', date: '2026-03-22' },
  { id: '3',  src: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80', caption: 'Oasis athletes dominate the inter-school athletics championships, bringing home gold medals.', category: 'sports', date: '2026-03-10' },
  { id: '4',  src: 'https://images.unsplash.com/photo-1517971071642-34a2d3ecc9cd?w=800&q=80', caption: 'Form 3 Drama Club performs "Echoes of Tomorrow" — a powerful original play at the Drama Festival.', category: 'cultural', date: '2026-04-20' },
  { id: '5',  src: '/community-cleaning.jpg', caption: 'Oasis students lead a community clean-up drive — building character beyond the classroom.',                       category: 'cultural', date: '2026-03-15' },
  { id: '6',  src: 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=800&q=80', caption: "Traditional dance troupe showcasing Zimbabwe's vibrant Shona cultural heritage at Cultural Day.", category: 'cultural', date: '2026-03-15' },
  { id: '7',  src: '/classroom.jpg',          caption: 'Students engaged in an interactive lesson — our classrooms are spaces for curiosity and critical thinking.',        category: 'academic', date: '2026-04-05' },
  { id: '8',  src: '/computer-lab.jpg',       caption: 'Oasis Computer Laboratory — 40 stations equipped with the latest hardware and high-speed internet access.',        category: 'academic', date: '2026-03-28' },
  { id: '9',  src: '/our-students.jpg',       caption: 'Our students — the heartbeat of Oasis Private College. Knowledge, character, and excellence in every face.', category: 'academic', date: '2026-03-20' },
  { id: '10', src: '/form1s.jpg',             caption: 'Form 1 students begin their journey at Oasis — full of energy, hope, and limitless potential.',                     category: 'events',   date: '2026-01-15' },
  { id: '11', src: '/lower6.jpg',             caption: 'Lower 6 students in focused study — A-Level excellence demands dedication and commitment.',                         category: 'events',   date: '2026-02-20' },
  { id: '12', src: '/oasis-school.jpg',                                                               caption: 'Oasis Private College — our home in Checheche, Chipinge District. Where excellence flows.',                                category: 'general',        date: '2026-01-01' },
  { id: '13', src: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',       caption: 'Annual Inter-School Athletics Championships — Oasis athletes competing at district level for trophies and glory.',          category: 'sports-events',  date: '2026-04-30' },
  { id: '14', src: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',       caption: 'Annual Sports Day 2026 — all four houses compete in track and field events in front of the Oasis community.',             category: 'sports-events',  date: '2026-05-30' },
  { id: '15', src: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',       caption: 'Football inter-house tournament finals — the championship shield is on the line in a packed atmosphere.',                 category: 'sports-events',  date: '2026-06-07' },
]

function loadPhotos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_PHOTOS))
    return SAMPLE_PHOTOS
  } catch {
    return SAMPLE_PHOTOS
  }
}

function persist(photos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(photos)) } catch {}
}

export function useGallery() {
  const [photos, setPhotos] = useState(loadPhotos)

  const addPhoto = useCallback((photo) => {
    const p = { ...photo, id: Date.now().toString(), date: new Date().toISOString().split('T')[0] }
    setPhotos(prev => { const next = [p, ...prev]; persist(next); return next })
    return p
  }, [])

  const updatePhoto = useCallback((id, updates) => {
    setPhotos(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p)
      persist(next); return next
    })
  }, [])

  const deletePhoto = useCallback((id) => {
    setPhotos(prev => { const next = prev.filter(p => p.id !== id); persist(next); return next })
  }, [])

  const getByCategory = useCallback((cat) => {
    return cat === 'all' ? photos : photos.filter(p => p.category === cat)
  }, [photos])

  const resetToSample = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setPhotos(SAMPLE_PHOTOS)
  }, [])

  return { photos, addPhoto, updatePhoto, deletePhoto, getByCategory, resetToSample }
}
