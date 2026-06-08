import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot, getDocs, query, collection, where, limit } from 'firebase/firestore'
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
  const [isBoarder,      setIsBoarder]      = useState(false)

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

  /* Fetch boardingStatus once regNumber is known */
  useEffect(() => {
    if (!studentData?.regNumber) { setIsBoarder(false); return }
    getDocs(
      query(collection(db, 'students'), where('reg_number', '==', studentData.regNumber), limit(1))
    )
      .then(snap => {
        setIsBoarder(!snap.empty && snap.docs[0].data().boardingStatus === 'boarder')
      })
      .catch(() => setIsBoarder(false))
  }, [studentData?.regNumber])

  const logout = useCallback(() => {
    sessionStorage.removeItem('studentSession')
    sessionStorage.removeItem('studentSessionId')
    setStudentData(null)
    setIsBoarder(false)
  }, [])

  return (
    <StudentContext.Provider value={{ studentData, portalSettings, loading, authLoading: false, logout, isBoarder }}>
      {children}
    </StudentContext.Provider>
  )
}
