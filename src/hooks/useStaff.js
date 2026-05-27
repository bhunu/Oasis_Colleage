import { useState, useCallback } from 'react'

const STORAGE_KEY = 'oasis_staff'

const SAMPLE_STAFF = [
  {
    id: '1',
    name: 'Mr. T. Chikomo',
    title: 'Principal',
    department: 'Leadership',
    qualification: 'B.Ed, M.Ed in Educational Leadership (University of Zimbabwe)',
    description: 'A visionary leader with over 20 years in Zimbabwean education. Mr. Chikomo has guided Oasis to national recognition through unwavering commitment to academic excellence and community development.',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
    order: 1,
    featured: true,
    dateAdded: '2024-01-01',
  },
  {
    id: '2',
    name: 'Mrs. R. Maposa',
    title: 'Deputy Principal',
    department: 'Leadership',
    qualification: 'B.Ed (PGCE), Diploma in Educational Management (Bindura University)',
    description: 'Mrs. Maposa oversees pastoral care and student welfare with unmatched dedication. A Cambridge-trained educator, she has been integral to Oasis since its founding in 2012.',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
    order: 2,
    featured: true,
    dateAdded: '2024-01-01',
  },
  {
    id: '3',
    name: 'Mr. S. Dube',
    title: 'Head of Academics',
    department: 'Leadership',
    qualification: 'B.Sc, PGCE, M.Ed Curriculum Development (University of Zimbabwe)',
    description: 'Mr. Dube drives the school\'s academic strategy and curriculum excellence. Under his leadership, O-Level and A-Level results have improved consecutively for four years.',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    order: 3,
    featured: true,
    dateAdded: '2024-01-01',
  },
  {
    id: '4',
    name: 'Mrs. F. Mutasa',
    title: 'Head of Sciences',
    department: 'Sciences',
    qualification: 'B.Sc Chemistry Hons, PGCE (Midlands State University)',
    description: 'Mrs. Mutasa leads the Science department with passion and precision. Her students consistently achieve top marks in Chemistry and Biology at both O and A Level.',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
    order: 4,
    featured: false,
    dateAdded: '2024-01-01',
  },
  {
    id: '5',
    name: 'Mr. K. Banda',
    title: 'Head of Mathematics',
    department: 'Mathematics',
    qualification: 'B.Sc Mathematics Hons, PGCE (Great Zimbabwe University)',
    description: 'Mr. Banda brings mathematics to life through innovative teaching. Known for making complex concepts accessible, his students hold some of the school\'s highest pass rates.',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    order: 5,
    featured: false,
    dateAdded: '2024-01-01',
  },
  {
    id: '6',
    name: 'Mrs. P. Chirwa',
    title: 'Head of English & Literature',
    department: 'Humanities',
    qualification: 'B.A English Literature, PGCE (University of Zimbabwe)',
    description: 'An award-winning educator, Mrs. Chirwa has nurtured Zimbabwe\'s next generation of writers, debaters, and communicators through her love of the written word.',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    order: 6,
    featured: false,
    dateAdded: '2024-01-01',
  },
  {
    id: '7',
    name: 'Mr. L. Moyo',
    title: 'Head of Physical Education',
    department: 'Sports',
    qualification: 'B.Sc Sports Science, Coaching Certificate (Zimbabwe Sports Commission)',
    description: 'Mr. Moyo has transformed Oasis\'s sports programme into a competitive powerhouse. Under his coaching, football and athletics teams have earned multiple district titles.',
    photo: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&q=80',
    order: 7,
    featured: false,
    dateAdded: '2024-01-01',
  },
  {
    id: '8',
    name: 'Mrs. G. Ncube',
    title: 'Head of Arts & Culture',
    department: 'Arts',
    qualification: 'B.A Fine Art, Diploma in Cultural Studies (National Arts Council of Zimbabwe)',
    description: 'Mrs. Ncube is the creative heartbeat of Oasis. From Drama Festival to Cultural Day, she champions every student\'s artistic expression and has built a thriving arts programme.',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    order: 8,
    featured: false,
    dateAdded: '2024-01-01',
  },
]

function loadStaff() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_STAFF))
    return SAMPLE_STAFF
  } catch {
    return SAMPLE_STAFF
  }
}

function persist(staff) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(staff)) } catch {}
}

export function useStaff() {
  const [staff, setStaff] = useState(loadStaff)

  const addStaff = useCallback((member) => {
    const m = {
      ...member,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString().split('T')[0],
    }
    setStaff(prev => { const next = [...prev, m]; persist(next); return next })
    return m
  }, [])

  const updateStaff = useCallback((id, updates) => {
    setStaff(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...updates } : m)
      persist(next); return next
    })
  }, [])

  const deleteStaff = useCallback((id) => {
    setStaff(prev => { const next = prev.filter(m => m.id !== id); persist(next); return next })
  }, [])

  const reorderStaff = useCallback((id, direction) => {
    setStaff(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex(m => m.id === id)
      if (direction === 'up' && idx > 0) {
        const tmp = sorted[idx].order
        sorted[idx] = { ...sorted[idx], order: sorted[idx - 1].order }
        sorted[idx - 1] = { ...sorted[idx - 1], order: tmp }
      } else if (direction === 'down' && idx < sorted.length - 1) {
        const tmp = sorted[idx].order
        sorted[idx] = { ...sorted[idx], order: sorted[idx + 1].order }
        sorted[idx + 1] = { ...sorted[idx + 1], order: tmp }
      }
      persist(sorted); return sorted
    })
  }, [])

  const getFeatured = useCallback(() => {
    return [...staff].filter(m => m.featured).sort((a, b) => a.order - b.order)
  }, [staff])

  const getByDepartment = useCallback((dept) => {
    const sorted = [...staff].sort((a, b) => a.order - b.order)
    return dept === 'All' ? sorted : sorted.filter(m => m.department === dept)
  }, [staff])

  return { staff, addStaff, updateStaff, deleteStaff, reorderStaff, getFeatured, getByDepartment }
}
