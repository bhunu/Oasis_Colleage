import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useTermDates() {
  const [termStartDate, setTermStartDate] = useState('')
  const [termEndDate,   setTermEndDate]   = useState('')
  const [loaded,        setLoaded]        = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'config', 'schoolSettings'))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data()
          setTermStartDate(d.termStartDate || '')
          setTermEndDate(d.termEndDate   || '')
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  return { termStartDate, termEndDate, loaded }
}

export function fmtTermDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getDaysUntilTermEnd(termEndDate) {
  if (!termEndDate) return null
  const end   = new Date(termEndDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
}

export function isTermEnded(termEndDate) {
  if (!termEndDate) return false
  const end   = new Date(termEndDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return today > end
}
