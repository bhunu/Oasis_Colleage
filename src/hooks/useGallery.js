import { useState, useCallback, useEffect } from 'react'
import { getGallery } from '../firebase/gallery'

function normalise(doc) {
  return {
    ...doc,
    src:      doc.url || doc.src || '',
    category: doc.category || 'general',
    caption:  doc.caption  || doc.name || '',
  }
}

export function useGallery() {
  const [photos, setPhotos]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGallery()
      .then(docs => setPhotos(docs.map(normalise)))
      .catch(err => console.error('Failed to load gallery:', err))
      .finally(() => setLoading(false))
  }, [])

  const getByCategory = useCallback((cat) =>
    cat === 'all' ? photos : photos.filter(p => p.category === cat),
  [photos])

  return { photos, loading, getByCategory }
}
