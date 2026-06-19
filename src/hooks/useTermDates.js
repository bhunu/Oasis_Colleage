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

  const hasDates = loaded && !!(termStartDate && termEndDate)
  return { termStartDate, termEndDate, loaded, hasDates }
}

function parseLocalDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`)
}

export function fmtTermDate(dateStr) {
  const d = parseLocalDate(dateStr)
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getDaysUntilTermEnd(termEndDate) {
  const end = parseLocalDate(termEndDate)
  if (!end) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
}

export function isTermEnded(termEndDate) {
  if (!termEndDate) return false
  const end   = parseLocalDate(termEndDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return today > end
}
