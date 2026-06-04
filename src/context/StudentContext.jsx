import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

const StudentContext = createContext(null)
export const useStudent = () => useContext(StudentContext)

const DEFAULT_SETTINGS = {
  sessionTimeoutMinutes: 4,
  otpExpiryHours: 24,
  resultsAccessThreshold: 75,
  currentTerm: 'Term 2',
  currentYear: '2025',
}

export function StudentProvider({ children }) {
  const [studentData,    setStudentData]    = useState(null)
  const [portalSettings, setPortalSettings] = useState(DEFAULT_SETTINGS)
  const [loading,        setLoading]        = useState(true)

  /* portalSettings — real-time; falls back to defaults if auth is unavailable */
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'portalSettings', 'main'),
      snap => { if (snap.exists()) setPortalSettings({ ...DEFAULT_SETTINGS, ...snap.data() }) },
      () => {}
    )
    return unsub
  }, [])

  /* Session-based student auth — reads from sessionStorage set at login */
  useEffect(() => {
    const raw = sessionStorage.getItem('studentSession')
    if (!raw) { setLoading(false); return }

    try {
      const session = JSON.parse(raw)
      if (session?.uid && session?.studentId) {
        setStudentData(session)
      }
    } catch {}

    setLoading(false)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('studentSession')
    sessionStorage.removeItem('studentSessionId')
    setStudentData(null)
  }, [])

  return (
    <StudentContext.Provider value={{ studentData, portalSettings, loading, authLoading: false, logout }}>
      {children}
    </StudentContext.Provider>
  )
}
