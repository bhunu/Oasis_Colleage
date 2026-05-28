import { useState, useCallback, useEffect } from 'react'
import { getAdminStaff } from '../firebase/staffAdmin'

function normalise(doc) {
  return {
    ...doc,
    photo:       doc.photoUrl    || doc.photo    || '',
    description: doc.description || doc.bio      || '',
  }
}

export function useStaff() {
  const [staff, setStaff]     = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    getAdminStaff()
      .then(docs => setStaff(docs.map(normalise)))
      .catch(err => console.error('Failed to load staff:', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const getFeatured = useCallback(() =>
    staff.filter(m => m.featured).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
  [staff])

  const getByDepartment = useCallback((dept) => {
    const sorted = [...staff].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    return dept === 'All' ? sorted : sorted.filter(m => m.department === dept)
  }, [staff])

  return { staff, loading, getFeatured, getByDepartment }
}
